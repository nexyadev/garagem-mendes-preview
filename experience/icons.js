// Ícones de interface em SVG inline (no lugar de caracteres de seta, que o iOS desenha como emoji).
// Usados pelo gerador (HTML estático) e pelos scripts do navegador. Cor = currentColor; tamanho em em.
const line = (name, d, size = '0.9em') => `<svg class="icon icon-${name}" viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const icons = {
  upRight: line('up-right', 'M4.5 11.5 11.5 4.5M6 4.5h5.5V10'),
  right: line('right', 'M2.5 8h11M9.5 4l4 4-4 4'),
  left: line('left', 'M13.5 8h-11M6.5 4l-4 4 4 4'),
  down: line('down', 'M8 2.5v11M4 9.5l4 4 4-4'),
  refresh: line('refresh', 'M13 8a5 5 0 1 1-1.6-3.7M13.2 2.6v3.1h-3.1'),
  restore: line('restore', 'M3 8a5 5 0 1 0 1.6-3.7M2.8 2.6v3.1h3.1'),
  star: '<svg class="icon icon-star" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M8 1.2l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.2.8-4.7L1.2 6.2l4.7-.7z" fill="currentColor"/></svg>'
};
// Troca o conteúdo de um botão por texto + ícone (o texto vai como texto, o ícone como SVG fixo).
export const setLabel = (el, text, icon) => { el.textContent = text + ' '; el.insertAdjacentHTML('beforeend', icon); };
