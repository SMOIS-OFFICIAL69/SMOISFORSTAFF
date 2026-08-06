# 🚀 คู่มือการติดตั้ง Google Sheets Database & Google Drive Backup (Backend Guide)

เอกสารนี้อธิบายขั้นตอนการติดตั้ง **Google Apps Script** เพื่อใช้ **Google Sheets** เป็นฐานข้อมูลหลักของระบบลงทะเบียนกิจกรรมผู้ปฏิบัติงาน (Smo-Staff) และการตั้งค่าระบบ **สำรองข้อมูลอัตโนมัติไปยัง Google Drive (Automated Drive Backup)**

---

## 📌 ขั้นตอนที่ 1: สร้าง Google Sheets & Google Drive Folder

1. เข้าไปที่ [Google Sheets](https://sheets.google.com) แล้วกดสร้าง **สเปรดชีตใหม่** (ตั้งชื่อว่า `Smo-Staff Registration System DB`)
2. เข้าไปที่ [Google Drive](https://drive.google.com) แล้วสร้าง **โฟลเดอร์ใหม่** สำหรับเก็บไฟล์สำรองข้อมูล (เช่น ตั้งชื่อว่า `SmoStaff_Backups`)
3. คัดลอก **Folder ID** จาก URL ของโฟลเดอร์ใน Google Drive:
   - ตัวอย่าง URL: `https://drive.google.com/drive/folders/1A2b3C4d5E6f7G8h9I0j`
   - **Folder ID** คือ: `1A2b3C4d5E6f7G8h9I0j`

---

## 📌 ขั้นตอนที่ 2: ติดตั้งสคริปต์ Google Apps Script (`Code.gs`)

1. ในหน้า Google Sheets ที่สร้างไว้ ให้ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
2. ลบโค้ดเดิมในไฟล์ `Code.gs` ออกทั้งหมด
3. คัดลอกโค้ดทั้งหมดจากไฟล์ [`google-apps-script/Code.gs`](file:///d:/SMOIS/student-club-web/Smo-Staff/google-apps-script/Code.gs) ในโปรเจกต์นี้ ไปวางใน Apps Script
4. ในโค้ดบรรทัดที่ 16 ให้แก้ไข `YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE` เป็น Folder ID ที่คัดลอกมาในขั้นตอนที่ 1:
   ```javascript
   const CONFIG = {
     DRIVE_FOLDER_ID: '1A2b3C4d5E6f7G8h9I0j', // วาง Folder ID ของคุณตรงนี้
   ```
5. กดปุ่ม **บันทึก (Save)** (ไอคอนแผ่นดิสก์ หรือ `Ctrl + S`)

---

## 📌 ขั้นตอนที่ 3: Deploy เป็น Web App เพื่อรับส่งข้อมูลกับหน้าเว็บ

1. กดปุ่ม **ทำให้ใช้งานได้ (Deploy)** มุมขวาบน > เลือก **การทำให้ใช้งานได้ใหม่ (New deployment)**
2. คลิกเลือกประเภทเป็น **เว็บแอป (Web app)**
3. ตั้งค่ารายละเอียดดังนี้:
   - **คำอธิบาย (Description)**: `Smo-Staff Registration API v1`
   - **เรียกใช้ในฐานะ (Execute as)**: `ฉัน (Me / your-email@gmail.com)`
   - **ผู้ที่มีสิทธิ์เข้าถึง (Who has access)**: **`ทุกคน (Anyone)`** *(สำคัญมาก เพื่อให้หน้าเว็บส่งคำขอลงทะเบียนได้)*
4. กด **ทำให้ใช้งานได้ (Deploy)**
5. กดยินยอมสิทธิ์การเข้าถึง (Authorize Access) และเลือกบัญชี Google ของคุณ
6. ระบบจะแสดง **URL ของเว็บแอป (Web App URL)** เช่น:
   `https://script.google.com/macros/s/AKfycbx.../exec`
7. **คัดลอก Web App URL นี้ไว้**

---

## 📌 ขั้นตอนที่ 4: เชื่อมต่อ Web App URL กับหน้าเว็บ Smo-Staff

1. เปิดหน้าเว็บ [index.html](file:///d:/SMOIS/student-club-web/Smo-Staff/index.html) บนเบราว์เซอร์
2. สังเกตแถบมุมขวาบน จะมีปุ่ม **"เชื่อมต่อ Google Sheets API"** (หรือไอคอนเฟือง ⚙️)
3. วาง Web App URL ที่คัดลอกมาลงในช่องข้อความ แล้วกด **"บันทึกการตั้งค่า"**
4. ระบบจะทำการ Sync ข้อมูลแบบ Real-time กับ Google Sheets ทันที!

---

## 🔄 ระบบตั้งเวลาสำรองข้อมูลอัตโนมัติ (Daily Backup Trigger)

หากต้องการให้ระบบทำ Backup ข้อมูลลง Google Drive อัตโนมัติทุกวันเวลา 23:00 น. สามารถตั้งค่าได้ง่ายๆ ดังนี้:

1. ในหน้า Apps Script ให้เลือกฟังก์ชัน `setupDailyBackupTrigger` ในแถบดรอปดาวน์ด้านบน
2. กดปุ่ม **เรียกใช้ (Run)** 1 ครั้ง
3. ระบบจะสร้าง Time-driven Trigger สำรองข้อมูลให้อัตโนมัติโดยไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้!

---

## 📊 โครงสร้างคอลัมน์ใน Google Sheets (สร้างให้อัตโนมัติ)

เมื่อมีการทำรายการครั้งแรก สคริปต์จะสร้าง Sheet ให้อัตโนมัติ 3 แผ่น:

1. **`Activities`**: เก็บข้อมูลกิจกรรม (ID, Title, Description, Date, Time, Location, MaxQuota, RegisteredCount, Status, Banner)
2. **`Registrations`**: เก็บข้อมูลผู้ลงทะเบียน (RegID, Timestamp, StaffID, StaffName, Department, Email, Phone, ActivityID, ActivityTitle, Status, CheckInTime, QRHash)
3. **`Backups`**: เก็บประวัติการสำรองข้อมูลเข้า Google Drive (BackupID, Timestamp, FileName, FileUrl, RecordCount, Status)
