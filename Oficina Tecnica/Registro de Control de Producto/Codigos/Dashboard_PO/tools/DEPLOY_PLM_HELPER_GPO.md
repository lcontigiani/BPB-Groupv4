﻿# Despliegue Masivo del Helper CAD (GPO)

Archivo objetivo: `Registro de Control de Producto/Codigos/Dashboard_PO/tools/install_plm_local_helper.ps1`

## Objetivo
Habilitar `Abrir CAD` en la web para todos los usuarios sin intervención manual por PC.

## Requisitos
1. Dominio Active Directory con GPMC.
2. Acceso de lectura a la ruta UNC:
   - `\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\tools`
3. Python instalado en cliente (`pythonw.exe`, `python.exe` o `python` en PATH).
4. Permitir PowerShell para script de inicio de sesión.

## Qué hace el instalador
1. Copia `plm_local_helper.py` a `%LOCALAPPDATA%\BPB\PLMHelper`.
2. Genera lanzador oculto `run_plm_local_helper.vbs`.
3. Intenta crear tarea de logon `BPB-PLM-LocalHelper`.
4. Si no puede, crea acceso directo en carpeta Inicio del usuario.
5. Inicia helper y valida `http://127.0.0.1:51377/health`.

## Paso a Paso (GPMC)
1. Abrir `Group Policy Management` en el DC.
2. Crear nueva GPO:
   - Nombre sugerido: `BPB - PLM Local Helper`.
3. Vincular GPO a la OU de usuarios objetivo.
4. Editar GPO:
   - `User Configuration` -> `Policies` -> `Windows Settings` -> `Scripts (Logon/Logoff)` -> `Logon`.
5. Agregar script:
   - Script Name: `powershell.exe`
   - Script Parameters:
     - `-ExecutionPolicy Bypass -NoProfile -File "\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\tools\install_plm_local_helper.ps1"`
6. Aplicar GPO.
7. En cliente de prueba ejecutar:
   - `gpupdate /force`
   - cerrar sesión e iniciar sesión.

## Validación en cliente
1. Verificar helper:
   - `curl -s -i -X POST -H "Content-Type: application/json" -d "{}" http://127.0.0.1:51377/health`
   - Debe devolver `200` y `{"status":"success"}`.
2. Abrir la web y probar botón `Abrir` en CAD.
3. Confirmar que abre eDrawings/SolidWorks en la PC cliente.

## Validación en la web
1. Hacer `Ctrl+F5` para limpiar caché.
2. Iniciar sesión.
3. Ir a PLM y abrir un CAD.
4. Comportamiento esperado:
   - Botón muestra spinner durante carga.
   - Se abre el CAD localmente.

## Diagnóstico rápido
1. Error `ERR_CONNECTION_REFUSED 127.0.0.1:51377`:
   - El helper no está corriendo en esa PC.
   - Reaplicar GPO o ejecutar script manualmente.
2. Error `401 /api/login`:
   - Credenciales inválidas o sesión no autenticada.
   - No relacionado al helper.
3. CAD no abre pero health OK:
   - Verificar asociación de `.sldprt/.sldasm/.slddrw` en Windows.

## Rollback
1. Quitar vínculo de la GPO o remover script de logon.
2. En cliente:
   - eliminar tarea `BPB-PLM-LocalHelper` (si existe).
   - eliminar acceso directo `BPB PLM Local Helper.lnk` en carpeta Inicio.
   - eliminar `%LOCALAPPDATA%\BPB\PLMHelper`.

## Ejecución manual (una PC)
```powershell
powershell -ExecutionPolicy Bypass -NoProfile -File "\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\tools\install_plm_local_helper.ps1"
```

## Nota de arquitectura
Sin componente local no es posible lanzar SolidWorks/eDrawings desde navegador por restricciones de seguridad del sistema.
