from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Float, Boolean, Index
from app.models.database import Base


class CausalRelationship(Base):
    __tablename__ = "causal_relationships"

    relationship_id = Column(String(100), primary_key=True)
    source = Column(String(255), nullable=False, index=True)
    target = Column(String(255), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False, default="CAUSAL")
    coefficient = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False, default=0.8)
    rationale = Column(Text, nullable=False, default="")
    valid_from = Column(DateTime, nullable=False, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    active = Column(Boolean, nullable=False, default=True, index=True)
    provenance = Column(String(2000), nullable=False, default="")
    __table_args__ = (
        Index("ix_causal_active_source_target", "active", "source", "target"),
    )
