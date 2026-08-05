/* ==========================================================================
   Smo-Staff: Local Storage Engine & Data Store
   Manages seed data, state persistence, worker profile, activities CRUD, and registrations
   ========================================================================== */

const STORAGE_KEYS = {
  ACTIVITIES: 'smo_staff_activities_v1',
  WORKERS: 'smo_staff_workers_v1',
  REGISTRATIONS: 'smo_staff_registrations_v1',
  CURRENT_USER_ID: 'smo_staff_current_user_id_v1',
  CURRENT_ROLE: 'smo_staff_current_role_v1',
  THEME: 'smo_staff_theme_v1',
  ADMIN_AUTH: 'smo_staff_admin_auth_v1',
  CURRENT_ADMIN_USER: 'smo_staff_current_admin_user_v1',
  WORKER_AUTH: 'smo_staff_worker_auth_v1',
  CATEGORIES: 'smo_staff_categories_v1',
  ADMINS: 'smo_staff_admins_v1',
  GOOGLE_SHEET_URL: 'smo_staff_google_sheet_url_v1'
};

const DEFAULT_ADMINS = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'ผู้ดูแลระบบหลัก (Super Admin)',
    department: 'ฝ่ายบริหารและเทคโนโลยี',
    role: 'Super Admin',
    createdAt: '2026-08-01'
  }
];

const DEFAULT_CATEGORIES = [
  'งานอบรม/สัมมนา',
  'งานจิตอาสา',
  'งานบริการสังคม',
  'งานสนับสนุนองค์กร'
];

// Default Shared Google Sheets Web App URL (Fallback for all devices)
const DEFAULT_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwPBAtMIc046woTN5b71WNZOUHrvkXLzNpvdluwyYaVy17GF41wy1aR5l5dAl5Fo4-H/exec';

// Initial Institutional Seed Data
const DEFAULT_WORKERS = [
  {
    id: '683450329-0',
    name: 'ศาตนันทน์ ดวงสีทอง',
    nickname: 'ศา',
    year: 'ชั้นปีที่ 3',
    department: 'สาขาวิชาเทคโนโลยีสารสนเทศ',
    position: 'ฝ่ายวิชาการ',
    email: 'Satanan.d@kkumail.com',
    targetHours: 200,
    avatar: 'https://drive.google.com/thumbnail?id=1O_DsvlU1JNpLAVuS9U19JSnGLySUluNn&sz=w800'
  },
  {
    id: '673450351-6',
    name: 'นายอภินันต์ คำดี',
    nickname: 'อภิ',
    year: 'ชั้นปีที่ 2',
    department: 'สาขาวิทยาการคอมพิวเตอร์',
    position: 'นายกสโมสรนักศึกษา',
    email: '673450351-6@org.mail',
    targetHours: 30,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  }
];

const DEFAULT_ACTIVITIES = [
  {
    id: 'ACT-2026-001',
    title: 'อบรมปฐมนิเทศผู้ปฏิบัติงานและระเบียบปฏิบัติสโมสรนักศึกษา',
    description: 'กิจกรรมอบรมชี้แจงแนวปฏิบัติ การบันทึกภาระงาน และการสะสมชั่วโมงสำหรับผู้ปฏิบัติงานสโมสรนักศึกษา',
    category: 'งานอบรม/สัมมนา',
    date: '2026-08-10',
    time: '09:00 - 16:00 น.',
    location: 'ห้องประชุมสโมสรนักศึกษา อาคารกิจกรรม',
    hours: 6,
    maxCapacity: 50,
    status: 'open',
    banner: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'ACT-2026-002',
    title: 'กิจกรรมจิตอาสาพัฒนาและจัดเตรียมสถานที่สถาบัน',
    description: 'บำเพ็ญประโยชน์ ทำความสะอาด และปรับปรุงทัศนียภาพพื้นที่ส่วนกลางสโมสรนักศึกษา',
    category: 'งานจิตอาสา',
    date: '2026-08-15',
    time: '08:30 - 12:30 น.',
    location: 'ลานกิจกรรมสโมสรนักศึกษา',
    hours: 4,
    maxCapacity: 40,
    status: 'open',
    banner: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=600'
  }
];

const DEFAULT_REGISTRATIONS = [];

function parseGoogleDriveAvatarUrl(url) {
  if (!url) return '';
  const cleanUrl = url.trim();
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=))([a-zA-Z0-9_-]+)/i;
  const match = cleanUrl.match(driveRegex);

  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
  return cleanUrl;
}

class Store {
  constructor() {
    this.init();
  }

  init() {
    const currentWorkers = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKERS) || '[]');
    if (!localStorage.getItem(STORAGE_KEYS.WORKERS) || currentWorkers.length === 0) {
      localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(DEFAULT_WORKERS));
    }

    const currentActivities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || currentActivities.length === 0) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
    }

    if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_REGISTRATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(DEFAULT_ADMINS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, '');
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, 'worker');
    }
    if (!localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL)) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_URL, DEFAULT_GOOGLE_SHEET_URL);
    }
    this.sanitizeAndFixDuplicateActivityIds();
    this.initRealtimeWebSocket();
  }

  initRealtimeWebSocket() {
    try {
      if (this._realtimeSocket) return;
      const socketUrl = 'wss://free.websocket.in/v3/smo-staff-sync-global?api_key=public';
      const ws = new WebSocket(socketUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'DATA_UPDATED') {
            window.dispatchEvent(new CustomEvent('smo-realtime-signal', { detail: data }));
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        this._realtimeSocket = null;
        setTimeout(() => this.initRealtimeWebSocket(), 3000);
      };

      ws.onerror = () => {
        try { ws.close(); } catch (e) {}
      };

      this._realtimeSocket = ws;
    } catch (e) {
      // Fallback silently if WebSockets are blocked
    }
  }

  // --- Real-time Notification Engine ---
  notifyDataChanged(details = {}) {
    try {
      const payload = {
        type: 'DATA_UPDATED',
        timestamp: Date.now(),
        source: details.source || 'local',
        ...details
      };

      if (payload.source !== 'cloud') {
        payload.snapshot = {
          workers: this.getWorkers(),
          activities: this.getActivities(),
          registrations: this.getRegistrations(),
          categories: this.getCategories(),
          admins: this.getAdmins()
        };
      }

      if ('BroadcastChannel' in window) {
        if (!this._syncChannel) {
          this._syncChannel = new BroadcastChannel('smo_staff_sync_channel');
        }
        this._syncChannel.postMessage(payload);
      }

      if (this._realtimeSocket && this._realtimeSocket.readyState === WebSocket.OPEN) {
        try {
          this._realtimeSocket.send(JSON.stringify(payload));
        } catch (e) {}
      }
    } catch (e) {
      // Ignore broadcast errors
    }
    window.dispatchEvent(new CustomEvent('smo-data-updated', { detail: details }));
  }

  getDataFingerprint() {
    try {
      const w = localStorage.getItem(STORAGE_KEYS.WORKERS) || '';
      const a = localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '';
      const r = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '';
      const c = localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '';
      const adm = localStorage.getItem(STORAGE_KEYS.ADMINS) || '';
      const str = `${w}|${a}|${r}|${c}|${adm}`;

      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0xFFFFFFFF;
      }
      return `${str.length}_${hash.toString(36)}`;
    } catch (e) {
      return '';
    }
  }

  // --- Google Sheets Integration Engine ---
  getGoogleSheetUrl() {
    const saved = localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL);
    if (saved !== null && saved !== undefined) {
      return saved.trim() || DEFAULT_GOOGLE_SHEET_URL;
    }
    return DEFAULT_GOOGLE_SHEET_URL;
  }

  setGoogleSheetUrl(url) {
    const cleanUrl = (url || '').trim();
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_URL, cleanUrl || DEFAULT_GOOGLE_SHEET_URL);
    this.autoSyncToSheets();
  }

  async syncToGoogleSheets() {
    const url = this.getGoogleSheetUrl();
    if (!url) return { success: false, message: 'ยังไม่ได้ระบุ Google Sheets Web App URL' };

    window._isSyncingToSheets = true;
    window._lastSyncTimestamp = Date.now();

    const payload = {
      action: 'syncAll',
      timestamp: new Date().toISOString(),
      workers: this.getWorkers(),
      activities: this.getActivities(),
      registrations: this.getRegistrations(),
      categories: this.getCategories(),
      admins: this.getAdmins()
    };

    try {
      const jsonString = JSON.stringify(payload);
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: jsonString,
        mode: 'no-cors'
      });
      setTimeout(() => {
        window._isSyncingToSheets = false;
      }, 3500);
      return { success: true, message: 'ซิงค์ข้อมูลกับ Google Sheets เรียบร้อยแล้ว' };
    } catch (err) {
      window._isSyncingToSheets = false;
      console.warn('Google Sheets sync warning:', err);
      return { success: false, message: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล: ' + err.message };
    }
  }

  autoSyncToSheets() {
    this.notifyDataChanged();
    const url = this.getGoogleSheetUrl();
    if (!url) return;
    this.syncToGoogleSheets().catch(err => {
      console.warn('Auto sync to Google Sheets warning:', err);
    });
  }

  async fetchFromGoogleSheets() {
    const url = this.getGoogleSheetUrl();
    if (!url) return { success: false, message: 'ยังไม่ได้ระบุ Google Sheets Web App URL' };

    // Skip fetch if currently pushing to avoid race condition
    if (window._isSyncingToSheets || (Date.now() - (window._lastSyncTimestamp || 0) < 800)) {
      return { success: true, skipped: true };
    }

    try {
      const cacheBuster = `_t=${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const fetchUrl = url.includes('?') ? `${url}&action=getAll&${cacheBuster}` : `${url}?action=getAll&${cacheBuster}`;
      const response = await fetch(fetchUrl, { cache: 'no-store' });
      const data = await response.json();

      if (data && typeof data === 'object') {
        let hasRemoteData = false;
        const prevFingerprint = this.getDataFingerprint();

        // 1. Synchronize Remote Workers
        if (Array.isArray(data.workers)) {
          let remoteWorkers = data.workers.map(w => ({
            ...w,
            nickname: w.nickname || w.nick || '-',
            year: w.year || w.classYear || 'ชั้นปีที่ 1',
            targetHours: parseInt(w.targetHours) || 30,
            avatar: parseGoogleDriveAvatarUrl(w.avatar)
          }));
          if (remoteWorkers.length > 0) {
            localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(remoteWorkers));
            hasRemoteData = true;
          }
        }

        // 2. Synchronize Remote Activities
        if (Array.isArray(data.activities)) {
          let remoteActivities = data.activities.map(a => ({
            ...a,
            hours: parseFloat(a.hours) || 0,
            maxCapacity: parseInt(a.maxCapacity) || 30
          }));
          if (remoteActivities.length > 0) {
            localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(remoteActivities));
            hasRemoteData = true;
          }
        }

        // 3. Synchronize Remote Registrations
        if (Array.isArray(data.registrations)) {
          let remoteRegs = data.registrations
            .filter(r => r && r.status !== 'cancelled')
            .map(r => ({
              ...r,
              studentId: r.studentId || r.workerId,
              workerNickname: r.workerNickname || r.nickname || '-',
              workerYear: r.workerYear || r.year || 'ชั้นปีที่ 1',
              workerDept: r.workerDept || r.department || r.dept || '-',
              hoursGranted: parseFloat(r.hoursGranted) || 0
            }));
          localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(remoteRegs));
          if (remoteRegs.length > 0) hasRemoteData = true;
        }

        // 4. Synchronize Remote Categories
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const cleanCats = data.categories.filter(c => typeof c === 'string' && c.trim().length > 0);
          if (cleanCats.length > 0) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cleanCats));
          }
        }

        // 5. Synchronize Remote Admins
        if (Array.isArray(data.admins) && data.admins.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(data.admins));
        }

        // Sanitize and fix any duplicate activity IDs from cloud/local data
        this.sanitizeAndFixDuplicateActivityIds();

        const newFingerprint = this.getDataFingerprint();
        const dataChanged = prevFingerprint !== newFingerprint;

        // If remote Google Sheet was completely empty, seed it with default local data
        if (!hasRemoteData && (!data.workers || data.workers.length === 0) && (!data.activities || data.activities.length === 0)) {
          this.autoSyncToSheets();
        } else {
          this.notifyDataChanged({ source: 'cloud', updated: dataChanged });
        }

        return { success: true, updated: dataChanged };
      }
      return { success: false, message: 'รูปแบบข้อมูลจาก Google Sheets ไม่ถูกต้อง' };
    } catch (err) {
      console.warn('Fetch from Google Sheets warning:', err);
      return { success: false, message: 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้: ' + err.message };
    }
  }

  // --- Reset Store ---
  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(DEFAULT_WORKERS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_REGISTRATIONS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(DEFAULT_ADMINS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'STF-1001');
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, 'worker');
    this.autoSyncToSheets();
  }

  // --- Dynamic Admin Accounts ---
  getAdmins() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMINS)) || DEFAULT_ADMINS;
  }

  addAdmin(adminData) {
    const cleanUser = (adminData.username || '').trim().toLowerCase();
    if (!cleanUser || !adminData.password) {
      throw new Error('กรุณาระบุชื่อผู้ใช้งานและรหัสผ่านเจ้าหน้าที่');
    }
    const admins = this.getAdmins();
    if (admins.some(a => a.username.toLowerCase() === cleanUser)) {
      throw new Error('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น');
    }
    const newAdmin = {
      username: cleanUser,
      password: adminData.password.trim(),
      name: (adminData.name || '').trim() || `เจ้าหน้าที่ (${cleanUser})`,
      department: (adminData.department || '').trim() || 'ฝ่ายกิจกรรมผู้ปฏิบัติงาน',
      role: adminData.role || 'Officer',
      createdAt: new Date().toISOString().split('T')[0]
    };
    admins.push(newAdmin);
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    this.autoSyncToSheets();
    return newAdmin;
  }

  updateAdmin(username, updatedData) {
    let admins = this.getAdmins();
    const index = admins.findIndex(a => a.username.toLowerCase() === username.toLowerCase());
    if (index !== -1) {
      admins[index] = {
        ...admins[index],
        name: updatedData.name ? updatedData.name.trim() : admins[index].name,
        department: updatedData.department ? updatedData.department.trim() : admins[index].department,
        role: updatedData.role || admins[index].role,
        password: updatedData.password && updatedData.password.trim() ? updatedData.password.trim() : admins[index].password
      };
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
      this.autoSyncToSheets();
      return admins[index];
    }
    throw new Error('ไม่พบบัญชีแอดมินที่ต้องการแก้ไข');
  }

  deleteAdmin(username) {
    let admins = this.getAdmins();
    if (admins.length <= 1) {
      throw new Error('ไม่สามารถลบบัญชีแอดมินสุดท้ายในระบบได้');
    }
    admins = admins.filter(a => a.username.toLowerCase() !== username.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    this.autoSyncToSheets();
    return true;
  }

  // --- Dynamic Categories ---
  getCategories() {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || DEFAULT_CATEGORIES;
    if (Array.isArray(raw)) {
      const clean = raw.filter(c => typeof c === 'string' && c.trim().length > 0);
      if (clean.length > 0) return clean;
    }
    return DEFAULT_CATEGORIES;
  }

  addCategory(name) {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;
    const categories = this.getCategories();
    if (!categories.includes(cleanName)) {
      categories.push(cleanName);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      this.autoSyncToSheets();
    }
    return cleanName;
  }

  // --- Current User & Role ---
  getCurrentUserId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'STF-1001';
  }

  setCurrentUserId(id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  getCurrentUser() {
    const id = this.getCurrentUserId();
    return this.getWorkers().find(w => w.id === id) || this.getWorkers()[0];
  }

  getCurrentRole() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || 'worker';
  }

  setCurrentRole(role) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, role);
  }

  // --- Admin Authentication ---
  isAdminAuthenticated() {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  }

  // --- Admin Authentication & Profile ---
  getCurrentAdminUser() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN_USER) || 'admin';
  }

  getCurrentAdmin() {
    const user = this.getCurrentAdminUser();
    const admins = this.getAdmins();
    return admins.find(a => String(a.username).toLowerCase() === String(user).toLowerCase()) || admins[0];
  }

  isAdminAuthenticated() {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  }

  authenticateAdmin(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const admins = this.getAdmins();
    const found = admins.find(a =>
      String(a.username).toLowerCase() === cleanUser && String(a.password) === cleanPass
    );

    // Also support default passcode
    if (found || ((cleanUser === 'admin' || cleanUser === '') && (cleanPass === 'admin123' || cleanPass === '123456'))) {
      const activeAdmin = found || admins[0];
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, 'admin');
      localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN_USER, activeAdmin.username);
      this.notifyDataChanged();
      return { success: true, admin: activeAdmin };
    }

    return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง' };
  }

  logoutAdmin() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN_USER);
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, 'worker');
    this.notifyDataChanged();
  }

  // --- Worker / Student Authentication ---
  isWorkerAuthenticated() {
    return localStorage.getItem(STORAGE_KEYS.WORKER_AUTH) === 'true';
  }

  authenticateWorker(studentId) {
    const cleanId = (studentId || '').trim().toUpperCase();
    if (!cleanId) {
      return { success: false, message: 'กรุณาระบุรหัสนักศึกษา / รหัสผู้ปฏิบัติงาน' };
    }

    const workers = this.getWorkers();
    let worker = workers.find(w => String(w.id).toUpperCase() === cleanId);

    if (!worker) {
      // Auto register new student ID if not found in dataset
      worker = this.addWorker({
        id: cleanId,
        name: `ผู้ปฏิบัติงาน (${cleanId})`,
        nickname: '-',
        year: 'ชั้นปีที่ 1',
        email: `${cleanId.toLowerCase()}@student.org.mail`,
        department: 'สำนักวิชาทั่วไป',
        position: 'นักศึกษาผู้ปฏิบัติงาน',
        targetHours: 30
      });
    }

    this.setCurrentUserId(worker.id);
    localStorage.setItem(STORAGE_KEYS.WORKER_AUTH, 'true');
    this.notifyDataChanged();
    return { success: true, worker };
  }

  logoutWorker() {
    localStorage.removeItem(STORAGE_KEYS.WORKER_AUTH);
  }

  // --- Workers ---
  getWorkers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKERS)) || [];
  }

  generateNextWorkerId() {
    const workers = this.getWorkers();
    let maxNum = 2000;
    workers.forEach(w => {
      if (w.id && typeof w.id === 'string') {
        const match = w.id.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    let counter = maxNum + 1;
    let nextId = `STF-${counter}`;
    const existingIds = new Set(workers.map(w => w.id ? w.id.toUpperCase() : ''));
    while (existingIds.has(nextId.toUpperCase())) {
      counter++;
      nextId = `STF-${counter}`;
    }
    return nextId;
  }

  addWorker(workerData) {
    const workers = this.getWorkers();
    const workerId = workerData.id && workerData.id.trim() ? workerData.id.trim() : this.generateNextWorkerId();
    const newWorker = {
      id: workerId,
      name: workerData.name,
      nickname: workerData.nickname ? workerData.nickname.trim() : '-',
      year: workerData.year ? workerData.year.trim() : 'ชั้นปีที่ 1',
      email: workerData.email || `${workerId.toLowerCase()}@org.mail`,
      department: workerData.department || 'ไม่ระบุสาขา',
      position: workerData.position || 'ผู้ปฏิบัติงาน',
      targetHours: parseInt(workerData.targetHours) || 30,
      avatar: parseGoogleDriveAvatarUrl(workerData.avatar)
    };
    workers.push(newWorker);
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
    this.autoSyncToSheets();
    return newWorker;
  }

  importWorkersBatch(workerArray) {
    if (!Array.isArray(workerArray) || workerArray.length === 0) return 0;
    const workers = this.getWorkers();
    let count = 0;

    workerArray.forEach(wData => {
      if (!wData.id || !wData.name) return;
      const cleanId = wData.id.trim().toUpperCase();
      const existingIdx = workers.findIndex(w => w.id.toUpperCase() === cleanId);

      const workerObj = {
        id: cleanId,
        name: wData.name.trim(),
        nickname: wData.nickname ? wData.nickname.trim() : (wData.nick ? wData.nick.trim() : '-'),
        year: wData.year ? wData.year.trim() : (wData.classYear ? wData.classYear.trim() : 'ชั้นปีที่ 1'),
        email: wData.email ? wData.email.trim() : `${cleanId.toLowerCase()}@org.mail`,
        department: wData.department ? wData.department.trim() : 'ไม่ระบุสาขา',
        position: wData.position ? wData.position.trim() : 'ผู้ปฏิบัติงาน',
        targetHours: parseInt(wData.targetHours) || 30,
        avatar: parseGoogleDriveAvatarUrl(wData.avatar)
      };

      if (existingIdx !== -1) {
        workers[existingIdx] = { ...workers[existingIdx], ...workerObj };
      } else {
        workers.push(workerObj);
      }
      count++;
    });

    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
    this.autoSyncToSheets();
    return count;
  }

  updateWorker(workerId, updatedData) {
    const workers = this.getWorkers();
    const idx = workers.findIndex(w => w.id.toUpperCase() === workerId.toUpperCase());
    if (idx === -1) throw new Error('ไม่พบข้อมูลผู้ปฏิบัติงานในระบบ');

    workers[idx] = {
      ...workers[idx],
      name: updatedData.name ? updatedData.name.trim() : workers[idx].name,
      nickname: updatedData.nickname !== undefined ? updatedData.nickname.trim() : (workers[idx].nickname || '-'),
      year: updatedData.year ? updatedData.year.trim() : (workers[idx].year || 'ชั้นปีที่ 1'),
      department: updatedData.department ? updatedData.department.trim() : workers[idx].department,
      position: updatedData.position ? updatedData.position.trim() : workers[idx].position,
      email: updatedData.email ? updatedData.email.trim() : workers[idx].email,
      targetHours: parseInt(updatedData.targetHours) || workers[idx].targetHours,
      avatar: updatedData.avatar ? parseGoogleDriveAvatarUrl(updatedData.avatar) : workers[idx].avatar
    };

    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
    this.autoSyncToSheets();
    return workers[idx];
  }

  deleteWorker(workerId) {
    let workers = this.getWorkers();
    const cleanId = workerId.toUpperCase();
    const target = workers.find(w => w.id.toUpperCase() === cleanId);
    if (!target) throw new Error('ไม่พบรายชื่อผู้ปฏิบัติงานที่ต้องการลบ');

    workers = workers.filter(w => w.id.toUpperCase() !== cleanId);
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));

    // Also clean up registrations for deleted worker
    let registrations = this.getRegistrations();
    registrations = registrations.filter(r => r.workerId.toUpperCase() !== cleanId);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
    this.autoSyncToSheets();

    return true;
  }

  // --- Activities ---
  getActivities() {
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
    const registrations = this.getRegistrations();

    // Dynamically calculate current registered count for each activity
    return activities.map(act => {
      const activeRegs = registrations.filter(r => 
        String(r.activityId || '').trim().toLowerCase() === String(act.id || '').trim().toLowerCase() && 
        r.status !== 'cancelled'
      );
      return {
        ...act,
        registeredCount: activeRegs.length
      };
    });
  }

  getActivityById(id) {
    return this.getActivities().find(a => a.id === id);
  }

  generateNextActivityId() {
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
    const year = new Date().getFullYear();
    const prefix = `ACT-${year}-`;

    let maxNum = 0;
    activities.forEach(act => {
      if (act.id && typeof act.id === 'string') {
        const match = act.id.match(/ACT-\d+-(\d+)/i) || act.id.match(/\d+$/);
        if (match) {
          const num = parseInt(match[1] || match[0], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    let counter = maxNum + 1;
    let newId = `${prefix}${String(counter).padStart(3, '0')}`;
    const existingIds = new Set(activities.map(a => a.id ? a.id.toUpperCase() : ''));

    while (existingIds.has(newId.toUpperCase())) {
      counter++;
      newId = `${prefix}${String(counter).padStart(3, '0')}`;
    }

    return newId;
  }

  sanitizeAndFixDuplicateActivityIds() {
    let activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
    if (activities.length === 0) return;

    let registrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) || [];
    const seenIds = new Set();
    let modified = false;
    const year = new Date().getFullYear();

    activities.forEach((act, idx) => {
      const cleanId = act.id ? act.id.trim() : '';
      if (!cleanId || seenIds.has(cleanId.toUpperCase())) {
        // Generate new unique ID for duplicate!
        let counter = idx + 1;
        let newId = `ACT-${year}-${String(counter).padStart(3, '0')}`;
        while (seenIds.has(newId.toUpperCase())) {
          counter++;
          newId = `ACT-${year}-${String(counter).padStart(3, '0')}`;
        }

        const oldId = act.id;
        if (oldId) {
          registrations.forEach(r => {
            if (r.activityId === oldId) {
              r.activityId = newId;
            }
          });
        }

        act.id = newId;
        modified = true;
      }
      seenIds.add(act.id.toUpperCase());
    });

    if (modified) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
      this.autoSyncToSheets();
    }
  }

  addActivity(data) {
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
    const newId = data.id && data.id.trim() ? data.id.trim() : this.generateNextActivityId();
    const newActivity = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category || 'งานอบรม/สัมมนา',
      date: data.date,
      time: data.time || '09:00 - 16:00 น.',
      location: data.location,
      hours: parseFloat(data.hours) || 3,
      maxCapacity: parseInt(data.maxCapacity) || 30,
      status: data.status || 'open',
      banner: data.banner || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600'
    };
    activities.unshift(newActivity);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    this.autoSyncToSheets();
    return newActivity;
  }

  updateActivity(id, updatedData) {
    let activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
    const index = activities.findIndex(a => a.id === id);
    if (index !== -1) {
      activities[index] = { ...activities[index], ...updatedData };
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
      this.autoSyncToSheets();
      return activities[index];
    }
    return null;
  }

  deleteActivity(id) {
    let activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
    activities = activities.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));

    // Remove registrations associated with this activity
    let regs = this.getRegistrations();
    regs = regs.filter(r => r.activityId !== id);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
    this.autoSyncToSheets();
  }

  // --- Registrations & Attendance ---
  getRegistrations() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) || [];
  }

  registerWorker(workerId, activityId) {
    const regs = this.getRegistrations();
    const existing = regs.find(r => r.workerId === workerId && r.activityId === activityId && r.status !== 'cancelled');

    if (existing) {
      throw new Error('ผู้ปฏิบัติงานรายนี้ลงทะเบียนกิจกรรมนี้เรียบร้อยแล้ว');
    }

    const activity = this.getActivityById(activityId);
    if (!activity) throw new Error('ไม่พบกิจกรรมที่ระบุ');

    if (activity.registeredCount >= activity.maxCapacity) {
      throw new Error('กิจกรรมนี้มีผู้ลงทะเบียนเต็มจำนวนแล้ว');
    }

    const worker = this.getWorkers().find(w => w.id === workerId) || {
      id: workerId,
      name: `ผู้ปฏิบัติงาน (${workerId})`,
      nickname: '-',
      year: 'ชั้นปีที่ 1',
      department: 'สำนักวิชาทั่วไป'
    };

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newReg = {
      id: `REG-${Date.now()}`,
      workerId,
      studentId: worker.id,
      workerName: worker.name,
      workerNickname: worker.nickname || '-',
      workerYear: worker.year || 'ชั้นปีที่ 1',
      workerDept: worker.department || 'ไม่ระบุสาขา',
      activityId,
      registeredAt: dateStr,
      status: 'registered',
      hoursGranted: 0,
      note: 'ลงทะเบียนแล้ว รอเข้าร่วม'
    };

    regs.push(newReg);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));

    // Auto-update capacity status if full
    const activeRegCount = regs.filter(r => r.activityId === activityId && r.status !== 'cancelled').length;
    if (activeRegCount >= activity.maxCapacity && activity.status === 'open') {
      this.updateActivity(activityId, { status: 'full' });
    }
    this.autoSyncToSheets();

    return newReg;
  }

  cancelRegistration(workerId, activityId) {
    let regs = this.getRegistrations();
    const index = regs.findIndex(r => r.workerId === workerId && r.activityId === activityId && r.status !== 'cancelled');

    if (index !== -1) {
      regs.splice(index, 1);
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));

      // Re-open activity if it was full
      const activity = this.getActivityById(activityId);
      if (activity && activity.status === 'full') {
        this.updateActivity(activityId, { status: 'open' });
      }
      this.autoSyncToSheets();
      return true;
    }
    return false;
  }

  updateAttendance(registrationId, status, hoursGranted, note = '') {
    let regs = this.getRegistrations();
    const index = regs.findIndex(r => r.id === registrationId);
    if (index !== -1) {
      regs[index].status = status; // 'completed', 'absent', 'registered'
      regs[index].hoursGranted = status === 'completed' ? (parseFloat(hoursGranted) || 0) : 0;
      if (note) regs[index].note = note;
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
      this.autoSyncToSheets();
      return regs[index];
    }
    return null;
  }

  // --- Summary Calculations ---
  getWorkerSummary(workerId) {
    const worker = this.getWorkers().find(w => w.id === workerId);
    if (!worker) return null;

    const registrations = this.getRegistrations().filter(r => r.workerId === workerId && r.status !== 'cancelled');
    const activities = this.getActivities();

    let completedHours = 0;
    let pendingHours = 0;

    const history = registrations.map(reg => {
      const act = activities.find(a => a.id === reg.activityId) || {};
      if (reg.status === 'completed') {
        completedHours += (reg.hoursGranted || act.hours || 0);
      } else if (reg.status === 'registered') {
        pendingHours += (act.hours || 0);
      }

      return {
        registrationId: reg.id,
        activityId: act.id,
        activityTitle: act.title || 'กิจกรรมไม่ระบุ',
        category: act.category || '-',
        date: act.date || '-',
        time: act.time || '-',
        location: act.location || '-',
        baseHours: act.hours || 0,
        hoursGranted: reg.hoursGranted || 0,
        registeredAt: reg.registeredAt,
        status: reg.status, // 'registered', 'completed', 'absent'
        note: reg.note
      };
    });

    const totalSystemActivityHours = activities.reduce((sum, act) => sum + (parseFloat(act.hours) || 0), 0);
    const target = Math.max(worker.targetHours || 30, totalSystemActivityHours);
    const progressPercent = target > 0 ? Math.min(100, Math.round((completedHours / target) * 100)) : 0;

    return {
      worker,
      completedHours,
      pendingHours,
      targetHours: target,
      totalSystemActivityHours,
      progressPercent,
      totalRegisteredCount: history.length,
      completedCount: history.filter(h => h.status === 'completed').length,
      history
    };
  }
}

window.appStore = new Store();
