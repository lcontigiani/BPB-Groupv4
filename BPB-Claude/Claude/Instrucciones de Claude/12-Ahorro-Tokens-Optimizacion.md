# Ahorro de Tokens y Optimización

## ¿Por qué Importa?

Los tokens son la moneda de Claude. Cada palabra que entra y sale consume tokens, y eso se traduce en costo y en cuánto "espacio mental" tiene Claude para trabajar. Optimizar tokens = sesiones más largas, respuestas más baratas, y menos interrupciones por límite de contexto.

---

## Estrategias de Optimización

### 1. CLAUDE.md Eficiente (El más impactante)

CLAUDE.md se carga en CADA mensaje. Si es largo, pagás tokens repetidamente.

**Antes (11,000 tokens):**
```markdown
# Mi Proyecto
[toda la documentación del proyecto volcada aquí]
[historia completa]
[todos los endpoints de la API]
...
```

**Después (1,300 tokens):**
```markdown
# Mi Proyecto
Stack: FastAPI + PostgreSQL + React 18
Convenciones: type hints, pytest, conventional commits

## Archivos clave
- src/api/ → Endpoints
- src/models/ → SQLAlchemy models
- docs/ARCHITECTURE.md → Ver si necesitás más contexto
```

**Resultado: 90% de reducción** (de 11K a 1.3K tokens)

### 2. Uso Estratégico de /compact

`/compact` resume la conversación y reemplaza el historial raw con una versión comprimida.

**Cuándo usarlo:**
- Después de completar un milestone importante
- Cuando cambiás de subtarea
- Antes de que el contexto se llene (no esperar al límite)
- Cada ~30 minutos en sesiones intensivas

**Cuándo usar /clear:**
- Al cambiar completamente de tema
- Cuando empezás una tarea nueva no relacionada

### 3. Selección de Modelo

| Tarea | Modelo Recomendado | Ahorro vs Opus |
|-------|-------------------|----------------|
| Coding complejo, arquitectura | Opus 4.6 | — |
| 80% del coding diario | Sonnet 4.6 | ~5x más barato |
| Exploración, lectura de archivos | Haiku 4.5 | ~80% más barato |
| Sub-agentes de investigación | Haiku 4.5 | ~80% más barato |

Sonnet 4.6 está a 1.2 puntos de Opus en SWE-bench → para la mayoría del trabajo es suficiente.

### 4. Prompts Concisos

Prompts específicos y cortos reducen tokens de ida y vuelta:

**Verbose (gasta tokens):**
```
Podrías por favor revisar este código y decirme si hay algún problema 
potencial que pueda causar errores en producción? Me gustaría que fueras 
bastante detallado en tu análisis y que cubras todos los aspectos posibles.
```

**Eficiente (ahorra 60-70% de tokens):**
```
Revisá este código. Listá bugs potenciales en producción. Sé conciso.
```

### 5. Control de Extended Thinking

Los thinking tokens se cobran como output. Para tareas simples, no necesitás razonamiento profundo.

```python
# Tarea compleja → más thinking
thinking={"type": "enabled", "budget_tokens": 10000}

# Tarea simple → reducir o desactivar
thinking={"type": "enabled", "budget_tokens": 2000}
```

### 6. Documentación Modular

En vez de un archivo gigante, dividí la documentación para que Claude solo cargue lo necesario:

```
docs/
├── QUICK_START.md        ← Siempre cargado (~300 tokens)
├── ARCHITECTURE.md       ← Solo si necesita contexto de arquitectura
├── API_REFERENCE.md      ← Solo si trabaja con endpoints
├── COMMON_MISTAKES.md    ← Solo si hay errores recurrentes
└── DEPLOY.md             ← Solo si está deployando
```

### 7. Sub-Agentes para Tareas Costosas

Los sub-agentes corren en modelos más baratos:

```
Tarea principal (Opus/Sonnet) → Delega exploración a sub-agente (Haiku)
```

Esto es más eficiente que hacer todo en el modelo principal.

### 8. Prompt Caching (API)

Si usás la API con system prompts largos, prompt caching ahorra significativamente:

```python
system=[{
    "type": "text",
    "text": "Tu system prompt largo...",
    "cache_control": {"type": "ephemeral"}
}]
```

El system prompt se cachea y no se re-procesa en cada request.

---

## Repositorios de GitHub para Token Optimization

### claude-token-efficient ⭐
**Un CLAUDE.md que reduce output en ~63%**
- Drop-in: solo copiás el archivo CLAUDE.md a tu proyecto
- Reduce verbosidad, sycophancy y alucinaciones
- Benchmarked en 5 categorías de tests
- **Nota:** El CLAUDE.md mismo consume tokens de input. El ahorro neto es en output.
- **URL:** https://github.com/drona23/claude-token-efficient

### claude-token-optimizer ⭐
**90% de ahorro en documentación**
- Reestructura docs para que Claude cargue solo lo necesario
- De 11,000 → 1,300 tokens en session start
- Templates reutilizables: CLAUDE.md, COMMON_MISTAKES.md, QUICK_START.md, ARCHITECTURE_MAP.md
- **URL:** https://github.com/nadimtuhin/claude-token-optimizer

### everything-claude-code ⭐⭐⭐ (140K+ stars)
**El repo más completo de optimización para Claude Code**
- Ganador de hackathon de Anthropic
- 170+ contribuidores
- Guía completa de token optimization
- Skills, instincts, memory, security
- Incluye doc dedicado: `docs/token-optimization.md`
- **URL:** https://github.com/affaan-m/everything-claude-code

### Gist: Workflow de Token Reduction
**Guía práctica de reducción de tokens**
- Estrategias de compacting
- Estructura de CLAUDE.md
- Gestión modular de contexto
- Tips de prompt engineering
- **URL:** https://gist.github.com/dholdaway/8009f089d3407e14f3d753f2a70eb63e

---

## El Problema del Buffer de Contexto (33K-45K tokens)

Claude Code reserva un buffer interno de 33K-45K tokens para sus propias instrucciones de sistema. Esto significa que de tu ventana de contexto total, una porción significativa ya está ocupada. Estrategias:

1. **No desperdicies en CLAUDE.md largo** — Cada token cuenta más
2. **Compactá seguido** — No esperes a que se llene
3. **Sé minimalista** — Menos es más en context

---

## Checklist de Optimización

- [ ] CLAUDE.md bajo 5K tokens (idealmente ~1-2K)
- [ ] Documentación modular (archivos separados por tema)
- [ ] Usar Sonnet para coding diario (no siempre Opus)
- [ ] Sub-agentes en Haiku para exploración
- [ ] /compact después de cada milestone
- [ ] /clear al cambiar de tema
- [ ] Prompts concisos y específicos
- [ ] Thinking budget ajustado a la complejidad
- [ ] Prompt caching habilitado en API
- [ ] Instalar claude-token-efficient como CLAUDE.md base

---

## Resumen: Impacto Estimado

| Técnica | Ahorro Estimado |
|---------|----------------|
| CLAUDE.md optimizado | 80-90% en context load |
| /compact regular | 50-70% en historial |
| Sonnet vs Opus | 5x en costo |
| Haiku para sub-agentes | 80% en exploración |
| Prompts concisos | 60-70% en output |
| Documentación modular | 70-85% en context |
| claude-token-efficient | ~63% en output |
