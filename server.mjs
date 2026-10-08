import { createServer } from 'node:http';
import { createAdminService } from './admin-service.mjs';
import { createTelegramService } from './telegram-bot.mjs';
import { createCheckoutService } from './checkout-service.mjs';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(root, 'public');
const dataDir = process.env.DATA_DIR || path.join(root, 'storage');
const wishesFile = path.join(dataDir, 'wishes.json');
const port = Number(process.env.PORT || 3000);
const adminService = createAdminService({ dataDir, publicDir });
const checkoutService = createCheckoutService({dataDir,publicDir});
const telegramService = createTelegramService({dataDir,baseUrl:process.env.PUBLIC_BASE_URL||'https://oq-saroy-web-production.up.railway.app'});
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const samples = [
  {id:'sample-dilnoza',name:'Dilnoza',text:'Baxtli bo‘linglar! 💐',createdAt:'2026-10-01T12:00:00Z',sample:true},
  {id:'sample-sardor',name:'Sardor',text:'To‘yingiz muborak bo‘lsin!',createdAt:'2026-10-02T12:00:00Z',sample:true}
];
const counts = new Map();
let locked = Promise.resolve();
const hash = s => createHash('sha256').update(s).digest('hex');
function reply(res,status,data){const payload=JSON.stringify(data);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(payload)}
async function readWishes(){try {const list=JSON.parse(await readFile(wishesFile,'utf8'));return Array.isArray(list)?list:[]}catch(e){if(e.code==='ENOENT')return [];throw e}}
async function editWishes(fn){const job=locked.then(async()=>{const items=await readWishes();const result=fn(items);if(result.changed){await mkdir(dataDir,{recursive:true});const tmp=wishesFile+'.tmp-'+process.pid;await writeFile(tmp,JSON.stringify(items));await rename(tmp,wishesFile)}return result});locked=job.then(()=>{},()=>{});return job}
function clean(item){return {id:item.id,name:item.name,text:item.text,createdAt:item.createdAt,sample:!!item.sample}}
function validate(data){const name=String(data?.name??'').trim();const text=String(data?.text??'').trim();return name.length>=2&&name.length<=40&&text.length>=3&&text.length<=300?{name,text}:null}
async function bodyJSON(req){let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>4096)throw Object.assign(new Error('Payload too large'),{status:413});chunks.push(c)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Object.assign(new Error('Invalid JSON'),{status:400})}}
async function api(req,res,url){
  if(req.method==='GET' && url.pathname==='/api/wishes'){const wishes=await readWishes();return reply(res,200,{wishes:[...samples,...wishes.map(clean)].slice(-110)})}
  if(!['POST','PUT','DELETE'].includes(req.method))return reply(res,405,{error:'Method not allowed'});
  const key=String(req.socket.remoteAddress||'unknown'),now=Date.now();
  const recent=(counts.get(key)||[]).filter(t=>now-t<60_000);
  if(recent.length>=10)return reply(res,429,{error:'Bir daqiqadan keyin urinib ko‘ring'});
  recent.push(now);counts.set(key,recent);if(counts.size>3000)counts.clear();
  if(!String(req.headers['content-type']||'').includes('application/json'))return reply(res,415,{error:'JSON kerak'});
  const data=await bodyJSON(req);
  if(req.method==='POST' && url.pathname==='/api/wishes'){
    const valid=validate(data);
    if(!valid)return reply(res,400,{error:'Ism 2–40, tilak 3–300 belgi bo‘lishi kerak'});
    const token=randomBytes(32).toString('hex');
    const item={id:randomUUID(),...valid,createdAt:new Date().toISOString(),secretHash:hash(token)};
    await editWishes(w=>{if(w.length>=500)w.shift();w.push(item);return {changed:true}});
    return reply(res,201,{wish:clean(item),token});
  }
  const id=url.pathname.match(/^\/api\/wishes\/([0-9a-f-]{36})$/i)?.[1];
  if(!id)return reply(res,404,{error:'Not found'});
  const result=await editWishes(w=>{
    const index=w.findIndex(i=>i.id===id);
    if(index<0)return {status:404,error:'Tilak topilmadi'};
    const token=String(req.headers['x-wish-token']||'');
    const expected=Buffer.from(w[index].secretHash,'hex'),received=Buffer.from(hash(token),'hex');
    if(token.length!==64||!timingSafeEqual(expected,received))return {status:403,error:'Tahrirlash huquqi yo‘q'};
    if(req.method==='DELETE'){w.splice(index,1);return {changed:true,status:200,ok:true}}
    const valid=validate(data);
    if(!valid)return {status:400,error:'Matn noto‘g‘ri'};
    Object.assign(w[index],valid);
    return {changed:true,status:200,wish:clean(w[index])};
  });
  return reply(res,result.status,{error:result.error,ok:result.ok,wish:result.wish});
}
const server=createServer(async (req,res)=>{
 try {
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/health')return reply(res,200,{ok:true});
   if(await telegramService.webhook(req,res,url))return;
   if(await checkoutService.handle(req,res,url))return;
   if(await adminService.handle(req,res,url))return;
   if(url.pathname.startsWith('/api/'))return await api(req,res,url);
   if(req.method!=='GET'&&req.method!=='HEAD')return reply(res,405,{error:'Method not allowed'});
   let route=decodeURIComponent(url.pathname);
   if(['/', '/demo/oq-saroy'].includes(route))route='/index.html';
   const filepath=path.resolve(publicDir,'.'+route);
   if(!filepath.startsWith(publicDir+path.sep))return reply(res,403,{error:'Forbidden'});
   if(!existsSync(filepath))return reply(res,404,{error:'Not found'});
   res.writeHead(200,{'content-type':mime[path.extname(filepath)]||'application/octet-stream','cache-control':(/\.(js|css|html)$/.test(route)?'no-cache, must-revalidate':'public,max-age=3600'),'x-content-type-options':'nosniff','x-frame-options':'SAMEORIGIN','referrer-policy':'strict-origin-when-cross-origin'});
   if(req.method==='HEAD')return res.end();
   createReadStream(filepath).pipe(res);
 }catch(e){console.error('request error',e);if(!res.headersSent)reply(res,e.status||500,{error:e.status?e.message:'Server xatosi'})}
});
server.listen(port,'0.0.0.0',()=>console.log('OQ SAROY listening on '+port));

// Webhook is registered only when both BotFather token and webhook secret are configured.
if(telegramService.configured){telegramService.setWebhook().then(result=>console.log('Telegram webhook active:',result.bot)).catch(e=>console.error('Telegram webhook setup:',e.message))}
