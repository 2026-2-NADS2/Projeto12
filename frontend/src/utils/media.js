// Média escolar: escala de 0 a 10 com no máximo uma casa decimal.

// 8.5 -> "8,5"
export function formatarMedia(valor) {
  return valor === null || valor === undefined ? '—' : Number(valor).toFixed(1).replace('.', ',');
}

// Aceita "8,5" ou "8.5". Devolve { valor } ou { erro }
export function lerMedia(texto) {
  const normalizado = String(texto).trim().replace(',', '.');
  if (normalizado === '') return { erro: 'Informe a média.' };
  if (!/^\d{1,2}(\.\d)?$/.test(normalizado)) {
    return { erro: 'A média deve ter no máximo uma casa decimal (ex.: 8,5).' };
  }
  const valor = Number(normalizado);
  if (valor < 0 || valor > 10) return { erro: 'A média deve estar entre 0 e 10.' };
  return { valor };
}