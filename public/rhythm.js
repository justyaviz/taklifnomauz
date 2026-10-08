(() => {
  const player = typeof audioEl === 'undefined' ? null : audioEl;
  const song = typeof SOURCE_AUDIO === 'string' && SOURCE_AUDIO.includes('ef3c85d8-13c4-4a46-973d-a0d43e01ec60');
  const root = document.querySelector('.mobile');
  if (!player || !song || !root) return;
  const lessMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = root.querySelector('.hero');
  const musicTag = document.createElement('div');
  musicTag.className = 'oq-track-label';
  musicTag.textContent = '♫ TUY BOB — To‘ylar muborak';
  const progress = document.createElement('div');
  progress.className = 'oq-song-progress';
  const bar = document.createElement('span');
  progress.append(bar);
  const glow = document.createElement('div');
  glow.className = 'oq-orbit-glow';
  const particles = document.createElement('div');
  particles.className = 'oq-notes';
  particles.setAttribute('aria-hidden', 'true');
  root.append(particles);
  if (hero) hero.append(glow, musicTag, progress);
  let hits = [], index = 0, frame = 0, last = -1;
  fetch('/rhythm-hits.txt').then(r => r.text()).then(txt => {
    hits = txt.trim().split('\n').map(x => x.split(':').map(Number));
    index = seekIndex(player.currentTime);
  }).catch(() => {});
  function seekIndex(t) {
    let lo = 0, hi = hits.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (hits[m][0] < t) lo = m + 1; else hi = m;
    }
    return lo;
  }
  function pulse(strength) {
    if (document.hidden || lessMotion) return;
    const visible = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    };
    const section = [...root.querySelectorAll('.section')].find(visible);
    for (const el of [hero?.querySelector('.names'),section?.querySelector('h2')]) {
      if (visible(el)) el.animate(
        [{transform:'scale(1)'},{transform:'scale(' + (1+.023*strength) + ')',offset:.42},{transform:'scale(1)'}],
        {duration:315,easing:'ease-out'});
    }
    if (visible(glow)) glow.animate(
      [{opacity:.12},{opacity:.4 + strength*.4,offset:.4},{opacity:.12}],{duration:390});
    if (strength > .35 && particles.childElementCount < 10 && Math.random() < .42) {
      const note = document.createElement('span');
      note.className = 'oq-floating-note';
      note.textContent = ['♪','♫','✧'][Math.floor(Math.random()*3)];
      note.style.left = (12 + Math.random()*75) + '%';
      note.style.bottom = (10 + Math.random()*30) + '%';
      note.style.setProperty('--oq-drift',(Math.random()*90-45) + 'px');
      note.style.setProperty('--oq-rise',(110+Math.random()*95) + 'px');
      particles.append(note);
      setTimeout(() => note.remove(), 1800);
    }
  }
  function loop() {
    frame = 0;
    if (player.paused) return;
    const t = player.currentTime;
    if (Math.abs(t-last)>1.2 || t<last-.1) index = seekIndex(t-.07);
    let limit=0;
    while (index<hits.length && hits[index][0] <= t+.05 && limit++<6) {
      const [at,power]=hits[index++];
      if (at>=t-.13) pulse(power);
    }
    if (Number.isFinite(player.duration)) bar.style.transform = 'scaleX(' + (t/player.duration) + ')';
    last = t;
    frame = requestAnimationFrame(loop);
  }
  function start() { if (frame) return; last = player.currentTime; index=seekIndex(last-.07);frame=requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(frame); frame=0; last=-1; }
  player.addEventListener('play',start);
  player.addEventListener('pause',stop);
  player.addEventListener('ended',stop);
  player.addEventListener('seeking',()=>{ index=seekIndex(player.currentTime-.07);last=player.currentTime; });
  if (!player.paused) start();
})();
