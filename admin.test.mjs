import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {randomBytes,scryptSync} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

let child,dir,root,cookie,created,sessionPassword='correct-test-password-123';
before(async()=>{
 dir=await mkdtemp(path.join(os.tmpdir(),'oq-admin-test-'));
 const port=25000+Math.floor(Math.random()*10000);root='http://127.0.0.1:'+port;
 const salt=randomBytes(16).toString('hex');
 child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),DATA_DIR:dir,NODE_ENV:'test',ADMIN_USERNAME:'admin',ADMIN_PASSWORD_HASH:salt+':'+scryptSync(sessionPassword,salt,64).toString('hex'),ADMIN_SESSION_SECRET:randomBytes(40).toString('hex')},stdio:'ignore'});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(root+'/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,80))}
 assert.ok(ready,'server must start');
});
after(async()=>{child?.kill();await rm(dir,{recursive:true,force:true})});
async function request(route,method='GET',data=undefined,auth=true){
 const headers={};if(auth&&cookie)headers.Cookie=cookie;
 if(data!==undefined)headers['Content-Type']='application/json';
 return fetch(root+route,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
}
test('admin secure login and starter persistence',async()=>{
 let r=await request('/api/admin/invitations','GET',undefined,false);assert.equal(r.status,401);
 r=await request('/api/admin/login','POST',{username:'admin',password:'bad'},false);assert.equal(r.status,401);
 r=await request('/api/admin/login','POST',{username:'admin',password:sessionPassword},false);assert.equal(r.status,200);
 cookie=r.headers.get('set-cookie').split(';')[0];assert.ok(cookie.includes('admin_session='));
 r=await request('/api/admin/invitations');const list=(await r.json()).invitations;
 assert.equal(r.status,200);assert.ok(list.some(x=>x.slug==='oq-saroy'));
 const again=(await (await request('/api/admin/invitations')).json()).invitations;
 assert.equal(again.find(x=>x.slug==='oq-saroy').id,list.find(x=>x.slug==='oq-saroy').id);
});
test('create, preview, publish and update public invitation',async()=>{
 let r=await request('/api/admin/invitations','POST',{slug:'sinov-taklif',title:'Sinov',groom:'Ali',bride:'Zuhra',venue:'Sinov Saroy',eventDate:'2027-02-12',eventTime:'18:30',timezone:'+05:00',published:false});
 assert.equal(r.status,201);created=(await r.json()).invitation;
 assert.equal(created.slug,'sinov-taklif');assert.equal((await request('/i/sinov-taklif')).status,404);
 assert.equal((await request('/i/sinov-taklif?preview=1')).status,200);
 r=await request('/api/admin/invitations/'+created.id,'PATCH',{published:true,address:'Toshkent, Yunusobod',musicUrl:'',gallery:[],schedule:[{time:'18:30',title:'Bayram'}]});
 assert.equal(r.status,200);
 r=await request('/i/sinov-taklif','GET',undefined,false);assert.equal(r.status,200);
 const html=await r.text();assert.ok(html.includes('id="invite-data"'));assert.ok(html.includes('Zuhra'));assert.ok(html.includes('Yunusobod'));
 r=await request('/api/invitations/sinov-taklif','GET',undefined,false);const data=(await r.json()).invitation;assert.equal(data.eventTime,'18:30');assert.equal(data.published,true);
});
test('RSVP records and wishes moderation',async()=>{
 let r=await request('/api/invitations/sinov-taklif/rsvp','POST',{name:'Yaxyo',status:'yes',count:3,phone:'+998123'},false);
 assert.equal(r.status,201);
 r=await request('/api/admin/invitations/'+created.id+'/rsvps');const guests=(await r.json()).items;assert.equal(guests.length,1);
 r=await request('/api/invitations/sinov-taklif/wishes','POST',{name:'Dildora',text:'Baxtli bo‘linglar'},false);assert.equal(r.status,201);
 const wish=(await r.json()).wish;
 r=await request('/api/admin/invitations/'+created.id+'/wishes/'+wish.id,'PATCH',{approved:false});assert.equal(r.status,200);
 r=await request('/api/invitations/sinov-taklif/wishes','GET',undefined,false);assert.equal((await r.json()).wishes.length,0);
 r=await request('/api/admin/invitations/'+created.id+'/wishes/'+wish.id,'PATCH',{approved:true});assert.equal(r.status,200);
 r=await request('/api/invitations/sinov-taklif/wishes','GET',undefined,false);assert.equal((await r.json()).wishes.length,1);
});
test('media upload and password rotation',async()=>{
 let bytes=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),randomBytes(140)]);
 let r=await fetch(root+'/api/admin/upload?name=test.png',{method:'POST',headers:{Cookie:cookie},body:bytes});assert.equal(r.status,201);
 const asset=(await r.json()).url;assert.match(asset,/^\/media\/[\w-]+\.png$/);
 r=await request(asset);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');
 r=await request('/api/admin/password','POST',{oldPassword:sessionPassword,newPassword:'new-ultra-secure-password-456'});assert.equal(r.status,200);
 assert.equal((await request('/api/admin/me')).status,401);
 r=await request('/api/admin/login','POST',{username:'admin',password:'new-ultra-secure-password-456'},false);assert.equal(r.status,200);
 cookie=r.headers.get('set-cookie').split(';')[0];
 r=await request('/api/admin/invitations/'+created.id,'DELETE');assert.equal(r.status,200);
 assert.equal((await request('/i/sinov-taklif')).status,404);
});
