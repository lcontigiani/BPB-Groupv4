# Trucos Avanzados y Técnicas

## Técnicas de Prompting Avanzado

### 1. XML Tags para Estructurar Inputs

Claude responde particularmente bien a entradas estructuradas con XML:

```xml
<documento>
  [Contenido del documento aquí]
</documento>

<instrucciones>
  Analiza el documento anterior y extrae:
  1. Entidades mencionadas
  2. Fechas relevantes
  3. Acciones requeridas
</instrucciones>

<formato_salida>
  Responde en JSON
</formato_salida>
```

### 2. Prefilling (Pre-llenar la Respuesta)

En la API, puedes "empezar" la respuesta de Claude para forzar un formato:

```python
messages=[
    {"role": "user", "content": "Lista 3 beneficios de Python"},
    {"role": "assistant", "content": "```json\n["}
]
# Claude continuará generando JSON válido
```

### 3. Multi-Shot con Variaciones

Proporciona múltiples ejemplos que cubran diferentes casos edge:

```
Clasifica el sentimiento (positivo, negativo, neutro, mixto):

"El producto es genial pero el envío fue horrible" → mixto
"Todo perfecto, muy contento" → positivo
"No volvería a comprar" → negativo
"Es un producto" → neutro
"Me encanta el diseño aunque el precio es algo elevado" → mixto

Ahora clasifica: "Buena calidad pero tarda mucho en llegar"
```

### 4. Thinking Budget (Extended Thinking)

Para problemas complejos, dale a Claude un "presupuesto de pensamiento":

```python
thinking={"type": "enabled", "budget_tokens": 10000}
```

A mayor budget, más profundo el razonamiento. Útil para:
- Problemas matemáticos complejos
- Análisis de código extenso
- Decisiones con múltiples variables
- Problemas de lógica

### 5. Prompt Chaining (Encadenamiento)

Divide tareas complejas en pasos secuenciales:

```
Paso 1: "Extrae todos los datos numéricos de este reporte"
Paso 2: "Con estos datos, calcula las tendencias principales"
Paso 3: "Basándote en las tendencias, genera recomendaciones"
```

## Técnicas para Claude Code / Cowork

### 1. Sub-Agentes para Tareas Paralelas

En Claude Code, puedes lanzar múltiples agentes simultáneamente:
- Un agente investiga la codebase
- Otro agente planifica la arquitectura
- Un tercer agente verifica estándares

### 2. CLAUDE.md Efectivo

Un buen CLAUDE.md incluye:
```markdown
# Proyecto: Mi App

## Stack
- Backend: FastAPI + PostgreSQL
- Frontend: React + TypeScript
- Testing: pytest + vitest

## Reglas Inquebrantables
- NUNCA modificar archivos en /config/production/
- Siempre correr tests antes de commitear
- Usar conventional commits

## Patrones Preferidos
- Repository pattern para acceso a datos
- Dependency injection via FastAPI
- Error handling con custom exceptions

## Contexto de Negocio
Somos una fintech B2B en Argentina. Nuestros usuarios son PyMEs.
```

### 3. Skills Personalizados

Puedes crear skills (carpetas con SKILL.md) que Claude carga automáticamente:

```
mi-proyecto/
  .claude/
    skills/
      deploy/
        SKILL.md  ← Instrucciones para deploy
      code-review/
        SKILL.md  ← Criterios de code review
      testing/
        SKILL.md  ← Estrategia de testing
```

### 4. Hooks para Automatización

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "command": "npx prettier --write $FILEPATH"
    }],
    "PreToolUse": [{
      "matcher": "Bash(git commit*)",
      "command": "npm run lint"
    }]
  }
}
```

## Técnicas para la API

### 1. Caching de Prompts

Usa prompt caching para reducir costos con system prompts largos:

```python
message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": "Tu system prompt largo aquí...",
        "cache_control": {"type": "ephemeral"}
    }],
    messages=[...]
)
```

### 2. Structured Output con Tool Use

Fuerza a Claude a responder en un schema exacto usando tools:

```python
tools = [{
    "name": "structured_response",
    "description": "Responde con datos estructurados",
    "input_schema": {
        "type": "object",
        "properties": {
            "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "keywords": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["sentiment", "confidence", "keywords"]
    }
}]

# Con tool_choice forzado:
message = client.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,
    tool_choice={"type": "tool", "name": "structured_response"},
    messages=[{"role": "user", "content": "Analiza: 'Gran producto, muy recomendado'"}]
)
```

### 3. Manejo de Conversaciones Largas

Cuando una conversación se hace muy larga:
- Resume los puntos clave al inicio de cada nueva request
- Usa `/compact` en Claude Code
- Implementa un sistema de "memoria" con resúmenes

### 4. Retry con Exponential Backoff

```python
import time
import anthropic

def call_with_retry(client, max_retries=3, **kwargs):
    for attempt in range(max_retries):
        try:
            return client.messages.create(**kwargs)
        except anthropic.RateLimitError:
            wait = 2 ** attempt
            time.sleep(wait)
    raise Exception("Max retries exceeded")
```

## Patrones de Uso Efectivo

### Para Análisis de Datos
1. Sube el archivo (CSV, Excel)
2. Pide un análisis exploratorio primero
3. Luego pide visualizaciones específicas
4. Finalmente, pide conclusiones y recomendaciones

### Para Refactoring de Código
1. Pide que lea y entienda el código primero
2. Pide un plan de refactoring antes de ejecutar
3. Refactoriza en pasos pequeños
4. Corre tests después de cada cambio

### Para Documentación
1. Proporciona el código o proyecto
2. Especifica la audiencia (devs, usuarios, managers)
3. Pide estructura primero, contenido después
4. Itera sobre tono y nivel de detalle
