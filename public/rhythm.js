/* TUY BOB celebration theme — strong accents locked to the audio timeline. */
(() => {
  'use strict';
  const song = typeof SOURCE_AUDIO === 'string' && SOURCE_AUDIO.includes('ef3c85d8-13c4-4a46-973d-a0d43e01ec60');
  const player = typeof audioEl === 'undefined' ? null : audioEl;
  const root = document.querySelector('.mobile');
  if (!song || !player || !root) return;

  const hero = root.querySelector('.hero');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = window.matchMedia('(max-width: 600px)');
  const visual = document.createElement('div');
  visual.className = 'oq-festival-effects';
  visual.setAttribute('aria-hidden','true');
  visual.innerHTML = '<div class="oq-stage-light oq-stage-light-a"></div><div class="oq-stage-light oq-stage-light-b"></div><div class="oq-impact"></div><div class="oq-confetti-layer"></div>';
  document.body.append(visual);

  const impact = visual.querySelector('.oq-impact');
  const confetti = visual.querySelector('.oq-confetti-layer');
  const ringLayer = document.createElement('div');
  ringLayer.className = 'oq-ring-layer';
  ringLayer.setAttribute('aria-hidden', 'true');
  if (hero) hero.append(ringLayer);

  const tag = document.createElement('div');
  tag.className = 'oq-track-label';
  tag.innerHTML = '<span class="oq-equalizer"><i></i><i></i><i></i><i></i><i></i></span><span><strong>TUY BOB</strong><small>To‘ylar muborak</small></span>';
  const progress = document.createElement('div');
  progress.className = 'oq-song-progress';
  const bar = document.createElement('span');
  progress.append(bar);
  if (hero) hero.append(tag,progress);

  const stars = document.createElement('div');
  stars.className = 'oq-notes';
  stars.setAttribute('aria-hidden','true');
  document.body.append(stars);
  const intro = document.getElementById('intro');
  if (intro) {
    const curtains = document.createElement('div');
    curtains.className = 'oq-intro-curtains';
    curtains.setAttribute('aria-hidden','true');
    curtains.innerHTML = '<i></i><i></i>';
    intro.append(curtains);
  }

  let hits = [], index = 0, frame = 0, lastTime = -1, lastBig = -10;
  let currentPhase = '';
  let lastBurst = 0;
  const timers = new Set();
  function cleanupLater(node,delay) {
    const t=setTimeout(()=>{node.remove();timers.delete(t);},delay);
    timers.add(t);
  }
  function seekIndex(sec) {
    let lo=0,hi=hits.length;
    while(lo<hi){const mid=(lo+hi)>>>1;if(hits[mid][0]<sec)lo=mid+1;else hi=mid;}
    return lo;
  }
  function expandBeats(data) {
    const cues = data.map(x=>[x[0],x[1],false]).filter(x=>Number.isFinite(x[0])&&Number.isFinite(x[1]));
    const enriched = [];
    for(let i=0;i<cues.length;i++){
      const a=cues[i], b=cues[i+1];
      enriched.push(a);
      if(!b)continue;
      const gap=b[0]-a[0];
      const subdivisions=Math.round(gap/0.395);
      // Keep musical flow between measured transients; never invent extra peak accents.
      if(gap>.56 && gap<3.25 && subdivisions>1){
        for(let j=1;j<subdivisions;j++){
          enriched.push([a[0]+gap*j/subdivisions,.24,false]);
        }
      }
    }
    return enriched.sort((a,b)=>a[0]-b[0]);
  }
  fetch('/rhythm-hits.txt',{cache:'force-cache'}).then(r=>{
    if(!r.ok)throw new Error('Cannot fetch rhythm cues');
    return r.text();
  }).then(t=>{
    hits=expandBeats(t.trim().split('\n').map(line=>line.split(':').map(Number)));
    index=seekIndex(player.currentTime-.05);
    document.documentElement.dataset.rhythmLoaded='yes';
  }).catch(()=>{document.documentElement.dataset.rhythmLoaded='no';});

  function visible(el){
    if(!el)return false;
    const r=el.getBoundingClientRect();
    return r.bottom>0&&r.top<innerHeight;
  }
  function animate(el,frames,duration){
    if(!el||!visible(el)||reduced.matches||!el.animate)return;
    el.animate(frames,{duration,easing:'cubic-bezier(.14,.75,.22,1)'});
  }
  function spawnNote(strength) {
    if(reduced.matches || stars.childElementCount>14)return;
    const e=document.createElement('span');
    e.className='oq-floating-note';
    e.textContent=['♪','♫','♬','✦'][Math.floor(Math.random()*4)];
    e.style.left=(5+Math.random()*90)+'%';
    e.style.bottom=(5+Math.random()*28)+'%';
    e.style.setProperty('--oq-rise',(180+Math.random()*175)+'px');
    e.style.setProperty('--oq-drift',(Math.random()*180-90)+'px');
    e.style.fontSize=(18+strength*20)+'px';
    stars.append(e);cleanupLater(e,1800);
  }
  function shockwave(power) {
    if(!hero || !visible(hero) || reduced.matches)return;
    const ring=document.createElement('div');
    ring.className='oq-shockwave';
    ring.style.setProperty('--oq-power',String(power));
    ringLayer.append(ring);
    cleanupLater(ring,1100);
  }
  function burst(power) {
    if(reduced.matches||document.hidden)return;
    const now=performance.now();
    if(now-lastBurst<650)return;
    lastBurst=now;
    const count=isMobile.matches?14:24;
    if(confetti.childElementCount>55)return;
    const width=Math.max(300,window.innerWidth),height=Math.max(500,window.innerHeight);
    const colors=['#f6d278','#ffffff','#e2a84b','#fff0bc','#d2a15a'];
    for(let i=0;i<count;i++){
      const e=document.createElement('i');
      e.className='oq-confetti';
      const origin=i%2===0?width*.15:width*.85;
      const vx=(i%2===0?1:-1)*(50+Math.random()*width*.46);
      const vy=(height*.18+Math.random()*height*.38);
      e.style.left=origin+'px';e.style.top=(height*.64+Math.random()*height*.12)+'px';
      e.style.setProperty('--oq-x',vx+'px');e.style.setProperty('--oq-y',(-vy)+'px');
      e.style.setProperty('--oq-rot',(300+Math.random()*650)+'deg');
      e.style.setProperty('--oq-dur',(1000+Math.random()*700)+'ms');
      e.style.background=colors[i%colors.length];
      e.style.width=(3+Math.random()*5)+'px';
      e.style.height=(7+Math.random()*10)+'px';
      confetti.append(e);cleanupLater(e,1850);
    }
    const flare=document.createElement('span');
    flare.className='oq-screen-flare';
    visual.append(flare);cleanupLater(flare,640);
  }
  function pulse(energy,t) {
    if(document.hidden||reduced.matches)return;
    const major=energy>=.65;
    const current=[...root.querySelectorAll('.section')].find(visible);
    const title=visible(hero)?hero.querySelector('.names'):current?.querySelector('h2');
    const card=current?.querySelector('.cal, .timeline, .counts, .wish-list, .map-placeholder, .end-names');
    animate(title,[
      {transform:'translateY(0) scale(1)',filter:'brightness(1)'},
      {transform:'translateY(-5px) scale('+(major?1.105:1.055)+')',filter:'brightness(1.35)',offset:.36},
      {transform:'translateY(0) scale(1)',filter:'brightness(1)'}
    ],major?480:320);
    animate(card,[
      {transform:'scale(1)'},{transform:'scale('+(major?1.065:1.025)+')',offset:.35},{transform:'scale(1)'}
    ],major?470:330);
    animate(impact,[
      {opacity:0},{opacity:major?.42:.20,offset:.15},{opacity:0}
    ],major?480:340);
    if(major || Math.random()<.45)shockwave(energy);
    if(major && t-lastBig>1.0){lastBig=t;burst(energy);}
    if(Math.random()<(major?.85:.4))spawnNote(energy);
  }
  function phase(t) {
    if(t<8)return 'intro';
    if(t<36)return 'build';
    if(t<45)return 'drop';
    if(t<103)return 'dance';
    if(t<110)return 'drop';
    if(t<170)return 'dance';
    if(t<177)return 'drop';
    if(t<254)return 'dance';
    return 'finale';
  }
  function tick(){
    frame=0;
    if(player.paused||player.ended)return;
    const t=player.currentTime;
    if(!Number.isFinite(t))return;
    if(Math.abs(t-lastTime)>1.1||t<lastTime-.09)index=seekIndex(t-.055);
    let processed=0;
    while(index<hits.length&&hits[index][0]<=t+.055&&processed++<7){
      const [at,power]=hits[index++];
      if(at>=t-.16)pulse(power,at);
    }
    if(Number.isFinite(player.duration)&&player.duration>0){
      bar.style.transform='scaleX('+Math.min(1,t/player.duration)+')';
    }
    const part=phase(t);
    if(part!==currentPhase){
      currentPhase=part;
      root.dataset.oqPhase=part;
      // Each musical phrase arrives with a small celebratory accent.
      if(part==='drop'||part==='finale')burst(1);
    }
    lastTime=t;
    frame=requestAnimationFrame(tick);
  }
  function start(){
    if(frame)return;
    root.classList.add('oq-is-playing');
    index=seekIndex(player.currentTime-.055);
    lastTime=player.currentTime;
    frame=requestAnimationFrame(tick);
  }
  function stop(){
    cancelAnimationFrame(frame);frame=0;lastTime=-1;
    root.classList.remove('oq-is-playing');
  }
  player.addEventListener('play',start);
  player.addEventListener('pause',stop);
  player.addEventListener('ended',stop);
  player.addEventListener('seeking',()=>{index=seekIndex(player.currentTime-.055);lastTime=player.currentTime;});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(frame);frame=0;}
    else if(!player.paused)start();
  });
  if(!player.paused)start();
})();