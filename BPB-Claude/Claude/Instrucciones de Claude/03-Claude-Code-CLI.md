# Claude Code — Herramienta CLI

## ¿Qué es Claude Code?

Claude Code es una herramienta de línea de comandos que permite a los desarrolladores delegar tareas de programación directamente desde la terminal. Es un agente de coding completo que puede leer, escribir, ejecutar código y gestionar proyectos.

## Instalación

```bash
npm install -g @anthropic-ai/claude-code
```

## Uso Básico

```bash
# Iniciar una sesión interactiva
claude

# Ejecutar un comando directo
claude "explica qué hace este archivo"

# Continuar la última conversación
claude --continue

# Ejecutar en modo no interactivo
claude --print "lista todos los TODO en el proyecto"
```

## Comandos Slash Importantes

| Comando | Descripción |
|---------|-------------|
| `/help` | Muestra ayuda |
| `/clear` | Limpia la conversación |
| `/compact` | Compacta el contexto para ahorrar tokens |
| `/cost` | Muestra el costo acumulado de la sesión |
| `/doctor` | Diagnostica problemas de configuración |
| `/init` | Inicializa un proyecto con CLAUDE.md |
| `/memory` | Edita el archivo CLAUDE.md |
| `/review` | Revisa un PR de GitHub |
| `/vim` | Alterna modo vim para edición |

## Archivos de Configuración

### CLAUDE.md
Archivo de instrucciones que se carga automáticamente. Puede existir en:
- Raíz del proyecto (instrucciones del proyecto)
- `~/.claude/CLAUDE.md` (instrucciones globales)
- Subcarpetas (instrucciones específicas por directorio)

### settings.json
Ubicado en `~/.claude/settings.json`. Controla:
- Modelos permitidos
- Permisos de herramientas
- Configuración de MCP servers

## Herramientas Disponibles en Claude Code

Claude Code tiene acceso a estas herramientas integradas:
- **Read** — Leer archivos
- **Write** — Crear archivos nuevos
- **Edit** — Editar archivos existentes (reemplazo de strings)
- **Bash** — Ejecutar comandos de terminal
- **Glob** — Buscar archivos por patrón
- **Grep** — Buscar contenido en archivos
- **WebFetch** — Obtener contenido de URLs
- **WebSearch** — Buscar en la web
- **Agent** — Lanzar sub-agentes para tareas complejas
- **TodoWrite** — Gestionar lista de tareas
- **NotebookEdit** — Editar notebooks Jupyter

## Sub-Agentes

Claude Code puede lanzar agentes especializados:
- **general-purpose** — Tareas multi-paso complejas
- **Explore** — Exploración rápida de codebases
- **Plan** — Diseño de planes de implementación

## Hooks

Los hooks permiten ejecutar scripts automáticamente en ciertos eventos:

```json
// .claude/settings.json
{
  "hooks": {
    "pre-commit": "npm run lint",
    "post-edit": "prettier --write $FILE"
  }
}
```

Eventos disponibles:
- `PreToolUse` — Antes de usar una herramienta
- `PostToolUse` — Después de usar una herramienta
- `Notification` — Cuando Claude envía una notificación
- `Stop` — Cuando Claude termina su turno

## MCP Servers en Claude Code

Configuración en `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

## Permisos

Claude Code tiene un sistema de permisos granular:
- **allowedTools** — Herramientas permitidas sin confirmación
- **deniedTools** — Herramientas bloqueadas
- Los permisos se pueden configurar por proyecto o globalmente

```json
{
  "permissions": {
    "allowedTools": ["Read", "Glob", "Grep"],
    "deniedTools": ["Bash(rm *)"]
  }
}
```

## Tips de Productividad

1. **Usa `/compact` frecuentemente** para mantener el contexto limpio en sesiones largas
2. **Crea un buen CLAUDE.md** con las convenciones de tu proyecto
3. **Usa `--print` para scripting** e integración con otros tools
4. **Configura MCP servers** para extender las capacidades
5. **Usa sub-agentes** para tareas que requieren investigación profunda
6. **Aprovecha los hooks** para automatizar linting, formatting, etc.
