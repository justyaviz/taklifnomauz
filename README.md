# OQ SAROY — interaktiv to‘y taklifnomasi

Responsive royal navy / gold uslubidagi Muhammad va Amina uchun to‘y taklifnomasi.
Mustaqil yozilgan demo. Rasm uslubi OQ SAROY namunasidan ilhomlangan.

Live: https://oq-saroy-web-production.up.railway.app/

## Features
- Chiroqlar yoqiladigan kirish animatsiyasi
- UZ/RU tillari va brauzerda sintez qilinadigan audio
- Vaqt zonasi to‘g‘rilangan countdown: 2026-11-21T19:00:00+05:00
- Kalendar, marosim jadvali, Google/Yandex xaritasi
- API orqali tilaklar CRUD, tahrirlash tokenlari va input validatsiya
- Railway healthcheck /health va /data persistent volume

## Start
Node 20+; run `npm start`, then visit http://localhost:3000. Run `npm test` for server tests.

## Deploy
Railway project: oq-saroy-replica; service oq-saroy-web. Production follows main branch.
Variables: DATA_DIR=/data and NODE_ENV=production. A 512 MB Railway volume is mounted at /data.

## Customize
Edit public/index.html for names, address and maps. Edit public/app.js for languages and wedding date.
Styles and background-image references are in public/styles.css.

## Media rights
All application source code is freshly authored. Some decorative pictures, OG preview and the background audio (`/assets/audio/song4.mp3`, played from 26 seconds) currently HOTLINK the reference website for design comparison only. The rights to reuse them have not been verified. Replace those links with owned or licensed media before commercial use. Availability of third-party images is not guaranteed.

## Limitations
Sample couple, date and venue. Guest wishes belong to one invitation only. For a multi-invitation SaaS, add invitation-specific storage, separate access control and moderation.

## Administrator panel

Admin URL: https://oq-saroy-web-production.up.railway.app/admin
Public invitation URL format: https://oq-saroy-web-production.up.railway.app/i/your-slug

Available: password protected login, dashboard, invitation create/edit/duplicate/delete, publish/unpublish, custom colors, background and photo uploads, uploaded MP3, start offset, ceremony programme, guest-specific links, guest list, RSVP, wishes moderation, CSV export, owner password rotation.

Required Railway environment variables: ADMIN_USERNAME, ADMIN_PASSWORD_HASH (scrypt salt:hash), ADMIN_SESSION_SECRET (strong random secret), DATA_DIR=/data, NODE_ENV=production. Railway volume must be attached at /data. Never commit initial passwords or any Railway secrets into source code.

User interface entry: public/admin.html; client actions: public/admin.js; backend: admin-service.mjs; persistence model: admin-data.mjs. node --test validates admin authentication, invitations, media, RSVP, moderation and password rotation.

Some stock decorative images and sample background audio still load from the source website; replace with files you own or have permission to use for long-term deployment.


## Telegram taklifnoma shop (Stars)

Three template previews:
- OQ SAROY: https://oq-saroy-web-production.up.railway.app/t/oq-saroy
- ZARHAL: https://oq-saroy-web-production.up.railway.app/t/zarhal
- NAFIS: https://oq-saroy-web-production.up.railway.app/t/minimal

Bot commands: /start, /templates, /orders, /cancel, /help, /support, /terms, /paysupport.

Buyer workflow: browse a preview → choose a template → Telegram Stars checkout → pre-checkout amount, currency, user and order ID verified → wait for successful_payment → save Telegram payment charge ID → fill groom/bride, date/time, venue/address, map pin, invitation text, MP3 and photos in chat → publish unique invitation URL. Reopen or edit via /orders.

Admin → **Telegram savdo** shows purchases and lets the owner set Stars prices per template. Setting a price to 0 disables checkout.

### BotFather activation (owner action)

1. Open https://t.me/BotFather and use /newbot.
2. In Railway → oq-saroy-replica → oq-saroy-web → Variables, set TELEGRAM_BOT_TOKEN to the token issued by BotFather. NEVER commit the token or send it to customers.
3. The separately configured TELEGRAM_WEBHOOK_SECRET and PUBLIC_BASE_URL are already used by the app; at startup the service registers its HTTPS webhook at /api/telegram/webhook.
4. Optionally configure TELEGRAM_SUPPORT_USERNAME for payment support.
5. In /admin → Telegram savdo, set the prices in Telegram Stars and save them.
6. Open the new Telegram bot, send /start and run a small real or Telegram test-environment payment before making the bot public.

Digital products sold inside Telegram bots must use Stars (XTR). The service uses an empty provider_token. It NEVER fulfills an invoice on pre_checkout_query alone, only on verified successful_payment. Persistent order and payment charge IDs are stored on the Railway volume. Music and decorative images require confirmed licensing rights before commercial resale.


## TAKLIFLY independent card-transfer checkout and named guest sharing

The independent website storefront is at https://oq-saroy-web-production.up.railway.app/shop
- Choose among OQ SAROY, ZARHAL and NAFIS.
- Enter customer name and contact, display only the RECEIVING card number/owner name (not the buyer's card), transfer externally and upload receipt photo (PNG/JPEG/WebP, max 8 MB).
- Receipts are PRIVATE in the Railway volume at DATA_DIR/private-receipts; never served from public media. The buyer sees progress via the secret order link. Uploading a receipt DOES NOT mean payment is confirmed.
- Administrator uses /admin → Karta buyurtmalari to set bank card details and UZS prices, open each private receipt and confirm the actual incoming bank transfer (or reject).
- Only after manual confirmation the buyer sees a unique activation code in the independent checkout status page.
- A buyer who has already purchased on the independent website can use Telegram bot /redeem TKF-... to activate the invitation editor. The claim code can be associated with one Telegram user only.
- When the invitation is ready, the bot has a "💌 Mehmon taklif qilish" button. Enter a guest name; the bot creates a personal invitation letter/post, a ?guest=NAME invitation link and Telegram share button. Guests see their name on the invitation page.

**Telegram rules**: digital services offered for sale *inside* Telegram bots or mini apps must use Telegram Stars (XTR). Manual bank-transfer checkout is intentionally available only on the independent website. The bot must not advertise, solicit or redirect an in-Telegram digital purchase to a third-party payment checkout. Existing in-bot Stars functionality remains optional and is disabled by setting Stars prices to zero; do not set Stars prices in /admin unless planning to sell via Telegram Stars.

**Important:** Receiver card number and name must be entered by the owner in /admin and are not hardcoded. Do not paste sensitive payment credentials or BotFather tokens in source code or chat. The Telegram bot requires TELEGRAM_BOT_TOKEN in the Railway production environment to operate; TELEGRAM_WEBHOOK_SECRET is already configured separately.
