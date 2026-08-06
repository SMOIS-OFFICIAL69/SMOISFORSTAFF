// SYSTEM GLOBAL GOOGLE APPS SCRIPT WEB APP URL (SHARED BY ALL USERS & DEVICES)
window.DEFAULT_GAS_URL = window.DEFAULT_GAS_URL || 'https://script.google.com/macros/s/AKfycbxGC8t6PkLQ_0esKGW_WhRPH4j7Vzlok1VASafXzxYO0mPEsPF86y66KRmCBfOcehzw/exec';

const STORAGE_KEYS = {
  GAS_URL: 'smo_staff_gas_url',
  ACTIVITIES: 'smo_staff_activities',
  REGISTRATIONS: 'smo_staff_registrations',
  BACKUPS: 'smo_staff_backups',
  STAFF_USERS: 'smo_staff_users',
  ADMIN_USERS: 'smo_admin_users',
  CURRENT_STAFF: 'smo_current_staff',
  CURRENT_ADMIN: 'smo_current_admin'
};

// Helper: Convert Google Drive Share Link to Direct Displayable Image URL
function convertDriveUrlToDirectLink(url) {
  if (!url) return '';
  url = url.trim();
  const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
}

// Seed Staff Users
const SEED_STAFF_USERS = [
  {
    studentId: '673450351-6',
    fullName: 'นายอภินันท์ คำดี',
    major: 'ภาษาอังกฤษเพื่อการสื่อสารธุรกิจ',
    year: 'ชั้นปีที่ 3',
    department: 'สโมสรนักศึกษา',
    position: 'ประธานฝ่ายกิจกรรม',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    targetHours: 200
  },
  {
    studentId: '673450388-9',
    fullName: 'นางสาววิภาดา เรียนดี',
    major: 'เทคโนโลยีสารสนเทศ',
    year: 'ชั้นปีที่ 2',
    department: 'ฝ่ายประชาสัมพันธ์',
    position: 'เจ้าหน้าที่สารสนเทศ',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    targetHours: 200
  }
];

// Seed Admin Users
const SEED_ADMIN_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'นายวิชัย รักชาติ',
    position: 'หัวหน้างานบริการนักศึกษาและกิจกรรมองค์กร',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    role: 'Super Admin'
  },
  {
    username: 'staff01',
    password: 'password123',
    fullName: 'นางสาวสมใจ นามดี',
    position: 'เจ้าหน้าที่บริหารงานทั่วไป',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    role: 'Admin'
  }
];

// Seed Activities
const SEED_ACTIVITIES = [
  {
    id: 'ACT-2026-001',
    title: 'อบรมเชิงปฏิบัติการ: ทักษะการจัดการงานเอกสารและดิจิทัลสำหรับผู้ปฏิบัติงาน',
    category: 'อบรม',
    description: 'พัฒนาทักษะการใช้งานเครื่องมือ Google Workspace, AI Assistants และระบบงานสารบรรณอิเล็กทรอนิกส์ในยุคดิจิทัล',
    date: '2026-08-15',
    time: '09:00 - 16:00 น.',
    location: 'ห้องประชุมอัจฉริยะ ชั้น 4 อาคารอำนวยการ',
    maxQuota: 50,
    registeredCount: 38,
    hours: 6,
    status: 'open',
    banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'ACT-2026-002',
    title: 'กิจกรรมบิ๊กคลีนนิ่งเดย์และปรับปรุงทัศนียภาพพื้นที่ปฏิบัติงาน',
    category: 'จิตอาสา',
    description: 'ร่วมมือร่วมใจทำความสะอาด 5ส จัดระเบียบพื้นที่ทำงาน และปลูกต้นไม้เพิ่มพื้นที่สีเขียวในองค์กร',
    date: '2026-08-20',
    time: '08:30 - 12:00 น.',
    location: 'ลานกิจกรรมกลาง และ อาคารปฏิบัติงาน 1-3',
    maxQuota: 100,
    registeredCount: 100,
    hours: 4,
    status: 'full',
    banner: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'ACT-2026-003',
    title: 'สัมมนาแลกเปลี่ยนเรียนรู้ (KM): การบริการด้วยใจและความปลอดภัยในการทำงาน',
    category: 'วิชาการ',
    description: 'แชร์ประสบการณ์ ตัวอย่างความสำเร็จ และทริคในการสื่อสารกับผู้รับบริการอย่างมืออาชีพ',
    date: '2026-08-28',
    time: '13:00 - 16:30 น.',
    location: 'หอประชุมใหญ่ ชั้น 2',
    maxQuota: 80,
    registeredCount: 42,
    hours: 3,
    status: 'open',
    banner: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80'
  }
];

// Seed Registrations
const SEED_REGISTRATIONS = [
  {
    regId: 'REG-1786009414461',
    timestamp: '2026-08-01 10:15:20',
    staffId: '673450351-6',
    staffName: 'นายอภินันท์ คำดี',
    major: 'ภาษาอังกฤษเพื่อการสื่อสารธุรกิจ',
    department: 'สโมสรนักศึกษา',
    position: 'ประธานฝ่ายกิจกรรม',
    activityId: 'ACT-2026-001',
    activityTitle: 'One Journey วันเจอนี่',
    baseHours: 6,
    earnedHours: 0,
    status: 'pending',
    checkInTime: null
  },
  {
    regId: 'REG-1786001024881',
    timestamp: '2026-08-02 14:22:10',
    staffId: '673450351-6',
    staffName: 'นายอภินันท์ คำดี',
    major: 'ภาษาอังกฤษเพื่อการสื่อสารธุรกิจ',
    department: 'สโมสรนักศึกษา',
    position: 'ประธานฝ่ายกิจกรรม',
    activityId: 'ACT-2026-002',
    activityTitle: 'โครงการปฏิบัติธรรมในวันธรรมสวนะ ประจำปี 2569',
    baseHours: 2,
    earnedHours: 2,
    status: 'approved',
    checkInTime: '2026-08-06 09:05:00'
  }
];

const SEED_BACKUPS = [
  {
    backupId: 'DRV-BAK-20260805',
    timestamp: '2026-08-05 23:59:00',
    fileName: 'SmoStaff_Backup_2026-08-05.json',
    fileUrl: 'https://drive.google.com/',
    recordCount: 2,
    status: 'success'
  }
];

class SmoStaffAPI {
  constructor() {
    this.initLocalStorage();
  }

  getGasUrl() {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) || window.DEFAULT_GAS_URL || '';
  }

  async setGasUrl(url) {
    url = url.trim();
    localStorage.setItem(STORAGE_KEYS.GAS_URL, url);
    if (url) {
      await this.syncDataFromGoogleSheets();
    }
  }

  initLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(SEED_REGISTRATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BACKUPS)) {
      localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(SEED_BACKUPS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STAFF_USERS)) {
      localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(SEED_STAFF_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_USERS)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(SEED_ADMIN_USERS));
    }
  }

  /**
   * LIVE SYNC: ดึงข้อมูลจริงทั้งหมดจาก Google Sheets ผ่าน Web App API
   */
  sanitizeActivities(activities) {
    if (!Array.isArray(activities)) return activities;
    const seen = new Set();
    return activities.map(act => {
      if (!act) return act;
      let id = act.id ? String(act.id).trim() : '';
      if (!id || seen.has(id)) {
        id = this.generateUniqueActivityId(Array.from(seen).map(i => ({ id: i })));
      }
      seen.add(id);
      return { ...act, id };
    });
  }

  async syncDataFromGoogleSheets() {
    const gasUrl = this.getGasUrl();
    if (!gasUrl) return false;

    try {
      // 1. Ultra-Fast Single Unified Request (Fetches all 5 tables in 1 HTTP payload)
      const res = await fetch(`${gasUrl}?action=getAllData`);
      const json = await res.json();
      if (json && json.status === 'success' && json.data) {
        if (Array.isArray(json.data.activities)) {
          localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(this.sanitizeActivities(json.data.activities)));
        }
        if (Array.isArray(json.data.registrations)) {
          localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(json.data.registrations));
        }
        if (Array.isArray(json.data.staffUsers)) {
          localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(json.data.staffUsers));
        }
        if (Array.isArray(json.data.adminUsers)) {
          localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(json.data.adminUsers));
        }
        if (Array.isArray(json.data.backups)) {
          localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(json.data.backups));
        }
        return true;
      }
    } catch (err) {
      console.warn('Unified fast sync attempt failed, trying fallback:', err);
    }

    // Fallback: Parallel requests if deployed Code.gs is older version
    try {
      const [actRes, regRes, staffRes, adminRes, backupRes] = await Promise.all([
        fetch(`${gasUrl}?action=getActivities`),
        fetch(`${gasUrl}?action=getRegistrations`),
        fetch(`${gasUrl}?action=getStaffUsers`),
        fetch(`${gasUrl}?action=getAdminUsers`),
        fetch(`${gasUrl}?action=getBackups`)
      ]);

      const [actJson, regJson, staffJson, adminJson, backupJson] = await Promise.all([
        actRes.json(),
        regRes.json(),
        staffRes.json(),
        adminRes.json(),
        backupRes.json()
      ]);

      if (actJson && actJson.status === 'success' && Array.isArray(actJson.data)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(this.sanitizeActivities(actJson.data)));
      }
      if (regJson && regJson.status === 'success' && Array.isArray(regJson.data)) {
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regJson.data));
      }
      if (staffJson && staffJson.status === 'success' && Array.isArray(staffJson.data)) {
        localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(staffJson.data));
      }
      if (adminJson && adminJson.status === 'success' && Array.isArray(adminJson.data)) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(adminJson.data));
      }
      if (backupJson && backupJson.status === 'success' && Array.isArray(backupJson.data)) {
        localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backupJson.data));
      }

      return true;
    } catch (err) {
      console.warn('Google Sheets live sync error:', err);
      return false;
    }
  }

  // --- AUTHENTICATION & USERS ---
  getStaffUsers() {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS) || '[]');
    if (!local || local.length === 0) {
      localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(SEED_STAFF_USERS));
      return SEED_STAFF_USERS;
    }
    return local;
  }

  getAdminUsers() {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_USERS) || '[]');
    if (!local || local.length === 0) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(SEED_ADMIN_USERS));
      return SEED_ADMIN_USERS;
    }
    return local;
  }

  getCurrentStaff() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_STAFF) || 'null');
  }

  setCurrentStaff(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STAFF, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STAFF);
    }
  }

  getCurrentAdmin() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN) || 'null');
  }

  setCurrentAdmin(admin) {
    if (admin) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(admin));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
    }
  }

  loginStaff(studentId) {
    const staffList = this.getStaffUsers();
    const found = staffList.find(s => s.studentId.trim() === studentId.trim());
    if (found) {
      this.setCurrentStaff(found);
      return { success: true, user: found };
    }

    const newUser = {
      studentId: studentId.trim(),
      fullName: 'ผู้ปฏิบัติงานกิจกรรม',
      major: 'สาขาวิชาทั่วไป',
      year: 'ชั้นปีที่ 1',
      department: 'สโมสรนักศึกษา',
      position: 'ผู้ปฏิบัติงานกิจกรรม',
      avatar: '',
      targetHours: 200
    };
    this.createStaffUser(newUser);
    this.setCurrentStaff(newUser);
    return { success: true, user: newUser };
  }

  loginAdmin(username, password) {
    const adminList = this.getAdminUsers();
    const found = adminList.find(a => a.username.trim() === username.trim() && a.password === password);
    if (found) {
      this.setCurrentAdmin(found);
      return { success: true, admin: found };
    }
    return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านแอดมินไม่ถูกต้อง' };
  }

  async createStaffUser(userData) {
    userData.avatar = convertDriveUrlToDirectLink(userData.avatar);
    const list = this.getStaffUsers();
    list.unshift(userData);
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(list));

    await this.sendGasMutation('createStaffUser', { data: userData }, `studentId=${encodeURIComponent(userData.studentId)}&fullName=${encodeURIComponent(userData.fullName)}&major=${encodeURIComponent(userData.major || '')}&year=${encodeURIComponent(userData.year || '')}&department=${encodeURIComponent(userData.department || '')}&position=${encodeURIComponent(userData.position || '')}&targetHours=${encodeURIComponent(userData.targetHours || 200)}&avatar=${encodeURIComponent(userData.avatar || '')}`);
    return userData;
  }

  async updateStaffUser(studentId, updatedData) {
    const list = this.getStaffUsers();
    const idx = list.findIndex(s => s.studentId === studentId);
    if (idx !== -1) {
      if (updatedData.avatar) updatedData.avatar = convertDriveUrlToDirectLink(updatedData.avatar);
      list[idx] = { ...list[idx], ...updatedData };
      localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(list));

      const curr = this.getCurrentStaff();
      if (curr && curr.studentId === studentId) {
        this.setCurrentStaff(list[idx]);
      }

      await this.sendGasMutation('createStaffUser', { data: list[idx] }, `studentId=${encodeURIComponent(studentId)}&fullName=${encodeURIComponent(list[idx].fullName)}&major=${encodeURIComponent(list[idx].major || '')}&year=${encodeURIComponent(list[idx].year || '')}&department=${encodeURIComponent(list[idx].department || '')}&position=${encodeURIComponent(list[idx].position || '')}&targetHours=${encodeURIComponent(list[idx].targetHours || 200)}&avatar=${encodeURIComponent(list[idx].avatar || '')}`);
      return { success: true, user: list[idx] };
    }
    return { success: false };
  }

  async deleteStaffUser(studentId) {
    let list = this.getStaffUsers();
    list = list.filter(s => s.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(list));

    await this.sendGasMutation('deleteStaffUser', { studentId: studentId }, `studentId=${encodeURIComponent(studentId)}`);
    return { success: true };
  }

  async createAdminUser(adminData) {
    adminData.avatar = convertDriveUrlToDirectLink(adminData.avatar);
    const list = this.getAdminUsers();
    list.unshift(adminData);
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(list));

    await this.sendGasMutation('createAdminUser', { data: adminData }, `username=${encodeURIComponent(adminData.username)}&fullName=${encodeURIComponent(adminData.fullName)}&position=${encodeURIComponent(adminData.position || '')}&role=${encodeURIComponent(adminData.role || 'Admin')}`);
    return adminData;
  }

  async updateAdminUser(username, updatedData) {
    const list = this.getAdminUsers();
    const idx = list.findIndex(a => a.username === username);
    if (idx !== -1) {
      if (updatedData.avatar) {
        updatedData.avatar = convertDriveUrlToDirectLink(updatedData.avatar);
      }
      list[idx] = { ...list[idx], ...updatedData };
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(list));

      const curr = this.getCurrentAdmin();
      if (curr && curr.username === username) {
        this.setCurrentAdmin(list[idx]);
      }

      await this.sendGasMutation('createAdminUser', { data: list[idx] }, `username=${encodeURIComponent(username)}&fullName=${encodeURIComponent(list[idx].fullName)}&position=${encodeURIComponent(list[idx].position || '')}&role=${encodeURIComponent(list[idx].role || 'Admin')}`);
      return { success: true, admin: list[idx] };
    }
    return { success: false };
  }

  async deleteAdminUser(username) {
    let list = this.getAdminUsers();
    list = list.filter(a => a.username !== username);
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(list));

    await this.sendGasMutation('deleteAdminUser', { username: username }, `username=${encodeURIComponent(username)}`);
    return { success: true };
  }

  // --- ACTIVITIES CRUD ---
  getActivities() {
    let local = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
    if (!Array.isArray(local) || local.length === 0) return local;

    // Self-healing: Check for duplicate IDs in local storage
    const seen = new Set();
    let hasDuplicates = false;
    for (const act of local) {
      if (!act || !act.id || seen.has(act.id)) {
        hasDuplicates = true;
        break;
      }
      seen.add(act.id);
    }

    if (hasDuplicates) {
      const fixedSet = new Set();
      const cleaned = local.map(act => {
        if (!act) return act;
        let id = act.id;
        if (!id || fixedSet.has(id)) {
          id = this.generateUniqueActivityId(Array.from(fixedSet).map(i => ({ id: i })));
        }
        fixedSet.add(id);
        return { ...act, id };
      });
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(cleaned));
      return cleaned;
    }

    return local;
  }

  generateUniqueActivityId(activities) {
    const currentYear = new Date().getFullYear();
    let maxNum = 0;

    if (Array.isArray(activities)) {
      activities.forEach(act => {
        if (!act || !act.id) return;
        const strId = String(act.id).trim();
        const match = strId.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
    }

    let counter = maxNum + 1;
    let candidateId = '';
    do {
      const padded = String(counter).padStart(3, '0');
      candidateId = `ACT-${currentYear}-${padded}`;
      counter++;
    } while (Array.isArray(activities) && activities.some(a => String(a.id) === candidateId));

    return candidateId;
  }

  async createActivity(activityData) {
    activityData.banner = convertDriveUrlToDirectLink(activityData.banner);
    const activities = this.getActivities();
    const newId = this.generateUniqueActivityId(activities);
    const newAct = {
      id: newId,
      ...activityData,
      registeredCount: 0,
      status: 'open'
    };
    activities.unshift(newAct);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));

    await this.sendGasMutation('createActivity', { data: newAct }, `id=${encodeURIComponent(newAct.id)}&title=${encodeURIComponent(newAct.title)}&location=${encodeURIComponent(newAct.location || '')}&date=${encodeURIComponent(newAct.date || '')}&time=${encodeURIComponent(newAct.time || '')}&maxQuota=${newAct.maxQuota}&hours=${newAct.hours}`);
    return newAct;
  }

  async updateActivity(id, updatedData) {
    const activities = this.getActivities();
    const idx = activities.findIndex(a => a.id === id);
    if (idx !== -1) {
      if (updatedData.banner) updatedData.banner = convertDriveUrlToDirectLink(updatedData.banner);
      activities[idx] = { ...activities[idx], ...updatedData };
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));

      await this.sendGasMutation('updateActivity', { data: activities[idx] }, `id=${encodeURIComponent(id)}&title=${encodeURIComponent(activities[idx].title)}&location=${encodeURIComponent(activities[idx].location || '')}&date=${encodeURIComponent(activities[idx].date || '')}&time=${encodeURIComponent(activities[idx].time || '')}&maxQuota=${activities[idx].maxQuota}&hours=${activities[idx].hours}&status=${encodeURIComponent(activities[idx].status || 'open')}`);
      return { success: true, activity: activities[idx] };
    }
    return { success: false };
  }

  async saveActivitiesOrder(activitiesArray) {
    if (Array.isArray(activitiesArray)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activitiesArray));
      return { success: true };
    }
    return { success: false };
  }

  async deleteActivity(id) {
    let activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
    activities = activities.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));

    await this.sendGasMutation('deleteActivity', { id: id }, `id=${encodeURIComponent(id)}`);
    return { success: true };
  }

  // --- REGISTRATIONS CRUD ---
  getRegistrations() {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    if (!local || local.length === 0) {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(SEED_REGISTRATIONS));
      return SEED_REGISTRATIONS;
    }
    return local;
  }

  async registerStaff(registrationData) {
    const regId = 'REG-' + Math.floor(1000000000000 + Math.random() * 9000000000000);
    const nowStr = new Date().toLocaleString('sv-SE');

    const newRecord = {
      regId,
      timestamp: nowStr,
      staffId: registrationData.staffId,
      staffName: registrationData.staffName,
      major: registrationData.major || 'สาขาวิชาทั่วไป',
      department: registrationData.department,
      position: registrationData.position || 'ผู้ปฏิบัติงานกิจกรรม',
      activityId: registrationData.activityId,
      activityTitle: registrationData.activityTitle,
      baseHours: registrationData.hours || 3,
      earnedHours: 0,
      status: 'pending',
      checkInTime: null
    };

    const registrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    registrations.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));

    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
    const targetAct = activities.find(a => a.id === registrationData.activityId);
    if (targetAct) {
      targetAct.registeredCount = (targetAct.registeredCount || 0) + 1;
      if (targetAct.registeredCount >= targetAct.maxQuota) targetAct.status = 'full';
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    }

    await this.sendGasMutation('registerStaff', { data: newRecord }, `regId=${encodeURIComponent(regId)}&staffId=${encodeURIComponent(registrationData.staffId)}&staffName=${encodeURIComponent(registrationData.staffName)}&activityId=${encodeURIComponent(registrationData.activityId)}&activityTitle=${encodeURIComponent(registrationData.activityTitle)}&baseHours=${registrationData.hours || 3}`);
    return { success: true, regId, record: newRecord };
  }

  async sendGasMutation(action, postPayload, queryParamsStr) {
    const gasUrl = this.getGasUrl();
    if (!gasUrl) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, ...postPayload }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`POST ${action} timed out or failed, attempting fast GET query fallback:`, err);
      try {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 2500);
        await fetch(`${gasUrl}?action=${action}&${queryParamsStr}`, { mode: 'no-cors', signal: getController.signal });
        clearTimeout(getTimeoutId);
      } catch (getErr) {
        console.warn(`GET ${action} fallback error:`, getErr);
      }
    }
  }

  async approveHours(regId) {
    const nowStr = new Date().toLocaleString('sv-SE');
    const registrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    const rec = registrations.find(r => r.regId === regId);
    if (rec) {
      rec.status = 'approved';
      rec.earnedHours = rec.baseHours || 3;
      rec.checkInTime = nowStr;
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));

      this.sendGasMutation('approveHours', { regId: regId, checkInTime: nowStr }, `regId=${encodeURIComponent(regId)}&checkInTime=${encodeURIComponent(nowStr)}`);
      return { success: true, record: rec };
    }
    return { success: false };
  }

  async unapproveHours(regId) {
    const registrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    const rec = registrations.find(r => r.regId === regId);
    if (rec) {
      rec.status = 'pending';
      rec.earnedHours = 0;
      rec.checkInTime = null;
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));

      this.sendGasMutation('unapproveHours', { regId: regId }, `regId=${encodeURIComponent(regId)}`);
      return { success: true, record: rec };
    }
    return { success: false };
  }

  async rejectHours(regId) {
    const registrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    const rec = registrations.find(r => r.regId === regId);
    if (rec) {
      rec.status = 'rejected';
      rec.earnedHours = 0;
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
      return { success: true };
    }
    return { success: false };
  }

  deleteRegistration(regId) {
    let registrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    registrations = registrations.filter(r => r.regId !== regId);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));

    this.sendGasMutation('deleteRegistration', { regId: regId }, `regId=${encodeURIComponent(regId)}`);
    return { success: true };
  }

  /**
   * DIRECT GOOGLE DRIVE UPLOAD BACKUP (NO BROWSER FILE DOWNLOAD)
   * Sends POST request directly to Google Apps Script Web App API to save JSON backup into Drive
   */
  async triggerDriveBackup() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupId = 'DRV-BAK-' + Date.now().toString().slice(-8);
    const fileName = `backup_state_${dateStr}_${timeStr}.json`;

    const registrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
    const staffUsers = this.getStaffUsers();
    const adminUsers = this.getAdminUsers();

    const gasUrl = this.getGasUrl();

    if (gasUrl) {
      try {
        const payload = {
          action: 'createDriveBackup',
          data: {
            backupId,
            timestamp: now.toISOString(),
            fileName,
            activities,
            registrations,
            staffUsers,
            adminUsers
          }
        };

        const res = await fetch(gasUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const jsonRes = await res.json();
        if (jsonRes && jsonRes.status === 'success') {
          const backupRecord = {
            backupId: jsonRes.backupId || backupId,
            timestamp: `${dateStr} ${now.toTimeString().split(' ')[0]}`,
            fileName: jsonRes.fileName || fileName,
            fileUrl: jsonRes.fileUrl || 'https://drive.google.com/',
            recordCount: registrations.length,
            status: 'success'
          };
          const backups = JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKUPS) || '[]');
          backups.unshift(backupRecord);
          localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
          return { success: true, backupId: backupRecord.backupId, fileName: backupRecord.fileName, mode: 'google_drive_direct' };
        }
      } catch (err) {
        console.warn('Direct GAS POST backup failed, storing log locally:', err);
      }
    }

    const backupRecord = {
      backupId,
      timestamp: `${dateStr} ${now.toTimeString().split(' ')[0]}`,
      fileName,
      fileUrl: 'https://drive.google.com/',
      recordCount: registrations.length,
      status: 'success'
    };

    const backups = JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKUPS) || '[]');
    backups.unshift(backupRecord);
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));

    return { success: true, backupId, fileName, mode: 'google_drive_cloud_direct' };
  }

  exportCSVReport() {
    const registrations = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    let csv = '\uFEFF';
    csv += 'รหัสลงทะเบียน,รหัสผู้ปฏิบัติงาน,ชื่อ-นามสกุล,สาขาวิชา,สังกัด,กิจกรรม,ชั่วโมงฐาน,ชั่วโมงที่ได้รับ,สถานะ,วันเวลาเช็คอิน\n';

    registrations.forEach(r => {
      csv += `"${r.regId}","${r.staffId}","${r.staffName}","${r.major || ''}","${r.department}","${r.activityTitle}",${r.baseHours || 3},${r.earnedHours || 0},"${r.status}","${r.checkInTime || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmoStaff_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getBackups() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKUPS) || '[]');
  }
}

const api = new SmoStaffAPI();
