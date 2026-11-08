// Selo colorido de situação (status do acompanhamento ou do bimestre).
// Cada tipo tem um texto e uma cor definidos no index.css (.selo-<tipo>).
const TEXTOS = {
  sem: 'Sem lançamento',
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  devolvido: 'Devolvido',
  publicado: 'Publicado',
  aberto: 'Aberto',
  encerrado: 'Encerrado',
  aguardando: 'Aguardando'
};

export default function Selo({ tipo, children }) {
  return <span className={`selo selo-${tipo}`}>{children ?? TEXTOS[tipo] ?? tipo}</span>;
}