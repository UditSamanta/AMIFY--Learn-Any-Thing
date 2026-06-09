import asyncio
import json
import logging
import copy
from typing import List, Dict, Any

from app.db.models import Session, KnowledgeProfile, LearningPathway, ConceptProgress, Interaction
from app.schemas.models import *
from app.agents.diagnostic_agent import DiagnosticAgent
from app.agents.pathway_agent import PathwayAgent
from app.agents.tutor_agent import TutorAgent
from app.agents.assessment_agent import AssessmentAgent
from app.agents.adaptation_agent import AdaptationAgent
from app.agents.roadmap_agent import RoadmapAgent
from app.agents.resource_agent import ResourceAgent

logger = logging.getLogger(__name__)

class Orchestrator:
    def __init__(self, db):
        self.db = db
        self.diagnostic_agent = DiagnosticAgent(db)
        self.pathway_agent = PathwayAgent(db)
        self.tutor_agent = TutorAgent(db)
        self.assessment_agent = AssessmentAgent(db)
        self.adaptation_agent = AdaptationAgent(db)

    def start_session(self, session_id: str, subject: str) -> DiagnosticQuestionSet:
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.state = "DIAGNOSE"
        self.db.commit()

        aim = session.aim or subject
        question_set = self.diagnostic_agent.generate_questions(session_id, subject, aim=aim)
        
        self.diagnostic_agent.log_interaction(
            session_id,
            "Saved diagnostic questions for later evaluation",
            payload={"question_set": question_set.model_dump() if hasattr(question_set, "model_dump") else question_set.dict()}
        )
        return question_set

    def submit_diagnostic(self, session_id: str, answers: List[Any]) -> dict:
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        subject = session.subject

        interaction = self.db.query(Interaction).filter(
            Interaction.session_id == session_id,
            Interaction.message == "Saved diagnostic questions for later evaluation"
        ).order_by(Interaction.created_at.desc()).first()

        if not interaction or not interaction.payload or "question_set" not in interaction.payload:
            raise ValueError("Diagnostic questions not found in session history")

        reconstructed_qs = DiagnosticQuestionSet(**interaction.payload["question_set"])

        knowledge_profile_schema = self.diagnostic_agent.evaluate_answers(session_id, reconstructed_qs, answers)

        logger.info(f"[{session_id}] Clamped knowledge profile scores: {knowledge_profile_schema.scores}, overall: {knowledge_profile_schema.overall_score}, level: {knowledge_profile_schema.level}")

        kp = self.db.query(KnowledgeProfile).filter(
            KnowledgeProfile.session_id == session_id
        ).first()
        if kp:
            kp.scores = knowledge_profile_schema.scores
            kp.overall_score = knowledge_profile_schema.overall_score
        else:
            kp = KnowledgeProfile(
                session_id=session_id,
                scores=knowledge_profile_schema.scores,
                overall_score=knowledge_profile_schema.overall_score
            )
            self.db.add(kp)
        self.db.commit()

        pathway_schema = self.pathway_agent.generate_pathway(session_id, subject, knowledge_profile_schema)

        concepts_dicts = [c.model_dump() if hasattr(c, "model_dump") else c.dict() for c in pathway_schema.concepts]
        lp = LearningPathway(
            session_id=session_id,
            concepts=concepts_dicts,
            total_concepts=len(concepts_dicts)
        )
        self.db.add(lp)

        for i, concept in enumerate(pathway_schema.concepts):
            cp = ConceptProgress(
                session_id=session_id,
                concept_name=concept.concept,
                concept_index=i,
                status="NOT_STARTED"
            )
            self.db.add(cp)

        session.state = "TEACH"
        session.current_concept_index = 0
        self.db.commit()

        return {
            "knowledge_profile": knowledge_profile_schema.model_dump() if hasattr(knowledge_profile_schema, "model_dump") else knowledge_profile_schema,
            "pathway": pathway_schema.model_dump() if hasattr(pathway_schema, "model_dump") else pathway_schema
        }

    def get_current_concept_explanation(self, session_id: str) -> dict:
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        lp = self.db.query(LearningPathway).filter(LearningPathway.session_id == session_id).first()
        if not lp:
            raise ValueError(f"Learning pathway not found for {session_id}")

        # Guard: if all concepts are done, mark COMPLETE and signal completion
        all_cps = self.db.query(ConceptProgress).filter(
            ConceptProgress.session_id == session_id
        ).all()
        done_count = sum(1 for c in all_cps if c.status in ("PASSED", "SKIPPED"))
        if done_count >= len(all_cps) and len(all_cps) > 0:
            session.state = "COMPLETE"
            self.db.commit()
            return {"completed": True, "next_state": "COMPLETE"}

        current_index = session.current_concept_index
        if current_index >= lp.total_concepts:
            # Clamp to the last concept if index is out of bounds
            current_index = lp.total_concepts - 1
            session.current_concept_index = current_index
            self.db.commit()

        concept_dict = lp.concepts[current_index]
        concept_node = ConceptNode(**concept_dict)

        cp = self.db.query(ConceptProgress).filter(
            ConceptProgress.session_id == session_id,
            ConceptProgress.concept_index == current_index
        ).first()

        if cp:
            cp.status = "TEACHING"
            self.db.commit()

        passed_cps = self.db.query(ConceptProgress).filter(
            ConceptProgress.session_id == session_id,
            ConceptProgress.status == "PASSED"
        ).order_by(ConceptProgress.concept_index.desc()).limit(2).all()
        
        prior_context = [p.concept_name for p in passed_cps]

        aim = session.aim or session.subject
        explanation = self.tutor_agent.explain_concept(
            session_id, 
            concept_node.concept, 
            concept_node.depth_level, 
            prior_context,
            aim=aim
        )

        mcq_set = self.assessment_agent.generate_questions(session_id, concept_node.concept, concept_node.depth_level)
        self.assessment_agent.log_interaction(
            session_id, 
            "Cached assessment questions", 
            payload={"mcq_set": mcq_set.model_dump() if hasattr(mcq_set, "model_dump") else mcq_set.dict()}
        )

        session.state = "ASSESS"
        self.db.commit()

        return {
            "concept_node": concept_node.model_dump() if hasattr(concept_node, "model_dump") else concept_node,
            "explanation": explanation.model_dump() if hasattr(explanation, "model_dump") else explanation,
            "mcq_set": mcq_set.model_dump() if hasattr(mcq_set, "model_dump") else mcq_set
        }

    def submit_assessment(self, session_id: str, student_answers: List[int]) -> dict:
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        current_index = session.current_concept_index
        
        cp = self.db.query(ConceptProgress).filter(
            ConceptProgress.session_id == session_id,
            ConceptProgress.concept_index == current_index
        ).first()
        
        if not cp:
            raise ValueError("Current concept progress not found")

        lp = self.db.query(LearningPathway).filter(LearningPathway.session_id == session_id).first()
        concept_dict = lp.concepts[current_index]
        concept_node = ConceptNode(**concept_dict)

        cp.attempts += 1
        self.db.commit()

        interaction = self.db.query(Interaction).filter(
            Interaction.session_id == session_id,
            Interaction.message == "Cached assessment questions"
        ).order_by(Interaction.created_at.desc()).first()

        if interaction and interaction.payload and "mcq_set" in interaction.payload:
            mcq_set_dict = interaction.payload["mcq_set"]
            mcq_set = AssessmentMCQSet(**mcq_set_dict)
        else:
            mcq_set = self.assessment_agent.generate_questions(session_id, concept_node.concept, concept_node.depth_level)

        result = self.assessment_agent.evaluate_answers(
            session_id, 
            concept_node.concept, 
            mcq_set, 
            student_answers
        )

        history = cp.assessment_history[:] if cp.assessment_history else []
        history.append(result.model_dump() if hasattr(result, "model_dump") else result.dict())
        cp.assessment_history = history
        self.db.commit()

        adaptation = None

        if result.passed:
            # Mark current concept as PASSED
            cp.status = "PASSED"
            cp.score = result.score
            self.db.commit()

            # Advance to next concept
            session.current_concept_index += 1

            # Check if ALL concepts are done (robust: count PASSED+SKIPPED vs total)
            total = len(lp.concepts)
            all_cps = self.db.query(ConceptProgress).filter(
                ConceptProgress.session_id == session_id
            ).all()
            required_done = sum(
                1 for c in all_cps
                if c.status in ("PASSED", "SKIPPED")
            )

            if session.current_concept_index >= total or required_done >= len(all_cps):
                session.state = "COMPLETE"
                self.db.commit()

                # ═══ Generate Roadmap + Resources at COMPLETE ═══
                try:
                    completed = [
                        cp2.concept_name for cp2 in all_cps
                        if cp2.status == "PASSED"
                    ]
                    scores_list = [
                        cp2.score for cp2 in all_cps
                        if cp2.score is not None
                    ]
                    kp_record = self.db.query(KnowledgeProfile).filter(
                        KnowledgeProfile.session_id == session_id
                    ).first()

                    kp_schema = KnowledgeProfileSchema(
                        scores=kp_record.scores or {},
                        overall_score=kp_record.overall_score or 0,
                        level="beginner"
                    )
                    if kp_schema.overall_score >= 70:
                        kp_schema.level = "advanced"
                    elif kp_schema.overall_score >= 40:
                        kp_schema.level = "intermediate"

                    weak = [k for k, v in (kp_record.scores or {}).items() if v < 40]
                    strong = [k for k, v in (kp_record.scores or {}).items() if v >= 70]
                    aim = session.aim or session.subject

                    roadmap_agent = RoadmapAgent(self.db)
                    roadmap = roadmap_agent.generate_roadmap(
                        session_id=session_id,
                        aim=aim,
                        subject=session.subject,
                        knowledge_profile=kp_schema,
                        completed_concepts=completed,
                        assessment_scores=scores_list,
                        weak_areas=weak,
                        strong_areas=strong
                    )

                    resource_agent = ResourceAgent(self.db)
                    resources = resource_agent.generate_resources(
                        session_id=session_id,
                        aim=aim,
                        roadmap_phases=[
                            {"phase": p.phase_number, "title": p.title, "focus": p.focus}
                            for p in roadmap.phases
                        ],
                        weak_areas=weak,
                        knowledge_level=kp_schema.level
                    )

                    self.db.add(Interaction(
                        session_id=session_id,
                        agent="roadmap",
                        message="Personalized roadmap generated",
                        payload={"roadmap": roadmap.model_dump()}
                    ))
                    self.db.add(Interaction(
                        session_id=session_id,
                        agent="resource",
                        message="Resource plan curated",
                        payload={"resources": resources.model_dump()}
                    ))
                    self.db.commit()
                except Exception as e:
                    logger.error(f"[{session_id}] Roadmap/resource generation failed: {e}", exc_info=True)

                return {
                    "result": result.model_dump() if hasattr(result, "model_dump") else result,
                    "passed": True,
                    "score": result.score,
                    "feedback": result.feedback,
                    "next_state": "COMPLETE",
                    "per_question_results": result.per_question_results,
                    "adaptation": None
                }
            else:
                session.state = "TEACH"
                self.db.commit()
                return {
                    "result": result.model_dump() if hasattr(result, "model_dump") else result,
                    "passed": True,
                    "score": result.score,
                    "feedback": result.feedback,
                    "next_state": "TEACH",
                    "per_question_results": result.per_question_results,
                    "adaptation": None
                }
        else:
            if cp.attempts >= 4:
                # Hard cap: force skip after 4 failed attempts to prevent infinite loop
                logger.info(f"[{session_id}] Force-skipping '{concept_node.concept}' after {cp.attempts} failed attempts")
                cp.status = "SKIPPED"
                cp.score = result.score
                session.current_concept_index += 1
                
                # Robust completion check: count all PASSED/SKIPPED vs all CPs
                all_cps_check = self.db.query(ConceptProgress).filter(
                    ConceptProgress.session_id == session_id
                ).all()
                done_check = sum(1 for c in all_cps_check if c.status in ("PASSED", "SKIPPED"))
                if session.current_concept_index >= lp.total_concepts or done_check >= len(all_cps_check):
                    session.state = "COMPLETE"
                else:
                    session.state = "TEACH"
                self.db.commit()
                adaptation = {"decision": "SKIP", "reason": f"Force-skipped after {cp.attempts} failed attempts", "insert_concept": None}
            elif cp.attempts >= 2:
                kp_record = self.db.query(KnowledgeProfile).filter(KnowledgeProfile.session_id == session_id).first()
                kp_schema = KnowledgeProfileSchema(
                    scores=kp_record.scores if kp_record else {},
                    overall_score=kp_record.overall_score if kp_record else 0.0,
                    level="intermediate"
                )
                
                adaptation = self.adaptation_agent.decide(
                    session_id, 
                    concept_node.concept, 
                    concept_node, 
                    cp.assessment_history, 
                    kp_schema
                )
                
                decision_val = adaptation.decision.value if hasattr(adaptation.decision, 'value') else adaptation.decision
                
                self.adaptation_agent.log_interaction(
                    session_id,
                    f"Adaptation applied: {decision_val}"
                )
                
                if decision_val == "SIMPLIFY":
                    new_concepts = copy.deepcopy(lp.concepts)
                    new_concepts[current_index]["depth_level"] = max(1, new_concepts[current_index].get("depth_level", 2) - 1)
                    lp.concepts = new_concepts
                elif decision_val == "INSERT_PREREQ":
                    if adaptation.insert_concept:
                        new_concepts = copy.deepcopy(lp.concepts)
                        insert_dict = adaptation.insert_concept.model_dump() if hasattr(adaptation.insert_concept, "model_dump") else adaptation.insert_concept.dict()
                        new_concepts.insert(current_index, insert_dict)
                        lp.concepts = new_concepts
                        lp.total_concepts = len(new_concepts)
                        
                        cp_shifted = self.db.query(ConceptProgress).filter(
                            ConceptProgress.session_id == session_id,
                            ConceptProgress.concept_index >= current_index
                        ).all()
                        for c in cp_shifted:
                            c.concept_index += 1
                        
                        new_cp = ConceptProgress(
                            session_id=session_id,
                            concept_name=insert_dict["concept"],
                            concept_index=current_index,
                            status="NOT_STARTED"
                        )
                        self.db.add(new_cp)
                elif decision_val == "SKIP":
                    cp.status = "SKIPPED"
                    session.current_concept_index += 1
                    if session.current_concept_index >= lp.total_concepts:
                        session.state = "COMPLETE"
                    else:
                        session.state = "TEACH"
                        
                if session.state != "COMPLETE":
                    session.state = "TEACH"
                    
                self.db.commit()
            else:
                session.state = "ASSESS"
                self.db.commit()

        return {
            "result": result.model_dump() if hasattr(result, "model_dump") else result,
            "passed": result.passed,
            "score": result.score,
            "feedback": result.feedback,
            "next_state": session.state,
            "per_question_results": result.per_question_results,
            "adaptation": adaptation.model_dump() if adaptation and hasattr(adaptation, "model_dump") else adaptation
        }

    def get_progress(self, session_id: str) -> dict:
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        lp = self.db.query(LearningPathway).filter(LearningPathway.session_id == session_id).first()
        
        cps = self.db.query(ConceptProgress).filter(
            ConceptProgress.session_id == session_id
        ).order_by(ConceptProgress.concept_index).all()

        cp_list = []
        for c in cps:
            cp_list.append({
                "concept_name": c.concept_name,
                "concept_index": c.concept_index,
                "status": c.status,
                "attempts": c.attempts,
                "score": c.score
            })

        return {
            "session_state": session.state,
            "current_concept_index": session.current_concept_index,
            "total_concepts": lp.total_concepts if lp else 0,
            "concept_progress": cp_list
        }
