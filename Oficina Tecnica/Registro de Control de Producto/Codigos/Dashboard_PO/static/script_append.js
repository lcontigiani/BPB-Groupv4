
// Check for running sync on load
function checkInitialSyncState() {
    fetch('/api/sync-progress')
        .then(res => res.json())
        .then(data => {
            if (data.running) {
                console.log("Restoring active sync state...");

                // INLINE PROGRESS UI restore
                const inlineContainer = document.getElementById('sync-progress-inline');
                const triggerBtn = document.getElementById('btn-sync-trigger');

                const inlineBar = document.getElementById('sync-inline-bar');
                const inlineText = document.getElementById('sync-inline-text');
                const inlineChk = document.getElementById('sync-inline-chk');

                if (inlineContainer && triggerBtn) {
                    triggerBtn.style.display = 'none'; // Hide button
                    inlineContainer.style.display = 'flex'; // Show Progress

                    const pct = Math.round(data.progress);
                    if (inlineBar) inlineBar.style.width = `${pct}%`;
                    if (inlineChk) inlineChk.innerText = `${pct}%`;
                    if (inlineText) inlineText.innerText = data.message || 'Procesando...';

                    // Restart Polling
                    const pollInterval = setInterval(() => {
                        fetch('/api/sync-progress')
                            .then(pRes => pRes.json())
                            .then(pData => {
                                // Update UI
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
                                            if (pData.message && pData.message.includes("No se encontraron")) {
                                                showNotification(pData.message, 'warning');
                                            } else {
                                                showNotification('Sincronización completada', 'success');
                                                if (document.getElementById('view-list').style.display === 'block') {
                                                    fetchData();
                                                }
                                            }
                                        } else {
                                            showNotification(pData.message, 'error');
                                        }

                                        // RESTORE UI
                                        if (inlineContainer && triggerBtn) {
                                            inlineContainer.style.display = 'none';
                                            triggerBtn.style.display = 'inline-block';
                                            triggerBtn.disabled = false;
                                            triggerBtn.innerHTML = '<span style="margin-right: 5px;">+</span> Buscar Nuevos Registros';
                                        }
                                    }, 1500);
                                }
                            })
                            .catch(e => console.error("Poll Error", e));
                    }, 1000);
                }
            }
        })
        .catch(e => console.error("Initial Sync Check Error", e));
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', checkInitialSyncState);
