import {randomUUID,randomBytes,timingSafeEqual} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {storage,starter,normalize,slugify,clean} from './admin-data.mjs';

export const BOT_TEMPLATES=Object.freeze([
 {id:'oq-saroy',title:'OQ SAROY',emoji:'🏰',description:'Saroy, oltin bezaklar va musiqali kirish animatsiyasi.'},
 {id:'zarhal',title:'ZARHAL',emoji:'✨',description:'Oltin, yorqin bayramona ko‘rinish va ritm effektlari.'},
 {id:'minimal',title:'NAFIS',emoji:'🤍',description:'Soddaroq, oq va nafis zamonaviy taklifnoma.'}
]);
const steps=['groom','bride','eventDate','eventTime','venue','address','map','lead','music','gallery','review'];
const bad=x=>Object.assign(new Error(x),{isUserError:true});
const validUrl=x=>{try{const v=new URL(x);return v.protocol==='https:'}catch{return false}};
const first=(p)=>Array.isArray(p)?p[0]:p;
export function createTelegramService({dataDir,baseUrl='https://oq-saroy-web-production.up.railway.app',transport,botToken=process.env.TELEGRAM_BOT_TOKEN||'',webhookSecret=process.env.TELEGRAM_WEBHOOK_SECRET||'',prices=process.env.TELEGRAM_PRICES_STARS||''}={}){
 const store=storage(dataDir);
 const confPrices=String(prices).split(',').map(x=>Number(x.trim()));
 const pricesByTemplate=Object.fromEntries(BOT_TEMPLATES.map((t,i)=>[t.id,Number.isSafeInteger(confPrices[i])&&confPrices[i]>0&&confPrices[i]<=100000?confPrices[i]:0]));
 const currentPrices=async()=>{
  const fromAdmin=await store.read('bot-prices.json',pricesByTemplate);
  return Object.fromEntries(BOT_TEMPLATES.map(t=>[t.id,Number.isSafeInteger(fromAdmin[t.id])&&fromAdmin[t.id]>=0&&fromAdmin[t.id]<=100000?fromAdmin[t.id]:0]));
 };
 const publicBase=baseUrl.replace(/\/$/,'');
 const configured=!!botToken && !!webhookSecret && /^[A-Za-z0-9_-]{16,256}$/.test(webhookSecret);
 const updated=new Set();
 let username=process.env.TELEGRAM_BOT_USERNAME||'';
 const safe=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y)};
 const menu={inline_keyboard:[
  [{text:'🎨 Shablonlarni ko‘rish',callback_data:'catalog'}],
  [{text:'📦 Buyurtmalarim',callback_data:'orders'}],
  [{text:'🔑 Kod bilan faollashtirish',callback_data:'redeem_info'}],
  [{text:'💬 Yordam',callback_data:'support'}]
 ]};
 const options=(buttons)=>({reply_markup:{inline_keyboard:buttons}});
 async function tg(method,body){
  if(transport)return transport(method,body);
  const res=await fetch('https://api.telegram.org/bot'+botToken+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(9500)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.ok)throw new Error('Telegram '+method+' failed: '+(data.description||res.status));
  return data.result;
 }
 async function say(chat,text,buttons){return tg('sendMessage',{chat_id:chat,text,...(buttons?options(buttons):{})})}
 async function ack(callback,text=''){return tg('answerCallbackQuery',{callback_query_id:callback.id,...(text?{text,show_alert:false}:{})})}
 const orders=()=>store.read('bot-orders.json',[]);
 const owned=(list,user,id)=>list.find(x=>x.id===id&&x.telegramUserId===user);
 function url(template){return publicBase+'/t/'+template}
 function pricesLabel(id){const p=pricesByTemplate[id];return p?p+' ⭐ Stars':'Narx kiritilmagan'}
 const catalogButtons=(prices)=>BOT_TEMPLATES.map(t=>[{text:t.emoji+' '+t.title+(prices[t.id]?' · '+prices[t.id]+' ⭐':''),callback_data:'view:'+t.id}]).concat([[{text:'⬅️ Bosh menyu',callback_data:'home'}]]);
 async function welcome(chat){await say(chat,'💌 TAKLIFLY — elektron taklifnomalar!\n\nShablonlarni ko‘ring, xarid qilingan taklifnomani to‘ldiring va mehmonlarga yuboring.\n\nMustaqil saytdan berilgan aktivlashtirish kodini /redeem KOD shaklida yuborishingiz mumkin.',menu.inline_keyboard)}
 async function catalog(chat){await say(chat,'🎨 Elektron taklifnoma shablonlari\n\nNamunani ochib ko‘ring, keyin o‘zingizga yoqqanini tanlang.',catalogButtons(await currentPrices()))}
 async function showTemplate(chat,id){
  const t=BOT_TEMPLATES.find(x=>x.id===id);if(!t)return catalog(chat);
  const price=(await currentPrices())[id];
  const buttons=[[{text:'👀 Jonli demo',url:url(id)}]];
  if(price)buttons.push([{text:'⭐ '+price+' Stars — sotib olish',callback_data:'buy:'+id}]);
  buttons.push([{text:'⬅️ Boshqa shablonlar',callback_data:'catalog'}]);
  await say(chat,t.emoji+' '+t.title+'\n\n'+t.description+'\n\n💰 Narxi: '+pricesLabel(id)+'\nTo‘lovdan keyin taklifnoma uchun barcha ma’lumotlarni botga kiritasiz.',buttons);
 }
 async function myOrders(chat,user){
  const mine=(await orders()).filter(o=>o.telegramUserId===user).slice(-8).reverse();
  if(!mine.length)return say(chat,'Hozircha buyurtmalaringiz yo‘q. Mustaqil saytdan olingan kodni /redeem KOD orqali faollashtiring.',[[{text:'🎨 Shablonlarni ko‘rish',callback_data:'catalog'}]]);
  const rows=mine.map(o=>[{text:(o.status==='pending_payment'?'⌛ ':o.status==='ready'?'✅ ':'✍️ ')+o.template.toUpperCase()+' · '+o.id.slice(0,8),callback_data:'order:'+o.id}]);
  rows.push([{text:'🎨 Yana shablonlar',callback_data:'catalog'}]);
  return say(chat,'📦 Buyurtmalaringiz:',rows);
 }
 async function getOrder(chat,user,id){
  const o=owned(await orders(),user,id);
  if(!o)return say(chat,'Bu buyurtma sizga tegishli emas yoki topilmadi.');
  if(o.status==='pending_payment')return say(chat,'⌛ To‘lov hali tasdiqlanmagan. To‘lov tugmasini qayta olish uchun shablonni tanlang.',[[{text:'🎨 Shablonlar',callback_data:'catalog'}]]);
  const buttons=[];
  if(o.status==='ready'){
   buttons.push([{text:'🔗 Taklifnomani ochish',url:publicBase+'/i/'+o.slug}]);
   buttons.push([{text:'💌 Mehmon taklif qilish',callback_data:'invite:'+o.id}]);
  }
  buttons.push([{text:'✏️ Tahrirlash',callback_data:'edit:'+o.id}]);
  buttons.push([{text:'📦 Buyurtmalarim',callback_data:'orders'}]);
  return say(chat,(o.status==='ready'?'✅ Tayyor taklifnoma':'✍️ Taklifnomangiz to‘ldirilmoqda')+'\n\n'+(o.answers.groom||'Kuyov')+' & '+(o.answers.bride||'Kelin')+'\nShablon: '+o.template+'\nBuyurtma: '+o.id.slice(0,8),buttons);
 }
 async function createOrder(chat,user,template){
  const t=BOT_TEMPLATES.find(x=>x.id===template),stars=(await currentPrices())[template];
  if(!t)return catalog(chat);
  if(!stars)return say(chat,'Bu shablon narxi hali sozlanmagan. Savdo ochilgach xarid qilishingiz mumkin.');
  const order={id:randomUUID(),telegramUserId:user,chatId:chat,template,stars,status:'pending_payment',step:null,answers:{},invitationId:null,slug:null,chargeId:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  await store.mutate(async()=>{const list=await orders();list.push(order);await store.write('bot-orders.json',list)});
  try{
   await tg('sendInvoice',{chat_id:chat,title:t.title+' taklifnomasi',description:'Elektron to‘y taklifnomasi · '+t.title,payload:order.id,currency:'XTR',provider_token:'',prices:[{label:t.title,amount:stars}],start_parameter:'invite_'+template});
  }catch(e){
   await store.mutate(async()=>{const list=await orders();const item=owned(list,user,order.id);if(item){item.status='invoice_error';await store.write('bot-orders.json',list)}});
   throw e;
  }
 }
 const questions={
  groom:'🤵 Kuyov ismini yuboring.\nMasalan: Ulug‘bek',
  bride:'👰 Kelin ismini yuboring.\nMasalan: Muslima',
  eventDate:'📅 To‘y sanasini yozing:\n23.10.2026 (kun.oy.yil)',
  eventTime:'🕰 To‘y boshlanish vaqti:\n17:00',
  venue:'🏛 To‘yxona / marosim joyining nomini yuboring.',
  address:'📍 To‘liq manzilni yuboring.\nMasalan: Qo‘qon shahri, Mustaqillik ko‘chasi 15',
  map:'🗺 Lokatsiya yuboring (Telegram joylashuvi) yoki Google/Yandex Maps havolasini yuboring. O‘tkazib yuborsangiz, manzildan qidiriladi.',
  lead:'💌 Taklif matnini yozing. Ixtiyoriy — standart matnni qoldirish ham mumkin.',
  music:'🎵 Musiqani MP3 fayl yoki audio sifatida yuboring (12 MB gacha). Standart shablon musiqasini qoldirish ham mumkin.',
  gallery:'📸 Suratlarni bittadan yuboring (10 tagacha). Barchasini yuborgach «✅ Rasmlar tayyor» tugmasini bosing.',
  review:'✅ Ma’lumotlar qabul qilindi! Taklifnomani nashr qilish uchun tasdiqlang.'
 };
 function kb(order){const arr=[];
  if(['map','lead','music','gallery'].includes(order.step))arr.push([{text:order.step==='gallery'?'✅ Rasmlar tayyor':'➡️ O‘tkazish',callback_data:'skip:'+order.id}]);
  arr.push([{text:'⬅️ Oldingi bosqich',callback_data:'back:'+order.id}]);
  return arr;
 }
 async function prompt(chat,o){
  const step=o.step||steps[0], i=steps.indexOf(step);
  if(step==='review'){
   const a=o.answers;
   return say(chat,'📋 Taklifnomani tekshiring:\n\n🤵 '+a.groom+'\n👰 '+a.bride+'\n📅 '+a.eventDate+' · '+a.eventTime+'\n🏛 '+a.venue+'\n📍 '+a.address+'\n📷 '+(a.gallery||[]).length+' ta rasm\n🎵 '+(a.musicUrl?'Shaxsiy musiqa':'Shablon musiqasi')+'\n\nHammasi to‘g‘rimi?',[
    [{text:'✅ Nashr qilish',callback_data:'publish:'+o.id}],
    [{text:'✏️ Boshidan tahrirlash',callback_data:'edit:'+o.id}]
   ]);
  }
  return say(chat,'📝 '+(i+1)+'/'+(steps.length-1)+'-bosqich\n\n'+questions[step],kb(o));
 }
 async function activate(user,orderId,step){
  return store.mutate(async()=>{
   const list=await orders(),o=owned(list,user,orderId);
   if(!o||!['collecting','ready'].includes(o.status))return null;
   for(const x of list)if(x.telegramUserId===user)x.active=false;
   o.active=true;o.step=step;o.status='collecting';o.updatedAt=new Date().toISOString();
   await store.write('bot-orders.json',list);
   return o;
  });
 }
 async function handleCheckout(checkout){
  const list=await orders(),o=owned(list,checkout.from.id,checkout.invoice_payload);
  const ok=!!o&&o.status==='pending_payment'&&o.stars===checkout.total_amount&&checkout.currency==='XTR';
  await tg('answerPreCheckoutQuery',{pre_checkout_query_id:checkout.id,ok,...(ok?{}:{error_message:'Buyurtma narxi yoki holati mos kelmadi. Qayta buyurtma bering.'})});
 }
 async function paid(message){
  const pay=message.successful_payment,user=message.from?.id,chat=message.chat.id;
  if(!user||!pay||!pay.telegram_payment_charge_id)return;
  const obj=await store.mutate(async()=>{
   const list=await orders(),o=owned(list,user,pay.invoice_payload);
   if(!o)return null;
   if(o.chargeId===pay.telegram_payment_charge_id&&o.invitationId)return {order:o,repeat:true};
   if(o.status!=='pending_payment'||o.stars!==pay.total_amount||pay.currency!=='XTR')return null;
   const invites=await store.invites();
   const old=invites.find(x=>x.botOrderId===o.id);
   const inv=old||normalize({slug:'tg-'+o.id.slice(0,8),published:false}, {...starter(),id:randomUUID(),botOrderId:o.id,telegramUserId:user,template:o.template,views:0,published:false});
   if(!old){invites.push(inv);await store.write('invitations.json',invites)}
   o.status='collecting';o.active=true;o.step='groom';o.chargeId=pay.telegram_payment_charge_id;o.invitationId=inv.id;o.slug=inv.slug;o.paidAt=new Date().toISOString();
   for(const other of list)if(other.telegramUserId===user&&other.id!==o.id)other.active=false;
   await store.write('bot-orders.json',list);
   return {order:o,repeat:false};
  });
  if(!obj)return;
  if(obj.repeat)return say(chat,'✅ Bu to‘lov oldin tasdiqlangan. Buyurtmalaringizdan davom eting.',[[{text:'📦 Buyurtmalarim',callback_data:'orders'}]]);
  await say(chat,'✅ To‘lov muvaffaqiyatli! Xaridingiz tasdiqlandi. Endi taklifnomani 10 bosqichda tayyorlaymiz.');
  await prompt(chat,obj.order);
 }
 function dateISO(txt){
  const m=txt.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)||txt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return null;
  const y=txt.includes('.')?Number(m[3]):Number(m[1]),mm=Number(m[2]),d=txt.includes('.')?Number(m[1]):Number(m[3]);
  const date=new Date(Date.UTC(y,mm-1,d));
  if(date.getUTCFullYear()!==y||date.getUTCMonth()!==mm-1||date.getUTCDate()!==d)return null;
  if(y<2026||y>2100)return null;
  return [y,String(mm).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
 }
 async function downloadTelegramImage(fileId,user,type='jpg'){
  if(!botToken)throw bad('Bot sozlanmagan');
  const meta=await tg('getFile',{file_id:fileId});
  if(!meta||!meta.file_path||meta.file_size>12_000_000||!/^([A-Za-z0-9_\-]+\/)*[A-Za-z0-9_.-]+$/.test(meta.file_path))throw bad('Fayl hajmi yoki manzili mos emas (12 MB maksimum)');
  const res=await fetch('https://api.telegram.org/file/bot'+botToken+'/'+meta.file_path,{signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw bad('Faylni yuklab bo‘lmadi');
  const max=12_000_000;
  const contentLength=Number(res.headers.get('content-length')||0);
  if(contentLength>max)throw bad('Fayl 12 MB dan katta');
  const chunks=[];let size=0;
  for await(const ch of res.body){
   size+=ch.length;if(size>max)throw bad('Fayl 12 MB dan katta');
   chunks.push(Buffer.from(ch));
  }
  const buffer=Buffer.concat(chunks);
  const jpg=buffer[0]===0xff&&buffer[1]===0xd8;
  const png=buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
  const webp=buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
  const mp3=buffer.toString('ascii',0,3)==='ID3'||buffer[0]===0xff&&buffer[1]>=0xe0;
  const ext=type==='mp3'?(mp3?'mp3':null):jpg?'jpg':png?'png':webp?'webp':null;
  if(!ext||buffer.length<100)throw bad('Faqat JPG/PNG/WebP surat yoki haqiqiy MP3 qabul qilinadi');
  const filename=randomUUID()+'.'+ext;
  await mkdir(path.join(dataDir,'uploads'),{recursive:true});
  await writeFile(path.join(dataDir,'uploads',filename),buffer,{flag:'wx'});
  return '/media/'+filename;
 }
 async function answerField(chat,user,message){
  const list=await orders(),o=list.find(x=>x.telegramUserId===user&&x.active&&x.status==='collecting');
  if(!o)return say(chat,'Shablon tanlash uchun /start ni bosing.');
  let txt=clean(message.text||message.caption||'',1500),value=null;
  try{
   switch(o.step){
    case 'groom':case 'bride':case 'venue':case 'address':
     if(txt.length<2||txt.length>180)throw bad('2–180 ta belgi kiriting.');value=txt;break;
    case 'eventDate':value=dateISO(txt);if(!value)throw bad('Sana formati: 23.10.2026');break;
    case 'eventTime':if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(txt))throw bad('Soat formati: 17:00');value=txt;break;
    case 'map':
     if(message.location){value=message.location.latitude+','+message.location.longitude;}
     else if(validUrl(txt)){value=txt;}
     else throw bad('Telegram lokatsiyasini yuboring yoki HTTPS xarita havolasini yozing.');
     break;
    case 'lead':value=txt.slice(0,1000);if(value.length<5)throw bad('Taklif matni kamida 5 ta belgi.');break;
    case 'music':{
     const doc=message.audio||message.document;
     if(!doc||!(doc.mime_type==='audio/mpeg'||/\.mp3$/i.test(doc.file_name||'')))throw bad('MP3 audio fayl yuboring yoki «O‘tkazish»ni bosing.');
     value=await downloadTelegramImage(doc.file_id,user,'mp3');break;
    }
    case 'gallery':{
     const photo=message.photo?.at(-1);
     const document=message.document;
     const file=photo?.file_id||(document?.mime_type?.startsWith('image/')?document.file_id:null);
     if(!file)throw bad('JPG, PNG yoki WebP surat yuboring.');
     const current=o.answers.gallery||[];
     if(current.length>=10)throw bad('10 ta rasm limiti. «Rasmlar tayyor»ni bosing.');
     value=await downloadTelegramImage(file,user,'jpg');break;
    }
    default:return prompt(chat,o);
   }
  }catch(e){return say(chat,'⚠️ '+(e.isUserError?e.message:'Fayl yoki ma’lumotni qabul qila olmadim. Qayta urinib ko‘ring.'),kb(o))}
  const saved=await store.mutate(async()=>{
   const all=await orders(),item=owned(all,user,o.id);
   if(!item||item.step!==o.step||!item.active)return null;
   if(item.step==='gallery')item.answers.gallery=[...(item.answers.gallery||[]),value];
   else item.answers[item.step]=value;
   if(item.step!=='gallery')item.step=steps[steps.indexOf(item.step)+1]||'review';
   item.updatedAt=new Date().toISOString();
   await store.write('bot-orders.json',all);
   return item;
  });
  if(!saved)return;
  if(o.step==='gallery')await say(chat,'✅ '+saved.answers.gallery.length+' ta surat qabul qilindi. Yana yuborishingiz mumkin.',kb(saved));
  else await prompt(chat,saved);
 }
 async function skip(user,chat,id){
  const saved=await store.mutate(async()=>{
   const list=await orders(),o=owned(list,user,id);
   if(!o||!o.active||o.status!=='collecting'||!['map','lead','music','gallery'].includes(o.step))return null;
   o.step=steps[steps.indexOf(o.step)+1];await store.write('bot-orders.json',list);return o;
  });
  return saved?prompt(chat,saved):say(chat,'Bu bosqichni o‘tkazib bo‘lmaydi.');
 }
 async function back(user,chat,id){
  const saved=await store.mutate(async()=>{
   const list=await orders(),o=owned(list,user,id);
   if(!o||!o.active||o.status!=='collecting')return null;
   o.step=steps[Math.max(0,steps.indexOf(o.step)-1)];await store.write('bot-orders.json',list);return o;
  });
  return saved?prompt(chat,saved):say(chat,'Bu buyurtma faol emas.');
 }
 async function publish(user,chat,id){
  const result=await store.mutate(async()=>{
   const list=await orders(),o=owned(list,user,id);if(!o||o.status!=='collecting'||o.step!=='review'||!o.invitationId)return null;
   const a=o.answers;
   for(const k of ['groom','bride','eventDate','eventTime','venue','address'])if(!a[k])return {error:'Majburiy ma’lumotlar to‘ldirilmagan'};
   const invitations=await store.invites(),idx=invitations.findIndex(x=>x.id===o.invitationId&&x.botOrderId===o.id);
   if(idx<0)return {error:'Taklifnoma topilmadi'};
   const inv=invitations[idx],changes={...a,published:true,template:o.template};
   if(a.music)changes.musicUrl=a.music;
   if(a.map){if(validUrl(a.map)){
    if(a.map.includes('yandex'))changes.yandexUrl=a.map;
    else changes.googleUrl=a.map;
   }else changes.mapQuery=a.map;}
   delete changes.map;
   const updated=normalize(changes,inv);
   invitations[idx]=updated;
   await store.write('invitations.json',invitations);
   o.status='ready';o.active=false;o.step=null;o.readyAt=new Date().toISOString();
   await store.write('bot-orders.json',list);
   return {invitation:updated,order:o};
  });
  if(!result)return say(chat,'Buyurtma tayyorlash bosqichida emas.');
  if(result.error)return say(chat,'⚠️ '+result.error);
  await say(chat,'🎉 Taklifnomangiz tayyor!\n\n🤵 '+result.invitation.groom+'\n👰 '+result.invitation.bride+'\n\nHavolani mehmonlarga yuborishingiz mumkin.',[
   [{text:'🔗 Taklifnomani ochish',url:publicBase+'/i/'+result.order.slug}],
   [{text:'💌 Mehmon taklif qilish',callback_data:'invite:'+id}],
   [{text:'✏️ O‘zgartirish',callback_data:'edit:'+id}],
   [{text:'📦 Buyurtmalarim',callback_data:'orders'}]
  ]);
 }
 async function askGuest(chat,user,id){
  const order=await store.mutate(async()=>{
   const list=await orders(),o=owned(list,user,id);
   if(!o||o.status!=='ready'||!o.slug)return null;
   for(const item of list)if(item.telegramUserId===user)item.guestMode=false;
   o.guestMode=true;
   await store.write('bot-orders.json',list);
   return o;
  });
  if(!order)return say(chat,'Mehmon taklifini faqat tayyor taklifnomadan yuborish mumkin.');
  return say(chat,'💌 Mehmon taklif qilish\n\nMehmonning ismini yuboring. Masalan: Sardor aka\n\nSizga shaxsiy nomi va taklifnoma havolasi kiritilgan, ulashishga tayyor post qaytaraman.',[
   [{text:'🔙 Buyurtmaga qaytish',callback_data:'order:'+id}]
  ]);
 }
 async function sendGuestPost(chat,user,name){
  const guest=clean(name,81);
  if(guest.length<2||guest.length>80)return say(chat,'Mehmon ismini 2–80 belgida yozing.');
  const order=await store.mutate(async()=>{
   const list=await orders();
   const o=list.find(x=>x.telegramUserId===user&&x.status==='ready'&&x.guestMode&&x.slug);
   if(!o)return null;
   o.guestMode=false;
   o.guestLinks=(o.guestLinks||[]).slice(-199);
   if(o.guestLinks.some(x=>x.name===guest))o.guestLinks=o.guestLinks.filter(x=>x.name!==guest);
   o.guestLinks.push({name:guest,createdAt:new Date().toISOString()});
   await store.write('bot-orders.json',list);
   return o;
  });
  if(!order)return false;
  const a=order.answers||{};
  const link=publicBase+'/i/'+encodeURIComponent(order.slug)+'?guest='+encodeURIComponent(guest);
  const date=String(a.eventDate||'').split('-').reverse().join('.');
  const letter='💌 TAKLIFLY | MAXSUS TAKLIFNOMA\n\n🌷 Hurmatli '+guest+'!\n\nSizni '+(a.groom||'Kuyov')+' va '+(a.bride||'Kelin')+'ning nikoh to‘yiga chin dildan taklif etamiz!\n\n📅 '+date+' · '+(a.eventTime||'')+'\n🏛 '+(a.venue||'')+'\n📍 '+(a.address||'')+'\n\nSizni oramizda ko‘rish biz uchun katta baxt! 🌸\n\n🔗 Shaxsiy taklifnomangiz:\n'+link;
  const share='https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent('💌 Hurmatli '+guest+'!\n'+(a.groom||'')+' va '+(a.bride||'')+' to‘yiga taklif etamiz. 🎉');
  await say(chat,'✅ Ulashishga tayyor taklif posti:\n\n'+letter,[
   [{text:'📨 Telegramda ulashish',url:share}],
   [{text:'🔗 Taklifnomani ochish',url:link}],
   [{text:'💌 Yana mehmon taklif qilish',callback_data:'invite:'+order.id}],
   [{text:'📦 Buyurtmaga qaytish',callback_data:'order:'+order.id}]
  ]);
  return true;
 }
 async function redeemWebsiteCode(user,chat,code){
  const claim=String(code||'').trim().toUpperCase();
  if(!/^TKF-[A-F0-9]{24}$/.test(claim))return say(chat,'Aktivlashtirish kodi formati xato. Masalan: /redeem TKF-...');
  const result=await store.mutate(async()=>{
   const cardOrders=await store.read('card-orders.json',[]);
   const payment=cardOrders.find(x=>x.status==='approved'&&x.claimCode===claim);
   if(!payment)return {error:'Kod topilmadi yoki admin tomonidan tasdiqlanmagan.'};
   if(payment.redeemedBy&&payment.redeemedBy!==user)return {error:'Bu kod boshqa akkauntga biriktirilgan.'};
   const list=await orders();
   const existing=list.find(x=>x.cardOrderId===payment.id);
   if(existing){
    if(existing.telegramUserId!==user)return {error:'Bu kod oldin ishlatilgan.'};
    existing.active=true;
    for(const item of list)if(item.telegramUserId===user&&item.id!==existing.id)item.active=false;
    if(existing.status==='ready')return {ready:existing};
    if(!existing.step)existing.step='groom';
    existing.status='collecting';
    await store.write('bot-orders.json',list);
    return {order:existing,existing:true};
   }
   const invitations=await store.invites();
   const orderId=randomUUID();
   const invite=normalize({slug:'web-'+payment.id.slice(0,8),template:payment.template,published:false},{
    ...starter(),id:randomUUID(),published:false,views:0,botOrderId:orderId,
    telegramUserId:user,webOrderId:payment.id
   });
   invitations.push(invite);
   await store.write('invitations.json',invitations);
   for(const item of list)if(item.telegramUserId===user)item.active=false;
   const order={
    id:orderId,telegramUserId:user,chatId:chat,template:payment.template,
    stars:0,status:'collecting',step:'groom',active:true,answers:{},
    invitationId:invite.id,slug:invite.slug,cardOrderId:payment.id,
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
   };
   list.push(order);
   payment.redeemedBy=user;payment.redeemedAt=new Date().toISOString();
   await store.write('bot-orders.json',list);
   await store.write('card-orders.json',cardOrders);
   return {order,existing:false};
  });
  if(result.error)return say(chat,'⚠️ '+result.error);
  if(result.ready)return getOrder(chat,user,result.ready.id);
  await say(chat,result.existing?'✅ Buyurtmangizni to‘ldirishni davom ettiramiz.':'✅ Aktivlashtirish kodi qabul qilindi! Taklifnomangiz uchun ma’lumotlarni kiriting.');
  return prompt(chat,result.order);
 }
 async function processUpdate(update){
  const callback=update.callback_query;
  if(callback){
   await ack(callback).catch(()=>{});
   const user=callback.from.id,chat=callback.message?.chat?.id||user,data=callback.data||'',i=data.indexOf(':'),act=i<0?data:data.slice(0,i),value=i<0?'':data.slice(i+1);
   if(act==='home')return welcome(chat);
   if(act==='catalog')return catalog(chat);
   if(act==='redeem_info')return say(chat,'🔑 Aktivlashtirish kodi\n\nMustaqil saytdan xarid qilingan va tasdiqlangan taklifnoma kodini quyidagi shaklda yuboring:\n/redeem TKF-...');
   if(act==='support')return say(chat,'💬 Yordam va to‘lov masalalari: /paysupport\nBuyurtmani to‘ldirishni davom ettirish: /orders');
   if(act==='orders')return myOrders(chat,user);
   if(act==='view')return showTemplate(chat,value);
   if(act==='buy')return createOrder(chat,user,value);
   if(act==='order')return getOrder(chat,user,value);
   if(act==='invite')return askGuest(chat,user,value);
   if(act==='continue'||act==='edit'){const o=await activate(user,value,'groom');return o?prompt(chat,o):say(chat,'Buyurtma topilmadi.')}
   if(act==='skip')return skip(user,chat,value);
   if(act==='back')return back(user,chat,value);
   if(act==='publish')return publish(user,chat,value);
   return say(chat,'Buyruq topilmadi. /start ni bosing.');
  }
  if(update.pre_checkout_query)return handleCheckout(update.pre_checkout_query);
  const msg=update.message;
  if(!msg||msg.chat?.type!=='private'||!msg.from)return;
  const user=msg.from.id,chat=msg.chat.id,command=String(msg.text||'').trim().split(/\s+/)[0].split('@')[0];
  if(msg.successful_payment)return paid(msg);
  if(command==='/start')return welcome(chat);
  if(command==='/templates')return catalog(chat);
  if(command==='/orders')return myOrders(chat,user);
  if(command==='/redeem')return redeemWebsiteCode(user,chat,String(msg.text||'').trim().split(/\s+/).slice(1).join(' '));
  if(command==='/invite')return myOrders(chat,user);
  if(command==='/cancel'){
   await store.mutate(async()=>{const list=await orders();for(const o of list)if(o.telegramUserId===user)o.active=false;await store.write('bot-orders.json',list)});
   return say(chat,'To‘ldirish to‘xtatildi. Xaridingiz saqlangan. /orders orqali davom etishingiz mumkin.');
  }
  if(command==='/terms')return say(chat,'📃 To‘lov Telegram Stars orqali. Raqamli taklifnoma muvaffaqiyatli to‘lovdan keyin tayyorlanadi. Buyurtmani qayta tahrirlashingiz mumkin. Savollar uchun /paysupport.');
  if(command==='/paysupport'||command==='/support'||command==='/help')
   return say(chat,'Yordam: '+(process.env.TELEGRAM_SUPPORT_USERNAME?'@'+process.env.TELEGRAM_SUPPORT_USERNAME.replace(/^@/,''):'Taklifnoma sotuvchisi bilan bog‘laning.')+'\nBuyurtmalar: /orders\nSavdo shartlari: /terms');
  if(command.startsWith('/'))return say(chat,'Menyuni ochish uchun /start ni bosing.');
  if((await orders()).some(o=>o.telegramUserId===user&&o.guestMode&&o.status==='ready'))return sendGuestPost(chat,user,String(msg.text||''));
  return answerField(chat,user,msg);
 }
 async function webhook(req,res,url){
  if(url.pathname!=='/api/telegram/webhook')return false;
  const respond=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
  if(req.method!=='POST'){respond(405,{ok:false});return true}
  if(!configured){respond(503,{ok:false,reason:'not_configured'});return true}
  if(!safe(req.headers['x-telegram-bot-api-secret-token'],webhookSecret)){respond(403,{ok:false});return true}
  if(!String(req.headers['content-type']||'').startsWith('application/json')){respond(415,{ok:false});return true}
  try{
   let total=0,chunks=[];
   for await(const chunk of req){total+=chunk.length;if(total>1_000_000){respond(413,{ok:false});return true}chunks.push(chunk)}
   const update=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(!Number.isSafeInteger(update.update_id)){respond(400,{ok:false});return true}
   if(updated.has(update.update_id)){respond(200,{ok:true,duplicate:true});return true}
   await processUpdate(update);
   updated.add(update.update_id);if(updated.size>1000)updated.clear();
   respond(200,{ok:true});return true;
  }catch(e){console.error('telegram update error:',e.message);respond(500,{ok:false});return true}
 }
 async function setWebhook(){
  if(!configured)return {ok:false,reason:'not_configured'};
  const remote=await tg('setWebhook',{url:publicBase+'/api/telegram/webhook',secret_token:webhookSecret,allowed_updates:['message','callback_query','pre_checkout_query'],drop_pending_updates:false});
  const me=await tg('getMe',{});username=me.username||username;
  return {ok:!!remote,bot:username};
 }
 return {webhook,processUpdate,setWebhook,configured,prices:pricesByTemplate,templates:BOT_TEMPLATES,getOrders:orders};
}
