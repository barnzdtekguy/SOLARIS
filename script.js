// ═══════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════
let audioCtx = null;
let audioEnabled = true;
let startupPlayed = false;
let startupPending = false;

function getCtx() {
  if (!audioEnabled) return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) audioCtx = new AudioCtor();
  if (audioCtx.state === 'suspended') {
    const resume = audioCtx.resume();
    if (resume && typeof resume.catch === 'function') resume.catch(() => {});
  }
  return audioCtx;
}

function tone(freq, dur, type='sine', vol=0.07, atk=0.01) {
  const ctx = getCtx(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(freq*0.6, ctx.currentTime+dur);
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(vol, ctx.currentTime+atk);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
  o.start(ctx.currentTime); o.stop(ctx.currentTime+dur);
}

function playStartup() {
  if (startupPlayed || !audioEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state !== 'running') {
    startupPending = true;
    const resume = ctx.resume();
    if (resume && typeof resume.then === 'function') {
      resume.then(() => {
        if (ctx.state === 'running') playStartup();
      }).catch(() => {});
    }
    return;
  }

  startupPlayed = true;
  startupPending = false;
  setTimeout(()=>tone(55,1.9,'sine',.09,.45), 80);
  setTimeout(()=>tone(82.41,1.65,'triangle',.06,.35), 260);
  setTimeout(()=>tone(110,1.35,'sawtooth',.035,.25), 540);
  setTimeout(()=>{tone(146.83,1.5,'sine',.045,.2);tone(220,1.5,'triangle',.035,.2)}, 900);
  setTimeout(()=>{tone(440,.42,'sine',.035,.04);tone(659.25,.5,'sine',.025,.04)}, 1750);
}

function removeAudioUnlockListeners() {
  document.removeEventListener('pointerdown', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
}

function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  const finishUnlock = () => {
    if (ctx.state !== 'running') return;
    if (startupPending || !startupPlayed) playStartup();
    removeAudioUnlockListeners();
  };
  if (ctx.state === 'running') {
    finishUnlock();
    return;
  }
  const resume = ctx.resume();
  if (resume && typeof resume.then === 'function') resume.then(finishUnlock).catch(() => {});
}

document.addEventListener('pointerdown', unlockAudio);
document.addEventListener('keydown', unlockAudio);
document.addEventListener('touchstart', unlockAudio, { passive: true });

startupPending = true;
requestAnimationFrame(playStartup);
setTimeout(playStartup, 300);

function playHover() { if(audioEnabled) tone(800,.08,'sine',.025,.003); }
function playClick() { if(audioEnabled){tone(440,.12,'square',.04,.002);setTimeout(()=>tone(880,.08,'sine',.03,.002),50);} }
function playTypeKey() { if(audioEnabled) tone(600+Math.random()*200,.04,'sine',.015,.001); }
function playSuccess() {
  tone(523,.2,'sine',.06,.01);
  setTimeout(()=>tone(659,.2,'sine',.06,.01),150);
  setTimeout(()=>tone(784,.35,'sine',.07,.01),300);
  setTimeout(()=>{tone(1046,.5,'sine',.05,.01);tone(1318,.5,'sine',.04,.01)},600);
}
function playError() { tone(200,.3,'sawtooth',.05,.01); setTimeout(()=>tone(150,.3,'sawtooth',.04,.01),200); }
function playNotification() { tone(698,.15,'sine',.05,.01); setTimeout(()=>tone(880,.2,'sine',.06,.01),100); }

// ═══════════════════════════════════
// LOADING
// ═══════════════════════════════════
let progress = 0;
const statuses = ['INITIALIZING SYSTEMS','CALIBRATING SOLAR ARRAYS','MAPPING STELLAR COORDINATES','LOADING QUANTUM RENDERER','SYNCHRONIZING ORBITS','SYSTEM READY'];
const loadbar = document.getElementById('loadbar');
const loadtxt = document.getElementById('loadtxt');
const loadpct = document.getElementById('loadpct');

const loadInterval = setInterval(() => {
  progress = Math.min(progress + Math.random()*11 + 3, 100);
  loadbar.style.width = progress + '%';
  loadpct.textContent = Math.floor(progress) + '%';
  loadtxt.textContent = statuses[Math.floor((progress/100)*(statuses.length-1))];
  if (progress >= 100) {
    clearInterval(loadInterval);
    setTimeout(() => {
      playStartup();
      const loading = document.getElementById('loading');
      loading.style.transition = 'opacity 1s';
      loading.style.opacity = '0';
      setTimeout(() => {
        loading.style.display = 'none';
        showPage('home');
        revealHero();
      }, 1000);
    }, 300);
  }
}, 110);

// ═══════════════════════════════════
// CURSOR
// ═══════════════════════════════════
const cdot = document.getElementById('cdot');
const cring = document.getElementById('cring');
let rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  cdot.style.left = e.clientX + 'px'; cdot.style.top = e.clientY + 'px';
  rx += (e.clientX - rx) * 0.12; ry += (e.clientY - ry) * 0.12;
});

setInterval(() => {
  cring.style.left = rx + 'px'; cring.style.top = ry + 'px';
}, 16);

document.querySelectorAll('a,button,.btn-primary,.btn-ghost,.nav-link,.sol-item,.m-card,.dash-nav-item').forEach(el => {
  el.addEventListener('mouseenter', () => cring.classList.add('h'));
  el.addEventListener('mouseleave', () => cring.classList.remove('h'));
});

// ═══════════════════════════════════
// PARTICLES
// ═══════════════════════════════════
const pcanvas = document.getElementById('pcanvas');
const pctx = pcanvas.getContext('2d');
pcanvas.width = window.innerWidth; pcanvas.height = window.innerHeight;

const particles = Array.from({length:70}, () => ({
  x: Math.random()*pcanvas.width, y: Math.random()*pcanvas.height,
  vx: (Math.random()-.5)*.25, vy: (Math.random()-.5)*.25,
  r: Math.random()*1.8+.4,
  color: ['rgba(0,212,255','rgba(0,100,255','rgba(123,47,255','rgba(0,255,136'][Math.floor(Math.random()*4)],
  life:0, maxLife: 250+Math.random()*300
}));

function renderParticles() {
  requestAnimationFrame(renderParticles);
  pctx.clearRect(0,0,pcanvas.width,pcanvas.height);
  particles.forEach((p,i) => {
    p.life++; if(p.life>p.maxLife){p.x=Math.random()*pcanvas.width;p.y=Math.random()*pcanvas.height;p.life=0;}
    const op = Math.sin((p.life/p.maxLife)*Math.PI)*.45;
    p.x+=p.vx; p.y+=p.vy;
    if(p.x<0)p.x=pcanvas.width; if(p.x>pcanvas.width)p.x=0;
    if(p.y<0)p.y=pcanvas.height; if(p.y>pcanvas.height)p.y=0;
    particles.forEach((o,j) => {
      if(i>=j) return;
      const d=Math.hypot(p.x-o.x,p.y-o.y);
      if(d<110){pctx.beginPath();pctx.strokeStyle=`${p.color},${(1-d/110)*.07})`;pctx.lineWidth=.5;pctx.moveTo(p.x,p.y);pctx.lineTo(o.x,o.y);pctx.stroke();}
    });
    pctx.beginPath();pctx.arc(p.x,p.y,p.r,0,Math.PI*2);pctx.fillStyle=`${p.color},${op})`;pctx.fill();
  });
}
renderParticles();
window.addEventListener('resize',()=>{pcanvas.width=window.innerWidth;pcanvas.height=window.innerHeight});

// ═══════════════════════════════════
// THREE.JS SOLAR SYSTEM
// ═══════════════════════════════════
let solarRunning = false;
function initSolar() {
  if (solarRunning || typeof THREE === 'undefined') return;
  solarRunning = true;
  const canvas = document.getElementById('solar-canvas');
  const W = canvas.offsetWidth, H = canvas.offsetHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 1000);
  camera.position.set(0, 55, 125);
  camera.lookAt(0,0,0);
  const solarSystem = new THREE.Group();
  scene.add(solarSystem);

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x000000, 0);

  // Lighting
  scene.add(new THREE.AmbientLight(0x111133, 1));
  const sunLight = new THREE.PointLight(0xffd080, 3, 300);
  scene.add(sunLight);

  // Stars
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(3000*3);
  for(let i=0;i<3000;i++){sp[i*3]=(Math.random()-.5)*700;sp[i*3+1]=(Math.random()-.5)*700;sp[i*3+2]=(Math.random()-.5)*700;}
  sg.setAttribute('position', new THREE.BufferAttribute(sp,3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xaabbdd,size:.8,transparent:true,opacity:.7})));

  // Sun
  const sunMat = new THREE.MeshStandardMaterial({color:0xffcc44,emissive:new THREE.Color(0xff8800),emissiveIntensity:.8,roughness:.3});
  const sun = new THREE.Mesh(new THREE.SphereGeometry(8,32,32), sunMat);
  solarSystem.add(sun);

  // Sun glow via sprite-like outer sphere
  const glowMat = new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:.15,side:THREE.BackSide});
  solarSystem.add(new THREE.Mesh(new THREE.SphereGeometry(11,32,32), glowMat));

  // Planets
  const planetData = [
    {r:1.5,orbit:18,speed:2.4,color:0x8899aa,angle:0},
    {r:2.2,orbit:26,speed:1.6,color:0xe8c87a,angle:.8},
    {r:2.5,orbit:35,speed:1.0,color:0x2244aa,angle:1.6},
    {r:1.8,orbit:44,speed:.7,color:0xcc4422,angle:2.4},
    {r:5.5,orbit:60,speed:.35,color:0xddaa66,rings:true,angle:0.5},
    {r:4.0,orbit:78,speed:.22,color:0x88bbcc,rings:true,angle:1.8},
    {r:2.8,orbit:94,speed:.14,color:0x5599cc,angle:3.1},
  ];

  const planets = planetData.map(pd => {
    const pivot = new THREE.Object3D();
    pivot.rotation.y = pd.angle;
    solarSystem.add(pivot);

    // Orbit ring
    const og = new THREE.RingGeometry(pd.orbit-.1,pd.orbit+.1,96);
    const om = new THREE.MeshBasicMaterial({color:0x00d4ff,transparent:true,opacity:.07,side:THREE.DoubleSide});
    const or = new THREE.Mesh(og,om); or.rotation.x=Math.PI/2;
    solarSystem.add(or);

    const mat = new THREE.MeshStandardMaterial({color:pd.color,roughness:.7,metalness:.2});
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(pd.r,24,24), mat);
    mesh.position.x = pd.orbit;
    pivot.add(mesh);

    if (pd.rings) {
      const rm = new THREE.MeshBasicMaterial({color:0xbbaa88,transparent:true,opacity:.5,side:THREE.DoubleSide});
      const rg = new THREE.RingGeometry(pd.r*1.6,pd.r*2.6,48);
      const rings = new THREE.Mesh(rg,rm); rings.rotation.x=Math.PI*.4;
      mesh.add(rings);
    }
    return {mesh, pivot, speed:pd.speed};
  });

  // Asteroids
  const ag = new THREE.BufferGeometry();
  const ap = new Float32Array(500*3);
  for(let i=0;i<500;i++){const a=Math.random()*Math.PI*2,d=49+Math.random()*8;ap[i*3]=Math.cos(a)*d;ap[i*3+1]=(Math.random()-.5)*3;ap[i*3+2]=Math.sin(a)*d;}
  ag.setAttribute('position',new THREE.BufferAttribute(ap,3));
  const asteroids = new THREE.Points(ag,new THREE.PointsMaterial({color:0x888877,size:.25,transparent:true,opacity:.6}));
  solarSystem.add(asteroids);

  const satellitePivot = new THREE.Object3D();
  solarSystem.add(satellitePivot);
  const satellite = new THREE.Group();
  satellite.position.x = 32;
  const satelliteBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.7,1.1,1.1),
    new THREE.MeshStandardMaterial({color:0xddeeff,metalness:.55,roughness:.35})
  );
  const panelMat = new THREE.MeshBasicMaterial({color:0x00d4ff,transparent:true,opacity:.55});
  const panelL = new THREE.Mesh(new THREE.BoxGeometry(3.4,.08,1.15), panelMat);
  const panelR = panelL.clone();
  panelL.position.x = -2.5;
  panelR.position.x = 2.5;
  satellite.add(satelliteBody,panelL,panelR);
  satellitePivot.add(satellite);

  let mx=0, my=0;
  window.addEventListener('mousemove',e=>{mx=(e.clientX/window.innerWidth-.5)*2;my=(e.clientY/window.innerHeight-.5)*2;});

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    sun.rotation.y = t*.08;
    planets.forEach(p => { p.pivot.rotation.y += p.speed*.005; p.mesh.rotation.y += .01; });
    asteroids.rotation.y = t*.018;
    satellitePivot.rotation.y = t*.75;
    satellitePivot.rotation.z = Math.sin(t*.45)*.18;
    satellite.rotation.y = -t*1.2;
    solarSystem.rotation.x = Math.sin(t*.12)*.035;
    camera.position.x += (mx*10-camera.position.x)*.018;
    camera.position.y += (55-my*8-camera.position.y)*.018;
    camera.lookAt(0,0,0);
    renderer.render(scene,camera);
  }
  animate();

  window.addEventListener('resize',()=>{
    const W=canvas.offsetWidth,H=canvas.offsetHeight;
    camera.aspect=W/H; camera.updateProjectionMatrix();
    renderer.setSize(W,H);
  });
}

// ═══════════════════════════════════
// HERO REVEAL
// ═══════════════════════════════════
function revealHero() {
  initSolar();
  setTimeout(()=>{ document.getElementById('hh1').style.opacity='1'; document.getElementById('hh1').style.transform='translateY(0)'; },500);
  setTimeout(()=>{ document.getElementById('hsub').style.opacity='1'; document.getElementById('hsub').style.transform='translateY(0)'; },800);
  setTimeout(()=>{ document.getElementById('hctas').style.opacity='1'; document.getElementById('hctas').style.transform='translateY(0)'; },1100);
  setTimeout(()=>{ document.getElementById('scrollhint').style.opacity='1'; },1500);
}

// ═══════════════════════════════════
// PAGE SYSTEM
// ═══════════════════════════════════
function showPage(page) {
  playClick();
  document.getElementById('main-site').style.display = 'none';
  document.getElementById('page-login').style.display = 'none';
  document.getElementById('page-signup').style.display = 'none';
  document.getElementById('page-dashboard').style.display = 'none';
  document.getElementById('hero').style.display = 'none';
  document.getElementById('nav').style.display = 'none';

  if (page === 'home') {
    document.getElementById('hero').style.display = 'block';
    document.getElementById('main-site').style.display = 'block';
    document.getElementById('nav').style.display = 'flex';
    window.scrollTo(0,0);
  } else if (page === 'login') {
    const el = document.getElementById('page-login');
    el.style.display = 'flex';
    document.getElementById('nav').style.display = 'flex';
    window.scrollTo(0,0);
  } else if (page === 'signup') {
    const el = document.getElementById('page-signup');
    el.style.display = 'flex';
    document.getElementById('nav').style.display = 'flex';
    window.scrollTo(0,0);
  } else if (page === 'dashboard') {
    document.getElementById('page-dashboard').style.display = 'block';
    initDashboardCharts();
    window.scrollTo(0,0);
  }
}

// ═══════════════════════════════════
// AUTH HANDLERS
// ═══════════════════════════════════
function handleLogin() {
  const btn = document.getElementById('login-btn');
  playClick();
  btn.textContent = '⟳ AUTHENTICATING...';
  btn.style.opacity = '.7';
  btn.disabled = true;
  setTimeout(() => {
    playSuccess();
    btn.textContent = '✓ ACCESS GRANTED';
    btn.style.borderColor = 'rgba(0,255,136,.5)';
    btn.style.color = 'var(--neon)';
    btn.style.background = 'linear-gradient(135deg,rgba(0,255,136,.12),rgba(0,200,100,.18))';
    setTimeout(() => { showPage('dashboard'); btn.textContent='⚡ ACCESS CONTROL CENTER'; btn.disabled=false; btn.style.opacity='1'; }, 1600);
  }, 2000);
}

function handleSignup() {
  const btn = document.getElementById('signup-btn');
  playClick();
  btn.textContent = '⟳ INITIALIZING...';
  btn.style.opacity = '.7';
  btn.disabled = true;
  setTimeout(() => {
    playSuccess();
    btn.textContent = '✓ MISSION ACTIVATED';
    btn.style.borderColor = 'rgba(0,255,136,.5)';
    btn.style.color = 'var(--neon)';
    btn.style.background = 'linear-gradient(135deg,rgba(0,255,136,.12),rgba(0,200,100,.18))';
    setTimeout(() => { showPage('dashboard'); btn.textContent='⚡ LAUNCH ACCOUNT'; btn.disabled=false; btn.style.opacity='1'; }, 1800);
  }, 2200);
}

// Password strength
function updatePwStrength() {
  playTypeKey();
  const pw = document.getElementById('signup-pw').value;
  let score = 0;
  if(pw.length>=8) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['—','WEAK','MODERATE','STRONG','MAXIMUM'];
  const colors = ['rgba(200,220,255,.2)','#ff4444','#ff8c00','#00d4ff','#00ff88'];
  document.getElementById('pw-label').textContent = labels[score];
  document.getElementById('pw-label').style.color = colors[score];
  for(let i=1;i<=4;i++){
    const b=document.getElementById('pb'+i);
    if(i<=score){b.classList.add('on');b.style.background=colors[score];}
    else{b.classList.remove('on');b.style.background='rgba(255,255,255,.06)';}
  }
}

// ═══════════════════════════════════
// CHARTS
// ═══════════════════════════════════
function buildWeeklyBars() {
  const data=[{d:'MON',v:42},{d:'TUE',v:38},{d:'WED',v:51},{d:'THU',v:47},{d:'FRI',v:63},{d:'SAT',v:72},{d:'SUN',v:58}];
  const max=72;
  const barsEl=document.getElementById('weekly-bars');
  const daysEl=document.getElementById('weekly-days');
  if(!barsEl) return;
  barsEl.innerHTML=''; daysEl.innerHTML='';
  data.forEach(d=>{
    const b=document.createElement('div');
    b.className='chart-bar';
    b.style.cssText=`flex:1;height:0;background:linear-gradient(180deg,rgba(0,212,255,.8),rgba(0,100,200,.4));border-radius:3px 3px 0 0;box-shadow:0 0 8px rgba(0,212,255,.3);transition:height .9s ease`;
    b.setAttribute('data-val',d.v+'kWh');
    barsEl.appendChild(b);
    setTimeout(()=>b.style.height=((d.v/max)*100)+'%', 200);
    const di=document.createElement('div'); di.className='chart-day-item';
    di.style.cssText='font-family:var(--font-d);font-size:7px;letter-spacing:.08em;color:rgba(200,220,255,.3);text-align:center;margin-top:5px';
    di.textContent=d.d; daysEl.appendChild(di);
  });
}

function buildMiniPie(canvasId) {
  const c=document.getElementById(canvasId); if(!c) return;
  const ctx=c.getContext('2d');
  const W=c.offsetWidth||200, H=80;
  c.width=W*2; c.height=H*2; ctx.scale(2,2);
  const cx=W/2, cy=H/2, r=Math.min(cx,cy)-8;
  const segs=[{v:.38,c:'#00d4ff'},{v:.45,c:'#00ff88'},{v:.17,c:'#7b2fff'}];
  let start=-Math.PI/2;
  segs.forEach(s=>{
    const end=start+s.v*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath();
    ctx.fillStyle=s.c; ctx.shadowColor=s.c; ctx.shadowBlur=8; ctx.fill();
    start=end;
  });
  ctx.beginPath(); ctx.arc(cx,cy,r*.55,0,Math.PI*2);
  ctx.fillStyle='rgba(4,13,26,1)'; ctx.shadowBlur=0; ctx.fill();
}

function buildFullAreaChart() {
  const el=document.getElementById('full-area-chart'); if(!el) return;
  const prod=[0,.2,4.8,8.2,12.4,11.8,9.2,4.1,.8,0,0];
  const cons=[2.1,1.8,3.2,4.1,5.2,6.1,5.8,7.2,6.8,3.9,2.4];
  const max=13;
  el.innerHTML='';
  prod.forEach((p,i)=>{
    const grp=document.createElement('div');
    grp.style.cssText='flex:1;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-end;gap:2px;height:100%';
    const pb=document.createElement('div');
    pb.style.cssText=`height:0;background:linear-gradient(180deg,rgba(255,140,0,.7),rgba(255,140,0,.2));border-radius:2px 2px 0 0;box-shadow:0 0 6px rgba(255,140,0,.3);transition:height .8s ease`;
    const cb=document.createElement('div');
    cb.style.cssText=`height:0;background:linear-gradient(180deg,rgba(0,212,255,.6),rgba(0,212,255,.15));border-radius:2px 2px 0 0;box-shadow:0 0 6px rgba(0,212,255,.2);transition:height .9s ease`;
    grp.appendChild(pb); grp.appendChild(cb); el.appendChild(grp);
    setTimeout(()=>{pb.style.height=((p/max)*50)+'%';cb.style.height=((cons[i]/max)*50)+'%';},300+i*40);
  });
}

function buildFullPie() {
  buildMiniPie('full-pie');
}

function initDashboardCharts() {
  setTimeout(() => {
    buildWeeklyBars();
    buildMiniPie('mini-pie');
    buildMiniPie('full-pie');
    buildFullAreaChart();
  }, 200);
}

// ═══════════════════════════════════
// SCROLL NAV + REVEALS
// ═══════════════════════════════════
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (nav) { if(window.scrollY>60) nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); }
  document.querySelectorAll('.stat-card,.feat-card,.sol-item,.testi-card,.fade-up').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add('vis');
      // Animate feature bars
      el.querySelectorAll('.feat-bar-fill').forEach(bar => {
        bar.style.width = bar.getAttribute('data-w');
      });
    }
  });
});

// ═══════════════════════════════════
// LIVE UPDATES
// ═══════════════════════════════════
let liveKw = 9.4;
setInterval(() => {
  liveKw = Math.max(8.2, Math.min(10.8, liveKw + (Math.random()-.5)*.4));
  const val = liveKw.toFixed(1);
  ['live-kw','full-kw','dash-kw','fd-kw'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = id === 'live-kw' ? val+' kW' : val+'<span style="font-size:10px">kW</span>';
  });
  const clock = document.getElementById('full-clock');
  if (clock) {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }
}, 1000);

// ═══════════════════════════════════
// INIT
// ═══════════════════════════════════
// Init main site reveals when scrolled in later
document.addEventListener('DOMContentLoaded', () => {
  // The loading screen will handle page reveal
});
