const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');
const { emailValido, lerPaginacao, montarPagina, lerBusca } = require('./auxiliares');
const SenhaService = require('../services/SenhaService');
function criarRotasProfessores(professorRepository) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));
  router.param('id', validarId);

  router.post('/', async (req, res) => {

    const { nome, email, senha, registroFuncional } = req.body;

    if (!nome || !email || !senha || !registroFuncional) {
      return res.status(400).json({ erro: 'Nome, e-mail, senha e registro funcional são obrigatórios.' });
    }
    if (!nome || !email || !senha || !registroFuncional) {
      return res.status(400).json({ erro: 'Nome, e-mail, senha e registro funcional são obrigatórios.' });
    }

    // Mesmas regras usadas na troca de senha: e-mail válido e senha de 8 a 72 caracteres, com letra e número
    if (!emailValido(email)) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }
    const erroSenha = SenhaService.validarForca(senha);
    if (erroSenha) {
      return res.status(400).json({ erro: erroSenha });
    }

    try {
      const professor = await professorRepository.criar({ nome, email, senha, registroFuncional });
    
      res.status(201).json(professor.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe um professor com esse e-mail ou registro funcional.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao criar professor.' });
    }
  });

  router.get('/', async (req, res) => {
    const { erro, paginacao } = lerPaginacao(req.query);
    if (erro) {
      return res.status(400).json({ erro });
    }
    try {
      const { itens, total } = await professorRepository.listarTodos({ busca: lerBusca(req.query), ...paginacao });
      res.json(montarPagina(itens.map((p) => p.paraJSON()), total, paginacao));
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao listar professores.' });
    }
  });
  
  router.put('/:id', async (req, res) => {
    const nome = req.body.nome?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const registroFuncional = req.body.registroFuncional?.trim();

    if (!nome || !registroFuncional || !emailValido(email)) {
      return res.status(400).json({ erro: 'Informe nome, e-mail válido e registro funcional.' });
    }

    try {
      const atualizou = await professorRepository.atualizar(req.params.id, { nome, email, registroFuncional });
      if (!atualizou) {
        return res.status(404).json({ erro: 'Professor não encontrado.' });
      }
      const professor = await professorRepository.buscarPorId(req.params.id);
      res.json(professor.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Esse e-mail ou registro funcional já está em uso.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao atualizar professor.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const inativou = await professorRepository.inativar(req.params.id);
      if (!inativou) {
        return res.status(404).json({ erro: 'Professor não encontrado.' });
      }
      res.status(204).send();
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao inativar professor.' });
    }
  });

  return router;
}

module.exports = criarRotasProfessores;