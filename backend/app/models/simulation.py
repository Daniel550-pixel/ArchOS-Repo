from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, Float, Integer, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.database import Base


class SimulationSnapshot(Base):
    __tablename__ = "simulation_snapshots"
    snapshot_id = Column(String(100), primary_key=True)
    as_of = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    digest = Column(String(64), nullable=False, unique=True, index=True)
    entity_count = Column(Integer, nullable=False, default=0)
    state = Column(JSON, nullable=False, default=dict)
    branches = relationship("SimulationBranch", back_populates="snapshot", cascade="all, delete-orphan")


class SimulationBranch(Base):
    __tablename__ = "simulation_branches"
    branch_id = Column(String(100), primary_key=True)
    snapshot_id = Column(String(100), ForeignKey("simulation_snapshots.snapshot_id", ondelete="CASCADE"), nullable=False, index=True)
    parent_branch_id = Column(String(100), ForeignKey("simulation_branches.branch_id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    horizon = Column(DateTime, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="DRAFT", index=True)
    confidence = Column(Float, nullable=False, default=0.0)
    changes = Column(JSON, nullable=False, default=dict)
    metrics = Column(JSON, nullable=False, default=dict)
    snapshot = relationship("SimulationSnapshot", back_populates="branches")
    parent = relationship("SimulationBranch", remote_side=[branch_id])
    __table_args__ = (Index("ix_simulation_branch_snapshot_horizon", "snapshot_id", "horizon"),)
