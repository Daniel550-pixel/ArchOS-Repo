# Universal Integration Fabric

## Purpose

The Universal Integration Fabric (UIF) connects independently maintained Daniel550-pixel repositories to ArchOS through explicit, versioned contracts. Repositories remain separate products; ArchOS consumes their capabilities through adapters rather than copying their applications or importing private implementation modules.

## Integration principles

1. **Read-only first.** Initial connectors observe health, metadata, telemetry, and approved business/document summaries. No connector silently performs writes in a source system.
2. **Contract before implementation.** Each adapter must document its endpoint, authentication method, schema, timeout, failure behavior, and data classification before it is enabled.
3. **No secret sharing.** Credentials stay in the source service's local environment or an approved secret store. Never commit tokens, passwords, private keys, or environment files.
4. **Governed actions.** Any future write operation must submit intent to the ArchOS server-side governance boundary. Client-side agent decisions are not authorization.
5. **Provenance.** Every observation should include source repository, source service, observation time, request correlation ID, and freshness.
6. **Failure isolation.** An unavailable source must degrade that connector only; it must not take down JARVIS or other integrations.
7. **Local-first.** Development connectors should use loopback endpoints and authenticated local adapters. Do not expose development services to the public internet to make integration convenient.

## Registered source repositories

| Repository | Domain | Initial integration scope | Registry status |
|---|---|---|---|
| [NetworkLab](https://github.com/Daniel550-pixel/NetworkLab) | Infrastructure intelligence | Read-only app health, network diagnostics, Wi-Fi/service telemetry | Planned |
| [Airpods-4-Coding-Space](https://github.com/Daniel550-pixel/Airpods-4-Coding-Space) | Device intelligence | Read-only Bluetooth and Windows audio endpoint telemetry | Planned |
| [Universal-SaaS-Solutions](https://github.com/Daniel550-pixel/Universal-SaaS-Solutions) | Business intelligence | Read-only customer, pricing, quote and tax-summary data | Planned |
| [School-Files-Vault](https://github.com/Daniel550-pixel/School-Files-Vault) | Knowledge intelligence | Document metadata, evidence references and searchable indexes | Planned |
| [Project-Fortress](https://github.com/Daniel550-pixel/Project-Fortress) | Security intelligence | Read-only application posture, dependency and service diagnostics | Planned |

The registry also retains previously audited sources such as AI-mainframe, FinSight and FGSE. A registry entry is an inventory record, not proof that a live connector or endpoint has been implemented.

## Target architecture

\`\`\`text
Source repositories and local services
       |          |          |          |
    NetworkLab   AAF       SaaS      Vault / Fortress
       |          |          |          |
       +----------+----------+----------+
                         |
                Local connector adapters
                         |
               UIF registry + health state
                         |
             ArchOS API / JARVIS orchestrator
                         |
           provenance + policy + audit + approval
                         |
                 Mission Control / UI
\`\`\`

## Connector lifecycle

- \`planned\`: capability identified; endpoint contract not yet verified.
- \`contract_defined\`: endpoint, schema, auth and failure behavior documented.
- \`implemented\`: adapter exists and has automated tests.
- \`verified\`: adapter passed local integration tests against the real source service.
- \`disabled\`: connector intentionally unavailable.

Only \`implemented\` and \`verified\` connectors may be advertised as operational. The current five new repository entries are deliberately marked \`planned\`.

## First implementation sequence

1. Verify local repository checkouts and their Git remotes using \`scripts/windows/Test-ArchOSIntegrations.ps1\`.
2. Confirm each source service's real health/read endpoints and authentication requirements.
3. Implement NetworkLab and Project Fortress health adapters first.
4. Add AAF read-only telemetry.
5. Add School Files Vault metadata/search integration.
6. Add Universal SaaS read-only commercial summaries.
7. Surface connector health, freshness, and provenance in Mission Control.

## Current API

The existing \`GET /integrations/capabilities\` endpoint exposes the repository capability registry. It is an inventory endpoint; it does not probe external repositories or imply that planned connectors are online.
