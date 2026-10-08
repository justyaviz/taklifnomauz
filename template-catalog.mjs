export const TEMPLATE_CATALOG=Object.freeze([
 {id:'classic',title:'CLASSIC',emoji:'🕯️',subtitle:'Klassik oltin va fil suyagi uslubi',description:'Naqshli, yumshoq klassik taklifnoma; nafis serif yozuvlar.'},
 {id:'royal',title:'ROYAL',emoji:'👑',subtitle:'To‘q ko‘k va qirollik oltini',description:'Tantana va saroy kayfiyati, ramkalar va toj motifi.'},
 {id:'premium',title:'PREMIUM GOLD',emoji:'💎',subtitle:'Qora marmar va metall oltin',description:'Hashamatli qora-oltin ko‘rinish va kuchli yorug‘lik.'},
 {id:'festival',title:'FESTIVAL',emoji:'🎊',subtitle:'Ritmli bayram va konfetti',description:'Musiqa ritmidagi yorqin pulse, sahna chiroqlari va konfetti.'},
 {id:'elegant',title:'ELEGANT',emoji:'🌷',subtitle:'Atirgul va mayin pushti ranglar',description:'Yumshoq romantik taklifnoma, gul motivlari.'},
 {id:'modern',title:'MODERN',emoji:'🪩',subtitle:'Zamonaviy ko‘k-binafsha neon',description:'Minimal tipografika, gradientlar va dinamik geometriya.'},
 {id:'oq-saroy',title:'OQ SAROY',emoji:'🏰',subtitle:'Asl saroy shabloni',description:'Saroy, oltin bezak va musiqali kirish animatsiyasi.'},
 {id:'zarhal',title:'ZARHAL',emoji:'✨',subtitle:'Yorqin oltin va to‘q pushti',description:'Oltin va nafis pushti rangdagi tantanali bayram.'},
 {id:'minimal',title:'NAFIS',emoji:'🤍',subtitle:'Oq, soddalik va sokinlik',description:'Oq va bej tusli zamonaviy minimalist shablon.'}
]);
export const TEMPLATE_IDS=Object.freeze(TEMPLATE_CATALOG.map(x=>x.id));
export const TEMPLATE_BY_ID=Object.freeze(Object.fromEntries(TEMPLATE_CATALOG.map(x=>[x.id,x])));
export const DEFAULT_TEMPLATE_PRICES=()=>Object.fromEntries(TEMPLATE_IDS.map(id=>[id,0]));
