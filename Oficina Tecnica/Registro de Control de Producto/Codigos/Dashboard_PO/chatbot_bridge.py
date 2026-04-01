import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional, Union


ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
DEFAULT_MODEL = os.environ.get("BPB_CHATBOT_MODEL", "claude-sonnet-4-20250514")

_STOPWORDS = {
    "a", "abrime", "abrir", "abrime", "abrime", "abrinos", "abran", "acceder", "al", "algo",
    "anda", "andame", "archivo", "archivos", "ayuda", "bot", "busca", "buscar", "con", "cual",
    "cuales", "como", "cotizacion", "cotizaciones", "cotizaciones", "cotización", "cotizaciones",
    "de", "del", "donde", "el", "en", "esta", "este", "esto", "explica", "hay", "ir", "la",
    "las", "lleva", "llevame", "llevanos", "los", "me", "module", "modulo", "modulos", "mostrar",
    "mostrame", "mostranos", "navega", "navegame", "necesito", "pagina", "pantalla", "para", "por",
    "presupuesto", "presupuestos", "quiero", "registro", "registros", "related", "relacionado",
    "relacionados", "ruta", "se", "sobre", "to", "un", "una", "ver", "verme", "vernos", "verla",
    "verlo", "view", "y"
}

_NAVIGATION_TERMS = (
    "abrir", "abrime", "mostrar", "mostrame", "ver", "verme", "verlo", "verla", "ir", "anda",
    "lleva", "llevame", "navega", "navegame", "abrí", "mostrá", "mostrame", "mostrame", "mostrarme"
)

_FILE_INTENT_TERMS = (
    "archivo", "archivos", "json", "csv", "pdf", "xlsx", "xlsm", "bat", "codigo", "código",
    "script", "scripts", "carpeta", "carpetas", "planilla", "planillas"
)

_VIEW_CATALOG = [
    {
        "id": "home",
        "label": "Inicio",
        "description": "Pantalla principal del dashboard.",
        "aliases": ["inicio", "home", "principal", "menu principal", "menú principal"],
    },
    {
        "id": "home-registros",
        "label": "Registros",
        "description": "Subhome de registros.",
        "aliases": ["registros", "subhome registros", "menu registros", "modulo registros"],
    },
    {
        "id": "home-base-datos",
        "label": "Base de Datos",
        "description": "Subhome de base de datos.",
        "aliases": ["base de datos", "datos", "database"],
    },
    {
        "id": "home-herramientas",
        "label": "Herramientas",
        "description": "Subhome de herramientas.",
        "aliases": ["herramientas", "tools"],
    },
    {
        "id": "projects",
        "label": "Proyectos",
        "description": "Módulo PLM/ERP y proyectos.",
        "aliases": ["proyectos", "proyecto", "modulo proyectos", "modulo de proyectos", "gestion de proyectos", "gestion proyectos", "plm", "erp", "bom"],
    },
    {
        "id": "cotizacion-menu",
        "label": "Menú Cotización",
        "description": "Entrada principal al módulo de cotización.",
        "aliases": ["cotizacion", "cotización", "cotizaciones", "presupuesto", "presupuestos"],
    },
    {
        "id": "cotizacion-records",
        "label": "Registros de Cotización",
        "description": "Listado de cotizaciones guardadas.",
        "aliases": ["historial de cotizaciones", "registros de cotizacion", "cotizaciones guardadas", "lista de cotizaciones"],
    },
    {
        "id": "cotizacion-new",
        "label": "Editor de Cotización",
        "description": "Editor para una cotización nueva o restaurada.",
        "aliases": ["editor de cotizacion", "nueva cotizacion", "crear cotizacion", "crear cotización"],
    },
    {
        "id": "logistics",
        "label": "Logística",
        "description": "Módulo de logística.",
        "aliases": ["logistica", "logística", "contenedor", "packing"],
    },
    {
        "id": "po-module",
        "label": "Purchase Orders",
        "description": "Panel de órdenes de compra.",
        "aliases": ["purchase order", "purchase orders", "po", "orden de compra", "ordenes de compra", "órdenes de compra"],
    },
    {
        "id": "iso-menu",
        "label": "ISO 9001",
        "description": "Menú del módulo ISO.",
        "aliases": ["iso", "iso 9001", "calidad iso"],
    },
    {
        "id": "iso-control",
        "label": "Control ISO",
        "description": "Panel de control ISO.",
        "aliases": ["control iso", "panel iso", "seguimiento iso control"],
    },
    {
        "id": "iso-tracking",
        "label": "Tracking ISO",
        "description": "Seguimiento ISO.",
        "aliases": ["tracking iso", "seguimiento iso", "gantt iso"],
    },
    {
        "id": "quality-pending",
        "label": "Calidad Pendiente",
        "description": "Pendientes del módulo calidad.",
        "aliases": ["calidad pendiente", "pendientes de calidad", "quality pending", "modulo calidad", "panel calidad", "calidad"],
    },
    {
        "id": "quality-history",
        "label": "Historial de Calidad",
        "description": "Historial del módulo calidad.",
        "aliases": ["historial de calidad", "quality history", "calidad historial"],
    },
    {
        "id": "activity-pending",
        "label": "Actividad Pendiente",
        "description": "Pendientes de actividad.",
        "aliases": ["actividad pendiente", "pendientes de actividad", "registro de actividad pendiente", "registros de actividad pendientes", "mis actividades pendientes"],
    },
    {
        "id": "activity-records",
        "label": "Registros de Actividad",
        "description": "Registros y menús de actividad.",
        "aliases": ["registros de actividad", "activity records", "actividad registros", "modulo actividad", "panel actividad", "actividad"],
    },
    {
        "id": "activity-history",
        "label": "Historial de Actividad",
        "description": "Historial de actividad.",
        "aliases": ["historial de actividad", "activity history"],
    },
    {
        "id": "aux-csv",
        "label": "Auxiliar CSV",
        "description": "Auxiliares y CSV.",
        "aliases": ["auxiliar", "auxiliares", "csv", "indices auxiliares", "índices auxiliares"],
    },
]


def _normalize_text(value: Any) -> str:
    text = str(value or "").strip().lower()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return re.sub(r"\s+", " ", text)


def _tokenize_query(text: str) -> list[str]:
    normalized = _normalize_text(text)
    raw_tokens = re.findall(r"[a-z0-9_-]+", normalized)
    seen = []
    for token in raw_tokens:
        if len(token) < 2 or token in _STOPWORDS:
            continue
        if token not in seen:
            seen.append(token)
    return seen


def _extract_last_user_message(messages: list[dict]) -> str:
    for item in reversed(messages or []):
        if str(item.get("role", "")).strip().lower() != "user":
            continue
        content = item.get("content", "")
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            fragments = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    fragments.append(str(block.get("text") or ""))
            return "\n".join(fragment for fragment in fragments if fragment).strip()
        return str(content).strip()
    return ""


def _trim_messages(messages: list[dict], limit: int = 8) -> list[dict]:
    trimmed = []
    for item in (messages or [])[-limit:]:
        role = str(item.get("role") or "").strip().lower()
        if role not in {"user", "assistant"}:
            continue
        content = item.get("content", "")
        if not isinstance(content, str):
            content = str(content)
        content = content.strip()
        if not content:
            continue
        trimmed.append({"role": role, "content": content[:1800]})
    return trimmed


def _looks_like_navigation_request(query: str) -> bool:
    normalized = _normalize_text(query)
    if any(term in normalized for term in _NAVIGATION_TERMS):
        return True
    return any(term in normalized for term in ("muestrame", "muestralo", "muestrala", "mostrarme"))


def _looks_like_file_request(query: str) -> bool:
    normalized = _normalize_text(query)
    return any(term in normalized for term in _FILE_INTENT_TERMS)


def _load_cotizacion_store(records_file: str) -> dict:
    empty_store = {"folders": ["Sin Carpeta"], "groups": []}
    target = Path(records_file)
    if not target.exists():
        return empty_store
    try:
        raw = json.loads(target.read_text(encoding="utf-8"))
    except Exception:
        return empty_store

    if isinstance(raw, dict):
        groups = raw.get("groups", [])
        folders = raw.get("folders", ["Sin Carpeta"])
    elif isinstance(raw, list):
        groups = raw
        folders = ["Sin Carpeta"]
    else:
        return empty_store

    safe_groups = groups if isinstance(groups, list) else []
    safe_folders = folders if isinstance(folders, list) else ["Sin Carpeta"]
    return {"folders": safe_folders or ["Sin Carpeta"], "groups": safe_groups}


def _load_projects(projects_file: str) -> list[dict]:
    target = Path(projects_file)
    if not target.exists():
        return []
    try:
        raw = json.loads(target.read_text(encoding="utf-8"))
    except Exception:
        return []

    if isinstance(raw, dict):
        projects = raw.get("projects", [])
        if isinstance(projects, dict):
            values = list(projects.values())
        elif isinstance(projects, list):
            values = projects
        else:
            values = []
    elif isinstance(raw, list):
        values = raw
    else:
        values = []

    return [item for item in values if isinstance(item, dict)]


def _summarize_cotizacion_group(group: dict) -> dict:
    versions = group.get("versions", []) if isinstance(group, dict) else []
    latest = {}
    if isinstance(versions, list) and versions:
        latest = sorted(
            versions,
            key=lambda item: (int(item.get("version_number") or 0), str(item.get("timestamp") or "")),
        )[-1]
    return {
        "id": str(group.get("id") or ""),
        "folder": str(group.get("folder") or "Sin Carpeta"),
        "save_name": str(latest.get("save_name") or group.get("save_name") or ""),
        "save_description": str(latest.get("save_description") or group.get("save_description") or ""),
        "author": str(latest.get("author") or group.get("author") or "Usuario"),
        "latest_version": int(group.get("latest_version") or latest.get("version_number") or len(versions) or 1),
        "version_count": len(versions) if isinstance(versions, list) else 0,
        "modified_at": str(group.get("updated_at") or latest.get("timestamp") or ""),
    }


def _score_text_match(text: str, tokens: list[str], exact_phrase: str = "") -> int:
    haystack = _normalize_text(text)
    if not haystack:
        return 0
    score = 0
    for token in tokens:
        if token and token in haystack:
            score += 4 if haystack.startswith(token) else 2
    if exact_phrase:
        normalized_phrase = _normalize_text(exact_phrase)
        if normalized_phrase and normalized_phrase in haystack:
            score += 6
    return score


def _search_projects(projects_file: str, query: str, limit: int = 5) -> list[dict]:
    tokens = _tokenize_query(query)
    if not tokens:
        return []

    matches = []
    for project in _load_projects(projects_file):
        searchable = " | ".join([
            str(project.get("id") or ""),
            str(project.get("name") or ""),
            str(project.get("project_name") or ""),
            str(project.get("title") or ""),
            str(project.get("description") or ""),
            str(project.get("client") or ""),
            str(project.get("code") or ""),
        ])
        score = _score_text_match(searchable, tokens, query)
        if score <= 0:
            continue
        matches.append({
            "id": str(project.get("id") or ""),
            "name": str(project.get("name") or project.get("project_name") or project.get("title") or ""),
            "description": str(project.get("description") or ""),
            "score": score,
        })

    matches.sort(key=lambda item: (int(item.get("score") or 0), item.get("name", "")), reverse=True)
    return matches[:limit]


def _get_project_by_id(projects_file: str, project_id: str) -> Optional[dict]:
    target_id = str(project_id or "").strip()
    if not target_id:
        return None

    for project in _load_projects(projects_file):
        if str(project.get("id") or "").strip() == target_id:
            return project
    return None


def _normalize_project_versions(versions: Any) -> list[dict]:
    if not isinstance(versions, list):
        return []

    normalized = []
    for index, version in enumerate(versions):
        if not isinstance(version, dict):
            continue
        normalized.append({
            "id": str(version.get("id") or "").strip(),
            "name": str(version.get("name") or f"Version {index + 1}").strip(),
            "revision": str(version.get("revision") or "").strip(),
            "description": str(version.get("description") or "").strip(),
        })
    return [item for item in normalized if item["id"]]


def _get_page_plm_state(page_context: Any) -> dict:
    if not isinstance(page_context, dict):
        return {}
    raw = page_context.get("plm_state")
    return raw if isinstance(raw, dict) else {}


def _get_project_versions_from_context(page_context: Any, projects_file: str, project_id: str) -> list[dict]:
    plm_state = _get_page_plm_state(page_context)
    versions = _normalize_project_versions(plm_state.get("versions"))
    if versions:
        return versions

    project = _get_project_by_id(projects_file, project_id)
    if not project:
        return []
    return _normalize_project_versions(project.get("plm_versions"))


def _search_project_versions(versions: list[dict], query: str, limit: int = 5) -> list[dict]:
    tokens = _tokenize_query(query)
    if not tokens:
        return []

    matches = []
    for version in versions:
        searchable = " | ".join([
            str(version.get("id") or ""),
            str(version.get("name") or ""),
            str(version.get("revision") or ""),
            str(version.get("description") or ""),
        ])
        score = _score_text_match(searchable, tokens, query)
        if score <= 0:
            continue
        match = dict(version)
        match["score"] = score
        matches.append(match)

    matches.sort(key=lambda item: (int(item.get("score") or 0), item.get("name", "")), reverse=True)
    return matches[:limit]


def _detect_project_version_section(query: str) -> str:
    normalized = _normalize_text(query)
    section_terms = {
        "bom": ("bom", "lista de materiales", "lista materiales", "despiece", "estructura"),
        "bitacora": ("bitacora", "bitacora de esa version", "historial de esa version", "historial de la version", "log de la version"),
        "values": ("valores", "costos", "costes", "costeo", "pricing", "precio de esa version"),
    }

    for section, aliases in section_terms.items():
        if any(alias in normalized for alias in aliases):
            return section
    return ""


def _make_project_version_section_action(
    *,
    project_id: str,
    project_name: str,
    version_id: str,
    version_name: str,
    section: str,
    auto_execute: bool,
) -> dict:
    section_labels = {
        "bom": "BOM",
        "bitacora": "Bitacora",
        "values": "Valores",
    }
    section_label = section_labels.get(section, section.title())
    version_label = version_name or version_id
    return {
        "type": "open_project_version_section",
        "project_id": project_id,
        "project_name": project_name or project_id,
        "version_id": version_id,
        "version_name": version_label,
        "section": section,
        "label": f"Abrir {section_label} de {version_label}",
        "description": project_name or "Proyecto",
        "auto_execute": auto_execute,
    }


def _resolve_context_version(query: str, versions: list[dict], plm_state: dict) -> Optional[dict]:
    if not versions:
        return None

    explicit_matches = _search_project_versions(versions, query, limit=1)
    if explicit_matches:
        return explicit_matches[0]

    version_ids = [
        str(plm_state.get("selected_version_id") or "").strip(),
        str(plm_state.get("context_version_id") or "").strip(),
        str(plm_state.get("active_version_id") or "").strip(),
    ]
    for version_id in version_ids:
        if not version_id:
            continue
        for version in versions:
            if str(version.get("id") or "").strip() == version_id:
                return version

    if len(versions) == 1:
        return versions[0]

    return None


def _detect_contextual_project_action(
    query: str,
    *,
    page_context: Any,
    projects_file: str,
    project_matches: list[dict],
) -> Optional[dict]:
    plm_state = _get_page_plm_state(page_context)
    current_project = plm_state.get("current_project") if isinstance(plm_state.get("current_project"), dict) else {}
    current_project_id = str(current_project.get("id") or "").strip()
    current_project_name = str(current_project.get("name") or "").strip()
    normalized = _normalize_text(query)
    section = _detect_project_version_section(query)
    if not section:
        return None
    mentions_project_scope = (
        "del proyecto" in normalized
        or "de proyecto" in normalized
        or "del plm" in normalized
        or "del proyecto " in normalized
    )

    if current_project_id and not mentions_project_scope:
        current_versions = _get_project_versions_from_context(page_context, projects_file, current_project_id)
        current_version = _resolve_context_version(query, current_versions, plm_state)
        if current_version:
            return _make_project_version_section_action(
                project_id=current_project_id,
                project_name=current_project_name,
                version_id=str(current_version.get("id") or "").strip(),
                version_name=str(current_version.get("name") or "").strip(),
                section=section,
                auto_execute=_looks_like_navigation_request(query),
            )
        return {
            "type": "open_project_versions",
            "project_id": current_project_id,
            "project_name": current_project_name or current_project_id,
            "label": f"Abrir versiones de {current_project_name or current_project_id}",
            "description": "Necesito elegir una version antes de abrir esa seccion.",
            "auto_execute": _looks_like_navigation_request(query),
        }

        if section in {"bom", "bitacora"}:
            return {
                "type": "open_project_section",
                "project_id": current_project_id,
                "project_name": current_project_name or current_project_id,
                "section": section,
                "label": f"Abrir {'BOM' if section == 'bom' else 'Bitacora'} de {current_project_name or current_project_id}",
                "description": "Proyecto",
                "auto_execute": _looks_like_navigation_request(query),
            }

    if not project_matches:
        return None

    top_project = project_matches[0]
    project_id = str(top_project.get("id") or "").strip()
    project_name = str(top_project.get("name") or project_id).strip()
    if mentions_project_scope and section in {"bom", "bitacora"}:
        return {
            "type": "open_project_section",
            "project_id": project_id,
            "project_name": project_name,
            "section": section,
            "label": f"Abrir {'BOM' if section == 'bom' else 'Bitacora'} de {project_name}",
            "description": "Proyecto",
            "auto_execute": _looks_like_navigation_request(query),
        }

    versions = _get_project_versions_from_context({}, projects_file, project_id)
    target_version = _resolve_context_version(query, versions, {})
    if target_version:
        return _make_project_version_section_action(
            project_id=project_id,
            project_name=project_name,
            version_id=str(target_version.get("id") or "").strip(),
            version_name=str(target_version.get("name") or "").strip(),
            section=section,
            auto_execute=_looks_like_navigation_request(query),
        )

    return {
        "type": "open_project_versions",
        "project_id": project_id,
        "project_name": project_name,
        "label": f"Abrir versiones de {project_name}",
        "description": "Necesito elegir una version antes de abrir esa seccion.",
        "auto_execute": _looks_like_navigation_request(query),
    }


def _build_structured_context_reply(query: str, page_context: Any) -> Optional[str]:
    normalized = _normalize_text(query)
    plm_state = _get_page_plm_state(page_context)
    current_project = plm_state.get("current_project") if isinstance(plm_state.get("current_project"), dict) else {}
    project_name = str(current_project.get("name") or "").strip()
    versions = _normalize_project_versions(plm_state.get("versions"))

    wants_versions_list = (
        "que versiones tiene" in normalized
        or "que version tiene" in normalized
        or "cuantas versiones tiene" in normalized
        or "cuales son las versiones" in normalized
        or "ver versiones" in normalized
        or "lista de versiones" in normalized
    )

    if wants_versions_list and project_name:
        if not versions:
            return f"No veo versiones cargadas para {project_name} en la vista actual."

        version_labels = []
        for version in versions[:6]:
            name = str(version.get("name") or version.get("id") or "").strip()
            revision = str(version.get("revision") or "").strip()
            if revision:
                version_labels.append(f"{name} rev. {revision}")
            else:
                version_labels.append(name)

        if len(versions) == 1:
            return f"{project_name} tiene 1 version: {version_labels[0]}."
        return f"{project_name} tiene {len(versions)} versiones: {', '.join(version_labels)}."

    return None


def _search_cotizaciones(records_file: str, query: str, limit: int = 5) -> list[dict]:
    store = _load_cotizacion_store(records_file)
    tokens = _tokenize_query(query)
    if not tokens:
        return []

    matches = []
    for raw_group in store.get("groups", []):
        group = _summarize_cotizacion_group(raw_group)
        searchable = " | ".join([
            group.get("id", ""),
            group.get("save_name", ""),
            group.get("save_description", ""),
            group.get("folder", ""),
            group.get("author", ""),
        ])
        score = _score_text_match(searchable, tokens, query)
        if score <= 0:
            continue
        group["score"] = score
        matches.append(group)

    matches.sort(
        key=lambda item: (
            int(item.get("score") or 0),
            int(item.get("version_count") or 0),
            str(item.get("modified_at") or ""),
        ),
        reverse=True,
    )
    return matches[:limit]


def _search_cotizacion_folders(records_file: str, query: str, limit: int = 5) -> list[dict]:
    store = _load_cotizacion_store(records_file)
    tokens = _tokenize_query(query)
    if not tokens:
        return []

    folders = []
    for folder in store.get("folders", []):
        folder_name = str(folder or "").strip()
        if not folder_name:
            continue
        score = _score_text_match(folder_name, tokens, query)
        if score <= 0:
            continue
        folders.append({"folder": folder_name, "score": score})

    folders.sort(key=lambda item: (int(item.get("score") or 0), item.get("folder", "")), reverse=True)
    return folders[:limit]


def _search_related_files(base_dir: Union[str, Path], query: str, limit: int = 12) -> list[dict]:
    tokens = _tokenize_query(query)
    if not tokens:
        return []

    base_path = Path(base_dir)
    roots = [
        base_path / "Codigos",
        base_path / "Datos",
        base_path / "Registro de Proyectos",
        base_path / "P1 - Registros Solicitados",
        base_path / "P2 - Purchase Order",
        base_path / "P3 - Panel de Control",
    ]
    allowed_ext = {".json", ".csv", ".xlsx", ".xlsm", ".pdf", ".py", ".bat", ".md", ".txt"}

    matches = []
    for root in roots:
        if not root.exists():
            continue
        try:
            for path in root.rglob("*"):
                if not path.is_file():
                    continue
                if path.suffix.lower() not in allowed_ext:
                    continue
                rel = path.relative_to(base_path)
                rel_text = rel.as_posix()
                score = _score_text_match(rel_text, tokens, query)
                if score <= 0:
                    continue
                matches.append({
                    "path": rel_text,
                    "name": path.name,
                    "suffix": path.suffix.lower(),
                    "score": score,
                })
                if len(matches) >= limit * 4:
                    break
        except Exception:
            continue
        if len(matches) >= limit * 4:
            break

    matches.sort(key=lambda item: (int(item.get("score") or 0), item.get("path", "")), reverse=True)
    return matches[:limit]


def _detect_view_action(query: str) -> Optional[dict]:
    normalized = _normalize_text(query)
    query_tokens = set(_tokenize_query(query))
    best_match = None
    best_score = 0

    for view in _VIEW_CATALOG:
        score = 0
        for alias in view.get("aliases", []):
            alias_norm = _normalize_text(alias)
            if not alias_norm:
                continue
            alias_tokens = [token for token in re.findall(r"[a-z0-9_-]+", alias_norm) if token]
            if alias_norm in normalized:
                score += 12 + (len(alias_tokens) * 6)
                if normalized.startswith(alias_norm):
                    score += 4
            elif alias_tokens and all(token in query_tokens for token in alias_tokens):
                score += 4 + (len(alias_tokens) * 2)
        if score > best_score:
            best_score = score
            best_match = view

    if not best_match or best_score <= 0:
        return None

    return {
        "type": "navigate_view",
        "view": best_match["id"],
        "label": f"Ir a {best_match['label']}",
        "description": best_match["description"],
        "auto_execute": _looks_like_navigation_request(query),
    }


def _get_latest_cotizacion(records_file: str) -> Optional[dict]:
    store = _load_cotizacion_store(records_file)
    groups = [_summarize_cotizacion_group(item) for item in store.get("groups", [])]
    if not groups:
        return None
    groups.sort(
        key=lambda item: (
            str(item.get("modified_at") or ""),
            int(item.get("version_count") or 0),
        ),
        reverse=True,
    )
    return groups[0]


def _detect_actions(query: str, records_file: str, projects_file: str = "", page_context: Any = None) -> dict:
    normalized = _normalize_text(query)
    cotizacion_matches = _search_cotizaciones(records_file, query)
    folder_matches = _search_cotizacion_folders(records_file, query)
    project_matches = _search_projects(projects_file, query) if projects_file else []
    actions = []

    contextual_project_action = _detect_contextual_project_action(
        query,
        page_context=page_context,
        projects_file=projects_file,
        project_matches=project_matches,
    ) if projects_file else None
    if contextual_project_action:
        actions.append(contextual_project_action)

    wants_versions = "version" in normalized or "versiones" in normalized

    if actions:
        pass
    elif any(term in normalized for term in ("cotizacion", "presupuesto", "presupuestos")):
        wants_latest = any(term in normalized for term in ("mas reciente", "ultima", "ultimo", "reciente"))
        if wants_latest and not cotizacion_matches:
            latest = _get_latest_cotizacion(records_file)
            if latest:
                cotizacion_matches = [latest]
        if cotizacion_matches:
            top = cotizacion_matches[0]
            actions.append({
                "type": "open_cotizacion_record",
                "record_id": top["id"],
                "record_name": top.get("save_name") or top["id"],
                "folder": top.get("folder") or "Sin Carpeta",
                "label": f"Abrir cotización {top.get('save_name') or top['id']}",
                "description": f"{top.get('folder') or 'Sin Carpeta'} | v{top.get('latest_version') or 1}",
                "auto_execute": _looks_like_navigation_request(query),
            })
        elif folder_matches:
            top_folder = folder_matches[0]
            actions.append({
                "type": "open_cotizacion_folder",
                "folder": top_folder["folder"],
                "label": f"Abrir carpeta {top_folder['folder']}",
                "description": "Abrir carpeta dentro de registros de cotización.",
                "auto_execute": _looks_like_navigation_request(query),
            })
        else:
            actions.append({
                "type": "navigate_view",
                "view": "cotizacion-records",
                "label": "Ir a registros de cotización",
                "description": "Abrir el listado de cotizaciones guardadas.",
                "auto_execute": _looks_like_navigation_request(query),
            })
    elif (
        "proyecto" in normalized
        or "proyectos" in normalized
        or "plm" in normalized
        or (project_matches and wants_versions)
    ):
        if project_matches:
            top_project = project_matches[0]
            actions.append({
                "type": "open_project_versions" if wants_versions else "open_project_workspace",
                "project_id": top_project["id"],
                "project_name": top_project["name"] or top_project["id"],
                "label": (
                    f"Abrir versiones de {top_project['name'] or top_project['id']}"
                    if wants_versions else
                    f"Abrir proyecto {top_project['name'] or top_project['id']}"
                ),
                "description": top_project.get("description") or "Proyecto",
                "auto_execute": _looks_like_navigation_request(query),
            })
        else:
            actions.append({
                "type": "navigate_view",
                "view": "projects",
                "label": "Ir a Proyectos",
                "description": "Abrir el modulo de proyectos.",
                "auto_execute": _looks_like_navigation_request(query),
            })
    else:
        if folder_matches:
            top_folder = folder_matches[0]
            actions.append({
                "type": "open_cotizacion_folder",
                "folder": top_folder["folder"],
                "label": f"Abrir carpeta {top_folder['folder']}",
                "description": "Abrir carpeta dentro de registros de cotización.",
                "auto_execute": _looks_like_navigation_request(query),
            })
        view_action = _detect_view_action(query)
        if view_action and not actions:
            actions.append(view_action)

    return {
        "actions": actions[:3],
        "cotizacion_matches": cotizacion_matches,
        "folder_matches": folder_matches,
        "project_matches": project_matches,
    }


def _call_anthropic(messages: list[dict], system_prompt: str, model: str, api_key: str) -> str:
    payload = {
        "model": model,
        "max_tokens": 420,
        "system": system_prompt,
        "messages": [{"role": item["role"], "content": item["content"]} for item in messages],
    }

    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        ANTHROPIC_API_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": ANTHROPIC_VERSION,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            detail = exc.read().decode("utf-8", errors="replace")
        except Exception:
            detail = str(exc)
        raise RuntimeError(f"Anthropic HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"No se pudo conectar con Anthropic: {exc.reason}") from exc

    text_parts = []
    for block in raw.get("content", []):
        if isinstance(block, dict) and block.get("type") == "text":
            text_parts.append(str(block.get("text") or ""))
    return "\n".join(part for part in text_parts if part).strip()


def _extract_json_object(text: str) -> Optional[str]:
    raw = str(text or "").strip()
    if not raw:
        return None

    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw, flags=re.IGNORECASE)
    if fenced:
        raw = fenced.group(1).strip()

    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end < 0 or end <= start:
        return None
    return raw[start:end + 1]


def _call_anthropic_json(messages: list[dict], system_prompt: str, model: str, api_key: str) -> Optional[dict]:
    text = _call_anthropic(messages, system_prompt, model, api_key)
    payload = _extract_json_object(text)
    if not payload:
        return None
    try:
        data = json.loads(payload)
    except Exception:
        return None
    return data if isinstance(data, dict) else None


def _dedupe_candidates(items: list[dict], key: str) -> list[dict]:
    seen = set()
    result = []
    for item in items:
        if not isinstance(item, dict):
            continue
        value = str(item.get(key) or "").strip()
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(item)
    return result


def _build_planner_context(
    *,
    page_context: Any,
    action_data: dict,
    messages: list[dict],
    records_file: str,
    projects_file: str,
) -> dict:
    plm_state = _get_page_plm_state(page_context)
    current_project = plm_state.get("current_project") if isinstance(plm_state.get("current_project"), dict) else {}
    current_project_id = str(current_project.get("id") or "").strip()
    current_project_name = str(current_project.get("name") or "").strip()
    current_versions = _get_project_versions_from_context(page_context, projects_file, current_project_id) if current_project_id else []
    history_text = "\n".join(item.get("content", "") for item in _trim_messages(messages, limit=12))
    history_project_matches = _search_projects(projects_file, history_text, limit=5) if history_text else []
    history_folder_matches = _search_cotizacion_folders(records_file, history_text, limit=5) if history_text else []
    history_cotizacion_matches = _search_cotizaciones(records_file, history_text, limit=5) if history_text else []

    project_candidates = []
    if current_project_id:
        project_candidates.append({
            "id": current_project_id,
            "name": current_project_name or current_project_id,
            "description": str(current_project.get("description") or "").strip(),
            "source": "current_page",
        })

    for item in action_data.get("project_matches", []):
        project_candidates.append({
            "id": str(item.get("id") or "").strip(),
            "name": str(item.get("name") or "").strip(),
            "description": str(item.get("description") or "").strip(),
            "source": "query_match",
        })
    for item in history_project_matches:
        project_candidates.append({
            "id": str(item.get("id") or "").strip(),
            "name": str(item.get("name") or "").strip(),
            "description": str(item.get("description") or "").strip(),
            "source": "history_match",
        })

    cotizacion_candidates = []
    for item in action_data.get("cotizacion_matches", []):
        cotizacion_candidates.append({
            "id": str(item.get("id") or "").strip(),
            "name": str(item.get("save_name") or item.get("id") or "").strip(),
            "folder": str(item.get("folder") or "Sin Carpeta").strip(),
            "latest_version": int(item.get("latest_version") or 1),
        })
    for item in history_cotizacion_matches:
        cotizacion_candidates.append({
            "id": str(item.get("id") or "").strip(),
            "name": str(item.get("save_name") or item.get("id") or "").strip(),
            "folder": str(item.get("folder") or "Sin Carpeta").strip(),
            "latest_version": int(item.get("latest_version") or 1),
        })

    folder_candidates = []
    for item in action_data.get("folder_matches", []):
        folder_name = str(item.get("folder") or "").strip()
        if folder_name:
            folder_candidates.append({"folder": folder_name})
    for item in history_folder_matches:
        folder_name = str(item.get("folder") or "").strip()
        if folder_name:
            folder_candidates.append({"folder": folder_name})

    return {
        "current_project": {
            "id": current_project_id,
            "name": current_project_name,
            "selected_version_id": str(plm_state.get("selected_version_id") or "").strip(),
            "context_version_id": str(plm_state.get("context_version_id") or "").strip(),
            "active_version_id": str(plm_state.get("active_version_id") or "").strip(),
            "workspace_mode": str(plm_state.get("workspace_mode") or "").strip(),
            "versions_flow_mode": str(plm_state.get("versions_flow_mode") or "").strip(),
            "active_section": str(plm_state.get("active_section") or "").strip(),
        },
        "project_candidates": _dedupe_candidates(project_candidates, "id")[:10],
        "version_candidates": _dedupe_candidates(current_versions, "id")[:12],
        "cotizacion_candidates": _dedupe_candidates(cotizacion_candidates, "id")[:10],
        "folder_candidates": _dedupe_candidates(folder_candidates, "folder")[:10],
        "view_candidates": [
            {
                "id": item["id"],
                "label": item["label"],
                "description": item["description"],
            }
            for item in _VIEW_CATALOG
        ],
    }


def _resolve_planner_project_id(raw_value: Any, planner_context: dict) -> str:
    requested = str(raw_value or "").strip()
    current_project = planner_context.get("current_project", {})
    current_project_id = str(current_project.get("id") or "").strip()
    candidates = planner_context.get("project_candidates", [])
    if requested.lower() in {"current", "current_project", "actual", "activo"} and current_project_id:
        return current_project_id
    if requested:
        for item in candidates:
            if str(item.get("id") or "").strip() == requested:
                return requested
    if current_project_id:
        return current_project_id
    if len(candidates) == 1:
        return str(candidates[0].get("id") or "").strip()
    return requested


def _resolve_planner_version_id(raw_value: Any, planner_context: dict) -> str:
    requested = str(raw_value or "").strip()
    current_project = planner_context.get("current_project", {})
    version_candidates = planner_context.get("version_candidates", [])
    current_ids = [
        str(current_project.get("selected_version_id") or "").strip(),
        str(current_project.get("context_version_id") or "").strip(),
        str(current_project.get("active_version_id") or "").strip(),
    ]

    if requested.lower() in {"current", "current_version", "actual", "activa", "abierta"}:
        for value in current_ids:
            if value:
                return value

    if requested:
        for item in version_candidates:
            if str(item.get("id") or "").strip() == requested:
                return requested

    for value in current_ids:
        if value:
            return value
    if len(version_candidates) == 1:
        return str(version_candidates[0].get("id") or "").strip()
    return requested


def _resolve_planner_version_name(version_id: str, planner_context: dict) -> str:
    target = str(version_id or "").strip()
    if not target:
        return ""
    for item in planner_context.get("version_candidates", []):
        if str(item.get("id") or "").strip() == target:
            return str(item.get("name") or target).strip()
    return target


def _resolve_planner_project_name(project_id: str, planner_context: dict) -> str:
    target = str(project_id or "").strip()
    if not target:
        return ""
    for item in planner_context.get("project_candidates", []):
        if str(item.get("id") or "").strip() == target:
            return str(item.get("name") or target).strip()
    current_project = planner_context.get("current_project", {})
    if str(current_project.get("id") or "").strip() == target:
        return str(current_project.get("name") or target).strip()
    return target


def _normalize_planner_actions(plan_actions: Any, planner_context: dict, query: str) -> list[dict]:
    if not isinstance(plan_actions, list):
        return []

    auto_execute_default = _looks_like_navigation_request(query)
    normalized_actions = []

    cotizacion_by_id = {
        str(item.get("id") or "").strip(): item
        for item in planner_context.get("cotizacion_candidates", [])
        if str(item.get("id") or "").strip()
    }
    folders = {
        str(item.get("folder") or "").strip()
        for item in planner_context.get("folder_candidates", [])
        if str(item.get("folder") or "").strip()
    }
    views = {
        str(item.get("id") or "").strip(): item
        for item in planner_context.get("view_candidates", [])
        if str(item.get("id") or "").strip()
    }

    for raw_action in plan_actions[:3]:
        if not isinstance(raw_action, dict):
            continue
        action_type = str(raw_action.get("type") or "").strip()
        auto_execute = bool(raw_action.get("auto_execute")) if "auto_execute" in raw_action else auto_execute_default

        if action_type == "navigate_view":
            view_id = str(raw_action.get("view") or "").strip()
            view = views.get(view_id)
            if not view:
                continue
            normalized_actions.append({
                "type": "navigate_view",
                "view": view_id,
                "label": f"Ir a {view['label']}",
                "description": view["description"],
                "auto_execute": auto_execute,
            })
            continue

        if action_type == "open_cotizacion_record":
            record_id = str(raw_action.get("record_id") or "").strip()
            match = cotizacion_by_id.get(record_id)
            if not match:
                continue
            normalized_actions.append({
                "type": "open_cotizacion_record",
                "record_id": record_id,
                "record_name": match.get("name") or record_id,
                "folder": match.get("folder") or "Sin Carpeta",
                "label": f"Abrir cotización {match.get('name') or record_id}",
                "description": f"{match.get('folder') or 'Sin Carpeta'} | v{match.get('latest_version') or 1}",
                "auto_execute": auto_execute,
            })
            continue

        if action_type == "open_cotizacion_folder":
            folder = str(raw_action.get("folder") or "").strip()
            if folder not in folders:
                continue
            normalized_actions.append({
                "type": "open_cotizacion_folder",
                "folder": folder,
                "label": f"Abrir carpeta {folder}",
                "description": "Abrir carpeta dentro de registros de cotización.",
                "auto_execute": auto_execute,
            })
            continue

        if action_type in {"open_project_workspace", "open_project_versions"}:
            project_id = _resolve_planner_project_id(raw_action.get("project_id"), planner_context)
            if not project_id:
                continue
            project_name = _resolve_planner_project_name(project_id, planner_context)
            wants_versions = action_type == "open_project_versions"
            normalized_actions.append({
                "type": action_type,
                "project_id": project_id,
                "project_name": project_name or project_id,
                "label": (
                    f"Abrir versiones de {project_name or project_id}"
                    if wants_versions else
                    f"Abrir proyecto {project_name or project_id}"
                ),
                "description": "Proyecto",
                "auto_execute": auto_execute,
            })
            continue

        if action_type == "open_project_section":
            section = str(raw_action.get("section") or "").strip().lower()
            if section not in {"bom", "bitacora"}:
                continue
            project_id = _resolve_planner_project_id(raw_action.get("project_id"), planner_context)
            if not project_id:
                continue
            project_name = _resolve_planner_project_name(project_id, planner_context)
            section_label = "BOM" if section == "bom" else "Bitacora"
            normalized_actions.append({
                "type": "open_project_section",
                "project_id": project_id,
                "project_name": project_name or project_id,
                "section": section,
                "label": f"Abrir {section_label} de {project_name or project_id}",
                "description": "Proyecto",
                "auto_execute": auto_execute,
            })
            continue

        if action_type == "open_project_version_section":
            section = str(raw_action.get("section") or "").strip().lower()
            if section not in {"bom", "bitacora", "values"}:
                continue
            project_id = _resolve_planner_project_id(raw_action.get("project_id"), planner_context)
            version_id = _resolve_planner_version_id(raw_action.get("version_id"), planner_context)
            if not project_id:
                continue
            project_name = _resolve_planner_project_name(project_id, planner_context)
            version_name = _resolve_planner_version_name(version_id, planner_context)
            normalized_actions.append(_make_project_version_section_action(
                project_id=project_id,
                project_name=project_name or project_id,
                version_id=version_id,
                version_name=version_name or version_id,
                section=section,
                auto_execute=auto_execute,
            ))

    return normalized_actions


def _plan_with_llm(
    *,
    query: str,
    messages: list[dict],
    page_context: Any,
    action_data: dict,
    records_file: str,
    projects_file: str,
    api_key: str,
) -> Optional[dict]:
    planner_context = _build_planner_context(
        page_context=page_context,
        action_data=action_data,
        messages=messages,
        records_file=records_file,
        projects_file=projects_file,
    )
    system_prompt = (
        "Eres el planificador de acciones del chatbot interno de BPB Group.\n"
        "Debes interpretar lenguaje natural, referencias contextuales y seguimiento conversacional.\n"
        "Ejemplos de referencias: 'eso', 'esa version', 'la otra', 'ahi', 'lo que acabamos de abrir'.\n"
        "Si el usuario pide mostrar, abrir, llevar, navegar o ver algo, debes devolver acciones concretas.\n"
        "No expliques como llegar si puedes devolver una accion.\n"
        "Devuelve SOLO JSON valido, sin markdown, sin texto extra.\n"
        "Schema:\n"
        "{\n"
        '  "reply": "string corto o vacio",\n'
        '  "actions": [\n'
        "    {\n"
        '      "type": "navigate_view|open_cotizacion_record|open_cotizacion_folder|open_project_workspace|open_project_versions|open_project_section|open_project_version_section",\n'
        '      "view": "view_id opcional",\n'
        '      "record_id": "id opcional",\n'
        '      "folder": "folder opcional",\n'
        '      "project_id": "project_id o current",\n'
        '      "version_id": "version_id o current",\n'
        '      "section": "bom|bitacora|values",\n'
        '      "auto_execute": true\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Reglas:\n"
        "- Usa SOLO ids y vistas presentes en el contexto.\n"
        "- Si el usuario solo pregunta informacion, responde con reply corto y actions vacio.\n"
        "- Si el usuario pregunta por el contenido de una carpeta, cotizacion, proyecto o version y hay una coincidencia clara, puedes responder corto y devolver una accion sugerida aunque no la autoejecutes.\n"
        "- Si el usuario pide navegacion o mostrar algo, prioriza actions y reply vacio.\n"
        "- Si la referencia es ambigua y no puede resolverse de forma segura, responde con una aclaracion corta y sin acciones.\n"
        "- No inventes entidades.\n"
    )

    planner_payload = {
        "query": query,
        "history": _trim_messages(messages),
        "page_context": page_context,
        "planner_context": planner_context,
    }
    llm_messages = [{
        "role": "user",
        "content": json.dumps(planner_payload, ensure_ascii=False, indent=2),
    }]

    plan = _call_anthropic_json(llm_messages, system_prompt, DEFAULT_MODEL, api_key)
    if not plan:
        return None

    reply = str(plan.get("reply") or "").strip()
    actions = _normalize_planner_actions(plan.get("actions"), planner_context, query)
    if not reply and not actions:
        return None

    return {
        "status": "ok",
        "response": reply,
        "actions": actions,
    }


def build_chatbot_response(
    payload: dict,
    *,
    base_dir: Union[str, Path],
    cotizacion_records_file: str,
    projects_file: str = "",
    user_email: str = "",
    user_role: str = "",
) -> dict:
    messages = payload.get("messages", [])
    page_context = payload.get("page_context") or {}
    query = _extract_last_user_message(messages)
    if not query:
        return {
            "status": "error",
            "response": "No recibi ningun mensaje para procesar.",
            "actions": [],
        }

    action_data = _detect_actions(
        query,
        cotizacion_records_file,
        projects_file=projects_file,
        page_context=page_context,
    )
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if api_key:
        try:
            llm_plan = _plan_with_llm(
                query=query,
                messages=messages,
                page_context=page_context,
                action_data=action_data,
                records_file=cotizacion_records_file,
                projects_file=projects_file,
                api_key=api_key,
            )
        except Exception:
            llm_plan = None
        if llm_plan:
            if not llm_plan.get("actions") and action_data.get("actions"):
                llm_plan["actions"] = action_data.get("actions", [])[:3]
            return llm_plan

    actions = action_data.get("actions", [])
    file_matches = _search_related_files(base_dir, query) if _looks_like_file_request(query) else []
    auto_actions = [item for item in actions if bool(item.get("auto_execute"))]
    structured_reply = _build_structured_context_reply(query, page_context)

    if auto_actions:
        return {
            "status": "ok",
            "response": "",
            "actions": actions,
        }

    if structured_reply and not actions:
        return {
            "status": "ok",
            "response": structured_reply,
            "actions": [],
        }

    context_summary = {
        "usuario": {
            "email": user_email,
            "rol": user_role,
        },
        "pagina_actual": page_context,
        "vistas_disponibles": [
            {
                "id": item["id"],
                "label": item["label"],
                "description": item["description"],
            }
            for item in _VIEW_CATALOG
        ],
        "cotizaciones_relacionadas": [
            {
                "id": item.get("id", ""),
                "nombre": item.get("save_name", ""),
                "descripcion": item.get("save_description", ""),
                "carpeta": item.get("folder", ""),
                "versiones": item.get("version_count", 0),
                "ultima_version": item.get("latest_version", 1),
            }
            for item in action_data.get("cotizacion_matches", [])
        ],
        "carpetas_cotizacion_relacionadas": [
            item.get("folder", "") for item in action_data.get("folder_matches", [])
        ],
        "archivos_relacionados": file_matches,
        "proyectos_relacionados": action_data.get("project_matches", []),
        "acciones_sugeridas": actions,
    }

    fallback_response = None
    if actions:
        first_action = actions[0]
        if first_action["type"] == "open_cotizacion_record":
            fallback_response = (
                f"Encontre una cotizacion que coincide con tu pedido: "
                f"**{first_action.get('record_name') or first_action.get('record_id')}**. "
                f"{'La voy a abrir ahora.' if first_action.get('auto_execute') else 'Puedo abrirla desde el boton de accion.'}"
            )
        elif first_action["type"] == "open_cotizacion_folder":
            fallback_response = (
                f"Encontre la carpeta **{first_action.get('folder')}** dentro de cotizaciones. "
                f"{'La voy a abrir ahora.' if first_action.get('auto_execute') else 'Puedo abrirla desde el boton de accion.'}"
            )
        elif first_action["type"] == "navigate_view":
            fallback_response = (
                f"Puedo llevarte a **{first_action.get('label', '').replace('Ir a ', '')}**. "
                f"{'Voy para alla ahora.' if first_action.get('auto_execute') else 'Usa el boton de accion si queres abrirlo.'}"
            )
        elif first_action["type"] == "open_project_workspace":
            fallback_response = (
                f"Encontre el proyecto **{first_action.get('project_name') or first_action.get('project_id')}**. "
                f"{'Lo abro ahora.' if first_action.get('auto_execute') else 'Puedo abrirlo desde el boton de accion.'}"
            )
        elif first_action["type"] == "open_project_versions":
            fallback_response = (
                f"Encontre el proyecto **{first_action.get('project_name') or first_action.get('project_id')}**. "
                f"{'Abro sus versiones ahora.' if first_action.get('auto_execute') else 'Puedo abrir la seccion de versiones desde el boton de accion.'}"
            )
        elif first_action["type"] == "open_project_section":
            fallback_response = (
                f"Puedo abrir **{str(first_action.get('section') or '').upper()}** del proyecto "
                f"**{first_action.get('project_name') or first_action.get('project_id')}**. "
                f"{'Voy ahora.' if first_action.get('auto_execute') else 'Puedo abrirlo desde el boton de accion.'}"
            )
        elif first_action["type"] == "open_project_version_section":
            fallback_response = (
                f"Puedo abrir **{str(first_action.get('section') or '').upper()}** de "
                f"**{first_action.get('version_name') or first_action.get('version_id')}**. "
                f"{'Voy ahora.' if first_action.get('auto_execute') else 'Puedo abrirlo desde el boton de accion.'}"
            )

    if not api_key:
        return {
            "status": "ok",
            "response": fallback_response or (
                "El chatbot ya esta integrado a la pagina, pero para responder preguntas abiertas necesita "
                "configurar la variable de entorno `ANTHROPIC_API_KEY` en el servidor."
            ),
            "actions": actions,
        }

    system_prompt = (
        "Eres el asistente embebido del dashboard interno de BPB Group.\n"
        "Objetivos:\n"
        "1. Responder preguntas sobre la pantalla actual y los modulos del sistema.\n"
        "2. Explicar de forma clara que hace cada vista o archivo relacionado.\n"
        "3. Si hay acciones sugeridas, mencionarlas sin inventar otras.\n"
        "4. Si la informacion no esta en el contexto, dilo explicitamente.\n\n"
        "Reglas:\n"
        "- Responde siempre en espanol.\n"
        "- Se muy conciso y practico.\n"
        "- Prioriza respuestas cortas: idealmente 1 a 3 oraciones y menos de 70 palabras.\n"
        "- No des contexto extra ni explicaciones largas si el usuario no las pidio.\n"
        "- Evita listas largas salvo que el usuario pida opciones o pasos.\n"
        "- Si puedes resolver con una accion de navegacion, dilo en pocas palabras.\n"
        "- No inventes IDs, rutas ni registros.\n"
        "- Si hay varias coincidencias de cotizacion, aclara la ambiguedad.\n"
    )

    context_block = json.dumps(context_summary, ensure_ascii=False, indent=2)
    llm_messages = _trim_messages(messages)
    llm_messages.append({
        "role": "user",
        "content": (
            "Contexto estructurado del dashboard:\n"
            f"{context_block}\n\n"
            "Responde la consulta del usuario usando solo este contexto y el historial."
        ),
    })

    try:
        response_text = _call_anthropic(llm_messages, system_prompt, DEFAULT_MODEL, api_key)
    except Exception as exc:
        response_text = fallback_response or f"No pude consultar el modelo de Claude: {exc}"

    return {
        "status": "ok",
        "response": response_text,
        "actions": actions,
    }
