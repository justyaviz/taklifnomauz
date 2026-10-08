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
All application source code is freshly authored. Some decorative pictures and OG preview currently HOTLINK the reference website for design comparison only. The rights to reuse them have not been verified. Replace those links with owned or licensed media before commercial use. Availability of third-party images is not guaranteed.

## Limitations
Sample couple, date and venue. Guest wishes belong to one invitation only. For a multi-invitation SaaS, add invitation-specific storage, separate access control and moderation.
