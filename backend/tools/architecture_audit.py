"""Static architecture guard for the authoritative ArchOS runtime.

This audit intentionally fails CI on high-confidence architectural regressions.
It is a guardrail, not a substitute for runtime tests or a dependency graph.
"""
from __future__ import annotations

import ast
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
PYTHON_ROOTS = [ROOT]

FORBIDDEN_IMPORTS = {
    "backend.core.event_fabric",
    "backend.core.observability",
    "backend.agents.night_shift",
    "core.event_fabric",
    "core.observability",
}
FORBIDDEN_FILES = {
    "backend/core/event_fabric.py",
    "backend/core/observability.py",
    "backend/agents/night_shift.py",
}
BLOCKING_CALLS = {"time.sleep", "requests.get", "requests.post", "requests.put", "requests.delete"}
FABRICATED_MARKERS = {
    "89.4": "certificate health fallback",
    "31.4": "Dubai climate fallback",
    "14.2": "Dubai wind fallback",
    "142": "fabricated city count candidate",
    "828.0": "fabricated building height candidate",
}


def python_files():
    return sorted(p for root in PYTHON_ROOTS for p in root.rglob("*.py") if ".venv" not in p.parts and "__pycache__" not in p.parts)


def dotted_name(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        left = dotted_name(node.value)
        return f"{left}.{node.attr}" if left else node.attr
    return None


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    # 1/2/3: repository inventory + duplicate-authority/import checks.
    for rel in FORBIDDEN_FILES:
        if (REPO / rel).exists():
            errors.append(f"superseded runtime file exists: {rel}")

    for path in python_files():
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except SyntaxError as exc:
            errors.append(f"syntax error: {path.relative_to(REPO)}:{exc.lineno}: {exc.msg}")
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                names = [a.name for a in node.names]
            elif isinstance(node, ast.ImportFrom):
                names = [node.module] if node.module else []
            else:
                names = []
            for name in names:
                if name in FORBIDDEN_IMPORTS or any(name.startswith(x + ".") for x in FORBIDDEN_IMPORTS):
                    errors.append(f"legacy import: {path.relative_to(REPO)} -> {name}")

            # 4: synchronous blocking calls in async functions.
            if isinstance(node, ast.AsyncFunctionDef):
                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        called = dotted_name(child.func)
                        if called in BLOCKING_CALLS:
                            errors.append(f"blocking call in async function: {path.relative_to(REPO)}:{child.lineno}: {called}")

        # 8: obvious fabricated telemetry markers in production runtime.
        text = path.read_text(encoding="utf-8")
        if "backend/app" in str(path):
            for marker, reason in FABRICATED_MARKERS.items():
                if re.search(rf"(?<![\w.]){re.escape(marker)}(?![\w.])", text):
                    warnings.append(f"review telemetry literal {marker} ({reason}): {path.relative_to(REPO)}")

    # 5/6: circular dependency smoke check and bounded in-memory state heuristics.
    # The authoritative app must not import itself and services should not import app.main.
    for path in python_files():
        text = path.read_text(encoding="utf-8")
        if path.name != "main.py" and re.search(r"(?:from|import)\s+app\.main\b", text):
            errors.append(f"service/module imports authoritative app entrypoint: {path.relative_to(REPO)}")
        if "while True:" in text and "asyncio.sleep" not in text and "for True" not in text:
            warnings.append(f"unbounded loop without visible async sleep: {path.relative_to(REPO)}")

    # 7: obvious unbounded process-global collections.
    for path in python_files():
        text = path.read_text(encoding="utf-8")
        if re.search(r"^\s*[A-Z][A-Z0-9_]*\s*=\s*\[\]\s*$", text, re.MULTILINE):
            warnings.append(f"process-global list requires bounded-state review: {path.relative_to(REPO)}")

    # 9: high-impact write endpoints must reference governance/action machinery.
    integrations = ROOT / "app" / "api" / "integrations.py"
    if integrations.exists():
        text = integrations.read_text(encoding="utf-8")
        if "ActionRequest" not in text or "governance_bridge" not in text:
            errors.append("integration write surface is missing explicit governance boundary")

    # 10: architecture CI itself must remain present.
    ci = REPO / ".github" / "workflows" / "ci.yml"
    if not ci.exists():
        errors.append("Sovereign CI workflow is missing")

    print("ARCHOS ARCHITECTURE AUDIT")
    print(f"Python modules scanned: {len(python_files())}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    for item in errors:
        print(f"ERROR: {item}")
    for item in warnings:
        print(f"WARNING: {item}")

    # Warnings are intentionally non-fatal until reviewed; high-confidence architectural errors fail CI.
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
