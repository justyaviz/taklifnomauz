const $=id=>document.getElementById(id);
const q=(sel,root=document)=>root.querySelector(sel);
const qa=(sel,root=document)=>[...root.querySelectorAll(sel)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={invitations:[],selected:null,tab:'main',gallery:[],schedule:[]};
let toastTimeout;
function notify(message,error=false){const el=$('notification');el.textContent=message;el.classList.toggle('error',error);el.classList.remove('hidden');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.add('hidden'),4000)}
async function api(url,options={}){
 const headers={...(options.headers||{})};
 if(options.body&&typeof options.body==='object'&&!(options.body instanceof Blob)&&!(options.body instanceof FormData)){headers['Content-Type']='application/json';options.body=JSON.stringify(options.body)}
 const res=await fetch(url,{credentials:'same-origin',...options,headers});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){if(res.status===401&&url!=='/api/admin/login'){showLogin()}throw new Error(data.error||'So‘rov bajarilmadi')}
 return data;
}
async function copy(text){try{await navigator.clipboard.writeText(text);notify('Havola nusxalandi')}catch{window.prompt('Havolani nusxalang',text)}}
function showLogin(){$('app').classList.add('hidden');$('login').classList.remove('hidden');$('loginPass').value=''}
function showApp(user){$('login').classList.add('hidden');$('app').classList.remove('hidden');$('activeUsername').textContent=user||'admin';view('dashboard')}
function view(name){
 qa('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
 for(const n of ['dashboard','invitations','editor','botSales','cardSales','settings'])$(n).classList.toggle('hidden',n!==name);
 $('breadcrumbs').textContent='Bosh sahifa / '+({dashboard:'Umumiy',invitations:'Taklifnomalar',editor:'Tahrirlash',botSales:'Telegram savdo',cardSales:'Karta buyurtmalari',settings:'Sozlamalar'}[name]||name);
 window.scrollTo({top:0,behavior:'instant'});
 if(name==='dashboard'||name==='invitations')refresh().catch(e=>notify(e.message,true));
 if(name==='botSales')refreshBotSales().catch(e=>notify(e.message,true));
 if(name==='cardSales')refreshCardSales().catch(e=>notify(e.message,true));
}
function publicUrl(inv){return location.origin+'/i/'+encodeURIComponent(inv.slug)}
function formatDay(date){try{return new Date(date+'T12:00:00Z').toLocaleDateString('uz-UZ',{day:'numeric',month:'short',year:'numeric'})}catch{return date}}
function statusTag(inv){return '<span class="tag '+(inv.published?'':'draft')+'">'+(inv.published?'● Nashr qilingan':'○ Qoralama')+'</span>'}
function inviteRow(inv){
 return '<div class="invite-item" data-item="'+esc(inv.id)+'"><div class="flex grow" style="min-width:0"><div class="invite-thumb">✧</div><div class="invite-detail"><strong>'+esc(inv.groom)+' &amp; '+esc(inv.bride)+'</strong><small>'+esc(inv.title)+' · '+formatDay(inv.eventDate)+'</small><small>/i/'+esc(inv.slug)+' · '+(inv.views||0)+' ko‘rish</small></div></div><div class="actions">'+statusTag(inv)+'<button class="btn small" data-invite-action="edit" data-id="'+esc(inv.id)+'">✎ Tahrirlash</button><button class="btn small" data-invite-action="copy" data-id="'+esc(inv.id)+'">⧉ Link</button><button class="btn small" data-invite-action="duplicate" data-id="'+esc(inv.id)+'">⊞ Nusxa</button></div></div>';
}
async function refresh(){
 const [data,stats]=await Promise.all([api('/api/admin/invitations'),api('/api/admin/stats')]);state.invitations=data.invitations||[];
 $('statTotal').textContent=stats.total??'0';$('statLive').textContent=stats.published??0;$('statViews').textContent=(stats.views??0).toLocaleString();$('statGuests').textContent=stats.rsvp??0;
 const sorted=[...state.invitations].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 $('recentList').innerHTML=sorted.length?sorted.slice(0,5).map(inviteRow).join(''):'<div class="empty">Hali taklifnomalar yo‘q</div>';
 filterList();
}
function filterList(){
 const term=$('searchInvites').value.trim().toLowerCase();
 const rows=state.invitations.filter(x=>[x.title,x.slug,x.groom,x.bride,x.venue].some(v=>String(v||'').toLowerCase().includes(term))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 $('allList').innerHTML=rows.length?rows.map(inviteRow).join(''):'<div class="empty">Hech narsa topilmadi</div>';
}
function field(name){return q('[name="'+name+'"]',$('editorForm'))}
function setField(name,value){const el=field(name);if(!el)return;if(el.type==='checkbox')el.checked=Boolean(value);else el.value=value??''}
function getField(name){const el=field(name);if(!el)return null;return el.type==='checkbox'?el.checked:el.value}
function tab(name){
 state.tab=name;qa('[data-tab]', $('editorTabs')).forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
 qa('[data-tab-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.tabPanel!==name));
 if(name==='guests')renderGuests().catch(e=>notify(e.message,true));
 if(name==='wishes')renderWishes().catch(e=>notify(e.message,true));
 if(name==='design')refreshPreview();
}
function openEditor(inv){
 state.selected=structuredClone(inv);
 $('editorTitle').textContent=(inv.groom||'')+' & '+(inv.bride||'');
 $('editorStatus').className='tag'+(inv.published?'':' draft');
 $('editorStatus').textContent=inv.published?'● Nashr qilingan':'○ Qoralama';
 ['title','slug','groom','bride','template','eventType','eventDate','eventTime','timezone','venue','address','mapQuery','googleUrl','yandexUrl','lead','message','family','dressCode','heroImage','backgroundImage','musicUrl','audioStart','published','allowWishes','allowRsvp'].forEach(k=>setField(k,inv[k]));
 setField('gold',inv.colors?.gold||'#b89246');setField('navy',inv.colors?.navy||'#15192a');
 state.gallery=[...(inv.gallery||[])];state.schedule=(inv.schedule||[]).map(x=>({...x}));
 renderGallery();renderSchedule();$('saveStatus').textContent='Barcha ma’lumotlarni tekshiring';
 $('openLink').href=publicUrl(inv);tab('main');view('editor');tab('main');
}
function addSchedule(row={time:'',title:''}){
 const line=document.createElement('div');line.className='row-item';
 const time=document.createElement('input');time.type='time';time.value=row.time||'';time.setAttribute('aria-label','Vaqt');
 const title=document.createElement('input');title.placeholder='Marosim bosqichi';title.value=row.title||'';title.maxLength=120;title.setAttribute('aria-label','Bosqich nomi');
 const del=document.createElement('button');del.type='button';del.className='btn danger small';del.textContent='×';del.setAttribute('aria-label','Bosqichni o‘chirish');del.addEventListener('click',()=>line.remove());
 line.append(time,title,del);$('scheduleRows').append(line);
}
function renderSchedule(){$('scheduleRows').replaceChildren();for(const x of state.schedule)addSchedule(x)}
function getSchedule(){return qa('.row-item',$('scheduleRows')).map(r=>({time:q('input[type=time]',r).value,title:q('input:not([type=time])',r).value.trim()})).filter(x=>x.title)}
function renderGallery(){
 $('galleryList').replaceChildren();
 state.gallery.forEach((url,index)=>{
  const box=document.createElement('div');box.className='media-box';
  const img=document.createElement('img');img.src=url;img.alt='Galereya '+(index+1);img.loading='lazy';
  const del=document.createElement('button');del.type='button';del.textContent='O‘chirish';del.addEventListener('click',()=>{state.gallery.splice(index,1);renderGallery()});
  box.append(img,del);$('galleryList').append(box);
 });
}
function collect(){
 const d={};
 for(const k of ['title','slug','groom','bride','template','eventType','eventDate','eventTime','timezone','venue','address','mapQuery','googleUrl','yandexUrl','lead','message','family','dressCode','heroImage','backgroundImage','musicUrl','audioStart','published','allowWishes','allowRsvp'])d[k]=getField(k);
 d.audioStart=Number(d.audioStart)||0;
 d.colors={gold:getField('gold'),navy:getField('navy')};d.gallery=[...state.gallery];d.schedule=getSchedule();return d;
}
async function save(e){
 e?.preventDefault();if(!state.selected)return;
 const button=$('saveInvite');button.disabled=true;$('saveStatus').textContent='Saqlanmoqda...';
 try{
  const data=await api('/api/admin/invitations/'+state.selected.id,{method:'PATCH',body:collect()});
  state.selected=data.invitation;$('editorTitle').textContent=data.invitation.groom+' & '+data.invitation.bride;
  $('editorStatus').className='tag'+(data.invitation.published?'':' draft');
  $('editorStatus').textContent=data.invitation.published?'● Nashr qilingan':'○ Qoralama';
  $('openLink').href=publicUrl(data.invitation);
  $('saveStatus').textContent='✓ '+new Date().toLocaleTimeString('uz-UZ')+' da saqlandi';
  notify('Taklifnoma saqlandi');refreshPreview();
 }catch(e){$('saveStatus').textContent='Saqlanmadi';notify(e.message,true)}
 finally{button.disabled=false}
}
async function create(data={}){
 try{
  const slug='taklif-'+Date.now().toString(36);
  const date=new Date();date.setDate(date.getDate()+30);
  const d={title:'Yangi taklifnoma',groom:'Kuyov',bride:'Kelin',venue:'To‘yxona',eventDate:date.toISOString().slice(0,10),eventTime:'19:00',timezone:'+05:00',slug,published:false,...data};
  delete d.id;delete d.createdAt;delete d.updatedAt;delete d.views;
  const r=await api('/api/admin/invitations',{method:'POST',body:d});
  notify('Yangi taklifnoma yaratildi');openEditor(r.invitation)
 }catch(e){notify(e.message,true)}
}
async function duplicate(inv){await create({...inv,slug:inv.slug+'-'+Date.now().toString(36).slice(-5),title:inv.title+' (nusxa)',published:false})}
async function deleteCurrent(){
 if(!state.selected)return;
 if(!confirm('Ushbu taklifnoma butunlay o‘chiriladi. Davom etasizmi?'))return;
 try{await api('/api/admin/invitations/'+state.selected.id,{method:'DELETE'});state.selected=null;notify('Taklifnoma o‘chirildi');view('invitations')}catch(e){notify(e.message,true)}
}
function refreshPreview(){
 if(!state.selected)return;
 const iframe=$('previewFrame');
 iframe.src=publicUrl(state.selected)+'?preview=1&ts='+Date.now();
}
async function uploadFile(file){
 if(!file)return '';
 if(file.size>12*1024*1024)throw new Error('Fayl 12 MB dan katta');
 const res=await fetch('/api/admin/upload?name='+encodeURIComponent(file.name),{method:'POST',body:file,credentials:'same-origin'});
 const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Yuklashda xato');
 return data.url;
}
async function uploadField(name,file){
 const button=q('[data-upload="'+name+'"]');if(button)button.disabled=true;
 try{notify('Fayl yuklanmoqda...');const url=await uploadFile(file);if(url){setField(name,url);notify('Yuklandi. Saqlashni bosing.')}}catch(e){notify(e.message,true)}
 finally{if(button)button.disabled=false}
}
function renderTable(items,mode){
 if(!items.length)return '<div class="empty">'+(mode==='guests'?'Hali mehmonlar yo‘q':'Hali tilaklar yo‘q')+'</div>';
 if(mode==='guests'){
  return '<table><thead><tr><th>Mehmon</th><th>Holat</th><th>Odam</th><th>Amallar</th></tr></thead><tbody>'+items.map(i=>
  '<tr><td><b>'+esc(i.name)+'</b><br><span class="muted xs">'+esc(i.phone||'')+'</span></td><td><select data-rsvp-status="'+esc(i.id)+'"><option value="invited" '+(i.status==='invited'?'selected':'')+'>Taklif qilindi</option><option value="yes" '+(i.status==='yes'?'selected':'')+'>Keladi</option><option value="maybe" '+(i.status==='maybe'?'selected':'')+'>Balki</option><option value="no" '+(i.status==='no'?'selected':'')+'>Kelmaydi</option></select></td><td>'+Number(i.count||1)+'</td><td><div class="actions" style="justify-content:flex-end"><button class="btn small" data-copy-guest="'+esc(i.name)+'">Link</button><button class="btn small danger" data-remove-guest="'+esc(i.id)+'">×</button></div></td></tr>'
  ).join('')+'</tbody></table>';
 }
 return '<table><thead><tr><th>Ism / Tilak</th><th>Holat</th><th>Amallar</th></tr></thead><tbody>'+items.map(i=>
 '<tr><td><b>'+esc(i.name)+'</b><p class="sm" style="max-width:420px;white-space:pre-wrap">'+esc(i.text)+'</p></td><td>'+(i.approved===false?'<span class="tag draft">Yashirilgan</span>':'<span class="tag">Ko‘rinadi</span>')+'</td><td><div class="actions" style="justify-content:flex-end"><button class="btn small" data-toggle-wish="'+esc(i.id)+'" data-approved="'+(i.approved===false?'false':'true')+'">'+(i.approved===false?'Ko‘rsatish':'Yashirish')+'</button><button class="btn small danger" data-remove-wish="'+esc(i.id)+'">×</button></div></td></tr>'
 ).join('')+'</tbody></table>';
}
async function renderGuests(){
 if(!state.selected)return;
 const r=await api('/api/admin/invitations/'+state.selected.id+'/rsvps');
 $('guestList').innerHTML=renderTable(r.items,'guests');
}
async function renderWishes(){
 if(!state.selected)return;
 const r=await api('/api/admin/invitations/'+state.selected.id+'/wishes');
 $('wishesList').innerHTML=renderTable(r.items,'wishes');
}
async function addGuest(){
 const name=$('guestName').value.trim();if(name.length<2)return notify('Mehmon ismini kiriting',true);
 try{await api('/api/admin/invitations/'+state.selected.id+'/guests',{method:'POST',body:{name,phone:$('guestPhone').value}});$('guestName').value='';$('guestPhone').value='';notify('Mehmon qo‘shildi');await renderGuests()}catch(e){notify(e.message,true)}
}
async function handleRecord(target){
 const inv=state.selected;if(!inv)return;
 const get=(name)=>target.closest('['+name+']')?.getAttribute(name);
 let id=get('data-remove-guest'),file='rsvps';
 if(id){if(!confirm('Mehmonni o‘chirasizmi?'))return;await api('/api/admin/invitations/'+inv.id+'/'+file+'/'+id,{method:'DELETE'});await renderGuests();return}
 id=get('data-remove-wish');if(id){if(!confirm('Tilakni o‘chirasizmi?'))return;await api('/api/admin/invitations/'+inv.id+'/wishes/'+id,{method:'DELETE'});await renderWishes();return}
 id=get('data-toggle-wish');if(id){const approved=get('data-approved')==='false';await api('/api/admin/invitations/'+inv.id+'/wishes/'+id,{method:'PATCH',body:{approved}});await renderWishes();return}
 const guest=get('data-copy-guest');if(guest!==null&&guest!==undefined){copy(publicUrl(inv)+'?guest='+encodeURIComponent(guest));return}
}
async function personalLink(){if(!state.selected)return;const name=$('personalGuestName').value.trim();if(!name)return notify('Mehmon ismini kiriting',true);await copy(publicUrl(state.selected)+'?guest='+encodeURIComponent(name))}

function downloadCsv(filename,columns,items){
 const escapeCell=value=>{
  const str=String(value??'');
  const safe=/^[\s]*[=+@-]/.test(str)?"'"+str:str;
  return '"'+safe.replace(/"/g,'""')+'"';
 };
 const csv='\uFEFF'+[columns.map(c=>escapeCell(c[0])).join(','),...items.map(row=>columns.map(c=>escapeCell(row[c[1]])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function exportCollection(kind){
 if(!state.selected)return;
 const endpoint='/api/admin/invitations/'+state.selected.id+'/'+(kind==='guests'?'rsvps':'wishes');
 try{
  const result=await api(endpoint),slug=state.selected.slug;
  if(kind==='guests')downloadCsv(slug+'-mehmonlar.csv',[['Ism','name'],['Telefon','phone'],['Holat','status'],['Soni','count'],['Izoh','note'],['Sana','createdAt']],result.items||[]);
  else downloadCsv(slug+'-tilaklar.csv',[['Ism','name'],['Tilak','text'],['Ko‘rinadi','approved'],['Sana','createdAt']],result.items||[]);
  notify('CSV fayl tayyor');
 }catch(e){notify(e.message,true)}
}

async function refreshBotSales(){
 const [pricing,orders]=await Promise.all([api('/api/admin/bot/prices'),api('/api/admin/bot/orders')]);
 for(const id of ['oq-saroy','zarhal','minimal'])$('botPricesForm').elements.namedItem(id).value=pricing.prices?.[id]??0;
 $('botConnection').className='tag'+(pricing.webhookConfigured?'':' draft');
 $('botConnection').textContent=pricing.webhookConfigured?'● Bot sozlangan':'○ Bot token hali ulanmagan';
 $('botOrdersCount').textContent=(orders.total||0)+' ta';
 if(!orders.orders?.length){$('botOrdersTable').innerHTML='<div class="empty">Telegram buyurtmalari hali yo‘q</div>';return}
 const statuses={pending_payment:'⌛ To‘lov kutilmoqda',collecting:'✍️ To‘ldirilmoqda',ready:'✅ Tayyor',invoice_error:'⚠️ Hisob xatosi'};
 $('botOrdersTable').innerHTML='<table><thead><tr><th>Buyurtma</th><th>Xaridor</th><th>Shablon</th><th>Stars</th><th>Holat</th><th>Havola</th></tr></thead><tbody>'+orders.orders.map(o=>'<tr><td>'+esc(o.id.slice(0,8))+'</td><td>'+esc([o.groom,o.bride].filter(Boolean).join(' & ')||o.chatId)+'</td><td>'+esc(o.template)+'</td><td>'+Number(o.stars||0)+' ⭐</td><td>'+esc(statuses[o.status]||o.status)+'</td><td>'+(o.slug&&o.status==='ready'?'<a href="/i/'+encodeURIComponent(o.slug)+'" target="_blank" rel="noopener noreferrer" style="color:#8c6d38">Ochish ↗</a>':'—')+'</td></tr>').join('')+'</tbody></table>';
}

async function refreshCardSales(){
 const [settings,orders]=await Promise.all([api('/api/admin/card/settings'),api('/api/admin/card/orders')]);
 const f=$('cardSettingsForm'),cfg=settings.settings||{};
 f.elements.namedItem('cardNumber').value=cfg.cardNumber||'';
 f.elements.namedItem('cardHolder').value=cfg.cardHolder||'';
 for(const id of ['oq-saroy','zarhal','minimal'])f.elements.namedItem(id).value=cfg.prices?.[id]??0;
 $('cardOrderCount').textContent=(orders.total||0)+' buyurtma';
 if(!orders.orders?.length){$('cardOrdersTable').innerHTML='<div class="empty">Hali karta buyurtmalari yo‘q</div>';return}
 const statuses={awaiting_receipt:'🧾 Chek kutilmoqda',review:'⌛ Bank tekshiruvi',approved:'✅ Tasdiqlangan',rejected:'❌ Rad etilgan'};
 $('cardOrdersTable').innerHTML='<table><thead><tr><th>Buyurtma</th><th>Mijoz</th><th>Shablon</th><th>Summa</th><th>Holat</th><th>Tekshirish</th></tr></thead><tbody>'+orders.orders.map(o=>{
  const buttons=o.receipt?'<a class="btn small" target="_blank" rel="noopener" href="/api/admin/card/receipts/'+encodeURIComponent(o.id)+'">🧾 Chek</a>':'—';
  const actions=o.status==='review'?'<button class="btn small" data-card-action="approved" data-id="'+esc(o.id)+'">✓ Tasdiqlash</button><button class="btn small danger" data-card-action="rejected" data-id="'+esc(o.id)+'">× Rad etish</button>':'';
  return '<tr><td>'+esc(o.id.slice(0,8))+'</td><td><b>'+esc(o.customerName)+'</b><br><small>'+esc(o.contact)+'</small></td><td>'+esc(o.template)+'</td><td>'+Number(o.amount||0).toLocaleString('uz-UZ')+' so‘m</td><td>'+esc(statuses[o.status]||o.status)+'</td><td><div class="actions">'+buttons+actions+'</div></td></tr>';
 }).join('')+'</tbody></table>';
}

function wire(){
 $('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').textContent='';const submit=q('button[type=submit]',$('loginForm'));submit.disabled=true;try{const r=await api('/api/admin/login',{method:'POST',body:{username:$('loginUser').value,password:$('loginPass').value}});showApp(r.username)}catch(err){$('loginError').textContent=err.message}finally{submit.disabled=false}});
 qa('button[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
 qa('[data-create]').forEach(b=>b.addEventListener('click',()=>create()));
 $('searchInvites').addEventListener('input',filterList);
 $('backBtn').addEventListener('click',()=>view('invitations'));
 $('editorForm').addEventListener('submit',save);
 $('editorTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)tab(b.dataset.tab)});
 $('editorForm').addEventListener('change',()=>{$('saveStatus').textContent='● Saqlanmagan o‘zgarishlar'});
 $('editorForm').addEventListener('input',()=>{$('saveStatus').textContent='● Saqlanmagan o‘zgarishlar'});
 $('deleteInvite').addEventListener('click',deleteCurrent);
 $('copyLink').addEventListener('click',()=>state.selected&&copy(publicUrl(state.selected)));
 $('addSchedule').addEventListener('click',()=>addSchedule());
 $('refreshPreview').addEventListener('click',refreshPreview);
 qa('[data-upload]').forEach(button=>button.addEventListener('click',()=>{
  const name=button.dataset.upload;
  const input=$(name==='musicUrl'?'uploadMusic':name==='heroImage'?'uploadHero':'uploadBackground');
  input.value='';input.onchange=()=>uploadField(name,input.files?.[0]);input.click();
 }));
 $('addGallery').addEventListener('click',()=>{const input=$('uploadGallery');input.value='';input.onchange=async()=>{for(const file of [...input.files].slice(0,25-state.gallery.length)){try{state.gallery.push(await uploadFile(file));renderGallery()}catch(e){notify(e.message,true)}}notify('Rasmlar yuklandi. Saqlashni bosing.')};input.click()});
 $('addGalleryUrl').addEventListener('click',()=>{const url=prompt('HTTPS rasm havolasi');if(url&&/^https:\/\//i.test(url)&&state.gallery.length<25){state.gallery.push(url);renderGallery()}});
 $('copyPersonalLink').addEventListener('click',personalLink);
 $('addGuest').addEventListener('click',addGuest);
 $('exportGuests').addEventListener('click',()=>exportCollection('guests'));
 $('exportWishes').addEventListener('click',()=>exportCollection('wishes'));
 $('refreshWishes').addEventListener('click',()=>renderWishes().catch(e=>notify(e.message,true)));
 $('guestList').addEventListener('change',async e=>{const item=e.target.closest('[data-rsvp-status]');if(!item)return;try{await api('/api/admin/invitations/'+state.selected.id+'/rsvps/'+item.dataset.rsvpStatus,{method:'PATCH',body:{status:item.value}});notify('Holat yangilandi')}catch(e){notify(e.message,true)}});
 for(const box of ['guestList','wishesList'])$(box).addEventListener('click',e=>handleRecord(e.target).catch(x=>notify(x.message,true)));
 for(const box of ['allList','recentList'])$(box).addEventListener('click',e=>{const b=e.target.closest('[data-invite-action]');if(!b)return;const inv=state.invitations.find(i=>i.id===b.dataset.id);if(!inv)return;if(b.dataset.inviteAction==='edit')openEditor(inv);if(b.dataset.inviteAction==='copy')copy(publicUrl(inv));if(b.dataset.inviteAction==='duplicate')duplicate(inv)});
 $('refreshBotSales').addEventListener('click',()=>refreshBotSales().catch(e=>notify(e.message,true)));
 $('botPricesForm').addEventListener('submit',async e=>{e.preventDefault();const prices={};for(const id of ['oq-saroy','zarhal','minimal'])prices[id]=Number($('botPricesForm').elements.namedItem(id).value);try{await api('/api/admin/bot/prices',{method:'PUT',body:{prices}});notify('Shablonlar narxi saqlandi');await refreshBotSales()}catch(e){notify(e.message,true)}});
 $('refreshCardOrders').addEventListener('click',()=>refreshCardSales().catch(e=>notify(e.message,true)));
 $('cardSettingsForm').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.currentTarget;
  const data={cardNumber:f.elements.namedItem('cardNumber').value,cardHolder:f.elements.namedItem('cardHolder').value,prices:{}};
  for(const id of ['oq-saroy','zarhal','minimal'])data.prices[id]=Number(f.elements.namedItem(id).value);
  try{await api('/api/admin/card/settings',{method:'PUT',body:data});notify('Karta ma’lumotlari va narxlar saqlandi');await refreshCardSales()}catch(e){notify(e.message,true)}
 });
 $('cardOrdersTable').addEventListener('click',async e=>{
  const button=e.target.closest('[data-card-action]');if(!button)return;
  if(!confirm(button.dataset.cardAction==='approved'?'Bank hisobiga pul tushganini tekshirdingizmi? Buyurtmani tasdiqlaysizmi?':'Chekni rad etasizmi?'))return;
  button.disabled=true;
  try{await api('/api/admin/card/orders/'+button.dataset.id,{method:'PATCH',body:{status:button.dataset.cardAction}});notify('Buyurtma holati yangilandi');await refreshCardSales()}catch(e){notify(e.message,true)}finally{button.disabled=false}
 });
 $('passwordForm').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/admin/password',{method:'POST',body:{oldPassword:$('oldPassword').value,newPassword:$('newPassword').value}});notify('Parol yangilandi. Qayta kiring');showLogin()}catch(e){notify(e.message,true)}});
 $('logoutBtn').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST',body:{}})}catch{}showLogin()});
}
wire();
api('/api/admin/me').then(r=>showApp(r.username)).catch(()=>showLogin());
