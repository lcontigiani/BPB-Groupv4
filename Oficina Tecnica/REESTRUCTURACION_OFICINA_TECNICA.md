# Reestructuracion Oficina Tecnica

## Estado actual

La carpeta `Oficina Tecnica` contiene varios sistemas relacionados:

- `Registro de Control de Producto`
- `Registro de Actividad`
- `Registro de Calidad`
- `Registro de ISO 9001`
- `Registro de Proyectos`
- `Solidos`

El sistema mas acoplado es `Registro de Control de Producto/Codigos/Dashboard_PO`, que consume datos o archivos de los otros modulos.

## Inventario operativo

### Runtime principal

- `Registro de Control de Producto/Codigos/Dashboard_PO`
- `Registro de Actividad/Codigos/activity_mailer.py`
- `Registro de Calidad/*.json`
- `Registro de ISO 9001/R019-*`
- `Registro de Control de Producto/Registro de Proyectos`

### Datos y documentos vivos

- `Registro de Control de Producto/Auxiliares`
- `Registro de Control de Producto/P1 - Registros Solicitados`
- `Registro de Control de Producto/P2 - Purchase Order`
- `Registro de Control de Producto/Datos`
- `Registro de Actividad/Codigos/data`
- `Registro de ISO 9001/R019-*`
- `Solidos`

### Operacion manual / launchers

- `launcher.vbs`
- `iniciar_dashboard_mac.command`
- `Registro de Control de Producto/P3 - Panel de Control/Oficina Tecnica - Panel de Control.bat`
- `Registro de Actividad/Codigos/run_activity_mailer.bat`
- `subir_proyecto.bat`
- `vincular_github.bat`

## Acoplamientos detectados

- Dashboard -> `Registro de Actividad/Codigos`
- Dashboard -> `Registro de Calidad`
- Dashboard -> `Registro de ISO 9001`
- Dashboard -> `Registro de Proyectos`
- Dashboard -> `Solidos`
- Dashboard y Activity -> `Proyecto Costos`
- Automation -> `Auxiliares`, `P1 - Registros Solicitados`, `P2 - Purchase Order`

## Problemas estructurales

- Rutas hardcodeadas a host/IP antiguos.
- Launchers raiz atados a una URL fija.
- Scripts de soporte, pruebas y diagnostico mezclados con runtime.
- Backups y snapshots dentro del arbol productivo.
- Carpetas de codigo con responsabilidad mezclada: app web, automatizacion, debug, instaladores y utilitarios.

## Duplicados o snapshots relevantes

- `Registro de Control de Producto/Extras/Oficina Tecnica`
  Parece snapshot parcial antiguo de otros modulos.
- `Registro de Control de Producto/Registro de Proyectos`
  Es la base de proyectos activa del dashboard.
- `Registro de Proyectos/projects.json`
  Es otro archivo aparte y no es el consumido por el dashboard actual.
- `Registro de Control de Producto/Codigos/Python`
  Contiene instaladores/artefactos de soporte, no runtime principal.
- `Registro de Control de Producto/Codigos/config.yaml.bak`
  Backup de configuracion viejo.
- `Registro de Control de Producto/git`
  No es un repositorio git real; solo guarda archivos sueltos de soporte.
- `Registro de ISO 9001/Codigos/R019-*/__pycache__`
  Son temporales compilados, no parte del runtime.

## Hallazgos globales

- El snapshot `Registro de Control de Producto/Extras/Oficina Tecnica` replica parcialmente `Registro de Actividad` y `Registro de ISO 9001`; debe salir del arbol productivo cuando se cierre la auditoria.
- El dashboard usa `Registro de Control de Producto/Registro de Proyectos/projects.json`, no `Oficina Tecnica/Registro de Proyectos/projects.json`.
- Los accesos directos `.url` y algunos `.lnk` siguen apuntando a host/IP viejos; conviene dejar un solo launcher configurable y retirar el resto.
- Persisten referencias duras en utilitarios y documentacion manual, aunque el runtime principal ya quedo portable.

## Estructura objetivo recomendada

Mantener esta separacion:

- `Oficina Tecnica/Registro de Control de Producto`
- `Oficina Tecnica/Registro de Actividad`
- `Oficina Tecnica/Registro de Calidad`
- `Oficina Tecnica/Registro de ISO 9001`
- `Oficina Tecnica/Registro de Proyectos`
- `Oficina Tecnica/Solidos`

Dentro de `Registro de Control de Producto`:

- `Codigos/`
- `Codigos/Dashboard_PO/`
- `Codigos/_admin/`
- `Codigos/_diagnostics/`
- `Codigos/_archive/`
- `Auxiliares/`
- `Datos/`
- `P1 - Registros Solicitados/`
- `P2 - Purchase Order/`
- `P3 - Panel de Control/`

## Regla de reorganizacion

No mover carpetas vivas de datos hasta que todas las rutas del dashboard y de automatizacion salgan de una capa central de resolucion.

## Fases sugeridas

### Fase 1

- Centralizar resolucion de rutas y hosts.
- Eliminar launchers y utilitarios viejos.
- Separar scripts no productivos del runtime.

### Fase 2

- Mover diagnosticos y scripts auxiliares a `Codigos/_diagnostics`.
- Mover helpers administrativos a `Codigos/_admin`.
- Mover snapshots y backups viejos a `Codigos/_archive`.
- Separar `Registro de Control de Producto/git` hacia `_archive/git-metadata`.
- Separar `Registro de Control de Producto/Extras/Oficina Tecnica` hacia `_archive/snapshots`.

### Fase 3

- Revisar `Extras/Oficina Tecnica` y decidir si se archiva fuera del arbol productivo o se elimina.
- Revisar `git/` dentro de `Registro de Control de Producto`.
- Revisar launchers raiz (`.url`, `.lnk`, `.vbs`) y dejar un solo launcher configurable.

### Fase 4

- Consolidar las configuraciones por entorno:
  - `BPB_BASE_DIR`
  - `BPB_ACTIVITY_CODE_DIR`
  - `BPB_QUALITY_ROOT`
  - `BPB_ISO_ROOT`
  - `BPB_COSTOS_ANALYSIS_ROOT`
  - `BPB_COSTOS_CODE_DIR`
  - `BPB_R016_DIR`
  - `BPB_DASHBOARD_URL`

## Cambios ya aplicados

- Se redujo basura y backups evidentes del dashboard.
- Se elimino dependencia activa a `BPBSRV03` y `192.168.0.13` en archivos runtime principales.
- Se agrego `Dashboard_PO/path_config.py` para resolver rutas de forma portable.
- Se agrego `Codigos/control_product_paths.py` para scripts del subproyecto de automatizacion.
- `launcher.vbs` paso a usar `BPB_DASHBOARD_URL` o `dashboard_url.txt`.
- `run_activity_mailer.bat` paso a resolver ruta local y Python desde PATH.
- `P3 - Panel de Control/Oficina Tecnica - Panel de Control.bat` paso a resolver `Dashboard_PO` por ruta relativa.
- `create_backup.py`, `step3_single.py`, `step3_pruebas_single.py` y `swap_render_priority.py` dejaron de depender de hosts fijos.
- Se creo `Oficina Tecnica/_archive/launchers_legacy` y se movieron ahi los accesos directos viejos.
- Se creo `Registro de Control de Producto/_archive/snapshots` y se movio ahi `Extras/Oficina Tecnica`.
- Se creo `Registro de Control de Producto/_archive/git-metadata` y se movio ahi la carpeta `git` vieja.
- Se eliminaron los `__pycache__` de `Registro de ISO 9001/Codigos`.

## Proximo paso recomendado

Mover de forma controlada los scripts remanentes no runtime de `Registro de Control de Producto/Codigos` a:

- `Codigos/_diagnostics`
- `Codigos/_admin`
- `Codigos/_archive`

sin tocar todavia:

- `automation.py`
- `step2_fetch_pdfs.py`
- `step3_prepare_outputs.py`
- `procesar_ingresos.py`
- `extract_to_csv*.py`
