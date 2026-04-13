# Skills — Guía Completa

## ¿Qué es un Skill?

Un skill es un archivo `SKILL.md` (junto con archivos de soporte opcionales) que le da a Claude un playbook especializado para un tipo de tarea. Cuando un skill está instalado, Claude lo carga automáticamente cuando detecta que es relevante.

## Skills Integrados en Cowork

Estos skills vienen preinstalados y se activan automáticamente:

### docx (Word)
- Crear, leer, editar y manipular documentos Word (.docx)
- Formato profesional: tablas de contenido, encabezados, numeración de páginas
- Templates, tracked changes, find-and-replace
- **Trigger:** mencionar "Word doc", ".docx", "documento Word"

### xlsx (Excel)
- Creación y edición de hojas de cálculo
- Fórmulas, formato, análisis de datos
- Gráficos y visualizaciones
- Soporte para .xlsx, .xlsm, .csv, .tsv
- **Trigger:** mencionar "Excel", "spreadsheet", "tabla de datos"

### pptx (PowerPoint)
- Crear presentaciones desde cero
- Leer y extraer contenido de .pptx
- Editar slides existentes, notas del orador
- **Trigger:** mencionar "deck", "slides", "presentación", ".pptx"

### pdf
- Extraer texto y tablas de PDFs
- Crear nuevos PDFs con formato
- Merge/split de documentos
- Manejo de formularios
- **Trigger:** mencionar "PDF", ".pdf", "formulario", "extraer"

### schedule
- Crear tareas programadas (cron o one-time)
- Ejecución automática o manual
- **Trigger:** pedir tareas recurrentes, recordatorios, automatizaciones

### skill-creator
- Crear skills nuevos desde cero
- Modificar y mejorar skills existentes
- Correr evals para testear skills
- Benchmarking y optimización
- **Trigger:** "crear un skill", "optimizar skill"

### setup-cowork
- Configuración guiada de Cowork
- Instalar plugins, probar skills, conectar herramientas

## Skills de Plugins (vía Plugin Management)

### cowork-plugin-customizer
- Personalizar plugins para tu organización
- Configurar conectores específicos

### create-cowork-plugin
- Guía paso a paso para crear plugins desde cero
- Schemas de componentes, ejemplos

## Skills Populares de la Comunidad

### Frontend Design (Anthropic Oficial)
- **277K+ installs** (el más popular)
- Sistema de diseño y filosofía antes de tocar código
- Guía para componentes UI
- **Instalación:** `claude skill add anthropic/frontend-design`

### Remotion (Oficial)
- **117K+ installs semanales**
- Creación de videos programáticos con React
- Auditorías de seguridad certificadas
- **Instalación:** `claude skill add remotion/remotion`

### Web Interface Guidelines Validation
- **133K+ installs semanales**
- Validación de lineamientos de interfaz web
- **22K GitHub stars**

### Valyu (Búsqueda de Datos)
- Conecta Claude a 36+ fuentes de datos especializadas
- SEC filings, PubMed, ChEMBL, ClinicalTrials.gov, FRED
- 79% en FreshQA benchmark (vs Google 39%)

### Shannon (Pen Testing)
- Testing de seguridad autónomo
- 96.15% tasa de éxito en exploits (XBOW benchmark)
- 50+ tipos de vulnerabilidades, 5 categorías OWASP

## Cómo Instalar Skills

### Método 1: Desde CLI (Claude Code)
```bash
claude skill add <autor>/<skill-name>
```

### Método 2: Manualmente
Crear carpeta con `SKILL.md` en:
- `~/.claude/skills/mi-skill/SKILL.md` — Disponible en todos los proyectos
- `.claude/skills/mi-skill/SKILL.md` — Solo para el proyecto actual

### Método 3: Desde skills.sh
Directorio web con búsqueda por categoría, autor o instalaciones.

## Estructura de un Skill

```
mi-skill/
├── SKILL.md           ← Instrucciones principales (obligatorio)
├── examples/          ← Ejemplos de uso (opcional)
│   └── example.md
├── references/        ← Material de referencia (opcional)
│   └── api-docs.md
└── templates/         ← Templates reutilizables (opcional)
    └── template.md
```

### SKILL.md — Ejemplo

```markdown
---
name: my-code-reviewer
description: Revisa código siguiendo nuestros estándares
triggers:
  - "revisa este código"
  - "code review"
  - "revisar PR"
---

# Code Review Skill

## Instrucciones
Cuando el usuario pida una revisión de código:

1. Lee el archivo o diff completo
2. Evalúa según estos criterios:
   - Legibilidad y naming
   - Manejo de errores
   - Performance
   - Seguridad
   - Tests
3. Genera un reporte con severidad (critical/warning/info)

## Formato de Salida
[template del reporte]

## Ejemplos
[ejemplos de reviews buenos y malos]
```

## Cómo Crear un Skill Personalizado

1. **Identifica la tarea repetitiva** que quieres automatizar
2. **Escribe las instrucciones** como si entrenaras a un colega nuevo
3. **Incluye ejemplos** de inputs y outputs esperados
4. **Testea iterativamente** — pide a Claude que use el skill y refina
5. **Agrega edge cases** conforme los descubras

### Tip: Usa el skill-creator
Podés pedirme directamente: "Creame un skill para [tarea]" y uso el skill-creator integrado para generarlo.

## Directorios para Encontrar Skills

| Directorio | URL | Descripción |
|------------|-----|-------------|
| skills.sh | skills.sh | 1,234+ skills, buscador web |
| Skills Directory | skillsdirectory.com | Skills verificados y seguros |
| awesome-claude-skills | github.com/travisvn/awesome-claude-skills | Lista curada en GitHub |
| Composio Skills | composio.dev | Top skills con guías |

## Compatibilidad

Los skills modernos son cross-agent: funcionan en Claude Code, Cursor, Gemini CLI, Codex CLI, GitHub Copilot, y otros agentes de coding.
