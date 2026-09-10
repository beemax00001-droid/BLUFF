let token=localStorage.getItem('fg_token');
let timerSeconds=1500, timerId=null, timerRunning=false, timerStartedAt=null;

function api(path, options={}) {
  options.headers={...(options.headers||{}), 'Content-Type':'application/json'};
  if(token) options.headers.Authorization='Bearer '+token;
  return fetch(path,options).then(async r=>{
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||'خطا');
    return d;
  });
}
function showTab(id){
  document.querySelectorAll('.tab').forEach(x=>x.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  if(id==='home') loadDashboard();
  if(id==='exams') loadExams();
  if(id==='tasks') loadTasks();
  if(id==='lock') loadLocks();
  if(id==='report') loadReport();
}
async function login(){
  try{
    const d=await api('/api/login',{method:'POST',body:JSON.stringify({
      username:username.value,password:password.value
    })});
    token=d.token;localStorage.setItem('fg_token',token);
    document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');showTab('home');
  }catch(e){alert(e.message)}
}
function logout(){localStorage.removeItem('fg_token');location.reload()}
async function loadDashboard(){
  const d=await api('/api/dashboard');
  studyMin.textContent=d.studyMinutes;
  taskStat.textContent=`${d.tasks.completed}/${d.tasks.total}`;
  lockStat.textContent=d.restrictions.length;
  let score=Math.min(100,50+Math.min(30,d.studyMinutes/4)+(d.tasks.total?Math.round(20*d.tasks.completed/d.tasks.total):0));
  focusScore.textContent=Math.round(score);
  examHint.textContent=d.nextExam?`امتحان بعدی: ${d.nextExam.subject||''} — ${d.nextExam.title}`:'هنوز امتحانی ثبت نکرده‌ای.';
}
async function loadExams(){
  const list=await api('/api/exams'); examList.innerHTML='';
  list.forEach(e=>{
    const dt=new Date(e.exam_at).toLocaleString('fa-IR');
    examList.innerHTML+=`<div class="item"><div><b>${esc(e.title)}</b><div class="muted">${esc(e.subject||'')} · ${dt} · ${e.pages||0} صفحه</div></div><button class="secondary" onclick="deleteExam(${e.id})">حذف</button></div>`;
  });
  if(!list.length) examList.innerHTML='<div class="card muted">هنوز امتحانی ثبت نشده.</div>';
}
async function addExam(){
  const title=prompt('نام امتحان:'); if(!title)return;
  const subject=prompt('درس:')||'';
  const date=prompt('زمان امتحان (مثلاً 2026-09-20T09:00):'); if(!date)return;
  const pages=prompt('تعداد صفحات باقی‌مانده:','100')||0;
  await api('/api/exams',{method:'POST',body:JSON.stringify({title,subject,exam_at:date,pages,difficulty:3})});
  loadExams();
}
async function deleteExam(id){await api('/api/exams/'+id,{method:'DELETE'});loadExams()}
async function loadTasks(){
  const list=await api('/api/tasks');taskList.innerHTML='';
  list.forEach(t=>taskList.innerHTML+=`<div class="item"><div><b>${esc(t.title)}</b><div class="muted">${t.minutes} دقیقه</div></div><button onclick="toggleTask(${t.id},${t.completed?0:1})">${t.completed?'✓ انجام شد':'انجام شد'}</button></div>`);
  if(!list.length) taskList.innerHTML='<div class="card muted">برنامه‌ای برای امروز نیست.</div>';
}
async function addTask(){
  const title=prompt('وظیفه مطالعه:');if(!title)return;
  const minutes=prompt('چند دقیقه؟','25')||25;
  await api('/api/tasks',{method:'POST',body:JSON.stringify({title,minutes})});loadTasks();
}
async function toggleTask(id,v){await api('/api/tasks/'+id,{method:'PATCH',body:JSON.stringify({completed:v})});loadTasks();loadDashboard()}
function renderTimer(){const m=String(Math.floor(timerSeconds/60)).padStart(2,'0'),s=String(timerSeconds%60).padStart(2,'0');document.getElementById('timer').textContent=`${m}:${s}`}
function setTimer(min){pauseTimer();timerSeconds=min*60;renderTimer();timerState.textContent='آماده‌ای؟'}
function startTimer(){
  if(timerRunning)return;timerRunning=true;timerStartedAt=new Date();
  timerState.textContent='در حال تمرکز...';
  timerId=setInterval(async()=>{
    timerSeconds--;renderTimer();
    if(timerSeconds<=0){clearInterval(timerId);timerRunning=false;timerState.textContent='آفرین! جلسه کامل شد 🎉';await api('/api/study-sessions',{method:'POST',body:JSON.stringify({minutes:Math.round((Date.now()-timerStartedAt.getTime())/60000),started_at:timerStartedAt.toISOString(),ended_at:new Date().toISOString()})});loadDashboard()}
  },1000)
}
function pauseTimer(){if(timerId)clearInterval(timerId);timerRunning=false;timerState.textContent='متوقف شد'}
function resetTimer(){pauseTimer();timerSeconds=1500;renderTimer();timerState.textContent='آماده‌ای؟'}
async function createLock(){
  const body={app_name:appName.value,app_package:appPackage.value,starts_at:new Date(startAt.value).toISOString(),ends_at:new Date(endAt.value).toISOString()};
  await api('/api/restrictions',{method:'POST',body:JSON.stringify(body)});loadLocks();
}
async function loadLocks(){
  const list=await api('/api/restrictions');lockList.innerHTML='';
  list.forEach(x=>lockList.innerHTML+=`<div class="item"><div><b>🔒 ${esc(x.app_name)}</b><div class="muted">${new Date(x.starts_at).toLocaleString('fa-IR')} تا ${new Date(x.ends_at).toLocaleString('fa-IR')}</div></div>${x.active?`<button onclick="cancelLock(${x.id})">لغو محدودیت</button>`:'<span>لغو شده</span>'}</div>`);
  if(!list.length)lockList.innerHTML='<div class="muted">محدودیتی وجود ندارد.</div>';
}
async function cancelLock(id){if(!confirm('مطمئنی می‌خواهی محدودیت را لغو کنی؟'))return;await api('/api/restrictions/'+id+'/cancel',{method:'POST'});loadLocks();loadDashboard()}
async function requestOtp(){
  const d=await api('/api/otp/request',{method:'POST'});
  otpBox.innerHTML=`<div class="card"><b>کد آزمایشی: ${d.demoCode}</b><br><small>اعتبار تا ${new Date(d.expires_at).toLocaleTimeString('fa-IR')}</small></div>`;
}
async function loadReport(){
  const d=await api('/api/report/weekly');
  reportBox.innerHTML=`<div><span>مطالعه</span><b>${d.studyMinutes}</b><small>دقیقه</small></div><div><span>وظایف</span><b>${d.tasks.completed}/${d.tasks.total}</b><small>تکمیل شده</small></div><div><span>برنامه‌های قفل</span><b>${d.restrictionPlans}</b><small>در ۷ روز اخیر</small></div>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
renderTimer();
if(token){document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');showTab('home')}
