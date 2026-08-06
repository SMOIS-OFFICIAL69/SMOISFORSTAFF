/**
 * ==============================================================================
 * SMO-STAFF ACTIVITY REGISTRATION & GOOGLE DRIVE BACKUP BACKEND (Code.gs)
 * ==============================================================================
 * Google Apps Script Backend for Google Sheets Database & Drive Auto-Backup Service
 * 
 * Auto-creates dedicated organized folder path in Google Drive:
 * Google Drive > SMOIS-WEB > KKU_FIS_StudentUnion_Backup
 * 
 * Generates exact files as required:
 * 1. latest_system_state.json (Overwritten with latest snapshot)
 * 2. backup_state_YYYY-MM-DD_HH-mm-ss.json (Historical timestamped backups)
 * 
 * Includes Concurrency LockService & Anti-Duplication Protection for Multi-User Access
 * 
 * Supported Sheets:
 * - Activities
 * - Registrations
 * - StaffUsers
 * - AdminUsers
 * - Backups
 */

const CONFIG = {
  PARENT_FOLDER_NAME: 'SMOIS-WEB',                     // โฟลเดอร์หลักใน Google Drive
  SUB_FOLDER_NAME: 'KKU_FIS_StudentUnion_Backup',     // โฟลเดอร์ย่อยสำหรับเก็บไฟล์สำรองข้อมูล
  DRIVE_FOLDER_ID: '',                                 // ปล่อยว่างไว้เพื่อให้ระบบสร้างโฟลเดอร์ให้อัตโนมัติ
  SHEET_ACTIVITIES: 'Activities',
  SHEET_REGISTRATIONS: 'Registrations',
  SHEET_STAFF: 'StaffUsers',
  SHEET_ADMIN: 'AdminUsers',
  SHEET_BACKUPS: 'Backups'
};

/**
 * --- AUTOMATED TIME-DRIVEN TRIGGER SETUP ---
 * เรียกใช้งานฟังก์ชันนี้ 1 ครั้งใน Apps Script Editor เพื่อตั้งค่าสำรองข้อมูลเข้า Google Drive อัตโนมัติทุกวัน
 */
function setupAutomatedDailyDriveBackupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'performGoogleDriveBackup') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('performGoogleDriveBackup')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();

  Logger.log('ตั้งค่าสำรองข้อมูลอัตโนมัติเข้า Google Drive สำเร็จแล้ว (รันทุกวัน เวลา 01:00 น.)');
}

/**
 * --- GET API ENDPOINTS (READS & FALLBACK MUTATIONS WITH CONCURRENCY LOCK) ---
 */
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : 'getActivities';
  let responseData = { status: 'error', message: 'Invalid Action' };

  // Unified Ultra-Fast Read Endpoint (Batch processes all 5 tables in 1 memory pass)
  if (action === 'getAllData' || !action) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: getAllDataFast() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Individual Read Endpoints
  if (action === 'getActivities') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: getActivitiesData() }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'getRegistrations') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: getRegistrationsData() }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'getStaffUsers') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: getStaffUsersData() }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'getAdminUsers') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: getAdminUsersData() }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'getBackups') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: getBackupsData() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Mutation operations require Concurrency LockService
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10 seconds for other concurrent requests
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ระบบกำลังประมวลผลคำสั่งอื่นอยู่ กรุณาลองใหม่อีกครั้ง' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (action === 'approveHours') {
      const regId = e.parameter.regId;
      const checkInTime = e.parameter.checkInTime || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      const result = approveHoursRecord(regId, checkInTime);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'unapproveHours') {
      const regId = e.parameter.regId;
      const result = unapproveHoursRecord(regId);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'deleteRegistration') {
      const regId = e.parameter.regId;
      const result = deleteRegistrationRecord(regId);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'deleteActivity') {
      const id = e.parameter.id;
      const result = deleteActivityRecord(id);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'deleteStaffUser') {
      const studentId = e.parameter.studentId;
      const result = deleteStaffUserRecord(studentId);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'deleteAdminUser') {
      const username = e.parameter.username;
      const result = deleteAdminUserRecord(username);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    }
  } catch (err) {
    responseData = { status: 'error', message: err.toString() };
  } finally {
    lock.releaseLock();
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * --- POST API ENDPOINTS (MUTATIONS, APPROVALS & DELETIONS WITH CONCURRENCY LOCK) ---
 */
function doPost(e) {
  let responseData = { status: 'error', message: 'Invalid Request' };

  // Concurrency Protection via ScriptLock
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ระบบกำลังประมวลผลคำสั่งอื่นอยู่ กรุณาลองใหม่อีกครั้ง' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        postData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    const action = postData.action;

    if (action === 'registerStaff') {
      const result = saveRegistration(postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'approveHours') {
      const result = approveHoursRecord(postData.regId, postData.checkInTime);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'unapproveHours') {
      const result = unapproveHoursRecord(postData.regId);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'createActivity') {
      const result = createActivityRecord(postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'updateActivity' || action === 'saveActivity') {
      const result = saveActivityRecord(postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'createStaffUser' || action === 'updateStaffUser' || action === 'saveStaffUser') {
      const result = saveStaffUser(postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'createAdminUser' || action === 'updateAdminUser' || action === 'saveAdminUser') {
      const result = saveAdminUser(postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'deleteActivity') {
      const result = deleteActivityRecord(postData.id || postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'deleteStaffUser') {
      const result = deleteStaffUserRecord(postData.studentId || postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'deleteAdminUser') {
      const result = deleteAdminUserRecord(postData.username || postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'deleteRegistration') {
      const result = deleteRegistrationRecord(postData.regId || postData.data);
      performGoogleDriveBackup();
      responseData = { status: 'success', result: result };
    } else if (action === 'createDriveBackup') {
      const backupResult = performGoogleDriveBackup(postData.data);
      responseData = { 
        status: 'success', 
        backupId: backupResult.backupId, 
        fileName: backupResult.fileName,
        fileUrl: backupResult.fileUrl 
      };
    }
  } catch (err) {
    responseData = { status: 'error', message: err.toString() };
  } finally {
    clearDataCache();
    lock.releaseLock();
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * --- GOOGLE DRIVE BACKUP ENGINE ---
 * Auto-creates dedicated organized folder path in Drive:
 * Google Drive > SMOIS-WEB > KKU_FIS_StudentUnion_Backup
 */
function performGoogleDriveBackup(clientPayload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activities = (clientPayload && clientPayload.activities) || getActivitiesData();
  const registrations = (clientPayload && clientPayload.registrations) || getRegistrationsData();
  const staffUsers = (clientPayload && clientPayload.staffUsers) || getStaffUsersData();
  const adminUsers = (clientPayload && clientPayload.adminUsers) || getAdminUsersData();

  const now = new Date();
  const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
  const backupId = 'DRV-BAK-' + Date.now().toString().slice(-8);

  const timestampedFileName = `backup_state_${timeStr}.json`;
  const latestFileName = 'latest_system_state.json';

  const backupContent = {
    backupId: backupId,
    timestamp: now.toISOString(),
    system: 'Smo-Staff Activity Registration System (KKU_FIS_StudentUnion)',
    spreadsheetId: ss.getId(),
    summary: {
      totalActivities: activities.length,
      totalRegistrations: registrations.length,
      totalStaffUsers: staffUsers.length,
      totalAdminUsers: adminUsers.length
    },
    data: {
      activities,
      registrations,
      staffUsers,
      adminUsers
    }
  };

  const jsonString = JSON.stringify(backupContent, null, 2);
  let fileUrl = '#';

  try {
    let folder = getTargetDriveFolder();

    // 1. Create / Overwrite latest_system_state.json
    const existingLatestFiles = folder.getFilesByName(latestFileName);
    if (existingLatestFiles.hasNext()) {
      const latestFile = existingLatestFiles.next();
      latestFile.setContent(jsonString);
    } else {
      folder.createFile(latestFileName, jsonString, MimeType.PLAIN_TEXT);
    }

    // 2. Create Historical Timestamped Backup File backup_state_YYYY-MM-DD_HH-mm-ss.json
    const timeFile = folder.createFile(timestampedFileName, jsonString, MimeType.PLAIN_TEXT);
    fileUrl = timeFile.getUrl();

  } catch (e) {
    Logger.log('Drive Backup Error: ' + e.toString());
  }

  // Record log in Backups Sheet
  const backupSheet = getOrCreateSheet(CONFIG.SHEET_BACKUPS, ['BackupID', 'Timestamp', 'FileName', 'FileUrl', 'RecordCount', 'Status']);
  backupSheet.appendRow([backupId, timeStr, timestampedFileName, fileUrl, registrations.length, 'success']);

  return { backupId, fileName: timestampedFileName, fileUrl };
}

/**
 * Get or Create Dedicated Backup Folder Structure:
 * Google Drive > SMOIS-WEB > KKU_FIS_StudentUnion_Backup
 */
function getTargetDriveFolder() {
  if (CONFIG.DRIVE_FOLDER_ID && CONFIG.DRIVE_FOLDER_ID.trim() !== '') {
    try {
      return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID.trim());
    } catch (e) {
      Logger.log('Folder ID search error: ' + e.toString());
    }
  }

  // 1. Parent Folder: "SMOIS-WEB"
  const parentName = CONFIG.PARENT_FOLDER_NAME || 'SMOIS-WEB';
  let parentFolder;
  const parentFolders = DriveApp.getFoldersByName(parentName);
  if (parentFolders.hasNext()) {
    parentFolder = parentFolders.next();
  } else {
    parentFolder = DriveApp.createFolder(parentName);
  }

  // 2. Subfolder: "KKU_FIS_StudentUnion_Backup" inside "SMOIS-WEB"
  const subFolderName = CONFIG.SUB_FOLDER_NAME || 'KKU_FIS_StudentUnion_Backup';
  const subFolders = parentFolder.getFoldersByName(subFolderName);
  if (subFolders.hasNext()) {
    return subFolders.next();
  } else {
    return parentFolder.createFolder(subFolderName);
  }
}

/**
 * --- DATA READ OPERATIONS ---
 */
function clearDataCache() {
  try {
    CacheService.getScriptCache().remove('ALL_DATA_FAST');
  } catch (e) {}
}

function getAllDataFast() {
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get('ALL_DATA_FAST');
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {}
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const map = {};
  for (let i = 0; i < sheets.length; i++) {
    map[sheets[i].getName()] = sheets[i];
  }
  
  const actSheet = map[CONFIG.SHEET_ACTIVITIES] || getOrCreateSheet(CONFIG.SHEET_ACTIVITIES, ['ID', 'Title', 'Category', 'Description', 'Date', 'Time', 'Location', 'MaxQuota', 'RegisteredCount', 'Hours', 'Status', 'Banner']);
  const regSheet = map[CONFIG.SHEET_REGISTRATIONS] || getOrCreateSheet(CONFIG.SHEET_REGISTRATIONS, ['RegID', 'Timestamp', 'StaffID', 'StaffName', 'Major', 'Department', 'Position', 'ActivityID', 'ActivityTitle', 'BaseHours', 'EarnedHours', 'Status', 'CheckInTime']);
  const staffSheet = map[CONFIG.SHEET_STAFF] || getOrCreateSheet(CONFIG.SHEET_STAFF, ['StudentID', 'FullName', 'Major', 'Year', 'Department', 'Position', 'TargetHours', 'Avatar']);
  const adminSheet = map[CONFIG.SHEET_ADMIN] || getOrCreateSheet(CONFIG.SHEET_ADMIN, ['Username', 'Password', 'FullName', 'Position', 'Role', 'Avatar']);
  const backupSheet = map[CONFIG.SHEET_BACKUPS] || getOrCreateSheet(CONFIG.SHEET_BACKUPS, ['BackupID', 'Timestamp', 'FileName', 'FileUrl', 'RecordCount', 'Status']);

  const actRows = actSheet ? actSheet.getDataRange().getValues() : [];
  const regRows = regSheet ? regSheet.getDataRange().getValues() : [];
  const staffRows = staffSheet ? staffSheet.getDataRange().getValues() : [];
  const adminRows = adminSheet ? adminSheet.getDataRange().getValues() : [];
  const backupRows = backupSheet ? backupSheet.getDataRange().getValues() : [];

  const tz = Session.getScriptTimeZone();

  // 1. Process Registrations & count map
  const countMap = {};
  const registrations = [];
  if (regRows.length > 1) {
    for (let r = 1; r < regRows.length; r++) {
      const row = regRows[r];
      const actId = String(row[7]);
      countMap[actId] = (countMap[actId] || 0) + 1;
      registrations.push({
        regId: String(row[0]),
        timestamp: row[1] instanceof Date ? Utilities.formatDate(row[1], tz, 'yyyy-MM-dd HH:mm:ss') : String(row[1]),
        staffId: String(row[2]),
        staffName: String(row[3]),
        major: String(row[4]),
        department: String(row[5]),
        position: String(row[6]),
        activityId: String(row[7]),
        activityTitle: String(row[8]),
        baseHours: Number(row[9] || 3),
        earnedHours: Number(row[10] || 0),
        status: String(row[11]),
        checkInTime: row[12] ? (row[12] instanceof Date ? Utilities.formatDate(row[12], tz, 'yyyy-MM-dd HH:mm:ss') : String(row[12])) : null
      });
    }
  }

  // 2. Process Activities
  const activities = [];
  if (actRows.length > 1) {
    for (let i = 1; i < actRows.length; i++) {
      const row = actRows[i];
      const actId = String(row[0]);
      activities.push({
        id: actId,
        title: String(row[1]),
        category: String(row[2]),
        description: String(row[3]),
        date: row[4] instanceof Date ? Utilities.formatDate(row[4], tz, 'yyyy-MM-dd') : String(row[4]),
        time: String(row[5]),
        location: String(row[6]),
        maxQuota: Number(row[7]),
        registeredCount: countMap[actId] !== undefined ? countMap[actId] : Number(row[8] || 0),
        hours: Number(row[9] || 3),
        status: String(row[10]),
        banner: String(row[11])
      });
    }
  }

  // 3. Process Staff Users
  const staffUsers = [];
  if (staffRows.length > 1) {
    for (let i = 1; i < staffRows.length; i++) {
      const row = staffRows[i];
      staffUsers.push({
        studentId: String(row[0]),
        fullName: String(row[1]),
        major: String(row[2]),
        year: String(row[3]),
        department: String(row[4]),
        position: String(row[5]),
        targetHours: Number(row[6] || 200),
        avatar: String(row[7] || '')
      });
    }
  }

  // 4. Process Admin Users
  const adminUsers = [];
  if (adminRows.length > 1) {
    for (let i = 1; i < adminRows.length; i++) {
      const row = adminRows[i];
      adminUsers.push({
        username: String(row[0]),
        password: String(row[1]),
        fullName: String(row[2]),
        position: String(row[3]),
        role: String(row[4] || 'Admin'),
        avatar: String(row[5] || '')
      });
    }
  }

  // 5. Process Backups
  const backups = [];
  if (backupRows.length > 1) {
    for (let i = 1; i < backupRows.length; i++) {
      const row = backupRows[i];
      backups.push({
        backupId: String(row[0]),
        timestamp: row[1] instanceof Date ? Utilities.formatDate(row[1], tz, 'yyyy-MM-dd HH:mm:ss') : String(row[1]),
        fileName: String(row[2]),
        fileUrl: String(row[3]),
        recordCount: Number(row[4]),
        status: String(row[5])
      });
    }
  }

  const result = { activities, registrations, staffUsers, adminUsers, backups };
  try {
    cache.put('ALL_DATA_FAST', JSON.stringify(result), 30);
  } catch (e) {}

  return result;
}

function getActivitiesData() {
  const sheet = getOrCreateSheet(CONFIG.SHEET_ACTIVITIES, ['ID', 'Title', 'Category', 'Description', 'Date', 'Time', 'Location', 'MaxQuota', 'RegisteredCount', 'Hours', 'Status', 'Banner']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  // Calculate live registration counts from Registrations sheet
  const regSheet = getOrCreateSheet(CONFIG.SHEET_REGISTRATIONS, ['RegID', 'Timestamp', 'StaffID', 'StaffName', 'Major', 'Department', 'Position', 'ActivityID', 'ActivityTitle', 'BaseHours', 'EarnedHours', 'Status', 'CheckInTime']);
  const regRows = regSheet.getDataRange().getValues();
  const countMap = {};
  if (regRows.length > 1) {
    for (let r = 1; r < regRows.length; r++) {
      const actId = String(regRows[r][7]);
      countMap[actId] = (countMap[actId] || 0) + 1;
    }
  }

  return rows.slice(1).map(row => {
    const actId = String(row[0]);
    const liveCount = countMap[actId] !== undefined ? countMap[actId] : Number(row[8] || 0);
    return {
      id: actId,
      title: String(row[1]),
      category: String(row[2]),
      description: String(row[3]),
      date: row[4] instanceof Date ? Utilities.formatDate(row[4], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(row[4]),
      time: String(row[5]),
      location: String(row[6]),
      maxQuota: Number(row[7]),
      registeredCount: liveCount,
      hours: Number(row[9] || 3),
      status: String(row[10]),
      banner: String(row[11])
    };
  });
}

function getRegistrationsData() {
  const sheet = getOrCreateSheet(CONFIG.SHEET_REGISTRATIONS, ['RegID', 'Timestamp', 'StaffID', 'StaffName', 'Major', 'Department', 'Position', 'ActivityID', 'ActivityTitle', 'BaseHours', 'EarnedHours', 'Status', 'CheckInTime']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  return rows.slice(1).map(row => ({
    regId: String(row[0]),
    timestamp: row[1] instanceof Date ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : String(row[1]),
    staffId: String(row[2]),
    staffName: String(row[3]),
    major: String(row[4]),
    department: String(row[5]),
    position: String(row[6]),
    activityId: String(row[7]),
    activityTitle: String(row[8]),
    baseHours: Number(row[9] || 3),
    earnedHours: Number(row[10] || 0),
    status: String(row[11]),
    checkInTime: row[12] ? (row[12] instanceof Date ? Utilities.formatDate(row[12], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : String(row[12])) : null
  }));
}

function getStaffUsersData() {
  const sheet = getOrCreateSheet(CONFIG.SHEET_STAFF, ['StudentID', 'FullName', 'Major', 'Year', 'Department', 'Position', 'TargetHours', 'Avatar']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  return rows.slice(1).map(row => ({
    studentId: String(row[0]),
    fullName: String(row[1]),
    major: String(row[2]),
    year: String(row[3]),
    department: String(row[4]),
    position: String(row[5]),
    targetHours: Number(row[6] || 200),
    avatar: String(row[7] || '')
  }));
}

function getAdminUsersData() {
  const sheet = getOrCreateSheet(CONFIG.SHEET_ADMIN, ['Username', 'Password', 'FullName', 'Position', 'Role', 'Avatar']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  return rows.slice(1).map(row => ({
    username: String(row[0]),
    password: String(row[1]),
    fullName: String(row[2]),
    position: String(row[3]),
    role: String(row[4] || 'Admin'),
    avatar: String(row[5] || '')
  }));
}

function getBackupsData() {
  const sheet = getOrCreateSheet(CONFIG.SHEET_BACKUPS, ['BackupID', 'Timestamp', 'FileName', 'FileUrl', 'RecordCount', 'Status']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  return rows.slice(1).map(row => ({
    backupId: String(row[0]),
    timestamp: row[1] instanceof Date ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : String(row[1]),
    fileName: String(row[2]),
    fileUrl: String(row[3]),
    recordCount: Number(row[4]),
    status: String(row[5])
  }));
}

/**
 * --- DATA SAVE & APPROVAL OPERATIONS WITH ANTI-DUPLICATION & CONCURRENCY CHECKS ---
 */
function saveRegistration(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_REGISTRATIONS, ['RegID', 'Timestamp', 'StaffID', 'StaffName', 'Major', 'Department', 'Position', 'ActivityID', 'ActivityTitle', 'BaseHours', 'EarnedHours', 'Status', 'CheckInTime']);
  const rows = sheet.getDataRange().getValues();
  
  // Anti-duplication check: prevent same staff registering same activity twice
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === String(data.staffId) && String(rows[i][7]) === String(data.activityId)) {
      return false;
    }
  }

  sheet.appendRow([data.regId, data.timestamp, data.staffId, data.staffName, data.major, data.department, data.position, data.activityId, data.activityTitle, data.baseHours || 3, 0, 'pending', '']);
  return true;
}

function approveHoursRecord(regId, checkInTime) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_REGISTRATIONS, ['RegID', 'Timestamp', 'StaffID', 'StaffName', 'Major', 'Department', 'Position', 'ActivityID', 'ActivityTitle', 'BaseHours', 'EarnedHours', 'Status', 'CheckInTime']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(regId)) {
      const baseHrs = Number(rows[i][9] || 3);
      sheet.getRange(i + 1, 11).setValue(baseHrs);
      sheet.getRange(i + 1, 12).setValue('approved');
      sheet.getRange(i + 1, 13).setValue(checkInTime || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'));
      return true;
    }
  }
  return false;
}

function unapproveHoursRecord(regId) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_REGISTRATIONS, ['RegID', 'Timestamp', 'StaffID', 'StaffName', 'Major', 'Department', 'Position', 'ActivityID', 'ActivityTitle', 'BaseHours', 'EarnedHours', 'Status', 'CheckInTime']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(regId)) {
      sheet.getRange(i + 1, 11).setValue(0);          // EarnedHours = 0
      sheet.getRange(i + 1, 12).setValue('pending');  // Status = pending
      sheet.getRange(i + 1, 13).setValue('');         // CheckInTime = empty
      return true;
    }
  }
  return false;
}

/**
 * Deduplicate any existing duplicate activity IDs in Google Sheet (Self-healing database mechanism)
 */
function fixDuplicateActivityIdsInSheet() {
  const sheet = getOrCreateSheet(CONFIG.SHEET_ACTIVITIES, ['ID', 'Title', 'Category', 'Description', 'Date', 'Time', 'Location', 'MaxQuota', 'RegisteredCount', 'Hours', 'Status', 'Banner']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return;

  const seenIds = new Set();
  let maxNum = 0;

  for (let i = 1; i < rows.length; i++) {
    const idStr = String(rows[i][0] || '').trim();
    const match = idStr.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  const year = new Date().getFullYear();
  let counter = maxNum + 1;

  for (let i = 1; i < rows.length; i++) {
    const rawId = String(rows[i][0] || '').trim();
    if (!rawId || seenIds.has(rawId)) {
      let freshId = '';
      do {
        freshId = 'ACT-' + year + '-' + String(counter).padStart(3, '0');
        counter++;
      } while (seenIds.has(freshId));

      sheet.getRange(i + 1, 1).setValue(freshId);
      seenIds.add(freshId);
    } else {
      seenIds.add(rawId);
    }
  }
}

function createActivityRecord(data) {
  if (!data) data = {};
  fixDuplicateActivityIdsInSheet();

  const sheet = getOrCreateSheet(CONFIG.SHEET_ACTIVITIES, ['ID', 'Title', 'Category', 'Description', 'Date', 'Time', 'Location', 'MaxQuota', 'RegisteredCount', 'Hours', 'Status', 'Banner']);
  const rows = sheet.getDataRange().getValues();

  const existingIds = new Set();
  let maxNum = 0;
  for (let i = 1; i < rows.length; i++) {
    const existingId = String(rows[i][0] || '').trim();
    if (existingId) existingIds.add(existingId);
    const match = existingId.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  const year = new Date().getFullYear();
  let finalId = data.id ? String(data.id).trim() : '';

  // GUARANTEE uniqueness: if missing or already exists in sheet, generate fresh ID
  if (!finalId || existingIds.has(finalId)) {
    let counter = maxNum + 1;
    do {
      finalId = 'ACT-' + year + '-' + String(counter).padStart(3, '0');
      counter++;
    } while (existingIds.has(finalId));
    data.id = finalId;
  }

  sheet.appendRow([
    data.id,
    data.title || '',
    data.category || 'กิจกรรม',
    data.description || '',
    data.date || '',
    data.time || '',
    data.location || '',
    Number(data.maxQuota || 0),
    0,
    Number(data.hours || 3),
    data.status || 'open',
    data.banner || ''
  ]);
  return { success: true, id: data.id };
}

function saveActivityRecord(data) {
  if (!data) return false;
  if (!data.id || String(data.id).trim() === '') {
    return createActivityRecord(data);
  }

  fixDuplicateActivityIdsInSheet();

  const sheet = getOrCreateSheet(CONFIG.SHEET_ACTIVITIES, ['ID', 'Title', 'Category', 'Description', 'Date', 'Time', 'Location', 'MaxQuota', 'RegisteredCount', 'Hours', 'Status', 'Banner']);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) {
      if (data.title !== undefined) sheet.getRange(i + 1, 2).setValue(data.title);
      if (data.category !== undefined) sheet.getRange(i + 1, 3).setValue(data.category || 'กิจกรรม');
      if (data.description !== undefined) sheet.getRange(i + 1, 4).setValue(data.description);
      if (data.date !== undefined) sheet.getRange(i + 1, 5).setValue(data.date);
      if (data.time !== undefined) sheet.getRange(i + 1, 6).setValue(data.time);
      if (data.location !== undefined) sheet.getRange(i + 1, 7).setValue(data.location);
      if (data.maxQuota !== undefined) sheet.getRange(i + 1, 8).setValue(Number(data.maxQuota));
      if (data.hours !== undefined) sheet.getRange(i + 1, 10).setValue(Number(data.hours));
      if (data.status !== undefined) sheet.getRange(i + 1, 11).setValue(data.status);
      if (data.banner !== undefined) sheet.getRange(i + 1, 12).setValue(data.banner);
      return { success: true, id: data.id };
    }
  }

  return createActivityRecord(data);
}

function saveActivity(data) {
  return saveActivityRecord(data);
}

function saveStaffUser(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_STAFF, ['StudentID', 'FullName', 'Major', 'Year', 'Department', 'Position', 'TargetHours', 'Avatar']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.studentId)) {
      sheet.getRange(i + 1, 2).setValue(data.fullName);
      sheet.getRange(i + 1, 3).setValue(data.major);
      sheet.getRange(i + 1, 4).setValue(data.year);
      sheet.getRange(i + 1, 5).setValue(data.department);
      sheet.getRange(i + 1, 6).setValue(data.position);
      sheet.getRange(i + 1, 7).setValue(Number(data.targetHours || 200));
      if (data.avatar !== undefined && data.avatar !== null && data.avatar !== '') {
        sheet.getRange(i + 1, 8).setValue(data.avatar);
      }
      return true;
    }
  }
  sheet.appendRow([data.studentId, data.fullName, data.major, data.year, data.department, data.position, Number(data.targetHours || 200), data.avatar || '']);
  return true;
}

function saveAdminUser(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_ADMIN, ['Username', 'Password', 'FullName', 'Position', 'Role', 'Avatar']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.username)) {
      if (data.password) sheet.getRange(i + 1, 2).setValue(data.password);
      sheet.getRange(i + 1, 3).setValue(data.fullName);
      sheet.getRange(i + 1, 4).setValue(data.position);
      sheet.getRange(i + 1, 5).setValue(data.role || 'Admin');
      if (data.avatar !== undefined && data.avatar !== null && data.avatar !== '') {
        sheet.getRange(i + 1, 6).setValue(data.avatar);
      }
      return true;
    }
  }
  sheet.appendRow([data.username, data.password, data.fullName, data.position, data.role || 'Admin', data.avatar || '']);
  return true;
}

/**
 * --- DATA AUTOMATED DELETE OPERATIONS FROM GOOGLE SHEETS ---
 */
function deleteActivityRecord(id) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_ACTIVITIES, ['ID', 'Title', 'Category', 'Description', 'Date', 'Time', 'Location', 'MaxQuota', 'RegisteredCount', 'Hours', 'Status', 'Banner']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function deleteStaffUserRecord(studentId) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_STAFF, ['StudentID', 'FullName', 'Major', 'Year', 'Department', 'Position', 'TargetHours']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(studentId)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function deleteAdminUserRecord(username) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_ADMIN, ['Username', 'Password', 'FullName', 'Position', 'Role']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(username)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function deleteRegistrationRecord(regId) {
  const sheet = getOrCreateSheet(CONFIG.SHEET_REGISTRATIONS, ['RegID', 'Timestamp', 'StaffID', 'StaffName', 'Major', 'Department', 'Position', 'ActivityID', 'ActivityTitle', 'BaseHours', 'EarnedHours', 'Status', 'CheckInTime']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(regId)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/**
 * --- HELPER: GET OR CREATE SHEET WITH STYLED HEADERS ---
 */
function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
  }
  return sheet;
}
