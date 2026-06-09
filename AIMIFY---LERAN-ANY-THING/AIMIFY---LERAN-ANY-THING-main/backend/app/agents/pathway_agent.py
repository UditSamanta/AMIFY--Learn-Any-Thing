import json
from app.agents.base_agent import BaseAgent
from app.schemas.models import LearningPathwaySchema, KnowledgeProfileSchema

class PathwayAgent(BaseAgent):
    name = "pathway"
    thinking = True

    @property
    def system_prompt(self) -> str:
        return "You are an expert curriculum designer and knowledge graph architect. Your job is to build personalized learning pathways as directed acyclic graphs of concepts. Always respond with valid JSON matching the exact schema provided."

    def generate_pathway(
        self, 
        session_id: str, 
        subject: str, 
        knowledge_profile: KnowledgeProfileSchema
    ) -> LearningPathwaySchema:
        self.log_interaction(session_id, f"Building learning pathway for: {subject}, level: {knowledge_profile.level}")
        
        prompt = f"""
        Design a personalized learning pathway for the subject: {subject}
        
        Student Level: {knowledge_profile.level}
        Student Knowledge Profile Scores: {json.dumps(knowledge_profile.scores)}
        
        Rules:
        1. Generate exactly 5 to 12 concepts.
        2. Each concept must only list concepts already defined EARLIER in the list as prerequisites.
        3. depth_level 1: Concept requires NO prerequisites.
        4. depth_level 2: Concept requires at least one depth_level 1 concept as a prerequisite.
        5. depth_level 3: Concept requires at least one depth_level 2 concept as a prerequisite.
        6. IMPORTANT: is_optional should be True ONLY for concepts where the student's knowledge_profile score for that concept cluster exceeds 75. Most concepts should be is_optional=False. When in doubt, set is_optional=False.
        7. Set confidence to 0.9 for well-known CS/Math subjects, and 0.6 for niche topics.
        
        Example for Machine Learning:
        [
            {{"concept": "Linear Algebra Basics", "depth_level": 1, "prerequisites": [], ...}},
            {{"concept": "Probability and Statistics", "depth_level": 1, "prerequisites": [], ...}},
            {{"concept": "Gradient Descent", "depth_level": 2, "prerequisites": ["Linear Algebra Basics"], ...}},
            {{"concept": "Neural Networks", "depth_level": 3, "prerequisites": ["Gradient Descent"], ...}}
        ]
        """
        
        # Invoke LLM
        pathway = self.invoke_structured(prompt, LearningPathwaySchema)

        # Validate at least 60% of concepts are NOT optional
        total = len(pathway.concepts)
        required_count = sum(1 for c in pathway.concepts if not c.is_optional)
        if total > 0 and required_count / total < 0.6:
            # Force lowest-depth optional concepts back to required until we hit 60%
            for concept in pathway.concepts:
                if concept.is_optional:
                    concept.is_optional = False
                    required_count += 1
                    if required_count / total >= 0.6:
                        break

        # Custom Validation
        if not (5 <= len(pathway.concepts) <= 12):
            raise ValueError(f"Pathway must have exactly 5 to 12 concepts, got {len(pathway.concepts)}")
            
        defined_concepts = set()
        for concept in pathway.concepts:
            for prereq in concept.prerequisites:
                if prereq not in defined_concepts:
                    raise ValueError(f"Prerequisite '{prereq}' for concept '{concept.concept}' is not defined earlier in the list or does not exist.")
            defined_concepts.add(concept.concept)
            
        self.log_interaction(session_id, f"Pathway built: {len(pathway.concepts)} concepts, {pathway.total_estimated_minutes} mins estimated")
        return pathway
