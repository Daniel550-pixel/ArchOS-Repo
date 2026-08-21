"""Persistent reality. PostGIS + RLS tenancy."""
try:
    from sqlalchemy import Column, String, Float, Text
    from sqlalchemy.dialects.postgresql import UUID
    from sqlalchemy.types import JSON
    from sqlalchemy.orm import declarative_base

    Base = declarative_base()

    class WorldEntity(Base):
        __tablename__ = "world_model_entities"
        id = Column(UUID(as_uuid=True), primary_key=True)
        scale = Column(String, index=True)
        type = Column(String)
        attributes = Column(JSON, default=dict)
        state_current = Column(JSON, default=dict)
        state_predicted = Column(JSON, default=dict)
        provenance = Column(Text)
        confidence = Column(Float, default=1.0)
        reality = Column(String, default="OBSERVED")
        tenant_id = Column(UUID(as_uuid=True), index=True)
except ImportError:
    class WorldEntity:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
