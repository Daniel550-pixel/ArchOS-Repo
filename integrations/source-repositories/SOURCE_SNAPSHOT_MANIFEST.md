# Source Repository Snapshot Manifest

Audited 2026-08-25.

All requested source repositories were recursively scanned. ArchOS imports source-capable text/code artifacts under `integrations/source-repositories/<repo>/` and keeps ArchOS runtime code authoritative. Credentials, `.env` files, personal documents, OS shortcuts, caches/pyc files and binary archives are not copied into runtime.

## Scanned repositories
- FinSight-Global-AI-2: recursive tree scanned; mixed source, personal/desktop artifacts, archives, generated cache and documents.
- FinSight_Global_AI_Dashboard: recursive tree scanned; Streamlit/Python and shell modules; `.env` excluded.
- AIOS-Core-Architect.: recursive tree scanned; source snapshot imported.
- AI-mainframe: recursive tree scanned; original repo contained only README; ArchOS-native adapter created.
- FGSE: recursive tree scanned; JARVIS, market-data, types and neural visualization snapshots imported.
- Obsidian-AI: recursive tree scanned; Gemini and Firebase capability snapshots imported; user-specific authorization material excluded.

## Promotion policy
1. No credentials or `.env` contents.
2. No personal/unrelated documents or OS shortcuts.
3. No generated caches/build artifacts.
4. Preserve repository provenance.
5. Promote capabilities into ArchOS-native modules only after dependency, security and test verification.
6. Consequential actions remain behind ArchOS governance and ActionGate.
