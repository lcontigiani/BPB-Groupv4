from __future__ import annotations

import os
from pathlib import Path


def _path_from_env(var_name: str) -> Path | None:
    raw = os.getenv(var_name)
    if not raw:
        return None
    return Path(raw).expanduser()


def resolve_control_root(from_path: str | Path | None = None) -> Path:
    env_path = _path_from_env("BPB_CONTROL_ROOT")
    if env_path:
        return env_path

    current = Path(from_path or __file__).resolve()
    if current.is_file():
        current = current.parent

    for candidate in (current, *current.parents):
        if (candidate / "Codigos").exists() and (candidate / "Auxiliares").exists():
            return candidate
        if candidate.name == "Registro de Control de Producto":
            return candidate

    return current


def resolve_codigos_dir(from_path: str | Path | None = None) -> Path:
    env_path = _path_from_env("BPB_CONTROL_CODE_DIR")
    if env_path:
        return env_path
    return resolve_control_root(from_path) / "Codigos"


def resolve_auxiliares_dir(from_path: str | Path | None = None) -> Path:
    env_path = _path_from_env("BPB_AUXILIARES_DIR")
    if env_path:
        return env_path
    return resolve_control_root(from_path) / "Auxiliares"


def resolve_dashboard_dir(from_path: str | Path | None = None) -> Path:
    return resolve_codigos_dir(from_path) / "Dashboard_PO"


def resolve_indices_auxiliar_dir(from_path: str | Path | None = None) -> Path:
    env_path = _path_from_env("BPB_AUX_INDICES_DIR")
    if env_path:
        return env_path
    return resolve_auxiliares_dir(from_path) / "indices_auxiliar"


def resolve_fabricas_csv(from_path: str | Path | None = None) -> Path:
    env_path = _path_from_env("BPB_FABRICAS_CSV")
    if env_path:
        return env_path
    return (
        resolve_auxiliares_dir(from_path)
        / "Fabricas"
        / "Listado Maestro de Codificacion Fabricas.csv"
    )
