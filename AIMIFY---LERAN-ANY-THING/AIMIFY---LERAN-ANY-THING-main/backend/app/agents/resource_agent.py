from app.agents.base_agent import BaseAgent
from app.schemas.models import ResourcePlanSchema


class ResourceAgent(BaseAgent):
    name = "resource"
    thinking = False

    @property
    def system_prompt(self):
        return """You are a resource curator with encyclopedic knowledge 
of the best learning resources in every technical domain.

You know:
- Every major MOOC platform (Coursera, edX, MIT OCW, fast.ai, deeplearning.ai)
- The best YouTube channels per topic (3Blue1Brown for math, Striver for DSA, etc.)
- Key books with their exact titles and authors
- Practice platforms (Codeforces, LeetCode, Kaggle, etc.)
- Free vs paid options

Your job: given a roadmap phase and the student's weak areas,
give the 2-3 BEST specific resources for that phase.
Be specific: name the exact course, the exact YouTube playlist name, 
the exact book title + author.
Never recommend something generic like "watch YouTube tutorials."

Always respond with valid JSON matching the exact schema provided."""

    def generate_resources(
        self,
        session_id: str,
        aim: str,
        roadmap_phases: list,
        weak_areas: list,
        knowledge_level: str
    ):
        self.log_interaction(session_id, "Curating personalized resources")

        prompt = f"""
Curate specific learning resources for this person.

AIM: {aim}
CURRENT LEVEL: {knowledge_level}
WEAK AREAS THAT NEED RESOURCES: {weak_areas}

ROADMAP PHASES TO RESOURCE:
{roadmap_phases}

For each phase, provide 2-3 resources. For each resource:
- Exact name (e.g. "Mathematics for Machine Learning — Coursera by Imperial College")
- Platform/type (YouTube / Book / Course / Platform / Tool)
- Free or Paid
- Direct search hint (e.g. "search: 3Blue1Brown Linear Algebra series")
- Why this specific resource for this specific person
- Estimated hours to complete

Prioritize FREE resources. Only recommend paid if significantly better.
For weak areas, give extra resources.
"""
        result = self.invoke_structured(prompt, ResourcePlanSchema)
        self.log_interaction(
            session_id,
            f"Resources curated: {len(result.phase_resources)} phases covered",
            payload={"resources": result.model_dump()}
        )
        return result
