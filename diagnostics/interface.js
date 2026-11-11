import {modelConfig} from './model-config.js';
import {icons,setLabel} from '../experience/icons.js';

const content={
  overview:{category:'CUIDADO POR COMPLETO',title:'Cuidado de verdade para o seu carro.',analysis:'Do funcionamento do motor à resposta dos freios: cada sistema merece uma avaliação responsável.',benefit:'Entender o conjunto ajuda a orientar o cuidado certo para o seu carro.',contact:'uma avaliação do meu carro'},
  engine:{category:'MOTOR / DIAGNÓSTICO',title:'Diagnóstico preciso antes de qualquer decisão.',analysis:'Injeção, arrefecimento, sensores e ignição. Scanner e inspeção ajudam a investigar falhas, ruídos e perda de potência.',benefit:'Um diagnóstico cuidadoso orienta o reparo e evita a troca de peças por tentativa e erro.',contact:'diagnóstico de motor'},
  brakes:{category:'FREIOS / SEGURANÇA',title:'Segurança não se adivinha. Se mede, analisa e resolve.',analysis:'Disco e pastilha trabalham por atrito. A pinça aplica a força transmitida pelo fluido. Avaliamos desgaste, ruídos e resposta.',benefit:'A manutenção dos freios ajuda a preservar a segurança e a previsibilidade ao dirigir.',contact:'manutenção dos freios'},
  suspension:{category:'SUSPENSÃO / ESTABILIDADE',title:'Conforto, estabilidade e segurança começam aqui.',analysis:'Amortecedor, mola e fixações: inspecionamos folgas e desgaste. A cena revela a geometria dianteira disponível, com movimento demonstrativo.',benefit:'A avaliação de folgas, desgaste e alinhamento orienta o cuidado com a estabilidade e os pneus.',contact:'avaliação da suspensão'},
  electrical:{category:'ELÉTRICA / PRECISÃO',title:'Falha eletrônica não se resolve na tentativa e erro.',analysis:'Scanner e osciloscópio auxiliam na leitura de falhas e na análise dos sinais de sensores.',benefit:'Interpretar o sinal e ouvir o relato de quem dirige ajudam a encontrar a origem do problema.',contact:'diagnóstico elétrico'},
  transmission:{category:'CÂMBIO / TROCA DE ÓLEO',title:'Troca de óleo do câmbio automático.',analysis:'No câmbio automático, a Garagem Mendes faz somente a troca de óleo.',benefit:'O serviço não inclui diagnóstico, reparo, revisão nem retífica do câmbio.',contact:'a troca de óleo do câmbio automático'},
  interior:{category:'INTERIOR / ATENÇÃO AOS DETALHES',title:'Os sinais também estão no painel.',analysis:'Avisos do painel e o relato de quem dirige ajudam a orientar a avaliação do veículo.',benefit:'Compartilhar o que mudou no uso diário contribui para uma investigação responsável.',contact:'uma avaliação do meu carro'}
};
const engineTopics=[
  ['Injeção eletrônica','Investigamos falhas, consumo elevado e alimentação do motor, conforme o sistema do veículo.'],
  ['Arrefecimento','Avaliamos a temperatura de funcionamento e possíveis vazamentos no sistema.'],
  ['Sensores','Analisamos sinais e parâmetros; a posição e o tipo de sensor variam por veículo.'],
  ['Ignição','Avaliamos o funcionamento do sistema de ignição e os sintomas relatados.'],
  ['Diagnóstico por scanner','A leitura de códigos e parâmetros orienta a investigação; não substitui a análise técnica.']
];
const $=s=>document.querySelector(s),section=$('.diagnostics'),stage=$('#diagnostics-stage'),host=$('#diagnostics-viewer');
const status=$('#diagnostics-status'),load=$('#diagnostics-load'),panel=$('#diagnostics-panel'),tabs=$('.diagnostics-tabs');
const mechanical=$('#diagnostics-mechanical'),hotspots=$('#diagnostics-hotspots'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
const loadUI=$('#diagnostics-loading'),loadProgress=$('#diagnostics-loading-progress'),insight=$('#diagnostics-insight');
let viewer=null,mode='overview',loading=false,failed=false,persistentPoints=false,generation=0,touchTimer=0;
const experience=$('#diagnostics-experience'),guideButton=$('#diagnostics-guide'),skip=$('#diagnostics-skip');
const storyModes=['overview','engine','brakes','suspension','electrical','transmission'];
const guideMedia=matchMedia('(min-width:1100px) and (min-height:800px) and (prefers-reduced-motion:no-preference)');
let story=null,guideEnabled=true,tabScrollUntil=0;
const buttons=()=>[...tabs.querySelectorAll('[role=tab]')];
function updateCopy(next){
  mode=next;const c=content[mode];section.dataset.system=mode;
  for(const b of buttons()){const selected=b.dataset.mode===mode;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}
  panel.setAttribute('aria-labelledby','system-'+mode);
  $('#diagnostics-category').textContent=c.category;$('#diagnostics-title').textContent=c.title;$('#diagnostics-analysis').textContent=c.analysis;$('#diagnostics-benefit').textContent=c.benefit;
  $('#diagnostics-contact').href='https://wa.me/'+window.GARAGEM_CONTACT.number+'?text='+encodeURIComponent('Olá, Garagem Mendes! Gostaria de conversar sobre '+c.contact+'.');
  $('#diagnostics-shot-number').textContent=String(Object.keys(content).indexOf(mode)+1).padStart(2,'0');
  $('#diagnostics-shot-name').textContent=buttons().find(b=>b.dataset.mode===mode)?.textContent.toUpperCase()||'VISÃO GERAL';
  insight.hidden=!['electrical','transmission'].includes(mode);
  $('#diagnostics-signal').hidden=mode!=='electrical';$('#diagnostics-fluid').hidden=mode!=='transmission';$('#diagnostics-topics').hidden=mode!=='engine';
  for(const button of $('#diagnostics-topics').querySelectorAll('button'))button.setAttribute('aria-pressed','false');
  if(window.gsap&&!reduce.matches)window.gsap.fromTo([$('#diagnostics-category'),$('#diagnostics-title'),$('.diagnostics-panel-copy')],{opacity:.35,y:6},{opacity:1,y:0,duration:.55,stagger:.06,overwrite:true,clearProps:'transform,opacity'});
}
function showMode(next,fromScroll=false){
  if(!content[next])return;updateCopy(next);viewer?.select(next);
  if(story&&!fromScroll){const i=storyModes.indexOf(next);tabScrollUntil=performance.now()+900;if(i>=0)window.scrollTo({top:story.start+(story.end-story.start)*(i+.15)/storyModes.length,behavior:'smooth'});}
  if(!viewer)status.textContent=failed?'IMAGEM E INFORMAÇÕES DISPONÍVEIS':'EXPLORE EM 3D OU CONSULTE AS INFORMAÇÕES';
}
function revealScene(){if(story)return;const r=stage.getBoundingClientRect();if(r.bottom<110||r.top>innerHeight*.6)stage.scrollIntoView({block:'start',behavior:reduce.matches?'instant':'smooth'});}
tabs.addEventListener('click',e=>{const tab=e.target.closest('[role=tab]');if(!tab)return;showMode(tab.dataset.mode);if(!viewer&&!failed)loadExperience();revealScene();});
tabs.addEventListener('keydown',e=>{
  const list=buttons(),current=list.indexOf(document.activeElement);if(current<0)return;
  const next=e.key==='ArrowRight'?(current+1)%list.length:e.key==='ArrowLeft'?(current-1+list.length)%list.length:e.key==='Home'?0:e.key==='End'?list.length-1:-1;
  if(next<0)return;e.preventDefault();list[next].focus({preventScroll:true});tabs.scrollTo({left:list[next].offsetLeft-tabs.offsetLeft-10,behavior:reduce.matches?'instant':'smooth'});showMode(list[next].dataset.mode);if(!viewer&&!failed)loadExperience();
});
function restore(){showMode('overview');$('#diagnostics-parts').open=false;}
$('#diagnostics-reset').addEventListener('click',restore);
section.addEventListener('keydown',e=>{if(e.key==='Escape'){restore();buttons()[0].focus({preventScroll:true});}});
engineTopics.forEach(([name,description])=>{
  const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed','false');
  b.addEventListener('click',()=>{for(const other of b.parentElement.children)other.setAttribute('aria-pressed',String(other===b));$('#diagnostics-analysis').textContent=description;$('#diagnostics-category').textContent='MOTOR / '+name.toUpperCase();});
  $('#diagnostics-topics [role=group]').append(b);
});
function updateState(state){
  section.dataset.moving=String(state.busy);host.setAttribute('aria-busy',String(state.busy));
  for(const b of mechanical.querySelectorAll('button'))b.disabled=state.busy;
  const rotate=$('#diagnostics-rotation');rotate.setAttribute('aria-pressed',String(state.autoRotate));rotate.disabled=reduce.matches;
  status.textContent=state.busy?'EXPLORANDO '+($('#diagnostics-shot-name').textContent||'O VEÍCULO'):state.mode==='overview'?'ARRASTE PARA GIRAR · PINCE PARA APROXIMAR':viewer?.capabilities.systems[state.mode]?.note||'EXPLORE O CONJUNTO';
}
function fallback(message){
  stopStory();
  viewer?.dispose();viewer=null;failed=true;host.replaceChildren();host.hidden=true;host.removeAttribute('aria-busy');hotspots.replaceChildren();
  section.dataset.mode='poster';section.dataset.moving='false';loadUI.hidden=true;load.hidden=false;load.disabled=false;setLabel(load,'Tentar carregar o 3D',icons.upRight);
  $('#diagnostics-parts').hidden=true;$('#diagnostics-points').disabled=true;$('#diagnostics-rotation').disabled=true;status.textContent=message;
}
function mountControls(api){
  mechanical.replaceChildren();hotspots.replaceChildren();
  for(const [key,part]of Object.entries(api.capabilities.parts)){
    const b=document.createElement('button');b.type='button';b.dataset.part=key;b.textContent='Abrir '+part.label;b.setAttribute('aria-pressed','false');
    b.addEventListener('click',()=>{updateCopy(key==='hood'&&b.getAttribute('aria-pressed')==='false'?'engine':'overview');api.togglePart(key);});mechanical.append(b);
  }
  $('#diagnostics-parts').hidden=!mechanical.childElementCount;
  for(const key of Object.keys(api.capabilities.systems)){
    const point=document.createElement('button');point.type='button';point.className='diagnostics-hotspot';point.dataset.mode=key;point.hidden=true;point.setAttribute('aria-controls','diagnostics-panel');
    point.innerHTML='<i aria-hidden="true"></i><span></span>';point.addEventListener('click',()=>showMode(key));hotspots.append(point);
  }
  $('#diagnostics-points').disabled=false;$('#diagnostics-rotation').disabled=reduce.matches;
}
function project(points){
  for(const point of hotspots.children){
    const p=points[point.dataset.mode];point.hidden=!p?.visible;if(!p)continue;
    point.style.left=p.x+'px';point.style.top=p.y+'px';point.dataset.side=p.side;point.querySelector('span').textContent=p.label;
    point.setAttribute('aria-label','Explorar '+p.label);
  }
}
$('#diagnostics-points').addEventListener('click',()=>{
  persistentPoints=!persistentPoints;$('#diagnostics-points').setAttribute('aria-pressed',String(persistentPoints));section.dataset.points=String(persistentPoints);viewer?.invalidate();
});
$('#diagnostics-rotation').addEventListener('click',()=>viewer?.setAutoRotate($('#diagnostics-rotation').getAttribute('aria-pressed')!=='true'));
stage.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||e.target.tagName!=='CANVAS')return;clearTimeout(touchTimer);section.dataset.touchPoints='true';viewer?.invalidate();touchTimer=setTimeout(()=>{section.dataset.touchPoints='false';},3500);});
async function loadExperience(){
  if(loading||viewer||!modelConfig.approved)return;
  const request=++generation;loading=true;failed=false;section.dataset.mode='loading';load.hidden=true;loadUI.hidden=false;loadProgress.removeAttribute('value');status.textContent='CARREGANDO A EXPERIÊNCIA';
  try{
    const {createViewer}=await import('./cinematic-viewer.js');host.hidden=false;
    const api=await createViewer({host,config:modelConfig,reduce,onState:updateState,onProject:project,
      onProgress:percent=>{if(percent===null)loadProgress.removeAttribute('value');else loadProgress.value=percent;$('#diagnostics-loading-label').textContent=percent===null?'Carregando o veículo':percent<100?'Carregando o veículo · '+percent+'%':'Ajustando a iluminação';},
      onPartChange:(key,open)=>{const b=mechanical.querySelector('[data-part="'+key+'"]');if(b){b.setAttribute('aria-pressed',String(open));b.textContent=(open?'Fechar ':'Abrir ')+modelConfig.parts[key].label;}},
      onFailure:()=>fallback('VISUALIZAÇÃO INDISPONÍVEL · IMAGEM E INFORMAÇÕES PRESERVADAS')
    });
    if(request!==generation){api.dispose();return;}
    viewer=api;mountControls(api);section.dataset.mode='ready';loadUI.hidden=true;api.select(mode);host.diagnosticsMetrics=()=>viewer?.getMetrics();syncStory();
    if(window.gsap&&!reduce.matches)window.gsap.fromTo(host,{opacity:0},{opacity:1,duration:.75,clearProps:'opacity'});
  }catch{if(request===generation)fallback('VISUALIZAÇÃO INDISPONÍVEL · IMAGEM E INFORMAÇÕES PRESERVADAS');}
  finally{loading=false;}
}
load.hidden=!modelConfig.approved;load.addEventListener('click',loadExperience);
const requestedMode=new URLSearchParams(location.search).get('sistema');
if(requestedMode&&Object.hasOwn(content,requestedMode))guideEnabled=false;
updateCopy(Object.hasOwn(content,requestedMode)?requestedMode:'overview');
// Native scrolling: no wheel interception, snapping or scroll smoothing layer.
// Small screens / reduced motion keep the complete scene available through tabs.
function stopStory(){
  story?.kill();story=null;experience.classList.remove('is-guided');document.documentElement.classList.remove('has-guided-diagnostics');skip.hidden=true;
  section.style.removeProperty('--journey');
}
function syncStory(){
  stopStory();guideButton.hidden=!viewer||!guideMedia.matches||!!navigator.connection?.saveData;
  guideButton.setAttribute('aria-pressed',String(guideEnabled));
  if(guideButton.hidden||!guideEnabled||!window.ScrollTrigger)return;
  const scrollBefore=window.scrollY;
  document.documentElement.classList.add('has-guided-diagnostics');experience.classList.add('is-guided');skip.hidden=false;
  story=window.ScrollTrigger.create({id:'diagnostic-story',trigger:$('#diagnostics-story'),pin:experience,pinType:'transform',start:()=>$('#diagnostics-story').getBoundingClientRect().top+window.scrollY-88,end:()=>'+='+Math.round(innerHeight*4.5),anticipatePin:1,invalidateOnRefresh:true,
    onUpdate:self=>{
      section.style.setProperty('--journey',self.progress);
      if(!self.isActive||performance.now()<tabScrollUntil)return;
      const next=storyModes[Math.min(5,Math.floor(self.progress*6))];
      if(next!==mode){$('#diagnostics-parts').open=false;showMode(next,true);}
    }
  });
  window.ScrollTrigger.refresh();window.scrollTo({top:scrollBefore,behavior:'instant'});
}
guideButton.addEventListener('click',()=>{const before=experience.getBoundingClientRect().top;guideEnabled=!guideEnabled;syncStory();const after=experience.getBoundingClientRect().top;window.scrollBy({top:after-before,behavior:'instant'});});
skip.addEventListener('click',()=>{window.location.assign('/garagem-mendes-preview/servicos/');});
guideMedia.addEventListener('change',syncStory);
window.addEventListener('pagehide',()=>{generation++;clearTimeout(touchTimer);stopStory();viewer?.dispose();viewer=null;});
window.addEventListener('pageshow',e=>{if(e.persisted){loading=false;fallback('VISUALIZAÇÃO PAUSADA · TOQUE PARA CARREGAR NOVAMENTE');}});
