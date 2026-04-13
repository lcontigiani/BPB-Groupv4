# 13 — Arquitectura del Sistema BPB Argentina (v2 — con claude-mem)

> **Actualización v2:** Integra memoria persistente claude-mem en todas las capas  
> **Fecha:** Abril 2026

---

## Visión General: 5 Capas (actualizado)

```
┌──────────────────────────────────────────────────────────────────┐
│                    CAPA 5 (NUEVA): MEMORIA                       │
│          claude-mem v6.5.0 — Persistencia entre sesiones         │
│   SQLite + Chroma │ localhost:37777 │ Hooks automáticos          │
└────────────────────────────┬─────────────────────────────────────┘
                             │ inyecta contexto
┌────────────────────────────▼─────────────────────────────────────┐
│                      CAPA 4: AGENTES                             │
│              Sistema Multi-Agente Autónomo                       │
│   Auditor │ Compilador │ Reporter │ Seguridad │ Optimizador      │
└────────────────────────────┬─────────────────────────────────────┘
                             │ lee/escribe
┌────────────────────────────▼─────────────────────────────────────┐
│                   CAPA 3: CONNECTORS                             │
│              Bitrix24 MCP │ Microsoft 365                        │
│         (datos en tiempo real desde sistemas corporativos)       │
└────────────────────────────┬─────────────────────────────────────┘
                             │ estructura
┌────────────────────────────▼─────────────────────────────────────┐
│                   CAPA 2: CLAUDE.MD                              │
│             Instrucciones corporativas permanentes               │
│    Identidad BPB │ Herramientas │ Reglas │ Navegación KB        │
└────────────────────────────┬─────────────────────────────────────┘
                             │ alimenta
┌────────────────────────────▼─────────────────────────────────────┐
│                CAPA 1: KNOWLEDGE BASE                            │
│                   BPB-Knowledge-Base/                            │
│      raw/ (fuentes) │ wiki/ (páginas LLM) │ templates/          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Capa 5 (Nueva): Memoria Persistente — claude-mem

### ¿Por qué es necesaria?

Sin memoria persistente, cada sesión de Claude comienza desde cero. En una empresa como BPB, esto significa:
- Re-explicar el contexto cada vez que se usa Claude
- Re-descubrir configuraciones y decisiones ya tomadas
- Los agentes autónomos no aprenden de sesiones anteriores
- Duplicación de trabajo entre sesiones

claude-mem resuelve esto con compresión automática de contexto entre sesiones.

### Configuración para BPB

```bash
# Instalación (una vez)
cd BPB-Knowledge-Base
npx claude-mem install

# Proyecto dedicado BPB
# claude-mem crea automáticamente el proyecto al primer uso con:
# --project bpb-argentina
```

**Hooks en `.claude/settings.json`:**
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "npx claude-mem inject --project bpb-argentina --limit 50"
      }]
    }],
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "npx claude-mem compile --project bpb-argentina"
      }]
    }]
  }
}
```

### Flujo de Búsqueda en Memoria (3 capas)

```
1. search()         → Índice compacto (50-100 tokens/resultado)
2. timeline()       → Contexto alrededor del resultado
3. get_observations([ids]) → Detalles completos solo de relevantes
Resultado: ahorro de ~10x tokens vs leer todo
```

---

## Configuración Bitrix24 MCP

```json
{
  "mcpServers": {
    "bitrix24": {
      "command": "npx",
      "args": ["-y", "bitrix24-mcp-server"],
      "env": {
        "BITRIX24_WEBHOOK_URL": "https://[DOMINIO].bitrix24.com/rest/[ID]/[TOKEN]/"
      }
    }
  }
}
```

> **Pendiente:** Obtener webhook URL de la cuenta Bitrix24 de BPB

### Herramientas disponibles vía Bitrix24 MCP:
- Gestión de CRM (leads, deals, contactos, empresas)
- Tareas y proyectos
- Comunicaciones internas (mensajes, canales)
- Actividades y calendar

---

## Plan de Implementación (actualizado — 8 semanas)

### Fase 1 — Semanas 1-2: Fundación
- [x] Crear BPB-Knowledge-Base con estructura completa
- [x] Crear CLAUDE.md corporativo
- [ ] Configurar Bitrix24 MCP (necesita webhook URL)
- [ ] Instalar claude-mem y configurar hooks
- [ ] Poblar wiki/ con datos del export de Bitrix24

### Fase 2 — Semanas 3-4: Memoria y Conocimiento
- [ ] Activar claude-mem: SessionStart + Stop hooks
- [ ] Crear Knowledge Agents para: clientes, propuestas, soporte
- [ ] Completar CLAUDE.md con instrucciones de mem-search
- [ ] Primeras 2 semanas de acumulación de observaciones

### Fase 3 — Semanas 5-6: Agentes Autónomos
- [ ] Activar Agente Auditor KB (diario, con mem-search integrado)
- [ ] Activar Agente Compilador (diario, con timeline context)
- [ ] Activar Agente Reporter (semanal, con knowledge-agent)
- [ ] Configurar scheduled tasks para los 6 agentes

### Fase 4 — Semanas 7-8: Optimización
- [ ] Activar Agente Seguridad y Optimizador (biweekly)
- [ ] Primer timeline-report del proyecto bpb-argentina
- [ ] Evaluar ROI: tokens ahorrados vs invertidos
- [ ] Ajustar límites y parámetros según uso real
- [ ] Documentar lecciones aprendidas en wiki/tecnologia/

---

## Estimación de Costos (Plan Teams)

| Componente | Tokens/mes estimado | Costo aprox. |
|------------|--------------------|----|
| 10 usuarios × uso moderado | ~2M tokens | Base plan Teams |
| 6 agentes autónomos | ~1M tokens | Incluido |
| **Con claude-mem (ahorro ~76%)** | **~720K tokens** | **Reducción significativa** |

---

## Referencias Rápidas

| Recurso | URL/Comando |
|---------|-------------|
| KB Repository | https://github.com/lcontigiani/BPB-Groupv4 |
| claude-mem | https://github.com/thedotmack/claude-mem |
| Bitrix24 MCP | https://github.com/gunnit/bitrix24-mcp-server |
| Web viewer memoria | http://localhost:37777 |
| DB memoria | `~/.claude-mem/claude-mem.db` |
