// ============================================================
// SHARED APP SHELL — used by all dashboard pages
// ============================================================

const Shell = {
  user: null,

  init(requiredRoles = []) {
    this.user = Session.require(requiredRoles);
    if (!this.user) return null;
    this.renderSidebar();
    this.renderTopbar();
    return this.user;
  },

  roleLabel(role) {
    return { superadmin: 'Super Admin', organiser: 'Organiser', hr: 'HR Manager' }[role] || role;
  },

  navItems(role) {
    const all = [
      { section: 'Main' },
      { id: 'dashboard', href: 'dashboard.html', icon: '📊', label: 'Dashboard', roles: ['superadmin','organiser','hr'] },
      { id: 'trainings', href: 'trainings.html', icon: '📅', label: 'Trainings', roles: ['superadmin','organiser','hr'] },
      { section: 'Management' },
      { id: 'employees', href: 'employees.html', icon: '👥', label: 'Employees', roles: ['superadmin'] },
      { id: 'users', href: 'users.html', icon: '🔐', label: 'Users & Roles', roles: ['superadmin'] },
      { id: 'departments', href: 'departments.html', icon: '🏢', label: 'Departments', roles: ['superadmin'] },
      { id: 'templates', href: 'templates.html', icon: '📝', label: 'Feedback Templates', roles: ['superadmin'] },
      { section: 'Reports' },
      { id: 'reports', href: 'reports.html', icon: '📈', label: 'Reports', roles: ['superadmin','organiser','hr'] },
    ];
    return all.filter(item => item.section || item.roles.includes(role));
  },

  renderSidebar() {
    const u = this.user;
    const currentPage = window.location.pathname.split('/').pop().replace('.html','');
    const items = this.navItems(u.role);

    const navHtml = items.map(item => {
      if (item.section) return `<div class="nav-section-label">${item.section}</div>`;
      const active = item.id === currentPage ? 'active' : '';
      return `<a class="nav-item ${active}" href="${item.href}">
        <span class="ni-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`;
    }).join('');

    const html = `
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">🏥</div>
        <div>
          <div class="sidebar-brand-name">MedTrain</div>
          <div class="sidebar-brand-ver">v2.0 · ${u.department === 'ALL' ? 'All Depts' : u.department}</div>
        </div>
      </div>
      <nav class="sidebar-nav" id="sidebarNav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">${u.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="user-name">${u.name}</div>
            <div class="user-role">${this.roleLabel(u.role)}</div>
          </div>
        </div>
        <button class="btn-signout" onclick="Shell.logout()">⎋ Sign Out</button>
      </div>`;

    let sidebar = document.getElementById('sidebar');
    if (!sidebar) {
      sidebar = document.createElement('nav');
      sidebar.className = 'sidebar'; sidebar.id = 'sidebar';
      document.querySelector('.app-shell').prepend(sidebar);
    }
    sidebar.innerHTML = html;
  },

  renderTopbar(title) {
    const currentPage = window.location.pathname.split('/').pop().replace('.html','');
    const labels = { dashboard:'Dashboard', trainings:'Trainings', employees:'Employees', users:'Users & Roles', departments:'Departments', templates:'Feedback Templates', reports:'Reports' };
    const pageTitle = title || labels[currentPage] || 'MedTrain';

    let topbar = document.getElementById('topbar');
    if (!topbar) {
      topbar = document.createElement('div');
      topbar.className = 'topbar'; topbar.id = 'topbar';
      document.querySelector('.main').before(topbar);
    }
    topbar.innerHTML = `
      <button class="topbar-hamburger" id="hamburgerBtn" onclick="Shell.toggleSidebar()">☰</button>
      <div class="topbar-title" id="topbarTitle">${pageTitle}</div>
      <div class="topbar-actions" id="topbarActions"></div>`;
  },

  setTopbarActions(html) {
    const el = document.getElementById('topbarActions');
    if (el) el.innerHTML = html;
  },

  setTopbarTitle(title) {
    const el = document.getElementById('topbarTitle');
    if (el) el.textContent = title;
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
  },

  logout() {
    Session.clear();
    window.location.href = '../index.html';
  }
};

// ============================================================
// MODAL MANAGER
// ============================================================
const Modal = {
  open(title, bodyHtml, opts = {}) {
    let overlay = document.getElementById('modalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'modalOverlay';
      overlay.innerHTML = `<div class="modal-box ${opts.size||''}" id="modalBox">
        <div class="modal-header">
          <div class="modal-title" id="modalTitle"></div>
          <button class="modal-close" onclick="Modal.close()">✕</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
      </div>`;
      overlay.addEventListener('click', e => { if (e.target === overlay) Modal.close(); });
      document.body.appendChild(overlay);
    }
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalBox').className = `modal-box ${opts.size||''}`;
    requestAnimationFrame(() => overlay.classList.add('open'));
  },
  close() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('open');
  },
  setBody(html) {
    const el = document.getElementById('modalBody');
    if (el) el.innerHTML = html;
  }
};

// ============================================================
// DEMO DATA — for GitHub demo mode when no API connected
// ============================================================
const DEMO = {
  isDemoMode() {
    return CONFIG.API_URL.includes('YOUR_DEPLOYMENT_ID') ||
           (Session.get() && Session.get().id.startsWith('DEMO'));
  },

  trainings: [
    { TrainingID:'TRN2024001', Title:'Basic Life Support (BLS)', Department:'Emergency', Subject:'Cardiopulmonary Resuscitation', Venue:'Training Hall A', TrainerName:'Dr. Arvind Mehta', StartDate:'2024-12-15', StartTime:'09:00', EndTime:'13:00', Status:'Completed', CreatedBy:'organiser@medtrain.demo', ExpectedAttendees:'30', PreExamRequired:'TRUE', PostExamRequired:'TRUE', ShowExamResults:'TRUE', CertificateEnabled:'TRUE', Description:'Annual BLS certification for emergency staff.', CreatedDate:'2024-12-01', CompletedDate:'2024-12-15' },
    { TrainingID:'TRN2024002', Title:'Infection Control & Hand Hygiene', Department:'Nursing', Subject:'Infection Prevention', Venue:'Conference Room B', TrainerName:'Dr. Meena Patel', StartDate:'2024-12-20', StartTime:'10:00', EndTime:'12:00', Status:'Completed', CreatedBy:'organiser@medtrain.demo', ExpectedAttendees:'45', PreExamRequired:'FALSE', PostExamRequired:'TRUE', ShowExamResults:'TRUE', CertificateEnabled:'FALSE', Description:'WHO hand hygiene protocol training.', CreatedDate:'2024-12-05', CompletedDate:'2024-12-20' },
    { TrainingID:'TRN2025001', Title:'Advanced Cardiac Life Support', Department:'Cardiology', Subject:'ACLS Protocol', Venue:'Skills Lab', TrainerName:'Dr. Suresh Kumar', StartDate:'2025-01-10', StartTime:'08:00', EndTime:'17:00', Status:'Active', CreatedBy:'organiser@medtrain.demo', ExpectedAttendees:'20', PreExamRequired:'TRUE', PostExamRequired:'TRUE', ShowExamResults:'TRUE', CertificateEnabled:'TRUE', Description:'ACLS recertification for cardiology team.', CreatedDate:'2024-12-20', CompletedDate:'' },
    { TrainingID:'TRN2025002', Title:'Fire Safety & Evacuation', Department:'Administration', Subject:'Safety Protocols', Venue:'Main Auditorium', TrainerName:'Mr. Ravi Verma', StartDate:'2025-01-18', StartTime:'14:00', EndTime:'16:00', Status:'Scheduled', CreatedBy:'hr@medtrain.demo', ExpectedAttendees:'100', PreExamRequired:'FALSE', PostExamRequired:'FALSE', ShowExamResults:'FALSE', CertificateEnabled:'FALSE', Description:'Annual fire safety drill and training.', CreatedDate:'2024-12-28', CompletedDate:'' },
    { TrainingID:'TRN2025003', Title:'Medical Equipment Operation', Department:'ICU', Subject:'Ventilator & Monitor Usage', Venue:'ICU Training Room', TrainerName:'Dr. Priya Sharma', StartDate:'2025-01-25', StartTime:'09:00', EndTime:'13:00', Status:'Scheduled', CreatedBy:'organiser@medtrain.demo', ExpectedAttendees:'15', PreExamRequired:'TRUE', PostExamRequired:'TRUE', ShowExamResults:'FALSE', CertificateEnabled:'TRUE', Description:'Hands-on training for ICU equipment.', CreatedDate:'2025-01-02', CompletedDate:'' },
    { TrainingID:'TRN2025004', Title:'Patient Safety & Fall Prevention', Department:'Nursing', Subject:'Patient Safety', Venue:'Nursing Training Room', TrainerName:'Ms. Kavitha R.', StartDate:'2025-02-05', StartTime:'11:00', EndTime:'13:00', Status:'Draft', CreatedBy:'organiser@medtrain.demo', ExpectedAttendees:'40', PreExamRequired:'FALSE', PostExamRequired:'FALSE', ShowExamResults:'FALSE', CertificateEnabled:'FALSE', Description:'', CreatedDate:'2025-01-05', CompletedDate:'' }
  ],

  attendance: {
    'TRN2024001': [
      { AttID:'A001', TrainingID:'TRN2024001', EmployeeID:'EMP001', EmployeeName:'Ravi Kumar', Department:'Emergency', Designation:'Nurse', Timestamp:'2024-12-15T09:04:00' },
      { AttID:'A002', TrainingID:'TRN2024001', EmployeeID:'EMP002', EmployeeName:'Priya Nair', Department:'Emergency', Designation:'Senior Nurse', Timestamp:'2024-12-15T09:07:00' },
      { AttID:'A003', TrainingID:'TRN2024001', EmployeeID:'EMP003', EmployeeName:'Suresh M.', Department:'Emergency', Designation:'Doctor', Timestamp:'2024-12-15T09:11:00' },
      { AttID:'A004', TrainingID:'TRN2024001', EmployeeID:'EMP004', EmployeeName:'Anita S.', Department:'Emergency', Designation:'Paramedic', Timestamp:'2024-12-15T09:15:00' },
    ],
    'TRN2024002': [
      { AttID:'A005', TrainingID:'TRN2024002', EmployeeID:'EMP005', EmployeeName:'Meena D.', Department:'Nursing', Designation:'Head Nurse', Timestamp:'2024-12-20T10:02:00' },
      { AttID:'A006', TrainingID:'TRN2024002', EmployeeID:'EMP006', EmployeeName:'James P.', Department:'Nursing', Designation:'Staff Nurse', Timestamp:'2024-12-20T10:05:00' },
    ],
    'TRN2025001': [
      { AttID:'A007', TrainingID:'TRN2025001', EmployeeID:'EMP007', EmployeeName:'Arun T.', Department:'Cardiology', Designation:'Cardiologist', Timestamp:'2025-01-10T08:06:00' },
    ]
  },

  feedback: {
    'TRN2024001': [
      { FBID:'F001', TrainingID:'TRN2024001', EmployeeID:'EMP001', EmployeeName:'Ravi Kumar', OverallRating:'5', TrainerRating:'5', Comments:'Excellent training, very practical!', Timestamp:'2024-12-15T13:15:00' },
      { FBID:'F002', TrainingID:'TRN2024001', EmployeeID:'EMP002', EmployeeName:'Priya Nair', OverallRating:'4', TrainerRating:'5', Comments:'Good content, could use more time.', Timestamp:'2024-12-15T13:20:00' },
    ]
  },

  employees: [
    { EmployeeID:'EMP001', Name:'Ravi Kumar', Department:'Emergency', Designation:'Nurse', Email:'ravi@hospital.com', Phone:'9876543210', Active:'TRUE' },
    { EmployeeID:'EMP002', Name:'Priya Nair', Department:'Emergency', Designation:'Senior Nurse', Email:'priya@hospital.com', Phone:'9876543211', Active:'TRUE' },
    { EmployeeID:'EMP003', Name:'Suresh M.', Department:'Emergency', Designation:'Doctor', Email:'suresh@hospital.com', Phone:'9876543212', Active:'TRUE' },
    { EmployeeID:'EMP004', Name:'Anita S.', Department:'Emergency', Designation:'Paramedic', Email:'anita@hospital.com', Phone:'9876543213', Active:'TRUE' },
    { EmployeeID:'EMP005', Name:'Meena D.', Department:'Nursing', Designation:'Head Nurse', Email:'meena@hospital.com', Phone:'9876543214', Active:'TRUE' },
    { EmployeeID:'EMP006', Name:'James P.', Department:'Nursing', Designation:'Staff Nurse', Email:'james@hospital.com', Phone:'9876543215', Active:'TRUE' },
    { EmployeeID:'EMP007', Name:'Arun T.', Department:'Cardiology', Designation:'Cardiologist', Email:'arun@hospital.com', Phone:'9876543216', Active:'TRUE' },
  ],

  departments: [
    { DeptID:'D001', DeptName:'Emergency', HeadName:'Dr. Ramesh', Active:'TRUE' },
    { DeptID:'D002', DeptName:'Cardiology', HeadName:'Dr. Suresh Kumar', Active:'TRUE' },
    { DeptID:'D003', DeptName:'Nursing', HeadName:'Ms. Kavitha R.', Active:'TRUE' },
    { DeptID:'D004', DeptName:'ICU', HeadName:'Dr. Sunita', Active:'TRUE' },
    { DeptID:'D005', DeptName:'Radiology', HeadName:'Dr. Mohan', Active:'TRUE' },
    { DeptID:'D006', DeptName:'Laboratory', HeadName:'Dr. Asha', Active:'TRUE' },
    { DeptID:'D007', DeptName:'Pharmacy', HeadName:'Mr. Raj', Active:'TRUE' },
    { DeptID:'D008', DeptName:'Administration', HeadName:'Ms. Nisha', Active:'TRUE' },
  ],

  templates: [
    {
      TemplateID: 'TMPL001',
      TemplateName: 'Standard Training Feedback',
      Questions: JSON.stringify([
        { type: 'rating', label: 'How would you rate the training content?' },
        { type: 'rating', label: 'Was the training material well-organized?' },
        { type: 'scale', label: 'Rate the training venue & facilities (1-5)' },
        { type: 'mcq', label: 'How was the duration of training?', options: ['Too Short','Just Right','Too Long'] },
        { type: 'text', label: 'What was the most useful part of this training?' },
        { type: 'text', label: 'Suggestions for improvement?' }
      ]),
      CreatedBy: 'admin@medtrain.demo',
      Active: 'TRUE',
      CreatedDate: '2024-11-01'
    }
  ],

  examQuestions: {
    'TRN2024001_pre': [
      { QID:'Q001', Question:'What does BLS stand for?', OptionA:'Basic Life Support', OptionB:'Body Lung Support', OptionC:'Basic Lung Safety', OptionD:'Body Life System', CorrectOption:'A', Marks:'1' },
      { QID:'Q002', Question:'How many chest compressions per minute in CPR?', OptionA:'60-80', OptionB:'80-100', OptionC:'100-120', OptionD:'120-140', CorrectOption:'C', Marks:'1' },
      { QID:'Q003', Question:'What is the ratio of compressions to breaths in adult CPR?', OptionA:'15:1', OptionB:'30:2', OptionC:'20:2', OptionD:'15:2', CorrectOption:'B', Marks:'2' },
    ]
  },

  getTraining(id) { return this.trainings.find(t => t.TrainingID === id) || null; },
  getAttendance(id) { return this.attendance[id] || []; },
  getFeedback(id) { return this.feedback[id] || []; },

  getStats(user) {
    const t = user.role === 'organiser'
      ? this.trainings.filter(x => x.Department === user.department)
      : this.trainings;
    const today = new Date().toISOString().split('T')[0];
    return {
      total: t.length,
      scheduled: t.filter(x => x.Status === 'Scheduled').length,
      active: t.filter(x => x.Status === 'Active').length,
      completed: t.filter(x => x.Status === 'Completed').length,
      todayTrainings: t.filter(x => x.StartDate === today)
    };
  }
};

// ============================================================
// SMART API — uses demo data if no real API configured
// ============================================================
const SmartAPI = {
  async getTrainings(role, dept) {
    if (DEMO.isDemoMode()) {
      if (role === 'organiser') return DEMO.trainings.filter(t => t.Department === dept || t.CreatedBy.includes('organiser'));
      return [...DEMO.trainings];
    }
    return (await API.call('getTrainings', { role, dept })).data || [];
  },
  async getTraining(id) {
    if (DEMO.isDemoMode()) return DEMO.getTraining(id);
    return (await API.call('getTraining', { trainingId: id })).data;
  },
  async getDepartments() {
    if (DEMO.isDemoMode()) return [...DEMO.departments];
    return (await API.call('getDepartments')).data || [];
  },
  async getEmployees() {
    if (DEMO.isDemoMode()) return [...DEMO.employees];
    return (await API.call('getEmployees')).data || [];
  },
  async getTemplates() {
    if (DEMO.isDemoMode()) return [...DEMO.templates];
    return (await API.call('getFeedbackTemplates')).data || [];
  },
  async saveTraining(data) {
    if (DEMO.isDemoMode()) {
      const id = data.TrainingID || ('TRN' + Date.now().toString().slice(-6));
      data.TrainingID = id; data.Status = data.Status || 'Scheduled';
      data.CreatedDate = new Date().toISOString();
      const idx = DEMO.trainings.findIndex(t => t.TrainingID === id);
      if (idx >= 0) DEMO.trainings[idx] = { ...DEMO.trainings[idx], ...data };
      else DEMO.trainings.unshift({ ...data });
      return { success: true, id };
    }
    return await API.call('saveTraining', data);
  },
  async updateStatus(trainingId, status) {
    if (DEMO.isDemoMode()) {
      const t = DEMO.trainings.find(x => x.TrainingID === trainingId);
      if (t) { t.Status = status; if (status === 'Completed') t.CompletedDate = new Date().toISOString(); }
      return { success: true };
    }
    return await API.call('updateTrainingStatus', { trainingId, status });
  },
  async getReport(trainingId) {
    if (DEMO.isDemoMode()) {
      const t = DEMO.getTraining(trainingId);
      const att = DEMO.getAttendance(trainingId);
      const fb = DEMO.getFeedback(trainingId);
      return {
        training: t, attendance: att, feedback: fb,
        preExamResults: [], postExamResults: [], photos: [],
        stats: {
          totalAttendees: att.length, totalFeedback: fb.length,
          avgRating: fb.length ? (fb.reduce((s,f)=>s+parseFloat(f.OverallRating),0)/fb.length).toFixed(1) : 'N/A',
          avgTrainerRating: fb.length ? (fb.reduce((s,f)=>s+parseFloat(f.TrainerRating),0)/fb.length).toFixed(1) : 'N/A'
        }
      };
    }
    return (await API.call('getTrainingReport', { trainingId })).data;
  }
};
