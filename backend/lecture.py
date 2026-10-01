"""Lecture -> Prerequisites -> Levelled quiz.

Upload lecture slides, pick one of the prerequisites they build on, and
work through 5 levels of 3 multiple-choice questions about it. Every
correct answer earns points (more for harder levels) towards the user's
level in that subject, see :func:`progress.add_points`.

- ``POST /api/lectures``                       slides PDF -> prerequisites
- ``POST /api/lectures/{lecture_id}/quizzes``  5 levels x 3 questions on one prerequisite
- ``POST /api/quizzes/{quiz_id}/questions/{question_id}/answer``  answer one question

State is kept in memory for the demo; swap in a database later.
"""
from __future__ import annotations

import random
import threading
import uuid
from dataclasses import dataclass, field
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

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


class QuizQuestion(BaseModel):
    question_id: int
    question: str
    options: list[str]


class QuizLevel(BaseModel):
    level: int
    name: str
    points_per_question: int
    questions: list[QuizQuestion]


class QuizOut(BaseModel):
    quiz_id: str
    user: str
    subject: str
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


class AnswerResult(BaseModel):
    question_id: int
    level: int
    correct: bool
    your_answer: int
    correct_answer: int
    explanation: str
    points_earned: int
    subject_level: SubjectLevel


@dataclass
class _QuizState:
    user: str
    subject: str
    # (level, question); a question's index in this list is its question_id
    questions: list[tuple[int, Question]]
    answered: set[int] = field(default_factory=set)


# lecture_id -> slide text
_LECTURES: dict[str, str] = {}
# quiz_id -> quiz, including the answers, which the client never sees
_QUIZZES: dict[str, _QuizState] = {}
# Makes answering atomic, so a double tap can't score the same question twice.
_ANSWER_LOCK = threading.Lock()


def _ask(schema: type[BaseModel], system: str, user: str) -> Any:
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    # Long structured answers are occasionally malformed; one retry usually fixes it.
    for _ in range(2):
        try:
            return schema.model_validate(helper.chat_json(messages))
        except ValidationError as exc:
            error = exc
    raise helper.LLMError(f"Model response had the wrong shape: {error}") from error


@router.post("/lectures")
def create_lecture(file: UploadFile = File(...)) -> LectureOut:
    """Upload lecture slides (PDF) and get the prerequisites they build on."""
    material = pdf_utils.summarize_pdf(file.file)
    if not material["text"].strip():
        raise HTTPException(422, "No text found in the PDF. Scanned slides are not supported.")
    analysis = _ask(LectureAnalysis, _PREREQUISITES_PROMPT, f"Lecture slides:\n{material['text']}")
    lecture_id = uuid.uuid4().hex
    _LECTURES[lecture_id] = material["text"]
    return LectureOut(
        lecture_id=lecture_id,
        title=analysis.title,
        page_count=material["page_count"],
        truncated=material["truncated"],
        prerequisites=analysis.prerequisites,
    )


@router.post("/lectures/{lecture_id}/quizzes")
def create_quiz(lecture_id: str, body: QuizRequest) -> QuizOut:
    """Generate 5 levels of 3 multiple-choice questions on the chosen prerequisite."""
    if lecture_id not in _LECTURES:
        raise HTTPException(404, "Lecture not found")
    subject = " ".join(body.prerequisite.split())
    generated = _ask(
        GeneratedQuiz,
        _QUIZ_PROMPT,
        f"Prerequisite topic: {subject}\n\nLecture slides:\n{_LECTURES[lecture_id]}",
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
    _QUIZZES[quiz_id] = _QuizState(user=body.user, subject=subject, questions=questions)
    return QuizOut(
        quiz_id=quiz_id,
        user=body.user,
        subject=subject,
        levels=[
            QuizLevel(
                level=level,
                name=name,
                points_per_question=level * POINTS_PER_LEVEL,
                questions=[
                    QuizQuestion(question_id=i, question=q.question, options=q.options)
                    for i, (q_level, q) in enumerate(questions)
                    if q_level == level
                ],
            )
            for level, (name, _) in LEVELS.items()
        ],
    )


@router.post("/quizzes/{quiz_id}/questions/{question_id}/answer")
def answer_question(quiz_id: str, question_id: int, body: AnswerRequest) -> AnswerResult:
    """Answer one question: see if it was right, and earn subject points if so."""
    quiz = _QUIZZES.get(quiz_id)
    if quiz is None:
        raise HTTPException(404, "Quiz not found")
    if not 0 <= question_id < len(quiz.questions):
        raise HTTPException(404, "Question not found")
    level, q = quiz.questions[question_id]
    correct = body.answer == q.answer_index
    points = level * POINTS_PER_LEVEL if correct else 0
    with _ANSWER_LOCK:
        if question_id in quiz.answered:
            raise HTTPException(409, "Question already answered")
        quiz.answered.add(question_id)
        subject_level = progress.add_points(quiz.user, quiz.subject, points)
    return AnswerResult(
        question_id=question_id,
        level=level,
        correct=correct,
        your_answer=body.answer,
        correct_answer=q.answer_index,
        explanation=q.explanation,
        points_earned=points,
        subject_level=SubjectLevel(**subject_level),
    )
