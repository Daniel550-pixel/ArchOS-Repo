from backend.integrations.repository_capabilities import (
    REPOSITORY_CAPABILITIES,
    capabilities_for_domain,
    list_repository_capabilities,
)


def test_cross_repository_capabilities_are_registered():
    repositories = {item.repository for item in REPOSITORY_CAPABILITIES}
    expected = {
        "Daniel550-pixel/NetworkLab",
        "Daniel550-pixel/Airpods-4-Coding-Space",
        "Daniel550-pixel/Universal-SaaS-Solutions",
        "Daniel550-pixel/School-Files-Vault",
        "Daniel550-pixel/Project-Fortress",
    }
    assert expected.issubset(repositories)


def test_planned_connectors_are_not_advertised_as_implemented():
    records = list_repository_capabilities()
    planned = [item for item in records if item["status"] == "planned"]
    assert len(planned) >= 5
    assert all(item["integration_mode"].endswith("_adapter") for item in planned)


def test_capability_domain_filter_is_case_insensitive():
    records = capabilities_for_domain("INFRASTRUCTURE_INTELLIGENCE")
    assert len(records) == 1
    assert records[0]["repository"] == "Daniel550-pixel/NetworkLab"
