#!/usr/bin/env python3
"""Phase audit harness — code-verified evidence collector for ERP_Sys phases.

Usage:
    python3 scripts/audit_phase.py <repo-path> <phase-number> [--future-from N] [--future-to N]

Read-only: clones nothing, mutates nothing, prints a Markdown-ish evidence dump.
Every number is derived from the working tree, never from a phase doc's claims.
Exit code 0 always (it is a reporter, not a gate) unless the repo path is bad.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from collections import defaultdict

# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #


def read(path: str) -> str:
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except OSError:
        return ""


def git(repo: str, *args: str) -> str:
    try:
        return subprocess.run(
            ["git", "-C", repo, *args],
            capture_output=True,
            text=True,
            timeout=30,
        ).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def find(repo: str, *names: str) -> str | None:
    """First existing path among candidates (relative to repo)."""
    for name in names:
        candidate = os.path.join(repo, name)
        if os.path.exists(candidate):
            return candidate
    return None


def dig(repo: str, rel_dir: str, filename: str) -> str | None:
    for root, _dirs, files in os.walk(os.path.join(repo, rel_dir)):
        if filename in files:
            return os.path.join(root, filename)
    return None


def h(title: str) -> None:
    print(f"\n## {title}")


def kv(label: str, value: object) -> None:
    print(f"- **{label}:** {value}")


def rows(path: str | None, prefix: str) -> dict[str, str]:
    """Row-initial register rows: `| G-13 | text...` -> {id: text}."""
    out: dict[str, str] = {}
    if not path:
        return out
    pattern = re.compile(r"\|\s*(" + prefix + r"-\d{2,3})\s*\|\s*([^|]{0,200})")
    for line in read(path).split("\n"):
        m = pattern.match(line.lstrip())
        if m:
            out.setdefault(m.group(1), m.group(2).strip())
    return out


def owner_phase(text: str) -> int:
    m = re.search(r"PHASE-(\d{3})", text)
    return int(m.group(1)) if m else 0


def contiguous(nums: list[int]) -> bool:
    return bool(nums) and sorted(nums) == list(range(min(nums), max(nums) + 1))


# --------------------------------------------------------------------------- #
# checks
# --------------------------------------------------------------------------- #


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    repo = os.path.abspath(sys.argv[1])
    phase = sys.argv[2].zfill(3)
    future_to = 99
    if "--future-to" in sys.argv:
        future_to = int(sys.argv[sys.argv.index("--future-to") + 1])
    future_from = 43
    if "--future-from" in sys.argv:
        future_from = int(sys.argv[sys.argv.index("--future-from") + 1])
    if not os.path.isdir(repo):
        print(f"bad repo path: {repo}")
        return 2

    docs = os.path.join(repo, "docs")
    phase_doc = find(repo, f"docs/implementation/phases/PHASE-{phase}.md")
    status_doc = dig(repo, "docs", "IMPLEMENTATION_STATUS.md")
    next_doc = dig(repo, "docs", "NEXT_ACTION.md")
    report = dig(repo, "docs", f"PHASE-{phase}-COMPLETION.md")
    jr = find(repo, "docs/accounting/JOURNAL_RULES.md")
    br = find(repo, "docs/product/BUSINESS_RULES.md")
    inv = find(repo, "docs/accounting/ACCOUNTING_INVARIANTS.md")
    tests = find(repo, "docs/testing/ACCOUNTING_TESTS.md")
    matrix = find(repo, "docs/security/AUTHORIZATION_MATRIX.md")
    catalog = find(repo, "docs/database/ENTITY_CATALOG.md")
    schema = find(repo, "apps/api/src/db/schema.ts")
    mig_dir = find(repo, "apps/api/migrations")

    print(f"# Phase audit — PHASE-{phase}")
    kv("repo", repo)
    kv("HEAD", git(repo, "log", "-1", "--format=%h %ci") or "n/a")
    kv("subject", (git(repo, "log", "-1", "--format=%s") or "n/a")[:120])

    # -- 1. status trio ----------------------------------------------------- #
    h("1. Status trio (doc header / status row / completion report)")
    header = "MISSING"
    if phase_doc:
        for line in read(phase_doc).split("\n"):
            if "**Status:**" in line:
                header = line.split("**Status:**")[1].split("·")[0].strip()
                break
    kv("phase-doc header", header)
    row = "MISSING"
    if status_doc:
        m = re.search(
            rf"^\|\s*\[PHASE-{phase}\][^|]*\|[^|]*\|[^|]*\|[^|]*\|([^|]*)\|",
            read(status_doc),
            re.M,
        )
        if m:
            row = m.group(1).strip()
    kv("IMPLEMENTATION_STATUS row", row)
    kv("completion report", os.path.relpath(report, repo) if report else "ABSENT")
    if next_doc:
        tail = read(next_doc)
        kv("NEXT_ACTION mentions this phase", tail.count(f"PHASE-{phase}"))
    zip_name = os.path.join(repo, f"ERP_PLATFORM_PHASE{phase}.zip")
    kv("archive zip", "present" if os.path.exists(zip_name) else "ABSENT")

    # -- 2. data layer ------------------------------------------------------ #
    h("2. Data layer")
    tables: list[str] = []
    if schema:
        tables = re.findall(r"pgTable\(\s*[\"']([a-z0-9_]+)[\"']", read(schema))
    kv("pgTable total", len(tables))

    migrations = sorted(f for f in os.listdir(mig_dir) if f.endswith(".sql")) if mig_dir else []
    kv("migrations", f"{len(migrations)} ({migrations[0] if migrations else '-'} … {migrations[-1] if migrations else '-'})")
    if phase_doc:
        planned = sorted(
            set(re.findall(r"\b00(\d{2})[_\b]", read(phase_doc)))
        )
        kv("migration numbers cited in phase doc", ", ".join(planned) or "none")
    # tables created by the migrations named in the phase doc's §4 range
    created: dict[str, set[str]] = {}
    for mig in migrations:
        s = read(os.path.join(mig_dir, mig))
        created[mig] = set(re.findall(r'CREATE TABLE (?:IF NOT EXISTS )?"?([a-z_]+)"?', s))
    catalog_text = read(catalog) if catalog else ""
    undocumented = sorted(t for t in tables if f"`{t}`" not in catalog_text)
    kv("tables missing from ENTITY_CATALOG", len(undocumented) or "0")

    # A table belongs in the isolation registry only if it really carries a
    # tenant_id column — derive that from the migrations, never from a guess.
    tenant_tables: set[str] = set()
    for mig in migrations:
        body = read(os.path.join(mig_dir, mig))
        for m in re.finditer(
            r'CREATE TABLE (?:IF NOT EXISTS )?"?([a-z_]+)"?\s*\((.*?)\n\);', body, re.S
        ):
            if re.search(r'"tenant_id"', m.group(2)):
                tenant_tables.add(m.group(1))
    kv("tenant_id-bearing tables (from migrations)", len(tenant_tables))
    registry = dig(repo, "apps/api/src", "tables.registry.ts")
    if registry:
        reg_names = set(re.findall(r"table:\s*\"([a-z_]+)\"", read(registry)))
        kv("isolation registry entries", len(reg_names))
        kv(
            "tenant tables missing from the isolation registry",
            sorted(tenant_tables - reg_names) or "0",
        )
        kv("registry rows for non-tenant/unknown tables", sorted(reg_names - tenant_tables) or "0")

    # -- 3. permissions drift (matrix ↔ seed, same algorithm as the checker) - #
    h("3. Permission catalog drift")
    if matrix and mig_dir:
        keys: list[str] = []
        in3 = False
        last = None
        for raw in read(matrix).split("\n"):
            line = raw.strip()
            if re.match(r"^##\s", line):
                in3 = False
                continue
            if re.match(r"^###\s+3\.\d+", line):
                in3 = True
                last = None
                continue
            if not in3 or not line.startswith("|"):
                continue
            first = line.split("|")[1] if line.count("|") >= 1 else ""
            for token in re.findall(r"`([^`]+)`", first):
                if token.startswith("."):
                    if last:
                        keys.append(last[: last.rfind(".")] + token)
                elif "." in token:
                    keys.append(token)
                    last = token
        matrix_keys = set(keys)
        seed_keys: set[str] = set()
        for mig in migrations:
            for m in re.finditer(
                r"^\('([a-z][a-z0-9_.-]+)',", read(os.path.join(mig_dir, mig)), re.M
            ):
                seed_keys.add(m.group(1))
        kv("matrix keys", len(matrix_keys))
        kv("seed keys (row-initial, all migrations)", len(seed_keys))
        kv("missing in seed", sorted(matrix_keys - seed_keys) or "0")
        kv("unknown in seed", sorted(seed_keys - matrix_keys) or "0")

    # -- 4. registers ------------------------------------------------------- #
    h("4. Registers (goldens / rules / invariants)")
    g = rows(jr, "G")
    b = rows(br, "BR")
    i = rows(inv, "INV")
    for label, reg in (("G", g), ("BR", b), ("INV", i)):
        nums = sorted(int(k.split("-")[1]) for k in reg)
        kv(
            f"{label} registered",
            f"{len(reg)} · {label}-{nums[0]:02d}…{label}-{nums[-1]:02d} · contiguous={contiguous(nums)}"
            if reg
            else "0",
        )

    bible_g = rows(tests, "G")
    bible_inv = rows(tests, "INV")
    if tests:
        kv("ACCOUNTING_TESTS golden rows", len(bible_g))
        kv("ACCOUNTING_TESTS invariant rows", len(bible_inv))
        kv("goldens NOT in the test bible", sorted(set(g) - set(bible_g)) or "0")
        kv("invariants NOT in the test bible", sorted(set(i) - set(bible_inv)) or "0")
        kv("test-bible updated", (re.search(r"Updated:\*\*?\s*([0-9-]+)", read(tests)) or [None, "?"])[1])

    # -- 5. future-ID collisions -------------------------------------------- #
    h(f"5. Future ID collisions (phase docs {future_from:03d}…{future_to:03d})")
    phase_dir = os.path.join(docs, "implementation", "phases")
    owners = {k: owner_phase(v) for k, v in {**g, **b, **i}.items()}
    claims: dict[str, set[int]] = defaultdict(set)
    if os.path.isdir(phase_dir):
        for name in sorted(os.listdir(phase_dir)):
            m = re.match(r"PHASE-(\d{3})\.md$", name)
            if not m:
                continue
            ph = int(m.group(1))
            if ph < future_from or ph > future_to:
                continue
            body = read(os.path.join(phase_dir, name))
            for ident in set(re.findall(r"\b(G-\d{2}|BR-\d{3}|INV-\d{3})\b", body)):
                claims[ident].add(ph)
    taken = [(k, owners.get(k, 0), sorted(v)) for k, v in claims.items() if k in owners and owners[k] != 0]
    free = [(k, sorted(v)) for k, v in claims.items() if k not in owners]
    kv("ids claimed by a future phase but ALREADY owned", len(taken))
    for k, own, phs in sorted(taken, key=lambda x: (x[0].split("-")[0], int(x[0].split("-")[1]))):
        print(f"    - {k} owned by PHASE-{own:03d}; also claimed in {phs}")
    kv("ids claimed by a future phase and NOT registered", len(free))
    for k, phs in sorted(free, key=lambda x: (x[0].split("-")[0], int(x[0].split("-")[1])))[:14]:
        print(f"    - {k} → {phs}")
    if free and len(free) > 14:
        print(f"    - … {len(free) - 14} more")

    # -- 6. documentation citations that point nowhere ----------------------- #
    h("6. Doc citations of spec files that do not exist")
    exact: set[str] = set()
    for base in ("apps", "packages"):
        for root, _dirs, files in os.walk(os.path.join(repo, base)):
            for f in files:
                if f.endswith(".spec.ts"):
                    exact.add(f)
    cited: set[str] = set()
    for root, dirs, files in os.walk(docs):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules")]
        for f in files:
            if f.endswith(".md"):
                body = read(os.path.join(root, f))
                for m in re.finditer(r"([A-Za-z0-9_.\-/]+\.spec\.ts)", body):
                    cited.add(os.path.basename(m.group(1)))
    absent = sorted(c for c in cited if c not in exact and not c.startswith(".."))
    aliased = [c for c in absent if c.replace(".db.spec.ts", ".spec.ts") in exact]
    truly = [c for c in absent if c not in aliased]
    kv("distinct spec files cited", len(cited))
    kv("cited as `*.db.spec.ts` while the file is `*.spec.ts`", len(aliased))
    for c in aliased[:10]:
        print(f"    - {c}  →  {c.replace('.db.spec.ts', '.spec.ts')} exists")
    kv("cited but absent under any name", truly or "0")

    # -- 7. surfaces -------------------------------------------------------- #
    h("7. Surfaces and tests")
    pages = 0
    web_app = os.path.join(repo, "apps", "web", "app")
    for _root, _dirs, files in os.walk(web_app):
        pages += sum(1 for f in files if f == "page.tsx")
    kv("web pages", pages)
    specs = 0
    its = 0
    for root, _dirs, files in os.walk(os.path.join(repo, "apps", "api", "src")):
        for f in files:
            if f.endswith(".spec.ts"):
                specs += 1
                its += len(re.findall(r"^\s*it\(", read(os.path.join(root, f)), re.M))
    kv("api specs", specs)
    kv("api it() total", its)
    kv("docs (md files)", sum(len([f for f in fs if f.endswith(".md")]) for _r, _d, fs in os.walk(docs)))

    print("\n---\n*Every figure above is read from the working tree. "
          "A phase doc's own claims are never an input to this report.*")
    return 0


if __name__ == "__main__":
    sys.exit(main())
