// ============================================================
// MEDTRAIN — Google Apps Script Backend
// Deploy as Web App → access by Anyone
// This file powers the GitHub-hosted frontend via fetch() calls
// ============================================================

var SPREADSHEET_ID = ''; // ← Paste your Google Sheet ID here
var DRIVE_FOLDER   = 'MedTrain Photos';

var SHEETS = {
  EMPLOYEES: 'Employees', DEPARTMENTS: 'Departments', USERS: 'Users',
  TRAININGS: 'Trainings', ATTENDANCE: 'Attendance', FEEDBACK: 'Feedback',
  FB_TEMPLATES: 'FeedbackTemplates', EXAM_QS: 'ExamQuestions',
  EXAM_RESULTS: 'ExamResults', PHOTOS: 'Photos'
};

// ── CORS headers for GitHub hosted frontend ──
function setCORSHeaders(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var params = e.parameter || {};
  var action = params.action || '';
  var result = {};

  try {
    switch (action) {
      case 'login':           result = login(params.email, params.password); break;
      case 'getTrainings':    result = { success:true, data: getTrainings(params.role, params.dept) }; break;
      case 'getTraining':     result = { success:true, data: getTraining(params.trainingId) }; break;
      case 'saveTraining':    result = saveTraining(JSON.parse(params.data||'{}')||params); break;
      case 'updateTrainingStatus': result = updateTrainingStatus(params.trainingId, params.status); break;
      case 'deleteTraining':  result = deleteTraining(params.trainingId); break;
      case 'getEmployees':    result = { success:true, data: getEmployees(params.dept) }; break;
      case 'saveEmployee':    result = saveEmployee(params); break;
      case 'deleteEmployee':  result = deleteEmployee(params.empId); break;
      case 'lookupEmployee':  result = { success:true, data: lookupEmployee(params.empId) }; break;
      case 'markAttendance':  result = markAttendance(params.trainingId, params.employeeId); break;
      case 'getAttendance':   result = { success:true, data: getAttendance(params.trainingId) }; break;
      case 'getUsers':        result = { success:true, data: getUsers() }; break;
      case 'saveUser':        result = saveUser(params); break;
      case 'deleteUser':      result = deleteUser(params.userId); break;
      case 'getDepartments':  result = { success:true, data: getDepartments() }; break;
      case 'saveDepartment':  result = saveDepartment(params); break;
      case 'getFeedbackTemplates': result = { success:true, data: getFeedbackTemplates() }; break;
      case 'getTrainingFeedbackTemplate': result = { success:true, data: getTrainingFeedbackTemplate(params.trainingId) }; break;
      case 'saveFeedbackTemplate': result = saveFeedbackTemplate(params); break;
      case 'deleteFeedbackTemplate': result = deleteFeedbackTemplate(params.templateId); break;
      case 'submitFeedback':  result = submitFeedback(params); break;
      case 'getFeedback':     result = { success:true, data: getFeedback(params.trainingId) }; break;
      case 'saveExamQuestions': result = saveExamQuestions(params.trainingId, params.examType, JSON.parse(params.questions||'[]')); break;
      case 'getExamQuestions': result = { success:true, data: getExamQuestions(params.trainingId, params.examType) }; break;
      case 'submitExam':      result = submitExam(params); break;
      case 'getTrainingReport': result = { success:true, data: getTrainingReport(params.trainingId) }; break;
      case 'sendManualHREmail': result = sendManualHREmail(params.trainingId); break;
      case 'getCertificateData': result = getCertificateData(params.trainingId, params.employeeId); break;
      case 'uploadPhoto':     result = uploadPhoto(params.trainingId, params.base64Data, params.fileName, params.mimeType); break;
      case 'getTrainingPhotos': result = { success:true, data: getTrainingPhotos(params.trainingId) }; break;
      case 'setup':           result = setupSheets(); break;
      default:                result = { success:false, message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, message: 'Server error: ' + err.toString() };
    Logger.log('Error in action ' + action + ': ' + err.toString());
  }

  var output = ContentService.createTextOutput(JSON.stringify(result));
  return setCORSHeaders(output);
}

// ============================================================
// SETUP
// ============================================================
function setupSheets() {
  var ss = getSpreadsheet();
  var configs = [
    { name:SHEETS.EMPLOYEES,    headers:['EmployeeID','Name','Department','Designation','Email','Phone','Manager','Active','CreatedDate'] },
    { name:SHEETS.DEPARTMENTS,  headers:['DeptID','DeptName','HeadName','Active'] },
    { name:SHEETS.USERS,        headers:['UserID','Name','Email','Role','Department','PasswordHash','Active','LastLogin'] },
    { name:SHEETS.TRAININGS,    headers:['TrainingID','Title','Department','Subject','Venue','TrainerName','StartDate','StartTime','EndTime','Status','CreatedBy','ExpectedAttendees','PreExamRequired','PostExamRequired','ShowExamResults','CertificateEnabled','Description','CreatedDate','CompletedDate','HRNotified','FeedbackTemplateID'] },
    { name:SHEETS.ATTENDANCE,   headers:['AttID','TrainingID','EmployeeID','EmployeeName','Department','Designation','Timestamp','MarkedBy'] },
    { name:SHEETS.FEEDBACK,     headers:['FBID','TrainingID','EmployeeID','EmployeeName','TemplateID','Responses','TrainerRating','OverallRating','Comments','Timestamp'] },
    { name:SHEETS.FB_TEMPLATES, headers:['TemplateID','TemplateName','Questions','CreatedBy','Active','CreatedDate'] },
    { name:SHEETS.EXAM_QS,      headers:['QID','TrainingID','ExamType','Question','OptionA','OptionB','OptionC','OptionD','CorrectOption','Marks','Order'] },
    { name:SHEETS.EXAM_RESULTS, headers:['ResultID','TrainingID','EmployeeID','EmployeeName','ExamType','Score','MaxScore','Percentage','Answers','SubmittedAt'] },
    { name:SHEETS.PHOTOS,       headers:['PhotoID','TrainingID','DriveFileID','FileName','UploadedBy','UploadedAt'] }
  ];

  configs.forEach(function(cfg) {
    var sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
      sheet.getRange(1,1,1,cfg.headers.length).setValues([cfg.headers])
        .setBackground('#1a73e8').setFontColor('#fff').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  // Default super admin
  var usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (usersSheet.getLastRow() <= 1) {
    usersSheet.appendRow(['USR001','Super Admin','admin@hospital.com','superadmin','ALL',hashPwd('Admin@123'),'TRUE','']);
  }

  // Default departments
  var deptSheet = ss.getSheetByName(SHEETS.DEPARTMENTS);
  if (deptSheet.getLastRow() <= 1) {
    [['D001','Emergency','','TRUE'],['D002','Cardiology','','TRUE'],['D003','Nursing','','TRUE'],
     ['D004','ICU','','TRUE'],['D005','Radiology','','TRUE'],['D006','Laboratory','','TRUE'],
     ['D007','Pharmacy','','TRUE'],['D008','Administration','','TRUE']
    ].forEach(function(r){ deptSheet.appendRow(r); });
  }

  // Default feedback template
  var tmplSheet = ss.getSheetByName(SHEETS.FB_TEMPLATES);
  if (tmplSheet.getLastRow() <= 1) {
    var defaultTmpl = JSON.stringify([
      {type:'rating',label:'How would you rate the training content?'},
      {type:'rating',label:'Was the training well-organized and structured?'},
      {type:'scale',label:'Rate the training venue and facilities (1=Poor, 5=Excellent)'},
      {type:'mcq',label:'How was the duration of the training?',options:['Too Short','Just Right','Too Long']},
      {type:'text',label:'What was the most useful part of this training?'},
      {type:'text',label:'Suggestions for improvement?'}
    ]);
    tmplSheet.appendRow(['TMPL001','Standard Training Feedback',defaultTmpl,'admin@hospital.com','TRUE',new Date().toISOString()]);
  }

  return { success:true, message:'Setup complete! Login: admin@hospital.com / Admin@123' };
}

// ============================================================
// AUTH
// ============================================================
function login(email, password) {
  var sheet = getSpreadsheet().getSheetByName(SHEETS.USERS);
  var data  = sheetData(sheet);
  var hash  = hashPwd(password);
  for (var i=0; i<data.length; i++) {
    var r = data[i];
    if (r.Email === email && r.PasswordHash === hash && r.Active === 'TRUE') {
      sheet.getRange(i+2,8).setValue(new Date().toISOString());
      return { success:true, user:{ id:r.UserID, name:r.Name, email:r.Email, role:r.Role, department:r.Department } };
    }
  }
  return { success:false, message:'Invalid email or password.' };
}

function hashPwd(p) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, p);
  return b.map(function(x){ return (x<0?x+256:x).toString(16).padStart(2,'0'); }).join('');
}

// ============================================================
// USERS
// ============================================================
function getUsers() {
  return sheetData(getSpreadsheet().getSheetByName(SHEETS.USERS))
    .filter(function(u){ return u.Active==='TRUE'; })
    .map(function(u){ return {id:u.UserID,name:u.Name,email:u.Email,role:u.Role,department:u.Department,active:u.Active}; });
}

function saveUser(p) {
  var sheet = getSpreadsheet().getSheetByName(SHEETS.USERS);
  var data  = sheetData(sheet);
  if (p.id) {
    for (var i=0;i<data.length;i++) {
      if (data[i].UserID===p.id) {
        sheet.getRange(i+2,2).setValue(p.name);
        sheet.getRange(i+2,3).setValue(p.email);
        sheet.getRange(i+2,4).setValue(p.role);
        sheet.getRange(i+2,5).setValue(p.department);
        if (p.newPassword) sheet.getRange(i+2,6).setValue(hashPwd(p.newPassword));
        return { success:true };
      }
    }
  } else {
    var id='USR'+String(Date.now()).slice(-6);
    sheet.appendRow([id,p.name,p.email,p.role,p.department,hashPwd(p.password||'Welcome@123'),'TRUE','']);
    return { success:true, id:id, defaultPassword:'Welcome@123' };
  }
  return { success:false };
}

function deleteUser(userId) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.USERS);
  var data=sheetData(sheet);
  for(var i=0;i<data.length;i++){if(data[i].UserID===userId){sheet.getRange(i+2,7).setValue('FALSE');return{success:true};}}
  return{success:false};
}

// ============================================================
// EMPLOYEES
// ============================================================
function getEmployees(dept) {
  var data = sheetData(getSpreadsheet().getSheetByName(SHEETS.EMPLOYEES));
  if (dept) data = data.filter(function(e){return e.Department===dept&&e.Active==='TRUE';});
  return data;
}

function saveEmployee(p) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.EMPLOYEES);
  var data=sheetData(sheet);
  var existing=data.find(function(e){return e.EmployeeID===p.EmployeeID;});
  if (existing&&p.EmployeeID) {
    for(var i=0;i<data.length;i++){
      if(data[i].EmployeeID===p.EmployeeID){
        sheet.getRange(i+2,1,1,9).setValues([[p.EmployeeID,p.Name,p.Department,p.Designation,p.Email||'',p.Phone||'',p.Manager||'','TRUE',data[i].CreatedDate]]);
        return{success:true};
      }
    }
  } else {
    var newId=p.EmployeeID||('EMP'+String(data.length+1).padStart(4,'0'));
    sheet.appendRow([newId,p.Name,p.Department,p.Designation,p.Email||'',p.Phone||'',p.Manager||'','TRUE',new Date().toISOString()]);
    return{success:true,id:newId};
  }
}

function deleteEmployee(empId) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.EMPLOYEES);
  var data=sheetData(sheet);
  for(var i=0;i<data.length;i++){if(data[i].EmployeeID===empId){sheet.getRange(i+2,8).setValue('FALSE');return{success:true};}}
  return{success:false};
}

function lookupEmployee(empId) {
  var data=sheetData(getSpreadsheet().getSheetByName(SHEETS.EMPLOYEES));
  return data.find(function(e){return e.EmployeeID===empId&&e.Active==='TRUE';})||null;
}

// ============================================================
// DEPARTMENTS
// ============================================================
function getDepartments() {
  return sheetData(getSpreadsheet().getSheetByName(SHEETS.DEPARTMENTS)).filter(function(d){return d.Active==='TRUE';});
}

function saveDepartment(p) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.DEPARTMENTS);
  var data=sheetData(sheet);
  if (p.DeptID) {
    for(var i=0;i<data.length;i++){if(data[i].DeptID===p.DeptID){sheet.getRange(i+2,1,1,4).setValues([[p.DeptID,p.DeptName,p.HeadName||'','TRUE']]);return{success:true};}}
  } else {
    var id='D'+String(Date.now()).slice(-4);
    sheet.appendRow([id,p.DeptName,p.HeadName||'','TRUE']);
    return{success:true,id:id};
  }
}

// ============================================================
// TRAININGS
// ============================================================
function getTrainings(role, dept) {
  var data=sheetData(getSpreadsheet().getSheetByName(SHEETS.TRAININGS));
  if (role==='organiser') return data.filter(function(t){return t.Department===dept||t.CreatedBy===dept;});
  return data;
}

function getTraining(id) {
  var data=sheetData(getSpreadsheet().getSheetByName(SHEETS.TRAININGS));
  return data.find(function(t){return t.TrainingID===id;})||null;
}

function saveTraining(p) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.TRAININGS);
  var data=sheetData(sheet);
  if (p.TrainingID) {
    for(var i=0;i<data.length;i++){
      if(data[i].TrainingID===p.TrainingID){
        sheet.getRange(i+2,1,1,21).setValues([[
          p.TrainingID,p.Title,p.Department,p.Subject,p.Venue,p.TrainerName,
          p.StartDate,p.StartTime,p.EndTime,p.Status||data[i].Status,
          p.CreatedBy,p.ExpectedAttendees,p.PreExamRequired,p.PostExamRequired,
          p.ShowExamResults,p.CertificateEnabled,p.Description,
          data[i].CreatedDate,data[i].CompletedDate||'',data[i].HRNotified||'',p.FeedbackTemplateID||''
        ]]);
        return{success:true,id:p.TrainingID};
      }
    }
  } else {
    var id='TRN'+new Date().getFullYear()+String(Date.now()).slice(-5);
    sheet.appendRow([id,p.Title,p.Department,p.Subject,p.Venue,p.TrainerName,
      p.StartDate,p.StartTime||'',p.EndTime||'','Scheduled',p.CreatedBy,p.ExpectedAttendees||0,
      p.PreExamRequired||'FALSE',p.PostExamRequired||'FALSE',p.ShowExamResults||'FALSE',
      p.CertificateEnabled||'FALSE',p.Description||'',new Date().toISOString(),'','',p.FeedbackTemplateID||'']);
    return{success:true,id:id};
  }
  return{success:false};
}

function updateTrainingStatus(trainingId, status) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.TRAININGS);
  var data=sheetData(sheet);
  for(var i=0;i<data.length;i++){
    if(data[i].TrainingID===trainingId){
      sheet.getRange(i+2,10).setValue(status);
      if(status==='Completed'){
        sheet.getRange(i+2,19).setValue(new Date().toISOString());
        sendHREmail(trainingId,data[i]);
        sheet.getRange(i+2,20).setValue('TRUE');
      }
      return{success:true};
    }
  }
  return{success:false};
}

function deleteTraining(trainingId) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.TRAININGS);
  var data=sheetData(sheet);
  for(var i=0;i<data.length;i++){if(data[i].TrainingID===trainingId){sheet.deleteRow(i+2);return{success:true};}}
  return{success:false};
}

// ============================================================
// ATTENDANCE
// ============================================================
function markAttendance(trainingId, employeeId) {
  var training=getTraining(trainingId);
  if(!training) return{success:false,message:'Training not found.'};
  if(training.Status!=='Active') return{success:false,message:'Attendance is closed. Training is '+training.Status+'.'};
  var emp=lookupEmployee(employeeId);
  if(!emp) return{success:false,message:'Employee ID not found. Please check your ID.'};
  var sheet=getSpreadsheet().getSheetByName(SHEETS.ATTENDANCE);
  var existing=sheetData(sheet).find(function(a){return a.TrainingID===trainingId&&a.EmployeeID===employeeId;});
  if(existing) return{success:false,message:'Attendance already marked for this training.',employee:emp};
  sheet.appendRow(['ATT'+String(Date.now()).slice(-8),trainingId,employeeId,emp.Name,emp.Department,emp.Designation,new Date().toISOString(),'QR']);
  return{success:true,message:'Attendance marked successfully!',employee:{name:emp.Name,dept:emp.Department,desig:emp.Designation}};
}

function getAttendance(trainingId) {
  return sheetData(getSpreadsheet().getSheetByName(SHEETS.ATTENDANCE)).filter(function(a){return a.TrainingID===trainingId;});
}

// ============================================================
// FEEDBACK TEMPLATES
// ============================================================
function getFeedbackTemplates() {
  return sheetData(getSpreadsheet().getSheetByName(SHEETS.FB_TEMPLATES)).filter(function(t){return t.Active==='TRUE';});
}

function getTrainingFeedbackTemplate(trainingId) {
  var t=getTraining(trainingId);
  var tmpls=getFeedbackTemplates();
  if(t&&t.FeedbackTemplateID) return tmpls.find(function(x){return x.TemplateID===t.FeedbackTemplateID;})||tmpls[0]||null;
  return tmpls[0]||null;
}

function saveFeedbackTemplate(p) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.FB_TEMPLATES);
  var data=sheetData(sheet);
  var qs=typeof p.questions==='string'?p.questions:JSON.stringify(p.questions||[]);
  if(p.TemplateID){
    for(var i=0;i<data.length;i++){if(data[i].TemplateID===p.TemplateID){sheet.getRange(i+2,1,1,6).setValues([[p.TemplateID,p.TemplateName,qs,p.CreatedBy,'TRUE',data[i].CreatedDate]]);return{success:true};}}
  } else {
    var id='TMPL'+String(Date.now()).slice(-6);
    sheet.appendRow([id,p.TemplateName,qs,p.CreatedBy,'TRUE',new Date().toISOString()]);
    return{success:true,id:id};
  }
}

function deleteFeedbackTemplate(templateId) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.FB_TEMPLATES);
  var data=sheetData(sheet);
  for(var i=0;i<data.length;i++){if(data[i].TemplateID===templateId){sheet.getRange(i+2,5).setValue('FALSE');return{success:true};}}
  return{success:false};
}

// ============================================================
// FEEDBACK SUBMISSION
// ============================================================
function submitFeedback(p) {
  var training=getTraining(p.trainingId);
  if(!training) return{success:false,message:'Training not found.'};
  var emp=lookupEmployee(p.employeeId);
  if(!emp) return{success:false,message:'Employee ID not found.'};
  var fbSheet=getSpreadsheet().getSheetByName(SHEETS.FEEDBACK);
  if(sheetData(fbSheet).find(function(f){return f.TrainingID===p.trainingId&&f.EmployeeID===p.employeeId;}))
    return{success:false,message:'Feedback already submitted for this training.'};
  var attData=sheetData(getSpreadsheet().getSheetByName(SHEETS.ATTENDANCE));
  if(!attData.find(function(a){return a.TrainingID===p.trainingId&&a.EmployeeID===p.employeeId;}))
    return{success:false,message:'Please mark your attendance first before submitting feedback.'};
  fbSheet.appendRow(['FB'+String(Date.now()).slice(-8),p.trainingId,p.employeeId,emp.Name,p.templateId||'',p.responses||'{}',p.trainerRating,p.overallRating,p.comments||'',new Date().toISOString()]);
  return{success:true,message:'Feedback submitted successfully! Thank you.'};
}

function getFeedback(trainingId) {
  return sheetData(getSpreadsheet().getSheetByName(SHEETS.FEEDBACK)).filter(function(f){return f.TrainingID===trainingId;});
}

// ============================================================
// EXAMS
// ============================================================
function saveExamQuestions(trainingId, examType, questions) {
  var sheet=getSpreadsheet().getSheetByName(SHEETS.EXAM_QS);
  var data=sheetData(sheet);
  for(var i=data.length-1;i>=0;i--){if(data[i].TrainingID===trainingId&&data[i].ExamType===examType)sheet.deleteRow(i+2);}
  questions.forEach(function(q,idx){
    sheet.appendRow(['Q'+String(Date.now()).slice(-5)+idx,trainingId,examType,q.question,q.optionA,q.optionB,q.optionC,q.optionD,q.correct,q.marks||1,idx+1]);
  });
  return{success:true};
}

function getExamQuestions(trainingId, examType) {
  return sheetData(getSpreadsheet().getSheetByName(SHEETS.EXAM_QS))
    .filter(function(q){return q.TrainingID===trainingId&&q.ExamType===examType;})
    .sort(function(a,b){return parseInt(a.Order)-parseInt(b.Order);});
}

function submitExam(p) {
  var training=getTraining(p.trainingId);
  if(!training) return{success:false,message:'Training not found.'};
  var emp=lookupEmployee(p.employeeId);
  if(!emp) return{success:false,message:'Employee ID not found.'};
  var resSheet=getSpreadsheet().getSheetByName(SHEETS.EXAM_RESULTS);
  if(sheetData(resSheet).find(function(r){return r.TrainingID===p.trainingId&&r.EmployeeID===p.employeeId&&r.ExamType===p.examType;}))
    return{success:false,message:'You have already submitted this exam.'};
  var questions=getExamQuestions(p.trainingId,p.examType);
  var answers=typeof p.answers==='string'?JSON.parse(p.answers):p.answers;
  var score=0,maxScore=0,details=[];
  questions.forEach(function(q){
    var m=parseInt(q.Marks)||1; maxScore+=m;
    var given=answers[q.QID]||'';
    var correct=given===q.CorrectOption;
    if(correct) score+=m;
    details.push({qid:q.QID,given:given,correct:q.CorrectOption,isCorrect:correct,marks:m});
  });
  var pct=maxScore>0?Math.round((score/maxScore)*100):0;
  resSheet.appendRow(['RES'+String(Date.now()).slice(-8),p.trainingId,p.employeeId,emp.Name,p.examType,score,maxScore,pct,JSON.stringify(details),new Date().toISOString()]);
  var showResults=training.ShowExamResults==='TRUE';
  return{success:true,message:'Exam submitted!',score:showResults?score:null,maxScore:showResults?maxScore:null,percentage:showResults?pct:null,showResults:showResults,details:showResults?details:null};
}

// ============================================================
// REPORTS
// ============================================================
function getTrainingReport(trainingId) {
  var t=getTraining(trainingId);
  if(!t) return null;
  var att=getAttendance(trainingId);
  var fb=getFeedback(trainingId);
  var allResults=sheetData(getSpreadsheet().getSheetByName(SHEETS.EXAM_RESULTS)).filter(function(r){return r.TrainingID===trainingId;});
  var pre=allResults.filter(function(r){return r.ExamType==='pre';});
  var post=allResults.filter(function(r){return r.ExamType==='post';});
  return{
    training:t,attendance:att,feedback:fb,preExamResults:pre,postExamResults:post,photos:getTrainingPhotos(trainingId),
    stats:{
      totalAttendees:att.length,totalFeedback:fb.length,
      avgRating:fb.length?(fb.reduce(function(s,f){return s+(parseFloat(f.OverallRating)||0);},0)/fb.length).toFixed(1):'N/A',
      avgTrainerRating:fb.length?(fb.reduce(function(s,f){return s+(parseFloat(f.TrainerRating)||0);},0)/fb.length).toFixed(1):'N/A'
    }
  };
}

// ============================================================
// HR EMAIL
// ============================================================
function sendHREmail(trainingId, training) {
  try {
    var hrUsers=sheetData(getSpreadsheet().getSheetByName(SHEETS.USERS)).filter(function(u){return u.Role==='hr'&&u.Active==='TRUE';});
    if(!hrUsers.length) return;
    var att=getAttendance(trainingId);
    var subject='✅ Training Completed: '+training.Title+' — '+training.StartDate;
    var rows=att.map(function(a){return'<tr><td>'+a.EmployeeID+'</td><td>'+a.EmployeeName+'</td><td>'+a.Department+'</td><td>'+a.Designation+'</td></tr>';}).join('');
    var body='<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">'
      +'<div style="background:linear-gradient(135deg,#00c9b1,#7c3aed);padding:24px;border-radius:12px 12px 0 0;color:#fff">'
      +'<h2 style="margin:0;font-size:20px">🏥 Training Completion Report</h2></div>'
      +'<div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:none">'
      +'<table style="width:100%;margin-bottom:16px;border-collapse:collapse"><tr>'
      +'<td style="padding:8px 0"><strong>Training:</strong> '+training.Title+'</td>'
      +'<td style="padding:8px 0"><strong>Date:</strong> '+training.StartDate+'</td></tr><tr>'
      +'<td><strong>Department:</strong> '+training.Department+'</td>'
      +'<td><strong>Venue:</strong> '+training.Venue+'</td></tr><tr>'
      +'<td><strong>Trainer:</strong> '+training.TrainerName+'</td>'
      +'<td><strong>Attendees:</strong> <span style="color:#00c9b1;font-weight:bold">'+att.length+'</span></td></tr></table>'
      +'<h3 style="margin-bottom:10px">Attendance List</h3>'
      +'<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8f9fa">'
      +'<th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Emp ID</th>'
      +'<th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Name</th>'
      +'<th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Department</th>'
      +'<th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Designation</th></tr></thead>'
      +'<tbody>'+rows+'</tbody></table>'
      +'</div><div style="padding:12px 24px;background:#f8f9fa;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8">'
      +'Auto-generated by MedTrain Hospital Training Management System</div></div>';
    hrUsers.forEach(function(hr){ GmailApp.sendEmail(hr.Email,subject,'',{htmlBody:body,name:'MedTrain System'}); });
  } catch(e){ Logger.log('Email error: '+e.toString()); }
}

function sendManualHREmail(trainingId) {
  var t=getTraining(trainingId);
  if(!t) return{success:false,message:'Training not found.'};
  sendHREmail(trainingId,t);
  return{success:true,message:'Email sent to HR successfully.'};
}

// ============================================================
// PHOTOS
// ============================================================
function uploadPhoto(trainingId, base64Data, fileName, mimeType) {
  var folder=getOrCreateFolder(trainingId);
  var blob=Utilities.newBlob(Utilities.base64Decode(base64Data),mimeType,fileName);
  var file=folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  var sheet=getSpreadsheet().getSheetByName(SHEETS.PHOTOS);
  sheet.appendRow(['PHO'+String(Date.now()).slice(-8),trainingId,file.getId(),fileName,Session.getActiveUser().getEmail(),new Date().toISOString()]);
  return{success:true,fileId:file.getId(),url:file.getUrl()};
}

function getTrainingPhotos(trainingId) {
  return sheetData(getSpreadsheet().getSheetByName(SHEETS.PHOTOS))
    .filter(function(p){return p.TrainingID===trainingId;})
    .map(function(p){return{id:p.PhotoID,fileId:p.DriveFileID,name:p.FileName,url:'https://drive.google.com/file/d/'+p.DriveFileID+'/view',thumb:'https://drive.google.com/thumbnail?id='+p.DriveFileID+'&sz=w200'};});
}

function getOrCreateFolder(trainingId) {
  var folders=DriveApp.getFoldersByName(DRIVE_FOLDER);
  var parent=folders.hasNext()?folders.next():DriveApp.createFolder(DRIVE_FOLDER);
  var subs=parent.getFoldersByName('Training_'+trainingId);
  return subs.hasNext()?subs.next():parent.createFolder('Training_'+trainingId);
}

// ============================================================
// CERTIFICATE
// ============================================================
function getCertificateData(trainingId, employeeId) {
  var t=getTraining(trainingId);
  if(!t||t.CertificateEnabled!=='TRUE') return{success:false,message:'Certificate not enabled.'};
  var att=getAttendance(trainingId);
  if(!att.find(function(a){return a.EmployeeID===employeeId;})) return{success:false,message:'No attendance record found.'};
  var emp=lookupEmployee(employeeId);
  return{success:true,data:{employeeName:emp.Name,employeeID:employeeId,designation:emp.Designation,department:emp.Department,trainingTitle:t.Title,subject:t.Subject,trainerName:t.TrainerName,venue:t.Venue,date:t.StartDate}};
}

// ============================================================
// UTILITIES
// ============================================================
function getSpreadsheet() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheetData(sheet) {
  if (!sheet||sheet.getLastRow()<=1) return [];
  var vals=sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();
  var hdrs=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  return vals.map(function(row){
    var obj={}; hdrs.forEach(function(h,i){obj[h]=row[i]!==undefined?String(row[i]):'';});
    return obj;
  });
}
