# API de Anthropic y Desarrollo

## Visión General

La API de Anthropic permite integrar Claude en aplicaciones, servicios y flujos de trabajo programáticamente.

## Autenticación

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

## Endpoint Principal — Messages API

### Request básico (curl):

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hola Claude"}
    ]
  }'
```

### Con Python SDK:

```python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hola Claude"}
    ]
)

print(message.content[0].text)
```

### Con TypeScript SDK:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Hola Claude" }
  ],
});

console.log(message.content[0].text);
```

## System Prompts

El system prompt define el comportamiento base de Claude:

```python
message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system="Eres un asistente experto en derecho argentino. Responde siempre en español.",
    messages=[
        {"role": "user", "content": "¿Qué es una SAS?"}
    ]
)
```

## Tool Use (Function Calling)

Permite a Claude llamar funciones que tú defines:

```python
tools = [
    {
        "name": "get_weather",
        "description": "Obtiene el clima actual de una ciudad",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "Nombre de la ciudad"
                }
            },
            "required": ["city"]
        }
    }
]

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "¿Cómo está el clima en Buenos Aires?"}
    ]
)

# Si Claude decide usar la tool, responde con:
# stop_reason: "tool_use"
# Y tú ejecutas la función y devuelves el resultado
```

### Flujo completo de Tool Use:

1. Envías mensaje + definición de tools
2. Claude decide si necesita usar una tool
3. Si sí → responde con `tool_use` block
4. Tú ejecutas la función
5. Envías el resultado como `tool_result`
6. Claude genera la respuesta final

## Streaming

Para respuestas en tiempo real:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Cuéntame una historia"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

## Visión (Imágenes)

```python
import base64

with open("imagen.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": image_data
                }
            },
            {
                "type": "text",
                "text": "¿Qué ves en esta imagen?"
            }
        ]
    }]
)
```

## Extended Thinking

Para razonamiento profundo y visible:

```python
message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000
    },
    messages=[{"role": "user", "content": "Resuelve este problema de optimización..."}]
)

# El resultado incluye bloques de "thinking" y "text"
for block in message.content:
    if block.type == "thinking":
        print("Pensamiento:", block.thinking)
    elif block.type == "text":
        print("Respuesta:", block.text)
```

## Batches API

Para procesar muchas requests de forma eficiente y económica:

```python
batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": "req-1",
            "params": {
                "model": "claude-sonnet-4-6",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "Pregunta 1"}]
            }
        },
        {
            "custom_id": "req-2",
            "params": {
                "model": "claude-sonnet-4-6",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "Pregunta 2"}]
            }
        }
    ]
)
```

## Claude Agent SDK

Para construir agentes personalizados:

```python
from claude_agent_sdk import Agent

agent = Agent(
    model="claude-sonnet-4-6",
    tools=[...],
    system="Instrucciones del agente"
)

result = agent.run("Tarea para el agente")
```

## Parámetros Importantes

| Parámetro | Descripción | Rango |
|-----------|-------------|-------|
| `temperature` | Creatividad de la respuesta | 0.0 - 1.0 |
| `max_tokens` | Máximo de tokens en la respuesta | 1 - modelo máximo |
| `top_p` | Nucleus sampling | 0.0 - 1.0 |
| `top_k` | Top-k sampling | 1+ |
| `stop_sequences` | Secuencias que detienen la generación | lista de strings |

## Rate Limits y Pricing

Los rate limits y precios varían según el modelo y el tier de la cuenta. Consulta siempre la documentación actualizada en docs.anthropic.com para los valores vigentes.

## Documentación Oficial

- **Docs:** https://docs.anthropic.com
- **API Reference:** https://docs.anthropic.com/en/api
- **SDK Python:** https://github.com/anthropics/anthropic-sdk-python
- **SDK TypeScript:** https://github.com/anthropics/anthropic-sdk-typescript
