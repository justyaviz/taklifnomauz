import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export const err=(status,message)=>Object.assign(new Error(message),{httpStatus:status});
export const clean=(s,n=200)=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n);
export const slugify=s=>clean(s,90).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,60);
export const jsonSafe=o=>JSON.stringify(o).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
export const starter=()=>({
 id:randomUUID(),slug:'oq-saroy',title:'OQ SAROY — Muhammad & Amina',
 groom:'Muhammad',bride:'Amina',eventDate:'2026-11-21',eventTime:'19:00',timezone:'+05:00',eventType:'Nikoh to‘yi',
 venue:'"Navro‘z" to‘yxonasi',address:'Toshkent sh., Yakkasaroy tumani',mapQuery:'Navroz toyxonasi Toshkent Yakkasaroy',
 googleUrl:'',yandexUrl:'',lead:'Hayotimizdagi eng baxtli kunni Siz — aziz mehmonimiz bilan birga nishonlashni orzu qilamiz.',
 message:'Sizning tashrifingiz bu quvonchli kunimizga alohida fayz va tabaruk baxsh etadi. Kelishingizni intiqlik bilan kutamiz.',
 family:'Kuyov va kelin oilalari',dressCode:'',gallery:[],heroImage:'',backgroundImage:'',
 musicUrl:'https://taklifnoma.imaantech.uz/assets/audio/song4.mp3',audioStart:26,
 colors:{gold:'#b89246',navy:'#15192a'},schedule:[
  {time:'17:00',title:'Mehmonlarni kutib olish'},{time:'18:00',title:'Nikoh marosimi'},
  {time:'19:00',title:'Ziyofat boshlanishi'},{time:'20:00',title:'Milliy taomlar'},{time:'21:00',title:'Raqs va davra'}
 ],published:true,allowWishes:true,allowRsvp:true,views:0,
 createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
});
export function normalize(d,existing){
 const o={...(existing||starter())};
 for(const [key,max] of Object.entries({title:100,groom:80,bride:80,eventDate:10,eventTime:5,timezone:6,eventType:100,venue:150,address:300,mapQuery:300,googleUrl:1500,yandexUrl:1500,lead:1000,message:1500,family:120,dressCode:250,heroImage:1500,backgroundImage:1500,musicUrl:1500})){
  if(key in d)o[key]=clean(d[key],max)
 }
 if('slug' in d){o.slug=slugify(d.slug);if(o.slug.length<3)throw err(400,'Havola nomi kamida 3 belgi bo‘lsin')}
 for(const k of ['published','allowWishes','allowRsvp'])if(k in d)o[k]=Boolean(d[k]);
 if('audioStart' in d)o.audioStart=Math.min(3600,Math.max(0,Number(d.audioStart)||0));
 if('gallery' in d){if(!Array.isArray(d.gallery))throw err(400,'Galereya noto‘g‘ri');o.gallery=d.gallery.slice(0,25).map(x=>clean(x,1500))}
 if('schedule' in d){if(!Array.isArray(d.schedule))throw err(400,'Dastur noto‘g‘ri');o.schedule=d.schedule.slice(0,20).map(x=>({time:clean(x?.time,5),title:clean(x?.title,120)})).filter(x=>x.title)}
 if('colors' in d){o.colors={gold:/^#[a-f0-9]{6}$/i.test(d.colors?.gold)?d.colors.gold:o.colors.gold,navy:/^#[a-f0-9]{6}$/i.test(d.colors?.navy)?d.colors.navy:o.colors.navy}}
 if(!/^\d{4}-\d{2}-\d{2}$/.test(o.eventDate)||!Number.isFinite(Date.parse(o.eventDate+'T12:00:00Z')))throw err(400,'Sana noto‘g‘ri');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(o.eventTime))throw err(400,'Vaqt noto‘g‘ri');
 if(!/^[+-](?:0\d|1[0-4]):(?:00|15|30|45)$/.test(o.timezone))throw err(400,'Vaqt zonasi noto‘g‘ri');
 const goodUrl=x=>!x||(/^https:\/\/[^\s"'<>]{3,1500}$/i.test(x))||(/^\/media\/[a-z0-9-]+\.(webp|png|jpg|gif|mp3)$/i.test(x));
 for(const k of ['heroImage','backgroundImage','musicUrl','googleUrl','yandexUrl'])if(!goodUrl(o[k]))throw err(400,k+' uchun HTTPS havola kerak');
 if(o.gallery.some(x=>!goodUrl(x)))throw err(400,'Galereyada noto‘g‘ri havola');
 if(!o.groom||!o.bride||!o.venue)throw err(400,'Ismlar va joy nomi majburiy');
 o.updatedAt=new Date().toISOString();return o;
}
export function storage(root){
 // Persist the starter invitation exactly once, including its stable ID.
 const initial=path.join(root,'invitations.json');
 if(!existsSync(initial)){
  mkdirSync(root,{recursive:true});
  try{writeFileSync(initial,JSON.stringify([starter()]),{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e}
 }
 let locked=Promise.resolve();
 async function read(name,def=[]){try{return JSON.parse(await readFile(path.join(root,name),'utf8'))}catch(e){if(e.code==='ENOENT')return typeof def==='function'?def():def;throw e}}
 async function write(name,value){await mkdir(root,{recursive:true});const target=path.join(root,name),tmp=target+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(value));await rename(tmp,target)}
 function mutate(fn){const promise=locked.then(fn);locked=promise.catch(()=>{});return promise}
 return {read,write,mutate,invites:()=>read('invitations.json',()=>[starter()])};
}
