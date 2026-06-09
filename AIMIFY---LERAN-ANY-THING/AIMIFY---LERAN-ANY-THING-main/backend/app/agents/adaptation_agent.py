import json
from typing import List, Any

from app.agents.base_agent import BaseAgent
from app.schemas.models import (
    AdaptationResult,
    ConceptNode,
    KnowledgeProfileSchema,
    AdaptationDecision
)

class AdaptationAgent(BaseAgent):
    name = "adaptation"
    thinking = True

    @property
    def system_prompt(self) -> str:
        return (
            "You are an expert adaptive learning system. Your job is to analyze a student's "
            "repeated failures on a concept and decide the best corrective action. Always "
            "respond with valid JSON matching the exact schema provided."
        )

    def decide(
        self,
        session_id: str,
        concept: str,
        concept_node: ConceptNode,
        assessment_history: List[Any],
        knowledge_profile: KnowledgeProfileSchema
    ) -> AdaptationResult:
        
        self.log_interaction(
            session_id,
            f"Analyzing adaptation needed for: {concept}, attempts: {len(assessment_history)}"
        )
        
        # Safely convert to dictionaries for JSON serialization
        history_dicts = []
        for ah in assessment_history[-2:]:
            if hasattr(ah, "model_dump"):
                history_dicts.append(ah.model_dump())
            elif hasattr(ah, "dict"):
                history_dicts.append(ah.dict())
            else:
                history_dicts.append(ah)

        kp_dict = knowledge_profile.model_dump() if hasattr(knowledge_profile, "model_dump") else knowledge_profile.dict()

        prompt = f"""
Analyze the student's failures on concept: '{concept}'.

Concept Details:
Depth Level: {concept_node.depth_level}
Prerequisites: {concept_node.prerequisites}

Last 2 Assessment Results:
{json.dumps(history_dicts, indent=2)}

Student Overall Knowledge Profile:
{json.dumps(kp_dict, indent=2)}

Decision Rules:
- SIMPLIFY: if misconceptions show fundamental misunderstanding, lower depth_level by 1 and re-explain
- INSERT_PREREQ: if misconceptions reference concepts not yet covered that are foundational, add a prerequisite concept before this one
- SKIP: if concept is is_optional=True OR student score is above 0.4 and concept is depth_level 3 (advanced optional)

If INSERT_PREREQ: also generate the missing ConceptNode to insert (concept name, prerequisites, depth_level=1 or 2, confidence=0.8, estimated_minutes=15).
"""

        result = self.invoke_structured(prompt, AdaptationResult)
        
        decision_val = result.decision.value if hasattr(result.decision, "value") else result.decision
        self.log_interaction(
            session_id,
            f"Adaptation decision: {decision_val} for {concept}"
        )
        
        return result
