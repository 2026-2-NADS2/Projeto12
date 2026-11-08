// Cartão central das telas de acesso (login e recuperação de senha)
// centralizado: título e subtítulo no meio (telas de confirmação)
export default function CartaoAcesso({ titulo, subtitulo, centralizado = false, children }) {
  return (
    <div className="tela-acesso">
      <div className="cartao cartao-acesso">
        <div className="marca">
          <div className="logo">KFKA</div>
          <div>
            <strong>KFKA</strong>
            <small>Plataforma de Acompanhamento Escolar</small>
          </div>
        </div>
        <div className={centralizado ? 'texto-centro' : undefined}>
          <h1>{titulo}</h1>
          {subtitulo && <p className="texto-suave">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}