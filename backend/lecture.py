"""Lecture -> Prerequisites -> Quiz.

Upload lecture slides, pick one of the prerequisites they build on, and
answer 5 multiple-choice questions about it.

- ``POST /api/lectures``                      slides PDF -> prerequisites
- ``POST /api/lectures/{lecture_id}/quizzes`` 5 questions on one prerequisite
- ``POST /api/quizzes/{quiz_id}/answers``     grade the answers

State is kept in memory for the demo; swap in a database later.
"""
from __future__ import annotations

import random
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field, ValidationError

import helper
import pdf_utils

router = APIRouter(prefix="/api", tags=["lecture"])

NUM_QUESTIONS = 5

_PREREQUISITES_PROMPT = """You are a university tutor. You receive the text of a lecture's slides.
List the prerequisite topics a student must already understand to follow this lecture.
Prerequisites are foundations the lecture builds on, not the topics the lecture itself teaches.
Give 3 to 8 specific, non-overlapping prerequisites, most fundamental first.
Write in the language the slides are written in.

Respond with only a JSON object:
{"title": "<short lecture title>", "prerequisites": [{"name": "<topic>", "description": "<one sentence on why this lecture needs it>"}]}"""

_QUIZ_PROMPT = f"""You are a university tutor. A student is preparing for a lecture they have not attended yet.
Write exactly {NUM_QUESTIONS} multiple-choice questions that test whether they understand the given prerequisite topic.
Test the prerequisite itself, never the lecture's own content: the student has not learned that yet.
Use the lecture slides only to decide which parts of the prerequisite matter most.
Each question has exactly 4 options and one correct answer.
Write in the language the slides are written in.

Respond with only a JSON object:
{{"questions": [{{"question": "...", "options": ["...", "...", "...", "..."], "answer_index": <0-3>, "explanation": "<why the correct answer is right>"}}]}}"""


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


class Quiz(BaseModel):
    questions: list[Question] = Field(min_length=NUM_QUESTIONS, max_length=NUM_QUESTIONS)


class LectureOut(BaseModel):
    lecture_id: str
    title: str
    page_count: int
    truncated: bool = Field(..., description="True if only the first part of the slides was used")
    prerequisites: list[Prerequisite]


class QuizRequest(BaseModel):
    prerequisite: str = Field(..., min_length=1, description="Name of the prerequisite to quiz on")


class QuizQuestion(BaseModel):
    question: str
    options: list[str]


class QuizOut(BaseModel):
    quiz_id: str
    prerequisite: str
    questions: list[QuizQuestion]


class QuizAnswers(BaseModel):
    answers: list[Annotated[int, Field(ge=0, le=3)]] = Field(
        ..., description="Index of the chosen option for each question, in order"
    )


class QuestionResult(BaseModel):
    question: str
    your_answer: int
    correct_answer: int
    correct: bool
    explanation: str


class QuizResult(BaseModel):
    score: int
    total: int
    results: list[QuestionResult]


# lecture_id -> slide text
_LECTURES: dict[str, str] = {}
# quiz_id -> Quiz, including the answers, which the client never sees
_QUIZZES: dict[str, Quiz] = {}


def _ask(schema: type[BaseModel], system: str, user: str) -> Any:
    data = helper.chat_json(
        [{"role": "system", "content": system}, {"role": "user", "content": user}]
    )
    try:
        return schema.model_validate(data)
    except ValidationError as exc:
        raise helper.LLMError(f"Model response had the wrong shape: {exc}") from exc


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
    """Generate 5 multiple-choice questions on the chosen prerequisite."""
    if lecture_id not in _LECTURES:
        raise HTTPException(404, "Lecture not found")
    quiz = _ask(
        Quiz,
        _QUIZ_PROMPT,
        f"Prerequisite topic: {body.prerequisite}\n\nLecture slides:\n{_LECTURES[lecture_id]}",
    )
    # Models favour certain answer positions, so shuffle to make them unpredictable.
    for q in quiz.questions:
        correct = q.options[q.answer_index]
        random.shuffle(q.options)
        q.answer_index = q.options.index(correct)
    quiz_id = uuid.uuid4().hex
    _QUIZZES[quiz_id] = quiz
    return QuizOut(
        quiz_id=quiz_id,
        prerequisite=body.prerequisite,
        questions=[QuizQuestion(question=q.question, options=q.options) for q in quiz.questions],
    )


@router.post("/quizzes/{quiz_id}/answers")
def submit_answers(quiz_id: str, body: QuizAnswers) -> QuizResult:
    """Grade the answers and explain the correct ones."""
    quiz = _QUIZZES.get(quiz_id)
    if quiz is None:
        raise HTTPException(404, "Quiz not found")
    if len(body.answers) != len(quiz.questions):
        raise HTTPException(422, f"Expected {len(quiz.questions)} answers, got {len(body.answers)}")
    results = [
        QuestionResult(
            question=q.question,
            your_answer=answer,
            correct_answer=q.answer_index,
            correct=answer == q.answer_index,
            explanation=q.explanation,
        )
        for q, answer in zip(quiz.questions, body.answers)
    ]
    return QuizResult(score=sum(r.correct for r in results), total=len(results), results=results)
