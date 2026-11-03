// Cria um usuário administrador direto no banco, pelo terminal.
// Uso (a partir da pasta backend):
//   node scripts/criarAdmin.js "Nome Completo" email@escola.com senha
// Serve para o primeiro acesso em um banco novo, já que a rota /usuarios
// passará a exigir token de administrador.

const Database = require('../core/Database');
const UsuarioRepository = require('../repositories/UsuarioRepository');

async function main() {
  const [nome, email, senha] = process.argv.slice(2);

  if (!nome || !email || !senha) {
    console.log('Uso: node scripts/criarAdmin.js "Nome Completo" email senha');
    process.exit(1);
  }

  const database = new Database();
  await database.conectar();

      if (!PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ erro: 'Perfil inválido. Use: administrador, professor ou responsavel.' });
    }

  const usuarioRepository = new UsuarioRepository(database);

  try {
    const usuario = await usuarioRepository.criar({ nome, email, senha, perfil: 'administrador' });
    console.log('Administrador criado:', usuario.paraJSON());
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      console.log('Já existe um usuário com esse e-mail.');
    } else {
      console.error('Erro ao criar administrador:', erro);
    }
    process.exitCode = 1;
  }

  process.exit();
}

main();