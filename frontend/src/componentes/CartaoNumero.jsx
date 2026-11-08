// Cartão pequeno com ícone + número grande + legenda (ex.: "24 Alunos")
export default function CartaoNumero({ icone: Icone, numero, legenda, perigo = false }) {
  return (
    <div className="cartao cartao-numero">
      <span className={`icone-cartao${perigo ? ' icone-perigo' : ''}`}>
        <Icone size={22} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <strong>{numero}</strong>
      <span className="texto-suave">{legenda}</span>
    </div>
  );
}