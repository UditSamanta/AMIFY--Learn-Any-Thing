from app.agents.base_agent import BaseAgent
from app.schemas.models import RoadmapSchema, KnowledgeProfileSchema
from typing import Optional


class RoadmapAgent(BaseAgent):
    name = "roadmap"
    thinking = True

    @property
    def system_prompt(self):
        return """You are a brutally honest world-class strategic advisor. 
You have advised people who reached 2400 on Codeforces, got ML jobs at 
Google DeepMind, became professional athletes, and mastered complex skills 
from scratch.

Your roadmaps are famous for three things:
1. Brutal honesty about timeline and difficulty
2. Hyper-specific resources (not generic "study math")
3. Daily actionable steps anyone can follow

You think in systems: prerequisites → core skills → application → mastery.
You know exactly which shortcuts work and which waste time.
You personalize based on the person's EXACT current level — not a template.

Always respond with valid JSON matching the exact schema provided."""

    def generate_roadmap(
        self,
        session_id: str,
        aim: str,
        subject: str,
        knowledge_profile: KnowledgeProfileSchema,
        completed_concepts: list,
        assessment_scores: list,
        weak_areas: list,
        strong_areas: list
    ):
        self.log_interaction(session_id, f"Building strategic roadmap for: {aim}")

        avg_score = sum(assessment_scores) / len(assessment_scores) if assessment_scores else 0.5

        prompt = f"""
Build a personalized strategic roadmap for this specific person.

THEIR AIM: {aim}
SUBJECT AREA: {subject}

THEIR CURRENT SITUATION (from diagnostic + teaching session):
- Knowledge level: {knowledge_profile.level} ({knowledge_profile.overall_score}/100)
- Strong areas: {strong_areas}
- Weak areas: {weak_areas}
- Concepts they just learned: {completed_concepts}
- Their learning speed indicator: {avg_score:.0%} average assessment score
  (above 80% = fast learner, 60-80% = average, below 60% = needs more time)

ROADMAP REQUIREMENTS:
- 3 to 5 phases from their current level to achieving: {aim}
- Be SPECIFIC to their weak areas — if they're weak at math, phase 1 must address math
- Daily hour commitment must be realistic (not "study 8 hours/day")
- Each phase must have a concrete milestone they can verify themselves
- Resources must be specific: name the exact course, book, or platform
- Timeline must be honest based on their {knowledge_profile.level} level
- immediate_next_action must be something they can do in the next 24 hours

If their level is beginner and the aim is ambitious, say so clearly 
in realistic_timeline_note. Do not give false hope.
"""
        result = self.invoke_structured(prompt, RoadmapSchema)
        self.log_interaction(
            session_id,
            f"Roadmap complete: {len(result.phases)} phases, {result.total_weeks} weeks",
            payload={"roadmap": result.model_dump()}
        )
        return result
