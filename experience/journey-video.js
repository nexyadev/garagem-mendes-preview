// Jornada da Home: a posição da rolagem dentro do bloco define o tempo do vídeo (rolagem nativa, sem travar a página).
// Sem animação (movimento reduzido) ou com erro no vídeo: modo estático com poster, controles e etapas em HTML.
const root=document.querySelector('.jv');
if(root)setup();

function setup(){
 const data=JSON.parse(root.querySelector('#jv-data').textContent);
 const video=root.querySelector('.jv-video'),steps=[...root.querySelectorAll('.jv-step')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:800px), (orientation:portrait)'),conn=navigator.connection||{};
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),FADE=.45;
 let live=false,raf=0,current=0,target=0,duration=data.duration,active=-1,unlocked=false,inView=true,file=null,format=null,loadMs=null,bytes=0,cause=null,started=false;
 const loading=root.querySelector('.jv-progress'),bar=root.querySelector('.jv-progress-bar'),TIMEOUT=20000,sources=[...video.querySelectorAll('source')];
 // Métricas de fluidez: intervalo entre atualizações de currentTime e tempo até o quadro aparecer (seeked).
 let seeks=0,lastSet=0,setAt=0;const gaps=[],seekMs=[];
 const p95=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return +s[Math.floor(s.length*.95)].toFixed(1)};
 const push=(a,v)=>{a.push(v);if(a.length>600)a.shift()};

 const headerSize=()=>root.style.setProperty('--jv-header',(document.querySelector('.header')?.offsetHeight||72)+'px');
 // Formato pelo que o navegador decodifica: MP4/H.264 quando suportado; senão WebM/VP9. Nunca os dois.
 function chooseFile(){
  const size=small.matches||conn.saveData?'mobile':'desktop';
  if(video.canPlayType('video/mp4; codecs="avc1.42E01E"'))return {format:'mp4',file:data.files.mp4[size]};
  if(video.canPlayType('video/webm; codecs="vp9"'))return {format:'webm',file:data.files.webm[size]};
  return null;
 }
 function fail(why){cause=why;console.warn('[Jornada] Animação desativada: '+why+'. Mostrando as etapas em lista.');root.classList.add('has-error');if(loading)loading.hidden=true;stop();if(video.src.startsWith('blob:')){URL.revokeObjectURL(video.src);video.removeAttribute('src');video.load()}}
 function progress(){const r=root.getBoundingClientRect(),len=root.offsetHeight-innerHeight;return clamp(-r.top/Math.max(1,len),0,1)}
 function setActive(i){
  if(i===active)return;active=i;
  if(i>=0)root.dataset.step=data.steps[i].id;
 }
 // Opacidade de cada etapa pela janela de tempo, com fade de ~0,45 s na entrada e na saída.
 function paintSteps(t){
  let best=-1,bestA=0;
  data.steps.forEach((s,k)=>{
   const to=s.to==null?Infinity:s.to,a=clamp((t-s.from)/FADE,0,1)*clamp((to-t)/FADE,0,1),el=steps[k];
   el.style.opacity=a.toFixed(3);el.classList.toggle('is-active',a>.01);el.toggleAttribute('inert',a<.5);
   if(a>bestA){bestA=a;best=k}
  });
  if(best<0){let k=0;data.steps.forEach((s,i)=>{if(t>=s.from)k=i});best=k}
  setActive(best);
 }
 function tick(){
  raf=0;if(!live)return;
  target=progress()*duration;current+=(target-current)*.18;if(Math.abs(target-current)<.004)current=target;
  if(Math.abs(video.currentTime-current)>.02&&!video.seeking&&video.readyState>=1){
   const now=performance.now();if(lastSet)push(gaps,now-lastSet);lastSet=now;setAt=now;seeks++;
   video.currentTime=clamp(current,0,Math.max(0,duration-.04));
  }
  paintSteps(current);
  document.body.classList.toggle('jv-on',inView);document.body.classList.toggle('journey-active',inView);
  if(Math.abs(target-current)>.001||video.seeking)raf=requestAnimationFrame(tick);
 }
 function schedule(){if(live&&!raf)raf=requestAnimationFrame(tick)}
 // iOS: um play().then(pause) após um toque libera o seek. Só depois do vídeo carregado, para não disparar outro download.
 function unlock(){if(unlocked||!live||!video.src.startsWith('blob:'))return;unlocked=true;const p=video.play();if(p&&p.then)p.then(()=>{video.pause();schedule()}).catch(()=>{})}
 // Baixa o arquivo inteiro em segundo plano (peso exato, arraste fluido). Enquanto isso: poster, texto e rolagem normais.
 async function load(){
  if(started)return;started=true;const pick=chooseFile();
  if(!pick)return fail('nenhum codec suportado (MP4/H.264 e WebM/VP9 indisponíveis)');
  format=pick.format;file=pick.file;if(loading)loading.hidden=false;root.classList.add('is-loading');
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),TIMEOUT),t0=performance.now();
  try{
   const res=await fetch(data.base+file,{signal:ctrl.signal});if(!res.ok)throw new Error('HTTP '+res.status);
   // Lê em partes para mover a barra de progresso (Content-Length); o arquivo continua sendo baixado uma única vez.
   const total=+res.headers.get('content-length')||0,reader=res.body&&res.body.getReader();let blob;
   if(reader){const parts=[];let got=0;for(;;){const {done,value}=await reader.read();if(done)break;parts.push(value);got+=value.length;if(total&&bar)bar.style.transform='scaleX('+Math.min(1,got/total).toFixed(3)+')'}blob=new Blob(parts,{type:res.headers.get('content-type')||''})}
   else blob=await res.blob();
   clearTimeout(timer);bytes=blob.size;loadMs=Math.round(performance.now()-t0);
   if(!live)return;video.src=URL.createObjectURL(blob);video.preload='auto';video.load();
  }catch(e){clearTimeout(timer);if(live)fail(ctrl.signal.aborted?'tempo de carregamento acima de 20 s':'falha ao baixar o vídeo ('+(e.message||e)+')')}
 }
 function start(){
  if(live)return;live=true;root.classList.add('is-live');root.classList.remove('is-static');
  video.removeAttribute('controls');video.setAttribute('aria-hidden','true');video.tabIndex=-1;video.muted=true;video.playsInline=true;video.preload='none';sources.forEach(s=>s.remove());
  load();if(!live)return;current=target=progress()*duration;paintSteps(current);schedule();
 }
 function stop(){
  live=false;cancelAnimationFrame(raf);raf=0;root.classList.remove('is-live');root.classList.add('is-static');
  video.setAttribute('controls','');video.removeAttribute('aria-hidden');video.removeAttribute('tabindex');if(!video.querySelector('source'))sources.forEach(s=>video.append(s));
  steps.forEach(el=>{el.style.opacity='';el.removeAttribute('inert');el.classList.remove('is-active')});
  document.body.classList.remove('jv-on','journey-active');
 }
 video.addEventListener('loadedmetadata',()=>{if(isFinite(video.duration)&&video.duration>0)duration=video.duration;schedule()});
 video.addEventListener('seeked',()=>{if(setAt)push(seekMs,performance.now()-setAt);if(!root.classList.contains('is-ready')&&live)root.classList.add('is-ready');schedule()});
 video.addEventListener('loadeddata',()=>{if(!live)return;root.classList.add('is-ready');root.classList.remove('is-loading');if(loading)loading.hidden=true;schedule()});
 video.addEventListener('error',()=>{if(live&&video.src.startsWith('blob:'))fail('o navegador não conseguiu decodificar o vídeo '+format+' (código '+(video.error?.code||'?')+')')});

 root.querySelector('.jv-skip').addEventListener('click',e=>{
  const goal=document.querySelector('#servicos-home');if(!goal||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();
  const header=document.querySelector('.header')?.offsetHeight||0;scrollTo({top:goal.getBoundingClientRect().top+scrollY-header,behavior:'instant'});goal.focus({preventScroll:true});
 });
 new IntersectionObserver(([entry])=>{inView=entry.isIntersecting&&entry.intersectionRect.height>innerHeight*.3;document.body.classList.toggle('jv-on',live&&inView);document.body.classList.toggle('journey-active',live&&inView);schedule()},{threshold:[0,.1,.3,.5]}).observe(root);
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',()=>{headerSize();schedule()},{passive:true});
 addEventListener('touchstart',unlock,{passive:true});addEventListener('pointerdown',unlock,{passive:true});
 reduce.addEventListener('change',()=>{if(reduce.matches)stop();else if(!root.classList.contains('has-error'))start()});
 addEventListener('pageshow',e=>{if(e.persisted&&live){current=target=progress()*duration;schedule()}});
 root.journeyMetrics=()=>({mode:live?'live':'static',file,format,loadMs,bytes,cause,step:active>=0?data.steps[active].id:null,duration:+duration.toFixed(3),currentTime:+video.currentTime.toFixed(3),readyState:video.readyState,seeks,gapP95:p95(gaps),gapMedian:gaps.length?+[...gaps].sort((a,b)=>a-b)[gaps.length>>1].toFixed(1):null,seekP95:p95(seekMs)});
 root.resetJourneyMetrics=()=>{gaps.length=0;seekMs.length=0;seeks=0;lastSet=0};
 headerSize();
 if(reduce.matches||!root.classList.contains('is-live'))stop();else start();
}
