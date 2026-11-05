const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');

const TURNOS_VALIDOS = ['manha', 'tarde', 'integral'];

// Confere se um valor do corpo da requisição é um id válido (inteiro positivo)
const ehIdValido = (valor) => Number.isInteger(valor) && valor > 0;

// Lê e valida o corpo da requisição.
// Devolve { erro } se algo estiver errado, ou { dados } já normalizados.
function lerTurma(body) {
  const { anoSerie, turno, anoLetivo } = body;
  const identificacao = body.identificacao?.trim().toUpperCase();

  if (!Number.isInteger(anoSerie) || anoSerie < 1 || anoSerie > 9) {
    return { erro: 'anoSerie deve ser um número inteiro de 1 a 9.' };
  }
  if (!identificacao || identificacao.length > 10) {
    return { erro: 'identificacao é obrigatória e deve ter até 10 caracteres.' };
  }
  if (!TURNOS_VALIDOS.includes(turno)) {
    return { erro: 'turno inválido. Use: manha, tarde ou integral.' };
  }
  if (!Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) {
    return { erro: 'anoLetivo deve ser um ano válido (ex.: 2026).' };
  }

  return { dados: { anoSerie, identificacao, turno, anoLetivo } };
}

function criarRotasTurmas({ turmaRepository, alunoRepository, disciplinaRepository, professorRepository }) { 
    
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));
  router.param('id', validarId);
  router.param('alunoId', validarId);
  router.param('disciplinaId', validarId);
  router.post('/', async (req, res) => {
    const { erro, dados } = lerTurma(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    try {
      const turma = await turmaRepository.criar(dados);
      res.status(201).json(turma.paraJSON());
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe essa turma nesse ano letivo.' });
      }
      console.error(e);
      res.status(500).json({ erro: 'Erro ao criar turma.' });
    }
  });

  router.get('/', async (req, res) => {
    const { anoLetivo } = req.query;

    if (anoLetivo !== undefined && !/^\d{4}$/.test(anoLetivo)) {
      return res.status(400).json({ erro: 'anoLetivo deve ter 4 dígitos (ex.: 2026).' });
    }

    try {
      const turmas = await turmaRepository.listarTodos(anoLetivo ? Number(anoLetivo) : null);
      res.json(turmas.map((t) => t.paraJSON()));
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao listar turmas.' });
    }
  });

  router.put('/:id', async (req, res) => {
    const { erro, dados } = lerTurma(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    try {
      const atualizou = await turmaRepository.atualizar(req.params.id, dados);
      if (!atualizou) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }
      const turma = await turmaRepository.buscarPorId(req.params.id);
      res.json(turma.paraJSON());
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe essa turma nesse ano letivo.' });
      }
      console.error(e);
      res.status(500).json({ erro: 'Erro ao atualizar turma.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await turmaRepository.inativar(req.params.id);
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao inativar turma.' });
    }
  });

    // ----- Alunos da turma (RF03) -----

  router.post('/:id/alunos', async (req, res) => {
    const { alunoId } = req.body;

    if (!Number.isInteger(alunoId) || alunoId <= 0) {
      return res.status(400).json({ erro: 'alunoId deve ser um número inteiro positivo.' });
    }

    try {
      const turma = await turmaRepository.buscarPorId(req.params.id);
      if (!turma) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }

      const aluno = await alunoRepository.buscarPorId(alunoId);
      if (!aluno || !aluno.ativo) {
        return res.status(404).json({ erro: 'Aluno não encontrado.' });
      }

      // O ano letivo é copiado da turma: é ele que permite ao banco barrar
      // o mesmo aluno em duas turmas do mesmo ano.
      await turmaRepository.matricularAluno(turma.id, aluno.id, turma.anoLetivo);
      res.status(201).json({ mensagem: `${aluno.nome} matriculado(a) na turma ${turma.nome}.` });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        // Dois tipos de duplicidade: descobrimos qual pela restrição citada na mensagem do MySQL
        if (e.sqlMessage.includes('uq_turma_aluno_ano')) {
          return res.status(409).json({ erro: 'Esse aluno já está matriculado em outra turma neste ano letivo.' });
        }
        return res.status(409).json({ erro: 'Esse aluno já está nesta turma.' });
      }
      console.error(e);
      res.status(500).json({ erro: 'Erro ao matricular aluno.' });
    }
  });

  router.get('/:id/alunos', async (req, res) => {
    try {
      const turma = await turmaRepository.buscarPorId(req.params.id);
      if (!turma) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }

      const alunos = await turmaRepository.listarAlunos(turma.id);
      res.json({ turma: turma.nome, anoLetivo: turma.anoLetivo, alunos });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao listar alunos da turma.' });
    }
  });

  router.delete('/:id/alunos/:alunoId', async (req, res) => {
    try {
      const removido = await turmaRepository.removerAluno(req.params.id, req.params.alunoId);
      if (!removido) {
        return res.status(404).json({ erro: 'Esse aluno não está nesta turma.' });
      }
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao remover aluno da turma.' });
    }
  });

    // ----- Disciplinas e professores da turma (RF03) -----

  router.post('/:id/disciplinas', async (req, res) => {
    const { disciplinaId, professorId } = req.body;

    if (!ehIdValido(disciplinaId) || !ehIdValido(professorId)) {
      return res.status(400).json({ erro: 'disciplinaId e professorId devem ser números inteiros positivos.' });
    }

    try {
      const turma = await turmaRepository.buscarPorId(req.params.id);
      if (!turma) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }

      const disciplina = await disciplinaRepository.buscarPorId(disciplinaId);
      if (!disciplina) {
        return res.status(404).json({ erro: 'Disciplina não encontrada.' });
      }

      const professor = await professorRepository.buscarPorId(professorId);
      if (!professor) {
        return res.status(404).json({ erro: 'Professor não encontrado.' });
      }

      await turmaRepository.alocarDisciplina(turma.id, disciplina.id, professor.id);
      res.status(201).json({ mensagem: `${disciplina.nome} na turma ${turma.nome} com ${professor.nome}.` });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Essa disciplina já tem professor nesta turma. Para trocar, use PUT.' });
      }
      console.error(e);
      res.status(500).json({ erro: 'Erro ao alocar disciplina.' });
    }
  });

  router.get('/:id/disciplinas', async (req, res) => {
    try {
      const turma = await turmaRepository.buscarPorId(req.params.id);
      if (!turma) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }

      const disciplinas = await turmaRepository.listarDisciplinas(turma.id);
      res.json({ turma: turma.nome, anoLetivo: turma.anoLetivo, disciplinas });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao listar disciplinas da turma.' });
    }
  });

  router.put('/:id/disciplinas/:disciplinaId', async (req, res) => {
    const { professorId } = req.body;

    if (!ehIdValido(professorId)) {
      return res.status(400).json({ erro: 'professorId deve ser um número inteiro positivo.' });
    }

    try {
      const professor = await professorRepository.buscarPorId(professorId);
      if (!professor) {
        return res.status(404).json({ erro: 'Professor não encontrado.' });
      }

      const trocou = await turmaRepository.trocarProfessor(req.params.id, req.params.disciplinaId, professor.id);
      if (!trocou) {
        return res.status(404).json({ erro: 'Essa disciplina não está alocada nesta turma.' });
      }
      res.json({ mensagem: `Professor alterado para ${professor.nome}.` });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao trocar professor.' });
    }
  });

  router.delete('/:id/disciplinas/:disciplinaId', async (req, res) => {
    try {
      const removido = await turmaRepository.removerDisciplina(req.params.id, req.params.disciplinaId);
      if (!removido) {
        return res.status(404).json({ erro: 'Essa disciplina não está alocada nesta turma.' });
      }
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao remover disciplina da turma.' });
    }
  });

  return router;
}

module.exports = criarRotasTurmas;