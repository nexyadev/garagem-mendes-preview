import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
// Architectural set only. Vehicle geometry and working parts remain in the audited GLB.
export async function createJourneyWorld(scene,{mobile}){
 const loader=new THREE.TextureLoader(),url=name=>'/garagem-mendes-preview/assets/textures/journey/'+name;
 const textures=await Promise.allSettled([
  'asphalt_02-Diffuse.webp','asphalt_02-nor_gl.webp','asphalt_02-Rough.webp','concrete_wall_006-Diffuse.webp','concrete_wall_006-nor_gl.webp'
 ].map(n=>loader.loadAsync(url(n))).concat(loader.loadAsync('/garagem-mendes-preview/assets/images/logo-garagem-mendes.png')));
 const failed=textures.find(r=>r.status==='rejected');if(failed){for(const r of textures)if(r.status==='fulfilled')r.value.dispose();throw failed.reason;}
 const [asphalt,normal,rough,concrete,concreteNormal,logo]=textures.map(r=>r.value);
 asphalt.colorSpace=concrete.colorSpace=logo.colorSpace=THREE.SRGBColorSpace;
 for(const t of [asphalt,normal,rough]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,30);t.anisotropy=mobile?2:4;}
 for(const t of [concrete,concreteNormal]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,2);t.anisotropy=2;}
 const root=new THREE.Group();root.name='Illustrative architecture';scene.add(root);
 const material=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const wall=new THREE.MeshStandardMaterial({map:concrete,normalMap:concreteNormal,normalScale:new THREE.Vector2(.3,.3),color:0x999b98,roughness:.8});
 const steel=material(0x22292c,.35,.65),silver=material(0x8b9393,.45,.7),dark=material(0x182025,.65),rubber=material(0x101316,.9);
 const glow=new THREE.MeshBasicMaterial({color:0xe9f1f2,toneMapped:false}),warmGlow=new THREE.MeshBasicMaterial({color:0xffddae,toneMapped:false});
 function box(w,h,d,x,y,z,mat=wall,parent=root){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;parent.add(o);return o;}
 function cylinder(r,h,x,y,z,mat=steel){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),mat);o.position.set(x,y,z);root.add(o);return o;}
 const road=new THREE.Mesh(new THREE.PlaneGeometry(36,90),new THREE.MeshPhysicalMaterial({map:asphalt,normalMap:normal,normalScale:new THREE.Vector2(.18,.18),roughnessMap:rough,roughness:.55,color:0x656c70,metalness:.08,clearcoat:.75,clearcoatRoughness:.23}));road.rotation.x=-Math.PI/2;road.position.set(0,-.035,-13);road.receiveShadow=true;root.add(road);
 // A restrained, rough planar reflection on desktop. Mobile keeps the PBR/HDR reflection.
 let reflection=null;
 if(!mobile){
  const shader={...Reflector.ReflectorShader,uniforms:{...Reflector.ReflectorShader.uniforms,tRough:{value:rough}},vertexShader:Reflector.ReflectorShader.vertexShader.replace('void main() {','varying vec2 vRoad;\nvoid main() { vRoad = uv * vec2(12.0,30.0);'),fragmentShader:Reflector.ReflectorShader.fragmentShader.replace('uniform vec3 color;','uniform vec3 color; uniform sampler2D tRough; varying vec2 vRoad;').replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec2 p=vUv.xy/vUv.w; vec2 d=vec2(.002,.004); vec4 base=texture2D(tDiffuse,p)*.4+(texture2D(tDiffuse,p+d)+texture2D(tDiffuse,p-d)+texture2D(tDiffuse,p+vec2(d.x,-d.y))+texture2D(tDiffuse,p+vec2(-d.x,d.y)))*.15;').replace('1.0 );','1.0 );').replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay( base.rgb, color ), .19 * (1.0-texture2D(tRough,vRoad).r*.6) )')};
  reflection=new Reflector(new THREE.PlaneGeometry(36,90),{textureWidth:512,textureHeight:256,color:0x8b8f91,clipBias:.003,multisample:0,shader});reflection.rotation.x=-Math.PI/2;reflection.position.set(0,-.03,-13);reflection.material.transparent=true;reflection.material.depthWrite=false;root.add(reflection);
 }
 const curbMat=material(0x5f6566,.85),mark=material(0xa5a79e,.85);
 for(const x of [-6,6]){
  box(.25,.2,60,x,.04,-25,curbMat);box(2.8,.15,60,x+Math.sign(x)*1.55,.015,-25,wall);
  box(.055,.008,45,x-Math.sign(x)*.45,-.02,-23,mark);
  for(const z of [-38,-26,-14]){
   const post=x+Math.sign(x)*.65;cylinder(.055,5.6,post,2.8,z);box(.85,.08,.2,post-Math.sign(x)*.34,5.55,z,steel);box(.58,.012,.15,post-Math.sign(x)*.4,5.50,z,warmGlow);
   const light=new THREE.SpotLight(0xffc38c,45,18,.85,.7,2);light.position.set(post,5.4,z);light.target.position.set(x/2,0,z+1);root.add(light,light.target);
   box(.35,.01,.8,x-Math.sign(x)*.4,-.018,z+2,steel);for(let j=0;j<7;j++)box(.32,.012,.02,x-Math.sign(x)*.4,-.01,z+1.65+j*.1,silver);
  }
 }
 // A wide real-scale service bay: shutter at z=6, car stops at z=15.
 const garage=new THREE.Group();garage.name='Garagem Mendes illustrative workshop';root.add(garage);
 const floorTexture=concrete.clone();floorTexture.repeat.set(4,5);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,20),new THREE.MeshPhysicalMaterial({map:floorTexture,color:0x8c9393,roughness:.55,metalness:.05,clearcoat:.2,normalMap:concreteNormal,normalScale:new THREE.Vector2(.06,.06)}));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.027,16);floor.receiveShadow=true;garage.add(floor);
 box(18,6,.3,0,3,26,wall,garage);box(.3,6,20,-9,3,16,wall,garage);box(.3,6,20,9,3,16,wall,garage);box(18,.2,20,0,5.7,16,dark,garage);
 box(5.1,5.2,.5,-6.55,2.6,6,wall,garage);box(5.1,5.2,.5,6.55,2.6,6,wall,garage);box(8,1.25,.65,0,4.85,6,dark,garage);
 box(.18,4.4,.22,-4,2.2,5.72,silver,garage);box(.18,4.4,.22,4,2.2,5.72,silver,garage);
 for(const x of [-8.5,-4.5,4.5,8.5])box(.12,6,.15,x,3,25.72,steel,garage);
 for(const z of [8,14,20,25]){
  box(18,.15,.15,0,5.5,z,steel,garage);
  for(const x of [-3.3,3.3]){box(.16,.08,3.5,x,4.8,z-1,silver,garage);box(.12,.015,3.35,x,4.75,z-1,glow,garage);}
 }
 const shutter=new THREE.Group();shutter.name='Sectional entrance';garage.add(shutter);
 for(let i=0;i<13;i++){box(7.85,.32,.09,0,.165+i*.327,5.95,silver,shutter);box(7.78,.009,.012,0,.025+i*.327,5.89,dark,shutter);}
 const logoMat=new THREE.MeshBasicMaterial({map:logo,transparent:true,depthWrite:false,toneMapped:false});logo.repeat.set(1,.32);logo.offset.set(0,.34);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.4),logoMat);sign.rotation.y=Math.PI;sign.position.set(0,4.86,5.65);garage.add(sign);
 box(.06,1.65,5.1,-8.8,2.9,15,dark,garage);const insideSign=sign.clone();insideSign.geometry=new THREE.PlaneGeometry(4.4,1.4);insideSign.rotation.y=Math.PI/2;insideSign.position.set(-8.75,2.9,15);garage.add(insideSign);
 // Human-scale fixtures, tool storage and an inactive lift in the adjacent bay.
 const chest=material(0x6b1724,.45,.35),handle=material(0xb8bcba,.4,.75);
 for(const x of [-6,6]){
  box(2.3,1.05,.65,x,.525,25.3,chest,garage);box(2.38,.07,.75,x,1.08,25.3,steel,garage);
  for(let j=0;j<5;j++)box(2.07,.018,.035,x,.18+j*.17,24.95,handle,garage);
  box(2.3,1.3,.04,x,2.1,25.79,dark,garage);
  for(let j=0;j<9;j++){box(.025,.25+j%3*.06,.04,x-.9+j*.22,2.15,25.73,handle,garage);}
 }
 for(const x of [-7.8,-4.5]){box(.27,2.8,.33,x,1.4,18,steel,garage);box(.48,.1,.55,x,.05,18,silver,garage);box(1.4,.12,.15,x+(x<-6?.65:-.65),.19,18,steel,garage);}
 for(const x of [-2.3,2.3]){box(.025,.007,6,x,-.018,15,mark,garage);}
 for(const z of [9,15,21])box(17,.003,.015,0,-.02,z,material(0x656b6b),garage);
 // Contact shadow follows the wheels, separate from the directional dynamic shadow.
 const contactCanvas=document.createElement('canvas');contactCanvas.width=128;contactCanvas.height=128;
 const ctx=contactCanvas.getContext('2d'),g=ctx.createRadialGradient(64,64,20,64,64,64);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
 const contact=new THREE.Mesh(new THREE.PlaneGeometry(3.2,5.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(contactCanvas),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=-.015;root.add(contact);
 const key=new THREE.DirectionalLight(0xffdcbb,2.1);key.position.set(-8,12,0);key.castShadow=true;key.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:1,far:35});key.shadow.bias=-.0004;key.shadow.normalBias=.025;key.shadow.radius=4;scene.add(key,key.target);
 const fill=new THREE.DirectionalLight(0xc9dce6,1.4);fill.position.set(7,5,-3);scene.add(fill);
 const ambient=new THREE.HemisphereLight(0xdde3e9,0x4b4b49,.65);scene.add(ambient);
 const technical=[];for(const z of [11,19,24]){const l=new THREE.PointLight(0xf1f5f5,80,20,2);l.position.set(0,4.6,z);scene.add(l);technical.push(l);}
 const warm=new THREE.Color(0xffdcbb),white=new THREE.Color(0xe7eff3);
 return {root,dispose(){reflection?.dispose()},disableReflection(){if(reflection)reflection.visible=false},update({z,door,inside}){shutter.position.y=door*4.6;contact.position.z=z;key.position.set(-6,10,z+5);key.target.position.set(0,0,z);key.color.copy(warm).lerp(white,inside);key.intensity=2.1-inside*.4;ambient.intensity=.65+inside*.15;fill.intensity=1.4+inside*.4;},shutter};
}
