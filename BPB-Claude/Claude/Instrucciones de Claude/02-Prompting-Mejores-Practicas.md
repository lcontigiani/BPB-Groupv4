# Prompting: Mejores Prácticas

## Principios Fundamentales

### 1. Sé Claro y Específico
En lugar de pedir algo vago, describe exactamente lo que necesitas.

**Malo:** "Hazme un resumen"
**Bueno:** "Resume este artículo en 3 párrafos, enfocándote en las conclusiones principales sobre el impacto económico"

### 2. Proporciona Contexto
Claude trabaja mejor cuando entiende el panorama completo.

**Malo:** "Escribe un email"
**Bueno:** "Escribe un email formal a un cliente que se retrasó en el pago. El tono debe ser firme pero respetuoso. Somos una empresa de consultoría."

### 3. Usa Ejemplos (Few-Shot Prompting)
Muestra a Claude qué formato o estilo esperas:

```
Quiero que clasifiques estos tickets de soporte. Ejemplos:

- "No puedo iniciar sesión" → Categoría: Autenticación
- "La página carga muy lento" → Categoría: Rendimiento
- "Quiero cancelar mi suscripción" → Categoría: Facturación

Ahora clasifica estos:
- "Mi contraseña no funciona"
- "El botón de pago no responde"
```

### 4. Pide Razonamiento Paso a Paso
Para problemas complejos, pide a Claude que piense antes de responder:

```
Analiza este problema paso a paso antes de darme tu respuesta final.
Muéstrame tu razonamiento.
```

### 5. Especifica el Formato de Salida
Indica exactamente cómo quieres la respuesta:

```
Responde en formato JSON con los campos: nombre, categoría, prioridad (alta/media/baja)
```

```
Dame la respuesta como una tabla markdown con columnas: Tarea, Responsable, Fecha límite
```

## Técnicas Avanzadas

### Chain of Thought (Cadena de Pensamiento)
Pide a Claude que razone explícitamente:
```
Piensa paso a paso sobre cómo resolver este problema de optimización.
Primero identifica las variables, luego las restricciones, y finalmente propón una solución.
```

### Role Prompting (Asignación de Rol)
Dale a Claude un rol específico:
```
Actúa como un experto en seguridad informática con 15 años de experiencia.
Revisa este código y señala vulnerabilidades potenciales.
```

### Structured Output (Salida Estructurada)
Usa XML tags para organizar la entrada y salida:
```
<contexto>
Somos una startup de fintech en Argentina
</contexto>

<tarea>
Analiza nuestro modelo de negocio
</tarea>

<formato_respuesta>
- Fortalezas
- Debilidades  
- Recomendaciones
</formato_respuesta>
```

### Iteración y Refinamiento
No temas pedir ajustes:
```
"Hazlo más formal"
"Reduce a la mitad la longitud"
"Agrega más ejemplos concretos"
"Cambia el enfoque hacia [X]"
```

## Errores Comunes a Evitar

1. **Prompts ambiguos** — "Ayúdame con mi proyecto" (¿qué proyecto? ¿qué tipo de ayuda?)
2. **Demasiadas instrucciones a la vez** — Divide tareas complejas en pasos
3. **No dar contexto** — Claude no sabe quién eres ni cuál es tu situación
4. **Asumir que recuerda** — Cada conversación nueva empieza de cero
5. **No iterar** — La primera respuesta rara vez es perfecta, refínala

## Plantillas Útiles

### Para Análisis de Documentos
```
Lee el documento adjunto y:
1. Identifica los 5 puntos principales
2. Señala cualquier inconsistencia o error
3. Resume las conclusiones en un párrafo
4. Sugiere 3 preguntas de seguimiento
```

### Para Generación de Código
```
Necesito una función en [lenguaje] que:
- Input: [descripción]
- Output: [descripción]
- Manejo de errores: [especificaciones]
- Incluye tests unitarios
- Incluye docstring/comentarios
```

### Para Redacción
```
Escribe un [tipo de documento] sobre [tema].
- Audiencia: [quién lo va a leer]
- Tono: [formal/informal/técnico/etc]
- Longitud: [aproximada]
- Puntos clave a cubrir: [lista]
- Evitar: [qué no incluir]
```

## CLAUDE.md — Tu Archivo de Instrucciones Persistentes

En Claude Code y Cowork puedes crear un archivo `CLAUDE.md` en la raíz de tu proyecto. Este archivo se carga automáticamente al inicio de cada sesión y puede contener:

- Reglas de estilo de código
- Convenciones del proyecto
- Información del equipo
- Instrucciones recurrentes
- Preferencias personales

Ejemplo:
```markdown
# Instrucciones para Claude

## Proyecto
Este es un proyecto en Python 3.11 usando FastAPI.

## Convenciones
- Usar type hints siempre
- Docstrings en español
- Tests con pytest
- Commits en inglés, convencional commits

## Preferencias
- Responder en español
- Preferir soluciones simples sobre complejas
- Siempre sugerir tests
```
