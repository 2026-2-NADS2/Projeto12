import { useState, useEffect } from 'react';

function App() {
  const [mensagem, setMensagem] = useState('Carregando...');

  useEffect(() => {
    fetch('http://localhost:3001/')
      .then((resposta) => resposta.text())
      .then((texto) => setMensagem(texto))
      .catch((erro) => setMensagem('Erro ao conectar com o backend: ' + erro.message));
  }, []);

  return (
    <div>
      <h1>Sistema de Comunicação Escolar</h1>
      <p>Resposta do backend: {mensagem}</p>
    </div>
  );
}

export default App;
