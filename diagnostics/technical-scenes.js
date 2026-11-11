import * as T from 'three';

// Original, lightweight teaching geometry. NEVER attached to the Mustang hierarchy.
// Dimensions, clearances and motions are illustrative, not repair specifications.
export const lessons={
  brakes:{title:'Freio a disco',action:'Demonstrar frenagem',range:'Pressão ilustrativa',parts:{
    disc:['Disco ventilado','Gira com a roda e recebe o atrito das pastilhas. As aletas internas ajudam a dissipar calor.','Espessura, superfície e sinais de aquecimento precisam ser avaliados conforme o fabricante.'],
    caliper:['Pinça','Converte a pressão hidráulica em força sobre as pastilhas. Aqui mostramos um arranjo genérico de pistões opostos.','Vazamentos, guias ou pistões presos podem causar desgaste desigual.'],
    pads:['Pastilhas','As duas superfícies de atrito se aproximam do disco durante a frenagem. O afastamento está ampliado para facilitar a leitura.','Desgaste e contaminação influenciam a resposta dos freios.'],
    hub:['Cubo','Centraliza a roda e acompanha o movimento do disco.','Folgas, rolamentos e superfícies de assentamento merecem inspeção.']
  }},
  suspension:{title:'Suspensão — conjunto didático',action:'Comprimir e retornar',range:'Compressão ilustrativa',parts:{
    damper:['Amortecedor','Controla o movimento da suspensão. A haste entra e sai do corpo durante compressão e retorno.','Vazamentos e perda de controle do movimento pedem avaliação do conjunto.'],
    spring:['Mola','Sustenta carga e armazena energia ao se comprimir. O amortecedor controla a oscilação.','Trincas, corrosão e alteração da altura exigem inspeção.'],
    arms:['Braços de suspensão','Guiam o movimento do conjunto. Esta geometria é apenas um exemplo didático, não a arquitetura de um veículo específico.','Folgas e deformações podem afetar o alinhamento e a estabilidade.'],
    bushings:['Buchas','Permitem movimento controlado nas articulações e isolam parte das vibrações.','Rachaduras, deslocamento e folgas precisam ser avaliados.'],
    stabilizer:['Barra estabilizadora','Relaciona os movimentos dos lados da suspensão para ajudar a limitar a rolagem da carroceria.','Buchas e ligações podem produzir ruídos quando apresentam folga.']
  }},
  transmission:{title:'Transmissão automática — esquema',action:'Demonstrar movimento',range:'Fase da demonstração',parts:{
    converter:['Conversor de torque','Em transmissões que usam esse dispositivo, o fluido transfere torque entre motor e transmissão.','Fluido e procedimento corretos dependem da transmissão. Este exemplo não identifica uma transmissão específica.'],
    gears:['Conjunto planetário','Sol, planetas e coroa permitem relações diferentes. Neste exemplo a coroa fica parada, o sol gira e o porta-planetas reduz a velocidade.','Esquema ilustrativo: esta animação não simula uma troca de marcha completa.'],
    clutch:['Embreagens multidisco','Pacotes de discos podem acoplar elementos internos. A vista separada torna os discos identificáveis.','Esquema ilustrativo de um componente interno.'],
    fluid:['Fluido e filtragem','O fluido participa da lubrificação, do controle hidráulico e da gestão térmica, conforme o projeto.','Especificação, nível e método de manutenção devem seguir o fabricante.']
  }},
  electrical:{title:'Elétrica — esquema de funções',action:'Mostrar fluxo de sinais',range:'Fase do sinal',parts:{
    battery:['Bateria','Armazena energia e alimenta consumidores, inclusive durante a partida.','Carga, terminais e capacidade precisam ser avaliados em conjunto.'],
    alternator:['Alternador','Converte energia mecânica em elétrica e participa da alimentação e recarga, conforme a estratégia do veículo.','Tensão, corrente e conexões ajudam a investigar falhas.'],
    module:['Módulo eletrônico','Recebe informações e coordena funções. As linhas representam relações conceituais, não um chicote real.','A leitura de falhas deve ser interpretada junto com medições e sintomas.'],
    sensor:['Sensor','Converte uma condição física em informação para o sistema eletrônico.','Alimentação, sinal e conexão precisam ser verificados antes de condenar a peça.']
  }}
};

export function createTechnicalScene(mode){
 const lesson=lessons[mode];if(!lesson)throw new Error('Unknown technical scene');
 const root=new T.Group();root.name='Technical_'+mode;const parts={},resources=new Set();
 const material=(color,metalness=.7,roughness=.3)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});resources.add(m);return m;};
 const steel=material(0xaab2bb),dark=material(0x252b32,.5,.42),red=material(0xa80e30,.6,.3),rubber=material(0x14171b,.05,.65),copper=material(0xa66838,.8,.34);
 const group=(id)=>{const g=new T.Group();g.name=id;g.userData.component=id;root.add(g);parts[id]={object:g,label:lesson.parts[id][0],description:lesson.parts[id][1],maintenance:lesson.parts[id][2]};return g;};
 const mesh=(parent,geometry,mat,position=[0,0,0])=>{resources.add(geometry);const o=new T.Mesh(geometry,mat);o.position.set(...position);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const cyl=(p,r,h,m,xyz=[0,0,0],axis='y')=>{const o=mesh(p,new T.CylinderGeometry(r,r,h,40),m,xyz);if(axis==='z')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.z=Math.PI/2;return o;};
 const box=(p,size,m,xyz=[0,0,0])=>mesh(p,new T.BoxGeometry(...size),m,xyz);
 const ring=(p,outer,inner,depth,m,xyz=[0,0,0],drilled=false)=>{const s=new T.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(h);if(drilled)for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?.72:.86,hole=new T.Path();hole.absarc(Math.cos(a)*r,Math.sin(a)*r,.024,0,Math.PI*2,true);s.holes.push(hole);}return mesh(p,new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,steps:1,curveSegments:48}),m,xyz);};
 const tube=(p,points,r,m,segments=48)=>mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),segments,r,10,false),m);
 const link=(p,a,b,r,m)=>{const o=cyl(p,r,1,m);function place(aa,bb){const av=new T.Vector3(...aa),bv=new T.Vector3(...bb),delta=bv.clone().sub(av);o.position.copy(av).add(bv).multiplyScalar(.5);o.scale.y=delta.length();o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}place(a,b);return place;};
 let animate=()=>{};
 if(mode==='brakes'){
  const disc=group('disc'),hub=group('hub'),caliper=group('caliper'),pads=group('pads');
  ring(disc,1,.35,.045,steel,[0,0,-.12],true);ring(disc,1,.35,.045,steel,[0,0,.075],true);
  for(let i=0;i<28;i++){const a=i*Math.PI*2/28,o=box(disc,[.60,.022,.16],dark,[Math.cos(a)*.66,Math.sin(a)*.66,0]);o.rotation.z=a;}
  cyl(hub,.36,.34,dark,[0,0,0],'z');ring(hub,.30,.13,.07,steel,[0,0,.18]);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;cyl(hub,.045,.12,steel,[Math.cos(a)*.23,Math.sin(a)*.23,.28],'z');}
  const shape=new T.Shape();shape.moveTo(.62,-.52);shape.quadraticCurveTo(1.22,-.62,1.23,0);shape.quadraticCurveTo(1.22,.62,.62,.52);shape.lineTo(.62,.30);shape.quadraticCurveTo(.98,.32,.98,0);shape.quadraticCurveTo(.98,-.32,.62,-.30);shape.closePath();
  mesh(caliper,new T.ExtrudeGeometry(shape,{depth:.20,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:3}),red,[0,0,-.10]);
  // Two visible opposed piston housings, with a bridge outside the disc's edge.
  const pistons=[];for(const side of [-1,1]){box(caliper,[.25,.87,.13],red,[.8,0,side*.43]);for(const y of [-.2,.2])pistons.push({side,object:cyl(caliper,.11,.12,steel,[.8,y,side*.34],'z')});}
  for(const y of [-.4,.4])box(caliper,[.16,.15,.80],red,[1.08,y,0]);
  const padMeshes=[];for(const side of [-1,1]){const g=new T.Group();pads.add(g);box(g,[.28,.73,.06],dark,[.80,0,0]);box(g,[.29,.76,.025],steel,[.80,0,side*.045]);g.position.z=side*.24;padMeshes.push(g);}
  animate=(v)=>{padMeshes.forEach((o,i)=>o.position.z=(i?1:-1)*(.24-.085*v));pistons.forEach(({side,object})=>object.position.z=side*(.34-.085*v));};
 }else if(mode==='suspension'){
  const damper=group('damper'),spring=group('spring'),arms=group('arms'),bushings=group('bushings'),stabilizer=group('stabilizer');
  const body=cyl(damper,.16,1,red,[.30,-.22,0]);cyl(damper,.055,1.32,steel,[.30,.60,0]);cyl(damper,.31,.08,dark,[.30,1.3,0]);const seat=cyl(damper,.32,.06,dark,[.30,.14,0]);
  const helix=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*12;helix.push([Math.cos(a)*.27,i/180,Math.sin(a)*.27]);}const coil=tube(spring,helix,.041,steel,144);coil.position.set(.30,.18,0);
  const links=[link(arms,[-1,-.85,-.5],[.3,-.72,0],.065,dark),link(arms,[-1,-.85,.5],[.3,-.72,0],.065,dark)];
  for(const z of [-.5,.5]){cyl(bushings,.14,.20,rubber,[-1,-.85,z],'z');cyl(bushings,.055,.23,steel,[-1,-.85,z],'z');}
  const joint=cyl(arms,.19,.22,steel,[.3,-.72,0],'z');tube(stabilizer,[[-1.3,-.5,-.65],[-1.1,-.55,-.65],[-.9,-.55,-.1],[-.9,-.55,.65],[-.6,-.55,.75]],.045,red);
  const tie=link(stabilizer,[-.6,-.55,.75],[.3,-.45,.3],.025,steel);
  animate=v=>{const lift=.42*v;body.position.y=-.22+lift;seat.position.y=.14+lift;coil.scale.y=1-lift;coil.position.y=.18+lift;joint.position.y=-.72+lift;links[0]([-1,-.85,-.5],[.3,-.72+lift,0]);links[1]([-1,-.85,.5],[.3,-.72+lift,0]);tie([-.6,-.55,.75],[.3,-.45+lift,.3]);};
 }else if(mode==='transmission'){
  const converter=group('converter'),gears=group('gears'),clutch=group('clutch'),fluid=group('fluid');
  converter.position.x=-1.65;clutch.position.x=1.65;
  const shell=mesh(converter,new T.SphereGeometry(.56,32,20,0,Math.PI*1.6),dark);shell.scale.z=.47;
  ring(converter,.50,.16,.07,steel,[0,0,.07]);cyl(converter,.12,.65,steel,[0,0,0],'z');
  const impeller=new T.Group();converter.add(impeller);for(let i=0;i<18;i++){const a=i*Math.PI*2/18,o=box(impeller,[.30,.025,.11],copper,[Math.cos(a)*.3,Math.sin(a)*.3,.13]);o.rotation.z=a+.3;}
  function gear(parent,r,n,mat){const shape=new T.Shape();for(let i=0;i<n*4;i++){const a=i*Math.PI*2/(n*4),rr=r*(i%4===0||i%4===3?.92:1.04),x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();const hole=new T.Path();hole.absarc(0,0,r*.25,0,Math.PI*2,true);shape.holes.push(hole);return mesh(parent,new T.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:false}),mat);}
  ring(gears,.87,.74,.18,dark);for(let i=0;i<48;i++){const a=i*Math.PI*2/48,o=box(gears,[.045,.04,.18],steel,[Math.cos(a)*.72,Math.sin(a)*.72,.09]);o.rotation.z=a;}
  const sun=gear(gears,.36,24,copper),planets=[];for(let i=0;i<3;i++){const o=gear(gears,.18,12,steel);planets.push(o);}
  const carrier=ring(gears,.58,.49,.035,red,[0,0,-.07]);
  const plates=[];for(let i=0;i<6;i++)plates.push(ring(clutch,.47,.18,.035,i%2?steel:dark,[0,0,-.35+i*.14]));
  box(fluid,[2.2,.14,.66],dark,[0,-1.05,0]);box(fluid,[1.05,.08,.48],steel,[0,-.94,0]);for(let i=0;i<8;i++)box(fluid,[.025,.02,.4],dark,[-.4+i*.115,-.89,0]);
  animate=v=>{const phase=v*Math.PI*4;sun.rotation.z=phase;carrier.rotation.z=phase/3;impeller.rotation.z=phase;planets.forEach((o,i)=>{const a=i*Math.PI*2/3+phase/3;o.position.set(Math.cos(a)*.54,Math.sin(a)*.54,0);o.rotation.z=-phase;});plates.forEach((p,i)=>p.position.z=-.35+i*(.14-.045*Math.sin(v*Math.PI)));};
 }else if(mode==='electrical'){
  const battery=group('battery'),alternator=group('alternator'),module=group('module'),sensor=group('sensor');
  battery.position.set(-1.15,.65,0);alternator.position.set(1.05,.65,0);module.position.set(.65,-.85,0);sensor.position.set(-1.2,-.85,0);
  box(battery,[.82,.58,.52],dark);box(battery,[.88,.08,.58],rubber,[0,.33,0]);cyl(battery,.065,.12,red,[-.25,.42,0]);cyl(battery,.065,.12,steel,[.25,.42,0]);box(battery,[.16,.025,.02],red,[-.25,.12,.27]);box(battery,[.025,.16,.02],red,[-.25,.12,.27]);box(battery,[.16,.025,.02],steel,[.25,.12,.27]);
  cyl(alternator,.38,.50,steel,[0,0,0],'z');for(let i=0;i<14;i++){const a=i*Math.PI*2/14,o=box(alternator,[.045,.16,.53],dark,[Math.cos(a)*.35,Math.sin(a)*.35,0]);o.rotation.z=a;}
  const pulley=ring(alternator,.23,.08,.08,dark,[0,0,.32]);cyl(alternator,.065,.13,steel,[0,0,.38],'z');
  box(module,[.85,.55,.22],steel);for(let i=0;i<9;i++)box(module,[.035,.46,.04],dark,[-.34+i*.085,0,.14]);for(let i=0;i<8;i++)box(module,[.04,.12,.05],copper,[-.3+i*.085,-.33,0]);
  cyl(sensor,.14,.46,steel,[0,0,0],'x');box(sensor,[.27,.22,.24],dark,[-.2,0,0]);tube(sensor,[[-.3,0,0],[-.5,0,0],[-.5,.25,0]],.025,rubber);
  const paths=[[[.65,.65,-.25],[.1,.65,-.25],[-.65,.65,-.25]],[[-1.15,.3,-.25],[-1.15,-.15,-.25],[.65,-.15,-.25],[.65,-.55,-.25]],[[-.9,-.85,-.25],[-.25,-.85,-.25],[.2,-.85,-.25]]];
  const signals=[];for(const points of paths){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));mesh(root,new T.TubeGeometry(curve,28,.018,6,false),dark);const dot=mesh(root,new T.SphereGeometry(.04,10,8),red);signals.push({curve,dot});}
  animate=v=>{pulley.rotation.z=v*Math.PI*4;signals.forEach(({curve,dot},i)=>dot.position.copy(curve.getPoint((v+i*.21)%1)));};
 }
 root.position.y=1.35;
 const originals=new Map();let selected=null,progress=0,exploded=false;
 // Clone material once per component to avoid cross-component highlighting.
 for(const part of Object.values(parts))part.object.traverse(o=>{if(o.isMesh){o.material=o.material.clone();resources.add(o.material);}});
 // Selection must not allocate resources on repeated clicks.
 function selectStable(id){if(!parts[id])return;for(const [m,c]of originals)m.emissive.copy(c);originals.clear();selected=id;parts[id].object.traverse(o=>{if(o.isMesh){originals.set(o.material,o.material.emissive.clone());o.material.emissive.set(0x430a19);}});}
 animate(0);selectStable(Object.keys(parts)[0]);
 return {root,parts,lesson,get selected(){return selected;},get progress(){return progress;},get exploded(){return exploded;},select:selectStable,
  setExploded(value){exploded=!!value;if(mode==='brakes'){parts.caliper.object.position.x=exploded?.6:0;parts.pads.object.position.z=exploded?.5:0;}root.updateMatrixWorld(true);},
  setProgress(value){progress=Math.max(0,Math.min(1,value));animate(progress);root.updateMatrixWorld(true);},
  dispose(){root.removeFromParent();for(const r of resources)r.dispose();},
  metrics(){return {mode,selected,progress,exploded,components:Object.keys(parts),geometryCount:[...resources].filter(r=>r.isBufferGeometry).length,transforms:Object.fromEntries(Object.entries(parts).map(([id,p])=>[id,p.object.children.map(o=>({p:o.position.toArray(),r:o.rotation.toArray().slice(0,3),s:o.scale.toArray()}))]))};}
 };
}
