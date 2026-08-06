/* ==========================================================================
   Smo-Staff: Main Application Controller
   Event listeners, state synchronization, view navigation, modal handling & CSV export
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.appStore;
  const ui = window.UI;

  // DOM Elements
  const roleWorkerBtn = document.getElementById('role-worker-btn');
  const roleAdminBtn = document.getElementById('role-admin-btn');
  const userSelectDropdown = document.getElementById('user-select-dropdown');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const resetDataBtn = document.getElementById('reset-data-btn');

  // Header Elements
  const headerUserAvatar = document.getElementById('header-user-avatar');
  const navUserAvatar = document.getElementById('nav-user-avatar');
  const headerUserName = document.getElementById('header-user-name');
  const headerUserId = document.getElementById('header-user-id');
  const headerUserDept = document.getElementById('header-user-dept');
  const headerUserPos = document.getElementById('header-user-pos');
  const headerStatHours = document.getElementById('header-stat-hours');
  const headerStatTarget = document.getElementById('header-stat-target');
  const headerStatPending = document.getElementById('header-stat-pending');
  const tabMyRegsCount = document.getElementById('tab-my-regs-count');

  // Click on user avatars to preview full resolution
  if (headerUserAvatar) {
    headerUserAvatar.style.cursor = 'pointer';
    headerUserAvatar.title = 'คลิกเพื่อดูรูปโปรไฟล์ขยายเต็ม';
    headerUserAvatar.addEventListener('click', () => {
      const src = headerUserAvatar.src;
      const name = headerUserName ? headerUserName.textContent : '';
      if (src) openImageViewer(src, `รูปโปรไฟล์: ${name}`);
    });
  }
  if (navUserAvatar) {
    navUserAvatar.style.cursor = 'pointer';
    navUserAvatar.title = 'คลิกเพื่อดูรูปโปรไฟล์ขยายเต็ม';
    navUserAvatar.addEventListener('click', () => {
      const src = navUserAvatar.src;
      const name = headerUserName ? headerUserName.textContent : '';
      if (src) openImageViewer(src, `รูปโปรไฟล์: ${name}`);
    });
  }

  // Delegated click listener for previewable avatars and images
  document.addEventListener('click', (e) => {
    const avatarEl = e.target.closest('.previewable-avatar');
    if (avatarEl) {
      const imgSrc = avatarEl.getAttribute('data-img-src') || avatarEl.src;
      const caption = avatarEl.getAttribute('data-img-caption') || avatarEl.alt || '';
      if (imgSrc) openImageViewer(imgSrc, caption);
    }
  });

  // Navigation & Filter Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const viewSections = document.querySelectorAll('.view-section');
  const searchInput = document.getElementById('search-activity-input');
  const filterCategory = document.getElementById('filter-category-select');
  const filterStatus = document.getElementById('filter-status-select');
  const activitiesCountBadge = document.getElementById('activities-count-badge');
  const activitiesCardsGrid = document.getElementById('activities-cards-grid');

  // Admin View Elements
  const adminStatTotalAct = document.getElementById('admin-stat-total-act');
  const adminStatTotalWorkers = document.getElementById('admin-stat-total-workers');
  const adminStatTotalRegs = document.getElementById('admin-stat-total-regs');
  const adminStatTotalHours = document.getElementById('admin-stat-total-hours');
  const adminActivitiesTableBody = document.getElementById('admin-activities-table-body');
  const adminRosterTableBody = document.getElementById('admin-roster-table-body');

  // --------------------------------------------------------------------------
  // 1. App Initialization & Profile Sync
  // --------------------------------------------------------------------------
  let autoFetchTimer = null;
  let _hasInitialFetched = false;

  function updateLiveSyncBadge(status = 'synced') {
    const badges = document.querySelectorAll('.live-sync-badge');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    badges.forEach(badge => {
      if (status === 'syncing') {
        badge.innerHTML = `<span class="live-sync-dot" style="background:#eab308; animation:none;"></span> ⚡ กำลังซิงค์...`;
      } else {
        badge.innerHTML = `<span class="live-sync-dot"></span> เรียลไทม์ (${timeStr})`;
      }
    });
  }

  function refreshActiveModalsIfOpen() {
    try {
      const rosterModal = document.getElementById('activity-roster-modal');
      if (rosterModal && rosterModal.classList.contains('open') && window._activeRosterActivityId) {
        showActivityRosterModal(window._activeRosterActivityId);
      }
      const detailsModal = document.getElementById('activity-details-modal');
      if (detailsModal && detailsModal.classList.contains('open') && window._activeDetailsActivityId) {
        showActivityDetailsModal(window._activeDetailsActivityId);
      }
    } catch (err) {
      console.warn('Refresh open modals warning:', err);
    }
  }

  async function triggerSharedDataSync() {
    if (store.getGoogleSheetUrl()) {
      try {
        const res = await store.fetchFromGoogleSheets();
        if (res && res.success && !res.skipped) {
          updateLiveSyncBadge('synced');
          populateCategoryDropdowns();
          populateUserDropdown();
          refreshHeaderProfile();
          renderCurrentView();
          refreshActiveModalsIfOpen();
          _hasInitialFetched = true;
        }
      } catch (e) {
        console.warn('Auto fetch on interval warning:', e);
      }
    }
  }

  function handleIncomingRealtimeSignal(data) {
    if (!data || data.type !== 'DATA_UPDATED') return;

    if (data.snapshot && data.source !== 'cloud') {
      try {
        const prevFingerprint = store.getDataFingerprint();
        const STORAGE_KEYS = {
          WORKERS: 'smo_staff_workers',
          ACTIVITIES: 'smo_staff_activities',
          REGISTRATIONS: 'smo_staff_registrations',
          CATEGORIES: 'smo_staff_categories',
          ADMINS: 'smo_staff_admins'
        };

        if (Array.isArray(data.snapshot.workers)) {
          localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(data.snapshot.workers));
        }
        if (Array.isArray(data.snapshot.activities)) {
          localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(data.snapshot.activities));
        }
        if (Array.isArray(data.snapshot.registrations)) {
          localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(data.snapshot.registrations));
        }
        if (Array.isArray(data.snapshot.categories)) {
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.snapshot.categories));
        }
        if (Array.isArray(data.snapshot.admins)) {
          localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(data.snapshot.admins));
        }

        const newFingerprint = store.getDataFingerprint();
        if (prevFingerprint !== newFingerprint) {
          populateCategoryDropdowns();
          refreshHeaderProfile();
          renderCurrentView();
          refreshActiveModalsIfOpen();
          updateLiveSyncBadge('synced');
        }
      } catch (err) {
        console.warn('Apply realtime snapshot warning:', err);
      }
    } else {
      triggerSharedDataSync();
    }
  }

  function startAutoPolling() {
    if (autoFetchTimer) clearInterval(autoFetchTimer);
    triggerSharedDataSync();
    // High-speed heartbeat poll every 1.0 second for instant real-time sync across all devices
    autoFetchTimer = setInterval(triggerSharedDataSync, 1000);
  }

  function setupRealtimeListeners() {
    // 1. Custom internal event for same-page state mutations
    window.addEventListener('smo-data-updated', (e) => {
      populateCategoryDropdowns();
      refreshHeaderProfile();
      renderCurrentView();
      refreshActiveModalsIfOpen();
      updateLiveSyncBadge('synced');
    });

    // 2. Realtime WebSocket signal event for cross-device instant sync
    window.addEventListener('smo-realtime-signal', (e) => {
      handleIncomingRealtimeSignal(e.detail);
    });

    // 3. BroadcastChannel for instant cross-tab sync in the same browser
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('smo_staff_sync_channel');
        channel.onmessage = (event) => {
          handleIncomingRealtimeSignal(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 4. Storage event fallback for older browsers
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('smo_staff_')) {
        populateCategoryDropdowns();
        refreshHeaderProfile();
        renderCurrentView();
        refreshActiveModalsIfOpen();
        updateLiveSyncBadge('synced');
      }
    });

    // 4. Instant sync on tab visibility change (e.g. unlocking mobile screen or switching tabs)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        triggerSharedDataSync();
      }
    });

    // 5. Instant sync on window focus (e.g. clicking into the app window)
    window.addEventListener('focus', () => {
      triggerSharedDataSync();
    });

    // 6. Instant sync on network reconnect
    window.addEventListener('online', () => {
      triggerSharedDataSync();
    });
  }

  async function initApp() {
    initTheme();
    populateCategoryDropdowns();
    syncRoleUI();
    refreshHeaderProfile();
    renderCurrentView();
    setupRealtimeListeners();

    // Fetch latest cloud data immediately on page open and force instant re-render
    _hasInitialFetched = false;
    await triggerSharedDataSync();
    _hasInitialFetched = true;
    populateCategoryDropdowns();
    populateUserDropdown();
    refreshHeaderProfile();
    renderCurrentView();
    startAutoPolling();
  }

  function populateCategoryDropdowns(selectedCategory = null) {
    const categories = store.getCategories();
    const filterCategorySelect = document.getElementById('filter-category-select');
    const actFormCategorySelect = document.getElementById('act-form-category');

    if (filterCategorySelect) {
      const currentFilterVal = filterCategorySelect.value || 'all';
      const existingOptions = Array.from(filterCategorySelect.options).map(o => o.value);
      const expectedOptions = ['all', ...categories];

      const isMatch = existingOptions.length === expectedOptions.length &&
        existingOptions.every((val, idx) => val === expectedOptions[idx]);

      if (!isMatch) {
        filterCategorySelect.innerHTML = `<option value="all">หมวดหมู่ทั้งหมด</option>` +
          categories.map(c => `<option value="${c}">${c}</option>`).join('');
      }

      if (expectedOptions.includes(currentFilterVal)) {
        filterCategorySelect.value = currentFilterVal;
      } else {
        filterCategorySelect.value = 'all';
      }
    }

    if (actFormCategorySelect) {
      const currentFormVal = selectedCategory || actFormCategorySelect.value;
      const existingFormOpts = Array.from(actFormCategorySelect.options).map(o => o.value);
      const expectedFormOpts = [...categories, '__NEW__'];

      const isFormMatch = existingFormOpts.length === expectedFormOpts.length &&
        existingFormOpts.every((val, idx) => val === expectedFormOpts[idx]);

      if (!isFormMatch) {
        actFormCategorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('') +
          `<option value="__NEW__">➕ เพิ่มหมวดหมู่ใหม่...</option>`;
      }

      if (currentFormVal && expectedFormOpts.includes(currentFormVal)) {
        actFormCategorySelect.value = currentFormVal;
      }
    }
  }

  function populateUserDropdown() {
    const userSelectDropdown = document.getElementById('user-select-dropdown');
    if (!userSelectDropdown) return;

    const workers = store.getWorkers();
    const currentVal = userSelectDropdown.value;

    userSelectDropdown.innerHTML = `<option value="">-- เลือกผู้ปฏิบัติงาน --</option>` +
      workers.map(w => `<option value="${w.id}">${w.name} (${w.id})</option>`).join('');

    if (currentVal && workers.some(w => w.id === currentVal)) {
      userSelectDropdown.value = currentVal;
    }
  }

  // Dynamic Category Handler
  const addNewCatBtn = document.getElementById('add-new-category-btn');
  const actFormCategorySelect = document.getElementById('act-form-category');

  function promptAndAddCategory() {
    const newCatName = prompt('กรุณากรอกชื่อหมวดหมู่กิจกรรมใหม่ที่ต้องการเพิ่ม:');
    if (newCatName && newCatName.trim()) {
      const added = store.addCategory(newCatName.trim());
      populateCategoryDropdowns(added);
      ui.showToast(`เพิ่มหมวดหมู่ใหม่ "${added}" เรียบร้อยแล้ว`, 'success');
      renderCurrentView();
    }
  }

  if (addNewCatBtn) {
    addNewCatBtn.addEventListener('click', promptAndAddCategory);
  }

  if (actFormCategorySelect) {
    actFormCategorySelect.addEventListener('change', (e) => {
      if (e.target.value === '__NEW__') {
        promptAndAddCategory();
      }
    });
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('smo_staff_theme_v1') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('smo_staff_theme_v1', newTheme);
    themeToggleBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
  });

  const workerLoginBtn = document.getElementById('worker-login-btn');
  const workerSessionInfo = document.getElementById('worker-session-info');
  const navUserNameDisplay = document.getElementById('nav-user-name-display');
  const workerLogoutBtn = document.getElementById('worker-logout-btn');
  const workerLoginForm = document.getElementById('worker-login-form');
  const profileBannerLoggedOut = document.getElementById('profile-banner-logged-out');
  const profileBannerLoggedIn = document.getElementById('profile-banner-logged-in');

  function refreshHeaderProfile() {
    const isWorkerAuth = store.isWorkerAuthenticated();
    const isAdmin = store.getCurrentRole() === 'admin' && store.isAdminAuthenticated();
    const user = isWorkerAuth ? store.getCurrentUser() : null;

    if (isAdmin) {
      if (profileBannerLoggedOut) profileBannerLoggedOut.style.display = 'none';
      if (profileBannerLoggedIn) profileBannerLoggedIn.style.display = 'none';
      return;
    }

    if (isWorkerAuth && user) {
      if (workerLoginBtn) workerLoginBtn.style.display = 'none';
      if (workerSessionInfo) workerSessionInfo.style.display = 'inline-flex';
      if (navUserNameDisplay) navUserNameDisplay.textContent = `${user.name} (${user.id})`;
      navUserAvatar.src = user.avatar;

      if (profileBannerLoggedOut) profileBannerLoggedOut.style.display = 'none';
      if (profileBannerLoggedIn) profileBannerLoggedIn.style.display = 'flex';

      headerUserAvatar.src = user.avatar;
      headerUserName.textContent = user.name;
      headerUserId.textContent = user.id;
      headerUserDept.textContent = user.department;
      headerUserPos.textContent = user.position;

      const summary = store.getWorkerSummary(user.id);
      if (summary) {
        headerStatHours.textContent = summary.completedHours;
        headerStatTarget.textContent = summary.targetHours;
        headerStatPending.textContent = summary.pendingHours;
        tabMyRegsCount.textContent = summary.totalRegisteredCount;
      }
    } else {
      if (workerLoginBtn) workerLoginBtn.style.display = 'inline-flex';
      if (workerSessionInfo) workerSessionInfo.style.display = 'none';

      if (profileBannerLoggedOut) profileBannerLoggedOut.style.display = 'flex';
      if (profileBannerLoggedIn) profileBannerLoggedIn.style.display = 'none';

      tabMyRegsCount.textContent = '0';
    }
  }

  // Worker Login Modal Triggers & Form Submit
  document.querySelectorAll('#worker-login-btn, .trigger-worker-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('worker-student-id').value = '';
      openModal('worker-login-modal');
    });
  });

  document.querySelectorAll('.quick-student-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const id = (e.currentTarget || e.target.closest('[data-id]')).getAttribute('data-id');
      document.getElementById('worker-student-id').value = id;
    });
  });

  if (workerLoginForm) {
    workerLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentId = document.getElementById('worker-student-id').value;
      const res = store.authenticateWorker(studentId);

      if (res.success) {
        closeModal('worker-login-modal');
        refreshHeaderProfile();
        renderCurrentView();
        ui.showToast(`เข้าสู่ระบบสำเร็จ: ${res.worker.name} (${res.worker.id})`, 'success');
      } else {
        ui.showToast(res.message, 'danger');
      }
    });
  }

  if (workerLogoutBtn) {
    workerLogoutBtn.addEventListener('click', () => {
      store.logoutWorker();
      refreshHeaderProfile();
      renderCurrentView();
      ui.showToast('ออกจากระบบผู้ปฏิบัติงานเรียบร้อยแล้ว', 'info');
    });
  }

  // --------------------------------------------------------------------------
  // 2. Role Switcher & Admin Authentication System
  // --------------------------------------------------------------------------
  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  const adminLoginForm = document.getElementById('admin-login-form');

  function syncRoleUI() {
    const role = store.getCurrentRole();
    const isAuth = store.isAdminAuthenticated();
    const adminElements = document.querySelectorAll('.admin-only');
    const workerElements = document.querySelectorAll('.worker-only');

    if (role === 'admin' && isAuth) {
      const currentAdmin = store.getCurrentAdmin();
      const navAdminNameDisplay = document.getElementById('nav-admin-name-display');
      if (navAdminNameDisplay) {
        navAdminNameDisplay.textContent = `${currentAdmin.name} (@${currentAdmin.username})`;
      }

      const adminBannerName = document.getElementById('admin-banner-name');
      const adminBannerRole = document.getElementById('admin-banner-role');
      const adminBannerUser = document.getElementById('admin-banner-user');
      const adminBannerDept = document.getElementById('admin-banner-dept');

      if (adminBannerName) adminBannerName.textContent = currentAdmin.name;
      if (adminBannerRole) adminBannerRole.textContent = currentAdmin.role || 'Officer';
      if (adminBannerUser) adminBannerUser.textContent = `@${currentAdmin.username}`;
      if (adminBannerDept) adminBannerDept.textContent = currentAdmin.department || 'ฝ่ายกิจกรรมและพัฒนาผู้ปฏิบัติงาน';

      roleWorkerBtn.classList.remove('active');
      roleAdminBtn.classList.add('active');
      document.body.classList.add('admin-mode');

      adminElements.forEach(el => {
        if (el.tagName === 'BUTTON' || el.tagName === 'DIV') el.style.display = 'inline-flex';
        else el.style.display = 'flex';
      });
      workerElements.forEach(el => el.style.display = 'none');

      const adminSessionWrapper = document.getElementById('admin-session-wrapper');
      if (adminSessionWrapper) adminSessionWrapper.style.display = 'inline-flex';

      // Switch tab to Admin Dashboard if currently on worker tab
      const activeTab = document.querySelector('.tab-btn.active');
      if (!activeTab || activeTab.classList.contains('worker-only')) {
        switchTab('view-admin-dashboard');
      }
    } else {
      store.setCurrentRole('worker');
      roleAdminBtn.classList.remove('active');
      roleWorkerBtn.classList.add('active');
      document.body.classList.remove('admin-mode');

      adminElements.forEach(el => el.style.display = 'none');
      workerElements.forEach(el => {
        if (el.tagName === 'BUTTON' || el.tagName === 'DIV') el.style.display = 'inline-flex';
        else el.style.display = 'flex';
      });

      const adminSessionWrapper = document.getElementById('admin-session-wrapper');
      if (adminSessionWrapper) adminSessionWrapper.style.display = 'none';

      // Switch tab to All Activities if currently on admin tab
      const activeTab = document.querySelector('.tab-btn.active');
      if (!activeTab || activeTab.classList.contains('admin-only')) {
        switchTab('view-activities');
      }
    }
  }

  roleWorkerBtn.addEventListener('click', () => {
    store.setCurrentRole('worker');
    syncRoleUI();
    ui.showToast('สลับเข้าสู่มุมมองผู้ปฏิบัติงาน (Worker View)', 'info');
  });

  roleAdminBtn.addEventListener('click', () => {
    if (store.isAdminAuthenticated()) {
      store.setCurrentRole('admin');
      syncRoleUI();
      ui.showToast('เข้าสู่มุมมองเจ้าหน้าที่ (Officer View)', 'info');
    } else {
      document.getElementById('admin-password').value = '';
      openModal('admin-login-modal');
    }
  });

  // Admin Login Form Submit Handler
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userVal = document.getElementById('admin-username').value;
    const passVal = document.getElementById('admin-password').value;

    const result = store.authenticateAdmin(userVal, passVal);

    if (result.success) {
      closeModal('admin-login-modal');
      syncRoleUI();
      switchTab('view-admin-dashboard');
      ui.showToast('เข้าสู่ระบบเจ้าหน้าที่เรียบร้อยแล้ว', 'success');
    } else {
      ui.showToast(result.message, 'danger');
    }
  });

  // Admin Logout Handler
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      if (confirm('คุณต้องการออกจากระบบเจ้าหน้าที่ใช่หรือไม่?')) {
        store.logoutAdmin();
        syncRoleUI();
        switchTab('view-activities');
        ui.showToast('🚪 ออกจากระบบเจ้าหน้าที่เรียบร้อยแล้ว', 'info');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. Tab Navigation
  // --------------------------------------------------------------------------
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.getAttribute('data-view');
      switchTab(viewId);
    });
  });

  function switchTab(viewId) {
    tabButtons.forEach(b => b.classList.remove('active'));
    viewSections.forEach(s => s.classList.remove('active'));

    const targetBtn = document.querySelector(`.tab-btn[data-view="${viewId}"]`);
    const targetSection = document.getElementById(viewId);

    if (targetBtn && targetSection) {
      targetBtn.classList.add('active');
      targetSection.classList.add('active');
      renderCurrentView();
    }
  }

  function getActiveViewId() {
    const activeSection = document.querySelector('.view-section.active');
    return activeSection ? activeSection.id : 'view-activities';
  }

  function renderCurrentView() {
    const viewId = getActiveViewId();

    renderActivitiesGrid();

    if (viewId === 'view-my-summary') {
      renderMySummary();
    } else if (viewId === 'view-admin-dashboard') {
      renderAdminDashboard();
    } else if (viewId === 'view-admin-activities') {
      renderAdminActivities();
    } else if (viewId === 'view-admin-roster') {
      renderAdminRoster();
    }

    refreshActiveModalsIfOpen();
  }

  // --------------------------------------------------------------------------
  // 4. VIEW 1: Activities Grid Renderer & Event Listeners
  // --------------------------------------------------------------------------
  function renderActivitiesGrid() {
    const activitiesFilterBar = document.getElementById('activities-filter-bar');
    const activitiesLockedContainer = document.getElementById('activities-locked-container');
    const isWorkerAuth = store.isWorkerAuthenticated();
    const isAdmin = store.getCurrentRole() === 'admin' && store.isAdminAuthenticated();

    if (!isWorkerAuth && !isAdmin) {
      if (activitiesFilterBar) activitiesFilterBar.style.display = 'none';
      if (activitiesCardsGrid) activitiesCardsGrid.style.display = 'none';
      if (activitiesLockedContainer) {
        activitiesLockedContainer.style.display = 'block';
        activitiesLockedContainer.innerHTML = `
          <div class="hours-progress-card" style="text-align:center; padding:3.5rem 1.5rem; max-width:700px; margin: 2rem auto;">
            <div style="font-size:3.5rem; margin-bottom:1rem;">🔒</div>
            <h2 style="font-size:1.4rem; font-weight:600; margin-bottom:0.5rem; color:var(--text-main);">กรุณาเข้าสู่ระบบด้วยรหัสนักศึกษา</h2>
            <p style="color:var(--text-muted); max-width:520px; margin:0 auto 1.5rem auto; line-height:1.6;">
              ท่านต้องเข้าสู่ระบบด้วยรหัสนักศึกษาหรือรหัสผู้ปฏิบัติงานก่อน จึงจะสามารถเข้าถึงรายการกิจกรรมทั้งหมด ค้นหา กรองกิจกรรม และลงทะเบียนเข้าร่วมกิจกรรมได้
            </p>
            <button class="btn btn-primary trigger-worker-login-btn" style="font-size:1rem; padding:0.75rem 1.5rem;">🔑 เข้าสู่ระบบด้วยรหัสนักศึกษา</button>
          </div>
        `;
        activitiesLockedContainer.querySelectorAll('.trigger-worker-login-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.getElementById('worker-student-id').value = '';
            openModal('worker-login-modal');
          });
        });
      }
      return;
    }

    if (activitiesFilterBar) activitiesFilterBar.style.display = 'flex';
    if (activitiesCardsGrid) activitiesCardsGrid.style.display = 'grid';
    if (activitiesLockedContainer) activitiesLockedContainer.style.display = 'none';

    const currentUserId = store.getCurrentUserId();
    const activities = store.getActivities();
    const userRegs = store.getRegistrations().filter(r => r.workerId === currentUserId && r.status !== 'cancelled');
    const registeredActIds = new Set(userRegs.map(r => r.activityId));

    // Filtering
    const searchTerm = searchInput.value.toLowerCase().trim();
    const categoryVal = filterCategory.value;
    const statusVal = filterStatus.value;

    const filtered = activities.filter(act => {
      const matchSearch = act.title.toLowerCase().includes(searchTerm) ||
        act.id.toLowerCase().includes(searchTerm) ||
        act.location.toLowerCase().includes(searchTerm) ||
        act.description.toLowerCase().includes(searchTerm);
      const matchCategory = categoryVal === 'all' || act.category === categoryVal;
      const matchStatus = statusVal === 'all' || act.status === statusVal;

      return matchSearch && matchCategory && matchStatus;
    });

    // เรียงลำดับกิจกรรม: วันที่จัดกิจกรรมที่ใกล้ถึงขึ้นก่อน (กิจกรรมที่เสร็จสิ้นแล้วอยู่ด้านล่าง)
    filtered.sort((a, b) => {
      const aIsCompleted = a.status === 'completed' ? 1 : 0;
      const bIsCompleted = b.status === 'completed' ? 1 : 0;
      if (aIsCompleted !== bIsCompleted) {
        return aIsCompleted - bIsCompleted;
      }

      const timeA = a.date ? new Date(a.date).getTime() : Infinity;
      const timeB = b.date ? new Date(b.date).getTime() : Infinity;
      const validA = isNaN(timeA) ? Infinity : timeA;
      const validB = isNaN(timeB) ? Infinity : timeB;

      return validA - validB;
    });

    activitiesCountBadge.textContent = filtered.length;
    activitiesCardsGrid.innerHTML = '';

    if (filtered.length === 0) {
      activitiesCardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔍</div>
          <h3>ไม่พบกิจกรรมที่ตรงตามเงื่อนไข</h3>
          <p>ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรอง</p>
        </div>
      `;
      return;
    }

    filtered.forEach(act => {
      const isReg = registeredActIds.has(act.id);
      const card = ui.renderActivityCard(act, currentUserId, isReg);
      activitiesCardsGrid.appendChild(card);
    });

    attachActivityCardListeners();
  }

  searchInput.addEventListener('input', renderActivitiesGrid);
  filterCategory.addEventListener('change', renderActivitiesGrid);
  filterStatus.addEventListener('change', renderActivitiesGrid);

  function attachActivityCardListeners() {
    // Register Button
    document.querySelectorAll('.register-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!store.isWorkerAuthenticated()) {
          ui.showToast('กรุณาเข้าสู่ระบบด้วยรหัสนักศึกษาก่อนลงทะเบียนกิจกรรม', 'info');
          document.getElementById('worker-student-id').value = '';
          openModal('worker-login-modal');
          return;
        }

        const actId = (e.currentTarget || e.target.closest('[data-act-id]')).getAttribute('data-act-id');
        const currentUserId = store.getCurrentUserId();
        try {
          store.registerWorker(currentUserId, actId);
          ui.showToast('ลงทะเบียนเข้าร่วมกิจกรรมเรียบร้อยแล้ว!', 'success');
          refreshHeaderProfile();
          renderActivitiesGrid();
        } catch (err) {
          ui.showToast(err.message, 'danger');
        }
      });
    });

    // Cancel Registration Button
    document.querySelectorAll('.cancel-reg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actId = (e.currentTarget || e.target.closest('[data-act-id]')).getAttribute('data-act-id');
        const currentUserId = store.getCurrentUserId();
        if (confirm('คุณต้องการยกเลิกการลงทะเบียนกิจกรรมนี้ใช่หรือไม่?')) {
          store.cancelRegistration(currentUserId, actId);
          ui.showToast('ยกเลิกการลงทะเบียนเรียบร้อยแล้ว', 'info');
          refreshHeaderProfile();
          renderActivitiesGrid();
        }
      });
    });

    // View Details Button, Card Title, or Card Banner
    document.querySelectorAll('.view-details-btn, .card-title, .card-banner').forEach(el => {
      el.addEventListener('click', (e) => {
        const actId = el.getAttribute('data-act-id');
        if (actId) {
          showActivityDetailsModal(actId);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. VIEW 2: My Summary & Print Transcript
  // --------------------------------------------------------------------------
  function renderMySummary() {
    const summaryContainer = document.getElementById('individual-summary-container');
    const isAuth = store.isWorkerAuthenticated();

    if (!isAuth) {
      summaryContainer.innerHTML = `
        <div class="hours-progress-card" style="text-align:center; padding:3.5rem 1.5rem;">
          <div style="font-size:3.5rem; margin-bottom:1rem;">🔒</div>
          <h2 style="font-size:1.4rem; font-weight:600; margin-bottom:0.5rem;">กรุณาเข้าสู่ระบบด้วยรหัสนักศึกษา</h2>
          <p style="color:var(--text-muted); max-width:500px; margin:0 auto 1.5rem auto;">
            ท่านต้องเข้าสู่ระบบด้วยรหัสนักศึกษาหรือรหัสผู้ปฏิบัติงานก่อน จึงจะสามารถดูสรุปผลชั่วโมงกิจกรรมสะสม ประวัติการลงทะเบียน และพิมพ์ใบรับรองส่วนบุคคลได้
          </p>
          <button class="btn btn-primary trigger-worker-login-btn">🔑 เข้าสู่ระบบด้วยรหัสนักศึกษา</button>
        </div>
      `;
      document.querySelectorAll('.trigger-worker-login-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('worker-student-id').value = '';
          openModal('worker-login-modal');
        });
      });
      return;
    }

    const currentUserId = store.getCurrentUserId();
    const summaryData = store.getWorkerSummary(currentUserId);

    ui.renderIndividualSummary(summaryContainer, summaryData);
    ui.renderPrintableTranscript(summaryData);

    const printBtn = document.getElementById('print-transcript-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  // --------------------------------------------------------------------------
  // 6. VIEW 3, 4, 5: Admin Dashboards & Tables
  // --------------------------------------------------------------------------
  function renderAdminDashboard() {
    const activities = store.getActivities();
    const workers = store.getWorkers();
    const regs = store.getRegistrations().filter(r => r.status !== 'cancelled');
    const completedRegs = regs.filter(r => r.status === 'completed');
    const totalApprovedHours = completedRegs.reduce((sum, r) => sum + (r.hoursGranted || 0), 0);

    adminStatTotalAct.textContent = activities.length;
    adminStatTotalWorkers.textContent = workers.length;
    adminStatTotalRegs.textContent = regs.length;
    adminStatTotalHours.textContent = totalApprovedHours;
  }

  function renderAdminActivities() {
    const activities = store.getActivities();
    adminActivitiesTableBody.innerHTML = '';
    ui.renderAdminActivityTable(adminActivitiesTableBody, activities);

    // Edit Activity Listener
    document.querySelectorAll('.admin-edit-act-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actId = (e.currentTarget || e.target.closest('[data-act-id]')).getAttribute('data-act-id');
        showActivityFormModal(actId);
      });
    });

    // Delete Activity Listener
    document.querySelectorAll('.admin-delete-act-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actId = (e.currentTarget || e.target.closest('[data-act-id]')).getAttribute('data-act-id');
        if (confirm(`คุณต้องการลบกิจกรรมรหัส ${actId} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
          store.deleteActivity(actId);
          ui.showToast('ลบกิจกรรมเรียบร้อยแล้ว', 'success');
          refreshHeaderProfile();
          renderAdminActivities();
        }
      });
    });

    // Manage Roster & Attendance Listener
    document.querySelectorAll('.admin-manage-roster-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actId = (e.currentTarget || e.target.closest('[data-act-id]')).getAttribute('data-act-id');
        showActivityRosterModal(actId);
      });
    });

    // Reorder Activity Listeners
    document.querySelectorAll('.btn-reorder-act-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actId = e.currentTarget.getAttribute('data-act-id');
        if (store.reorderActivity(actId, 'up')) {
          ui.showToast('เลื่อนลำดับกิจกรรมขึ้นเรียบร้อยแล้ว', 'info');
          renderCurrentView();
        }
      });
    });

    document.querySelectorAll('.btn-reorder-act-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actId = e.currentTarget.getAttribute('data-act-id');
        if (store.reorderActivity(actId, 'down')) {
          ui.showToast('เลื่อนลำดับกิจกรรมลงเรียบร้อยแล้ว', 'info');
          renderCurrentView();
        }
      });
    });

    // Drag & Drop Reordering for Activities
    setupTableDragAndDrop(adminActivitiesTableBody, (fromIdx, toIdx) => {
      if (store.moveActivity(fromIdx, toIdx)) {
        ui.showToast('ลากสลับลำดับกิจกรรมเรียบร้อยแล้ว', 'success');
        renderCurrentView();
      }
    });
  }

  function setupTableDragAndDrop(tbody, moveCallback) {
    if (!tbody) return;
    let draggedIndex = null;

    tbody.querySelectorAll('.draggable-row').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        draggedIndex = parseInt(row.getAttribute('data-index'), 10);
        row.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(draggedIndex));
        }
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        tbody.querySelectorAll('.draggable-row').forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        const targetIndex = parseInt(row.getAttribute('data-index'), 10);
        if (draggedIndex === null || isNaN(draggedIndex) || targetIndex === draggedIndex) return;

        tbody.querySelectorAll('.draggable-row').forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
        if (targetIndex < draggedIndex) {
          row.classList.add('drag-over-top');
        } else {
          row.classList.add('drag-over-bottom');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        tbody.querySelectorAll('.draggable-row').forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
        const targetIndex = parseInt(row.getAttribute('data-index'), 10);
        if (draggedIndex !== null && !isNaN(draggedIndex) && targetIndex !== draggedIndex) {
          moveCallback(draggedIndex, targetIndex);
        }
      });
    });
  }

  function renderAdminRoster() {
    const workers = store.getWorkers();
    ui.renderAdminRosterTable(adminRosterTableBody, workers);

    // Manual Register Button Listener
    document.querySelectorAll('.admin-manual-register-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const workerId = (e.currentTarget || e.target.closest('[data-worker-id]')).getAttribute('data-worker-id');
        showManualRegisterModal(workerId);
      });
    });

    // Edit Worker Listener
    document.querySelectorAll('.admin-edit-worker-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const workerId = (e.currentTarget || e.target.closest('[data-worker-id]')).getAttribute('data-worker-id');
        showEditWorkerModal(workerId);
      });
    });

    // Delete Worker Listener
    document.querySelectorAll('.admin-delete-worker-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const workerId = (e.currentTarget || e.target.closest('[data-worker-id]')).getAttribute('data-worker-id');
        const worker = store.getWorkers().find(w => w.id.toUpperCase() === workerId.toUpperCase());
        const workerName = worker ? worker.name : workerId;
        if (confirm(`คุณต้องการลบรายชื่อผู้ปฏิบัติงาน "${workerName}" (${workerId}) ออกจากระบบใช่หรือไม่?`)) {
          try {
            store.deleteWorker(workerId);
            ui.showToast(`ลบรายชื่อผู้ปฏิบัติงาน "${workerName}" เรียบร้อยแล้ว`, 'info');
            refreshHeaderProfile();
            renderAdminRoster();
            populateUserDropdown();
          } catch (err) {
            ui.showToast(err.message, 'danger');
          }
        }
      });
    });

    // Reorder Worker Listeners
    document.querySelectorAll('.btn-reorder-worker-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const workerId = e.currentTarget.getAttribute('data-worker-id');
        if (store.reorderWorker(workerId, 'up')) {
          ui.showToast('เลื่อนลำดับผู้ปฏิบัติงานขึ้นเรียบร้อยแล้ว', 'info');
          renderCurrentView();
        }
      });
    });

    document.querySelectorAll('.btn-reorder-worker-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const workerId = e.currentTarget.getAttribute('data-worker-id');
        if (store.reorderWorker(workerId, 'down')) {
          ui.showToast('เลื่อนลำดับผู้ปฏิบัติงานลงเรียบร้อยแล้ว', 'info');
          renderCurrentView();
        }
      });
    });

    // Drag & Drop Reordering for Workers
    setupTableDragAndDrop(adminRosterTableBody, (fromIdx, toIdx) => {
      if (store.moveWorker(fromIdx, toIdx)) {
        ui.showToast('ลากสลับลำดับผู้ปฏิบัติงานเรียบร้อยแล้ว', 'success');
        renderCurrentView();
      }
    });
  }

  // Edit Worker Form Handler
  const editWorkerForm = document.getElementById('edit-worker-form');

  function showEditWorkerModal(workerId) {
    const worker = store.getWorkers().find(w => w.id.toUpperCase() === workerId.toUpperCase());
    if (!worker) return;

    document.getElementById('edit-worker-id').value = worker.id;
    document.getElementById('edit-worker-name').value = worker.name;
    if (document.getElementById('edit-worker-nickname')) {
      document.getElementById('edit-worker-nickname').value = worker.nickname || '';
    }
    if (document.getElementById('edit-worker-year')) {
      document.getElementById('edit-worker-year').value = worker.year || 'ชั้นปีที่ 1';
    }
    document.getElementById('edit-worker-dept').value = worker.department || '';
    document.getElementById('edit-worker-pos').value = worker.position || '';
    document.getElementById('edit-worker-email').value = worker.email || '';
    document.getElementById('edit-worker-target').value = worker.targetHours || 30;
    document.getElementById('edit-worker-avatar').value = worker.avatar || '';

    openModal('edit-worker-modal');
  }

  if (editWorkerForm) {
    editWorkerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const workerId = document.getElementById('edit-worker-id').value;
      const nickEl = document.getElementById('edit-worker-nickname');
      const yearEl = document.getElementById('edit-worker-year');

      const data = {
        name: document.getElementById('edit-worker-name').value.trim(),
        nickname: nickEl ? nickEl.value.trim() : '',
        year: yearEl ? yearEl.value : 'ชั้นปีที่ 1',
        department: document.getElementById('edit-worker-dept').value.trim(),
        position: document.getElementById('edit-worker-pos').value.trim(),
        email: document.getElementById('edit-worker-email').value.trim(),
        targetHours: parseInt(document.getElementById('edit-worker-target').value) || 30,
        avatar: document.getElementById('edit-worker-avatar').value.trim()
      };

      try {
        store.updateWorker(workerId, data);
        ui.showToast(`อัปเดตข้อมูลผู้ปฏิบัติงาน "${data.name}" เรียบร้อยแล้ว`, 'success');
        closeModal('edit-worker-modal');
        refreshHeaderProfile();
        renderAdminRoster();
        populateUserDropdown();
      } catch (err) {
        ui.showToast(err.message, 'danger');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 7. Modals Controllers & Event Handlers
  // --------------------------------------------------------------------------
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  // Fullscreen Image Lightbox Helper
  function openImageViewer(src, caption = '') {
    if (!src) return;
    const imgEl = document.getElementById('image-viewer-img');
    const captionEl = document.getElementById('image-viewer-caption');
    if (imgEl) imgEl.src = src;
    if (captionEl) {
      captionEl.textContent = caption || 'รูปภาพขยายเต็ม (Full Resolution Preview)';
      captionEl.style.display = caption ? 'inline-block' : 'none';
    }
    openModal('image-viewer-modal');
  }
  window.openImageViewer = openImageViewer;

  // Image Upload Processor (Supports file of ANY size, converts to optimized Data URL)
  function processUploadedImageFile(file, callback) {
    if (!file) return;
    ui.showToast('กำลังประมวลผลรูปภาพ...', 'info');
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1400; // max 1400px dimension for ultra sharp quality
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        callback(dataUrl);
        ui.showToast('อัปโหลดรูปภาพเรียบร้อยแล้ว', 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Image File Input Event Handlers
  const actFormBannerFile = document.getElementById('act-form-banner-file');
  const actFormBannerInput = document.getElementById('act-form-banner');
  const actFormBannerPreviewBox = document.getElementById('act-form-banner-preview-box');
  const actFormBannerPreviewImg = document.getElementById('act-form-banner-preview-img');

  if (actFormBannerFile) {
    actFormBannerFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        processUploadedImageFile(file, (dataUrl) => {
          if (actFormBannerInput) actFormBannerInput.value = dataUrl;
          if (actFormBannerPreviewImg) actFormBannerPreviewImg.src = dataUrl;
          if (actFormBannerPreviewBox) actFormBannerPreviewBox.style.display = 'block';
        });
      }
    });
  }

  const workerFormAvatarFile = document.getElementById('worker-form-avatar-file');
  const workerFormAvatarInput = document.getElementById('worker-form-avatar');
  const workerFormAvatarPreviewBox = document.getElementById('worker-form-avatar-preview-box');
  const workerFormAvatarPreviewImg = document.getElementById('worker-form-avatar-preview-img');

  if (workerFormAvatarFile) {
    workerFormAvatarFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        processUploadedImageFile(file, (dataUrl) => {
          if (workerFormAvatarInput) workerFormAvatarInput.value = dataUrl;
          if (workerFormAvatarPreviewImg) workerFormAvatarPreviewImg.src = dataUrl;
          if (workerFormAvatarPreviewBox) workerFormAvatarPreviewBox.style.display = 'block';
        });
      }
    });
  }

  const editWorkerAvatarFile = document.getElementById('edit-worker-avatar-file');
  const editWorkerAvatarInput = document.getElementById('edit-worker-avatar');
  const editWorkerAvatarPreviewBox = document.getElementById('edit-worker-avatar-preview-box');
  const editWorkerAvatarPreviewImg = document.getElementById('edit-worker-avatar-preview-img');

  if (editWorkerAvatarFile) {
    editWorkerAvatarFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        processUploadedImageFile(file, (dataUrl) => {
          if (editWorkerAvatarInput) editWorkerAvatarInput.value = dataUrl;
          if (editWorkerAvatarPreviewImg) editWorkerAvatarPreviewImg.src = dataUrl;
          if (editWorkerAvatarPreviewBox) editWorkerAvatarPreviewBox.style.display = 'block';
        });
      }
    });
  }

  // Modal 1: Details Modal
  function showActivityDetailsModal(actId) {
    window._activeDetailsActivityId = actId;
    const act = store.getActivityById(actId);
    if (!act) return;

    const currentUserId = store.getCurrentUserId();
    const isUserRegistered = store.getRegistrations().some(r => r.workerId === currentUserId && r.activityId === actId && r.status !== 'cancelled');
    const isFull = act.registeredCount >= act.maxCapacity;

    let statusBadgeHtml = '';
    if (act.status === 'completed') {
      statusBadgeHtml = `<span class="status-badge completed">กิจกรรมเสร็จสิ้นแล้ว</span>`;
    } else if (isUserRegistered) {
      statusBadgeHtml = `<span class="status-badge registered">คุณลงทะเบียนแล้ว</span>`;
    } else if (isFull || act.status === 'full') {
      statusBadgeHtml = `<span class="status-badge full">ที่นั่งเต็ม</span>`;
    } else {
      statusBadgeHtml = `<span class="status-badge open">เปิดรับสมัคร</span>`;
    }

    let actionButtonHtml = '';
    if (act.status === 'completed') {
      actionButtonHtml = `<button class="btn btn-outline btn-disabled" disabled style="width:100%;">กิจกรรมเสร็จสิ้นแล้ว</button>`;
    } else if (isUserRegistered) {
      actionButtonHtml = `<button class="btn btn-danger detail-cancel-reg-btn" data-act-id="${act.id}" style="width:100%;">ยกเลิกการลงทะเบียน</button>`;
    } else if (isFull || act.status === 'full') {
      actionButtonHtml = `<button class="btn btn-outline btn-disabled" disabled style="width:100%;">ที่นั่งเต็มแล้ว</button>`;
    } else {
      actionButtonHtml = `<button class="btn btn-primary detail-register-btn" data-act-id="${act.id}" style="width:100%;">ลงทะเบียนเข้าร่วมกิจกรรมนี้</button>`;
    }

    const percentFilled = Math.min(100, Math.round((act.registeredCount / act.maxCapacity) * 100));
    const detailsBody = document.getElementById('details-act-body');
    const detailsTitle = document.getElementById('details-act-title');

    detailsTitle.textContent = act.title;
    detailsBody.innerHTML = `
      <div style="position:relative; margin-bottom:1.25rem; border-radius:var(--radius-md); overflow:hidden; cursor:pointer;" class="detail-banner-container" title="คลิกเพื่อขยายดูรูปภาพขนาดเต็ม">
        <img src="${act.banner}" style="width:100%; max-height:300px; object-fit:cover; display:block;" alt="banner" />
        <div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.75); color:#fff; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:600; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.3);">
          🔍 คลิกดูรูปขยายเต็ม
        </div>
      </div>
      
      <div style="display:flex; gap:8px; margin-bottom:1rem; flex-wrap:wrap; align-items:center;">
        ${statusBadgeHtml}
        <span class="category-tag" style="position:static;">${act.category}</span>
        <span class="hours-badge" style="position:static;">⏱ ${act.hours} ชม.กิจกรรม</span>
        <span style="font-size:0.85rem; color:var(--text-muted); padding:4px 8px; background:var(--bg-main); border-radius:var(--radius-sm); font-weight:600;">รหัส: ${act.id}</span>
      </div>

      <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-md); margin-bottom:1.25rem; border:1px solid var(--border-color);">
        <h4 style="font-size:0.95rem; font-weight:600; margin-bottom:6px; color:var(--text-main);">รายละเอียดกิจกรรม:</h4>
        <p style="font-size:0.925rem; line-height:1.7; color:var(--text-main); white-space:pre-line;">${act.description}</p>
      </div>
      
      <div class="card-meta" style="font-size:0.9rem; padding:1.25rem; background:var(--bg-surface); border-radius:var(--radius-md); margin-bottom:1.25rem; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
        <div class="meta-item">
          <span class="meta-icon">📅</span>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted);">กำหนดการวันเวลา</div>
            <strong style="color:var(--text-main);">${ui.formatThaiDate(act.date)} | ${act.time}</strong>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">📍</span>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted);">สถานที่จัดกิจกรรม</div>
            <strong style="color:var(--text-main);">${act.location}</strong>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">👥</span>
          <div style="width:100%;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted);">
              <span>ที่นั่งลงทะเบียน</span>
              <strong>${act.registeredCount} / ${act.maxCapacity} คน (${percentFilled}%)</strong>
            </div>
            <div class="progress-bar-bg" style="margin-top:4px;">
              <div class="progress-bar-fill ${isFull ? 'full' : ''}" style="width: ${percentFilled}%"></div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:1rem;">
        ${actionButtonHtml}
      </div>
    `;

    // Click banner to view lightbox
    const bannerContainer = detailsBody.querySelector('.detail-banner-container');
    if (bannerContainer) {
      bannerContainer.addEventListener('click', () => {
        openImageViewer(act.banner, act.title);
      });
    }

    // Detail Register Button
    const detailRegBtn = detailsBody.querySelector('.detail-register-btn');
    if (detailRegBtn) {
      detailRegBtn.addEventListener('click', () => {
        if (!store.isWorkerAuthenticated()) {
          ui.showToast('กรุณาเข้าสู่ระบบด้วยรหัสนักศึกษาก่อนลงทะเบียนกิจกรรม', 'info');
          closeModal('activity-details-modal');
          openModal('worker-login-modal');
          return;
        }
        try {
          store.registerWorker(currentUserId, act.id);
          ui.showToast('ลงทะเบียนเข้าร่วมกิจกรรมเรียบร้อยแล้ว!', 'success');
          closeModal('activity-details-modal');
          refreshHeaderProfile();
          renderActivitiesGrid();
        } catch (err) {
          ui.showToast(err.message, 'danger');
        }
      });
    }

    // Detail Cancel Button
    const detailCancelBtn = detailsBody.querySelector('.detail-cancel-reg-btn');
    if (detailCancelBtn) {
      detailCancelBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการยกเลิกการลงทะเบียนกิจกรรมนี้ใช่หรือไม่?')) {
          store.cancelRegistration(currentUserId, act.id);
          ui.showToast('ยกเลิกการลงทะเบียนเรียบร้อยแล้ว', 'info');
          closeModal('activity-details-modal');
          refreshHeaderProfile();
          renderActivitiesGrid();
        }
      });
    }

    openModal('activity-details-modal');
  }

  // Modal 2: Add/Edit Activity Form Handler
  const activityFormModal = document.getElementById('activity-form-modal');
  const activityForm = document.getElementById('activity-form');
  const actFormModalTitle = document.getElementById('act-form-modal-title');

  function formatDateForInput(dateInput) {
    if (!dateInput) return new Date().toISOString().split('T')[0];

    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) return new Date().toISOString().split('T')[0];
      let y = dateInput.getFullYear();
      if (y > 2400) y -= 543;
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    let str = String(dateInput).trim();
    if (!str) return new Date().toISOString().split('T')[0];

    // Handle ISO strings or strings with T / Z (e.g. "2026-08-10T00:00:00.000Z")
    if (str.includes('T') || str.includes('Z')) {
      const isoDate = new Date(str);
      if (!isNaN(isoDate.getTime())) {
        let y = isoDate.getFullYear();
        if (y > 2400) y -= 543;
        const m = String(isoDate.getMonth() + 1).padStart(2, '0');
        const d = String(isoDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      str = str.split('T')[0].split(' ')[0];
    }

    // 1. YYYY-MM-DD or YYYY/MM/DD or YYYY-M-D
    const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymdMatch) {
      let y = parseInt(ymdMatch[1], 10);
      if (y > 2400) y -= 543;
      const m = String(ymdMatch[2]).padStart(2, '0');
      const d = String(ymdMatch[3]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // 2. DD/MM/YYYY or DD-MM-YYYY or D-M-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const d = String(dmyMatch[1]).padStart(2, '0');
      const m = String(dmyMatch[2]).padStart(2, '0');
      let y = parseInt(dmyMatch[3], 10);
      if (y > 2400) y -= 543;
      return `${y}-${m}-${d}`;
    }

    // 3. Thai text format like "10 ส.ค. 2569" or "10 สิงหาคม 2569"
    const thaiMonths = {
      'ม.ค.': '01', 'มกราคม': '01',
      'ก.พ.': '02', 'กุมภาพันธ์': '02',
      'มี.ค.': '03', 'มีนาคม': '03',
      'เม.ย.': '04', 'เมษายน': '04',
      'พ.ค.': '05', 'พฤษภาคม': '05',
      'มิ.ย.': '06', 'มิถุนายน': '06',
      'ก.ค.': '07', 'กรกฎาคม': '07',
      'ส.ค.': '08', 'สิงหาคม': '08',
      'ก.ย.': '09', 'กันยายน': '09',
      'ต.ค.': '10', 'ตุลาคม': '10',
      'พ.ย.': '11', 'พฤศจิกายน': '11',
      'ธ.ค.': '12', 'ธันวาคม': '12'
    };
    for (const [thName, monthNum] of Object.entries(thaiMonths)) {
      if (str.includes(thName)) {
        const parts = str.split(/\s+/);
        const day = String(parseInt(parts[0], 10) || 1).padStart(2, '0');
        let year = parseInt(parts[parts.length - 1], 10) || new Date().getFullYear();
        if (year > 2400) year -= 543;
        return `${year}-${monthNum}-${day}`;
      }
    }

    // 4. Standard Date parse fallback
    try {
      const parsedDate = new Date(str);
      if (!isNaN(parsedDate.getTime())) {
        let year = parsedDate.getFullYear();
        if (year > 2400) year -= 543;
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) { }

    return new Date().toISOString().split('T')[0];
  }

  function showActivityFormModal(actId = null) {
    activityForm.reset();
    if (actId) {
      const act = store.getActivityById(actId);
      if (!act) return;

      populateCategoryDropdowns(act.category);
      actFormModalTitle.textContent = 'แก้ไขกิจกรรม';
      document.getElementById('act-form-id').value = act.id;
      document.getElementById('act-form-title').value = act.title;
      document.getElementById('act-form-desc').value = act.description;
      document.getElementById('act-form-category').value = act.category;
      document.getElementById('act-form-hours').value = act.hours;
      document.getElementById('act-form-date').value = formatDateForInput(act.date);
      document.getElementById('act-form-time').value = act.time;
      document.getElementById('act-form-location').value = act.location;
      document.getElementById('act-form-capacity').value = act.maxCapacity;
      document.getElementById('act-form-status').value = act.status;
      document.getElementById('act-form-banner').value = act.banner;
    } else {
      populateCategoryDropdowns();
      actFormModalTitle.textContent = 'เพิ่มกิจกรรมใหม่';
      document.getElementById('act-form-id').value = '';
      document.getElementById('act-form-date').value = formatDateForInput(new Date());
    }
    openModal('activity-form-modal');
  }

  document.querySelectorAll('#admin-add-activity-btn, #admin-add-activity-btn-2, .trigger-add-activity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!store.isAdminAuthenticated()) {
        ui.showToast('กรุณาเข้าสู่ระบบเจ้าหน้าที่ก่อนทำการเพิ่มกิจกรรมใหม่', 'info');
        document.getElementById('admin-password').value = '';
        openModal('admin-login-modal');
        return;
      }
      showActivityFormModal();
    });
  });

  activityForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('act-form-id').value;

    const data = {
      title: document.getElementById('act-form-title').value.trim(),
      description: document.getElementById('act-form-desc').value.trim(),
      category: document.getElementById('act-form-category').value,
      hours: parseFloat(document.getElementById('act-form-hours').value) || 3,
      date: formatDateForInput(document.getElementById('act-form-date').value),
      time: document.getElementById('act-form-time').value.trim(),
      location: document.getElementById('act-form-location').value.trim(),
      maxCapacity: parseInt(document.getElementById('act-form-capacity').value) || 30,
      status: document.getElementById('act-form-status').value,
      banner: document.getElementById('act-form-banner').value.trim() || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600'
    };

    const isAutoEnroll = document.getElementById('act-form-auto-enroll') ? document.getElementById('act-form-auto-enroll').checked : false;

    if (id) {
      store.updateActivity(id, data);
      ui.showToast('อัปเดตข้อมูลกิจกรรมเรียบร้อยแล้ว', 'success');
    } else {
      const newAct = store.addActivity(data);

      if (isAutoEnroll) {
        const workers = store.getWorkers();
        workers.forEach(w => {
          try {
            const reg = store.registerWorker(w.id, newAct.id);
            if (data.status === 'completed') {
              store.updateAttendance(reg.id, 'completed', data.hours, 'อนุมัติชั่วโมงอัตโนมัติจากการสร้างกิจกรรมเสร็จสิ้น');
            }
          } catch (err) {
            // ignore if already registered
          }
        });
        ui.showToast(`✨ สร้างกิจกรรมใหม่ (${data.hours} ชม.) พร้อมปรับเพิ่มชั่วโมงสะสมและเป้าหมายผู้ปฏิบัติงานทุกคนเรียบร้อยแล้ว`, 'success');
      } else {
        ui.showToast(`สร้างกิจกรรมใหม่ (${data.hours} ชม.) เรียบร้อยแล้ว`, 'success');
      }
    }

    closeModal('activity-form-modal');
    refreshHeaderProfile();
    renderCurrentView();
  });

  // Modal 3: Add Worker Form Handler
  const workerForm = document.getElementById('worker-form');

  document.querySelectorAll('#admin-add-worker-btn, #admin-add-worker-btn-2').forEach(btn => {
    btn.addEventListener('click', () => {
      workerForm.reset();
      openModal('worker-form-modal');
    });
  });

  workerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idEl = document.getElementById('worker-form-id');
    const nameEl = document.getElementById('worker-form-name');
    const nickEl = document.getElementById('worker-form-nickname');
    const yearEl = document.getElementById('worker-form-year');
    const deptEl = document.getElementById('worker-form-dept');
    const posEl = document.getElementById('worker-form-pos');
    const emailEl = document.getElementById('worker-form-email');
    const targetEl = document.getElementById('worker-form-target');
    const avatarEl = document.getElementById('worker-form-avatar');

    const data = {
      id: idEl ? idEl.value.trim() : '',
      name: nameEl ? nameEl.value.trim() : '',
      nickname: nickEl ? nickEl.value.trim() : '',
      year: yearEl ? yearEl.value : 'ชั้นปีที่ 1',
      department: deptEl ? deptEl.value.trim() : '',
      position: posEl ? posEl.value.trim() : '',
      email: emailEl ? emailEl.value.trim() : '',
      targetHours: (targetEl ? parseInt(targetEl.value) : 30) || 30,
      avatar: avatarEl ? avatarEl.value.trim() : ''
    };

    if (!data.name || !data.department) {
      ui.showToast('กรุณาระบุชื่อ-นามสกุลและสาขาวิชา/สังกัด', 'danger');
      return;
    }

    store.addWorker(data);
    ui.showToast(`เพิ่มผู้ปฏิบัติงาน "${data.name}" เรียบร้อยแล้ว`, 'success');
    closeModal('worker-form-modal');
    populateUserDropdown();
    renderAdminRoster();
  });

  // Modal 4: Manage Activity Roster & Attendance Approval
  function showActivityRosterModal(actId) {
    window._activeRosterActivityId = actId;
    const act = store.getActivityById(actId);
    if (!act) return;

    document.getElementById('roster-modal-act-title').textContent = act.title;
    document.getElementById('roster-modal-act-subtitle').textContent = `รหัสกิจกรรม: ${act.id} | ชั่วโมงกิจกรรมฐาน: ${act.hours} ชม.`;

    const registrations = store.getRegistrations().filter(r => r.activityId === actId && r.status !== 'cancelled');
    const workers = store.getWorkers();
    const tbody = document.getElementById('roster-modal-table-body');

    if (registrations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">
            ยังไม่มีผู้ลงทะเบียนเข้าร่วมกิจกรรมนี้
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = registrations.map((reg, idx) => {
        const worker = workers.find(w => w.id === reg.workerId) || { name: reg.workerName || 'ไม่ระบุ', nickname: reg.workerNickname || '-', year: reg.workerYear || '-', department: reg.workerDept || '-' };
        const isCompleted = reg.status === 'completed';
        const nicknameDisplay = (reg.workerNickname || worker.nickname) && (reg.workerNickname || worker.nickname) !== '-' ? `(${reg.workerNickname || worker.nickname})` : '';

        return `
          <tr>
            <td style="text-align:center; font-weight:600;">${idx + 1}</td>
            <td>
              <strong style="display:block; color:var(--text-main);">${reg.workerName || worker.name} <span style="color:var(--primary); font-size:0.85rem;">${nicknameDisplay}</span></strong>
              <small style="color:var(--text-muted);">รหัสนักศึกษา: ${reg.studentId || reg.workerId}</small>
            </td>
            <td>
              <span class="badge" style="background:var(--primary-light); color:var(--primary); font-size:0.75rem; padding:2px 6px; border-radius:4px; margin-bottom:2px; display:inline-block;">${reg.workerYear || worker.year || 'ชั้นปีที่ 1'}</span>
              <div style="font-size:0.85rem; font-weight:500; color:var(--text-main);">${reg.workerDept || worker.department || '-'}</div>
            </td>
            <td style="text-align:center;">
              <input type="number" class="form-control roster-hours-input" data-reg-id="${reg.id}" value="${isCompleted ? reg.hoursGranted : act.hours}" min="0" max="50" step="0.5" style="width:70px; text-align:center; margin:0 auto;">
            </td>
            <td style="text-align:center;">
              <div style="display:flex; gap:6px; justify-content:center;">
                <button class="btn ${isCompleted ? 'btn-success' : 'btn-outline'} btn-sm approve-hours-btn" data-reg-id="${reg.id}">
                  ${isCompleted ? '✔ อนุมัติแล้ว' : 'อนุมัติชั่วโมง'}
                </button>
                <button class="btn btn-ghost btn-sm mark-absent-btn" data-reg-id="${reg.id}" style="color:var(--danger);" title="ทำเครื่องหมายว่าไม่ได้เข้าร่วม">
                  ✖ ขาด
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach Attendance Event Listeners
      tbody.querySelectorAll('.approve-hours-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const regId = (e.currentTarget || e.target.closest('[data-reg-id]')).getAttribute('data-reg-id');
          const hoursInput = tbody.querySelector(`.roster-hours-input[data-reg-id="${regId}"]`);
          const hoursToGrant = parseFloat(hoursInput.value) || act.hours;

          store.updateAttendance(regId, 'completed', hoursToGrant, 'ผ่านการอนุมัติชั่วโมงโดยเจ้าหน้าที่');
          ui.showToast('บันทึกการอนุมัติชั่วโมงกิจกรรมเรียบร้อยแล้ว', 'success');
          refreshHeaderProfile();
          showActivityRosterModal(actId);
        });
      });

      tbody.querySelectorAll('.mark-absent-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const regId = (e.currentTarget || e.target.closest('[data-reg-id]')).getAttribute('data-reg-id');
          store.updateAttendance(regId, 'absent', 0, 'ไม่ได้เข้าร่วมกิจกรรม');
          ui.showToast('บันทึกสถานะไม่ได้เข้าร่วมกิจกรรม', 'info');
          refreshHeaderProfile();
          showActivityRosterModal(actId);
        });
      });
    }

    openModal('activity-roster-modal');
  }

  // Modal 5: Manual Register Worker to Activity
  const manualRegisterForm = document.getElementById('manual-register-form');
  const manualRegActSelect = document.getElementById('manual-reg-act-select');

  function showManualRegisterModal(workerId) {
    const worker = store.getWorkers().find(w => w.id === workerId);
    if (!worker) return;

    document.getElementById('manual-reg-worker-id').value = workerId;
    document.getElementById('manual-reg-worker-info').innerHTML = `
      เพิ่มกิจกรรมให้ผู้ปฏิบัติงาน: <strong>${worker.name} (${worker.id})</strong> - ${worker.department}
    `;

    const openActivities = store.getActivities().filter(a => a.status === 'open');
    manualRegActSelect.innerHTML = openActivities.map(a => `
      <option value="${a.id}">
        ${a.title} (${a.hours} ชม.) - เหลือที่นั่ง ${a.maxCapacity - a.registeredCount} คน
      </option>
    `).join('');

    openModal('manual-register-modal');
  }

  manualRegisterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const workerId = document.getElementById('manual-reg-worker-id').value;
    const actId = manualRegActSelect.value;

    try {
      store.registerWorker(workerId, actId);
      ui.showToast('เพิ่มผู้ปฏิบัติงานเข้าร่วมกิจกรรมเรียบร้อยแล้ว', 'success');
      closeModal('manual-register-modal');
      refreshHeaderProfile();
      renderAdminRoster();
    } catch (err) {
      ui.showToast(err.message, 'danger');
    }
  });

  // Reset Data Handler
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างใช่หรือไม่?')) {
        store.resetToDefault();
        ui.showToast('รีเซ็ตข้อมูลตัวอย่างทั้งหมดเรียบร้อยแล้ว', 'info');
        initApp();
      }
    });
  }

  // Export CSV Handler
  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      exportReportCSV();
    });
  }

  function exportReportCSV() {
    const workers = store.getWorkers();
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel support
    csvContent += "รหัสนักศึกษา/รหัสผู้ปฏิบัติงาน,ชื่อ-นามสกุล,ชื่อเล่น,ชั้นปี,สาขาวิชา/สังกัด,ตำแหน่ง,ชั่วโมงสะสม,เป้าหมายชั่วโมง,สถานะเกณฑ์\n";

    workers.forEach(w => {
      const summary = store.getWorkerSummary(w.id);
      const isTargetMet = summary.completedHours >= summary.targetHours ? 'ผ่านเกณฑ์' : 'ยังไม่ครบเกณฑ์';
      csvContent += `"${w.id}","${w.name}","${w.nickname || '-'}","${w.year || 'ชั้นปีที่ 1'}","${w.department}","${w.position}",${summary.completedHours},${summary.targetHours},"${isTargetMet}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `smo_staff_hours_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ui.showToast('ส่งออกข้อมูลรายงาน CSV เรียบร้อยแล้ว', 'success');
  }

  // --------------------------------------------------------------------------
  // 8. Excel / CSV Roster Import System
  // --------------------------------------------------------------------------
  let pendingImportWorkers = [];

  const triggerImportExcelBtn = document.getElementById('trigger-import-excel-btn');
  const browseFileBtn = document.getElementById('browse-file-btn');
  const importFileInput = document.getElementById('import-file-input');
  const downloadTemplateCsvBtn = document.getElementById('download-template-csv-btn');
  const modalDownloadTemplateBtn = document.getElementById('modal-download-template-btn');
  const confirmImportBtn = document.getElementById('confirm-import-btn');
  const importPreviewSection = document.getElementById('import-preview-section');
  const importPreviewCount = document.getElementById('import-preview-count');
  const importPreviewTbody = document.getElementById('import-preview-tbody');

  if (triggerImportExcelBtn) {
    triggerImportExcelBtn.addEventListener('click', () => {
      if (!store.isAdminAuthenticated()) {
        ui.showToast('กรุณาเข้าสู่ระบบเจ้าหน้าที่ก่อนใช้งานฟังก์ชันนำเข้ารายชื่อ', 'info');
        document.getElementById('admin-password').value = '';
        openModal('admin-login-modal');
        return;
      }
      resetImportState();
      openModal('excel-import-modal');
    });
  }

  function resetImportState() {
    pendingImportWorkers = [];
    if (importFileInput) importFileInput.value = '';
    if (importPreviewSection) importPreviewSection.style.display = 'none';
    if (confirmImportBtn) {
      confirmImportBtn.disabled = true;
      confirmImportBtn.classList.add('btn-disabled');
    }
  }

  if (browseFileBtn && importFileInput) {
    browseFileBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFileSelect);
  }

  function downloadRosterTemplateCSV() {
    let template = "\uFEFF"; // UTF-8 BOM
    template += "รหัสนักศึกษา,ชื่อ-นามสกุล,ชื่อเล่น,ชั้นปี,สาขาวิชา/สังกัด,ตำแหน่ง,อีเมล,เป้าหมายชั่วโมง\n";
    template += "663450012-3,นายเกียรติศักดิ์ มีสุข,กิ๊ก,ชั้นปีที่ 2,สาขาวิชาเทคโนโลยีสารสนเทศ,ฝ่ายวิชาการ,kiattisak.m@org.mail,30\n";
    template += "673450099-1,นางสาวนภาพร เจริญยิ่ง,ส้ม,ชั้นปีที่ 1,สาขาวิชาวิทยาการคอมพิวเตอร์,ฝ่ายสื่อสารองค์กร,napaporn.c@org.mail,30\n";

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smo_staff_roster_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    ui.showToast('ดาวน์โหลดไฟล์แม่แบบ CSV เรียบร้อยแล้ว', 'success');
  }

  if (downloadTemplateCsvBtn) downloadTemplateCsvBtn.addEventListener('click', downloadRosterTemplateCSV);
  if (modalDownloadTemplateBtn) modalDownloadTemplateBtn.addEventListener('click', downloadRosterTemplateCSV);

  function handleImportFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const text = evt.target.result;
      parseCSVText(text);
    };
    reader.readAsText(file, 'UTF-8');
  }

  function parseCSVText(text) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length <= 1) {
      ui.showToast('ไฟล์ที่เลือกไม่มีข้อมูล หรือรูปแบบไม่ถูกต้อง', 'danger');
      return;
    }

    pendingImportWorkers = [];
    // Skip header line if present
    const startIndex = (lines[0].includes('รหัส') || lines[0].includes('name') || lines[0].includes('ID')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quotes & comma splitting
      const cols = line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());

      if (cols.length >= 2 && cols[0] && cols[1]) {
        const hasNick = cols.length >= 4;
        pendingImportWorkers.push({
          id: cols[0],
          name: cols[1],
          nickname: hasNick ? cols[2] : '-',
          year: hasNick ? cols[3] : 'ชั้นปีที่ 1',
          department: cols[hasNick ? 4 : 2] || 'ไม่ระบุสาขา',
          position: cols[hasNick ? 5 : 3] || 'ผู้ปฏิบัติงาน',
          email: cols[hasNick ? 6 : 4] || `${cols[0].toLowerCase()}@org.mail`,
          targetHours: parseInt(cols[hasNick ? 7 : 5]) || 30
        });
      }
    }

    if (pendingImportWorkers.length === 0) {
      ui.showToast('ไม่สามารถอ่านข้อมูลผู้ปฏิบัติงานจากไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์', 'danger');
      return;
    }

    // Render Preview Table
    importPreviewCount.textContent = pendingImportWorkers.length;
    importPreviewTbody.innerHTML = pendingImportWorkers.map(w => `
      <tr>
        <td><strong>${w.id}</strong></td>
        <td>${w.name}</td>
        <td>${w.department}</td>
        <td>${w.position}</td>
        <td style="text-align:center;">${w.targetHours} ชม.</td>
      </tr>
    `).join('');

    importPreviewSection.style.display = 'block';
    confirmImportBtn.disabled = false;
    confirmImportBtn.classList.remove('btn-disabled');
    ui.showToast(`พบข้อมูลผู้ปฏิบัติงานทั้งหมด ${pendingImportWorkers.length} รายการ`, 'info');
  }

  if (confirmImportBtn) {
    confirmImportBtn.addEventListener('click', () => {
      if (pendingImportWorkers.length === 0) return;

      const count = store.importWorkersBatch(pendingImportWorkers);
      closeModal('excel-import-modal');
      renderAdminRoster();
      ui.showToast(`🎉 นำเข้ารายชื่อผู้ปฏิบัติงานสำเร็จแล้ว ${count} รายการ!`, 'success');
    });
  }

  // --------------------------------------------------------------------------
  // 9. Admin Account Management System
  // --------------------------------------------------------------------------
  const adminAddOfficerBtn = document.getElementById('admin-add-officer-btn');
  const adminViewOfficersBtn = document.getElementById('admin-view-officers-btn');
  const addAdminForm = document.getElementById('add-admin-form');
  const adminListTbody = document.getElementById('admin-list-tbody');

  if (adminAddOfficerBtn) {
    adminAddOfficerBtn.addEventListener('click', () => {
      if (!store.isAdminAuthenticated()) {
        ui.showToast('กรุณาเข้าสู่ระบบเจ้าหน้าที่ก่อนจัดการแอดมิน', 'info');
        document.getElementById('admin-password').value = '';
        openModal('admin-login-modal');
        return;
      }
      if (addAdminForm) addAdminForm.reset();
      openModal('add-admin-modal');
    });
  }

  if (addAdminForm) {
    addAdminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('new-admin-username').value.trim();
      const password = document.getElementById('new-admin-password').value.trim();
      const name = document.getElementById('new-admin-name').value.trim();
      const department = document.getElementById('new-admin-dept').value.trim();
      const role = document.getElementById('new-admin-role').value;

      try {
        const newAdmin = store.addAdmin({ username, password, name, department, role });
        closeModal('add-admin-modal');
        ui.showToast(`🔑 สร้างบัญชีแอดมิน "${newAdmin.name}" (${newAdmin.username}) เรียบร้อยแล้ว`, 'success');
      } catch (err) {
        ui.showToast(err.message, 'danger');
      }
    });
  }

  if (adminViewOfficersBtn) {
    adminViewOfficersBtn.addEventListener('click', () => {
      if (!store.isAdminAuthenticated()) {
        ui.showToast('กรุณาเข้าสู่ระบบเจ้าหน้าที่ก่อนดูรายชื่อแอดมิน', 'info');
        document.getElementById('admin-password').value = '';
        openModal('admin-login-modal');
        return;
      }
      renderAdminAccountsList();
      openModal('admin-list-modal');
    });
  }

  const editAdminForm = document.getElementById('edit-admin-form');

  if (editAdminForm) {
    editAdminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('edit-admin-username').value;
      const name = document.getElementById('edit-admin-name').value.trim();
      const department = document.getElementById('edit-admin-dept').value.trim();
      const role = document.getElementById('edit-admin-role').value;
      const password = document.getElementById('edit-admin-password').value;

      try {
        store.updateAdmin(username, { name, department, role, password });
        closeModal('edit-admin-modal');
        renderAdminAccountsList();
        ui.showToast(`อัปเดตข้อมูลแอดมิน "${name}" เรียบร้อยแล้ว`, 'success');
      } catch (err) {
        ui.showToast(err.message, 'danger');
      }
    });
  }

  function renderAdminAccountsList() {
    const admins = store.getAdmins();
    if (!adminListTbody) return;

    if (admins.length === 0) {
      adminListTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">
            ไม่พบรายชื่อแอดมินในระบบ
          </td>
        </tr>
      `;
      return;
    }

    adminListTbody.innerHTML = admins.map((a, idx) => `
      <tr>
        <td style="text-align:center; font-weight:600;">${idx + 1}</td>
        <td>
          <strong style="color:var(--admin-accent); display:block;">${a.name}</strong>
          <small style="color:var(--text-muted);">Username: ${a.username}</small>
        </td>
        <td>${a.department || '-'}</td>
        <td style="text-align:center;">
          <span class="status-badge ${a.role === 'Super Admin' ? 'completed' : 'registered'}">
            ${a.role}
          </span>
        </td>
        <td style="text-align:center; font-size:0.85rem; color:var(--text-muted);">${a.createdAt || '-'}</td>
        <td style="text-align:center;">
          <div style="display:flex; gap:4px; justify-content:center;">
            <button class="btn btn-ghost btn-sm admin-edit-btn" data-username="${a.username}" title="แก้ไขข้อมูล">✏️</button>
            <button class="btn btn-ghost btn-sm admin-delete-btn" data-username="${a.username}" style="color:var(--danger);" title="ลบบัญชี">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach Edit Listeners
    adminListTbody.querySelectorAll('.admin-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = (e.currentTarget || e.target.closest('[data-username]')).getAttribute('data-username');
        const adminObj = store.getAdmins().find(a => a.username.toLowerCase() === username.toLowerCase());
        if (!adminObj) return;

        document.getElementById('edit-admin-username').value = adminObj.username;
        document.getElementById('edit-admin-name').value = adminObj.name;
        document.getElementById('edit-admin-dept').value = adminObj.department || '';
        document.getElementById('edit-admin-role').value = adminObj.role || 'Officer';
        document.getElementById('edit-admin-password').value = '';

        openModal('edit-admin-modal');
      });
    });

    // Attach Delete Listeners
    adminListTbody.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = (e.currentTarget || e.target.closest('[data-username]')).getAttribute('data-username');
        const adminObj = store.getAdmins().find(a => a.username.toLowerCase() === username.toLowerCase());
        const adminName = adminObj ? adminObj.name : username;

        if (confirm(`คุณต้องการลบบัญชีแอดมิน "${adminName}" (${username}) ใช่หรือไม่?`)) {
          try {
            store.deleteAdmin(username);
            renderAdminAccountsList();
            ui.showToast(`ลบบัญชีแอดมิน "${adminName}" เรียบร้อยแล้ว`, 'info');
          } catch (err) {
            ui.showToast(err.message, 'danger');
          }
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 10. Google Sheets Integration System
  // --------------------------------------------------------------------------
  const adminGoogleSheetSettingsBtn = document.getElementById('admin-google-sheet-settings-btn');
  const sheetsUrlInput = document.getElementById('sheets-url-input');
  const saveSheetsUrlBtn = document.getElementById('save-sheets-url-btn');
  const manualSyncSheetsBtn = document.getElementById('manual-sync-sheets-btn');
  const manualFetchSheetsBtn = document.getElementById('manual-fetch-sheets-btn');
  const copyGasCodeBtn = document.getElementById('copy-gas-code-btn');

  if (adminGoogleSheetSettingsBtn) {
    adminGoogleSheetSettingsBtn.addEventListener('click', () => {
      if (!store.isAdminAuthenticated()) {
        ui.showToast('กรุณาเข้าสู่ระบบเจ้าหน้าที่ก่อนจัดการการเชื่อมต่อ Google Sheets', 'info');
        document.getElementById('admin-password').value = '';
        openModal('admin-login-modal');
        return;
      }
      if (sheetsUrlInput) sheetsUrlInput.value = store.getGoogleSheetUrl();
      openModal('google-sheet-settings-modal');
    });
  }

  if (saveSheetsUrlBtn) {
    saveSheetsUrlBtn.addEventListener('click', () => {
      const url = sheetsUrlInput.value.trim();
      store.setGoogleSheetUrl(url);
      if (url) {
        ui.showToast('บันทึก Google Sheets Web App URL เรียบร้อยแล้ว', 'success');
      } else {
        ui.showToast('ยกเลิกการเชื่อมต่อ Google Sheets แล้ว', 'info');
      }
    });
  }

  const pushAllToSheetsBtn = document.getElementById('push-all-to-sheets-btn');
  if (pushAllToSheetsBtn) {
    pushAllToSheetsBtn.addEventListener('click', async () => {
      ui.showToast('กำลังส่งข้อมูลจากเครื่องนี้ขึ้น Google Sheets...', 'info');
      const result = await store.syncToGoogleSheets();
      if (result.success) {
        ui.showToast('ส่งข้อมูลทั้งหมดจากเครื่องนี้ขึ้น Google Sheets เรียบร้อยแล้ว! ทุกเครื่องเห็นตรงกันทันที', 'success');
      } else {
        ui.showToast(result.message, 'danger');
      }
    });
  }

  if (manualSyncSheetsBtn) {
    manualSyncSheetsBtn.addEventListener('click', async () => {
      const result = await store.syncToGoogleSheets();
      if (result.success) {
        ui.showToast('ซิงค์ส่งข้อมูลผู้ปฏิบัติงาน กิจกรรม และการสะสมชั่วโมงไปยัง Google Sheets เรียบร้อยแล้ว', 'success');
      } else {
        ui.showToast(result.message, 'danger');
      }
    });
  }

  if (manualFetchSheetsBtn) {
    manualFetchSheetsBtn.addEventListener('click', async () => {
      const result = await store.fetchFromGoogleSheets(true);
      if (result.success) {
        populateCategoryDropdowns();
        populateUserDropdown();
        refreshHeaderProfile();
        renderCurrentView();
        ui.showToast('ดึงข้อมูลล่าสุดจาก Google Sheets เรียบร้อยแล้ว', 'success');
      } else {
        ui.showToast(result.message, 'danger');
      }
    });
  }

  if (copyGasCodeBtn) {
    copyGasCodeBtn.addEventListener('click', () => {
      const codeBlock = document.getElementById('gas-code-block');
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.innerText);
        ui.showToast('คัดลอกโค้ดสคริปต์ Google Apps Script เรียบร้อยแล้ว', 'info');
      }
    });
  }

  // Initial Run
  initApp();
});
