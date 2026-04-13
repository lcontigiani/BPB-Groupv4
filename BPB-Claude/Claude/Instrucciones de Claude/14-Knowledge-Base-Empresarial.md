# Knowledge Base Empresarial — Guía de Implementación

## ¿Qué es el Knowledge Base?

Es el repositorio centralizado de TODO el conocimiento de BPB Argentina. Está escrito en markdown para que Claude lo lea de forma nativa, y sigue el patrón LLM Wiki de Karpathy: fuentes inmutables (raw/) + wiki generado y mantenido por Claude.

---

## Estructura de Directorios

```
BPB-Knowledge-Base/
│
├── CLAUDE.md                           ← Instrucciones corporativas (se carga siempre)
│
├── wiki/                               ← CONOCIMIENTO DESTILADO (mantenido por Claude)
│   ├── index.md                        ← Mapa del vault completo
│   ├── hot.md                          ← Últimos 7 días: decisiones, cambios, novedades
│   │
│   ├── empresa/                        ← Sobre BPB Argentina
│   │   ├── quienes-somos.md
│   │   ├── mision-vision-valores.md
│   │   ├── estructura-organizacional.md
│   │   ├── organigrama.md
│   │   ├── politicas-internas.md
│   │   ├── manual-empleado.md
│   │   ├── contactos-clave.md
│   │   └── historia-empresa.md
│   │
│   ├── clientes/                       ← Base de clientes
│   │   ├── index-clientes.md           ← Listado con status y datos clave
│   │   ├── cliente-[nombre].md         ← Un archivo por cliente importante
│   │   └── segmentacion.md             ← Cómo clasificamos clientes
│   │
│   ├── productos-servicios/            ← Qué ofrecemos
│   │   ├── catalogo-servicios.md
│   │   ├── precios-condiciones.md
│   │   ├── paquetes.md
│   │   └── comparativa-competencia.md
│   │
│   ├── procesos/                       ← Cómo hacemos las cosas
│   │   ├── proceso-ventas.md
│   │   ├── proceso-facturacion.md
│   │   ├── proceso-cobranzas.md
│   │   ├── proceso-onboarding-cliente.md
│   │   ├── proceso-onboarding-empleado.md
│   │   ├── proceso-soporte.md
│   │   ├── proceso-reclamos.md
│   │   ├── proceso-compras.md
│   │   └── proceso-aprobaciones.md
│   │
│   ├── legal/                          ← Marco legal
│   │   ├── contratos-tipo.md
│   │   ├── regulaciones-argentina.md
│   │   ├── compliance.md
│   │   ├── proteccion-datos.md
│   │   └── obligaciones-fiscales.md
│   │
│   ├── finanzas/                       ← Datos financieros
│   │   ├── estructura-costos.md
│   │   ├── metricas-financieras.md
│   │   ├── presupuestos.md
│   │   └── reportes-mensuales.md
│   │
│   ├── marketing/                      ← Estrategia comercial
│   │   ├── estrategia-marketing.md
│   │   ├── canales.md
│   │   ├── campanas-activas.md
│   │   └── brand-guidelines.md
│   │
│   ├── tecnologia/                     ← Infraestructura tech
│   │   ├── herramientas.md             ← Bitrix24, M365, etc.
│   │   ├── integraciones.md
│   │   ├── infraestructura.md
│   │   └── seguridad.md
│   │
│   └── decisiones/                     ← Registro de decisiones
│       ├── 2026-Q1.md
│       └── 2026-Q2.md
│
├── raw/                                ← FUENTES ORIGINALES (inmutables)
│   ├── contratos/                      ← Contratos escaneados/originales
│   │   └── contrato-cliente-xyz.pdf
│   ├── reportes/                       ← Reportes financieros originales
│   │   └── balance-2025.xlsx
│   ├── presentaciones/                 ← Decks originales
│   │   └── pitch-2026.pptx
│   ├── datos/                          ← Datos crudos
│   │   ├── clientes-export.csv
│   │   ├── ventas-2025.json
│   │   └── empleados.csv
│   ├── emails-importantes/             ← Emails guardados
│   ├── actas-reunion/                  ← Actas de reuniones
│   └── documentacion-legal/            ← Documentos legales originales
│
└── templates/                          ← PLANTILLAS REUTILIZABLES
    ├── email-seguimiento-cliente.md
    ├── email-bienvenida-cliente.md
    ├── propuesta-comercial.md
    ├── reporte-semanal.md
    ├── acta-reunion.md
    ├── contrato-servicio.md
    └── factura-proforma.md
```

---

## El Archivo index.md

Este es el punto de entrada. Claude lo lee primero para saber dónde buscar.

```markdown
---
title: BPB Argentina — Índice del Knowledge Base
updated: 2026-04-13
---

# Knowledge Base Index

## Navegación Rápida

### Empresa
- [Quiénes Somos](./empresa/quienes-somos.md) — Historia, misión, estructura
- [Organigrama](./empresa/organigrama.md) — Quién es quién
- [Políticas](./empresa/politicas-internas.md) — Reglas internas

### Comercial
- [Clientes](./clientes/index-clientes.md) — Base de clientes activos
- [Catálogo](./productos-servicios/catalogo-servicios.md) — Qué ofrecemos
- [Precios](./productos-servicios/precios-condiciones.md) — Tarifas vigentes

### Procesos
- [Ventas](./procesos/proceso-ventas.md) — Pipeline comercial
- [Facturación](./procesos/proceso-facturacion.md) — Cómo facturamos
- [Soporte](./procesos/proceso-soporte.md) — Atención al cliente

### Legal y Finanzas
- [Contratos](./legal/contratos-tipo.md) — Templates de contratos
- [Finanzas](./finanzas/metricas-financieras.md) — KPIs financieros

### Reciente
- [Hot](./hot.md) — Últimos cambios y decisiones (última semana)
- [Decisiones Q2 2026](./decisiones/2026-Q2.md)
```

---

## El Archivo hot.md

Se actualiza semanalmente (idealmente por el agente compilador). Contiene lo más reciente.

```markdown
---
title: Hot — Contexto Reciente
updated: 2026-04-13
---

# Novedades de la Semana

## Decisiones Recientes
- 2026-04-10: Se aprobó nuevo pricing para el servicio X
- 2026-04-08: Nuevo cliente: [Empresa Y] — ver clientes/

## Cambios en Procesos
- Actualizado proceso de facturación: ahora incluye paso de aprobación del gerente

## Tareas Urgentes
- Pendiente renovación de contrato con [Cliente Z] — vence 2026-04-30

## Notas del Equipo
- Reunión de equipo el viernes 18: agenda en actas-reunion/
```

---

## Formato Estándar para Páginas Wiki

Cada página debe seguir este formato para que Claude pueda indexar eficientemente:

```markdown
---
title: [Título descriptivo]
tags: [tag1, tag2, tag3]
updated: YYYY-MM-DD
summary: [1-2 oraciones que resuman el contenido]
status: active | draft | deprecated
owner: [Persona responsable]
---

# [Título]

## Resumen
[Párrafo corto que permita decidir si hay que leer más]

## Contenido Principal
[Detalle]

## Relacionados
- [Link a página relacionada 1]
- [Link a página relacionada 2]
```

---

## Las 3 Operaciones del Knowledge Base

### 1. INGEST (Ingerir nuevas fuentes)

Cuando hay un documento nuevo (contrato, reporte, email importante):

1. Guardar el original en `raw/` (nunca se modifica)
2. Claude lee el documento
3. Claude extrae la información relevante
4. Claude crea o actualiza la página wiki/ correspondiente
5. Claude actualiza hot.md e index.md si es necesario

**Prompt para ingest:**
```
Hay un nuevo [tipo de documento] en raw/[path]. 
Leelo, extrae la información relevante, y actualizá las páginas 
wiki correspondientes. Actualizá hot.md con un resumen.
```

### 2. QUERY (Consultar)

Claude sigue este flujo:
1. Lee wiki/index.md → identifica dónde buscar
2. Lee wiki/hot.md → verifica si hay contexto reciente
3. Lee la página wiki/ específica
4. Si necesita más detalle, va a raw/

### 3. LINT (Auditoría de salud)

El agente auditor ejecuta esto periódicamente:
- ¿Hay páginas sin actualizar hace más de 30 días?
- ¿Hay contradicciones entre páginas?
- ¿Hay temas mencionados pero sin página wiki?
- ¿Hay archivos en raw/ sin procesar?
- ¿El index.md refleja todas las páginas?

---

## Cómo Poblar el Knowledge Base (Inicio)

### Paso 1: Información básica (día 1)
Escribir manualmente los archivos clave:
- quienes-somos.md
- estructura-organizacional.md
- catalogo-servicios.md
- contactos-clave.md

### Paso 2: Migrar documentos existentes (semana 1)
Copiar archivos existentes a raw/:
- Contratos vigentes
- Reportes financieros recientes
- Presentaciones comerciales
- Exports de Bitrix24 (CSV)

### Paso 3: Generar wiki/ con Claude (semana 1-2)
Pedirle a Claude:
```
Leé todos los archivos en raw/ y generá las páginas wiki/ 
correspondientes siguiendo el formato estándar. 
Creá el index.md completo.
```

### Paso 4: Refinar iterativamente (ongoing)
Cada vez que interactuás con Claude sobre la empresa, pedirle que actualice el wiki si la información es nueva o corrige algo existente.

---

## Tips de Mantenimiento

1. **hot.md es clave** — Es lo primero que Claude lee después del index. Mantenerlo actualizado ahorra tokens y mejora la calidad.
2. **Tags consistentes** — Usá siempre los mismos tags para que la búsqueda funcione bien.
3. **No duplicar** — Si algo está en una página, referencialo en vez de repetirlo.
4. **Archivos cortos** — Mejor muchos archivos cortos que pocos largos. Claude puede leer selectivamente.
5. **Versioná con git** — El vault es markdown puro, perfecto para git. Así tenés historial de cambios.
