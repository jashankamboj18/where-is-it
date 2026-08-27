// ============================================================
// router.js — Navigation Router & Global Event Dispatcher
// ============================================================

// Global Tab Switcher Function
function switchTab(tab) {
    if (!tab) tab = 'dashboard';

    document.querySelectorAll('.nav-btn, .dock-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });

    // Sync mobile bottom nav active state
    document.querySelectorAll('.mobile-nav-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-view') === tab);
    });

    // Hide all view panels and show only the selected one
    document.querySelectorAll('.view-panel').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });

    const activeView = document.getElementById(`view-${tab}`);
    if (activeView) {
        activeView.style.display = 'block';
        activeView.classList.add('active');
    }

    // Trigger page-specific data renderer
    if (tab === 'dashboard') {
        renderDashboard();
    } else if (tab === 'items') {
        renderAllItemsView();
    } else if (tab === 'routine') {
        renderRoutineView();
    } else if (tab === 'lent') {
        renderLentView();
    } else if (tab === 'trips') {
        renderTripsView();
    } else if (tab === 'valuation') {
        renderValuationView();
    } else if (tab === 'profile') {
        renderProfileView();
    } else if (tab === 'settings') {
        renderSettingsView();
    } else if (tab === 'locations') {
        renderLocationTree();
    } else if (tab === 'containers') {
        renderContainersView();
    } else if (tab === 'reminders') {
        renderRemindersView();
    }

    // Close mobile drawer if open
    const sidebar = document.getElementById('app-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function setupEventListeners() {
    // Theme Toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Keyboard Shortcut: Ctrl+K / Cmd+K
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('global-search-input');
            if (searchInput) searchInput.focus();
        }
    });

    // Suggestion Chips
    document.querySelectorAll('.suggest-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-search');
            const searchInput = document.getElementById('global-search-input');
            if (searchInput) {
                searchInput.value = query;
                performGlobalSearch(query);
            }
        });
    });

    // Mobile Sidebar Drawer
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('app-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const closeSidebarBtn = document.getElementById('mobile-sidebar-close');

    const openSidebar = () => {
        if (sidebar) sidebar.classList.add('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // Sidebar Navigation Buttons
    document.querySelectorAll('.nav-btn, .dock-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    // Mobile Bottom Navigation Buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view) switchTab(view);
        });
    });

    const mobScanBtn = document.getElementById('mob-btn-scan');
    if (mobScanBtn) {
        mobScanBtn.addEventListener('click', () => openModal('modal-scanner'));
    }

    // Floating Action Button
    const fabAdd = document.getElementById('mobile-fab-add');
    if (fabAdd) {
        fabAdd.addEventListener('click', () => openModal('modal-item'));
    }

    // Place Switcher
    const placeSelect = document.getElementById('active-place-select');
    if (placeSelect) {
        placeSelect.addEventListener('change', async (e) => {
            state.activePlaceId = e.target.value;
            await loadPlaceSpecificData();
        });
    }

    // Voice Search Trigger
    const voiceBtn = document.getElementById('btn-voice-search');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceRecognition);
    }

    // Camera Toggle
    const camToggleBtn = document.getElementById('btn-toggle-camera');
    if (camToggleBtn) {
        camToggleBtn.addEventListener('click', toggleCameraScanner);
    }

    // Search Input
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                performGlobalSearch(e.target.value);
            }, 200);
        });
    }

    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            performGlobalSearch('');
        });
    }

    const closeSearchBtn = document.getElementById('btn-close-search');
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            performGlobalSearch('');
        });
    }

    // Routine Actions
    const checkAllBtn = document.getElementById('btn-check-all-routine');
    if (checkAllBtn) {
        checkAllBtn.addEventListener('click', () => {
            state.routineItems.forEach(i => i.packed = true);
            saveRoutineState();
            renderRoutineView();
            showToast('All daily essentials marked as packed! Have a great day!', 'success');
        });
    }

    const resetRoutineBtn = document.getElementById('btn-reset-routine');
    if (resetRoutineBtn) {
        resetRoutineBtn.addEventListener('click', () => {
            state.routineItems.forEach(i => i.packed = false);
            saveRoutineState();
            renderRoutineView();
            showToast('Checklist reset for tomorrow.', 'info');
        });
    }

    const addRoutineBtn = document.getElementById('btn-add-routine-item');
    if (addRoutineBtn) {
        addRoutineBtn.addEventListener('click', () => {
            const name = prompt('Enter custom everyday carry item (e.g., Gym Gloves, Umbrella):');
            if (name && name.trim()) {
                const loc = prompt('Where do you keep this item?', 'Bedroom');
                state.routineItems.push({
                    id: `custom_${Date.now()}`,
                    name: name.trim(),
                    defaultLoc: loc || 'Home',
                    packed: false,
                    icon: 'star'
                });
                saveRoutineState();
                renderRoutineView();
                showToast(`Added "${name}" to daily carry!`, 'success');
            }
        });
    }

    // Export CSV & Print
    const exportCsvBtn = document.getElementById('btn-export-items-csv');
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportInventoryCsv);

    const qaExportBtn = document.getElementById('qa-export');
    if (qaExportBtn) qaExportBtn.addEventListener('click', () => window.print());

    const printInsBtn = document.getElementById('btn-print-insurance-report');
    if (printInsBtn) printInsBtn.addEventListener('click', () => window.print());

    const printSheetBtn = document.getElementById('btn-print-qr-sheet');
    if (printSheetBtn) printSheetBtn.addEventListener('click', openQrSheetModal);

    // Bulk Move Trigger
    const bulkMoveTrigger = document.getElementById('btn-bulk-move-trigger');
    if (bulkMoveTrigger) {
        bulkMoveTrigger.addEventListener('click', () => {
            const desc = document.getElementById('bulk-move-desc');
            if (desc) desc.textContent = `Relocating ${state.selectedItemIdsForBulk.size} selected items`;
            openModal('modal-bulk-move');
        });
    }

    // Modal Open Triggers
    const bindModal = (id, modalName) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => openModal(modalName));
    };

    bindModal('btn-add-item-top', 'modal-item');
    bindModal('qa-add-item', 'modal-item');
    bindModal('btn-create-item-view', 'modal-item');
    bindModal('qa-add-lent', 'modal-lent');
    bindModal('btn-add-lent-modal', 'modal-lent');
    bindModal('btn-create-trip-modal', 'modal-trip');
    bindModal('qa-add-location', 'modal-location');
    bindModal('btn-add-location-view', 'modal-location');
    bindModal('btn-add-place-modal', 'modal-place');
    bindModal('qa-add-container', 'modal-container');
    bindModal('btn-add-container-view', 'modal-container');
    bindModal('qa-scan-qr', 'modal-scanner');
    bindModal('btn-scan-qr-view', 'modal-scanner');

    const qaVoice = document.getElementById('qa-voice');
    if (qaVoice) qaVoice.addEventListener('click', startVoiceRecognition);

    const addRemDash = document.getElementById('btn-add-reminder-dash');
    if (addRemDash) {
        addRemDash.addEventListener('click', () => {
            populateItemDropdownsForReminders();
            openModal('modal-reminder');
        });
    }

    const addRemView = document.getElementById('btn-add-reminder-view');
    if (addRemView) {
        addRemView.addEventListener('click', () => {
            populateItemDropdownsForReminders();
            openModal('modal-reminder');
        });
    }

    // Voice Assistant Bindings ("Hey Finder")
    const btnVoiceAgent = document.getElementById('btn-open-voice-agent');
    if (btnVoiceAgent) btnVoiceAgent.addEventListener('click', openVoiceAgentModal);

    const floatingSiri = document.getElementById('floating-siri-trigger');
    if (floatingSiri) floatingSiri.addEventListener('click', openVoiceAgentModal);

    const siriOrbTrigger = document.getElementById('siri-orb-trigger');
    if (siriOrbTrigger) siriOrbTrigger.addEventListener('click', startVoiceAgentListening);

    // PWA Android Install Bindings
    const btnInstallPwa = document.getElementById('btn-install-pwa');
    if (btnInstallPwa) btnInstallPwa.addEventListener('click', triggerPwaInstall);

    const bannerInstallBtn = document.getElementById('pwa-banner-install-btn');
    if (bannerInstallBtn) bannerInstallBtn.addEventListener('click', triggerPwaInstall);

    const bannerDismissBtn = document.getElementById('pwa-banner-dismiss-btn');
    if (bannerDismissBtn) bannerDismissBtn.addEventListener('click', () => {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.style.display = 'none';
        localStorage.setItem('pwa_banner_dismissed', '1');
    });

    document.querySelectorAll('.voice-phrase-chip').forEach(chip => {
        chip.addEventListener('click', async () => {
            if (voiceAgentRecognition && isVoiceAgentListening) {
                try { voiceAgentRecognition.stop(); } catch(e) {}
                isVoiceAgentListening = false;
            }
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            
            const phrase = chip.getAttribute('data-phrase');
            if (phrase) {
                await processVoiceAgentCommand(phrase);
            }
        });
    });

    // Close Modals
    document.querySelectorAll('.modal-dismiss-btn, [data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId === 'modal-voice-agent') {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                if (voiceAgentRecognition && isVoiceAgentListening) {
                    try { voiceAgentRecognition.stop(); } catch(e) {}
                    isVoiceAgentListening = false;
                }
            }
            if (modalId) closeModal(modalId);
        });
    });

    // Form Submissions
    const bindForm = (id, handler) => {
        const f = document.getElementById(id);
        if (f) f.addEventListener('submit', handler);
    };

    bindForm('item-form', handleItemFormSubmit);
    bindForm('lent-form', handleLentFormSubmit);
    bindForm('trip-form', handleTripFormSubmit);
    bindForm('bulk-move-form', handleBulkMoveFormSubmit);
    bindForm('move-form', handleMoveFormSubmit);
    bindForm('location-form', handleLocationFormSubmit);
    bindForm('place-form', handlePlaceFormSubmit);
    bindForm('container-form', handleContainerFormSubmit);
    bindForm('reminder-form', handleReminderFormSubmit);

    // QR Scan Execution
    const btnExecuteScan = document.getElementById('btn-execute-scan');
    if (btnExecuteScan) btnExecuteScan.addEventListener('click', handleQrScanExecution);

    // Global Delegated Actions
    document.addEventListener('click', async (e) => {
        const moveBtn = e.target.closest('.btn-move-item');
        if (moveBtn) {
            e.stopPropagation();
            const id = moveBtn.getAttribute('data-id');
            const name = moveBtn.getAttribute('data-name');
            const path = moveBtn.getAttribute('data-path');

            document.getElementById('move-item-id').value = id;
            document.getElementById('move-item-name').textContent = name;
            document.getElementById('move-current-path').textContent = `Current: ${path}`;
            openModal('modal-move');
            return;
        }

        const delBtn = e.target.closest('.btn-delete-item');
        if (delBtn) {
            e.stopPropagation();
            const id = delBtn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this item?')) {
                const res = await apiFetch(`/items/${id}`, { method: 'DELETE' });
                if (res.success) {
                    showToast('Item deleted', 'success');
                    await loadItems();
                    renderDashboard();
                    renderAllItemsView();
                }
            }
            return;
        }

        const returnLentBtn = e.target.closest('.btn-return-lent');
        if (returnLentBtn) {
            e.stopPropagation();
            const id = returnLentBtn.getAttribute('data-id');
            const loan = state.lentItems.find(l => l.id === id);
            if (loan) {
                loan.status = 'Returned';
                saveLentState();
                renderLentView();
                showToast(`Marked "${loan.itemName}" as returned!`, 'success');
            }
            return;
        }

        const manifestRow = e.target.closest('.manifest-item-row');
        if (manifestRow) {
            const tripId = manifestRow.getAttribute('data-trip-id');
            const idx = parseInt(manifestRow.getAttribute('data-idx'));
            const trip = state.tripManifests.find(t => t.id === tripId);
            if (trip && trip.items[idx]) {
                trip.items[idx].packed = !trip.items[idx].packed;
                saveTripState();
                renderTripsView();
            }
            return;
        }

        const addTripItemBtn = e.target.closest('.btn-add-trip-item');
        if (addTripItemBtn) {
            const tripId = addTripItemBtn.getAttribute('data-trip-id');
            const trip = state.tripManifests.find(t => t.id === tripId);
            if (trip) {
                const itemName = prompt('Enter item name for this packing manifest:');
                if (itemName && itemName.trim()) {
                    trip.items.push({ name: itemName.trim(), packed: false });
                    saveTripState();
                    renderTripsView();
                    showToast(`Added "${itemName}" to ${trip.name}`, 'success');
                }
            }
            return;
        }

        const qrBtn = e.target.closest('.btn-show-qr');
        if (qrBtn) {
            e.stopPropagation();
            const name = qrBtn.getAttribute('data-name');
            const token = qrBtn.getAttribute('data-token');
            const path = qrBtn.getAttribute('data-path');
            const code = qrBtn.getAttribute('data-code');

            document.getElementById('qr-container-name').textContent = `${name} (${code})`;
            document.getElementById('qr-container-path').textContent = path;
            document.getElementById('qr-token-text').textContent = `TOKEN: ${token}`;
            document.getElementById('qr-image-display').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}`;
            openModal('modal-qr');
            return;
        }

        const remBtn = e.target.closest('.btn-complete-reminder');
        if (remBtn) {
            e.stopPropagation();
            const id = remBtn.getAttribute('data-id');
            const res = await apiFetch(`/reminders/${id}/complete`, { method: 'PUT' });
            if (res.success) {
                showToast('Reminder marked as completed!', 'success');
                await loadReminders();
                renderDashboard();
                renderRemindersView();
            }
        }
    });

    const printQrBtn = document.getElementById('btn-print-qr');
    if (printQrBtn) printQrBtn.addEventListener('click', () => window.print());
}
