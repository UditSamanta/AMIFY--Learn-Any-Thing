from typing import List
from app.agents.base_agent import BaseAgent
from app.schemas.models import AssessmentMCQSet, AssessmentMCQResult

class AssessmentAgent(BaseAgent):
    name = "assessment"
    thinking = False

    @property
    def system_prompt(self) -> str:
        return (
            "You are an expert MCQ designer. Generate clear multiple choice "
            "questions that test genuine conceptual understanding, not memorization. "
            "Each question must have exactly 4 options where only one is clearly correct. "
            "The wrong options (distractors) should be plausible but clearly wrong to someone "
            "who understands the concept. Include a brief explanation for why the correct "
            "answer is right. Always respond with valid JSON matching the exact schema provided."
        )

    def generate_questions(
        self,
        session_id: str,
        concept: str,
        depth_level: int
    ) -> AssessmentMCQSet:
        self.log_interaction(session_id, f"Generating MCQ assessment for: {concept}")

        prompt = f"""
        Generate 2-3 multiple choice questions for the concept: {concept} at depth_level: {depth_level} (1=beginner, 2=intermediate, 3=advanced).

        Requirements:
        1. Each question must test genuine conceptual understanding, not rote memorization.
        2. Each question must have exactly 4 options (A, B, C, D) where only one is correct.
        3. Distractors should be plausible but clearly wrong to someone who understands the concept.
        4. Include a brief explanation for why the correct answer is right.
        5. The correct_index is zero-based (0=first option, 1=second, 2=third, 3=fourth).
        """

        result = self.invoke_structured(prompt, AssessmentMCQSet)

        self.log_interaction(session_id, f"Generated {len(result.questions)} MCQ questions")
        return result

    def evaluate_answers(
        self,
        session_id: str,
        concept: str,
        question_set: AssessmentMCQSet,
        student_answers: List[int]
    ) -> AssessmentMCQResult:
        self.log_interaction(session_id, f"Evaluating MCQ answers for: {concept}")

        correct_count = 0
        per_question_results = []
        for i, q in enumerate(question_set.questions):
            if i < len(student_answers):
                is_correct = student_answers[i] == q.correct_index
                if is_correct:
                    correct_count += 1
                per_question_results.append({
                    "correct": is_correct,
                    "selected_index": student_answers[i],
                    "correct_index": q.correct_index,
                    "explanation": q.explanation
                })

        score = correct_count / len(question_set.questions)
        passed = score >= 0.6  # pass if 60%+ correct (1 out of 2, or 2 out of 3)

        feedback = f"You got {correct_count}/{len(question_set.questions)} correct."
        if passed:
            feedback += " Great understanding of this concept!"
        else:
            feedback += " Review the explanations below and try again."

        result = AssessmentMCQResult(
            passed=passed,
            score=score,
            feedback=feedback,
            correct_count=correct_count,
            total_count=len(question_set.questions),
            per_question_results=per_question_results
        )

        self.log_interaction(session_id, f"Assessment result: passed={result.passed}, score={result.score}")
        return result
