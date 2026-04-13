# 16 — Integración de claude-mem en el Sistema BPB

> **Repositorio analizado:** https://github.com/thedotmack/claude-mem  
> **Versión:** v6.5.0  
> **Fecha de análisis:** Abril 2026  
> **Propósito:** Integrar la arquitectura de memoria persistente de claude-mem en el sistema corporativo de BPB Argentina

---

## ¿Qué es claude-mem?

claude-mem es un sistema de **memoria persistente entre sesiones** para Claude Code. Resuelve el problema más crítico de los LLMs: que cada sesión comienza desde cero y olvida todo el contexto anterior.

Funciona como un **compilador de contexto**: comprime automáticamente lo que Claude aprende en cada sesión (decisiones, bugs, código, descubrimientos) en una base de datos SQLite + Chroma vectorial, y luego inyecta ese contexto de forma eficiente al inicio de las sesiones siguientes.

**Instalación:**
```bash
npx claude-mem install
```

---

## Arquitectura Técnica de claude-mem

### 1. Worker Service (Puerto 37777)

Un proceso en segundo plano que gestiona toda la memoria:

```
localhost:37777
├── /api/search          → búsqueda semántica
├── /api/context/inject  → inyección de contexto completo
├── /api/timeline        → contexto cronológico
└── Web Viewer           → UI visual del historial
```

### 2. Base de Datos Dual

| Motor | Uso |
|-------|-----|
| **SQLite** (`~/.claude-mem/claude-mem.db`) | Observaciones estructuradas: ID, proyecto, título, tipo, tokens, timestamps |
| **Chroma** (vector DB) | Embeddings semánticos para búsqueda por significado |

### 3. Cinco Hooks del Ciclo de Vida

Los hooks son scripts que Claude ejecuta automáticamente en momentos clave:

```
SessionStart      → Inyecta contexto de sesiones anteriores al iniciar
UserPromptSubmit  → Enriquece prompts con memoria relevante
PostToolUse       → Registra observaciones después de cada herramienta
Stop              → Compila el resumen de la sesión al terminar
SessionEnd        → Archiva y comprime el contexto final
```

### 4. Estructura de una Observación

Cada vez que Claude aprende algo, se guarda como:

```json
{
  "id": 11131,
  "project": "bpb-argentina",
  "title": "Configuración webhook Bitrix24 validada",
  "type": "decision",
  "narrative": "Se configuró el webhook con URL X...",
  "facts": ["URL: https://...", "Token: ***"],
  "concepts": ["bitrix24", "mcp", "webhook"],
  "discovery_tokens": 4500,
  "created_at": "2026-04-13"
}
```

**Tipos de observación:**
- `bugfix` — Problema resuelto
- `feature` — Funcionalidad implementada
- `decision` — Decisión arquitectónica
- `discovery` — Descubrimiento o aprendizaje
- `change` — Cambio en el sistema

---

## Las 3 Skills Clave

### mem-search — Búsqueda en Memoria Pasada

**Workflow de 3 capas (ahorro de ~10x tokens):**

```
Paso 1: search()        → Índice con IDs (~50-100 tokens/resultado)
Paso 2: timeline()      → Contexto alrededor del resultado interesante
Paso 3: get_observations([ids]) → Detalles completos SÓLO de los relevantes
```

**Ejemplo BPB:**
```
search(query="propuesta comercial Claas", project="bpb-argentina", obs_type="feature")
→ Encuentra: #4421 "Propuesta enviada a Claas Argentina" | #3892 "Template propuesta updated"

timeline(anchor=4421, depth_before=3, project="bpb-argentina")
→ Ve el contexto: reunión previa, ajustes de precio, seguimiento

get_observations(ids=[4421, 3892])
→ Detalles completos solo de esos 2 registros
```

### smart-explore — Exploración de Código Eficiente

Parsea código usando AST (tree-sitter) en lugar de leer archivos completos:

```
smart_search()   → Descubre archivos y funciones relevantes (~2-6k tokens)
smart_outline()  → Esqueleto de un archivo (~1-2k tokens)
smart_unfold()   → Implementación de una función específica (~400-2k tokens)
```

**Vs leer archivos completos:**
- `smart_outline + unfold`: ~3.000 tokens
- `Read` archivo completo: ~12.000 tokens
- **Ahorro: 4-8x**

### timeline-report — Reporte Histórico del Proyecto

Genera un informe narrativo completo del historial de desarrollo:
- Génesis del proyecto
- Evolución arquitectónica
- Momentos clave y breakthroughs
- Deuda técnica acumulada
- ROI de la memoria (tokens ahorrados vs invertidos)

---

## Progressive Disclosure: El Principio Central

El concepto más valioso de claude-mem es **Progressive Disclosure**: cargar información en capas según necesidad.

```
Nivel 1: Índice compacto    (~50-100 tokens por entrada)  ← Siempre se carga
Nivel 2: Timeline/contexto  (~200-500 tokens)             ← Si hay coincidencia
Nivel 3: Detalles completos (~500-1000 tokens)            ← Solo IDs relevantes
```

Este principio YA ESTÁ implementado en la Knowledge Base de BPB con `wiki/index.md` → páginas wiki → `raw/`.

---

## Plan de Integración en BPB Argentina

### Fase 1: Instalación de claude-mem (Semana 1)

```bash
# En el directorio de BPB-Knowledge-Base
cd BPB-Knowledge-Base
npx claude-mem install

# Verificar que el worker corre
curl -s "http://localhost:37777/api/search?query=*&limit=1"
```

Agregar al CLAUDE.md corporativo:
```markdown
## Memoria Persistente
- Sistema: claude-mem v6.5.0
- Proyecto: bpb-argentina
- Worker: localhost:37777
- Al iniciar sesión, ejecutar mem-search para contexto reciente
```

### Fase 2: Configurar Hooks BPB-Específicos (Semana 1-2)

Los hooks se configuran en `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "npx claude-mem inject --project bpb-argentina --limit 50"
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "npx claude-mem compile --project bpb-argentina"
        }]
      }
    ]
  }
}
```

### Fase 3: Integrar mem-search en los Agentes Autónomos (Semana 2-3)

Cada agente del sistema multi-agente debe buscar en memoria antes de actuar:

**Agente Auditor KB (diario):**
```
1. mem-search: buscar auditorías previas del mismo día de la semana
2. Identificar patrones recurrentes
3. Solo reportar lo NUEVO (no repetir hallazgos ya conocidos)
4. Guardar observación tipo "discovery" con hallazgos
```

**Agente Compilador (diario):**
```
1. mem-search: páginas wiki que cambiaron esta semana
2. Comparar con versión anterior en memoria
3. Solo recompilar páginas con cambios significativos
4. Token savings estimado: 60-70% vs recompilar todo
```

**Agente Reporter (semanal):**
```
1. timeline(): obtener contexto de la semana completa
2. Identificar decisiones (type="decision") y features (type="feature")
3. Generar reporte narrativo basado en observaciones reales
4. No inventar — solo sintetizar lo registrado en memoria
```

### Fase 4: Knowledge Agents para Consultas BPB (Semana 3-4)

Los **Knowledge Agents** permiten construir un corpus de conocimiento y consultarlo conversacionalmente:

```bash
# Construir corpus de clientes
/knowledge-agent build_corpus --query "clientes OEM" --project bpb-argentina

# Primar el corpus en la sesión
/knowledge-agent prime_corpus --name clientes-oem

# Consultar
/knowledge-agent query_corpus "¿Cuáles son los principales clientes de rodamientos agrícolas?"
```

**Casos de uso BPB:**
- Corpus de `propuestas-comerciales` → "¿Cómo cotizamos a empresas medianas?"
- Corpus de `soporte-tecnico` → "¿Qué fallas técnicas son más frecuentes en cosechadoras?"
- Corpus de `procesos-internos` → "¿Cuál es el proceso de aprobación de una propuesta?"

---

## Mapa de Integración: claude-mem + BPB KB

```
┌─────────────────────────────────────────────────────────┐
│                    CLAUDE CODE (CLI)                     │
│                                                          │
│  ┌─────────────┐    ┌──────────────────────────────┐    │
│  │  CLAUDE.MD  │    │     HOOKS (Automáticos)       │    │
│  │  Corporativo│    │  SessionStart → inject        │    │
│  │             │    │  Stop        → compile        │    │
│  └─────────────┘    └──────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              claude-mem Worker                  │    │
│  │              localhost:37777                    │    │
│  │                                                 │    │
│  │  SQLite ──────────── Chroma Vector DB           │    │
│  │  (estructurado)      (semántico)                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │             BPB Knowledge Base                  │    │
│  │                                                 │    │
│  │  raw/      → datos originales (inmutables)      │    │
│  │  wiki/     → páginas generadas por LLM          │    │
│  │  index.md  → mapa de navegación                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Sistema Multi-Agente                  │    │
│  │                                                 │    │
│  │  Auditor → mem-search → evitar re-trabajo       │    │
│  │  Compilador → timeline → solo cambios           │    │
│  │  Reporter → knowledge-agent → síntesis          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## ROI Estimado para BPB

Basado en las métricas reportadas por claude-mem:

| Escenario | Sin claude-mem | Con claude-mem | Ahorro |
|-----------|---------------|----------------|--------|
| Inicio de sesión | Re-leer 50+ archivos | Inyección comprimida de 50 obs | ~80% |
| Búsqueda en historial | Leer todo el KB | search → filter → fetch | ~90% |
| Exploración de código | Read archivo completo | smart_outline + unfold | ~75% |
| Reporte semanal del agente | Generar desde cero | Sintetizar observaciones | ~60% |

**Estimación mensual BPB (10 usuarios, uso moderado):**
- Tokens sin memoria: ~5M tokens/mes
- Tokens con claude-mem: ~1.2M tokens/mes
- **Ahorro: ~76% (~3.8M tokens/mes)**

---

## Tags Privados `<private>`

claude-mem soporta marcar información como privada para que no se persista en la base de datos:

```
<private>
Contraseña webhook Bitrix24: xxxx-xxxx
Token API interno: yyyy-yyyy
</private>
```

Todo lo que esté dentro de `<private>` es procesado por Claude pero **nunca guardado** en SQLite ni Chroma. Útil para BPB cuando se manejen credenciales o datos sensibles de clientes.

---

## Endless Mode (Beta)

Permite sesiones sin límite de contexto. claude-mem comprime y rota automáticamente el contexto cuando se acerca al límite:

```json
{
  "endless_mode": true,
  "compress_at": 0.85,
  "retention_window": 200
}
```

Para BPB: útil en los agentes autónomos que deben correr sesiones largas (Auditor KB, Compilador).

---

## Checklist de Implementación

```
□ Instalar claude-mem: npx claude-mem install
□ Crear proyecto "bpb-argentina" en claude-mem
□ Configurar hooks en .claude/settings.json (SessionStart + Stop)
□ Actualizar CLAUDE.md corporativo con instrucciones de mem-search
□ Integrar mem-search en prompts de los 6 agentes autónomos
□ Configurar Knowledge Agents para: clientes, propuestas, soporte
□ Activar <private> tags en credenciales de CLAUDE.md
□ Evaluar Endless Mode para agentes de larga duración
□ Revisar web viewer (localhost:37777) semanalmente
□ Generar primer timeline-report a los 30 días de uso
```

---

## Referencias

- Repositorio: https://github.com/thedotmack/claude-mem
- Instalación: `npx claude-mem install`
- Web viewer: http://localhost:37777
- Archivo de configuración: `.claude-mem.json` (raíz del proyecto)
- Base de datos: `~/.claude-mem/claude-mem.db`
- Skills disponibles: `mem-search`, `smart-explore`, `timeline-report`, `knowledge-agent`, `do`, `make-plan`
