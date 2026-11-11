// Linha do tempo da jornada da Home (imagens e vídeos ilustrativos gerados por IA).
// Para trocar uma etapa de imagem por vídeo: mude "media" para
//   {type:'frames', source:'novo-clipe.mp4', from:1, to:N, every:{desktop:2, mobile:3}}
// coloque o MP4 na raiz do projeto e rode: node tools/prepare-journey-frames.cjs && npm run build
// "scroll" é o comprimento da etapa em alturas de tela. "enter" é a transição de entrada.
// "still" é a imagem fixa da etapa: usada como poster, como plano de contingência e sem animação.
// Textos: somente textos já existentes no site. Serviços: slugs reais de site-data.js.
export const journeyTimeline=[
 {id:'rua',label:'A rua',scroll:1.2,still:'cena-0-rua',
  alt:'Carro escuro em uma rua molhada ao anoitecer, chegando à fachada da Garagem Mendes. Imagem ilustrativa gerada por IA.',
  media:{type:'frames',source:'clipe-0-rua-chegada.mp4',from:1,to:190,every:{desktop:3,mobile:3}},hero:true},
 {id:'chegada',label:'A chegada',scroll:1,still:'cena-1-chegada',enter:'dissolve',
  alt:'Carro entrando pela porta da oficina Garagem Mendes. Imagem ilustrativa gerada por IA.',
  // Clipe 1 cortado no quadro 140 (5,83 s): a partir do quadro 149 há fusão com fantasma.
  media:{type:'frames',source:'clipe-1-chegada-box-COM-DEFEITO.mp4',from:1,to:140,every:{desktop:2,mobile:3}},
  eyebrow:'01 / CADA CAMINHO TEM UMA HISTÓRIA',title:'Do seu caminho<br>até a nossa garagem.',text:'Cada detalhe do seu carro importa. É por isso que o cuidado começa por ouvir você.'},
 {id:'box',label:'O box',scroll:.5,still:'cena-2-box',enter:'fade-escuro',
  alt:'Carro parado no box da Garagem Mendes, com o painel da marca ao fundo. Imagem ilustrativa gerada por IA.',
  media:{type:'still',zoom:[1,1.06]},
  eyebrow:'02 / BEM-VINDO À GARAGEM MENDES',title:'Antes de qualquer serviço,<br>a gente entende o seu carro.',text:'Seu relato, nossa experiência. A tecnologia ajuda a encontrar o próximo passo.'},
 {id:'freios',label:'Freios',scroll:.6,still:'cena-3-freios',enter:'dissolve',service:'freios',
  alt:'Disco de freio e pinça vermelha de um carro no elevador. Imagem ilustrativa gerada por IA.',
  media:{type:'still',zoom:[1.05,1]}},
 {id:'suspensao',label:'Suspensão',scroll:.6,still:'cena-4-suspensao',enter:'dissolve',service:'suspensao-direcao',
  alt:'Mola, amortecedor e braços da suspensão dianteira vistos por baixo do carro. Imagem ilustrativa gerada por IA.',
  media:{type:'still',zoom:[1,1.05]}},
 {id:'motor',label:'Motor',scroll:.6,still:'cena-5-motor',enter:'dissolve',service:'motor',
  alt:'Compartimento do motor com o capô aberto. Imagem ilustrativa gerada por IA.',
  media:{type:'still',zoom:[1.05,1]}},
 {id:'cambio',label:'Câmbio',scroll:.6,still:'cena-6-cambio',enter:'dissolve',service:'cambio-automatico',
  alt:'Parte de baixo do carro no elevador, com o conjunto da transmissão. Imagem ilustrativa gerada por IA.',
  media:{type:'still',zoom:[1,1.05]}},
 {id:'final',label:'Pronto',scroll:.6,still:'cena-7-final',enter:'dissolve',final:true,
  alt:'Carro pronto no box da Garagem Mendes. Imagem ilustrativa gerada por IA.',
  media:{type:'still',zoom:[1,1]}}
];
