import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import os from 'node:os';import path from 'node:path';
import {createTelegramService,BOT_TEMPLATES} from './telegram-bot.mjs';
import {storage} from './admin-data.mjs';
let dir,service,calls=[],updateId=1000;
const secret='test_very_long_telegram_secret_12345';
const msg=(text,pay)=>({update_id:updateId++,message:{message_id:updateId,chat:{id:42,type:'private'},from:{id:42,first_name:'Test'},...(pay?{successful_payment:pay}:{text})}});
const cb=(data)=>({update_id:updateId++,callback_query:{id:'cb-'+updateId,from:{id:42},data,message:{chat:{id:42},message_id:9}}});
before(async()=>{
 dir=await mkdtemp(path.join(os.tmpdir(),'oq-bot-test-'));
 service=createTelegramService({dataDir:dir,baseUrl:'https://example.com',botToken:'123:TEST_BOT_TOKEN',webhookSecret:secret,prices:'0,0,0,0,0,0,12,23,34',transport:async(method,params)=>{calls.push({method,params});return method==='getFile'?{file_path:'photos/a.jpg',file_size:100}:true}});
});
after(async()=>await rm(dir,{recursive:true,force:true}));
test('catalog exposes all three working preview links',async()=>{
 assert.equal(BOT_TEMPLATES.length,9);
 await service.processUpdate(msg('/start'));
 await service.processUpdate(cb('catalog'));
 await service.processUpdate(cb('view:zarhal'));
 const preview=calls.findLast(x=>x.method==='sendMessage').params.reply_markup.inline_keyboard[0][0];
 assert.equal(preview.url,'https://example.com/t/zarhal');
 assert.equal(service.prices.zarhal,23);
});
test('Stars invoice is issued once with verified amount',async()=>{
 await service.processUpdate(cb('buy:oq-saroy'));
 const invoice=calls.findLast(x=>x.method==='sendInvoice');
 assert.equal(invoice.params.currency,'XTR');
 assert.equal(invoice.params.prices[0].amount,12);
 assert.equal(invoice.params.provider_token,'');
 const oid=invoice.params.payload;
 globalThis.orderId=oid;
 await service.processUpdate({update_id:updateId++,pre_checkout_query:{id:'q1',from:{id:42},invoice_payload:oid,total_amount:18,currency:'XTR'}});
 assert.equal(calls.findLast(x=>x.method==='answerPreCheckoutQuery').params.ok,false);
 await service.processUpdate({update_id:updateId++,pre_checkout_query:{id:'q2',from:{id:42},invoice_payload:oid,total_amount:12,currency:'XTR'}});
 assert.equal(calls.findLast(x=>x.method==='answerPreCheckoutQuery').params.ok,true);
 const beforeList=await service.getOrders();
 assert.equal(beforeList[0].status,'pending_payment');
});
test('successful_payment unlocks wizard only once and replays are harmless',async()=>{
 const pay={invoice_payload:globalThis.orderId,total_amount:12,currency:'XTR',telegram_payment_charge_id:'charge-test-123'};
 await service.processUpdate(msg('',pay));
 await service.processUpdate(msg('',pay));
 const list=await service.getOrders();
 assert.equal(list[0].status,'collecting');
 assert.equal(list[0].step,'groom');
 const invites=await storage(dir).invites();
 assert.equal(invites.filter(x=>x.botOrderId===globalThis.orderId).length,1);
 assert.equal(invites.find(x=>x.botOrderId===globalThis.orderId).published,false);
});
test('collect all fields and publish correct invitation link',async()=>{
 for(const [text,step] of [
  ['Ulugbek','bride'],['Muslima','eventDate'],['23.10.2027','eventTime'],
  ['17:00','venue'],['Ziyofat saroyi','address'],
  ['Qo‘qon, Mustaqillik 18','map']
 ]){
  await service.processUpdate(msg(text));
  const o=(await service.getOrders())[0];
  assert.equal(o.step,step);
 }
 await service.processUpdate(cb('skip:'+globalThis.orderId));
 await service.processUpdate(msg('Sizni marosimimizga taklif qilamiz!'));
 await service.processUpdate(cb('skip:'+globalThis.orderId));
 await service.processUpdate(cb('skip:'+globalThis.orderId));
 const o=(await service.getOrders())[0];
 assert.equal(o.step,'review');
 await service.processUpdate(cb('publish:'+globalThis.orderId));
 const order=(await service.getOrders())[0];
 const invitations=await storage(dir).invites();
 const inv=invitations.find(x=>x.id===order.invitationId);
 assert.equal(order.status,'ready');
 assert.equal(inv.published,true);
 assert.equal(inv.groom,'Ulugbek');
 assert.equal(inv.bride,'Muslima');
 assert.equal(inv.eventDate,'2027-10-23');
 assert.equal(inv.eventTime,'17:00');
 assert.equal(inv.template,'oq-saroy');
 assert.equal(inv.venue,'Ziyofat saroyi');
 assert.ok(calls.findLast(x=>x.method==='sendMessage').params.reply_markup.inline_keyboard[0][0].url.includes('/i/'+order.slug));
});
test('webhook rejects unauthenticated updates and unconfigured purchases stay disabled',async()=>{
 const other=createTelegramService({dataDir:dir,botToken:'',webhookSecret:'',prices:'',transport:async()=>true});
 assert.equal(other.configured,false);
 assert.equal(Object.values(other.prices).every(x=>x===0),true);
 const mockReq={method:'POST',headers:{'x-telegram-bot-api-secret-token':'wrong','content-type':'application/json'},[Symbol.asyncIterator]:async function*(){}};
 let status,payload;
 const res={writeHead:s=>{status=s},end:x=>{payload=x}};
 await service.webhook(mockReq,res,new URL('https://example.com/api/telegram/webhook'));
 assert.equal(status,403);
 assert.equal(JSON.parse(payload).ok,false);
});
