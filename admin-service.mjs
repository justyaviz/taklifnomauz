import {createReadStream,existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,randomBytes,createHmac,scryptSync,timingSafeEqual} from 'node:crypto';
import {storage,normalize,starter,err,clean,jsonSafe} from './admin-data.mjs';

export function createAdminService({dataDir,publicDir}){
 const store=storage(dataDir),uploaded=path.join(dataDir,'uploads');
 const user=process.env.ADMIN_USERNAME||'admin',secret=process.env.ADMIN_SESSION_SECRET||'';
 const configured=!!(process.env.ADMIN_PASSWORD_HASH&&secret.length>=32);
 const hits=new Map();
 const reply=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data))};
 const cookie=(value,req,expire=false)=>'admin_session='+value+'; Path=/; HttpOnly; SameSite=Strict; '+((process.env.NODE_ENV==='production'||req.headers['x-forwarded-proto']==='https')?'Secure; ':'')+(expire?'Max-Age=0':'Max-Age=604800');
 const hmac=val=>createHmac('sha256',secret).update(val).digest('base64url');
 const sign=version=>{const p=Buffer.from(JSON.stringify({user,version,exp:Date.now()+7*86400000})).toString('base64url');return p+'.'+hmac(p)};
 const credentials=()=>store.read('admin-auth.json',{hash:process.env.ADMIN_PASSWORD_HASH||'',version:0});
 const equal=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y)};
 const verify=(plain,stored)=>{const [salt,hash]=String(stored).split(':');if(!salt||!hash||plain.length>256)return false;try{return equal(scryptSync(plain,salt,64).toString('hex'),hash)}catch{return false}};
 const auth=async req=>{if(!configured)return false;const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('admin_session='))?.slice(14)||'';const [part,sig]=token.split('.');if(!part||!sig||!equal(sig,hmac(part)))return false;try{const d=JSON.parse(Buffer.from(part,'base64url'));const c=await credentials();return d.user===user&&d.version===c.version&&d.exp>Date.now()}catch{return false}};
 const limited=(key,max=12)=>{const now=Date.now(),arr=(hits.get(key)||[]).filter(x=>x>now-60000);arr.push(now);hits.set(key,arr);if(hits.size>1500)hits.clear();return arr.length<=max};
 async function input(req,max=110000){if(!String(req.headers['content-type']||'').includes('application/json'))throw err(415,'JSON kerak');let size=0,chunks=[];for await(const c of req){size+=c.length;if(size>max)throw err(413,'So‘rov katta');chunks.push(c)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw err(400,'JSON xato')}}
 const findPublished=async slug=>(await store.invites()).find(x=>x.slug===slug&&x.published);
 const rsvpName='rsvps.json',wishName='guest-wishes.json';
 const pathRe=/^\/api\/admin\/invitations\/([0-9a-f-]{36})(?:\/(rsvps|wishes|guests))?(?:\/([0-9a-f-]{36}))?$/;
 async function routes(req,res,url){
  const p=url.pathname,method=req.method;
  if(p==='/admin'||p==='/admin/'){
   if(method!=='GET'&&method!=='HEAD')return reply(res,405,{error:'Method not allowed'}),true;
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY'});if(method==='HEAD')res.end();else createReadStream(path.join(publicDir,'admin.html')).pipe(res);return true;
  }
  if(p.startsWith('/media/')){
   const name=p.slice(7);
   if(!/^[a-f0-9-]{36}\.(jpg|png|webp|gif|mp3)$/.test(name))return reply(res,404,{error:'Not found'}),true;
   const f=path.join(uploaded,name);if(!existsSync(f))return reply(res,404,{error:'Not found'}),true;
   const m={jpg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',mp3:'audio/mpeg'};
   res.writeHead(200,{'Content-Type':m[name.split('.').pop()],'Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'});if(method==='HEAD')res.end();else createReadStream(f).pipe(res);return true;
  }
  const page=p.match(/^\/i\/([a-z0-9-]{3,60})\/?$/);
  if(page){
   let inv=await findPublished(page[1]);
   if(!inv&&url.searchParams.get('preview')==='1'&&await auth(req))inv=(await store.invites()).find(x=>x.slug===page[1]);
   if(!inv)return reply(res,404,{error:'Taklifnoma topilmadi yoki nashr qilinmagan'}),true;
   if(method!=='GET'&&method!=='HEAD')return reply(res,405,{error:'Method not allowed'}),true;
   if(method==='GET'&&url.searchParams.get('preview')!=='1')await store.mutate(async()=>{const all=await store.invites(),item=all.find(x=>x.id===inv.id);if(item){item.views=(item.views||0)+1;await store.write('invitations.json',all)}});
   let html=await readFile(path.join(publicDir,'index.html'),'utf8');
   const inject='<script id="invite-data" type="application/json">'+jsonSafe(inv)+'</script><script defer src="/app.js"></script>';
   html=html.replace('<script defer src="/app.js"></script>',inject);
   const title=(inv.groom+' & '+inv.bride+' — Taklifnoma').replace(/[<>]/g,'');
   html=html.replace(/<title>[^<]*<\/title>/,'<title>'+title+'</title>');
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(method==='HEAD'?'':html);return true;
  }
  const pub=p.match(/^\/api\/invitations\/([a-z0-9-]{3,60})(?:\/(wishes|rsvp))?$/);
  if(pub){
   const inv=await findPublished(pub[1]);if(!inv)return reply(res,404,{error:'Taklifnoma topilmadi'}),true;
   if(!pub[2])return reply(res,method==='GET'?200:405,method==='GET'?{invitation:inv}:{error:'Method not allowed'}),true;
   if(pub[2]==='wishes'){
    if(method==='GET'){
     let list=(await store.read(wishName)).filter(x=>x.invitationId===inv.id);
     if(inv.slug==='oq-saroy'){const legacy=await store.read('wishes.json');list=[...legacy.map(x=>({...x,approved:true})),...list]}
     return reply(res,200,{wishes:list.filter(x=>x.approved!==false).map(x=>({id:x.id,name:x.name,text:x.text,createdAt:x.createdAt}))}),true;
    }
    if(method==='POST'){
     if(!inv.allowWishes)throw err(403,'Tilaklar o‘chirilgan');if(!limited('wish'+req.socket.remoteAddress,8))throw err(429,'Biroz kuting');
     const d=await input(req),name=clean(d.name,41),text=clean(d.text,501);
     if(name.length<2||name.length>40||text.length<3||text.length>500)throw err(400,'Ism 2–40, tilak 3–500 belgi bo‘lsin');
     const record={id:randomUUID(),invitationId:inv.id,name,text,approved:true,createdAt:new Date().toISOString(),secret:randomBytes(24).toString('hex')};
     await store.mutate(async()=>{const list=await store.read(wishName);list.push(record);await store.write(wishName,list)});
     return reply(res,201,{wish:{id:record.id,name,text,createdAt:record.createdAt},token:record.secret}),true;
    }
    return reply(res,405,{error:'Method not allowed'}),true;
   }
   if(pub[2]==='rsvp'){
    if(method!=='POST')return reply(res,405,{error:'Method not allowed'}),true;
    if(!inv.allowRsvp)throw err(403,'RSVP o‘chirilgan');if(!limited('rsvp'+req.socket.remoteAddress,8))throw err(429,'Biroz kuting');
    const d=await input(req),name=clean(d.name,80),phone=clean(d.phone,40),status=clean(d.status,10),count=Number(d.count)||1;
    if(name.length<2||!['yes','no','maybe'].includes(status)||count<1||count>20)throw err(400,'RSVP ma’lumotlari xato');
    const record={id:randomUUID(),invitationId:inv.id,name,phone,status,count,note:clean(d.note,500),createdAt:new Date().toISOString()};
    await store.mutate(async()=>{const list=await store.read(rsvpName);list.push(record);await store.write(rsvpName,list)});
    return reply(res,201,{ok:true,id:record.id}),true;
   }
  }
  const editWish=p.match(/^\/api\/invitations\/([a-z0-9-]{3,60})\/wishes\/([a-f0-9-]{36})$/);
  if(editWish&&['PUT','DELETE'].includes(method)){
   const inv=await findPublished(editWish[1]);if(!inv)return reply(res,404,{error:'Not found'}),true;
   const d=await input(req),token=req.headers['x-wish-token']||'';
   const result=await store.mutate(async()=>{const all=await store.read(wishName),w=all.find(x=>x.id===editWish[2]&&x.invitationId===inv.id);if(!w)return {status:404,error:'Tilak topilmadi'};if(!token||!equal(token,w.secret))return {status:403,error:'Ruxsat yo‘q'};
    if(method==='DELETE'){all.splice(all.indexOf(w),1);await store.write(wishName,all);return {status:200,ok:true}}
    const name=clean(d.name,40),text=clean(d.text,500);if(name.length<2||text.length<3)return {status:400,error:'Matn qisqa'};w.name=name;w.text=text;await store.write(wishName,all);return {status:200,wish:{id:w.id,name,text,createdAt:w.createdAt}};
   });return reply(res,result.status,result),true;
  }
  if(!p.startsWith('/api/admin'))return false;
  if(!configured)return reply(res,503,{error:'Admin credentials sozlanmagan'}),true;
  if(!['GET','HEAD'].includes(method)&&req.headers.origin){
   let origin;try{origin=new URL(req.headers.origin).host}catch{throw err(403,'Origin xato')}
   if(origin!==req.headers.host)throw err(403,'Origin ruxsat etilmagan');
  }
  if(p==='/api/admin/login'&&method==='POST'){
   if(!limited('login'+req.socket.remoteAddress,6))throw err(429,'Bir daqiqa kuting');
   const d=await input(req),c=await credentials();
   if(d.username!==user||!verify(String(d.password||''),c.hash))return reply(res,401,{error:'Login yoki parol xato'}),true;
   return reply(res,200,{ok:true,username:user},{'Set-Cookie':cookie(sign(c.version),req)}),true;
  }
  if(p==='/api/admin/logout'&&method==='POST')return reply(res,200,{ok:true},{'Set-Cookie':cookie('',req,true)}),true;
  if(!await auth(req))return reply(res,401,{error:'Avtorizatsiya kerak'}),true;
  if(p==='/api/admin/me'&&method==='GET')return reply(res,200,{ok:true,username:user}),true;
  if(p==='/api/admin/password'&&method==='POST'){
   const d=await input(req),c=await credentials();
   if(!verify(String(d.oldPassword||''),c.hash))throw err(403,'Eski parol noto‘g‘ri');
   const password=String(d.newPassword||'');if(password.length<12||password.length>128)throw err(400,'Parol kamida 12 ta belgi bo‘lishi kerak');
   const salt=randomBytes(16).toString('hex');
   await store.write('admin-auth.json',{hash:salt+':'+scryptSync(password,salt,64).toString('hex'),version:c.version+1});
   return reply(res,200,{ok:true},{'Set-Cookie':cookie('',req,true)}),true;
  }
  if(p==='/api/admin/upload'&&method==='POST'){
   if(!limited('upload'+req.socket.remoteAddress,25))throw err(429,'Juda ko‘p yuklash');
   const ext=path.extname(clean(url.searchParams.get('name'),180)).slice(1).toLowerCase();
   if(!['jpg','jpeg','png','webp','gif','mp3'].includes(ext))throw err(400,'Faqat JPG PNG WebP GIF MP3 yuklash mumkin');
   let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>12*1024*1024)throw err(413,'12 MB dan katta fayl');chunks.push(chunk)}
   const bin=Buffer.concat(chunks);
   const valid=ext==='mp3'?(bin.slice(0,3).toString()==='ID3'||bin[0]===255):ext==='jpg'||ext==='jpeg'?(bin[0]===255&&bin[1]===216):ext==='png'?bin.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):ext==='webp'?(bin.toString('ascii',0,4)==='RIFF'&&bin.toString('ascii',8,12)==='WEBP'):bin.toString('ascii',0,3)==='GIF';
   if(!valid||bin.length<100)throw err(400,'Fayl formati xato');
   const name=randomUUID()+'.'+(ext==='jpeg'?'jpg':ext);await mkdir(uploaded,{recursive:true});await writeFile(path.join(uploaded,name),bin,{flag:'wx'});
   return reply(res,201,{url:'/media/'+name,name,bytes:bin.length}),true;
  }
  if(p==='/api/admin/stats'&&method==='GET'){
   const a=await store.invites(),r=await store.read(rsvpName),w=await store.read(wishName);
   return reply(res,200,{total:a.length,published:a.filter(x=>x.published).length,views:a.reduce((n,x)=>n+(x.views||0),0),rsvp:r.length,wishes:w.length}),true;
  }
  if(p==='/api/admin/invitations'){
   if(method==='GET'){
    const a=await store.invites(),r=await store.read(rsvpName),w=await store.read(wishName);
    return reply(res,200,{invitations:a.map(x=>({...x,rsvpCount:r.filter(y=>y.invitationId===x.id).length,wishCount:w.filter(y=>y.invitationId===x.id).length}))}),true;
   }
   if(method==='POST'){
    const d=await input(req);
    const saved=await store.mutate(async()=>{const list=await store.invites(),obj=normalize(d,{...starter(),id:randomUUID(),published:false,views:0});if(list.some(x=>x.slug===obj.slug))throw err(409,'Havola band');list.push(obj);await store.write('invitations.json',list);return obj});
    return reply(res,201,{invitation:saved}),true;
   }
  }
  const m=p.match(pathRe);
  if(m){
   const [,id,collection,entryId]=m;
   if(!collection){
    if(method==='GET'){const inv=(await store.invites()).find(x=>x.id===id);return reply(res,inv?200:404,inv?{invitation:inv}:{error:'Taklifnoma yo‘q'}),true}
    if(method==='PATCH'){
     const d=await input(req);
     const updated=await store.mutate(async()=>{const list=await store.invites(),idx=list.findIndex(x=>x.id===id);if(idx<0)throw err(404,'Taklifnoma yo‘q');const obj=normalize(d,list[idx]);if(list.some(x=>x.id!==id&&x.slug===obj.slug))throw err(409,'Havola band');list[idx]=obj;await store.write('invitations.json',list);return obj});
     return reply(res,200,{invitation:updated}),true;
    }
    if(method==='DELETE'){await store.mutate(async()=>{let a=await store.invites(),idx=a.findIndex(x=>x.id===id);if(idx<0)throw err(404,'Not found');a.splice(idx,1);await store.write('invitations.json',a)});return reply(res,200,{ok:true}),true}
   }
   const inv=(await store.invites()).find(x=>x.id===id);if(!inv)return reply(res,404,{error:'Taklifnoma yo‘q'}),true;
   const file=collection==='wishes'?wishName:rsvpName;
   if(method==='GET'&&!entryId){const all=await store.read(file);return reply(res,200,{items:all.filter(x=>x.invitationId===id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}),true}
   if(method==='POST'&&collection==='guests'){
    const d=await input(req),name=clean(d.name,80);if(name.length<2)throw err(400,'Mehmon ismini yozing');
    const row={id:randomUUID(),invitationId:id,name,phone:clean(d.phone,40),note:clean(d.note,300),status:'invited',count:1,createdAt:new Date().toISOString()};
    await store.mutate(async()=>{const all=await store.read(rsvpName);all.push(row);await store.write(rsvpName,all)});
    return reply(res,201,{item:row}),true;
   }
   if(entryId&&method==='DELETE'){
    await store.mutate(async()=>{const all=await store.read(file),idx=all.findIndex(x=>x.id===entryId&&x.invitationId===id);if(idx<0)throw err(404,'Topilmadi');all.splice(idx,1);await store.write(file,all)});
    return reply(res,200,{ok:true}),true;
   }
   if(entryId&&method==='PATCH'){
    const d=await input(req);
    const changed=await store.mutate(async()=>{const all=await store.read(file),row=all.find(x=>x.id===entryId&&x.invitationId===id);if(!row)throw err(404,'Topilmadi');
     if(collection==='wishes'){if('approved' in d)row.approved=Boolean(d.approved);if('text' in d)row.text=clean(d.text,500)}
     else{if(['yes','no','maybe','invited'].includes(d.status))row.status=d.status;if('count' in d)row.count=Math.min(20,Math.max(1,Number(d.count)||1))}
     await store.write(file,all);return row;
    });return reply(res,200,{item:changed}),true;
   }
  }
  return reply(res,404,{error:'API topilmadi'}),true;
 }
 async function handle(req,res,url){try{return await routes(req,res,url)}catch(e){if(!res.headersSent)reply(res,e.httpStatus||500,{error:e.httpStatus?e.message:'Serverda xatolik'});console.error('API',e.message);return true}}
 return {handle};
}
