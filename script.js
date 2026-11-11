import {siteConfig as contact} from './site-config.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
window.GARAGEM_CONTACT=Object.freeze({number:contact.whatsapp,message:contact.message});
// Static links are generated with these same values, including without JS.
for(const a of $$('[data-whatsapp]')){
  const message=a.dataset.message||(a.dataset.service?'Olá, vim pelo site da Garagem Mendes e gostaria de saber mais sobre '+a.dataset.service+'.':contact.message);
  a.href='https://wa.me/'+contact.whatsapp+'?text='+encodeURIComponent(message);
}
// Rastreamento de cliques no WhatsApp: só um evento no dataLayer, sem script de terceiros e sem cookie.
// Pronto para o Google Tag Manager (acionador: evento personalizado "whatsapp_click").
window.dataLayer=window.dataLayer||[];
const waSelector='a[data-whatsapp],a[href^="https://wa.me/"]';
const waLocation=a=>a.closest('.header')?'cabecalho':a.closest('#mobile-menu')?'menu-mobile':a.classList.contains('floating-whatsapp')?'botao-flutuante':a.closest('.footer')?'rodape':a.closest('.jv-step')?'jornada-'+a.closest('.jv-step').id.replace('etapa-',''):a.id||[...(a.closest('section')?.classList||[])].find(c=>c!=='section')||'pagina';
for(const a of $$(waSelector))a.dataset.waLocation||=waLocation(a);
document.addEventListener('click',e=>{
  const a=e.target.closest?.(waSelector);if(!a)return;
  window.dataLayer.push({event:'whatsapp_click',whatsapp_location:a.dataset.waLocation||waLocation(a),whatsapp_service:a.dataset.service||'',page_path:location.pathname});
},{capture:true});
// Rastreamento dos botões de avaliações no Google: mesmo padrão do WhatsApp (dataLayer, sem terceiros, sem cookie).
document.addEventListener('click',e=>{
  const a=e.target.closest?.('a[data-google-reviews]');if(!a)return;
  window.dataLayer.push({event:'google_reviews_click',reviews_action:a.dataset.googleReviews,reviews_location:a.dataset.reviewsLocation||'',page_path:location.pathname});
},{capture:true});
// Avaliações: lightbox dos prints (<dialog> nativo: foco preso, Esc fecha; setas trocam; foco volta ao print).
const printBox=$('#print-lightbox');
if(printBox){
  const opens=$$('.review-print-open'),img=printBox.querySelector('.print-lightbox-img'),count=printBox.querySelector('.print-lightbox-count');let current=0,printOpener=null;
  const show=i=>{current=(i+opens.length)%opens.length;const src=opens[current].querySelector('img');img.src=src.dataset.full;img.alt=src.alt;count.textContent=(current+1)+' de '+opens.length;};
  opens.forEach((btn,i)=>btn.addEventListener('click',()=>{printOpener=btn;show(i);printBox.showModal();document.body.classList.add('modal-open');printBox.querySelector('.print-lightbox-close').focus();}));
  printBox.querySelector('.print-lightbox-prev').addEventListener('click',()=>show(current-1));
  printBox.querySelector('.print-lightbox-next').addEventListener('click',()=>show(current+1));
  printBox.querySelector('.print-lightbox-close').addEventListener('click',()=>printBox.close());
  printBox.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();show(current+1);}if(e.key==='ArrowLeft'){e.preventDefault();show(current-1);}});
  printBox.addEventListener('click',e=>{if(e.target===printBox)printBox.close();});
  printBox.addEventListener('close',()=>{document.body.classList.remove('modal-open');opens[current]?.focus({preventScroll:true});});
}
$$('[data-phone]').forEach(a=>{a.href='tel:'+contact.phone;a.textContent=contact.phoneLabel;});
$$('[data-instagram]').forEach(a=>{a.href=contact.instagram;});
$$('[data-address]').forEach(el=>{el.replaceChildren(document.createTextNode(contact.address),document.createElement('br'),document.createTextNode(contact.neighborhood));});
$$('[data-hours]').forEach(el=>{el.replaceChildren(document.createTextNode(contact.hours),document.createElement('br'),document.createTextNode(contact.closed));});
const header=$('.header'),menu=$('#mobile-menu'),menuToggle=$('.menu-toggle');
function updateHeader(){header.classList.toggle('is-scrolled',window.scrollY>40);}
updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});
menuToggle.addEventListener('click',()=>{menu.showModal();menuToggle.setAttribute('aria-expanded','true');document.body.classList.add('modal-open');});
$('.menu-close').addEventListener('click',()=>menu.close());
menu.addEventListener('click',e=>{if(e.target===menu&&e.clientX<menu.getBoundingClientRect().left)menu.close();if(e.target.closest('a'))menu.close();});
menu.addEventListener('close',()=>{menuToggle.setAttribute('aria-expanded','false');document.body.classList.remove('modal-open');menuToggle.focus({preventScroll:true});});
matchMedia('(min-width:801px)').addEventListener('change',e=>{if(e.matches&&menu.open)menu.close();});

for(const region of $$('[data-carousel]')){
  const track=region.querySelector('.carousel-track'),prev=region.querySelector('[data-prev]'),next=region.querySelector('[data-next]'),status=region.querySelector('.carousel-status');
  const step=()=>track.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap||0);
  const move=direction=>track.scrollBy({left:step()*direction,behavior:reduce.matches?'instant':'smooth'});
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  track.addEventListener('keydown',e=>{if(e.target!==track)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
  function update(){const max=track.scrollWidth-track.clientWidth;prev.disabled=track.scrollLeft<=1;next.disabled=track.scrollLeft>=max-2;status.textContent=String(Math.min(track.children.length,Math.floor((track.scrollLeft+5)/step())+1)).padStart(2,'0')+' / '+String(track.children.length).padStart(2,'0')+' — ARRASTE PARA EXPLORAR';}
  track.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(track);update();
  let drag=null,ignoreClickUntil=0;
  track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,left:track.scrollLeft,id:e.pointerId,moved:false};});
  track.addEventListener('pointermove',e=>{if(!drag)return;const delta=e.clientX-drag.x;if(Math.abs(delta)>7&&!drag.moved){drag.moved=true;track.setPointerCapture(e.pointerId);track.classList.add('is-dragging');}if(drag.moved){e.preventDefault();track.scrollLeft=drag.left-delta;}});
  function endDrag(){if(!drag)return;if(drag.moved){ignoreClickUntil=performance.now()+250;track.releasePointerCapture(drag.id);}drag=null;track.classList.remove('is-dragging');}
  track.addEventListener('pointerup',endDrag);track.addEventListener('pointercancel',endDrag);track.addEventListener('pointerleave',()=>{if(!drag?.moved)drag=null;});
  track.addEventListener('click',e=>{if(performance.now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
  track.addEventListener('dragstart',e=>e.preventDefault());
}

for(const button of $$('[data-filter]'))button.addEventListener('click',()=>{
  $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  let count=0;$$('.services-grid .service-card').forEach(card=>{card.hidden=button.dataset.filter!=='Todos'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)count++;});
  $('.filter-count').textContent=count+' '+(count===1?'serviço disponível':'serviços disponíveis');
});

const lightbox=$('#photo-lightbox');let photoOrigin=null;
for(const button of $$('[data-lightbox]'))button.addEventListener('click',()=>{
  photoOrigin=button;const original=button.querySelector('img'),image=lightbox.querySelector('img');image.src=original.dataset.full||original.currentSrc||original.src;image.alt=original.alt;
  lightbox.querySelector('figcaption').textContent=original.alt;lightbox.showModal();document.body.classList.add('modal-open');
});
$('.lightbox-close').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
lightbox.addEventListener('close',()=>{document.body.classList.remove('modal-open');photoOrigin?.focus({preventScroll:true});});

if(window.gsap&&window.ScrollTrigger){
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion:no-preference)',()=>{
    $$('[data-reveal],.section-heading,.page-intro').forEach(el=>gsap.from(el,{y:18,duration:.65,ease:'power2.out',clearProps:'transform',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
  });
}
if($('.diagnostics'))import('./diagnostics/interface.js').catch(()=>{/* Static content remains available. */});
import('./experience/motion.js').catch(()=>{/* Native links, photos and content stay usable. */});
if($('.jv'))import('./experience/journey-video.js').catch(()=>{const root=$('.jv');root.classList.remove('is-live');root.classList.add('is-static');});
if($('.journey'))import('./experience/journey.js').catch(()=>{const root=$('.journey');root.classList.add('is-static');});
