import {equipment} from '../site-data.js';
import {icons,setLabel} from './icons.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],reduce=matchMedia('(prefers-reduced-motion:reduce)');
const lowPower=()=>navigator.connection?.saveData||['slow-2g','2g'].includes(navigator.connection?.effectiveType)||(navigator.deviceMemory&&navigator.deviceMemory<4);

// Cross-document view transitions preserve genuine static links and browser history.
const selected=sessionStorage.getItem('gm-service-image');
if(selected&&location.pathname==='/garagem-mendes-preview/servicos/'+selected+'/')$('.service-main-photo')?.style.setProperty('view-transition-name','service-image');
for(const link of $$('[data-service-link]'))link.addEventListener('click',event=>{
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||reduce.matches)return;
 $$('.service-main-photo,[data-shared-image]').forEach(el=>el.style.setProperty('view-transition-name','none'));
 link.querySelector('[data-shared-image]')?.style.setProperty('view-transition-name','service-image');sessionStorage.setItem('gm-service-image',link.dataset.serviceLink);
});
window.addEventListener('pageshow',event=>{if(event.persisted)$$('[data-shared-image]').forEach(el=>el.style.removeProperty('view-transition-name'));});

const dialog=$('#equipment-dialog');let equipmentOrigin;
if(dialog){
 for(const button of $$('[data-equipment]'))button.addEventListener('click',()=>{
  const e=equipment.find(e=>e.slug===button.dataset.equipment);if(!e)return;equipmentOrigin=button;
  const original=button.querySelector('img'),image=dialog.querySelector('img');image.src=original.dataset.full||original.src;image.alt=original.alt;
  $('#equipment-dialog-title').textContent=e.name;dialog.querySelector('[data-equipment-benefit]').textContent=e.benefit;
  dialog.querySelector('.equipment-disclaimer').textContent=original.src.includes('/garagem-mendes-preview/equipamentos/')?'Equipamento da oficina.':'Fotografia ilustrativa de referência. O equipamento utilizado pela oficina pode ter outro modelo.';
  dialog.querySelector('[data-equipment-service]').href='/garagem-mendes-preview/servicos/'+e.service+'/';dialog.showModal();document.body.classList.add('modal-open');
 });
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');equipmentOrigin?.focus({preventScroll:true});});
}

if(window.gsap&&window.ScrollTrigger){
 const {gsap,ScrollTrigger}=window;gsap.registerPlugin(ScrollTrigger);
 gsap.matchMedia().add('(prefers-reduced-motion:no-preference)',()=>{
  // Deliberately different movement for each editorial chapter. No page scroll pin.
  const hero=$('.home-hero');if(hero&&!hero.classList.contains('journey')){
   gsap.from('.hero-copy > *',{rotationX:8,z:-35,y:24,opacity:.15,duration:1.1,stagger:.09,ease:'power3.out',clearProps:'all'});
   gsap.from('#home-car-poster',{scale:1.075,opacity:.45,duration:2.4,ease:'power2.out',clearProps:'transform,opacity'});
   gsap.to('.hero-car',{y:70,scale:.96,opacity:.05,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom 15%',scrub:.7}});
  }
  if(!lowPower()){
   for(const mosaic of $$('.mosaic')){
    gsap.fromTo(mosaic.querySelector('.mosaic-main'),{y:35,rotationY:-3,z:15},{y:-15,rotationY:0,z:35,ease:'none',scrollTrigger:{trigger:mosaic,start:'top 95%',end:'bottom 10%',scrub:.9}});
    gsap.fromTo(mosaic.querySelector('.mosaic-real'),{y:-20,rotationY:3,z:45},{y:25,rotationY:0,z:60,ease:'none',scrollTrigger:{trigger:mosaic,start:'top 95%',end:'bottom 15%',scrub:1.1}});
   }
   for(const section of $$('.about-preview,.about-story'))gsap.to(section,{'--grid-drift':'22px',ease:'none',scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.4}});
   for(const image of $$('.service-main-photo img,.diagnosis-window img'))gsap.fromTo(image,{yPercent:-3},{yPercent:5,ease:'none',scrollTrigger:{trigger:image.parentElement,start:'top bottom',end:'bottom top',scrub:.8}});
   for(const photo of $$('.mosaic,.service-main-photo'))gsap.from(photo,{clipPath:'inset(4% 0 4% 0)',duration:1.1,ease:'power2.out',scrollTrigger:{trigger:photo,start:'top 90%',once:true},clearProps:'clipPath'});
  }
  for(const plaque of $$('.parts-brands'))gsap.to(plaque,{'--metal-light':'850%',duration:2.8,ease:'power1.inOut',scrollTrigger:{trigger:plaque,start:'top 85%',once:true}});
  const route=$('.route-line');if(route){const length=route.getTotalLength();gsap.set(route,{strokeDasharray:length,strokeDashoffset:length});gsap.to(route,{strokeDashoffset:0,duration:1.5,ease:'power2.inOut',scrollTrigger:{trigger:route,start:'top 90%',once:true}});gsap.from('.route-point',{scale:.2,opacity:0,transformOrigin:'50% 50%',duration:.7,delay:1.1,scrollTrigger:{trigger:route,start:'top 90%',once:true}});}
  for(const step of $$('.process-steps li'))gsap.from(step,{y:16,opacity:.3,duration:.7,scrollTrigger:{trigger:step,start:'top 90%',once:true},clearProps:'transform,opacity'});
  if(matchMedia('(hover:hover) and (min-width:801px)').matches&&!lowPower()){
   for(const card of $$('.service-card>a,.equipment-display>button,.equipment-entry .editorial-photo>button')){
    const rx=gsap.quickTo(card,'rotationX',{duration:.65,ease:'power2.out'}),ry=gsap.quickTo(card,'rotationY',{duration:.65,ease:'power2.out'});
    const move=e=>{if(reduce.matches)return;const b=card.getBoundingClientRect();rx((.5-(e.clientY-b.top)/b.height)*3);ry(((e.clientX-b.left)/b.width-.5)*4);},leave=()=>{rx(0);ry(0)};
    card.addEventListener('pointermove',move,{passive:true});card.addEventListener('pointerleave',leave);
   }
   const bench=$('[data-bench]');if(bench){const track=bench.querySelector('.carousel-track');let manual=false;bench.addEventListener('pointerdown',()=>manual=true,{once:true,passive:true});bench.addEventListener('keydown',()=>manual=true,{once:true});
    ScrollTrigger.create({trigger:bench,start:'top 85%',end:'bottom 30%',onUpdate:self=>{if(!manual)track.scrollLeft=(track.scrollWidth-track.clientWidth)*Math.min(.18,self.progress*.18);}});
    for(const item of bench.querySelectorAll('.equipment-display'))gsap.fromTo(item,{rotationY:4,z:-20},{rotationY:0,z:0,ease:'none',scrollTrigger:{trigger:bench,start:'top bottom',end:'bottom 25%',scrub:1}});
   }
  }
 });
}

// Lightweight educational components are independent of the multi-megabyte car.
for(const section of $$('[data-service-scene]')){
 let loaded=false,api=null,generation=0;const button=section.querySelector('.service-lab-load');button.hidden=false;
 async function load(){if(loaded)return;const request=++generation;loaded=true;button.disabled=true;button.textContent='Preparando a demonstração…';
  try{const {mountServiceScene}=await import('./service-scenes.js');if(request!==generation)return;const created=await mountServiceScene(section,reduce);if(request!==generation){created.dispose();return}api=created;button.hidden=true;section.dataset.loaded='true';}
  catch{if(request!==generation)return;section.querySelector('.service-lab-canvas').hidden=true;section.querySelector('.service-lab-status').textContent='FOTOGRAFIA E INFORMAÇÕES DISPONÍVEIS';button.hidden=true;}
 }
 button.addEventListener('click',load);
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!lowPower()&&!reduce.matches){load();observer.disconnect();}},{rootMargin:'160px'});observer.observe(section);
 window.addEventListener('pagehide',()=>{generation++;observer.disconnect();api?.dispose();api=null;loaded=false;section.classList.remove('is-ready');delete section.dataset.loaded;section.querySelector('.service-lab-canvas').hidden=true;section.querySelector('.service-lab-controls').hidden=true;section.querySelector('.service-lab-parts').replaceChildren();button.hidden=false;button.disabled=false;setLabel(button,'Ativar demonstração 3D',icons.upRight);});
 window.addEventListener('pageshow',event=>{if(event.persisted)observer.observe(section)});
}
