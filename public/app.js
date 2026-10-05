
(()=>{
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   1. Particle field: one cloud that re-forms per page
   ========================================================= */
const Field = (()=>{
  const canvas = document.getElementById('field');
  let ok = !!window.THREE;
  try{ if(ok){ const t=document.createElement('canvas'); ok = !!(t.getContext('webgl')||t.getContext('experimental-webgl')); } }catch(e){ ok=false; }
  if(!ok){ document.documentElement.classList.add('nogl'); canvas.style.background='radial-gradient(60% 50% at 70% 30%,#d62bff33,transparent),radial-gradient(50% 50% at 20% 80%,#ff3d1f33,transparent)'; return {to(){},}; }
  const small = innerWidth < 760;
  const N = small ? 3800 : 8000;
  const renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
  cam.position.set(0,0,90);
  const pos = new Float32Array(N*3), tgt = new Float32Array(N*3), col = new Float32Array(N*3), seed = new Float32Array(N);
  const palette = [new THREE.Color('#dfe6ec'),new THREE.Color('#e8b86b'),new THREE.Color('#2ec4b6'),new THREE.Color('#c8734a')];
  for(let i=0;i<N;i++){ pos[i*3]=(Math.random()-.5)*300; pos[i*3+1]=(Math.random()-.5)*200; pos[i*3+2]=(Math.random()-.5)*200; seed[i]=Math.random(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed,1));
  const mat = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
    uniforms:{uTime:{value:0}, uSize:{value: small?3.4:3.0}, uPR:{value:renderer.getPixelRatio()}},
    vertexShader:`attribute float seed; varying vec3 vC; varying float vA; uniform float uTime,uSize,uPR;
      void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv;
      float tw=.65+.35*sin(uTime*2.+seed*40.); vA=tw; gl_PointSize=uSize*uPR*(70./-mv.z)*(.7+seed*.8); }`,
    fragmentShader:`varying vec3 vC; varying float vA; void main(){ vec2 p=gl_PointCoord-.5; float d=length(p); if(d>.5) discard;
      float g=smoothstep(.5,0.,d); gl_FragColor=vec4(vC*1.25, min(1.,g)*vA*.85); }`
  });
  const pts = new THREE.Points(geo, mat); scene.add(pts);

  function colorize(mode){
    // mostly silver, with teal, gold and copper flecks
    for(let i=0;i<N;i++){
      const r=seed[i]; let c=palette[0];
      if(r>.6) c=palette[2]; if(r>.8) c=palette[1]; if(r>.95) c=palette[3];
      const dim=r<.6 ? .45+r*.7 : 1;
      col[i*3]=c.r*dim; col[i*3+1]=c.g*dim; col[i*3+2]=c.b*dim;
    }
    geo.attributes.color.needsUpdate=true;
  }
  /* shape generators */
  const shapes = {
    text(){
      const fam='"Anybody","Arial Black",sans-serif', fs=small?190:200, lines=small?['NUWAN','SAYURU']:['NUWAN SAYURU'];
      const m=document.createElement('canvas').getContext('2d'); m.font=`900 ${fs}px ${fam}`;
      const tw=Math.max(...lines.map(l=>m.measureText(l).width)), w=Math.ceil(tw)+80, lh=fs*1.02, h=Math.ceil(lh*lines.length)+60;
      const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
      x.font=`900 ${fs}px ${fam}`; x.fillStyle='#fff'; x.textAlign='center'; x.textBaseline='middle';
      lines.forEach((l,i)=>x.fillText(l,w/2,30+lh*(i+.5)));
      const d=x.getImageData(0,0,w,h).data, cand=[];
      for(let yy=0;yy<h;yy+=3)for(let xx=0;xx<w;xx+=3) if(d[(yy*w+xx)*4+3]>128) cand.push([xx,yy]);
      const visW=2*Math.tan(25*Math.PI/180)*90*(innerWidth/innerHeight), sc=(visW*(small?.84:.8))/tw;
      for(let i=0;i<N;i++){ const p=cand[(Math.random()*cand.length)|0]||[w/2,h/2];
        tgt[i*3]=(p[0]-w/2)*sc+(Math.random()-.5)*.3; tgt[i*3+1]=-(p[1]-h/2)*sc+(small?9:11)+(Math.random()-.5)*.3; tgt[i*3+2]=(Math.random()-.5)*4; }
      return 'text';
    },
    sphere(){ const R=small?24:30; for(let i=0;i<N;i++){ const u=Math.random()*2-1, th=Math.random()*Math.PI*2, r=R*(i%6===0?1.35:1);
      const s=Math.sqrt(1-u*u); tgt[i*3]=r*s*Math.cos(th)+(small?0:30); tgt[i*3+1]=r*u+(small?10:4); tgt[i*3+2]=r*s*Math.sin(th);} return 'radial'; },
    lattice(){ const n=Math.round(Math.cbrt(N)), g=small?2.6:3.2, o=(n-1)*g/2; for(let i=0;i<N;i++){ const a=i%n,b=Math.floor(i/n)%n,c=Math.floor(i/(n*n))%n;
      tgt[i*3]=a*g-o+(small?0:24); tgt[i*3+1]=b*g-o; tgt[i*3+2]=c*g-o;} return 'radial'; },
    knot(){ const p=2,q=3,R=small?14:18,r=small?5.5:7; for(let i=0;i<N;i++){ const t=i/N*Math.PI*2*1, ph=Math.random()*Math.PI*2;
      const cx=(R+r*Math.cos(q*t))*Math.cos(p*t), cy=(R+r*Math.cos(q*t))*Math.sin(p*t), cz=r*Math.sin(q*t);
      const tube=2.2*Math.sqrt(Math.random()); tgt[i*3]=cx+tube*Math.cos(ph)+(small?0:24); tgt[i*3+1]=cy+tube*Math.sin(ph); tgt[i*3+2]=cz+tube*Math.cos(ph*1.3);} return 'radial'; },
    ring(){ for(let i=0;i<N;i++){ const a=Math.random()*Math.PI*2, band=Math.random(); const r=(small?18:24)+band*(small?10:14)+Math.sin(a*6)*1.5;
      tgt[i*3]=Math.cos(a)*r+(small?0:24); tgt[i*3+1]=Math.sin(a)*r*.9; tgt[i*3+2]=(Math.random()-.5)*6;} return 'radial'; },
    wave(){ const cols=Math.round(Math.sqrt(N*2)), rows=Math.ceil(N/cols), gx=small?.9:1.4, gz=small?1.4:1.8; for(let i=0;i<N;i++){ const a=i%cols,b=Math.floor(i/cols);
      tgt[i*3]=(a-cols/2)*gx; tgt[i*3+2]=(b-rows/2)*gz; tgt[i*3+1]=-14;} return 'wave'; }
  };
  let mode='radial', shape='sphere', t0=performance.now();
  const mouse=new THREE.Vector2(0,0), mw=new THREE.Vector3(999,999,0); let rotY=0, burst=0;
  function to(name){ if(!shapes[name]) name='sphere'; shape=name; mode=shapes[name](); colorize(mode==='text'?'text':'radial'); if(reduce){ pos.set(tgt); geo.attributes.position.needsUpdate=true; } }
  function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix(); }
  addEventListener('resize',()=>{resize(); clearTimeout(window.__rt); window.__rt=setTimeout(()=>to(shape),200);}); resize();
  addEventListener('pointermove',e=>{ mouse.x=e.clientX/innerWidth*2-1; mouse.y=-(e.clientY/innerHeight)*2+1;
    mw.set(mouse.x,mouse.y,.5).unproject(cam); const dir=mw.sub(cam.position).normalize(); const dist=-cam.position.z/dir.z; mw.copy(cam.position).add(dir.multiplyScalar(dist)); });
  addEventListener('pointerdown',e=>{ if(e.target===document.body||e.target.closest('.hero')) burst=1; });
  let scrollY=0; addEventListener('scroll',()=>{scrollY=window.scrollY},{passive:true});
  function loop(now){
    const t=(now-t0)/1000; mat.uniforms.uTime.value=t;
    const ease = burst>0 ? .02 : .06; burst*=.96; if(burst<.01) burst=0;
    for(let i=0;i<N;i++){
      const j=i*3; let tx=tgt[j], ty=tgt[j+1], tz=tgt[j+2];
      if(mode==='wave'){ ty=-14+Math.sin(tx*.18+t*1.4)*2.4+Math.cos(tz*.22+t)*2.2; }
      const n=Math.sin(t*.8+seed[i]*30)*.35; tx+=n; ty+=Math.cos(t*.7+seed[i]*20)*.35;
      if(burst>0){ tx+= (seed[i]-.5)*160*burst; ty+=(Math.sin(seed[i]*99)-.0)*90*burst; tz+=(Math.cos(seed[i]*77))*120*burst; }
      pos[j]+=(tx-pos[j])*ease; pos[j+1]+=(ty-pos[j+1])*ease; pos[j+2]+=(tz-pos[j+2])*ease;
      const dx=pos[j]-mw.x, dy=pos[j+1]-mw.y, d2=dx*dx+dy*dy;
      if(d2<90){ const f=(90-d2)/90*1.6; pos[j]+=dx*f*.08; pos[j+1]+=dy*f*.08; pos[j+2]+=f*.6; }
    }
    geo.attributes.position.needsUpdate=true;
    rotY += mode==='text' ? 0 : .0025;
    pts.rotation.y = mode==='text' ? Math.sin(t*.3)*.08 + mouse.x*.12 : rotY + mouse.x*.2;
    pts.rotation.x = mode==='wave' ? .35 : mouse.y*.12;
    pts.position.y = scrollY*0.02;
    pts.material.opacity = 1;
    renderer.render(scene,cam);
    if(!reduce) requestAnimationFrame(loop);
  }
  const start=()=>{ to(shape); if(reduce) loop(performance.now()); else requestAnimationFrame(loop); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  return {to, burst(){burst=1}, get shape(){return shape}};
})();

/* =========================================================
   2. Interaction: magnetic buttons, card tilt, route transition, reveals
   ========================================================= */
addEventListener('pointermove',e=>{
  if(reduce||e.pointerType!=='mouse') return;
  const cx=e.clientX, cy=e.clientY;
  const mb=e.target.closest&&e.target.closest('.btn'); document.querySelectorAll('.btn').forEach(b=>{ if(b!==mb) b.style.transform=''; });
  if(mb){const r=mb.getBoundingClientRect();mb.style.transform=`translate(${(cx-r.left-r.width/2)*.15}px,${(cy-r.top-r.height/2)*.25}px)`;}
  const card=e.target.closest&&e.target.closest('.dom'); if(card){const r=card.getBoundingClientRect(),px=(cx-r.left)/r.width,py=(cy-r.top)/r.height;
    card.style.setProperty('--mx',px*100+'%');card.style.setProperty('--my',py*100+'%');card.style.transform=`perspective(900px) rotateX(${(.5-py)*7}deg) rotateY(${(px-.5)*9}deg)`;}
});
addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; const hn=document.getElementById('heroName'); if(hn&&!reduce){ hn.style.setProperty('--ry',((e.clientX/innerWidth-.5)*10).toFixed(2)+'deg'); hn.style.setProperty('--rx',((.5-e.clientY/innerHeight)*8).toFixed(2)+'deg'); hn.querySelectorAll('.l').forEach(l=>{ const r=l.getBoundingClientRect(), d=Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2)); l.style.setProperty('--lift',(d<220?-(1-d/220)*18:0).toFixed(1)+'px'); }); } const sp=document.getElementById('spot'); if(sp){ sp.style.setProperty('--sx',e.clientX+'px'); sp.style.setProperty('--sy',e.clientY+'px'); } },{passive:true});
document.addEventListener('pointerout',e=>{const c=e.target.closest&&e.target.closest('.dom'); if(c&&!c.contains(e.relatedTarget)) c.style.transform='';});

/* Route transition: a packet is routed hop by hop across a mesh, then the new page loads at its destination */
const Route=(()=>{
  const cv=document.getElementById('route'), tag=document.getElementById('routetag'), x=cv.getContext('2d');
  let W,H,nodes=[],edges=[];
  function build(){
    const d=Math.min(devicePixelRatio,2); W=innerWidth; H=innerHeight; cv.width=W*d; cv.height=H*d; x.setTransform(d,0,0,d,0,0);
    nodes=[]; const cols=W<700?4:7, rows=W<700?6:4;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) nodes.push({x:(c+.5)/cols*W+(Math.random()-.5)*W/cols*.55, y:(r+.5)/rows*H+(Math.random()-.5)*H/rows*.5, c, r});
    edges=[]; nodes.forEach((a,i)=>nodes.forEach((b,j)=>{ if(j<=i) return; const dc=Math.abs(a.c-b.c), dr=Math.abs(a.r-b.r); if(dc+dr===1||(dc===1&&dr===1&&Math.random()<.35)) edges.push([i,j]); }));
  }
  function path(from,to){ // BFS over the mesh
    const adj=nodes.map(()=>[]); edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a)});
    const prev=Array(nodes.length).fill(-1), q=[from], seen=new Set([from]);
    while(q.length){const v=q.shift(); if(v===to) break; for(const w of adj[v].sort(()=>Math.random()-.5)) if(!seen.has(w)){seen.add(w);prev[w]=v;q.push(w);}}
    const p=[]; for(let v=to;v!==-1;v=prev[v]) p.unshift(v); return p;
  }
  function run(fromName,toName,swap){
    if(reduce){ swap(); return; }
    build(); const cols=W<700?4:7, rows=W<700?6:4;
    const start=nodes.findIndex(n=>n.c===0&&n.r===Math.floor(Math.random()*rows)), end=nodes.findIndex(n=>n.c===cols-1&&n.r===Math.floor(Math.random()*rows));
    const p=path(start<0?0:start,end<0?nodes.length-1:end); const hops=p.length-1;
    tag.replaceChildren('route ',Object.assign(document.createElement('b'),{textContent:'/'+fromName}),' → ',Object.assign(document.createElement('b'),{textContent:'/'+toName}),` · ${hops} hops`); tag.classList.add('on'); cv.classList.add('on');
    const t0=performance.now(), dur=760; let swapped=false;
    const segLen=[]; let total=0; for(let i=1;i<p.length;i++){const a=nodes[p[i-1]],b=nodes[p[i]];const l=Math.hypot(b.x-a.x,b.y-a.y);segLen.push(l);total+=l;}
    const at=t=>{let d=t*total;for(let i=0;i<segLen.length;i++){if(d<=segLen[i]){const a=nodes[p[i]],b=nodes[p[i+1]],f=d/segLen[i];return [a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,i];}d-=segLen[i];}const z=nodes[p[p.length-1]];return [z.x,z.y,segLen.length];};
    const clouds=Array.from({length:W<700?5:9},()=>({x:Math.random()*W,y:Math.random()*H,s:40+Math.random()*90,v:(Math.random()*.4+.15)*(Math.random()<.5?-1:1),a:.05+Math.random()*.08}));
    const cloudShape=(cx,cy,s)=>{x.beginPath();x.arc(cx-s*.45,cy+s*.08,s*.32,0,7);x.arc(cx-s*.1,cy-s*.18,s*.42,0,7);x.arc(cx+s*.35,cy-s*.02,s*.34,0,7);x.arc(cx+s*.05,cy+s*.16,s*.36,0,7);};
    const grad=x.createLinearGradient(0,0,W,0); grad.addColorStop(0,'#f4f2ee'); grad.addColorStop(.6,'#e8b86b'); grad.addColorStop(1,'#e8b86b');
    function frame(now){
      const k=Math.min(1,(now-t0)/dur), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      x.clearRect(0,0,W,H); x.fillStyle='rgba(0,0,0,.82)'; x.fillRect(0,0,W,H);
      clouds.forEach(c=>{ const cx=c.x+c.v*(now-t0)*.06; const g=x.createRadialGradient(cx,c.y,0,cx,c.y,c.s); g.addColorStop(0,`rgba(46,196,182,${c.a})`); g.addColorStop(1,'rgba(46,196,182,0)'); x.fillStyle=g; cloudShape(cx,c.y,c.s); x.fill(); });
      x.lineWidth=1; x.strokeStyle='rgba(255,244,234,.10)'; x.beginPath(); edges.forEach(([a,b])=>{x.moveTo(nodes[a].x,nodes[a].y);x.lineTo(nodes[b].x,nodes[b].y)}); x.stroke();
      const [px,py,seg]=at(e);
      x.lineWidth=2.5; x.strokeStyle=grad; x.shadowColor='#e8b86b'; x.shadowBlur=14; x.beginPath(); x.moveTo(nodes[p[0]].x,nodes[p[0]].y);
      for(let i=1;i<=seg&&i<p.length;i++) x.lineTo(nodes[p[i]].x,nodes[p[i]].y); x.lineTo(px,py); x.stroke(); x.shadowBlur=0;
      nodes.forEach((n,i)=>{const hit=p.indexOf(i); const lit=hit>-1&&hit<=seg; x.fillStyle=lit?'#e8b86b':'rgba(244,242,238,.3)'; x.beginPath(); x.arc(n.x,n.y,lit?4:2.2,0,7); x.fill();
        if(lit&&hit===seg){x.strokeStyle='rgba(232,184,107,.6)';x.beginPath();x.arc(n.x,n.y,10,0,7);x.stroke();}});
      for(let q=1;q<=3;q++){ const [qx,qy]=at(Math.max(0,e-q*.045)); x.fillStyle=`rgba(232,184,107,${.55-q*.15})`; x.beginPath(); x.arc(qx,qy,4-q*.7,0,7); x.fill(); }
      x.fillStyle='#fff'; x.shadowColor='#e8b86b'; x.shadowBlur=24; x.beginPath(); x.arc(px,py,5,0,7); x.fill(); x.shadowBlur=0;
      const a0=nodes[p[0]], z0=nodes[p[p.length-1]];
      x.strokeStyle='#f4f2ee'; x.lineWidth=1.6; x.strokeRect(a0.x-9,a0.y-7,18,14); x.fillStyle='#e8b86b'; x.fillRect(a0.x-5,a0.y-2,3,4); x.fillRect(a0.x+1,a0.y-2,3,4);
      x.save(); x.shadowColor='#2ec4b6'; x.shadowBlur=22+18*e; x.strokeStyle='#a9efe7'; x.lineWidth=2.2; cloudShape(z0.x,z0.y-4,26+6*e); x.stroke(); x.restore();
      x.font='600 11px "JetBrains Mono",monospace'; x.fillStyle='rgba(255,244,234,.7)'; x.fillText('edge',a0.x-14,a0.y+24); x.fillText('cloud',z0.x-16,z0.y+30);
      if(k>=1&&!swapped){ swapped=true; swap();
        const z=nodes[p[p.length-1]], r0=performance.now();
        (function ring(n){const q=Math.min(1,(n-r0)/420); x.clearRect(0,0,W,H); x.fillStyle=`rgba(0,0,0,${.82*(1-q)})`; x.fillRect(0,0,W,H);
          x.strokeStyle=`rgba(232,184,107,${1-q})`; x.lineWidth=3; x.beginPath(); x.arc(z.x,z.y,q*Math.hypot(W,H),0,7); x.stroke();
          if(q<1) requestAnimationFrame(ring); else { cv.classList.remove('on'); tag.classList.remove('on'); x.clearRect(0,0,W,H); } })(r0);
        return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  return {run};
})();

/* scramble text effect */
function scramble(el){ if(!el||reduce) return; const final=el.dataset.text||el.textContent; el.dataset.text=final; const glyphs='!<>-_\\/[]{}=+*^?#01';
  let f=0; const total=22; const tick=()=>{ el.textContent=final.split('').map((ch,i)=>{ if(ch===' ') return ' '; return i < f/total*final.length ? ch : glyphs[(Math.random()*glyphs.length)|0]; }).join(''); f++; if(f<=total) requestAnimationFrame(tick); else el.textContent=final; }; tick(); }

/* reveal: elements below the fold soften in as they arrive; anything already on screen stays put */
const revIO = ('IntersectionObserver' in window && !reduce) ? new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.remove('pre'); revIO.unobserve(e.target); } }),{rootMargin:'0px 0px -8% 0px'}) : null;
function reveals(){ if(!revIO) return; document.querySelectorAll('main .glass, main .h2, main .marq').forEach((el,i)=>{ if(el.classList.contains('rv')) return; el.classList.add('rv');
  const r=el.getBoundingClientRect(); if(r.top>innerHeight*.92){ el.classList.add('pre'); el.style.transitionDelay=(i%4)*60+'ms'; revIO.observe(el); } }); }

/* count-up for stat tiles */
function countUp(){ if(reduce) return; document.querySelectorAll('.stat b').forEach(b=>{ const m=b.textContent.match(/^(\d+)(.*)$/); if(!m||b.dataset.done) return; b.dataset.done=1; const to=+m[1], suf=m[2], t0=performance.now();
  const step=t=>{const k=Math.min(1,(t-t0)/1500); b.textContent=Math.round(to*(1-Math.pow(1-k,3)))+suf; if(k<1) requestAnimationFrame(step);}; requestAnimationFrame(step); }); }

/* =========================================================
   3. API (Cloudflare Pages Functions). Falls back to preview mode when absent.
   ========================================================= */
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
function merge(a,b){ if(!b||typeof b!=='object') return a; const o=Array.isArray(a)?[...a]:{...a}; for(const k in b){ o[k]=(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a&&typeof a[k]==='object')?merge(a[k],b[k]):b[k]; } return o; }
async function api(path,opt={}){ const tok=store.get('ns-admin',null); const h={...(opt.headers||{})};
  if(opt.json!==undefined){h['content-type']='application/json'; opt.body=JSON.stringify(opt.json);} if(tok) h.authorization='Bearer '+tok;
  const r=await fetch('/api/'+path,{method:opt.method||'GET',headers:h,body:opt.body}); let d=null; try{d=await r.json()}catch(e){}
  if(!r.ok) throw new Error((d&&d.error)||('HTTP '+r.status)); return d; }
const backend={ok:false};

/* =========================================================
   4. Vue app
   ========================================================= */
const {createApp, reactive, nextTick} = Vue;
const S = window.SITE;
const ROUTES = {home:'sphere', work:'sphere', code:'lattice', play:'knot', endorse:'ring', contact:'wave'};
const state = reactive({kind:'Job opportunity', route:'home', content: JSON.parse(JSON.stringify(window.CONTENT_DEFAULT)), repos: [], live:false, menu:false, term:false, backend:false});

async function loadContent(){
  try{ const d=await api('content'); state.backend=backend.ok=true; if(d&&d.data) state.content=merge(state.content,d.data); }catch(e){ state.backend=false; }
}
async function loadRepos(){
  const want=state.content.repos||[];
  try{ const r=await fetch(`https://api.github.com/users/${S.github}/repos?per_page=100&sort=pushed`); if(!r.ok) throw 0; const all=await r.json();
    state.repos = want.map(n=>all.find(x=>x.name===n)).filter(Boolean).map(x=>({name:x.name,description:x.description||'',language:x.language||'',stars:x.stargazers_count,url:x.html_url,license:x.license&&x.license.spdx_id}));
    state.live=true;
  }catch(e){ state.repos = window.REPO_SNAPSHOT.filter(x=>want.includes(x.name)).map(x=>({...x,url:`https://github.com/${S.github}/${x.name}`})); }
}
const NAMES={'SSS_Project_God-s-EYE':"God's Eye: malware detection",'God-s-EYE':"God's Eye: phishing detector",'securepy':'SecurePy','Multi-Factor-Authentication-Report':'Multi-factor authentication report','TeamsProWeb':'TeamsPro Web','PishCatcher':'PishCatcher'};
const pretty = n => NAMES[n] || n.replace(/[-_]/g,' ');
const langColor = l => ({'JavaScript':'#e8b86b','Python':'#cfcac2','Jupyter Notebook':'#e0703a','HTML':'#8f8a84'})[l]||'#8f8a84';

const Nav = {
  props:['route'],
  template:`<div class="scrim" v-if="$root.s.menu" @click="$root.s.menu=false"></div><header class="top"><div class="wrap">
    <a class="logo" href="#home" @click="$root.go('home',$event)"><b>NS</b>NUWAN SAYURU</a>
    <nav class="links glass" id="sitenav" :class="{open:$root.s.menu}" aria-label="Pages">
      <a v-for="r in items" :key="r[0]" :href="'#'+r[0]" :class="{on:route===r[0]}" :aria-current="route===r[0]?'page':null" @click="$root.go(r[0],$event)">{{r[1]}}</a>
    </nav>
    <div style="display:flex;gap:8px;align-items:center">
      <a class="cvbtn" href="#contact" @click="$root.go('contact',$event,'cv')">Get CV</a>
      <button class="menu" type="button" :aria-expanded="$root.s.menu" aria-controls="sitenav" @click="$root.s.menu=!$root.s.menu"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>{{$root.s.menu?'Close':'Menu'}}</button>
    </div></div></header>`,
  data(){return{items:[['home','Home'],['work','Work'],['code','Code'],['play','Play'],['endorse','Endorse'],['contact','Contact']]}}
};

const TOPOS=[
  {n:[[60,40],[18,14],[102,14],[18,66],[102,66]],l:[[0,1],[0,2],[0,3],[0,4]]},
  {n:[[20,40],[60,14],[60,66],[100,40]],l:[[0,1],[0,2],[1,3],[2,3],[1,2]]},
  {n:[[14,40],[50,16],[50,64],[86,16],[86,64],[108,40]],l:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[1,4]]},
  {n:[[16,40],[56,40],[96,14],[96,40],[96,66]],l:[[0,1],[1,2],[1,3],[1,4]]},
  {n:[[60,14],[22,60],[98,60]],l:[[0,1],[1,2],[2,0]]},
  {n:[[20,20],[20,60],[60,40],[100,20],[100,60]],l:[[0,2],[1,2],[2,3],[2,4]]}
];
const Topo = { props:['i'], template:`<svg class="topo" viewBox="0 0 120 80" aria-hidden="true">
  <line v-for="(l,k) in t.l" :key="'l'+k" :x1="t.n[l[0]][0]" :y1="t.n[l[0]][1]" :x2="t.n[l[1]][0]" :y2="t.n[l[1]][1]"/>
  <line v-for="(l,k) in t.l" :key="'f'+k" class="flow" :class="{b:k%2}" :x1="t.n[l[0]][0]" :y1="t.n[l[0]][1]" :x2="t.n[l[1]][0]" :y2="t.n[l[1]][1]" :style="{animationDelay:(-k*.5)+'s'}"/>
  <circle v-for="(n,k) in t.n" :key="'n'+k" :cx="n[0]" :cy="n[1]" :r="k===0?4.5:3.5" :class="{hub:k===0}"/></svg>`,
  computed:{t(){return TOPOS[this.i%TOPOS.length]}} };

const Home = {
  components:{Topo},
  template:`<div>
  <section class="hero">
    <div class="horizon" aria-hidden="true"><i></i><b></b></div>
    <div class="wrap">
      <div class="hudline" aria-hidden="true"><span>Datacom · Security · Data centre · Storage · GPON · Video</span><span>06.93° N · 79.86° E · Colombo</span></div>
      <h1 class="name" aria-label="Nuwan Sayuru" id="heroName"><span class="row" v-for="(w,wi) in ['NUWAN','SAYURU']" :key="w" :class="'r'+wi" aria-hidden="true"><span class="l" v-for="(ch,ci) in w" :key="ci" :data-c="ch" :style="{'--d':(0.25+(wi*5+ci)*0.07).toFixed(3)+'s'}"><b class="f">{{ch}}</b></span></span><i class="signal" aria-hidden="true"></i></h1>
      <div class="hero-foot">
        <p class="lead">{{c.role}}. <b class="shimmer">{{c.intro}}</b></p>
        <div>
          <div class="avail" aria-label="Availability">
            <span v-for="h in c.hud" :key="h.t"><i :style="{background:h.c,boxShadow:'0 0 10px '+h.c}"></i>{{h.t}}</span>
          </div>
          <div class="row">
            <a class="btn hot" href="#work" @click="$root.go('work',$event)">See my work</a>
            <a class="btn line" href="#contact" @click="$root.go('contact',$event)">Start a conversation</a>
          </div>
        </div>
      </div>
      <p class="hint">Click the particles. Press <kbd>~</kbd> for a terminal.</p>
    </div>
  </section>
  <section class="wrap">
    <div class="stats glass"><div class="stat" v-for="s in c.stats" :key="s.l"><b class="grad">{{s.v}}</b><span>{{s.l}}</span></div></div>
    <p class="note" v-if="c.statsNote">{{c.statsNote}}</p>
  </section>
  <section class="wrap block">
    <h2 class="h2" data-scr>What I do</h2>
    <p>The full delivery cycle, from the first proof of concept to support after go-live.</p>
    <div class="svc"><div class="glass" v-for="(s,i) in c.services" :key="s.t"><span class="ix">{{String(i+1).padStart(2,'0')}} / {{String(c.services.length).padStart(2,'0')}}</span><h3>{{s.t}}</h3><p>{{s.d}}</p></div></div>
  </section>
  <section class="wrap block">
    <h2 class="h2" data-scr>Work with me</h2>
    <p>{{c.wwmIntro}}</p>
    <div class="wwm"><article class="glass" v-for="w in c.wwm" :key="w.t" :style="{'--c':w.c}">
      <span class="tag" v-if="w.tag">{{w.tag}}</span><h3>{{w.t}}</h3><p>{{w.d}}</p>
      <a class="go" href="#contact" @click="$root.s.kind=w.kind;$root.go('contact',$event)">{{w.cta}}</a></article></div>
  </section>
  <section class="wrap block">
    <h2 class="h2" data-scr>Across the stack</h2>
    <p>POCs, implementation and support in every layer below, from the access switch to the backup vault.</p>
    <div class="stack">
      <div class="layer" v-for="(g,gi) in c.stack" :key="g.g" :style="{'--c1':g.c,'--c2':g.c}">
        <div class="lh"><span class="ln">{{String(gi+1).padStart(2,'0')}}</span><h3>{{g.g}}</h3><span class="lc">{{g.items.length}} {{g.items.length===1?'area':'areas'}}</span></div>
        <div class="tiles"><article class="dom glass sm" v-for="(d,i) in g.items" :key="d.t" tabindex="0">
          <Topo :i="gi*3+i"/><h4>{{d.t}}</h4><p>{{d.d}}</p><div class="tags"><span v-for="k in d.k" :key="k">{{k}}</span></div></article></div>
      </div>
    </div>
  </section>
  <div class="marq" aria-label="Sectors served"><div><span v-for="(s,i) in [...c.sectors,...c.sectors]" :key="i">{{s}}</span></div></div>
  </div>`,
  computed:{c(){return state.content}}
};

const Work = {
  template:`<div class="wrap page">
    <span class="kicker"><i></i>{{c.basedIn}}</span>
    <h1 class="title" data-scr>Work</h1>
    <p class="sub">Selected contributions, written without customer names.</p>
    <section class="block" style="margin-top:40px">
      <div class="hl"><details class="glass" v-for="(h,i) in c.highlights" :key="h.t" :open="i===0">
        <summary><span class="n grad">{{h.n}}</span><h3>{{h.t}}<small>{{h.s}}</small></h3><span class="pm" aria-hidden="true">+</span></summary>
        <div class="body">{{h.b}}</div></details></div>
    </section>
    <section class="block"><h2 class="h2" data-scr>Experience</h2>
      <div class="tl"><div class="glass" v-for="e in c.experience" :key="e.t"><time>{{e.when}}</time><div><h3>{{e.t}}</h3><p>{{e.o}}<template v-if="e.d">. {{e.d}}</template></p></div></div></div>
    </section>
    <section class="block"><h2 class="h2" data-scr>Credentials</h2>
      <div class="creds"><div class="cred glass" :class="{star:x.star}" v-for="x in c.credentials" :key="x.big"><small>{{x.sm}}</small><p class="big">{{x.big}}</p><p>{{x.d}}</p></div></div>
    </section>
    <section class="block"><h2 class="h2" data-scr>Sectors</h2>
      <div class="tags" style="margin-top:20px"><span v-for="s in c.sectors" :key="s" style="font-size:15px;padding:8px 16px">{{s}}</span></div>
    </section>
  </div>`,
  computed:{c(){return state.content}}
};

const Code = {
  template:`<div class="wrap page">
    <span class="kicker"><i></i>github.com/{{gh}}</span>
    <h1 class="title" data-scr>Code</h1>
    <p class="sub">Security and machine-learning projects from my degree and after.</p>
    <div class="ghcard glass"><span class="who">@{{gh}}</span><p class="sp">Nuwan Sayuru on GitHub.</p><a class="btn line" :href="'https://github.com/'+gh" target="_blank" rel="noopener">Open GitHub</a></div>
    <div class="repos"><a class="repo glass" v-for="r in repos" :key="r.name" :href="r.url" target="_blank" rel="noopener">
      <h3>{{pretty(r.name)}}</h3><p>{{r.description || 'Open the repository for details.'}}</p>
      <div class="meta"><span v-if="r.language"><i :style="{background:lc(r.language)}"></i>{{r.language}}</span><span v-if="r.license">{{r.license}}</span><span v-if="r.stars">★ {{r.stars}}</span></div></a></div>
    <p class="note">{{live ? 'Live from GitHub.' : 'Showing a saved copy. The hosted site reads GitHub live.'}}</p>
  </div>`,
  computed:{repos(){return state.repos},live(){return state.live},gh(){return S.github}},
  methods:{pretty,lc:langColor}
};

/* ---------- games ---------- */
const Subnet = {
  template:`<div class="game glass">
    <div class="ghead"><h3 class="grad">Subnet Sprint</h3>
      <div class="seg mini-seg" role="group" aria-label="Difficulty"><button type="button" v-for="d in ['Easy','Pro']" :key="d" :aria-pressed="mode===d" :disabled="on" @click="mode=d">{{d}}</button></div></div>
    <p class="rule">60 seconds of subnetting. Streaks multiply your score. Easy uses /24 to /30, Pro uses /8 to /30.</p>
    <div class="hud"><span>Time <b>{{left}}s</b></span><span>Score <b>{{score}}</b></span><span>Streak <b>×{{mult}}</b></span><span>Best <b>{{best[mode]||0}}</b></span></div>
    <div class="tbar" aria-hidden="true"><i :style="{transform:'scaleX('+(left/60)+')'}"></i></div>
    <template v-if="on">
      <div class="q" :class="{flash:flash}">{{q.text}}</div>
      <div class="opts"><button v-for="(o,k) in q.opts" :key="o" type="button" :class="mark(o)" @click="pick(o)"><kbd>{{k+1}}</kbd> {{o}}</button></div>
      <p class="tip" v-if="tip" aria-live="polite">{{tip}}</p>
    </template>
    <div v-else class="idle"><p v-if="played" class="done">Time. {{score}} points, {{right}} of {{asked}} correct{{newBest?' · new best':''}}.</p><p v-else class="rule">Keys 1 to 4 answer. Hints cost 3 seconds.</p></div>
    <div class="gctl">
      <button class="btn hot" type="button" @click="start">{{on?'Restart':played?'Play again':'Start'}}</button>
      <button class="btn line" type="button" :disabled="!on||!!chosen" @click="hint">Hint</button>
      <button class="btn line" type="button" @click="reset">Reset</button>
    </div>
  </div>`,
  data(){return{on:false,played:false,mode:'Easy',left:60,score:0,streak:0,right:0,asked:0,best:store.get('ns-subnet-best2',{}),q:{},chosen:null,timer:null,tip:'',flash:false,newBest:false}},
  computed:{mult(){return Math.min(4,1+Math.floor(this.streak/3))}},
  methods:{
    ip2s(n){return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.')},
    gen(){const lo=this.mode==='Easy'?24:8, p=lo+Math.floor(Math.random()*(31-lo)), oct=[10,172,192,100][Math.floor(Math.random()*4)];
      const ip=((oct*16777216)+Math.floor(Math.random()*16777216))>>>0, mask=(0xFFFFFFFF<<(32-p))>>>0, size=Math.pow(2,32-p);
      const net=(ip&mask)>>>0, bc=(net+size-1)>>>0, hosts=size-2, cidr=`${this.ip2s(ip)}/${p}`;
      const kinds=['net','bc','hosts','mask','first','last'], k=kinds[Math.floor(Math.random()*kinds.length)]; let ans,text,hint,wrong=new Set();
      const bump=v=>this.ip2s((v>>>0));
      if(k==='net'){ans=this.ip2s(net);text=`Network address of ${cidr}?`;[net+size,net-size,net+1,ip].forEach(v=>wrong.add(bump(v)));}
      if(k==='bc'){ans=this.ip2s(bc);text=`Broadcast address of ${cidr}?`;[bc-1,bc+size,net,bc-size].forEach(v=>wrong.add(bump(v)));}
      if(k==='first'){ans=this.ip2s(net+1);text=`First usable host in ${cidr}?`;[net,net+2,bc-1,net+size+1].forEach(v=>wrong.add(bump(v)));}
      if(k==='last'){ans=this.ip2s(bc-1);text=`Last usable host in ${cidr}?`;[bc,bc-2,net+1,bc-size-1].forEach(v=>wrong.add(bump(v)));}
      if(k==='hosts'){ans=hosts.toLocaleString();text=`Usable hosts in a /${p}?`;[size,hosts+2,Math.max(2,size/2-2),size*2-2].forEach(v=>wrong.add(Math.round(v).toLocaleString()));}
      if(k==='mask'){ans=this.ip2s(mask);text=`Subnet mask for /${p}?`;[p-1,p+1,p-2,p+2].forEach(x=>{x=Math.min(32,Math.max(1,x));wrong.add(this.ip2s((0xFFFFFFFF<<(32-x))>>>0));});}
      const octIdx=Math.floor((p-1)/8), blk=Math.pow(2,(8-(p%8))%8||8);
      hint = k==='hosts'||k==='mask' ? `A /${p} leaves ${32-p} host bits: 2^${32-p} = ${size.toLocaleString()} addresses${k==='hosts'?', minus network and broadcast':''}.`
        : `Block size is ${size.toLocaleString()} addresses. In octet ${octIdx+1}, round down to a multiple of ${blk} for the network${k==='net'?'':', then step from there'}.`;
      wrong.delete(ans); const opts=[ans,...[...wrong].slice(0,3)].sort(()=>Math.random()-.5); this.q={text,ans,opts,hint}; this.chosen=null; this.tip=''; this.asked++;},
    start(){this.reset(true);this.on=true;this.played=true;this.gen();this.timer=setInterval(()=>{this.left--;if(this.left<=0) this.end();},1000);},
    end(){clearInterval(this.timer);this.on=false;this.left=0;this.newBest=false;if(this.score>(this.best[this.mode]||0)){this.best={...this.best,[this.mode]:this.score};store.set('ns-subnet-best2',this.best);this.newBest=true;}},
    reset(keep){clearInterval(this.timer);this.on=false;this.left=60;this.score=0;this.streak=0;this.right=0;this.asked=0;this.chosen=null;this.tip='';if(!keep)this.played=false;},
    hint(){if(!this.on||this.tip)return;this.tip=this.q.hint;this.left=Math.max(1,this.left-3);},
    pick(o){if(this.chosen||!this.on)return;this.chosen=o;const ok=o===this.q.ans;
      if(ok){this.streak++;this.right++;this.score+=this.tip?this.mult:2*this.mult;}else{this.streak=0;this.flash=true;setTimeout(()=>this.flash=false,350);}
      setTimeout(()=>this.on&&this.gen(),ok?280:900);},
    mark(o){if(!this.chosen)return'';if(o===this.q.ans)return'right';if(o===this.chosen)return'wrong';return''},
    key(e){if(!this.on||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;const n=+e.key;if(n>=1&&n<=4&&this.q.opts[n-1])this.pick(this.q.opts[n-1]);if(e.key==='h')this.hint();}
  },
  mounted(){this._k=e=>this.key(e);addEventListener('keydown',this._k)},
  unmounted(){clearInterval(this.timer);removeEventListener('keydown',this._k)}
};
const LinkUp = {
  template:`<div class="game glass">
    <div class="ghead"><h3 class="grad">Link Up</h3><span class="lvl">Level {{level}}</span></div>
    <p class="rule">Rotate tiles to bring the link up from the edge router on the left to the cloud on the right.</p>
    <div class="hud"><span>Moves <b>{{moves}}</b></span><span>Par <b>{{par}}</b></span><span>Time <b>{{secs}}s</b></span><span>Hints <b>{{hints}}</b></span></div>
    <div class="board" :class="{won:win}" :style="{gridTemplateColumns:'repeat('+n+',1fr)'}">
      <button v-for="(t,i) in tiles" :key="i" type="button" class="tile" :class="{lit:lit.has(i),src:i===src,dst:i===dst,hinted:hinted===i}" :aria-label="'Tile row '+(Math.floor(i/n)+1)+' column '+(i%n+1)" @click="rot(i)" @contextmenu.prevent="rot(i,-1)">
        <svg viewBox="0 0 40 40" :style="{transform:'rotate('+t.r*90+'deg)'}"><path :d="shapes[t.k]" fill="none" stroke="#5b4a50" stroke-width="6" stroke-linecap="round"/><circle v-if="t.k!=='I'" cx="20" cy="20" r="4" fill="#5b4a50"/></svg>
        <span v-if="i===src" class="cap">EDGE</span><span v-if="i===dst" class="cap">☁</span>
      </button></div>
    <p class="done" aria-live="polite">{{win ? 'Link up in '+moves+' moves · '+'★'.repeat(stars)+'☆'.repeat(3-stars) : 'Right-click rotates backwards.'}}</p>
    <div class="gctl">
      <button class="btn hot" type="button" v-if="win" @click="next">Next level</button>
      <button class="btn line" type="button" :disabled="win" @click="hint">Hint</button>
      <button class="btn line" type="button" @click="reset">Reset level</button>
      <button class="btn line" type="button" @click="newGame">New game</button>
    </div>
  </div>`,
  data(){return{n:4,level:1,moves:0,tiles:[],start:[],sol:[],path:[],src:0,dst:0,win:false,hints:0,hinted:-1,secs:0,timer:null,shapes:{I:'M20 0V40',L:'M20 0V20H40',T:'M0 20H40M20 20V40',X:'M20 0V40M0 20H40'}}},
  computed:{lit(){return this.flow()},par(){return this.sol.reduce((a,r,i)=>a+(r<0?0:(r-this.start[i]+4)%4),0)},stars(){return this.hints?1:this.moves<=this.par+2?3:this.moves<=this.par*2?2:1}},
  methods:{
    base(k){return {I:[0,2],L:[0,1],T:[1,2,3],X:[0,1,2,3]}[k]},
    conns(t){return this.base(t.k).map(d=>(d+t.r)%4)},
    make(){const n=this.n; this.win=false; this.moves=0; this.hints=0; this.hinted=-1; this.secs=0;
      const sr=Math.floor(Math.random()*n), dr=Math.floor(Math.random()*n); this.src=sr*n; this.dst=dr*n+n-1;
      let r=sr,c=0; const path=[[r,c]], seen=new Set([r*n]);
      while(c<n-1){ const opts=[[r,c+1]]; if(r>0&&!seen.has((r-1)*n+c))opts.push([r-1,c]); if(r<n-1&&!seen.has((r+1)*n+c))opts.push([r+1,c]);
        [r,c]=opts[Math.floor(Math.random()*opts.length)]; seen.add(r*n+c); path.push([r,c]); }
      while(r!==dr){ r+= dr>r?1:-1; path.push([r,c]); }
      const need=Array(n*n).fill(null).map(()=>new Set()); need[this.src].add(3); need[this.dst].add(1);
      for(let i=1;i<path.length;i++){const[a,b]=path[i-1],[x,y]=path[i];const A=a*n+b,B=x*n+y;
        if(x<a){need[A].add(0);need[B].add(2);} if(x>a){need[A].add(2);need[B].add(0);} if(y>b){need[A].add(1);need[B].add(3);} if(y<b){need[A].add(3);need[B].add(1);}}
      const shapeFor=st=>{const k=[...st].sort();if(k.length>=4)return'X';if(k.length===3)return'T';const[a,b]=k;return (b-a)===2?'I':'L';};
      this.path=path.map(([a,b])=>a*n+b);
      const tiles=need.map(st=>({k:st.size?shapeFor(st):['I','L','L','T'][Math.floor(Math.random()*4)],r:0}));
      this.sol=tiles.map((t,i)=>{ if(!need[i].size) return -1; for(let q=0;q<4;q++){ const cs=this.base(t.k).map(d=>(d+q)%4); if([...need[i]].every(d=>cs.includes(d))) return q; } return 0; });
      tiles.forEach((t,i)=>{ t.r=Math.floor(Math.random()*4); if(this.sol[i]>=0&&t.r===this.sol[i]&&t.k!=='X') t.r=(t.r+1+Math.floor(Math.random()*2))%4; });
      this.tiles=tiles; this.start=tiles.map(t=>t.r); clearInterval(this.timer); this.timer=setInterval(()=>{ if(!this.win) this.secs++; },1000);
    },
    flow(){const n=this.n,seen=new Set(),t=this.tiles;if(!t.length||!this.conns(t[this.src]).includes(3))return seen;const q=[this.src];seen.add(this.src);
      while(q.length){const i=q.shift();const r=Math.floor(i/n),c=i%n;for(const d of this.conns(t[i])){const nr=r+[-1,0,1,0][d],nc=c+[0,1,0,-1][d];if(nr<0||nc<0||nr>=n||nc>=n)continue;const j=nr*n+nc;if(seen.has(j))continue;if(this.conns(t[j]).includes((d+2)%4)){seen.add(j);q.push(j);}}}
      return seen;},
    check(){ if(this.flow().has(this.dst)&&this.conns(this.tiles[this.dst]).includes(1)){ this.win=true; clearInterval(this.timer); } },
    rot(i,dir=1){ if(this.win) return; this.tiles[i].r=(this.tiles[i].r+(dir>0?1:3))%4; this.moves++; this.hinted=-1; this.check(); },
    hint(){ if(this.win) return; const i=this.path.find(k=>this.sol[k]>=0&&![...this.needOf(k)].every(d=>this.conns(this.tiles[k]).includes(d)));
      if(i===undefined) return; this.tiles[i].r=this.sol[i]; this.hints++; this.hinted=i; this.check(); },
    needOf(i){ const n=this.n, k=this.path.indexOf(i), st=new Set(); const dirTo=(a,b)=>{const ra=Math.floor(a/n),ca=a%n,rb=Math.floor(b/n),cb=b%n;return rb<ra?0:cb>ca?1:rb>ra?2:3;};
      if(k===0) st.add(3); if(k===this.path.length-1) st.add(1); if(k>0) st.add(dirTo(i,this.path[k-1])); if(k<this.path.length-1) st.add(dirTo(i,this.path[k+1])); return st; },
    reset(){ this.tiles.forEach((t,i)=>t.r=this.start[i]); this.moves=0; this.hints=0; this.hinted=-1; this.win=false; this.secs=0; clearInterval(this.timer); this.timer=setInterval(()=>{ if(!this.win) this.secs++; },1000); },
    next(){ this.level++; if(this.n<7&&this.level%2===0) this.n++; this.make(); },
    newGame(){ this.level=1; this.n=4; this.make(); }
  },
  created(){this.make()},
  unmounted(){clearInterval(this.timer)}
};
const Play = {
  components:{Subnet,LinkUp},
  template:`<div class="wrap page"><span class="kicker"><i></i>Two quick games</span><h1 class="title" data-scr>Play</h1>
    <p class="sub">Built from everyday network work. Scores stay in your browser.</p>
    <div class="games"><Subnet/><LinkUp/></div></div>`
};

/* ---------- endorsements ---------- */
const Endorse = {
  template:`<div class="wrap page"><span class="kicker"><i></i>Reviewed before publishing</span><h1 class="title" data-scr>Endorse</h1>
    <p class="sub">Worked with me? Leave a few lines. Every endorsement is checked by me before it appears here.</p>
    <div class="grid2">
      <div><h2 class="h2" style="font-size:clamp(24px,3vw,36px)">Endorsements</h2>
        <div class="wall" v-if="list.length"><figure class="quote glass" v-for="e in list" :key="e.id" style="margin:0 0 14px"><p>“{{e.message}}”</p>
          <footer><b>{{e.name}}</b>{{[e.role,e.company].filter(Boolean).join(', ')}}<template v-if="e.relation"> · {{e.relation}}</template></footer></figure></div>
        <div class="empty" v-else style="margin-top:20px">No endorsements published yet. Yours could be the first.</div>
      </div>
      <form class="card glass" @submit.prevent="send" novalidate>
        <div class="split"><div class="field"><label for="en">Your name</label><input id="en" v-model.trim="f.name" required maxlength="80" autocomplete="name"></div>
        <div class="field"><label for="er">Role</label><input id="er" v-model.trim="f.role" maxlength="80" autocomplete="organization-title"></div></div>
        <div class="split"><div class="field"><label for="ec">Company</label><input id="ec" v-model.trim="f.company" maxlength="80" autocomplete="organization"></div>
        <div class="field"><label for="ex">How we worked together</label><select id="ex" v-model="f.relation"><option value="">Choose one</option><option>Colleague</option><option>Manager</option><option>Customer</option><option>Partner</option><option>Classmate</option><option>Other</option></select></div></div>
        <div class="field"><label for="el">LinkedIn profile (optional, not shown publicly)</label><input id="el" v-model.trim="f.link" maxlength="200" inputmode="url"></div>
        <div class="field"><label for="em">Endorsement</label><textarea id="em" v-model.trim="f.message" required maxlength="800"></textarea></div>
        <input type="text" v-model="f.website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
        <button class="btn hot" type="submit" :disabled="busy">Submit for review</button>
        <p class="note" :class="msgClass" aria-live="polite">{{msg}}</p>
        <p class="preview-flag" v-if="!$root.s.backend">Preview mode: submissions are not sent from this preview. They work on the live site.</p>
      </form>
    </div></div>`,
  data(){return{f:{name:'',role:'',company:'',relation:'',link:'',message:'',website:''},list:[],busy:false,msg:'',msgClass:''}},
  async created(){ try{ this.list=await api('endorsements')||[]; }catch(e){} },
  methods:{async send(){ if(!this.f.name||this.f.message.length<20){this.msg='Add your name and at least a sentence or two.';this.msgClass='err';return;}
    if(!state.backend){ this.msg='This preview cannot send. Use the live site.'; this.msgClass='err'; return; }
    this.busy=true; try{ await api('endorsements',{method:'POST',json:this.f});
      this.msg='Thank you. Your endorsement is waiting for review.'; this.msgClass='ok'; this.f={name:'',role:'',company:'',relation:'',link:'',message:'',website:''};
    }catch(e){ this.msg=e.message||'Your endorsement could not be saved. Try again.'; this.msgClass='err'; } this.busy=false; }}
};

/* ---------- contact + CV ---------- */
const Contact = {
  template:`<div class="wrap page"><span class="kicker"><i></i>Replies within a day</span><h1 class="title" data-scr>Contact</h1>
    <p class="sub">Feedback, a role, or a project. Send it straight to my WhatsApp or my inbox.</p>
    <div class="grid2">
      <form class="card glass" @submit.prevent="email" novalidate>
        <div class="seg" role="group" aria-label="Message type"><button type="button" v-for="k in kinds" :key="k" :aria-pressed="f.kind===k" @click="f.kind=k">{{k}}</button></div>
        <div class="split"><div class="field"><label for="cn">Your name</label><input id="cn" v-model.trim="f.name" required autocomplete="name"></div>
        <div class="field"><label for="ce">Your email</label><input id="ce" v-model.trim="f.email" type="email" autocomplete="email"></div></div>
        <div class="field"><label for="cm">Message</label><textarea id="cm" v-model.trim="f.message" required></textarea></div>
        <input type="text" v-model="f.website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
        <div class="row" style="margin-top:4px">
          <a class="btn hot" :href="wa" target="_blank" rel="noopener" @click="waClick">Send on WhatsApp</a>
          <button class="btn line" type="submit" :disabled="busy">Send by email</button>
        </div>
        <p class="note" :class="msgClass" aria-live="polite">{{msg}}</p>
      </form>
      <div>
        <div class="cline"><div><small>Email</small><span class="v" id="c-em">{{S.email}}</span></div><button class="mini" type="button" @click="copy('c-em',$event)">Copy</button></div>
        <div class="cline"><div><small>Phone and WhatsApp</small><span class="v" id="c-ph">{{S.phone}}</span></div><button class="mini" type="button" @click="copy('c-ph',$event)">Copy</button></div>
        <div class="cline"><div><small>LinkedIn</small><span class="v">in/nuwan-sayuru</span></div><a class="mini" :href="S.linkedin" target="_blank" rel="noopener">Open</a></div>
        <div class="cline"><div><small>GitHub</small><span class="v">@{{S.github}}</span></div><a class="mini" :href="'https://github.com/'+S.github" target="_blank" rel="noopener">Open</a></div>
      </div>
    </div>
    <div class="cvbox glass" id="cv"><div><h3>Curriculum vitae</h3><p>{{cv.updated ? 'Updated '+cv.updated+'.' : 'The latest version of my CV.'}}</p></div>
      <a v-if="cv.url" class="btn hot" :href="cv.url" target="_blank" rel="noopener">Open CV (PDF)</a>
      <a v-else class="btn line" :href="wa2" target="_blank" rel="noopener">Request my CV on WhatsApp</a></div>
  </div>`,
  data(){return{S,kinds:['Job opportunity','Consultation','Freelance project','Collaboration','Feedback'],f:{kind:state.kind||'Job opportunity',name:'',email:'',message:'',website:''},busy:false,msg:'',msgClass:''}},
  computed:{
    cv(){return state.content.cv||{}},
    text(){return `${this.f.kind} from ${this.f.name||'(name)'}${this.f.email?' <'+this.f.email+'>':''}:\n\n${this.f.message}`},
    wa(){return `https://wa.me/${S.whatsapp}?text=${encodeURIComponent('Hi Nuwan, '+this.text)}`},
    wa2(){return `https://wa.me/${S.whatsapp}?text=${encodeURIComponent('Hi Nuwan, could you share your latest CV?')}`}
  },
  methods:{
    waClick(e){ if(!this.f.name||!this.f.message){ e.preventDefault(); this.msg='Add your name and a message first.'; this.msgClass='err'; return; } this.log(); this.msg='WhatsApp opened with your message. Press send there.'; this.msgClass='ok'; },
    async log(){ if(state.backend){ try{ await api('messages',{method:'POST',json:this.f}); }catch(e){} } },
    async email(){ if(!this.f.name||!this.f.message){ this.msg='Add your name and a message first.'; this.msgClass='err'; return; }
      this.busy=true;
      try{
        if(S.web3formsKey){ const r=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({access_key:S.web3formsKey,subject:`Portfolio: ${this.f.kind} from ${this.f.name}`,from_name:this.f.name,replyto:this.f.email,message:this.text,botcheck:this.f.website})});
          const j=await r.json(); if(!j.success) throw new Error('mail'); }
        else if(!state.backend) throw new Error('none');
        await this.log(); this.msg='Sent. I will reply to the address you gave.'; this.msgClass='ok'; this.f.message='';
      }catch(e){ this.msg='The message could not be sent from here. Use WhatsApp, or copy my email address.'; this.msgClass='err'; }
      this.busy=false; },
    copy(id,e){ const el=document.getElementById(id), b=e.currentTarget; const sel=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected';};
      try{ navigator.clipboard.writeText(el.textContent).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1500)},sel);}catch(err){sel();} }
  }
};

/* ---------- admin ---------- */
const Admin = {
  template:`<div class="wrap page"><h1 class="title" data-scr>Admin</h1>
    <div v-if="!$root.s.backend" class="card glass" style="margin-top:24px"><p>The admin page works on the live site only.</p></div>
    <form v-else-if="!signed" class="card glass" style="margin-top:24px;max-width:480px" @submit.prevent="login">
      <input type="text" name="username" value="admin" autocomplete="username" hidden>
      <div class="field"><label for="ap">Admin password</label><input id="ap" v-model="ap" type="password" autocomplete="current-password"></div>
      <button class="btn hot" type="submit">Sign in</button><p class="note err">{{err}}</p></form>
    <div v-else>
      <div class="tabsx seg"><button v-for="t in tabs" :key="t" type="button" :aria-pressed="tab===t" @click="tab=t;load()">{{t}}</button><button type="button" @click="logout">Sign out</button></div>
      <div v-if="tab==='Endorsements'"><div class="item" v-for="e in ends" :key="e.id"><b>{{e.name}}</b> <small>({{e.status}}) {{[e.role,e.company,e.relation].filter(Boolean).join(', ')}} {{e.link}} · {{e.created_at}}</small><p style="margin-top:8px">{{e.message}}</p>
        <div class="acts"><button class="mini" type="button" @click="setStatus(e,'approved')">Approve</button><button class="mini" type="button" @click="setStatus(e,'rejected')">Reject</button><button class="mini" type="button" @click="del('endorsements',e)">Delete</button></div></div><p v-if="!ends.length" class="note">Nothing here.</p></div>
      <div v-if="tab==='Messages'"><div class="item" v-for="m in msgs" :key="m.id"><b>{{m.kind}}</b> from {{m.name}} <small>{{m.email}} · {{m.created_at}}</small><p style="margin-top:8px;white-space:pre-wrap">{{m.message}}</p><div class="acts"><button class="mini" type="button" @click="del('messages',m)">Delete</button></div></div><p v-if="!msgs.length" class="note">No messages.</p></div>
      <div v-if="tab==='Content'"><p class="note">Edit any text, number or list, then save. Every visitor sees the change straight away.</p><textarea class="code" v-model="json" spellcheck="false" aria-label="Site content"></textarea>
        <div class="row"><button class="btn hot" type="button" @click="saveContent">Save content</button><button class="btn line" type="button" @click="json=JSON.stringify(def,null,2)">Load defaults</button></div><p class="note" :class="okc">{{cmsg}}</p></div>
      <div v-if="tab==='CV'"><div class="card glass" style="display:grid;gap:18px">
        <div><p><b>CV (PDF)</b> {{$root.s.content.cv&&$root.s.content.cv.updated?'· current: '+$root.s.content.cv.updated:''}}</p><input type="file" accept="application/pdf" @change="e=>upload('cv',e)" aria-label="Upload CV"></div>
        <p class="note" :class="okc">{{cmsg}}</p></div></div>
      <div v-if="tab==='Password'"><form class="card glass" style="max-width:480px" @submit.prevent="changePw">
        <div class="field"><label for="pc">Current password</label><input id="pc" v-model="pw.current" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="pn">New password (12+ characters)</label><input id="pn" v-model="pw.next" type="password" autocomplete="new-password"></div>
        <button class="btn hot" type="submit">Change password</button><p class="note" :class="okc">{{cmsg}}</p></form></div>
    </div></div>`,
  data(){return{signed:!!store.get('ns-admin',null),ap:'',err:'',tabs:['Endorsements','Messages','Content','CV','Password'],tab:'Endorsements',ends:[],msgs:[],json:'',cmsg:'',okc:'',pw:{current:'',next:''},def:window.CONTENT_DEFAULT}},
  created(){ if(this.signed) this.load(); },
  methods:{
    fail(e){ if(/Sign in again/.test(e.message)){ store.del('ns-admin'); this.signed=false; } this.cmsg=e.message; this.okc='err'; },
    async login(){ try{ const d=await api('admin/login',{method:'POST',json:{password:this.ap}}); store.set('ns-admin',d.token); this.signed=true; this.ap=''; this.err=''; this.load(); }catch(e){ this.err=e.message; } },
    async logout(){ try{ await api('admin/logout',{method:'POST',json:{}}); }catch(e){} store.del('ns-admin'); this.signed=false; },
    async load(){ this.cmsg=''; try{
      if(this.tab==='Endorsements') this.ends=await api('admin/endorsements');
      if(this.tab==='Messages') this.msgs=await api('admin/messages');
      if(this.tab==='Content'){ const d=await api('content'); this.json=JSON.stringify(merge(window.CONTENT_DEFAULT,d.data||{}),null,2); }
    }catch(e){ this.fail(e); } },
    async setStatus(e,s){ try{ await api('admin/endorsements/'+e.id,{method:'PATCH',json:{status:s}}); e.status=s; }catch(x){ this.fail(x); } },
    async del(kind,e){ try{ await api(`admin/${kind}/`+e.id,{method:'DELETE'}); if(kind==='endorsements') this.ends=this.ends.filter(x=>x.id!==e.id); else this.msgs=this.msgs.filter(x=>x.id!==e.id); }catch(x){ this.fail(x); } },
    async saveContent(){ let d; try{ d=JSON.parse(this.json); }catch(e){ this.cmsg='That is not valid JSON: '+e.message; this.okc='err'; return; }
      try{ await api('admin/content',{method:'PUT',json:{data:d}}); state.content=merge(window.CONTENT_DEFAULT,d); this.cmsg='Saved. The site now shows these changes.'; this.okc='ok'; }catch(e){ this.fail(e); } },
    async upload(kind,ev){ const f=ev.target.files[0]; if(!f) return; this.cmsg='Uploading…'; this.okc='';
      try{ const r=await fetch('/api/admin/file/'+kind,{method:'PUT',headers:{'content-type':f.type,authorization:'Bearer '+store.get('ns-admin','')},body:f}); const d=await r.json(); if(!r.ok) throw new Error(d.error);
        state.content=merge(state.content,{[kind]:{url:d.url,updated:d.updated}}); this.cmsg=(kind==='cv'?'CV':'Photo')+' published.'; this.okc='ok'; }catch(e){ this.fail(e); } },
    async changePw(){ try{ await api('admin/password',{method:'POST',json:this.pw}); this.pw={current:'',next:''}; store.del('ns-admin'); this.signed=false; this.err='Password changed. Sign in again with the new password.'; }catch(e){ this.fail(e); } }
  }
};

/* ---------- terminal easter egg ---------- */
const Term = {
  template:`<div><button v-if="!$root.s.term" class="tbtn" type="button" aria-label="Open terminal" @click="open">&gt;_</button>
  <section v-else class="term glass" aria-label="Terminal"><header><span><i style="background:var(--ember)"></i><i style="background:var(--gold)"></i><i style="background:var(--magenta)"></i></span><span>guest@nuwan-sayuru</span><button class="mini" type="button" @click="$root.s.term=false">Close</button></header>
    <div class="out" ref="out"><div v-for="(l,i) in lines" :key="i" :class="l.c">{{l.t}}</div></div>
    <form @submit.prevent="run"><span style="color:var(--gold)">$</span><input ref="inp" v-model="cmd" aria-label="Command" autocomplete="off" spellcheck="false"></form></section></div>`,
  data(){return{cmd:'',lines:[{t:'Type help to list commands.'}]}},
  methods:{
    open(){this.$root.s.term=true;this.$nextTick(()=>this.$refs.inp&&this.$refs.inp.focus())},
    say(t,c){this.lines.push({t,c})},
    run(){const c=this.cmd.trim().toLowerCase();this.say('$ '+this.cmd,'c');this.cmd='';const C=state.content;
      const go=r=>{this.$root.go(r);this.say('Opening '+r+'.');};
      const map={
        help:()=>this.say('whoami  stats  skills  services  github  cv  work  play  endorse  contact  burst  clear'),
        whoami:()=>this.say(`Nuwan Sayuru\n${C.role}\n${C.basedIn}`),
        stats:()=>this.say(C.stats.map(s=>`${s.v.padEnd(6)} ${s.l}`).join('\n')),
        skills:()=>this.say((C.stack||[]).map(g=>`${g.g}: ${g.items.map(i=>i.t).join(', ')}`).join('\n')),
        services:()=>this.say(C.services.map(s=>'- '+s.t).join('\n')),
        github:()=>{window.open?.('https://github.com/'+S.github,'_blank');this.say('github.com/'+S.github);},
        cv:()=>{this.$root.go('contact',null,'cv');this.say('Opening the CV section.');},
        work:()=>go('work'),play:()=>go('play'),endorse:()=>go('endorse'),contact:()=>go('contact'),
        burst:()=>{Field.burst&&Field.burst();this.say('Scattered.');},
        clear:()=>{this.lines=[];},
        sudo:()=>this.say('Nice try.'),
      };
      (map[c]||(()=>this.say(c?`${c}: command not found. Type help.`:'')))();
      this.$nextTick(()=>{const o=this.$refs.out;if(o)o.scrollTop=o.scrollHeight;});}
  }
};

const App = {
  components:{Nav,Home,Work,Code,Play,Endorse,Contact,Admin,Term},
  template:`<Nav :route="s.route"/><main :key="s.route"><component :is="view"/></main>
    <footer class="foot"><div class="wrap"><span>© {{year}} Nuwan Sayuru</span><span><a :href="S.linkedin" target="_blank" rel="noopener">LinkedIn</a> · <a :href="'https://github.com/'+S.github" target="_blank" rel="noopener">GitHub</a></span></div></footer><Term/>`,
  data(){return{s:state,S,year:new Date().getFullYear()}},
  computed:{view(){return {home:'Home',work:'Work',code:'Code',play:'Play',endorse:'Endorse',contact:'Contact',admin:'Admin'}[this.s.route]||'Home'}},
  methods:{
    go(r,e,anchor){ if(e) e.preventDefault(); state.menu=false;
      if(r===state.route){ this.after(anchor); return; }
      const from=state.route;
      Route.run(from,r,()=>{ state.route=r; try{history.replaceState(null,'','#'+r)}catch(_){location.hash=r} Field.to(ROUTES[r]||'sphere'); scrollTo({top:0,behavior:'instant'}); this.after(anchor); }); },
    after(anchor){
      nextTick(()=>{ document.querySelectorAll('[data-scr]').forEach(scramble); reveals(); countUp(); if(anchor){ const el=document.getElementById(anchor); el&&el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); } }); }
  },
  mounted(){ const h=(location.hash||'').slice(1); if(h&&(ROUTES[h]||h==='admin')){ state.route=h; Field.to(ROUTES[h]||'sphere'); } this.after();
    addEventListener('keydown',e=>{ if(e.key==='Escape') state.menu=false; if((e.key==='~'||e.key==='`')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){ e.preventDefault(); state.term=!state.term; }});
    addEventListener('hashchange',()=>{const h=location.hash.slice(1); if(h&&h!==state.route&&(ROUTES[h]||h==='admin')) this.go(h);});
  }
};
createApp(App).mount('#app');
loadContent().then(()=>{ loadRepos(); nextTick(()=>{ reveals(); }); });
})();
