# Plugins y Marketplace

## ¿Qué es un Plugin?

Un plugin es un paquete que agrupa skills, conectores MCP, slash commands y sub-agentes para convertir a Claude en un especialista para un rol, equipo o empresa específica. Los plugins están disponibles en Cowork y Claude Code.

## Plugins Oficiales de Anthropic

Anthropic mantiene 11+ plugins oficiales, todos **gratuitos** (requieren plan Pro $20/mes o Team $30/seat/mes para acceder a Cowork).

### Productividad
- Gestión de tareas integrada
- Sistema de memoria que mantiene contexto entre sesiones
- Ideal para todo tipo de usuario
- **Recomendado como primer plugin**

### Enterprise Search
- Buscador universal para tu organización
- Busca en Slack, Notion, email, Jira, Google Drive simultáneamente
- Una sola pregunta, todas las fuentes
- Esencial en organizaciones grandes

### Data
- Análisis de datos hands-on
- Escribe queries SQL (Snowflake, BigQuery, Databricks)
- Exploración de datasets
- Análisis estadístico
- Dashboards interactivos

### Sales
- Investigación de prospectos
- Preparación de deals
- Seguimiento de procesos de venta
- Integración con CRMs

### Marketing
- Redacción de contenido
- Planificación de campañas
- Gestión de lanzamientos
- Análisis de métricas

### Finance
- Modelado financiero
- Análisis de reportes
- Dashboards financieros

### Legal
- Revisión de contratos
- Análisis de documentos legales
- Compliance

### HR / People
- Procesos de RRHH
- Documentación de políticas
- Onboarding

### Engineering
- Workflows de desarrollo
- Code review automatizado
- Documentación técnica

### Design
- Workflows de diseño
- Integración con herramientas de diseño

### Customer Support
- Gestión de tickets
- Knowledge base
- Análisis de satisfacción

## Cómo Instalar Plugins

### En Cowork (Desktop)
1. Abre Cowork
2. Ve a la sección de plugins
3. Busca el plugin deseado
4. Click en "Install"
5. Configura los conectores necesarios

### En Claude Code
```bash
# Listar plugins disponibles
claude plugins list

# Instalar un plugin
claude plugins install <plugin-name>
```

### Repositorio Oficial de Knowledge Work Plugins
- **URL:** github.com/anthropics/knowledge-work-plugins
- Plugins open source para knowledge workers
- Diseñados para Cowork

## Crear tu Propio Plugin

Podés crear plugins personalizados usando el skill `create-cowork-plugin`. Un plugin contiene:

```
mi-plugin/
├── manifest.json          ← Metadata del plugin
├── skills/
│   ├── skill-1/
│   │   └── SKILL.md
│   └── skill-2/
│       └── SKILL.md
├── mcps/                  ← Conectores MCP
│   └── config.json
└── commands/              ← Slash commands
    └── mi-comando.md
```

### manifest.json — Ejemplo
```json
{
  "name": "Mi Plugin Personalizado",
  "version": "1.0.0",
  "description": "Plugin para automatizar workflows de mi equipo",
  "author": "Mi Empresa",
  "skills": ["skill-1", "skill-2"],
  "connectors": ["slack", "notion"],
  "commands": ["mi-comando"]
}
```

## Marketplaces

### Marketplace Público
- **URL:** claude.com/plugins
- Plugins verificados por Anthropic
- Disponible para todos los usuarios Pro/Team

### Claude Code Marketplaces
- **URL:** claudemarketplaces.com
- Directorio comunitario
- Métricas de adopción

### Marketplace Privado (Enterprise)
- Organizaciones pueden crear su propio marketplace
- Plugins internos no visibles públicamente
- Control de acceso por equipo/departamento
- Aprobación administrativa requerida

## Plugins Comunitarios Destacados

### awesome-claude-plugins (ComposioHQ)
- Lista curada de plugins comunitarios
- Custom commands, agents, hooks, MCP servers
- **URL:** github.com/ComposioHQ/awesome-claude-plugins

### awesome-claude-plugins (quemsah)
- Métricas de adopción automatizadas
- Tracking de uso en GitHub repos
- **URL:** github.com/quemsah/awesome-claude-plugins

## Tips para Elegir Plugins

1. **Empieza con Productividad** — es útil para todos
2. **Agrega según tu rol** — Sales si estás en ventas, Data si analizas datos
3. **Enterprise Search si estás en una org grande** — ahorra horas de búsqueda
4. **Crea plugins custom** para workflows repetitivos de tu equipo
5. **Revisa los conectores** — un plugin es tan útil como los servicios a los que se conecta
