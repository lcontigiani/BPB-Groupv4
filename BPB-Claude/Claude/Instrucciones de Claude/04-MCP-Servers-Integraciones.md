# MCP Servers e Integraciones

## ¿Qué es MCP (Model Context Protocol)?

MCP es un protocolo abierto creado por Anthropic que permite a Claude conectarse con herramientas y fuentes de datos externas. Funciona como un "puente" entre Claude y servicios como GitHub, Slack, bases de datos, APIs, y más.

## Arquitectura

```
Claude ←→ MCP Client ←→ MCP Server ←→ Servicio Externo
```

Un MCP Server expone:
- **Tools** — Funciones que Claude puede ejecutar
- **Resources** — Datos que Claude puede leer
- **Prompts** — Templates predefinidos

## MCP Servers Oficiales (Anthropic)

Repositorio oficial: `github.com/modelcontextprotocol/servers`

### Principales servers oficiales:
- **filesystem** — Acceso al sistema de archivos
- **github** — Operaciones con GitHub (repos, PRs, issues)
- **gitlab** — Operaciones con GitLab
- **google-drive** — Acceso a Google Drive
- **slack** — Integración con Slack
- **postgres** — Consultas a PostgreSQL
- **sqlite** — Consultas a SQLite
- **puppeteer** — Automatización de navegador
- **brave-search** — Búsqueda web via Brave
- **fetch** — Obtener contenido web
- **memory** — Almacenamiento persistente de conocimiento

## Configuración

### En Claude Desktop (settings.json)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/tu-usuario/Documents"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_tu_token"
      }
    }
  }
}
```

### En Claude Code (~/.claude/settings.json)

La misma estructura, pero en el archivo de settings de Claude Code.

## MCP Servers Populares de la Comunidad

### Productividad
- **Linear** — Gestión de proyectos y tickets
- **Notion** — Workspace de Notion
- **Todoist** — Gestión de tareas
- **Google Calendar** — Calendario

### Desarrollo
- **Docker** — Gestión de contenedores
- **Kubernetes** — Orquestación de contenedores
- **AWS** — Servicios de Amazon Web Services
- **Sentry** — Monitoreo de errores

### Datos
- **MongoDB** — Base de datos MongoDB
- **Redis** — Cache y almacenamiento
- **BigQuery** — Análisis de datos
- **Snowflake** — Data warehouse

### Comunicación
- **Slack** — Mensajería de equipo
- **Discord** — Comunidades
- **Email** — Gestión de correo

## Crear tu Propio MCP Server

### Server básico en TypeScript:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "mi-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler("tools/list", async () => ({
  tools: [{
    name: "mi_herramienta",
    description: "Descripción de lo que hace",
    inputSchema: {
      type: "object",
      properties: {
        parametro: { type: "string", description: "Un parámetro" }
      },
      required: ["parametro"]
    }
  }]
}));

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "mi_herramienta") {
    // Lógica aquí
    return { content: [{ type: "text", text: "Resultado" }] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Server básico en Python:

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server

app = Server("mi-server")

@app.tool()
async def mi_herramienta(parametro: str) -> str:
    """Descripción de lo que hace"""
    return f"Resultado: {parametro}"

async def main():
    async with stdio_server() as (read, write):
        await app.run(read, write)
```

## Recursos para Encontrar MCP Servers

- **Repositorio oficial:** github.com/modelcontextprotocol/servers
- **awesome-mcp-servers:** github.com/wong2/awesome-mcp-servers (80K+ stars)
- **MCP Registry:** Buscador integrado en Cowork y Claude Desktop
- **Glama MCP Directory:** glama.ai/mcp/servers

## Plugins (Cowork & Claude Code)

Los plugins son paquetes instalables que agrupan MCPs, skills y herramientas. Pueden encontrarse en marketplaces e instalarse directamente desde la interfaz.
