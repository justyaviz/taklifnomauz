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
