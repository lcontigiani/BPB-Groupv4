---
title: Sistema de IA — Arquitectura BPB
tags: [IA, Claude, sistema, arquitectura, agentes, knowledge base]
updated: 2026-04-13
status: 🟡 en implementación
summary: Descripción de la arquitectura del sistema de IA corporativo de BPB Argentina
owner: Lorenzo Contigiani
---

# Sistema de IA Corporativo — BPB Argentina

## Estado: En implementación (Fase 1 — Abril 2026)

## Las 4 Capas del Sistema

```
Capa 4: AGENTES AUTÓNOMOS
  → Auditor KB, Compilador, Reporter, Seguridad, Optimizador
Capa 3: CONNECTORS
  → Bitrix24 MCP Server, Microsoft 365
Capa 2: CLAUDE.md CORPORATIVO
  → Identidad, reglas, procesos, tono
Capa 1: KNOWLEDGE BASE (este vault)
  → wiki/, raw/, templates/
```

## Plan de Implementación

| Fase | Duración | Estado |
|------|----------|--------|
| Fase 1: Fundamentos | Semana 1-2 | 🔄 En curso |
| Fase 2: Contenido | Semana 3-4 | ⏳ Pendiente |
| Fase 3: Automatización | Semana 5-6 | ⏳ Pendiente |
| Fase 4: Optimización | Semana 7-8 | ⏳ Pendiente |

## Usuarios

- **Usuarios activos:** ~10 personas del equipo
- **Plan:** Claude Teams

## Agentes Programados (Fase 3)

| Agente | Frecuencia | Función |
|--------|-----------|---------|
| Auditor KB | Diario L-V 7:00 | Detecta problemas en el wiki |
| Compilador | Diario L-V 8:00 | Procesa fuentes nuevas en raw/ |
| Reporter | Lunes 9:00 | Genera reporte semanal |
| Seguridad | Miércoles 6:00 | Audita vulnerabilidades |
| Optimizador | Quincenal | Mejora el sistema |

## Relacionados

- [Herramientas](./herramientas.md)
- Ver carpeta: `Instrucciones de Claude/13-Arquitectura-Sistema-BPB.md`
