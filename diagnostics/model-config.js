// Only the audited BMW geometry is exposed as an interactive component.
const part=(node,axis,angle,label)=>({node,axis,angle,label,closedAngle:0,verified:true,requires:[node]});
const system=(anchor,cameraOffset,extra={})=>({anchor,cameraOffset,requiredNodes:[anchor],verified:true,...extra});
export const modelConfig = {
  approved: true, // Technical/local validation only; not a commercial rights clearance.
  commercialRelease: false, // Declared CC BY; original geometry authorship not independently established.
  modelUrl: 'assets/models/garagem-sedan.glb',
  mobileModelUrl: 'assets/models/garagem-sedan-mobile.glb',
  expectedVehicle: 'Sedã esportivo sem emblemas',
  source: 'https://sketchfab.com/3d-models/bmw-m3-g80-2025-bb30c32dc0624ca89bd865aed5214ca3',
  license: 'CC BY 4.0',
  author: 'Drifter Models / Golden-Models',
  yaw: 0,
  paintMaterials: ['Graphite paint'],
  licenseFile: 'assets/models/SEDAN-LICENSE.md',
  // Keys are exact, audited node names, not guessed name patterns.
  // A system needs all of its requiredNodes and an inspected cameraOffset.
  systems: {
    engine:system('Engine',[1.8,2.3,3.1],{openPart:'hood',scope:'engine',label:'Conjunto do motor',note:'CAPÔ ABERTO · CONJUNTO DO MOTOR'}),
    brakes:system('BrakesLF',[2.7,.65,1.7],{reveal:['WheelLF'],scope:'detail',label:'Disco e pinça',note:'VISTA DE INSPEÇÃO · RODA OCULTA'}),
    suspension:system('SuspensionLF',[2.7,.4,1.1],{reveal:['WheelLF','BrakesLF'],scope:'detail',label:'Suspensão dianteira',note:'VISTA DE INSPEÇÃO · RODA E FREIO OCULTOS'}),
    // No transmission or sensor wiring geometry has been verified. These views
    // retain the complete vehicle; the companion notes are explicitly illustrative.
    electrical:system('Dashboard',[4,1.5,5.5],{context:true,label:'Leitura de sinais',note:'ANÁLISE TÉCNICA ILUSTRATIVA · SEM DADOS REAIS'}),
    transmission:system('GearSelector',[5,.8,3.8],{context:true,label:'Troca de óleo do câmbio',note:'REGIÃO DO CONJUNTO · TRANSMISSÃO INTERNA NÃO EXIBIDA'}),
    interior:system('Dashboard',[2.7,.9,-.1],{openPart:'driver',scope:'interior',label:'Painel e interior',note:'PORTA ABERTA · INTERIOR DO VEÍCULO'})
  },
  // Example ONLY: hood: {node:'HoodPivot', axis:'x', angle:-1.1,
  //   closedAngle:0, verified:true, requires:['Engine'], label:'capô'}.
  // Pivots must already be authored at the actual hinges in the GLB.
  parts: {
    hood:{...part('Hood','x',-1.12,'capô'),requires:['Hood','Engine']},
    driver:part('DoorLF','y',-1.02,'porta do motorista'),
    passenger:part('DoorRF','y',1.02,'porta do passageiro'),
    driverRear:part('DoorLR','y',-1.02,'porta traseira esquerda'),
    passengerRear:part('DoorRR','y',1.02,'porta traseira direita'),
  },
  environmentUrl: 'assets/environment/studio-small-09.hdr',
  decoderPath: 'assets/vendor/draco/'
};
