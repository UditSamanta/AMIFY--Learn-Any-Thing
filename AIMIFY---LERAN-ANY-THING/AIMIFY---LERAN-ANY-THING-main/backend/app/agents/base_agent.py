from abc import ABC, abstractmethod
from typing import Type, TypeVar, Optional, Any
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.llm_client import call_gemini_structured, call_gemini_raw
from app.db.models import Interaction

T = TypeVar("T", bound=BaseModel)

class BaseAgent(ABC):
    """
    Abstract Base Class for all specialized tutor agents.
    """
    
    name: str = "base_agent"
    thinking: bool = False

    def __init__(self, db: Session):
        self.db = db

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Returns the system prompt for the specific agent."""
        pass

    def invoke_structured(self, prompt: str, schema: Type[T]) -> T:
        """Calls Gemini and expects a structured Pydantic response."""
        return call_gemini_structured(
            prompt=prompt,
            schema=schema,
            system_prompt=self.system_prompt,
            thinking=self.thinking
        )

    def invoke_raw(self, prompt: str) -> str:
        """Calls Gemini and returns a plain text response."""
        return call_gemini_raw(
            prompt=prompt,
            system_prompt=self.system_prompt
        )

    def log_interaction(self, session_id: str, message: str, payload: Optional[dict] = None) -> Interaction:
        """Logs an interaction to the database."""
        interaction = Interaction(
            session_id=session_id,
            agent=self.name,
            message=message,
            payload=payload
        )
        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction) 
        try:
            from app.api.routes import emit_agent_event
            emit_agent_event(session_id, self.name, message, interaction.id)
        except:
            pass
        return interaction
