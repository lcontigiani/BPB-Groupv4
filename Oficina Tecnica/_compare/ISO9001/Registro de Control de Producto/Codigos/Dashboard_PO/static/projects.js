// --- Projects & Solids Management Module ---

let currentViewProject = null;

// Navigation
function showProjectsView() {
    if (typeof hideAllViews === 'function') hideAllViews();
    else {
        // Fallback hide if hideAllViews is not available
        document.querySelectorAll('.panel, #view-home, #view-sub-home-activity').forEach(el => el.style.display = 'none');
    }

    const view = document.getElementById('view-projects');
    if (view) {
        view.style.display = 'block';
        if (typeof animateEntry === 'function') animateEntry('view-projects');
        renderProjectsTable();
        // Save view state
        localStorage.setItem('lastView', 'projects');
    }
}

function showSolidsView(projectId, projectName) {
    if (typeof hideAllViews === 'function') hideAllViews();
    else {
        document.querySelectorAll('.panel, #view-home, #view-sub-home-activity').forEach(el => el.style.display = 'none');
    }

    const view = document.getElementById('view-solids');
    if (view) {
        view.style.display = 'block';
        if (typeof animateEntry === 'function') animateEntry('view-solids');

        currentViewProject = { id: projectId, name: projectName };

        document.getElementById('solids-project-name').textContent = projectName;
        renderSolidsTable(projectId);
    }
}

// Data Fetching & Rendering
async function renderProjectsTable() {
    const tbody = document.getElementById('projects-list-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando proyectos...</td></tr>';

    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();

        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay proyectos registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        projects.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: bold; color: var(--bpb-blue);">${p.name}</td>
                <td>${p.date || '-'}</td>
                <td><span class="status-badge ${p.status === 'Activo' ? 'approved' : 'pending'}">${p.status}</span></td>
                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.description || '-'}</td>
                <td>
                    <button class="btn btn-sm" onclick="showSolidsView('${p.id}', '${p.name}')">Ver Sólidos</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error loading projects:", e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--bpb-blue);">Error al cargar proyectos.</td></tr>';
    }
}

async function renderSolidsTable(projectId) {
    const tbody = document.getElementById('solids-list-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando sólidos...</td></tr>';

    try {
        const response = await fetch(`/api/solids/${projectId}`);
        const solids = await response.json();

        if (solids.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay sólidos cargados para este proyecto.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        solids.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: bold;">${s.name}</td>
                <td>${s.revision || 'R.0'} ${s.date ? `<br><small style="color: var(--text-secondary);">${s.date}</small>` : ''}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm" onclick="viewSolidFile('${s.filename}')">Ver Archivo</button>
                        <a href="/solids/${encodeURIComponent(s.filename)}" download class="btn btn-sm" style="text-decoration: none;">Descargar</a>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error loading solids:", e);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="color: var(--bpb-blue);">Error al cargar sólidos.</td></tr>';
    }
}

// Modals
function showAddProjectModal() {
    const modal = document.getElementById('add-project-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAddProjectModal() {
    const modal = document.getElementById('add-project-modal');
    if (modal) modal.style.display = 'none';
}

async function confirmAddProject() {
    const nameInput = document.getElementById('new-project-name');
    const name = nameInput.value.trim();

    if (!name) {
        alert("Por favor ingrese un nombre.");
        return;
    }

    const newProj = {
        id: Date.now().toString(),
        name: name,
        date: new Date().toLocaleDateString(),
        status: "Activo",
        description: "Proyecto Activo",
        solids: []
    };

    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProj)
        });

        const res = await response.json();
        if (res.status === 'success') {
            closeAddProjectModal();
            renderProjectsTable();
            nameInput.value = '';
        } else {
            alert("Error: " + res.message);
        }
    } catch (e) {
        console.error("Error adding project:", e);
    }
}

function showAddSolidModal() {
    const modal = document.getElementById('add-solid-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAddSolidModal() {
    const modal = document.getElementById('add-solid-modal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        document.getElementById('new-solid-name').value = '';
        document.getElementById('new-solid-revision').value = '';
        clearSolidFile();
    }
}

// File Upload Logic for Solids
function handleSolidFileSelect(input) {
    const file = input.files[0];
    if (file) {
        document.getElementById('upload-placeholder-solid').style.display = 'none';
        document.getElementById('preview-container-solid').style.display = 'flex';
        document.getElementById('solid-filename').textContent = file.name;
    }
}

function clearSolidFile(event) {
    if (event) event.stopPropagation();
    document.getElementById('fileInputSolid').value = '';
    document.getElementById('upload-placeholder-solid').style.display = 'flex';
    document.getElementById('preview-container-solid').style.display = 'none';
    document.getElementById('solid-filename').textContent = '';
}

async function confirmAddSolid() {
    if (!currentViewProject) return;

    const name = document.getElementById('new-solid-name').value.trim();
    const revision = document.getElementById('new-solid-revision').value.trim();
    const fileInput = document.getElementById('fileInputSolid');
    const file = fileInput.files[0];

    if (!name || !file) {
        alert("Complete el nombre y seleccione un archivo.");
        return;
    }

    const formData = new FormData();
    formData.append('projectId', currentViewProject.id);
    formData.append('name', name);
    formData.append('revision', revision);
    formData.append('file', file);

    try {
        const response = await fetch('/api/add-solid', {
            method: 'POST',
            body: formData
        });

        const res = await response.json();
        if (res.status === 'success') {
            closeAddSolidModal();
            renderSolidsTable(currentViewProject.id);
        } else {
            alert("Error: " + res.message);
        }
    } catch (e) {
        console.error("Error uploading solid:", e);
    }
}

function viewSolidFile(filename) {
    // Open in 3D viewer or just open file link if 3D viewer not implemented yet
    // For now, let's just open in a new tab
    window.open(`/solids/${encodeURIComponent(filename)}`, '_blank');
}

// Search Logic
function filterProjects() {
    const query = document.getElementById('project-search').value.toLowerCase();
    const rows = document.querySelectorAll('#projects-list-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function filterSolids() {
    const query = document.getElementById('solid-search').value.toLowerCase();
    const rows = document.querySelectorAll('#solids-list-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// Global Exports
window.showProjectsView = showProjectsView;
window.showSolidsView = showSolidsView;
window.showAddProjectModal = showAddProjectModal;
window.closeAddProjectModal = closeAddProjectModal;
window.confirmAddProject = confirmAddProject;
window.showAddSolidModal = showAddSolidModal;
window.closeAddSolidModal = closeAddSolidModal;
window.confirmAddSolid = confirmAddSolid;
window.handleSolidFileSelect = handleSolidFileSelect;
window.clearSolidFile = clearSolidFile;
window.viewSolidFile = viewSolidFile;
window.filterProjects = filterProjects;
window.filterSolids = filterSolids;
