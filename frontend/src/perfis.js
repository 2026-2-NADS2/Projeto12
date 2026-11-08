import { Home, Users, CalendarRange, ClipboardCheck, BarChart3, LayoutGrid } from 'lucide-react';

// Página inicial de cada perfil (para onde o login leva)
export const INICIO_DO_PERFIL = {
  administrador: '/admin',
  professor: '/professor',
  responsavel: '/responsavel'
};

export const NOME_DO_PERFIL = {
  administrador: 'Administrador',
  professor: 'Professor(a)',
  responsavel: 'Responsável'
};

// Itens da barra lateral de cada perfil
export const MENUS = {
  administrador: [
    { rota: '/admin', rotulo: 'Início', icone: Home, exato: true },
    { rota: '/admin/cadastros', rotulo: 'Cadastros', icone: Users },
    { rota: '/admin/bimestres', rotulo: 'Bimestres', icone: CalendarRange },
    { rota: '/admin/revisao', rotulo: 'Revisão', icone: ClipboardCheck },
    { rota: '/admin/relatorios', rotulo: 'Relatórios', icone: BarChart3 }
  ],
  professor: [
    { rota: '/professor', rotulo: 'Início', icone: Home, exato: true },
    { rota: '/professor/turmas', rotulo: 'Minhas turmas', icone: LayoutGrid }
  ],
  responsavel: [
    { rota: '/responsavel', rotulo: 'Início', icone: Home, exato: true }
  ]
};