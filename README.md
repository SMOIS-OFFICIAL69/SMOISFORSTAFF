# 🏛️ SMO-STAFF Official
### ระบบสารสนเทศบันทึกและสรุปผลชั่วโมงกิจกรรมผู้ปฏิบัติงาน (Staff Activity Registration & Hours Summary System)

**SMO-STAFF Official** เป็นระบบเว็บแอปพลิเคชันรูปแบบ Modern Standalone Single Page Application (SPA) สำหรับบริหารจัดการกิจกรรม ลงทะเบียนเข้าร่วมกิจกรรม และคำนวณอนุมัติสรุปชั่วโมงกิจกรรมสะสมรายบุคคล สำหรับผู้ปฏิบัติงานและเจ้าหน้าที่สถาบัน

---

## 🌟 ฟีเจอร์หลักของระบบ (Features)

### 1. มุมมองผู้ปฏิบัติงานทั่วไป (General Worker View)
- 📌 **รายการกิจกรรมทั้งหมด**: ค้นหา กรองหมวดหมู่ และลงทะเบียนเข้าร่วมกิจกรรมได้ทันที
- 🎓 **เข้าสู่ระบบด้วยรหัสนักศึกษา/รหัสผู้ปฏิบัติงาน**: เพื่อดูชั่วโมงสะสม เป้าหมายชั่วโมง ชั่วโมงรออนุมัติ และประวัติการเข้าร่วม
- 📜 **พิมพ์ใบรายงานผลชั่วโมงกิจกรรม (Print Transcript)**: พิมพ์เอกสารสรุปผล A4 อย่างเป็นทางการตามรูปแบบสถาบัน

### 2. มุมมองเจ้าหน้าที่ผู้ดูแลระบบ (Officer / Admin View)
- 📈 **แดชบอร์ดสรุปภาพรวมองค์กร**: แสดงจำนวนผู้ปฏิบัติงาน กิจกรรม และชั่วโมงที่อนุมัติแล้ว
- 📝 **จัดการกิจกรรม (CRUD)**: เพิ่ม แก้ไข ลบ กิจกรรม และกำหนดชั่วโมงกิจกรรม
- ⚡ **ระบบ Auto-Scaling Hours & Auto-Enrollment**: ปรับเพิ่มชั่วโมงเป้าหมายผู้ปฏิบัติงานทุกคนอัตโนมัติตามกิจกรรมที่สร้างใหม่
- 📂 **นำเข้ารายชื่อผ่านไฟล์ Excel / CSV (Bulk Import)**: นำเข้ารายชื่อผู้ปฏิบัติงานหลายสิบคนได้ในครั้งเดียว พร้อมดาวน์โหลดไฟล์แม่แบบ CSV
- 📊 **เชื่อมต่อและซิงค์ข้อมูลกับ Google Sheets (Cloud Database)**: จัดเก็บและอัปเดตข้อมูลผู้ปฏิบัติงาน กิจกรรม และการอนุมัติชั่วโมงลงใน Google Sheets แบบเรียลไทม์ผ่าน Google Apps Script
- 🔑 **จัดการแอดมิน (Admin Accounts CRUD)**: เพิ่ม แก้ไข และลบบัญชีเจ้าหน้าที่ผู้ดูแลระบบ
- 🖼️ **รองรับลิงก์รูปภาพโปรไฟล์จาก Google Drive**: แปลง URL จาก Google Drive เป็นรูปโปรไฟล์อัตโนมัติ

---

## 📁 โครงสร้างไฟล์ในโครงการ (Project Structure)

```text
Smo-Staff/
├── index.html              # หน้าหลักโครงสร้าง HTML, Navigation และ Modals ทั้งหมด
├── css/
│   └── styles.css          # ระบบดีไซน์ทางการ (Sarabun Font & Royal Navy Theme)
├── js/
│   ├── store.js            # Engine จัดเก็บข้อมูล LocalStorage & Auth Logic
│   ├── ui-components.js    # DOM Renderers & Printable Transcript Generator
│   └── app.js              # Controller Event Handlers & Business Logic
└── README.md               # คู่มือเอกสารโครงการ
```

---

## 🔑 บัญชีเข้าสู่ระบบเริ่มต้น (Default Admin Credential)

### 1. เข้าสู่ระบบเจ้าหน้าที่ (Officer / Admin Login)
- **Username**: `admin`
- **Password**: `admin123`

### 2. เข้าสู่ระบบผู้ปฏิบัติงาน (Student / Worker Login)
- พิมพ์รหัสนักศึกษา/รหัสประจำตัวใดๆ เพื่อเข้าสู่ระบบและเริ่มเปิดสมุดสะสมชั่วโมงใหม่ได้ทันที

---

## 🚀 การนำไปอัปโหลดขึ้น GitHub & GitHub Pages

1. สร้าง Repository ใหม่บน GitHub (เช่น `smo-staff-official`)
2. ลากหรือพุชไฟล์ทั้งหมดขึ้น GitHub:
   - `index.html`
   - โฟลเดอร์ `css/` (รวม `styles.css`)
   - โฟลเดอร์ `js/` (รวม `store.js`, `ui-components.js`, `app.js`)
   - `README.md`
3. เปิดใช้งาน **GitHub Pages**:
   - ไปที่ repository **Settings** -> **Pages**
   - ในหัวข้อ **Source** เลือก Branch `main` (หรือ `master`) และ Root `/`
   - กด **Save** ระบบจะสร้าง URL สำหรับเข้าใช้งานออนไลน์ให้อัตโนมัติ!

---
© 2026 SMO-STAFF Official System. All Rights Reserved.
