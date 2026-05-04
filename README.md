# 🏥 MedTrain — Hospital Training Management System

A complete, **free** digital training management system for hospitals. Built with **HTML/CSS/JS** (GitHub Pages hosted) + **Google Apps Script** backend + **Google Sheets** database.

---

## 📁 Project Structure

```
medtrain/
├── index.html                  ← Login page
├── css/
│   └── app.css                 ← Shared styles
├── js/
│   ├── config.js               ← API URL + helpers
│   └── app.js                  ← Shell, DEMO data, SmartAPI
├── pages/
│   ├── dashboard.html          ← Main dashboard
│   ├── trainings.html          ← Training list & creation
│   ├── training-detail.html    ← QR codes, attendance, feedback, exams
│   ├── employees.html          ← Employee master (Super Admin)
│   ├── users.html              ← User & role management (Super Admin)
│   ├── departments.html        ← Department setup (Super Admin)
│   ├── templates.html          ← Feedback template builder (Super Admin)
│   ├── reports.html            ← Reports & Excel downloads
│   ├── attendance.html         ← Employee attendance QR page (no login)
│   ├── feedback.html           ← Employee feedback QR page (no login)
│   └── exam.html               ← Employee exam QR page (no login)
└── Code.gs                     ← Google Apps Script backend
```

---

## 🚀 Setup in 4 Steps

### Step 1 — Fork & Enable GitHub Pages

1. Fork this repository on GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Save — your app URL will be: `https://YOUR-USERNAME.github.io/medtrain/`

---

### Step 2 — Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → Create blank sheet
2. Name it: **MedTrain Database**
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_ID/edit
   ```

---

### Step 3 — Deploy Google Apps Script

1. Go to [script.google.com](https://script.google.com) → **New Project**
2. Name it: **MedTrain Backend**
3. Delete the default code, paste the contents of `Code.gs`
4. At the top, set your Spreadsheet ID:
   ```javascript
   var SPREADSHEET_ID = 'your-spreadsheet-id-here';
   ```
5. Click **▶ Run** → select function `setupSheets` → Authorize all permissions
6. Click **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** → Copy the **Web App URL**

---

### Step 4 — Connect Frontend to Backend

1. Open `js/config.js` in your fork
2. Replace the API_URL:
   ```javascript
   const CONFIG = {
     API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
     // ...
   };
   ```
3. Commit & push → GitHub Pages auto-deploys

**Your app is live!** 🎉

---

## 🔐 Default Login

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@hospital.com | Admin@123 |

> ⚠️ Change the password immediately after first login via Users & Roles page.

---

## 👥 User Roles

| Feature | Super Admin | Organiser | HR |
|---------|:-----------:|:---------:|:--:|
| Employee master | ✅ | ❌ | ❌ |
| User management | ✅ | ❌ | ❌ |
| Feedback templates | ✅ | ❌ | ❌ |
| Create trainings | ✅ | ✅ | ✅ |
| Activate / Complete | ✅ | ✅ (own) | ✅ (own) |
| Generate QR codes | ✅ | ✅ | ✅ |
| Build exam questions | ✅ | ✅ | ❌ |
| Upload photos | ✅ | ✅ | ❌ |
| Download reports | ✅ | ✅ | ✅ |
| Certificates | ✅ | ✅ | ❌ |
| Receive HR email | ❌ | ❌ | ✅ |

---

## 📲 QR Code Flow (No Employee Login Needed)

### Attendance QR
1. Organiser activates training → QR appears in **QR Codes** tab
2. Print QR sheet (shows training name + subject + details)
3. Employee scans → enters Employee ID → auto-fetched from master → marked

### Feedback QR
- Shown after training
- Loads template form (star/scale/MCQ/text questions)
- One submission per employee per training (duplicate blocked)
- Must have marked attendance first

### Pre/Post Exam QR
- Employee scans → enters ID → takes MCQ exam
- Auto-scored; results shown based on organiser setting
- One attempt per exam type per employee

---

## 📥 Excel Downloads

All downloads are **CSV format** (opens directly in Excel):
- Attendance sheet per training
- Feedback report per training
- Exam results (pre vs post comparison)
- Full training report (combined)
- Master report (all trainings)
- Department-wise summary

---

## 🏆 Certificates

- Enable per training during creation
- Generate per employee from Attendance tab
- Print directly from browser (Print → Save as PDF)

---

## 📧 Auto HR Email

Triggered when organiser clicks **"Mark Complete"**. Email includes:
- Training name, date, venue, trainer
- Complete attendance list with employee details

---

## 🎯 Demo Mode

The app runs in **Demo Mode** automatically when `config.js` still has `YOUR_DEPLOYMENT_ID`. Use these demo logins:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@medtrain.demo | Admin@123 |
| Organiser | organiser@medtrain.demo | Demo@123 |
| HR | hr@medtrain.demo | Demo@123 |

---

## 🛠️ Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend hosting | GitHub Pages | Free |
| Backend / API | Google Apps Script | Free |
| Database | Google Sheets | Free |
| File storage | Google Drive | Free |
| Email | Gmail API (via GAS) | Free |
| QR Generation | api.qrserver.com | Free |
| Fonts | Google Fonts | Free |
| **Total** | | **₹0 / $0** |

---

## 📞 Support

For issues, open a GitHub Issue or contact your system administrator.
