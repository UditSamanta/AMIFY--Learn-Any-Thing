from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, model_validator

class DiagnosticQuestion(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_index: int = Field(..., ge=0, le=3)
    concept_cluster: str
    difficulty: int = Field(..., ge=1, le=3)

class DiagnosticQuestionSet(BaseModel):
    subject: str
    questions: List[DiagnosticQuestion] = Field(..., min_length=5, max_length=7)

class DiagnosticAnswer(BaseModel):
    question_index: int
    selected_index: int

class KnowledgeProfileSchema(BaseModel):
    scores: Dict[str, float]
    overall_score: float = Field(..., ge=0, le=100)
    level: str = Field(..., pattern="^(beginner|intermediate|advanced)$")

    @model_validator(mode="before")
    @classmethod
    def remap_scores(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "concept_scores" in data and "scores" not in data:
                data["scores"] = data.pop("concept_scores")
        return data

class ConceptNode(BaseModel):
    concept: str
    prerequisites: List[str] = Field(default_factory=list)
    depth_level: int = Field(..., ge=1, le=3)
    confidence: float = Field(..., ge=0, le=1)
    estimated_minutes: int = Field(..., ge=5, le=60)
    is_optional: bool = False

class LearningPathwaySchema(BaseModel):
    subject: str
    concepts: List[ConceptNode] = Field(..., min_length=5, max_length=12)
    total_estimated_minutes: int

class AssessmentMCQ(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_index: int = Field(..., ge=0, le=3)
    explanation: str  # shown after answering, explains why the answer is correct

class AssessmentMCQSet(BaseModel):
    concept: str
    questions: List[AssessmentMCQ] = Field(..., min_length=2, max_length=3)

class AssessmentMCQResult(BaseModel):
    passed: bool
    score: float = Field(..., ge=0.0, le=1.0)
    feedback: str
    correct_count: int
    total_count: int
    per_question_results: List[Dict]  # [{correct: bool, explanation: str}]

class AdaptationDecision(str, Enum):
    SIMPLIFY = "SIMPLIFY"
    INSERT_PREREQ = "INSERT_PREREQ"
    SKIP = "SKIP"

class AdaptationResult(BaseModel):
    decision: AdaptationDecision
    reason: str
    insert_concept: Optional[ConceptNode] = None
    new_depth_level: Optional[int] = None

class TutorExplanation(BaseModel):
    analogy: str
    core_explanation: str
    worked_example: str
    key_takeaway: str
    check_question: str


# ════════════════════════════════════════════════
# Roadmap & Resource Schemas
# ════════════════════════════════════════════════

class Resource(BaseModel):
    name: str
    platform: str
    is_free: bool = True
    search_hint: str
    why_for_you: str
    estimated_hours: int
    type: str  # "course" | "book" | "youtube" | "platform" | "tool"

class PhaseResources(BaseModel):
    phase_number: int
    phase_title: str
    resources: List[Resource]

class ResourcePlanSchema(BaseModel):
    aim: str
    phase_resources: List[PhaseResources]
    priority_resource: Resource  # the single most important resource overall
    free_starter_pack: List[str]  # 3 things they can start TODAY for free

class RoadmapMilestone(BaseModel):
    title: str
    week: int
    how_to_verify: str

class RoadmapPhase(BaseModel):
    phase_number: int
    title: str
    duration_weeks: int
    daily_hours: float
    focus: str
    key_activities: List[str]
    milestone: RoadmapMilestone
    honest_note: str

class RoadmapSchema(BaseModel):
    aim: str
    student_level: str
    total_weeks: int
    daily_commitment_hours: float
    phases: List[RoadmapPhase]
    immediate_next_action: str
    common_mistakes: List[str]
    realistic_timeline_note: str
    success_metrics: List[str]
