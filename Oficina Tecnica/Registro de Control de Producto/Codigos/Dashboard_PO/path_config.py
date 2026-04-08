from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable, Optional


LEGACY_REGISTROS_ROOT = Path(r"\\192.168.0.55\utn\REGISTROS")


def _env_path(*names: str) -> Optional[Path]:
    for name in names:
        raw = str(os.environ.get(name, "") or "").strip()
        if raw:
            return Path(raw).expanduser()
    return None


def _first_existing(candidates: Iterable[Optional[Path]]) -> Optional[Path]:
    for candidate in candidates:
        if candidate is None:
            continue
        try:
            if candidate.exists():
                return candidate
        except Exception:
            continue
    return None


def resolve_control_base_dir(script_dir: Path) -> Path:
    script_dir = Path(script_dir).resolve()
    env_candidate = _env_path("BPB_BASE_DIR")
    local_candidate = script_dir.parent.parent
    cwd_candidate = Path.cwd()

    for candidate in (env_candidate, local_candidate, cwd_candidate, cwd_candidate.parent):
        if candidate is None:
            continue
        try:
            if (candidate / "Codigos").exists():
                return candidate
        except Exception:
            continue

    return local_candidate


def resolve_oficina_root(control_base_dir: Path) -> Path:
    return Path(control_base_dir).resolve().parent


def resolve_workspace_root(control_base_dir: Path) -> Path:
    return resolve_oficina_root(control_base_dir).parent


def resolve_project_costos_analysis_root(control_base_dir: Path) -> Path:
    return _env_path("BPB_COSTOS_ANALYSIS_ROOT") or (
        resolve_workspace_root(control_base_dir) / "Proyecto Costos" / "Analisis de Procesos"
    )


def resolve_project_costos_code_dir(control_base_dir: Path) -> Path:
    return _env_path("BPB_COSTOS_CODE_DIR") or (
        resolve_workspace_root(control_base_dir) / "Proyecto Costos" / "Codigo" / "Codigos"
    )


def resolve_activity_codigos_dir(control_base_dir: Path) -> Path:
    return _env_path("BPB_ACTIVITY_CODE_DIR", "BPB_ACTIVITY_DIR") or (
        resolve_oficina_root(control_base_dir) / "Registro de Actividad" / "Codigos"
    )


def resolve_quality_root(control_base_dir: Path) -> Path:
    return _env_path("BPB_QUALITY_ROOT") or (
        resolve_oficina_root(control_base_dir) / "Registro de Calidad"
    )


def _resolve_registros_root_candidate() -> Optional[Path]:
    env_root = _env_path("BPB_REGISTROS_ROOT")
    if env_root is not None:
        return env_root
    try:
        if LEGACY_REGISTROS_ROOT.exists():
            return LEGACY_REGISTROS_ROOT
    except Exception:
        return None
    return None


def resolve_iso_docs_root(control_base_dir: Path) -> Path:
    explicit_root = _env_path("BPB_ISO_ROOT")
    if explicit_root is not None:
        return explicit_root

    registros_root = _resolve_registros_root_candidate()
    if registros_root is not None:
        try:
            for entry in registros_root.iterdir():
                if not entry.is_dir():
                    continue
                name_up = entry.name.upper()
                if name_up.startswith("REG.DISE") and "DESARROLLOS" in name_up:
                    return entry
        except Exception:
            pass

    return resolve_oficina_root(control_base_dir) / "Registro de ISO 9001"


def resolve_iso_code_root(control_base_dir: Path) -> Path:
    explicit_root = _env_path("BPB_ISO_CODE_ROOT")
    if explicit_root is not None:
        return explicit_root

    local_root = resolve_oficina_root(control_base_dir) / "Registro de ISO 9001"
    try:
        if (local_root / "Codigos").exists():
            return local_root
    except Exception:
        pass

    docs_root = resolve_iso_docs_root(control_base_dir)
    try:
        if (docs_root / "Codigos").exists():
            return docs_root
    except Exception:
        pass

    return local_root


def resolve_r016_dir(control_base_dir: Path) -> Path:
    explicit_dir = _env_path("BPB_R016_DIR")
    if explicit_dir is not None:
        return explicit_dir

    registros_root = _resolve_registros_root_candidate()
    if registros_root is not None:
        if registros_root.name.upper().startswith("R016-01"):
            return registros_root
        return registros_root / "R016-01"

    return Path(control_base_dir) / "Auxiliares" / "R016-01"
