from app.agents.base_agent import BaseAgent
from app.schemas.models import TutorExplanation

class TutorAgent(BaseAgent):
    name = "tutor"
    thinking = False

    @property
    def system_prompt(self) -> str:
        return "You are an expert adaptive tutor. Your job is to explain concepts clearly using analogies, examples and structured explanations calibrated to the student's level. Always respond with valid JSON matching the exact schema provided."

    def explain_concept(
        self, 
        session_id: str, 
        concept: str, 
        depth_level: int, 
        prior_context: str = "",
        aim: str = ""
    ) -> TutorExplanation:
        self.log_interaction(session_id, f"Explaining concept: {concept} at depth level {depth_level}")
        
        prompt = f"""
        Student's aim: {aim}
        Concept to explain: {concept}
        Frame this explanation in the context of their aim where relevant.
        If this concept directly contributes to their aim, make that 
        connection explicit.
        Student depth level: {depth_level} (1=beginner, 2=intermediate, 3=advanced)
        Prior context from session: {prior_context}
        
        Instructions: generate a structured explanation with:
        1. A relatable real-world analogy.
        2. A clear core explanation calibrated to the depth level (simple language for level 1, technical for level 3).
        3. A concrete worked example.
        4. A single key takeaway sentence.
        5. A check question to test basic understanding.
        """
        
        result = self.invoke_structured(prompt, TutorExplanation)
        self.log_interaction(session_id, f"Explanation ready for: {concept}")
        return result
