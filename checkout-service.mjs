import {createReadStream,existsSync} from 'node:fs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomUUID,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import path from 'node:path';
import {storage,clean,err} from './admin-data.mjs';

export const CARD_CATALOG=Object.freeze([
 {id:'oq-saroy',title:'OQ SAROY',subtitle:'Qirollik uslubidagi tantanali taklifnoma',emoji:'🏰'},
 {id:'zarhal',title:'ZARHAL',subtitle:'Oltinrang bayramona taklifnoma',emoji:'✨'},
 {id:'minimal',title:'NAFIS',subtitle:'Zamonaviy va nafis taklifnoma',emoji:'🤍'}
]);
const isAllowed=id=>CARD_CATALOG.some(t=>t.id===id);
const sha=x=>createHash('sha256').update(String(x)).digest('hex');
const eq=(a,b)=>{const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&timingSafeEqual(aa,bb)};
const resJson=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(obj))};
async function bodyJSON(req,limit=8192){
 if(!String(req.headers['content-type']||'').includes('application/json'))throw err(415,'JSON yuboring');
 let bytes=0,chunks=[];
 for await(const c of req){bytes+=c.length;if(bytes>limit)throw err(413,'So‘rov hajmi katta');chunks.push(c)}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw err(400,'JSON xato')}
}
export function createCheckoutService({dataDir,publicDir}){
 const store=storage(dataDir),hits=new Map(),receiptDir=path.join(dataDir,'private-receipts');
 const orders=()=>store.read('card-orders.json',[]);
 const settings=()=>store.read('card-settings.json',{cardNumber:'',cardHolder:'',currency:'UZS',prices:Object.fromEntries(CARD_CATALOG.map(c=>[c.id,0]))});
 const available=async()=>{const s=await settings();return /^\d{16,19}$/.test(String(s.cardNumber||''))&&String(s.cardHolder||'').trim().length>=3};
 function limit(key,count=10){const now=Date.now(),a=(hits.get(key)||[]).filter(x=>x>now-60000);a.push(now);hits.set(key,a);if(hits.size>2000)hits.clear();return a.length<=count}
 function buyer(o,token){return !!o && !!token && eq(sha(token),o.customerTokenHash)}
 async function handle(req,res,url){
  const route=url.pathname,method=req.method;
  const isPage=['/shop','/shop/'].includes(route)||/^\/checkout\/(oq-saroy|zarhal|minimal)\/?$/.test(route)||/^\/order\/[0-9a-f-]{36}\/?$/.test(route);
  if(isPage){
   if(!['GET','HEAD'].includes(method)){resJson(res,405,{error:'Method not allowed'});return true}
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff'});
   if(method==='HEAD')res.end();else createReadStream(path.join(publicDir,'checkout.html')).pipe(res);
   return true;
  }
  if(!route.startsWith('/api/checkout/'))return false;
  try{
   if(route==='/api/checkout/catalog'&&method==='GET'){
    const s=await settings(),ready=await available();
    resJson(res,200,{templates:CARD_CATALOG.map(t=>({...t,price:Number(s.prices?.[t.id])||0,preview:'/t/'+t.id})),configured:ready});
    return true;
   }
   if(route==='/api/checkout/payment-details'&&method==='GET'){
    const s=await settings(),ready=await available();
    // Receiver card details are publicly displayed only on the independent checkout website.
    resJson(res,200,{configured:ready,cardNumber:ready?s.cardNumber:null,cardHolder:ready?s.cardHolder:null,currency:'UZS'});
    return true;
   }
   if(route==='/api/checkout/orders'&&method==='POST'){
    if(!limit('new:'+req.socket.remoteAddress,5))throw err(429,'Birozdan so‘ng urinib ko‘ring');
    const s=await settings(),data=await bodyJSON(req),template=String(data.template||'');
    if(!await available())throw err(503,'Karta to‘lovlari hali faollashtirilmagan');
    if(!isAllowed(template))throw err(400,'Shablon topilmadi');
    const price=Number(s.prices?.[template]);
    if(!Number.isSafeInteger(price)||price<=0||price>1000000000)throw err(400,'Shablon narxi sozlanmagan');
    const buyerName=clean(data.customerName,90),contact=clean(data.contact,80);
    if(buyerName.length<3||contact.length<4)throw err(400,'Ismingiz va telefon/Telegram manzilingizni kiriting');
    const token=randomBytes(32).toString('base64url');
    const item={id:randomUUID(),template,amount:price,currency:'UZS',cardHolder:s.cardHolder,cardLast4:String(s.cardNumber).slice(-4),customerName:buyerName,contact,customerTokenHash:sha(token),status:'awaiting_receipt',receipt:null,claimCode:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    await store.mutate(async()=>{const all=await orders();all.push(item);await store.write('card-orders.json',all)});
    resJson(res,201,{orderId:item.id,accessToken:token,amount:price,status:item.status});
    return true;
   }
   const match=route.match(/^\/api\/checkout\/orders\/([0-9a-f-]{36})(?:\/(receipt))?$/);
   if(match){
    const [_,id,action]=match;
    const token=String(req.headers['x-order-token']||'');
    const o=(await orders()).find(x=>x.id===id);
    if(!buyer(o,token))throw err(404,'Buyurtma topilmadi');
    if(method==='GET'&&!action){
     resJson(res,200,{id:o.id,template:o.template,amount:o.amount,currency:'UZS',customerName:o.customerName,status:o.status,receiptSubmitted:!!o.receipt,claimCode:o.status==='approved'?o.claimCode:null,createdAt:o.createdAt});
     return true;
    }
    if(method==='POST'&&action==='receipt'){
     if(!['awaiting_receipt','rejected'].includes(o.status))throw err(409,'Bu buyurtmaga qayta chek yuklash mumkin emas');
     if(!limit('receipt:'+req.socket.remoteAddress,6))throw err(429,'Juda ko‘p yuklash');
     let size=0,chunks=[];
     for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024)throw err(413,'Chek rasmi 8 MB dan oshmasin');chunks.push(chunk)}
     const buffer=Buffer.concat(chunks);
     const png=buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
     const jpg=buffer[0]===0xff&&buffer[1]===0xd8;
     const webp=buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
     const ext=png?'png':jpg?'jpg':webp?'webp':null;
     if(!ext||size<200)throw err(400,'Faqat PNG, JPG yoki WebP rasm yuboring');
     const fileName=randomUUID()+'.'+ext;
     await mkdir(receiptDir,{recursive:true});
     await writeFile(path.join(receiptDir,fileName),buffer,{flag:'wx'});
     await store.mutate(async()=>{
      const all=await orders(),item=all.find(x=>x.id===id);
      if(!item||!['awaiting_receipt','rejected'].includes(item.status))throw err(409,'Buyurtma holati o‘zgardi');
      item.receipt=fileName;item.status='review';item.updatedAt=new Date().toISOString();
      await store.write('card-orders.json',all);
     });
     resJson(res,200,{ok:true,status:'review',message:'Chek qabul qilindi. Pul kelib tushgani tekshirilmoqda.'});
     return true;
    }
   }
   resJson(res,405,{error:'Method not allowed'});return true;
  }catch(e){console.error('Checkout request',e.message);resJson(res,e.httpStatus||500,{error:e.httpStatus?e.message:'Texnik xatolik'});return true}
 }
 return {handle,orders,settings};
}
