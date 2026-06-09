import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    subject = Column(String)
    aim = Column(String(500), nullable=True)
    tier = Column(String(20), default="free")
    state = Column(String, default="DIAGNOSE")
    current_concept_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    knowledge_profile = relationship("KnowledgeProfile", back_populates="session", uselist=False, cascade="all, delete-orphan")
    learning_pathway = relationship("LearningPathway", back_populates="session", uselist=False, cascade="all, delete-orphan")
    concept_progress = relationship("ConceptProgress", back_populates="session", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="session", cascade="all, delete-orphan")


class KnowledgeProfile(Base):
    __tablename__ = "knowledge_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("sessions.id"), unique=True)
    scores = Column(JSON, default=dict)
    overall_score = Column(Float)
    diagnostic_answers = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="knowledge_profile")


class LearningPathway(Base):
    __tablename__ = "learning_pathways"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("sessions.id"), unique=True)
    concepts = Column(JSON, default=list)
    total_concepts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="learning_pathway")


class ConceptProgress(Base):
    __tablename__ = "concept_progress"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("sessions.id"))
    concept_name = Column(String)
    concept_index = Column(Integer)
    status = Column(String, default="NOT_STARTED")
    attempts = Column(Integer, default=0)
    score = Column(Float, nullable=True)
    assessment_history = Column(JSON, default=list)
    adapted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session = relationship("Session", back_populates="concept_progress")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("sessions.id"))
    agent = Column(String)
    message = Column(Text)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="interactions")
