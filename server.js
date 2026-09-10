import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

function now() { return new Date().toISOString(); }

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({error:'Unauthorized'});
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({error:'Invalid session'});
  }
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

app.post('/api/login', (req,res)=>{
  const {username,password} = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username,password);
  if (!user) return res.status(401).json({error:'Invalid username or password'});
  const token = jwt.sign({id:user.id, username:user.username}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token, user:{id:user.id,username:user.username}});
});

app.get('/api/dashboard', auth, (req,res)=>{
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0,10);
  const study = db.prepare('SELECT COALESCE(SUM(minutes),0) total FROM study_sessions WHERE user_id=? AND date(started_at)=?').get(userId,today).total;
  const tasks = db.prepare('SELECT COUNT(*) total, COALESCE(SUM(completed),0) completed FROM tasks WHERE user_id=? AND day=?').get(userId,today);
  const nextExam = db.prepare('SELECT * FROM exams WHERE user_id=? AND exam_at >= ? ORDER BY exam_at LIMIT 1').get(userId,now());
  const restrictions = db.prepare('SELECT * FROM restrictions WHERE user_id=? AND active=1 ORDER BY ends_at').all(userId);
  res.json({studyMinutes:study,tasks,nextExam,restrictions});
});

app.get('/api/exams', auth, (req,res)=>{
  res.json(db.prepare('SELECT * FROM exams WHERE user_id=? ORDER BY exam_at').all(req.user.id));
});

app.post('/api/exams', auth, (req,res)=>{
  const {title,subject,exam_at,pages,difficulty} = req.body || {};
  if (!title || !exam_at) return res.status(400).json({error:'title and exam_at required'});
  const r = db.prepare(`INSERT INTO exams(user_id,title,subject,exam_at,pages,difficulty,created_at)
    VALUES(?,?,?,?,?,?,?)`).run(req.user.id,title,subject||'',exam_at,Number(pages)||0,Number(difficulty)||3,now());
  res.json({id:r.lastInsertRowid});
});

app.delete('/api/exams/:id', auth, (req,res)=>{
  db.prepare('DELETE FROM exams WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

app.get('/api/tasks', auth, (req,res)=>{
  const day = req.query.day || new Date().toISOString().slice(0,10);
  res.json(db.prepare('SELECT * FROM tasks WHERE user_id=? AND day=? ORDER BY id').all(req.user.id,day));
});

app.post('/api/tasks', auth, (req,res)=>{
  const {title,minutes,day} = req.body || {};
  if (!title) return res.status(400).json({error:'title required'});
  const d = day || new Date().toISOString().slice(0,10);
  const r = db.prepare('INSERT INTO tasks(user_id,title,minutes,day,created_at) VALUES(?,?,?,?,?)')
    .run(req.user.id,title,Number(minutes)||25,d,now());
  res.json({id:r.lastInsertRowid});
});

app.patch('/api/tasks/:id', auth, (req,res)=>{
  const {completed} = req.body || {};
  db.prepare('UPDATE tasks SET completed=? WHERE id=? AND user_id=?')
    .run(completed?1:0,req.params.id,req.user.id);
  res.json({ok:true});
});

app.post('/api/study-sessions', auth, (req,res)=>{
  const {minutes,started_at,ended_at} = req.body || {};
  db.prepare('INSERT INTO study_sessions(user_id,minutes,started_at,ended_at) VALUES(?,?,?,?)')
    .run(req.user.id,Number(minutes)||0,started_at||now(),ended_at||now());
  res.json({ok:true});
});

app.get('/api/restrictions', auth, (req,res)=>{
  res.json(db.prepare('SELECT * FROM restrictions WHERE user_id=? ORDER BY starts_at DESC').all(req.user.id));
});

app.post('/api/restrictions', auth, (req,res)=>{
  const {app_package,app_name,starts_at,ends_at} = req.body || {};
  if (!app_package || !app_name || !starts_at || !ends_at)
    return res.status(400).json({error:'missing fields'});
  const r = db.prepare(`INSERT INTO restrictions(user_id,app_package,app_name,starts_at,ends_at,active,created_at)
    VALUES(?,?,?,?,?,1,?)`).run(req.user.id,app_package,app_name,starts_at,ends_at,now());
  res.json({id:r.lastInsertRowid});
});

app.post('/api/restrictions/:id/cancel', auth, (req,res)=>{
  db.prepare('UPDATE restrictions SET active=0 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

app.post('/api/otp/request', auth, (req,res)=>{
  const code = String(crypto.randomInt(100000,999999));
  const expires = new Date(Date.now()+5*60*1000).toISOString();
  db.prepare('INSERT INTO otps(user_id,code_hash,expires_at,created_at) VALUES(?,?,?,?)')
    .run(req.user.id,hashCode(code),expires,now());
  // Demo: returning the OTP makes local testing easy. Production should deliver it
  // through a trusted channel and never return it from the API.
  res.json({demoCode:code,expires_at:expires});
});

app.post('/api/otp/verify', auth, (req,res)=>{
  const {code} = req.body || {};
  const row = db.prepare(`SELECT * FROM otps WHERE user_id=? AND used=0
    ORDER BY id DESC LIMIT 1`).get(req.user.id);
  if (!row || new Date(row.expires_at) < new Date() || hashCode(String(code)) !== row.code_hash)
    return res.status(400).json({valid:false,error:'Invalid or expired code'});
  db.prepare('UPDATE otps SET used=1 WHERE id=?').run(row.id);
  res.json({valid:true});
});

app.get('/api/report/weekly', auth, (req,res)=>{
  const start = new Date(Date.now()-6*86400000).toISOString().slice(0,10);
  const study = db.prepare(`SELECT COALESCE(SUM(minutes),0) total FROM study_sessions
    WHERE user_id=? AND date(started_at)>=?`).get(req.user.id,start).total;
  const tasks = db.prepare(`SELECT COUNT(*) total, COALESCE(SUM(completed),0) completed FROM tasks
    WHERE user_id=? AND day>=?`).get(req.user.id,start);
  const restrictions = db.prepare(`SELECT COUNT(*) total FROM restrictions WHERE user_id=? AND created_at>=?`)
    .get(req.user.id,start+'T00:00:00.000Z').total;
  res.json({studyMinutes:study,tasks,restrictionPlans:restrictions});
});

app.get('*',(req,res)=>{
  res.sendFile(path.join(__dirname,'../public/index.html'));
});

app.listen(PORT,()=>console.log(`FocusGuard running on http://localhost:${PORT}`));
