#!/usr/bin/env python3
"""ArchOS Phase-A architecture census.

Run from repository root:
    python scripts/architecture_inventory.py

Produces deterministic JSON containing Python definitions, imports, duplicate
state literals, and consumer counts. No network access is required.
"""
from __future__ import annotations
import ast, json, re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

def py_files():
    return sorted(p for p in BACKEND.rglob("*.py") if "__pycache__" not in p.parts)

def module_name(p):
    return ".".join(p.relative_to(ROOT).with_suffix("").parts)

defs=[]; imports=[]; literals=Counter(); consumers=defaultdict(set)
for p in py_files():
    text=p.read_text(encoding="utf-8", errors="replace")
    try: tree=ast.parse(text)
    except SyntaxError as e:
        defs.append({"module":module_name(p),"kind":"SYNTAX_ERROR","name":str(e)}); continue
    mod=module_name(p)
    for n in ast.walk(tree):
        if isinstance(n,(ast.ClassDef,ast.FunctionDef,ast.AsyncFunctionDef)):
            defs.append({"module":mod,"kind":type(n).__name__.replace("Def","").lower(),"name":n.name,"line":n.lineno})
        elif isinstance(n,ast.Import):
            for a in n.names:
                imports.append({"module":mod,"import":a.name,"line":n.lineno})
                consumers[a.name].add(mod)
        elif isinstance(n,ast.ImportFrom):
            base=("."*n.level)+(n.module or "")
            for a in n.names:
                target=f"{base}:{a.name}"
                imports.append({"module":mod,"import":target,"line":n.lineno})
                consumers[a.name].add(mod)
        elif isinstance(n,ast.Constant) and isinstance(n.value,str):
            s=n.value
            if len(s)<=40 and re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{2,31}",s):
                literals[s]+=1

name_groups=defaultdict(list)
for d in defs:
    if d["kind"] in {"class","function","asyncfunction"}:
        name_groups[d["name"]].append(d)
duplicates={k:v for k,v in sorted(name_groups.items()) if len(v)>1}
hotspots=[]
for d in defs:
    if d["kind"] in {"class","function","asyncfunction"}:
        hotspots.append({**d,"consumer_count":len(consumers.get(d["name"],()))})
hotspots.sort(key=lambda x:(-x["consumer_count"],x["name"],x["module"]))

report={
 "schema_version":1,
 "root":"backend",
 "python_files":len(py_files()),
 "definitions":hotspots,
 "duplicate_definitions":duplicates,
 "imports":sorted(imports,key=lambda x:(x["module"],x["line"],x["import"])),
 "state_like_literals":[{"value":k,"count":v} for k,v in sorted(literals.items()) if k.upper() in {"PENDING","RUNNING","SUCCESS","FAILED","ERROR","TIMEOUT","ABORTED","APPROVED","DENIED","REJECTED","VERIFIED","UNVERIFIED","INCONCLUSIVE","ABSTAIN","ABSTAINED","SPLIT","DEGRADED","FULL","INSUFFICIENT","HUMAN_REVIEW_REQUIRED","VERIFICATION_REQUIRED"}],
}
print(json.dumps(report,indent=2,sort_keys=True))
