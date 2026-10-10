import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {TEMPLATE_CATALOG,TEMPLATE_IDS} from './template-catalog.mjs';
import {normalize,starter} from './admin-data.mjs';
import {createTelegramService} from './telegram-bot.mjs';
import {CARD_CATALOG} from './checkout-service.mjs';

let proc,dir,url;
before(async()=>{
 dir=await mkdtemp(path.join(os.tmpdir(),'taklifly-nine-'));
 const port=21000+Math.floor(Math.random()*20000);
 url='http://127.0.0.1:'+port;
 proc=spawn(process.execPath,['server.mjs'],{
  env:{...process.env,PORT:String(port),DATA_DIR:dir,TELEGRAM_BOT_TOKEN:'',TELEGRAM_WEBHOOK_SECRET:''},
  stdio:'ignore'
 });
 let ok=false;
 for(let i=0;i<100;i++){try{if((await fetch(url+'/health')).ok){ok=true;break}}catch{}await new Promise(r=>setTimeout(r,65))}
 assert.equal(ok,true);
});
after(async()=>{proc?.kill();await rm(dir,{recursive:true,force:true})});

test('ten templates, six styles first, original couple plus former three',()=>{
 assert.equal(TEMPLATE_IDS.length,10);
 assert.deepEqual(TEMPLATE_IDS.slice(0,6),['classic','royal','premium','festival','elegant','modern']);
 assert.deepEqual(TEMPLATE_IDS.slice(6),['oq-saroy-original','oq-saroy','zarhal','minimal']);
 assert.deepEqual(CARD_CATALOG.map(t=>t.id),TEMPLATE_IDS);
 assert.equal(new Set(TEMPLATE_CATALOG.map(t=>t.title)).size,10);
});
test('all ten themes pass invitation validation',()=>{
 for(const id of TEMPLATE_IDS){
  const i=normalize({template:id,slug:'preview-'+id},starter());
  assert.equal(i.template,id);
  assert.equal(i.slug,'preview-'+id);
 }
 assert.throws(()=>normalize({template:'nonexistent'},starter()));
});
test('ten public previews deliver right data, theme CSS and couple names',async()=>{
 const css=await (await fetch(url+'/extra-themes.css')).text();
 const index=await (await fetch(url+'/t/royal')).text();
 assert.match(index,/extra-themes\.css/);
 for(const id of TEMPLATE_IDS){
  const res=await fetch(url+'/t/'+id);
  assert.equal(res.status,200,id+' preview HTTP');
  const html=await res.text();
  assert.ok(html.includes('"template":"'+id+'"'),id+' data binding');
  assert.ok(html.includes(id==='oq-saroy-original'?"Muhammad":"Azizbek"),id+' demo name');
  if(['classic','royal','premium','festival','elegant','modern'].includes(id)){
   assert.ok(css.includes('body[data-template="'+id+'"] .hero'),id+' hero skin');
   assert.ok(css.includes('body[data-template="'+id+'"] .section'),id+' independent section');
  }
 }
});
test('website catalog lists ten themes in correct order',async()=>{
 const response=await fetch(url+'/api/checkout/catalog');
 assert.equal(response.status,200);
 const catalog=(await response.json()).templates;
 assert.deepEqual(catalog.map(x=>x.id),TEMPLATE_IDS);
 assert.equal(catalog.every(x=>x.price===0),true);
});
test('Telegram bot catalog lists all ten including original couple',async()=>{
 const calls=[],bot=createTelegramService({
  dataDir:dir,baseUrl:url,botToken:'test-token',webhookSecret:'a_valid_secret_code_for_local_tests',
  transport:async(method,params)=>{calls.push({method,params});return true}
 });
 await bot.processUpdate({update_id:956132,callback_query:{id:'q956132',from:{id:123},data:'catalog',message:{chat:{id:123}}}});
 const sent=calls.findLast(x=>x.method==='sendMessage');
 assert.ok(sent);
 const choices=sent.params.reply_markup.inline_keyboard.slice(0,10).flat();
 assert.deepEqual(choices.map(x=>x.callback_data),TEMPLATE_IDS.map(x=>'view:'+x));
});

test('original OQ SAROY is a public, read-only demo with guestbook and exact reference couple',async()=>{
 const response=await fetch(url+'/t/oq-saroy-original');
 assert.equal(response.status,200);
 const html=await response.text();
 for(const marker of ['Muhammad','Amina','2026-11-21','Navro','"template":"oq-saroy-original"','"previewDemo":true','"allowWishes":true'])assert.ok(html.includes(marker),marker);
 assert.match(html,/oq-original-clone\.css/);
 assert.equal((await fetch(url+'/t/ulugbek-muslima')).status,404);
});

test('OQ SAROY clone uses short, non-blocking mobile introduction and cache-safe assets',async()=>{
 const res=await fetch(url+'/t/oq-saroy-original');
 assert.equal(res.status,200);
 const html=await res.text();
 assert.match(html,/oq-original-client\\.js\\?v=20261010-2/);
 assert.match(html,/oq-original-clone\\.css\\?v=20261010-2/);
 const js=await (await fetch(url+'/oq-original-client.js')).text();
 const css=await (await fetch(url+'/oq-original-clone.css')).text();
 assert.equal(js.includes('requestAnimationFrame('),false);
 assert.equal(js.includes('setTimeout(done,15500)'),false);
 assert.ok(js.includes("document.body.style.overflowY='auto'"));
 assert.ok(js.includes("const duration=window.matchMedia"));
 assert.ok(js.includes("const startMap=()=>"));
 assert.ok(css.includes('@keyframes oqTextEnter'));
 assert.ok(css.includes('.opening-ov.is-opening{opacity:0;transition:opacity 1.1s ease}'));
});
