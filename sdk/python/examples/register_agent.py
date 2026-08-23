"""Example: advertise an external agent to the ArchOS runtime."""

import os

from archos_sdk import AgentCapability, AgentRegistration, ArchOSClient


registration = AgentRegistration(
    agent_id="example.research-agent",
    name="Example Research Agent",
    version="0.1.0",
    capabilities=(
        AgentCapability(
            name="research",
            description="Collect and summarize research inputs.",
            input_schema={"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
            output_schema={"type": "object", "properties": {"summary": {"type": "string"}}},
        ),
    ),
    metadata={"provider": "example", "environment": "development"},
)

with ArchOSClient(os.environ["ARCHOS_BASE_URL"], token=os.getenv("ARCHOS_TOKEN")) as archos:
    result = archos.register_agent(registration)
    print(result)
