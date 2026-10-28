import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json({limit:'1mb'}));
const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const dbFile = path.resolve('data.json');
const load = () => fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile,'utf8')) : {users:[],notes:[],tasks:[],posts:[]};
const save = db => fs.writeFileSync(dbFile, JSON.stringify(db,null,2));
let db=load();

async function seedOwner(){
 if(!process.env.OWNER_EMAIL || !process.env.OWNER_PASSWORD) return;
 if(!db.users.some(u=>u.email===process.env.OWNER_EMAIL.toLowerCase())){
  db.users.push({id:crypto.randomUUID(),name:'Web Owner',email:process.env.OWNER_EMAIL.toLowerCase(),password:await bcrypt.hash(process.env.OWNER_PASSWORD,12),course:'',role:'owner',createdAt:new Date().toISOString()}); save(db);
 }
}
await seedOwner();
const tokenFor=u=>jwt.sign({id:u.id,role:u.role},SECRET,{expiresIn:'7d'});
function auth(req,res,next){const h=req.headers.authorization||'';try{req.user=jwt.verify(h.replace('Bearer ',''),SECRET);next()}catch{return res.status(401).json({error:'Unauthorized'})}}
function owner(req,res,next){if(req.user?.role!=='owner')return res.status(403).json({error:'Owner access required'});next()}

app.get('/api/health',(req,res)=>res.json({ok:true,name:'CampusAI API'}));
app.post('/api/auth/signup',async(req,res)=>{const {name,email,password,course}=req.body;if(!name||!email||!password||password.length<6)return res.status(400).json({error:'Name, email and 6+ character password required'});const e=email.toLowerCase();if(db.users.some(u=>u.email===e))return res.status(409).json({error:'Email already registered'});const u={id:crypto.randomUUID(),name,email:e,password:await bcrypt.hash(password,12),course:course||'',role:'student',createdAt:new Date().toISOString()};db.users.push(u);save(db);res.status(201).json({token:tokenFor(u),user:{id:u.id,name:u.name,email:u.email,course:u.course,role:u.role}})});
app.post('/api/auth/login',async(req,res)=>{const {email,password}=req.body;const u=db.users.find(x=>x.email===String(email||'').toLowerCase());if(!u||!await bcrypt.compare(password||'',u.password))return res.status(401).json({error:'Invalid email or password'});res.json({token:tokenFor(u),user:{id:u.id,name:u.name,email:u.email,course:u.course,role:u.role}})});
app.get('/api/me',auth,(req,res)=>{const u=db.users.find(x=>x.id===req.user.id);res.json({id:u.id,name:u.name,email:u.email,course:u.course,role:u.role})});

for(const [route,key] of [['notes','notes'],['tasks','tasks'],['posts','posts']]){
 app.get('/api/'+route,auth,(req,res)=>res.json(db[key].filter(x=>x.userId===req.user.id || route==='posts')));
 app.post('/api/'+route,auth,(req,res)=>{const item={id:crypto.randomUUID(),userId:req.user.id,...req.body,createdAt:new Date().toISOString()};db[key].unshift(item);save(db);res.status(201).json(item)});
 app.delete('/api/'+route+'/:id',auth,(req,res)=>{const i=db[key].findIndex(x=>x.id===req.params.id&&(x.userId===req.user.id||req.user.role==='owner'));if(i<0)return res.status(404).json({error:'Not found'});db[key].splice(i,1);save(db);res.json({ok:true})});
}
app.get('/api/owner/users',auth,owner,(req,res)=>res.json(db.users.map(({password,...u})=>u)));
app.get('/api/owner/stats',auth,owner,(req,res)=>res.json({users:db.users.length,students:db.users.filter(u=>u.role==='student').length,notes:db.notes.length,tasks:db.tasks.length,posts:db.posts.length}));
app.post('/api/ai',auth,(req,res)=>res.status(501).json({error:'AI provider not configured yet. Add your provider key on the server, never in frontend code.'}));
app.listen(PORT,()=>console.log(`CampusAI backend running on http://localhost:${PORT}`));
