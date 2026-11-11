// Jornada da Home: sequência de quadros WebP (imagens e vídeos gerados por IA) controlada pela rolagem nativa.
// Sem bloqueio de rolagem, sem snap. Modo estático para movimento reduzido, economia de dados e falhas.
const root=document.querySelector('.journey-ia');
if(root)setup();

function setup(){
 const data=JSON.parse(root.querySelector('#journey-data').textContent);
 const T=data.timeline,W=T.reduce((a,s)=>a+s.scroll,0),starts=[];{let acc=0;for(const s of T){starts.push(acc/W);acc+=s.scroll}}
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),conn=navigator.connection||{};
 const limited=()=>reduce.matches||!!conn.saveData||/(^|-)2g$/.test(conn.effectiveType||'');
 const media=root.querySelector('.journey-media'),steps=[...root.querySelectorAll('.journey-step')],chips=[...root.querySelectorAll('[data-journey-go]')];
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),ease=t=>t*t*(3-2*t);
 const enterFrac=s=>s.enter==='fade-escuro'?.35:s.enter==='dissolve'?(s.media.type==='frames'?.12:.25):0;
 let live=false,variant=null,canvas=null,ctx=null,store={},queue=[],inflight=0,raf=0,active=-1,lastKey='',drawn=0,drawTimes=[],generation=0;

 const url=(v,file)=>data.base+v+'/'+file;
 const frameUrl=(v,id,i)=>url(v,id+'/'+String(i+1).padStart(4,'0')+'.webp');
 function load(entry){return new Promise(res=>{const img=new Image();img.decoding='async';img.onload=()=>{entry.img=img;res(true)};img.onerror=()=>res(false);img.src=entry.src})}
 function pump(gen){while(inflight<5&&queue.length){const entry=queue.shift();if(entry.img||entry.loading)continue;entry.loading=true;inflight++;load(entry).then(ok=>{inflight--;if(gen!==generation)return;entry.loading=false;if(!ok)entry.failed=true;else if(entry.near)schedule();pump(gen)})}}
 function prepare(){
  variant=innerWidth<=800?'mobile':'desktop';store={};queue=[];generation++;
  const v=data.variants[variant],stills=[],coarse=[],fine=[];
  for(const s of T){
   const info=v.steps[s.id],entry={still:{src:url(variant,info.still)},frames:[]};store[s.id]=entry;stills.push(entry.still);
   for(let i=0;i<info.frames;i++)entry.frames.push({src:frameUrl(variant,s.id,i),i});
   // Quadros espaçados primeiro (rolagem rápida já mostra movimento), depois preenche.
   const seen=new Set();for(const step of [8,4,2,1])for(let i=0;i<info.frames;i+=step)if(!seen.has(i)){seen.add(i);(step>=4?coarse:fine).push(entry.frames[i])}
   if(info.frames)seen.has(info.frames-1)||fine.push(entry.frames[info.frames-1]);
  }
  queue=[...stills,...coarse,...fine];pump(generation);
 }
 function pick(s,t){
  const entry=store[s.id];if(!entry)return null;
  if(s.media.type==='frames'&&entry.frames.length){
   const n=entry.frames.length,idx=Math.round(t*(n-1)),want=entry.frames[idx];
   if(!want.img&&!want.loading&&!want.failed){want.near=true;queue.unshift(want);pump(generation)}
   for(let d=0;d<n;d++){const a=entry.frames[idx-d],b=entry.frames[idx+d];if(a?.img)return {img:a.img,key:s.id+':'+a.i,zoom:1};if(b?.img)return {img:b.img,key:s.id+':'+b.i,zoom:1}}
   for(let d=-3;d<=3;d++){const f=entry.frames[idx+d];if(f)f.near=true}
  }
  if(entry.still.img){const z=s.media.zoom||[1,1],zoom=z[0]+(z[1]-z[0])*ease(t);return {img:entry.still.img,key:s.id+':s'+zoom.toFixed(3),zoom}}
  entry.still.near=true;return null;
 }
 function cover(img,zoom,alpha){
  const cw=canvas.width,ch=canvas.height,iw=img.naturalWidth,ih=img.naturalHeight,s=Math.max(cw/iw,ch/ih)*zoom,w=iw*s,h=ih*s;
  ctx.globalAlpha=alpha;ctx.drawImage(img,(cw-w)/2,(ch-h)/2,w,h);ctx.globalAlpha=1;
 }
 function dark(alpha){ctx.fillStyle='rgba(8,9,10,'+alpha.toFixed(3)+')';ctx.fillRect(0,0,canvas.width,canvas.height)}
 function progress(){const r=root.getBoundingClientRect(),len=root.offsetHeight-innerHeight;return clamp(-r.top/Math.max(1,len),0,1)}
 function locate(p){let i=T.length-1;for(let k=0;k<T.length;k++)if(p<starts[k]+T[k].scroll/W){i=k;break}return {i,t:clamp((p-starts[i])/(T[i].scroll/W),0,1)}}
 function setActive(i){
  if(i===active)return;active=i;root.dataset.step=T[i].id;
  steps.forEach((el,k)=>el.classList.toggle('is-active',k===i));
  chips.forEach((el,k)=>{if(k===i)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});
  // Mantém o atalho ativo visível na faixa horizontal do celular, sem rolar a página.
  const nav=chips[i]?.parentNode;if(nav&&nav.scrollWidth>nav.clientWidth+2)nav.scrollTo({left:Math.max(0,chips[i].offsetLeft-20),behavior:reduce.matches?'auto':'smooth'});
 }
 function render(){
  raf=0;if(!live||!ctx)return;
  const p=progress(),{i,t}=locate(p),s=T[i],ef=enterFrac(s);setActive(i);
  document.body.classList.toggle('journey-active',root.getBoundingClientRect().bottom>innerHeight*.4);
  const cur=pick(s,t);let prev=null,k=1;
  if(i>0&&ef&&t<ef){k=t/ef;prev=pick(T[i-1],1)}
  const key=(cur?.key||'-')+'|'+(prev?.key||'')+'|'+k.toFixed(2);if(key===lastKey)return;
  const a=performance.now();
  if(prev&&s.enter==='fade-escuro'){if(k<.5){cover(prev.img,prev.zoom,1);dark(k*2)}else if(cur){cover(cur.img,cur.zoom,1);dark((1-k)*2)}}
  else if(prev&&cur){cover(prev.img,prev.zoom,1);cover(cur.img,cur.zoom,ease(k))}
  else if(cur)cover(cur.img,cur.zoom,1);
  else return;
  drawTimes.push(performance.now()-a);if(drawTimes.length>400)drawTimes.shift();drawn++;lastKey=key;
  if(!media.classList.contains('is-ready'))media.classList.add('is-ready');
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(render)}
 function size(){
  if(!canvas)return;root.style.setProperty('--journey-header',(document.querySelector('.header')?.offsetHeight||72)+'px');const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(media.clientWidth*dpr),h=Math.round(media.clientHeight*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;lastKey=''}
  const want=innerWidth<=800?'mobile':'desktop';if(want!==variant){prepare();lastKey=''}
  schedule();
 }
 function start(){
  if(live)return;live=true;root.classList.add('is-live');root.classList.remove('is-static');
  canvas=document.createElement('canvas');canvas.className='journey-canvas';canvas.setAttribute('aria-hidden','true');media.insertBefore(canvas,media.querySelector('.journey-ai-label'));ctx=canvas.getContext('2d',{alpha:false});
  prepare();size();
 }
 function stop(staticMode){
  live=false;cancelAnimationFrame(raf);raf=0;generation++;queue=[];store={};lastKey='';active=-1;
  canvas?.remove();canvas=null;ctx=null;media.classList.remove('is-ready');document.body.classList.remove('journey-active');
  if(staticMode){root.classList.remove('is-live');root.classList.add('is-static');steps.forEach(el=>el.classList.remove('is-active'))}
 }
 // Atalhos: na rolagem ao vivo, levam ao ponto da etapa; sem animação, são âncoras comuns.
 chips.forEach((chip,k)=>chip.addEventListener('click',e=>{
  if(!live||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();
  const len=root.offsetHeight-innerHeight,top=root.getBoundingClientRect().top+scrollY+len*(starts[k]+(T[k].scroll/W)*(k?Math.max(.4,enterFrac(T[k])+.1):0));
  scrollTo({top,behavior:reduce.matches?'auto':'smooth'});
 }));
 root.querySelector('.journey-skip').addEventListener('click',e=>{
  const target=document.querySelector('#servicos-home');if(!target||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();
  const header=document.querySelector('.header')?.offsetHeight||0;scrollTo({top:target.getBoundingClientRect().top+scrollY-header,behavior:'instant'});target.focus({preventScroll:true});
 });
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',size,{passive:true});
 reduce.addEventListener('change',()=>{if(limited())stop(true);else start()});
 addEventListener('pagehide',e=>{if(e.persisted)stop(false)});
 addEventListener('pageshow',e=>{if(e.persisted&&!limited()){live=false;start()}});
 root.journeyMetrics=()=>{const s=[...drawTimes].sort((a,b)=>a-b),v=variant&&data.variants[variant];let loaded=0,total=0;for(const id in store){const e=store[id];total+=e.frames.length+1;loaded+=e.frames.filter(f=>f.img).length+(e.still.img?1:0)}
  return {mode:live?'live':'static',variant,step:active>=0?T[active].id:null,progress:+progress().toFixed(4),loaded,total,drawn,drawP95:s.length?+s[Math.floor(s.length*.95)].toFixed(2):null,canvas:canvas?canvas.width+'x'+canvas.height:null,frames:v?Object.fromEntries(Object.entries(v.steps).map(([k,x])=>[k,x.frames])):null}};
 if(limited()||!root.classList.contains('is-live'))stop(true);else start();
}
