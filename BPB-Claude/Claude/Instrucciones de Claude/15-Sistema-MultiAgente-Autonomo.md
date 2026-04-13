# Sistema Multi-Agente Autónomo

## Visión

Un ecosistema de agentes de Claude que trabajan de forma autónoma — sin intervención humana — para mantener, mejorar, auditar y expandir el sistema de IA de BPB Argentina. Funcionan 24/7 mediante tareas programadas.

---

## Arquitectura Multi-Agente

```
                    ┌─────────────────────┐
                    │   AGENTE ORQUESTADOR │
                    │  (Coordinación)      │
                    └──────────┬──────────┘
                               │
        ┌──────────┬──────────┼──────────┬──────────┐
        │          │          │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
   │AUDITOR │ │COMPILER│ │REPORTER│ │SECURITY│ │OPTIMIZER│
   │  KB    │ │  KB    │ │        │ │        │ │         │
   └────────┘ └────────┘ └────────┘ └────────┘ └─────────┘
```

---

## Agente 1: Auditor del Knowledge Base

**Frecuencia:** Diario (lunes a viernes, 7:00 AM)
**Propósito:** Detectar problemas en la base de conocimiento.

### Qué hace:
1. Lee wiki/index.md y verifica que todos los links funcionen
2. Revisa fechas de "updated" en cada página — marca las que llevan 30+ días sin actualizar
3. Busca contradicciones entre páginas (ej: precios distintos en dos documentos)
4. Detecta archivos en raw/ que no tienen página wiki/ correspondiente
5. Verifica que hot.md esté actualizado (menos de 7 días)
6. Genera reporte de hallazgos en wiki/auditorias/[fecha].md

### Configuración de tarea programada:

```
Task ID: auditor-kb
Cron: 0 7 * * 1-5
Prompt: |
  Sos el Agente Auditor del Knowledge Base de BPB Argentina.
  
  Tu trabajo es revisar la salud del knowledge base. Ejecutá estos checks:
  
  1. Leé wiki/index.md y verificá que todos los archivos referenciados existan
  2. Revisá la fecha "updated" de cada página wiki/ — listá las que llevan 
     más de 30 días sin actualizar
  3. Buscá archivos en raw/ que no tengan página wiki/ correspondiente
  4. Verificá que wiki/hot.md tenga fecha de los últimos 7 días
  5. Buscá posibles contradicciones (precios, procesos, datos) entre páginas
  
  Generá un reporte en wiki/auditorias/[fecha-hoy].md con:
  - Resumen ejecutivo (3 líneas)
  - Issues encontrados clasificados por severidad (crítico/medio/bajo)
  - Acciones recomendadas
  
  Si encontrás issues críticos, actualizá wiki/hot.md con una alerta.
```

---

## Agente 2: Compilador de Conocimiento

**Frecuencia:** Diario (lunes a viernes, 8:00 AM)
**Propósito:** Procesar nuevas fuentes y mantener el wiki actualizado.

### Qué hace:
1. Revisa si hay archivos nuevos en raw/ (comparando con un registro)
2. Lee cada archivo nuevo y extrae información clave
3. Crea o actualiza las páginas wiki/ correspondientes
4. Actualiza wiki/index.md y wiki/hot.md
5. Genera cross-references entre páginas relacionadas

### Configuración:

```
Task ID: compilador-kb
Cron: 0 8 * * 1-5
Prompt: |
  Sos el Agente Compilador del Knowledge Base de BPB Argentina.
  
  Tu trabajo es procesar nuevas fuentes de información:
  
  1. Revisá raw/ y compará con wiki/index.md para detectar fuentes no procesadas
  2. Para cada fuente nueva:
     a. Leé el contenido completo
     b. Identificá qué categoría del wiki le corresponde
     c. Creá o actualizá la página wiki/ relevante
     d. Usá el formato estándar (frontmatter con title, tags, updated, summary)
  3. Actualizá wiki/index.md si agregaste páginas nuevas
  4. Actualizá wiki/hot.md con un resumen de lo procesado
  5. Verificá que los cross-references entre páginas sean correctos
  
  Al terminar, generá un log en wiki/compilador-logs/[fecha-hoy].md
```

---

## Agente 3: Generador de Reportes

**Frecuencia:** Semanal (lunes 9:00 AM) + Mensual (primer día del mes)
**Propósito:** Crear reportes automáticos para el equipo directivo.

### Qué hace:
1. Recopila información del wiki/ y datos de Bitrix24
2. Genera reporte semanal de actividad
3. Genera reporte mensual con métricas y tendencias
4. Guarda como .docx en una carpeta de reportes

### Configuración:

```
Task ID: reporte-semanal
Cron: 0 9 * * 1
Prompt: |
  Sos el Agente de Reportes de BPB Argentina.
  
  Generá el Reporte Semanal:
  
  1. Leé wiki/hot.md para las novedades de la semana
  2. Leé wiki/auditorias/ para el último reporte del auditor
  3. Revisá wiki/decisiones/ para decisiones recientes
  4. Si hay acceso a Bitrix24, consultá métricas de la semana
  
  Generá un .docx con:
  - Resumen ejecutivo (5 bullets)
  - Novedades y decisiones de la semana
  - Estado del Knowledge Base (páginas actualizadas, gaps detectados)
  - Tareas pendientes
  - Recomendaciones para la próxima semana
  
  Guardalo como reporte-semanal-[fecha].docx
```

---

## Agente 4: Detector de Vulnerabilidades y Seguridad

**Frecuencia:** Semanal (miércoles 6:00 AM)
**Propósito:** Auditar seguridad del sistema, datos y accesos.

### Qué hace:
1. Revisa que no haya datos sensibles expuestos en el wiki/ (contraseñas, tokens, números de cuenta)
2. Verifica que los archivos con información financiera tengan las restricciones correctas
3. Detecta información de clientes que no debería estar en formato abierto
4. Revisa la configuración de connectors/webhooks
5. Genera reporte de seguridad

### Configuración:

```
Task ID: seguridad-audit
Cron: 0 6 * * 3
Prompt: |
  Sos el Agente de Seguridad de BPB Argentina.
  
  Ejecutá una auditoría de seguridad:
  
  1. Escaneá wiki/ y raw/ buscando:
     - Contraseñas, tokens, API keys, webhooks expuestos
     - Números de cuenta bancaria o datos financieros sin protección
     - Datos personales de clientes (DNI, CUIT) en archivos no apropiados
  2. Verificá que wiki/tecnologia/seguridad.md esté actualizado
  3. Revisá que las configuraciones de MCP no expongan credenciales
  4. Listá archivos con información sensible que deberían tener acceso restringido
  
  Generá reporte en wiki/seguridad/audit-[fecha].md con:
  - Findings clasificados por severidad
  - Acciones correctivas recomendadas
  - Estado general de seguridad (verde/amarillo/rojo)
```

---

## Agente 5: Optimizador del Sistema

**Frecuencia:** Quincenal (primer y tercer lunes, 10:00 AM)
**Propósito:** Mejorar el rendimiento del sistema de IA.

### Qué hace:
1. Analiza los reportes de auditoría para detectar patrones
2. Revisa el CLAUDE.md y sugiere mejoras
3. Identifica skills que podrían crearse para tareas repetitivas
4. Analiza uso de tokens y sugiere optimizaciones
5. Propone nuevas automatizaciones

### Configuración:

```
Task ID: optimizador
Cron: 0 10 1,15 * *
Prompt: |
  Sos el Agente Optimizador del sistema de IA de BPB Argentina.
  
  Analizá el sistema y proponé mejoras:
  
  1. Leé los últimos reportes de auditoría en wiki/auditorias/
  2. Leé los reportes de seguridad en wiki/seguridad/
  3. Analizá CLAUDE.md — ¿hay instrucciones que falten o que sobren?
  4. Identificá tareas que el equipo hace repetidamente y podrían automatizarse
  5. Revisá el tamaño de los archivos wiki/ — ¿alguno es demasiado largo?
  6. Proponé nuevos skills o templates que ahorrarían tiempo
  
  Generá reporte en wiki/optimizacion/[fecha].md con:
  - Top 5 mejoras recomendadas (ordenadas por impacto)
  - Cambios sugeridos al CLAUDE.md
  - Nuevos skills propuestos
  - Automatizaciones recomendadas
```

---

## Agente 6: Ejecutor de Tareas Ad-Hoc

**Frecuencia:** Manual (se activa bajo demanda)
**Propósito:** Ejecutar tareas específicas que el equipo le asigna.

### Ejemplos de uso:
- "Prepará una propuesta comercial para [Cliente]"
- "Analizá este CSV y generá un reporte"
- "Actualizá los precios en el catálogo"
- "Redactá un email de seguimiento para todos los clientes con contrato vencido"

Este agente no necesita cron — se invoca directamente en Cowork o Claude Code.

---

## Cómo Implementar las Tareas Programadas

### En Cowork (recomendado para BPB)

Cowork tiene el skill `schedule` integrado. Para crear una tarea:

```
Pedirle a Claude: "Creá una tarea programada que [descripción] 
y que se ejecute [frecuencia]"
```

Claude usa la herramienta `create_scheduled_task` internamente.

### En Claude Code

```bash
claude "/schedule auditor-kb --cron '0 7 * * 1-5'"
```

### Monitoreo

Cada agente genera logs en su carpeta dedicada dentro de wiki/:
```
wiki/
├── auditorias/        ← Logs del Auditor
├── compilador-logs/   ← Logs del Compilador
├── reportes/          ← Reportes generados
├── seguridad/         ← Auditorías de seguridad
└── optimizacion/      ← Propuestas del Optimizador
```

---

## Flujo de Coordinación entre Agentes

```
06:00  Seguridad (miércoles) → Escaneo de vulnerabilidades
07:00  Auditor → Detecta problemas en KB
08:00  Compilador → Procesa fuentes nuevas, corrige issues del Auditor
09:00  Reporter (lunes) → Genera reporte semanal con todo lo anterior
10:00  Optimizador (quincenal) → Analiza tendencias y propone mejoras
```

Los agentes escriben en wiki/ y los agentes siguientes leen esos outputs. No necesitan comunicarse directamente — el knowledge base ES el canal de comunicación.

---

## Escalabilidad

El sistema puede crecer agregando agentes:

| Agente Futuro | Función |
|----------------|---------|
| **Monitor de Bitrix24** | Detecta deals estancados, tareas vencidas |
| **Asistente de Ventas** | Prepara briefs de clientes antes de reuniones |
| **Analista Financiero** | Procesa datos financieros y genera proyecciones |
| **Onboarder** | Guía a empleados nuevos con info del wiki |
| **Email Drafter** | Genera borradores de emails basados en templates |
| **Meeting Prep** | Prepara agendas y materiales para reuniones |

---

## Consideraciones Importantes

1. **Costos** — Cada agente consume tokens. Empezar con los 3 esenciales (Auditor, Compilador, Reporter) y agregar según necesidad.
2. **Supervisión humana** — Los agentes recomiendan, no ejecutan decisiones de negocio sin aprobación.
3. **Logs obligatorios** — Todo agente debe generar un log. Sin log, no hay auditoría.
4. **Fail-safe** — Si un agente encuentra un error crítico, actualiza hot.md para que el equipo lo vea inmediatamente.
5. **Iteración** — El sistema mejora con el uso. El Optimizador detecta patrones y sugiere mejoras.
