import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {inspectCapabilities} from './capabilities.js';

// All vehicle geometry comes from the existing GLB. Only the lighting set is procedural.
export async function createViewer({host,config,reduce,onProgress,onProject,onPartChange,onState,onFailure}) {
  if(!config.approved||!config.modelUrl||!config.source||!config.author)throw new Error('Missing reviewed vehicle');
  const mobile=matchMedia('(max-width:800px)').matches,saveData=!!navigator.connection?.saveData;
  const canvas=document.createElement('canvas');
  const context=canvas.getContext('webgl2',{alpha:false,antialias:!mobile,powerPreference:mobile?'low-power':'high-performance'});
  if(!context)throw new Error('WebGL unavailable');
  const renderer=new THREE.WebGLRenderer({canvas,context});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  const scene=new THREE.Scene();scene.background=new THREE.Color(config.background??0x08090a);scene.fog=new THREE.Fog(config.background??0x08090a,15,36);
  const camera=new THREE.PerspectiveCamera(32,1,.08,60);
  const assetUrl=path=>new URL('../'+path,import.meta.url).href;
  const decoder=new DRACOLoader().setDecoderPath(assetUrl(config.decoderPath)).setWorkerLimit(mobile?1:2);
  const loader=new GLTFLoader().setDRACOLoader(decoder).setMeshoptDecoder(MeshoptDecoder),pmrem=new THREE.PMREMGenerator(renderer);
  const vehicle=new THREE.Group();scene.add(vehicle);
  const resources=new Set(),animations=new Map(),openParts=new Map(),fades=new Map(),revealed=new Set(),anchorCache=new Map();
  const raycaster=new THREE.Raycaster(),home={target:new THREE.Vector3(),position:new THREE.Vector3()};
  let model,environment,controls,resize,observer,composer,bokeh,postEnabled=false,capabilities={parts:{},systems:{}};
  let disposed=false,raf=0,visible=true,needsFrame=true,frames=0,lastFrame=0,lastProjection=0,slowFrames=0;
  let active='overview',cameraTween=null,lastState='',hover=false,manual=false,scrollProgress=.5,demo=null,technicalLight=null,lightTarget=0;
  let autoEnabled=!mobile&&!reduce.matches&&!saveData,idleTimer=0,idleUntil=0,lastInput=0,loadMs=0,entranceUntil=0,pointerActive=false;
  const pointerAim=new THREE.Vector2(),pointerValue=new THREE.Vector2();
  const started=performance.now(),ease=window.gsap?.parseEase('power2.inOut')||((t)=>t*t*(3-2*t));
  const resource=item=>{resources.add(item);return item;};
  const isVisible=()=>{const r=host.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
  const busy=()=>!!cameraTween||animations.size>0||fades.size>0||!!demo;
  function notify(){const s={kind:'vehicle',mode:active,busy:busy(),animating:[...animations.keys()],autoRotate:autoEnabled};const key=JSON.stringify(s);if(key!==lastState){lastState=key;onState?.(s);}}
  function invalidate(){if(disposed)return;needsFrame=true;visible=isVisible();if(visible&&!document.hidden&&!raf)raf=requestAnimationFrame(render);}
  function stopIdle(){clearTimeout(idleTimer);idleTimer=0;idleUntil=0;if(controls)controls.autoRotate=false;}
  function scheduleIdle(){
    stopIdle();if(disposed||!autoEnabled||reduce.matches||hover||active!=='overview'||document.hidden||!visible)return;
    // One slow six-second arc, then demand rendering while the visitor reads.
    idleTimer=setTimeout(()=>{if(disposed||busy()||hover||!isVisible()||document.hidden)return;idleUntil=performance.now()+6000;invalidate();},5000);
  }
  function viewportChange(){const next=isVisible()&&!document.hidden;if(next&&!visible){visible=true;invalidate();scheduleIdle();}else if(!next){visible=false;cancelAnimationFrame(raf);raf=0;stopIdle();}}
  function fadeObject(object,hidden){
    const list=[];object.traverse(o=>{if(o.isMesh)list.push(...(Array.isArray(o.material)?o.material:[o.material]));});
    const entries=[...new Set(list)].map(m=>({m,from:m.opacity,to:hidden?0:m.userData.originalOpacity}));object.visible=true;
    for(const {m}of entries){m.transparent=true;m.depthWrite=false;}
    fades.set(object,{entries,hidden,start:performance.now(),duration:reduce.matches?0:650});if(hidden)revealed.add(object);else revealed.delete(object);
  }
  function reveal(names=[]){const desired=new Set(names.map(n=>model.getObjectByName(n)).filter(Boolean));for(const o of [...revealed])if(!desired.has(o))fadeObject(o,false);for(const o of desired)if(!revealed.has(o))fadeObject(o,true);}
  function scope(mode){controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=.18;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=mode==='overview'?3:1.6;if(mode==='engine'){controls.minPolarAngle=.25;controls.maxPolarAngle=1.13;controls.minDistance=2.2;}}
  function cameraTo(position,target,duration=1250){
    stopIdle();const from=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)),to=new THREE.Spherical().setFromVector3(position.clone().sub(target));
    to.theta=from.theta+Math.atan2(Math.sin(to.theta-from.theta),Math.cos(to.theta-from.theta));
    cameraTween={from,to,fromTarget:controls.target.clone(),target:target.clone(),start:performance.now(),duration:reduce.matches?0:duration};notify();invalidate();
  }
  function setPart(key,open,delay=0){
    const p=capabilities.parts[key];if(!p||openParts.get(key)===open)return;
    openParts.set(key,open);onPartChange?.(key,open);
    animations.set(key,{p,from:p.object.rotation[p.axis],to:p.closedAngle+(open?p.angle:0),start:performance.now()+(reduce.matches?0:delay),duration:reduce.matches?0:1050});notify();invalidate();
  }
  function resetDemo(){
    if(!demo)return;demo.object.rotation.copy(demo.rotation);demo.object.scale.copy(demo.scale);demo=null;
  }
  function select(mode){
    if(mode!=='overview'&&!capabilities.systems[mode])return false;
    resetDemo();active=mode;manual=false;const system=capabilities.systems[mode];scope(mode);
    for(const key of Object.keys(capabilities.parts))setPart(key,key===system?.openPart,system?.openPart===key?0:200);
    reveal(system?.reveal);
    lightTarget=['engine','brakes','suspension'].includes(mode)?.9:0;
    if(system&&technicalLight){const center=new THREE.Box3().setFromObject(system.object).getCenter(new THREE.Vector3());technicalLight.position.copy(center).add(new THREE.Vector3(1.4,1.3,1.6));}
    if(!reduce.matches&&['brakes','suspension'].includes(mode)){
      const object=model.getObjectByName(mode==='brakes'?'DiscLF':'SpringLF');
      if(object)demo={mode,object,rotation:object.rotation.clone(),scale:object.scale.clone(),start:performance.now()+350,duration:1050};
    }
    if(!system)cameraTo(home.position,home.target);
    else {const target=new THREE.Box3().setFromObject(system.object).getCenter(new THREE.Vector3());if(mode==='engine')target.y+=.3;if(system.context){target.copy(home.target);if(mode==='transmission')target.y-=.15;}const offset=new THREE.Vector3(...system.cameraOffset).multiplyScalar(mobile&&!system.context?1.1:1);cameraTo(target.clone().add(offset),target);}
    notify();return true;
  }
  function reset(){return select('overview');}
  function beginInput(){manual=true;lastInput=performance.now();stopIdle();cameraTween=null;notify();invalidate();}
  function keyControl(event){
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key))return;event.preventDefault();beginInput();
    const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(event.key==='ArrowLeft')s.theta-=.10;if(event.key==='ArrowRight')s.theta+=.10;if(event.key==='ArrowUp')s.phi-=.08;if(event.key==='ArrowDown')s.phi+=.08;
    if(event.key==='+'||event.key==='=')s.radius*=.92;if(event.key==='-')s.radius*=1.08;
    s.radius=THREE.MathUtils.clamp(s.radius,controls.minDistance,controls.maxDistance);s.phi=THREE.MathUtils.clamp(s.phi,controls.minPolarAngle,controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();scheduleIdle();
  }
  function wheelGuard(event){if(!event.ctrlKey&&document.activeElement!==canvas)event.stopImmediatePropagation();}
  function enter(){hover=true;stopIdle();invalidate();}function leave(){hover=false;scheduleIdle();}
  function motionChange(){controls.enableDamping=!reduce.matches;if(reduce.matches){stopIdle();autoEnabled=false;pointerActive=false;entranceUntil=0;scene.environmentIntensity=.5;if(cameraTween)cameraTween.duration=0;for(const a of animations.values())a.duration=0;for(const a of fades.values())a.duration=0;resetDemo();}notify();invalidate();}
  function contextLost(event){event.preventDefault();dispose();onFailure?.();}
  function project(now){
    if(!onProject||now-lastProjection<180)return;lastProjection=now;
    const w=host.clientWidth,h=host.clientHeight,points={};
    const specs=active==='overview'?[['engine','Hood','Motor'],['brakes','WheelLF','Freios'],['interior','DoorLF','Interior']]:[[active,capabilities.systems[active]?.anchor,capabilities.systems[active]?.label]];
    for(const [key,name,label]of specs){
      if(!name||capabilities.systems[key]?.context)continue;const object=model.getObjectByName(name);if(!object)continue;
      let b=anchorCache.get(name);if(!b){b=new THREE.Box3().setFromObject(object);anchorCache.set(name,b);}if(['Hood','DoorLF'].includes(name))b.setFromObject(object);
      const world=b.getCenter(new THREE.Vector3());if(name==='Engine')world.y=b.max.y;
      const ndc=world.clone().project(camera),x=(ndc.x*.5+.5)*w,y=(-ndc.y*.5+.5)*h;
      let shown=ndc.z>-1&&ndc.z<1&&x>30&&x<w-30&&y>50&&y<h-55;
      if(shown&&(hover||active!=='overview')){
        raycaster.setFromCamera(new THREE.Vector2(ndc.x,ndc.y),camera);
        const hit=raycaster.intersectObject(vehicle,true).find(hit=>{let n=hit.object;while(n){if(!n.visible)return false;n=n.parent;}return true;});
        if(hit){let n=hit.object,own=false;while(n){if(n===object)own=true;n=n.parent;}shown=own||hit.distance>=camera.position.distanceTo(world)-.16;}
      }
      points[key]={x,y,visible:shown,label,side:x>w*.58?'left':'right'};
    }onProject(points);
  }
  function render(now){
    raf=0;if(disposed||!visible||document.hidden)return;const interval=1000/(mobile?30:60);
    if(now-lastFrame<interval-1){raf=requestAnimationFrame(render);return;}
    const delta=lastFrame?Math.min((now-lastFrame)/1000,.05):1/60,gap=lastFrame?now-lastFrame:interval;lastFrame=now;let changing=false;
    if(cameraTween){const t=cameraTween.duration?Math.min(1,(now-cameraTween.start)/cameraTween.duration):1,e=ease(t),{from,to,fromTarget,target}=cameraTween;
      controls.target.lerpVectors(fromTarget,target,e);const s=new THREE.Spherical(THREE.MathUtils.lerp(from.radius,to.radius,e),THREE.MathUtils.lerp(from.phi,to.phi,e),THREE.MathUtils.lerp(from.theta,to.theta,e));camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));changing=true;if(t===1){cameraTween=null;scheduleIdle();}}
    for(const [key,a]of animations){const t=a.duration?THREE.MathUtils.clamp((now-a.start)/a.duration,0,1):1;a.p.object.rotation[a.p.axis]=THREE.MathUtils.lerp(a.from,a.to,ease(t));changing=true;renderer.shadowMap.needsUpdate=true;if(t===1)animations.delete(key);}
    for(const [o,a]of fades){const t=a.duration?Math.min(1,(now-a.start)/a.duration):1;for(const {m,from,to}of a.entries)m.opacity=THREE.MathUtils.lerp(from,to,ease(t));changing=true;renderer.shadowMap.needsUpdate=true;if(t===1){o.visible=!a.hidden;for(const {m}of a.entries){m.transparent=m.userData.originalTransparent;m.depthWrite=m.userData.originalDepthWrite;}fades.delete(o);}}
    if(demo){const t=THREE.MathUtils.clamp((now-demo.start)/demo.duration,0,1);if(demo.mode==='brakes')demo.object.rotation.x=demo.rotation.x+Math.PI*2*(1-(1-t)**3);else demo.object.scale.y=demo.scale.y*(1-.065*Math.sin(t*Math.PI)**2);changing=true;renderer.shadowMap.needsUpdate=true;if(t===1)resetDemo();}
    if(technicalLight&&Math.abs(technicalLight.intensity-lightTarget)>.005){technicalLight.intensity=reduce.matches?lightTarget:THREE.MathUtils.damp(technicalLight.intensity,lightTarget,5,delta);changing=true;}
    if(entranceUntil){scene.environmentIntensity=.35+.15*THREE.MathUtils.clamp(1-(entranceUntil-now)/2400,0,1);changing=true;if(now>=entranceUntil)entranceUntil=0;}
    if(pointerActive&&!manual&&!busy()&&active==='overview'&&!reduce.matches){
      pointerValue.lerp(pointerAim,1-Math.exp(-delta*4));const offset=home.position.clone().sub(home.target).applyAxisAngle(new THREE.Vector3(0,1,0),pointerValue.x*.035);offset.y+=pointerValue.y*.07;
      camera.position.copy(home.target).add(offset);controls.target.copy(home.target);scene.environmentRotation.y=pointerValue.x*.025;
      changing=true;if(pointerValue.distanceTo(pointerAim)<.001){pointerActive=false;}
    }
    controls.autoRotate=autoEnabled&&!reduce.matches&&!hover&&!busy()&&active==='overview'&&idleUntil>now;
    const damping=controls.update(delta);
    if(needsFrame||changing||damping||controls.autoRotate){
      renderer.info.reset();
      // Inspection views stay sharp. The establishing views have restrained
      // bloom and depth of field, disabled on small/limited devices.
      if(postEnabled&&!reduce.matches&&['overview','electrical','transmission'].includes(active)){bokeh.uniforms.focus.value=camera.position.distanceTo(controls.target);composer.render(delta);}else renderer.render(scene,camera);
      project(now);frames++;needsFrame=false;
    }
    if(gap>interval*1.8&&(changing||now-lastInput<800))slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>25){if(postEnabled)postEnabled=false;else if(renderer.getPixelRatio()>1){renderer.setPixelRatio(Math.max(1,renderer.getPixelRatio()-.2));composer?.setPixelRatio(renderer.getPixelRatio());}slowFrames=0;needsFrame=true;}
    notify();if((changing||damping||needsFrame||controls.autoRotate)&&!raf)raf=requestAnimationFrame(render);
  }
  function addRoom(){
    const floor=new THREE.Mesh(resource(new THREE.PlaneGeometry(40,40)),resource(new THREE.MeshStandardMaterial({color:0x030405,roughness:.94,metalness:0})));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
    const wall=new THREE.Mesh(resource(new THREE.PlaneGeometry(40,9)),resource(new THREE.MeshStandardMaterial({color:0x070809,roughness:.9})));wall.position.set(0,4.45,-7);scene.add(wall);
    const railMaterial=resource(new THREE.MeshBasicMaterial({color:0xd7193f,transparent:true,opacity:.3}));
    for(const x of [-2.15,2.15]){const rail=new THREE.Mesh(resource(new THREE.PlaneGeometry(.014,7)),railMaterial);rail.rotation.x=-Math.PI/2;rail.position.set(x,-.008,0);scene.add(rail);}
    const panelMaterial=resource(new THREE.MeshBasicMaterial({color:0x777b80}));
    for(const x of [-4.5,0,4.5]){const strip=new THREE.Mesh(resource(new THREE.PlaneGeometry(2.6,.035)),panelMaterial);strip.position.set(x,3.1,-6.98);scene.add(strip);const seam=new THREE.Mesh(resource(new THREE.PlaneGeometry(.012,6)),resource(new THREE.MeshBasicMaterial({color:0x1b1d20})));seam.position.set(x,3,-6.96);scene.add(seam);}
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
    const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,15,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.7)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const contact=new THREE.Mesh(resource(new THREE.PlaneGeometry(3.4,6)),resource(new THREE.MeshBasicMaterial({map:resource(new THREE.CanvasTexture(shadowCanvas)),transparent:true,depthWrite:false})));contact.rotation.x=-Math.PI/2;contact.position.y=-.005;scene.add(contact);
    const key=new THREE.DirectionalLight(0xfff5e8,1.8);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.5,far:22});key.shadow.bias=-.0003;key.shadow.normalBias=.02;key.shadow.radius=3;scene.add(key);
    const fill=new THREE.DirectionalLight(0xffffff,1);fill.position.set(4,4,-3);scene.add(fill);
    const rim=new THREE.DirectionalLight(0xffffff,.9);rim.position.set(-4,3,-4);scene.add(rim);
    const red=new THREE.PointLight(0xd7193f,1.1,7,2);red.position.set(-2.5,.18,-.8);scene.add(red);scene.add(new THREE.HemisphereLight(0xeeeeee,0x101012,.45));
    technicalLight=new THREE.PointLight(0xf4f2ee,0,5,2);scene.add(technicalLight);
  }
  function dispose(){
    if(disposed)return;disposed=true;stopIdle();cancelAnimationFrame(raf);resize?.disconnect();observer?.disconnect();controls?.dispose();decoder.dispose();
    window.removeEventListener('scroll',viewportChange);window.removeEventListener('resize',viewportChange);document.removeEventListener('visibilitychange',viewportChange);reduce.removeEventListener('change',motionChange);
    canvas.removeEventListener('keydown',keyControl);canvas.removeEventListener('wheel',wheelGuard,true);canvas.removeEventListener('pointerenter',enter);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('webglcontextlost',contextLost);
    scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.isLight)o.dispose?.();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v);}});
    resources.forEach(r=>r.dispose?.());composer?.passes.forEach(p=>p.dispose?.());composer?.dispose();environment?.dispose();pmrem.dispose();renderer.dispose();canvas.remove();
  }
  try {
    const gltf=await loader.loadAsync(assetUrl(mobile||saveData?config.mobileModelUrl:config.modelUrl),e=>onProgress?.(e.total?Math.round(e.loaded/e.total*100):null));model=gltf.scene;vehicle.add(model);
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());if(!Number.isFinite(size.length())||!size.length())throw new Error('Empty vehicle');
    model.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));vehicle.scale.setScalar(4.8/Math.max(size.x,size.y,size.z));vehicle.rotation.y=config.yaw;vehicle.updateMatrixWorld(true);
    model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=false;o.material=(Array.isArray(o.material)?o.material:[o.material]).map(original=>{
      resource(original);let m=original.clone();if(config.paintMaterials?.includes(original.name)){m=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(m,original);m.color.set(0x111315);m.metalness=.35;m.roughness=.47;m.clearcoat=.9;m.clearcoatRoughness=.32;}
      m.userData={...m.userData,originalOpacity:m.opacity,originalTransparent:m.transparent,originalDepthWrite:m.depthWrite};return resource(m);
    });if(o.material.length===1)o.material=o.material[0];});
    capabilities=inspectCapabilities(model,config);for(const key of Object.keys(capabilities.parts))openParts.set(key,false);
    const texture=await new RGBELoader().loadAsync(assetUrl(config.environmentUrl));environment=pmrem.fromEquirectangular(texture);texture.dispose();scene.environment=environment.texture;scene.environmentIntensity=.5;addRoom();
    if(!mobile&&!saveData&&!reduce.matches&&(navigator.hardwareConcurrency||4)>=4&&renderer.extensions.has('EXT_color_buffer_float')){
      const [{EffectComposer},{RenderPass},{UnrealBloomPass},{BokehPass},{OutputPass}]=await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'),import('three/addons/postprocessing/RenderPass.js'),import('three/addons/postprocessing/UnrealBloomPass.js'),import('three/addons/postprocessing/BokehPass.js'),import('three/addons/postprocessing/OutputPass.js')
      ]);
      composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
      bokeh=new BokehPass(scene,camera,{focus:8,aperture:.00012,maxblur:.0012});composer.addPass(bokeh);
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(512,256),.08,.2,1.35));composer.addPass(new OutputPass());postEnabled=true;
    }
    renderer.info.autoReset=false;
    canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',config.expectedVehicle+'. Arraste horizontalmente ou use as setas para girar. Use mais e menos para aproximar. Escape restaura.');host.append(canvas);
    canvas.addEventListener('wheel',wheelGuard,{capture:true,passive:true});controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=!reduce.matches;controls.dampingFactor=mobile?.18:.12;controls.rotateSpeed=.45;controls.zoomSpeed=.55;controls.autoRotateSpeed=.25;canvas.style.touchAction='pan-y';scope('overview');
    const carBounds=new THREE.Box3().setFromObject(vehicle);home.target.copy(carBounds.getCenter(new THREE.Vector3()));home.target.y-=.12;let lastWidth=0,lastHeight=0;
    function fit(){
      const w=host.clientWidth,h=host.clientHeight;if(!w||!h||w===lastWidth&&h===lastHeight)return;lastWidth=w;lastHeight=h;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);composer?.setSize(w,h);
      const direction=new THREE.Vector3(1.45,.4,1.3).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right);
      const vtan=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),htan=vtan*camera.aspect;let distance=0;
      for(const x of [carBounds.min.x,carBounds.max.x])for(const y of [carBounds.min.y,carBounds.max.y])for(const z of [carBounds.min.z,carBounds.max.z]){const v=new THREE.Vector3(x,y,z).sub(home.target),depth=v.dot(direction);distance=Math.max(distance,Math.abs(v.dot(right))/htan+depth,Math.abs(v.dot(up))/vtan+depth);}
      distance*=mobile?1.06:.94;home.position.copy(home.target).addScaledVector(direction,distance);controls.maxDistance=Math.max(14,distance*1.5);if(active==='overview'&&!manual){cameraTween=null;camera.position.copy(home.position);controls.target.copy(home.target);}invalidate();
    }
    fit();resize=new ResizeObserver(fit);resize.observe(host);observer=new IntersectionObserver(viewportChange);observer.observe(host);
    controls.addEventListener('start',beginInput);controls.addEventListener('end',scheduleIdle);controls.addEventListener('change',invalidate);
    canvas.addEventListener('keydown',keyControl);canvas.addEventListener('pointerenter',enter);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('webglcontextlost',contextLost);
    window.addEventListener('scroll',viewportChange,{passive:true});window.addEventListener('resize',viewportChange,{passive:true});document.addEventListener('visibilitychange',viewportChange);reduce.addEventListener('change',motionChange);
    renderer.shadowMap.needsUpdate=true;loadMs=performance.now()-started;notify();invalidate();scheduleIdle();
    return {capabilities,select,reset,invalidate,dispose,
      enter(){if(reduce.matches)return;active='overview';manual=false;camera.position.copy(home.target).add(home.position.clone().sub(home.target).multiplyScalar(1.12));controls.target.copy(home.target);entranceUntil=performance.now()+2400;cameraTo(home.position,home.target,2400);},
      setPointerPosition(x,y){if(reduce.matches||manual||active!=='overview'||cameraTween)return;stopIdle();pointerAim.set(THREE.MathUtils.clamp(x,-1,1),THREE.MathUtils.clamp(y,-1,1));pointerActive=true;invalidate();},
      dive(){if(reduce.matches)return Promise.resolve();manual=true;pointerActive=false;stopIdle();cameraTo(home.target.clone().add(home.position.clone().sub(home.target).multiplyScalar(.72)),home.target,620);return new Promise(resolve=>setTimeout(resolve,650));},
      togglePart(key){if(!capabilities.parts[key])return;stopIdle();resetDemo();lightTarget=0;manual=true;const opening=!openParts.get(key);if(key==='hood'&&opening){select('engine');return;}active='overview';scope('overview');reveal([]);cameraTo(home.position,home.target);setPart(key,opening,opening?0:200);notify();},
      setAutoRotate(value){autoEnabled=!!value&&!reduce.matches&&!saveData;scheduleIdle();notify();},
      setScrollProgress(value){scrollProgress=value;if(manual||active!=='overview'||busy()||reduce.matches||!visible)return;stopIdle();const offset=home.position.clone().sub(home.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),(value-.5)*.12);camera.position.copy(home.target).add(offset);controls.target.copy(home.target);invalidate();scheduleIdle();},
      getMetrics(){return {kind:'vehicle',active,busy:busy(),animating:[...animations.keys()],renderedFrames:frames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,memory:{...renderer.info.memory},dpr:renderer.getPixelRatio(),mobile,visible,autoRotate:autoEnabled,idleActive:!!controls.autoRotate,loadMs,camera:camera.position.toArray(),target:controls.target.toArray(),scrollProgress,vehicleVisible:vehicle.visible,hidden:[...revealed].map(o=>o.name),demonstration:demo?.mode||null,discAngle:model.getObjectByName('DiscLF')?.rotation.x,springScale:model.getObjectByName('SpringLF')?.scale.y,parts:Object.fromEntries(Object.entries(capabilities.parts).map(([key,p])=>[key,{open:!!openParts.get(key),angle:p.object.rotation[p.axis],hinge:p.object.getWorldPosition(new THREE.Vector3()).toArray()}]))};}
    };
  }catch(error){dispose();throw error;}
}
