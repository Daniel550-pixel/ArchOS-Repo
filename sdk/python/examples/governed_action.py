"""Example: submit intent to the server-side Action Gate."""

import os

from archos_sdk import ArchOSClient


with ArchOSClient(os.environ["ARCHOS_BASE_URL"], token=os.getenv("ARCHOS_TOKEN")) as archos:
    decision = archos.submit_action(
        actor=os.getenv("ARCHOS_ACTOR", "operator"),
        agent="example-agent",
        target="runtime",
        requested_operation="read_health",
        risk_level="LOW_RISK",
        provenance="sdk-example",
    )
    print(decision)

    if decision.approval_state == "PENDING":
        print("The server-side governance boundary requires approval; no client-side execution is performed.")
