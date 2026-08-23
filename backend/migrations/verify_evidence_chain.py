"""Fail-closed migration verification helper.

Run after migrations 0001-0004 against the target database. This helper does
not mutate evidence; it verifies the persisted chain and exits non-zero when
integrity or chain-state validation fails.
"""
import asyncio
import os
import sys

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.agents.evidence_persistence import postgres_evidence_store


async def main() -> int:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required", file=sys.stderr)
        return 2

    engine = create_async_engine(database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with Session() as session:
            result = await postgres_evidence_store.verify_chain(session)
            print(result)
            return 0 if result["valid"] else 1
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
