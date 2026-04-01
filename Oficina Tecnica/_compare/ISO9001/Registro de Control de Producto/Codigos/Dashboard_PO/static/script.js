// --- Authentication & Initialization ---

// --- Authentication & Initialization ---
window.onerror = function (msg, url, line, col, error) {
    // Filter out harmless errors if needed, but show everything for now
    if (msg.includes('ResizeObserver')) return;
    alert("ERROR CRITICO JS:\n" + msg + "\nLinea: " + line + "\n\nPor favor reporta esto.");
};

document.addEventListener('DOMContentLoaded', async () => {
    const login = document.getElementById('login-overlay');
    const container = document.querySelector('.container');

    // SAFE MODE: Start with Login Visible, Container Hidden
    // This ensures we never show a broken home screen
    if (login) login.style.display = 'flex';
    if (container) container.style.display = 'none';

    // Check if we have an active session
    const hasSessionFlag = sessionStorage.getItem('bpb_auth');

    // Only force logout if tab was closed/reopened (no session flag)
    if (!hasSessionFlag) {
        localStorage.removeItem('lastView');
        localStorage.removeItem('lastViewParam');
        sessionStorage.removeItem('bpb_auth');
        try { await fetch('/api/logout', { method: 'POST' }); } catch (_) { }
    }

    // Call checkSession to verifying session (it will hide login if successful)
    if (typeof checkSession === 'function') {
        try {
            await checkSession();
        } catch (e) {
            console.error("Critical: checkSession failed", e);
            // Ensure login remains visible on error
            if (login) login.style.display = 'flex';
            if (container) container.style.display = 'none';
        }
    }

    // Ensure ISO checkbox labels reflect checked state on load
    if (typeof bindIsoCheckboxStates === 'function') {
        bindIsoCheckboxStates();
    }
    if (typeof bindIsoDatePickers === 'function') {
        bindIsoDatePickers();
    }
    if (typeof setupIsoSolicitanteAutocomplete === 'function') {
        setupIsoSolicitanteAutocomplete();
    }
});
// Global checkSession removed to avoid race conditions

function showPassword(id) {
    const el = document.getElementById(id);
    if (el) el.type = 'text';
}

function hidePassword(id) {
    const el = document.getElementById(id);
    if (el) el.type = 'password';
}

// --- Image Modal Logic ---
function viewImage(src) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    if (modal && modalImg) {
        modal.style.display = "block";
        modalImg.src = src;
    }
}

function closeModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.style.display = "none";
    }
}

// Global User State

let currentUser = '';

let currentDisplayName = '';

let currentRole = '';
let notificationPoller = null;

let currentProfilePic = '';
let currentUserEmail = '';

window.isProcessing = false;

const isoApprovalUsers = ['Luciano Cochis', 'Lorenzo Contigiani'];
let isoApprovalCache = { names: [], emails: [] };

function isExternos() {
    return (window.currentUserRole || currentRole || '').toLowerCase() === 'externos';
}

function applyExternosHomeRestrictions() {
    if (!isExternos()) return;

    const home = document.getElementById('view-home');
    if (!home) return;

    const cards = Array.from(home.querySelectorAll('.dashboard-card'));
    if (!cards.length) return;

    const warn = () => {
        if (typeof showNotification === 'function') {
            showNotification('Acceso restringido para usuarios externos', 'error');
        } else {
            alert('Acceso restringido para usuarios externos');
        }
    };

    cards.forEach(card => {
        const titleEl = card.querySelector('.card-title');
        const statusEl = card.querySelector('.card-status');
        const title = n.title || (n.type === 'approval' ? 'Aprobacion pendiente' : (n.type === 'signature' ? 'Firma pendiente' : (n.type === 'activity_pending' ? 'Registro pendiente' : 'Notificacion')));
        const normalizedTitle = title.normalize('NFD').replace(new RegExp('[\u0300-\u036f]', 'g'), '');
        const allowTitles = ['herramientas', 'calculo de cubitaje'];
        const isAllowed = allowTitles.some(t => normalizedTitle.includes(t));

        if (isAllowed) {
            card.classList.add('active-card');
            card.classList.remove('deactivated');
            if (statusEl) statusEl.textContent = 'Activo';

            if (card.dataset.origOnclick) {
                card.setAttribute('onclick', card.dataset.origOnclick);
                delete card.dataset.origOnclick;
            }
        } else {
            if (!card.dataset.origOnclick && card.getAttribute('onclick')) {
                card.dataset.origOnclick = card.getAttribute('onclick');
            }
            card.removeAttribute('onclick');
            card.onclick = warn;
            card.classList.add('deactivated');
            card.classList.remove('active-card');
            if (statusEl) statusEl.textContent = 'Desactivado';
        }
    });
}


window.addEventListener('beforeunload', (e) => {

    if (window.isProcessing) {

        e.preventDefault();

        e.returnValue = 'Hay un proceso en curso. ¿Seguro que quieres salir?';

    }

});

window.addEventListener('resize', () => {
    const view = document.getElementById('view-iso-gantt');
    if (view && view.style.display !== 'none') {
        syncIsoGanttColumnWidths();
    }
});

document.addEventListener('scroll', () => {
    const container = document.querySelector('#view-iso-gantt .iso-gantt-container');
    if (!container) return;
    renderIsoGanttLinks();
}, true);

async function checkSession() {

    try {

        const response = await fetch('/api/check_session');

        const data = await response.json();

        if (data.status === 'authenticated') {

            // Strict Session Check: If sessionStorage flag is missing, it means tab was closed/reopened
            if (!sessionStorage.getItem('bpb_auth')) {
                console.log("Session cookie exists but tab flag missing. Logging out.");
                await fetch('/api/logout', { method: 'POST' });
                document.getElementById('login-overlay').style.display = 'flex';
                window.currentUserRole = 'guest';
                return;
            }

            document.getElementById('login-overlay').style.display = 'none';
            const container = document.querySelector('.container');
            if (container) container.style.display = 'block';

            // Store User State

            window.currentUserRole = data.role;

            currentUser = data.user;

            currentDisplayName = data.display_name || data.user;

            currentRole = data.role;

            currentProfilePic = data.profile_pic;

            currentUserEmail = data.email || '';

            try {
                if (typeof refreshIsoApprovalCache === 'function') {
                    await refreshIsoApprovalCache();
                }
            } catch (_) { }

            if (typeof loadNotifications === 'function') {
                await loadNotifications();
                if (notificationPoller) clearInterval(notificationPoller);
                notificationPoller = setInterval(loadNotifications, 60000);
            }

            // Trigger activity loading immediately after session is confirmed
            if (typeof loadPendingActivities === 'function') {
                loadPendingActivities();
            }

            // Pre-fetch PO Data to update Home Badges immediately
            if (typeof fetchData === 'function') {
                fetchData();
            }

            // Restore last view if available (F5/refresh preservation)
            let lastView = localStorage.getItem('lastView');
            let lastViewParam = localStorage.getItem('lastViewParam');

            if (isExternos()) {
                lastView = 'home';
                lastViewParam = null;
                localStorage.setItem('lastView', 'home');
                localStorage.removeItem('lastViewParam');
            }

            let viewRestored = false;

            if (lastView) {
                // Map stored view names to their corresponding functions
                const viewMap = {
                    'list': fetchData,
                    'po-module': showPOModule,
                    'iso-menu': showISOModule,
                    'iso-control': showISOControlPanel,
                    'iso-gantt': showISOGanttPanel,
                    'iso-info': () => {
                        const id = localStorage.getItem('lastViewParam');
                        if (typeof showISOInfoMenu === 'function') showISOInfoMenu(id);
                    },
                    'home': showHome,
                    'home-registros': showRegistrosHome,
                    'home-base-datos': showBaseDatosHome,
                    'home-herramientas': showHerramientasHome,
                    'subhome': showSubHome, // Handle both conventions
                    'sub-home': showSubHome,
                    'activity-subhome': showActivitySubHome, // Handle both conventions
                    'activity-sub-home': showActivitySubHome,
                    'activity-pending': showActivityPending,
                    'activity-records': showActivityRecordsMenu,
                    'activity-stats': () => { if (typeof renderActivityStats === 'function') renderActivityStats(); },
                    'admin-activity-stats': () => { if (typeof showAdminActivityStats === 'function') showAdminActivityStats(); },
                    'activity-history-detail': () => {
                        // Always call showActivityHistoryDetail, even without param
                        // The function will handle loading the user's data by default
                        if (typeof showActivityHistoryDetail === 'function') showActivityHistoryDetail();
                    },
                    'activity-entry': () => {
                        const id = localStorage.getItem('lastViewParam');
                        if (id && typeof showActivityEntry === 'function') showActivityEntry(id);
                        else if (typeof showActivitySubHome === 'function') showActivitySubHome();
                    },
                    'upload': () => { if (typeof showUploadForm === 'function') showUploadForm(); },
                    'profile': () => { if (typeof showUserProfile === 'function') showUserProfile(); },
                    'r016': () => { if (typeof showR016List === 'function') showR016List(); },
                    'aux-csv': () => {
                        const fname = localStorage.getItem('lastViewParam');
                        if (fname && typeof viewAuxiliarCSV === 'function') viewAuxiliarCSV(fname);
                        else if (typeof showR016List === 'function') showR016List();
                    },
                    'historial': () => { if (typeof showHistorial === 'function') showHistorial(); },
                    'historial-detail': () => {
                        const poId = localStorage.getItem('lastViewParam');
                        if (poId && typeof viewHistorialDetails === 'function') viewHistorialDetails(poId);
                        else if (typeof showHistorial === 'function') showHistorial();
                    },
                    'admin': () => { if (typeof showAdminPanel === 'function') showAdminPanel(); }
                };

                // Restore view if the function exists
                if (viewMap[lastView]) {
                    setTimeout(() => {
                        try {
                            viewMap[lastView]();
                        } catch (e) {
                            console.error("Error restoring view:", e);
                            if (typeof showHome === 'function') showHome();
                        }
                    }, 100);
                    viewRestored = true;
                }
            }

            if (!viewRestored) {
                // Default fallback if no view restored
                if (typeof showHome === 'function') showHome();
            }

        } else {
            document.getElementById('login-overlay').style.display = 'flex';
            window.currentUserRole = 'guest';
            sessionStorage.removeItem('bpb_auth');

            // Hide loader so login is visible
        }

    } catch (e) {
        console.error('Session check failed:', e);
        const login = document.getElementById('login-overlay');
        const container = document.querySelector('.container');

        if (container) container.style.display = 'none';
        if (login) login.style.display = 'flex';
    }
}

// Restoration of viewProductDetails logic for Level 3 View

function viewProductDetails(poId, pdfName, type) {

    const po = allData.find(d => d.id === poId);

    if (!po) return;

    // Switch Views

    document.getElementById('view-list').style.display = 'none';

    document.getElementById('view-detail').style.display = 'none';

    document.getElementById('view-product').style.display = 'block';

    animateEntry('view-product');

    // Clean Name

    let cleanName = pdfName.replace(/^[\(]?PO\d+[-_]?[\)]?\-?/i, '');

    cleanName = cleanName.replace(/[\(-]?\-?Rev[\s\.]*[a-zA-Z0-9]+[\)]?/gi, '');

    cleanName = cleanName.replace(/\.pdf$/i, '');

    cleanName = cleanName.replace(/^[-_\s]+|[-_\s]+$/g, '').trim();

    // Update Breadcrumb

    const titleEl = document.getElementById('main-title');

    titleEl.innerHTML = `

        <span class="breadcrumb-link" onclick="showListView()">Oficina Técnica</span> 

        <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> 

        <span class="breadcrumb-link" onclick="viewPoDetails('${poId}')">${poId}</span>

        <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

        <span class="current" style="color:var(--text-primary);">${cleanName}</span>

    `;

    const headerActions = document.getElementById('header-actions');

    headerActions.innerHTML = `<button class="btn" onclick="viewPoDetails('${poId}')">&larr; Volver a la PO</button>`;

    const content = document.getElementById('product-content');

    // --- Intelligent CSV Matching ---

    let csvHtml = '';

    let match = null;

    // 1. Intelligent Matching

    if (po.content.csvs && po.content.csvs.length > 0) {

        const normalize = (s) => s.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase();

        const target = normalize(pdfName);

        match = po.content.csvs.find(c => {

            const candidate = normalize(c.filename);

            return candidate === target || candidate.includes(target) || target.includes(candidate);

        });

        if (!match && po.content.csvs.length > 0) {

            match = po.content.csvs[0];

        }

    }

    if (match && match.rows.length > 0) {

        const headers = match.headers || Object.keys(match.rows[0]);

        // Store globals for edit

        window.currentCSVPOD = poId;

        window.currentProductView = { poId, pdfName, type };

        const safeId = match.filename.replace(/[^a-zA-Z0-9]/g, '_');

        csvHtml = `

            <div id="csv-wrapper-${safeId}" style="width: 100%; max-width: 100%; margin-bottom: 1rem; border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">

                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(255,255,255,0.05); border-bottom: 1px solid var(--border);">

                    <div style="font-size: 0.9rem; color: var(--text-primary);">

                        <strong>Archivo de Origen:</strong> ${match.filename}

                    </div>

                    <div style="display: flex; gap: 0.8rem; align-items: center;">

                        <!-- Selection Control (Custom Dropdown) -->

                        <div style="display: flex; align-items: center; gap: 8px; margin-right: 8px;">

                            <span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">Ubicacion de Registro:</span>

                            <div style="position: relative; min-width: 160px;">

                                <!-- Trigger -->

                                <div id="aux-dropdown-trigger" onclick="window.toggleAuxDropdown()" style="display: flex; align-items: center; justify-content: space-between; padding: 0 10px; border: 1px solid var(--text-secondary); border-radius: 4px; cursor: pointer; background: transparent; color: white; font-size: 0.9rem; font-weight: 500; height: 30px; transition: all 0.2s;">

                                    <span id="aux-dropdown-selected-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 8px;">Nueva Linea</span>

                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><polyline points="6 9 12 15 18 9"></polyline></svg>

                                </div>

                                <!-- Menu -->

                                <div id="aux-dropdown-menu" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; min-width: 100%; width: max-content; background: #1e1e1e; border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 1000; overflow: hidden; animation: fadeIn 0.1s ease-out;">

                                    <div onclick="window.selectAuxOption('new', 'Nueva Linea')" class="aux-option-item" style="padding: 10px 14px; cursor: pointer; font-size: 0.85rem; color: #eee; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap;">Nueva Linea</div>

                                </div>

                                <input type="hidden" id="aux-placement-value" value="new">

                            </div>

                        </div>

                        <div style="width: 1px; height: 24px; background: var(--border); margin-right: 8px;"></div>

                        <button id="btn-mod-${safeId}" onclick="enableEdit('${safeId}')" class="btn" style="display: flex; align-items: center; gap: 8px;">

                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>

                            Modificar

                        </button>

                        <div id="actions-${safeId}" style="display:none; gap: 1rem; align-items: center;">

                            <button onclick="cancelEdit()" 

                                    class="btn-circle-action btn-circle-cancel" 

                                    title="Cancelar">

                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>

                            </button>

                            <button id="btn-save-${safeId}" onclick="saveEdit('${safeId}', '${poId}', '${match.filename}')" 

                                    class="btn-circle-action btn-circle-save" 

                                    title="Guardar">

                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>

                            </button>

                        </div>

                    </div>

                </div>

                <div class="table-container" style="border:none;">

                    <table class="csv-data-table" id="table-${safeId}" data-filename="${match.filename}">

                        <thead>

                            <tr>${headers.map(k => `<th>${k}</th>`).join('')}</tr>

                        </thead>

                        <tbody>

                            ${match.rows.map(row => `

                                <tr>${headers.map(k => `<td>${row[k] || ''}</td>`).join('')}</tr>

                            `).join('')}

                        </tbody>

                    </table>

                </div>

            </div>

            <div id="aux-container-${safeId}"></div>

            `;

    } else {

        csvHtml = '<p style="color: var(--text-secondary);">No se encontraron datos de registro para este producto.</p>';

    }

    // PDF Embed

    const pdfUrl = `/files/${encodeURIComponent(poId)}/${encodeURIComponent(pdfName)}`;

    const pdfHtml = `

        <div class="pdf-container" style="height: 600px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-top: 1rem;">

            <iframe src="${pdfUrl}" width="100%" height="100%" style="border: none;"></iframe>

        </div>

    `;

    content.innerHTML = `

        <div class="detail-section">

            <h3 style="color: #ce1919; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Datos Extraídos de Plano</h3>

            ${csvHtml}

        </div>

        

        <div class="detail-section" style="margin-top: 2rem;">

            <h3 style="color: var(--bpb-blue); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Plano del Producto</h3>

            ${pdfHtml}

        </div>

    `;

    // Trigger Aux Load if match linked

    if (match && match.rows && match.rows.length > 0) {

        try {

            // Re-calc safeId for container targeting

            const safeId = match.filename.replace(/[^a-zA-Z0-9]/g, '_');

            const headers = match.headers || Object.keys(match.rows[0]);

            if (headers.length > 0) {

                const code = match.rows[0][headers[0]];

                // Call the global function

                if (code && window.loadAuxTable) {

                    window.loadAuxTable(poId, code, `aux-container-${safeId}`);

                }

            }

        } catch (e) { console.error("Aux trigger error", e); }

    }

}

// Global Export

window.viewProductDetails = viewProductDetails;

window.handleLoginKey = handleLoginKey;

window.toggleRegister = toggleRegister;

window.register = register;

function handleLoginKey(e) {

    if (e.key === 'Enter') {

        login();

    }

}

function handleResetKey(e) {
    if (e.key === 'Enter') {
        requestReset();
    }
}

function handleRegisterKey(e) {
    if (e.key === 'Enter') {
        register();
    }
}

function toggleRegister() {

    const loginForm = document.getElementById('login-form');

    const regForm = document.getElementById('register-form');

    if (loginForm.style.display === 'none') {

        loginForm.style.display = 'flex';

        regForm.style.display = 'none';

        document.getElementById('login-error').style.display = 'none';

    } else {

        loginForm.style.display = 'none';

        regForm.style.display = 'flex';

        document.getElementById('reg-error').style.display = 'none';

    }

}

function handleRegisterKey(e) {

    if (e.key === 'Enter') {

        register();

    }

}

async function register() {

    const userIn = document.getElementById('reg-username');

    const passIn = document.getElementById('reg-password');

    const errorEl = document.getElementById('reg-error');

    if (!userIn.value || !passIn.value) {

        errorEl.textContent = "Complete todos los campos";

        errorEl.style.display = 'block';

        return;

    }

    // Simple Email Validation

    if (!userIn.value.includes('@') || !userIn.value.includes('.')) {

        errorEl.textContent = "Ingrese un email válido";

        errorEl.style.display = 'block';

        return;

    }

    const btn = document.querySelector('#register-form .btn-primary');

    const originalText = btn.innerText;

    btn.innerText = "Registrando...";

    btn.disabled = true;

    try {

        const response = await fetch('/api/register', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                username: userIn.value,

                password: passIn.value

            })

        });

        const res = await response.json();

        if (res.status === 'success') {

            // Success: Switch to Login

            toggleRegister();

            // Clear inputs

            userIn.value = '';

            passIn.value = '';

            // Show Custom Success "Cartel" (Modal)

            const modalId = 'reg-success-modal';

            const modal = document.createElement('div');

            modal.id = modalId;

            modal.className = 'modal-overlay';

            modal.onclick = function (e) { if (e.target === modal) modal.remove(); }; // Click outside to close

            modal.innerHTML = `

                <div class="modal-confirm-wrapper" style="text-align: center; max-width: 450px;">

                    <div style="margin-bottom: 1rem;">

                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" class="check-icon" style="stroke: var(--success); stroke-width: 2;">

                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>

                            <path d="M22 4L12 14.01l-3-3" stroke-linecap="round" stroke-linejoin="round"/>

                        </svg>

                    </div>

                    <h2 style="color: #fff; margin-bottom: 0.5rem;">¡Registro Exitoso!</h2>

                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5;">

                        Su cuenta ha sido creada correctamente.<br>

                        <strong style="color: #fff;">Debe esperar la aprobación del administrador</strong> para poder ingresar al sistema.

                    </p>

                    <button class="btn btn-primary" style="width: 100%; padding: 10px;" onclick="document.getElementById('${modalId}').remove()">Aceptar</button>

                </div>

            `;

            document.body.appendChild(modal);

        } else {

            errorEl.textContent = res.message;

            errorEl.style.display = 'block';

        }

    } catch (e) {

        console.error("Register Error:", e);

        errorEl.textContent = "Error de conexión";

        errorEl.style.display = 'block';

    } finally {

        btn.innerText = originalText;

        btn.disabled = false;

    }

}

// ==============================================================================
// ACTIVITY EDITING (Modal-based)
// ==============================================================================
window._currentEditToken = null;
window._currentEditOriginalProject = null;  // NEW: track original project

// Ensure edit modal exists in DOM (fixes browser cache issues)
function ensureEditModalExists() {
    let modal = document.getElementById('edit-activity-modal');
    if (modal) return true;  // Already exists

    console.log('Modal not found in HTML, creating dynamically...');

    // Create modal HTML dynamically
    const modalHTML = `
    <div id="edit-activity-modal" class="modal-overlay" style="display: none;">
        <div class="modal-confirm-wrapper" style="width: 900px; max-width: 95%; text-align: left; padding: 0;">
            <div style="padding: 2rem; background: var(--card-bg); border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom: 1px solid var(--border);">
                <h3 style="color: var(--bpb-blue); margin: 0; font-size: 1.5rem;">Modificar Registro de Actividad</h3>
                <div id="edit-modal-subtitle" style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.9rem;"></div>
            </div>
            <div style="padding: 2rem; max-height: 70vh; overflow-y: auto;">
                <div class="activity-form-grid">
                    <div class="activity-section">
                        <span class="activity-section-title">1. Proyecto</span>
                        <div class="project-input-container">
                            <input type="text" id="activity-input-project-edit" class="project-input project-input-dynamic" placeholder="Escriba para buscar proyecto..." autocomplete="off">
                            <div id="project-suggestions-edit" class="suggestions-list" style="display: none;"></div>
                        </div>
                    </div>
                    <div class="activity-section" style="margin-top: 1.5rem;">
                        <span class="activity-section-title">2. Tiempo Destinado (Horas)</span>
                        <div class="time-wheel-container time-wheel-dynamic" id="time-wheel-edit"></div>
                        <input type="hidden" id="activity-input-time-edit" value="0">
                    </div>
                    <div class="activity-section" style="flex: 1; min-height: 200px; margin-top: 1.5rem;">
                        <span class="activity-section-title">3. Descripción</span>
                        <div class="desc-area-container">
                            <textarea id="activity-input-text-edit" class="desc-input-dynamic" style="width: 100%; flex: 1; background: transparent; border: none; color: var(--text-primary); font-family: 'Manrope', sans-serif; font-size: 1rem; resize: none; outline: none;" placeholder="Detalles de la modificación..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-actions" style="justify-content: flex-end; padding: 1.5rem 2rem; border-top: 1px solid var(--border); background: rgba(0,0,0,0.2);">
                <button class="btn" style="border-color: var(--text-secondary); color: var(--text-secondary); margin-right: 1rem;" onclick="closeEditModal()">Cancelar</button>
                <button class="btn btn-primary" id="btn-save-activity" onclick="saveEditedActivity()">Guardar Cambios</button>
            </div>
        </div>
    </div>`;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('Modal created successfully');
    return true;
}

function showEditActivityModal(token, description, time, project, dateObj, retryCount = 0) {
    // Ensure modal exists (create dynamically if needed)
    ensureEditModalExists();

    window._currentEditToken = token;
    window._currentEditOriginalProject = project;  // NEW: store original project
    window._currentEditProject = project;

    const modal = document.getElementById('edit-activity-modal');

    // New Inputs
    const descInput = document.getElementById('activity-input-text-edit');
    const timeInput = document.getElementById('activity-input-time-edit');
    const projInput = document.getElementById('activity-input-project-edit');
    const subtitle = document.getElementById('edit-modal-subtitle');

    if (!modal) {
        console.error('ERROR: Modal element not found even after creation! Attempt ' + (retryCount + 1) + '/2');
        // Retry once after a brief delay, then give up
        if (retryCount < 1) {
            setTimeout(() => showEditActivityModal(token, description, time, project, dateObj, retryCount + 1), 150);
            return;
        } else {
            console.error('CRITICAL: Modal creation failed completely. Please contact support.');
            return;
        }
    }

    if (!descInput || !timeInput || !projInput) {
        console.error('ERROR: Input elements not found!', { descInput, timeInput, projInput });
        return;
    }

    if (modal) {
        // Update Subtitle
        if (subtitle) {
            subtitle.textContent = `Fecha: ${dateObj || 'N/A'} | Token: ${token || 'N/A'}`;
        }


        // 1. Initialize Components (Idempotent)
        if (typeof generateTimeWheel === 'function') {
            generateTimeWheel('edit'); // Pass string ID
        } else {
            console.warn('generateTimeWheel function not found');
        }

        // Setup Autocomplete (We may need to ensure we don't duplicate listeners)
        // We assume setupProjectAutocomplete can handle string 'edit'
        if (typeof setupProjectAutocomplete === 'function') {
            // We need to check if we already setup this one? 
            // setupProjectAutocomplete attaches listeners. Doing it multiple times is bad.
            if (!window._editAutocompleteReady) {
                setupProjectAutocomplete('edit');
                window._editAutocompleteReady = true;
            }
        } else {
            console.warn('setupProjectAutocomplete function not found');
        }

        modal.style.display = 'flex';

        // 2. Populate Data
        if (descInput) descInput.value = description || '';

        if (projInput) projInput.value = project || '';

        if (timeInput) {
            // "1 h" -> 1 (Number)
            let rawTime = (time || '0').toString().toLowerCase().replace('horas', '').replace('h', '').replace(',', '.').trim();
            // Handle time wheel selection
            if (rawTime) {
                timeInput.value = rawTime;
                if (typeof updateTimeWheelVisuals === 'function') {
                    updateTimeWheelVisuals('edit', rawTime); // Helper we need to check
                }
            }
        }

        // Focus on description
        // setTimeout(() => descInput.focus(), 100);

    }
}

function closeEditModal() {
    window._currentEditToken = null;
    const modal = document.getElementById('edit-activity-modal');
    if (modal) modal.style.display = 'none';
}

async function saveEditedActivity() {
    if (!window._currentEditToken) return;

    const descInput = document.getElementById('activity-input-text-edit');
    const timeInput = document.getElementById('activity-input-time-edit');
    const projInput = document.getElementById('activity-input-project-edit');

    const btn = document.getElementById('btn-save-activity');

    // Validate
    if (!projInput.value) {
        showNotification("Debe seleccionar un proyecto.", "error"); // Use toast if available
        return;
    }

    let timeVal = parseFloat(timeInput.value) || 0;
    if (timeVal <= 0) {
        showNotification("Debe asignar tiempo válido.", "error");
        return;
    }

    const payload = {
        token: window._currentEditToken,
        original_project: window._currentEditOriginalProject,  // NEW: original project for matching
        project: projInput.value,  // NEW: allow updating project
        description: descInput.value,
        time: String(timeVal).replace('.', ',') + " Horas"
    };

    // UI Loading State
    const originalText = btn.innerText;
    btn.innerText = "Guardando...";
    btn.disabled = true;

    try {
        const res = await fetch('/api/activity-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            let errMsg = "Error del servidor";
            try { errMsg = JSON.parse(errText).message || errMsg; } catch (e) { }
            if (res.status === 404) errMsg = "No se encontró el archivo del usuario (404).";
            throw new Error(errMsg);
        }

        const data = await res.json();

        if (data.status === 'success') {
            closeEditModal();
            // Refresh
            if (typeof showActivityHistoryDetail === 'function') {
                showActivityHistoryDetail();
            }
            if (typeof showNotification === 'function') {
                showNotification("Actividad actualizada", "success");
            }

        } else {
            if (typeof showNotification === 'function') {
                showNotification("Error: " + (data.message || "Fallo"), "error");
            } else {
                alert("Error: " + data.message);
            }
        }

    } catch (e) {
        console.error(e);
        alert("Error de conexión al guardar.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}


function handleLoginKey(e) {
    if (e && e.key === 'Enter') login();
}

function handleResetKey(e) {
    if (e && e.key === 'Enter') requestReset();
}

// ... existing login function ...

async function login() {

    const userIn = document.getElementById('username');

    const passIn = document.getElementById('password');

    const errorEl = document.getElementById('login-error');

    if (!userIn.value || !passIn.value) {

        errorEl.textContent = "Por favor ingrese usuario y contraseña";

        errorEl.style.display = 'block';

        return;

    }

    const btn = document.querySelector('.login-card .btn');

    const originalText = btn.innerText;

    btn.innerText = "Ingresando...";

    btn.disabled = true;

    try {

        const response = await fetch('/api/login', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                username: userIn.value,

                password: passIn.value

            })

        });

        const res = await response.json();

        if (res.status === 'success') {

            document.getElementById('login-overlay').style.display = 'none';

            // Cleanup any stray modals (e.g. registration success) that might be lingering

            document.querySelectorAll('.modal-overlay').forEach(el => el.remove());

            showNotification('Bienvenido ' + userIn.value, 'success');

            window.currentUserRole = res.role; // Store role

            sessionStorage.setItem('bpb_auth', 'true');
            await checkSession();

        } else {

            errorEl.textContent = res.message || "Credenciales inv\u00E1lidas";

            errorEl.style.display = 'block';

        }

    } catch (e) {

        errorEl.textContent = "Error de conexión";

        errorEl.style.display = 'block';

    } finally {

        btn.innerText = originalText;

        btn.disabled = false;

    }

}

async function logout() {

    try {

        await fetch('/api/logout', { method: 'POST' });

        location.reload();

    } catch (e) {

        console.error(e);

        location.reload();

    }

}

// TOGGLE FORGOT FORM
function toggleForgot() {
    const loginForm = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-form');

    if (forgotForm.style.display === 'none') {
        loginForm.style.display = 'none';
        forgotForm.style.display = 'block';
        document.getElementById('forgot-email').focus();
    } else {
        loginForm.style.display = 'block';
        forgotForm.style.display = 'none';
        // Clear inputs
        document.getElementById('forgot-email').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        document.getElementById('forgot-error').style.display = 'none';
        document.getElementById('forgot-success').style.display = 'none';

        // Hide caps warnings
        document.getElementById('caps-warning-reset').style.display = 'none';
        document.getElementById('caps-warning-reset-confirm').style.display = 'none';
    }
}

// CAPS LOCK DETECTION
function checkCapsLock(event, warningId) {
    if (event.getModifierState && event.getModifierState("CapsLock")) {
        document.getElementById(warningId).style.display = "block";
    } else {
        document.getElementById(warningId).style.display = "none";
    }
}

// Bind Caps Lock Listeners
document.addEventListener('DOMContentLoaded', () => {
    const setupCapsListener = (inputId, warningId) => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keyup', (e) => checkCapsLock(e, warningId));
            input.addEventListener('mousedown', (e) => checkCapsLock(e, warningId));
            input.addEventListener('keydown', (e) => checkCapsLock(e, warningId)); // extra safety
            input.addEventListener('focus', (e) => checkCapsLock(e, warningId));
            input.addEventListener('blur', () => {
                document.getElementById(warningId).style.display = "none";
            });
        }
    };

    setupCapsListener('password', 'caps-warning-login');
    setupCapsListener('new-password', 'caps-warning-reset');
    setupCapsListener('confirm-password', 'caps-warning-reset-confirm');
    setupCapsListener('reg-password', 'caps-warning-reg');
});

// REQUEST RESET
async function requestReset() {
    const email = document.getElementById('forgot-email').value.trim();
    const pass1 = document.getElementById('new-password').value;
    const pass2 = document.getElementById('confirm-password').value;
    const errorEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    const btn = document.querySelector('#forgot-form .btn-primary');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!email || !pass1 || !pass2) {
        errorEl.textContent = "Complete todos los campos.";
        errorEl.style.display = 'block';
        return;
    }

    if (pass1 !== pass2) {
        errorEl.textContent = "Las contraseñas no coinciden.";
        errorEl.style.display = 'block';
        return;
    }

    const originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/request-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, new_password: pass1 })
        });
        const res = await response.json();

        if (res.status === 'success') {
            successEl.textContent = res.message;
            successEl.style.display = 'block';
            // Disable inputs on success
            document.getElementById('forgot-email').disabled = true;
            document.getElementById('forgot-pass-1').disabled = true;
            document.getElementById('forgot-pass-2').disabled = true;
            btn.style.display = 'none'; // Hide button to prevent re-submit
        } else {
            errorEl.textContent = res.message || "Error al solicitar cambio.";
            errorEl.style.display = 'block';
        }
    } catch (e) {
        console.error(e);
        errorEl.textContent = "Error de conexión.";
        errorEl.style.display = 'block';
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Global State

let allData = [];

let currentPO = null;

// DOM Elements

const searchInput = document.getElementById('searchInput'); // New Search Input

async function softRefresh(btnElement) {
    const icon = btnElement.querySelector('svg');
    const animDuration = 1000; // Must match CSS animation duration (1s)
    const startTime = Date.now();

    if (icon) {
        icon.classList.add('icon-spin');
    }

    try {
        console.log("Soft refreshing data...");

        const promises = [];

        // --- Context Aware Refresh Logic ---

        // 1. Activity Statistics
        const statsView = document.getElementById('view-activity-stats');
        if (statsView && statsView.style.display !== 'none') {
            if (typeof showActivityStats === 'function' && window.statsConfig) {
                // Trigger re-render which handles fetching if needed (statsConfig has fetchUrl)
                promises.push(showActivityStats(window.statsConfig));
            }
        }
        // 2. Admin Users
        else if (document.getElementById('admin-users-view') && document.getElementById('admin-users-view').style.display !== 'none') {
            if (typeof loadAdminUsers === 'function') promises.push(loadAdminUsers());
        }
        // 3. Activity Entry (My Activity)
        else if (document.getElementById('view-activity-entry') && document.getElementById('view-activity-entry').style.display !== 'none') {
            if (typeof showActivityEntry === 'function') promises.push(showActivityEntry());
        }
        // 4. Auxiliar / Historial Views
        else if (document.getElementById('view-auxiliar') && document.getElementById('view-auxiliar').style.display !== 'none') {
            // Sub-view: History List
            if (document.getElementById('aux-historial-view') && document.getElementById('aux-historial-view').style.display !== 'none') {
                if (typeof showHistorialPOList === 'function') promises.push(showHistorialPOList());
            }
            // Sub-view: R016 List
            else if (document.getElementById('aux-list-view') && document.getElementById('aux-list-view').style.display !== 'none') {
                if (typeof showR016List === 'function') promises.push(showR016List());
            }
            // Sub-view: Detail View (Inside Aux)
            else if (document.getElementById('aux-historial-detail-view') && document.getElementById('aux-historial-detail-view').style.display !== 'none') {
                // Harder to refresh dynamic detail without ID. Best effort: reload history list
                if (typeof showHistorialPOList === 'function') promises.push(showHistorialPOList());
            }
        }
        // 5. Logistics Views (Calculator / Records)
        else if (document.getElementById('view-logistics') && document.getElementById('view-logistics').style.display !== 'none') {
            if (typeof resetLogisticsCalculator === 'function') resetLogisticsCalculator();
        }
        else if (document.getElementById('view-logistics-records') && document.getElementById('view-logistics-records').style.display !== 'none') {
            if (typeof loadLogisticsRecords === 'function') promises.push(loadLogisticsRecords());
        }
        // 6. Planilla List
        else if (document.getElementById('view-planilla-list') && document.getElementById('view-planilla-list').style.display !== 'none') {
            if (typeof loadPlanillaFiles === 'function') promises.push(loadPlanillaFiles());
        }
        // 7. Main Views (List or Detail)
        else {
            // Default behavior: Fetch Global Data
            const fetchPromise = fetchData();
            promises.push(fetchPromise);

            // Refine: If in Detail View, re-render detail after fetch
            const detailView = document.getElementById('view-detail');
            if (detailView && detailView.style.display !== 'none' && currentPO) {
                // Chain the update
                promises.push(fetchPromise.then(() => {
                    const updatedPO = allData.find(d => d.id === currentPO.id);
                    if (updatedPO) {
                        currentPO = updatedPO; // Update Ref
                        renderProductTable(currentPO, currentPO.files.pdfs);
                        renderLegacyCSV(currentPO);
                    }
                }));
            }
        }

        // Always reload pending activities count if available (Global Badge)
        if (typeof loadPendingActivities === 'function') {
            promises.push(loadPendingActivities());
        }

        await Promise.all(promises);
        console.log("Soft refresh completed.");

    } catch (e) {
        console.error("Soft refresh failed:", e);
    } finally {
        // Calculate how much of the current loop has passed
        const elapsed = Date.now() - startTime;
        // Find time remaining to complete the current full loop
        const remaining = animDuration - (elapsed % animDuration);

        // Wait exactly that amount so we stop at 0deg (360deg)
        setTimeout(() => {
            if (icon) {
                icon.classList.remove('icon-spin');
            }
        }, remaining);
    }
}


async function fetchData() {

    try {

        const response = await fetch('/api/data');

        const data = await response.json();

        allData = data;

        updatePOCounterUI(); // Update Badge

        renderPOList(data); // Renamed form renderTable

    } catch (error) {

        console.error('Error fetching data:', error);

        document.getElementById('po-table').querySelector('tbody').innerHTML =

            `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">Error loading data: ${error.message}</td></tr>`;

    }

}


function updateRegistrosHomeBadge() {
    const badge = document.getElementById('registros-notification-container');
    if (!badge) return;

    const poCount = Array.isArray(allData) ? allData.length : 0;
    const actCount = Array.isArray(window._pendingActivities) ? window._pendingActivities.length : 0;
    const total = poCount + actCount;

    if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'flex';
        badge.style.transform = 'scale(0)';
        setTimeout(() => badge.style.transform = 'scale(1)', 50);
        badge.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    } else {
        badge.style.display = 'none';
    }
}

function updatePOCounterUI() {

    const badge = document.getElementById('po-count-badge');
    const homeBadge = document.getElementById('home-po-count-badge');

    if (allData && allData.length > 0) {

        // Update Main Badge
        if (badge) {
            badge.innerText = allData.length;
            badge.style.display = 'flex';
            badge.style.transform = 'scale(0)';
            setTimeout(() => badge.style.transform = 'scale(1)', 100);
            badge.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }

        // Update Home Badge
        if (homeBadge) {
            homeBadge.innerText = allData.length;
            homeBadge.style.display = 'flex';
            homeBadge.style.transform = 'scale(0)';
            setTimeout(() => homeBadge.style.transform = 'scale(1)', 100);
            homeBadge.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }

    } else {

        if (badge) badge.style.display = 'none';
        if (homeBadge) homeBadge.style.display = 'none';

    }

    updateRegistrosHomeBadge();
}



// Search Feature

if (searchInput) {

    searchInput.addEventListener('input', (e) => {

        const query = e.target.value.toLowerCase().trim();

        filterData(query);

    });

}

function filterData(query) {

    // Legacy / Admin fallback if needed, or unused.

    // Logic moved to specific handlers.

}

function handlePOSearch(input) {

    const query = input.value.toLowerCase();

    if (!query) {

        renderPOList(allData);
        if (typeof loadPendingActivities === 'function') { loadPendingActivities(); }

        return;

    }

    const filtered = allData.filter(po => {

        const json = po.content.json || {};

        const searchStr = `${po.id} ${json.supplier || ''} ${json.date || ''}`.toLowerCase();

        return searchStr.includes(query);

    });

    renderPOList(filtered);

}

function handleProductSearchPending(input) {

    const query = input.value.toLowerCase();

    if (!currentPO) return;

    const products = currentPO.files.pdfs || [];

    if (!query) {

        renderProductTable(currentPO, products);

        return;

    }

    const filteredProducts = products.filter(pdf => pdf.toLowerCase().includes(query));

    renderProductTable(currentPO, filteredProducts);

}

function renderPOList(data) {

    const tbody = document.querySelector('#po-table tbody');

    tbody.innerHTML = '';

    // --- SYNC LOCAL STORAGE WITH SERVER TRUTH ---

    data.forEach(po => {

        if (po.files && po.files.approved_items) {

            const key = `approved_items_${po.id}`;

            localStorage.setItem(key, JSON.stringify(po.files.approved_items));

        }

    });

    // --------------------------------------------

    // Apply Filter (currentPOFilter is global)

    let filteredData = data;

    if (typeof currentPOFilter !== 'undefined' && currentPOFilter !== 'all') {

        filteredData = data.filter(po => {

            const pdfs = po.files.pdfs || [];

            if (pdfs.length === 0) return currentPOFilter === 'pending'; // No files

            const approvedList = getApprovedItems(po.id);

            const approvedCount = approvedList.filter(item => pdfs.includes(item)).length;

            const percentage = Math.round((approvedCount / pdfs.length) * 100);

            if (currentPOFilter === 'approved') return percentage === 100;

            if (currentPOFilter === 'pending') return percentage < 100;

            return true;

        });

    }

    if (filteredData.length === 0) {

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-secondary); padding: 3rem;">No se encontraron registros.</td></tr>';

        return;

    }

    filteredData.forEach(po => {

        const tr = document.createElement('tr');

        tr.id = `row-${po.id}`;

        const jsonContent = po.content.json || {};

        const pdfs = po.files.pdfs || [];

        const total = pdfs.length;

        const approvedList = getApprovedItems(po.id);

        const approvedCount = approvedList.filter(item => pdfs.includes(item)).length;

        let percentage = 0;

        if (total > 0) percentage = Math.round((approvedCount / total) * 100);

        tr.innerHTML = `

            <td class="po-id-cell"><strong>${po.id}</strong></td>

            <td>${jsonContent.supplier || '-'}</td>

            <td>${jsonContent.date || '-'}</td>

            <td>${po.system_date || '-'}</td>

            <td>

                <div style="width: 100%;">

                   <div class="progress-track"><div class="progress-fill" style="width: ${percentage}%"></div></div>

                   <span class="progress-text">${approvedCount}/${total} (${percentage}%)</span>

                </div>

            </td>

            <td>

                <button class="btn" onclick="viewPoDetails('${po.id}')">Ver Productos</button>

            </td>

            <td>

                <button class="btn btn-approve" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" onclick="approvePORegistryV4('${po.id}', this)">Aprobar Registro</button>

            </td>

        `;

        tbody.appendChild(tr);

    });

}

function viewPoDetails(poId) {

    console.log(`viewPoDetails called for ${poId}`);

    const po = allData.find(d => d.id === poId);

    if (!po) return;

    currentPO = po;

    // Switch Views

    document.getElementById('view-list').style.display = 'none';

    document.getElementById('view-product').style.display = 'none';

    document.getElementById('view-detail').style.display = 'block';

    animateEntry('view-detail');

    // Update Title (Breadcrumb style but static text)

    const titleEl = document.getElementById('main-title');

    titleEl.innerHTML = `Registros Pendientes <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> ${poId}`;

    // Inject Search + Back Button (Right side)

    const headerActions = document.getElementById('header-actions');

    headerActions.innerHTML = `

        <div style="display: flex; gap: 1rem; align-items: center;">

            <input type="text" id="product-search-input" placeholder="Buscar Producto..." class="search-input" style="max-width: 250px;" onkeyup="handleProductSearchPending(this)">

            <button class="btn" onclick="showListView()">&larr; Volver</button>

        </div>

    `;

    // Initial Render of Product Table

    renderProductTable(po, po.files.pdfs || []);

    // Render Legacy CSV

    renderLegacyCSV(po);

}

// --- Logic for Approval ---

let currentStatusFilter = 'all';

function setStatusFilter(status) {

    currentStatusFilter = status;

    // Re-render with current PO

    if (currentPO) renderProductTable(currentPO, currentPO.files.pdfs);

}

// --- Modal Helpers ---

// --- Unified Modal Helpers ---

let globalConfirmCallback = null;

function showConfirm(message, callback, title = 'Confirmación', titleColor = 'var(--bpb-blue)') {

    const msgEl = document.getElementById('confirm-message');

    const titleEl = document.getElementById('confirm-title');

    let modal = document.getElementById('confirm-modal');
    if (!modal) {
        // Dynamically create modal if missing
        modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-confirm-wrapper" style="max-width:400px; text-align:center;">
                <h3 id="confirm-title" style="margin-top:0; color:var(--bpb-blue);">Confirmación</h3>
                <p id="confirm-message" style="margin:20px 0; color:#ddd; line-height:1.5;"></p>
                <div class="modal-actions" style="justify-content:center; gap:12px;">
                    <button class="btn" style="border:1px solid #444;" onclick="closeConfirmModal(false)">Cancelar</button>
                    <button class="btn btn-primary" onclick="closeConfirmModal(true)">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Reset buttons to default

    const btnCancel = modal.querySelector('.modal-actions button:first-child');

    const btnConfirm = modal.querySelector('.modal-actions button:last-child');

    if (btnCancel) btnCancel.textContent = 'Cancelar';

    if (btnConfirm) btnConfirm.textContent = 'Confirmar';

    if (msgEl && modal) {

        msgEl.innerHTML = message;

        if (titleEl) {

            titleEl.innerText = title;

            titleEl.style.color = titleColor;

        }

        modal.style.display = 'flex';

        // Adapting callback: showConfirm users expect legacy behavior (callback only on success)

        globalConfirmCallback = (result) => {

            if (result && callback) callback();

        };

    }

}

function showCustomConfirm(title, message, cancelText, confirmText, callback) {

    const modal = document.getElementById('confirm-modal');

    const titleEl = document.getElementById('confirm-title');

    const msgEl = document.getElementById('confirm-message');

    const btnCancel = modal.querySelector('.modal-actions button:first-child');

    const btnConfirm = modal.querySelector('.modal-actions button:last-child');

    if (titleEl) titleEl.textContent = title;

    if (msgEl) msgEl.innerHTML = message;

    if (btnCancel) btnCancel.textContent = cancelText;

    if (btnConfirm) btnConfirm.textContent = confirmText;

    // showCustomConfirm users expect boolean result in callback

    globalConfirmCallback = callback;

    modal.style.display = 'flex';

}

function closeConfirmModal(confirmed) {

    const modal = document.getElementById('confirm-modal');

    if (modal) modal.style.display = 'none';

    if (globalConfirmCallback) {

        globalConfirmCallback(confirmed);

        globalConfirmCallback = null;

    }

}

window.closeConfirmModal = closeConfirmModal;

function approveAllProducts(poId) {

    showConfirm(`¿Deseas aprobar TODOS los productos de la orden ${poId}?`, () => {

        const key = `approved_items_${poId}`;

        const po = allData.find(d => d.id === poId);

        if (!po || !po.files.pdfs) return;

        const allPdfs = po.files.pdfs;

        // 1. Local Storage

        localStorage.setItem(key, JSON.stringify(allPdfs));

        // 2. Global State Update (Critical for consistency on Back navigation)

        if (po.files) {

            po.files.approved_items = [...allPdfs];

        }

        // 3. Backend Update

        fetch('/api/save-po-progress', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ po_id: poId, approved_items: allPdfs })

        }).catch(e => console.error("Error saving progress:", e));

        // 4. Re-render

        renderProductTable(po, allPdfs);

    });

}

function getApprovedItems(poId) {

    const key = `approved_items_${poId}`;

    try {

        return JSON.parse(localStorage.getItem(key)) || [];

    } catch (e) { return []; }

}

function toggleProductApproval(index, poId, filename) {

    const key = `approved_items_${poId}`;

    let list = getApprovedItems(poId);

    let isApproved = false;

    if (!list.includes(filename)) {

        list.push(filename);

        isApproved = true;

    } else {

        // Allow toggle off

        list = list.filter(f => f !== filename);

        isApproved = false;

    }

    // 1. Local Storage Update

    localStorage.setItem(key, JSON.stringify(list));

    // 2. Server Side Update (Save Progress)

    fetch('/api/save-po-progress', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ po_id: poId, approved_items: list })

    }).catch(e => console.error("Error saving progress:", e));

    // 3. Update Global State (Prevent overwrite by re-renders)

    const po = allData.find(p => p.id === poId);

    if (po && po.files) {

        if (!po.files.approved_items) po.files.approved_items = [];

        if (isApproved) {

            if (!po.files.approved_items.includes(filename)) po.files.approved_items.push(filename);

        } else {

            po.files.approved_items = po.files.approved_items.filter(f => f !== filename);

        }

    }

    // Surgical Update (No Re-render)

    const cellId = `status-cell-${index}`;

    const cell = document.getElementById(cellId);

    console.log(`Toggling details: Index=${index}, ID=${cellId}, ElementFound=${!!cell}`);

    if (cell) {

        const safeFilename = filename.replace(/'/g, "\\'");

        let statusHtml;

        if (isApproved) {

            statusHtml = `

                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">

                    <span class="status-badge approved-item">Aprobado</span>

                    <button class="btn-cancel-check" onclick="toggleProductApproval(${index}, '${poId}', '${safeFilename}')" title="Desaprobar">&#10005;</button>

                </div>

            `;

        } else {

            statusHtml = `

                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">

                    <span class="status-badge pending">Pendiente</span>

                    <button class="btn-check" onclick="toggleProductApproval(${index}, '${poId}', '${safeFilename}')" title="Marcar como Aprobado">&#10003;</button>

                </div>

            `;

        }

        cell.innerHTML = statusHtml;

    }

}

function renderProductTable(po, productsList) {

    console.log('renderProductTable items:', productsList ? productsList.length : 0);

    const detailContent = document.getElementById('detail-content');

    // Filter Logic

    let filteredList = productsList || [];

    if (currentStatusFilter !== 'all') {

        const approvedItems = getApprovedItems(po.id);

        filteredList = productsList.filter(filename => {

            const isApproved = approvedItems.includes(filename);

            return currentStatusFilter === 'approved' ? isApproved : !isApproved;

        });

    }

    // Map rows (using filteredList now)

    // Note: We map filteredList, so indices 0..N are visual indices. This is fine.

    // BUT! Since we pass 'index' to toggleProductApproval for surgical updates, 

    // we need to be careful. If I filter, the index changes.

    // Correct approach: The surgical update ID must be unique per row.

    // I will use safeFilename as ID or stick to index but realize re-render is needed if filter changes.

    // 'setStatusFilter' calls re-render, so visual indices reset. That's fine.

    // But 'toggleProductApproval' updates ID 'status-cell-${index}'.

    // If I filter, row 0 is a different file.

    // This assumes toggleProductApproval DOES NOT re-sort/filter the list.

    // Actually, if I approve an item while viewing 'Pendientes', it should vanish from the list?

    // User didn't specify. Standard behavior: it could vanish or stay.

    // Given surgical update requirement, simplest is: it stays until filter changes manually.

    // So filter logic applies only on SetFilter. 

    // Wait, toggleProductApproval does NOT call renderProductTable unless I want to.

    // Surgical update is fine.

    const rows = filteredList.map((filename, index) => {

        const safeFilename = filename.replace(/'/g, "\\'");

        const cleanName = filename.replace(/^[\(]?PO\d+[-_]?[\)]?\-?/i, '')

            .replace(/[\(-]?\-?Rev[\s\.]*[a-zA-Z0-9]+[\)]?/gi, '')

            .replace(/\.pdf$/i, '')

            .replace(/^[-_\s]+|[-_\s]+$/g, '').trim();

        const approvedItems = getApprovedItems(po.id);

        const isApproved = approvedItems.includes(filename);

        let statusHtml;

        if (isApproved) {

            statusHtml = `

                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">

                    <span class="status-badge approved-item">Aprobado</span>

                    <button class="btn-cancel-check" onclick="toggleProductApproval(${index}, '${po.id}', '${safeFilename}')" title="Desaprobar">&#10005;</button>

                </div>

            `;

        } else {

            statusHtml = `

                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">

                    <span class="status-badge pending">Pendiente</span>

                    <button class="btn-check" onclick="toggleProductApproval(${index}, '${po.id}', '${safeFilename}')" title="Marcar como Aprobado">&#10003;</button>

                </div>

            `;

        }

        return `

            <tr>

                <td>

                    <div style="display: flex; align-items: center; gap: 10px;">

                        <span style="color: var(--bpb-blue); font-size: 1.2rem;">&bull;</span>

                        <strong>${cleanName}</strong>

                    </div>

                </td>

                </td>

                <td class="text-center" id="status-cell-${index}">

                    ${statusHtml}

                </td>

                <td class="text-center">

                    <button class="btn" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;" onclick="viewProductDetails('${po.id}', '${safeFilename}', 'registry')">Ver Registro</button>

                </td>

                <td class="text-center">

                    <div style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 5px; color: #ce1919; transition: transform 0.2s;" 

                         onclick="window.open('/files/${encodeURIComponent(po.id + '/' + filename)}', '_blank')"

                         onmouseover="this.style.transform='scale(1.2)'" 

                         onmouseout="this.style.transform='scale(1)'"

                         title="Abrir PDF en nueva pestaña">

                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>

                    </div>

                </td>

                <td style="color: var(--text-secondary); font-size: 0.8rem; text-align: right;">

                    ${filename}

                </td>

            </tr>

        `;

    }).join('');

    let tableHtml;

    if (filteredList.length === 0) {

        tableHtml = `<p style="color: var(--text-secondary); padding: 1rem; text-align: center;">No se encontraron documentos con el filtro actual.</p>`;

    } else {

        tableHtml = `

            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>Nombre del Producto / Documento</th>

                            <th class="text-center">Estado</th>

                            <th class="text-center">Datos de Registro</th>

                            <th class="text-center">Plano</th>

                            <th style="text-align: right;">Archivo Original</th>

                        </tr>

                    </thead>

                    <tbody>${rows}</tbody>

                </table>

            </div>`;

    }

    // Integrated Header Controls

    const headerControlsHtml = `

        <div class="detail-section-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 1rem;">

             <h3 style="color: var(--bpb-blue); margin: 0;">Documentos del Registro</h3>

             <div style="display: flex; gap: 1rem; align-items: center;">

                 <div class="filter-group" style="margin: 0;">

                    <button class="filter-pill ${currentStatusFilter === 'all' ? 'active' : ''}" onclick="setStatusFilter('all')">Todos</button>

                    <button class="filter-pill ${currentStatusFilter === 'pending' ? 'active' : ''}" onclick="setStatusFilter('pending')">Pendientes</button>

                    <button class="filter-pill ${currentStatusFilter === 'approved' ? 'active' : ''}" onclick="setStatusFilter('approved')">Aprobados</button>

                  </div>

                 <button class="btn btn-approve btn-approve-all" data-poid="${po.id}">

                    &#10003; Aprobar Todo

                 </button>

             </div>

        </div>

    `;

    detailContent.innerHTML = `

        <div class="detail-section">

            ${headerControlsHtml}

            <div id="products-table-container">${tableHtml}</div>

        </div>

        <div id="legacy-csv-container"></div>

    `;

}

function renderLegacyCSV(po) {

    const container = document.getElementById('legacy-csv-container');

    if (!container) return; // Should exist

    if (po.content.csv && po.content.csv.length > 0) {

        const keys = Object.keys(po.content.csv[0]);

        container.innerHTML = `

            <div class="detail-section" style="margin-top: 2rem;">

                <h3 style="color: var(--bpb-blue); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Resumen de Orden (Datos)</h3>

                <div class="table-container" style="margin-top: 1rem;">

                    <table>

                        <thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>

                        <tbody>

                            ${po.content.csv.map(row => `<tr>${keys.map(k => `<td>${row[k]}</td>`).join('')}</tr>`).join('')}

                        </tbody>

                    </table>

                </div>

            </div>

        `;

    } else {

        container.innerHTML = ''; // Clear if no legacy csv

    }

}

// --- PO List logic ---

let currentPOFilter = 'all';

function setPOFilter(filter) {

    currentPOFilter = filter;

    document.querySelectorAll('[data-po-filter]').forEach(btn => {

        if (btn.dataset.poFilter === filter) btn.classList.add('active');

        else btn.classList.remove('active');

    });

    renderPOList(allData);
    if (typeof loadPendingActivities === 'function') { loadPendingActivities(); }

}

function showISOModule() {

    localStorage.setItem('lastView', 'iso-menu');

    hideAllViews();



    document.getElementById('view-iso-menu').style.display = 'block';

    animateEntry('view-iso-menu');

    // Update Header Title for the Module

    const subtitle = document.querySelector('header .subtitle');

    if (subtitle) subtitle.textContent = 'Oficina Técnica | Registro ISO 9001';

}

// --- ISO 9001 MODULE LOGIC ---

function syncIsoCheckboxStates() {
    const labels = document.querySelectorAll('.iso-checkbox-label');
    labels.forEach(label => {
        const input = label.querySelector('input[type="checkbox"]');
        if (!input) return;
        if (input.checked) {
            label.classList.add('active');
        } else {
            label.classList.remove('active');
        }
    });
}

function bindIsoCheckboxStates() {
    const inputs = document.querySelectorAll('.iso-checkbox-label input[type="checkbox"]');
    inputs.forEach(input => {
        if (input.dataset.isoBound === '1') return;
        input.dataset.isoBound = '1';
        input.addEventListener('change', () => {
            const label = input.closest('.iso-checkbox-label');
            if (!label) return;
            if (input.checked) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    });
    syncIsoCheckboxStates();
}

function bindIsoDatePickers() {
    const inputs = document.querySelectorAll('.iso-date-input');
    inputs.forEach(input => {
        if (input.dataset.isoPickerBound === '1') return;
        input.dataset.isoPickerBound = '1';
        input.addEventListener('click', () => {
            if (typeof input.showPicker === 'function') {
                input.showPicker();
            }
        });
    });
}

async function refreshIsoApprovalCache() {
    try {
        const list = await loadIsoDestinatarios();
        const names = isoApprovalUsers.map(n => normalizeIsoText(n));
        const emails = [];
        isoApprovalUsers.forEach((n) => {
            const match = list.find(r => normalizeIsoText(r.name) === normalizeIsoText(n));
            if (match && match.email) emails.push(match.email.toLowerCase().trim());
        });
        isoApprovalCache = { names, emails };
    } catch (_) {
        isoApprovalCache = { names: isoApprovalUsers.map(n => normalizeIsoText(n)), emails: [] };
    }
}

function isApprovalUser() {
    const nameKey = normalizeIsoText(currentDisplayName || currentUser || '');
    const emailKey = (currentUserEmail || currentUser || '').toLowerCase().trim();
    const names = isoApprovalCache.names || isoApprovalUsers.map(n => normalizeIsoText(n));
    const emails = isoApprovalCache.emails || [];
    if (nameKey && names.includes(nameKey)) return true;
    if (emailKey && emails.includes(emailKey)) return true;
    return false;
}

function toggleNotificationMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('notification-menu');
    if (!menu) return;
    const isOpen = menu.style.display === 'block';
    menu.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        renderNotifications(window._notifications || []);
    }
}

function closeNotificationMenu() {
    const menu = document.getElementById('notification-menu');
    if (menu) menu.style.display = 'none';
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('notification-menu');
    const bell = document.getElementById('notification-bell');
    if (!menu || !bell) return;
    if (menu.style.display === 'block' && !menu.contains(e.target) && !bell.contains(e.target)) {
        menu.style.display = 'none';
    }
});

async function loadNotifications() {
    if (!currentUser) return;
    try {
        const currentOrigin = (window.location && window.location.origin && window.location.origin.startsWith('http'))
            ? window.location.origin
            : 'http://bpbsrv03:5000';
        const apiBase = (window.API_BASE && window.API_BASE.startsWith('http')) ? window.API_BASE : currentOrigin;

        const [notifRes, pendingRes] = await Promise.all([
            fetch('/api/notifications'),
            fetch(`${apiBase}/api/activity-pending`)
        ]);

        const notifData = await notifRes.json().catch(() => ({}));
        const pendingData = await pendingRes.json().catch(() => ({}));

        const notifList = (notifRes.ok && notifData && notifData.status === 'success')
            ? (notifData.notifications || [])
            : [];

        const pendingList = (pendingRes.ok && pendingData && pendingData.status === 'success')
            ? (pendingData.data || [])
            : [];

        const pendingNotifs = pendingList.map(p => ({
            id: `activity-${p.token}` ,
            type: 'activity_pending',
            message: `Registro de Actividad Diario ${p.token || ''}`.trim(),
            payload: { token: p.token, date: p.date },
            title: `Registro pendiente - ${p.date || ''}`.trim()
        }));

        window._notifications = [...pendingNotifs, ...notifList];

        const badge = document.getElementById('notification-badge');
        const count = (notifData && notifData.unread ? notifData.unread : 0) + pendingNotifs.length;
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }

        renderNotifications(window._notifications);
    } catch (e) {
        console.error('Notifications load failed', e);
    }
}

async function markNotificationRead(id) {
    if (!id) return;
    try {
        await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    } catch (e) {
        console.error('Mark notification read failed', e);
    }
}

function renderNotifications(list) {
    const container = document.getElementById('notification-list');
    if (!container) return;
    const items = Array.isArray(list) ? list : [];
    if (!items.length) {
        container.innerHTML = `<div class="notification-empty">Sin notificaciones</div>`;
        return;
    }
    container.innerHTML = items.map(n => {
        const title = n.title || (n.type === 'approval' ? 'Aprobacion pendiente' : (n.type === 'signature' ? 'Firma pendiente' : (n.type === 'activity_pending' ? 'Registro pendiente' : 'Notificacion')));
        const bp = (n.type === 'activity_pending') ? '' : ((n.payload && n.payload.bp) ? ` - ${n.payload.bp}` : ((n.payload && n.payload.token) ? ` - ${n.payload.token}` : ''));
        return `
            <div class="notification-item" onclick="handleNotificationClick('${n.id}')">
                <div class="notification-title">${title}${bp}</div>
                <div class="notification-meta">${n.message || ''}</div>
            </div>
        `;
    }).join('');
}

function getNotificationById(id) {
    const list = window._notifications || [];
    return list.find(n => n.id === id);
}

function getApprovalNotificationId(bp, row) {
    const list = window._notifications || [];
    const bpKey = (bp || '').trim().toLowerCase();
    const rowKey = row ? String(row) : '';
    const found = list.find(n => {
        if (n.type !== 'approval') return false;
        const payload = n.payload || {};
        const pRow = payload.row ? String(payload.row) : '';
        if (rowKey && pRow && pRow === rowKey) return true;
        if (bpKey && payload.bp && String(payload.bp).trim().toLowerCase() === bpKey) return true;
        return false;
    });
    return found ? found.id : '';
}

async function handleNotificationClick(id) {
    const notif = getNotificationById(id);
    if (!notif) return;
    const type = notif.type;
    const payload = notif.payload || {};
    if (type === 'approval') {
        openIsoTrackingForBp(payload.bp, payload.row, id);
    } else if (type === 'signature') {
        openIsoEntryByBp(payload.bp || payload.numero);
    } else if (type === 'activity_pending') {
        await loadPendingActivities();
        if (payload && payload.token) {
            await showActivityEntryPending(payload.token, payload.date || '');
        } else {
            showActivityPending();
        }
    }

    if (type !== 'activity_pending') {
        markNotificationRead(id);
    }

    loadNotifications();
    closeNotificationMenu();
}

function setIsoGenerateLoading(isLoading) {
    const btn = document.getElementById('iso-generate-btn');
    if (!btn) return;
    btn.disabled = !!isLoading;
    btn.classList.toggle('btn-loading', !!isLoading);
    if (isLoading) {
        btn.setAttribute('aria-busy', 'true');
    } else {
        btn.removeAttribute('aria-busy');
    }
}

let isoClientsCache = null;
let isoResponsablesCache = null;

async function loadIsoClients() {
    if (isoClientsCache) return isoClientsCache;
    try {
        const res = await fetch('/static/data/clientes_v2.json');
        if (!res.ok) throw new Error('No se pudo cargar clientes_v2.json');
        isoClientsCache = await res.json();
        return isoClientsCache;
    } catch (e) {
        console.error("Error cargando clientes ISO:", e);
        isoClientsCache = [];
        return isoClientsCache;
    }
}

function normalizeIsoText(value) {
    return (value || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

async function loadIsoResponsables() {
    if (isoResponsablesCache) return isoResponsablesCache;
    try {
        const res = await fetch('/api/iso-responsables');
        if (!res.ok) throw new Error('No se pudo cargar destinatarios');
        const data = await res.json();
        isoResponsablesCache = (data && data.data) ? data.data : [];
        return isoResponsablesCache;
    } catch (e) {
        console.error("Error cargando responsables ISO:", e);
        isoResponsablesCache = [];
        return isoResponsablesCache;
    }
}

let isoDestinatariosCache = null;

async function loadIsoDestinatarios() {
    if (isoDestinatariosCache) return isoDestinatariosCache;
    try {
        const res = await fetch('/api/iso-destinatarios');
        if (!res.ok) throw new Error('No se pudo cargar destinatarios');
        const data = await res.json();
        isoDestinatariosCache = (data && data.data) ? data.data : [];
        return isoDestinatariosCache;
    } catch (e) {
        console.error("Error cargando destinatarios:", e);
        isoDestinatariosCache = [];
        return isoDestinatariosCache;
    }
}

async function resolveEmailForResponsable(name) {
    const target = normalizeIsoText(name);
    if (!target) return '';
    const list = await loadIsoDestinatarios();
    const match = list.find(r => normalizeIsoText(r.name) === target);
    return match ? (match.email || '') : '';
}

async function populateIsoResponsables(selectedValue) {
    const select = document.getElementById('iso-resp-dis');
    if (!select) return;
    const list = await loadIsoResponsables();
    const current = (selectedValue || '').trim();

    select.innerHTML = '<option value="">Seleccionar...</option>';
    list.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    if (current) {
        const found = Array.from(select.options).some(o => o.value === current);
        if (!found) {
            const opt = document.createElement('option');
            opt.value = current;
            opt.textContent = current;
            select.appendChild(opt);
        }
        select.value = current;
    }
}

async function signIsoField(responsableId, firmaId, fechaId) {
    const respEl = document.getElementById(responsableId);
    const firmaEl = document.getElementById(firmaId);
    if (!respEl || !firmaEl) return;
    const responsable = (respEl.value || '').trim();
    if (!responsable) {
        if (typeof showNotification === 'function') {
            showNotification("Seleccione un responsable antes de firmar.", 'error');
        } else {
            alert("Seleccione un responsable antes de firmar.");
        }
        return;
    }
    const current = (currentDisplayName || currentUser || '').trim();
    if (!current) {
        if (typeof showNotification === 'function') {
            showNotification("No se pudo identificar el usuario actual.", 'error');
        } else {
            alert("No se pudo identificar el usuario actual.");
        }
        return;
    }
    const responsableKey = normalizeIsoText(responsable);
    const currentKey = normalizeIsoText(current);
    let allowed = responsableKey === currentKey;

    if (!allowed) {
        const responsableEmail = await resolveEmailForResponsable(responsable);
        const currentEmail = (currentUserEmail || currentUser || '').toLowerCase().trim();
        if (responsableEmail && currentEmail && responsableEmail.toLowerCase() === currentEmail) {
            allowed = true;
        }
    }

    if (!allowed) {
        if (typeof showNotification === 'function') {
            showNotification("Solo el responsable puede firmar.", 'error');
        } else {
            alert("Solo el responsable puede firmar.");
        }
        return;
    }
    firmaEl.value = current;
    if (fechaId) {
        const fechaEl = document.getElementById(fechaId);
        if (fechaEl) {
            const today = new Date().toISOString().split('T')[0];
            fechaEl.value = today;
        }
    }

    const payloadUpdate = {};
    const mapFirma = {
        'iso-firma-dis': 'Firma_Responsable_Diseño',
        'iso-firma-cal': 'Firma_Responsable_Calidad',
        'iso-firma-prod': 'Firma_Responsable_Produccion',
        'iso-firma-otro': 'Firma_Responsable_Otro'
    };
    const mapFecha = {
        'iso-fecha-dis': 'Feca_Firma_Responsable_Diseño',
        'iso-fecha-cal': 'Feca_Firma_Responsable_Calidad',
        'iso-fecha-prod': 'Feca_Firma_Responsable_Produccion',
        'iso-fecha-otro': 'Feca_Firma_Responsable_Otro'
    };
    if (mapFirma[firmaId]) payloadUpdate[mapFirma[firmaId]] = current;
    if (fechaId && mapFecha[fechaId]) {
        const fechaEl = document.getElementById(fechaId);
        if (fechaEl) payloadUpdate[mapFecha[fechaId]] = fechaEl.value || '';
    }
    saveIsoSignatureUpdate(payloadUpdate);
}

function resolveIsoCurrentBP() {
    const key = localStorage.getItem('lastViewParam');
    const payloads = loadIsoPayloads();
    const payload = payloads[key] || payloads[(key || '').toString()] || {};
    if (payload && payload.BP) return payload.BP;
    const records = loadIsoControlRecords();
    const recByNum = records.find(r => String(r.numero) === String(key));
    if (recByNum && recByNum.descripcion) return recByNum.descripcion;
    const recByDesc = records.find(r => (r.descripcion || '').trim().toLowerCase() === String(key || '').trim().toLowerCase());
    if (recByDesc && recByDesc.descripcion) return recByDesc.descripcion;
    return '';
}

async function saveIsoSignatureUpdate(updatePayload) {
    const bp = resolveIsoCurrentBP();
    if (!bp) {
        if (typeof showNotification === 'function') {
            showNotification('No se pudo identificar el BP.', 'error');
        } else {
            alert('No se pudo identificar el BP.');
        }
        return;
    }
    try {
        const res = await fetch('/api/iso-r01901-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bp, payload: updatePayload })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data || data.status !== 'success') {
            const msg = data && data.message ? data.message : 'No se pudo guardar la firma.';
            if (typeof showNotification === 'function') showNotification(msg, 'error');
            else alert(msg);
            return;
        }
        try {
            const key = localStorage.getItem('lastViewParam');
            const payloads = loadIsoPayloads();
            const p = payloads[key] || payloads[bp] || {};
            Object.assign(p, updatePayload);
            if (key) payloads[key] = p;
            payloads[bp] = p;
            saveIsoPayloads(payloads);
        } catch (e) {
            console.error('No se pudo guardar payload de firma', e);
        }
        if (typeof showNotification === 'function') showNotification('Firma guardada.', 'success');
    } catch (e) {
        console.error('Firma update failed', e);
        if (typeof showNotification === 'function') showNotification('Error guardando la firma.', 'error');
    }
}

function applyIsoSolicitanteData(client) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
    };

    setVal("iso-solicita", client.solicitante);
    setVal("iso-domicilio", client.domicilio || "");
    setVal("iso-pcia", client.provincia || "");
    setVal("iso-ciudad", client.ciudad || "");
    setVal("iso-pais", client.pais || "");
    setVal("iso-email", client.email || "");
    setVal("iso-tel", client.telefono || "");
}

function setupIsoSolicitanteAutocomplete() {
    const input = document.getElementById('iso-solicita');
    const suggestions = document.getElementById('iso-solicita-suggestions');
    if (!input || !suggestions) return;
    if (input.dataset.isoAutocompleteBound === '1') return;
    input.dataset.isoAutocompleteBound = '1';

    const container = input.parentElement;

    const render = (items) => {
        suggestions.innerHTML = '';
        if (!items || items.length === 0) {
            suggestions.style.display = 'none';
            return;
        }
        items.forEach((client) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = client.solicitante;
            div.onclick = () => {
                applyIsoSolicitanteData(client);
                suggestions.style.display = 'none';
            };
            suggestions.appendChild(div);
        });
        suggestions.style.display = 'block';
    };

    input.addEventListener('input', async () => {
        const list = await loadIsoClients();
        const q = normalizeIsoText(input.value).trim();
        if (!q) {
            suggestions.style.display = 'none';
            return;
        }
        const matches = list
            .filter(c => normalizeIsoText(c.solicitante).includes(q))
            .slice(0, 8);
        render(matches);
    });

    input.addEventListener('focus', async () => {
        if (!input.value) return;
        const list = await loadIsoClients();
        const q = normalizeIsoText(input.value).trim();
        const matches = list
            .filter(c => normalizeIsoText(c.solicitante).includes(q))
            .slice(0, 8);
        render(matches);
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });
}

function toggleExclusiveCheckbox(clickedId, otherId) {
    const clicked = document.getElementById(clickedId);
    const other = document.getElementById(otherId);

    if (clicked && clicked.checked && other) {
        other.checked = false;
    }

    // Update active classes manually for compatibility
    if (clicked && clicked.parentElement.classList.contains('iso-checkbox-label')) {
        clicked.checked ? clicked.parentElement.classList.add('active') : clicked.parentElement.classList.remove('active');
    }
    if (other && other.parentElement.classList.contains('iso-checkbox-label')) {
        other.checked ? other.parentElement.classList.add('active') : other.parentElement.classList.remove('active');
    }
}

function toggleRadioGroup(clickedId, groupIds) {
    const clicked = document.getElementById(clickedId);
    if (clicked && clicked.checked) {
        groupIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id !== clickedId) {
                    el.checked = false;
                    if (el.parentElement.classList.contains('iso-checkbox-label')) {
                        el.parentElement.classList.remove('active');
                    }
                } else {
                    if (el.parentElement.classList.contains('iso-checkbox-label')) {
                        el.parentElement.classList.add('active');
                    }
                }
            }
        });
    } else if (clicked && !clicked.checked) {
        if (clicked.parentElement.classList.contains('iso-checkbox-label')) {
            clicked.parentElement.classList.remove('active');
        }
    }
}

function getIsoRegistryCounter() {
    const raw = localStorage.getItem('iso_registry_counter');
    let n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 175) n = 175;
    return n;
}

function setIsoRegistryCounter(n) {
    localStorage.setItem('iso_registry_counter', String(n));
}

function setIsoFormReadonly(isReadOnly) {
    const form = document.querySelector('#view-iso-new-registry .form-content');
    if (!form) return;
    window._isoReadOnly = !!isReadOnly;

    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(el => {
        const type = (el.type || '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') {
            el.disabled = isReadOnly;
        } else if (type === 'date') {
            el.disabled = isReadOnly;
        } else if (el.tagName && el.tagName.toLowerCase() === 'select') {
            el.disabled = isReadOnly;
        } else {
            if (isReadOnly) el.setAttribute('readonly', 'readonly');
            else el.removeAttribute('readonly');
        }
    });

    form.classList.toggle('iso-readonly', !!isReadOnly);
    if (!isReadOnly && typeof bindIsoCheckboxStates === 'function') {
        bindIsoCheckboxStates();
    }
}

function resetIsoForm() {
    const form = document.querySelector('#view-iso-new-registry .form-content');
    if (!form) return;
    window._isoEntryReturn = null;
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(el => {
        const type = (el.type || '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') {
            el.checked = false;
        } else if (el.tagName && el.tagName.toLowerCase() === 'select') {
            el.selectedIndex = 0;
        } else {
            el.value = '';
        }
    });
    if (typeof bindIsoCheckboxStates === 'function') bindIsoCheckboxStates();
    setIsoFormReadonly(false);
}

function loadIsoControlRecords() {
    if (Array.isArray(window._isoControlRecords)) return window._isoControlRecords;
    try {
        const raw = localStorage.getItem('iso_control_records');
        const data = JSON.parse(raw || '[]');
        return Array.isArray(data) ? data : [];
    } catch (_) {
        return [];
    }
}

function saveIsoControlRecords(records) {
    window._isoControlRecords = Array.isArray(records) ? records : [];
    localStorage.setItem('iso_control_records', JSON.stringify(records || []));
}

async function fetchIsoControlRecords() {
    try {
        const res = await fetch('/api/iso-r01903-records');
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.status === 'success') {
            const records = Array.isArray(data.records) ? data.records : [];
            saveIsoControlRecords(records);
            return records;
        }
    } catch (e) {
        console.error('ISO control records fetch failed', e);
    }
    return loadIsoControlRecords();
}

function loadIsoPayloads() {
    try {
        const raw = localStorage.getItem('iso_payloads');
        const data = JSON.parse(raw || '{}');
        return data && typeof data === 'object' ? data : {};
    } catch (_) {
        return {};
    }
}

function saveIsoPayloads(payloads) {
    localStorage.setItem('iso_payloads', JSON.stringify(payloads || {}));
}

function fillIsoFormFromPayload(payload) {
    if (!payload) return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'date' && (val === 'N.A' || val === null)) {
            el.value = '';
        } else if (el.tagName && el.tagName.toLowerCase() === 'select') {
            const v = val || '';
            const found = Array.from(el.options).some(o => o.value === v);
            if (v && !found) {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = v;
                el.appendChild(opt);
            }
            el.value = v;
        } else {
            el.value = val || '';
        }
    };

    const map = {
        Solicita: 'iso-solicita',
        Numero_de_Registro: 'iso-n-registro',
        Domicilio_Solicitante: 'iso-domicilio',
        Provincia_Solicitante: 'iso-pcia',
        Pais_Solicitante: 'iso-pais',
        Ciudad_Solicitante: 'iso-ciudad',
        Email_Solicitante: 'iso-email',
        Telefono_Solicitante: 'iso-tel',
        Fecha_actual: 'iso-fecha-actual',
        Fecha_Entrega_Solicitada: 'iso-fecha-entrega',
        Descripcion_Aplicacion_Producto: 'iso-descripcion',
        Cantidad: 'iso-cantidad',
        Velocidad_Producto: 'iso-velocidad',
        RPM_Producto: 'iso-rpm',
        Temperatura_Operacion: 'iso-temp-op',
        Temperatura_Rodamiento: 'iso-temp-rod',
        Temperatura_Eje: 'iso-temp-eje',
        Temperatura_Carcaza: 'iso-temp-carcaza',
        Temperatura_Ambiente: 'iso-temp-ambiente',
        Horas_por_dia_NoContinuo: 'iso-horas-dia',
        Cantidad_Tiempo_Operando: 'iso-tiempo-op',
        Edad_Equipo_Mecanismo: 'iso-edad-equipo',
        Carga_Magnitud: 'iso-carga-magnitud',
        Carga_Unidad: 'iso-carga-unidad',
        Datos_Diseños_Anteriores: 'iso-req-prev',
        Requisitos_Legales: 'iso-req-legal',
        Requisitos_Reglamentarios: 'iso-req-regla',
        Requisitos_Desempeño: 'iso-req-desemp',
        Requisitos_Funcionales: 'iso-req-func',
        Otros_Requisitos: 'iso-req-otros',
        Requisitos_Cliente_Caracteristicas: 'input-carac-especial',
        Requisitos_Cliente_Identificacion: 'input-req-id',
        Requisitos_Cliente_Trazabilidad: 'input-req-traz',
        Requisitos_Cliente_Embalaje: 'input-req-emb',
        Informacion_Complementaria: 'iso-info-compl',
        Validacion: 'iso-validacion',
        Accion_Tomada: 'iso-accion-tomada',
        Responsable_Diseño: 'iso-resp-dis',
        Firma_Responsable_Diseño: 'iso-firma-dis',
        Feca_Firma_Responsable_Diseño: 'iso-fecha-dis',
        Responsable_Calidad: 'iso-resp-cal',
        Firma_Responsable_Calidad: 'iso-firma-cal',
        Feca_Firma_Responsable_Calidad: 'iso-fecha-cal',
        Responsable_Produccion: 'iso-resp-prod',
        Firma_Responsable_Produccion: 'iso-firma-prod',
        Feca_Firma_Responsable_Produccion: 'iso-fecha-prod',
        Responsable_Otro: 'iso-resp-otro',
        Firma_Responsable_Otro: 'iso-firma-otro',
        Feca_Firma_Responsable_Otro: 'iso-fecha-otro'
    };

    Object.keys(map).forEach(key => setVal(map[key], payload[key]));

    const chkMap = {
        chk_Planos_SI: 'chk-planos-si',
        chk_Planos_NO: 'chk-planos-no',
        chk_ProdSim_SI: 'chk-simil-si',
        chk_ProdSim_NO: 'chk-simil-no',
        chk_EspecOp_SI: 'chk-espec-si',
        chk_EspecOp_NO: 'chk-espec-no',
        chk_Lub_Grasa: 'chk-lub-grasa',
        chk_Lub_Aceite: 'chk-lub-aceite',
        chk_Lub_Neblina: 'chk-lub-neblina',
        chk_Lub_Circulacion: 'chk-lub-circulacion',
        chk_Rot_AroInt: 'chk-rot-int',
        chk_Rot_AroExt: 'chk-rot-ext',
        chk_Orient_H: 'chk-orient-h',
        chk_Orient_V: 'chk-orient-v',
        chk_Amb_Seco: 'chk-amb-seco',
        chk_Amb_Agua: 'chk-amb-agua',
        chk_Amb_Abrasivo: 'chk-amb-abrasivo',
        chk_Amb_Quimico: 'chk-amb-quimico',
        chk_Amb_Adentro: 'chk-amb-adentro',
        chk_Amb_Exterior: 'chk-amb-exterior',
        chk_Modo_Continuo: 'chk-op-cont',
        chk_Modo_NoContinuo: 'chk-op-nocont',
        chk_Carga_Axial: 'chk-carga-axial',
        chk_Carga_Radial: 'chk-carga-radial',
        chk_Carga_Combinada: 'chk-carga-combinada',
        chk_Carga_Impacto: 'chk-carga-impacto',
        chk_Carga_Magnitud: 'chk-magnitud',
        chk_Carac_Especial: 'chk-carac-especial',
        chk_Id: 'chk-req-id',
        chk_Traz: 'chk-req-traz',
        chk_Embalaje: 'chk-req-emb',
        chk_Analisis: 'chk-analisis',
        chk_CambioDiseno: 'chk-cambio',
        chk_DisenoNuevo: 'chk-nuevo',
        chk_Ens_Disponible: 'chk-en-disp',
        chk_Ens_NoDisp: 'chk-en-nodisp'
    };

    Object.keys(chkMap).forEach(key => {
        const el = document.getElementById(chkMap[key]);
        if (el) el.checked = !!payload[key];
    });

    if (typeof bindIsoCheckboxStates === 'function') bindIsoCheckboxStates();
}

function renderIsoControlTable() {
    const table = document.getElementById('iso-control-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const records = loadIsoControlRecords().slice();
    records.sort((a, b) => {
        const bpKey = (desc) => {
            const m = /BP-(\d{2})(\d{3})/i.exec(desc || '');
            if (!m) return NaN;
            return (parseInt(m[1], 10) * 1000) + parseInt(m[2], 10);
        };
        const ka = bpKey(a && a.descripcion);
        const kb = bpKey(b && b.descripcion);
        if (Number.isFinite(kb) && Number.isFinite(ka) && kb !== ka) return kb - ka;
        if (Number.isFinite(kb) && !Number.isFinite(ka)) return 1;
        if (Number.isFinite(ka) && !Number.isFinite(kb)) return -1;
        const na = parseInt(a && a.numero ? a.numero : "", 10);
        const nb = parseInt(b && b.numero ? b.numero : "", 10);
        if (Number.isFinite(nb) && Number.isFinite(na) && nb !== na) return nb - na;
        const da = (a && a.fecha_inicio) ? String(a.fecha_inicio) : "";
        const db = (b && b.fecha_inicio) ? String(b.fecha_inicio) : "";
        return db.localeCompare(da);
    });
    if (!records.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
                    Sin registros aún
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = records.map(r => `
        <tr>
            <td>${r.numero || ''}</td>
            <td>${r.descripcion || ''}</td>
            <td>${r.solicitante || ''}</td>
            <td>${r.fecha_inicio || ''}</td>
            <td>${isoBadgeHtml(r.etapa, 'etapa')}</td>
            <td>${r.situacion || ''}</td>
            <td>${r.fecha_fin || ''}</td>
            <td style="text-align:center;">
                <button class="btn btn-sm" onclick="showISOInfoMenu('${r.numero || ''}')">Información</button>
            </td>
        </tr>
    `).join('');
}

async function initIsoRegistryNumber() {
    const input = document.getElementById('iso-n-registro');
    if (!input) return;
    try {
        const res = await fetch('/api/iso-next-registry');
        if (res.ok) {
            const data = await res.json();
            if (data && data.next_num) {
                input.value = data.next_num;
                if (data.next_bp) window._isoNextBP = data.next_bp;
                return;
            }
        }
    } catch (e) {
        console.error("ISO next registry fetch failed", e);
    }
    input.value = getIsoRegistryCounter();
}


async function showISONewRegistry() {
    hideAllViews();
    document.getElementById('view-iso-new-registry').style.display = 'block';
    animateEntry('view-iso-new-registry');

    // Set default date to today
    resetIsoForm();
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('iso-fecha-actual')) {
        document.getElementById('iso-fecha-actual').value = today;
    }

    // Set next registry number
    await initIsoRegistryNumber();
    await populateIsoResponsables();
    setIsoFormReadonly(false);
}

function submitISO019Form() {
    if (window._isoReadOnly) {
        if (typeof showNotification === 'function') {
            showNotification("Vista de solo lectura.", 'error');
        } else {
            alert("Vista de solo lectura.");
        }
        return;
    }
    // Gather all data into R019-01 JSON structure
    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };

    const getValueNA = (id) => {
        const v = getValue(id);
        return v && v.trim() !== "" ? v : "N.A";
    };

    const getCheck = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    };

    const errors = [];
    const requireField = (id, label) => {
        const val = getValue(id).trim();
        if (!val) errors.push(label);
        return val;
    };

    const requiredValues = {
        solicita: requireField("iso-solicita", "Solicita"),
        numero: requireField("iso-n-registro", "Número de Registro"),
        domicilio: requireField("iso-domicilio", "Domicilio"),
        provincia: requireField("iso-pcia", "Provincia"),
        pais: requireField("iso-pais", "País"),
        ciudad: requireField("iso-ciudad", "Ciudad"),
        email: requireField("iso-email", "Email"),
        telefono: requireField("iso-tel", "Teléfono"),
        fechaActual: requireField("iso-fecha-actual", "Fecha")
    };

    const chkPlanosSi = getCheck("chk-planos-si");
    const chkPlanosNo = getCheck("chk-planos-no");
    if (!chkPlanosSi && !chkPlanosNo) errors.push("Posee Planos (SI/NO)");

    const chkProdSimSi = getCheck("chk-simil-si");
    const chkProdSimNo = getCheck("chk-simil-no");
    if (!chkProdSimSi && !chkProdSimNo) errors.push("Productos similares (SI/NO)");

    const chkEspecSi = getCheck("chk-espec-si");
    const chkEspecNo = getCheck("chk-espec-no");
    if (!chkEspecSi && !chkEspecNo) errors.push("Especificaciones operativas (SI/NO)");

    const chkAnalisis = getCheck("chk-analisis");
    const chkCambio = getCheck("chk-cambio");
    const chkNuevo = getCheck("chk-nuevo");
    if (!chkAnalisis && !chkCambio && !chkNuevo) errors.push("Análisis/Cambio/Diseño Nuevo (seleccionar uno)");

    const respDis = requireField("iso-resp-dis", "Responsable Diseño");

    const chkMagnitud = getCheck("chk-magnitud");
    const cargaMagnitud = getValue("iso-carga-magnitud").trim();
    const cargaUnidad = getValue("iso-carga-unidad").trim();
    if (chkMagnitud) {
        if (!cargaMagnitud) errors.push("Carga Magnitud");
        if (!cargaUnidad) errors.push("Carga Unidad");
    }

    if (errors.length > 0) {
        const msg = "Faltan campos obligatorios: " + errors.join(", ");
        if (typeof showNotification === 'function') {
            showNotification(msg, 'error');
        } else {
            alert(msg);
        }
        return;
    }

    const chkCarac = getCheck("chk-carac-especial");
    const chkId = getCheck("chk-req-id");
    const chkTraz = getCheck("chk-req-traz");
    const chkEmb = getCheck("chk-req-emb");
    const requisitosCliente = (chkCarac || chkId || chkTraz || chkEmb) ? "" : "N.A";

    const payload = {
        "Solicita": requiredValues.solicita,
        "Numero_de_Registro": requiredValues.numero,
        "Domicilio_Solicitante": requiredValues.domicilio,
        "Provincia_Solicitante": requiredValues.provincia,
        "Pais_Solicitante": requiredValues.pais,
        "Ciudad_Solicitante": requiredValues.ciudad,
        "Email_Solicitante": requiredValues.email,
        "Telefono_Solicitante": requiredValues.telefono,
        "Fecha_actual": requiredValues.fechaActual,
        "Fecha_Entrega_Solicitada": getValueNA("iso-fecha-entrega"),

        "Descripcion_Aplicacion_Producto": getValueNA("iso-descripcion"),
        "Cantidad": getValueNA("iso-cantidad"),

        "Velocidad_Producto": getValueNA("iso-velocidad"),
        "RPM_Producto": getValueNA("iso-rpm"),

        "Temperatura_Operacion": getValueNA("iso-temp-op"),
        "Temperatura_Rodamiento": getValue("iso-temp-rod"),
        "Temperatura_Eje": getValue("iso-temp-eje"),
        "Temperatura_Carcaza": getValue("iso-temp-carcaza"),
        "Temperatura_Ambiente": getValue("iso-temp-ambiente"),

        "Horas_por_dia_NoContinuo": getValue("iso-horas-dia"),
        "Cantidad_Tiempo_Operando": getValueNA("iso-tiempo-op"),
        "Edad_Equipo_Mecanismo": getValueNA("iso-edad-equipo"),
        "Carga_Magnitud": cargaMagnitud,
        "Carga_Unidad": cargaUnidad || "",

        "Datos_Diseños_Anteriores": getValueNA("iso-req-prev"),
        "Requisitos_Legales": getValueNA("iso-req-legal"),
        "Requisitos_Reglamentarios": getValueNA("iso-req-regla"),
        "Requisitos_Desempeño": getValueNA("iso-req-desemp"),
        "Requisitos_Funcionales": getValueNA("iso-req-func"),
        "Otros_Requisitos": getValueNA("iso-req-otros"),

        "Requisitos_Cliente": requisitosCliente,
        "Requisitos_Cliente_Caracteristicas": getValue("input-carac-especial"),
        "Requisitos_Cliente_Identificacion": getValue("input-req-id"),
        "Requisitos_Cliente_Trazabilidad": getValue("input-req-traz"),
        "Requisitos_Cliente_Embalaje": getValue("input-req-emb"),

        "Responsable_Diseño": getValue("iso-resp-dis"),
        "Firma_Responsable_Diseño": getValue("iso-firma-dis"),
        "Feca_Firma_Responsable_Diseño": getValue("iso-fecha-dis"),

        "Responsable_Calidad": getValueNA("iso-resp-cal"),
        "Firma_Responsable_Calidad": getValue("iso-firma-cal"),
        "Feca_Firma_Responsable_Calidad": getValue("iso-fecha-cal"),

        "Responsable_Produccion": getValueNA("iso-resp-prod"),
        "Firma_Responsable_Produccion": getValue("iso-firma-prod"),
        "Feca_Firma_Responsable_Produccion": getValue("iso-fecha-prod"),

        "Responsable_Otro": getValueNA("iso-resp-otro"),
        "Firma_Responsable_Otro": getValue("iso-firma-otro"),
        "Feca_Firma_Responsable_Otro": getValue("iso-fecha-otro"),

        "Informacion_Complementaria": getValueNA("iso-info-compl"),
        "Validacion": getValueNA("iso-validacion"),
        "Accion_Tomada": getValueNA("iso-accion-tomada"),

        // Checkboxes
        "chk_Planos_SI": chkPlanosSi,
        "chk_Planos_NO": chkPlanosNo,
        "chk_ProdSim_SI": chkProdSimSi,
        "chk_ProdSim_NO": chkProdSimNo,
        "chk_EspecOp_SI": chkEspecSi,
        "chk_EspecOp_NO": chkEspecNo,

        "chk_Lub_Grasa": getCheck("chk-lub-grasa"),
        "chk_Lub_Aceite": getCheck("chk-lub-aceite"),
        "chk_Lub_Neblina": getCheck("chk-lub-neblina"),
        "chk_Lub_Circulacion": getCheck("chk-lub-circulacion"),

        "chk_Rot_AroInt": getCheck("chk-rot-int"),
        "chk_Rot_AroExt": getCheck("chk-rot-ext"),

        "chk_Orient_H": getCheck("chk-orient-h"),
        "chk_Orient_V": getCheck("chk-orient-v"),

        "chk_Amb_Seco": getCheck("chk-amb-seco"),
        "chk_Amb_Agua": getCheck("chk-amb-agua"),
        "chk_Amb_Abrasivo": getCheck("chk-amb-abrasivo"),
        "chk_Amb_Quimico": getCheck("chk-amb-quimico"),
        "chk_Amb_Adentro": getCheck("chk-amb-adentro"),
        "chk_Amb_Exterior": getCheck("chk-amb-exterior"),

        "chk_Modo_Continuo": getCheck("chk-op-cont"),
        "chk_Modo_NoContinuo": getCheck("chk-op-nocont"),

        "chk_Carga_Axial": getCheck("chk-carga-axial"),
        "chk_Carga_Radial": getCheck("chk-carga-radial"),
        "chk_Carga_Combinada": getCheck("chk-carga-combinada"),
        "chk_Carga_Impacto": getCheck("chk-carga-impacto"),
        "chk_Carga_Magnitud": chkMagnitud,

        "chk_Carac_Especial": chkCarac,
        "chk_Id": chkId,
        "chk_Traz": chkTraz,
        "chk_Embalaje": chkEmb,

        "chk_Analisis": chkAnalisis,
        "chk_CambioDiseno": chkCambio,
        "chk_DisenoNuevo": chkNuevo,

        "chk_Ens_Disponible": getCheck("chk-en-disp"),
        "chk_Ens_NoDisp": getCheck("chk-en-nodisp")
    };

    const bp = window._isoNextBP || 'BP-XXXXX';
    payload.BP = bp;
    const msg = `\u00bfDesea dejar asentado el Registro R019-01 de ${bp}?`;

    const proceed = async () => {
        let generatedFile = null;
        setIsoGenerateLoading(true);
        try {
            const res = await fetch('/api/iso-generate-r01901', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload, bp })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data || data.status !== 'success') {
                const errMsg = data && data.message ? data.message : 'No se pudo generar el documento R019-01.';
                if (typeof showNotification === 'function') {
                    showNotification(errMsg, 'error');
                } else {
                    alert(errMsg);
                }
                return;
            }
            generatedFile = data.file || null;
            var pendingMsg = data.pending_message || (data.pending ? 'R019-03 pendiente.' : '');

            // Refresh ISO Control Panel from R019-03
            try {
                await fetchIsoControlRecords();
            } catch (e) {
                console.error("No se pudo refrescar el panel ISO:", e);
            }

try {
                const payloads = loadIsoPayloads();
                const key = payload.Numero_de_Registro || bp;
                payloads[key] = payload;
                saveIsoPayloads(payloads);
            } catch (e) {
                console.error("No se pudo guardar payload ISO:", e);
            }

            console.log("Generando R019-01 Payload:", payload);
            // Advance registry number for next entry
            const currentNum = parseInt(payload.Numero_de_Registro, 10);
            if (Number.isFinite(currentNum)) {
                setIsoRegistryCounter(currentNum + 1);
            } else {
                setIsoRegistryCounter(getIsoRegistryCounter() + 1);
            }

            if (typeof showNotification === 'function') {
                const baseMsg = "Registro generado correctamente.";
                const detail = generatedFile ? ` Archivo: ${generatedFile}` : "";
                const pend = pendingMsg ? ` ${pendingMsg}` : "";
                showNotification(baseMsg + detail + pend, pendingMsg ? 'warning' : 'success');
            } else {
                alert("Registro Generado Correctamente.");
            }

            resetIsoForm();
            showISOModule();
        } catch (e) {
            console.error("ISO R019-01 generation failed", e);
            if (typeof showNotification === 'function') {
                showNotification('Error generando el documento R019-01.', 'error');
            } else {
                alert('Error generando el documento R019-01.');
            }
        } finally {
            setIsoGenerateLoading(false);
        }
    };

    if (typeof showCustomConfirm === 'function') {
        showCustomConfirm('Verificacion', msg, 'Cancelar', 'Guardar', (confirmed) => {
            if (confirmed) proceed();
        });
        const modal = document.getElementById('confirm-modal');
        const wrapper = modal ? modal.querySelector('.modal-confirm-wrapper') : null;
        if (wrapper) {
            wrapper.style.maxWidth = '520px';
            wrapper.style.width = 'fit-content';
            wrapper.style.minWidth = '420px';
        }
        if (modal) {
            const titleEl = modal.querySelector('#confirm-title');
            const btnConfirm = modal.querySelector('.modal-actions button:last-child');
            if (titleEl) titleEl.style.color = 'var(--bpb-blue)';
            if (btnConfirm) {
                btnConfirm.className = 'btn btn-primary';
                btnConfirm.style.removeProperty('background-color');
                btnConfirm.style.removeProperty('color');
                btnConfirm.style.removeProperty('border');
            }
        }
    } else {
        if (confirm(msg)) proceed();
    }
}

async function showISOControlPanel() {
    localStorage.setItem('lastView', 'iso-control');
    hideAllViews();
    const view = document.getElementById('view-iso-control');
    if (view) {
        view.style.display = 'block';
        animateEntry('view-iso-control');
    }
    const subtitle = document.querySelector('header .subtitle');
    if (subtitle) subtitle.textContent = 'Oficina T?cnica | Registro ISO 9001';
    try {
        await fetchIsoControlRecords();
    } catch (e) {
        console.error('No se pudo cargar R019-03:', e);
    }
    renderIsoControlTable();
}

async function showISOGanttPanel(from, bp) {
    localStorage.setItem('lastView', 'iso-gantt');
    if (from) {
        window._isoGanttReturn = from;
    }
    hideAllViews();
    const view = document.getElementById('view-iso-gantt');
    if (view) {
        view.style.display = 'block';
        animateEntry('view-iso-gantt');
    }
    const subtitle = document.querySelector('header .subtitle');
    if (subtitle) subtitle.textContent = 'Oficina Tecnica | Registro ISO 9001';

    let targetBp = (bp || '').trim();
    if (!targetBp) {
        try {
            await fetchIsoControlRecords();
        } catch (_) { }
        targetBp = resolveIsoGanttTargetBp();
    }
    window._isoGanttTargetBp = targetBp;
    setIsoGanttCollapsed(isoGanttCollapsed);
    await refreshIsoGantt();
}

function showIsoFolderPanel() {
    localStorage.setItem('lastView', 'iso-folder');
    hideAllViews();
    const view = document.getElementById('view-iso-folder');
    if (view) {
        view.style.display = 'block';
        animateEntry('view-iso-folder');
    }
    const subtitle = document.querySelector('header .subtitle');
    if (subtitle) subtitle.textContent = 'Oficina Tecnica | Registro ISO 9001';
}

async function openIsoFolder(key) {
    try {
        const res = await fetch('/api/iso-open-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: String(key || '').trim() })
        });
        const data = await res.json().catch(() => ({}));
        if (data.status === 'success') {
            showNotification('Abriendo carpeta...', 'success');
        } else {
            showNotification(data.message || 'No se pudo abrir la carpeta', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error al abrir la carpeta', 'error');
    }
}

function exitISOGanttPanel() {
    if (window._isoGanttReturn === 'info') {
        const id = localStorage.getItem('lastViewParam');
        if (id) {
            showISOInfoMenu(id);
            return;
        }
    }
    showISOModule();
}

function setIsoGanttCollapsed(next) {
    isoGanttCollapsed = !!next;
    const view = document.getElementById('view-iso-gantt');
    if (view) view.classList.toggle('iso-gantt-collapsed', isoGanttCollapsed);
    const btn = document.getElementById('iso-gantt-toggle-btn');
    if (btn) btn.textContent = isoGanttCollapsed ? 'Ver columnas' : 'Solo Gantt';
    const container = view ? view.querySelector('.iso-gantt-container') : null;
    if (container && isoGanttCollapsed) {
        container.scrollLeft = 0;
    }
    requestAnimationFrame(() => renderIsoGanttLinks());
}

function toggleIsoGanttColumns() {
    setIsoGanttCollapsed(!isoGanttCollapsed);
}

async function refreshIsoGantt() {
    const body = document.getElementById('iso-gantt-body');
    const axis = document.getElementById('iso-gantt-axis');
    const range = document.getElementById('iso-gantt-range');
    if (body) {
        body.innerHTML = `<div class="iso-gantt-empty">Cargando diagrama...</div>`;
    }
    if (axis) axis.innerHTML = '';
    if (range) range.textContent = 'Cargando diagrama...';
    await loadIsoGanttData(window._isoGanttTargetBp || '');
}

function filterIsoGanttRows(input) {
    const value = (input && input.value ? input.value : '').trim().toLowerCase();
    const rows = document.querySelectorAll('.iso-gantt-row');
    rows.forEach(row => {
        const bp = (row.dataset.bp || '').toLowerCase();
        row.style.display = !value || bp.includes(value) ? '' : 'none';
    });
}

function resolveIsoGanttTargetBp() {
    const id = localStorage.getItem('lastViewParam');
    const records = loadIsoControlRecords();
    if (id) {
        const rec = records.find(r => String(r.numero) === String(id));
        if (rec && rec.descripcion) return String(rec.descripcion).trim();
        const direct = records.find(r => (r.descripcion || '').trim().toLowerCase() === String(id).trim().toLowerCase());
        if (direct && direct.descripcion) return String(direct.descripcion).trim();
        if (/^BP-\\d+/i.test(String(id).trim())) return String(id).trim();
    }
    return '';
}

async function ensureIsoR01904File(bp) {
    const statusEl = document.getElementById('iso-gantt-status');
    if (!bp) return;
    try {
        if (statusEl) statusEl.textContent = `Generando Project ${bp}...`;
        const res = await fetch('/api/iso-r01904-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bp })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data || data.status !== 'success') {
            const msg = data && data.message ? data.message : 'No se pudo generar R019-04.';
            if (typeof showNotification === 'function') showNotification(msg, 'error');
        } else {
            if (typeof showNotification === 'function') showNotification('R019-04 actualizado.', 'success');
        }
    } catch (e) {
        console.error('R019-04 generate failed', e);
        if (typeof showNotification === 'function') showNotification('Error generando R019-04.', 'error');
    } finally {
        if (statusEl) statusEl.textContent = '';
    }
}

async function fetchIsoR01902EventsByBp(bp) {
    if (!bp) return [];
    try {
        const res = await fetch(`/api/iso-r01902-events?bp=${encodeURIComponent(bp)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.status === 'success') {
            return Array.isArray(data.events) ? data.events : [];
        }
    } catch (e) {
        console.error('No se pudo leer R019-02 para', bp, e);
    }
    return [];
}

async function loadIsoGanttData(targetBp) {
    const body = document.getElementById('iso-gantt-body');
    const rangeEl = document.getElementById('iso-gantt-range');
    const statusEl = document.getElementById('iso-gantt-status');
    const axisEl = document.getElementById('iso-gantt-axis');

    try {
        await fetchIsoControlRecords();
    } catch (_) { }
    const records = loadIsoControlRecords();
    const desired = (targetBp || '').trim().toLowerCase();
    const filtered = desired
        ? records.filter(r => (r.descripcion || '').trim().toLowerCase() === desired)
        : records;
    const bps = filtered.map(r => (r && r.descripcion ? String(r.descripcion).trim() : '')).filter(Boolean);

    if (!bps.length) {
        if (body) body.innerHTML = `<div class="iso-gantt-empty">Seleccione un BP desde el panel de control.</div>`;
        if (rangeEl) rangeEl.textContent = 'Sin registros';
        if (statusEl) statusEl.textContent = '';
        if (axisEl) axisEl.innerHTML = '';
        return;
    }

    const eventsMap = {};
    let completed = 0;
    const total = bps.length;
    const updateStatus = () => {
        if (statusEl) statusEl.textContent = `Cargando ${completed}/${total}`;
    };
    updateStatus();

    let index = 0;
    const concurrency = Math.min(4, total);
    const workers = Array.from({ length: concurrency }, async () => {
        while (index < total) {
            const current = bps[index++];
            eventsMap[current] = await fetchIsoR01902EventsByBp(current);
            completed += 1;
            updateStatus();
        }
    });
    await Promise.all(workers);
    if (statusEl) statusEl.textContent = '';

    renderIsoGanttLegend();
    renderIsoGanttChart(filtered, eventsMap);

}

function renderIsoGanttLegend() {
    const legend = document.getElementById('iso-gantt-legend');
    if (!legend) return;
    const etapas = (isoTrackingSuggestions && isoTrackingSuggestions.etapa) ? isoTrackingSuggestions.etapa : [];
    if (!etapas.length) {
        legend.innerHTML = '';
        return;
    }
    legend.innerHTML = etapas.map(label => isoBadgeHtml(label, 'etapa')).join('');
}

function renderIsoGanttChart(records, eventsMap) {
    const body = document.getElementById('iso-gantt-body');
    const rangeEl = document.getElementById('iso-gantt-range');
    const axisEl = document.getElementById('iso-gantt-axis');
    const titleEl = document.getElementById('iso-gantt-title');
    if (!body || !axisEl || !rangeEl) return;

    const rowsData = records.map(rec => {
        const bp = rec && rec.descripcion ? String(rec.descripcion).trim() : '';
        const events = bp ? (eventsMap[bp] || []) : [];
        const segments = buildIsoGanttSegments(events);
        return { rec, bp, segments };
    }).filter(item => item.bp);

    if (titleEl) {
        const firstRec = rowsData.length ? rowsData[0].rec : null;
        const bpTitle = firstRec && firstRec.descripcion ? String(firstRec.descripcion).trim() : '';
        const solicitante = firstRec && firstRec.solicitante ? String(firstRec.solicitante).trim() : '';
        const fecha = firstRec && firstRec.fecha_inicio ? String(firstRec.fecha_inicio).trim() : '';
        const pieces = [bpTitle, solicitante, fecha].filter(Boolean);
        titleEl.textContent = pieces.join(' • ');
    }

    const allSegments = rowsData.flatMap(r => r.segments);
    if (!allSegments.length) {
        body.innerHTML = `<div class="iso-gantt-empty">No hay eventos con fecha en R019-02.</div>`;
        axisEl.innerHTML = '';
        rangeEl.textContent = 'Sin fechas disponibles';
        return;
    }

    let minDate = allSegments[0].actual_start || allSegments[0].start;
    let maxDate = allSegments[0].display_end || allSegments[0].end;
    allSegments.forEach(seg => {
        const segStart = seg.actual_start || seg.start;
        if (segStart < minDate) minDate = segStart;
        const segEnd = seg.display_end || seg.end;
        if (segEnd > maxDate) maxDate = segEnd;
    });

    const bounds = getRangeBounds(minDate, maxDate, isoGanttRangeMode);
    const rangeStart = bounds.start;
    const rangeEnd = bounds.end;
    rangeEl.textContent = `Rango: ${toDateOnly(rangeStart).toLocaleDateString('es-AR')} - ${toDateOnly(rangeEnd).toLocaleDateString('es-AR')}`;

    const axisScale = buildIsoGanttAxisScale(rangeStart, rangeEnd, isoGanttRangeMode, allSegments);
    const totalUnits = Math.max(1, getUnitDiff(rangeStart, rangeEnd, isoGanttRangeMode));

    axisEl.innerHTML = `
        <div class="iso-gantt-axis-cell">N</div>
        <div class="iso-gantt-axis-cell">Etapa</div>
        <div class="iso-gantt-axis-cell">Area</div>
        <div class="iso-gantt-axis-cell">Empresa</div>
        <div class="iso-gantt-axis-cell align-left">Descripcion</div>
        <div class="iso-gantt-axis-cell">Fecha inicio</div>
        <div class="iso-gantt-axis-cell">Fecha fin</div>
        <div class="iso-gantt-axis-cell">Duracion</div>
        <div class="iso-gantt-axis-scale">
            ${axisScale.map(m => `<div class="iso-gantt-month" style="flex: 0 0 ${m.width}%; max-width: ${m.width}%;">${m.label}</div>`).join('')}
        </div>
    `;

    const rows = [];
    rowsData.forEach(row => {
        row.segments.forEach((seg, idx) => {
            rows.push({
                bp: row.bp,
                rec: row.rec,
                seg,
                index: idx + 1
            });
        });
    });

    let counter = 0;
    const rendered = rows.map(item => {
        const seg = item.seg;
        const displayEnd = seg.display_end || seg.end;
        const overlapStart = seg.start > rangeStart ? seg.start : rangeStart;
        const overlapEnd = seg.end < rangeEnd ? seg.end : rangeEnd;
        if (overlapEnd < overlapStart) return '';

        counter += 1;
        const startText = (seg.actual_start || seg.start).toLocaleDateString('es-AR');
        const endText = displayEnd.toLocaleDateString('es-AR');
        const duration = Math.max(0, diffDays(seg.actual_start || seg.start, displayEnd));
        const color = getIsoBadgeColor('etapa', seg.etapa);
        const left = (getUnitDiff(rangeStart, overlapStart, isoGanttRangeMode) / totalUnits) * 100;
        let width = (getUnitDiff(overlapStart, overlapEnd, isoGanttRangeMode) / totalUnits) * 100;
        const minWidth = 0.8;
        if (width < minWidth) width = minWidth;
        const safeLeft = Math.max(0, Math.min(100, left));
        const safeWidth = Math.min(100 - safeLeft, width);
        const tooltip = `${seg.etapa} | ${startText} - ${endText}`;
        const bar = `<div class="iso-gantt-bar" data-chain-index="${counter}" title="${tooltip}" style="left: ${safeLeft}%; width: ${safeWidth}%; border-color: ${color}; background-color: ${color}33; color: ${color};"></div>`;

        return `
            <div class="iso-gantt-row" data-bp="${item.bp}">
                <div class="iso-gantt-cell">${counter}</div>
                <div class="iso-gantt-cell">${isoBadgeHtml(seg.etapa, 'etapa')}</div>
                <div class="iso-gantt-cell">${isoBadgeHtml(seg.area, 'area')}</div>
                <div class="iso-gantt-cell">${isoBadgeHtml(seg.empresa, 'empresa')}</div>
                <div class="iso-gantt-cell iso-gantt-desc align-left">${seg.descripcion || ''}</div>
                <div class="iso-gantt-cell">${startText}</div>
                <div class="iso-gantt-cell">${endText}</div>
                <div class="iso-gantt-cell">${duration} d</div>
                <div class="iso-gantt-track">${bar}</div>
            </div>
        `;
    }).filter(Boolean);

    body.innerHTML = rendered.length ? rendered.join('') : `<div class="iso-gantt-empty">Sin eventos en este rango.</div>`;
    syncIsoGanttColumnWidths();
    renderIsoGanttLinks();
}

async function syncIsoR01903Pending() {
    const btn = document.getElementById('iso-sync-pending-btn');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('btn-loading');
    }
    try {
        const res = await fetch('/api/iso-r01903-pending-sync', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data || data.status !== 'success') {
            const msg = data && data.message ? data.message : 'No se pudo sincronizar pendientes.';
            if (typeof showNotification === 'function') showNotification(msg, 'error');
            else alert(msg);
            return;
        }
        const processed = data.processed || 0;
        const remaining = data.remaining || 0;
        const msg = remaining > 0
            ? `Se sincronizaron ${processed}. Pendientes restantes: ${remaining}.`
            : `Pendientes sincronizados: ${processed}.`;
        const level = remaining > 0 ? 'warning' : 'success';
        if (typeof showNotification === 'function') showNotification(msg, level);
        else alert(msg);
    } catch (e) {
        console.error("ISO pending sync failed", e);
        if (typeof showNotification === 'function') showNotification('Error al sincronizar pendientes.', 'error');
        else alert('Error al sincronizar pendientes.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
        }
    }
}

function showISOInfoMenu(registroId) {
    localStorage.setItem('lastView', 'iso-info');
    if (registroId) localStorage.setItem('lastViewParam', registroId);
    else localStorage.removeItem('lastViewParam');

    hideAllViews();
    const view = document.getElementById('view-iso-info-menu');
    if (view) {
        view.style.display = 'block';
        animateEntry('view-iso-info-menu');
    }
    const subtitle = document.querySelector('header .subtitle');
    if (subtitle) subtitle.textContent = 'Oficina Técnica | Registro ISO 9001';

    const title = document.getElementById('iso-info-title');
    if (title) {
        const records = loadIsoControlRecords();
        const rec = records.find(r => String(r.numero) === String(registroId));
        const bp = rec && rec.descripcion ? rec.descripcion : registroId;
        title.textContent = bp ? `Registro ${bp}` : 'Información';
    }
}

function openIsoEntryByBp(bpOrId) {
    const records = loadIsoControlRecords();
    const bpKey = (bpOrId || '').trim().toLowerCase();
    const rec = records.find(r => (r.descripcion || '').trim().toLowerCase() === bpKey) || records.find(r => String(r.numero) === String(bpOrId));
    const id = rec ? (rec.numero || rec.descripcion) : bpOrId;
    if (id) {
        localStorage.setItem('lastViewParam', id);
        showISOInfoMenu(id);
        showISOEntradaFromInfo();
    }
}

async function showISOEntradaFromInfo() {
    const registroId = localStorage.getItem('lastViewParam');
    if (!registroId) {
        if (typeof showNotification === 'function') {
            showNotification("No se encontró el registro.", 'error');
        }
        return;
    }
    const payloads = loadIsoPayloads();
    const payload = payloads[registroId];
    if (!payload) {
        if (typeof showNotification === 'function') {
            showNotification("No se encontró el registro.", 'error');
        }
        return;
    }

    hideAllViews();
    const view = document.getElementById('view-iso-new-registry');
    if (view) {
        view.style.display = 'block';
        animateEntry('view-iso-new-registry');
    }
    await populateIsoResponsables(payload.Responsable_Diseño);
    fillIsoFormFromPayload(payload);
    setIsoFormReadonly(true);
    window._isoEntryReturn = 'info';
}

function showISOEntryBack() {
    if (window._isoEntryReturn === 'info') {
        const id = localStorage.getItem('lastViewParam');
        showISOInfoMenu(id);
        return;
    }
    showISOModule();
}

function loadIsoTrackingEvents() {
    try {
        const raw = localStorage.getItem('iso_tracking_events');
        const data = JSON.parse(raw || '{}');
        return data && typeof data === 'object' ? data : {};
    } catch (_) {
        return {};
    }
}

function saveIsoTrackingEvents(data) {
    localStorage.setItem('iso_tracking_events', JSON.stringify(data || {}));
}

const isoTrackingSuggestions = {
    etapa: ['Recolección de Datos', 'Diseño y Desarrollo', 'Pruebas', 'Validación', 'Cotizaciones', 'Produccion Local', 'Produccion Externa', 'Cierre'],
    area: ['Oficina Técnica', 'Calidad', 'Producción', 'Compras', 'Ventas', 'Deposito'],
    empresa: ['BPB Group', 'Cliente', 'Proveedor']
};

const isoBadgeColors = {
    etapa: {
        'Recolección de Datos': '#1abc9c',
        'Diseño y Desarrollo': '#3498db',
        'Pruebas': '#f39c12',
        'Validación': '#2ecc71',
        'Cotizaciones': '#e67e22',
        'Produccion Local': '#e74c3c',
        'Produccion Externa': '#8e44ad',
        'Cierre': '#95a5a6'
    },
    area: {
        'Oficina Técnica': '#3498db',
        'Calidad': '#2ecc71',
        'Producción': '#e67e22',
        'Compras': '#f1c40f',
        'Ventas': '#9b59b6',
        'Deposito': '#1abc9c'
    },
    empresa: {
        'BPB Group': '#1abc9c',
        'Cliente': '#e67e22',
        'Proveedor': '#8e44ad'
    }
};

const isoResultColors = {
    'aprobado': '#2ecc71',
    'no aprobado': '#e74c3c',
    'pendiente': '#f1c40f'
};

let isoGanttRangeMode = 'all';
let isoGanttCollapsed = false;

function getIsoBadgeColor(group, label) {
    const map = isoBadgeColors[group] || {};
    return map[label] || '#7f8c8d';
}

function isoBadgeHtml(label, group) {
    const text = (label || '').trim();
    if (!text) return '';
    const color = getIsoBadgeColor(group, text);
    return `<span class="iso-badge" style="color: ${color}; border: 1px solid ${color}; background-color: ${color}33;">${text}</span>`;
}

function isoResultBadgeHtml(status) {
    const text = (status || '').trim();
    if (!text) return '';
    const key = normalizeIsoText(text);
    const color = isoResultColors[key] || '#7f8c8d';
    return `<span class="iso-badge" style="color: ${color}; border: 1px solid ${color}; background-color: ${color}33;">${text}</span>`;
}

function parseIsoDate(value) {
    if (!value) return null;
    const parts = String(value).trim().split(/[\/\-\.]/).map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) return null;
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toUtcDate(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDays(start, end) {
    return Math.round((toUtcDate(end) - toUtcDate(start)) / 86400000);
}

function addDays(date, days) {
    const next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    return new Date(next.getFullYear(), next.getMonth(), next.getDate());
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function diffDaysFloat(start, end) {
    return (end.getTime() - start.getTime()) / 86400000;
}

function toDateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function diffHours(start, end) {
    return (end.getTime() - start.getTime()) / 3600000;
}

function diffWeeksFloat(start, end) {
    return diffDaysFloat(start, end) / 7;
}

function daysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function diffMonthsFloat(start, end) {
    const s = start.getFullYear() * 12 + start.getMonth() + (start.getDate() - 1) / daysInMonth(start);
    const e = end.getFullYear() * 12 + end.getMonth() + (end.getDate() - 1) / daysInMonth(end);
    return e - s;
}

function getRangeBounds(minDate, maxDate, mode) {
    if (mode === 'day') {
        return {
            start: new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), 0, 0),
            end: new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59, 999)
        };
    }
    if (mode === 'week') {
        const start = getIsoGanttWeekStart(minDate);
        const end = addDays(getIsoGanttWeekStart(maxDate), 6);
        return { start: toDateOnly(start), end: endOfDay(end) };
    }
    if (mode === 'month') {
        const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
        return { start: toDateOnly(start), end: endOfDay(end) };
    }
    if (mode === 'year') {
        const start = new Date(minDate.getFullYear(), 0, 1);
        const end = new Date(maxDate.getFullYear(), 11, 31);
        return { start: toDateOnly(start), end: endOfDay(end) };
    }
    return { start: toDateOnly(minDate), end: endOfDay(maxDate) };
}

function getUnitDiff(start, end, mode) {
    if (mode === 'day') return diffHours(start, end);
    if (mode === 'week') return diffDaysFloat(start, end);
    if (mode === 'month') return diffWeeksFloat(start, end);
    if (mode === 'year') return diffMonthsFloat(start, end);
    return diffDaysFloat(start, end);
}

function buildIsoGanttSegments(events) {
    const list = (Array.isArray(events) ? events : [])
        .map(ev => {
            const date = parseIsoDate(ev.fecha || ev.fecha_inicio || ev.fechaInicio);
            return { ...ev, _date: date };
        })
        .filter(ev => ev._date)
        .sort((a, b) => a._date - b._date);

    if (!list.length) return [];
    const segments = [];
    let prevEnd = null;

    for (let i = 0; i < list.length; i++) {
        const current = list[i];
        const actualStart = new Date(current._date.getFullYear(), current._date.getMonth(), current._date.getDate(), 9, 0);
        let nextActualStart = null;
        if (i < list.length - 1) {
            const nextDate = list[i + 1]._date;
            nextActualStart = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), 9, 0);
        }

    let barStart = prevEnd ? prevEnd : actualStart;
    if (!prevEnd && barStart < actualStart) barStart = actualStart;

    let barEnd = barStart;
        if (nextActualStart) {
            const sameDay = toDateOnly(nextActualStart).getTime() === toDateOnly(actualStart).getTime();
            if (sameDay) {
                // Cadena dentro del mismo día: ranuras visibles consecutivas
                barEnd = addMinutes(barStart, 180);
            } else {
                // En días distintos: terminar justo cuando comienza el siguiente evento
                barEnd = nextActualStart;
            }
        } else {
            // Último evento: dejar una duración mínima visible
            barEnd = addMinutes(barStart, 180);
        }

        prevEnd = barEnd;

        segments.push({
            start: barStart,
            actual_start: actualStart,
            end: barEnd,
            display_end: nextActualStart || actualStart,
            etapa: (current.etapa || '').trim() || 'Sin etapa',
            descripcion: (current.descripcion || '').trim(),
            area: (current.area || '').trim(),
            empresa: (current.empresa || '').trim()
        });
    }
    return segments;
}

function getIsoGanttRangeWindow(minDate, maxDate) {
    const mode = isoGanttRangeMode || 'all';
    if (mode === 'all') return { start: minDate, end: maxDate, label: 'Todo' };

    const end = maxDate;
    const daysMap = {
        day: 1,
        week: 7,
        month: 30,
        year: 365
    };
    const days = daysMap[mode] || 0;
    let start = days ? addDays(end, -(days - 1)) : minDate;
    if (start < minDate) start = minDate;
    const labelMap = {
        day: 'Día',
        week: 'Semana',
        month: 'Mes',
        year: 'Año'
    };
    return { start, end, label: labelMap[mode] || '' };
}

function setIsoGanttRange(mode) {
    isoGanttRangeMode = mode || 'all';
    const buttons = document.querySelectorAll('.iso-gantt-filter-btn');
    buttons.forEach(btn => {
        const btnMode = btn.dataset ? btn.dataset.mode : '';
        const isActive = btnMode === isoGanttRangeMode;
        btn.classList.toggle('active', !!isActive);
    });
    refreshIsoGantt();
}

function syncIsoGanttColumnWidths() {
    const view = document.getElementById('view-iso-gantt');
    if (!view || view.classList.contains('iso-gantt-collapsed')) return;
    const axis = view.querySelector('.iso-gantt-axis');
    const rows = view.querySelectorAll('.iso-gantt-row');
    if (!axis || !rows.length) return;

    const cols = 8;
    const widths = new Array(cols).fill(0);
    const minWidths = [50, 230, 210, 210, 260, 100, 100, 70];
    const maxWidths = [90, 0, 0, 0, 300, 130, 130, 90];

    const headerCells = axis.querySelectorAll('.iso-gantt-axis-cell');
    headerCells.forEach((cell, idx) => {
        if (idx >= cols) return;
        widths[idx] = Math.max(widths[idx], cell.scrollWidth || cell.offsetWidth || 0);
    });

    rows.forEach(row => {
        const cells = row.querySelectorAll('.iso-gantt-cell');
        for (let i = 0; i < cols; i++) {
            const cell = cells[i];
            if (!cell) continue;
            const size = Math.max(cell.scrollWidth || 0, cell.offsetWidth || 0);
            widths[i] = Math.max(widths[i], size);
        }
    });

    const finalWidths = widths.map((w, i) => {
        const base = Math.ceil(w + 16);
        const minW = minWidths[i] || 0;
        const maxW = maxWidths[i] || 0;
        const withMin = Math.max(minW, base);
        return maxW > 0 ? Math.min(maxW, withMin) : withMin;
    });

    const template = `${finalWidths[0]}px ${finalWidths[1]}px ${finalWidths[2]}px ${finalWidths[3]}px ${finalWidths[4]}px ${finalWidths[5]}px ${finalWidths[6]}px ${finalWidths[7]}px minmax(480px, 1fr)`;
    view.style.setProperty('--iso-gantt-cols', template);
    renderIsoGanttLinks();
}

function renderIsoGanttLinks() {
    const body = document.getElementById('iso-gantt-body');
    if (!body) return;
    let svg = body.querySelector('svg.iso-gantt-links');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('iso-gantt-links');
        body.appendChild(svg);
    }

    const bars = Array.from(body.querySelectorAll('.iso-gantt-bar[data-chain-index]'))
        .sort((a, b) => (parseInt(a.dataset.chainIndex || '0', 10) - parseInt(b.dataset.chainIndex || '0', 10)));
    if (bars.length < 2) {
        svg.innerHTML = '';
        return;
    }

    const bodyRect = body.getBoundingClientRect();
    const width = body.scrollWidth || bodyRect.width;
    const height = body.scrollHeight || bodyRect.height;
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const defs = `
        <defs>
            <marker id="iso-gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5 Z" fill="#cf1625"></path>
            </marker>
        </defs>
    `;

    const paths = [];
    for (let i = 0; i < bars.length - 1; i++) {
        const a = bars[i];
        const b = bars[i + 1];
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        const x1 = rectA.right - bodyRect.left;
        const y1 = rectA.top + rectA.height / 2 - bodyRect.top;
        const x2 = rectB.left - bodyRect.left;
        const y2 = rectB.top + rectB.height / 2 - bodyRect.top;
        const gap = 2;
        const endX = x2 - gap;
        const rowA = a.closest('.iso-gantt-row');
        const rowB = b.closest('.iso-gantt-row');
        const rowARect = rowA ? rowA.getBoundingClientRect() : rectA;
        const rowBRect = rowB ? rowB.getBoundingClientRect() : rectB;
        const dividerY = rowBRect.top - bodyRect.top;
        const midY = dividerY;

        const rightOffset = 18;
        const leftOffset = 18;
        const xRight = x1 + rightOffset;
        let xLeft = x2 - leftOffset;
        if (xLeft >= xRight - 20) {
            xLeft = xRight - 30;
        }
        const xTurn = endX - 4;
        const midYCurve = (y1 + y2) / 2;
        const dy = Math.abs(y2 - y1);
        const r = Math.max(14, Math.min(30, dy * 0.5));
        const rightBend = x1 + r;
        const leftBend = endX - r;
        const midX = (x1 + endX) / 2;
        const path = [
            `M ${x1} ${y1}`,
            `C ${rightBend} ${y1}, ${rightBend} ${midYCurve}, ${midX} ${midYCurve}`,
            `C ${leftBend} ${midYCurve}, ${leftBend} ${y2}, ${endX} ${y2}`
        ].join(' ');
        paths.push(`<path d="${path}" stroke="#cf1625" stroke-width="2" fill="none" marker-end="url(#iso-gantt-arrow)"></path>`);
    }

    svg.innerHTML = defs + paths.join('');
}

function getIsoGanttMonthLabel(date) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getIsoGanttDayLabel(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
}

function formatIsoHourLabel(date) {
    let h = date.getHours();
    const suffix = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}${suffix}`;
}

function getIsoGanttWeekStart(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0 Sunday
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    d.setDate(d.getDate() + diff);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildIsoGanttAxisScale(rangeStart, rangeEnd, mode, segments) {
    const scale = [];
    if (mode === 'day') {
        const totalHours = Math.max(1, diffHours(rangeStart, rangeEnd));
        const step = 4;
        let cursor = new Date(rangeStart.getTime());
        while (cursor <= rangeEnd) {
            const next = addMinutes(cursor, step * 60);
            const spanEnd = next > rangeEnd ? rangeEnd : next;
            const width = (diffHours(cursor, spanEnd) / totalHours) * 100;
            const label = cursor.getHours() === 0 ? getIsoGanttDayLabel(cursor) : formatIsoHourLabel(cursor);
            scale.push({ label, width });
            cursor = next;
        }
        return scale;
    }

    if (mode === 'week') {
        const totalDays = Math.max(1, diffDays(rangeStart, rangeEnd) + 1);
        let cursor = new Date(rangeStart.getTime());
        while (cursor <= rangeEnd) {
            const next = addDays(cursor, 1);
            const spanEnd = next > rangeEnd ? rangeEnd : next;
            const width = (diffDaysFloat(cursor, spanEnd) / totalDays) * 100;
            scale.push({ label: getIsoGanttDayLabel(cursor), width });
            cursor = next;
        }
        return scale;
    }

    if (mode === 'month') {
        const totalDays = Math.max(1, diffDays(rangeStart, rangeEnd) + 1);
        let cursor = new Date(rangeStart.getTime());
        cursor = getIsoGanttWeekStart(cursor);
        while (cursor <= rangeEnd) {
            const next = addDays(cursor, 7);
            const spanStart = cursor < rangeStart ? rangeStart : cursor;
            const spanEnd = next > rangeEnd ? rangeEnd : next;
            if (spanEnd < spanStart) break;
            const width = (diffDaysFloat(spanStart, spanEnd) / totalDays) * 100;
            scale.push({ label: `Sem ${getIsoGanttDayLabel(spanStart)}`, width });
            cursor = next;
        }
        return scale;
    }

    if (mode === 'year') {
        const totalMonths = Math.max(1, diffMonthsFloat(rangeStart, rangeEnd));
        let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
        while (cursor <= rangeEnd) {
            const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
            const spanStart = cursor < rangeStart ? rangeStart : cursor;
            const spanEnd = next > rangeEnd ? rangeEnd : next;
            const width = (diffMonthsFloat(spanStart, spanEnd) / totalMonths) * 100;
            scale.push({ label: getIsoGanttMonthLabel(cursor), width });
            cursor = next;
        }
        return scale;
    }

    return scale;
}

const isoInputColorGroups = {
    'iso-track-etapa': 'etapa',
    'iso-track-area': 'area',
    'iso-track-empresa': 'empresa'
};

function applyIsoTrackingInputColor(input, group) {
    if (!input || !group) return;
    const value = (input.value || '').trim();
    const map = isoBadgeColors[group] || {};
    const color = value ? (map[value] || '') : '';
    if (color) {
        input.style.setProperty('--iso-color', color);
        input.classList.add('iso-colored');
    } else {
        input.style.removeProperty('--iso-color');
        input.classList.remove('iso-colored');
    }
}

function getIsoTrackingBPOptions() {
    const records = loadIsoControlRecords();
    const seen = new Set();
    const list = [];
    records.forEach(rec => {
        const val = (rec && rec.descripcion ? rec.descripcion : '').trim();
        if (!val) return;
        const key = val.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        list.push(val);
    });
    return list;
}

function bindIsoTrackingBPSuggestions() {
    const input = document.getElementById('iso-tracking-bp');
    const suggestions = document.getElementById('iso-tracking-bp-suggestions');
    if (!input || !suggestions) return;
    if (input.dataset.isoSuggestBound === '1') return;
    input.dataset.isoSuggestBound = '1';

    const container = input.parentElement;

    const render = (items) => {
        suggestions.innerHTML = '';
        if (!items || items.length === 0) {
            suggestions.style.display = 'none';
            return;
        }
        items.forEach((text) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = text;
            div.onclick = () => {
                input.value = text;
                suggestions.style.display = 'none';
            };
            suggestions.appendChild(div);
        });
        suggestions.style.display = 'block';
    };

    const getMatches = (q) => {
        const options = getIsoTrackingBPOptions();
        if (!q) return options.slice(0, 8);
        return options
            .filter(opt => normalizeIsoText(opt).includes(q))
            .slice(0, 8);
    };

    input.addEventListener('input', () => {
        const q = normalizeIsoText(input.value).trim();
        render(getMatches(q));
    });

    input.addEventListener('focus', () => {
        const q = normalizeIsoText(input.value).trim();
        render(getMatches(q));
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            suggestions.style.display = 'none';
            if (typeof handleIsoTrackingSelect === 'function') handleIsoTrackingSelect();
        }
    });
}

function bindIsoTrackingSuggestions(inputId, listId, options) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(listId);
    if (!input || !suggestions) return;
    if (input.dataset.isoSuggestBound === '1') return;
    input.dataset.isoSuggestBound = '1';

    const container = input.parentElement;
    const group = isoInputColorGroups[inputId];

    const render = (items) => {
        suggestions.innerHTML = '';
        if (!items || items.length === 0) {
            suggestions.style.display = 'none';
            return;
        }
        items.forEach((text) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            if (group) {
                div.innerHTML = isoBadgeHtml(text, group);
                div.classList.add('suggestion-badge');
            } else {
                div.textContent = text;
            }
            div.onclick = () => {
                input.value = text;
                suggestions.style.display = 'none';
                if (group) applyIsoTrackingInputColor(input, group);
            };
            suggestions.appendChild(div);
        });
        suggestions.style.display = 'block';
    };

    const getMatches = (q) => {
        if (!q) return options.slice(0, 8);
        return options
            .filter(opt => normalizeIsoText(opt).includes(q))
            .slice(0, 8);
    };

    input.addEventListener('input', () => {
        const q = normalizeIsoText(input.value).trim();
        render(getMatches(q));
    });

    input.addEventListener('focus', () => {
        const q = normalizeIsoText(input.value).trim();
        render(getMatches(q));
    });
    input.addEventListener('blur', () => {
        if (group) applyIsoTrackingInputColor(input, group);
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });
}

function setupIsoTrackingSuggestions() {
    bindIsoTrackingSuggestions('iso-track-etapa', 'iso-track-etapa-suggestions', isoTrackingSuggestions.etapa);
    bindIsoTrackingSuggestions('iso-track-area', 'iso-track-area-suggestions', isoTrackingSuggestions.area);
    bindIsoTrackingSuggestions('iso-track-empresa', 'iso-track-empresa-suggestions', isoTrackingSuggestions.empresa);

    Object.keys(isoInputColorGroups).forEach((inputId) => {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.dataset.isoColorBound === '1') return;
        input.dataset.isoColorBound = '1';
        input.addEventListener('input', () => {
            const group = isoInputColorGroups[inputId];
            applyIsoTrackingInputColor(input, group);
        });
        applyIsoTrackingInputColor(input, isoInputColorGroups[inputId]);
    });
}

function populateIsoTrackingBPList() {
    const list = document.getElementById('iso-tracking-bp-list');
    if (!list) return;
    list.innerHTML = '';
    const records = loadIsoControlRecords();
    records.forEach(rec => {
        if (!rec || !rec.descripcion) return;
        const opt = document.createElement('option');
        opt.value = rec.descripcion;
        list.appendChild(opt);
    });
}

function getIsoTrackingRecordByDesc(desc) {
    const records = loadIsoControlRecords();
    const target = (desc || '').trim().toLowerCase();
    return records.find(r => (r.descripcion || '').trim().toLowerCase() === target) || null;
}

function getIsoTrackingRecordByNumero(numero) {
    const records = loadIsoControlRecords();
    return records.find(r => String(r.numero) === String(numero)) || null;
}

function setIsoTrackingSelection(record) {
    const content = document.getElementById('iso-tracking-content');
    const label = document.getElementById('iso-tracking-selected');
    if (label) {
        const bp = record && record.descripcion ? record.descripcion : '';
        label.textContent = bp ? `Registro seleccionado: ${bp}` : '';
    }
    if (content) content.style.display = record ? 'block' : 'none';

    if (record) {
        localStorage.setItem('iso_tracking_selected', record.numero || record.descripcion || '');
        loadIsoTrackingEventsFromR01902(record);
    }
}

function handleIsoTrackingSelect() {
    const input = document.getElementById('iso-tracking-bp');
    if (!input) return;
    const record = getIsoTrackingRecordByDesc(input.value);
    if (record) {
        setIsoTrackingSelection(record);
    } else {
        const content = document.getElementById('iso-tracking-content');
        if (content) content.style.display = 'none';
        const label = document.getElementById('iso-tracking-selected');
        if (label) label.textContent = '';
        localStorage.removeItem('iso_tracking_selected');
    }
}

async function loadIsoTrackingEventsFromR01902(record) {
    const key = record ? (record.numero || record.descripcion || '') : '';
    const bp = record && record.descripcion ? record.descripcion : '';
    const tbody = document.querySelector('#iso-tracking-table tbody');
    if (!key) return;

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
                    Cargando eventos...
                </td>
            </tr>
        `;
    }

    if (!bp) {
        renderIsoTrackingTable(key);
        return;
    }

    try {
        const res = await fetch(`/api/iso-r01902-events?bp=${encodeURIComponent(bp)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.status === 'success') {
            const events = Array.isArray(data.events) ? data.events : [];
            const all = loadIsoTrackingEvents();
            all[key] = events;
            saveIsoTrackingEvents(all);
            renderIsoTrackingTable(key);
            return;
        }
        const msg = data && data.message ? data.message : 'No se pudo leer R019-02.';
        if (typeof showNotification === 'function') {
            showNotification(msg, 'error');
        }
    } catch (e) {
        console.error("ISO R019-02 read failed", e);
        if (typeof showNotification === 'function') {
            showNotification('Error leyendo R019-02.', 'error');
        }
    }

    renderIsoTrackingTable(key);
}

function renderIsoTrackingTable(recordId) {
    const tbody = document.querySelector('#iso-tracking-table tbody');
    if (!tbody) return;
    const all = loadIsoTrackingEvents();
    const events = all[recordId] || [];
    if (!events.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
                    Sin eventos aún
                </td>
            </tr>
        `;
        return;
    }
    const canApproveUser = isApprovalUser();
    tbody.innerHTML = events.map(ev => {
        const resultados = (ev.resultados || '').trim();
        const isPending = resultados.toLowerCase() === 'pendiente';
        const canApprove = isPending && canApproveUser;
        const notifId = canApprove ? getApprovalNotificationId('', ev.row) : '';
        const resultDisplay = isoResultBadgeHtml(resultados) || resultados;
        const resultHtml = canApprove
            ? `<div class="iso-approve-cell">
                    <div class="iso-approve-badge">${resultDisplay || ''}</div>
                    <div class="iso-approve-actions">
                        <button class="btn-check" onclick="approveIsoTrackingEvent('${recordId}', '${ev.row || ''}', 'Aprobado', '', '${notifId || ''}')" title="Marcar como Aprobado">&#10003;</button>
                        <button class="btn-cancel-check" onclick="openIsoCorrectiveModal('${recordId}', '${ev.row || ''}', '${notifId || ''}')" title="Desaprobar">&#10005;</button>
                    </div>
               </div>`
            : resultDisplay;
        return `
        <tr data-row="${ev.row || ''}">
            <td>${ev.fecha || ''}</td>
            <td>${isoBadgeHtml(ev.etapa, 'etapa')}</td>
            <td>${isoBadgeHtml(ev.area, 'area')}</td>
            <td>${isoBadgeHtml(ev.empresa, 'empresa')}</td>
            <td>${ev.descripcion || ''}</td>
            <td>${resultHtml}</td>
            <td>${ev.accion || ''}</td>
            <td>${ev.usuario || ''}</td>
        </tr>
        `;
    }).join('');

    const targetRow = localStorage.getItem('iso_tracking_selected_row');
    if (targetRow) {
        const rowEl = tbody.querySelector(`tr[data-row="${targetRow}"]`);
        if (rowEl) {
            rowEl.classList.add('iso-row-highlight');
            rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        localStorage.removeItem('iso_tracking_selected_row');
    }
    if (localStorage.getItem('iso_tracking_selected_notification')) {
        localStorage.removeItem('iso_tracking_selected_notification');
    }
}

async function saveISOTrackingEvent() {
    if (window._isoTrackSaving) return;
    window._isoTrackSaving = true;
    const saveBtn = document.getElementById('iso-track-save-btn');

    const selected = localStorage.getItem('iso_tracking_selected');
    if (!selected) {
        if (typeof showNotification === 'function') {
            showNotification('Seleccione un BP antes de guardar.', 'error');
        } else {
            alert('Seleccione un BP antes de guardar.');
        }
        window._isoTrackSaving = false;
        return;
    }

    const etapa = (document.getElementById('iso-track-etapa') || {}).value || '';
    const area = (document.getElementById('iso-track-area') || {}).value || '';
    const empresa = (document.getElementById('iso-track-empresa') || {}).value || '';
    const descripcion = (document.getElementById('iso-track-desc') || {}).value || '';
    const situacion = (document.getElementById('iso-track-situacion') || {}).value || '';
    const requiereAprob = !!(document.getElementById('iso-track-aprob') || {}).checked;

    if (!etapa.trim() || !area.trim() || !empresa.trim() || !descripcion.trim() || !situacion.trim()) {
        if (typeof showNotification === 'function') {
            showNotification('Complete Etapa, ?rea, Empresa, Descripci?n y Situaci?n.', 'error');
        } else {
            alert('Complete Etapa, ?rea, Empresa, Descripci?n y Situaci?n.');
        }
        window._isoTrackSaving = false;
        return;
    }

    const fecha = new Date().toLocaleDateString('es-AR');
    const usuario = currentDisplayName || currentUser || 'Usuario';

    const record = getIsoTrackingRecordByNumero(selected) || getIsoTrackingRecordByDesc(selected);
    const bp = record && record.descripcion ? record.descripcion : '';
    if (!bp) {
        if (typeof showNotification === 'function') {
            showNotification('No se encontr? el BP seleccionado.', 'error');
        } else {
            alert('No se encontr? el BP seleccionado.');
        }
        window._isoTrackSaving = false;
        return;
    }

    const eventPayload = {
        fecha,
        etapa,
        area,
        empresa,
        descripcion,
        resultados: requiereAprob ? 'Pendiente' : '',
        situacion,
        accion: '',
        usuario,
        requiere_aprobacion: requiereAprob
    };

    if (saveBtn) {
        saveBtn.classList.add('btn-loading');
        saveBtn.disabled = true;
    }

    try {
        const res = await fetch('/api/iso-r01902-append', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bp, event: eventPayload })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data || data.status !== 'success') {
            const msg = data && data.message ? data.message : 'No se pudo guardar el evento.';
            if (typeof showNotification === 'function') {
                showNotification(msg, 'error');
            } else {
                alert(msg);
            }
            return;
        }
        if (data && data.r01903_error) {
            if (typeof showNotification === 'function') {
                showNotification(data.r01903_error, 'warning');
            }
        }
        if (data && data.r01904_error) {
            if (typeof showNotification === 'function') {
                showNotification(data.r01904_error, 'warning');
            }
        }

        try {
            const key = record.numero || record.descripcion || '';
            if (key) {
                const allEvents = loadIsoTrackingEvents();
                const list = Array.isArray(allEvents[key]) ? allEvents[key] : [];
                const newEvent = {
                    fecha,
                    etapa,
                    area,
                    empresa,
                    descripcion,
                    resultados: requiereAprob ? 'Pendiente' : '',
                    accion: '',
                    usuario,
                    row: data && data.row ? data.row : ''
                };
                list.push(newEvent);
                allEvents[key] = list;
                saveIsoTrackingEvents(allEvents);
                renderIsoTrackingTable(key);
            }
        } catch (e) {
            console.error('No se pudo refrescar la tabla ISO en el cliente:', e);
        }

        try {
            const records = loadIsoControlRecords();
            const idx = records.findIndex(r => (r.descripcion || '').trim().toLowerCase() === bp.trim().toLowerCase());
            if (idx >= 0) {
                records[idx].etapa = etapa;
                records[idx].situacion = situacion;
                if ((etapa || '').trim().toLowerCase() === 'cierre') {
                    records[idx].fecha_fin = fecha;
                }
                saveIsoControlRecords(records);
            }
        } catch (e) {
            console.error('No se pudo actualizar el panel de control ISO:', e);
        }

        if (document.getElementById('view-iso-control')?.style.display === 'block') {
            renderIsoControlTable();
        }
        setTimeout(() => {
            loadIsoTrackingEventsFromR01902(record);
        }, 300);
    } catch (e) {
        console.error('ISO tracking save failed', e);
        if (typeof showNotification === 'function') {
            showNotification('Error guardando el evento.', 'error');
        } else {
            alert('Error guardando el evento.');
        }
        return;
    } finally {
        window._isoTrackSaving = false;
        if (saveBtn) {
            saveBtn.classList.remove('btn-loading');
            saveBtn.disabled = false;
        }
    }

    const fields = ['iso-track-etapa', 'iso-track-area', 'iso-track-empresa', 'iso-track-desc', 'iso-track-situacion'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    Object.keys(isoInputColorGroups).forEach((inputId) => {
        const input = document.getElementById(inputId);
        if (input) applyIsoTrackingInputColor(input, isoInputColorGroups[inputId]);
    });
    const chk = document.getElementById('iso-track-aprob');
    if (chk) chk.checked = false;

    if (typeof showNotification === 'function') {
        showNotification('Evento guardado.', 'success');
    }
}


async function approveIsoTrackingEvent(recordId, row, status = "Aprobado", accion = "", notifId = "") {
    const rec = getIsoTrackingRecordByNumero(recordId) || getIsoTrackingRecordByDesc(recordId);
    const bp = rec && rec.descripcion ? rec.descripcion : '';
    if (!bp || !row) {
        if (typeof showNotification === 'function') {
            showNotification('No se pudo aprobar el evento.', 'error');
        }
        return;
    }
    try {
        const res = await fetch('/api/iso-r01902-approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bp, row, status, accion })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data || data.status !== 'success') {
            const msg = data && data.message ? data.message : 'No se pudo aprobar.';
            if (typeof showNotification === 'function') showNotification(msg, 'error');
            return;
        }
        if (notifId) {
            await markNotificationRead(notifId);
            await loadNotifications();
        }
        if (typeof showNotification === 'function') showNotification('Evento aprobado.', 'success');
        await loadIsoTrackingEventsFromR01902(rec);
    } catch (e) {
        console.error('Approve event failed', e);
        if (typeof showNotification === 'function') showNotification('Error aprobando el evento.', 'error');
    }
}

function resetISOTrackingPanel() {
    localStorage.removeItem('iso_tracking_selected');

    const input = document.getElementById('iso-tracking-bp');
    if (input) input.value = '';
    const label = document.getElementById('iso-tracking-selected');
    if (label) label.textContent = '';

    const content = document.getElementById('iso-tracking-content');
    if (content) content.style.display = 'none';

    const fields = ['iso-track-etapa', 'iso-track-area', 'iso-track-empresa', 'iso-track-desc', 'iso-track-situacion'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    Object.keys(isoInputColorGroups).forEach((inputId) => {
        const input = document.getElementById(inputId);
        if (input) applyIsoTrackingInputColor(input, isoInputColorGroups[inputId]);
    });
    const chk = document.getElementById('iso-track-aprob');
    if (chk) chk.checked = false;

    const suggestions = ['iso-tracking-bp-suggestions', 'iso-track-etapa-suggestions', 'iso-track-area-suggestions', 'iso-track-empresa-suggestions'];
    suggestions.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
            el.innerHTML = '';
        }
    });

    const tbody = document.querySelector('#iso-tracking-table tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
                    Sin eventos aún
                </td>
            </tr>
        `;
    }
}

function exitISOTrackingPanel() {
    resetISOTrackingPanel();
    if (window._isoTrackingReturn === 'activity-entry') {
        window._isoTrackingReturn = null;
        hideAllViews();
        const view = document.getElementById('view-activity-entry');
        if (view) {
            view.style.display = 'block';
            animateEntry('view-activity-entry');
        }
        const subtitle = document.querySelector('header .subtitle');
        if (subtitle) subtitle.textContent = 'Oficina Técnica | Registro de Actividad';
        return;
    }
    showISOModule();
}

function showISOTrackingPanel(fromInfo) {
    localStorage.setItem('lastView', 'iso-tracking');
    hideAllViews();
    const view = document.getElementById('view-iso-tracking');
    if (view) {
        view.style.display = 'block';
        animateEntry('view-iso-tracking');
    }
    const subtitle = document.querySelector('header .subtitle');
    if (subtitle) subtitle.textContent = 'Oficina Técnica | Registro ISO 9001';

    bindIsoTrackingBPSuggestions();
    setupIsoTrackingSuggestions();

    const input = document.getElementById('iso-tracking-bp');
    if (input) input.value = '';
    const content = document.getElementById('iso-tracking-content');
    if (content) content.style.display = 'none';
    const label = document.getElementById('iso-tracking-selected');
    if (label) label.textContent = '';

    if (fromInfo === 'info') {
        const preselect = localStorage.getItem('lastViewParam');
        if (preselect) {
            const recByNum = getIsoTrackingRecordByNumero(preselect);
            const rec = recByNum || getIsoTrackingRecordByDesc(preselect);
            if (rec) {
                if (input) input.value = rec.descripcion || '';
                setIsoTrackingSelection(rec);
            }
        }
    } else {
        localStorage.removeItem('iso_tracking_selected');
    }
}

function openIsoTrackingForBp(bp, row, notifId) {
    const records = loadIsoControlRecords();
    const bpKey = (bp || '').trim().toLowerCase();
    const rec = records.find(r => (r.descripcion || '').trim().toLowerCase() === bpKey) || null;
    const id = rec ? (rec.numero || rec.descripcion) : bp;
    if (id) {
        localStorage.setItem('lastViewParam', id);
    }
    if (row) localStorage.setItem('iso_tracking_selected_row', String(row));
    if (notifId) localStorage.setItem('iso_tracking_selected_notification', notifId);
    showISOTrackingPanel('info');
}

function openIsoTrackingFromActivity() {
    window._isoTrackingReturn = 'activity-entry';
    if (typeof showNotification === 'function') {
        showNotification('Abriendo Panel de Seguimiento ISO 9001...', 'info');
    }
    showISOTrackingPanel();
}

// View Navigation (Updated)

function showPOModule() {

    localStorage.setItem('lastView', 'po-module');

    hideAllViews();

    document.getElementById('app').style.display = 'block';

    animateEntry('app');

    // Refresh Data if empty

    if (allData.length === 0) {

        fetchData();

    }

    // Update Header Title for the Module

    const subtitle = document.querySelector('header .subtitle');

    if (subtitle) subtitle.textContent = 'Oficina Técnica | Registro de Control de Producto';

    showListView();

}

function showHome() {

    localStorage.setItem('lastView', 'home');

    hideAllViews();
    // FORCE HIDE LOGISTICS (Since hideAllViews definition is elusive)
    if (document.getElementById('view-logistics')) document.getElementById('view-logistics').style.display = 'none';

    const burger = document.getElementById('burger-dropdown');

    if (burger) burger.style.display = 'none';

    document.getElementById('view-home').style.display = 'block';

    animateEntry('view-home');

    const subtitle = document.querySelector('header .subtitle');

    if (subtitle) subtitle.textContent = 'Oficina Técnica';

    applyExternosHomeRestrictions();

}


function showRegistrosHome() {

    localStorage.setItem('lastView', 'home-registros');

    hideAllViews();

    const view = document.getElementById('view-home-registros');
    if (view) view.style.display = 'block';

    animateEntry('view-home-registros');

    const subtitle = document.querySelector('header .subtitle');
    if (subtitle) subtitle.textContent = 'Oficina T\u00e9cnica | Registros';

}

function showBaseDatosHome() {

    localStorage.setItem('lastView', 'home-base-datos');

    hideAllViews();

    const view = document.getElementById('view-home-base-datos');
    if (view) view.style.display = 'block';

    animateEntry('view-home-base-datos');

    const subtitle = document.querySelector('header .subtitle');
    if (subtitle) subtitle.textContent = 'Oficina T\u00e9cnica | Base de datos';

}

function showHerramientasHome() {

    localStorage.setItem('lastView', 'home-herramientas');

    hideAllViews();

    const view = document.getElementById('view-home-herramientas');
    if (view) view.style.display = 'block';

    animateEntry('view-home-herramientas');

    const subtitle = document.querySelector('header .subtitle');
    if (subtitle) subtitle.textContent = 'Oficina T\u00e9cnica | Herramientas';

}

function showSubHome() {

    localStorage.setItem('lastView', 'subhome');

    hideAllViews();

    document.getElementById('view-sub-home').style.display = 'block';

    // Reset Title for Standard View

    const titleEl = document.getElementById('main-title');

    if (titleEl) {

        titleEl.innerHTML = `Oficina Técnica`;

    }

    animateEntry('view-sub-home');

    // Correct Title

    const subtitle = document.querySelector('header .subtitle');

    if (subtitle) subtitle.textContent = 'Oficina Técnica | Registro de Control de Producto';

    // Trigger Background Check (Silent)

    checkSync(true);

}

function showActivitySubHome() {

    localStorage.setItem('lastView', 'activity-subhome');

    hideAllViews();

    document.getElementById('view-sub-home-activity').style.display = 'block';

    const subtitle = document.querySelector('header .subtitle');

    if (subtitle) subtitle.textContent = 'Oficina Técnica | Registro de Actividad';

    animateEntry('view-sub-home-activity');

}

// Global variable for current activity context

let currentActivityDate = '';

async function loadPendingActivities() {
    try {
        const res = await fetch('/api/activity-pending');
        const data = await res.json();

        if (data.status === 'success' && data.data) {
            window._pendingActivities = data.data || [];
        } else {
            window._pendingActivities = [];
        }

        // Update Badge (Main Activity Card)
        const badge = document.getElementById('activity-count-badge');
        // Update Badge (Pending Sub-Card)
        const pendingBadge = document.getElementById('activity-pending-badge');

        const count = window._pendingActivities.length;

        if (count > 0) {
            if (badge) {
                badge.textContent = count;
                badge.style.display = 'flex';
                badge.style.transform = 'scale(0)';
                setTimeout(() => badge.style.transform = 'scale(1)', 50);
            }
            if (pendingBadge) {
                pendingBadge.textContent = count;
                pendingBadge.style.display = 'flex';
                pendingBadge.style.transform = 'scale(0)';
                setTimeout(() => pendingBadge.style.transform = 'scale(1)', 50);
            }
        } else {
            if (badge) badge.style.display = 'none';
            if (pendingBadge) pendingBadge.style.display = 'none';
        }

        if (typeof renderActivityPendingTable === 'function') {
            renderActivityPendingTable();
        }

        updateRegistrosHomeBadge();

    } catch (e) {
        console.error("Error loading pending activities:", e);
        window._pendingActivities = [];
        // Hide badge on error
        const badge = document.getElementById('activity-count-badge');
        if (badge) badge.style.display = 'none';

        if (typeof renderActivityPendingTable === 'function') {
            renderActivityPendingTable();
        }

        updateRegistrosHomeBadge();
    }
}

function showActivityPending() {

    localStorage.setItem('lastView', 'activity-pending');

    hideAllViews();

    document.getElementById('view-activity-pending').style.display = 'block';

    loadPendingActivities();

    const today = new Date();

    const dd = String(today.getDate()).padStart(2, '0');

    const mm = String(today.getMonth() + 1).padStart(2, '0');

    const yyyy = today.getFullYear();

    /* GHOST FIX: Do not default to today unless we want to force a new entry */
    // const dateStr = dd + '/' + mm + '/' + yyyy;
    // For now, let's keep it but mark it as explicit manual or waiting for data?
    // User wants to see the token to know if it's from mailer.
    const dateStr = ""; // Initialized empty to prevent ghost

    currentActivityDate = dateStr;

    // Set Date in UI

    // const dateStr = ""; // Declared above
    currentActivityDate = "";

    const dateEl = document.getElementById('mock-date');
    if (dateEl) {
        dateEl.textContent = "";
        if (dateEl.parentElement) dateEl.parentElement.style.display = 'none';
    }

    const tokenEl = document.getElementById('mock-token');
    if (tokenEl) tokenEl.textContent = "";

    // Check Status

    fetch(`/api/get-activity-status?date=${encodeURIComponent(dateStr)}`)

        .then(res => res.json())

        .then(data => {

            const statusBadge = document.querySelector('#activity-pending-table .status-badge');

            const editBtn = document.querySelector('#activity-pending-table button[onclick*="showActivityEntry"]');

            const approveBtn = document.querySelector('#activity-pending-table button.btn-approve');

            // Reset states

            if (approveBtn) {

                approveBtn.disabled = true;

                approveBtn.onclick = null;

                approveBtn.style.opacity = '0.5';

                approveBtn.style.cursor = 'not-allowed';

            }

            if (data.status === 'success' && data.completed) {

                // COMPLETED (Saved)

                if (data.approved) {

                    // APPROVED

                    if (statusBadge) {

                        statusBadge.className = 'status-badge completed';

                        statusBadge.textContent = 'Aprobado';

                        statusBadge.style.backgroundColor = '#0056b3';

                        statusBadge.style.color = 'white';

                    }

                    if (editBtn) {

                        editBtn.textContent = 'Ver Registro';

                        // Disable if we want read-only, currently allows edit but server rejects.

                    }

                    if (approveBtn) {

                        approveBtn.textContent = 'Aprobado';

                        approveBtn.parentElement.innerHTML = '<span style="color:var(--text-secondary);">Aprobado</span>';

                    }

                } else {

                    // PENDING APPROVAL (But Completed)

                    if (statusBadge) {

                        statusBadge.className = 'status-badge completed';

                        statusBadge.textContent = 'Completado';

                        statusBadge.removeAttribute('style');

                    }

                    if (editBtn) {

                        editBtn.textContent = 'Editar Registro';

                    }

                    if (approveBtn) {

                        approveBtn.disabled = false;

                        approveBtn.style.opacity = '1';

                        approveBtn.style.cursor = 'pointer';

                        approveBtn.textContent = 'Aprobar Registro';

                        // Pass 'this' reference requires wrapping

                        approveBtn.onclick = function () { approveActivity(currentActivityToken || '', this); };

                    }

                }

            } else {

                // NOT COMPLETED (Pending Input)

                if (statusBadge) {

                    statusBadge.className = 'status-badge pending';

                    statusBadge.textContent = 'Pendiente';

                    statusBadge.style.removeProperty('background-color');

                    statusBadge.style.removeProperty('color');

                }

                if (editBtn) {

                    editBtn.textContent = 'Completar Registro';

                }

            }

        });

    animateEntry('view-activity-pending');

}

// ANIMATION APPROVAL LOGIC

// ANIMATION APPROVAL LOGIC

function animateApproveActivity(btnElement) {

    if (!currentActivityDate) {

        console.error("No currentActivityDate set");

        // Try to recover from global or UI

        const row = document.querySelector('#activity-pending-table tbody tr');

        if (row) {

            // Adjusted back to 1 because Date is now the first column again
            const dateText = row.querySelector('td:nth-child(1)').textContent.trim();

            if (dateText) currentActivityDate = dateText;

        }

        if (!currentActivityDate) return;

    }

    // Find Row and Elements

    const table = document.getElementById('activity-pending-table');

    const row = table.querySelector('tbody tr') || table.querySelector('tr:nth-child(2)');

    if (!row) {

        doApproveLogic();

        return;

    }

    // 1. Elements

    // Use Date Cell (1st Column)

    const idCell = row.querySelector('td:nth-child(1)');

    if (!idCell) {

        doApproveLogic();

        return;

    }

    // 2. Clone

    const flyerId = idCell.cloneNode(true);

    const flyerBtn = btnElement.cloneNode(true);

    // 3. Rects

    const idRect = idCell.getBoundingClientRect();

    const btnRect = btnElement.getBoundingClientRect();

    const rowRect = row.getBoundingClientRect();

    // 4. Setup Flyers

    flyerId.className = 'fly-element';

    flyerId.style.top = idRect.top + 'px';

    flyerId.style.left = idRect.left + 'px';

    flyerId.style.width = idRect.width + 'px';

    flyerId.style.margin = '0';

    flyerId.style.color = 'var(--text-primary)';

    flyerId.style.display = 'flex';

    flyerId.style.alignItems = 'center';

    flyerId.style.justifyContent = 'center'; // Center text since it is a date

    // Ensure styles that might be computed from CSS are active or reset for clone

    flyerId.style.background = 'transparent';

    flyerBtn.className = 'fly-element';

    flyerBtn.style.top = btnRect.top + 'px';

    flyerBtn.style.left = btnRect.left + 'px';

    flyerBtn.style.width = btnRect.width + 'px';

    flyerBtn.style.height = btnRect.height + 'px';

    flyerBtn.style.background = 'transparent';

    flyerBtn.style.border = '1px solid #2ecc71';

    flyerBtn.style.color = '#2ecc71';

    flyerBtn.style.display = 'flex';

    flyerBtn.style.alignItems = 'center';

    flyerBtn.style.justifyContent = 'center';

    flyerBtn.innerHTML = 'Aprobar Registro';

    document.body.appendChild(flyerId);

    document.body.appendChild(flyerBtn);
    // 5. Hide action buttons to avoid doble click (pero mantenemos la fila visible)
    const rowButtons = row.querySelectorAll('button');
    rowButtons.forEach(b => { b.disabled = true; b.style.visibility = 'hidden'; });
    // Hide row content while animating clones
    row.style.visibility = 'hidden';

    // 6. Reflow

    void flyerId.offsetWidth;

    // 7. Calculate Center Target (ROW Center)

    const centerX = rowRect.left + (rowRect.width / 2);

    const centerY = rowRect.top + (rowRect.height / 2);

    // 8. Animate

    // ID moves to left of center

    flyerId.style.left = (centerX - 60) + 'px';

    flyerId.style.top = centerY + 'px';

    flyerId.style.transform = 'translate(-50%, -50%) scale(1.3)'; // Scale 1.3 as requested

    // Button moves to right of center and becomes tick

    flyerBtn.style.left = (centerX + 60) + 'px';

    flyerBtn.style.top = centerY + 'px';

    flyerBtn.style.width = '35px';

    flyerBtn.style.height = '35px';

    flyerBtn.style.borderRadius = '50%';

    flyerBtn.style.border = '2px solid #2ecc71'; // Green circle

    flyerBtn.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.3)'; // Glow

    flyerBtn.innerHTML = '&#10003;'; // Tick

    flyerBtn.style.color = '#2ecc71';

    flyerBtn.style.fontSize = '1.4rem';

    flyerBtn.style.transform = 'translate(-50%, -50%)';

    // TRIGGER API

    doApproveLogic();
    // 9. Glow
    setTimeout(() => {
        flyerId.classList.add('fly-glow-burst');
        flyerBtn.classList.add('fly-glow-burst');
    }, 600);

    // 10. Cleanup + remove row after animation finishes
    setTimeout(() => {
        row.remove();
        flyerId.remove();
        flyerBtn.remove();
        // Final UI Update: Refresh View without leaving panel
        if (typeof loadPendingActivities === 'function') {
            loadPendingActivities();
        }
    }, 1400);

}

function doApproveLogic() {
    // If animation queued a callback, run it; otherwise submit directly
    if (typeof window._afterApproveAnimation === 'function') {
        const cb = window._afterApproveAnimation;
        window._afterApproveAnimation = null;
        // Let the visual fly/glow play before submitting
        setTimeout(cb, 800);
        return;
    }

    const act = window._pendingActivities.find(a => a.token === window.currentActivityToken);
    if (!act || !act.stagingData) {
        showNotification('Error: no hay datos para aprobar.', 'error');
        return;
    }

    fetch('/api/activity-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token: act.token,
            project: act.stagingData.project,
            time: act.stagingData.time,
            description: act.stagingData.description
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                showNotification("Registro aprobado y enviado.", 'success');
                // Refresh pending list without leaving panel
                loadPendingActivities();
            } else {
                showNotification(data.message || 'Error al aprobar.', 'error');
            }
        })
        .catch(e => {
            console.error(e);
            showNotification('Error al aprobar.', 'error');
        });
}

function showActivityRecordsMenu() {

    const statsView = document.getElementById('view-activity-stats'); if (statsView) statsView.style.display = 'none';
    localStorage.setItem('lastView', 'activity-records');

    hideAllViews();

    document.getElementById('view-activity-records-menu').style.display = 'block';

    animateEntry('view-activity-records-menu');

}

async function showActivityHistoryDetail() {
    localStorage.setItem('lastView', 'activity-history-detail');
    hideAllViews();

    let view = document.getElementById('view-activity-history-detail');

    if (!view) {
        view = document.createElement('div');
        view.id = 'view-activity-history-detail';
        view.className = 'panel';
        view.style.maxWidth = '1400px';
        view.style.margin = '0 auto';
        const container = document.querySelector('.container');
        if (container) container.appendChild(view);
        else document.body.appendChild(view);
    }

    view.style.display = 'block';
    view.style.background = '#1e1e1e';
    view.style.position = 'relative';
    view.style.zIndex = '100';

    // Toggle Filter Logic (Inline helper)
    window.toggleHistoryFilters = () => {
        const f = document.getElementById('hist-filters-container');
        if (f.style.display === 'none') {
            f.style.display = 'flex';
            f.style.animation = 'fadeIn 0.3s ease';
        } else {
            f.style.display = 'none';
        }
    };

    view.innerHTML = `
        <style>
            /* Force Dark Options for Selects */
            #hist-filter-date option, #hist-filter-project option {
                background-color: #1e1e1e;
                color: #ffffff;
                padding: 10px;
            }
        </style>
        <div class="panel-header" style="margin-bottom: 1.5rem;">
            <div class="panel-title decorated-title">
                    <span class="breadcrumb-link" onclick="showActivityRecordsMenu()">Registros</span>
                    <span style="color: var(--bpb-blue); margin: 0 10px;">&gt;</span>
                    Historial Personal
            </div>
            <div class="header-right" style="display: flex; gap: 10px; align-items: center;">
                <button class="btn" onclick="window.toggleHistoryFilters()" style="display: flex; align-items: center; gap: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    Filtrar
                </button>
                <button class="btn" onclick="showActivityRecordsMenu()">&larr; Volver</button>
            </div>
        </div>
        
        <!-- FILTERS TOOLBAR (Hidden by default) -->
        <div id="hist-filters-container" style="display: none; gap: 1rem; margin-bottom: 1rem; align-items: flex-end; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Periodo</label>
                <select id="hist-filter-date" onchange="window.filterHistoryData()" class="search-input" style="width: auto; min-width: 180px; cursor: pointer; background-image: none; background-color: #1e1e1e; color: white;">
                    <option value="all">Todo el Historial</option>
                    <option value="today">Hoy</option>
                    <option value="7days">Últimos 7 días</option>
                    <option value="30days">Últimos 30 días</option>
                </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Proyecto</label>
                <select id="hist-filter-project" onchange="window.filterHistoryData()" class="search-input" style="width: auto; min-width: 250px; cursor: pointer; background-image: none; background-color: #1e1e1e; color: white;">
                    <option value="all">Todos los proyectos</option>
                </select>
            </div>
            
            <div style="margin-left: auto; padding-bottom: 5px;">
                 <div id="hist-stats" style="color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;">
                    Cargando...
                 </div>
            </div>
        </div>

        <div class="panel-content">
            <div class="table-container" style="max-height: 70vh; overflow-y: auto; background: #1e1e1e; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <table id="activity-history-table" class="data-table" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                    <thead style="position: sticky; top: 0; background: #252525; z-index: 10;"></thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;

    animateEntry('view-activity-history-detail');

    const tbody = view.querySelector('tbody');
    const thead = view.querySelector('thead');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:white; padding: 40px;"><div class="spinner"></div> Cargando datos...</td></tr>';

    try {
        const res = await fetch('/api/activity-history');
        const data = await res.json();

        if (data.status === 'success') {
            // 1. SETUP HEADERS
            const customHeaders = ['Fecha', 'Hora', 'Token', 'Proyecto', 'Tiempo', 'Descripción', 'Modificar'];
            let headerHtml = '<tr>';
            customHeaders.forEach(col => {
                headerHtml += `<th style="color: var(--text-secondary); text-transform: uppercase; padding: 1.25rem 1rem; border-bottom: 2px solid var(--border); font-size: 0.75rem; letter-spacing: 0.1em; text-align: center;">${col}</th>`;
            });
            headerHtml += '</tr>';
            thead.innerHTML = headerHtml;

            // 2. PROCESS DATA
            let allData = [];
            if (data.data && data.data.length > 0) {
                allData = [...data.data].reverse();
            }

            window._historyDataRaw = allData;

            // 3. POPULATE PROJECT FILTER
            const projects = new Set();
            allData.forEach(r => {
                const pName = r[3] ? r[3].trim() : '';
                if (pName) projects.add(pName);
            });
            const sortedProjects = Array.from(projects).sort();

            const projSelect = document.getElementById('hist-filter-project');
            sortedProjects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                projSelect.appendChild(opt);
            });

            // 4. DEFINE FILTER & RENDER LOGIC
            window.filterHistoryData = () => {
                const dateFilter = document.getElementById('hist-filter-date').value;
                const projFilter = document.getElementById('hist-filter-project').value;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const filtered = window._historyDataRaw.filter(row => {
                    // Parse Date DD/MM/YYYY
                    let passDate = true;
                    if (dateFilter !== 'all') {
                        const parts = row[0].split('/');
                        if (parts.length === 3) {
                            const rowDate = new Date(parts[2], parts[1] - 1, parts[0]);
                            const diffTime = Math.abs(today - rowDate);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (dateFilter === 'today') {
                                const isSameDay = (rowDate.getDate() === today.getDate() &&
                                    rowDate.getMonth() === today.getMonth() &&
                                    rowDate.getFullYear() === today.getFullYear());
                                passDate = isSameDay;
                            } else if (dateFilter === '7days') {
                                passDate = diffDays <= 7;
                            } else if (dateFilter === '30days') {
                                passDate = diffDays <= 30;
                            }
                        }
                    }

                    let passProj = true;
                    if (projFilter !== 'all') {
                        passProj = (row[3] && row[3].trim() === projFilter);
                    }

                    return passDate && passProj;
                });

                renderHistoryTable(filtered);
            };

            // 5. RENDER FUNCTION
            function renderHistoryTable(rows) {
                const tbody = document.querySelector('#activity-history-table tbody');
                const statsEl = document.getElementById('hist-stats');
                tbody.innerHTML = '';

                if (statsEl) statsEl.textContent = rows.length === 1 ? '1 Registro encontrado' : `${rows.length} Registros encontrados`;

                if (rows.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:white; padding: 2rem;">No hay registros que coincidan con los filtros.</td></tr>';
                    return;
                }

                const colors = ['#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#f1c40f', '#e74c3c', '#d35400'];

                rows.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.style.transition = 'background-color 0.2s';
                    tr.onmouseover = function () { this.style.backgroundColor = 'rgba(255,255,255,0.05)'; };
                    tr.onmouseout = function () { this.style.backgroundColor = 'transparent'; };

                    const getVal = (i) => (row[i] !== undefined && row[i] !== null) ? row[i] : '';

                    const displayRow = [
                        getVal(0), getVal(1), getVal(2), getVal(3), getVal(4), getVal(5), getVal(6)
                    ];

                    displayRow.forEach((cell, index) => {
                        const td = document.createElement('td');
                        td.style.padding = '1rem 1rem';
                        td.style.color = '#ffffff';
                        td.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
                        td.style.fontSize = '0.9rem';
                        td.style.verticalAlign = 'middle';
                        td.style.textAlign = 'center';

                        if (index === 3) { // Proyecto Badge
                            const project = cell.toString().trim();
                            let baseColor = '#7f8c8d';
                            if (project && project !== 'Sin Proyecto Asignado') {
                                let hash = 0;
                                for (let i = 0; i < project.length; i++) hash = project.charCodeAt(i) + ((hash << 5) - hash);
                                baseColor = colors[Math.abs(hash) % colors.length];
                            } else {
                                baseColor = '#666666';
                            }

                            const span = document.createElement('span');
                            span.textContent = project || '---';
                            span.style.color = baseColor;
                            span.style.border = `1px solid ${baseColor}`;
                            span.style.backgroundColor = baseColor + '33';
                            span.style.padding = '6px 16px';
                            span.style.borderRadius = '20px';
                            span.style.fontSize = '0.75rem';
                            span.style.fontWeight = '700';
                            span.style.display = 'inline-block';
                            span.style.minWidth = '120px';
                            span.style.whiteSpace = 'nowrap';
                            span.style.textTransform = 'uppercase';
                            span.style.letterSpacing = '0.05em';
                            td.appendChild(span);
                        }
                        else if (index === 2) { // Token
                            const wrapper = document.createElement('code');
                            wrapper.textContent = cell;
                            wrapper.style.background = 'rgba(255,255,255,0.1)';
                            wrapper.style.padding = '2px 6px';
                            wrapper.style.borderRadius = '4px';
                            wrapper.style.fontFamily = 'monospace';
                            wrapper.style.fontSize = '0.85rem';
                            wrapper.style.color = '#bdc3c7';
                            td.appendChild(wrapper);
                        }
                        else if (index === 5) { // Descripción: limitar ancho y permitir wrap
                            td.textContent = cell;
                            td.style.maxWidth = '320px';
                            td.style.whiteSpace = 'normal';
                            td.style.wordBreak = 'break-word';
                            td.style.overflowWrap = 'anywhere';
                        }
                        else if (index === 6) { // Modificar Button
                            // Create button container
                            const btn = document.createElement('button');
                            btn.className = 'btn-circle-action'; // Reusing existing circular button class if available, or style inline
                            btn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                            `;
                            btn.style.width = '32px';
                            btn.style.height = '32px';
                            btn.style.borderRadius = '50%';

                            // Match .btn style
                            btn.style.border = '1px solid var(--text-secondary)';
                            btn.style.background = 'transparent';
                            btn.style.color = 'var(--text-primary)';

                            btn.style.cursor = 'pointer';
                            btn.style.display = 'flex';
                            btn.style.justifyContent = 'center';
                            btn.style.alignItems = 'center';
                            btn.style.margin = '0 auto';
                            btn.style.transition = 'all 0.3s'; // Match .btn transition

                            // Hover effect (Match .btn:hover)
                            btn.onmouseover = () => {
                                btn.style.borderColor = 'var(--bpb-blue)';
                                btn.style.background = 'var(--bpb-blue)';
                                btn.style.color = 'white';
                                btn.style.boxShadow = '0 0 15px rgba(207, 22, 37, 0.4)';
                            };
                            btn.onmouseout = () => {
                                btn.style.borderColor = 'var(--text-secondary)';
                                btn.style.background = 'transparent';
                                btn.style.color = 'var(--text-primary)';
                                btn.style.boxShadow = 'none';
                            };

                            // Attach click handler - using addEventListener for better reliability
                            btn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const token = row[2]; // Token
                                const project = row[3]; // Project Name
                                const time = row[4];  // Time matches index 4
                                const desc = row[5];  // Desc matches index 5

                                if (typeof showEditActivityModal === 'function') {
                                    showEditActivityModal(token, desc, time, project, row[0]);
                                } else {
                                    console.error('showEditActivityModal is not defined!');
                                }
                            });

                            td.appendChild(btn);
                        }
                        else {
                            td.textContent = cell;
                        }
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
            }

            // Initial Render
            window.filterHistoryData();

        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: #e74c3c; padding: 2rem;">Error: ${data.message}</td></tr>`;
        }

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: #e74c3c; padding: 2rem;">Error de conexión.</td></tr>';
    }
}

const statsDefaults = {
    viewId: 'view-activity-stats',
    breadcrumbHtml: `<span class="breadcrumb-link" onclick="showActivityRecordsMenu()">Registros</span><span style="color: var(--bpb-blue); margin: 0 10px;">&gt;</span> Estad&iacute;sticas`,
    backAction: 'showActivityRecordsMenu()',
    fetchUrl: '/api/activity-stats',
    storageKey: 'activity-stats',
    title: 'Estad&iacute;sticas'
};
let statsConfig = { ...statsDefaults };
let statsRecords = [];
let statsAvailableUsers = [];
let statsAvailableProjects = [];
let statsSelectedUsers = [];
let statsSelectedProjects = [];
let statsYear = new Date().getFullYear();
let statsStartMonth = null;
let statsEndMonth = null;
let statsDayRangeStart = null;
let statsDayRangeEnd = null;
let statsDragMonth = null;

async function showActivityStats(options = {}) {
    statsConfig = { ...statsDefaults, ...options };
    window.statsConfig = statsConfig; // Store globally for renderStatsBar access

    localStorage.setItem('lastView', statsConfig.storageKey || 'activity-stats');
    hideAllViews();

    const viewId = statsConfig.viewId || 'view-activity-stats';
    let view = document.getElementById(viewId);

    if (!view) {
        view = document.createElement('div');
        view.id = viewId;
        view.className = 'panel';
        view.style.maxWidth = '1200px';
        view.style.margin = '0 auto';
        const container = document.querySelector('.container');
        if (container) container.appendChild(view);
        else document.body.appendChild(view);
    }

    view.style.display = 'block';
    view.style.background = '#1e1e1e';
    view.style.position = 'relative';
    view.style.zIndex = '100';

    const backAction = statsConfig.backAction || 'showActivityRecordsMenu()';
    const breadcrumb = statsConfig.breadcrumbHtml || statsDefaults.breadcrumbHtml;
    const titleText = statsConfig.title || 'Estad&iacmute;sticas';
    const isAdminView = statsConfig.fetchUrl === '/api/activity-stats-global';

    view.innerHTML = `
        <div class="panel-header" style="margin-bottom: 1.5rem;">
            <div class="panel-title decorated-title">
                    ${breadcrumb}
            </div>
            <div class="header-right" style="display: flex; gap: 10px; align-items: center;">
                ${isAdminView ? `
                <button class="btn" onclick="printActivityStats()" style="display:flex; align-items:center; gap:8px; padding: 6px 12px;" title="Imprimir Reporte">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                </button>
                ` : ''}
                <button class="btn" onclick="${backAction}">&larr; Volver</button>
            </div>
        </div>

        <div class="panel-content">
            <div style="display:flex; flex-wrap:wrap; gap:1rem; margin-bottom:1rem; align-items:flex-end; background: rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:10px; padding:12px;">
                <div style="display:flex; flex-direction:column; gap:6px; flex:1 1 100%;">
                    <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.9rem; color:var(--text-primary);">
                        <span style="font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Fecha</span>
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
                            ${isAdminView ? `
                            <button class="btn" id="stats-user-filter" style="padding:6px 14px; display:flex; align-items:center; gap:8px;" title="Filtrar por Usuario">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path></svg>
                                <span>Filtrar por Usuario</span>
                            </button>
                            <button class="btn" id="stats-project-filter" style="padding:6px 14px; display:flex; align-items:center; gap:8px;" title="Filtrar por Proyecto">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                                <span>Filtrar por Proyecto</span>
                            </button>
                            ` : ''}
                            <button class="btn" id="stats-day-filter" style="padding:6px 14px; display:flex; align-items:center; gap:8px; min-width:140px;" title="Filtrar por d&iacute;a">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                <span>Filtrar por D&iacute;a</span>
                            </button>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <button class="btn" style="padding:4px 8px;" onclick="statsPrevYear()">&larr;</button>
                                <span id="stats-year-label" style="font-weight:700;"></span>
                                <button class="btn" style="padding:4px 8px;" onclick="statsNextYear()">&rarr;</button>
                            </div>
                        </div>
                    </div>
                    <div id="stats-months" style="display:grid; grid-template-columns: repeat(6, 1fr); gap:6px; margin-top:8px;"></div>
                    <div style="margin-top:6px; color: var(--text-secondary); font-size:0.9rem; display:flex; gap:14px; flex-wrap:wrap; align-items:center;">
                        <span id="stats-range-label">Todos los meses</span>
                        ${isAdminView ? `
                        <span style="opacity:0.6;">&bull;</span>
                        <span id="stats-users-label">Todos los usuarios</span>
                        <span style="opacity:0.6;">&bull;</span>
                        <span id="stats-projects-label">Todos los proyectos</span>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
                <div style="flex:1 1 400px; background:#1a1a1a; border:1px solid var(--border); border-radius:12px; padding:1rem;">
                    <h4 style="margin-top:0; color:var(--text-primary); margin-bottom:0.75rem;">${titleText}</h4>
                    <canvas id="stats-pie" width="400" height="400"></canvas>
                </div>
                <div style="flex:1 1 320px; background:#1a1a1a; border:1px solid var(--border); border-radius:12px; padding:1rem;">
                    <h4 style="margin-top:0; color:var(--text-primary); margin-bottom:0.75rem;">Detalle</h4>
                    <div id="stats-table-container" class="table-container" style="max-height:420px; overflow-y:auto;">
                        <table class="data-table" id="stats-table" style="width:100%; border-collapse:separate; border-spacing:0;">
                            <thead>
                                <tr>
                                    <th style="text-align:left; padding:10px;">Proyecto</th>
                                    <th style="text-align:right; padding:10px;">Horas</th>
                                    <th style="text-align:right; padding:10px;">%</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>

            ${isAdminView ? `
            <div id="stats-bar-section" style="margin-top:1.5rem; background:#1a1a1a; border:1px solid var(--border); border-radius:12px; padding:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <h4 style="margin:0; color:var(--text-primary);">Distribución por Usuario / Proyecto</h4>
                    <span id="stats-bar-summary" style="font-size:0.9rem; color:var(--text-secondary);"></span>
                </div>
                <canvas id="stats-bar" width="960" height="420" style="margin-top:12px; width:100%;"></canvas>
            </div>

            <div id="stats-area-section" style="margin-top:1.5rem; background:#1a1a1a; border:1px solid var(--border); border-radius:12px; padding:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <h4 style="margin:0; color:var(--text-primary);">Evolución de Horas Acumuladas</h4>
                    <span id="stats-area-summary" style="font-size:0.9rem; color:var(--text-secondary);"></span>
                </div>
                <canvas id="stats-area-canvas" width="960" height="420" style="margin-top:12px; width:100%;"></canvas>
            </div>
            
            <div id="stats-detailed-list" style="margin-top:1.5rem; background:#1a1a1a; border:1px solid var(--border); border-radius:12px; padding:1rem;">
                <!-- Detailed table will be rendered here -->
            </div>
            ` : `
            <div id="stats-area-section" style="margin-top:1.5rem; background:#1a1a1a; border:1px solid var(--border); border-radius:12px; padding:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <h4 style="margin:0; color:var(--text-primary);">Evolución de Horas Acumuladas</h4>
                    <span id="stats-area-summary" style="font-size:0.9rem; color:var(--text-secondary);"></span>
                </div>
                <canvas id="stats-area-canvas" width="960" height="420" style="margin-top:12px; width:100%;"></canvas>
            </div>
            `}
        </div>
    `;

    const userBtn = document.getElementById('stats-user-filter');
    if (userBtn) userBtn.onclick = openStatsUserFilter;
    const projBtn = document.getElementById('stats-project-filter');
    if (projBtn) projBtn.onclick = openStatsProjectFilter;

    initStatsFilters();
    await fetchActivityStats(true);
    animateEntry(viewId);
}

function initStatsFilters() {
    renderStatsMonths();
    setupStatsDayFilterTarget();
}

function statsPrevYear() {
    statsYear -= 1;
    statsDayRangeStart = null;
    statsDayRangeEnd = null;
    renderStatsMonths();
    fetchActivityStats(true);
}

function statsNextYear() {
    statsYear += 1;
    statsDayRangeStart = null;
    statsDayRangeEnd = null;
    renderStatsMonths();
    fetchActivityStats(true);
}

function statsSelectMonth(idx) {
    if (statsStartMonth !== null && statsEndMonth === null && statsStartMonth === idx) {
        statsStartMonth = null;
        statsEndMonth = null;
        statsDayRangeStart = null;
        statsDayRangeEnd = null;
    } else if (statsStartMonth === null || (statsStartMonth !== null && statsEndMonth !== null)) {
        statsStartMonth = idx;
        statsEndMonth = null;
        statsDayRangeStart = null;
        statsDayRangeEnd = null;
    } else {
        if (idx < statsStartMonth) {
            statsEndMonth = statsStartMonth;
            statsStartMonth = idx;
        } else {
            statsEndMonth = idx;
        }
        statsDayRangeStart = null;
        statsDayRangeEnd = null;
    }
    renderStatsMonths();
    fetchActivityStats(true);
}

function renderStatsMonths() {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const cont = document.getElementById('stats-months');
    const lbl = document.getElementById('stats-year-label');
    const rangeLbl = document.getElementById('stats-range-label');
    const filterBtn = document.getElementById('stats-day-filter');
    if (lbl) lbl.textContent = statsYear;
    if (cont) {
        cont.innerHTML = '';
        months.forEach((m, idx) => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.padding = '6px 8px';
            btn.style.borderColor = 'var(--border)';
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'var(--text-primary)';
            btn.textContent = m;
            let selected = false;
            if (statsStartMonth !== null && statsEndMonth === null && statsStartMonth === idx) selected = true;
            if (statsStartMonth !== null && statsEndMonth !== null && idx >= statsStartMonth && idx <= statsEndMonth) selected = true;
            if (selected) {
                btn.style.background = 'var(--bpb-blue)';
                btn.style.color = '#fff';
            }
            btn.onclick = () => statsSelectMonth(idx);
            btn.draggable = true;
            btn.addEventListener('dragstart', (ev) => {
                statsDragMonth = idx;
                if (ev.dataTransfer) {
                    ev.dataTransfer.setData('text/plain', String(idx));
                    ev.dataTransfer.effectAllowed = 'copy';
                }
                if (filterBtn) {
                    filterBtn.style.outline = '2px dashed var(--bpb-blue)';
                    filterBtn.style.outlineOffset = '2px';
                }
            });
            btn.addEventListener('dragend', () => {
                statsDragMonth = null;
                if (filterBtn) {
                    filterBtn.style.outline = '';
                    filterBtn.style.outlineOffset = '';
                    filterBtn.style.boxShadow = '';
                }
            });
            cont.appendChild(btn);
        });
    }
    if (rangeLbl) {
        if (statsDayRangeStart && statsDayRangeEnd) {
            const fmt = (iso) => {
                // Parse ISO date (YYYY-MM-DD) correctly without timezone issues
                const [year, month, day] = iso.split('-').map(Number);
                return `${String(day).padStart(2, '0')} ${months[month - 1]} ${year}`;
            };
            rangeLbl.textContent = (statsDayRangeStart === statsDayRangeEnd)
                ? fmt(statsDayRangeStart)
                : `${fmt(statsDayRangeStart)} - ${fmt(statsDayRangeEnd)}`;
        } else if (statsStartMonth === null) {
            rangeLbl.textContent = 'Todos los meses';
        } else if (statsEndMonth === null) {
            rangeLbl.textContent = `${months[statsStartMonth]} ${statsYear}`;
        } else {
            rangeLbl.textContent = `${months[statsStartMonth]} - ${months[statsEndMonth]} ${statsYear}`;
        }
    }
    if (filterBtn) {
        if (statsDayRangeStart && statsDayRangeEnd) {
            filterBtn.style.background = 'var(--bpb-blue)';
            filterBtn.style.color = '#fff';
            filterBtn.style.borderColor = 'var(--bpb-blue)';
        } else {
            filterBtn.style.background = '';
            filterBtn.style.color = '';
            filterBtn.style.borderColor = '';
        }
    }
}

function setupStatsDayFilterTarget() {
    const filterBtn = document.getElementById('stats-day-filter');
    if (!filterBtn) return;
    if (filterBtn.dataset.bound === '1') return;
    filterBtn.dataset.bound = '1';

    filterBtn.addEventListener('dragover', (ev) => {
        if (statsDragMonth === null && !ev.dataTransfer?.getData('text/plain')) return;
        ev.preventDefault();
        filterBtn.style.boxShadow = '0 0 0 2px rgba(65,131,196,0.6)';
    });

    filterBtn.addEventListener('dragleave', () => {
        filterBtn.style.boxShadow = '';
    });

    filterBtn.addEventListener('drop', (ev) => {
        ev.preventDefault();
        filterBtn.style.boxShadow = '';
        filterBtn.style.outline = '';
        filterBtn.style.outlineOffset = '';
        let idx = ev.dataTransfer ? parseInt(ev.dataTransfer.getData('text/plain'), 10) : NaN;
        if (Number.isNaN(idx)) idx = statsDragMonth;
        statsDragMonth = null;
        if (idx === null || Number.isNaN(idx)) return;
        openStatsDayPicker(idx);
    });

    filterBtn.addEventListener('click', () => {
        const fallback = (statsStartMonth !== null) ? statsStartMonth : new Date().getMonth();
        openStatsDayPicker(fallback);
    });
}

function openStatsDayPicker(monthIdx) {
    const parsed = parseInt(monthIdx, 10);
    if (Number.isNaN(parsed)) {
        showNotification('Arrastrá un mes hasta el filtro para elegir días.', 'info');
        return;
    }
    const safeMonth = Math.min(11, Math.max(0, parsed));

    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const existing = document.getElementById('stats-day-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'stats-day-modal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '4000';
    overlay.style.backdropFilter = 'blur(4px)';

    const box = document.createElement('div');
    box.style.background = '#1a1a1a';
    box.style.border = '1px solid var(--border)';
    box.style.borderRadius = '12px';
    box.style.padding = '20px';
    box.style.width = '400px';
    box.style.maxWidth = '92%';
    box.style.color = 'var(--text-primary)';
    box.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
    overlay.appendChild(box);

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '8px';

    const title = document.createElement('h3');
    title.style.margin = '0';
    title.style.color = '#d32f2f'; // Red color as requested
    title.textContent = 'Filtrar por días';
    header.appendChild(title);

    const monthLabel = document.createElement('span');
    monthLabel.style.color = 'var(--text-secondary)';
    monthLabel.style.fontSize = '0.9rem';
    monthLabel.style.marginRight = 'auto';
    monthLabel.style.marginLeft = '12px';
    monthLabel.textContent = `${months[safeMonth]} ${statsYear}`;
    header.appendChild(monthLabel);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.style.padding = '4px 12px';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    box.appendChild(header);

    const info = document.createElement('div');
    info.textContent = 'Seleccioná uno o dos días para definir el rango.';
    info.style.fontSize = '0.9rem';
    info.style.color = 'var(--text-secondary)';
    info.style.marginBottom = '10px';
    box.appendChild(info);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.gap = '6px';
    grid.style.marginBottom = '10px';
    box.appendChild(grid);

    let selectedStart = null;
    let selectedEnd = null;

    if (statsDayRangeStart && statsDayRangeEnd) {
        // Parse ISO dates correctly without timezone issues
        const [syear, smonth, sday] = statsDayRangeStart.split('-').map(Number);
        const [eyear, emonth, eday] = statsDayRangeEnd.split('-').map(Number);
        if (syear === statsYear && (smonth - 1) === safeMonth) {
            selectedStart = sday;
            selectedEnd = eday;
        }
    }

    const selectionLabel = document.createElement('div');
    selectionLabel.style.fontSize = '0.9rem';
    selectionLabel.style.color = 'var(--text-secondary)';
    selectionLabel.style.marginBottom = '8px';
    box.appendChild(selectionLabel);

    function renderDayGrid() {
        grid.innerHTML = '';
        const daysInMonth = new Date(statsYear, safeMonth + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = d;
            btn.style.padding = '6px 0';
            btn.style.fontWeight = '700';
            btn.style.borderColor = 'var(--border)';
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'var(--text-primary)';

            const inSingle = selectedStart === d && (selectedEnd === null || selectedEnd === selectedStart);
            const inRange = selectedStart !== null && selectedEnd !== null && d >= selectedStart && d <= selectedEnd;
            if (inRange || inSingle) {
                btn.style.background = 'var(--bpb-blue)';
                btn.style.color = '#fff';
                btn.style.borderColor = 'var(--bpb-blue)';
            }

            btn.onclick = () => {
                if (selectedStart === null || (selectedStart !== null && selectedEnd !== null)) {
                    selectedStart = d;
                    selectedEnd = null;
                } else {
                    if (d < selectedStart) {
                        selectedEnd = selectedStart;
                        selectedStart = d;
                    } else {
                        selectedEnd = d;
                    }
                }
                renderDayGrid();
                updateSelectionLabel();
            };

            grid.appendChild(btn);
        }
        updateSelectionLabel();
    }

    function updateSelectionLabel() {
        if (selectedStart === null) {
            selectionLabel.textContent = 'Sin selección de día.';
        } else if (selectedEnd === null) {
            selectionLabel.textContent = `Día seleccionado: ${String(selectedStart).padStart(2, '0')}/${String(safeMonth + 1).padStart(2, '0')}/${statsYear}`;
        } else {
            selectionLabel.textContent = `Rango: ${String(selectedStart).padStart(2, '0')} al ${String(selectedEnd).padStart(2, '0')} de ${months[safeMonth]} ${statsYear}`;
        }
    }

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '10px';
    actions.style.marginTop = '16px';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn';
    clearBtn.style.padding = '8px 16px';
    clearBtn.textContent = 'Limpiar Todo';
    clearBtn.onclick = () => {
        statsDayRangeStart = null;
        statsDayRangeEnd = null;
        statsStartMonth = safeMonth;
        statsEndMonth = safeMonth;
        renderStatsMonths();
        fetchActivityStats(true);
        overlay.remove();
    };
    actions.appendChild(clearBtn);

    const apply = document.createElement('button');
    apply.className = 'btn';
    apply.textContent = 'Aplicar Filtro';
    apply.style.background = '#d32f2f'; // Red color
    apply.style.color = '#fff';
    apply.style.borderColor = '#d32f2f'; // Red color
    apply.style.padding = '8px 16px';
    apply.onclick = () => {
        if (selectedStart === null) {
            showNotification('Seleccioná al menos un día.', 'warning');
            return;
        }
        const startDay = selectedStart;
        const endDay = selectedEnd || selectedStart;
        const startDate = new Date(statsYear, safeMonth, startDay).toISOString().slice(0, 10);
        const endDate = new Date(statsYear, safeMonth, endDay).toISOString().slice(0, 10);
        statsDayRangeStart = startDate;
        statsDayRangeEnd = endDate;
        statsStartMonth = safeMonth;
        statsEndMonth = safeMonth;
        renderStatsMonths();
        fetchActivityStats(true);
        overlay.remove();
    };
    actions.appendChild(apply);

    // Critical fix: Append actions to the box so they are visible
    box.appendChild(actions);

    overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
    renderDayGrid();
}

async function fetchActivityStats(forceRefresh = false) {
    let start = '';
    let end = '';
    if (statsDayRangeStart && statsDayRangeEnd) {
        start = statsDayRangeStart;
        end = statsDayRangeEnd;
    } else if (statsStartMonth === null && statsEndMonth === null) {
        // DEFAULT: Full Year if no specific month/day filter is active
        start = new Date(statsYear, 0, 1).toISOString().slice(0, 10);
        end = new Date(statsYear, 11, 31).toISOString().slice(0, 10);
    } else if (statsStartMonth !== null && statsEndMonth === null) {
        const d0 = new Date(statsYear, statsStartMonth, 1);
        const d1 = new Date(statsYear, statsStartMonth + 1, 0);
        start = d0.toISOString().slice(0, 10);
        end = d1.toISOString().slice(0, 10);
    } else if (statsStartMonth !== null && statsEndMonth !== null) {
        const d0 = new Date(statsYear, statsStartMonth, 1);
        const d1 = new Date(statsYear, statsEndMonth + 1, 0);
        start = d0.toISOString().slice(0, 10);
        end = d1.toISOString().slice(0, 10);
    }
    let url = statsConfig.fetchUrl || '/api/activity-stats';
    const params = [];
    if (start) params.push(`start_date=${encodeURIComponent(start)}`);
    if (end) params.push(`end_date=${encodeURIComponent(end)}`);
    if (params.length > 0) url += '?' + params.join('&');

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'success') {
            const incomingRecords = data.records || (data.data ? data.data.map(r => ({
                project: r.project,
                hours: r.hours,
                user: r.user || 'Actual',
                date: r.date || '',
                time: r.time || '',
                token: r.token || '',
                description: r.description || ''
            })) : []);
            statsRecords = incomingRecords;
            statsAvailableUsers = [...new Set((incomingRecords || []).map(r => (r.user || 'Desconocido')))].sort();
            statsAvailableProjects = [...new Set((incomingRecords || []).map(r => (r.project || 'Sin Proyecto')))].sort();
            const availUsersLower = statsAvailableUsers.map(u => u.toLowerCase());
            const availProjectsLower = statsAvailableProjects.map(p => p.toLowerCase());
            statsSelectedUsers = statsSelectedUsers.filter(u => availUsersLower.includes(u));
            statsSelectedProjects = statsSelectedProjects.filter(p => availProjectsLower.includes(p));
            renderActivityStats();
        } else {
            showNotification(data.message || 'Error obteniendo estad?sticas', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error de conexi?n al obtener estad?sticas', 'error');
    }
}

function getFilteredStatsRecords() {
    const userSet = new Set(statsSelectedUsers);
    const projectSet = new Set(statsSelectedProjects);
    const filtered = (statsRecords || []).filter(r => {
        const userVal = (r.user || 'Desconocido').toLowerCase();
        const projVal = (r.project || 'Sin Proyecto').toLowerCase();
        if (userSet.size && !userSet.has(userVal)) return false;
        if (projectSet.size && !projectSet.has(projVal)) return false;
        return true;
    });

    // Sort descending by date (Most recent first) + robustness
    return filtered.sort((a, b) => {
        // Handle potential formats: YYYY-MM-DD or DD/MM/YYYY
        // Normalize to YYYY-MM-DD for comparison
        const parseDate = (dStr) => {
            if (!dStr) return '0000-00-00';
            if (dStr.includes('/')) return dStr.split('/').reverse().join('-');
            return dStr; // Assume already YYYY-MM-DD or standard
        };
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);

        // Primary Sort: Date Desc
        const cmp = dateB.localeCompare(dateA);
        if (cmp !== 0) return cmp;

        // Secondary Sort: Time Desc (if available)
        return (b.time || '').localeCompare(a.time || '');
    });
}

function aggregateRecords(records) {
    const totals = {};
    records.forEach(r => {
        const proj = r.project || 'Sin Proyecto';
        const hrs = Number(r.hours) || 0;
        totals[proj] = (totals[proj] || 0) + hrs;
    });
    const rows = Object.entries(totals).map(([project, hours]) => ({ project, hours: Math.round(hours * 100) / 100 }));
    rows.sort((a, b) => b.hours - a.hours);
    const total = rows.reduce((acc, r) => acc + (Number(r.hours) || 0), 0);
    const colors = ['#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c', '#2ecc71', '#95a5a6', '#16a085', '#d35400', '#c0392b', '#8e44ad'];
    const colorMap = {};
    rows.forEach((r, idx) => { colorMap[r.project] = colors[idx % colors.length]; });
    return { rows, total, colorMap };
}

function updateStatsSummaryLabels() {
    const usersLbl = document.getElementById('stats-users-label');
    const projLbl = document.getElementById('stats-projects-label');
    const summary = document.getElementById('stats-bar-summary');
    const summaryArea = document.getElementById('stats-area-summary');
    const userFilterBtn = document.getElementById('stats-user-filter');
    const projectFilterBtn = document.getElementById('stats-project-filter');

    const userText = statsSelectedUsers.length ? `Usuarios: ${statsSelectedUsers.length}` : 'Todos los usuarios';
    const projText = statsSelectedProjects.length ? `Proyectos: ${statsSelectedProjects.length}` : 'Todos los proyectos';
    if (usersLbl) usersLbl.textContent = userText;
    if (projLbl) projLbl.textContent = projText;
    if (summary) summary.textContent = `${userText} • ${projText}`;
    if (summaryArea) summaryArea.textContent = `${userText} • ${projText}`;

    // Update user filter button style (red when active)
    if (userFilterBtn) {
        if (statsSelectedUsers.length > 0) {
            userFilterBtn.style.background = 'var(--bpb-blue)';
            userFilterBtn.style.color = '#fff';
            userFilterBtn.style.borderColor = 'var(--bpb-blue)';
        } else {
            userFilterBtn.style.background = '';
            userFilterBtn.style.color = '';
            userFilterBtn.style.borderColor = '';
        }
    }

    // Update project filter button style (red when active)
    if (projectFilterBtn) {
        if (statsSelectedProjects.length > 0) {
            projectFilterBtn.style.background = 'var(--bpb-blue)';
            projectFilterBtn.style.color = '#fff';
            projectFilterBtn.style.borderColor = 'var(--bpb-blue)';
        } else {
            projectFilterBtn.style.background = '';
            projectFilterBtn.style.color = '';
            projectFilterBtn.style.borderColor = '';
        }
    }
}

function openStatsUserFilter() {
    const users = statsAvailableUsers || [];
    const tempSelected = new Set(statsSelectedUsers);
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.zIndex = '4000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.backdropFilter = 'blur(4px)';

    const box = document.createElement('div');
    box.style.background = '#1a1a1a';
    box.style.border = '1px solid var(--border)';
    box.style.borderRadius = '12px';
    box.style.padding = '20px';
    box.style.width = '500px';
    box.style.maxHeight = '70vh';
    box.style.overflowY = 'auto';
    box.style.color = 'var(--text-primary)';
    box.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '16px';
    header.innerHTML = '<h3 style="margin:0; color:var(--bpb-blue);">Filtrar por Usuario</h3>';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.style.padding = '4px 12px';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    box.appendChild(header);

    const grid = document.createElement('div');
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.gap = '8px';
    grid.style.marginBottom = '16px';

    users.forEach(u => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.padding = '10px 16px';
        btn.style.textAlign = 'left';
        btn.style.fontSize = '0.95rem';
        btn.style.width = '100%';
        btn.style.color = 'white';
        btn.textContent = u;

        const val = u.toLowerCase();
        const isSelected = tempSelected.has(val);

        if (isSelected) {
            btn.style.background = 'var(--bpb-blue)';
            btn.style.color = '#fff';
            btn.style.borderColor = 'var(--bpb-blue)';
        }

        btn.onclick = () => {
            if (tempSelected.has(val)) {
                tempSelected.delete(val);
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            } else {
                tempSelected.add(val);
                btn.style.background = 'var(--bpb-blue)';
                btn.style.color = '#fff';
                btn.style.borderColor = 'var(--bpb-blue)';
            }
        };

        grid.appendChild(btn);
    });
    box.appendChild(grid);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '10px';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn';
    clearBtn.style.padding = '8px 16px';
    clearBtn.textContent = 'Limpiar Todo';
    clearBtn.onclick = () => {
        statsSelectedUsers = [];
        updateStatsSummaryLabels();
        renderActivityStats();
        overlay.remove();
    };
    actions.appendChild(clearBtn);

    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn';
    applyBtn.style.background = 'var(--bpb-blue)';
    applyBtn.style.color = '#fff';
    applyBtn.style.borderColor = 'var(--bpb-blue)';
    applyBtn.style.padding = '8px 16px';
    applyBtn.textContent = 'Aplicar Filtro';
    applyBtn.onclick = () => {
        statsSelectedUsers = Array.from(tempSelected);
        updateStatsSummaryLabels();
        renderActivityStats();
        overlay.remove();
    };
    actions.appendChild(applyBtn);

    box.appendChild(actions);
    overlay.appendChild(box);
    overlay.onclick = (ev) => { if (ev.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
}

function openStatsProjectFilter() {
    const projects = statsAvailableProjects || [];
    const tempSelected = new Set(statsSelectedProjects);
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.zIndex = '4000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.backdropFilter = 'blur(4px)';

    const box = document.createElement('div');
    box.style.background = '#1a1a1a';
    box.style.border = '1px solid var(--border)';
    box.style.borderRadius = '12px';
    box.style.padding = '20px';
    box.style.width = '500px';
    box.style.maxHeight = '70vh';
    box.style.overflowY = 'auto';
    box.style.color = 'var(--text-primary)';
    box.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '16px';
    header.innerHTML = '<h3 style="margin:0; color:var(--bpb-blue);">Filtrar por Proyecto</h3>';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.style.padding = '4px 12px';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    box.appendChild(header);

    // Subtitle explaining multi-select
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Seleccioná uno o varios proyectos para filtrar.';
    subtitle.style.margin = '0 0 16px 0';
    subtitle.style.color = 'var(--text-secondary)';
    subtitle.style.fontSize = '0.9rem';
    box.appendChild(subtitle);

    const grid = document.createElement('div');
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.gap = '8px';
    grid.style.marginBottom = '16px';

    projects.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.padding = '10px 16px';
        btn.style.textAlign = 'left';
        btn.style.fontSize = '0.95rem';
        btn.style.width = '100%';
        btn.style.color = 'white';
        btn.textContent = p;

        const val = p.toLowerCase();
        const isSelected = tempSelected.has(val);

        if (isSelected) {
            btn.style.background = 'var(--bpb-blue)';
            btn.style.color = '#fff';
            btn.style.borderColor = 'var(--bpb-blue)';
        }

        btn.onclick = () => {
            if (tempSelected.has(val)) {
                tempSelected.delete(val);
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            } else {
                tempSelected.add(val);
                btn.style.background = 'var(--bpb-blue)';
                btn.style.color = '#fff';
                btn.style.borderColor = 'var(--bpb-blue)';
            }
        };

        grid.appendChild(btn);
    });
    box.appendChild(grid);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '10px';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn';
    clearBtn.style.padding = '8px 16px';
    clearBtn.textContent = 'Limpiar Todo';
    clearBtn.onclick = () => {
        statsSelectedProjects = [];
        updateStatsSummaryLabels();
        renderActivityStats();
        overlay.remove();
    };
    actions.appendChild(clearBtn);

    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn';
    applyBtn.style.background = 'var(--bpb-blue)';
    applyBtn.style.color = '#fff';
    applyBtn.style.borderColor = 'var(--bpb-blue)';
    applyBtn.style.padding = '8px 16px';
    applyBtn.textContent = 'Aplicar Filtro';
    applyBtn.onclick = () => {
        statsSelectedProjects = Array.from(tempSelected);
        updateStatsSummaryLabels();
        renderActivityStats();
        overlay.remove();
    };
    actions.appendChild(applyBtn);

    box.appendChild(actions);
    overlay.appendChild(box);
    overlay.onclick = (ev) => { if (ev.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
}

function renderActivityStats() {
    const records = getFilteredStatsRecords();
    const { rows, total, colorMap } = aggregateRecords(records);

    updateStatsSummaryLabels();

    // Tabla
    const tbody = document.querySelector('#stats-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            const tdP = document.createElement('td');
            const colorDot = document.createElement('span');
            colorDot.style.display = 'inline-block';
            colorDot.style.width = '10px';
            colorDot.style.height = '10px';
            colorDot.style.borderRadius = '50%';
            colorDot.style.marginRight = '8px';
            colorDot.style.background = colorMap[r.project] || '#ccc';
            tdP.appendChild(colorDot);
            tdP.appendChild(document.createTextNode(r.project));
            tdP.style.padding = '10px';
            const tdH = document.createElement('td');
            tdH.textContent = r.hours;
            tdH.style.textAlign = 'right';
            tdH.style.padding = '10px';
            // Columna de porcentaje
            const tdPct = document.createElement('td');
            const percentage = total > 0 ? ((r.hours / total) * 100).toFixed(1) : 0;
            tdPct.textContent = percentage + '%';
            tdPct.style.textAlign = 'right';
            tdPct.style.padding = '10px';
            tr.appendChild(tdP);
            tr.appendChild(tdH);
            tr.appendChild(tdPct);
            tr.onmouseover = () => highlightPieSlice(r.project);
            tr.onmouseout = () => highlightPieSlice(null);
            tbody.appendChild(tr);
        });
        const trTotal = document.createElement('tr');
        trTotal.innerHTML = `<td style="padding:10px; font-weight:700;">Total</td><td style="padding:10px; text-align:right; font-weight:700;">${Math.round(total * 100) / 100}</td><td style="padding:10px; text-align:right; font-weight:700;">100%</td>`;
        tbody.appendChild(trTotal);
    }

    // Pie
    const canvas = document.getElementById('stats-pie');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!rows.length) {
        window._statsSlices = [];
        window._statsData = [];
        hideStatsTooltip();
        ctx.fillStyle = '#777';
        ctx.font = '14px sans-serif';
        ctx.fillText('Sin datos', canvas.width / 2 - 30, canvas.height / 2);
        renderStatsBar([], colorMap);
        return;
    }

    let startAngle = -Math.PI / 2;
    const slices = [];
    rows.forEach((r, idx) => {
        const slice = total > 0 ? (r.hours / total) * Math.PI * 2 : 0;
        slices.push({ project: r.project, start: startAngle, end: startAngle + slice });
        startAngle += slice;
    });

    window._statsSlices = slices;
    window._statsColorMap = colorMap;
    window._statsData = rows;
    window._highlightProject = null;

    slices.forEach((s) => {
        const radius = Math.min(canvas.width, canvas.height) / 2 - 10;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, s.start, s.end);
        ctx.closePath();
        ctx.fillStyle = colorMap[s.project] || '#3498db';
        ctx.fill();
    });
    attachStatsPieHover(canvas);

    if (typeof renderStatsBar === 'function' && window.statsConfig && window.statsConfig.fetchUrl === '/api/activity-stats-global') {
        renderStatsBar(records, colorMap);
    }

    // Render Stacked Area Chart (For Both Admin & Personal if container exists)
    const areaCnv = document.getElementById('stats-area-canvas');
    if (areaCnv) {
        // Resize to match display size to fix mouse coordinate mismatch
        const rect = areaCnv.getBoundingClientRect();
        areaCnv.width = rect.width;
        areaCnv.height = rect.height;

        const aCtx = areaCnv.getContext('2d');

        // Use original width/height from HTML attributes or computed style
        drawStatsAreaCanvas(aCtx, areaCnv.width, areaCnv.height, records, colorMap, {
            textColor: '#cfd2d6',
            axisColor: 'rgba(255,255,255,0.08)',
            valFont: '12px "Manrope", sans-serif'
        });
    }

    renderDetailedStatsTable(records, colorMap);
}

function renderDetailedStatsTable(records, colorMap) {
    const container = document.getElementById('stats-detailed-list');
    if (!container) return; // Only exists in admin view

    if (!records || records.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:1rem;">No hay registros para mostrar con los filtros actuales.</p>';
        return;
    }

    let html = `
    <h4 style="margin-top:0; color:var(--text-primary); margin-bottom:1rem;">Detalle de Actividades (${records.length})</h4>
    <div style="max-height:600px; overflow-y:auto; border:1px solid var(--border); border-radius:8px;">
        <table class="data-table" style="width:100%; border-collapse:separate; border-spacing:0;">
            <thead style="position:sticky; top:0; background:var(--card-bg); z-index:1;">
                <tr>
                    <th style="text-align:center; padding:16px;">Fecha</th>
                    <th style="text-align:center; padding:16px;">Usuario</th>
                    <th style="text-align:center; padding:16px;">Token</th>
                    <th style="text-align:center; padding:16px;">Proyecto</th>
                    <th style="text-align:center; padding:16px;">Tiempo</th>
                    <th style="text-align:left; padding:16px; width:40%;">Descripción</th>
                </tr>
            </thead>
            <tbody>
    `;

    records.forEach(r => {
        const color = (colorMap && colorMap[r.project]) ? colorMap[r.project] : '#ccc';
        const projectChip = `<span style="color: ${color}; border: 1px solid ${color}; background-color: ${color}33; padding: 6px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-block; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.05em;">${r.project || 'Sin Proyecto'}</span>`;

        html += `
            <tr>
                <td style="padding:16px; border-bottom:1px solid var(--border-light); font-size:0.9rem; text-align:center;">${r.date || '-'}</td>
                <td style="padding:16px; border-bottom:1px solid var(--border-light); font-size:0.9rem; text-align:center;">${r.user || '-'}</td>
                <td style="padding:16px; border-bottom:1px solid var(--border-light); font-family:monospace; font-size:0.85rem; color:var(--text-secondary); text-align:center;">${r.token || '-'}</td>
                <td style="padding:16px; border-bottom:1px solid var(--border-light); text-align:center;">${projectChip}</td>
                <td style="padding:16px; border-bottom:1px solid var(--border-light); font-size:0.9rem; text-align:center;">${r.hours} h</td>
                <td style="padding:16px; border-bottom:1px solid var(--border-light); font-size:0.9rem; white-space:normal; line-height:1.5;">${r.description || ''}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    </div>
    `;

    container.innerHTML = html;
}

function printActivityStats() {
    // 1. Capture Charts
    const barCanvas = document.getElementById('stats-bar');
    const pieCanvas = document.getElementById('stats-pie');

    // Get data (Hoisted for availability across all charts)
    const state = window._statsBarState || {};
    const records = state.records || getFilteredStatsRecords();
    const colorMap = state.colorMap || (window._statsBarState && window._statsBarState.colorMap) || {};

    let pieImg = '';
    if (pieCanvas) pieImg = pieCanvas.toDataURL('image/png');

    // Determine shared dimensions for consistency (MATCH ON-SCREEN BAR CHART)
    let printWidth = 1000;
    let printHeight = 400;
    if (barCanvas) {
        const rect = barCanvas.getBoundingClientRect();
        if (rect.width > 0) {
            printWidth = rect.width;
            printHeight = rect.height;
        }
    }

    // Generate Print-Optimized Bar Chart
    let barImg = '';
    if (barCanvas) {
        // Create off-screen canvas
        const printCanvas = document.createElement('canvas');
        const scale = 2; // Higher quality for print
        printCanvas.width = printWidth * scale;
        printCanvas.height = printHeight * scale;

        const pCtx = printCanvas.getContext('2d');
        pCtx.scale(scale, scale);

        // Data already retrieved above

        // Draw with Print Styles
        drawStatsBarCanvas(pCtx, printWidth, printHeight, records, colorMap, null, {
            textColor: '#000000',
            axisColor: '#666666',
            labelFont: 'bold 13px "Segoe UI", sans-serif',
            valFont: 'bold 12px "Segoe UI", sans-serif',
            headerFont: 'bold 13px "Segoe UI", sans-serif',
            headerColor: '#000000',
            collectRects: false
        });

        barImg = printCanvas.toDataURL('image/png');
    }

    // Generate Print-Optimized Area Chart (Matching Bar Chart Dimensions/Quality)
    let areaImg = '';
    const areaPrintCanvas = document.createElement('canvas');
    const aScale = 2;

    areaPrintCanvas.width = printWidth * aScale;
    areaPrintCanvas.height = printHeight * aScale;
    const aCtx = areaPrintCanvas.getContext('2d');
    aCtx.scale(aScale, aScale);

    drawStatsAreaCanvas(aCtx, printWidth, printHeight, records, colorMap, {
        textColor: '#000000',
        axisColor: '#666666',
        labelFont: 'bold 13px "Segoe UI", sans-serif',
        valFont: 'bold 12px "Segoe UI", sans-serif',
        headerFont: 'bold 13px "Segoe UI", sans-serif',
        headerColor: '#000000'
    });
    areaImg = areaPrintCanvas.toDataURL('image/png');

    // 2. Capture Data for Table
    // records and colorMap are already defined above
    const rangeLabel = document.getElementById('stats-range-label') ? document.getElementById('stats-range-label').textContent : '';

    // Calculate Summary
    const projMap = {};
    records.forEach(r => {
        const p = r.project || 'Sin Proyecto';
        const h = Number(r.hours) || 0;
        projMap[p] = (projMap[p] || 0) + h;
    });
    const summaryRows = Object.entries(projMap)
        .map(([p, h]) => ({ p, h }))
        .sort((a, b) => b.h - a.h);
    const totalHours = summaryRows.reduce((sum, item) => sum + item.h, 0);

    // 3. Build Print HTML
    let printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('Permita ventanas emergentes para imprimir', 'error');
        return;
    }

    const today = new Date().toLocaleDateString();

    // STYLES
    // Note: We use fixed header/footer. 'break-inside: avoid' for cards.
    // Iteration 6: @page margin 0 to hide browser headers. Padding used for spacing.
    // Fonts increased by ~2px.
    const styles = `
        <style>
            @media print {
                @page { margin: 0; size: A4; }
                
                body { 
                    margin: 0; 
                    padding: 0; 
                    font-family: sans-serif; 
                    -webkit-print-color-adjust: exact; 
                }
                
                .page-container { 
                    position: relative;
                    width: 100%; 
                    box-sizing: border-box; 
                    padding-top: 160px;
                    padding-bottom: 140px;
                    padding-left: 1.5cm;
                    padding-right: 1.5cm;
                    page-break-after: always;
                    display: block;
                }
                .page-container:last-of-type { page-break-after: auto; }
                
                .content-wrapper { border: 1px solid #333; padding: 15px; border-radius: 8px; box-sizing: border-box; }
                
                /* Fixed Header */
                .header { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    right: 0; 
                    height: 120px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    border-bottom: 2px solid #cf1625; 
                    padding: 0 1.5cm;
                    background: white; 
                    z-index: 1000; 
                    box-sizing: border-box; 
                }
                
                /* Fixed Footer */
                .footer { 
                    position: fixed; 
                    bottom: 0; 
                    left: 0; 
                    right: 0; 
                    height: 100px; 
                    border-top: 2px solid #cf1625; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 0 1.5cm;
                    background: white; 
                    z-index: 2000; 
                    box-sizing: border-box; 
                }
                

            }
            body { margin: 0; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: white; color: #333; }
            
            /* Header fixed top - Repeats on every page automatically */
            .header { position: fixed; top: 0; left: 0; right: 0; height: 120px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cf1625; padding: 0 1.5cm; background: white; z-index: 1000; box-sizing: border-box; }
            
            .content-wrapper { border: 1px solid #333; padding: 15px; border-radius: 8px; box-sizing: border-box; }
            .card { border: 1px solid #ccc; border-radius: 8px; padding: 10px; margin-bottom: 20px; background: white; page-break-inside: avoid; }
            .card-title { font-size: 16px; font-weight: bold; color: #555; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            
            table { width: 100%; border-collapse: collapse; font-size: 15px; }
            thead { display: table-header-group; }
            th { text-align: left; padding: 8px; border-bottom: 1px solid #333; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            tr { page-break-inside: avoid; }
            .text-right { text-align: right; }
            .center { text-align: center; }
            .project-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
        </style>
    `;

    // HEADER (Fixed)
    const headerHtml = `
        <div class="header">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="/static/assets/iso_red.png" style="height:80px;">
                <div>
                    <h1 style="margin:0; font-size:26px; color:#333;">Reporte de Actividad</h1>
                    <div style="font-size:16px; color:#666;">Oficina Técnica - BPB</div>
                </div>
            </div>
            <div style="text-align:right; font-size:14px; color:#666;">
                <div>Generado: ${today}</div>
                <div>Período: ${rangeLabel}</div>
            </div>
        </div>
    `;

    // Fixed footer without page number
    const fixedFooterHtml = `
        <div class="footer">
            <div style="flex:1; text-align:left; font-size:18px; color:#cf1625; font-weight:bold;">OFICINA TÉCNICA</div>
            <div style="flex:1; text-align:center;">
                <img src="/static/assets/Oficina_Tecnica_v3.png" style="height:70px; opacity:0.8;">
            </div>
            <div style="flex:1;"></div>
        </div>
    `;


    // Actually, we don't need getFooterHtml anymore if we hardcode the overlay divs.
    // But let's keep it empty or remove usage to avoid errors if referenced.
    // In my previous code I removed usage of getFooterHtml in body assembly?
    // Let's check body assembly replacement. 
    // Ah, I used 'getFooterHtml(1)' in the PREVIOUS steps.
    // In the NEW body assembly (which I will fix/verify next), I am using hardcoded <div class="page-num-overlay">.
    // So getFooterHtml is functionally obsolete but I'll define it to be safe or just minimal.

    // Step 1: CSS and Header/Footer Helpers (Done above in ReplacementContent)
    // Step 2: logic for bodyHtml.

    // Wait, I need to make sure I don't delete the logic for `summaryHtml` etc.
    // I will use a targeted replacement for the CSS block first?
    // No, I need `getFooterHtml`.

    // Let's do it in 2 steps for safety? No, one coherent edit is better.

    // The previous code had:
    // const footerHtml = ...
    // const summaryHtml = ...

    // I will provide the CSS and `headerHtml` / `getFooterHtml` definitions.
    // I will need to verify the code flow for `summaryHtml`.

    // Let's look at lines 4280+ in the file.
    // It generates `summaryHtml`.

    // I will replace lines 4230 to 4278 (CSS + Header + Footer defs).
    // And then I will replace the final assembly lines 4440+.

    // Replacement 1: CSS and Definitions.


    // SUMMARY TABLE (Right Top)
    let summaryRowsHtml = summaryRows.map(row => {
        const color = colorMap[row.p] || '#ccc';
        const percentage = totalHours > 0 ? ((row.h / totalHours) * 100).toFixed(1) : 0;
        return `
            <tr>
                <td style="padding:6px;">
                    <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${color}; margin-right:8px;"></span>
                    ${row.p}
                </td>
                <td class="text-right">${Math.round(row.h * 100) / 100}</td>
                <td class="text-right">${percentage}%</td>
            </tr>
        `;
    }).join('');

    summaryRowsHtml += `
        <tr style="font-weight:bold; border-top:2px solid #333;">
            <td style="padding:6px;">Total</td>
            <td class="text-right">${Math.round(totalHours * 100) / 100}</td>
            <td class="text-right">100%</td>
        </tr>
    `;
    // DETAILED TABLE -  Manual Pagination to prevent overflow
    // Split records into pages with conservative row count
    const ROWS_PER_PAGE = 12; // Balanced between space and page count

    // Force Robust Sort for Print (most recent first)
    const parseDateToTs = (dStr) => {
        if (!dStr) return 0;
        let parts;
        if (dStr.includes('/')) {
            // DD/MM/YYYY
            parts = dStr.split('/');
            // Month is 0-indexed in JS Date
            return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
        } else if (dStr.includes('-')) {
            // YYYY-MM-DD
            parts = dStr.split('-');
            return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        }
        return 0;
    };

    let filteredForPrint = [];
    if (records && records.length > 0) {
        records.sort((a, b) => {
            const tsA = parseDateToTs(a.date);
            const tsB = parseDateToTs(b.date);
            return tsB - tsA; // Descending
        });

        // --- NEW REQUIREMENT: Limit detailed table to last 5 active days ---
        const uniqueDates = [...new Set(records.map(r => r.date))];
        // uniqueDates is sorted descending because 'records' is sorted descending
        // Take top 5
        const top5Dates = uniqueDates.slice(0, 5);

        // Filter records to only show those in top 5 dates
        filteredForPrint = records.filter(r => top5Dates.includes(r.date));
    }

    // Use filteredForPrint for pagination
    const totalRecords = filteredForPrint.length;
    const totalTablePages = Math.ceil(totalRecords / ROWS_PER_PAGE);

    let page2PlusHTML = '';

    for (let pageIndex = 0; pageIndex < totalTablePages; pageIndex++) {
        const startIdx = pageIndex * ROWS_PER_PAGE;
        const endIdx = Math.min(startIdx + ROWS_PER_PAGE, totalRecords);
        const pageRecords = filteredForPrint.slice(startIdx, endIdx);

        // Generate rows for this specific page
        const pageRows = pageRecords.map(r => {
            const color = colorMap[r.project] || '#ccc';
            return `
                <tr>
                    <td style="text-align: center; padding: 8px; border-bottom: 1px solid #eee;">${r.date}</td>
                    <td style="text-align: center; padding: 8px; border-bottom: 1px solid #eee;">${r.user}</td>
                    <td style="text-align: center; padding: 8px; border-bottom: 1px solid #eee; font-family:monospace;">${r.token}</td>
                    <td style="text-align: center; padding: 8px; border-bottom: 1px solid #eee;">
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; border:1px solid ${color}; color:${color};">${r.project}</span>
                    </td>
                    <td style="text-align: center; padding: 8px; border-bottom: 1px solid #eee;">${r.hours}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.description || '-'}</td>
                </tr>
            `;
        }).join('');

        const pageNumber = pageIndex + 3; // Start from page 3 (Page 1: Pie/Summary, Page 2: Bar)
        const pageTitle = totalTablePages > 1 ? `Detalle de Registros (${pageIndex + 1}/${totalTablePages})` : 'Detalle de Registros';

        page2PlusHTML += `
        <!-- Page ${pageNumber} -->
        <div class="page-container">
            <h2 style="font-size: 18px; font-weight: bold; color: #555; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333;">${pageTitle}</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <thead>
                    <tr>
                        <th style="text-align: center; padding: 8px; border-bottom: 2px solid #333; background: #f5f5f5; font-weight: bold;">FECHA</th>
                        <th style="text-align: center; padding: 8px; border-bottom: 2px solid #333; background: #f5f5f5; font-weight: bold;">USUARIO</th>
                        <th style="text-align: center; padding: 8px; border-bottom: 2px solid #333; background: #f5f5f5; font-weight: bold;">TOKEN</th>
                        <th style="text-align: center; padding: 8px; border-bottom: 2px solid #333; background: #f5f5f5; font-weight: bold;">PROYECTO</th>
                        <th style="text-align: center; padding: 8px; border-bottom: 2px solid #333; background: #f5f5f5; font-weight: bold;">HORAS</th>
                        <th style="text-align: center; padding: 8px; border-bottom: 2px solid #333; background: #f5f5f5; font-weight: bold;">DESCRIPCIÓN</th>
                    </tr>
                </thead>
                <tbody>${pageRows}</tbody>
            </table>
        </div>
        `;
    }

    // PAGE 1 CONTENT: Pie Chart (Left) + Summary Table (Right)
    const page1ContentInner = `
        <div class="content-wrapper">
             <div style="display:grid; grid-template-columns: 380px 1fr; gap:20px; min-height: 280px; align-items: stretch;">
                <!-- Pie Chart (Left) -->
                <div class="card" style="display:flex; flex-direction:column; height: auto; margin:0; box-sizing: border-box;">
                    <div class="card-title">Registro de Actividad</div>
                    <div style="flex:1; display:flex; align-items:center; justify-content:center; overflow: hidden; padding: 5px;">
                        ${pieImg ? `<img src="${pieImg}" style="max-height:100%; max-width:100%; object-fit: contain;">` : '<p>Sin datos</p>'}
                    </div>
                </div>
                
                <!-- Summary Table (Right) -->
                 <div class="card" style="width:100%; margin-bottom: 0; box-sizing: border-box; height: auto;">
                    <div class="card-title">Detalle</div>
                    <table style="width:100%; table-layout:fixed;">
                        <thead>
                            <tr>
                                <th style="width: 50%;">PROYECTO</th>
                                <th class="text-right" style="width: 25%;">HORAS</th>
                                <th class="text-right" style="width: 25%;">%</th>
                            </tr>
                        </thead>
                        <tbody>${summaryRowsHtml}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // PAGE 2 CONTENT: Bar Chart + Stacked Area Chart
    const page2Content = `
        <div class="page-container">
             <div class="content-wrapper">
                <!-- Bar Chart -->
                <div class="card no-break" style="margin-bottom:20px; box-sizing: border-box;">
                    <div class="card-title">Distribución por Usuario / Proyecto</div>
                     <div style="text-align:right; font-size:10px; color:#888; margin-bottom:5px;">Todos los usuarios • Todos los proyectos</div>
                     <div style="text-align:center;">
                        ${barImg ? `<img src="${barImg}" style="width:100%; height:auto;">` : '<p>Sin datos</p>'}
                     </div>
                </div>

                <!-- Stacked Area Chart -->
                <div class="card no-break" style="margin-bottom:0; box-sizing: border-box;">
                    <div class="card-title">Evolución de Horas Acumuladas</div>
                     <div style="text-align:right; font-size:10px; color:#888; margin-bottom:5px;">Crecimiento acumulado por proyecto</div>
                     <div style="text-align:center;">
                        ${areaImg ? `<img src="${areaImg}" style="width:100%; height:auto;">` : '<p>Sin datos</p>'}
                     </div>
                </div>
            </div>
        </div>
    `;


    const doc = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reporte de Actividad</title>
        ${styles}
    </head>
    <body>
        <!-- Fixed Header -->
        ${headerHtml}
        
        ${fixedFooterHtml}
        
        <!-- Page 1 -->
        <div class="page-container">
            ${page1ContentInner}
        </div>

        <!-- Page 2 -->
        ${page2Content}

        <!-- Pages 3+ (Detail Table) -->
        ${page2PlusHTML}
    </body>
    </html>
    `;

    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}


function renderStatsBar(records, colorMap, highlightKey = null) {
    const canvas = document.getElementById('stats-bar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // High-DPI canvas scaling for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    // Restore state for interactivity
    window._statsBarState = { records, colorMap, highlightKey };
    window._statsBarRects = [];

    const styleOptions = {
        textColor: '#cfd2d6',
        fontBase: '12px "Manrope", sans-serif',
        fontBold: 'bold 13px "Manrope", sans-serif',
        axisColor: 'rgba(255,255,255,0.08)',
        xLabelsCenter: true,
        collectRects: true // Enable rect collection for hover
    };

    // Revert to original web styles
    styleOptions.labelFont = '12px "Manrope", sans-serif';
    styleOptions.valFont = '12px "Manrope", sans-serif';
    styleOptions.headerFont = '13px "Manrope", sans-serif';

    drawStatsBarCanvas(ctx, canvasWidth, canvasHeight, records, colorMap, highlightKey, styleOptions);
    attachStatsBarHover(canvas);
}

// Helper function to draw on any context (screen or print)
function drawStatsBarCanvas(ctx, width, height, records, colorMap, highlightKey, opts) {
    ctx.clearRect(0, 0, width, height);

    if (!records.length) {
        ctx.fillStyle = '#777';
        ctx.font = '14px sans-serif';
        ctx.fillText('Sin datos', 20, 30);
        return;
    }

    const users = [...new Set(records.map(r => r.user || 'Desconocido'))];
    const projects = [...new Set(records.map(r => r.project || 'Sin Proyecto'))];
    const dataMap = {};
    records.forEach(r => {
        const u = r.user || 'Desconocido';
        const p = r.project || 'Sin Proyecto';
        const h = Number(r.hours) || 0;
        dataMap[u] = dataMap[u] || {};
        dataMap[u][p] = (dataMap[u][p] || 0) + h;
    });

    const maxVal = Math.max(...Object.values(dataMap).flatMap(obj => Object.values(obj)), 0);
    if (maxVal <= 0) {
        ctx.fillStyle = '#777';
        ctx.font = '14px sans-serif';
        ctx.fillText('Sin datos', 20, 30);
        return;
    }

    const margin = { top: 28, right: 30, bottom: 90, left: 74 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const groupWidth = w / Math.max(users.length, 1);
    const innerWidth = Math.max(groupWidth * 0.85, groupWidth - 12);
    const barWidth = Math.min(65, innerWidth / Math.max(projects.length, 1));
    const barsTotalWidth = barWidth * Math.max(projects.length, 1);
    const maxHeight = h - 6;

    const maxValInt = Math.ceil(maxVal);
    const stepVal = Math.max(1, Math.ceil(maxValInt / 6));
    const gridMax = Math.max(stepVal, Math.ceil(maxValInt / stepVal) * stepVal);
    const scale = maxHeight / gridMax;

    const toRGBA = (hex, alpha) => {
        const raw = (hex || '#3498db').replace('#', '');
        const norm = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw.padEnd(6, '0');
        const num = parseInt(norm, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r},${g},${b},${alpha})`;
    };

    ctx.strokeStyle = opts.axisColor || 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.font = opts.valFont || '12px "Manrope", sans-serif';
    ctx.fillStyle = opts.textColor || '#cfd2d6';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let val = 0; val <= gridMax; val += stepVal) {
        const y = margin.top + maxHeight - (val * scale);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + w, y);
        ctx.stroke();
        ctx.fillText(String(val), margin.left - 12, y + 4);
    }
    ctx.textBaseline = 'alphabetic';

    users.forEach((user, idxU) => {
        const baseX = margin.left + idxU * groupWidth + (groupWidth - barsTotalWidth) / 2;
        projects.forEach((proj, idxP) => {
            const val = (dataMap[user] && dataMap[user][proj]) ? dataMap[user][proj] : 0;
            if (val <= 0) return;
            const barH = val * scale;
            const x = baseX + idxP * barWidth;
            const y = margin.top + maxHeight - barH;
            const key = `${user}|${proj}`;
            const isHighlight = highlightKey === key;
            const lift = isHighlight ? 8 : 0;

            const baseColor = colorMap[proj] || '#3498db';
            const gradient = ctx.createLinearGradient(x, y - lift, x, y - lift + barH + lift);
            gradient.addColorStop(0, toRGBA(baseColor, isHighlight ? 0.95 : 0.9));
            gradient.addColorStop(1, toRGBA(baseColor, isHighlight ? 0.72 : 0.65));

            ctx.save();
            ctx.shadowColor = `rgba(0,0,0,${isHighlight ? 0.35 : 0.22})`;
            ctx.shadowBlur = isHighlight ? 14 : 8;
            ctx.shadowOffsetY = isHighlight ? 6 : 4;
            ctx.beginPath();
            ctx.roundRect(x, y - lift, barWidth - 4, barH + lift, 4);
            ctx.fillStyle = gradient;
            ctx.fill();
            if (isHighlight) {
                ctx.strokeStyle = toRGBA(baseColor, 0.95);
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.restore();

            if (highlightKey || !window._statsBarRects) {
                // Collect rects only if needed (usually only relevant for main canvas hover)
                if (!window._statsBarRects) window._statsBarRects = [];
            }
            // For offscreen print, we don't care about rects for hover. 
            // But if this is main canvas, we need them.
            // We can pass a flag or check if window._statsBarRects is available.
            // For simplicity, we just won't push to window._statsBarRects here unless it's the main render.
            // Actually, best to decouple rect collection. 
            // But to minimize changes:
            if (window._statsBarRects && opts.collectRects) {
                window._statsBarRects.push({ x, y: y - lift, w: barWidth - 4, h: barH + lift, user, proj, val });
            }
        });

        ctx.fillStyle = opts.textColor || '#cfd2d6';
        ctx.font = opts.labelFont || '13px "Manrope", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(user, baseX + barsTotalWidth / 2, margin.top + maxHeight + 34);
    });

    ctx.fillStyle = opts.headerColor || '#f2f2f2';
    ctx.font = opts.headerFont || 'bold 13px "Manrope", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Usuarios', margin.left + w, margin.top + maxHeight + 58);
    ctx.save();
    ctx.translate(margin.left - 55, margin.top + 8);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('Horas', 0, 0);
    ctx.restore();
}

function drawStatsAreaCanvas(ctx, width, height, records, colorMap, opts) {
    ctx.clearRect(0, 0, width, height);

    if (!records || !records.length) {
        ctx.fillStyle = '#777';
        ctx.font = '14px sans-serif';
        ctx.fillText('Sin datos', 20, 30);
        return;
    }

    // 1. Prepare Data
    // Get unique sorted dates and projects
    const rawDates = [...new Set(records.map(r => r.date))].sort();
    if (!rawDates.length) return;

    // Parse dates to timestamp for sorting/filling
    const parseDate = (dStr) => {
        if (!dStr) return 0;
        if (dStr.includes('/')) {
            const p = dStr.split('/');
            return new Date(p[2], p[1] - 1, p[0]).getTime();
        } else if (dStr.includes('-')) {
            const p = dStr.split('-');
            return new Date(p[0], p[1] - 1, p[2]).getTime();
        }
        return 0;
    };

    const firstDateTs = parseDate(rawDates[0]);
    const lastDateTs = parseDate(rawDates[rawDates.length - 1]);

    // Single Day Filter Check
    if (firstDateTs === lastDateTs) {
        // Center calculations
        const cx = width / 2;
        const cy = height / 2;
        const msg = 'Sin rango de dias seleccionado';

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '500 16px "Manrope", sans-serif';
        const textMetrics = ctx.measureText(msg);
        const textW = textMetrics.width;
        const pad = 20;

        // Draw Border Box
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Rounded rect logic or simple rect
        const bx = cx - textW / 2 - pad;
        const by = cy - 20;
        const bw = textW + pad * 2;
        const bh = 40;
        ctx.roundRect(bx, by, bw, bh, 8);
        ctx.stroke();

        ctx.fillStyle = '#888';
        ctx.fillText(msg, cx, cy);
        ctx.restore();
        return;
    }

    const oneDay = 24 * 60 * 60 * 1000;

    // Create full timeline (daily) to ensure flat lines for inactive days
    const timePoints = [];
    for (let t = firstDateTs; t <= lastDateTs; t += oneDay) {
        timePoints.push(t);
    }

    const projects = [...new Set(records.map(r => r.project || 'Sin Proyecto'))];

    // Calculate Cumulative Data per Project at each time point
    // Data Structure: { time: ts, values: { projA: cumVal, projB: cumVal, ... } }
    const timelineData = [];
    const currentCumulatives = {};
    projects.forEach(p => currentCumulatives[p] = 0);

    // Index records by date for fast lookup
    const recordsByDate = {};
    records.forEach(r => {
        const ts = parseDate(r.date);
        if (!recordsByDate[ts]) recordsByDate[ts] = [];
        recordsByDate[ts].push(r);
    });

    let globalMax = 0;

    timePoints.forEach(ts => {
        // Add daily hours
        if (recordsByDate[ts]) {
            recordsByDate[ts].forEach(r => {
                const p = r.project || 'Sin Proyecto';
                currentCumulatives[p] += (Number(r.hours) || 0);
            });
        }
        // Snapshot
        const snapshot = { ts, totals: { ...currentCumulatives } };

        // Calculate stacking tops
        snapshot.totalPoly = 0;
        timelineData.push(snapshot);
    });

    // --- NEW: Sort Projects by Max Value Descending (Largest at Back) ---
    const projectMaxVals = {};
    projects.forEach(p => projectMaxVals[p] = 0);
    globalMax = 0;

    timelineData.forEach(snap => {
        projects.forEach(p => {
            const val = snap.totals[p];
            if (val > projectMaxVals[p]) {
                projectMaxVals[p] = val;
            }
            if (val > globalMax) {
                globalMax = val;
            }
        });
    });

    // Sort descending
    projects.sort((a, b) => projectMaxVals[b] - projectMaxVals[a]);
    // -------------------------------------------------------------------

    // 2. Dimensions & Scaling
    if (globalMax <= 0) globalMax = 10;
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Pre-calculate constants for renderer
    const maxValInt = Math.ceil(globalMax);
    const stepVal = Math.max(1, Math.ceil(maxValInt / 5));
    const gridMax = Math.max(stepVal, Math.ceil(maxValInt / stepVal) * stepVal);

    // --- SAVE STATE FOR TOOLTIP & ANIMATION ---
    window._statsAreaState = {
        timelineData,
        projects, // Sorted (Largest to Smallest)
        margin,
        w, h,
        width, height, // Original dims
        globalMax,
        firstDateTs, lastDateTs,
        colorMap,
        opts,
        // Pre-calculated constants for renderer
        gridMax, stepVal, maxValInt
    };

    renderStatsAreaFrame(ctx, window._statsAreaState);
    attachStatsAreaHover(ctx.canvas);
}

function attachStatsAreaHover(canvas) {
    if (!canvas) return;

    // Remove old listener if exists (to avoid duplicates on re-render)
    if (canvas._hoverHandler) {
        canvas.removeEventListener('mousemove', canvas._hoverHandler);
        canvas.removeEventListener('mouseleave', canvas._hoverHandlerLeave);
    }

    const handler = (ev) => {
        const state = window._statsAreaState;
        if (!state || !state.timelineData || state.timelineData.length < 2) return;

        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        // 1. Convert X to Timestamp
        const duration = state.lastDateTs - state.firstDateTs || 1;
        const tsEst = ((x - state.margin.left) / state.w) * duration + state.firstDateTs;

        // 2. Find Surrounding Snapshots for Interpolation
        let idx = 0;
        while (idx < state.timelineData.length - 1 && state.timelineData[idx + 1].ts < tsEst) {
            idx++;
        }

        // Boundaries
        const snap1 = state.timelineData[idx];
        const snap2 = state.timelineData[idx + 1] || snap1;

        // Calculate Interpolation Factor (0 to 1)
        let r = 0;
        if (snap2.ts > snap1.ts) {
            r = (tsEst - snap1.ts) / (snap2.ts - snap1.ts);
        }
        r = Math.max(0, Math.min(1, r));

        // 3. Find Nearest Snapshot for Text (Snapping)
        const snapForText = (r < 0.5) ? snap1 : snap2;

        if (x < state.margin.left || x > state.margin.left + state.w) {
            // Out of bounds X
            if (state.activeProject) {
                state.activeProject = null;
                if (state.animId) {
                    cancelAnimationFrame(state.animId);
                    state.animId = null;
                }
                const ctx = canvas.getContext('2d');
                renderStatsAreaFrame(ctx, state);
            }
            hideStatsAreaTooltip();
            return;
        }

        // 4. Hit Detection (Interpolated Y-axis)
        let hitProject = null;
        const projectsDesc = state.projects;

        const maxValInt = Math.ceil(state.globalMax);
        const stepVal = Math.max(1, Math.ceil(maxValInt / 5));
        const gridMax = Math.max(stepVal, Math.ceil(maxValInt / stepVal) * stepVal);
        const yScale = (v) => state.margin.top + state.h - ((v / gridMax) * state.h);

        const axisY = yScale(0);

        // Iterate backwards: Smallest (Front) -> Largest (Back)
        for (let i = projectsDesc.length - 1; i >= 0; i--) {
            const p = projectsDesc[i];

            const val1 = snap1.totals[p] || 0;
            const val2 = snap2.totals[p] || 0;

            const valInterp = val1 + (val2 - val1) * r;
            const yTop = yScale(valInterp);

            if (y >= yTop - 3 && y <= axisY) {
                hitProject = { p, val: snapForText.totals[p] || 0, ts: snapForText.ts };
                break;
            }
        }

        if (hitProject) {
            if (state.activeProject !== hitProject.p) {
                state.activeProject = hitProject.p;
                if (!state.animId) {
                    animateStatsArea();
                }
            }
            showStatsAreaTooltip(ev, hitProject);
        } else {
            if (state.activeProject) {
                state.activeProject = null;
                if (state.animId) {
                    cancelAnimationFrame(state.animId);
                    state.animId = null;
                }
                const ctx = canvas.getContext('2d');
                renderStatsAreaFrame(ctx, state);
            }
            hideStatsAreaTooltip();
        }
    };

    const handlerLeave = () => {
        hideStatsAreaTooltip();
        const state = window._statsAreaState;
        if (state && state.activeProject) {
            state.activeProject = null;
            if (state.animId) {
                cancelAnimationFrame(state.animId);
                state.animId = null;
            }
            const ctx = canvas.getContext('2d');
            renderStatsAreaFrame(ctx, state);
        }
    };

    canvas.addEventListener('mousemove', handler);
    canvas.addEventListener('mouseleave', handlerLeave);

    canvas._hoverHandler = handler;
    canvas._hoverHandlerLeave = handlerLeave;
}

function showStatsAreaTooltip(ev, hit) {
    let tip = document.getElementById('stats-area-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'stats-area-tooltip';
        tip.style.position = 'fixed';
        tip.style.background = 'rgba(17,17,17,0.95)';
        tip.style.border = '1px solid var(--border)';
        tip.style.padding = '6px 12px';
        tip.style.borderRadius = '6px';
        tip.style.color = '#fff';
        tip.style.fontSize = '0.85rem';
        tip.style.pointerEvents = 'none';
        tip.style.zIndex = '4500';
        tip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        document.body.appendChild(tip);
    }

    const date = new Date(hit.ts);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const hours = Math.round(hit.val * 100) / 100;

    // Format: "Project Name: Hours h - Date" or similar
    tip.innerHTML = `<div style="font-weight:bold; margin-bottom:2px;">${hit.p}</div><div style="color:#ccc; font-size:0.8rem;">${hours} h &bull; ${dateStr}</div>`;

    // Position slightly above cursor
    tip.style.left = `${ev.clientX + 15}px`;
    tip.style.top = `${ev.clientY + 15}px`;
    tip.style.display = 'block';
}

function hideStatsAreaTooltip() {
    const tip = document.getElementById('stats-area-tooltip');
    if (tip) tip.style.display = 'none';
}

function attachStatsBarHover(canvas) {
    if (!canvas) return;
    canvas.onmousemove = (ev) => {
        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const bars = window._statsBarRects || [];
        const hit = bars.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
        const state = window._statsBarState || {};
        const newHighlight = hit ? `${hit.user}|${hit.proj}` : null;
        if (state.highlightKey !== newHighlight) {
            renderStatsBar(state.records || [], state.colorMap || {}, newHighlight);
            if (newHighlight) {
                const refreshed = (window._statsBarRects || []).find(b => `${b.user}|${b.proj}` === newHighlight);
                if (refreshed) showStatsBarTooltip(ev, refreshed);
            } else {
                hideStatsBarTooltip();
            }
            return;
        }
        if (hit) {
            showStatsBarTooltip(ev, hit);
        } else {
            hideStatsBarTooltip();
        }
    };

    canvas.onmouseleave = () => {
        hideStatsBarTooltip();
        const state = window._statsBarState || {};
        if (state.highlightKey) {
            renderStatsBar(state.records || [], state.colorMap || {}, null);
        }
    };
}

function showStatsBarTooltip(ev, bar) {
    if (!bar) {
        hideStatsBarTooltip();
        return;
    }
    let tip = document.getElementById('stats-bar-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'stats-bar-tooltip';
        tip.style.position = 'fixed';
        tip.style.background = 'rgba(17,17,17,0.95)';
        tip.style.border = '1px solid var(--border)';
        tip.style.padding = '6px 10px';
        tip.style.borderRadius = '6px';
        tip.style.color = '#fff';
        tip.style.fontSize = '0.85rem';
        tip.style.pointerEvents = 'none';
        tip.style.zIndex = '4500';
        document.body.appendChild(tip);
    }
    const hours = Math.round(bar.val * 100) / 100;
    tip.textContent = `${bar.proj} - ${bar.user}: ${hours} h`;
    tip.style.left = `${ev.clientX + 12}px`;
    tip.style.top = `${ev.clientY + 12}px`;
    tip.style.display = 'block';
}

function hideStatsBarTooltip() {
    const tip = document.getElementById('stats-bar-tooltip');
    if (tip) tip.style.display = 'none';
}
async function showActivityEntry() {

    localStorage.setItem('lastView', 'activity-entry');

    hideAllViews();

    document.getElementById('view-activity-entry').style.display = 'block';

    // Set Date in Breadcrumb

    const dateEl = document.getElementById('entry-date-crumb');

    if (dateEl) {

        dateEl.textContent = currentActivityDate || 'Fecha desconocida';

    }

    // Ensure panel is closed initially

    closeActivityPanel();

    animateEntry('view-activity-entry');

    // Reset container

    const container = document.getElementById('activity-blocks-container');

    container.innerHTML = '<div style="text-align:center; padding:2rem;"><span class="spinner"></span> Cargando...</div>';

    currentBlockIndex = 0; // Reset counter

    // Populate Data

    try {

        const res = await fetch(`/api/get-activity?date=${encodeURIComponent(currentActivityDate)}`);

        const data = await res.json();

        container.innerHTML = ''; // Clear spinner

        if (data.status === 'success' && data.activities && data.activities.length > 0) {

            // LOAD EXISTING

            data.activities.forEach((act, i) => {

                // Ensure global counter matches current loop index

                currentBlockIndex = i;

                const idx = i;

                addActivityBlock(idx);
                // Wait for DOM (synchronous)
                const pInput = document.getElementById(`activity-input-project-${idx}`);

                const tInput = document.getElementById(`activity-input-time-${idx}`);

                const dInput = document.getElementById(`activity-input-text-${idx}`);

                if (pInput) pInput.value = act.project;

                if (dInput) dInput.value = act.description;

                if (tInput) {

                    tInput.value = act.time;

                    // We need to wait for TimeWheel generation (it has setTimeout 50ms)

                    setTimeout(() => updateTimeWheelVisuals(idx, act.time), 100);

                }

            });

        } else {

            // NEW ENTRY

            currentBlockIndex = 0; // Start fresh

            addActivityBlock(0);

        }

    } catch (e) {

        console.error("Error loading activity", e);

        container.innerHTML = '';

        currentBlockIndex = 0;

        addActivityBlock(0);

        showNotification("Error cargando datos previos", 'error');

    }

    // Update height

    setTimeout(updatePanelHeight, 200);

    // Ensure glossary is fresh when entering the panel
    await refreshGlossaryCache(true);

}

let cachedGlossary = [];
let glossaryRefreshPromise = null;
let glossaryLastLoadedAt = 0;
const GLOSSARY_TTL_MS = 60000;

// Refresh glossary cache from server
function refreshGlossaryCache(silent = false) {
    if (glossaryRefreshPromise) return glossaryRefreshPromise;
    const prevGlossary = Array.isArray(cachedGlossary) ? [...cachedGlossary] : [];
    if (!silent) console.log('Recargando glosario...');
    const glossaryUrl = `/api/glossary?_ts=${Date.now()}`;
    glossaryRefreshPromise = fetch(glossaryUrl, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                cachedGlossary = parseGlossary(data.content);
                glossaryLastLoadedAt = Date.now();
                if (!cachedGlossary || cachedGlossary.length === 0) {
                    cachedGlossary = [...GLOSSARY_FALLBACK];
                }
                if (!silent) {
                    console.log('??? Glosario actualizado:', cachedGlossary.length, 'proyectos');
                    showNotification('Glosario actualizado correctamente (' + cachedGlossary.length + ' proyectos)', 'success');
                }
            } else {
                console.error('Error:', data.content);
                cachedGlossary = prevGlossary;
                if (!silent) showNotification('Error: ' + data.content, 'error');
            }
        })
        .catch(err => {
            console.error('Error al actualizar glosario:', err);
            cachedGlossary = prevGlossary;
            if (!silent) showNotification('Error al actualizar glosario', 'error');
        })
        .finally(() => {
            glossaryRefreshPromise = null;
        });
    return glossaryRefreshPromise;
}




// Add new project to glossary
function addProjectToGlossary() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background: var(--card-bg); padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-width: 500px; width: 90%;';

    modal.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: var(--bpb-blue); font-size: 1.3rem;">Agregar Proyecto al Glosario</h3>
        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 0.9rem;">Ingrese el nombre del nuevo proyecto:</label>
        <div style="border: 1px solid #444; border-radius: 6px; padding: 4px; background: #222;">
            <input type="text" id="new-project-input" placeholder="Nombre del proyecto" 
                   style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); font-size: 1rem; box-sizing: border-box; transition: border-color 0.2s;" 
                   onfocus="this.style.borderColor='var(--bpb-blue)'" 
                   onblur="this.style.borderColor='var(--border-color)'" />
        </div>
        <div style="margin-top: 25px; display: flex; gap: 12px; justify-content: flex-end;">
            <button id="cancel-add-project" class="btn" style="border: 1px solid #444;">Cancelar</button>
            <button id="confirm-add-project" class="btn btn-primary">Guardar</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = document.getElementById('new-project-input');
    const cancelBtn = document.getElementById('cancel-add-project');
    const confirmBtn = document.getElementById('confirm-add-project');

    input.focus();

    const closeModal = () => overlay.remove();

    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    const submitProject = () => {
        const trimmedName = input.value.trim();
        if (!trimmedName) return;

        closeModal();

        // Send to backend
        fetch('/api/glossary/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: trimmedName })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    showNotification('Proyecto "' + trimmedName + '" agregado correctamente', 'success');
                    // Refresh cache and reload modal
                    refreshGlossaryCache().then(() => toggleActivityPanel('glossary'));
                } else {
                    showNotification('Error: ' + (data.message || 'No se pudo agregar'), 'error');
                }
            })
            .catch(err => {
                console.error('Error al agregar proyecto:', err);
                showNotification('Error de conexión al agregar proyecto', 'error');
            });
    };

    confirmBtn.onclick = submitProject;
    input.onkeydown = (e) => { if (e.key === 'Enter') submitProject(); };
}

let currentBlockIndex = 0;

function updatePanelHeight() {

    const mainContent = document.getElementById('activity-main-content');

    const panel = document.getElementById('activity-side-panel');

    if (mainContent && panel && panel.style.width === '350px') {

        const h = mainContent.offsetHeight;

        panel.style.maxHeight = h + 'px';

        panel.style.overflowY = 'auto'; // Ensure scroll is enabled when active

    }

}

function addActivityBlock(idx = null) {

    if (idx === null) {

        currentBlockIndex++;

        idx = currentBlockIndex;

    }

    const container = document.getElementById('activity-blocks-container');

    const div = document.createElement('div');

    div.className = 'activity-entry-block';

    div.id = `block-${idx}`;

    div.innerHTML = `

        <!-- 1. Proyecto -->

        <div class="activity-section">

            <span class="activity-section-title">Proyecto ${idx > 0 ? '(Extra)' : ''}</span>

            <div class="project-input-container">

                <input type="text" id="activity-input-project-${idx}" class="project-input project-input-dynamic" placeholder="Escriba para buscar proyecto..." autocomplete="off">

                <div id="project-suggestions-${idx}" class="suggestions-list"></div>

            </div>

        </div>

        <!-- 2. Tiempo Destinado -->

        <div class="activity-section" style="margin-top: 1.5rem;">

            <span class="activity-section-title">Tiempo Destinado (Horas)</span>

            <div class="time-wheel-container time-wheel-dynamic" id="time-wheel-${idx}">

                <!-- Generated by JS -->

            </div>

            <input type="hidden" id="activity-input-time-${idx}" class="time-input-dynamic" value="0">

        </div>

        <!-- 3. Descripción -->

        <div class="activity-section" style="flex: 1; min-height: 200px; margin-top: 1.5rem;">

            <span class="activity-section-title">Descripción</span>

            <div class="desc-area-container">

                <textarea id="activity-input-text-${idx}" class="desc-input-dynamic"

                    style="width: 100%; flex: 1; background: transparent; border: none; color: var(--text-primary); font-family: 'Manrope', sans-serif; font-size: 1rem; resize: none; outline: none;"

                    placeholder="Detalles adicionales de la actividad..."></textarea>

            </div>

        </div>

        

        ${idx > 0 ? `<button onclick="removeActivityBlock(${idx})" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        </button>` : ''}

    `;

    container.appendChild(div);

    // Initialize components for this block

    generateTimeWheel(idx);

    setupProjectAutocomplete(idx);

    // Animate in

    div.style.opacity = '0';

    div.style.transform = 'translateY(20px)';

    div.style.transition = 'all 0.3s ease';

    setTimeout(() => {

        div.style.opacity = '1';

        div.style.transform = 'translateY(0)';

        updatePanelHeight(); // Update height after adding

    }, 10);

}

function removeActivityBlock(idx) {

    const el = document.getElementById(`block-${idx}`);

    if (el) {

        el.remove();

        setTimeout(updatePanelHeight, 50); // Update height after remove

    }

}

async function initActivityForm() {
    try {
        await refreshGlossaryCache(true);
    } catch (e) {
        console.error(e);
    }
}


// Parsing: "Main Name - Alias1, Alias2"

function parseGlossary(text) {
    const lines = text.split(/\r?\n/);
    const projects = [];
    lines.forEach(line => {

        const ln = line.trim();

        if (!ln || ln.startsWith('#')) return;

        // Split by first hyphen to separate Main from Aliases

        const parts = ln.split('-');

        const mainName = parts[0].trim();

        let keywords = [mainName.toLowerCase()];

        if (parts.length > 1) {

            const aliasesRaw = parts[1].trim();

            // Aliases separated by commas

            const aliases = aliasesRaw.split(',').map(a => a.trim()).filter(a => a);

            aliases.forEach(a => keywords.push(a.toLowerCase()));

        }

        projects.push({

            main: mainName,

            keywords: keywords

        });

    });

    return projects;

}

// Fallback glossary (ensures suggestions even if /api/glossary fails)
const GLOSSARY_FALLBACK_TEXT = `Cuerpo de Siembra - Tren de Siembra,
Caja Electrica - Electric Box, Caja Transmision, Caja Transmision Electrica
Maquina de tierra - Ensayo de rodamiento maquina de tierra, sensor de sobrecarga, Sala de calidad, Maq. de tierra, maquina do terra, ensayo
Corte por Hilo
Corte por Agua
Corte por Laser
Grabado Laser 
Sistema de Costos - Costos, Sistema de Costos para productos; Sistema de Eliseo
Registros O.T - Sistema de Registros, Registros, Recordatorios
SimpliseedtyS2 - Dupliseedty, DosificadorS2
SimpliseedtyS1 - DosificadorS1,
Orden de Compra - O.D, OdC, P.O , PO, OC
Martin Till
Dosificador Mani en Caja - Mani en Caja,
Cadena Bonder - Bonder, Bonder Stellantis
Mazas Agricolas Varias - Maza Mainero, Maza Ascanelli
Lider Rolamentos - Lider, Rolamentos, Brasil
Proyecto INVAP
Cuerpo Recolector Mainero
Patines para Ventana
Brazo Acondicionador de Suelos
Proyecto VW - VW, Caja Automatica, Proyecto Volkswagen, Volskwagen, Volkswagen Caja automatica
Reporte de Inspeccion
Registros de Control de Calidad
Soporte a Produccion
Soporte a Area Comercial
Seguimiento de Proteccion Intelectual
Ordenes de Produccion
Soporte a Compras Internacionales
Soporte al area Diseno Grafico
Impresoras 3D
Otros - Extra,`;

const GLOSSARY_FALLBACK = parseGlossary(GLOSSARY_FALLBACK_TEXT);

if (!Array.isArray(cachedGlossary) || cachedGlossary.length === 0) {
    cachedGlossary = [...GLOSSARY_FALLBACK];
}

function generateTimeWheel(idx) {

    const container = document.getElementById(`time-wheel-${idx}`);

    if (!container) return;

    container.innerHTML = '';

    // Logic:

    // 0.25 to 1: steps of 0.25 (0.25, 0.5, 0.75, 1.0)

    // 1 to 10: steps of 0.5 (1.5, 2.0, ..., 10.0)

    const steps = [];

    // Part 1: 0.25 to 1

    for (let h = 0.25; h <= 1; h += 0.25) {

        steps.push(h);

    }

    // Part 2: 1.5 to 10

    for (let h = 1.5; h <= 10; h += 0.5) {

        steps.push(h);

    }

    steps.forEach(val => {

        const el = document.createElement('div');

        el.className = 'time-option';
        el.setAttribute('data-value', val);

        let label = val.toString().replace('.', ',');

        el.innerHTML = `<span>${label}</span><span style="font-size:0.8rem; opacity:0.6">h</span>`;

        el.onclick = () => selectTimeOption(el, val, idx);

        container.appendChild(el);

    });

    // Center any preselected value if exists

    setTimeout(() => {

        const selected = container.querySelector('.selected');

        if (selected) {

            selected.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });

        }

    }, 50);

}

function selectTimeOption(el, val, idx) {

    // Visual selection within this container

    const container = document.getElementById(`time-wheel-${idx}`);

    container.querySelectorAll('.time-option').forEach(opt => opt.classList.remove('selected'));

    el.classList.add('selected');

    // Update hidden input

    const input = document.getElementById(`activity-input-time-${idx}`);
    if (input) {
        input.value = val;
        // Force Total Time Update
        if (typeof updateTotalTime === 'function') updateTotalTime();
    }

    // Center element

    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

}

function updateTimeWheelVisuals(idx, val) {
    const container = document.getElementById(`time-wheel-${idx}`);
    if (!container) return;

    const numVal = parseFloat(String(val).replace(',', '.'));
    if (!numVal || isNaN(numVal)) return;

    const options = container.querySelectorAll('.time-option');
    options.forEach(opt => {
        opt.classList.remove('selected');
        const dataVal = opt.getAttribute('data-value');
        const optVal = dataVal ? parseFloat(dataVal) : parseFloat(opt.querySelector('span').textContent.replace(',', '.'));
        if (optVal === numVal) {
            opt.classList.add('selected');
            opt.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        }
    });
}

function setupProjectAutocomplete(idx) {
    const input = document.getElementById(`activity-input-project-${idx}`);
    const suggestions = document.getElementById(`project-suggestions-${idx}`);

    if (!input || !suggestions) return;

    const maybeOpenIsoTracking = () => {
        const value = (input.value || '').trim().toUpperCase();
        if (value === 'BP') {
            if (input.dataset.bpIsoOpened === '1') return;
            input.dataset.bpIsoOpened = '1';
            openIsoTrackingFromActivity();
        } else if (input.dataset.bpIsoOpened) {
            input.dataset.bpIsoOpened = '';
        }
    };

    // Lazy-load glossary once
    let glossaryPromise = null;
    const ensureGlossary = async () => {
        const now = Date.now();
        const isFresh = cachedGlossary.length > 0 && (now - glossaryLastLoadedAt) < GLOSSARY_TTL_MS;
        if (!isFresh) {
            await refreshGlossaryCache(true);
        }
        if (!cachedGlossary || cachedGlossary.length === 0) {
            cachedGlossary = [...GLOSSARY_FALLBACK];
        }
    };

    if (!input.dataset.glossaryFocusBound) {
        input.dataset.glossaryFocusBound = '1';
        input.addEventListener('focus', async () => {
            await ensureGlossary();
        });
    }

    input.addEventListener('input', async () => {
        const query = (input.value || '').toLowerCase();
        suggestions.innerHTML = '';

        if (query.length < 1) {
            suggestions.style.display = 'none';
            return;
        }

        await ensureGlossary();

        const matches = cachedGlossary.filter(p =>
            p.keywords.some(k => k.includes(query))
        );

        if (matches.length > 0) {
            suggestions.style.display = 'block';
            matches.slice(0, 10).forEach(match => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = match.main;
                div.onclick = () => {
                    input.value = match.main;
                    suggestions.style.display = 'none';
                    maybeOpenIsoTracking();
                };
                suggestions.appendChild(div);
            });
        } else {
            suggestions.style.display = 'none';
        }
    });

    if (!input.dataset.bpIsoBound) {
        input.dataset.bpIsoBound = '1';
        input.addEventListener('change', maybeOpenIsoTracking);
        input.addEventListener('blur', maybeOpenIsoTracking);
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggestions) {
            suggestions.style.display = 'none';
        }
    });
}
function toggleActivityPanel(type) {

    const panel = document.getElementById('activity-side-panel');

    const title = document.getElementById('panel-title');

    const content = document.getElementById('panel-content');

    if (!panel) return;

    // Check if already open with same type

    const isVisible = panel.style.display !== 'none' && panel.style.width === '350px';

    // Extract just the title text (first word before buttons)
    const currentTitleText = title.textContent.trim().split(/\s+/)[0]; // Get first word

    const newTitle = type === 'instructions' ? 'Instrucciones' : 'Glosario';

    if (isVisible && currentTitleText === newTitle) {

        // Toggle CLOSE

        closeActivityPanel();

        return;

    }

    // Set Title
    title.textContent = newTitle;

    // Add refresh button for glossary
    if (type === 'glossary') {
        title.innerHTML = `
            Glosario 
            <button onclick="refreshGlossaryCache().then(() => toggleActivityPanel('glossary'));" 
                    style="background: transparent; border: 1px solid var(--bpb-blue); color: var(--bpb-blue); 
                           width: 32px; height: 32px; border-radius: 4px; margin-left: 10px; cursor: pointer;
                           display: inline-flex; align-items: center; justify-content: center; padding: 0; vertical-align: middle;"
                    title="Recargar glosario desde archivo">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
            </button>
            <button onclick="addProjectToGlossary();" 
                    style="background: transparent; border: 1px solid var(--bpb-blue); color: var(--bpb-blue); 
                           width: 32px; height: 32px; border-radius: 4px; margin-left: 5px; cursor: pointer;
                           display: inline-flex; align-items: center; justify-content: center; padding: 0; font-size: 1.3rem; font-weight: bold; vertical-align: middle;"
                    title="Agregar proyecto al glosario">
                +
            </button>`;
    }

    // Open Panel: Display Flex first, then animate properties

    panel.style.display = 'flex';

    // Small delay to allow display change to register before transition

    requestAnimationFrame(() => {

        panel.style.width = '350px';

        panel.style.opacity = '1';

        panel.style.overflowY = 'auto';

        updatePanelHeight();

    });

    if (type === 'instructions') {

        const today = new Date();

        const dd = String(today.getDate()).padStart(2, '0');

        const mm = String(today.getMonth() + 1).padStart(2, '0');

        const yyyy = today.getFullYear();

        const fullDate = `${dd}/${mm}/${yyyy}`;

        content.innerHTML = `

            Se le solicita dejar asentado las actividades llevadas a cabo en el dia de hoy <strong>${fullDate}</strong>.<br><br>

            Describa brevemente las actividades del dia respetando el siguiente formato:<br>

            ------------------<br>

            Proyecto:<br>

            Tiempo destinado:<br>

            Descripción:<br>

            ------------------<br><br>

            <strong>Aclaraciones:</strong><br>

            - Utilice el botón "Proyecto Extra" para agregar otra actividad.<br>

            - Si no sabe a qué proyecto hacer referencia, consulte el "Glosario" o escriba "Otros".<br>

            - El tiempo destinado se selecciona en horas (use fracciones como 0,5 para 30 min).<br><br>

            Token: <code>REGISTRO:23cdc019</code>`;

    } else {

        // Glossary: Fetch from API

        content.innerHTML = '<div style="text-align:center; margin-top: 2rem;"><span class="spinner"></span> Cargando glosario...</div>';

        fetch('/api/glossary')

            .then(res => res.json())

            .then(data => {

                if (data.status === 'success') {

                    const projects = parseGlossary(data.content);

                    // Render list of MAIN project names

                    let html = '<ul style="list-style: none; padding: 0;">';

                    projects.forEach(p => {

                        html += `<li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 500;">

                                    ${p.main}

                                 </li>`;

                    });

                    html += '</ul>';

                    content.innerHTML = html;

                } else {

                    content.innerHTML = `<span style="color: #ff6b6b;">${data.content}</span>`;

                }

            })

            .catch(err => {

                content.innerHTML = `<span style="color: #ff6b6b;">Error de conexión.</span>`;

            });

    }

}

function closeActivityPanel() {

    const panel = document.getElementById('activity-side-panel');

    if (panel) {

        panel.style.width = '0';

        panel.style.opacity = '0';

        panel.style.overflowY = 'hidden';

        // Wait for transition to finish nicely then hide

        setTimeout(() => {

            panel.style.display = 'none';

        }, 300);

    }

}

function triggerSync(btn) {

    // If button passed, use it. If not, try to find the button in the DOM

    const targetBtn = btn || document.querySelector('#view-list .btn[onclick*="triggerSync"]');

    checkSync(false, targetBtn);

}

function checkSync(silent, btn) {

    if (btn) btn.disabled = true;

    if (!silent && btn) {

        btn.innerHTML = '<span class="spinner" style="width:12px; height:12px; border-width:2px; display:inline-block; margin-right:5px;"></span> Verificando...';

    }

    console.log("Checking for updates...");

    fetch('/api/check-ingresos', { method: 'POST' })

        .then(res => res.json())

        .then(data => {

            if (data.status === 'changes_detected') {

                console.log('Update found, starting fetch...');

                if (!silent) showNotification('Nuevos registros entrantes...', 'info');
                updateTotalTime(); // Force update on load/check

                const inlineContainer = document.getElementById('sync-progress-inline');

                const triggerBtn = document.getElementById('btn-sync-trigger');

                const inlineBar = document.getElementById('sync-inline-bar');

                const inlineText = document.getElementById('sync-inline-text');

                const inlineChk = document.getElementById('sync-inline-chk');

                if (inlineContainer && triggerBtn) {

                    triggerBtn.style.display = 'none';

                    inlineContainer.style.display = 'flex';

                    if (inlineBar) inlineBar.style.width = '0%';

                    if (inlineChk) inlineChk.innerText = '0%';

                    if (inlineText) inlineText.innerText = 'Iniciando...';

                }

                fetch('/api/fetch-pdfs', { method: 'POST' })

                    .then(res2 => res2.json())

                    .then(data2 => {

                        if (data2.status === 'started' || data2.status === 'running') {

                            const pollInterval = setInterval(() => {

                                fetch('/api/sync-progress').then(r => r.json()).then(pData => {

                                    if (inlineContainer) {

                                        const pct = Math.round(pData.progress);

                                        if (inlineBar) inlineBar.style.width = `${pct}%`;

                                        if (inlineChk) inlineChk.innerText = `${pct}%`;

                                        if (inlineText) inlineText.innerText = pData.message || 'Procesando...';

                                    }

                                    if (!pData.running) {

                                        clearInterval(pollInterval);

                                        setTimeout(() => {

                                            if (pData.stage !== 'error') {

                                                showNotification('Sincronización completada', 'success');

                                                if (document.getElementById('view-list').style.display === 'block') fetchData();

                                            } else {

                                                showNotification(pData.message, 'error');

                                            }

                                            if (inlineContainer && triggerBtn) {

                                                inlineContainer.style.display = 'none';

                                                triggerBtn.style.display = 'inline-block';

                                                triggerBtn.disabled = false;

                                                triggerBtn.innerHTML = '<span style="margin-right: 5px;">+</span> Buscar Nuevos Registros';

                                            }

                                        }, 1500);

                                    }

                                });

                            }, 1000);

                        } else {

                            showNotification(data2.message, data2.status === 'success' ? 'success' : 'error');

                            if (inlineContainer && triggerBtn) {

                                inlineContainer.style.display = 'none';

                                triggerBtn.style.display = 'inline-block';

                                triggerBtn.disabled = false;

                                triggerBtn.innerHTML = '<span style="margin-right: 5px;">+</span> Buscar Nuevos Registros';

                            }

                        }

                    })

                    .catch(e => {

                        console.error("Fetch Error", e);

                        showNotification('Error al iniciar sincronización', 'error');

                    });

            } else {

                if (!silent) showNotification('No hay nuevos registros.', 'success');

                if (btn) {

                    btn.disabled = false;

                    btn.innerHTML = '<span style="margin-right: 5px;">+</span> Buscar Nuevos Registros';

                }

            }

        })

        .catch(err => {

            console.error('Check Net Error:', err);

            if (!silent) showNotification('Error de conexión', 'error');

            if (btn) {

                btn.disabled = false;

                btn.innerHTML = '<span style="margin-right: 5px;">+</span> Buscar Nuevos Registros';

            }

        });

}

// ------ ACTIVITY SUBMISSION LOGIC ------

let pendingSubmissionData = null;

function validateAndSubmitActivity() {
    const blocks = document.querySelectorAll('.activity-entry-block');
    const activities = [];
    const errors = [];
    const descWarnings = [];

    blocks.forEach((block, index) => {
        const projectInput = block.querySelector('.project-input');
        const timeInput = block.querySelector('input[type="hidden"].time-input-dynamic');
        const descInput = block.querySelector('textarea');

        const project = projectInput ? projectInput.value.trim() : '';
        const time = timeInput ? timeInput.value : '0';
        const desc = descInput ? descInput.value.trim() : '';

        // Validation 1: Project
        if (!project) {
            errors.push(`Bloque ${index + 1}: Seleccione un proyecto.`);
        }

        // Validation 2: Time
        const tVal = parseFloat(time);
        if (isNaN(tVal) || tVal <= 0) {
            errors.push(`Bloque ${index + 1}: El tiempo debe ser mayor a 0.`);
        }

        // Warning: Desc
        if (!desc && project) {
            descWarnings.push(project);
        }

        if (project && tVal > 0) {
            activities.push({
                project: project,
                time: time,
                description: desc
            });
        }
    });

    if (errors.length > 0) {
        showNotification(errors.join('<br>'), 'error');
        return;
    }

    if (activities.length === 0) {
        showNotification("Debe agregar al menos una actividad.", 'error');
        return;
    }

    // Calculate Total Time
    let totalTime = 0;
    activities.forEach(a => totalTime += parseFloat(a.time) || 0);

    if (totalTime > 10) {
        showNotification("La sumatoria de Horas en Proyectos supera el permitido", 'error');
        return;
    }

    const payload = {
        date: currentActivityDate,
        activities: activities
    };

    if (descWarnings.length > 0) {
        const msg = `Falta la descripción para: <strong>${descWarnings.join(', ')}</strong>.<br>¿Desea continuar sin ella?`;
        showCustomConfirm('Falta Descripción', msg, 'Volver', 'Continuar', (confirmed) => {
            if (confirmed) {
                if (typeof showSubmissionConfirmation === 'function') {
                    showSubmissionConfirmation(payload);
                } else {
                    doSubmitActivity(payload);
                }
            }
        });
    } else {
        if (typeof showSubmissionConfirmation === 'function') {
            showSubmissionConfirmation(payload);
        } else {
            doSubmitActivity(payload);
        }
    }
}

function doSubmitActivity(payload) {

    showNotification('Guardando registro...', 'info');

    fetch('/api/submit-activity', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload)

    })

        .then(res => res.json())

        .then(data => {

            if (data.status === 'success') {

                showNotification('Registro guardado correctamente.', 'success');

                showNotification('Registro guardado correctamente.', 'success');
                setTimeout(() => {
                    // Logic to "Approve" (Simulate done) -> Just go back to pending list
                    showActivityPending();
                }, 1000);

            } else {

                showNotification('Error al guardar: ' + data.content, 'error');

            }

        })

        .catch(err => {

            showNotification('Error de conexión.', 'error');

        });

}

// Custom Modal Logic REPLACEMENT

// Modal logic moved to lines 583+ (Unified)

function showUploadView() {

    localStorage.setItem('lastView', 'upload');

    hideAllViews();

    document.getElementById('view-upload').style.display = 'block';

    animateEntry('view-upload');

    // Reset Upload State

    // resetUploadForm(); // Legacy removed

    fetchManualPOList();

}

function hideAllViews() {
    // If leaving logistics calculator, reset its state
    const vLogNow = document.getElementById('view-logistics');
    if (vLogNow && vLogNow.style.display !== 'none') {
        if (typeof resetLogisticsCalculator === 'function') resetLogisticsCalculator();
    }

    document.getElementById('view-home').style.display = 'none';

    const vHomeReg = document.getElementById('view-home-registros');
    if (vHomeReg) vHomeReg.style.display = 'none';

    const vHomeBase = document.getElementById('view-home-base-datos');
    if (vHomeBase) vHomeBase.style.display = 'none';

    const vHomeHerr = document.getElementById('view-home-herramientas');
    if (vHomeHerr) vHomeHerr.style.display = 'none';


    document.getElementById('view-sub-home').style.display = 'none';

    document.getElementById('view-upload').style.display = 'none';

    document.getElementById('view-iso-menu').style.display = 'none';

    const statsView = document.getElementById('view-activity-stats');
    if (statsView) statsView.style.display = 'none';

    const app = document.getElementById('app');

    app.style.display = 'none';

    // Restore header if hidden by history view

    const appHeader = app.querySelector('.panel-header');

    if (appHeader) appHeader.style.display = 'flex';

    document.getElementById('view-auxiliar').style.display = 'none';

    const histDetail = document.getElementById('aux-historial-detail-view');

    if (histDetail) histDetail.style.display = 'none';

    // Hide Activity History View

    const actHist = document.getElementById('view-activity-history-detail');

    if (actHist) actHist.style.display = 'none';

    // Hide Planilla Views

    const pMenu = document.getElementById('view-planilla-menu');

    if (pMenu) pMenu.style.display = 'none';

    const pGen = document.getElementById('view-planilla-generator');

    if (pGen) pGen.style.display = 'none';

    const pUp = document.getElementById('view-planilla-upload');

    if (pUp) pUp.style.display = 'none';

    const pList = document.getElementById('view-planilla-list');

    if (pList) pList.style.display = 'none';

    // Hide Profile View if exists

    const pv = document.getElementById('view-profile');

    if (pv) pv.style.display = 'none';

    // Hide Activity Views

    const vActSub = document.getElementById('view-sub-home-activity');

    if (vActSub) vActSub.style.display = 'none';

    const vActPending = document.getElementById('view-activity-pending');

    if (vActPending) vActPending.style.display = 'none';

    const vActRec = document.getElementById('view-activity-records-menu');

    if (vActRec) vActRec.style.display = 'none';

    const vActEntry = document.getElementById('view-activity-entry');

    if (vActEntry) vActEntry.style.display = 'none';

    // Hide ISO New Registry Form
    const vIsoNew = document.getElementById('view-iso-new-registry');
    if (vIsoNew) vIsoNew.style.display = 'none';

    const vIsoControl = document.getElementById('view-iso-control');
    if (vIsoControl) vIsoControl.style.display = 'none';

    const vIsoInfo = document.getElementById('view-iso-info-menu');
    if (vIsoInfo) vIsoInfo.style.display = 'none';

    const vIsoTrack = document.getElementById('view-iso-tracking');
    if (vIsoTrack) vIsoTrack.style.display = 'none';

    const vIsoGantt = document.getElementById('view-iso-gantt');
    if (vIsoGantt) vIsoGantt.style.display = 'none';

    const vIsoFolder = document.getElementById('view-iso-folder');
    if (vIsoFolder) vIsoFolder.style.display = 'none';

    // NEW: Hide Projects & Solids Views
    const vProj = document.getElementById('view-projects');
    if (vProj) vProj.style.display = 'none';

    const vSol = document.getElementById('view-solids');
    if (vSol) vSol.style.display = 'none';

    const vLog = document.getElementById('view-logistics');
    if (vLog) vLog.style.display = 'none';

    const vLogMenu = document.getElementById('view-logistics-menu');
    if (vLogMenu) vLogMenu.style.display = 'none';

    const vLogRec = document.getElementById('view-logistics-records');
    if (vLogRec) vLogRec.style.display = 'none';

}

async function fetchManualPOList() {

    const wrapper = document.getElementById('manual-po-list');

    const content = document.getElementById('manual-po-content');

    if (!wrapper || !content) return;

    wrapper.style.display = 'block';

    content.innerHTML = '<tr><td colspan="4" class="text-center" style="color: var(--text-secondary);">Cargando registros...</td></tr>';

    try {

        const res = await fetch('/api/manual-po-list');

        const data = await res.json();

        window.manualPOData = data; // Store for filtering

        if (!Array.isArray(data) || data.length === 0) {

            content.innerHTML = '<tr><td colspan="4" class="text-center" style="color: var(--text-secondary); font-size: 0.9rem;">No se encontraron POs en resumen_all.</td></tr>';

            return;

        }

        renderManualPOList(data);

    } catch (e) {

        console.error(e);

        content.innerHTML = '<tr><td colspan="4" class="text-center" style="color: red;">Error al leer resumen_all.</td></tr>';

    }

}

function renderManualPOList(data) {

    const content = document.getElementById('manual-po-content');

    if (!content) return;

    content.innerHTML = '';

    if (data.length === 0) {

        content.innerHTML = '<tr><td colspan="4" class="text-center" style="color: var(--text-secondary);">No se encontraron coincidencias.</td></tr>';

        return;

    }

    data.forEach(item => {

        const po = item.po || item.PO || '-';

        const fecha = item.fecha_ingreso || '-';

        const count = item.count != null ? item.count : '-';

        const row = document.createElement('tr');

        row.innerHTML = `

            <td class="text-center">${po}</td>

            <td class="text-center">${fecha}</td>

            <td class="text-center">${count}</td>

            <td class="text-center">

                <button class="btn btn-register-manual" data-po="${po}">Registrar</button>

            </td>

        `;

        content.appendChild(row);

    });

}

function filterManualPOList(input) {

    const query = input.value.toLowerCase().trim();

    if (!window.manualPOData) return;

    if (!query) {

        renderManualPOList(window.manualPOData);

        return;

    }

    const filtered = window.manualPOData.filter(item => {

        const po = String(item.po || item.PO || '').toLowerCase();

        return po.includes(query);

    });

    renderManualPOList(filtered);

}

async function registerManualPO(poId) {

    const msg = `

        <div style="text-align: center;">

            <p style="margin-bottom: 10px;">¿Está seguro de registrar la PO <strong>${poId}</strong>?</p>

            <p style="color: #999; font-size: 0.85rem;">Se creará una nueva carpeta de registros pendientes.</p>

        </div>

    `;

    showConfirm(msg, async () => {

        window.isProcessing = true;

        showNotification(`Registrando PO ${poId}...`, 'info');

        // Switch to Main View to show the button animation

        showPOModule();

        const mainBtn = document.querySelector('button[onclick="showUploadView()"]');

        let originalText = '';

        if (mainBtn) {

            originalText = mainBtn.innerHTML;

            mainBtn.disabled = true;

            mainBtn.classList.add('pulsing-btn');

            mainBtn.innerHTML = '<span class="spinner" style="width:12px; height:12px; border-width:2px; display:inline-block; margin-right:5px;"></span> Cargando';

        }

        try {

            const response = await fetch('/api/manual-register-po', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ po_id: poId })

            });

            const data = await response.json();

            if (data.status === 'success') {

                // REMOVED NOTIFICATION: showNotification(`Ejecutando descarga de archivos...`, 'info');

                // Trigger Step 2

                try {

                    const res2 = await fetch('/api/run-step2-manual', { method: 'POST' });

                    const dat2 = await res2.json();

                    if (dat2.status === 'success') {

                        // Refresh Data

                        fetchData();

                        checkInitialSyncState();

                    } else {

                        showNotification('Carpeta creada pero error en descarga: ' + dat2.message, 'warning');

                    }

                } catch (e) {

                    showNotification('Error al ejecutar script de descarga', 'error');

                }

            } else {

                showNotification(data.message, 'error');

            }

        } catch (e) {

            console.error(e);

            showNotification('Error de conexión', 'error');

        } finally {

            window.isProcessing = false;



            if (mainBtn) {

                mainBtn.disabled = false;

                mainBtn.classList.remove('pulsing-btn');

                if (originalText) mainBtn.innerHTML = originalText;

                else mainBtn.innerHTML = '<span style="margin-right: 5px;">+</span> Cargar Registro Manual';

            }

        }

    }, "Confirmar Registro");

}

async function showProfileView() {

    localStorage.setItem('lastView', 'profile');

    hideAllViews();

    const burger = document.getElementById('burger-dropdown');

    if (burger) burger.style.display = 'none';

    document.getElementById('app').style.display = 'block';

    // Hide other app subviews

    document.getElementById('view-list').style.display = 'none';

    document.getElementById('view-detail').style.display = 'none';

    document.getElementById('view-product').style.display = 'none';

    const adminView = document.getElementById('view-admin');

    if (adminView) adminView.style.display = 'none';

    // Show Profile

    const profileView = document.getElementById('view-profile');

    if (profileView) {

        profileView.style.display = 'block';

        animateEntry('view-profile');

    }

    // Update Header

    const titleEl = document.getElementById('main-title');

    titleEl.innerHTML = `<span class="breadcrumb-link" onclick="showHome()">Oficina Técnica</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="current" style="color:var(--text-primary);">Mi Perfil</span>`;

    const headerActions = document.getElementById('header-actions');

    headerActions.innerHTML = `<button class="btn" onclick="showHome()">&larr; Volver</button>`;

    // Populate Data

    document.getElementById('profile-display-name').innerText = currentDisplayName;

    document.getElementById('profile-username').innerText = currentUser;

    document.getElementById('profile-role-badge').innerText = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

    document.getElementById('setting-display-name').value = currentDisplayName;

    // Profile Pic

    const imgEl = document.getElementById('profile-img-lg');

    if (currentProfilePic) {

        imgEl.src = `/api/profile/photo/${currentProfilePic}`;

        imgEl.style.objectFit = 'cover';

        imgEl.style.background = 'transparent';

    } else {

        imgEl.src = '/static/assets/iso_red.png';

        imgEl.style.objectFit = 'contain';

        imgEl.style.background = 'white';

    }

    // Load History

    await renderProfileHistory();

}

async function updateProfileSettings() {

    const newName = document.getElementById('setting-display-name').value.trim();

    const newPass = document.getElementById('setting-password').value;

    const confirmPass = document.getElementById('setting-confirm-password').value;

    if (!newName) {

        showNotification('El nombre no puede estar vacío', 'info');

        return;

    }

    if (newPass && newPass !== confirmPass) {

        showNotification('Las contraseñas no coinciden', 'error');

        return;

    }

    try {

        const response = await fetch('/api/profile/update', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                display_name: newName,

                password: newPass || null

            })

        });

        const res = await response.json();

        if (res.status === 'success') {

            showNotification('Perfil actualizado correctamente', 'success');

            currentDisplayName = newName;

            document.getElementById('profile-display-name').innerText = newName;

            // Clear password fields

            document.getElementById('setting-password').value = '';

            document.getElementById('setting-confirm-password').value = '';

            // Refresh history

            renderProfileHistory();

        } else {

            showNotification(res.message, 'error');

        }

    } catch (e) {

        showNotification('Error al actualizar perfil', 'error');

    }

}

async function uploadProfilePic(input) {

    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    const formData = new FormData();

    formData.append('file', file);

    showNotification('Subiendo imagen...', 'info');

    try {

        const response = await fetch('/api/profile/upload_photo', {

            method: 'POST',

            body: formData

        });

        const res = await response.json();

        if (res.status === 'success') {

            showNotification('Imagen actualizada', 'success');

            // Update UI

            currentProfilePic = res.filename;

            // Add Timestamp to bust cache

            document.getElementById('profile-img-lg').src = `/api/profile/photo/${res.filename}?t=${new Date().getTime()}`;

            // Refresh history

            renderProfileHistory();

        } else {

            showNotification(res.message, 'error');

        }

    } catch (e) {

        console.error(e);

        showNotification('Error al subir imagen', 'error');

    }

}

async function renderProfileHistory() {

    const tbody = document.querySelector('#profile-history-table tbody');

    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

    try {

        const response = await fetch('/api/profile/history');

        const logs = await response.json();

        tbody.innerHTML = '';

        if (!logs || logs.length === 0 || logs.status === 'error') {

            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay actividad reciente</td></tr>';

            return;

        }

        logs.forEach(log => {

            const tr = document.createElement('tr');

            // Format Date

            let dateStr = log.timestamp || '-';

            try {

                // Assuming "YYYY-MM-DD HH:MM:SS"

                const [dPart, tPart] = dateStr.split(' ');

                const [y, m, d] = dPart.split('-');

                const [hh, mm] = tPart.split(':');

                dateStr = `<div style="display:flex; flex-direction:column;">

                    <span style="font-weight:600; color:var(--text-primary);">${d}/${m}/${y}</span>

                    <span style="font-size:0.85rem; color:var(--text-secondary);">${hh}:${mm}</span>

                </div>`;

            } catch (e) { }

            // Format Action Badge

            let actionText = log.action;

            let badgeColor = '#95a5a6'; // Gray default

            let badgeBg = 'rgba(149, 165, 166, 0.15)';

            const act = log.action.toUpperCase();

            if (act.includes('APPROVED PO') || act.includes('APPROVED USER')) {

                actionText = 'Aprobado';

                badgeColor = '#2ecc71'; // Green

                badgeBg = 'rgba(46, 204, 113, 0.15)';

            } else if (act.includes('UPDATED PO PROGRESS')) {

                actionText = 'Progreso PO';

                badgeColor = '#3498db'; // Blue

                badgeBg = 'rgba(52, 152, 219, 0.15)';

            } else if (act.includes('REVERSED')) {

                actionText = 'Revertido';

                badgeColor = '#e67e22'; // Orange

                badgeBg = 'rgba(230, 126, 34, 0.15)';

            } else if (act.includes('CSV')) {

                actionText = 'CSV Editado';

                badgeColor = '#9b59b6'; // Purple

                badgeBg = 'rgba(155, 89, 182, 0.15)';

            } else if (act.includes('UPLOAD')) {

                actionText = 'Subida';

                badgeColor = '#1abc9c'; // Teal

                badgeBg = 'rgba(26, 188, 156, 0.15)';

            }

            tr.innerHTML = `

                <td style="vertical-align: middle; text-align: center;">${dateStr}</td>

                <td style="vertical-align: middle; text-align: center;">

                    <span style="

                        display: inline-block;

                        padding: 4px 10px;

                        border-radius: 12px;

                        font-size: 0.75rem;

                        font-weight: 600;

                        text-transform: uppercase;

                        letter-spacing: 0.5px;

                        color: ${badgeColor};

                        background: ${badgeBg};

                        border: 1px solid ${badgeColor}40;

                        white-space: nowrap;

                    ">${actionText}</span>

                </td>

                <td style="vertical-align: middle; color:var(--text-secondary); font-size: 0.9rem;">

                    ${log.details}

                </td>

             `;

            tbody.appendChild(tr);

        });

    } catch (e) {

        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Error al cargar historial</td></tr>';

    }

}

async function showAuxiliarIndices() {

    hideAllViews();

    document.getElementById('view-auxiliar').style.display = 'block';

    // Show Menu, Hide others

    const menuView = document.getElementById('aux-menu-view');

    const listView = document.getElementById('aux-list-view');

    const historialView = document.getElementById('aux-historial-view');

    const detailView = document.getElementById('aux-detail-view');

    if (menuView) menuView.style.display = 'block';

    if (listView) listView.style.display = 'none';

    if (historialView) historialView.style.display = 'none';

    if (detailView) detailView.style.display = 'none';

    const histDetail = document.getElementById('aux-historial-detail-view');

    if (histDetail) histDetail.style.display = 'none';

    animateEntry('aux-menu-view');

    // Reset Header Actions (Remove Search) and set Back to SubHome

    const headerRight = document.getElementById('aux-header-right');

    if (headerRight) {

        headerRight.innerHTML = `<button class="btn" onclick="showSubHome()">&larr; Volver</button>`;

    }

    // RESET Title to default

    const titleEl = document.getElementById('aux-title');

    if (titleEl) titleEl.innerText = 'Registros';

}

// New R016 List Handler

async function showR016List() {

    localStorage.setItem('lastView', 'r016');

    hideAllViews();

    document.getElementById('view-auxiliar').style.display = 'block';

    document.getElementById('aux-menu-view').style.display = 'none';

    document.getElementById('aux-historial-view').style.display = 'none'; // Ensure other views are hidden

    document.getElementById('aux-detail-view').style.display = 'none';

    document.getElementById('aux-list-view').style.display = 'block';

    animateEntry('aux-list-view');

    // Update Header Actions: Search + Back to Menu

    const headerRight = document.getElementById('aux-header-right');

    if (headerRight) {

        headerRight.innerHTML = `

            <div style="display: flex; gap: 1rem; align-items: center;">

                <input type="text" placeholder="Buscar registro..." class="search-input" style="max-width: 250px;" onkeyup="filterTable(this, 'aux-files-table')">

                <button class="btn" onclick="openR016Folder()">Carpeta Original</button>

                <button class="btn" onclick="showAuxiliarIndices()">&larr; Volver</button>

            </div>

        `;

    }

    // Update Title with Breadcrumb

    const titleEl = document.getElementById('aux-title');

    if (titleEl) {

        titleEl.innerHTML = `

            <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span style="color:var(--text-primary);">R016-01</span>

        `;

    }

    const tbody = document.querySelector('#aux-files-table tbody');

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando registros...</td></tr>';

    try {

        const response = await fetch('/api/auxiliar-indices');

        const files = await response.json();

        tbody.innerHTML = '';

        if (!files || files.length === 0) {

            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron registros auxiliares.</td></tr>';

            return;

        }

        files.forEach(fileData => {

            const filename = fileData.name || fileData;

            const date = fileData.date || '-';

            const author = fileData.author || '-';

            const tr = document.createElement('tr');

            const displayName = filename.replace('.csv', '').replace(/_/g, ' ');

            tr.innerHTML = `

                <td style="font-weight: 500;">${displayName}</td>

                <td>${date}</td>

                <td>${author}</td>

                <td>

                    <button class="btn btn-sm" onclick="viewAuxiliarCSV('${filename}')">Registro</button>

                </td>

                <td>

                     <button class="btn btn-sm" style="color:var(--text-primary); border-color:var(--text-secondary);" onclick="showPlanillaMenu('${filename}')">Planilla</button>

                </td>

            `;

            tbody.appendChild(tr);

        });

    } catch (e) {

        console.error("Auxiliar Error:", e);

        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:red;">Error al cargar registros.</td></tr>';

    }

}

async function viewAuxiliarCSV(filename) {

    localStorage.setItem('lastView', 'aux-csv');

    localStorage.setItem('lastViewParam', filename);

    const listView = document.getElementById('aux-list-view');

    const detailView = document.getElementById('aux-detail-view');

    const tableContainer = document.getElementById('aux-table-container');

    // Switch views

    listView.style.display = 'none';

    detailView.style.display = 'block';

    animateEntry('aux-detail-view');

    // Update Header Actions: Just Back button pointing to R016 List

    const headerRight = document.getElementById('aux-header-right');

    if (headerRight) {

        headerRight.innerHTML = `

            <button class="btn" onclick="showR016List()">&larr; Volver</button>

        `;

    }

    // Update Title with Breadcrumb

    const cleanName = filename.replace('.csv', '').replace(/_/g, ' ');

    const titleEl = document.getElementById('aux-title');

    if (titleEl) {

        titleEl.innerHTML = `

            <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span class="breadcrumb-link" onclick="showR016List()">R016-01</span>

             <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span style="color:var(--text-primary);">${cleanName}</span>

        `;

    }

    // Clear previous content

    tableContainer.innerHTML = '<p class="text-center">Cargando datos del registro...</p>';

    try {

        const response = await fetch(`/api/auxiliar-csv/${encodeURIComponent(filename)}`);

        const data = await response.json();

        if (data.status === 'error') {

            tableContainer.innerHTML = `<p class="text-center" style="color:red;">Error: ${data.message}</p>`;

            return;

        }

        if (!data.headers || data.headers.length === 0 || !data.rows || data.rows.length === 0) {

            tableContainer.innerHTML = '<p class="text-center">El archivo CSV está vacío o no tiene el formato esperado.</p>';

            return;

        }

        let tableHtml = '<table class="csv-data-table" id="aux-csv-table"><thead><tr>';

        data.headers.forEach(header => {

            tableHtml += `<th>${header}</th>`;

        });

        tableHtml += '</tr></thead><tbody>';

        data.rows.forEach(row => {

            tableHtml += '<tr>';

            row.forEach(cell => {

                tableHtml += `<td>${cell || ''}</td>`;

            });

            tableHtml += '</tr>';

        });

        tableHtml += '</tbody></table>';

        tableContainer.innerHTML = tableHtml;

    } catch (e) {

        console.error("Error loading CSV:", e);

        tableContainer.innerHTML = `<p class="text-center" style="color:red;">Error al cargar el archivo CSV: ${e.message}</p>`;

    }

}

// New Historial PO List Handler

async function showHistorialPOList() {

    localStorage.setItem('lastView', 'historial');

    hideAllViews();

    document.getElementById('view-auxiliar').style.display = 'block';

    document.getElementById('aux-menu-view').style.display = 'none';

    document.getElementById('aux-list-view').style.display = 'none';

    document.getElementById('aux-detail-view').style.display = 'none';

    document.getElementById('aux-historial-detail-view').style.display = 'none';

    document.getElementById('aux-historial-view').style.display = 'block';

    animateEntry('aux-historial-view');

    // Update Header Actions: Search + Back to Menu

    const headerRight = document.getElementById('aux-header-right');

    if (headerRight) {

        headerRight.innerHTML = `

            <div style="display: flex; gap: 1rem; align-items: center;">

                <input type="text" placeholder="Buscar PO..." class="search-input" style="max-width: 250px;" onkeyup="filterTable(this, 'historial-po-table')">

                <button class="btn" onclick="showAuxiliarIndices()">&larr; Volver</button>

            </div>

        `;

    }

    // Update Title with Breadcrumb

    const titleEl = document.getElementById('aux-title');

    if (titleEl) {

        titleEl.innerHTML = `

            <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span style="color:var(--text-primary);">Historial de PO</span>

        `;

    }

    const tbody = document.querySelector('#historial-po-table tbody');

    // Ensure Headers are centered too (can do via CSS but ensure here just in case)

    const thead = document.querySelector('#historial-po-table thead tr');

    if (thead) Array.from(thead.children).forEach(th => th.style.textAlign = 'center');

    tbody.innerHTML = '<tr><td colspan="9" class="text-center">Cargando historial...</td></tr>';

    try {

        const response = await fetch('/api/historial-po');

        const pos = await response.json();

        tbody.innerHTML = '';

        if (!pos || pos.length === 0) {

            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No se encontraron registros procesados.</td></tr>';

            return;

        }

        pos.forEach(po => {

            const tr = document.createElement('tr');

            // 1. Date Format: Remove time

            const dateOnly = po.fecha_aprobado ? po.fecha_aprobado.split(' ')[0] : '-';

            // 2. Progress Bar Status

            const approved = po.counts ? po.counts.approved : 0;

            const total = po.counts ? po.counts.total : 0;

            const percent = total > 0 ? Math.round((approved / total) * 100) : 0;

            // Color logic

            let barColor = '#e67e22'; // Default Orange (1-99%)

            if (percent === 100) barColor = '#2ecc71'; // Green

            else if (percent === 0) barColor = '#e74c3c'; // Red

            // Status Cell HTML

            const statusHtml = `

                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">

                    <div style="font-size: 0.85rem; font-weight: bold; color: ${barColor};">${percent}%</div>

                    <div style="width: 80px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">

                        <div style="width: ${percent}%; height: 100%; background: ${barColor}; border-radius: 3px;"></div>

                    </div>

                <div style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap;">${approved}/${total} productos</div>

                </div>

            `;

            tr.innerHTML = `

                <td style="text-align: center; font-weight: bold;">${po.id}</td>

                <td style="text-align: center;">${po.proveedor || '-'}</td>

                <td style="text-align: center;">${po.fecha_po || '-'}</td>

                <td style="text-align: center;">${po.fecha_ingreso}</td>

                <td style="text-align: center;">${dateOnly}</td>

                <td style="text-align: center;">${po.aprobado_por}</td>

                <td style="text-align: center;">${statusHtml}</td>

                <td style="text-align: center;">

                    <button class="btn btn-sm" onclick="viewHistorialDetails('${po.id}')">Ver Productos</button>

                </td>

                <td style="text-align: center;">

                    <button class="btn btn-sm" style="border-color: var(--text-secondary); color: white;" onclick="confirmModifyPO('${po.id}', '${dateOnly}')">Modificar</button>

                </td>

            `;

            tbody.appendChild(tr);

        });

    } catch (e) {

        console.error("Historial Error:", e);

        tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="color:red;">Error al cargar historial.</td></tr>';

    }

}

// View Details for History PO

async function viewHistorialDetails(poId) {

    localStorage.setItem('lastView', 'historial-detail');

    localStorage.setItem('lastViewParam', poId);

    // 1. Hide/Show Views

    hideAllViews();

    document.getElementById('view-auxiliar').style.display = 'block';

    // Ensure detail view is hidden when entering list, but here we show it

    document.getElementById('aux-historial-view').style.display = 'none';

    const detailView = document.getElementById('aux-historial-detail-view');

    detailView.style.display = 'block';

    // Fix for "Bug": Ensure previous content is cleared or handled

    // The "Back" button in this view calls showHistorialPOList.

    // We need to make sure showHistorialPOList HIDES this view. (See updated showHistorialPOList)

    animateEntry('aux-historial-detail-view');

    // 2. Update Breadcrumbs (Deep linking)

    const titleEl = document.getElementById('aux-title');

    if (titleEl) {

        titleEl.innerHTML = `

            <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span class="breadcrumb-link" onclick="showHistorialPOList()">Historial de PO</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span style="color:var(--text-primary);">${poId}</span>

        `;

    }

    // Update Header Actions: Search + Back to List

    const headerRight = document.getElementById('aux-header-right');

    if (headerRight) {

        headerRight.innerHTML = `

            <div style="display: flex; gap: 1rem; align-items: center;">

                <input type="text" placeholder="Buscar producto..." class="search-input" style="max-width: 250px;" onkeyup="filterTable(this, 'historial-products-table')">

                <button class="btn" onclick="showHistorialPOList()">&larr; Volver</button>

            </div>

        `;

    }

    const tbody = document.querySelector('#historial-products-table tbody');

    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando productos...</td></tr>';

    try {

        const response = await fetch(`/api/historial-po-details/${poId}`);

        const products = await response.json();

        tbody.innerHTML = '';

        if (!products || products.length === 0) {

            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron productos en esta carpeta.</td></tr>';

            return;

        }

        products.forEach(p => {

            // Clean Name: Remove .pdf and PO Prefix

            let displayName = p.name.replace('.pdf', '');

            // Remove PO ID prefix (case insensitive check or exact)

            const escapedId = poId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const prefixRegex = new RegExp('^' + escapedId + '[-_ ]*', 'i');

            displayName = displayName.replace(prefixRegex, '');

            const dateOnly = p.fecha_aprobado !== '-' ? p.fecha_aprobado.split(' ')[0] : '-';

            // Extract code (Try to find 5 digit code like 51310, else first word)

            const codeMatch = displayName.match(/\b\d{5}\b/);

            let productCode = codeMatch ? codeMatch[0] : displayName.split(' ')[0];

            const tr = document.createElement('tr');

            const isPending = p.status && p.status.toLowerCase() === 'pendiente';

            const badgeClass = isPending ? 'pending' : 'approved';

            const badgeText = isPending ? 'Pendiente' : 'Aprobado';

            tr.innerHTML = `

                <td style="text-align: center; font-weight: bold;">${displayName}</td>

                <td style="text-align: center;"><span class="status-badge ${badgeClass}">${badgeText}</span></td>

                <td style="text-align: center;">${dateOnly}</td>

                <td style="text-align: center;">${p.aprobado_por}</td>

                <td style="text-align: center;">

                    <button class="btn btn-sm" onclick="openHistoryProduct('${poId}', '${p.name}', '${productCode}')">Ver Registro</button>

                </td>

                <td style="text-align: center;">

                    <div style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 5px; color: var(--bpb-blue); transition: transform 0.2s;" 

                         onclick="window.open('/files/${encodeURIComponent(p.path)}', '_blank')"

                         onmouseover="this.style.transform='scale(1.2)'" 

                         onmouseout="this.style.transform='scale(1)'">

                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>

                    </div>

                </td>

             `;

            tbody.appendChild(tr);

        });

    } catch (e) {

        console.error(e);

        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">Error loading details: ${e.message}</td></tr>`;

    }

}

// Open Product Detail for History Item (Rich View)

async function openHistoryProduct(poId, pdfName, productCode) {

    hideAllViews();

    // SHOW APP CONTAINER because view-product is inside it

    const app = document.getElementById('app');

    app.style.display = 'block';

    // Hide the main app header to avoid duplication

    const mainHeader = app.querySelector('.panel-header');

    if (mainHeader) mainHeader.style.display = 'none';

    document.getElementById('view-list').style.display = 'none';

    document.getElementById('view-detail').style.display = 'none';

    document.getElementById('view-product').style.display = 'block';

    // Inject Custom Back Button for History Context

    // Clean display name for breadcrumb

    let crumbName = pdfName.replace('.pdf', '');

    const escapedId = poId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const prefixRegex = new RegExp('^' + escapedId + '[-_ ]*', 'i');

    crumbName = crumbName.replace(prefixRegex, '');

    const header = `

        <div class="panel-header">

             <div class="panel-title decorated-title">

                <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

                <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

                <span class="breadcrumb-link" onclick="showHistorialPOList()">Historial de PO</span>

                <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

                <span class="breadcrumb-link" onclick="viewHistorialDetails('${poId}')">${poId}</span>

                <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

                ${crumbName}

             </div>

             <div class="header-right">

                <button class="btn" onclick="viewHistorialDetails('${poId}')">&larr; Volver a la PO</button>

            </div>

        </div>

    `;

    const content = document.getElementById('product-content');

    content.innerHTML = header;

    // 1. Fetch CSV Data for "Datos Extraídos"

    let csvSectionHtml = '<div style="padding: 1rem; color: #999;">Cargando datos extraídos...</div>';

    let realCodeForAux = null;

    try {

        const res = await fetch('/api/historial-product-csv-match', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ po_id: poId, product_code: productCode })

        });

        const json = await res.json();

        if (json.status === 'success' && json.data) {

            const d = json.data;

            // Build Table

            const headersHtml = d.headers.map(h => `<th>${h}</th>`).join('');

            const rowHtml = d.row.map(c => `<td>${c}</td>`).join('');

            // Extract Code for Aux Lookup (Row 0, Col 0)

            if (d.row && d.row.length > 0) {

                realCodeForAux = d.row[0];

            }

            csvSectionHtml = `

                 <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 6px; margin-bottom: 1rem; border: 1px solid var(--border);">

                    <div style="font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem;">Archivo de Origen: ${d.filename}</div>

                 </div>

                 <div class="table-container">

                     <table class="csv-data-table product-detail-table" style="width: 100%;">

                        <thead>

                            <tr>

                                ${headersHtml}

                            </tr>

                        </thead>

                        <tbody>

                            <tr>${rowHtml}</tr>

                        </tbody>

                     </table>

                 </div>

             `;

        } else {

            csvSectionHtml = '<div style="padding: 1rem; color: var(--text-secondary);">No se encontró información CSV para este producto en la carpeta.</div>';

        }

    } catch (e) {

        csvSectionHtml = `<div style="padding: 1rem; color: red;">Error al cargar CSV: ${e.message}</div>`;

    }

    // PDF View

    const pdfUrl = `/files/${encodeURIComponent(poId)}/${encodeURIComponent(pdfName)}`;

    const bodyHtml = `

        <div class="detail-section">

             <h3 style="color: #ce1919; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 1rem;">Datos Extraídos de Plano</h3>

             ${csvSectionHtml}

        </div>

        

        <div class="detail-section" style="margin-top: 2rem;">

            <div id="history-aux-container-${productCode}" style="min-height: 50px;">

                <span class="spinner"></span> Buscando información...

            </div>

        </div>

        

        <div class="detail-section" style="margin-top: 2rem;">

            <h3 style="color: #ce1919; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Plano del Producto</h3>

             <div class="pdf-container" style="height: 600px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-top: 1rem;">

                <iframe src="${pdfUrl}" width="100%" height="100%" style="border: none;"></iframe>

            </div>

        </div>

    `;

    const div = document.createElement('div');

    div.innerHTML = bodyHtml;

    content.appendChild(div);

    // Load Aux Data (Reuse loadAuxTable logic)

    if (window.loadAuxTable && realCodeForAux) {

        window.loadAuxTable(poId, realCodeForAux, `history-aux-container-${productCode}`);

        // Remove text if needed or handled by loadAuxTable

    } else {

        const auxContainer = document.getElementById(`history-aux-container-${productCode}`);

        if (auxContainer) {

            auxContainer.innerHTML = '<div style="padding: 1rem; color: var(--text-secondary); font-style: italic;">No se pudo identificar el código de producto para cargar datos auxiliares.</div>';

        }

    }

}

// Confirm Actions

// Confirm Actions

function confirmModifyPO(poId, date) {

    console.log("Requesting modification for:", poId);

    const msg = `

        <div style="text-align: center;">

            <p style="margin-bottom: 10px;">¿Desea modificar la <strong>${poId}</strong> aprobada el <strong>${date}</strong>?</p>

            <p style="color: #999; font-size: 0.85rem;">El registro volverá a la lista de "Registros Pendientes".</p>

        </div>

    `;

    // Explicitly binding the callback to ensure it persists

    const confirmationAction = () => {

        console.log("Confirmation received for modification:", poId);

        showNotification('Procesando solicitud...', 'info');

        // Trigger Reverse Approval

        fetch('/api/reverse-approval', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ po_id: poId })

        })

            .then(async res => {

                console.log("API Response Status:", res.status);

                const contentType = res.headers.get("content-type");

                if (contentType && contentType.indexOf("application/json") !== -1) {

                    return res.json();

                } else {

                    const text = await res.text();

                    throw new Error("Respuesta no válida del servidor: " + text);

                }

            })

            .then(data => {

                console.log("API Data:", data);

                if (data.status === 'success') {

                    showNotification('Registro movido a En Progreso', 'success');

                    // Refresh List

                    if (typeof showHistorialPOList === 'function') {

                        showHistorialPOList();

                    } else {

                        console.warn("showHistorialPOList function missing");

                    }

                    // Update Pending List Counter in Background

                    if (window.refreshPOData) window.refreshPOData();

                } else {

                    showNotification(data.message || "Error desconocido", 'error');

                }

            })

            .catch(err => {

                console.error("Modify Fetch Error:", err);

                showNotification("Error de conexión: " + err.message, 'error');

            });

    };

    showConfirm(msg, confirmationAction, "Confirmación");

}

// Export functions to window

window.showR016List = showR016List;

window.showHistorialPOList = showHistorialPOList;

async function openR016Folder() {

    try {

        const res = await fetch('/api/open-r016-folder');

        const data = await res.json();

        if (data.status === 'success') {

            showNotification('Abriendo carpeta original...', 'success');

        } else {

            showNotification(data.message || 'No se pudo abrir la carpeta', 'error');

        }

    } catch (e) {

        console.error(e);

        showNotification('Error al abrir la carpeta', 'error');

    }

}

// --- Planilla Views Logic ---

let currentPlanillaContext = '';

function showPlanillaMenu(filename) {

    currentPlanillaContext = filename;

    document.getElementById('planilla-context-label').innerText = filename.replace('.csv', '').replace(/_/g, ' ');

    hideAllViews();

    const menu = document.getElementById('view-planilla-menu');

    menu.style.display = 'block';

    animateEntry('view-planilla-menu');

    // Update Header Back Button to go to R016 List

    const backBtn = document.querySelector('#view-planilla-menu .panel-header .btn');

    if (backBtn) backBtn.onclick = showR016List;

    // Update Breadcrumb Title

    const titleEl = document.getElementById('planilla-menu-title');

    if (titleEl) {

        titleEl.innerHTML = `

            <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span class="breadcrumb-link" onclick="showR016List()">R016-01</span>

             <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span style="color:var(--text-primary);">Gestionar Planillas</span>

        `;

    }

}

function backToPlanillaMenu() {

    hideAllViews();

    document.getElementById('view-planilla-menu').style.display = 'block';

    animateEntry('view-planilla-menu');

}

function showPlanillaGenerator() {

    if (!currentPlanillaContext.includes('R016-01') && !currentPlanillaContext.includes('rod. de bolas')) {

        // Simple check, can be more robust

    }

    hideAllViews();

    document.getElementById('view-planilla-generator').style.display = 'block';

    animateEntry('view-planilla-generator');

    // Update Breadcrumb - Generator

    const titleEl = document.getElementById('gen-title');

    if (titleEl) {

        titleEl.innerHTML = `

            <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span class="breadcrumb-link" onclick="showR016List()">R016-01</span>

             <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

             <span class="breadcrumb-link" onclick="backToPlanillaMenu()">Gestionar Planillas</span>

             <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span style="color:var(--text-primary);">Generar</span>

        `;

    }

    // Reset fields

    document.getElementById('planilla-product-search').value = '';

    document.getElementById('product-suggestions').style.display = 'none';

    document.getElementById('preview-product-name').innerText = '-';

}

function showPlanillaUpload() {

    hideAllViews();

    document.getElementById('view-planilla-upload').style.display = 'block';

    animateEntry('view-planilla-upload');

    // Update Breadcrumb - Upload

    const titleEl = document.getElementById('upload-title');

    if (titleEl) {

        titleEl.innerHTML = `

            <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span class="breadcrumb-link" onclick="showR016List()">R016-01</span>

             <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

             <span class="breadcrumb-link" onclick="backToPlanillaMenu()">Gestionar Planillas</span>

             <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span style="color:var(--text-primary);">Cargar</span>

        `;

    }

    resetPlanillaUploadForm();

}

function showPlanillaList() {

    hideAllViews();

    document.getElementById('view-planilla-list').style.display = 'block';

    animateEntry('view-planilla-list');

    // Update Breadcrumb - List

    const titleEl = document.getElementById('list-title');

    if (titleEl) {

        titleEl.innerHTML = `

            <span class="breadcrumb-link" onclick="showAuxiliarIndices()">Registros</span>

            <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span class="breadcrumb-link" onclick="showR016List()">R016-01</span>

             <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

             <span class="breadcrumb-link" onclick="backToPlanillaMenu()">Gestionar Planillas</span>

             <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span>

            <span style="color:var(--text-primary);">Registradas</span>

        `;

    }

    loadPlanillaFiles(); // We will implement this

}

// --- PLANILLA JS LOGIC ---

// Debounce for search

let productSearchTimeout = null;

function handleProductSearch(input) {

    const query = input.value;

    const suggestionsBox = document.getElementById('product-suggestions');

    if (query.length < 2) {

        suggestionsBox.style.display = 'none';

        return;

    }

    if (productSearchTimeout) clearTimeout(productSearchTimeout);

    productSearchTimeout = setTimeout(async () => {

        try {

            const response = await fetch('/api/planilla/search-product', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({

                    context: currentPlanillaContext,

                    query: query

                })

            });

            const results = await response.json();

            suggestionsBox.innerHTML = '';

            if (results.length > 0) {

                suggestionsBox.style.display = 'block';

                results.forEach(prod => {

                    const div = document.createElement('div');

                    div.className = 'suggestion-item';

                    div.style.padding = '8px 12px';

                    div.style.cursor = 'pointer';

                    div.style.borderBottom = '1px solid var(--border)';

                    div.style.background = 'var(--card-bg)';

                    div.innerText = prod;

                    div.onmouseover = () => div.style.background = 'var(--bpb-blue)';

                    div.onmouseout = () => div.style.background = 'var(--card-bg)';

                    div.onclick = () => selectProductForPlanilla(prod);

                    suggestionsBox.appendChild(div);

                });

            } else {

                suggestionsBox.style.display = 'none';

            }

        } catch (e) {

            console.error(e);

        }

    }, 300);

}

function selectProductForPlanilla(productName) {

    document.getElementById('planilla-product-search').value = productName;

    document.getElementById('product-suggestions').style.display = 'none';

    document.getElementById('preview-product-name').innerText = productName;

    // Here we would ideally fetch the specs and update the preview overlay

}

function resetPlanillaUploadForm() {

    document.getElementById('fileInputPlanilla').value = '';

    document.getElementById('upload-placeholder-planilla').style.display = 'flex';

    document.getElementById('preview-container-planilla').style.display = 'none';

    document.getElementById('planilla-filename').innerText = '';

    document.getElementById('image-preview-planilla').src = '';

    document.getElementById('btn-upload-planilla').disabled = true; // Disable until file selected

}

function handlePlanillaFileSelect(input) {

    if (input.files && input.files[0]) {

        const file = input.files[0];

        document.getElementById('planilla-filename').innerText = file.name;

        document.getElementById('upload-placeholder-planilla').style.display = 'none';

        document.getElementById('preview-container-planilla').style.display = 'block';

        document.getElementById('btn-upload-planilla').disabled = false;

        const previewImg = document.getElementById('image-preview-planilla');

        if (file.type.startsWith('image/')) {

            const reader = new FileReader();

            reader.onload = function (e) {

                previewImg.src = e.target.result;

                previewImg.style.display = 'block';

            }

            reader.readAsDataURL(file);

        } else {

            // For PDF or others, maybe show generic icon?

            // Or just hide the image tag?

            previewImg.src = '/static/assets/iso_red.png'; // Fallback or generic icon

            // Ideally we shouldn't show it if it's not an image, but user asked for "copy exactly". 

            // We'll stick to displaying it if it is an image.

        }

    }

}

async function uploadPlanillaFile() {

    const input = document.getElementById('fileInputPlanilla');

    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    const formData = new FormData();

    formData.append('file', file);

    formData.append('context', currentPlanillaContext);

    showNotification('Subiendo planilla...', 'info');

    try {

        const response = await fetch('/api/planilla/upload', {

            method: 'POST',

            body: formData

        });

        const res = await response.json();

        if (res.status === 'success') {

            showNotification('Planilla cargada correctamente', 'success');

            backToPlanillaMenu();

        } else {

            showNotification(res.message, 'error');

        }

    } catch (e) {

        showNotification('Error al subir planilla', 'error');

    }

}

async function loadPlanillaFiles() {

    const container = document.getElementById('planilla-files-container');

    container.innerHTML = '<p>Cargando archivos...</p>';

    try {

        const response = await fetch(`/api/planilla/list/${encodeURIComponent(currentPlanillaContext)}`);

        const data = await response.json();

        container.innerHTML = '';

        if (!data.files || data.files.length === 0) {

            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay planillas registradas.</p>';

            return;

        }

        data.files.forEach(file => {

            const ext = file.split('.').pop().toLowerCase();

            let icon = 'ð';

            if (['jpg', 'png', 'jpeg'].includes(ext)) icon = 'ð¼ï¸';

            if (['pdf'].includes(ext)) icon = 'ð';

            const card = document.createElement('div');

            card.className = 'dashboard-card active-card';

            card.style.minHeight = '120px';

            card.style.padding = '1.5rem';

            // On click, maybe open file?

            card.onclick = () => window.open(`/api/serve-planilla/${encodeURIComponent(data.folder)}/${encodeURIComponent(file)}`, '_blank');

            card.innerHTML = `

                <div style="font-size: 2rem;">${icon}</div>

                <div style="font-size: 0.9rem; margin-top: 10px; word-break: break-all;">${file}</div>

            `;

            container.appendChild(card);

        });

    } catch (e) {

        container.innerHTML = '<p style="color:red;">Error al cargar lista.</p>';

    }

}

async function generatePlanillaPDF() {

    const product = document.getElementById('planilla-product-search').value;

    if (!product) {

        showNotification('Seleccione un producto primero', 'warning');

        return;

    }

    showNotification('Generando Planilla...', 'info');

    try {

        const response = await fetch('/api/planilla/generate-pdf', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                context: currentPlanillaContext,

                product: product

            })

        });

        const res = await response.json();

        if (res.status === 'success' && res.download_url) {

            showNotification('Planilla generada', 'success');

            // Trigger download

            window.location.href = res.download_url;

        } else {

            showNotification('Error al generar', 'error');

        }

    } catch (e) {

        showNotification('Error de conexión', 'error');

    }

}

function showListView() {

    document.getElementById('view-detail').style.display = 'none';

    document.getElementById('view-product').style.display = 'none';

    const adminView = document.getElementById('view-admin');

    if (adminView) adminView.style.display = 'none';

    document.getElementById('view-list').style.display = 'block';

    animateEntry('view-list');

    // removed searchInput.value = ''; to avoid crash

    renderPOList(allData);
    if (typeof loadPendingActivities === 'function') { loadPendingActivities(); }

    currentPO = null;

    document.getElementById('main-title').innerHTML = 'Registros pendientes';

    // Inject Search + Back to Sub-Home Button

    const headerActions = document.getElementById('header-actions');

    headerActions.innerHTML = `

        <div style="display: flex; gap: 1rem; align-items: center;">

            <input type="text" id="po-search-header" placeholder="Buscar PO..." class="search-input" style="max-width: 250px;" onkeyup="handlePOSearch(this)">

            <button class="btn" onclick="showSubHome()">&larr; Volver</button>

        </div>

    `;

}

// --- Upload Feature Logic ---

let fileToUpload = null;

// Drag & Drop

const dropZone = document.getElementById('drop-zone');

if (dropZone) {

    dropZone.addEventListener('dragover', (e) => {

        e.preventDefault();

        dropZone.classList.add('drag-over');

    });

    dropZone.addEventListener('dragleave', (e) => {

        e.preventDefault();

        dropZone.classList.remove('drag-over');

    });

    dropZone.addEventListener('drop', (e) => {

        e.preventDefault();

        dropZone.classList.remove('drag-over');

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {

            handleFile(e.dataTransfer.files[0]);

        }

    });

}

// Paste Image

document.addEventListener('paste', (e) => {

    // Only handle paste if we are in upload view

    if (document.getElementById('view-upload').style.display === 'none') return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;

    for (const item of items) {

        if (item.type.indexOf('image') !== -1) {

            const blob = item.getAsFile();

            handleFile(blob);

        }

    }

});

function handleFileSelect(input) {

    if (input.files && input.files[0]) {

        handleFile(input.files[0]);

    }

}

function handleFile(file) {

    // Validate Image

    if (!file.type.startsWith('image/')) {

        showNotification('Por favor sube un archivo de imagen válido', 'error');

        return;

    }

    fileToUpload = file;

    // Preview

    const reader = new FileReader();

    reader.onload = (e) => {

        document.getElementById('image-preview').src = e.target.result;

        document.getElementById('upload-placeholder').style.display = 'none';

        document.getElementById('preview-container').style.display = 'block';

        document.getElementById('btn-upload').disabled = false;

    };

    reader.readAsDataURL(file);

}

function resetUploadForm() {

    fileToUpload = null;

    document.getElementById('fileInput').value = '';

    document.getElementById('upload-placeholder').style.display = 'block';

    document.getElementById('preview-container').style.display = 'none';

    document.getElementById('image-preview').src = '';

    document.getElementById('btn-upload').disabled = true;

}

async function uploadFile() {

    if (!fileToUpload) return;

    const formData = new FormData();

    formData.append('file', fileToUpload);

    const btn = document.getElementById('btn-upload');

    const originalText = btn.innerText;

    btn.innerText = 'Subiendo...';

    btn.disabled = true;

    try {

        const response = await fetch('/api/upload', {

            method: 'POST',

            body: formData

        });

        const result = await response.json();

        if (result.status === 'success') {

            showNotification('Archivo subido correctamente: ' + result.filename, 'success');

            resetUploadForm();

            // Trigger Automation

            showNotification('Ejecutando automatización...', 'info');

            try {

                // Non-blocking fetch (or await if we want to show success of automation)

                // User said "se accionara", usually implying chain event.

                await fetch('/api/run-automation', { method: 'POST' });

                showNotification('Procesamiento completado', 'success');

            } catch (e) { console.error("Auto trigger error", e); }

        } else {

            showNotification('Error al subir: ' + result.message, 'error');

        }

    } catch (e) {

        console.error(e);

        showNotification('Error de red al subir archivo.', 'error');

    } finally {

        btn.innerText = originalText;

        btn.disabled = false;

    }

}

// Modal Logic

function examineImage(img) {

    const modal = document.getElementById('image-modal');

    const modalImg = document.getElementById('modal-image');

    modal.style.display = "block";

    modalImg.src = img.src;

}

function closeModal() {

    document.getElementById('image-modal').style.display = "none";

}

// --- UI Utilities ---

// --- Admin Logic ---

let adminUsersCache = [];

function resetAdminSections() {
    ['admin-home', 'admin-users-view', 'admin-stats-menu'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function setupAdminShell(opts = {}) {
    localStorage.setItem('lastView', 'admin');
    hideAllViews();

    const app = document.getElementById('app');
    if (app) app.style.display = 'block';

    const list = document.getElementById('view-list');
    if (list) list.style.display = 'none';
    const detail = document.getElementById('view-detail');
    if (detail) detail.style.display = 'none';
    const product = document.getElementById('view-product');
    if (product) product.style.display = 'none';

    const adminView = document.getElementById('view-admin');
    if (!adminView) return null;

    adminView.style.display = 'block';
    animateEntry('view-admin');

    const titleEl = document.getElementById('main-title');
    if (titleEl) {
        titleEl.innerHTML = opts.title || `<span class="breadcrumb-link" onclick="showHome()">Oficina T&eacute;cnica</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="current" style="color:var(--text-primary);">Panel de Control</span>`;
    }

    const headerActions = document.getElementById('header-actions');
    if (headerActions) {
        const backAction = opts.backAction || 'showHome()';
        headerActions.innerHTML = `<button class="btn" onclick="${backAction}">&larr; Volver</button>`;
    }

    if (!document.getElementById('admin-upload-input')) {
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'admin-upload-input';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.onchange = (e) => uploadProfilePicAdmin(e.target);
        document.body.appendChild(input);
    }

    return adminView;
}

async function showAdminPanel() {
    const adminView = setupAdminShell({
        title: `<span class="breadcrumb-link" onclick="showHome()">Oficina T&eacute;cnica</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="current" style="color:var(--text-primary);">Panel de Control</span>`,
        backAction: 'showHome()'
    });
    if (!adminView) return;

    resetAdminSections();
    const home = document.getElementById('admin-home');
    if (home) home.style.display = 'block';

    await loadAdminUsers();
}

async function showAdminUsers() {
    const adminView = setupAdminShell({
        title: `<span class="breadcrumb-link" onclick="showHome()">Oficina T&eacute;cnica</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="breadcrumb-link" onclick="showAdminPanel()">Panel de Control</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="current" style="color:var(--text-primary);">Usuarios</span>`,
        backAction: 'showAdminPanel()'
    });
    if (!adminView) return;

    resetAdminSections();
    const usersView = document.getElementById('admin-users-view');
    if (usersView) usersView.style.display = 'block';

    await loadAdminUsers();
}

function showAdminStatsMenu() {
    const adminView = setupAdminShell({
        title: `<span class="breadcrumb-link" onclick="showHome()">Oficina T&eacute;cnica</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="breadcrumb-link" onclick="showAdminPanel()">Panel de Control</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="current" style="color:var(--text-primary);">Estad&iacute;sticas</span>`,
        backAction: 'showAdminPanel()'
    });
    if (!adminView) return;

    resetAdminSections();
    const statsMenu = document.getElementById('admin-stats-menu');
    if (statsMenu) statsMenu.style.display = 'block';
}

async function showAdminActivityStats() {
    const title = `<span class="breadcrumb-link" onclick="showHome()">Oficina T&eacute;cnica</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="breadcrumb-link" onclick="showAdminPanel()">Panel de Control</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="breadcrumb-link" onclick="showAdminStatsMenu()">Estad&iacute;sticas</span> <span style="color:var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="current" style="color:var(--text-primary);">Registro de Actividad</span>`;
    const headerActions = document.getElementById('header-actions');
    if (headerActions) headerActions.innerHTML = `<button class="btn" onclick="showAdminStatsMenu()">&larr; Volver</button>`;
    const titleEl = document.getElementById('main-title');
    if (titleEl) titleEl.innerHTML = title;

    // Set filter to yesterday's date automatically
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().slice(0, 10);

    statsDayRangeStart = yesterdayISO;
    statsDayRangeEnd = yesterdayISO;
    statsYear = yesterday.getFullYear();
    statsStartMonth = yesterday.getMonth();
    statsEndMonth = yesterday.getMonth();

    await showActivityStats({
        breadcrumbHtml: `<span class="breadcrumb-link" onclick="showHome()">Oficina T&eacute;cnica</span> <span style="color: var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="breadcrumb-link" onclick="showAdminPanel()">Panel de Control</span> <span style="color: var(--bpb-blue); margin: 0 10px;">&gt;</span> <span class="breadcrumb-link" onclick="showAdminStatsMenu()">Estad&iacute;sticas</span><span style="color: var(--bpb-blue); margin: 0 10px;">&gt;</span> Registro de Actividad`,
        backAction: 'showAdminStatsMenu()',
        fetchUrl: '/api/activity-stats-global',
        storageKey: 'admin-activity-stats',
        title: 'Registro de Actividad'
    });
}

async function loadAdminUsers() {
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';

    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();

        if (users.status === 'error') {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--bpb-blue)">${users.message}</td></tr>`;
            return;
        }

        adminUsersCache = users; // Cache for search
        renderUsers(users);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">Error loading users</td></tr>`;
    }
}

function renderUsers(users) {

    const tbody = document.querySelector('#users-table tbody');

    tbody.innerHTML = '';

    if (users.length === 0) {

        tbody.innerHTML = `<tr><td colspan="5" class="text-center">No users found</td></tr>`;

        return;

    }

    users.forEach(u => {

        const tr = document.createElement('tr');

        // Role Select

        // Role Select

        const roleSelect = `

            <select class="role-select" onchange="updateUserRole('${u.username}', this.value)">

                <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>

                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>

                <option value="externos" ${u.role === 'externos' ? 'selected' : ''}>Externos</option>

            </select>

        `;

        // Actions

        let actionButtons = '';

        if (u.status !== 'approved') {

            actionButtons += `

                <button class="btn btn-sm" style="padding: 4px 8px; font-size: 0.8rem; margin-right: 5px; color: var(--success); border-color: var(--success);" onclick="confirmAction('approve', '${u.username}')">Aprobar</button>

            `;

        }

        // History Button (Only for approved users)

        if (u.status === 'approved') {

            actionButtons += `

                <button class="btn btn-sm" style="padding: 4px 8px; font-size: 0.8rem; margin-right: 5px; color: var(--text-secondary); border-color: var(--text-secondary);" onclick="viewUserHistory('${u.username}')">Historial</button>

            `;

        }

        // Delete/Reject Button (Always available to remove access)

        // Delete/Reject Button (Always available to remove access)

        actionButtons += `

            <button class="btn btn-sm" style="padding: 4px 8px; font-size: 0.8rem; color: #ff6b6b; border-color: #ff6b6b;" onclick="confirmAction('delete', '${u.username}')">X</button>

        `;

        // Status Badge

        // Status Badge

        const statusBadge = `<span class="status-badge ${u.status}">${u.status}</span>`;

        // Profile Pic

        const imgSrc = u.profile_pic ? `/api/profile/photo/${u.profile_pic}` : '/static/assets/iso_red.png';

        const imgHtml = `

            <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; cursor: pointer; border: 2px solid transparent; background: white; display: flex; align-items: center; justify-content: center;" 

                 onmouseover="this.style.borderColor='var(--bpb-blue)'" 

                 onmouseout="this.style.borderColor='transparent'"

                 onclick="triggerAdminUpload('${u.username}')"

                 title="Click para cambiar foto">

                <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: contain;">

            </div>

        `;

        tr.innerHTML = `

            <td>${imgHtml}</td>

            <td>${u.username}</td>

            <td>${roleSelect}</td>

            <td>${statusBadge}</td>

            <td>${u.created_at}</td>

            <td>${actionButtons}</td>

        `;

        tbody.appendChild(tr);

    });

}

async function viewUserHistory(username) {

    showNotification('Cargando historial...', 'info');

    try {

        const response = await fetch(`/api/admin/history/${username}`);

        const logs = await response.json();

        if (logs.status === 'error') {

            showNotification(logs.message, 'error');

            return;

        }

        renderHistoryModal(logs, username);

    } catch (e) {

        showNotification('Error cargando historial', 'error');

    }

}

function renderHistoryModal(logs, username) {

    const modalId = 'history-modal';

    let existing = document.getElementById(modalId);

    if (existing) existing.remove();

    // Formatting timestamp if needed, but python sends formatted string

    const rows = logs.length ? logs.map(log => {

        // Date Format logic

        let dateStr = log.timestamp || '-';

        try {

            const [dPart, tPart] = dateStr.split(' ');

            const [y, m, d] = dPart.split('-');

            const [hh, mm] = tPart.split(':');

            dateStr = `<div style="display:flex; flex-direction:column; align-items: center;">

                    <span style="font-weight:600; color:var(--text-primary);">${d}/${m}/${y}</span>

                    <span style="font-size:0.85rem; color:var(--text-secondary);">${hh}:${mm}</span>

                </div>`;

        } catch (e) { }

        // Badge Logic

        let actionText = log.action;

        let badgeColor = '#95a5a6';

        let badgeBg = 'rgba(149, 165, 166, 0.15)';

        const act = log.action.toUpperCase();

        if (act.includes('APPROVED PO') || act.includes('APPROVED USER') || act.includes('MANUAL REGISTER')) {

            actionText = 'Aprobado';

            if (act.includes('MANUAL REGISTER')) actionText = 'Reg. Manual';

            badgeColor = '#2ecc71';

            badgeBg = 'rgba(46, 204, 113, 0.15)';

        } else if (act.includes('UPDATED PO PROGRESS')) {

            actionText = 'Progreso PO';

            badgeColor = '#3498db';

            badgeBg = 'rgba(52, 152, 219, 0.15)';

        } else if (act.includes('REVERSED')) {

            actionText = 'Revertido';

            badgeColor = '#e67e22';

            badgeBg = 'rgba(230, 126, 34, 0.15)';

        } else if (act.includes('CSV') || act.includes('EDIT')) {

            actionText = 'Editado';

            badgeColor = '#9b59b6';

            badgeBg = 'rgba(155, 89, 182, 0.15)';

        } else if (act.includes('UPLOAD')) {

            actionText = 'Subida';

            badgeColor = '#1abc9c';

            badgeBg = 'rgba(26, 188, 156, 0.15)';

        } else if (act.includes('ROLE')) {

            actionText = 'Rol Editado';

            badgeColor = '#f1c40f';

            badgeBg = 'rgba(241, 196, 15, 0.15)';

        }

        return `

        <tr>

            <td style="padding: 10px; border-bottom: 1px solid #333; vertical-align: middle; text-align: center;">${dateStr}</td>

            <td style="padding: 10px; border-bottom: 1px solid #333; vertical-align: middle; text-align: center;">

                 <span style="

                        display: inline-block;

                        padding: 4px 10px;

                        border-radius: 12px;

                        font-size: 0.75rem;

                        font-weight: 600;

                        text-transform: uppercase;

                        letter-spacing: 0.5px;

                        color: ${badgeColor};

                        background: ${badgeBg};

                        border: 1px solid ${badgeColor}40;

                        white-space: nowrap;

                    ">${actionText}</span>

            </td>

            <td style="padding: 10px; border-bottom: 1px solid #333; color: #ccc; font-size: 0.9rem; vertical-align: middle;">${log.details}</td>

        </tr>`;

    }).join('') : '<tr><td colspan="3" class="text-center" style="padding:20px; color: #aaa;">Sin actividad registrada</td></tr>';

    const modal = document.createElement('div');

    modal.id = modalId;

    modal.className = 'modal-overlay';

    modal.style.display = 'flex'; // Force flex for centering

    modal.innerHTML = `

        <div class="modal-confirm-wrapper" style="max-width: 800px; width: 90%; background: #1e1e1e; border: 1px solid #333;">

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid #333; padding-bottom: 1rem;">

                <h3 style="margin:0; font-size: 1.2rem; color: #fff;">Historial de Actividad: <span style="color: var(--bpb-blue);">${username}</span></h3>

                <span style="cursor:pointer; font-size: 1.5rem; color: #888; transition: 0.2s;" onclick="document.getElementById('${modalId}').remove()" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">&times;</span>

            </div>

            

            <div style="max-height: 500px; overflow-y: auto; background: #141414; border-radius: 6px; border: 1px solid #333; position: relative;">

                <table style="width: 100%; text-align: left; border-collapse: collapse;">

                    <thead>

                        <tr style="background: #252525;">

                            <th style="position: sticky; top: 0; background: #252525; padding: 12px 10px; border-bottom: 1px solid #444; color: #888; font-weight: 600; width: 15%; text-align: center; z-index: 10;">Fecha</th>

                            <th style="position: sticky; top: 0; background: #252525; padding: 12px 10px; border-bottom: 1px solid #444; color: #888; font-weight: 600; width: 20%; text-align: center; z-index: 10;">Acción</th>

                            <th style="position: sticky; top: 0; background: #252525; padding: 12px 10px; border-bottom: 1px solid #444; color: #888; font-weight: 600; z-index: 10;">Detalles</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${rows}

                    </tbody>

                </table>

            </div>

             <div style="text-align: right; margin-top: 1rem;">

                 <button class="btn" style="background: var(--bpb-blue); color:white;" onclick="document.getElementById('${modalId}').remove()">Cerrar</button>

            </div>

        </div>

    `;

    document.body.appendChild(modal);

}

// Custom Modal Confirmation

function confirmAction(type, username) {

    // Create Modal HTML

    const modalId = 'confirm-modal';

    let existing = document.getElementById(modalId);

    if (existing) existing.remove();

    const msg = type === 'approve' ? `¿Aprobar acceso para <b>${username}</b>?` : `¿Eliminar / Rechazar usuario <b>${username}</b>?`;

    const actionFn = type === 'approve' ? `approveUser('${username}')` : `deleteUser('${username}')`;

    const btnClass = type === 'approve' ? 'btn-primary' : 'btn';

    const btnText = type === 'approve' ? 'Aprobar' : 'Eliminar';

    // Using appended CSS for .modal-overlay, .modal-confirm-wrapper

    const modal = document.createElement('div');

    modal.id = modalId;

    modal.className = 'modal-overlay';

    modal.innerHTML = `

        <div class="modal-confirm-wrapper">

            <h3 style="margin-bottom: 1rem;">Confirmación</h3>

            <p>${msg}</p>

            <div class="modal-actions">

                <button class="btn" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>

                <button class="${btnClass} btn" onclick="${actionFn}; document.getElementById('${modalId}').remove()">${btnText}</button>

            </div>

        </div>

    `;

    document.body.appendChild(modal);

}

async function approveUser(username) {

    try {

        const response = await fetch('/api/admin/approve', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ username })

        });

        const res = await response.json();

        if (res.status === 'success') {

            showNotification('Usuario aprobado', 'success');

            showAdminUsers(); // Refresh

        } else {

            showNotification(res.message, 'error');

        }

    } catch (e) {

        showNotification('Error de conexión', 'error');

    }

}

async function deleteUser(username) {

    try {

        const response = await fetch('/api/admin/delete_user', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ username })

        });

        const res = await response.json();

        if (res.status === 'success') {

            showNotification('Usuario eliminado', 'success');

            showAdminUsers(); // Refresh

        } else {

            showNotification(res.message, 'error');

        }

    } catch (e) {

        showNotification('Error de conexión', 'error');

    }

}

async function updateUserRole(username, newRole) {

    try {

        const response = await fetch('/api/admin/update_role', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ username, role: newRole })

        });

        const res = await response.json();

        if (res.status === 'success') {

            showNotification('Rol actualizado', 'success');

        } else {

            showNotification(res.message, 'error');

            showAdminUsers(); // Revert on error

        }

    } catch (e) {

        showNotification('Error de conexión', 'error');

    }

}

// Override Standard Search for Admin

const originalFilter = filterData; // Preserve if needed, or just hook into input

const searchInputEl = document.getElementById('search-input');

if (searchInputEl) {

    searchInputEl.addEventListener('keyup', (e) => {

        const term = e.target.value.toLowerCase();

        // If Admin View is active

        if (document.getElementById('view-admin').style.display === 'block') {

            const filtered = adminUsersCache.filter(u =>

                u.username.toLowerCase().includes(term) ||

                u.role.toLowerCase().includes(term) ||

                u.status.toLowerCase().includes(term)

            );

            renderUsers(filtered);

        } else {

            // Default behavior is handled by existing listener in script.js ?? 

            // Existing script.js likely has `searchInput.addEventListener('input', filterData)`.

            // We can rely on that for non-admin views.

            // But existing listener calls `filterData()`. We need to intercept or ensure filterData doesn't break.

        }

    });

}

// Header and Admin Panel Logic

function handleAdminClick() {

    document.getElementById('burger-dropdown').style.display = 'none';

    if (window.currentUserRole === 'admin') {

        showAdminPanel();

    } else {

        showNotification('Acceso restringido a administradores', 'error');

    }

}

function toggleMenu() {

    const menu = document.getElementById('burger-dropdown');

    if (menu.style.display === 'none' || menu.style.display === '') {

        menu.style.display = 'block';

        // Show/Hide Admin Button

        const adminBtn = document.getElementById('btn-admin');

        if (adminBtn) {

            adminBtn.style.display = (window.currentUserRole === 'admin') ? 'block' : 'none';

        }

        // Close on click outside

        const closeMenu = (e) => {

            if (!e.target.closest('.header-right-actions')) {

                menu.style.display = 'none';

                document.removeEventListener('click', closeMenu);

            }

        };

        setTimeout(() => document.addEventListener('click', closeMenu), 0);

    } else {

        menu.style.display = 'none';

    }

}

// Global Exports

window.showAdminPanel = showAdminPanel;

window.approveUser = approveUser;

window.deleteUser = deleteUser;

window.updateUserRole = updateUserRole;

window.confirmAction = confirmAction;

window.toggleMenu = toggleMenu;

window.handleAdminClick = handleAdminClick;

window.currentUserRole = 'user'; // Default

function showNotification(message, type = 'success') {

    const container = document.getElementById('notification-container');

    const toast = document.createElement('div');

    toast.className = `notification-toast toast-${type}`;

    // Icon based on type

    const icon = type === 'success' ? '&#10003;' : '&#8505;';

    toast.innerHTML = `

        <div style="display:flex; align-items:center; gap:10px;">

            <span style="font-weight:bold; font-size:1.2rem;">${icon}</span>

            <span>${message}</span>

        </div>

        <span style="cursor:pointer; opacity:0.7; margin-left: 20px;" onclick="this.parentElement.remove()">&#10005;</span>

    `;

    container.appendChild(toast);

    // Remove after 5 seconds

    setTimeout(() => {

        toast.style.opacity = '0';

        toast.style.transform = 'translateX(100%)';

        setTimeout(() => toast.remove(), 300);

    }, 5000);

}

// Global Exports

window.login = login;

window.logout = logout;

window.showNotification = showNotification;

function animateEntry(elementId) {

    const el = document.getElementById(elementId);

    if (el) {

        el.classList.remove('animate-entry');

        void el.offsetWidth; // Force reflow

        el.classList.add('animate-entry');

    }

}

// Comet Spawner

function createComet() {

    const comet = document.createElement('div');

    comet.classList.add('comet');

    // Random position (Horizontal spread)

    const startX = Math.random() * window.innerWidth;

    comet.style.left = `${startX} px`;

    // Random duration (3s - 5s)

    const duration = 3 + Math.random() * 2;

    comet.style.animationDuration = `${duration} s`;

    // Random delay

    comet.style.animationDelay = `${Math.random()} s`;

    document.body.appendChild(comet);

    // Cleanup after animation

    setTimeout(() => {

        comet.remove();

    }, duration * 1000 + 1000);

}

// Start spawing comets

setInterval(createComet, 4000); // Less frequent (every 4s)

// Global Exports

window.viewUserHistory = viewUserHistory;

// --- Admin Upload Logic ---

let targetUploadUser = null;

function triggerAdminUpload(username) {

    targetUploadUser = username;

    document.getElementById('admin-upload-input').click();

}

async function uploadProfilePicAdmin(input) {

    if (!input.files || !input.files[0] || !targetUploadUser) return;

    const file = input.files[0];

    const formData = new FormData();

    formData.append('file', file);

    formData.append('target_user', targetUploadUser);

    showNotification(`Subiendo imagen para ${targetUploadUser}...`, 'info');

    try {

        const response = await fetch('/api/profile/upload_photo', {

            method: 'POST',

            body: formData

        });

        const res = await response.json();

        if (res.status === 'success') {

            showNotification('Imagen de usuario actualizada', 'success');

            // Refresh List

            showAdminUsers();

        } else {

            showNotification(res.message, 'error');

        }

    } catch (e) {

        console.error(e);

        showNotification('Error al subir imagen', 'error');

    }

    // Reset

    input.value = '';

    targetUploadUser = null;

}

// --- Auxiliar Table Helpers ---

function filterTable(input, tableId) {

    const filter = input.value.toUpperCase();

    const table = document.getElementById(tableId);

    if (!table) return;

    const trs = table.getElementsByTagName('tr');

    // Start from 1 to skip header

    for (let i = 1; i < trs.length; i++) {

        // Assume filtering by first column (index 0)

        let td = trs[i].getElementsByTagName('td')[0];

        if (td) {

            let txtValue = td.textContent || td.innerText;

            if (txtValue.toUpperCase().indexOf(filter) > -1) {

                trs[i].style.display = "";

            } else {

                trs[i].style.display = "none";

            }

        }

    }

}

function scrollToBottom(containerId) {

    const container = document.getElementById(containerId);

    if (container) {

        container.scrollTo({

            top: container.scrollHeight,

            behavior: 'smooth'

        });

    }

}

window.filterTable = filterTable;

function updateStickyColumns() {

    const table = document.querySelector('.csv-data-table');

    if (!table) return;

    // Get first row cells to measure

    const firstRow = table.querySelector('thead tr');

    if (!firstRow) return;

    const th1 = firstRow.children[0];

    if (th1) {

        // Measure first column width

        const col1Width = th1.getBoundingClientRect().width;

        // Apply to all 2nd column cells (th and td)

        const col2Cells = table.querySelectorAll('th:nth-child(2), td:nth-child(2)');

        col2Cells.forEach(cell => {

            cell.style.left = `${col1Width}px`;

        });

    }

}

function filterAuxTable() {

    const input = document.getElementById('auxSearchInput');

    const filter = input.value.toLowerCase();

    const table = document.querySelector('.csv-data-table');

    if (!table) return;

    const trs = table.getElementsByTagName('tr');

    // Start from 1 to skip header

    for (let i = 1; i < trs.length; i++) {

        const tr = trs[i];

        const tds = tr.getElementsByTagName('td');

        let show = false;

        // Check all cells

        for (let j = 0; j < tds.length; j++) {

            if (tds[j].textContent.toLowerCase().indexOf(filter) > -1) {

                show = true;

                break;

            }

        }

        tr.style.display = show ? '' : 'none';

    }

    // Re-calculate sticky offsets in case layout shifts

    updateStickyColumns();

}

// Global Exports

window.triggerAdminUpload = triggerAdminUpload;

window.uploadProfilePicAdmin = uploadProfilePicAdmin;

window.scrollToBottom = scrollToBottom;

window.filterAuxTable = filterAuxTable;

window.updateStickyColumns = updateStickyColumns;

function approvePORegistryV2(poId, btn) {

    const row = document.getElementById(`row-${poId}`);

    if (!row) return;

    // 1. Elements

    const idCell = row.querySelector('.po-id-cell strong');

    // 2. Clone

    const flyerId = idCell.cloneNode(true);

    const flyerBtn = btn.cloneNode(true);

    // 3. Rects

    const idRect = idCell.getBoundingClientRect();

    const btnRect = btn.getBoundingClientRect();

    const rowRect = row.getBoundingClientRect();

    // 4. Setup Flyers

    flyerId.className = 'fly-element';

    flyerId.style.top = idRect.top + 'px';

    flyerId.style.left = idRect.left + 'px';

    flyerId.style.width = idRect.width + 'px';

    flyerId.style.margin = '0';

    flyerId.style.color = 'var(--text-primary)';

    flyerId.style.display = 'flex';

    flyerId.style.alignItems = 'center';

    flyerBtn.className = 'fly-element';

    flyerBtn.style.top = btnRect.top + 'px';

    flyerBtn.style.left = btnRect.left + 'px';

    flyerBtn.style.width = btnRect.width + 'px';

    flyerBtn.style.height = btnRect.height + 'px';

    flyerBtn.style.background = 'transparent';

    flyerBtn.style.border = '1px solid #2ecc71';

    flyerBtn.style.color = '#2ecc71';

    flyerBtn.style.display = 'flex';

    flyerBtn.style.alignItems = 'center';

    flyerBtn.style.justifyContent = 'center';

    flyerBtn.innerHTML = 'Aprobar Registro';

    document.body.appendChild(flyerId);

    document.body.appendChild(flyerBtn);
    // 5. Hide action buttons to avoid doble click
    const rowButtons = row.querySelectorAll('button');
    rowButtons.forEach(b => { b.disabled = true; b.style.visibility = 'hidden'; });

    // 6. Reflow

    void flyerId.offsetWidth;

    // 7. Calculate Center Target (ROW Center)

    const centerX = rowRect.left + (rowRect.width / 2);

    const centerY = rowRect.top + (rowRect.height / 2);

    // 8. Animate

    // ID moves to left of center of ROW

    flyerId.style.left = (centerX - 60) + 'px';

    flyerId.style.top = centerY + 'px';

    flyerId.style.transform = 'translate(-50%, -50%) scale(1.5)';

    // Button moves to right of center and becomes fancy tick

    flyerBtn.style.left = (centerX + 60) + 'px';

    flyerBtn.style.top = centerY + 'px';

    flyerBtn.style.width = '42px';

    flyerBtn.style.height = '42px';

    flyerBtn.style.borderRadius = '50%';

    flyerBtn.style.border = '2px solid #2ecc71';

    flyerBtn.innerHTML = '&#10003;';

    flyerBtn.style.color = '#2ecc71';

    flyerBtn.style.fontSize = '1.8rem';

    flyerBtn.style.padding = '0';

    flyerBtn.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.3)';

    flyerBtn.style.background = 'rgba(0,0,0,0.8)';

    flyerBtn.style.transform = 'translate(-50%, -50%)';

    // 9. Glow and Vanish

    setTimeout(() => {

        flyerId.classList.add('fly-glow-burst');

        flyerBtn.classList.add('fly-glow-burst');

        // Remove Row

        row.remove();

    }, 1200);

    // 10. Cleanup

    setTimeout(() => {

        flyerId.remove();

        flyerBtn.remove();

        // Remove from data

        const idx = allData.findIndex(p => p.id === poId);

        if (idx > -1) allData.splice(idx, 1);

    }, 2000);

}

function approvePORegistryV3(poId, btn) {

    const row = document.getElementById(`row-${poId}`);

    if (!row) return;

    // 1. Clone Elements

    const idCell = row.querySelector('.po-id-cell strong');

    const flyerId = idCell.cloneNode(true);

    const flyerBtn = btn.cloneNode(true);

    // 2. Rects

    const idRect = idCell.getBoundingClientRect();

    const btnRect = btn.getBoundingClientRect();

    const rowRect = row.getBoundingClientRect();

    // 3. Setup Flyers

    flyerId.className = 'fly-element';

    flyerId.style.top = idRect.top + 'px';

    flyerId.style.left = idRect.left + 'px';

    flyerId.style.width = idRect.width + 'px';

    flyerId.style.margin = '0';

    flyerId.style.color = 'var(--text-primary)';

    flyerId.style.display = 'flex';

    flyerId.style.alignItems = 'center';

    flyerBtn.className = 'fly-element';

    flyerBtn.style.top = btnRect.top + 'px';

    flyerBtn.style.left = btnRect.left + 'px';

    flyerBtn.style.width = btnRect.width + 'px';

    flyerBtn.style.height = btnRect.height + 'px';

    flyerBtn.style.background = 'transparent';

    flyerBtn.style.border = '1px solid #2ecc71';

    flyerBtn.style.color = '#2ecc71';

    flyerBtn.style.display = 'flex';

    flyerBtn.style.alignItems = 'center';

    flyerBtn.style.justifyContent = 'center';

    flyerBtn.innerHTML = 'Aprobar Registro';

    document.body.appendChild(flyerId);

    document.body.appendChild(flyerBtn);

    // 4. Hide Originals visually (preserving space)

    row.style.visibility = 'hidden';

    void flyerId.offsetWidth; // Reflow

    // 5. Calculate Center Target (ROW Center)

    const centerX = rowRect.left + (rowRect.width / 2);

    const centerY = rowRect.top + (rowRect.height / 2);

    // 6. Animate Flight (1.2s flight)

    flyerId.style.left = (centerX - 60) + 'px';

    flyerId.style.top = centerY + 'px';

    flyerId.style.transform = 'translate(-50%, -50%) scale(1.5)';

    flyerBtn.style.left = (centerX + 60) + 'px';

    flyerBtn.style.top = centerY + 'px';

    flyerBtn.style.width = '42px';

    flyerBtn.style.height = '42px';

    flyerBtn.style.borderRadius = '50%';

    flyerBtn.style.border = '2px solid #2ecc71';

    flyerBtn.innerHTML = '&#10003;';

    flyerBtn.style.color = '#2ecc71';

    flyerBtn.style.fontSize = '1.8rem';

    flyerBtn.style.padding = '0';

    flyerBtn.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.3)';

    flyerBtn.style.background = 'rgba(0,0,0,0.8)';

    flyerBtn.style.transform = 'translate(-50%, -50%)';

    // 7. Glow (Starts at 1.2s, lasts 0.8s)

    setTimeout(() => {

        flyerId.classList.add('fly-glow-burst');

        flyerBtn.classList.add('fly-glow-burst');

    }, 1200);

    // 8. Collapse Row (Starts at 2.0s, after glow finishes)

    setTimeout(() => {

        row.style.visibility = 'visible'; // Visible for collapsing effect

        row.classList.add('row-collapsing');

        // Remove flyers

        flyerId.remove();

        flyerBtn.remove();

    }, 2000);

    // 9. Final Removal (Starts at 2.5s, 0.5s for collapse)

    setTimeout(() => {

        row.remove();

        // Remove from data source

        const idx = allData.findIndex(p => p.id === poId);

        if (idx > -1) allData.splice(idx, 1);

    }, 2500);

}

function approvePORegistryV4(poId, btn) {

    console.log("Starting approvePORegistryV4", poId);

    const po = allData.find(d => d.id === poId);

    if (!po) {

        console.error("PO not found in allData");

        return;

    }

    // Check Approval Status

    const products = po.files.pdfs || [];

    const total = products.length;

    const approvedList = getApprovedItems(poId);

    const approvedCount = approvedList.length;

    // Logic: If there are products and not all are approved -> Warning

    if (total > 0 && approvedCount < total) {

        const unapprovedCount = total - approvedCount;

        const msg = `

            Existen <strong>${unapprovedCount}</strong> Productos sin Registro Aprobado.<br>

            ¿Deseas aprobar igualmente el registro?<br><br>

            <span style="color: #bbb; font-size: 0.9rem;">Los productos no aprobados no seran cargados en Registros.</span>

        `;

        showConfirm(msg, () => {

            console.log("Confirmed approval for", poId);

            executeApprovalAnimation(poId, btn);

        }, 'Advertencia', '#e74c3c'); // Red title

    } else {

        // 100% or empty (handle as success)

        executeApprovalAnimation(poId, btn);

    }

}

function executeApprovalAnimation(poId, btn) {
    // 1. Setup Elements for Animation
    const row = document.getElementById(`row-${poId}`);
    if (!row) return;

    // Get table cell elements to animate
    const idCell = row.querySelector('.po-id-cell strong') || row.querySelector('td:first-child');
    if (!idCell) return; // Safety check

    // Clone for flight
    const flyerId = idCell.cloneNode(true);
    const flyerBtn = btn.cloneNode(true);

    const idRect = idCell.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();

    // Style Flyers
    flyerId.className = 'fly-element';
    flyerId.style.top = idRect.top + 'px';
    flyerId.style.left = idRect.left + 'px';
    flyerId.style.width = idRect.width + 'px';
    flyerId.style.margin = '0';
    flyerId.style.color = 'var(--text-primary)';
    flyerId.style.display = 'flex';
    flyerId.style.alignItems = 'center';
    flyerId.style.position = 'fixed'; // Ensure fixed positioning
    flyerId.style.zIndex = '9999';

    flyerBtn.className = 'fly-element';
    flyerBtn.style.top = btnRect.top + 'px';
    flyerBtn.style.left = btnRect.left + 'px';
    flyerBtn.style.width = btnRect.width + 'px';
    flyerBtn.style.height = btnRect.height + 'px';
    flyerBtn.style.position = 'fixed';
    flyerBtn.style.zIndex = '9999';
    flyerBtn.style.background = 'transparent';
    flyerBtn.style.border = '1px solid #2ecc71';
    flyerBtn.style.color = '#2ecc71';
    flyerBtn.style.display = 'flex';
    flyerBtn.style.alignItems = 'center';
    flyerBtn.style.justifyContent = 'center';
    flyerBtn.innerHTML = 'Aprobar Registro';

    document.body.appendChild(flyerId);
    document.body.appendChild(flyerBtn);

    // Hide original row content immediately
    // Force hide ALL children to bypass CSS transitions on buttons
    row.style.visibility = 'hidden';
    row.querySelectorAll('*').forEach(el => {
        el.style.visibility = 'hidden';
        el.style.transition = 'none'; // Kill transition
    });

    // Trigger Reflow
    void flyerId.offsetWidth;

    // Calculate Center (Row Center)
    const centerX = rowRect.left + (rowRect.width / 2);
    const centerY = rowRect.top + (rowRect.height / 2);

    // --- ANIMATION SEQUENCE ---
    // Move to center
    flyerId.style.transition = 'all 0.8s ease';
    flyerBtn.style.transition = 'all 0.8s ease';

    flyerId.style.left = (centerX - 60) + 'px';
    flyerId.style.top = centerY + 'px';
    flyerId.style.transform = 'translate(-50%, -50%) scale(1.5)';

    flyerBtn.style.left = (centerX + 60) + 'px';
    flyerBtn.style.top = centerY + 'px';
    flyerBtn.style.width = '42px';
    flyerBtn.style.height = '42px';
    flyerBtn.style.borderRadius = '50%';
    flyerBtn.style.border = '2px solid #2ecc71';
    flyerBtn.innerHTML = '&#10003;'; // Tick
    flyerBtn.style.fontSize = '1.8rem';
    flyerBtn.style.padding = '0';
    flyerBtn.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.3)';
    flyerBtn.style.background = 'rgba(0,0,0,0.8)';
    flyerBtn.style.transform = 'translate(-50%, -50%)';

    // Glow Effect
    setTimeout(() => {
        flyerId.classList.add('fly-glow-burst');
        flyerBtn.classList.add('fly-glow-burst');
    }, 800);

    // Collapse Row (Visual only, as it's already hidden)
    setTimeout(() => {
        row.style.display = 'none'; // definite removal from flow
        flyerId.remove();
        flyerBtn.remove();
    }, 1500);

    // Final Remove & Backend Call
    const approvedItems = typeof getApprovedItems === 'function' ? getApprovedItems(poId) : [];

    // DATA CLEANUP (Visual State Update - NO RELOAD)
    setTimeout(() => {
        row.remove();
        if (typeof allData !== 'undefined') {
            const idx = allData.findIndex(p => p.id === poId);
            if (idx > -1) allData.splice(idx, 1);
        }
        if (typeof updatePOCounterUI === 'function') updatePOCounterUI();

        // If empty, show message instead of reload
        if (typeof allData !== 'undefined' && allData.length === 0) {
            const tbody = document.getElementById('po-table-body');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2rem; color: #888;">No hay registros pendientes.</td></tr>';
        }
    }, 1600);

    // BACKEND CALL (Silent)
    fetch('/api/approve-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            po_id: poId,
            approved_count: approvedItems.length,
            total_count: 0,
            approved_items: approvedItems
        })
    }).then(res => res.json())
        .then(data => {
            if (data.status === 'success' || data.status === 'queued') {
                showNotification(`Orden ${poId} aprobada correctamente`, 'success');
            } else {
                showNotification(`Nota: ${data.message}`, 'info');
            }
        }).catch(err => {
            console.error(err);
            // showNotification(`Error de conexión al aprobar ${poId}`, 'error');
        });
}
// MASSIVE ZOMBIE CODE BLOCK REMOVED: ~4400 lines of orphaned animation logic

function renderActivityPendingTable() {
    const table = document.getElementById('activity-pending-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = ''; // Clear existing rows (including mock)

    if (!window._pendingActivities || window._pendingActivities.length === 0) {
        // Optional: Show "No pending activities" message
        // tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem; color:#888;">No hay registros pendientes.</td></tr>';
        return;
    }

    [...window._pendingActivities].forEach(act => {
        const isReady = act.locallyCompleted === true;

        const badgeClass = isReady ? 'status-badge success' : 'status-badge pending';
        const badgeText = isReady ? 'Completado' : 'PENDIENTE';

        const completeBtnText = isReady ? 'Editar Registro' : 'Completar Registro';

        // Approve Button State
        // If isReady is true, we ENABLE it. 
        // Style: If ready, show as standard green btn. If not, disabled style.
        const approveStyle = isReady
            ? 'cursor: pointer;'
            : 'opacity: 0.5; cursor: not-allowed; pointer-events: none;';

        const approveDisabled = isReady ? '' : 'disabled';
        const approveTitle = isReady ? 'Guardar definitivamente' : 'Debe completar el registro primero';

        const approveAction = isReady ? `onclick="approveActivity('${act.token}', this)"` : '';
        // ADDED ID for robust selection
        const btnId = `btn-approve-${act.token}`;

        const tr = document.createElement('tr');
        tr.id = `row-${act.token}`; // Start adding ID to row for easier lookup too if needed
        tr.innerHTML = `
            <td class="text-center">${act.date}</td>
            <td class="text-center" style="font-family: inherit; font-size: inherit;">${act.token}</td>
            <td class="text-center"><span class="${badgeClass}">${badgeText}</span></td>
            <td class="text-center">
                <button class="btn" style="font-size: 0.9rem;" onclick="showActivityEntryPending('${act.token}', '${act.date}')">
                   ${completeBtnText}
                </button>
            </td>
            <td class="text-center">
                <button id="${btnId}" class="btn btn-approve" ${approveDisabled} style="${approveStyle}" title="${approveTitle}" ${approveAction}>
                    Aprobar Registro
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openActivityModal(token, date) {
    // Redirect to the full view instead of modal
    showActivityEntryPending(token, date);
}

// ... Jumping to saveLocally ...
function saveLocally(token, payloads) {
    const idx = window._pendingActivities.findIndex(a => a.token === token);
    if (idx !== -1) {
        window._pendingActivities[idx].locallyCompleted = true;
        window._pendingActivities[idx].stagingData = payloads;
    }

    // Force UI Update
    const viewEntry = document.getElementById('view-activity-entry');
    const viewPending = document.getElementById('view-activity-pending');

    if (viewEntry) viewEntry.style.display = 'none';
    if (viewPending) viewPending.style.display = 'block';

    renderActivityPendingTable();

    // Automatic Approval after 0.5s
    setTimeout(() => {
        if (typeof approveActivity === 'function') {
            // Robust selection by ID
            const btn = document.getElementById(`btn-approve-${token}`);
            if (btn) {
                approveActivity(token, btn);
            } else {
                console.warn("Auto-approve button not found for token:", token);
                approveActivity(token);
            }
        }
    }, 500);
}

function openActivityModal(token, date) {
    // Redirect to the full view instead of modal
    showActivityEntryPending(token, date);
}

async function showActivityEntryPending(token, date) {
    hideAllViews();
    // Hide other views
    document.getElementById('view-activity-pending').style.display = 'none';
    document.getElementById('view-activity-entry').style.display = 'block';

    // Update Header
    document.getElementById('entry-date-crumb').textContent = date;

    // Clear or Pre-fill Inputs
    const projInput = document.getElementById('activity-input-project-0');
    const timeInput = document.getElementById('activity-input-time-0');
    const descInput = document.getElementById('activity-input-text-0');

    // Initialize time wheel if function exists
    if (typeof generateTimeWheel === 'function') {
        generateTimeWheel(0);
    }

    // Ensure autocomplete is wired for the main block
    if (!window._activityAutocompleteReady) {
        setupProjectAutocomplete(0);
        window._activityAutocompleteReady = true;
    }

    await refreshGlossaryCache(true);

    // Pre-fill
    const existingAct = window._pendingActivities.find(a => a.token === token);
    if (existingAct && existingAct.stagingData) {
        if (projInput) projInput.value = existingAct.stagingData.project || '';

        // Parse time back to number if possible for wheel/hidden input
        let tVal = existingAct.stagingData.time || '0';
        tVal = tVal.replace(' Horas', '').trim();
        if (timeInput) timeInput.value = tVal;
        if (tVal && tVal !== '0') {
            updateTimeWheelVisuals(0, tVal);
        }

        if (descInput) descInput.value = existingAct.stagingData.description || '';

        // If we have a time value, we might want to visually update the wheel selected state 
        // (This would require specific wheel logic knowledge, skipping for safety unless critical)
    } else {
        if (projInput) projInput.value = '';
        if (timeInput) timeInput.value = '0';
        if (descInput) descInput.value = '';
    }

    // We need to attach the token to the view state so submit knows what to save
    window.currentActivityToken = token;
}

// Staging only (Local Save)
// Staging only (Local Save)
// Staging only (Local Save)
// Mapped to HTML onclick="validateAndSubmitActivity()"
function removeActivityBlock(idx) {
    const el = document.getElementById(`block-${idx}`);
    if (el) {
        el.remove();
        setTimeout(() => {
            updatePanelHeight();
            if (typeof updateTotalTime === 'function') updateTotalTime();
        }, 50);
    }
}

async function validateAndSubmitActivity(token) {
    if (!token) token = window.currentActivityToken;

    const blocks = document.querySelectorAll('.activity-entry-block');
    const payloads = [];
    const errors = [];
    const warnings = [];
    let totalTime = 0;

    // 1. Harvest Data & Basic Validation
    blocks.forEach(block => {
        const idParts = block.id.split('-'); // block-{i}
        const i = idParts[1];

        const projEl = document.getElementById(`activity-input-project-${i}`);
        const timeEl = document.getElementById(`activity-input-time-${i}`);
        const descEl = document.getElementById(`activity-input-text-${i}`);
        const timeInputEl = document.getElementById(`activity-input-time-hidden-${i}`) || timeEl;

        let proj = projEl ? projEl.value.trim() : '';

        let timeVal = 0;
        if (timeInputEl) {
            const raw = timeInputEl.value.replace(/[^\d.,]/g, '').replace(',', '.').trim();
            timeVal = parseFloat(raw) || 0;
        }

        let desc = descEl ? descEl.value.trim() : '';

        // STRICT VALIDATION: Do NOT ignore empty blocks. 
        // If it's on screen, it must be filled.
        // (Removed the "if (!proj && ... return" line)

        // Blocking Checks
        if (!proj) {
            errors.push(`El bloque #${parseInt(i) + 1} no tiene Proyecto seleccionado.`);
        }
        if (timeVal <= 0) {
            errors.push(`El bloque #${parseInt(i) + 1} no tiene tiempo asignado.`);
        }

        totalTime += timeVal;

        // Warning Checks
        if (!desc) {
            warnings.push({ i: parseInt(i) + 1, proj: proj || `Bloque ${parseInt(i) + 1}` });
        }

        if (proj && timeVal > 0) {
            payloads.push({
                project: proj,
                time: String(timeVal).replace('.', ',') + " Horas",
                description: desc
            });
        }
    });

    // 2. Global Blocking Errors
    // Even if payloads is empty (because inputs were invalid), errors array captures it.
    if (errors.length > 0) {
        showNotification(errors[0], 'error');
        return;
    }

    // Catch-all if strictly no content (unlikely with strict check above, but safe)
    if (payloads.length === 0) {
        showNotification("No hay datos válidos para guardar.", 'error');
        return;
    }

    // 10H LIMIT CHECK
    if (totalTime > 10) {
        showNotification(`El tiempo total (${totalTime}h) excede el límite de 10 horas.`, 'error');
        return;
    }

    // 3. Logic to Proceed
    const proceedToSummary = () => {
        // Build Summary Table
        let rowsHtml = payloads.map(p => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #444; color: #ddd; font-size: 1rem;">${p.project}</td>
                <td style="padding: 12px; border-bottom: 1px solid #444; text-align: center; color: #ddd; font-size: 1rem;">${p.time}</td>
            </tr>
        `).join('');

        const tableHtml = `
            <div style="font-size: 1rem; color: #ccc; margin-bottom: 1rem;">
                Confirma los datos antes de guardar:
            </div>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #444; border-radius: 6px; background: #222;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #333; color: #fff;">
                        <tr>
                            <th style="padding: 12px; text-align: left; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Proyecto</th>
                            <th style="padding: 12px; text-align: center; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;

        setTimeout(() => {
            showCustomConfirm(
                "Confirmación",
                tableHtml,
                "Cancelar",
                "Guardar",
                (confirmed) => {
                    if (confirmed) {
                        saveLocally(token, payloads);
                    }
                }
            );
        }, 300);
    };

    // 4. Warning Logic
    if (warnings.length > 0) {
        const warningMsg = `
            <div style="color: #ddd; font-size: 1.1rem; margin-bottom: 15px; text-align: center;">
                Falta descripción en:
            </div>
            <ul style="text-align: center; list-style-type: none; padding: 0; margin-bottom: 20px; color: #ccc; font-size: 1rem;">
                ${warnings.map(w => `<li>${w.proj}</li>`).join('')}
            </ul>
            <div style="color: #ddd;">¿Desea continuar sin descripción?</div>
        `;

        showCustomConfirm(
            "Advertencia",
            warningMsg,
            "Volver",
            "Confirmar",
            (confirmed) => {
                if (confirmed) {
                    proceedToSummary();
                }
            },
            true // isDanger flag
        );
    } else {
        proceedToSummary();
    }
}

function saveLocally(token, payloads) {
    const idx = window._pendingActivities.findIndex(a => a.token === token);
    if (idx !== -1) {
        window._pendingActivities[idx].locallyCompleted = true;
        window._pendingActivities[idx].stagingData = payloads;
    }

    // Force UI Update
    const viewEntry = document.getElementById('view-activity-entry');
    const viewPending = document.getElementById('view-activity-pending');

    if (viewEntry) viewEntry.style.display = 'none';
    if (viewPending) viewPending.style.display = 'block';

    renderActivityPendingTable();

    // Automatic Approval after 0.5s
    setTimeout(() => {
        if (typeof approveActivity === 'function') {
            // Robust selection by ID
            const btn = document.getElementById(`btn-approve-${token}`);
            if (btn) {
                approveActivity(token, btn);
            } else {
                console.warn("Auto-approve button not found for token:", token);
                approveActivity(token);
            }
        }
    }, 500);
}

// Updated Helper to support Styles
function showCustomConfirm(title, message, cancelText, confirmText, callback, isDanger = false) {
    let modal = document.getElementById('confirm-modal');

    // Lazy creation if missing
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-confirm-wrapper" style="max-width:1000px; width: 90%; text-align:center;">
                <h3 id="confirm-title" style="margin-top:0; color:var(--bpb-blue);">Confirmación</h3>
                <div id="confirm-message" style="margin:20px 0; color:#ddd; line-height:1.5;"></div>
                <div class="modal-actions" style="justify-content:center; gap:12px;">
                    <button class="btn" style="border:1px solid #444;" onclick="closeConfirmModal(false)">Cancelar</button>
                    <button class="btn btn-primary" onclick="closeConfirmModal(true)">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // STRICTLY FORCE WIDTH UPDATE EVERY TIME
    // Dynamic width based on context: Warning (small/standard) vs Summary (wide)
    const wrapper = modal.querySelector('.modal-confirm-wrapper');
    if (wrapper) {
        wrapper.style.maxWidth = isDanger ? '500px' : '800px';
        wrapper.style.width = '90%';
    }

    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const btnCancel = modal.querySelector('.modal-actions button:first-child');
    const btnConfirm = modal.querySelector('.modal-actions button:last-child');

    if (titleEl) {
        titleEl.textContent = title;
        titleEl.style.color = isDanger ? '#e74c3c' : 'var(--bpb-blue)'; // Red if danger
    }

    if (msgEl) msgEl.innerHTML = message;

    if (btnCancel) btnCancel.textContent = cancelText;

    if (btnConfirm) {
        btnConfirm.textContent = confirmText;
        // Adjust button style
        if (isDanger) {
            btnConfirm.className = 'btn'; // Reset
            btnConfirm.style.backgroundColor = '#e74c3c';
            btnConfirm.style.color = 'white';
            btnConfirm.style.border = 'none';
        } else {
            btnConfirm.className = 'btn btn-primary'; // Default
            btnConfirm.style.removeProperty('background-color');
            btnConfirm.style.removeProperty('color');
            btnConfirm.style.removeProperty('border');
        }
    }

    globalConfirmCallback = callback;
    modal.style.display = 'flex';
}

// Final Backend Submission (with animation + toast)
async function approveActivity(tokenOrBtn, maybeBtn) {
    const token = typeof tokenOrBtn === 'string' ? tokenOrBtn : null;
    const btnEl = typeof tokenOrBtn === 'object' ? tokenOrBtn : maybeBtn;

    const act = window._pendingActivities.find(a => a.token === (token || window.currentActivityToken));
    if (!act || !act.locallyCompleted) {
        showNotification("Completa el registro antes de aprobar.", 'error');
        return;
    }

    // Keep globals for animation compatibility
    window.currentActivityDate = act.date;
    window.currentActivityToken = act.token;
    window._approvingToken = act.token;

    const runSubmit = async () => {
        const dataPayload = act.stagingData;
        const items = Array.isArray(dataPayload) ? dataPayload : [dataPayload];
        let errors = 0;

        for (let item of items) {
            try {
                const res = await fetch('/api/activity-submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: act.token,
                        project: item.project,
                        time: item.time,
                        description: item.description
                    })
                });
                const data = await res.json();
                if (data.status !== 'success') errors++;
            } catch (e) {
                console.error(e);
                errors++;
            }
        }

        if (errors === 0) {
            showNotification("Registros aprobados y enviados.", 'success');

            // SOFT REFRESH (No Reload)
            setTimeout(() => {
                // 1. Update Data
                window._pendingActivities = window._pendingActivities.filter(a => a.token !== act.token);

                // 2. Restore UI Visibility (hidden by animation)
                const container = document.getElementById('view-activity-pending');
                if (container) {
                    container.style.visibility = '';
                    container.querySelectorAll('*').forEach(el => {
                        el.style.visibility = '';
                        el.style.transition = '';
                    });
                }

                // 3. Re-render
                renderActivityPendingTable();

                // 4. If empty, maybe switch view or just leave as is (render handles empty state)
                // If we want to return to entry view? No, usually stay on list. 

            }, 800);

        } else {
            showNotification(`Proceso finalizado con ${errors} errores.`, 'warning');
            setTimeout(() => location.reload(), 2000); // Keep reload on error to be safe
        }
    };

    if (btnEl) {
        window._afterApproveAnimation = runSubmit;
        if (typeof animateApproveActivity === 'function') {
            animateApproveActivity(btnEl);
        } else {
            await runSubmit();
        }
    } else {
        await runSubmit();
    }
}

function highlightPieSlice(project) {
    window._highlightProject = project;
    const canvas = document.getElementById('stats-pie');
    const ctx = canvas ? canvas.getContext('2d') : null;
    if (!canvas || !ctx || !window._statsSlices) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const slices = window._statsSlices;
    const colors = window._statsColorMap || {};

    const highlight = project && colors[project];
    let redrawSlices = slices;
    if (highlight) {
        const main = slices.find(s => s.project === project);
        redrawSlices = slices.filter(s => s.project !== project);
        if (main) redrawSlices.unshift(main);
    }

    redrawSlices.forEach((s) => {
        const isHighlight = s.project === project;
        const baseRadius = Math.min(canvas.width, canvas.height) / 2 - 10;
        const radius = isHighlight ? baseRadius + 4 : baseRadius;
        const midAngle = (s.start + s.end) / 2;
        const offset = isHighlight ? 8 : 0;
        const cx = canvas.width / 2 + Math.cos(midAngle) * offset;
        const cy = canvas.height / 2 + Math.sin(midAngle) * offset;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, s.start, s.end);
        ctx.closePath();
        ctx.fillStyle = colors[s.project] || '#3498db';
        ctx.fill();
    });
    if (!project) hideStatsTooltip();
}

function normalizeStatsAngle(angle) {
    let a = angle;
    while (a < -Math.PI / 2) {
        a += Math.PI * 2;
    }
    return a;
}

function attachStatsPieHover(canvas) {
    if (!canvas) return;
    canvas.onmousemove = (ev) => {
        if (!window._statsSlices) return;
        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const radius = Math.min(canvas.width, canvas.height) / 2 - 10;
        if (Math.sqrt(dx * dx + dy * dy) > radius) {
            highlightPieSlice(null);
            hideStatsTooltip();
            return;
        }

        const angle = normalizeStatsAngle(Math.atan2(dy, dx));
        const slices = window._statsSlices;
        const target = slices.find(s => {
            let sStart = normalizeStatsAngle(s.start);
            let sEnd = normalizeStatsAngle(s.end);
            if (sEnd < sStart) sEnd += Math.PI * 2;
            let a = angle;
            if (a < sStart) a += Math.PI * 2;
            return a >= sStart && a <= sEnd;
        });

        if (target) {
            highlightPieSlice(target.project);
            showStatsTooltip(ev, target.project);
        } else {
            highlightPieSlice(null);
            hideStatsTooltip();
        }
    };

    canvas.onmouseleave = () => {
        hideStatsTooltip();
        highlightPieSlice(null);
    };
}

function showStatsTooltip(ev, project) {
    if (!project) {
        hideStatsTooltip();
        return;
    }
    let tip = document.getElementById('stats-pie-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'stats-pie-tooltip';
        tip.style.position = 'fixed';
        tip.style.background = 'rgba(17,17,17,0.95)';
        tip.style.border = '1px solid var(--border)';
        tip.style.padding = '6px 10px';
        tip.style.borderRadius = '6px';
        tip.style.color = '#fff';
        tip.style.fontSize = '0.85rem';
        tip.style.pointerEvents = 'none';
        tip.style.zIndex = '4500';
        document.body.appendChild(tip);
    }

    const record = (window._statsData || []).find(r => r.project === project);
    const hours = record ? record.hours : null;

    // Calculate total hours to get percentage
    const total = (window._statsData || []).reduce((acc, r) => acc + (Number(r.hours) || 0), 0);
    const percentage = (hours !== null && total > 0) ? ((hours / total) * 100).toFixed(1) : 0;

    tip.textContent = hours !== null ? `${project}: ${hours} h - ${percentage}%` : project;
    tip.style.left = `${ev.clientX + 12}px`;
    tip.style.top = `${ev.clientY + 12}px`;
    tip.style.display = 'block';
}

function hideStatsTooltip() {
    const tip = document.getElementById('stats-pie-tooltip');
    if (tip) tip.style.display = 'none';
}

// -- NEW SUBMISSION LOGIC --
let cachedSubmissionPayload = null;

function showSubmissionConfirmation(payload) {
    cachedSubmissionPayload = payload;

    const listBody = document.getElementById('confirm-modal-list');
    const totalEl = document.getElementById('confirm-modal-total');

    if (!listBody) {
        console.error("Modal list element not found");
        doSubmitActivity(payload);
        return;
    }

    let html = '';
    let total = 0;

    if (payload.activities) {
        payload.activities.forEach(act => {
            const t = parseFloat(act.time) || 0;
            total += t;
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <td style="padding: 0.5rem 0;">${act.project}</td>
                    <td style="text-align: right; padding: 0.5rem 0;">${t}h</td>
                </tr>
            `;
        });
    }

    listBody.innerHTML = html;
    if (totalEl) totalEl.innerText = `${total.toFixed(2).replace(/[.,]00$/, '')}h`;

    const modal = document.getElementById('submission-confirm-modal');
    if (modal) modal.style.display = 'flex';
}

function closeSubmissionConfirmModal() {
    const modal = document.getElementById('submission-confirm-modal');
    if (modal) modal.style.display = 'none';
    cachedSubmissionPayload = null;
}

function confirmSubmission() {
    if (!cachedSubmissionPayload) return;
    const modal = document.getElementById('submission-confirm-modal');
    if (modal) modal.style.display = 'none';

    doSubmitActivity(cachedSubmissionPayload);
}

// MISSING FUNCTION FIX
function updateTotalTime() {
    const inputs = document.querySelectorAll('input[type="hidden"].time-input-dynamic');
    let total = 0;
    inputs.forEach(inp => {
        total += parseFloat(inp.value) || 0;
    });

    const display = document.getElementById('total-time-display');
    if (display) {
        display.innerText = `Total: ${total.toFixed(2).replace(/[.,]00$/, '')}h`;
    }
}

// COPIED AND ADAPTED ANIMATION Logic (Row Level - Strict Copy of executeApprovalAnimation)
function animateApproveActivity(btn) {
    const row = btn.closest('tr');
    if (!row) {
        if (window._afterApproveAnimation) window._afterApproveAnimation();
        return;
    }

    // Targets: Date (First Cell) and The Button itself
    // Matching executeApprovalAnimation logic: "idCell" -> Date Cell
    const dateCell = row.children[0];
    if (!dateCell) return;

    // 1. Create Flyers
    const flyerDate = dateCell.cloneNode(true); // Renamed to flyerDate for consistency
    const flyerBtn = btn.cloneNode(true);

    const idRect = dateCell.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();

    // Style Flyers
    flyerDate.className = 'fly-element';
    flyerDate.style.top = idRect.top + 'px';
    flyerDate.style.left = idRect.left + 'px';
    flyerDate.style.width = idRect.width + 'px';
    flyerDate.style.margin = '0';
    flyerDate.style.color = 'var(--text-primary)'; // Or inherit
    flyerDate.style.display = 'flex';
    flyerDate.style.alignItems = 'center';
    flyerDate.style.justifyContent = 'center'; // Usually centered in table
    flyerDate.style.position = 'fixed';
    flyerDate.style.zIndex = '9999';
    // Remove unwanted borders/shadows that might be cloned from TD
    flyerDate.style.border = 'none';
    flyerDate.style.boxShadow = 'none';
    flyerDate.style.background = 'transparent'; // Ensure no bg color leak

    // Ensure font matches
    flyerDate.style.fontFamily = window.getComputedStyle(dateCell).fontFamily;
    flyerDate.style.fontSize = window.getComputedStyle(dateCell).fontSize;
    flyerDate.style.fontWeight = window.getComputedStyle(dateCell).fontWeight;

    // Setup Button Flyer (Become Tick IMMEDIATELY)
    flyerBtn.className = 'fly-element';
    flyerBtn.style.position = 'fixed';
    // Start at button position
    flyerBtn.style.top = btnRect.top + 'px';
    flyerBtn.style.left = btnRect.left + 'px';
    // But Force Circle Size/Shape NOW (User: "Siempre debe ser un circulo")
    // We center the circle within the original button area keyframe-wise or just align top-left?
    // Let's standard align top-left but since it's smaller (30px?) it might look offset.
    // Better: Helper calc to center the tick inside the original button area first?
    // Or just start it at the button's center.
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;

    const tickSize = 42; // Match original 42px
    flyerBtn.style.width = tickSize + 'px';
    flyerBtn.style.height = tickSize + 'px';
    flyerBtn.style.left = (btnCenterX - tickSize / 2) + 'px';
    flyerBtn.style.top = (btnCenterY - tickSize / 2) + 'px';

    flyerBtn.style.zIndex = '9999';
    flyerBtn.style.margin = '0';
    flyerBtn.style.borderRadius = '50%'; // CIRCLE ALWAYS
    flyerBtn.style.border = '2px solid #2ecc71';
    flyerBtn.style.background = 'rgba(0,0,0,0.8)'; // Dark bg as requested implicitly by "tick" look
    flyerBtn.style.color = '#2ecc71';
    flyerBtn.style.display = 'flex';
    flyerBtn.style.alignItems = 'center';
    flyerBtn.style.justifyContent = 'center';
    flyerBtn.innerHTML = '&#10003;'; // Tick Immediately
    flyerBtn.style.fontSize = '1.8rem';
    flyerBtn.style.padding = '0';
    flyerBtn.style.opacity = '1';
    // Optional: Add shadow now
    flyerBtn.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.3)';

    document.body.appendChild(flyerDate);
    document.body.appendChild(flyerBtn);

    // 2. Hide Original Content Immediately
    row.style.visibility = 'hidden';
    row.querySelectorAll('*').forEach(el => {
        el.style.visibility = 'hidden';
        el.style.transition = 'none';
    });

    // Trigger Reflow
    void flyerBtn.offsetWidth;

    // 3. Animation Targets (Center of Row)
    const centerX = rowRect.left + (rowRect.width / 2);
    const centerY = rowRect.top + (rowRect.height / 2);

    // --- FIX: Blur Logistics Selects on Change ---
    // This ensures the dropdown arrow resets (points down) after selection
    document.body.addEventListener('change', function (e) {
        if (e.target && (e.target.id === 'logistics-pallet-type' || e.target.id === 'logistics-container-type')) {
            e.target.blur();
        }
    });

    // Inject custom class for arrow styling ONLY for these two
    const palletSelect = document.getElementById('logistics-pallet-type');
    const containerSelect = document.getElementById('logistics-container-type');
    if (palletSelect) palletSelect.classList.add('main-dropdown');
    if (containerSelect) {
        containerSelect.classList.add('main-dropdown');
        // Set Default to "Sin Contenedor" (none)
        containerSelect.value = 'none';
        // Trigger change to update UI if necessary
        containerSelect.dispatchEvent(new Event('change'));
    }

    // --- ANIMATION SEQUENCE ---
    // Move to center
    flyerDate.style.transition = 'all 0.8s ease';
    flyerBtn.style.transition = 'all 0.8s ease';

    // Date moves to Left of Center
    flyerDate.style.left = (centerX - 60) + 'px';
    flyerDate.style.top = centerY + 'px';
    flyerDate.style.transform = 'translate(-50%, -50%) scale(1.5)';

    // Button (Tick) moves to Right of Center
    // Target position
    flyerBtn.style.left = (centerX + 60) + 'px';
    flyerBtn.style.top = centerY + 'px';
    // Transform is just for centering anchor, no scale change needed
    flyerBtn.style.transform = 'translate(-50%, -50%)';

    // Glow Effect
    setTimeout(() => {
        flyerDate.classList.add('fly-glow-burst');
        flyerBtn.classList.add('fly-glow-burst');
    }, 800);

    // 4. Cleanup and Callback
    setTimeout(() => {
        flyerDate.remove();
        flyerBtn.remove();

        row.style.display = 'none'; // Collapse row

        if (window._afterApproveAnimation) {
            window._afterApproveAnimation();
        }
    }, 1500);
}
function renderStatsAreaFrame(ctx, state, animParams) {
    if (!ctx || !state) return;

    const {
        width, height, margin, w, h,
        globalMax, gridMax, stepVal,
        projects, timelineData, colorMap, opts,
        firstDateTs, lastDateTs
    } = state;

    const activeProject = animParams ? animParams.activeProject : null;
    const dynamicBlur = animParams ? animParams.shadowBlur : 10;
    const dynamicWidth = animParams ? animParams.lineWidth : 3;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Re-create Scales
    const xScale = (ts) => {
        const duration = lastDateTs - firstDateTs || 1;
        return margin.left + ((ts - firstDateTs) / duration) * w;
    };
    const yScale = (val) => {
        return margin.top + h - ((val / gridMax) * h);
    };

    // 1. Draw Grid & Axis
    ctx.strokeStyle = opts.axisColor || '#ccc';
    ctx.lineWidth = 1;
    ctx.font = opts.valFont || '12px "Manrope", sans-serif';
    ctx.fillStyle = opts.textColor || '#333';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Grid Lines Y
    for (let v = 0; v <= gridMax; v += stepVal) {
        const y = Math.round(yScale(v));
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + w, y);
        ctx.stroke();

        ctx.fillText(v, margin.left - 8, y);
    }

    // Axis Lines
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + h);
    ctx.lineTo(margin.left + w, margin.top + h);
    ctx.stroke();

    // X-Axis Date Labels (Unique & Sparse)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const targetLabels = 6;
    const duration = lastDateTs - firstDateTs;
    const displayedDates = new Set();

    // Pick ~6 equidistant points in time
    for (let i = 0; i <= targetLabels; i++) {
        const t = Math.min(firstDateTs + (i * (duration / targetLabels)), lastDateTs);
        const x = Math.round(xScale(t)); // Round to integer
        const dateObj = new Date(t);
        const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

        if (!displayedDates.has(label)) {
            // Avoid drawing label if it overlaps too much with the right edge
            if (x < margin.left + w + 10) {
                ctx.fillText(label, x, margin.top + h + 8);
                displayedDates.add(label);
            }
        }
    }

    // Axis Titles
    ctx.save();
    ctx.font = opts.labelFont || 'bold 12px "Manrope", sans-serif';
    ctx.fillStyle = opts.textColor || '#333';

    // Label X: "Fecha"
    ctx.textAlign = 'right';
    ctx.fillText('Fecha', margin.left + w + 10, margin.top + h + 30);

    // Label Y: "Horas Acumuladas"
    ctx.translate(margin.left - 45, margin.top);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'right';
    ctx.fillText('Horas Acumuladas', 0, 0);
    ctx.restore();

    // 2. Draw Areas
    // Projects are sorted Largest (Back) to Smallest (Front)
    // Draw in that order
    projects.forEach((proj) => {
        const pointsTop = [];
        const pointsBottom = [];

        timelineData.forEach((snap) => {
            const val = snap.totals[proj] || 0;
            const x = xScale(snap.ts);
            const yTop = yScale(val);
            const yBottom = yScale(0);
            pointsTop.push({ x, y: yTop });
            pointsBottom.push({ x, y: yBottom });
        });

        // Path for Fill
        ctx.beginPath();
        if (pointsTop.length > 0) {
            ctx.moveTo(pointsTop[0].x, pointsTop[0].y);
            for (let i = 1; i < pointsTop.length; i++) ctx.lineTo(pointsTop[i].x, pointsTop[i].y);
            for (let i = pointsBottom.length - 1; i >= 0; i--) ctx.lineTo(pointsBottom[i].x, pointsBottom[i].y);
            ctx.closePath();
        }

        const color = colorMap[proj] || '#888';
        const toRGBA = (hex, alpha) => {
            const raw = (hex || '#3498db').replace('#', '');
            const norm = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw.padEnd(6, '0');
            const num = parseInt(norm, 16);
            const r = (num >> 16) & 255;
            const g = (num >> 8) & 255;
            const b = num & 255;
            return `rgba(${r},${g},${b},${alpha})`;
        };

        // User requested "less bright, like pie chart". 
        // Pie chart is solid. Area needs some transparency to see through, but we increase opacity.
        ctx.fillStyle = toRGBA(color, 0.85);
        ctx.fill();

        // Stroke Top Edge
        ctx.beginPath();
        if (pointsTop.length > 0) {
            ctx.moveTo(pointsTop[0].x, pointsTop[0].y);
            for (let i = 1; i < pointsTop.length; i++) ctx.lineTo(pointsTop[i].x, pointsTop[i].y);
        }

        const isActive = (proj === activeProject);

        ctx.shadowColor = color;
        // Only glow if active. Default is 0 (flat).
        ctx.shadowBlur = isActive ? dynamicBlur : 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = color;
        ctx.lineWidth = isActive ? dynamicWidth : 2; // Normal width 2 (slightly thinner than 3)
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
    });
}

function animateStatsArea() {
    const canvas = document.getElementById('stats-area-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = window._statsAreaState;

    if (!state || !state.activeProject) {
        if (state && state.animId) cancelAnimationFrame(state.animId);
        return;
    }

    const now = Date.now();
    // Pulse: 15 base + 10 variation. ~1.5 sec period.
    const pulse = 15 + 10 * Math.sin(now / 200);

    renderStatsAreaFrame(ctx, state, {
        activeProject: state.activeProject,
        shadowBlur: pulse,
        lineWidth: 5
    });

    state.animId = requestAnimationFrame(animateStatsArea);
}


/* ==============================================================================
   LOGISTICS CALCULATOR LOGIC
   ============================================================================== */

function showLogisticsView() {
    hideAllViews();
    const menu = document.getElementById('view-logistics-menu');
    if (menu) {
        menu.style.display = 'block';
        menu.classList.add('animate-entry');
    }
}

function showLogisticsCalculator() {
    hideAllViews();
    document.getElementById('view-logistics').style.display = 'block';

    // Set initial preset if empty inputs
    if (document.getElementById('cont-l').value === "590" && !document.getElementById('logistics-items-table').tBodies[0].rows.length) {
        // Initial setup
        updateContainerPresets();
        addLogisticsItemRow(); // Toggle Container Inputs
    }
}

function showLogisticsRecords() {
    hideAllViews();
    const recordsView = document.getElementById('view-logistics-records');
    if (recordsView) {
        recordsView.style.display = 'block';
        recordsView.classList.add('animate-entry');

        // Load data
        loadLogisticsRecords();
    }
}

async function loadLogisticsRecords() {
    const tbody = document.getElementById('logistics-records-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando registros...</td></tr>';

    try {
        const response = await fetch('/api/logistics/records');
        const data = await response.json();

        if (Array.isArray(data)) {
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay registros guardados.</td></tr>';
                return;
            }

            // Global cache for easy retrieval
            window.lastLogisticsRecords = data;

            tbody.innerHTML = '';
            data.forEach(rec => {
                const dateStr = rec.timestamp ? new Date(rec.timestamp).toLocaleDateString() : 'N/A';
                const recId = rec.id || '';
                const safeName = (rec.save_name || 'Sin título').replace(/'/g, "\\'");
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${rec.save_name || 'Sin título'}</td>
                    <td style="color: var(--text-secondary);">${rec.save_description || '-'}</td>
                    <td>${rec.author || 'Sistema'}</td>
                    <td style="font-size: 0.85rem;">${dateStr}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-sm btn-primary" onclick="viewLogisticsRecord('${recId}')">Ver Cálculo</button>
                    </td>
                    <td style="text-align: center;">
                        ${recId ? `<button class="btn-cancel-check" onclick="confirmDeleteLogisticsRecord('${recId}', '${safeName}')" title="Desaprobar">✕</button>` : '<span style="color:#777;">-</span>'}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--bpb-blue);">Error al cargar registros.</td></tr>';
    }
}

function filterLogisticsRecordsTable(input) {
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('#logistics-records-table tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
}

function viewLogisticsRecord(id) {
    if (!window.lastLogisticsRecords) return;
    const rec = window.lastLogisticsRecords.find(r => r.id === id);
    if (!rec) return;

    // 1. Show Calculator
    showLogisticsCalculator();
    window._logisticsFromRecords = true;

    // 2. Set Inputs
    if (rec.container) {
        document.getElementById('logistics-container-type').value = rec.container.type;
        document.getElementById('cont-l').value = rec.container.l;
        document.getElementById('cont-w').value = rec.container.w;
        document.getElementById('cont-h').value = rec.container.h;
        document.getElementById('cont-weight').value = rec.container.weight;
    }

    if (rec.pallet) {
        document.getElementById('logistics-pallet-type').value = rec.pallet.type;
        const boards = document.getElementById('pallet-boards-count');
        if (boards) boards.value = rec.pallet.boards;

        document.getElementById('pallet-l').value = rec.pallet.l;
        document.getElementById('pallet-w').value = rec.pallet.w;
        document.getElementById('pallet-h').value = rec.pallet.h;
        document.getElementById('pallet-weight').value = rec.pallet.weight;
        document.getElementById('pallet-max-weight').value = rec.pallet.max_weight;

        const chkLimit = document.getElementById('chk-limit-height');
        if (chkLimit) chkLimit.checked = rec.pallet.limit_height;

        const maxHInput = document.getElementById('pallet-max-height-input');
        if (maxHInput) maxHInput.value = rec.pallet.max_height;
    }

    if (rec.optimization) {
        const chkMax = document.getElementById('chk-maximize-logistics');
        if (chkMax) chkMax.checked = rec.optimization.maximize;

        const chkMixedPal = document.getElementById('chk-mixed-pallets');
        if (chkMixedPal) chkMixedPal.checked = rec.optimization.mixed_pallets;

        const chkStackLoad = document.getElementById('chk-stack-load');
        if (chkStackLoad) chkStackLoad.checked = (rec.optimization.stack_load !== undefined) ? rec.optimization.stack_load : true;

        const chkForceOrient = document.getElementById('chk-force-orientation');
        if (chkForceOrient) chkForceOrient.checked = (rec.optimization.force_orientation !== undefined) ? rec.optimization.force_orientation : false;

        const orientSelect = document.getElementById('logistics-orientation-mode');
        if (orientSelect && rec.optimization.orientation_face) orientSelect.value = rec.optimization.orientation_face;
        toggleForceOrientation();

        const chkMixedCont = document.getElementById('chk-mixed-containers');
        if (chkMixedCont) chkMixedCont.checked = rec.optimization.mixed_containers;

        const chkSort = document.getElementById('chk-sort-items');
        if (chkSort) chkSort.checked = rec.optimization.sort_items;

        const chkVisOnly = document.getElementById('chk-visual-only');
        if (chkVisOnly) chkVisOnly.checked = rec.optimization.visual_only;
    }

    // Safety Factors (if saved)
    if (rec.safety_factors) {
        const sfDims = document.getElementById('logistics-safety-factor-dims');
        const sfWeight = document.getElementById('logistics-safety-factor-weight');
        if (sfDims) sfDims.value = rec.safety_factors.dims ?? 0;
        if (sfWeight) sfWeight.value = rec.safety_factors.weight ?? 0;
    } else {
        // Backward compatibility (if stored at top-level)
        const sfDims = document.getElementById('logistics-safety-factor-dims');
        const sfWeight = document.getElementById('logistics-safety-factor-weight');
        if (sfDims && rec.safety_factor_dims !== undefined) sfDims.value = rec.safety_factor_dims;
        if (sfWeight && rec.safety_factor_weight !== undefined) sfWeight.value = rec.safety_factor_weight;
    }

    // 3. Set Items
    const tbody = document.getElementById('logistics-items-table').querySelector('tbody');
    tbody.innerHTML = '';

    if (Array.isArray(rec.items)) {
        rec.items.forEach(itm => {
            addLogisticsItemRow(); // Creates new row
            const lastRow = tbody.lastElementChild;
            if (lastRow) {
                lastRow.querySelector('.log-name').value = itm.name;
                lastRow.querySelector('.log-l').value = itm.l;
                lastRow.querySelector('.log-w').value = itm.w;
                lastRow.querySelector('.log-h').value = itm.h;
                lastRow.querySelector('.log-weight').value = itm.weight;
                lastRow.querySelector('.log-qty').value = itm.qty;
                lastRow.querySelector('.log-rel-qty').value = itm.rel_qty;
            }
        });
    }

    // 4. Trigger Recalculate to show 3D and Summary
    calculateLogistics(rec.optimization ? rec.optimization.maximize : false);

    showNotification(`Cálculo "${rec.save_name}" restaurado.`, "success");
}

function logisticsBack() {
    if (window._logisticsFromRecords) {
        window._logisticsFromRecords = false;
        showLogisticsRecords();
    } else {
        showLogisticsView();
    }
}

function confirmDeleteLogisticsRecord(id, name) {
    if (!id) {
        showNotification('Registro sin ID. No se puede eliminar.', 'error');
        return;
    }
    const safeName = String(name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const msg = `Esta seguro que quiere borrar el registro del calculo <strong>${safeName}</strong>?`;

    showCustomConfirm(
        'Confirmacion',
        msg,
        'Cancelar',
        'Confirmar',
        async (confirmed) => {
            if (!confirmed) return;
            try {
                const res = await fetch('/api/logistics/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showNotification('Registro eliminado.', 'success');
                    loadLogisticsRecords();
                } else {
                    showNotification(data.message || 'No se pudo eliminar.', 'error');
                }
            } catch (e) {
                console.error(e);
                showNotification('Error de conexión al eliminar.', 'error');
            }
        },
        false
    );
}

function updateContainerPresets() {
    const type = document.getElementById('logistics-container-type').value;
    const l = document.getElementById('cont-l');
    const w = document.getElementById('cont-w');
    const h = document.getElementById('cont-h');
    const weight = document.getElementById('cont-weight');
    const customDiv = document.getElementById('logistics-custom-dims');
    const weightWrapper = document.getElementById('div-cont-weight-wrapper'); // Wrapper for visibility toggle

    // Show/Hide custom dims
    if (type === 'none') {
        customDiv.style.display = 'none';
        weightWrapper.style.display = 'none'; // Hide Max Weight
        // Clear or set to 0 to avoid confusion? 
        // Better to leave values but hide.
    } else {
        customDiv.style.display = 'grid'; // Restore grid layout
        weightWrapper.style.display = 'block'; // Show Max Weight
    }

    switch (type) {
        case 'none':
            // Logic handled above
            break;
        case '20ft':
            l.value = 590; w.value = 235; h.value = 239; weight.value = 25000;
            break;
        case '40ft':
            l.value = 1203; w.value = 235; h.value = 239; weight.value = 27600;
            break;
        case '40hc':
            l.value = 1203; w.value = 235; h.value = 269; weight.value = 28600;
            break;
        case '40pw':
            l.value = 1203; w.value = 245; h.value = 269; weight.value = 28600;
            break;
        case 'custom':
            // Keep current values or clear
            break;
    }
}

function updatePalletPresets() {
    const type = document.getElementById('logistics-pallet-type').value;
    const isCollarsType = (type === 'collars' || type === 'collars_120x100');
    const dimsDiv = document.getElementById('pallet-custom-dims');
    const limitsDiv = document.getElementById('pallet-limits-wrapper');
    const boardsDiv = document.getElementById('div-pallet-boards');

    const l = document.getElementById('pallet-l');
    const w = document.getElementById('pallet-w');
    const h = document.getElementById('pallet-h');
    const weight = document.getElementById('pallet-weight');

    // Toggle Visibility
    if (type === 'none') {
        dimsDiv.style.display = 'none';
        limitsDiv.style.display = 'none';
        if (boardsDiv) boardsDiv.style.display = 'none';
    } else {
        dimsDiv.style.display = 'grid';
        dimsDiv.style.gridTemplateColumns = '1fr 1fr 1fr 1fr'; // Force 4 columns

        limitsDiv.style.display = 'block';
        if (boardsDiv) {
            boardsDiv.style.display = isCollarsType ? 'block' : 'none';
        }

        // Hide height limit checkbox for Collars
        const limitWrapper = document.getElementById('wrapper-limit-height');
        const maxHeightDiv = document.getElementById('div-pallet-max-height');
        if (limitWrapper) {
            limitWrapper.style.display = isCollarsType ? 'none' : 'flex';
        }
        if (maxHeightDiv && isCollarsType) {
            maxHeightDiv.style.display = 'none';
        } else if (maxHeightDiv) {
            // Handle standard logic (show if checked)
            const chk = document.getElementById('chk-limit-height');
            if (chk) maxHeightDiv.style.display = chk.checked ? 'flex' : 'none';
        }
    }

    // Removed weightContainer logic (reverted in HTML)

    // Enable/Disable inputs based on type
    const isCustom = (type === 'custom');
    const isPreset = (['europallet', 'american', 'collars', 'collars_120x100'].includes(type));

    if (isPreset) {
        // Lock dimensions for presets
        l.disabled = true;
        w.disabled = true;
        // Collars Height is dynamic but still auto-calculated, so lock H too?
        // Actually, Collars H is calc'd from Boards. User changes Boards, not H directly.
        h.disabled = true;

        // ALLOW Weight Override
        weight.disabled = false;

        // Visual cue?
        l.style.backgroundColor = '#333';
        w.style.backgroundColor = '#333';
        h.style.backgroundColor = '#333';
        weight.style.backgroundColor = ''; // Normal
    } else {
        // Unlock all for Custom
        l.disabled = false;
        w.disabled = false;
        h.disabled = false;
        weight.disabled = false;

        l.style.backgroundColor = '';
        w.style.backgroundColor = '';
        h.style.backgroundColor = '';
        weight.style.backgroundColor = '';
    }

    switch (type) {
        case 'europallet':
            l.value = 120; w.value = 80; h.value = 15; weight.value = 25;
            break;
        case 'american':
            l.value = 120; w.value = 100; h.value = 15; weight.value = 25;
            break;
        case 'collars':
        case 'collars_120x100':
            l.value = 120; w.value = (type === 'collars_120x100') ? 100 : 80;
            // Height depends on boards. Default 4 -> 15.9 (Base+Tapa) + (4 * 19.5)
            const boards = document.getElementById('pallet-boards-count');
            let boardCount = 4;
            if (boards) boardCount = parseInt(boards.value) || 4;
            h.value = 15.9 + (boardCount * 19.5);
            // Only reset weight if it's currently empty? Or always reset on type switch?
            // Standard behavior: Reset to default on switch. User overrides after.
            weight.value = 50;
            break;
        // custom: keep values
    }
}

function togglePalletHeightInput() {
    const chk = document.getElementById('chk-limit-height');
    const div = document.getElementById('div-pallet-max-height');
    div.style.display = chk.checked ? 'flex' : 'none';
}

function toggleForceOrientation() {
    const chk = document.getElementById('chk-force-orientation');
    const wrapper = document.getElementById('force-orientation-wrapper');
    if (wrapper) wrapper.style.display = (chk && chk.checked) ? 'block' : 'none';
}

// function togglePalletWeightInput removed

function addLogisticsItemRow() {
    const tbody = document.getElementById('logistics-items-table').querySelector('tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="log-name" placeholder="Ej: Cajas SKU-01"></td>
        <td><input type="number" class="log-l" placeholder="cm"></td>
        <td><input type="number" class="log-w" placeholder="cm"></td>
        <td><input type="number" class="log-h" placeholder="cm"></td>
        <td><input type="number" class="log-weight" placeholder="kg"></td>
        <td><input type="number" class="log-qty" value="1"></td>
        <td><input type="number" class="log-rel-qty" placeholder="Ratio"></td>
        <td style="text-align: center;">
            <button class="btn-icon" onclick="this.closest('tr').remove()" title="Eliminar fila">&times;</button>
        </td>
    `;
    tbody.appendChild(tr);
    // Focus first input
    tr.querySelector('.log-name').focus();
}

// Global storage for re-rendering
let lastLogisticsData = null;
let lastContainerData = null;
let lastLogisticsMaximize = false;

async function calculateLogistics(maximize = false) {
    lastLogisticsMaximize = !!maximize;
    const statusEl = document.getElementById('logistics-status');
    statusEl.innerHTML = `<span class="spinner" style="border-top-color: var(--bpb-blue); width: 16px; height: 16px;"></span> ${maximize ? 'Calculando Distribución Máxima...' : 'Calculando...'}`;

    // 0. Gather Config
    const palletType = document.getElementById('logistics-pallet-type').value;
    const containerType = document.getElementById('logistics-container-type').value;

    // Pallet Height Limit
    let maxPalletHeight = 0;
    const chkLimit = document.getElementById('chk-limit-height');
    if (chkLimit && chkLimit.checked) {
        maxPalletHeight = parseFloat(document.getElementById('pallet-max-height-input').value) || 0;
    }

    // Pallet Weight Limit (Standard Input now)
    let maxPalletWeight = parseFloat(document.getElementById('pallet-max-weight').value) || 0;

    // Gather Custom Pallet Dims
    const palletDims = {
        w: parseFloat(document.getElementById('pallet-l').value) || 0,
        d: parseFloat(document.getElementById('pallet-w').value) || 0,
        h: parseFloat(document.getElementById('pallet-h').value) || 0,
        weight: parseFloat(document.getElementById('pallet-weight').value) || 0
    };

    // 1. Gather Container Data
    const container = {
        type: containerType,
        name: document.getElementById('logistics-container-type').options[document.getElementById('logistics-container-type').selectedIndex].text,
        width: parseFloat(document.getElementById('cont-l').value) || 0,
        height: parseFloat(document.getElementById('cont-h').value) || 0,
        depth: parseFloat(document.getElementById('cont-w').value) || 0,
        max_weight: parseFloat(document.getElementById('cont-weight').value) || 0
    };

    // 2. Gather Items
    const rows = document.querySelectorAll('#logistics-items-table tbody tr');
    const items = [];

    rows.forEach(row => {
        const name = row.querySelector('.log-name').value;
        const l = parseFloat(row.querySelector('.log-l').value) || 0;
        const w_dim = parseFloat(row.querySelector('.log-w').value) || 0;
        const h = parseFloat(row.querySelector('.log-h').value) || 0;
        const weight = parseFloat(row.querySelector('.log-weight').value) || 0;
        const qty = parseFloat(row.querySelector('.log-qty').value) || 0;
        const relQty = parseFloat(row.querySelector('.log-rel-qty').value) || 0;

        // Check if maximizing with unmixed pallets (each item gets max on own pallet)
        const isMultiItemMax = maximize && containerType === 'none' && !document.getElementById('chk-mixed-pallets').checked;

        // Allow qty=0 for multi-item maximization mode
        const hasValidQty = isMultiItemMax ? true : (qty > 0 || relQty > 0);

        if (name && l > 0 && w_dim > 0 && h > 0 && hasValidQty) {
            items.push({
                id: name,
                w: l,
                d: w_dim,
                h: h,
                weight: weight > 0 ? weight : 1,
                qty: qty,
                rel_qty: relQty
            });
        }
    });

    if (items.length === 0) {
        statusEl.textContent = 'Ingrese al menos un item válido.';
        return;
    }

    try {
        const response = await fetch('/api/logistics/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                container,
                items,
                config: {
                    maximize: maximize,
                    pallet_type: palletType,
                    container_type: containerType,
                    max_pallet_height: maxPalletHeight,
                    max_pallet_weight: maxPalletWeight,
                    pallet_dims: palletDims,
                    boards_count: parseInt(document.getElementById('pallet-boards-count')?.value) || 4,
                    safety_factor_dims: parseFloat(document.getElementById('logistics-safety-factor-dims')?.value) || 0,
                    safety_factor_weight: parseFloat(document.getElementById('logistics-safety-factor-weight')?.value) || 0,
                    mixed_pallets: document.getElementById('chk-mixed-pallets')?.checked ?? true,
                    stack_load: document.getElementById('chk-stack-load')?.checked ?? true,
                    force_orientation: document.getElementById('chk-force-orientation')?.checked ?? false,
                    orientation_face: document.getElementById('logistics-orientation-mode')?.value || 'LxA'
                }
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            statusEl.textContent = '';
            lastLogisticsData = data;
            lastContainerData = container;

            if (containerType === 'none' && data.bin_dims) {
                lastContainerData = {
                    ...container,
                    width: data.bin_dims.w,
                    height: data.bin_dims.h,
                    depth: data.bin_dims.d,
                    name: "Espacio Virtual"
                };
            }

            if (maximize && data.new_quantities) {
                updateItemQuantities(data.new_quantities);
                statusEl.textContent = 'Maximización completada';
            }

            renderLogisticsResults(data);
        } else {
            statusEl.textContent = 'Error: ' + data.message;
        }

    } catch (e) {
        console.error(e);
        statusEl.textContent = 'Error de conexión con el servidor.';
    }
}

// --- Save Calculation Functions ---

function openLogisticsSaveModal() {
    // Basic check: is there at least one item?
    const rows = document.querySelectorAll('#logistics-items-table tbody tr');
    if (rows.length === 0) {
        showNotification("No hay nada para guardar. Agregue items primero.", "warning");
        return;
    }
    document.getElementById('logistics-save-modal').style.display = 'flex';
    document.getElementById('logistics-save-name').focus();
}

function closeLogisticsSaveModal() {
    document.getElementById('logistics-save-modal').style.display = 'none';
    document.getElementById('logistics-save-name').value = '';
    document.getElementById('logistics-save-desc').value = '';
}

async function confirmSaveLogistics() {
    const name = document.getElementById('logistics-save-name').value.trim();
    const desc = document.getElementById('logistics-save-desc').value.trim();

    if (!name) {
        showNotification("Por favor, ingrese un nombre para el registro.", "warning");
        return;
    }

    // Gather EVERYTHING to restore the state exactly
    const palletType = document.getElementById('logistics-pallet-type').value;
    const containerType = document.getElementById('logistics-container-type').value;

    const inferredMaximize = !!(lastLogisticsData && (lastLogisticsData.new_quantities || lastLogisticsData.multiplier || lastLogisticsData.set_count));
    const maximizeFlag = inferredMaximize ? true : ((typeof lastLogisticsMaximize !== 'undefined') ? lastLogisticsMaximize : false);

    const config = {
        save_name: name,
        save_description: desc,
        timestamp: new Date().toISOString(),
        author: currentDisplayName || currentUser || 'Usuario',

        container: {
            type: containerType,
            l: parseFloat(document.getElementById('cont-l').value) || 0,
            w: parseFloat(document.getElementById('cont-w').value) || 0,
            h: parseFloat(document.getElementById('cont-h').value) || 0,
            weight: parseFloat(document.getElementById('cont-weight').value) || 0
        },
        pallet: {
            type: palletType,
            boards: parseInt(document.getElementById('pallet-boards-count')?.value) || 4,
            l: parseFloat(document.getElementById('pallet-l').value) || 0,
            w: parseFloat(document.getElementById('pallet-w').value) || 0,
            h: parseFloat(document.getElementById('pallet-h').value) || 0,
            weight: parseFloat(document.getElementById('pallet-weight').value) || 0,
            max_weight: parseFloat(document.getElementById('pallet-max-weight').value) || 1200,
            limit_height: document.getElementById('chk-limit-height')?.checked || false,
            max_height: parseFloat(document.getElementById('pallet-max-height-input')?.value) || 180
        },
        optimization: {
            maximize: maximizeFlag,
            mixed_pallets: document.getElementById('chk-mixed-pallets')?.checked ?? true,
            stack_load: document.getElementById('chk-stack-load')?.checked ?? true,
            force_orientation: document.getElementById('chk-force-orientation')?.checked ?? false,
            orientation_face: document.getElementById('logistics-orientation-mode')?.value || 'LxA',
            mixed_containers: document.getElementById('chk-mixed-containers')?.checked ?? true,
            sort_items: document.getElementById('chk-sort-items')?.checked ?? true,
            visual_only: document.getElementById('chk-visual-only')?.checked || false
        },
        safety_factors: {
            dims: parseFloat(document.getElementById('logistics-safety-factor-dims')?.value) || 0,
            weight: parseFloat(document.getElementById('logistics-safety-factor-weight')?.value) || 0
        },
        items: []
    };

    const rows = document.querySelectorAll('#logistics-items-table tbody tr');
    rows.forEach(row => {
        config.items.push({
            name: row.querySelector('.log-name').value,
            l: parseFloat(row.querySelector('.log-l').value) || 0,
            w: parseFloat(row.querySelector('.log-w').value) || 0,
            h: parseFloat(row.querySelector('.log-h').value) || 0,
            weight: parseFloat(row.querySelector('.log-weight').value) || 0,
            qty: parseFloat(row.querySelector('.log-qty').value) || 0,
            rel_qty: parseFloat(row.querySelector('.log-rel-qty').value) || 0
        });
    });

    try {
        const response = await fetch('/api/logistics/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        const data = await response.json();
        if (data.status === 'success') {
            showNotification("Cálculo guardado exitosamente.", "success");
            closeLogisticsSaveModal();
        } else {
            showNotification("Error al guardar: " + data.message, "error");
        }
    } catch (e) {
        console.error(e);
        showNotification("Error de conexión al guardar.", "error");
    }
}

function calculateMaxDistribution() {
    calculateLogistics(true);
}

function updateItemQuantities(newQtys) {
    const rows = document.querySelectorAll('#logistics-items-table tbody tr');
    rows.forEach(row => {
        const nameInput = row.querySelector('.log-name');
        if (nameInput && newQtys[nameInput.value] !== undefined) {
            const qtyInput = row.querySelector('.log-qty');
            if (qtyInput) qtyInput.value = newQtys[nameInput.value];
        }
    });
}


// Helper for Consistent Colors
const LOGISTICS_COLORS = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f1c40f', // Yellow
    '#9b59b6', // Purple
    '#e67e22', // Orange
    '#1abc9c', // Teal
    '#34495e', // Navy
    '#D2B48C', // Tan
    '#FFC0CB'  // Pink
];
let logisticsColorMap = {};

function getLogisticsItemColor(name, isPallet = false) {
    if (isPallet) return '#EADDCA'; // Cream for Pallets ("Pallet Base")

    // Normalize name to ensure "Cajas SKU-01" matches "Cajas SKU-01"
    if (!logisticsColorMap[name]) {
        // Assign next available color from pool
        const index = Object.keys(logisticsColorMap).length;
        logisticsColorMap[name] = LOGISTICS_COLORS[index % LOGISTICS_COLORS.length];
    }
    return logisticsColorMap[name];
}

// Tab Switcher
function switchLogisticsTab(tabName, clickedEl) { // tabName: 'summary' | 'details' | 'constraints' | '3d'
    // 1. Hide Content
    const summaryDiv = document.getElementById('logistics-summary');
    const detailsDiv = document.getElementById('logistics-details-container');
    const constraintsDiv = document.getElementById('logistics-constraints');
    const threeDiv = document.getElementById('logistics-3d-container');

    if (summaryDiv) summaryDiv.style.display = 'none';
    if (detailsDiv) detailsDiv.style.display = 'none';
    if (constraintsDiv) constraintsDiv.style.display = 'none';
    if (threeDiv) threeDiv.style.display = 'none';

    // 2. Show Selected
    if (tabName === 'summary' && summaryDiv) summaryDiv.style.display = 'block';
    if (tabName === 'details' && detailsDiv) detailsDiv.style.display = 'block';
    if (tabName === 'constraints' && constraintsDiv) {
        constraintsDiv.style.display = 'block';
        const constraintsBody = document.getElementById('logistics-constraints-body');
        if (constraintsBody) {
            constraintsBody.innerHTML = `
                <tr>
                    <td colspan="2" style="padding: 12px; text-align: center; color: var(--text-secondary);">
                        En desarrollo
                    </td>
                </tr>
            `;
        }
    }

    if (tabName === '3d') {
        if (threeDiv) {
            threeDiv.style.display = 'block';
            setTimeout(() => {
                // Resize Trigger if needed
                if (window.logisticsCamera && window.logisticsRenderer) {
                    const w = threeDiv.clientWidth;
                    const h = threeDiv.clientHeight;
                    window.logisticsCamera.aspect = w / h;
                    window.logisticsCamera.updateProjectionMatrix();
                    window.logisticsRenderer.setSize(w, h);
                }
                // TRIGGER RENDER ON TAB SWITCH if data exists
                if (typeof lastContainerData !== 'undefined' && typeof lastLogisticsData !== 'undefined' && lastContainerData && lastLogisticsData) {
                    render3DContainer(lastContainerData, lastLogisticsData.packed_items);
                }
            }, 50);
        }
    }

    // 3. Update Nav Styling
    const siblings = clickedEl.parentElement.children;
    for (let i = 0; i < siblings.length; i++) {
        siblings[i].style.borderBottom = 'none';
        siblings[i].style.color = 'var(--text-secondary)';
    }
    clickedEl.style.borderBottom = '2px solid var(--bpb-blue)';
    clickedEl.style.color = 'var(--text-primary)';
}


function renderLogisticsResults(data) {
    // --- 1. Top KPIs (Summary Tab) ---
    // --- 1. Top KPIs (Summary Tab) ---
    // Remove previous indicators
    document.querySelectorAll('.pulsing-border-red').forEach(el => el.classList.remove('pulsing-border-red'));

    // Determine Limit for Border
    // NEW LOGIC: Use backend-provided 'limiting_kpis' list if available
    const limits = data.limiting_kpis || [];

    if (limits.length > 0) {
        limits.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.closest('.kpi-card')) {
                el.closest('.kpi-card').classList.add('pulsing-border-red');
            }
        });
    } else {
        // Fallback for legacy behavior
        let borderLimitType = null;
        const unfittedFinal = data.unfitted_final_count || data.unfitted_count || 0;

        if (data.limiting_factor === 'weight') {
            borderLimitType = 'weight';
        } else if (data.limiting_factor === 'volume') {
            borderLimitType = 'volume';
        } else if (unfittedFinal > 0) {
            borderLimitType = 'volume';
        }

        if (borderLimitType === 'weight') {
            const el = document.getElementById('kpi-container-weight');
            if (el && el.closest('.kpi-card')) el.closest('.kpi-card').classList.add('pulsing-border-red');
        } else if (borderLimitType === 'volume') {
            const el = document.getElementById('kpi-container-vol');
            if (el && el.closest('.kpi-card')) el.closest('.kpi-card').classList.add('pulsing-border-red');
        }
    }

    const kpis = data.kpis || {};
    const containerType = document.getElementById('logistics-container-type').value;

    if (containerType === 'none') {
        document.getElementById('kpi-container-vol').textContent = '-';
        document.getElementById('bar-container-vol').style.width = '0%';
        document.getElementById('kpi-container-weight').textContent = '-';
        document.getElementById('bar-container-weight').style.width = '0%';
    } else {
        document.getElementById('kpi-container-vol').textContent = (kpis.container_vol || 0) + '%';
        document.getElementById('bar-container-vol').style.width = (kpis.container_vol || 0) + '%';
        document.getElementById('kpi-container-weight').textContent = (kpis.container_weight || 0) + '%';
        document.getElementById('bar-container-weight').style.width = (kpis.container_weight || 0) + '%';
    }

    document.getElementById('kpi-pallet-vol').textContent = (kpis.pallet_vol_avg || 0) + '%';
    document.getElementById('bar-pallet-vol').style.width = (kpis.pallet_vol_avg || 0) + '%';

    document.getElementById('kpi-pallet-weight').textContent = (kpis.pallet_weight_avg || 0) + '%';
    document.getElementById('bar-pallet-weight').style.width = (kpis.pallet_weight_avg || 0) + '%';

    // --- 2. POPULATE SUMMARY TABLE (Tab 1) ---
    const summaryBody = document.getElementById('logistics-summary-body');
    if (summaryBody) {
        summaryBody.innerHTML = '';

        const containerType = document.getElementById('logistics-container-type').value;
        const hasContainer = containerType !== 'none';

        // === LEVEL 1: CONTAINER (only if not 'none') ===
        if (hasContainer) {
            const cType = document.getElementById('logistics-container-type');
            const cTxt = cType.options[cType.selectedIndex].text;
            let cDims = '-';
            if (data.container_info) {
                const len = parseFloat(data.container_info.length || data.container_info.depth || 0);
                const wid = parseFloat(data.container_info.width || 0);
                const hei = parseFloat(data.container_info.height || 0);
                cDims = `${len.toFixed(0)}×${wid.toFixed(0)}×${hei.toFixed(0)}`;
            }

            // Calculate total container weight from grouped pallets
            let totalContainerWeight = 0;
            (data.grouped_pallets || []).forEach(g => {
                if (g.type === 'pallet' || g.type === 'pallet_group') {
                    totalContainerWeight += (parseFloat(g.weight_per_pallet) || 0) * g.count;
                }
            });

            const cRow = document.createElement('tr');
            cRow.style.borderBottom = '1px solid #333';
            cRow.innerHTML = `
                <td style="padding: 10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color: #888;"></span>
                        <strong style="color: #fff;">Contenedor</strong>
                    </div>
                </td>
                <td style="padding: 10px; text-align: center; color: #aaa;">${cTxt}</td>
                <td style="padding: 10px; text-align: center; color: #aaa;">${cDims}</td>
                <td style="padding: 10px; text-align: center; color: #fff;">${totalContainerWeight.toFixed(2)} kg</td>
                <td style="padding: 10px; text-align: center; color: #fff;">1</td>
            `;
            summaryBody.appendChild(cRow);
        }

        // === LEVEL 2: PALLETS (indented if container exists) ===
        const groups = data.grouped_pallets || [];
        let palletCount = 0;
        const palletsByType = {};

        // Get pallet type info for aggregation
        const pType = document.getElementById('logistics-pallet-type').value;
        const pBoards = document.getElementById('pallet-boards-count').value;
        let palletTypeName = pType.toUpperCase();
        if (pType === 'collars' || pType === 'collars_120x100') palletTypeName += ` (${pBoards} Tablas)`;

        let totalPalletWeight = 0;
        const itemTotals = {};

        // Aggregate ALL pallets and items
        groups.forEach(g => {
            if (g.type === 'pallet' || g.type === 'pallet_group') {
                palletCount += g.count;
                totalPalletWeight += (parseFloat(g.weight_per_pallet) || 0) * g.count;

                // Collect all items across ALL pallets
                g.items.forEach(item => {
                    if (!itemTotals[item.name]) {
                        itemTotals[item.name] = {
                            qty: 0,
                            weight: 0,
                            dims: item.dims,
                            unitWeight: item.weight || 0
                        };
                    }
                    itemTotals[item.name].qty += item.total_qty;
                    itemTotals[item.name].weight += (item.weight || 0) * item.total_qty;
                });
            }
        });

        // Get pallet dimensions
        let palletDims = '-';
        if (data.packed_items && data.packed_items.length > 0) {
            const firstP = data.packed_items.find(i => i.is_pallet);
            if (firstP) {
                const hVal = firstP.total_h || firstP.h;
                palletDims = `${firstP.w.toFixed(0)}×${firstP.d.toFixed(0)}×${hVal.toFixed(0)}`;
            }
        }
        if (palletDims === '-' && groups.length > 0) {
            const firstGroup = groups.find(g => g.type === 'pallet' || g.type === 'pallet_group');
            if (firstGroup) palletDims = firstGroup.dims;
        }

        // Render aggregated pallet row (single line for all pallets)
        if (palletCount > 0) {
            const pRow = document.createElement('tr');
            pRow.style.borderBottom = '1px solid #2a2a2a';

            const indent = hasContainer ? 'padding-left: 24px;' : '';
            // If container exists, pallet is child (gray). If no container, pallet is top (white).
            const mainColor = hasContainer ? '#888' : '#fff';
            const valueColor = hasContainer ? '#777' : '#ddd';

            pRow.innerHTML = `
                <td style="padding: 8px; ${indent}">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color: #dddddd;"></span>
                        <strong style="color: ${mainColor};">Pallets</strong>
                    </div>
                </td>
                <td style="padding: 8px; text-align: center; color: #777;">${palletTypeName}</td>
                <td style="padding: 8px; text-align: center; color: #777;">${palletDims}</td>
                <td style="padding: 8px; text-align: center; color: ${valueColor};">${totalPalletWeight.toFixed(2)} kg</td>
                <td style="padding: 8px; text-align: center; color: ${valueColor};">${palletCount}</td>
            `;
            summaryBody.appendChild(pRow);
        }

        // === LEVEL 3: ITEMS (aggregated, indented under pallet) ===
        Object.entries(itemTotals).forEach(([name, info]) => {
            const itemColor = getLogisticsItemColor(name, false);
            const itemRow = document.createElement('tr');
            itemRow.style.borderBottom = '1px solid #1a1a1a';

            let itemIndent = '';
            if (hasContainer && palletCount > 0) {
                itemIndent = 'padding-left: 48px;';
            } else if (hasContainer || palletCount > 0) {
                itemIndent = 'padding-left: 24px;';
            }

            itemRow.innerHTML = `
                <td style="padding: 6px; ${itemIndent}">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color: ${itemColor};"></span>
                        <span style="color: #666;">${name}</span>
                    </div>
                </td>
                <td style="padding: 6px; text-align: center; color: #555;">-</td>
                <td style="padding: 6px; text-align: center; color: #555;">${info.dims}</td>
                <td style="padding: 6px; text-align: center; color: #666;">${info.weight.toFixed(2)} kg</td>
                <td style="padding: 6px; text-align: center; color: #666;">${info.qty}</td>
            `;
            summaryBody.appendChild(itemRow);
        });

        // If no pallets, show the items directly
        if (palletCount === 0 && Object.keys(itemTotals).length === 0 && data.packed_items && data.packed_items.length > 0) {
            // Count items by name
            const itemCounts = {};
            data.packed_items.forEach(item => {
                if (item.name !== 'PALLET_BASE') {
                    if (!itemCounts[item.name]) {
                        itemCounts[item.name] = {
                            count: 0,
                            weight: 0,
                            dims: `${item.w}×${item.h}×${item.d}`,
                            unitWeight: item.weight || 0
                        };
                    }
                    itemCounts[item.name].count++;
                    itemCounts[item.name].weight += item.weight || 0;
                }
            });

            Object.entries(itemCounts).forEach(([name, info]) => {
                const itemColor = getLogisticsItemColor(name, false);
                const itemRow = document.createElement('tr');
                itemRow.style.borderBottom = '1px solid #2a2a2a';

                const indent = hasContainer ? 'padding-left: 24px;' : '';

                itemRow.innerHTML = `
                    <td style="padding: 8px; ${indent}">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color: ${itemColor};"></span>
                            <span style="color: #eee;">${name}</span>
                        </div>
                    </td>
                    <td style="padding: 8px; text-align: center; color: #888;">-</td>
                    <td style="padding: 8px; text-align: center; color: #888;">${info.dims}</td>
                    <td style="padding: 8px; text-align: center; color: #ddd;">${info.weight.toFixed(2)} kg</td>
                    <td style="padding: 8px; text-align: center; color: #ddd;">${info.count}</td>
                `;
                summaryBody.appendChild(itemRow);
            });
        }
    }


    // --- 3. POPULATE CONSTRAINTS TABLE (Tab 3) ---
    // Highlight Limiting Factor(s)
    const constraintsBody = document.getElementById('logistics-constraints-body');
    if (constraintsBody) {
        constraintsBody.innerHTML = '';

        // Clear previous card highlights
        ['kpi-container-vol', 'kpi-pallet-vol', 'kpi-container-weight', 'kpi-pallet-weight'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const card = el.closest('.kpi-card');
                if (card) card.classList.remove('kpi-limit');
            }
        });

        const unfittedCount = data.unfitted_count || 0;
        const limits = data.limiting_kpis || [];

        let hasLimitIssues = (unfittedCount > 0);

        // Determine Loading Name (Hoisted)
        let loadName = "Carga General";
        if (data.grouped_pallets && data.grouped_pallets.length > 0) {
            try { loadName = data.grouped_pallets[0].items[0].name; } catch (e) { }
        } else if (data.packed_items && data.packed_items.length > 0) {
            loadName = data.packed_items[0].name;
        }

        if (hasLimitIssues || data.limiting_factor) {
            // Unfitted Items Row if meaningful
            if (unfittedCount > 0) {
                constraintsBody.innerHTML += `
                    <tr>
                        <td style="padding: 10px; color: #ff6b6b; font-weight: bold; border-bottom: 1px solid #333;">Items No Cargados</td>
                        <td style="padding: 10px; color: #ff6b6b; font-weight: bold; border-bottom: 1px solid #333;">${unfittedCount} unidades</td>
                    </tr>
                `;
            }



            // Analyze Limits from Backend Factor
            let explanation = 'Espacio/Geometría Agotado';
            let color = '#ff4444'; // Always Red as requested

            if (data.limiting_factor === 'weight') {
                explanation = 'Peso Máximo del Contenedor Alcanzado';
            } else if (data.limiting_factor === 'volume') {
                explanation = 'Espacio/Volumen del Contenedor Agotado';
            }

            constraintsBody.innerHTML += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #333;">${loadName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #333; color: ${color}; font-weight: bold;">${explanation}</td>
                </tr>
            `;

        } else {
            // SUCCESS CASE - Determine likely limiting factor for future
            const kpis = data.kpis || {};
            const wPct = parseFloat(kpis.container_weight || 0);
            const vPct = parseFloat(kpis.container_vol || 0);

            let closest = 'Volumen';
            if (wPct > vPct) closest = 'Peso';

            constraintsBody.innerHTML = `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #333;">${loadName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #333; color: #2ecc71; font-weight: bold;">Carga Completa (Limitante más cercana: ${closest})</td>
                </tr>
            `;
        }

    }


    // Packed Count Update (Top Visualization)
    // Recalculate just in case
    // Packed Count Update (Top Visualization)
    // Recalculate just in case
    // NOTE: 'packedCount' and 'totalCount' should NOT be redeclared if they were declared earlier.
    // However, looking at previous blocks, they might NOT be in scope if declared in 'if' blocks.
    // But to be safe and avoid syntax errors, we use new variable names or assignment.
    const finalPackedCount = (data.packed_items || []).filter(i => i.name !== 'PALLET_BASE').length;
    const finalTotalCount = finalPackedCount + (data.unfitted_count || 0);
    document.getElementById('kpi-packed-count').textContent = `${finalPackedCount}/${finalTotalCount}`;


    // --- 2. TABLE List ---
    const tableBody = document.getElementById('logistics-result-body');
    tableBody.innerHTML = ''; // Clear

    // Reset Color Map on new render (we will re-assign colors as we iterate)
    logisticsColorMap = {};

    // Unfitted Warning (Row)
    if (data.unfitted_items && data.unfitted_items.length > 0) {
        const tr = document.createElement('tr');
        tr.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
        tr.innerHTML = `
            <td colspan="4" style="padding: 10px; color: #ff6b6b; font-weight: bold;">
                ⚠️ ${data.unfitted_items.length} items no pudieron ser cargados.
            </td>
        `;
        tableBody.appendChild(tr);
    }

    // Render Grouped Pallets
    const groups = data.grouped_pallets || [];

    if (groups.length === 0 && (!data.unfitted_items || data.unfitted_items.length === 0)) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1rem;">Sin resultados</td></tr>';
    }

    groups.forEach(group => {
        if (group.type === 'pallet' || group.type === 'pallet_group') {
            // Parent Row (Pallet Type)
            const trPallet = document.createElement('tr');
            trPallet.style.borderBottom = '1px solid #333';
            trPallet.style.backgroundColor = '#1e1e1e'; // Slightly lighter than bg

            // Calc Total Weight for this Pallet Type in Container
            // totalWeightInCont (Gross)
            const totalWeightInCont = (parseFloat(group.weight_per_pallet) * group.count).toFixed(2);

            // Net Load Weight (if available, otherwise fallback)
            const netWeight = group.load_weight_per_pallet ? parseFloat(group.load_weight_per_pallet) : parseFloat(group.weight_per_pallet);
            // Pallet Base Weight
            const palletBaseWeight = (parseFloat(group.weight_per_pallet) - netWeight).toFixed(1);

            trPallet.innerHTML = `
                <td style="padding: 8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color: #dddddd;"></span>
                        <strong style="color: #eee;">${group.name}</strong> 
                    </div>
                </td>
                <td style="padding: 8px; color: #888; font-size: 0.85em;">${group.dims}</td>
                <td style="padding: 8px; text-align: right; color: #ddd;">
                    <div>${parseFloat(group.weight_per_pallet).toFixed(2)} kg</div>
                    ${palletBaseWeight > 0 ? `<div style="font-size:0.75em; color:#666;">(+${palletBaseWeight} Plt)</div>` : ''}
                </td>
                <td style="padding: 8px; text-align: center; color: #ddd;">-</td>
                <td style="padding: 8px; text-align: right; color: #ddd;">${totalWeightInCont} kg</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: var(--success-color);">${group.count} U.</td>
            `;
            tableBody.appendChild(trPallet);

            // Child Rows (Items)
            group.items.forEach(item => {
                // Get/Set Color
                const namingKey = item.name;
                const color = getLogisticsItemColor(namingKey, false);

                // Check for valid weight
                const unitWeight = item.weight || 0;

                // Weight per pallet for this item = weight * qty_per_pallet
                const weightPerPalletItem = (unitWeight * item.qty_per_pallet).toFixed(2);

                const totalWeightItem = (unitWeight * item.total_qty).toFixed(2);

                const trItem = document.createElement('tr');
                trItem.style.borderBottom = '1px solid #2a2a2a';
                trItem.innerHTML = `
                    <td style="padding: 6px 6px 6px 24px;"> <!-- Indent -->
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color: ${color};"></span>
                            <span style="color: #ccc;">${item.name}</span>
                        </div>
                    </td>
                    <td style="padding: 6px; color: #666; font-size: 0.85em;">${item.dims}</td>
                    <td style="padding: 6px; text-align: right; color: #999;">${weightPerPalletItem} kg</td>
                    <td style="padding: 6px; text-align: center; color: #ccc;">${item.qty_per_pallet} U.</td>
                    <td style="padding: 6px; text-align: right; color: #999;">${totalWeightItem} kg</td>
                    <td style="padding: 6px; text-align: right; color: #ccc;">${item.total_qty} U.</td>
                `;
                tableBody.appendChild(trItem);
            });

        } else if (group.type === 'loose_item') {
            // Single Row for loose items (non-palletized)
            const namingKey = group.name;
            const color = getLogisticsItemColor(namingKey, false);
            const totalWeight = (group.weight_unit * group.total_qty).toFixed(2);

            const trObj = document.createElement('tr');
            trObj.style.borderBottom = '1px solid #333';
            trObj.innerHTML = `
                <td style="padding: 8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color: ${color};"></span>
                        <span style="color: #eee;">${group.name}</span>
                    </div>
                </td>
                <td style="padding: 8px; color: #888; font-size: 0.85em;">${group.dims}</td>
                <td style="padding: 8px; text-align: right; color: #ddd;">${group.weight_unit} kg/u</td>
                <td style="padding: 8px; text-align: center; color: #666;">-</td>
                <td style="padding: 8px; text-align: right; color: #ddd;">${totalWeight} kg</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: var(--success-color);">${group.total_qty} U.</td>
            `;
            tableBody.appendChild(trObj);
        }
    });

    // If 3D tab is already open, render immediately (no tab switch needed)
    const threeDiv = document.getElementById('logistics-3d-container');
    if (threeDiv && getComputedStyle(threeDiv).display !== 'none') {
        setTimeout(() => {
            // Resize renderer to visible container
            if (window.logisticsCamera && window.logisticsRenderer) {
                const w = threeDiv.clientWidth;
                const h = threeDiv.clientHeight;
                window.logisticsCamera.aspect = w / h;
                window.logisticsCamera.updateProjectionMatrix();
                window.logisticsRenderer.setSize(w, h);
            }
            if (typeof lastContainerData !== 'undefined' && typeof lastLogisticsData !== 'undefined' && lastContainerData && lastLogisticsData) {
                render3DContainer(lastContainerData, lastLogisticsData.packed_items);
            }
        }, 50);
    }
}

function resetLogisticsCalculator() {
    // Inputs: pallet/container
    lastLogisticsMaximize = false;
    const palletType = document.getElementById('logistics-pallet-type');
    if (palletType) palletType.value = 'none';
    const containerType = document.getElementById('logistics-container-type');
    if (containerType) containerType.value = 'none';

    const boards = document.getElementById('pallet-boards-count');
    if (boards) boards.value = '4';

    const palletL = document.getElementById('pallet-l');
    const palletW = document.getElementById('pallet-w');
    const palletH = document.getElementById('pallet-h');
    const palletWeight = document.getElementById('pallet-weight');
    if (palletL) palletL.value = '';
    if (palletW) palletW.value = '';
    if (palletH) palletH.value = '';
    if (palletWeight) palletWeight.value = '';

    const palletMaxW = document.getElementById('pallet-max-weight');
    if (palletMaxW) palletMaxW.value = 1200;

    const chkLimit = document.getElementById('chk-limit-height');
    if (chkLimit) chkLimit.checked = false;
    const maxHInput = document.getElementById('pallet-max-height-input');
    if (maxHInput) maxHInput.value = 180;

    const contL = document.getElementById('cont-l');
    const contW = document.getElementById('cont-w');
    const contH = document.getElementById('cont-h');
    const contWeight = document.getElementById('cont-weight');
    if (contL) contL.value = 590;
    if (contW) contW.value = 235;
    if (contH) contH.value = 239;
    if (contWeight) contWeight.value = 28000;

    const sfDims = document.getElementById('logistics-safety-factor-dims');
    const sfWeight = document.getElementById('logistics-safety-factor-weight');
    if (sfDims) sfDims.value = 0;
    if (sfWeight) sfWeight.value = 0;

    const chkMixedPal = document.getElementById('chk-mixed-pallets');
    if (chkMixedPal) chkMixedPal.checked = true;

    const chkStackLoad = document.getElementById('chk-stack-load');
    if (chkStackLoad) chkStackLoad.checked = true;

    const chkForceOrient = document.getElementById('chk-force-orientation');
    if (chkForceOrient) chkForceOrient.checked = false;
    const orientSelect = document.getElementById('logistics-orientation-mode');
    if (orientSelect) orientSelect.value = 'LxA';
    toggleForceOrientation();

    // Apply presets after setting types
    if (typeof updatePalletPresets === 'function') updatePalletPresets();
    if (typeof updateContainerPresets === 'function') updateContainerPresets();

    // Clear items table
    const itemsBody = document.querySelector('#logistics-items-table tbody');
    if (itemsBody) itemsBody.innerHTML = '';

    // Reset status
    const statusEl = document.getElementById('logistics-status');
    if (statusEl) statusEl.textContent = '';

    // Reset KPIs
    const kpiContainerVol = document.getElementById('kpi-container-vol');
    const kpiContainerWeight = document.getElementById('kpi-container-weight');
    const kpiPalletVol = document.getElementById('kpi-pallet-vol');
    const kpiPalletWeight = document.getElementById('kpi-pallet-weight');
    const kpiPacked = document.getElementById('kpi-packed-count');

    if (kpiContainerVol) kpiContainerVol.textContent = '-';
    if (kpiContainerWeight) kpiContainerWeight.textContent = '-';
    if (kpiPalletVol) kpiPalletVol.textContent = '0%';
    if (kpiPalletWeight) kpiPalletWeight.textContent = '0%';
    if (kpiPacked) kpiPacked.textContent = '0/0';

    const barContainerVol = document.getElementById('bar-container-vol');
    const barContainerWeight = document.getElementById('bar-container-weight');
    const barPalletVol = document.getElementById('bar-pallet-vol');
    const barPalletWeight = document.getElementById('bar-pallet-weight');
    if (barContainerVol) barContainerVol.style.width = '0%';
    if (barContainerWeight) barContainerWeight.style.width = '0%';
    if (barPalletVol) barPalletVol.style.width = '0%';
    if (barPalletWeight) barPalletWeight.style.width = '0%';

    document.querySelectorAll('.pulsing-border-red').forEach(el => el.classList.remove('pulsing-border-red'));

    // Reset result tables
    const summaryBody = document.getElementById('logistics-summary-body');
    if (summaryBody) summaryBody.innerHTML = '';
    const constraintsBody = document.getElementById('logistics-constraints-body');
    if (constraintsBody) constraintsBody.innerHTML = '';
    const resultBody = document.getElementById('logistics-result-body');
    if (resultBody) {
        resultBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    Configure el contenedor y la carga para ver resultados.
                </td>
            </tr>
        `;
    }

    // Reset 3D view
    const viewer = document.getElementById('3d-viewer');
    if (viewer) viewer.innerHTML = '';
    lastLogisticsData = null;
    lastContainerData = null;

    // Reset tab to Summary
    const summaryTab = document.querySelector("#view-logistics [onclick=\"switchLogisticsTab('summary', this)\"]");
    if (summaryTab && typeof switchLogisticsTab === 'function') {
        switchLogisticsTab('summary', summaryTab);
    }
}



// Global variable for 3D Scene to allow reset
let logisticsScene = null;
let logisticsRenderer = null;
let logisticsCamera = null;

function render3DContainer(containerDims, items) {
    const containerDiv = document.getElementById('3d-viewer');
    containerDiv.innerHTML = ''; // Clear previous

    if (!window.THREE) {
        containerDiv.innerHTML = '<div style="color:white;text-align:center;padding-top:100px;">Three.js no cargado.</div>';
        return;
    }

    // Dims
    const W = containerDims.width;
    const H = containerDims.height;
    const D = containerDims.depth;

    // Check if Virtual
    const isVirtual = (containerDims.name === "Espacio Virtual" || containerDims.name === "Virtual Floor" || containerDims.name.includes("Sin Contenedor"));

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    logisticsScene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, containerDiv.clientWidth / containerDiv.clientHeight, 1, 10000);
    // Position camera: Back and Up
    camera.position.set(W * 1.5, H * 2, D * 2);
    // If virtual (huge floor), maybe zoom out more?
    // Actually, camera.lookAt should center on the CONTENT if virtual? 
    // For now keep standard center
    camera.lookAt(W / 2, H / 2, D / 2);
    logisticsCamera = camera;

    // A bit of light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(200, 500, 300);
    scene.add(dirLight);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerDiv.clientWidth, containerDiv.clientHeight);

    // FORCE CSS FULL SIZE (Critical for responsive resize)
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    containerDiv.appendChild(renderer.domElement);
    logisticsRenderer = renderer;

    let controls = null;
    if (window.THREE.OrbitControls) {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(W / 2, H / 2, D / 2);
        controls.update();
    }

    // --- DRAW CONTAINER ---
    // Only draw red wireframe if NOT virtual
    if (!isVirtual) {
        const geometry = new THREE.BoxGeometry(W, H, D);
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff0000 })); // RED BORDER
        // Shift to center (0,0,0) at W/2, H/2, D/2
        line.position.set(W / 2, H / 2, D / 2);
        scene.add(line);
    } else {
        // Calculate Bounds of Content
        let maxX = 0;
        let maxZ = 0;
        let maxY = 0;

        items.forEach(item => {
            const x = (item.x || 0) + item.w;
            const z = (item.z || 0) + item.d;
            const y = (item.y || 0) + item.h;
            if (x > maxX) maxX = x;
            if (z > maxZ) maxZ = z;
            if (y > maxY) maxY = y;
        });

        // Add padding (e.g. 50%)
        const contentMax = Math.max(maxX, maxZ);
        const gridSize = Math.max(contentMax * 1.5, 200);

        const gridHelper = new THREE.GridHelper(gridSize, 10);
        gridHelper.position.set(contentMax / 2, 0, contentMax / 2);
        scene.add(gridHelper);

        // Adjust Camera to focus on content
        if (logisticsCamera) {
            const cx = maxX / 2;
            const cy = maxY / 2;
            const cz = maxZ / 2;

            // Move camera closer than the default huge container view
            logisticsCamera.position.set(cx * 2 + 100, cy * 3 + 100, cz * 2 + 100);
            logisticsCamera.lookAt(cx, cy, cz);

            // Update Controls Target to actually rotate around the content
            if (controls) {
                controls.target.set(cx, cy, cz);
                controls.update();
            }
        }
    }

    // --- DRAW ITEMS ---
    items.forEach(item => {
        const isPallet = item.is_pallet;
        const isCollarsPallet = isPallet && (item.pallet_type === 'collars' || item.pallet_type === 'collars_120x100');
        const color = getLogisticsItemColor(item.name, isPallet);

        // Material
        let material;
        if (isCollarsPallet) {
            // Collars Base (Solid Wood - Opaque) 
            material = new THREE.MeshLambertMaterial({
                color: 0xD2B48C,
                transparent: false,
                opacity: 1.0
            });
        } else {
            // Items/Standard Pallets (Opaque - "No dimuniado")
            material = new THREE.MeshLambertMaterial({
                color: color,
                transparent: false,
                opacity: 1.0
            });
        }

        // Position & Geometry Calculation
        // Center of cube needs to be at x + w/2, y + h/2, z + d/2

        let h_draw = item.h_visual || item.h;
        let final_h = h_draw;

        // SPECIAL LOGIC FOR COLLARS:
        // The "Main Cube" should NOT be the full volume (which covers items). 
        // It should only be the Base. The Walls provide the height visual.
        const IS_COLLARS = isCollarsPallet;
        if (IS_COLLARS) {
            final_h = item.h; // Use the base height defined by backend (e.g. 15.9)
        }

        const geometry = new THREE.BoxGeometry(item.w, final_h, item.d);
        const cube = new THREE.Mesh(geometry, material);

        cube.position.x = item.x + item.w / 2;
        cube.position.y = item.y + final_h / 2;
        cube.position.z = item.z + item.d / 2;

        scene.add(cube);

        // Edges
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        const line = new THREE.LineSegments(edges, lineMat);
        line.position.copy(cube.position);
        scene.add(line);

        // SPECIAL RENDERING FOR COLLARS
        if (isCollarsPallet) {
            // Draw 4 Walls
            // Outer dimensions: 120x80. Inner: 116.2x76.2.
            // Wall Thickness: 1.9.
            // Height: h_draw (Total) - 15 (Base).

            const baseH = 15;
            const wallH = h_draw - baseH;
            const wallThick = 1.9;

            if (wallH > 0) {
                // Wall Material (Lighter Wood) - Very Transparent (0.2)
                const wallMat = new THREE.MeshLambertMaterial({ color: 0xF5DEB3, transparent: true, opacity: 0.2 });
                const wallLineMat = new THREE.LineBasicMaterial({ color: 0x8B4513 });

                // 1. Long Walls (Front/Back) - along Width
                // Dim: W x WallH x WallThick.
                // Pos: x + W/2, y + BaseH + WallH/2, z + (D/2 +/- (D/2 - Thick/2))

                const longWallGeo = new THREE.BoxGeometry(item.w, wallH, wallThick);

                // Front Wall (at Z=0 relative to pallet start?)
                // Pallet Z starts at item.z. Ends at item.z + item.d.
                // Wall 1 center Z: item.z + wallThick/2.
                const wall1 = new THREE.Mesh(longWallGeo, wallMat);
                wall1.position.set(item.x + item.w / 2, item.y + baseH + wallH / 2, item.z + wallThick / 2);
                scene.add(wall1);

                // Back Wall
                // Wall 2 center Z: item.z + item.d - wallThick/2.
                const wall2 = new THREE.Mesh(longWallGeo, wallMat);
                wall2.position.set(item.x + item.w / 2, item.y + baseH + wallH / 2, item.z + item.d - wallThick / 2);
                scene.add(wall2);

                // 2. Short Walls (Left/Right) - along Depth (between long walls)
                // Dim: WallThick x WallH x (D - 2*WallThick).
                // Pos: x + (W/2 +/- ...), ...

                const shortWallGeo = new THREE.BoxGeometry(wallThick, wallH, item.d - 2 * wallThick);

                // Left Wall
                const wall3 = new THREE.Mesh(shortWallGeo, wallMat);
                wall3.position.set(item.x + wallThick / 2, item.y + baseH + wallH / 2, item.z + item.d / 2);
                scene.add(wall3);

                // Right Wall
                const wall4 = new THREE.Mesh(shortWallGeo, wallMat);
                wall4.position.set(item.x + item.w - wallThick / 2, item.y + baseH + wallH / 2, item.z + item.d / 2);
                scene.add(wall4);

                // Add Line Helper for Limit Volume (Top Edge)
                const limitGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(item.w, wallH, item.d));
                const limitLine = new THREE.LineSegments(limitGeo, new THREE.LineBasicMaterial({ color: 0x8B4513 }));
                limitLine.position.set(item.x + item.w / 2, item.y + baseH + wallH / 2, item.z + item.d / 2);
                scene.add(limitLine);
            }
        }
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
}





// --- MULTIPLAYER ARKANOID LOGIC ---
var socket = null;
var gameRoomId = null;
var playerRole = null; // 'host' or 'client'
var gameActive = false;
var animationFrameId = null;

// Game State
var paddle1 = { x: 350, y: 580, width: 100, height: 10 };
var paddle2 = { x: 350, y: 10, width: 100, height: 10 };
var ball = { x: 400, y: 300, dx: 0, dy: 0, radius: 5 };
var score = { p1: 0, p2: 0 };
var canvas = null;
var ctx = null;

// Online Users List (Global)
window.onlineUsers = [];

function initializeSocket() {
    if (socket) return; // Already connected

    // Connect to namespace (default)
    socket = io();

    socket.on('connect', () => {
        console.log('Socket Connected:', socket.id);
        // Identify ourselves if logged in
        if (typeof currentUser !== 'undefined' && currentUser) {
            socket.emit('identify', { username: currentUser });
        }
    });

    socket.on('user_list_update', (users) => {
        window.onlineUsers = users;
        renderOnlineUsers();
    });

    socket.on('receive_invite', (data) => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '¡Invitación de Juego!',
                text: `${data.sender} te invita a jugar Arkanoid.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Rechazar'
            }).then((result) => {
                if (result.isConfirmed) {
                    socket.emit('accept_invite', { sender: data.sender, sender_sid: data.sender_sid });
                }
            });
        }
    });

    socket.on('start_game', (data) => {
        gameRoomId = data.room_id;
        playerRole = data.role;
        showGameRoom();
        startGameLoop();
    });

    socket.on('game_state_sync', (data) => {
        if (!gameActive) return;
        if (data.type === 'paddle') {
            // Update opponent paddle
            if (playerRole === 'host') {
                // I am Host (P1), opponent is Client (P2). P2 paddle is paddle2.
                paddle2.x = data.x;
            } else {
                paddle1.x = data.x;
            }
        } else if (data.type === 'ball') {
            ball = data.ball;
        } else if (data.type === 'score') {
            score = data.score;
            updateScoreUI();
        }
    });
}

function showInviteModal() {
    const modal = document.getElementById('invite-modal');
    if (modal) {
        modal.display = 'flex'; // Fix: modal is often overlay
        modal.style.display = 'flex';
        renderOnlineUsers();
    }
}

function closeInviteModal() {
    const modal = document.getElementById('invite-modal');
    if (modal) modal.style.display = 'none';
}

function renderOnlineUsers() {
    const list = document.getElementById('online-users-list');
    if (!list || !window.onlineUsers) return;

    list.innerHTML = '';
    window.onlineUsers.forEach(u => {
        // Skip self
        if (typeof currentUser !== 'undefined' && u.username === currentUser) return;

        const div = document.createElement('div');
        div.style.padding = '8px';
        div.style.borderBottom = '1px solid #333';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';

        const span = document.createElement('span');
        span.textContent = u.username || 'Usuario';
        span.style.color = 'white';

        const btn = document.createElement('button');
        btn.className = 'btn btn-sm';
        btn.textContent = 'Invitar';
        btn.onclick = () => {
            socket.emit('send_invite', { target_user: u.username, target_sid: u.sid, sender_user: currentUser });
            if (typeof Swal !== 'undefined') Swal.fire('Invitación enviada', '', 'success');
            closeInviteModal();
        };

        div.appendChild(span);
        div.appendChild(btn);
        list.appendChild(div);
    });

    if (list.children.length === 0) {
        list.innerHTML = '<p style="color:#aaa;">No hay usuarios disponibles.</p>';
    }
}

function showGameRoom() {
    hideAllViews();
    const view = document.getElementById('view-game-room');
    if (view) view.style.display = 'block';

    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        document.addEventListener('keydown', handleGameInput);
        // Focus window
        window.focus();
    }

    const overlay = document.getElementById('game-waiting-overlay');
    if (overlay) overlay.style.display = 'none';

    const resultOverlay = document.getElementById('game-result-overlay');
    if (resultOverlay) resultOverlay.style.display = 'none';
}

function leaveGame() {
    gameActive = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    if (gameRoomId && socket) {
        // Disconnect logic
        socket.emit('leave_game', { room: gameRoomId });
    }

    gameRoomId = null;
    showHome();
}

function handleGameInput(e) {
    if (!gameActive || !canvas) return;

    const speed = 20;

    let myPaddle = (playerRole === 'host') ? paddle1 : paddle2;
    let oldX = myPaddle.x;

    if (e.key === 'ArrowLeft') {
        myPaddle.x -= speed;
    } else if (e.key === 'ArrowRight') {
        myPaddle.x += speed;
    }

    // Clamp
    if (myPaddle.x < 0) myPaddle.x = 0;
    if (myPaddle.x + myPaddle.width > canvas.width) myPaddle.x = canvas.width - myPaddle.width;

    // Send update only if changed
    if (myPaddle.x !== oldX) {
        socket.emit('game_update', {
            room_id: gameRoomId,
            type: 'paddle',
            x: myPaddle.x,
            role: playerRole
        });
    }
}

function startGameLoop() {
    gameActive = true;
    loop();

    if (playerRole === 'host') {
        resetBall();
    }
}

function resetBall() {
    ball.x = 400;
    ball.y = 300;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
}

function loop() {
    if (!gameActive) return;

    updatePhysics();
    draw();

    animationFrameId = requestAnimationFrame(loop);
}

function updatePhysics() {
    if (playerRole === 'host') {
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Walls
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) ball.dx *= -1;

        // Goals (Reset or Win)
        if (ball.y < 0) {
            // P2 Missed -> P1 Score
            score.p1++;
            resetBall();
        } else if (ball.y > canvas.height) {
            // P1 Missed -> P2 Score
            score.p2++;
            resetBall();
        }

        // Paddles collisions
        if (ball.y - ball.radius < paddle2.y + paddle2.height &&
            ball.y - ball.radius > paddle2.y &&
            ball.x > paddle2.x && ball.x < paddle2.x + paddle2.width) {
            ball.dy = Math.abs(ball.dy);
        }

        if (ball.y + ball.radius > paddle1.y &&
            ball.y + ball.radius < paddle1.y + paddle1.height &&
            ball.x > paddle1.x && ball.x < paddle1.x + paddle1.width) {
            ball.dy = -Math.abs(ball.dy);
        }

        // Sync Ball & Score
        socket.emit('game_update', {
            room_id: gameRoomId,
            type: 'ball',
            ball: ball
        });
        socket.emit('game_update', {
            room_id: gameRoomId,
            type: 'score',
            score: score
        });
        updateScoreUI();
    }
}

function draw() {
    if (!ctx) return;
    // Clear
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Paddles
    ctx.fillStyle = '#00a8e0'; // P1 (Blue - Host)
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);

    ctx.fillStyle = '#cf1625'; // P2 (Red - Client)
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
}

function updateScoreUI() {
    const s1 = document.getElementById('p1-score');
    const s2 = document.getElementById('p2-score');
    if (s1) s1.textContent = score.p1;
    if (s2) s2.textContent = score.p2;
}

// Auto-Initialize Socket when User is detected
setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser && (!socket || !socket.connected)) {
        if (typeof initializeSocket === 'function') {
            initializeSocket();
        }
    }
}, 2000);


function ensureIsoCorrectiveModal() {
    let modal = document.getElementById('iso-corrective-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'iso-corrective-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-confirm-wrapper" style="width: 520px; max-width: 92%;">
            <h3 style="margin-top:0; color: var(--bpb-blue);">Accion Correctiva</h3>
            <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.75rem;">
                Complete la accion correctiva para continuar.
            </div>
            <textarea id="iso-corrective-text" class="line-input"
                style="width: 100%; min-height: 120px; resize: vertical; border: 1px solid var(--border); border-radius: 6px; padding: 0.6rem;"></textarea>
            <div class="modal-actions" style="justify-content: flex-end; margin-top: 1rem; gap: 0.5rem;">
                <button class="btn" onclick="closeIsoCorrectiveModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="confirmIsoCorrectiveAction()">Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function openIsoCorrectiveModal(recordId, row, notifId) {
    const modal = ensureIsoCorrectiveModal();
    if (!modal) return;
    modal.style.display = 'flex';
    modal.dataset.recordId = recordId || '';
    modal.dataset.row = row || '';
    modal.dataset.notifId = notifId || '';
    const textarea = document.getElementById('iso-corrective-text');
    if (textarea) textarea.value = '';
}

function closeIsoCorrectiveModal() {
    const modal = document.getElementById('iso-corrective-modal');
    if (modal) modal.style.display = 'none';
}

async function confirmIsoCorrectiveAction() {
    const modal = document.getElementById('iso-corrective-modal');
    if (!modal) return;
    const recordId = modal.dataset.recordId;
    const row = modal.dataset.row;
    const notifId = modal.dataset.notifId;
    const textarea = document.getElementById('iso-corrective-text');
    const accion = (textarea ? textarea.value : '').trim();
    if (!accion) {
        if (typeof showNotification === 'function') showNotification('Ingrese la accion correctiva.', 'error');
        return;
    }
    const rec = getIsoTrackingRecordByNumero(recordId) || getIsoTrackingRecordByDesc(recordId);
    const bp = rec && rec.descripcion ? rec.descripcion : '';
    if (!bp || !row) {
        if (typeof showNotification === 'function') showNotification('No se pudo desaprobar.', 'error');
        return;
    }
    try {
        const res = await fetch('/api/iso-r01902-approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bp, row, status: 'No Aprobado', accion })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data || data.status !== 'success') {
            const msg = data && data.message ? data.message : 'No se pudo desaprobar.';
            if (typeof showNotification === 'function') showNotification(msg, 'error');
            return;
        }
        if (notifId) {
            await markNotificationRead(notifId);
            await loadNotifications();
        }
        if (typeof showNotification === 'function') showNotification('Evento desaprobado.', 'success');
        await loadIsoTrackingEventsFromR01902(rec);
        closeIsoCorrectiveModal();
    } catch (e) {
        console.error('Reject event failed', e);
        if (typeof showNotification === 'function') showNotification('Error desaprobando el evento.', 'error');
    }
}
