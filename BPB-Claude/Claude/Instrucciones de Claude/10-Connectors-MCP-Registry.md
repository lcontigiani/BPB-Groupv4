# Connectors y MCP Registry

## ¿Qué es un Connector?

Un connector es un MCP server registrado en el MCP Registry de Claude que permite conectar servicios externos directamente desde Cowork o Claude Desktop. A diferencia de configurar MCP servers manualmente, los connectors se activan con un click y manejan la autenticación automáticamente.

## Connectors Disponibles en el Registry

A continuación, todos los connectors que encontré disponibles en el MCP Registry, organizados por categoría.

---

### Comunicación y Colaboración

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Slack** | Mensajes, canvases, búsqueda | `send_message`, `search`, `read_channel`, `read_thread`, `create_canvas` |
| **Notion** | Workspace completo | `search`, `fetch`, `create-pages`, `update-page`, `create-database` |
| **Miro** | Pizarras colaborativas | `board_get_items`, `get_image_data`, `draft_diagram` |
| **Circleback** | Notas de reuniones | `SearchMeetings`, `SearchTranscripts`, `GetTranscripts` |

### Productividad y Gestión de Proyectos

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Asana** | Tareas y proyectos | `create_task`, `search_tasks`, `get_project`, `get_portfolios` |
| **Linear** | Issues y workflows | `list_issues`, `create_issue`, `list_cycles`, `get_document` |
| **Zoho Projects** | Proyectos y tareas | `getAllProjects`, `createProject`, `updateProject` + 22 más |
| **Google Calendar** | Agenda y reuniones | `create_event`, `list_events`, `find_meeting_times`, `find_free_time` |

### Diseño y Contenido Visual

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Figma** | Diseño UI/UX | `get_design_context`, `get_screenshot`, `generate_diagram`, `get_metadata` |
| **Canva** | Diseño gráfico | `search-designs`, `get-design`, `import-design-from-url`, `create-design` |
| **Cloudinary** | Gestión de imágenes/video | `upload-asset`, `list-images`, `list-videos`, `generate-archive` |
| **Magic Patterns** | Diseño iterativo | `get_design`, `read_files`, `update_design` |
| **Goodnotes** | Documentos e ilustraciones | `draw_svg_image`, `generate_mermaid_diagram`, `create_markdown_text_document` |

### Marketing y Ventas

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Intuit Mailchimp** | Campañas de email | `campaign-planner`, `edit-campaign`, `save-to-mailchimp`, `apply-theme` |
| **Attio** | CRM | `create-record`, `create-task`, `get-email-content`, `search-records` |
| **Day AI** | CRM inteligente | `analyze_before_create`, `create_or_update_opportunity`, `read_crm_schema` |
| **Ahrefs** | SEO y analytics | `batch-analysis`, `brand-radar`, `impressions-history` + 53 más |

### Bases de Datos y Analytics

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Supabase** | BaaS (Postgres) | `list_projects`, `create_project`, `execute_sql`, `manage_auth` + 24 más |
| **PlanetScale** | MySQL/Postgres managed | `execute_read_query`, `get_branch_schema`, `list_databases` |
| **Google BigQuery** | Data warehouse | `execute_sql`, `list_tables`, `get_table_info` |
| **Dremio Cloud** | Lakehouse analytics | `RunSqlQuery`, `GetSchemaOfTable`, `BuildUsageReport` |
| **PostHog** | Product analytics | `query-run`, `insight-create`, `feature-flags`, `experiments` + 49 más |
| **Omni Analytics** | BI natural language | `pickModel`, `pickTopic`, `getData` |

### Cloud e Infraestructura

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Cloudflare** | CDN, Workers, KV | `workers_list`, `kv_namespaces`, `d1_databases`, `r2_buckets` |
| **AWS Marketplace** | Servicios AWS | `ask_aws_marketplace`, `get_recommendations`, `get_evaluations` |
| **Google Compute Engine** | VMs en GCP | `create_instance`, `start_instance`, `stop_instance` + 21 más |

### Desarrollo y DevOps

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Sentry** | Monitoreo de errores | `find_issues`, `get_issue_details`, `find_releases`, `create_issue` |
| **Webflow** | Web CMS | `data_cms_tool`, `data_pages_tool`, `ask_webflow_ai` + 11 más |
| **Hugging Face** | ML/AI Hub | `model_search`, `model_details`, `paper_search`, `dataset_search` |
| **Stytch** | Auth/Identity | `createProject`, `createRedirectURL`, `createPublicToken` + 13 más |

### Almacenamiento y Documentos

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Google Drive** | Archivos en la nube | Buscar, leer, analizar archivos |
| **Egnyte** | Gestión de contenido | `search`, `fetch`, `ask_document`, `summarize_document` + 15 más |
| **Sanity** | CMS headless | `create_documents`, `deploy_schema`, `mutate_dataset` + 23 más |

### Multi-servicio

| Connector | Descripción | Tools Principales |
|-----------|-------------|-------------------|
| **Natoma** | Acceso multi-app | Jira, MongoDB, Confluence, Salesforce — todo en uno |

---

## Cómo Conectar un Connector

### Desde Cowork
1. Claude sugiere automáticamente connectors relevantes cuando detecta que los necesitas
2. Click en "Connect" en la sugerencia
3. Completa la autenticación (OAuth generalmente)
4. El connector queda disponible para la sesión

### Desde Claude Desktop
1. Ve a Settings → Integrations
2. Busca el servicio
3. Click "Connect"
4. Autoriza el acceso

### Desde Claude Code
Configuración manual en `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "nombre-del-server": {
      "command": "npx",
      "args": ["-y", "@paquete/server"],
      "env": {
        "API_KEY": "tu-key"
      }
    }
  }
}
```

## Buscar Connectors Disponibles

Desde Cowork, puedo buscar el MCP Registry en tiempo real. Simplemente pedime:
- "Necesito conectar con [servicio]"
- "¿Hay un connector para [herramienta]?"
- "Conectame a [plataforma]"

Y buscaré automáticamente en el registry si hay algo disponible.

## Tips de Uso

1. **Conectá primero lo que más usás** — Slack, Calendar, y tu gestor de proyectos
2. **Los connectors se autentican una vez** — después funcionan automáticamente
3. **Combiná connectors** — ej: lee de Slack + escribe en Notion
4. **Verificá permisos** — cada connector pide solo los permisos necesarios
5. **Desconectá lo que no uses** — mantené limpio tu setup

## Diferencia: Connector vs MCP Server Manual

| Aspecto | Connector (Registry) | MCP Server (Manual) |
|---------|---------------------|---------------------|
| Instalación | 1 click | Configurar JSON + tokens |
| Auth | OAuth automático | Manual (API keys) |
| Actualizaciones | Automáticas | Manual |
| Disponibilidad | Cowork/Desktop | Claude Code / Desktop |
| Personalización | Limitada | Total |
| Servidores propios | No | Sí |
