const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths=location.pathname.split('/').filter(Boolean);
const target=paths[0]==='checkout'?'checkoutPage':paths[0]==='order'?'orderPage':'catalogPage';
let catalog=[],details={configured:false},chosen=null,orderAccess=null;
const format=n=>new Intl.NumberFormat('uz-UZ').format(Number(n)||0)+' so‘m';
async function api(path,opts={}){
 const r=await fetch(path,{...opts,cache:'no-store'});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||'So‘rov bajarilmadi');
 return data;
}
function message(id,txt,error=false){
 const e=$(id);e.className='status '+(error?'error':'ok');e.textContent=txt;
}
function renderCatalog(){
 $('templateList').replaceChildren();
 for(const t of catalog){
  const tile=document.createElement('div');tile.className='tile';
  const poster=document.createElement('div');poster.className='template-poster';poster.dataset.theme=t.id;
  poster.innerHTML='<div class="poster-decoration" aria-hidden="true">✧</div><div class="poster-content"><span>TAKLIFLY INVITATION</span><strong>Azizbek <em>&amp;</em> Malika</strong><small>12 · 06 · 2027</small></div><div class="poster-bottom" aria-hidden="true">✦ ── ✦ ── ✦</div>';
  const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent=t.emoji;
  const title=document.createElement('h3');title.textContent=t.title;
  const caption=document.createElement('p');caption.textContent=t.subtitle;
  const price=document.createElement('div');price.className='price';price.textContent=t.price?format(t.price):'Narx belgilanmagan';
  const row=document.createElement('div');row.className='actions';
  const demo=document.createElement('a');demo.className='btn';demo.target='_blank';demo.rel='noopener noreferrer';demo.textContent='👀 Namuna';demo.href=t.preview;
  const checkout=document.createElement('a');checkout.className='btn primary';checkout.textContent='Tanlash →';
  checkout.href=(t.price&&details.configured)?'/checkout/'+encodeURIComponent(t.id):'#';
  if(!t.price||!details.configured){checkout.setAttribute('aria-disabled','true');checkout.style.pointerEvents='none';checkout.style.opacity='.45'}
  row.append(demo,checkout);tile.append(poster,symbol,title,caption,price,row);$('templateList').append(tile);
 }
}
async function initCheckout(){
 const id=paths[1];chosen=catalog.find(x=>x.id===id);
 if(!chosen){$('paymentContents').classList.add('hidden');message('checkoutMessage','Shablon topilmadi.',true);return}
 $('checkoutTitle').textContent=chosen.emoji+' '+chosen.title;
 $('checkoutPrice').textContent=format(chosen.price);
 if(!details.configured||!chosen.price){$('notAvailable').classList.remove('hidden');$('paymentContents').classList.add('hidden');return}
 $('cardNumber').textContent=details.cardNumber.replace(/(\d{4})(?=\d)/g,'$1 ');
 $('cardHolder').textContent=details.cardHolder;
 $('copyCard').onclick=async()=>{
  try{await navigator.clipboard.writeText(details.cardNumber);$('copyCard').textContent='✓ Nusxalandi'}catch{window.prompt('Karta raqami:',details.cardNumber)}
 };
 $('checkoutForm').addEventListener('submit',submitCheckout);
}
async function sendReceipt(orderId,token,file){
 if(!file||file.size<200||file.size>8*1024*1024)throw Error('Chek rasmi 8 MB dan kichik va JPG/PNG/WebP bo‘lsin');
 return api('/api/checkout/orders/'+orderId+'/receipt',{method:'POST',headers:{'X-Order-Token':token,'Content-Type':file.type||'application/octet-stream'},body:file});
}
async function submitCheckout(e){
 e.preventDefault();
 const form=e.currentTarget,button=$('submitOrder');button.disabled=true;button.textContent='Buyurtma yuborilmoqda...';
 try{
  const data=Object.fromEntries(new FormData(form));
  const file=$('receiptFile').files[0];
  if(!file)throw Error('Chek rasmini tanlang.');
  if(file.size>8*1024*1024)throw Error('Chek 8 MB dan katta.');
  const order=await api('/api/checkout/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template:chosen.id,customerName:data.customerName,contact:data.contact})});
  const link='/order/'+order.orderId+'?key='+encodeURIComponent(order.accessToken);
  // Persist the recovery link immediately so a failed upload can be retried without paying twice.
  localStorage.setItem('taklifly-order-'+order.orderId,order.accessToken);
  try{
   await sendReceipt(order.orderId,order.accessToken,file);
   location.href=link;
  }catch(uploadError){
   const a=document.createElement('a');a.href=link;a.textContent='Buyurtmani ochib chekni qayta yuklash →';
   $('checkoutMessage').replaceChildren(document.createTextNode('Buyurtma yaratildi, ammo chek yuklanmadi: '+uploadError.message+' '),a);
  }
 }catch(ex){message('checkoutMessage',ex.message,true)}
 finally{button.disabled=false;button.textContent='Chekni yuborish va buyurtma berish →'}
}
async function initOrder(){
 const id=paths[1],key=new URLSearchParams(location.search).get('key')||localStorage.getItem('taklifly-order-'+id);
 if(!key){$('orderData').textContent='Buyurtma kaliti yo‘q. Buyurtma berilgan qurilmada havolani oching.';return}
 orderAccess={id,key};
 $('refreshStatus').onclick=loadOrder;
 await loadOrder();
}
async function loadOrder(){
 const box=$('orderData');box.textContent='Holat tekshirilmoqda...';
 try{
  const o=await api('/api/checkout/orders/'+orderAccess.id,{headers:{'X-Order-Token':orderAccess.key}});
  const label={awaiting_receipt:'🧾 Chek yuklanmagan',review:'🕒 To‘lov tekshirilmoqda',approved:'✅ To‘lov tasdiqlangan',rejected:'⚠️ Chek yoki to‘lov rad etilgan'}[o.status]||o.status;
  box.innerHTML='<p class="status '+(o.status==='approved'?'ok':'')+'">'+esc(label)+'</p><p class="small muted">Shablon: '+esc(o.template)+' · Summa: '+format(o.amount)+'</p><p class="small muted">Buyurtma: '+esc(o.id)+'</p>';
  if(o.status==='approved'&&o.claimCode){
   const div=document.createElement('div');div.className='payment-card';
   div.innerHTML='<div>Telegram botda taklifnomani to‘ldirish uchun aktivlashtirish kodi:</div><div class="carddigits" id="claimCode"></div><div class="small">Bot ichida /redeem KOD shaklida yuboring. Aktivlashtirish kodini begonalarga bermang.</div>';
   box.append(div);$('claimCode').textContent=o.claimCode;
   const copy=document.createElement('button');copy.className='btn';copy.style.marginTop='12px';copy.textContent='⧉ Kodni nusxalash';
   copy.onclick=()=>navigator.clipboard.writeText('/redeem '+o.claimCode).then(()=>{copy.textContent='✓ Nusxalandi'});
   box.append(copy);
  }else if(['awaiting_receipt','rejected'].includes(o.status)){
   const section=document.createElement('div');section.className='receipt';section.style.marginTop='16px';
   const caption=document.createElement('p');caption.className='small';caption.textContent='Chekni yuklang yoki qayta yuboring. Pul kelib tushganini menejer tasdiqlaydi.';
   const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';
   const button=document.createElement('button');button.className='btn primary';button.textContent='Chekni yuborish';
   button.onclick=async()=>{button.disabled=true;try{await sendReceipt(o.id,orderAccess.key,input.files[0]);await loadOrder()}catch(e){alert(e.message);button.disabled=false}};
   section.append(caption,input,button);box.append(section);
  }else{
   const p=document.createElement('p');p.className='small muted';p.textContent='Chekingiz qabul qilindi. Menejer karta tushumini tasdiqlagach, kod shu yerda ko‘rinadi. Bu sahifani saqlab qo‘ying.';box.append(p);
  }
 }catch(e){message('orderData','Holatni yuklashda xato: '+e.message,true)}
}
(async()=>{
 $('loading').classList.remove('hidden');
 try{
  const [cat,card]=await Promise.all([api('/api/checkout/catalog'),api('/api/checkout/payment-details')]);
  catalog=cat.templates||[];details=card;
  $(target).classList.remove('hidden');
  if(target==='catalogPage')renderCatalog();
  if(target==='checkoutPage')await initCheckout();
  if(target==='orderPage')await initOrder();
 }catch(e){const root=$(target);root.classList.remove('hidden');const warning=document.createElement('p');warning.className='status error';warning.textContent='Ma’lumot yuklanmadi: '+e.message;root.prepend(warning)}
 finally{$('loading').classList.add('hidden')}
})();
