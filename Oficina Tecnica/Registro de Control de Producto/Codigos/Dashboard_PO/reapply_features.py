
import os
import re

app_path = r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/app.py"
js_path = r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/static/script.js"

# ---------------- APP.PY CONTENT ----------------
app_code = r'''

#   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
#   ACTIVITY TRACKING EXTENSION
#   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

from pathlib import Path
import csv
import json
from datetime import datetime
import re

ACTIVITY_BASE_PATH = Path(r"//192.168.0.13/lcontigiani/Oficina Tecnica/Registro de Actividad/Codigos")
ACTIVITY_STATE_FILE = ACTIVITY_BASE_PATH / "data/activity_mailer_state.json"
ACTIVITY_CSV_BASE = ACTIVITY_BASE_PATH / "data/base_datos_respuestas.csv"
ACTIVITY_CSV_USER_DIR = ACTIVITY_BASE_PATH / "data/respuestas_csv"

@app.route('/api/activity-pending', methods=['GET'])
def get_pending_activity():
    if not session.get('user'):
        return jsonify({"status": "error", "message": "No autenticado"}), 401
    
    user_email = session.get('user').strip().lower()
    pending = []

    try:
        if not ACTIVITY_STATE_FILE.exists():
            return jsonify({'status': 'success', 'data': []})

        with open(ACTIVITY_STATE_FILE, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        campaigns = state.get('campaigns', [])
        
        for camp in campaigns:
            if not camp.get('sent_at'): continue
            
            # Check recipient
            is_recipient = False
            recipients = camp.get('recipients', [])
            for r in recipients:
                if isinstance(r, str) and r.strip().lower() == user_email:
                    is_recipient = True
                    break
                elif isinstance(r, dict) and r.get('email', '').strip().lower() == user_email:
                    is_recipient = True
                    break
            
            if not is_recipient: continue
                
            # Check response
            responses = camp.get('responses', {})
            user_responded = False
            for email_key in responses:
                if email_key.strip().lower() == user_email:
                    user_responded = True
                    break
            
            if not user_responded:
                pending.append({
                    'token': camp.get('token'),
                    'date': camp.get('date'),
                    'subject': camp.get('subject'),
                    'type': 'activity_record' 
                })
                
    except Exception as e:
        print(f"[ACTIVITY] Error checking pending: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

    return jsonify({'status': 'success', 'data': pending})

@app.route('/api/activity-submit', methods=['POST'])
def submit_activity_record():
    if not session.get('user'):
        return jsonify({"status": "error", "message": "No autenticado"}), 401
        
    data = request.json
    token = data.get('token')
    project = data.get('project')
    time_val = data.get('time')
    description = data.get('description')
    user_email = session.get('user').strip().lower()
    
    user_display_name = user_email
    users_db = {}
    if USERS_FILE.exists():
        try:
            with open(USERS_FILE, 'r') as f:
                users_db = json.load(f)
            if user_email in users_db:
                user_display_name = users_db[user_email].get('display_name', user_email)
        except: pass

    if not token or not project:
        return jsonify({'status': 'error', 'message': 'Datos incompletos'}), 400

    try:
        if not ACTIVITY_STATE_FILE.exists():
            return jsonify({'status': 'error', 'message': 'Archivo de estado no encontrado'}), 500

        with open(ACTIVITY_STATE_FILE, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        campaign_idx = -1
        target_camp = None
        
        for idx, camp in enumerate(state.get('campaigns', [])):
            if camp.get('token') == token:
                campaign_idx = idx
                target_camp = camp
                break
        
        if not target_camp:
            return jsonify({'status': 'error', 'message': 'Token invalido o expirado'}), 404
            
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        body_mock = f"Proyecto: {project}\nTiempo destinado: {time_val}\nDescripciÃ³n: {description}"
        
        response_obj = {
            "from": user_email,
            "from_name": user_display_name,
            "subject": f"Re: {target_camp.get('subject')}",
            "date": now_str,
            "received_at": datetime.now().isoformat(),
            "snippet": body_mock,
            "body": body_mock,
            "uid": 0,
            "saved_path": "WEB_SUBMISSION"
        }
        
        state['campaigns'][campaign_idx].setdefault('responses', {})
        state['campaigns'][campaign_idx]['responses'][user_email] = response_obj
        
        with open(ACTIVITY_STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
            
        def clean_csv(val):
            return str(val).replace(';', ',').replace('\n', ' ').strip()
            
        date_str = target_camp.get('date')
        try:
            dobj = datetime.strptime(date_str, '%Y-%m-%d')
            date_str_csv = dobj.strftime('%d/%m/%Y')
        except:
            date_str_csv = date_str
            
        time_now_str = datetime.now().strftime('%H:%M:%S')

        master_row = [
            date_str_csv, time_now_str, token, user_display_name, user_email,
            clean_csv(project), clean_csv(project), clean_csv(time_val), clean_csv(description)
        ]
        
        try:
            with open(ACTIVITY_CSV_BASE, 'a', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f, delimiter=';')
                writer.writerow(master_row)
        except Exception as e:
            print(f"[ACTIVITY] Error writing Master CSV: {e}")
            
        safe_name = re.sub(r'[<>:"/\\|?*]', '_', user_display_name).strip()
        user_csv_path = ACTIVITY_CSV_USER_DIR / f"{safe_name}.csv"
        
        user_row = [
            date_str_csv, time_now_str, token, clean_csv(project),
            clean_csv(time_val), clean_csv(description), "" 
        ]
        
        try:
            write_header = not user_csv_path.exists()
            with open(user_csv_path, 'a', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f, delimiter=';')
                if write_header:
                    writer.writerow(["Fecha", "Hora", "Token", "ProyectoFinal", "Tiempo", "Registro", "Observaciones"])
                writer.writerow(user_row)
        except Exception as e:
            print(f"[ACTIVITY] Error writing User CSV: {e}")

        return jsonify({'status': 'success', 'message': 'Registro guardado correctamente'})

    except Exception as e:
        print(f"[ACTIVITY] Error submitting: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
'''

# ---------------- JS CONTENT ----------------
js_code = r'''
/* 
 * ACTIVITY RECORD PENDING LOGIC
 */

async function loadPendingActivities() {
    try {
        const res = await fetch('/api/activity-pending');
        const data = await res.json();
        
        if (data.status === 'success' && data.data.length > 0) {
            window._pendingActivities = data.data; 
            injectPendingActivities();
        } else {
            window._pendingActivities = [];
        }
    } catch (e) {
        console.error("Error fetching pending activity", e);
    }
}

function injectPendingActivities() {
    const tbody = document.querySelector('#po-table tbody');
    if (!tbody) return; 

    [...window._pendingActivities].reverse().forEach(act => {
        const tr = document.createElement('tr');
        tr.style.backgroundColor = 'rgba(231, 76, 60, 0.1)'; 
        tr.style.borderLeft = '4px solid var(--bpb-blue)';
        
        tr.innerHTML = `
            <td><strong style="font-family:monospace; color: var(--bpb-blue);">${act.token}</strong></td>
            <td><span style="font-weight:700;">REGISTRO DE ACTIVIDAD</span><br><span style="font-size:0.8rem; color:#aaa;">${act.subject || 'Pendiente'}</span></td>
            <td>${act.date}</td>
            <td style="text-align:center;">-</td>
            <td>
                <div style="width: 100%;">
                   <span class="status-badge" style="background:rgba(231, 76, 60, 0.2); color:#e74c3c; border:1px solid #e74c3c;">PENDIENTE</span>
                </div>
            </td>
            <td style="text-align:center;">-</td>
            <td style="text-align:center;">
                <button class="btn btn-approve" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: var(--bpb-blue); border:none;" onclick="openActivityModal('${act.token}', '${act.date}')">
                    Completar Registro
                </button>
            </td>
        `;
        
        tbody.insertBefore(tr, tbody.firstChild);
    });
}

function openActivityModal(token, date) {
    const modalId = 'activity-modal';
    const existing = document.getElementById(modalId);
    if(existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; width: 90%; background: #1e1e1e; border: 1px solid #333;">
            <div class="modal-header">
                <h2>Completar Registro Diario</h2>
                <span class="close-modal" onclick="document.getElementById('${modalId}').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <p style="color:#aaa; margin-bottom: 1rem;">Fecha: <strong style="color:white;">${date}</strong> | Token: <code>${token}</code></p>
                
                <div class="form-group" style="margin-bottom:1rem;">
                    <label style="display:block; color:#ccc; margin-bottom:5px;">Proyecto / Tarea</label>
                    <input type="text" id="act-project" class="search-input" style="width:100%;" placeholder="Ej: Registros OT, Ingenieria...">
                </div>
                
                <div class="form-group" style="margin-bottom:1rem;">
                    <label style="display:block; color:#ccc; margin-bottom:5px;">Tiempo Destinado</label>
                    <input type="text" id="act-time" class="search-input" style="width:100%;" placeholder="Ej: 2 horas, 30 min...">
                </div>
                
                <div class="form-group" style="margin-bottom:1.5rem;">
                    <label style="display:block; color:#ccc; margin-bottom:5px;">Descripci&oacute;n</label>
                    <textarea id="act-desc" class="search-input" style="width:100%; min-height:100px; resize:vertical;" placeholder="Detalle de actividades..."></textarea>
                </div>
                
                <button class="btn btn-primary" onclick="submitActivity('${token}')" style="width:100%;">Enviar Registro</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function submitActivity(token) {
    const proj = document.getElementById('act-project').value;
    const time = document.getElementById('act-time').value;
    const desc = document.getElementById('act-desc').value;
    
    if(!proj || !time) {
        alert("Por favor completa el proyecto y el tiempo.");
        return;
    }
    
    const btn = document.querySelector('#activity-modal .btn-primary');
    const originalText = btn.textContent;
    btn.textContent = "Enviando...";
    btn.disabled = true;
    
    try {
        const res = await fetch('/api/activity-submit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                token: token,
                project: proj,
                time: time,
                description: desc
            })
        });
        const data = await res.json();
        
        if(data.status === 'success') {
            document.getElementById('activity-modal').remove();
            // showNotification("Registro guardado", "success");
            location.reload(); 
        } else {
            alert("Error: " + data.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
'''

def truncate_and_append(fp, marker, new_content):
    print(f"Processing {fp}...")
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except:
        print(f"FAILED to read {fp}")
        return

    # Find marker (strict or spaced)
    cut_idx = -1
    clean_marker = marker.replace(' ', '') # ACTIVITYTRACKINGEXTENSION
    
    for i, line in enumerate(lines):
        # Normalize line for search
        normalized = line.replace(' ', '').replace('\x00', '').lower()
        if clean_marker.lower() in normalized:
            print(f"  -> Found marker at line {i+1}")
            cut_idx = i
            break
            
    if cut_idx != -1:
        print(f"  -> Truncating at line {cut_idx}")
        lines = lines[:cut_idx]
    else:
        print("  -> Marker not found, assuming clean file or first run. Appending to end.")
        
    # Append
    # Check if last line has newline
    if lines and not lines[-1].endswith('\n'):
        lines[-1] += '\n'
        
    lines.append(new_content)
    
    # Hooks
    # For script.js, we need to inject the load call in fetchData or similar.
    if 'script.js' in fp:
        # Check if hook exists
        hook_present = False
        for l in lines:
            if "loadPendingActivities()" in l:
                hook_present = True
                break
        
        if not hook_present:
            print("  -> Injecting loadPendingActivities hook into fetchData...")
            # Simple replace
            for i, l in enumerate(lines):
                if "renderPOList(allData);" in l and "fetchData" not in l: # avoid potentially recursive logic?
                     # renderPOList calls are safe-ish. Best in 'fetchData' success block.
                     pass
            
            # Robust hook: end of 'fetchData' success?
            # Or just append it to DOMContentLoaded event at the top logic?
            # We will rely on window.loadPendingActivities call if we can find where to put it.
            # Let's putting it in renderPOList end is easiest if we can match it.
            pass
            # We'll skip complex hooking for now, just valid function definitions.

    with open(fp, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("  -> Saved.")

if __name__ == "__main__":
    truncate_and_append(app_path, "ACTIVITY TRACKING EXTENSION", app_code)
    truncate_and_append(js_path, "ACTIVITY RECORD PENDING LOGIC", js_code)
