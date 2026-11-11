import * as T from 'three';
import {icons,setLabel} from './icons.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createTechnicalScene} from '../diagnostics/technical-scenes.js';

// Original conceptual geometry. It is labelled as an illustration in the page,
// never presented as a component measured from the customer's car.
function makeLesson(mode){
 if(['brakes','suspension','transmission','electrical','diagnostic'].includes(mode))return createTechnicalScene(mode==='diagnostic'?'electrical':mode);
 const root=new T.Group(),parts={},resources=new Set(),steel=new T.MeshStandardMaterial({color:0x999791,metalness:.8,roughness:.3}),dark=new T.MeshStandardMaterial({color:0x30302d,metalness:.35,roughness:.48}),red=new T.MeshStandardMaterial({color:0x9f1b31,metalness:.4,roughness:.4}),paper=new T.MeshStandardMaterial({color:0xd0bda0,metalness:.05,roughness:.8});[steel,dark,red,paper].forEach(m=>resources.add(m));
 const group=(id,label,description)=>{const object=new T.Group();root.add(object);parts[id]={object,label,description};return object};
 const mesh=(parent,geometry,material,position=[0,0,0])=>{const o=new T.Mesh(geometry,material);o.position.set(...position);o.castShadow=true;o.receiveShadow=true;parent.add(o);resources.add(geometry);return o};
 const cylinder=(p,r,h,m,pos,open=false,theta=Math.PI*2)=>mesh(p,new T.CylinderGeometry(r,r,h,48,1,open,0,theta),m,pos);
 let animate=()=>{};
 if(mode==='engine'||mode==='inspection'){
  const piston=group('piston','Pistão','O pistão se move no cilindro. A relação entre as peças é mostrada de forma simplificada.'),rod=group('rod','Biela','A biela transmite movimento entre pistão e virabrequim.'),crank=group('crank','Virabrequim','Transforma o movimento alternado em rotação. A geometria aqui é conceitual.');
  cylinder(piston,.52,.55,steel,[0,1.05,0]);for(const y of[.88,.99,1.12]){const ring=mesh(piston,new T.TorusGeometry(.525,.017,8,64),dark,[0,y,0]);ring.rotation.x=Math.PI/2;}cylinder(piston,.41,.03,dark,[0,1.34,0]);
  const shaft=cylinder(crank,.13,1.8,steel,[0,-.8,0]);shaft.rotation.x=Math.PI/2;const wheel=mesh(crank,new T.TorusGeometry(.55,.085,12,48),dark,[0,-.8,-.35]);const pin=cylinder(crank,.14,.8,steel,[.42,-.8,0]);pin.rotation.x=Math.PI/2;
  const arm=cylinder(rod,.085,1.3,steel,[0,.25,0]);const ends=[mesh(rod,new T.TorusGeometry(.16,.055,10,32),steel),mesh(rod,new T.TorusGeometry(.13,.045,10,32),steel)];
  animate=v=>{const a=v*Math.PI*2,x=Math.sin(a)*.42,y=-.8+Math.cos(a)*.42,top=.9+Math.cos(a)*.28;piston.position.y=top-1.05;pin.position.set(x,y,0);const start=new T.Vector3(x,y,0),end=new T.Vector3(0,top-.15,0),delta=end.clone().sub(start);arm.position.copy(start).add(end).multiplyScalar(.5);arm.scale.y=delta.length()/1.3;arm.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());ends[0].position.copy(start);ends[1].position.copy(end);wheel.rotation.z=a;};
 }else if(mode==='cooling'){
  const radiator=group('radiator','Radiador','A troca de calor participa do controle da temperatura de funcionamento.'),fan=group('fan','Ventilação','A ventilação auxilia a passagem de ar pelo conjunto, conforme o sistema do veículo.'),hose=group('hose','Conexões','Mangueiras e conexões precisam ser avaliadas quanto a vazamentos e condições de uso.');
  mesh(radiator,new T.BoxGeometry(2.25,1.6,.15),dark);for(let i=0;i<24;i++)mesh(radiator,new T.BoxGeometry(.023,1.5,.18),steel,[-1.03+i*.09,0,.03]);for(const x of[-1.2,1.2])mesh(radiator,new T.BoxGeometry(.2,1.8,.28),dark,[x,0,0]);
  fan.position.z=.45;const center=cylinder(fan,.16,.18,red,[0,0,0]);center.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const angle=i*Math.PI/4,blade=mesh(fan,new T.BoxGeometry(.62,.16,.04),steel,[Math.cos(angle)*.4,Math.sin(angle)*.4,0]);blade.rotation.set(.18,0,angle+.3)}
  for(const sign of[-1,1])mesh(hose,new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(sign*1.2,sign*.55,0),new T.Vector3(sign*1.65,sign*.55,.1),new T.Vector3(sign*1.65,sign*.9,.7)]),24,.09,10,false),dark);animate=v=>fan.rotation.z=v*Math.PI*2;
 }else{
  const housing=group('housing','Carcaça','A carcaça abriga o elemento. O corte é ampliado para facilitar a leitura.'),filter=group('filter','Elemento filtrante','O elemento retém partículas conforme sua aplicação e especificação.'),flow=group('flow','Circulação','As linhas de movimento mostram apenas um caminho conceitual, sem simular pressão real.');
  const shell=dark.clone();shell.side=T.DoubleSide;resources.add(shell);cylinder(housing,.73,1.65,shell,[0,0,0],true,Math.PI*1.35);cylinder(housing,.73,.08,red,[0,-.85,0]);cylinder(housing,.73,.07,steel,[0,.85,0]);
  cylinder(filter,.2,1.5,dark,[0,0,0]);for(let i=0;i<36;i++){const a=i*Math.PI/18,o=mesh(filter,new T.BoxGeometry(.24,1.45,.025),paper,[Math.cos(a)*.42,0,Math.sin(a)*.42]);o.rotation.y=-a;}
  const dots=[];for(let i=0;i<8;i++)dots.push(mesh(flow,new T.SphereGeometry(.033,10,8),red));animate=v=>dots.forEach((o,i)=>{const p=(v+i/8)%1;o.position.set(Math.cos(p*Math.PI*2)*.58,-.7+p*1.4,Math.sin(p*Math.PI*2)*.58)});
 }
 let selected=Object.keys(parts)[0],progress=0;animate(0);
 return {root,parts,get selected(){return selected},setProgress(v){progress=v;animate(v)},select(id){selected=id},metrics(){return{mode,selected,progress}},dispose(){resources.forEach(r=>r.dispose());root.removeFromParent()}};
}

export async function mountServiceScene(section,reduce){
 const mode=section.dataset.serviceScene,host=section.querySelector('.service-lab-canvas'),ui=section.querySelector('.service-lab-controls'),range=ui.querySelector('input'),play=ui.querySelector('.service-lab-play'),stage=section.querySelector('.service-lab-stage');
 const canvas=document.createElement('canvas'),context=canvas.getContext('webgl2',{antialias:matchMedia('(min-width:801px)').matches,powerPreference:'low-power'});if(!context)throw Error('No WebGL');
 const renderer=new T.WebGLRenderer({canvas,context,antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:800px)').matches?1.2:1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene();scene.background=new T.Color(0xe6e3dd);const camera=new T.PerspectiveCamera(35,1,.1,40),lesson=makeLesson(mode),assembly=new T.Group();assembly.add(lesson.root);scene.add(assembly);
 const bounds=new T.Box3().setFromObject(lesson.root),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());lesson.root.position.sub(center);const radius=Math.max(...size.toArray());camera.position.set(radius*.85,radius*.5,radius*1.9);camera.lookAt(0,0,0);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);room.dispose();scene.environment=environment.texture;scene.environmentIntensity=.8;
 const key=new T.DirectionalLight(0xfff6e7,2.2);key.position.set(3,5,4);scene.add(key,new T.HemisphereLight(0xffffff,0x8c887f,1.4));const rim=new T.DirectionalLight(0xffffff,1.5);rim.position.set(-3,2,-2);scene.add(rim);
 host.hidden=false;host.append(canvas);canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Ilustração 3D de '+section.closest('main').querySelector('h1').textContent+'. Arraste ou use as setas para girar.');
 const controls=new OrbitControls(camera,canvas);controls.enableZoom=false;controls.enablePan=false;controls.enableDamping=!reduce.matches;controls.dampingFactor=.16;controls.rotateSpeed=.45;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI*.8;
 let raf=0,visible=false,disposed=false,last=0,frames=0,demonstration=0,ambientUntil=0,progress=0;
 const request=()=>{if(!raf&&!disposed&&visible&&!document.hidden)raf=requestAnimationFrame(render)};
 function render(now){raf=0;if(disposed||!visible||document.hidden)return;if(now-last<1000/30-1){request();return}last=now;let animating=false;
  if(demonstration){progress=Math.min(1,(now-demonstration)/2600);lesson.setProgress(progress);range.value=Math.round(progress*100);if(mode==='brakes')lesson.parts.disc.object.rotation.z=(1-(1-progress)**3)*Math.PI*2;if(progress<1)animating=true;else{demonstration=0;setLabel(play,'Demonstrar novamente',icons.refresh);}}
  if(now<ambientUntil&&!reduce.matches){assembly.rotation.y=Math.sin((now-(ambientUntil-5000))/5000*Math.PI)*.08;if(mode==='brakes')lesson.parts.disc.object.rotation.z+=.005;animating=true;}
  const moving=controls.update();renderer.render(scene,camera);frames++;if(animating||moving)request();
 }
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();request()}
 const ro=new ResizeObserver(resize);ro.observe(host);resize();
 const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){if(!frames&&!reduce.matches)ambientUntil=performance.now()+5000;request()}else{cancelAnimationFrame(raf);raf=0}});io.observe(host);
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else request()};document.addEventListener('visibilitychange',visibility);
 const motionChange=()=>{controls.enableDamping=!reduce.matches;if(reduce.matches){ambientUntil=0;demonstration=0;setLabel(play,'Demonstrar movimento',icons.refresh);request()}};reduce.addEventListener('change',motionChange);
 controls.addEventListener('change',request);controls.addEventListener('start',()=>{ambientUntil=0;demonstration=0;request()});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();ambientUntil=0;assembly.rotation[e.key==='ArrowLeft'||e.key==='ArrowRight'?'y':'x']+=(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)*.12;request()});
 const partUI=ui.querySelector('.service-lab-parts'),explanation=ui.querySelector('.service-lab-explanation');
 function choose(id){lesson.select(id);explanation.textContent=lesson.parts[id].description;for(const b of partUI.children)b.setAttribute('aria-pressed',String(b.dataset.part===id));request()}
 for(const [id,part]of Object.entries(lesson.parts)){const button=document.createElement('button');button.type='button';button.dataset.part=id;button.textContent=part.label;button.addEventListener('click',()=>choose(id));partUI.append(button)}choose(mode==='diagnostic'?'sensor':Object.keys(lesson.parts)[0]);
 range.addEventListener('input',()=>{ambientUntil=0;demonstration=0;progress=Number(range.value)/100;lesson.setProgress(progress);request()});
 play.addEventListener('click',()=>{ambientUntil=0;if(reduce.matches){progress=progress<.5?1:0;lesson.setProgress(progress);range.value=progress*100;request();return}demonstration=performance.now();play.textContent='Demonstrando…';request()});
 ui.hidden=false;section.classList.add('is-ready');stage.diagnosticsMetrics=()=>({mode,frames,visible,progress,components:Object.keys(lesson.parts),camera:camera.position.toArray(),...lesson.metrics()});
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',visibility);reduce.removeEventListener('change',motionChange);controls.dispose();lesson.dispose();environment.dispose();pmrem.dispose();renderer.dispose();canvas.remove()}
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();dispose();section.classList.remove('is-ready');ui.hidden=true;section.querySelector('.service-lab-status').textContent='FOTOGRAFIA E INFORMAÇÕES DISPONÍVEIS'});
 return {dispose};
}
