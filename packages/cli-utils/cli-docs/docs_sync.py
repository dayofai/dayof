# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "textual>=0.58.0",
#   "rich>=13.7.1",
#   "typer>=0.12.3",
#   "pydantic>=2.9.0",
#   "platformdirs>=4.3.6"
# ]
# ///
"""
docs_sync.py — sync copies of third‑party docs into your monorepo

Run it with uv (installs deps from the header above automatically):
    uv run docs_sync.py sync docs-sync.json

This is intentionally a SINGLE FILE so you can drop it anywhere.
It supports a Textual (TUI) UI as well as a headless CLI mode.
"""
from __future__ import annotations

import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional, Tuple

import typer
from pydantic import BaseModel, Field, ValidationError
from platformdirs import user_cache_dir
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

# ---------- Config schema ----------

class Project(BaseModel):
    # The name of the destination folder under <dest_root>/
    name: str
    # A GitHub URL that points at the docs FOLDER in the repo.
    # Accepts forms like:
    #   https://github.com/owner/repo/tree/<branch>/<path>
    #   https://github.com/owner/repo/tree/<branch>          (then set docs_path)
    #   https://github.com/owner/repo                        (then set docs_path + branch)
    docs_url: str
    # Optional branch override; if not given, parsed from docs_url or defaults to 'main'
    branch: Optional[str] = None
    # If docs_url is a repo root or branch-only URL, set docs_path explicitly.
    docs_path: Optional[str] = None
    # Exclude subfolders (relative to docs_path). Supports glob patterns.
    exclude: list[str] = Field(default_factory=list)
    # Optional whitelist: if provided, only copy these subpaths (relative to docs_path).
    include_only: list[str] = Field(default_factory=list)
    # If true, wipe the destination folder before copying (default inherits from top-level).
    clean: Optional[bool] = None

class Config(BaseModel):
    dest_root: str = "context/docs"
    cache_dir: Optional[str] = None  # default: ~/.cache/docs-sync
    projects: list[Project]
    clean: bool = True  # clean destination before copying by default


# ---------- Utility helpers ----------

GITHUB_RE = re.compile(
    r"^https?://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/#?]+)"
    r"(?:/tree/(?P<branch>[^/]+)(?:/(?P<path>.*))?)?/?$"
)

def parse_github_url(url: str) -> Tuple[str, str, Optional[str], Optional[str]]:
    """
    Returns (owner, repo, branch, path) where path may be None.
    """
    m = GITHUB_RE.match(url)
    if not m:
        raise ValueError(f"Unsupported GitHub URL: {url}")
    return m["owner"], m["repo"], m["branch"], m["path"]

def ensure_git(console: Console) -> None:
    try:
        res = subprocess.run(["git", "--version"], capture_output=True, text=True, check=True)
        console.log(res.stdout.strip())
    except Exception as e:
        console.print(
            "[bold red]Git is required[/]: install Git and ensure it is on PATH."
        )
        raise typer.Exit(2)

def run(cmd: list[str], cwd: Optional[Path] = None) -> None:
    proc = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(
            f"Command failed ({proc.returncode})\n  cwd={cwd}\n  cmd={' '.join(cmd)}\n"
            f"  stdout:\n{proc.stdout}\n  stderr:\n{proc.stderr}"
        )

def git_sparse_checkout(
    owner: str,
    repo: str,
    branch: str,
    sparse_paths: list[str],
    cache_dir: Path,
    token: Optional[str] = None,
) -> Path:
    """
    Creates (or updates) a sparse checkout for (owner/repo) limited to sparse_paths.
    Returns the path to the checked-out repo.
    The working tree lives under cache_dir/owner/repo#branch/
    """
    repo_dir = cache_dir / owner / f"{repo}#{branch}"
    repo_dir.parent.mkdir(parents=True, exist_ok=True)

    # Construct remote. Token support for private repos.
    remote = f"https://github.com/{owner}/{repo}.git"
    if token:
        # Take care not to leak the token in logs.
        remote = f"https://{token}:x-oauth-basic@github.com/{owner}/{repo}.git"

    if (repo_dir / ".git").exists():
        # Update
        run(["git", "fetch", "origin", branch, "--depth=1"], cwd=repo_dir)
        run(["git", "switch", "-f", branch], cwd=repo_dir)
    else:
        run(
            [
                "git",
                "clone",
                "--filter=blob:none",
                "--sparse",
                "--depth=1",
                "--branch",
                branch,
                remote,
                str(repo_dir),
            ]
        )

    # Configure sparse paths
    # Using "--cone" keeps behavior simple when passing directories.
    if sparse_paths:
        run(["git", "sparse-checkout", "set", "--cone", *sparse_paths], cwd=repo_dir)
    return repo_dir

def iter_files(root: Path) -> Iterable[Path]:
    for p in root.rglob("*"):
        if p.is_file():
            yield p

def should_skip(rel: str, exclude_globs: list[str]) -> bool:
    if not exclude_globs:
        return False
    for pat in exclude_globs:
        if fnmatch.fnmatchcase(rel, pat) or fnmatch.fnmatchcase(rel.split("/", 1)[0], pat):
            return True
    return False

def copy_tree_filtered(src: Path, dst: Path, exclude_globs: list[str]) -> Tuple[int, int]:
    """
    Copy src -> dst while honoring exclude_globs (relative to src).
    Returns (files_copied, bytes_copied).
    """
    files = 0
    bytes_copied = 0
    for p in iter_files(src):
        rel = p.relative_to(src).as_posix()
        if should_skip(rel, exclude_globs):
            continue
        out = dst / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, out)
        files += 1
        try:
            bytes_copied += p.stat().st_size
        except OSError:
            pass
    return files, bytes_copied

# ---------- CLI (headless) ----------

app = typer.Typer(help="Sync third‑party documentation folders into your monorepo.")

def load_config(path: Path) -> Config:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    try:
        cfg = Config.model_validate(data)
    except ValidationError as e:
        console = Console()
        console.print("[red]Config validation failed.[/]")
        console.print(e)
        raise typer.Exit(2)
    return cfg

def normalize_sparse_paths(docs_path: str, include_only: list[str]) -> list[str]:
    if include_only:
        return [f"{docs_path.rstrip('/')}/{p.strip('/')}".lstrip("/") for p in include_only]
    return [docs_path]

@app.command()
def sync(
    config: Path = typer.Argument(..., help="Path to docs-sync JSON config."),
    ui: bool = typer.Option(False, "--ui", help="Use Textual TUI."),
    project: Optional[str] = typer.Option(None, "--project", "-p", help="Run for a single project name."),
    token: Optional[str] = typer.Option(None, envvar="GITHUB_TOKEN", help="GitHub token (for private repos / higher rate limits)."),
) -> None:
    """
    Headless mode (default). Use --ui to launch the TUI.
    """
    cfg = load_config(config)
    if ui:
        # Import lazily so textual doesn't slow startup in plain mode.
        from textual.app import App, ComposeResult
        from textual.widgets import Header, Footer, DataTable, TextLog, Label, ProgressBar

        class DocsSyncApp(App):
            CSS = """
            Screen {layout: grid; grid-size: 1 4; grid-rows: auto 1fr 8 3; }
            #title {padding: 1 2; }
            #table {height: 1fr;}
            #log {height: 8;}
            #bar {height: 3;}
            """

            def __init__(self, cfg: Config, token: Optional[str], only: Optional[str]):
                super().__init__()
                self.cfg = cfg
                self.token = token
                self.only = only
                self.table: DataTable
                self.log: TextLog
                self.progress: ProgressBar
                self.total_files = 0
                self.done_files = 0

            def compose(self) -> ComposeResult:
                yield Header()
                yield Label("Docs Sync", id="title")
                self.table = DataTable(id="table")
                self.table.add_columns("Project", "Repo", "Branch", "Docs path", "Status")
                yield self.table
                self.log = TextLog(id="log")
                yield self.log
                self.progress = ProgressBar(id="bar")
                yield self.progress
                yield Footer()

            def on_mount(self) -> None:
                rows = []
                for prj in self.cfg.projects:
                    if self.only and prj.name != self.only:
                        continue
                    owner, repo, branch, path_from_url = parse_github_url(prj.docs_url)
                    branch = prj.branch or branch or "main"
                    docs_path = prj.docs_path or path_from_url or "docs"
                    row_key = self.table.add_row(
                        prj.name, f"{owner}/{repo}", branch, docs_path, "queued"
                    )
                    rows.append((row_key, prj, owner, repo, branch, docs_path))
                # Spawn tasks sequentially to keep it simple
                self.set_interval(0.1, lambda: None)  # keep the app lively
                self.call_after_refresh(self._run_all, rows)

            def _log(self, msg: str) -> None:
                self.log.write(msg)

            async def _run_all(self, rows):
                self.progress.update(total=len(rows), progress=0)
                for row_key, prj, owner, repo, branch, docs_path in rows:
                    self.table.update_cell(row_key, 4, "cloning…")
                    sparse = normalize_sparse_paths(docs_path, prj.include_only)
                    try:
                        repo_dir = git_sparse_checkout(owner, repo, branch, sparse, Path(self.cfg.cache_dir or user_cache_dir('docs-sync')), token=self.token)
                    except Exception as e:
                        self.table.update_cell(row_key, 4, f"git error: {e.__class__.__name__}")
                        self._log(f"[red]{e}[/]")
                        continue

                    source_roots: list[Path]
                    if prj.include_only:
                        source_roots = [repo_dir / p for p in sparse]
                    else:
                        source_roots = [repo_dir / docs_path]

                    dest = Path(self.cfg.dest_root) / prj.name
                    if (prj.clean if prj.clean is not None else self.cfg.clean) and dest.exists():
                        shutil.rmtree(dest)

                    dest.mkdir(parents=True, exist_ok=True)
                    self.table.update_cell(row_key, 4, "copying…")
                    copied_files_total = 0
                    bytes_total = 0
                    for src in source_roots:
                        if not src.exists():
                            self._log(f"[yellow]Missing path in repo:[/] {src}")
                            continue
                        files, nbytes = copy_tree_filtered(src, dest, prj.exclude)
                        copied_files_total += files
                        bytes_total += nbytes
                    self.table.update_cell(row_key, 4, f"done ({copied_files_total} files)")
                    self._log(f"[green]✓[/] {prj.name}: {copied_files_total} files, {bytes_total/1_048_576:.1f} MiB")
                    self.progress.advance(1)

        DocsSyncApp(cfg, token, project).run()
        return

    # ------------ headless path -------------
    console = Console()
    ensure_git(console)

    projects = cfg.projects if project is None else [p for p in cfg.projects if p.name == project]
    if project is not None and not projects:
        console.print(f"[red]No project named '{project}' in config.[/]")
        raise typer.Exit(2)

    summary_rows = []
    for prj in projects:
        owner, repo, branch_in_url, path_from_url = parse_github_url(prj.docs_url)
        branch = prj.branch or branch_in_url or "main"
        docs_path = prj.docs_path or path_from_url or "docs"
        console.rule(f"{prj.name}  [dim]({owner}/{repo}:{branch} → {docs_path})[/]")
        try:
            sparse = normalize_sparse_paths(docs_path, prj.include_only)
            repo_dir = git_sparse_checkout(owner, repo, branch, sparse, Path(cfg.cache_dir or user_cache_dir('docs-sync')), token=token)
        except Exception as e:
            console.print(f"[red]git error:[/] {e}")
            summary_rows.append((prj.name, f"{owner}/{repo}", branch, "FAILED"))
            continue

        dest = Path(cfg.dest_root) / prj.name
        if (prj.clean if prj.clean is not None else cfg.clean) and dest.exists():
            shutil.rmtree(dest)
        dest.mkdir(parents=True, exist_ok=True)

        total_files = 0
        total_bytes = 0
        roots = [repo_dir / p for p in sparse] if prj.include_only else [repo_dir / docs_path]

        for src in roots:
            if not src.exists():
                console.print(f"[yellow]Missing path in repo:[/] {src}")
                continue
            files, nbytes = copy_tree_filtered(src, dest, prj.exclude)
            total_files += files
            total_bytes += nbytes

        console.print(f"[green]✓[/] Copied [bold]{total_files}[/] files → {dest}  ({total_bytes/1_048_576:.1f} MiB)")
        summary_rows.append((prj.name, f"{owner}/{repo}", branch, f"{total_files} files"))

    table = Table(title="Docs Sync Summary")
    table.add_column("Project", style="bold")
    table.add_column("Repo")
    table.add_column("Branch")
    table.add_column("Result")
    for r in summary_rows:
        table.add_row(*r)
    console.print("\n")
    console.print(table)


if __name__ == "__main__":
    app()
