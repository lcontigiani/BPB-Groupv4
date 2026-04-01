(function () {
    "use strict";

    const CONFIG = Object.assign(
        {
            apiUrl: "/api/chatbot/chat",
            title: "Asistente BPB",
            subtitle: "Helena",
            avatarUrl: "/static/assets/iso_red.png",
            placeholder: "Escribe tu consulta...",
            welcomeMessage: "Hola, soy Helena, la jefa de la oficina. En que puedo ayudarte?",
            suggestions: [
                "Que estoy viendo ahora?",
                "Llevame a cotizaciones",
                "Mostrame la cotizacion mas reciente",
            ],
            getPageContext: defaultGetPageContext,
        },
        window.BPB_CHATBOT_CONFIG || {}
    );

    let isOpen = false;
    let isLoading = false;
    const history = [];
    const NAVIGATION_MAP = {
        'home': { steps: [{ fn: 'showHome' }], verify: '#view-home', label: 'Inicio' },
        'home-registros': { steps: [{ fn: 'showRegistrosHome' }], verify: '#view-home-registros', label: 'Registros' },
        'home-base-datos': { steps: [{ fn: 'showBaseDatosHome' }], verify: '#view-home-base-datos', label: 'Base de Datos' },
        'home-herramientas': { steps: [{ fn: 'showHerramientasHome' }], verify: '#view-home-herramientas', label: 'Herramientas' },
        'projects': { steps: [{ fn: 'showProjectsView' }], verify: '#view-projects', label: 'Proyectos' },
        'cotizacion-menu': { steps: [{ fn: 'showCotizacionView' }], verify: '#view-cotizacion-menu', label: 'Cotizacion' },
        'cotizacion-records': { steps: [{ fn: 'showCotizacionRecords' }], verify: '#view-cotizacion-records', label: 'Cotizaciones Guardadas' },
        'cotizacion-new': { steps: [{ fn: 'showCotizacionEditor' }], verify: '#view-cotizacion', label: 'Editor de Cotizacion' },
        'logistics': { steps: [{ fn: 'showLogisticsView' }], verify: '#view-logistics-menu', label: 'Logistica' },
        'po-module': { steps: [{ fn: 'showPOModule' }], verify: '#app', label: 'Purchase Orders' },
        'iso-menu': { steps: [{ fn: 'showISOModule' }], verify: '#view-iso-menu', label: 'ISO' },
        'iso-control': { steps: [{ fn: 'showISOControlPanel' }], verify: '#view-iso-control', label: 'Control ISO' },
        'iso-tracking': { steps: [{ fn: 'showISOTrackingPanel' }], verify: '#view-iso-tracking', label: 'Tracking ISO' },
        'quality-pending': { steps: [{ fn: 'showQualityControlHome' }, { fn: 'showQualityPending', delay: 140 }], verify: '#view-quality-pending', label: 'Calidad Pendiente' },
        'quality-history': { steps: [{ fn: 'showQualityControlHome' }, { fn: 'showQualityHistoryPanel', delay: 140 }], verify: '#view-quality-history', label: 'Historial de Calidad' },
        'activity-pending': { steps: [{ fn: 'showActivitySubHome' }, { fn: 'showActivityPending', delay: 140 }], verify: '#view-activity-pending', label: 'Actividad Pendiente' },
        'activity-records': { steps: [{ fn: 'showActivitySubHome' }, { fn: 'showActivityRecordsMenu', delay: 140 }], verify: '#view-activity-records-menu', label: 'Registros de Actividad' },
        'activity-history': { steps: [{ fn: 'showActivitySubHome' }, { fn: 'showActivityHistoryDetail', delay: 140 }], verify: '#view-activity-history-detail', label: 'Historial de Actividad' },
        'aux-csv': { steps: [{ fn: 'showAuxiliarIndices' }], verify: '#view-auxiliar', label: 'Auxiliares' },
    };

    function defaultGetPageContext() {
        const visibleViews = Array.from(document.querySelectorAll('[id^="view-"]'))
            .filter((element) => element instanceof HTMLElement && element.style.display !== 'none')
            .slice(0, 10)
            .map((element) => ({
                id: element.id,
                title: String(element.querySelector('h2, h3, .section-title, .card-title')?.textContent || '').trim(),
            }));

        const activeCards = Array.from(document.querySelectorAll('.dashboard-card'))
            .filter((card) => card instanceof HTMLElement && card.offsetParent !== null)
            .slice(0, 8)
            .map((card) => String(card.querySelector('.card-title')?.textContent || '').trim())
            .filter(Boolean);

        const subtitle = String(document.querySelector('header .subtitle')?.textContent || '').trim();
        const mainView = visibleViews[0]?.id || '';
        const visibleText = Array.from(document.querySelectorAll('[id^="view-"]'))
            .filter((element) => element instanceof HTMLElement && element.style.display !== 'none')
            .map((element) => String(element.textContent || '').trim())
            .join(' ')
            .replace(/\s+/g, ' ')
            .slice(0, 1400);

        return {
            title: document.title,
            subtitle,
            url_path: window.location.pathname,
            last_view: localStorage.getItem('lastView') || '',
            last_view_param: localStorage.getItem('lastViewParam') || '',
            visible_views: visibleViews,
            visible_cards: activeCards,
            visible_text: visibleText,
            plm_state: getPlmState(),
            cotizacion_state: {
                record_name: String(document.getElementById('cotizacion-save-name')?.value || '').trim(),
                folder: String(document.getElementById('cotizacion-save-folder')?.value || '').trim(),
            }
        };
    }

    function createWidget() {
        const toggle = document.createElement('button');
        toggle.id = 'bpb-chatbot-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Abrir asistente');
        toggle.classList.add('bpb-chatbot-hidden');
        toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M8 7.6h8"></path><path d="M8 10.6h5"></path></svg>';
        toggle.addEventListener('click', toggleWindow);

        const win = document.createElement('section');
        win.id = 'bpb-chatbot-window';
        win.classList.add('bpb-chatbot-hidden');
        win.innerHTML = `
            <div class="bpb-chatbot-header">
                <div class="bpb-chatbot-avatar">
                    <img src="${escapeHtml(CONFIG.avatarUrl)}" alt="${escapeHtml(CONFIG.subtitle)}">
                </div>
                <div class="bpb-chatbot-headings">
                    <div class="bpb-chatbot-title">${escapeHtml(CONFIG.title)}</div>
                    <div class="bpb-chatbot-subtitle">${escapeHtml(CONFIG.subtitle)}</div>
                </div>
                <button type="button" class="bpb-chatbot-close" id="bpb-chatbot-close" aria-label="Cerrar">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div id="bpb-chatbot-messages"></div>
            <div id="bpb-chatbot-suggestions"></div>
            <div class="bpb-chatbot-input-wrap">
                <textarea id="bpb-chatbot-input" rows="1" placeholder="${escapeHtml(CONFIG.placeholder)}"></textarea>
                <button type="button" id="bpb-chatbot-send" aria-label="Enviar">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(toggle);
        document.body.appendChild(win);

        document.getElementById('bpb-chatbot-close').addEventListener('click', toggleWindow);
        document.getElementById('bpb-chatbot-send').addEventListener('click', sendMessage);
        document.getElementById('bpb-chatbot-input').addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
        document.getElementById('bpb-chatbot-input').addEventListener('input', autoResizeInput);

        renderSuggestions();
        addMessage('bot', CONFIG.welcomeMessage);
        setupAuthVisibilitySync();
        setupNotificationOffsetSync();
    }

    function toggleWindow() {
        if (!isChatbotAvailable()) return;
        isOpen = !isOpen;
        const win = document.getElementById('bpb-chatbot-window');
        if (!win) return;
        win.classList.toggle('visible', isOpen);
        if (isOpen) {
            document.getElementById('bpb-chatbot-input')?.focus();
        }
    }

    function renderSuggestions() {
        const container = document.getElementById('bpb-chatbot-suggestions');
        if (!container) return;
        container.innerHTML = '';
        (CONFIG.suggestions || []).forEach((suggestion) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'bpb-chatbot-suggestion';
            button.textContent = suggestion;
            button.addEventListener('click', function () {
                const input = document.getElementById('bpb-chatbot-input');
                if (!input) return;
                input.value = suggestion;
                autoResizeInput.call(input);
                sendMessage();
            });
            container.appendChild(button);
        });
    }

    function isChatbotAvailable() {
        const overlay = document.getElementById('login-overlay');
        const overlayVisible = overlay instanceof HTMLElement
            ? window.getComputedStyle(overlay).display !== 'none'
            : false;
        const hasSessionFlag = !!sessionStorage.getItem('bpb_auth');
        const currentRole = String(window.currentUserRole || '').toLowerCase();
        return !overlayVisible && (hasSessionFlag || (currentRole && currentRole !== 'guest'));
    }

    function syncAuthVisibility() {
        const toggle = document.getElementById('bpb-chatbot-toggle');
        const win = document.getElementById('bpb-chatbot-window');
        if (!toggle || !win) return;

        const allowed = isChatbotAvailable();
        toggle.classList.toggle('bpb-chatbot-hidden', !allowed);
        win.classList.toggle('bpb-chatbot-hidden', !allowed);

        if (!allowed) {
            isOpen = false;
            win.classList.remove('visible');
        }
    }

    function setupAuthVisibilitySync() {
        syncAuthVisibility();

        const overlay = document.getElementById('login-overlay');
        if (overlay instanceof HTMLElement) {
            const observer = new MutationObserver(syncAuthVisibility);
            observer.observe(overlay, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }

        window.setInterval(syncAuthVisibility, 1200);
    }

    function updateChatbotToastOffset() {
        const root = document.documentElement;
        const container = document.getElementById('notification-container');
        if (!(container instanceof HTMLElement)) {
            root.style.setProperty('--bpb-chatbot-toast-offset', '0px');
            return;
        }

        const toasts = Array.from(container.children).filter((child) => child instanceof HTMLElement);
        if (!toasts.length) {
            root.style.setProperty('--bpb-chatbot-toast-offset', '0px');
            return;
        }

        const latestToast = toasts[toasts.length - 1];
        const extraGap = 12;
        const offset = (latestToast instanceof HTMLElement ? latestToast.offsetHeight : 0) + extraGap;
        root.style.setProperty('--bpb-chatbot-toast-offset', `${Math.max(0, Math.ceil(offset))}px`);
    }

    function setupNotificationOffsetSync() {
        updateChatbotToastOffset();
        const container = document.getElementById('notification-container');
        if (container instanceof HTMLElement) {
            const observer = new MutationObserver(updateChatbotToastOffset);
            observer.observe(container, { childList: true, subtree: true, attributes: true });
        }
        window.addEventListener('resize', updateChatbotToastOffset);
        window.setInterval(updateChatbotToastOffset, 900);
    }

    function autoResizeInput() {
        this.style.height = 'auto';
        this.style.height = `${Math.min(this.scrollHeight, 120)}px`;
    }

    function addMessage(role, text, actions) {
        const container = document.getElementById('bpb-chatbot-messages');
        if (!container) return;

        const element = document.createElement('div');
        element.className = `bpb-chatbot-message ${role}`;
        if (role === 'bot') {
            element.innerHTML = formatMarkdown(text || '');
        } else {
            element.textContent = text || '';
        }

        if (Array.isArray(actions) && actions.length) {
            const actionsWrap = document.createElement('div');
            actionsWrap.className = 'bpb-chatbot-actions';
            actions.forEach((action) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'bpb-chatbot-action-btn';
                button.textContent = action.label || describeAction(action);
                button.addEventListener('click', async function () {
                    const result = await executeAction(action);
                    if (result.message) {
                        appendAssistantMessage(result.message);
                    }
                });
                actionsWrap.appendChild(button);
            });
            element.appendChild(actionsWrap);
        }

        container.appendChild(element);
        container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
        const container = document.getElementById('bpb-chatbot-messages');
        if (!container) return;
        const element = document.createElement('div');
        element.id = 'bpb-chatbot-typing';
        element.className = 'bpb-chatbot-typing';
        element.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(element);
        container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
        document.getElementById('bpb-chatbot-typing')?.remove();
    }

    function formatMarkdown(text) {
        const safe = escapeHtml(text || '');
        let html = safe
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\- (.+)$/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
        return html
            .split(/\n{2,}/)
            .map((chunk) => {
                const trimmed = chunk.trim();
                if (!trimmed) return '';
                if (trimmed.startsWith('<ul>') || trimmed.startsWith('<pre>')) return trimmed;
                return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
            })
            .join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function describeAction(action) {
        if (!action || typeof action !== 'object') return 'Ejecutar';
        if (action.type === 'open_cotizacion_record') return 'Abrir cotizacion';
        if (action.type === 'open_cotizacion_folder') return 'Abrir carpeta';
        if (action.type === 'open_project_workspace') return 'Abrir proyecto';
        if (action.type === 'open_project_versions') return 'Abrir versiones';
        if (action.type === 'open_project_section') return 'Abrir seccion';
        if (action.type === 'open_project_version_section') return 'Abrir seccion';
        if (action.type === 'navigate_view') return 'Ir a la vista';
        return 'Ejecutar';
    }

    function appendAssistantMessage(text) {
        const content = String(text || '').trim();
        if (!content) return;
        history.push({ role: 'assistant', content });
        addMessage('bot', content);
    }

    function buildActionPrompt(actions) {
        const first = Array.isArray(actions) && actions.length ? actions[0] : null;
        if (!first) return 'Decime si queres que lo abra.';
        if (first.type === 'open_cotizacion_folder') {
            return `Encontre la carpeta ${first.folder}. Si queres, la abro.`;
        }
        if (first.type === 'open_cotizacion_record') {
            return `Encontre la cotizacion ${first.record_name || first.record_id}. Si queres, la abro.`;
        }
        if (first.type === 'open_project_versions') {
            return `Encontre ${first.project_name || 'ese proyecto'}. Si queres, te muestro sus versiones.`;
        }
        if (first.type === 'open_project_workspace') {
            return `Encontre ${first.project_name || 'ese proyecto'}. Si queres, lo abro.`;
        }
        if (first.type === 'open_project_section' || first.type === 'open_project_version_section') {
            return 'Puedo abrir eso directamente si queres.';
        }
        return 'Decime si queres que lo abra.';
    }

    async function sendMessage() {
        if (isLoading) return;
        if (!isChatbotAvailable()) return;
        const input = document.getElementById('bpb-chatbot-input');
        if (!(input instanceof HTMLTextAreaElement)) return;
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.style.height = 'auto';
        document.getElementById('bpb-chatbot-suggestions').style.display = 'none';

        history.push({ role: 'user', content: text });
        addMessage('user', text);

        isLoading = true;
        document.getElementById('bpb-chatbot-send').disabled = true;
        showTyping();

        try {
            const response = await fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history,
                    page_context: typeof CONFIG.getPageContext === 'function' ? CONFIG.getPageContext() : {},
                }),
            });

            const data = await response.json();
            hideTyping();

            const autoActions = Array.isArray(data.actions) ? data.actions.filter((item) => item.auto_execute) : [];
            const visibleActions = Array.isArray(data.actions) ? data.actions.filter((item) => !item.auto_execute) : [];
            const botText = typeof data.response === 'string' ? data.response.trim() : '';

            if (botText || visibleActions.length) {
                const displayText = botText || buildActionPrompt(visibleActions);
                history.push({ role: 'assistant', content: displayText || '[accion]' });
                addMessage('bot', displayText, visibleActions);
            }

            for (const action of autoActions) {
                const result = await executeAction(action);
                if (result.message) {
                    appendAssistantMessage(result.message);
                }
                if (!result.ok) break;
            }
        } catch (error) {
            hideTyping();
            addMessage('bot', `No se pudo conectar con el chatbot: ${error.message || error}`);
        } finally {
            isLoading = false;
            document.getElementById('bpb-chatbot-send').disabled = false;
        }
    }

    async function executeAction(action) {
        if (!action || typeof action !== 'object') {
            return { ok: false, message: 'Accion invalida.' };
        }

        try {
            if (action.type === 'navigate_view') {
                return await executeViewNavigation(action.view);
            }
            if (action.type === 'open_cotizacion_record') {
                const openedRecords = await executeViewNavigation('cotizacion-records', { silentSuccess: true });
                if (!openedRecords.ok) return openedRecords;
                const openedRecord = await callGlobalFunction('viewCotizacionRecord', [action.record_id]);
                if (openedRecord) {
                    const reached = await waitForVisible('#view-cotizacion', 1800);
                    if (reached) return { ok: true, message: `Aqui tienes la cotizacion ${action.record_name || action.record_id}. Quieres saber algo al respecto?` };
                    return { ok: false, message: 'Intente abrir la cotizacion, pero la vista final no se mostro.' };
                }
                return { ok: false, message: 'No encontre la funcion para abrir cotizaciones en el frontend.' };
            }
            if (action.type === 'open_cotizacion_folder') {
                const openedRecords = await executeViewNavigation('cotizacion-records', { silentSuccess: true });
                if (!openedRecords.ok) return openedRecords;
                const openedFolder = await callGlobalFunction('openCotizacionRecordsFolder', [action.folder]);
                if (openedFolder) {
                    const reached = await waitForVisible('#view-cotizacion-records', 1400);
                    if (reached) return { ok: true, message: `Aqui tienes la carpeta ${action.folder}. Quieres que abra una cotizacion en particular?` };
                    return { ok: false, message: 'Intente abrir la carpeta de cotizaciones, pero la vista no quedo visible.' };
                }
                return { ok: false, message: 'No encontre la funcion para abrir carpetas de cotizacion.' };
            }
            if (action.type === 'open_project_workspace') {
                return await executeProjectNavigation(action.project_id, { openVersions: false, projectName: action.project_name });
            }
            if (action.type === 'open_project_versions') {
                return await executeProjectNavigation(action.project_id, { openVersions: true, projectName: action.project_name });
            }
            if (action.type === 'open_project_section') {
                return await executeProjectSection(action);
            }
            if (action.type === 'open_project_version_section') {
                return await executeProjectVersionSection(action);
            }
            return { ok: false, message: 'La accion pedida todavia no esta implementada en el frontend.' };
        } catch (error) {
            return { ok: false, message: `No pude ejecutar la accion: ${error.message || error}` };
        }
    }

    async function executeViewNavigation(view, options = {}) {
        const config = NAVIGATION_MAP[String(view || '')];
        if (!config) {
            return { ok: false, message: `No tengo mapeada la vista "${view}".` };
        }

        for (const step of config.steps) {
            const ok = await callGlobalFunction(step.fn, Array.isArray(step.args) ? step.args : []);
            if (!ok) {
                return { ok: false, message: `No pude ejecutar la navegación a ${config.label}.` };
            }
            await wait(step.delay || 100);
        }

        if (config.verify) {
            const reached = await waitForVisible(config.verify, 2200);
            if (!reached) {
                return { ok: false, message: `Intente navegar a ${config.label}, pero la vista no se abrió correctamente.` };
            }
        }

        if (options.silentSuccess) {
            return { ok: true, message: '' };
        }
        return { ok: true, message: `Aqui tienes ${config.label}. Quieres que revise algo puntual?` };
    }

    async function executeProjectNavigation(projectId, options = {}) {
        const requestedProjectId = String(projectId || '').trim();
        const currentState = getPlmState();
        const currentProjectId = String(currentState?.current_project?.id || '').trim();
        const targetProjectId = requestedProjectId || currentProjectId;
        const needsProjectOpen = !currentState.workspace_visible || (requestedProjectId && currentProjectId !== requestedProjectId);

        if (needsProjectOpen) {
            if (!targetProjectId) {
                return { ok: false, message: 'No pude identificar el proyecto solicitado.' };
            }
            const projectOpened = await callGlobalFunction('openProjectWorkspace', [targetProjectId]);
            if (!projectOpened) {
                return { ok: false, message: 'No pude abrir el proyecto solicitado.' };
            }
        }

        const workspaceVisible = await waitForVisible('#view-plm-workspace', 2600);
        if (!workspaceVisible) {
            return { ok: false, message: 'El workspace del proyecto no quedo visible.' };
        }

        const projectName = options.projectName || resolveProjectNameFromState(targetProjectId);

        if (!options.openVersions) {
            return { ok: true, message: `Aqui tienes el proyecto ${projectName}. Quieres que abra algo puntual?` };
        }

        const versionsOpened = await callGlobalFunction('openPlmWorkspaceCard', ['versions']);
        if (!versionsOpened) {
            return { ok: false, message: 'No pude abrir la seccion de versiones del proyecto.' };
        }

        const versionsVisible = await waitForVisible('#view-plm-workspace-versions', 2200)
            || await waitForVisible('#plm-workspace-versions-view', 2200)
            || await waitForVisible('#workspace-versions-view', 2200)
            || isVersionsModeActive();

        if (!versionsVisible) {
            return { ok: false, message: 'El proyecto se abrio, pero no pude dejar visible la seccion de versiones.' };
        }

        return { ok: true, message: `Aqui tienes las versiones de ${projectName}. Quieres que abra alguna en particular?` };
    }

    async function executeProjectSection(action) {
        const section = normalizeProjectSection(action.section);
        const projectId = String(action.project_id || '').trim();
        if (!section || section === 'values') {
            return { ok: false, message: 'Esa seccion no esta disponible a nivel proyecto.' };
        }

        const navigation = await executeProjectNavigation(projectId, { openVersions: false });
        if (!navigation.ok) return navigation;

        const sectionOpened = await callGlobalFunction('openPlmWorkspaceCard', [section]);
        if (!sectionOpened) {
            return { ok: false, message: 'No pude abrir la seccion pedida del proyecto.' };
        }

        const sectionReady = await waitForPlmState((state) => {
            const currentSection = normalizeProjectSection(state?.active_section || '');
            const contextVersionId = String(state?.context_version_id || '').trim();
            return state?.workspace_mode === 'main'
                && currentSection === section
                && !contextVersionId;
        }, 2600);

        if (!sectionReady) {
            return { ok: false, message: 'La seccion del proyecto no quedo visible.' };
        }

        const projectName = action.project_name || resolveProjectNameFromState(projectId);
        if (section === 'bitacora') {
            return { ok: true, message: `Aqui tienes la bitacora del proyecto ${projectName}. Quieres revisar algo puntual?` };
        }
        if (section === 'bom') {
            return { ok: true, message: `Aqui tienes el BOM del proyecto ${projectName}. Quieres que revise algo puntual?` };
        }
        return { ok: true, message: `Aqui tienes ${section} del proyecto ${projectName}.` };
    }

    async function executeProjectVersionSection(action) {
        const section = normalizeProjectSection(action.section);
        const projectId = String(action.project_id || '').trim();
        let versionId = String(action.version_id || '').trim();

        if (!section) {
            return { ok: false, message: 'No pude identificar la seccion de la version.' };
        }

        const navigation = await executeProjectNavigation(projectId, { openVersions: true });
        if (!navigation.ok) return navigation;

        let plmState = getPlmState();
        const stateProjectId = String(plmState?.current_project?.id || '').trim();
        if (projectId && stateProjectId && stateProjectId !== projectId) {
            return { ok: false, message: 'El proyecto abierto no coincide con el pedido.' };
        }

        if (!versionId) {
            versionId = resolveTargetVersionId(plmState);
        }
        if (!versionId) {
            return { ok: false, message: 'No pude identificar la version que queres abrir.' };
        }

        const selectedVersionId = String(plmState?.selected_version_id || '').trim();
        const contextVersionId = String(plmState?.context_version_id || '').trim();
        if (selectedVersionId !== versionId && contextVersionId !== versionId) {
            const openedVersion = await callGlobalFunction('openPlmVersionActions', [versionId]);
            if (!openedVersion) {
                return { ok: false, message: 'No pude abrir esa version del proyecto.' };
            }
            const versionReady = await waitForPlmState((state) => {
                const openedId = String(state?.selected_version_id || '').trim();
                return state?.workspace_mode === 'versions'
                    && state?.versions_flow_mode === 'open'
                    && openedId === versionId;
            }, 2600);
            if (!versionReady) {
                return { ok: false, message: 'La version no quedo abierta correctamente.' };
            }
            plmState = getPlmState();
        }

        const sectionFn = getProjectSectionFunction(section);
        if (!sectionFn) {
            return { ok: false, message: 'La seccion pedida todavia no tiene una accion asociada.' };
        }

        const sectionOpened = await callGlobalFunction(sectionFn, []);
        if (!sectionOpened) {
            return { ok: false, message: 'No pude abrir la seccion pedida de la version.' };
        }

        const sectionReady = await waitForPlmState((state) => {
            const currentSection = normalizeProjectSection(state?.active_section || '');
            const activeContextId = String(state?.context_version_id || state?.active_version_id || '').trim();
            return state?.workspace_mode === 'main'
                && currentSection === section
                && (!versionId || activeContextId === versionId);
        }, 2600);

        if (!sectionReady) {
            return { ok: false, message: 'La seccion final no quedo visible.' };
        }

        const projectName = action.project_name || resolveProjectNameFromState(projectId);
        const versionLabel = action.version_name || versionId;
        if (section === 'bom') {
            return { ok: true, message: `Aqui tienes el BOM de ${versionLabel}. Quieres revisar algo puntual?` };
        }
        if (section === 'bitacora') {
            return { ok: true, message: `Aqui tienes la bitacora de ${versionLabel}. Quieres revisar algo puntual?` };
        }
        if (section === 'values') {
            return { ok: true, message: `Aqui tienes los valores de ${versionLabel}. Quieres revisar algo puntual?` };
        }
        return { ok: true, message: `Aqui tienes ${section} de ${projectName || versionLabel}.` };
    }

    function wait(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    async function callGlobalFunction(functionName, args) {
        const deadline = Date.now() + 2600;
        while (Date.now() < deadline) {
            const fn = window[functionName];
            if (typeof fn === 'function') {
                const result = fn.apply(window, Array.isArray(args) ? args : []);
                if (result && typeof result.then === 'function') {
                    await result;
                }
                return true;
            }
            await wait(90);
        }
        return false;
    }

    function isVisible(selector) {
        const element = document.querySelector(selector);
        return element instanceof HTMLElement && window.getComputedStyle(element).display !== 'none';
    }

    async function waitForVisible(selector, timeoutMs) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            if (isVisible(selector)) return true;
            await wait(80);
        }
        return isVisible(selector);
    }

    function isVersionsModeActive() {
        const workspace = document.getElementById('view-plm-workspace');
        if (!(workspace instanceof HTMLElement)) return false;
        if (window.getComputedStyle(workspace).display === 'none') return false;

        const text = String(workspace.textContent || '').toLowerCase();
        if (text.includes('versiones') && text.includes('sin versiones cargadas')) return true;

        const versionsTables = Array.from(workspace.querySelectorAll('table, h2, h3, h4, .panel-title, .card-title'));
        return versionsTables.some((node) => String(node.textContent || '').toLowerCase().includes('version'));
    }

    function getPlmState() {
        const getter = window.getPlmNavigationState;
        if (typeof getter !== 'function') return {};
        try {
            const state = getter();
            return state && typeof state === 'object' ? state : {};
        } catch (_) {
            return {};
        }
    }

    function normalizeProjectSection(section) {
        const raw = String(section || '').trim().toLowerCase();
        if (raw === 'bom') return 'bom';
        if (raw === 'bitacora') return 'bitacora';
        if (raw === 'values' || raw === 'valores') return 'values';
        return '';
    }

    function getProjectSectionFunction(section) {
        if (section === 'bom') return 'openSelectedVersionBom';
        if (section === 'bitacora') return 'openSelectedVersionBitacora';
        if (section === 'values') return 'openSelectedVersionValues';
        return '';
    }

    function resolveProjectNameFromState(projectId) {
        const target = String(projectId || '').trim();
        const state = getPlmState();
        const currentProject = state?.current_project;
        if (String(currentProject?.id || '').trim() === target) {
            return String(currentProject?.name || target).trim() || target;
        }
        return target || 'Proyecto';
    }

    function resolveTargetVersionId(plmState) {
        const selectedId = String(plmState?.selected_version_id || '').trim();
        if (selectedId) return selectedId;

        const contextId = String(plmState?.context_version_id || '').trim();
        if (contextId) return contextId;

        const activeId = String(plmState?.active_version_id || '').trim();
        if (activeId) return activeId;

        const versions = Array.isArray(plmState?.versions) ? plmState.versions : [];
        if (versions.length === 1) {
            return String(versions[0]?.id || '').trim();
        }

        return '';
    }

    async function waitForPlmState(predicate, timeoutMs) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const state = getPlmState();
            if (predicate(state)) return true;
            await wait(90);
        }
        return predicate(getPlmState());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
    } else {
        createWidget();
    }
})();
