# Arquitectura del Sistema de IA — BPB Argentina

## Visión General

Construir un sistema de inteligencia artificial corporativo para BPB Argentina que funcione como el cerebro digital de la empresa: acumula conocimiento, ejecuta tareas, mejora continuamente de forma autónoma, y está conectado a todas las herramientas del equipo.

## Stack Tecnológico de BPB

| Herramienta | Uso |
|-------------|-----|
| **Bitrix24** | Comunicaciones internas, CRM, gestión de proyectos |
| **Microsoft 365** | Outlook, Teams, OneDrive, Word, Excel |
| **Archivos** | PDF, Excel (.xlsx), Word (.docx), JSON, CSV |
| **Claude Teams** | Plataforma de IA (plan a contratar) |

---

## Las 4 Capas del Sistema

```
┌─────────────────────────────────────────────────────┐
│          CAPA 4: SISTEMA MULTI-AGENTE AUTÓNOMO      │
│  Agentes que auditan, mejoran, reportan, automatizan │
├─────────────────────────────────────────────────────┤
│          CAPA 3: CONNECTORS Y HERRAMIENTAS          │
│  Bitrix24 · Microsoft 365 · Archivos · APIs          │
├─────────────────────────────────────────────────────┤
│          CAPA 2: CLAUDE.md CORPORATIVO              │
│  Identidad · Reglas · Procesos · Tono · Permisos     │
├─────────────────────────────────────────────────────┤
│          CAPA 1: KNOWLEDGE BASE EMPRESARIAL         │
│  Wiki · Documentos · Procesos · Clientes · Historial │
└─────────────────────────────────────────────────────┘
```

---

## CAPA 1: Knowledge Base Empresarial

**Objetivo:** Que Claude tenga acceso a TODO el conocimiento de la empresa, estructurado y actualizado.

### Estructura del Vault

```
BPB-Knowledge-Base/
├── CLAUDE.md                    ← Instrucciones corporativas
├── wiki/
│   ├── index.md                 ← Índice maestro
│   ├── hot.md                   ← Contexto reciente (últimas decisiones, cambios)
│   ├── empresa/
│   │   ├── quienes-somos.md
│   │   ├── estructura-organizacional.md
│   │   ├── politicas-internas.md
│   │   └── contactos-clave.md
│   ├── clientes/
│   │   ├── index-clientes.md
│   │   └── [cliente-por-cliente].md
│   ├── procesos/
│   │   ├── proceso-ventas.md
│   │   ├── proceso-facturacion.md
│   │   ├── proceso-onboarding-cliente.md
│   │   ├── proceso-soporte.md
│   │   └── proceso-reclamos.md
│   ├── productos-servicios/
│   │   ├── catalogo.md
│   │   └── precios-y-condiciones.md
│   ├── legal/
│   │   ├── contratos-tipo.md
│   │   ├── regulaciones.md
│   │   └── compliance.md
│   ├── finanzas/
│   │   ├── estructura-costos.md
│   │   └── metricas-clave.md
│   └── tecnologia/
│       ├── infraestructura.md
│       ├── herramientas.md
│       └── integraciones.md
├── raw/                         ← Fuentes originales (inmutables)
│   ├── contratos/
│   ├── reportes/
│   ├── presentaciones/
│   └── datos/                   ← CSVs, JSONs
└── templates/                   ← Plantillas reutilizables
    ├── email-cliente.md
    ├── propuesta-comercial.md
    ├── reporte-semanal.md
    └── acta-reunion.md
```

### Principios del Knowledge Base
1. **Todo en markdown** — Claude lo lee nativamente, sin conversión
2. **Cada archivo tiene summary + tags** — Para búsqueda rápida sin leer todo
3. **hot.md se actualiza semanalmente** — Las últimas decisiones y cambios
4. **raw/ es inmutable** — Los originales nunca se tocan
5. **wiki/ es generado y mantenido por Claude** — Se actualiza con cada interacción

### Formato de cada página wiki

```markdown
---
title: Proceso de Ventas
tags: [ventas, proceso, comercial, pipeline]
updated: 2026-04-13
summary: Pipeline de ventas de BPB desde prospección hasta cierre
---

# Proceso de Ventas

[Contenido detallado del proceso]
```

→ **Ver archivo 14 para la guía completa del Knowledge Base**

---

## CAPA 2: CLAUDE.md Corporativo

**Objetivo:** Que Claude sepa quién es BPB, cómo trabajar, y qué reglas seguir. Se carga automáticamente en cada sesión.

### Contenido del CLAUDE.md

```markdown
# BPB Argentina — Instrucciones para Claude

## Identidad
Sos el asistente de IA de BPB Argentina. Respondés en español argentino.
Usás "vos" en vez de "tú". Tono profesional pero cercano.

## Herramientas
- Bitrix24: CRM, comunicaciones, tareas
- Microsoft 365: Email (Outlook), documentos, calendario
- Knowledge Base: wiki/ para consultar, raw/ para fuentes originales

## Reglas Inquebrantables
- NUNCA compartir información de clientes fuera del contexto autorizado
- SIEMPRE consultar wiki/ antes de responder sobre procesos internos
- Datos financieros solo para personal autorizado
- No tomar decisiones de negocio, solo recomendar

## Flujo de Trabajo
1. Ante una consulta, primero buscá en wiki/index.md
2. Si no encontrás, buscá en wiki/hot.md
3. Si necesitás más contexto, profundizá en la subcarpeta relevante
4. Si no existe la información, decilo y sugerí agregarla al wiki

## Formatos Preferidos
- Reportes: Word (.docx)
- Datos: Excel (.xlsx)
- Presentaciones: PowerPoint (.pptx)
- Comunicaciones: Email via Outlook
```

→ **Ver archivo CLAUDE-CORPORATIVO-BPB.md para la versión completa lista para usar**

---

## CAPA 3: Connectors y Herramientas

### Bitrix24 (Existe MCP Server)

MCP Server oficial disponible en:
- **URL:** https://github.com/gunnit/bitrix24-mcp-server
- **Docs oficiales:** https://apidocs.bitrix24.com/sdk/mcp.html

**Capacidades:**
- CRM completo: crear, leer, actualizar contactos, deals, tareas
- Búsqueda avanzada
- Rate limiting integrado

**Configuración:**
```json
{
  "mcpServers": {
    "bitrix24": {
      "command": "npx",
      "args": ["-y", "bitrix24-mcp-server"],
      "env": {
        "BITRIX24_WEBHOOK_URL": "https://tu-dominio.bitrix24.com/rest/1/tu-webhook-key/"
      }
    }
  }
}
```

### Microsoft 365

Opciones de integración:
- **Outlook** via connector del MCP Registry
- **OneDrive/SharePoint** para acceso a documentos
- **Microsoft Learn** connector disponible en el registry
- Archivos locales de Office via skills integrados (docx, xlsx, pptx)

### Archivos Locales

Claude ya puede trabajar con:
- PDF → Skill `pdf` (extraer, crear, merge, split)
- Excel → Skill `xlsx` (fórmulas, gráficos, análisis)
- Word → Skill `docx` (crear, editar, formato profesional)
- JSON/CSV → Procesamiento directo con Python/Node

---

## CAPA 4: Sistema Multi-Agente Autónomo

**Objetivo:** Agentes que trabajan automáticamente, sin intervención humana, para mantener y mejorar el sistema.

### Agentes Propuestos

| Agente | Frecuencia | Función |
|--------|-----------|---------|
| **Auditor de KB** | Diario | Revisa wiki/, detecta información desactualizada, gaps, contradicciones |
| **Compilador de Conocimiento** | Diario | Procesa nuevos archivos en raw/, actualiza wiki/ |
| **Monitor de Procesos** | Semanal | Analiza métricas, detecta cuellos de botella |
| **Generador de Reportes** | Semanal/Mensual | Genera reportes automáticos de actividad |
| **Detector de Vulnerabilidades** | Semanal | Audita seguridad de datos, permisos, accesos |
| **Optimizador de Sistema** | Quincenal | Analiza uso de tokens, mejora CLAUDE.md, refina skills |

→ **Ver archivo 15 para el diseño detallado del sistema multi-agente**

---

## Plan de Implementación

### Fase 1: Fundamentos (Semana 1-2)
- [ ] Contratar Claude Teams
- [ ] Crear estructura del Knowledge Base (carpetas)
- [ ] Escribir CLAUDE.md corporativo
- [ ] Poblar wiki/ con información básica de la empresa
- [ ] Configurar Bitrix24 MCP Server

### Fase 2: Contenido (Semana 3-4)
- [ ] Migrar documentación existente a raw/
- [ ] Generar páginas wiki/ a partir de raw/
- [ ] Crear templates para documentos frecuentes
- [ ] Configurar Microsoft 365 connectors
- [ ] Capacitar al equipo en uso básico

### Fase 3: Automatización (Semana 5-6)
- [ ] Configurar tareas programadas (agentes)
- [ ] Activar auditor de KB diario
- [ ] Activar compilador de conocimiento
- [ ] Activar generador de reportes semanal
- [ ] Testing y ajuste de agentes

### Fase 4: Optimización (Semana 7-8)
- [ ] Analizar uso y ajustar
- [ ] Agregar agentes adicionales según necesidad
- [ ] Refinar CLAUDE.md basado en uso real
- [ ] Implementar detector de vulnerabilidades
- [ ] Documentar learnings y mejoras

---

## Consideraciones de Seguridad

1. **Datos sensibles** — No almacenar contraseñas ni tokens en el knowledge base
2. **Permisos** — Claude Teams permite controlar quién accede a qué
3. **Bitrix24 webhook** — Usar webhook con permisos mínimos necesarios
4. **Auditoría** — El agente detector de vulnerabilidades revisa accesos
5. **Backups** — El vault es markdown, fácil de versionar con git
