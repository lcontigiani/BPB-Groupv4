# Memoria Persistente: Obsidian, LLM Wiki y Contexto Infinito

## El Problema

Claude empieza cada conversación de cero. No recuerda sesiones anteriores, decisiones que tomaste, preferencias, ni el historial de tu proyecto. Cada sesión nueva = empezar desde cero.

## Las Soluciones

Hay un ecosistema completo de herramientas que resuelven esto. Van desde lo más simple (CLAUDE.md) hasta sistemas completos con Obsidian.

---

## Nivel 1: CLAUDE.md (Built-in, sin instalar nada)

El mecanismo más básico de memoria persistente. Claude Code y Cowork leen este archivo automáticamente al inicio de cada sesión.

### Ubicaciones:
```
~/.claude/CLAUDE.md              → Global (todas las sesiones)
mi-proyecto/CLAUDE.md            → Por proyecto
mi-proyecto/src/CLAUDE.md        → Por directorio
```

### Qué incluir:
```markdown
# Proyecto: Mi App

## Stack
Python 3.11, FastAPI, PostgreSQL, React 18

## Decisiones Arquitectónicas
- 2024-03: Migramos de MongoDB a PostgreSQL
- 2024-06: Adoptamos repository pattern
- 2025-01: Microservicios para módulo de pagos

## Preferencias
- Responder en español
- Commits en inglés (conventional commits)
- Tests antes de código (TDD)

## Contexto de Negocio
Fintech B2B en Argentina. Clientes: PyMEs.
```

### Auto-Memory (Feature nativo)
Claude Code tiene auto-memory: guarda automáticamente notas como comandos de build, insights de debugging, notas de arquitectura y preferencias de estilo. Se almacenan en `~/.claude/` y se cargan en sesiones futuras.

### Limitación:
CLAUDE.md se carga completo en el contexto → consume tokens. Recomendación: máximo ~5K tokens.

---

## Nivel 2: Patrón LLM Wiki de Karpathy

Andrej Karpathy publicó este patrón que revolucionó cómo los LLMs gestionan conocimiento. En vez de RAG (buscar chunks cada vez), el LLM construye y mantiene un wiki en markdown que acumula conocimiento.

### Arquitectura de 3 capas:

```
mi-knowledge-base/
├── raw/           ← Fuentes inmutables (papers, docs, transcripciones)
├── wiki/          ← Páginas generadas por el LLM (el conocimiento destilado)
│   ├── index.md   ← Índice principal
│   ├── hot.md     ← Cache de contexto reciente
│   └── topics/    ← Artículos por tema
└── CLAUDE.md      ← Schema e instrucciones
```

### 3 Operaciones fundamentales:
1. **Ingest** — Procesar nuevas fuentes y actualizar el wiki
2. **Query** — Preguntar al wiki (Claude lee index → drill down)
3. **Lint** — Health check: detectar gaps, contradicciones, artículos obsoletos

### Por qué funciona:
- No hay "redescubrimiento" en cada pregunta
- El conocimiento se acumula y se interconecta
- Markdown puro = sin base de datos vectorial, sin embeddings
- Claude lee `wiki/index.md` primero, luego profundiza solo donde necesita

### Gist original de Karpathy:
**https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f** (5,000+ stars)

---

## Nivel 3: Obsidian como Cerebro de Claude

Obsidian es una app de notas basada en markdown. Combinada con Claude, se convierte en un "segundo cerebro" con memoria persistente e infinita.

### ¿Por qué Obsidian?
- Todo es markdown (formato nativo de Claude)
- Links bidireccionales entre notas
- Tags, frontmatter, búsqueda potente
- Vault local (privacidad total)
- Enorme ecosistema de plugins

### 3 Formas de Integrar Obsidian con Claude:

#### A) MCP Server de Obsidian
Claude se conecta al vault vía protocolo MCP.

```json
// En settings.json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "obsidian-mcp-server"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/vault"
      }
    }
  }
}
```

Tools disponibles: leer notas, crear notas, buscar en vault, gestionar tags y frontmatter.

**Repos:**
- [cyanheads/obsidian-mcp-server](https://github.com/cyanheads/obsidian-mcp-server) — Suite completa de tools para leer, escribir, buscar notas
- [Trao95/Obsidian-MCP-Server](https://github.com/Trao95/Obsidian-MCP-Server) — Setup para Windows 11

#### B) Claude Code con Vault como Directorio de Trabajo
Abrir Claude Code directamente en tu vault de Obsidian:

```bash
cd ~/mi-vault-obsidian
claude
```

Claude puede leer, escribir y buscar en todas tus notas directamente.

#### C) Claudesidian (Plugin de Obsidian)
Embebe Claude Code CLI directamente como sidebar en Obsidian.
- [heyitsnoah/claudesidian](https://github.com/heyitsnoah/claudesidian)

---

## Repositorios Clave: Memoria Persistente

### claude-infinite-context ⭐
**Contexto infinito via Obsidian**
- Memoria persistente y buscable como archivos markdown en tu vault
- Nunca pierdas preferencias, decisiones o historial
- **URL:** https://github.com/backyarddd/claude-infinite-context

### claude-memory-compiler ⭐
**Compilador de memoria inspirado en Karpathy**
- Hooks capturan sesiones automáticamente
- Claude Agent SDK extrae decisiones y patrones
- Compilador LLM organiza en artículos cross-referenciados
- 237 stars en un día (publicado abril 2026)
- **URL:** https://github.com/coleam00/claude-memory-compiler

### obsidian-second-brain ⭐
**Segundo cerebro autónomo**
- Agente nocturno que corre 5 fases:
  1. Cierra el día
  2. Reconcilia contradicciones
  3. Sintetiza patrones cross-source
  4. Sana notas huérfanas
  5. Reconstruye el índice
- Despertás con un vault más inteligente
- **URL:** https://github.com/eugeniughelbur/obsidian-second-brain

### claude-obsidian
**Companion de conocimiento basado en Karpathy**
- Wiki orchestrator, ingest, query, lint
- Comandos: /wiki, /save, /autoresearch, /canvas
- **URL:** https://github.com/AgriciDaniel/claude-obsidian

### claude-mem
**Captura automática de sesiones**
- Graba todo lo que Claude hace en sesiones de coding
- Comprime con AI (Agent SDK)
- Inyecta contexto relevante en sesiones futuras
- **URL:** https://github.com/thedotmack/claude-mem

### infinite-context
**Zero token waste**
- 13 agentes, 64 bug fixes, 66 minutos, 0 conflictos
- Memoria persistente con agentes paralelos
- **URL:** https://github.com/chennurivarun/infinite-context

### llm-wiki (ekadetov)
**Plugin LLM Wiki para Claude Code**
- Implementación directa del patrón Karpathy
- Ingest, query, lint
- **URL:** https://github.com/ekadetov/llm-wiki

### claude-knowledge-vault
**Base de conocimiento académica**
- Recolecta de PubMed, arXiv, Scholar, Consensus
- Wiki con conceptos cross-referenciados
- Navegable en Obsidian
- **URL:** https://github.com/Psypeal/claude-knowledge-vault

---

## ¿Cuál Elegir?

| Necesidad | Solución Recomendada |
|-----------|---------------------|
| Solo quiero que recuerde mis preferencias | CLAUDE.md (built-in) |
| Quiero acumular conocimiento de proyecto | Patrón Karpathy (llm-wiki) |
| Quiero memoria total entre sesiones | claude-memory-compiler |
| Ya uso Obsidian y quiero integrarlo | claude-infinite-context o obsidian-second-brain |
| Necesito una base de conocimiento académica | claude-knowledge-vault |
| Quiero que mi vault se auto-organice | obsidian-second-brain (agente nocturno) |

## Cómo Empezar (Ruta Rápida)

1. **Hoy:** Creá un buen CLAUDE.md en tu proyecto
2. **Esta semana:** Instalá claude-memory-compiler para captura automática
3. **Próximo paso:** Montá un vault de Obsidian con claude-infinite-context
4. **Nivel experto:** Implementá el patrón Karpathy completo con wiki
