# Security Policy

## Scope

ArchOS is an early-stage open-source software project. Security reports are especially important for code involving authentication, authorization, AI agent actions, external connectors, secrets, camera/vision access, data handling, and infrastructure.

## Reporting a vulnerability

Please do **not** disclose suspected security vulnerabilities publicly through GitHub Issues or pull requests.

Use GitHub's private vulnerability reporting feature for this repository when available. If private reporting is unavailable, contact the repository maintainer through the private contact mechanism associated with the GitHub account `Daniel550-pixel` and provide enough information to reproduce and assess the issue.

Please include:

- affected component or file;
- impact and attack scenario;
- reproduction steps or proof of concept;
- affected versions/commits;
- suggested mitigation, if known.

Avoid including real credentials, API keys, personal data, or other sensitive information in reports.

## Response

Reports will be assessed based on severity, exploitability, affected scope, and reproducibility. Remediation and disclosure timing may vary depending on the issue and available maintainer resources.

## Supported versions

ArchOS is currently under active development. Security fixes are applied to the current `main` development line unless a supported release policy is introduced later.

## Security principles

Contributors should:

- never commit secrets or credentials;
- validate and constrain externally supplied input;
- follow least-privilege principles;
- treat AI-generated actions as untrusted until policy and authorization checks permit execution;
- protect user privacy and camera/vision data;
- document security-sensitive architectural changes.
