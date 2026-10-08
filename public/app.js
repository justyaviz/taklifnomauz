const tr={
uz:{inviteTitle:'TAKLIFNOMA',tapLight:'CHIROQLARNI YOQISH UCHUN BOSING',weddingInvitation:'NIKOH TO‘YIGA TAKLIFNOMA',and:'va',heroTime:'SHANBA KUNI · SOAT 19:00 DA',scroll:'PASTGA SURING',dearGuest:'Aziz mehmon',wishPara1:'Hayotimizdagi eng baxtli kunni Siz — aziz mehmonimiz bilan birga nishonlashni orzu qilamiz.',wishPara2:'Sizning tashrifingiz bu quvonchli kunimizga alohida fayz va tabaruk baxsh etadi. Kelishingizni intiqlik bilan kutamiz.',respect:'Hurmat ila',families:'KUYOV VA KELIN OILALARI',moments:'Bizning lahzalarimiz',momentsText:'Ikki qalbning eng go‘zal hikoyasi...',datePre:'UNUTILMAS KUN',weddingDay:'To‘y kuni',calendarMonth:'Noyabr, 2026',specialDay:'BIZNING KUNIMIZ',program:'Marosim tartibi',schedule1:'Mehmonlarni kutib olish',schedule2:'Nikoh marosimi',schedule3:'Ziyofat boshlanishi',schedule4:'Milliy taomlar',schedule5:'Raqs va davra',where:'QAYERDA UCHRASHAMIZ?',location:'Manzil',venue:'to‘yxonasi',address:'Toshkent sh., Yakkasaroy tumani',mapPrompt:'To‘yxona joylashuvini xaritada ko‘ring',googleMap:'XARITADA KO‘RISH',yandexMap:'YANDEX XARITA',yourWords:'MEHMONLAR SO‘ZI',wishes:'Tilaklar',yourName:'Ismingiz',yourWish:'Yosh oilaga tilagingiz',sendWish:'TILAK YUBORISH',cancel:'BEKOR QILISH',timeLeft:'TO‘YGA QOLGAN VAQT',day:'KUN',hour:'SOAT',minute:'DAQIQA',second:'SONIYA',waiting:'Sizni intiqlik bilan kutamiz',edit:'Tahrirlash',delete:'O‘chirish',empty:'Hali tilaklar yo‘q',invalid:'Ism yoki tilak uzunligini tekshiring.',sent:'Tilagingiz yuborildi!',edited:'Tilak tahrirlandi!',deleted:'Tilak o‘chirildi.',failed:'Xatolik yuz berdi. Birozdan so‘ng urinib ko‘ring.',confirmDelete:'Tilakni o‘chirmoqchimisiz?',yourNamePlaceholder:'Ismingiz',yourWishPlaceholder:'Yosh oilaga tilagingiz...'},
ru:{inviteTitle:'ПРИГЛАШЕНИЕ',tapLight:'НАЖМИТЕ, ЧТОБЫ ЗАЖЕЧЬ СВЕТ',weddingInvitation:'ПРИГЛАШЕНИЕ НА СВАДЬБУ',and:'и',heroTime:'СУББОТА · В 19:00',scroll:'ЛИСТАЙТЕ ВНИЗ',dearGuest:'Дорогой гость',wishPara1:'Мы мечтаем разделить самый счастливый день нашей жизни с Вами — нашим дорогим гостем.',wishPara2:'Ваше присутствие подарит нашему радостному дню особую теплоту. С нетерпением ждём Вас.',respect:'С уважением',families:'СЕМЬИ ЖЕНИХА И НЕВЕСТЫ',moments:'Наши моменты',momentsText:'Самая красивая история двух сердец...',datePre:'НЕЗАБЫВАЕМЫЙ ДЕНЬ',weddingDay:'День свадьбы',calendarMonth:'Ноябрь, 2026',specialDay:'НАШ ОСОБЕННЫЙ ДЕНЬ',program:'Программа торжества',schedule1:'Встреча гостей',schedule2:'Церемония никях',schedule3:'Начало банкета',schedule4:'Национальные блюда',schedule5:'Танцы и веселье',where:'ГДЕ МЫ ВСТРЕТИМСЯ?',location:'Адрес',venue:'банкетный зал',address:'г. Ташкент, Яккасарайский район',mapPrompt:'Посмотрите местоположение на карте',googleMap:'ПОСМОТРЕТЬ НА КАРТЕ',yandexMap:'ЯНДЕКС КАРТЫ',yourWords:'ПОЖЕЛАНИЯ ГОСТЕЙ',wishes:'Пожелания',yourName:'Ваше имя',yourWish:'Пожелание молодожёнам',sendWish:'ОТПРАВИТЬ ПОЖЕЛАНИЕ',cancel:'ОТМЕНА',timeLeft:'ДО СВАДЬБЫ ОСТАЛОСЬ',day:'ДНЕЙ',hour:'ЧАСОВ',minute:'МИНУТ',second:'СЕКУНД',waiting:'С нетерпением ждём вас',edit:'Изменить',delete:'Удалить',empty:'Пожеланий пока нет',invalid:'Проверьте длину имени и пожелания.',sent:'Пожелание отправлено!',edited:'Пожелание изменено!',deleted:'Пожелание удалено.',failed:'Произошла ошибка. Попробуйте позже.',confirmDelete:'Удалить пожелание?',yourNamePlaceholder:'Ваше имя',yourWishPlaceholder:'Ваше пожелание молодожёнам...'}
};

const invitation=(()=>{try{return JSON.parse(document.querySelector('#invite-data')?.textContent||'null')}catch{return null}})();
const invitationSlug=invitation?.slug||'oq-saroy';
const wishesEndpoint=invitation?'/api/invitations/'+encodeURIComponent(invitationSlug)+'/wishes':'/api/wishes';
const wishStorageKey=invitation?'oq-wish-owners-'+invitationSlug:'oq-wish-owners';
const guestParam=(new URLSearchParams(location.search).get('guest')||'').trim().slice(0,80);
function invitationTime(){return invitation?(invitation.eventDate+'T'+invitation.eventTime+':00'+invitation.timezone):'2026-11-21T19:00:00+05:00'}
const monthNames={
 uz:['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'],
 ru:['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
};
function monthName(lang){
 const [year,month]=(invitation?.eventDate||'2026-11-21').split('-').map(Number);
 const name=monthNames[lang==='ru'?'ru':'uz'][month-1];
 return name[0].toUpperCase()+name.slice(1)+', '+year;
}
function formatInvitationDate(lang){
 const [year,month,day]=(invitation?.eventDate||'2026-11-21').split('-').map(Number);
 const name=monthNames[lang==='ru'?'ru':'uz'][month-1];
 return day+'-'+(lang==='ru'?name:name[0].toUpperCase()+name.slice(1))+' · '+year;
}
function heroMoment(lang){
 const d=new Date((invitation?.eventDate||'2026-11-21')+'T12:00:00Z');
 const days=lang==='ru'?['ВОСКРЕСЕНЬЕ','ПОНЕДЕЛЬНИК','ВТОРНИК','СРЕДА','ЧЕТВЕРГ','ПЯТНИЦА','СУББОТА']:['YAKSHANBA','DUSHANBA','SESHANBA','CHORSHANBA','PAYSHANBA','JUMA','SHANBA'];
 return days[d.getUTCDay()]+' · '+(lang==='ru'?'В ':'SOAT ')+(invitation?.eventTime||'19:00')+(lang==='ru'?'':' DA');
}
function setElement(selector,value){const el=document.querySelector(selector);if(el)el.textContent=String(value??'')}
function applyInvitation(){
 if(!invitation)return;
 document.body.dataset.template=invitation.template||'oq-saroy';
 setElement('.names span:first-child',invitation.groom);
 setElement('.names span:last-child',invitation.bride);
 setElement('.end-names',invitation.groom+' va '+invitation.bride);
 document.title=invitation.groom+' & '+invitation.bride+' — Taklifnoma';
 const dateDisplay=formatInvitationDate('uz');
 setElement('.date-text',dateDisplay);
 setElement('.end-date',dateDisplay);
 setElement('.venue',invitation.venue);
 const mapText=invitation.mapQuery||invitation.venue+' '+invitation.address;
 const mlinks=document.querySelectorAll('.location a[href]');
 if(mlinks[0])mlinks[0].href=invitation.googleUrl||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapText);
 if(mlinks[1])mlinks[1].href=invitation.yandexUrl||'https://yandex.uz/maps/?text='+encodeURIComponent(mapText);
 setElement('.eyebrow',invitation.eventType||'Nikoh to‘yiga taklifnoma');
 if(invitation.colors?.gold)document.documentElement.style.setProperty('--gold',invitation.colors.gold);
 if(invitation.colors?.navy)document.documentElement.style.setProperty('--navy',invitation.colors.navy);
 if(invitation.heroImage){
  for(const sel of ['.hero','.intro-bg']){const el=document.querySelector(sel);if(el)el.style.backgroundImage='url("'+encodeURI(invitation.heroImage).replace(/"/g,'%22')+'")'}
 }
 if(invitation.backgroundImage){
  const mobile=document.querySelector('.mobile');
  if(mobile)mobile.style.backgroundImage='url("'+encodeURI(invitation.backgroundImage).replace(/"/g,'%22')+'")';
  document.querySelectorAll('.section').forEach(el=>{el.style.backgroundImage='url("'+encodeURI(invitation.backgroundImage).replace(/"/g,'%22')+'")';el.style.backgroundSize='cover'});
 }
 for(const lang of ['uz','ru']){
  tr[lang].heroTime=heroMoment(lang);
  tr[lang].calendarMonth=monthName(lang);
  tr[lang].address=invitation.address;
  tr[lang].venue='';
  tr[lang].wishPara1=invitation.lead;
  tr[lang].wishPara2=invitation.message;
  tr[lang].families=invitation.family;
  tr[lang].weddingInvitation=invitation.eventType||tr[lang].weddingInvitation;
 }
 const rows=document.querySelector('.timeline');if(rows){
  rows.replaceChildren();
  (invitation.schedule||[]).forEach(item=>{
   const row=document.createElement('div'),time=document.createElement('time'),span=document.createElement('span');
   time.textContent=item.time||'';span.textContent=item.title||'';
   if(item.time===invitation.eventTime)row.className='chosen';
   row.append(time,span);rows.append(row);
  });
 }
 const gallery=document.querySelector('.memories');
 if(gallery&&invitation.gallery?.length){
  gallery.style.display='block';gallery.style.padding='55px 20px';
  const grid=document.createElement('div');grid.className='photos-grid';
  for(const src of invitation.gallery){const image=document.createElement('img');image.src=src;image.loading='lazy';image.alt='To‘y xotiralari';grid.append(image)}
  gallery.append(grid);
  const style=document.createElement('style');style.textContent='.photos-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:20px}.photos-grid img{width:100%;aspect-ratio:3/4;object-fit:cover;border:3px solid #e8d6b4;border-radius:8px}.photos-grid img:first-child:nth-last-child(odd){grid-column:1/-1;max-height:300px;aspect-ratio:4/3}';document.head.append(style);
 }
 const placeholder=document.querySelector('.map-placeholder');
 if(placeholder&&mapText){
  const iframe=document.createElement('iframe');iframe.title='To‘yxona xaritasi';iframe.loading='lazy';iframe.referrerPolicy='no-referrer-when-downgrade';iframe.style.cssText='border:0;width:100%;height:185px;display:block;border-radius:6px';
  iframe.src='https://maps.google.com/maps?q='+encodeURIComponent(mapText)+'&output=embed';
  placeholder.replaceChildren(iframe);
 }
 if(guestParam){
  const welcome=document.querySelector('.welcome h2');if(welcome){const badge=document.createElement('div');badge.textContent='Hurmatli '+guestParam+'!';badge.style.cssText='color:#e6cf9d;font:23px Georgia,serif;margin:8px auto 14px';welcome.insertAdjacentElement('afterend',badge)}
  const inp=document.querySelector('#wishName');if(inp)inp.value=guestParam;
 }
 if(invitation.dressCode){
  const place=document.querySelector('.location .rule');if(place){const p=document.createElement('p');p.textContent='Dress code: '+invitation.dressCode;place.insertAdjacentElement('afterend',p)}
 }
 if(invitation.allowRsvp)addRsvpSection();
 if(!invitation.allowWishes){
  const w=document.querySelector('.wishes-section');if(w)w.style.display='none';
 }
}
function addRsvpSection(){
 const section=document.createElement('section');section.className='section rsvp-section reveal visible';section.style.cssText='padding:55px 25px 70px;min-height:350px';
 const h=document.createElement('h2');h.textContent='Kelishingizni tasdiqlang';
 const paragraph=document.createElement('p');paragraph.textContent='Marosimda qatnashishingiz haqida bizga xabar bering.';
 const form=document.createElement('form');form.style.cssText='display:grid;gap:12px;max-width:320px;margin:20px auto';
 const fields=[['name','text','Ismingiz'],['phone','tel','Telefon (ixtiyoriy)'],['count','number','Mehmon soni']];
 fields.forEach(([name,type,placeholder])=>{const input=document.createElement('input');input.name=name;input.type=type;input.placeholder=placeholder;input.style.cssText='width:100%;padding:12px;border:1px solid #dec9a0;background:#fffdf5;border-radius:8px;color:#3a3122';if(name==='name')input.required=true;if(name==='count'){input.min='1';input.max='20';input.value='1'}form.append(input)});
 const select=document.createElement('select');select.name='status';select.style.cssText='width:100%;padding:12px;border-radius:8px';
 for(const [value,label] of [['yes','Albatta kelaman'],['maybe','Balki kelaman'],['no','Kela olmayman']]){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)}
 const button=document.createElement('button');button.className='btn gold';button.type='submit';button.textContent='TASDIQLASH';const message=document.createElement('p');message.style.fontSize='14px';message.setAttribute('role','status');
 form.append(select,button,message);section.append(h,paragraph,form);
 form.addEventListener('submit',async e=>{e.preventDefault();button.disabled=true;try{const payload=Object.fromEntries(new FormData(form));payload.count=Number(payload.count)||1;const res=await fetch('/api/invitations/'+encodeURIComponent(invitationSlug)+'/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await res.json();if(!res.ok)throw Error(data.error||'Xatolik');message.textContent='Rahmat! Javobingiz qabul qilindi.';form.reset()}catch(e){message.textContent=e.message}finally{button.disabled=false}});
 const anchor=document.querySelector('.wishes-section')||document.querySelector('.count-section');anchor?.parentElement?.insertBefore(section,anchor);
 if(guestParam)form.elements.name.value=guestParam;
}

const $=id=>document.getElementById(id);
let owners={};try{owners=JSON.parse(localStorage.getItem(wishStorageKey)||'{}')}catch{}
const s={lang:localStorage.getItem('oq-lang')==='ru'?'ru':'uz',opened:false,playing:false,editing:null,wishes:[],owners};
const T=k=>tr[s.lang][k]||k;
function setLang(lang){
 s.lang=lang;document.documentElement.lang=lang;localStorage.setItem('oq-lang',lang);
 document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=T(el.dataset.t)});
 $('langUz').classList.toggle('selected',lang==='uz');$('langRu').classList.toggle('selected',lang==='ru');
 $('wishName').placeholder=T('yourNamePlaceholder');$('wishText').placeholder=T('yourWishPlaceholder');
 setMusicButton();document.title=invitation?(invitation.groom+' '+(lang==='ru'?'и':'va')+' '+invitation.bride+' — '+(lang==='ru'?'Приглашение':'Taklifnoma')):(lang==='ru'?'Мухаммад и Амина — приглашение':'Muhammad & Amina — OQ SAROY');
 if(invitation){
   const display=formatInvitationDate(lang);
   setElement('.date-text',display);setElement('.end-date',display);
   setElement('.end-names',invitation.groom+' '+(lang==='ru'?'и':'va')+' '+invitation.bride);
 }
 document.querySelector('meta[name="description"]').content=lang==='ru'?'Свадебное приглашение — 21 ноября 2026 года, Ташкент':'Muhammad va Amina nikoh to‘yiga taklifnoma · 21-noyabr, 2026-yil';
 calendar();renderWishes();
}
function calendar(){
 const root=$('calendarDays');root.replaceChildren();
 const weekdays=s.lang==='ru'?['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ']:['YA','DU','SE','CHO','PA','JU','SHA'];
 weekdays.forEach(day=>{const el=document.createElement('span');el.className='weekday';el.textContent=day;root.append(el)});
 const date=new Date((invitation?.eventDate||'2026-11-21')+'T12:00:00Z');
 const year=date.getUTCFullYear(),month=date.getUTCMonth(),days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 for(let i=0;i<new Date(Date.UTC(year,month,1)).getUTCDay();i++)root.append(document.createElement('span'));
 for(let day=1;day<=days;day++){const el=document.createElement('span');el.textContent=day;if(day===date.getUTCDate()){el.className='current';el.setAttribute('aria-label',T('weddingDay'))}root.append(el)}
}

function tick(){
 const end=Date.parse(invitationTime());
 const sec=Math.max(0,Math.floor((end-Date.now())/1000));
 const nums={days:Math.floor(sec/86400),hours:Math.floor(sec%86400/3600),minutes:Math.floor(sec%3600/60),seconds:sec%60};
 Object.entries(nums).forEach(([k,n])=>{$(k).textContent=String(n).padStart(2,'0')});
}
// Original audio behaviour: begin at 26s, use a media fragment for iOS,
// default full volume (no fade), and restart the track at 26s.
const TUY_BOB_AUDIO='https://d2ol7oe51mr4n9.cloudfront.net/user_3IlOECcDNYVkvUZvnr4wEMjZLN5/ef3c85d8-13c4-4a46-973d-a0d43e01ec60.mp3';
const invitationAudio=invitation?.musicUrl || '';
const isOriginalDefault=!invitationAudio || invitationAudio.includes('/assets/audio/song4.mp3');
const SOURCE_AUDIO=isOriginalDefault?TUY_BOB_AUDIO:invitationAudio;
const AUDIO_OFFSET=isOriginalDefault?0:Number(invitation.audioStart||0);
// The file remains on the reference provider's site. It is not bundled or owned here.
const audioEl=new Audio(SOURCE_AUDIO?SOURCE_AUDIO+'#t='+AUDIO_OFFSET:'');
if(!SOURCE_AUDIO)document.querySelector('#musicButton')?.classList.add('hidden');
audioEl.preload='auto';
audioEl.loop=false;
audioEl.volume=1;
function setMusicButton(){
 const button=$('musicButton');
 const playing=!audioEl.paused;
 s.playing=playing;
 button.classList.toggle('playing',playing);
 button.setAttribute('aria-pressed',String(playing));
 button.setAttribute('aria-label',playing?(s.lang==='ru'?'Выключить музыку':'Musiqani o‘chirish'):(s.lang==='ru'?'Включить музыку':'Musiqani yoqish'));
}
audioEl.addEventListener('play',setMusicButton);
audioEl.addEventListener('pause',setMusicButton);
audioEl.addEventListener('ended',()=>{
 try{audioEl.currentTime=AUDIO_OFFSET}catch{}
 audioEl.play().catch(setMusicButton);
});
audioEl.addEventListener('timeupdate',()=>{
 if(audioEl.currentTime<AUDIO_OFFSET-.35&&!audioEl.seeking){
   try{audioEl.currentTime=AUDIO_OFFSET}catch{}
 }
});
function music(on){
 if(!SOURCE_AUDIO)return;
 if(!on){audioEl.pause();setMusicButton();return}
 if(audioEl.readyState>0&&audioEl.currentTime<AUDIO_OFFSET-.35){
   try{audioEl.currentTime=AUDIO_OFFSET}catch{}
 }
 const promise=audioEl.play();
 if(promise?.catch)promise.catch(setMusicButton);
}
function easeSoft(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function limit01(t){return Math.max(0,Math.min(1,t))}
let introFrame=0,introFallback=0;
const heroLines=[
 {selector:'.hero-inside .eyebrow',start:1500,len:700,reveal:false},
 {selector:'.hero-inside .names span:first-child',start:2000,len:1300,reveal:true},
 {selector:'.hero-inside .names em',start:3100,len:500,reveal:false},
 {selector:'.hero-inside .names span:last-child',start:3400,len:1300,reveal:true},
 {selector:'.hero-inside .orn',start:4500,len:600,reveal:false},
 {selector:'.hero-inside .date-text',start:4900,len:900,reveal:true},
 {selector:'.hero-inside .hero-time',start:5600,len:700,reveal:false},
 {selector:'.scroll-tip',start:6200,len:700,reveal:false}
].map(x=>({...x,el:document.querySelector(x.selector)}));
function introDraw(ms){
 const lit=easeSoft(limit01((ms-600)/3400));
 const dark=$('intro').querySelector('.intro-bg');
 const veil=$('intro').querySelector('.intro-tint');
 const glow=$('intro').querySelector('.intro-glow');
 if(dark)dark.style.opacity=String(1-lit);
 if(veil)veil.style.opacity=String(1-lit);
 if(glow){
   const flick=ms<900?(Math.sin(ms/900*Math.PI*3)>.2?.22:.05):0;
   glow.style.opacity=String(Math.max(flick,Math.sin(Math.PI*limit01((ms-600)/4300))*.85));
 }
 for(const line of heroLines){
   if(!line.el)continue;
   let k=limit01((ms-line.start)/line.len);
   if(!line.reveal)k=easeSoft(k);
   line.el.style.opacity=String(k);
   if(line.reveal){
     const cut='inset(-20% '+((1-k)*104).toFixed(1)+'% -20% -4%)';
     line.el.style.clipPath=cut;
     line.el.style.webkitClipPath=cut;
   }
 }
 if(ms>=5000){
   document.body.classList.remove('invitation-locked');
   $('intro').style.pointerEvents='none';
 }
}
function openInvitation(){
 if(s.opened)return;
 s.opened=true;
 // Audio must start directly from the user's first tap.
 music(true);
 document.body.classList.add('opened');
 const intro=$('intro');
 intro.classList.add('running');
 const label=intro.querySelector('.intro-label');
 if(label)label.style.opacity='0';
 let last=0,elapsed=0,finished=false;
 function finish(){
   if(finished)return;
   finished=true;
   cancelAnimationFrame(introFrame);
   clearInterval(introFallback);
   introDraw(7000);
   intro.classList.add('done');
   document.body.classList.remove('invitation-locked');
 }
 function step(){
   if(finished)return;
   const now=performance.now();
   if(last)elapsed+=Math.min(100,Math.max(0,now-last));
   last=now;
   introDraw(Math.min(7000,elapsed));
   if(elapsed>=7000)finish();
 }
 function frame(){
   if(finished)return;
   step();
   introFrame=requestAnimationFrame(frame);
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced){finish();return}
 introDraw(0);
 introFrame=requestAnimationFrame(frame);
 introFallback=setInterval(()=>{if(performance.now()-last>60)step()},33);
 setTimeout(finish,15500);
}
document.body.classList.add('invitation-locked');
introDraw(0);
function el(tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e}
function renderWishes(){
 const list=$('wishList');list.replaceChildren();if(!s.wishes.length){list.append(el('p','',T('empty')));return}
 for(const w of s.wishes){
  const card=el('article','wish-card');const head=el('div','wish-head');head.append(el('span','',w.name));
  if(w.createdAt)head.append(el('small','',new Date(w.createdAt).toLocaleDateString(s.lang==='ru'?'ru-RU':'uz-UZ',{day:'numeric',month:'short'})));
  card.append(head,el('p','',w.text));
  if(s.owners[w.id]){const actions=el('div','wish-actions');const edit=el('button','',T('edit'));edit.type='button';edit.addEventListener('click',()=>{s.editing=w.id;$('wishName').value=w.name;$('wishText').value=w.text;$('cancelEdit').classList.remove('hidden');$('wishForm').scrollIntoView({behavior:'smooth',block:'center'})});const del=el('button','',T('delete'));del.type='button';del.addEventListener('click',()=>deleteWish(w));actions.append(edit,del);card.append(actions)}
  list.append(card);
 }
}
async function getWishes(){try{const r=await fetch(wishesEndpoint);if(!r.ok)throw Error();s.wishes=(await r.json()).wishes||[];renderWishes()}catch{$('wishStatus').textContent=T('failed')}}
function resetEdit(){$('wishForm').reset();s.editing=null;$('cancelEdit').classList.add('hidden')}
async function deleteWish(w){if(!confirm(T('confirmDelete')))return;try{const res=await fetch(wishesEndpoint+'/'+encodeURIComponent(w.id),{method:'DELETE',headers:{'content-type':'application/json','x-wish-token':s.owners[w.id]},body:'{}'});if(!res.ok)throw Error();delete s.owners[w.id];localStorage.setItem(wishStorageKey,JSON.stringify(s.owners));await getWishes();$('wishStatus').textContent=T('deleted')}catch{$('wishStatus').textContent=T('failed')}}
async function submitWish(e){
 e.preventDefault();const name=$('wishName').value.trim(),text=$('wishText').value.trim();
 if(name.length<2||name.length>40||text.length<3||text.length>300){$('wishStatus').textContent=T('invalid');return}
 const btn=$('wishForm').querySelector('[type=submit]');btn.disabled=true;
 try{
  const editing=s.editing;const r=await fetch(wishesEndpoint+(editing?'/'+encodeURIComponent(editing):''),{method:editing?'PUT':'POST',headers:{'content-type':'application/json',...(editing?{'x-wish-token':s.owners[editing]}:{})},body:JSON.stringify({name,text})});
  const data=await r.json();if(!r.ok)throw Error(data.error);
  if(data.token&&data.wish){s.owners[data.wish.id]=data.token;localStorage.setItem(wishStorageKey,JSON.stringify(s.owners))}
  resetEdit();await getWishes();$('wishStatus').textContent=T(editing?'edited':'sent')
 }catch{$('wishStatus').textContent=T('failed')}finally{btn.disabled=false}
}
$('langUz').addEventListener('click',()=>setLang('uz'));
$('langRu').addEventListener('click',()=>setLang('ru'));
$('intro').addEventListener('click',openInvitation);
$('intro').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openInvitation()}});
$('musicButton').addEventListener('click',()=>music(!s.playing));
$('wishForm').addEventListener('submit',submitWish);
$('cancelEdit').addEventListener('click',()=>{resetEdit();$('wishStatus').textContent=''});
if('IntersectionObserver' in window){const obs=new IntersectionObserver(items=>items.forEach(item=>{if(item.isIntersecting){item.target.classList.add('visible');obs.unobserve(item.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(node=>obs.observe(node));document.body.classList.add('with-motion')}
applyInvitation();setLang(s.lang);tick();setInterval(tick,1000);getWishes();
