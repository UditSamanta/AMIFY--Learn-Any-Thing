from typing import List
from app.agents.base_agent import BaseAgent
from app.schemas.models import DiagnosticQuestionSet, KnowledgeProfileSchema, DiagnosticAnswer

class DiagnosticAgent(BaseAgent):
    name = "diagnostic"
    thinking = False

    @property
    def system_prompt(self) -> str:
        return "You are an expert educational diagnostician. Your job is to assess a student's knowledge level on a subject by generating targeted diagnostic questions. Always respond with valid JSON matching the exact schema provided."

    def generate_questions(self, session_id: str, subject: str, aim: str = "") -> DiagnosticQuestionSet:
        self.log_interaction(session_id, f"Generating diagnostic questions for: {subject}")
        
        prompt = f"""
        Generate 5 to 7 adaptive multiple-choice questions to assess 
        prerequisite knowledge for someone whose aim is: {aim}. 
        Subject area: {subject}. 
        Focus on foundational concepts that are critical prerequisites 
        for achieving this specific aim.
        Requirements:
        1. Questions must span beginner to advanced difficulty levels (1 to 3).
        2. Each question must target a specific concept cluster within {subject}.
        3. The questions should reveal genuine understanding gaps, not just memorization.
        4. Exactly 4 options per question.
        5. Indicate the correct_index (0-3).
        """
        
        result = self.invoke_structured(prompt, DiagnosticQuestionSet)
        
        # log generated question count
        self.log_interaction(session_id, f"Generated {len(result.questions)} diagnostic questions")
        return result

    def evaluate_answers(
        self, 
        session_id: str, 
        question_set: DiagnosticQuestionSet, 
        answers: List[DiagnosticAnswer]
    ) -> KnowledgeProfileSchema:
        self.log_interaction(session_id, f"Evaluating {len(answers)} diagnostic answers")
        
        from app.schemas.models import DiagnosticAnswer
        answers = [DiagnosticAnswer(**a) if isinstance(a, dict) else a for a in answers]
        
        # Build evaluation payload
        evaluation_data = []
        for ans in answers:
            if 0 <= ans.question_index < len(question_set.questions):
                q = question_set.questions[ans.question_index]
                evaluation_data.append({
                    "concept_cluster": q.concept_cluster,
                    "difficulty": q.difficulty,
                    "question": q.question,
                    "student_selected_index": ans.selected_index,
                    "correct_index": q.correct_index,
                    "is_correct": ans.selected_index == q.correct_index
                })

        prompt = f"""
        Based on the following student responses to diagnostic questions, evaluate their knowledge profile.
        
        Student Answers:
        {evaluation_data}
        
        Tasks:
        1. Score each 'concept_cluster' from 0-100 based on correctness and difficulty of the questions answered.
        2. Compute an 'overall_score' from 0-100.
        3. Determine their 'level' strictly based on this rule: overall < 40 = beginner, 40-70 = intermediate, 70+ = advanced (must be exactly one of: beginner, intermediate, advanced).
        """
        
        result = self.invoke_structured(prompt, KnowledgeProfileSchema)

        # Clamp all scores to 0-100
        for key in result.scores:
            result.scores[key] = min(100.0, max(0.0, float(result.scores[key])))

        # Recalculate overall_score as true average of all cluster scores
        if result.scores:
            result.overall_score = round(sum(result.scores.values()) / len(result.scores), 1)
            result.overall_score = min(100.0, max(0.0, result.overall_score))

        # Fix level thresholds
        if result.overall_score < 40:
            result.level = "beginner"
        elif result.overall_score < 70:
            result.level = "intermediate"
        else:
            result.level = "advanced"

        self.log_interaction(session_id, f"Knowledge profile: overall={result.overall_score}, level={result.level}")
        return result
