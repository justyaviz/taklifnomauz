const tr={
uz:{inviteTitle:'TAKLIFNOMA',tapLight:'CHIROQLARNI YOQISH UCHUN BOSING',weddingInvitation:'NIKOH TO‘YIGA TAKLIFNOMA',and:'va',heroTime:'SHANBA KUNI · SOAT 19:00 DA',scroll:'PASTGA SURING',dearGuest:'Aziz mehmon',wishPara1:'Hayotimizdagi eng baxtli kunni Siz — aziz mehmonimiz bilan birga nishonlashni orzu qilamiz.',wishPara2:'Sizning tashrifingiz bu quvonchli kunimizga alohida fayz va tabaruk baxsh etadi. Kelishingizni intiqlik bilan kutamiz.',respect:'Hurmat ila',families:'KUYOV VA KELIN OILALARI',moments:'Bizning lahzalarimiz',momentsText:'Ikki qalbning eng go‘zal hikoyasi...',datePre:'UNUTILMAS KUN',weddingDay:'To‘y kuni',calendarMonth:'Noyabr, 2026',specialDay:'BIZNING KUNIMIZ',program:'Marosim tartibi',schedule1:'Mehmonlarni kutib olish',schedule2:'Nikoh marosimi',schedule3:'Ziyofat boshlanishi',schedule4:'Milliy taomlar',schedule5:'Raqs va davra',where:'QAYERDA UCHRASHAMIZ?',location:'Manzil',venue:'to‘yxonasi',address:'Toshkent sh., Yakkasaroy tumani',mapPrompt:'To‘yxona joylashuvini xaritada ko‘ring',googleMap:'XARITADA KO‘RISH',yandexMap:'YANDEX XARITA',yourWords:'MEHMONLAR SO‘ZI',wishes:'Tilaklar',yourName:'Ismingiz',yourWish:'Yosh oilaga tilagingiz',sendWish:'TILAK YUBORISH',cancel:'BEKOR QILISH',timeLeft:'TO‘YGA QOLGAN VAQT',day:'KUN',hour:'SOAT',minute:'DAQIQA',second:'SONIYA',waiting:'Sizni intiqlik bilan kutamiz',edit:'Tahrirlash',delete:'O‘chirish',empty:'Hali tilaklar yo‘q',invalid:'Ism yoki tilak uzunligini tekshiring.',sent:'Tilagingiz yuborildi!',edited:'Tilak tahrirlandi!',deleted:'Tilak o‘chirildi.',failed:'Xatolik yuz berdi. Birozdan so‘ng urinib ko‘ring.',confirmDelete:'Tilakni o‘chirmoqchimisiz?',yourNamePlaceholder:'Ismingiz',yourWishPlaceholder:'Yosh oilaga tilagingiz...'},
ru:{inviteTitle:'ПРИГЛАШЕНИЕ',tapLight:'НАЖМИТЕ, ЧТОБЫ ЗАЖЕЧЬ СВЕТ',weddingInvitation:'ПРИГЛАШЕНИЕ НА СВАДЬБУ',and:'и',heroTime:'СУББОТА · В 19:00',scroll:'ЛИСТАЙТЕ ВНИЗ',dearGuest:'Дорогой гость',wishPara1:'Мы мечтаем разделить самый счастливый день нашей жизни с Вами — нашим дорогим гостем.',wishPara2:'Ваше присутствие подарит нашему радостному дню особую теплоту. С нетерпением ждём Вас.',respect:'С уважением',families:'СЕМЬИ ЖЕНИХА И НЕВЕСТЫ',moments:'Наши моменты',momentsText:'Самая красивая история двух сердец...',datePre:'НЕЗАБЫВАЕМЫЙ ДЕНЬ',weddingDay:'День свадьбы',calendarMonth:'Ноябрь, 2026',specialDay:'НАШ ОСОБЕННЫЙ ДЕНЬ',program:'Программа торжества',schedule1:'Встреча гостей',schedule2:'Церемония никях',schedule3:'Начало банкета',schedule4:'Национальные блюда',schedule5:'Танцы и веселье',where:'ГДЕ МЫ ВСТРЕТИМСЯ?',location:'Адрес',venue:'банкетный зал',address:'г. Ташкент, Яккасарайский район',mapPrompt:'Посмотрите местоположение на карте',googleMap:'ПОСМОТРЕТЬ НА КАРТЕ',yandexMap:'ЯНДЕКС КАРТЫ',yourWords:'ПОЖЕЛАНИЯ ГОСТЕЙ',wishes:'Пожелания',yourName:'Ваше имя',yourWish:'Пожелание молодожёнам',sendWish:'ОТПРАВИТЬ ПОЖЕЛАНИЕ',cancel:'ОТМЕНА',timeLeft:'ДО СВАДЬБЫ ОСТАЛОСЬ',day:'ДНЕЙ',hour:'ЧАСОВ',minute:'МИНУТ',second:'СЕКУНД',waiting:'С нетерпением ждём вас',edit:'Изменить',delete:'Удалить',empty:'Пожеланий пока нет',invalid:'Проверьте длину имени и пожелания.',sent:'Пожелание отправлено!',edited:'Пожелание изменено!',deleted:'Пожелание удалено.',failed:'Произошла ошибка. Попробуйте позже.',confirmDelete:'Удалить пожелание?',yourNamePlaceholder:'Ваше имя',yourWishPlaceholder:'Ваше пожелание молодожёнам...'}
};
const $=id=>document.getElementById(id);
let owners={};try{owners=JSON.parse(localStorage.getItem('oq-wish-owners')||'{}')}catch{}
const s={lang:localStorage.getItem('oq-lang')==='ru'?'ru':'uz',opened:false,playing:false,editing:null,wishes:[],owners};
const T=k=>tr[s.lang][k]||k;
function setLang(lang){
 s.lang=lang;document.documentElement.lang=lang;localStorage.setItem('oq-lang',lang);
 document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=T(el.dataset.t)});
 $('langUz').classList.toggle('selected',lang==='uz');$('langRu').classList.toggle('selected',lang==='ru');
 $('wishName').placeholder=T('yourNamePlaceholder');$('wishText').placeholder=T('yourWishPlaceholder');
 setMusicButton();document.title=lang==='ru'?'Мухаммад и Амина — приглашение':'Muhammad & Amina — OQ SAROY';
 document.querySelector('meta[name="description"]').content=lang==='ru'?'Свадебное приглашение — 21 ноября 2026 года, Ташкент':'Muhammad va Amina nikoh to‘yiga taklifnoma · 21-noyabr, 2026-yil';
 calendar();renderWishes();
}
function calendar(){
 const root=$('calendarDays');root.replaceChildren();
 const weekdays=s.lang==='ru'?['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ']:['YA','DU','SE','CHO','PA','JU','SHA'];
 weekdays.forEach(day=>{let el=document.createElement('span');el.className='weekday';el.textContent=day;root.append(el)});
 for(let day=1;day<=30;day++){const el=document.createElement('span');el.textContent=day;if(day===21){el.className='current';el.setAttribute('aria-label',T('weddingDay'))}root.append(el)}
}
function tick(){
 const end=Date.parse('2026-11-21T19:00:00+05:00');
 const sec=Math.max(0,Math.floor((end-Date.now())/1000));
 const nums={days:Math.floor(sec/86400),hours:Math.floor(sec%86400/3600),minutes:Math.floor(sec%3600/60),seconds:sec%60};
 Object.entries(nums).forEach(([k,n])=>{$(k).textContent=String(n).padStart(2,'0')});
}
// Original audio behaviour: begin at 26s, use a media fragment for iOS,
// default full volume (no fade), and restart the track at 26s.
const SOURCE_AUDIO='https://taklifnoma.imaantech.uz/assets/audio/song4.mp3';
const AUDIO_OFFSET=26;
// The file remains on the reference provider's site. It is not bundled or owned here.
const audioEl=new Audio(SOURCE_AUDIO+'#t='+AUDIO_OFFSET);
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
 if(ms>=5000)document.body.classList.remove('invitation-locked');
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
async function getWishes(){try{const r=await fetch('/api/wishes');if(!r.ok)throw Error();s.wishes=(await r.json()).wishes||[];renderWishes()}catch{$('wishStatus').textContent=T('failed')}}
function resetEdit(){$('wishForm').reset();s.editing=null;$('cancelEdit').classList.add('hidden')}
async function deleteWish(w){if(!confirm(T('confirmDelete')))return;try{const res=await fetch('/api/wishes/'+encodeURIComponent(w.id),{method:'DELETE',headers:{'content-type':'application/json','x-wish-token':s.owners[w.id]},body:'{}'});if(!res.ok)throw Error();delete s.owners[w.id];localStorage.setItem('oq-wish-owners',JSON.stringify(s.owners));await getWishes();$('wishStatus').textContent=T('deleted')}catch{$('wishStatus').textContent=T('failed')}}
async function submitWish(e){
 e.preventDefault();const name=$('wishName').value.trim(),text=$('wishText').value.trim();
 if(name.length<2||name.length>40||text.length<3||text.length>300){$('wishStatus').textContent=T('invalid');return}
 const btn=$('wishForm').querySelector('[type=submit]');btn.disabled=true;
 try{
  const editing=s.editing;const r=await fetch('/api/wishes'+(editing?'/'+encodeURIComponent(editing):''),{method:editing?'PUT':'POST',headers:{'content-type':'application/json',...(editing?{'x-wish-token':s.owners[editing]}:{})},body:JSON.stringify({name,text})});
  const data=await r.json();if(!r.ok)throw Error(data.error);
  if(data.token&&data.wish){s.owners[data.wish.id]=data.token;localStorage.setItem('oq-wish-owners',JSON.stringify(s.owners))}
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
setLang(s.lang);tick();setInterval(tick,1000);getWishes();
