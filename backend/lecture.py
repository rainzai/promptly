"""Lecture -> Prerequisites -> Levelled quiz.

Upload lecture slides, pick one of the prerequisites they build on, and
work through 5 levels of 3 multiple-choice questions about it. Every
correct answer earns points (more for harder levels) towards the user's
level in that subject, see :func:`progress.add_points`.

- ``POST /api/lectures``                       slides PDF -> prerequisites
- ``GET  /api/lectures/{lecture_id}``          the same, again
- ``POST /api/lectures/{lecture_id}/quizzes``  5 levels x 3 questions on one prerequisite
- ``GET  /api/quizzes/{quiz_id}``              the quiz with the results so far (to resume it)
- ``POST /api/quizzes/{quiz_id}/questions/{question_id}/answer``  answer one question

State is kept in memory for the demo; swap in a database later.
"""
from __future__ import annotations

import random
import threading
import uuid
from dataclasses import dataclass, field

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict, Field, field_validator

import helper
import pdf_utils
import progress

router = APIRouter(prefix="/api", tags=["lecture"])

# level -> (name, what its questions test)
LEVELS = {
    1: ("Recall", "definitions and basic facts"),
    2: ("Understanding", "explaining or interpreting a concept"),
    3: ("Application", "using the concept in a simple, concrete problem"),
    4: ("Analysis", "multi-step problems or comparing related ideas"),
    5: ("Challenge", "combining several ideas or probing common misconceptions"),
}
QUESTIONS_PER_LEVEL = 3
# A correct answer earns level x POINTS_PER_LEVEL points: 10 at level 1 up to 50 at level 5.
POINTS_PER_LEVEL = 10

_PREREQUISITES_PROMPT = """You are a university tutor. You receive the text of a lecture's slides.
List the prerequisite topics a student must already understand to follow this lecture.
Prerequisites are foundations the lecture builds on, not the topics the lecture itself teaches.
Give 3 to 8 specific, non-overlapping prerequisites, most fundamental first.
Write in the language the slides are written in.

Respond with only a JSON object:
{"title": "<short lecture title>", "prerequisites": [{"name": "<topic>", "description": "<one sentence on why this lecture needs it>"}]}"""

_LEVEL_GUIDE = "\n".join(f"{n}. {name}: {focus}." for n, (name, focus) in LEVELS.items())

_QUIZ_PROMPT = f"""You are a university tutor. A student is preparing for a lecture they have not attended yet.
Write multiple-choice questions that test whether they understand the given prerequisite topic,
in {len(LEVELS)} levels of increasing difficulty with exactly {QUESTIONS_PER_LEVEL} questions per level:
{_LEVEL_GUIDE}
Test the prerequisite itself, never the lecture's own content: the student has not learned that yet.
Every question must be answerable by someone who has never seen these slides.
Use the lecture slides only to decide which parts of the prerequisite matter most.
Each question has exactly 4 different options and one correct answer. Do not repeat questions.
Double-check every answer_index: the marked option must be correct and the other three wrong.
Write in the language the slides are written in.

Respond with only a JSON object, with the levels in order from 1 to {len(LEVELS)}:
{{"levels": [{{"level": 1, "questions": [{{"question": "...", "options": ["...", "...", "...", "..."], "answer_index": <0-3>, "explanation": "<why the correct answer is right>"}}]}}]}}"""


class Prerequisite(BaseModel):
    name: str
    description: str


class LectureAnalysis(BaseModel):
    title: str
    prerequisites: list[Prerequisite] = Field(min_length=1)


class Question(BaseModel):
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    answer_index: int = Field(ge=0, le=3)
    explanation: str

    @field_validator("options")
    @classmethod
    def _distinct(cls, options: list[str]) -> list[str]:
        if len({" ".join(o.split()).casefold() for o in options}) != len(options):
            raise ValueError("options must all be different")
        return options


class GeneratedLevel(BaseModel):
    questions: list[Question] = Field(
        min_length=QUESTIONS_PER_LEVEL, max_length=QUESTIONS_PER_LEVEL
    )


class GeneratedQuiz(BaseModel):
    levels: list[GeneratedLevel] = Field(min_length=len(LEVELS), max_length=len(LEVELS))


class LectureOut(BaseModel):
    lecture_id: str
    title: str
    page_count: int
    truncated: bool = Field(..., description="True if only the first part of the slides was used")
    prerequisites: list[Prerequisite]


class QuizRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user: str = Field(..., min_length=1, description="Who takes the quiz; points go to their profile")
    prerequisite: str = Field(..., min_length=1, description="Name of the prerequisite to quiz on")


class QuestionResult(BaseModel):
    your_answer: int
    correct_answer: int
    correct: bool
    explanation: str
    points_earned: int


class QuizQuestion(BaseModel):
    question_id: int
    question: str
    options: list[str]
    result: QuestionResult | None = Field(None, description="Set once the question is answered")


class QuizLevel(BaseModel):
    level: int
    name: str
    points_per_question: int
    questions: list[QuizQuestion]


class QuizOut(BaseModel):
    quiz_id: str
    lecture_id: str
    user: str
    subject: str
    answered: int = Field(..., description="Number of questions answered so far")
    points_earned: int = Field(..., description="Points earned in this quiz so far")
    levels: list[QuizLevel]


class AnswerRequest(BaseModel):
    answer: int = Field(..., ge=0, le=3, description="Index of the chosen option")


class SubjectLevel(BaseModel):
    subject: str
    points: int
    rank: str = Field(..., examples=["Intermediate"])
    next_rank: str | None
    points_to_next: int | None
    ranked_up: bool = Field(..., description="True if this answer reached a new rank")


class AnswerResult(QuestionResult):
    question_id: int
    level: int
    subject_level: SubjectLevel


@dataclass
class _LectureState:
    text: str
    info: LectureOut


@dataclass
class _QuizState:
    lecture_id: str
    user: str
    subject: str
    # (level, question); a question's index in this list is its question_id
    questions: list[tuple[int, Question]]
    # question_id -> chosen option
    answers: dict[int, int] = field(default_factory=dict)


# lecture_id -> slide text and what the upload returned
_LECTURES: dict[str, _LectureState] = {}
# quiz_id -> quiz; a question's correct answer is only revealed once it is answered
_QUIZZES: dict[str, _QuizState] = {}
# Makes answering atomic, so a double tap can't score the same question twice.
_ANSWER_LOCK = threading.Lock()


def _result(level: int, q: Question, chosen: int) -> QuestionResult:
    correct = chosen == q.answer_index
    return QuestionResult(
        your_answer=chosen,
        correct_answer=q.answer_index,
        correct=correct,
        explanation=q.explanation,
        points_earned=level * POINTS_PER_LEVEL if correct else 0,
    )


def _quiz_out(quiz_id: str, quiz: _QuizState) -> QuizOut:
    with _ANSWER_LOCK:
        answers = dict(quiz.answers)
    questions = [
        QuizQuestion(
            question_id=i,
            question=q.question,
            options=q.options,
            result=_result(level, q, answers[i]) if i in answers else None,
        )
        for i, (level, q) in enumerate(quiz.questions)
    ]
    return QuizOut(
        quiz_id=quiz_id,
        lecture_id=quiz.lecture_id,
        user=quiz.user,
        subject=quiz.subject,
        answered=len(answers),
        points_earned=sum(qq.result.points_earned for qq in questions if qq.result),
        levels=[
            QuizLevel(
                level=level,
                name=name,
                points_per_question=level * POINTS_PER_LEVEL,
                questions=[
                    qq for qq, (q_level, _) in zip(questions, quiz.questions) if q_level == level
                ],
            )
            for level, (name, _) in LEVELS.items()
        ],
    )


@router.post("/lectures")
def create_lecture(file: UploadFile = File(...)) -> LectureOut:
    """Upload lecture slides (PDF) and get the prerequisites they build on."""
    material = pdf_utils.summarize_pdf(file.file)
    if not material["text"].strip():
        raise HTTPException(422, "No text found in the PDF. Scanned slides are not supported.")
    analysis = helper.chat_model(
        LectureAnalysis, _PREREQUISITES_PROMPT, f"Lecture slides:\n{material['text']}"
    )
    lecture = LectureOut(
        lecture_id=uuid.uuid4().hex,
        title=analysis.title,
        page_count=material["page_count"],
        truncated=material["truncated"],
        prerequisites=analysis.prerequisites,
    )
    _LECTURES[lecture.lecture_id] = _LectureState(text=material["text"], info=lecture)
    return lecture


@router.get("/lectures/{lecture_id}")
def get_lecture(lecture_id: str) -> LectureOut:
    """The lecture's title and prerequisites, as returned by the upload."""
    lecture = _LECTURES.get(lecture_id)
    if lecture is None:
        raise HTTPException(404, "Lecture not found")
    return lecture.info


@router.post("/lectures/{lecture_id}/quizzes")
def create_quiz(lecture_id: str, body: QuizRequest) -> QuizOut:
    """Generate 5 levels of 3 multiple-choice questions on the chosen prerequisite."""
    lecture = _LECTURES.get(lecture_id)
    if lecture is None:
        raise HTTPException(404, "Lecture not found")
    subject = " ".join(body.prerequisite.split())
    generated = helper.chat_model(
        GeneratedQuiz,
        _QUIZ_PROMPT,
        f"Prerequisite topic: {subject}\n\nLecture slides:\n{lecture.text}",
    )
    questions = []
    for level, generated_level in zip(LEVELS, generated.levels):
        for q in generated_level.questions:
            # Models favour certain answer positions, so shuffle to make them unpredictable.
            correct = q.options[q.answer_index]
            random.shuffle(q.options)
            q.answer_index = q.options.index(correct)
            questions.append((level, q))
    quiz_id = uuid.uuid4().hex
    quiz = _QuizState(lecture_id=lecture_id, user=body.user, subject=subject, questions=questions)
    _QUIZZES[quiz_id] = quiz
    return _quiz_out(quiz_id, quiz)


@router.get("/quizzes/{quiz_id}")
def get_quiz(quiz_id: str) -> QuizOut:
    """The quiz with the results of the questions answered so far, e.g. to resume it."""
    quiz = _QUIZZES.get(quiz_id)
    if quiz is None:
        raise HTTPException(404, "Quiz not found")
    return _quiz_out(quiz_id, quiz)


@router.post("/quizzes/{quiz_id}/questions/{question_id}/answer")
def answer_question(quiz_id: str, question_id: int, body: AnswerRequest) -> AnswerResult:
    """Answer one question: see if it was right, and earn subject points if so."""
    quiz = _QUIZZES.get(quiz_id)
    if quiz is None:
        raise HTTPException(404, "Quiz not found")
    if not 0 <= question_id < len(quiz.questions):
        raise HTTPException(404, "Question not found")
    level, q = quiz.questions[question_id]
    result = _result(level, q, body.answer)
    with _ANSWER_LOCK:
        if question_id in quiz.answers:
            raise HTTPException(409, "Question already answered")
        quiz.answers[question_id] = body.answer
        subject_level = progress.add_points(quiz.user, quiz.subject, result.points_earned)
    return AnswerResult(
        **result.model_dump(),
        question_id=question_id,
        level=level,
        subject_level=SubjectLevel(**subject_level),
    )
