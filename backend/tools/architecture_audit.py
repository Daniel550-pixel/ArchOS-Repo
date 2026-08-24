"""Static architecture guard for the authoritative ArchOS runtime."""
from __future__ import annotations

import ast
from pathlib import Path
import re

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
    "backend/jarvis_real.py",
    "backend/dubai_pulse.py",
    "backend/modbus_gateway.py",
}
BLOCKING_CALLS = {"time.sleep", "requests.get", "requests.post", "requests.put", "requests.delete"}
FABRICATED_MARKERS = {
    "89.4": "certificate health fallback",
    "31.4": "Dubai climate fallback",
    "14.2": "Dubai wind fallback",
    "142": "fabricated city count candidate",
    "828.0": "fabricated building height candidate",
}
ASYNC_YIELD_CALLS = {"asyncio.sleep", "asyncio.wait_for", "asyncio.wait", "asyncio.gather", "queue.get", "request.is_disconnected"}


def python_files():
    return sorted(
        p for root in PYTHON_ROOTS for p in root.rglob("*.py")
        if ".venv" not in p.parts and "__pycache__" not in p.parts
    )


def dotted_name(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        left = dotted_name(node.value)
        return f"{left}.{node.attr}" if left else node.attr
    return None


def has_async_yield(tree: ast.AST) -> bool:
    for node in ast.walk(tree):
        if isinstance(node, ast.Await):
            call = node.value
            if isinstance(call, ast.Call):
                called = dotted_name(call.func)
                if called in ASYNC_YIELD_CALLS or (called and called.startswith("asyncio.")):
                    return True
    return False


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    for rel in FORBIDDEN_FILES:
        if (REPO / rel).exists():
            errors.append(f"superseded runtime file exists: {rel}")

    files = python_files()
    for path in files:
        rel = path.relative_to(REPO)
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except SyntaxError as exc:
            errors.append(f"syntax error: {rel}:{exc.lineno}: {exc.msg}")
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
                    errors.append(f"legacy import: {rel} -> {name}")

            if isinstance(node, ast.AsyncFunctionDef):
                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        called = dotted_name(child.func)
                        if called in BLOCKING_CALLS:
                            errors.append(f"blocking call in async function: {rel}:{child.lineno}: {called}")

        text = path.read_text(encoding="utf-8")
        if str(path).startswith(str(ROOT / "app")):
            for marker, reason in FABRICATED_MARKERS.items():
                if re.search(rf"(?<![\w.]){re.escape(marker)}(?![\w.])", text):
                    errors.append(f"fabricated telemetry literal: {rel}: {marker} ({reason})")

        if path.name != "main.py" and re.search(r"^\s*(?:from|import)\s+app\.main\b", text, re.MULTILINE):
            errors.append(f"service/module imports authoritative app entrypoint: {rel}")

        if "while True:" in text and not has_async_yield(tree) and "for True" not in text:
            errors.append(f"unbounded loop without visible async yield: {rel}")

        if re.search(r"^\s*[A-Z][A-Z0-9_]*\s*=\s*\[\]\s*$", text, re.MULTILINE):
            warnings.append(f"process-global list requires bounded-state review: {rel}")

    integrations = ROOT / "app" / "api" / "integrations.py"
    if integrations.exists():
        text = integrations.read_text(encoding="utf-8")
        if "ActionRequest" not in text or "governance_bridge" not in text:
            errors.append("integration write surface is missing explicit governance boundary")

    ci = REPO / ".github" / "workflows" / "ci.yml"
    if not ci.exists():
        errors.append("Sovereign CI workflow is missing")

    print("ARCHOS ARCHITECTURE AUDIT")
    print(f"Python modules scanned: {len(files)}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    for item in errors:
        print(f"ERROR: {item}")
    for item in warnings:
        print(f"WARNING: {item}")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
