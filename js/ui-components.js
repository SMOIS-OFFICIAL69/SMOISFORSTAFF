/* ==========================================================================
   Smo-Staff: UI Components & Template Renderers
   Generates dynamic DOM elements for Activity Cards, Summary Cards, Tables & Modals
   ========================================================================== */

const UI = {
  // Category colors map for badges & banners
  categoryColors: {
    'งานอบรม/สัมมนา': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    'งานจิตอาสา': { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    'งานบริการสังคม': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    'งานสนับสนุนองค์กร': { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' }
  },

  getCategoryStyle(categoryName) {
    if (this.categoryColors[categoryName]) {
      return this.categoryColors[categoryName];
    }
    return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
  },

  // Helper to format Thai Date
  formatThaiDate(dateString) {
    if (!dateString) return '-';
    try {
      const str = String(dateString).split('T')[0].trim();
      const parts = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (parts) {
        const y = parseInt(parts[1], 10);
        const m = parseInt(parts[2], 10) - 1;
        const d = parseInt(parts[3], 10);
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const thYear = y > 2400 ? y : y + 543;
        return `${d} ${months[m]} ${thYear}`;
      }

      const date = new Date(str.replace(/-/g, '/'));
      if (!isNaN(date.getTime())) {
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const thYear = date.getFullYear() > 2400 ? date.getFullYear() : date.getFullYear() + 543;
        return `${date.getDate()} ${months[date.getMonth()]} ${thYear}`;
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  },

  // Toast Notification System
  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'danger' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-weight:bold; font-size:1.1rem;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // --------------------------------------------------------------------------
  // 1. Render Activity Card
  // --------------------------------------------------------------------------
  renderActivityCard(activity, currentWorker, isUserRegistered) {
    const isFull = activity.registeredCount >= activity.maxCapacity;
    const percentFilled = Math.min(100, Math.round((activity.registeredCount / activity.maxCapacity) * 100));

    let statusBadgeHtml = '';
    if (activity.status === 'completed') {
      statusBadgeHtml = `<span class="status-badge completed">กิจกรรมสิ้นสุดแล้ว</span>`;
    } else if (isUserRegistered) {
      statusBadgeHtml = `<span class="status-badge registered">ลงทะเบียนแล้ว</span>`;
    } else if (isFull || activity.status === 'full') {
      statusBadgeHtml = `<span class="status-badge full">ที่นั่งเต็ม</span>`;
    } else {
      statusBadgeHtml = `<span class="status-badge open">เปิดรับสมัคร</span>`;
    }

    let actionButtonHtml = '';
    if (activity.status === 'completed') {
      actionButtonHtml = `<button class="btn btn-outline btn-disabled" disabled>สิ้นสุดกิจกรรม</button>`;
    } else if (isUserRegistered) {
      actionButtonHtml = `<button class="btn btn-danger btn-sm cancel-reg-btn" data-act-id="${activity.id}">ยกเลิกการลงทะเบียน</button>`;
    } else if (isFull || activity.status === 'full') {
      actionButtonHtml = `<button class="btn btn-outline btn-disabled" disabled>ที่นั่งเต็มแล้ว</button>`;
    } else {
      actionButtonHtml = `<button class="btn btn-primary register-btn" data-act-id="${activity.id}">ลงทะเบียนเข้าร่วม</button>`;
    }

    const card = document.createElement('div');
    card.className = 'activity-card';
    card.innerHTML = `
      <div class="card-banner previewable-image" data-act-id="${activity.id}" data-img-src="${activity.banner}" data-img-caption="${activity.title}" style="background-image: url('${activity.banner}'); cursor:pointer;" title="คลิกเพื่อดูภาพและรายละเอียดกิจกรรม">
        <div class="card-banner-overlay">
          <span class="category-tag">${activity.category}</span>
          <span class="hours-badge">${activity.hours} ชม.กิจกรรม</span>
        </div>
      </div>
      <div class="card-body">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          ${statusBadgeHtml}
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">รหัส: ${activity.id}</span>
        </div>
        <h3 class="card-title previewable-image" data-act-id="${activity.id}" style="cursor:pointer;" title="คลิกเพื่อดูรายละเอียด">${activity.title}</h3>
        <p class="card-desc" title="${activity.description}">${activity.description}</p>
        
        <div class="card-meta">
          <div class="meta-item">
            <span>${this.formatThaiDate(activity.date)} | ${activity.time}</span>
          </div>
          <div class="meta-item">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${activity.location}</span>
          </div>
        </div>

        <div class="capacity-wrapper">
          <div class="capacity-header">
            <span>จำนวนผู้ลงทะเบียน</span>
            <span><strong>${activity.registeredCount}</strong> / ${activity.maxCapacity} คน</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${isFull ? 'full' : ''}" style="width: ${percentFilled}%"></div>
          </div>
        </div>

        <div class="card-footer">
          <button class="btn btn-ghost btn-sm view-details-btn" data-act-id="${activity.id}">🔍 ดูรายละเอียด</button>
          ${actionButtonHtml}
        </div>
      </div>
    `;

    return card;
  },

  // --------------------------------------------------------------------------
  // 2. Render Individual Summary Dashboard View
  // --------------------------------------------------------------------------
  renderIndividualSummary(summaryContainer, summaryData) {
    if (!summaryData) return;

    const { worker, completedHours, pendingHours, targetHours, progressPercent, history } = summaryData;

    let historyTableRows = '';
    if (history.length === 0) {
      historyTableRows = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">
            ยังไม่มีประวัติการลงทะเบียนกิจกรรม
          </td>
        </tr>
      `;
    } else {
      historyTableRows = history.map((item, idx) => {
        let statusBadge = '';
        if (item.status === 'completed') {
          statusBadge = `<span class="status-badge open">อนุมัติชั่วโมงแล้ว</span>`;
        } else if (item.status === 'registered') {
          statusBadge = `<span class="status-badge registered">รอเข้าร่วมกิจกรรม</span>`;
        } else if (item.status === 'absent') {
          statusBadge = `<span class="status-badge closed">ไม่ได้เข้าร่วม</span>`;
        }

        return `
          <tr>
            <td style="font-weight:600; text-align:center;">${idx + 1}</td>
            <td>
              <strong style="color:var(--text-main); display:block;">${item.activityTitle}</strong>
              <small style="color:var(--text-muted);">${item.category} | ${item.registrationId}</small>
            </td>
            <td>${this.formatThaiDate(item.date)}<br><small style="color:var(--text-muted);">${item.time}</small></td>
            <td style="text-align:center; font-weight:600; color:var(--text-muted);">${item.baseHours} ชม.</td>
            <td style="text-align:center;">
              <strong style="font-size:1.1rem; color:${item.status === 'completed' ? 'var(--success)' : 'var(--text-muted)'};">
                ${item.status === 'completed' ? `+${item.hoursGranted}` : '0'} ชม.
              </strong>
            </td>
            <td style="text-align:center;">${statusBadge}</td>
          </tr>
        `;
      }).join('');
    }

    summaryContainer.innerHTML = `
      <div class="summary-container">
        <!-- Top Metrics Cards Grid -->
        <div class="summary-metrics-grid">
          <div class="metric-card">
            <div class="metric-data">
              <h3>ชั่วโมงสะสมที่ได้แล้ว</h3>
              <div class="metric-number" style="color:var(--success);">${completedHours} <span style="font-size:1rem; font-weight:normal;">ชม.</span></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-data">
              <h3>เป้าหมายชั่วโมงกิจกรรม</h3>
              <div class="metric-number" style="color:var(--primary);">${targetHours} <span style="font-size:1rem; font-weight:normal;">ชม.</span></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-data">
              <h3>ชั่วโมงที่รออนุมัติ</h3>
              <div class="metric-number" style="color:var(--warning);">${pendingHours} <span style="font-size:1rem; font-weight:normal;">ชม.</span></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-data">
              <h3>กิจกรรมที่ลงทะเบียน</h3>
              <div class="metric-number" style="color:var(--admin-accent);">${history.length} <span style="font-size:1rem; font-weight:normal;">รายการ</span></div>
            </div>
          </div>
        </div>

        <!-- Progress Card -->
        <div class="hours-progress-card">
          <div class="progress-title-row">
            <div>
              <h3 style="font-size:1.15rem; font-weight:600;">ความก้าวหน้าการเก็บชั่วโมงกิจกรรม (Activity Hours Meter)</h3>
              <p style="font-size:0.85rem; color:var(--text-muted);">เป้าหมายปีงบประมาณ 2026: ${targetHours} ชั่วโมงกิจกรรม</p>
            </div>
            <span style="font-size:1.4rem; font-weight:700; font-family:var(--font-heading); color:var(--primary);">${progressPercent}%</span>
          </div>

          <div class="hours-progress-large">
            <div class="hours-progress-large-fill" style="width: ${progressPercent}%;"></div>
          </div>

          <div class="progress-labels-row">
            <span>สะสมแล้ว ${completedHours} / ${targetHours} ชั่วโมง</span>
            <span>${progressPercent >= 100 ? 'ผ่านเกณฑ์เป้าหมายเรียบร้อยแล้ว' : `ขาดอีก ${Math.max(0, targetHours - completedHours)} ชั่วโมง`}</span>
          </div>
        </div>

        <!-- Detailed History Table Card -->
        <div class="summary-table-section">
          <div class="section-header-bar">
            <div>
              <h3 style="font-size:1.1rem; font-weight:600;">ประวัติการลงทะเบียนและสะสมชั่วโมงกิจกรรมรายบุคคล</h3>
              <p style="font-size:0.85rem; color:var(--text-muted);">ผู้ปฏิบัติงาน: <strong>${worker.name}</strong> (${worker.id}) - ${worker.department}</p>
            </div>
            <button class="btn btn-outline" id="print-transcript-btn">
              พิมพ์/ส่งออกใบรวบรวมชั่วโมงกิจกรรม
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:50px; text-align:center;">#</th>
                  <th>ชื่อกิจกรรม / หมวดหมู่</th>
                  <th>วันเวลาจัดกิจกรรม</th>
                  <th style="text-align:center;">ชั่วโมงกิจกรรมฐาน</th>
                  <th style="text-align:center;">ชั่วโมงที่ได้รับ</th>
                  <th style="text-align:center;">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                ${historyTableRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 3. Render Admin Activity Management Table
  // --------------------------------------------------------------------------
  renderAdminActivityTable(tableBodyContainer, activities) {
    if (!activities || activities.length === 0) {
      tableBodyContainer.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 2rem; color:var(--text-muted);">
            ไม่พบกิจกรรมในระบบ
          </td>
        </tr>
      `;
      return;
    }

    tableBodyContainer.innerHTML = activities.map((act, idx) => {
      let statusBadge = '';
      if (act.status === 'open') statusBadge = `<span class="status-badge open">เปิดรับสมัคร</span>`;
      else if (act.status === 'full') statusBadge = `<span class="status-badge full">เต็มแล้ว</span>`;
      else statusBadge = `<span class="status-badge completed">เสร็จสิ้น</span>`;

      return `
        <tr class="draggable-row" draggable="true" data-index="${idx}" data-act-id="${act.id}">
          <td style="font-weight:600; text-align:center; vertical-align:middle; min-width:85px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
              <span class="drag-handle" title="ลากเพื่อเปลี่ยนลำดับกิจกรรม" style="cursor:grab; font-size:1.15rem; color:var(--text-muted); user-select:none;">⋮⋮</span>
              <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                <span>${idx + 1}</span>
                <div style="display:flex; gap:2px;">
                  <button type="button" class="btn-reorder btn-reorder-act-up" data-act-id="${act.id}" ${idx === 0 ? 'disabled style="opacity:0.25; cursor:not-allowed;"' : ''} title="เลื่อนลำดับกิจกรรมขึ้น">▲</button>
                  <button type="button" class="btn-reorder btn-reorder-act-down" data-act-id="${act.id}" ${idx === activities.length - 1 ? 'disabled style="opacity:0.25; cursor:not-allowed;"' : ''} title="เลื่อนลำดับกิจกรรมลง">▼</button>
                </div>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="${act.banner}" style="width:48px; height:48px; border-radius:var(--radius-md); object-fit:cover;" alt="banner" />
              <div>
                <strong style="color:var(--text-main); display:block;">${act.title}</strong>
                <small style="color:var(--text-muted);">${act.id} | ${act.category}</small>
              </div>
            </div>
          </td>
          <td>${this.formatThaiDate(act.date)}<br><small style="color:var(--text-muted);">${act.time}</small></td>
          <td style="text-align:center;"><span class="hours-badge" style="font-size:0.75rem;">${act.hours} ชม.</span></td>
          <td style="text-align:center;"><strong>${act.registeredCount}</strong> / ${act.maxCapacity} คน</td>
          <td style="text-align:center;">${statusBadge}</td>
          <td style="text-align:center;">
            <div style="display:flex; gap:6px; justify-content:center;">
              <button class="btn btn-outline btn-sm admin-manage-roster-btn" data-act-id="${act.id}" title="จัดการรายชื่อผู้เข้าร่วม">รายชื่อ (${act.registeredCount})</button>
              <button class="btn btn-ghost btn-sm admin-edit-act-btn" data-act-id="${act.id}" title="แก้ไขข้อมูลกิจกรรม">แก้ไข</button>
              <button class="btn btn-ghost btn-sm admin-delete-act-btn" data-act-id="${act.id}" style="color:var(--danger);" title="ลบกิจกรรม">ลบ</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // --------------------------------------------------------------------------
  // 4. Render Admin Worker Roster & Attendance Table
  // --------------------------------------------------------------------------
  renderAdminRosterTable(tableBodyContainer, workers) {
    if (!workers || workers.length === 0) {
      tableBodyContainer.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">
            ไม่พบรายชื่อผู้ปฏิบัติงานในระบบ
          </td>
        </tr>
      `;
      return;
    }

    tableBodyContainer.innerHTML = workers.map((w, idx) => {
      const summary = window.appStore.getWorkerSummary(w.id);
      const isTargetMet = summary.completedHours >= summary.targetHours;

      return `
        <tr class="draggable-row" draggable="true" data-index="${idx}" data-worker-id="${w.id}">
          <td style="font-weight:600; text-align:center; vertical-align:middle; min-width:85px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
              <span class="drag-handle" title="ลากเพื่อเปลี่ยนลำดับผู้ปฏิบัติงาน" style="cursor:grab; font-size:1.15rem; color:var(--text-muted); user-select:none;">⋮⋮</span>
              <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                <span>${idx + 1}</span>
                <div style="display:flex; gap:2px;">
                  <button type="button" class="btn-reorder btn-reorder-worker-up" data-worker-id="${w.id}" ${idx === 0 ? 'disabled style="opacity:0.25; cursor:not-allowed;"' : ''} title="เลื่อนลำดับผู้ปฏิบัติงานขึ้น">▲</button>
                  <button type="button" class="btn-reorder btn-reorder-worker-down" data-worker-id="${w.id}" ${idx === workers.length - 1 ? 'disabled style="opacity:0.25; cursor:not-allowed;"' : ''} title="เลื่อนลำดับผู้ปฏิบัติงานลง">▼</button>
                </div>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${w.avatar}" class="previewable-avatar" data-img-src="${w.avatar}" data-img-caption="${w.name} (${w.id})" style="width:38px; height:38px; border-radius:var(--radius-full); object-fit:cover; cursor:pointer;" title="คลิกเพื่อดูรูปโปรไฟล์ขยายเต็ม" alt="avatar" />
              <div>
                <strong style="color:var(--text-main); display:block;">${w.name} ${w.nickname && w.nickname !== '-' ? `<span style="color:var(--primary); font-size:0.85rem;">(${w.nickname})</span>` : ''}</strong>
                <small style="color:var(--text-muted);">${w.id} | ${w.email}</small>
              </div>
            </div>
          </td>
          <td><span class="badge" style="background:var(--primary-light); color:var(--primary); font-size:0.75rem; padding:2px 6px; border-radius:4px; margin-bottom:2px; display:inline-block;">${w.year || 'ชั้นปีที่ 1'}</span><br><strong>${w.department}</strong> <small style="color:var(--text-muted);">(${w.position})</small></td>
          <td style="text-align:center;">
            <strong style="color:var(--success); font-size:1.1rem;">${summary.completedHours}</strong> / ${summary.targetHours} ชม.
          </td>
          <td style="text-align:center;">
            ${isTargetMet ? '<span class="status-badge open">ครบตามเกณฑ์</span>' : '<span class="status-badge full">อยู่ระหว่างสะสม</span>'}
          </td>
          <td style="text-align:center;">
            <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm admin-manual-register-btn" data-worker-id="${w.id}" title="เพิ่มเข้าร่วมกิจกรรม">เพิ่มเข้าร่วม</button>
              <button class="btn btn-ghost btn-sm admin-edit-worker-btn" data-worker-id="${w.id}" title="แก้ไขข้อมูลผู้ปฏิบัติงาน">แก้ไข</button>
              <button class="btn btn-ghost btn-sm admin-delete-worker-btn" data-worker-id="${w.id}" style="color:var(--danger);" title="ลบรายชื่อผู้ปฏิบัติงาน">ลบ</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // --------------------------------------------------------------------------
  // 5. Render Printable Transcript View
  // --------------------------------------------------------------------------
  renderPrintableTranscript(summaryData) {
    const transcriptElem = document.getElementById('printable-transcript');
    if (!transcriptElem || !summaryData) return;

    const { worker, completedHours, targetHours, history } = summaryData;
    const completedHistory = history.filter(h => h.status === 'completed');

    const now = new Date();
    const printDateStr = `${now.getDate()} ${['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][now.getMonth()]} พ.ศ. ${now.getFullYear() + 543}`;

    let rowsHtml = '';
    if (completedHistory.length === 0) {
      rowsHtml = `<tr><td colspan="5" style="text-align:center; padding:15px;">ยังไม่มีรายการชั่วโมงกิจกรรมที่ได้รับการอนุมัติ</td></tr>`;
    } else {
      rowsHtml = completedHistory.map((h, i) => `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td><strong>${h.activityTitle}</strong><br><small>${h.category}</small></td>
          <td style="text-align:center;">${this.formatThaiDate(h.date)}</td>
          <td style="text-align:center;">${h.baseHours} ชม.</td>
          <td style="text-align:center; font-weight:bold;">${h.hoursGranted} ชม.</td>
        </tr>
      `).join('');
    }

    transcriptElem.innerHTML = `
      <div class="transcript-header" style="text-align:center; margin-bottom:15px;">
        <img src="https://drive.google.com/thumbnail?id=1pB-8Qn75ZVnzhJhllPLbc0hI8k0jVJ-9&sz=w800" alt="Logo" style="height:70px; width:auto; margin-bottom:8px; object-fit:contain;">
        <h2 style="font-size:16pt; margin-bottom:2px;">ใบรับรองการสะสมชั่วโมงกิจกรรมผู้ปฏิบัติงาน</h2>
        <h3 style="font-size:13pt; font-weight:normal; margin-bottom:10px;">Official Activity Hours Transcript</h3>
        <p style="font-size:10pt;">วันที่ออกเอกสาร: ${printDateStr}</p>
      </div>

      <div class="transcript-details" style="font-size:11pt; line-height:1.8; margin-bottom:20px; border:1px solid #ccc; padding:12px; border-radius:6px;">
        <div><strong>รหัสผู้ปฏิบัติงาน:</strong> ${worker.id}</div>
        <div><strong>ชื่อ-นามสกุล:</strong> ${worker.name}</div>
        <div><strong>สังกัด/ฝ่าย:</strong> ${worker.department}</div>
        <div><strong>ตำแหน่ง:</strong> ${worker.position}</div>
        <div><strong>เป้าหมายชั่วโมงกิจกรรม:</strong> ${targetHours} ชั่วโมง</div>
        <div><strong>ชั่วโมงกิจกรรมสะสมรวม:</strong> <span style="font-weight:bold; text-decoration:underline;">${completedHours} ชั่วโมง</span></div>
      </div>

      <table class="transcript-table">
        <thead>
          <tr style="background:#f0f0f0;">
            <th style="width:40px; text-align:center;">ลำดับ</th>
            <th>ชื่อกิจกรรม / หมวดหมู่</th>
            <th style="width:120px; text-align:center;">วันที่จัดกิจกรรม</th>
            <th style="width:100px; text-align:center;">ชั่วโมงฐาน</th>
            <th style="width:110px; text-align:center;">ชั่วโมงที่อนุมัติ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top:20px; text-align:right; font-weight:bold; font-size:12pt;">
        รวมทั้งสิ้น ${completedHours} ชั่วโมง (${completedHours >= targetHours ? 'ผ่านเกณฑ์ตามกำหนด' : 'ยังไม่ครบเกณฑ์เป้าหมาย'})
      </div>

      <div class="transcript-footer">
        <div class="signature-box">
          <div class="signature-line">
            (${worker.name})<br>
            ผู้ปฏิบัติงาน
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            (....................................................)<br>
            เจ้าหน้าที่ผู้รับรองข้อมูล
          </div>
        </div>
      </div>
    `;
  }
};

window.UI = UI;
