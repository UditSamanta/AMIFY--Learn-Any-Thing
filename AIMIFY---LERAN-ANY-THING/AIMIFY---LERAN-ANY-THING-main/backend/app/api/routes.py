import asyncio
import json
from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import Session, User, Interaction
from app.core.orchestrator import Orchestrator

# Import schemas used in requests
from app.schemas.models import DiagnosticAnswer

router = APIRouter()

session_sse_queues: dict = {}

def get_or_create_queue(session_id: str):
    import queue
    if session_id not in session_sse_queues:
        session_sse_queues[session_id] = queue.Queue(maxsize=100)
    return session_sse_queues[session_id]

def emit_agent_event(session_id: str, agent: str, message: str, event_id: str = None):
    import json
    import uuid
    q = get_or_create_queue(session_id)
    try:
        e_id = event_id if event_id else str(uuid.uuid4())
        q.put_nowait({"id": e_id, "agent": agent, "message": message, "session_id": session_id})
    except:
        pass

class CreateSessionRequest(BaseModel):
    user_name: str
    subject: str = ""
    aim: str = ""

class DiagnosticSubmitRequest(BaseModel):
    answers: List[DiagnosticAnswer]

class AssessSubmitRequest(BaseModel):
    answers: List[int]

@router.post("/session/create")
def create_session(request: CreateSessionRequest, db: DBSession = Depends(get_db)):
    user = User(name=request.user_name)
    db.add(user)
    db.commit()
    db.refresh(user)

    aim = request.aim or ""
    subject = request.subject or aim  # use aim as subject if subject is empty

    session = Session(user_id=user.id, subject=subject, aim=aim, state="DIAGNOSE")
    db.add(session)
    db.commit()
    db.refresh(session)

    try:
        orchestrator = Orchestrator(db)
        question_set = orchestrator.start_session(session.id, subject)

        return {
            "session_id": session.id,
            "user_id": user.id,
            "subject": session.subject,
            "aim": session.aim,
            "state": session.state,
            "questions": question_set.model_dump() if hasattr(question_set, "model_dump") else question_set.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/{session_id}/diagnostic")
def submit_diagnostic(session_id: str, request: DiagnosticSubmitRequest, db: DBSession = Depends(get_db)):
    try:
        orchestrator = Orchestrator(db)
        # The submit_diagnostic method expects list of dicts with {"question_index": x, "selected_index": y} or List[Any]
        # Because request.answers is List[DiagnosticAnswer], we can supply it directly or as dicts
        answers_dicts = [{"question_index": a.question_index, "selected_index": a.selected_index} for a in request.answers]
        result = orchestrator.submit_diagnostic(session_id, answers_dicts)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}/concept")
def get_concept(session_id: str, db: DBSession = Depends(get_db)):
    try:
        orchestrator = Orchestrator(db)
        result = orchestrator.get_current_concept_explanation(session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/{session_id}/assess")
def submit_assessment(session_id: str, request: AssessSubmitRequest, db: DBSession = Depends(get_db)):
    try:
        orchestrator = Orchestrator(db)
        result = orchestrator.submit_assessment(session_id, request.answers)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}/progress")
def get_progress(session_id: str, db: DBSession = Depends(get_db)):
    try:
        orchestrator = Orchestrator(db)
        result = orchestrator.get_progress(session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}/stream")
def stream_session(session_id: str, db: DBSession = Depends(get_db)):
    def event_generator():
        import json, time
        # First send last 5 historical interactions
        recent = db.query(Interaction).filter(
            Interaction.session_id == session_id
        ).order_by(Interaction.created_at.desc()).limit(5).all()
        for interaction in reversed(recent):
            data = json.dumps({"id": interaction.id, "agent": interaction.agent, "message": interaction.message})
            yield f"data: {data}\n\n"
        
        # Then stream live events
        q = get_or_create_queue(session_id)
        timeout_count = 0
        while timeout_count < 60:  # 60 second max
            try:
                event = q.get(timeout=1)
                data = json.dumps(event)
                yield f"data: {data}\n\n"
                timeout_count = 0
            except:
                timeout_count += 1
                yield f": heartbeat\n\n"
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/session/{session_id}/roadmap")
def get_roadmap(session_id: str, db: DBSession = Depends(get_db)):
    roadmap_interaction = db.query(Interaction).filter(
        Interaction.session_id == session_id,
        Interaction.agent == "roadmap"
    ).order_by(Interaction.created_at.desc()).first()

    resource_interaction = db.query(Interaction).filter(
        Interaction.session_id == session_id,
        Interaction.agent == "resource"
    ).order_by(Interaction.created_at.desc()).first()

    if not roadmap_interaction:
        raise HTTPException(status_code=404, detail="Roadmap not yet generated")

    return {
        "roadmap": roadmap_interaction.payload.get("roadmap"),
        "resources": resource_interaction.payload.get("resources") if resource_interaction else None
    }
