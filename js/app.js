// ═══════════════════════════════════════════════════════════════
//  MAH Training System — app.js
//  Shell, DEMO data, SmartAPI
// ═══════════════════════════════════════════════════════════════

const Shell = {
  user: null,

  init(requiredRoles = []) {
    this.user = Session.require(requiredRoles);
    if (!this.user) return null;
    this.renderSidebar();
    this.renderTopbar();
    return this.user;
  },

  roleLabel(r) {
    return {superadmin:'Super Admin', organiser:'Organiser', hr:'HR Manager'}[r] || r;
  },

  navItems(role) {
    const all = [
      { section:'Main' },
      { id:'dashboard',  href:'dashboard.html',  icon:'📊', label:'Dashboard',          roles:['superadmin','organiser','hr'] },
      { id:'trainings',  href:'trainings.html',   icon:'📅', label:'Trainings',          roles:['superadmin','organiser','hr'] },
      { section:'Management' },
      { id:'employees',  href:'employees.html',   icon:'👥', label:'Employees',          roles:['superadmin'] },
      { id:'users',      href:'users.html',        icon:'🔐', label:'Users & Roles',      roles:['superadmin'] },
      { id:'departments',href:'departments.html',  icon:'🏢', label:'Departments',        roles:['superadmin'] },
      { id:'templates',  href:'templates.html',    icon:'📝', label:'Feedback Templates', roles:['superadmin'] },
      { id:'settings',   href:'settings.html',     icon:'⚙️', label:'Settings',           roles:['superadmin'] },
      { section:'Reports' },
      { id:'reports',    href:'reports.html',      icon:'📈', label:'Reports',            roles:['superadmin','organiser','hr'] },
    ];
    return all.filter(item => item.section || item.roles.includes(role));
  },

  renderSidebar() {
    const u = this.user;
    const cur = window.location.pathname.split('/').pop().replace('.html','');
    const items = this.navItems(u.role);
    const navHtml = items.map(item => {
      if (item.section) return `<div class="nav-section-label">${item.section}</div>`;
      return `<a class="nav-item ${item.id===cur?'active':''}" href="${item.href}">
        <span class="ni-icon">${item.icon}</span><span>${item.label}</span>
      </a>`;
    }).join('');

    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <img src="${CONFIG.logoPath}" alt="MAH"
             style="height:36px;width:auto;background:white;padding:2px 5px;border-radius:6px;flex-shrink:0"
             onerror="this.style.display='none'">
        <div>
          <div class="sidebar-brand-name">Training System</div>
          <div class="sidebar-brand-ver">MAH · ${u.department==='ALL'?'All Depts':u.department}</div>
        </div>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">${(u.name||'?').charAt(0).toUpperCase()}</div>
          <div>
            <div class="user-name">${u.name}</div>
            <div class="user-role">${this.roleLabel(u.role)}</div>
          </div>
        </div>
        <button class="btn-signout" onclick="Shell.logout()">⎋ Sign Out</button>
      </div>`;
  },

  renderTopbar(title) {
    const cur = window.location.pathname.split('/').pop().replace('.html','');
    const labels = {dashboard:'Dashboard',trainings:'Trainings',employees:'Employees',
      users:'Users & Roles',departments:'Departments',templates:'Feedback Templates',
      reports:'Reports',settings:'Settings'};
    const topbar = document.getElementById('topbar');
    topbar.innerHTML = `
      <button class="topbar-hamburger" onclick="Shell.toggleSidebar()">☰</button>
      <div class="topbar-title" id="topbarTitle">${title||labels[cur]||'Training System'}</div>
      <div class="topbar-actions" id="topbarActions"></div>`;
  },

  setTopbarTitle(t) { const el=document.getElementById('topbarTitle'); if(el) el.textContent=t; },
  setTopbarActions(h) { const el=document.getElementById('topbarActions'); if(el) el.innerHTML=h; },
  toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); },

  logout() {
    Session.clear();
    Paths.toLogin();
  }
};

// ── Modal ─────────────────────────────────────────────────────
const Modal = {
  open(title, body, size='') {
    let ov = document.getElementById('modalOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.className='modal-overlay'; ov.id='modalOverlay';
      ov.innerHTML=`<div class="modal-box ${size}" id="modalBox">
        <div class="modal-header">
          <div class="modal-title" id="modalTitle"></div>
          <button class="modal-close" onclick="Modal.close()">✕</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
      </div>`;
      ov.addEventListener('click', e=>{ if(e.target===ov) Modal.close(); });
      document.body.appendChild(ov);
    }
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalBox').className = 'modal-box '+(size||'');
    requestAnimationFrame(()=>ov.classList.add('open'));
  },
  close() {
    const ov=document.getElementById('modalOverlay');
    if(ov) ov.classList.remove('open');
  },
  setBody(h) { const el=document.getElementById('modalBody'); if(el) el.innerHTML=h; }
};

// ── Demo data ─────────────────────────────────────────────────
const DEMO = {
  isDemoMode() {
    const u = Session.get();
    return CONFIG.isDemo || (u && u.id && String(u.id).startsWith('DEMO'));
  },

  trainings: [
    {TrainingID:'TRN2025001',Title:'Basic Life Support (BLS)',Department:'Emergency,ICU',Subject:'CPR & Resuscitation',Venue:'Training Hall A',TrainerName:'Dr. Arvind Mehta',StartDate:'2025-01-10',StartTime:'09:00',EndTime:'13:00',Status:'Completed',CreatedBy:'DEMO002',ExpectedAttendees:'30',PreExamRequired:'TRUE',PostExamRequired:'TRUE',ShowExamResults:'TRUE',CertificateEnabled:'TRUE',Description:'Annual BLS certification.',CreatedDate:'2025-01-01 09:00:00 IST',CompletedDate:'2025-01-10 13:00:00 IST'},
    {TrainingID:'TRN2025002',Title:'Infection Control & Hand Hygiene',Department:'Nursing,All Departments',Subject:'Infection Prevention',Venue:'Conference Room B',TrainerName:'Dr. Meena Patel',StartDate:'2025-01-20',StartTime:'10:00',EndTime:'12:00',Status:'Completed',CreatedBy:'DEMO002',ExpectedAttendees:'45',PreExamRequired:'FALSE',PostExamRequired:'TRUE',ShowExamResults:'TRUE',CertificateEnabled:'FALSE',Description:'WHO hand hygiene protocol.',CreatedDate:'2025-01-05 10:00:00 IST',CompletedDate:'2025-01-20 12:00:00 IST'},
    {TrainingID:'TRN2025003',Title:'Advanced Cardiac Life Support',Department:'Cardiology',Subject:'ACLS Protocol',Venue:'Skills Lab',TrainerName:'Dr. Suresh Kumar',StartDate:'2025-02-10',StartTime:'08:00',EndTime:'17:00',Status:'Active',CreatedBy:'DEMO002',ExpectedAttendees:'20',PreExamRequired:'TRUE',PostExamRequired:'TRUE',ShowExamResults:'TRUE',CertificateEnabled:'TRUE',Description:'ACLS recertification.',CreatedDate:'2025-01-20 09:00:00 IST',CompletedDate:''},
    {TrainingID:'TRN2025004',Title:'Fire Safety & Evacuation',Department:'All Departments',Subject:'Safety Protocols',Venue:'Main Auditorium',TrainerName:'Mr. Ravi Verma',StartDate:'2025-03-01',StartTime:'14:00',EndTime:'16:00',Status:'Scheduled',CreatedBy:'DEMO003',ExpectedAttendees:'100',PreExamRequired:'FALSE',PostExamRequired:'FALSE',ShowExamResults:'FALSE',CertificateEnabled:'FALSE',Description:'Annual fire safety drill.',CreatedDate:'2025-02-01 10:00:00 IST',CompletedDate:''},
    {TrainingID:'TRN2025005',Title:'Patient Safety & Fall Prevention',Department:'Nursing,ICU',Subject:'Patient Safety',Venue:'Nursing Training Room',TrainerName:'Ms. Kavitha R.',StartDate:'2025-03-15',StartTime:'11:00',EndTime:'13:00',Status:'Draft',CreatedBy:'DEMO002',ExpectedAttendees:'40',PreExamRequired:'FALSE',PostExamRequired:'FALSE',ShowExamResults:'FALSE',CertificateEnabled:'FALSE',Description:'',CreatedDate:'2025-02-10 09:00:00 IST',CompletedDate:''},
  ],

  attendance: {
    'TRN2025001':[
      {AttID:'A001',TrainingID:'TRN2025001',EmployeeID:'EMP001',EmployeeName:'Ravi Kumar',Department:'Emergency',Designation:'Nurse',Timestamp:'2025-01-10 09:05:00 IST'},
      {AttID:'A002',TrainingID:'TRN2025001',EmployeeID:'EMP002',EmployeeName:'Priya Nair',Department:'Emergency',Designation:'Sr. Nurse',Timestamp:'2025-01-10 09:08:00 IST'},
      {AttID:'A003',TrainingID:'TRN2025001',EmployeeID:'EMP003',EmployeeName:'Suresh M.',Department:'ICU',Designation:'Doctor',Timestamp:'2025-01-10 09:12:00 IST'},
    ],
    'TRN2025003':[
      {AttID:'A007',TrainingID:'TRN2025003',EmployeeID:'EMP007',EmployeeName:'Arun T.',Department:'Cardiology',Designation:'Cardiologist',Timestamp:'2025-02-10 08:06:00 IST'},
    ]
  },

  feedback: {
    'TRN2025001':[
      {FBID:'F001',TrainingID:'TRN2025001',EmployeeID:'EMP001',EmployeeName:'Ravi Kumar',OverallRating:'5',TrainerRating:'5',Comments:'Excellent training!',Timestamp:'2025-01-10 13:15:00 IST'},
      {FBID:'F002',TrainingID:'TRN2025001',EmployeeID:'EMP002',EmployeeName:'Priya Nair',OverallRating:'4',TrainerRating:'5',Comments:'Very practical.',Timestamp:'2025-01-10 13:20:00 IST'},
    ]
  },

  employees:[
    {EmployeeID:'EMP001',Name:'Ravi Kumar',Department:'Emergency',Designation:'Nurse',Email:'ravi@mah.com',Phone:'9876543210',Active:'TRUE'},
    {EmployeeID:'EMP002',Name:'Priya Nair',Department:'Emergency',Designation:'Sr. Nurse',Email:'priya@mah.com',Phone:'9876543211',Active:'TRUE'},
    {EmployeeID:'EMP003',Name:'Suresh M.',Department:'ICU',Designation:'Doctor',Email:'suresh@mah.com',Phone:'9876543212',Active:'TRUE'},
    {EmployeeID:'EMP007',Name:'Arun T.',Department:'Cardiology',Designation:'Cardiologist',Email:'arun@mah.com',Phone:'9876543216',Active:'TRUE'},
  ],

  departments:[
    {DeptID:'D001',DeptName:'Emergency',HeadName:'Dr. Ramesh',Active:'TRUE'},
    {DeptID:'D002',DeptName:'Cardiology',HeadName:'Dr. Suresh Kumar',Active:'TRUE'},
    {DeptID:'D003',DeptName:'Nursing',HeadName:'Ms. Kavitha R.',Active:'TRUE'},
    {DeptID:'D004',DeptName:'ICU',HeadName:'Dr. Sunita',Active:'TRUE'},
    {DeptID:'D005',DeptName:'Radiology',HeadName:'Dr. Mohan',Active:'TRUE'},
    {DeptID:'D006',DeptName:'Laboratory',HeadName:'Dr. Asha',Active:'TRUE'},
    {DeptID:'D007',DeptName:'Pharmacy',HeadName:'Mr. Raj',Active:'TRUE'},
    {DeptID:'D008',DeptName:'Administration',HeadName:'Ms. Nisha',Active:'TRUE'},
    {DeptID:'D009',DeptName:'HR',HeadName:'Mr. Rahul',Active:'TRUE'},
    {DeptID:'D010',DeptName:'All Departments',HeadName:'',Active:'TRUE'},
  ],

  templates:[{
    TemplateID:'TMPL001',TemplateName:'Standard Training Feedback',
    Questions:JSON.stringify([
      {type:'rating',label:'Rate the training content quality'},
      {type:'rating',label:'Was the training well-organized?'},
      {type:'scale',label:'Rate the venue & facilities (1=Poor, 5=Excellent)'},
      {type:'mcq',label:'Training duration was?',options:['Too Short','Just Right','Too Long']},
      {type:'text',label:'Most useful part of this training?'},
      {type:'text',label:'Suggestions for improvement?'}
    ]),
    CreatedBy:'ADMIN001',Active:'TRUE'
  }],

  examQuestions: {
    'TRN2025001_pre':[
      {QID:'Q001',Question:'What does BLS stand for?',OptionA:'Basic Life Support',OptionB:'Body Lung Support',OptionC:'Basic Lung Safety',OptionD:'Body Life System',CorrectOption:'A',Marks:'1'},
      {QID:'Q002',Question:'Chest compressions per minute in adult CPR?',OptionA:'60-80',OptionB:'80-100',OptionC:'100-120',OptionD:'120-140',CorrectOption:'C',Marks:'1'},
      {QID:'Q003',Question:'Compression to breath ratio in adult CPR?',OptionA:'15:1',OptionB:'30:2',OptionC:'20:2',OptionD:'15:2',CorrectOption:'B',Marks:'2'},
    ]
  },

  getTraining(id){ return this.trainings.find(t=>t.TrainingID===id)||null; },
  getAttendance(id){ return this.attendance[id]||[]; },
  getFeedback(id){ return this.feedback[id]||[]; },
  getStats(user){
    const t = this.trainings;
    return {
      total:t.length,
      scheduled:t.filter(x=>x.Status==='Scheduled').length,
      active:t.filter(x=>x.Status==='Active').length,
      completed:t.filter(x=>x.Status==='Completed').length,
      todayTrainings:[]
    };
  }
};

// ── SmartAPI — demo or real ───────────────────────────────────
const SmartAPI = {
  async getTrainings(role, dept) {
    if (DEMO.isDemoMode()) return [...DEMO.trainings];
    const res = await API.call('getTrainings', {role, dept});
    return (res && res.data) ? res.data : [];
  },
  async getTraining(id) {
    if (DEMO.isDemoMode()) return DEMO.getTraining(id);
    const res = await API.call('getTraining', {trainingId:id});
    return (res && res.data) ? res.data : null;
  },
  async getDepartments() {
    if (DEMO.isDemoMode()) return [...DEMO.departments];
    const res = await API.call('getDepartments');
    return (res && res.data) ? res.data : [];
  },
  async getEmployees() {
    if (DEMO.isDemoMode()) return [...DEMO.employees];
    const res = await API.call('getEmployees');
    return (res && res.data) ? res.data : [];
  },
  async getTemplates() {
    if (DEMO.isDemoMode()) return [...DEMO.templates];
    const res = await API.call('getFeedbackTemplates');
    return (res && res.data) ? res.data : [];
  },
  async saveTraining(data) {
    if (DEMO.isDemoMode()) {
      const id = data.TrainingID || ('TRN'+Date.now().toString().slice(-6));
      data.TrainingID = id; data.Status = data.Status||'Scheduled';
      data.CreatedDate = new Date().toLocaleString('en-IN')+' IST';
      const idx = DEMO.trainings.findIndex(t=>t.TrainingID===id);
      if (idx>=0) DEMO.trainings[idx]={...DEMO.trainings[idx],...data};
      else DEMO.trainings.unshift({...data});
      return {success:true,id};
    }
    return await API.call('saveTraining', data);
  },
  async updateStatus(trainingId, status) {
    if (DEMO.isDemoMode()) {
      const t = DEMO.trainings.find(x=>x.TrainingID===trainingId);
      if(t){t.Status=status;if(status==='Completed')t.CompletedDate=new Date().toLocaleString('en-IN')+' IST';}
      return {success:true};
    }
    return await API.call('updateTrainingStatus', {trainingId, status});
  },
  async getReport(trainingId) {
    if (DEMO.isDemoMode()) {
      const t=DEMO.getTraining(trainingId);
      const att=DEMO.getAttendance(trainingId);
      const fb=DEMO.getFeedback(trainingId);
      return {training:t,attendance:att,feedback:fb,
        preExamResults:[],postExamResults:[],photos:[],
        stats:{totalAttendees:att.length,totalFeedback:fb.length,
          avgRating:fb.length?(fb.reduce((s,f)=>s+parseFloat(f.OverallRating),0)/fb.length).toFixed(1):'N/A',
          avgTrainerRating:fb.length?(fb.reduce((s,f)=>s+parseFloat(f.TrainerRating),0)/fb.length).toFixed(1):'N/A'}};
    }
    const res = await API.call('getTrainingReport',{trainingId});
    return (res && res.data) ? res.data : null;
  },
  async getSettings() {
    if (DEMO.isDemoMode()) return {hr_email:''};
    const res = await API.call('getSettings');
    return (res && res.data) ? res.data : {};
  },
  async saveSettings(data) {
    if (DEMO.isDemoMode()) { Toast.show('Settings saved (demo)','success'); return {success:true}; }
    return await API.call('saveSettings', data);
  }
};
