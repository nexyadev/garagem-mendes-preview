// Dados oficiais da Garagem Mendes. Eduardo: altere os contatos somente aqui.
// Depois execute npm run build para atualizar também os links no HTML estático.
// Avaliações no Google (link coletado em 11/11/2026). Troque aqui sem mexer no código.
// GOOGLE_REVIEWS_URL: ver todas as avaliações. GOOGLE_REVIEW_WRITE_URL: avaliar (por enquanto o mesmo link).
export const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?kgmid=/g/11kjztwxz_&hl=pt-BR&q=Garagem+Mendes&shem=epsd1,esd2e,ltae,rimspwouoe,sdpie&shndl=30&source=sh/x/loc/osrp/m5/1&kgs=53e4eeb4eb63e89c&utm_source=epsd1,esd2e,ltae,rimspwouoe,sdpie,sh/x/loc/osrp/m5/1#lrd=0x94dce749550d23ed:0xc397361616c811ab,1,,,,';
export const GOOGLE_REVIEW_WRITE_URL = 'https://www.google.com/search?kgmid=/g/11kjztwxz_&hl=pt-BR&q=Garagem+Mendes&shem=epsd1,esd2e,ltae,rimspwouoe,sdpie&shndl=30&source=sh/x/loc/osrp/m5/1&kgs=53e4eeb4eb63e89c&utm_source=epsd1,esd2e,ltae,rimspwouoe,sdpie,sh/x/loc/osrp/m5/1#lrd=0x94dce749550d23ed:0xc397361616c811ab,1,,,,';

// Prints de avaliações: false = prints fiéis, sem desfoque (decisão do usuário em 11/11/2026). true = desfoca a foto de perfil.
export const AVATARS_BLUR = false;

export const siteConfig = {
  whatsapp: '5541995907697',
  phone: '+5541995907697',
  phoneLabel: '(41) 99590-7697',
  instagram: 'https://instagram.com/garagemmendes',
  email: '', // Informe o e-mail oficial. Vazio = link não exibido.
  address: 'Rua Alberto Potier, 458',
  neighborhood: 'Boa Vista · Curitiba / PR',
  hours: 'Segunda a sexta, das 09h às 18h',
  closed: 'Sábado e domingo: fechado',
  mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Garagem%20Mendes%20Rua%20Alberto%20Potier%20458%20Boa%20Vista%20Curitiba%20PR',
  mapEmbedUrl: 'https://maps.google.com/maps?q=Rua%20Alberto%20Potier%20458%20Boa%20Vista%20Curitiba%20PR&output=embed',
  message: 'Olá, Garagem Mendes! Gostaria de agendar um diagnóstico para o meu carro.',
  // SITE_URL: domínio oficial, sem barra no fim (ex.: 'https://www.seudominio.com.br').
  // Vazio = o domínio ainda não existe. A variável de ambiente SITE_URL tem prioridade
  // (SITE_URL=https://... npm run build). Usado em canonical, og:url, sitemap.xml e robots.txt.
  siteUrl: '',
  // Mesmo horário de "hours", no formato do Google (schema.org). Altere os dois juntos.
  openingHours: {days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00'}
};
