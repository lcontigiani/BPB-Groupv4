# Capacidades Generales de Claude

## Modelos Disponibles (Abril 2026)

| Modelo | ID | Fortaleza Principal |
|--------|----|--------------------|
| Claude Opus 4.6 | `claude-opus-4-6` | Razonamiento profundo, tareas complejas, coding avanzado |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | Balance entre velocidad y capacidad |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | Velocidad, tareas simples, bajo costo |

## Interfaces de Acceso

Claude está disponible a través de múltiples interfaces:

- **claude.ai** — Interfaz web, móvil y de escritorio
- **Claude Code** — Herramienta CLI para coding agentico desde la terminal
- **Cowork** — Herramienta de escritorio para automatizar archivos y gestión de tareas (no-code)
- **Claude in Chrome** — Agente de navegación web (beta)
- **Claude in Excel** — Agente de hojas de cálculo (beta)
- **API de Anthropic** — Acceso programático completo

## Capacidades Fundamentales

### Procesamiento de Texto
- Comprensión y generación de texto en múltiples idiomas
- Análisis de documentos largos (ventana de contexto extendida)
- Resumen, traducción, reescritura
- Redacción creativa y técnica

### Razonamiento y Análisis
- Razonamiento lógico paso a paso
- Análisis matemático y estadístico
- Resolución de problemas complejos
- Pensamiento crítico y evaluación de argumentos

### Programación
- Generación de código en prácticamente cualquier lenguaje
- Debugging y refactoring
- Arquitectura de software
- Testing y documentación de código
- Revisión de código (code review)

### Visión (Multimodal)
- Lectura de imágenes (PNG, JPG, etc.)
- Lectura de PDFs
- Análisis de screenshots
- Descripción y transcripción de contenido visual
- Análisis de gráficos y diagramas

### Creación de Documentos
- Word (.docx) con formato profesional
- Excel (.xlsx) con fórmulas y gráficos
- PowerPoint (.pptx) con diseño
- PDF con formato
- HTML, React, SVG, Mermaid

### Herramientas de Sistema (en Cowork/Claude Code)
- Lectura y escritura de archivos
- Ejecución de comandos bash
- Navegación web
- Gestión de tareas programadas
- Instalación de paquetes (npm, pip)

## Ventana de Contexto

Claude puede procesar una cantidad significativa de texto en una sola conversación. La ventana de contexto permite:

- Analizar documentos largos completos
- Mantener conversaciones extensas con memoria del contexto
- Procesar múltiples archivos simultáneamente
- Trabajar con codebases grandes

## Idiomas Soportados

Claude es multilingüe y funciona especialmente bien en: inglés, español, francés, alemán, italiano, portugués, japonés, coreano, chino, y muchos otros idiomas.

## Limitaciones Conocidas

- Fecha de corte de conocimiento: finales de mayo 2025 (usa web search para información posterior)
- No puede ejecutar código de forma nativa en la interfaz web (sí en Claude Code/Cowork)
- No genera imágenes de forma nativa (puede crear SVG, HTML visual, y diagramas)
- No accede a URLs autenticadas directamente
- No puede crear cuentas ni manejar contraseñas en nombre del usuario
