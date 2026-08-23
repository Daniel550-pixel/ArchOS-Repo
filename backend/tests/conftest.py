"""Shared PostgreSQL fixture for evidence integrity tests."""
import os

import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker


@pytest_asyncio.fixture
async def db_session():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required for PostgreSQL integration tests")
    engine = create_async_engine(database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        yield session
        await session.execute(text("TRUNCATE TABLE archos_evidence_ledger_audit, archos_evidence_ledger, archos_evidence_chain_state RESTART IDENTITY"))
        await session.commit()
    await engine.dispose()
