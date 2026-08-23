"""Example: consume the authoritative World Model through the public SDK."""

import os

from archos_sdk import ArchOSClient


with ArchOSClient(os.environ["ARCHOS_BASE_URL"], token=os.getenv("ARCHOS_TOKEN")) as archos:
    result = archos.query_entity(
        os.environ["ARCHOS_ENTITY_ID"],
        request_id="example-world-model-query",
    )
    print("entity:", result.entity)
    print("observations:", result.observation_count)
    print("effective confidence:", result.effective_confidence)
