import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
let child,dataDir,base;
before(async()=>{
 dataDir=await mkdtemp(path.join(os.tmpdir(),'oq-saroy-test-'));
 const port=24000+Math.floor(Math.random()*20000);base='http://127.0.0.1:'+port;
 child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),DATA_DIR:dataDir},stdio:'ignore'});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,75))}
 assert.ok(ready,'server should start');
});
after(async()=>{child?.kill();await rm(dataDir,{recursive:true,force:true})});
test('health and HTML, JS, CSS',async()=>{
 const health=await fetch(base+'/health');assert.equal(health.status,200);assert.deepEqual(await health.json(),{ok:true});
 for(const p of ['/','/demo/oq-saroy','/app.js','/styles.css'])assert.equal((await fetch(base+p)).status,200,p);
 assert.equal((await fetch(base+'/not-found')).status,404);
});
test('wishes CRUD and unauthorized access',async()=>{
 const request=(method,path,obj,token)=>fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{'x-wish-token':token}:{})},body:JSON.stringify(obj)});
 let r=await request('POST','/api/wishes',{name:'Test Guest',text:'Baxtli bo‘linglar!'});
 assert.equal(r.status,201);const d=await r.json();assert.equal(d.token.length,64);
 const id=d.wish.id;
 r=await fetch(base+'/api/wishes');assert.ok((await r.json()).wishes.some(x=>x.id===id));
 r=await request('PUT','/api/wishes/'+id,{name:'Test Guest',text:'Yangi tilak'},'a'.repeat(64));assert.equal(r.status,403);
 r=await request('PUT','/api/wishes/'+id,{name:'Test Guest',text:'Yangi tilak'},d.token);assert.equal(r.status,200);
 r=await request('DELETE','/api/wishes/'+id,{},d.token);assert.equal(r.status,200);
 r=await fetch(base+'/api/wishes');assert.equal((await r.json()).wishes.some(x=>x.id===id),false);
});
test('reject short input',async()=>{
 const r=await fetch(base+'/api/wishes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'A',text:'B'})});
 assert.equal(r.status,400);
});
