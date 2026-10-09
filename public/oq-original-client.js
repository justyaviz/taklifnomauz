(()=>{
'use strict';
const $=id=>document.getElementById(id);
let inv={};try{inv=JSON.parse($('invite-data-original').textContent)}catch{}
const demo=!!inv.previewDemo,slug=inv.slug||'oq-saroy-original';
const mo=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'],mr=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const du=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'],dr=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const parts=String(inv.eventDate||'2026-11-21').split('-').map(Number),yr=parts[0],mon=parts[1],dy=parts[2],time=inv.eventTime||'19:00',weekday=new Date(Date.UTC(yr,mon-1,dy,12)).getUTCDay();
let lang='uz';try{lang=localStorage.getItem('taklifly-original-lang')==='ru'?'ru':'uz'}catch{}
const T=(uz,ru)=>lang==='ru'?ru:uz;
const songDefault='https://taklifnoma.imaantech.uz/assets/audio/song4.mp3',custom=String(inv.musicUrl||''),oldSong=!custom||custom.includes('ef3c85d8-13c4-4a46-973d-a0d43e01ec60')||custom.includes('/assets/audio/song4.mp3');
const musicUrl=oldSong?songDefault:custom,audio=musicUrl?new Audio(musicUrl):null,offset=oldSong?26:Number(inv.audioStart||0);
if(audio){audio.preload='metadata';audio.loop=true;audio.volume=1;audio.addEventListener('play',musicState);audio.addEventListener('pause',musicState)}
else $('music').hidden=true;
let opened=false,editing=null,items=demo?[{id:'s1',name:'Dilnoza',text:"Baxtli bo'linglar! 💐"},{id:'s2',name:'Sardor',text:"To'yingiz muborak bo'lsin!"}]:[];
const storageKey='taklifly-original-wishes-'+slug;
let own={};try{own=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}}catch{}
if(demo)own.s1='sample';
function init(){
 $('kuyov').textContent=$('lkuyov').textContent=inv.groom||'Muhammad';
 $('kelin').textContent=$('lkelin').textContent=inv.bride||'Amina';
 $('venue').textContent=inv.venue||'"Navro‘z" to‘yxonasi';$('address').textContent=inv.address||'Toshkent sh., Yakkasaroy tumani';
 $('lead').textContent=inv.lead||'Hayotimizdagi eng baxtli kunni Siz — aziz mehmonimiz bilan birga nishonlashni orzu qilamiz.';
 $('message').textContent=inv.message||'Sizning tashrifingiz bu quvonchli kunimizga alohida fayz va tabaruk baxsh etadi. Kelishingizni intiqlik bilan kutamiz.';
 $('family').textContent=inv.family||'Kuyov va kelin oilalari';
 if(!inv.allowWishes)$('wishesSection').hidden=true;
 if(inv.gallery&&inv.gallery.length){$('gallerySection').hidden=false;inv.gallery.slice(0,10).forEach(u=>{let im=document.createElement('img');im.src=u;im.loading='lazy';im.alt='To‘y xotirasi';$('galleryGrid').append(im)})}
 const location=inv.mapQuery||(inv.venue||'')+' '+(inv.address||'');
 $('mapFrame').src='https://maps.google.com/maps?q='+encodeURIComponent(location)+'&output=embed';
 $('mapGoogle').href=inv.googleUrl||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(location);
 $('mapYandex').href=inv.yandexUrl||'https://yandex.uz/maps/?text='+encodeURIComponent(location);
 if(inv.heroImage)document.querySelector('.pg.hero').style.backgroundImage='url('+JSON.stringify(inv.heroImage)+')';
 if(inv.backgroundImage)document.querySelector('.stage-bg').style.backgroundImage='url('+JSON.stringify(inv.backgroundImage)+')';
 const guest=(new URLSearchParams(locationSearch())).get('guest');
 if(guest){const p=document.createElement('p');p.style.cssText='font:23px var(--script);color:#9a7526;margin:7px 0';p.textContent='Hurmatli '+guest.slice(0,80)+'!';$('lead').before(p);$('wishName').value=guest.slice(0,40)}
 $('langBtn').addEventListener('click',e=>{const b=e.target.closest('button[data-lang]');if(b)setLanguage(b.dataset.lang)});
 $('opening').addEventListener('click',open);
 $('opening').tabIndex=0;$('opening').setAttribute('role','button');
 $('opening').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
 $('music').addEventListener('click',()=>{if(!audio)return;if(audio.paused)play();else audio.pause()});
 $('wishForm').addEventListener('submit',submitWish);
 $('wishCancel').addEventListener('click',()=>{editing=null;$('wishForm').reset();$('wishCancel').hidden=true;$('wishSend').textContent=T('Tilak yuborish','Отправить пожелание')});
 const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('is-visible')})},{threshold:.1});
 document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
 setLanguage(lang);getWishes();tick();setInterval(tick,1000);
}
function locationSearch(){return window.location.search||''}
function setLanguage(l){
 lang=l==='ru'?'ru':'uz';document.documentElement.lang=lang;try{localStorage.setItem('taklifly-original-lang',lang)}catch{}
 document.querySelectorAll('[data-uz][data-ru]').forEach(el=>{if(el.classList.contains('scrolld'))el.firstChild.textContent=el.dataset[lang]+' ';else el.textContent=el.dataset[lang]});
 $('langBtn').querySelectorAll('button').forEach(el=>el.classList.toggle('on',el.dataset.lang===lang));
 $('heroDate').textContent=lang==='ru'?(dy+'-'+mr[mon-1]+' · '+yr):(dy+'-'+mo[mon-1]+' · '+yr);
 $('heroDay').textContent=T(du[weekday]+' kuni',dr[weekday]);
 $('heroTime').textContent=T('Soat '+time+' da','В '+time);
 $('dayText').textContent=$('heroDay').textContent;$('timeText').textContent=$('heroTime').textContent;
 $('lockDate').textContent=$('heroDate').textContent;
 $('calMonth').textContent=(lang==='ru'?mr[mon-1]:mo[mon-1])+', '+yr;
 $('wishName').placeholder=T('Ismingiz','Ваше имя');$('wishText').placeholder=T('Yosh oilaga tilagingiz...','Ваше пожелание молодой семье...');
 document.title=(inv.groom||'Muhammad')+' & '+(inv.bride||'Amina');
 calendar();schedule();renderWishes();
}
function calendar(){
 const root=$('calGrid');root.replaceChildren();
 (lang==='ru'?['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ']:['YA','DU','SE','CHO','PA','JU','SHA']).forEach(x=>{const el=document.createElement('span');el.className='weekday';el.textContent=x;root.append(el)});
 for(let x=0;x<new Date(Date.UTC(yr,mon-1,1)).getUTCDay();x++)root.append(document.createElement('span'));
 for(let x=1;x<=new Date(Date.UTC(yr,mon,0)).getUTCDate();x++){const el=document.createElement('span');el.textContent=x;if(x===dy)el.className='current';root.append(el)}
}
function schedule(){
 const root=$('schedule');root.replaceChildren();
 const rows=(inv.schedule&&inv.schedule.length?inv.schedule:[
  {time:'17:00',title:'Mehmonlarni kutib olish'},{time:'18:00',title:'Nikoh marosimi'},{time:'19:00',title:'Ziyofat boshlanishi'},{time:'20:00',title:'Milliy taomlar'},{time:'21:00',title:'Raqs va davra'}
 ]);
 const russian={'Mehmonlarni kutib olish':'Встреча гостей','Nikoh marosimi':'Свадебная церемония','Ziyofat boshlanishi':'Начало банкета','Milliy taomlar':'Национальные блюда','Raqs va davra':'Танцы'};
 rows.forEach(x=>{const row=document.createElement('div');row.className='schedule-row'+(x.time===time?' is-current':'');const t=document.createElement('time');t.textContent=x.time;const a=document.createElement('span');a.textContent=lang==='ru'?(russian[x.title]||x.title||x.label||''):(x.title||x.label||'');row.append(t,a);root.append(row)});
}
function tick(){
 const target=Date.parse(String(inv.eventDate||'2026-11-21')+'T'+time+':00'+(inv.timezone||'+05:00'));
 const seconds=Math.max(0,Math.floor((target-Date.now())/1000));
 const vals=[Math.floor(seconds/86400),Math.floor(seconds%86400/3600),Math.floor(seconds%3600/60),seconds%60];
 ['days','hours','minutes','seconds'].forEach((k,n)=>{$(k).textContent=String(vals[n]).padStart(2,'0')});
}
function musicState(){$('music').classList.toggle('is-playing',!!audio&&!audio.paused);$('music').setAttribute('aria-pressed',String(!!audio&&!audio.paused))}
function play(){if(!audio)return;if(audio.currentTime<offset-.5&&audio.readyState>0)try{audio.currentTime=offset}catch{}audio.play().catch(musicState)}
function open(){
 if(opened)return;opened=true;document.body.classList.add('is-opened');
 const overlay=$('opening');overlay.classList.add('is-opening');play();
 const dark=overlay.querySelector('.sr-dark'),glow=overlay.querySelector('.sr-glow');
 const hero=document.querySelector('.pg.hero'),q=s=>hero.querySelector(s);
 const lines=[[q('.eyebrow'),1500,700,0],[q('#kuyov'),2000,1300,1],[q('.amp'),3100,500,0],[q('#kelin'),3400,1300,1],[q('.c-orn'),4500,600,0],[q('#heroDate'),4900,900,1],[q('.c-sub'),5600,700,0],[q('.scrolld'),6200,700,0]].filter(x=>x[0]);
 const cl=x=>Math.max(0,Math.min(1,x)),ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
 let elapsed=0,last=0,doneFlag=false;
 function draw(t){
  const lit=ease(cl((t-600)/3400));dark.style.opacity=String(1-lit);
  const flick=t<900?(Math.sin(t/900*Math.PI*3)>.2?.22:.05):0;
  glow.style.opacity=String(Math.max(flick,Math.sin(Math.PI*cl((t-600)/4300))*.85));
  lines.forEach(a=>{const [el,start,len,wipe]=a,k=cl((t-start)/len);el.style.opacity=String(wipe?(k>0?1:0):ease(k));if(wipe){const cut='inset(-20% '+((1-k)*104).toFixed(1)+'% -20% -4%)';el.style.clipPath=cut;el.style.webkitClipPath=cut}});
  if(t>=5000){document.body.style.overflow='auto';document.body.style.touchAction='auto'}
 }
 function done(){if(doneFlag)return;doneFlag=true;draw(7000);overlay.classList.add('is-done');overlay.style.pointerEvents='none'}
 function frame(t){if(doneFlag)return;if(last)elapsed+=Math.min(100,Math.max(0,t-last));last=t;draw(elapsed);if(elapsed>=7000)done();else requestAnimationFrame(frame)}
 draw(0);requestAnimationFrame(frame);setTimeout(done,15500);
}
function renderWishes(){
 const root=$('wishList');root.replaceChildren();
 if(!items.length){const empty=document.createElement('p');empty.textContent=T('Birinchi bo‘lib tilak qoldiring 💐','Оставьте пожелание первым 💐');root.append(empty)}
 for(const x of items){
  const row=document.createElement('div');row.className='wish-item';
  const n=document.createElement('div');n.className='wish-name';n.textContent=x.name;
  const txt=document.createElement('div');txt.className='wish-text';txt.textContent=x.text;row.append(n,txt);
  if(own[x.id]){
   const actions=document.createElement('div');actions.className='wish-acts';
   const edit=document.createElement('button');edit.type='button';edit.className='wish-act';edit.textContent=T('Tahrirlash','Изменить');
   edit.onclick=()=>{editing=x.id;$('wishName').value=x.name;$('wishText').value=x.text;$('wishCancel').hidden=false;$('wishSend').textContent=T('Saqlash','Сохранить')};
   const del=document.createElement('button');del.type='button';del.className='wish-act';del.textContent=T('O‘chirish','Удалить');del.onclick=()=>removeWish(x.id);
   actions.append(edit,del);row.append(actions);
  }
  root.append(row);
 }
}
async function getWishes(){
 if(demo){renderWishes();return}
 try{const r=await fetch('/api/invitations/'+encodeURIComponent(slug)+'/wishes');if(!r.ok)throw Error();const d=await r.json();items=d.wishes||[];renderWishes()}catch{$('wishNote').textContent=T('Tilaklarni olishda xatolik','Ошибка загрузки пожеланий')}
}
async function removeWish(id){
 if(demo){items=items.filter(x=>x.id!==id);renderWishes();return}
 if(!confirm(T('O‘chirilsinmi?','Удалить?')))return;
 try{const r=await fetch('/api/invitations/'+encodeURIComponent(slug)+'/wishes/'+encodeURIComponent(id),{method:'DELETE',headers:{'content-type':'application/json','x-wish-token':own[id]},body:'{}'});if(!r.ok)throw Error();delete own[id];localStorage.setItem(storageKey,JSON.stringify(own));await getWishes()}catch{$('wishNote').textContent=T('Xatolik','Ошибка')}
}
async function submitWish(e){
 e.preventDefault();
 const name=$('wishName').value.trim(),text=$('wishText').value.trim();if(name.length<2||text.length<3)return;
 const btn=$('wishSend');btn.disabled=true;
 try{
  if(demo){if(editing){items=items.map(x=>x.id===editing?{...x,name,text}:x);renderWishes();$('wishNote').textContent=T('Tilagingiz yangilandi ✓','Пожелание изменено ✓')}else $('wishNote').textContent=T('Namunada tilak yuborilmaydi.','В демо пожелания не отправляются.')}
  else{
   const url='/api/invitations/'+encodeURIComponent(slug)+'/wishes'+(editing?'/'+encodeURIComponent(editing):'');
   const r=await fetch(url,{method:editing?'PUT':'POST',headers:{'content-type':'application/json',...(editing?{'x-wish-token':own[editing]}:{})},body:JSON.stringify({name,text})});
   const data=await r.json();if(!r.ok)throw Error(data.error||'Xatolik');
   if(data.token&&data.wish){own[data.wish.id]=data.token;localStorage.setItem(storageKey,JSON.stringify(own))}
   $('wishNote').textContent=T('Rahmat! Tilagingiz qo‘shildi 💐','Спасибо! Пожелание добавлено 💐');await getWishes();
  }
 }catch(x){$('wishNote').textContent=String(x.message||'Xatolik')}
 finally{editing=null;btn.disabled=false;$('wishCancel').hidden=true;$('wishSend').textContent=T('Tilak yuborish','Отправить пожелание');$('wishForm').reset()}
}
init();
})();
