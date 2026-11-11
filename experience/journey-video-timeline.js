// Etapas da jornada em vídeo da Home (vídeo ilustrativo gerado por IA).
// "from"/"to": janela, em segundos do vídeo montado, em que o texto da etapa aparece (to:null = até o fim).
// Etapas de serviço usam nome e introdução oficiais de site-data.js (slug real).
// Para remontar o vídeo: node tools/build-journey-video.cjs && npm run build
export const journeyVideo={
 base:'/assets/journey-video/',
 desktop:'web-720.mp4',mobile:'web-480.mp4',desktopWebm:'web-720.webm',mobileWebm:'web-480.webm',poster:'poster.jpg',
 length:8, // altura do bloco em telas
 steps:[
  {id:'chegada',label:'Chegada',from:-1,to:4.5,hero:true},
  {id:'diagnostico',label:'Diagnóstico',from:5.2,to:9.6,eyebrow:'Antes de qualquer serviço',title:'Diagnóstico claro, sem enrolação.',text:'A gente avalia o carro, explica o que encontrou e o que realmente precisa ser feito.'},
  {id:'freios',label:'Freios',from:10.6,to:14.5,service:'freios'},
  {id:'suspensao',label:'Suspensão',from:15.2,to:19.0,service:'suspensao-direcao'},
  {id:'motor',label:'Motor',from:19.9,to:22.3,service:'motor'},
  {id:'cambio',label:'Câmbio',from:22.5,to:26.0,service:'cambio-automatico',eyebrow:'Serviço · Câmbio automático',title:'Troca de óleo do câmbio',text:'Troca do óleo do câmbio automático.',message:'Olá! Quero agendar: troca de óleo do câmbio automático.'},
  {id:'contato',label:'Contato',from:26.5,to:null,final:true}
 ]
};
