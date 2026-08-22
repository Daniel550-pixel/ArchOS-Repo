# Contributing to ArchOS

Thank you for contributing to ArchOS.

ArchOS is an early-stage open-source project. Contributions should improve correctness, maintainability, security, accessibility, performance, documentation, or the clarity of the system architecture.

## Before you contribute

1. Read the README and relevant architecture documentation.
2. Search existing issues and pull requests before opening a new one.
3. For security vulnerabilities, do **not** open a public issue; follow `SECURITY.md`.
4. Keep changes focused. Avoid unrelated refactors in feature or bug-fix PRs.

## Development

```bash
npm install
npm run dev
```

Before submitting a pull request, run the checks relevant to your change. The repository currently provides TypeScript/linting and project-specific verification commands in `package.json`.

## Pull requests

A good pull request should:

- explain the problem and the proposed solution;
- identify architectural or behavioral impact;
- include tests or verification when practical;
- preserve existing public interfaces unless a breaking change is intentional;
- avoid committing secrets, credentials, generated build output, or private data;
- update documentation when behavior or architecture changes.

## Code quality

Prefer small, composable modules and explicit interfaces. Changes affecting the AIOS/JARVIS orchestration layer, command bus, world-model runtime, security/governance controls, or multimodal input pipeline should include a short explanation of the relevant invariants and failure modes.

## Commit messages

Use concise, descriptive commit messages. Conventional Commit-style prefixes are encouraged, for example:

- `feat:` new functionality
- `fix:` bug fix
- `docs:` documentation
- `test:` tests
- `refactor:` refactoring
- `perf:` performance
- `security:` security-related change
- `chore:` maintenance

## Licensing

By contributing, you agree that your contributions will be licensed under the MIT License that applies to this repository.

## Maintainer discretion

The project is maintained by Daniel550-pixel. Maintainers may request changes, reject changes that conflict with the project's goals or security requirements, and revise contribution procedures as the project evolves.
