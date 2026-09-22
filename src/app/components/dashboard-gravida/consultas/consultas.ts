import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultaService } from '../../../services/consulta';
import { GravidaService } from '../../../services/gravida';
import { ObstetraService } from '../../../services/obstetra';
import { ExameService } from '../../../services/exame'; // Ajusta o caminho se necessário

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.html',
  styleUrls: ['./consultas.css'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class Consultas implements OnInit {
  nome: string = '';
  obstetraNome: string = 'Dr(a). não definido';
  idObstetraAtual: string | null = null;
  localConsulta: string = 'Ala de Obstetrícia - Piso 2';
  consultaId: string | null = null;

  dataSelecionada: string = '';
  horaSelecionada: string | null = null;
  notas: string = '';
  dataMinimaPermitida: string = '';

  agendadoComSucesso: boolean = false;
  erroData: boolean = false;
  erroHora: boolean = false;
  mostrarAvisoErro: boolean = false;

  horariosManha = [
    { hora: '08:00', disponivel: true },
    { hora: '08:30', disponivel: true },
    { hora: '09:00', disponivel: true },
    { hora: '09:30', disponivel: true },
    { hora: '10:00', disponivel: true },
    { hora: '10:30', disponivel: true },
    { hora: '11:00', disponivel: true },
    { hora: '11:30', disponivel: true },
    { hora: '12:00', disponivel: true },
    { hora: '12:30', disponivel: true },
    { hora: '13:00', disponivel: true }
  ];

  horariosTarde = [
    { hora: '14:00', disponivel: true },
    { hora: '14:30', disponivel: true },
    { hora: '15:00', disponivel: true },
    { hora: '15:30', disponivel: true },
    { hora: '16:00', disponivel: true },
    { hora: '16:30', disponivel: true },
    { hora: '17:00', disponivel: true },
    { hora: '17:30', disponivel: true },
    { hora: '18:00', disponivel: true }
  ];

  constructor(
    private router: Router,
    private consultaService: ConsultaService,
    private gravidaService: GravidaService,
    private obstetraService: ObstetraService,
    private examenService: ExameService
  ) { }

  ngOnInit() {
    this.nome = localStorage.getItem('nomeUtilizador') || 'Utilizador';
    this.definirDataMinima();
    const idGravida = localStorage.getItem('idUtilizador');
    if (idGravida) {
      this.carregarDadosGravida(idGravida);
    }
  }

  definirDataMinima() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    this.dataMinimaPermitida = `${ano}-${mes}-${dia}`;
  }

  carregarDadosGravida(id: string) {
    this.gravidaService.obterPorId(id).subscribe({
      next: (res: any) => {
        const gravida = res.dados || res;
        const obstetra = gravida.idObstetra;

        if (typeof obstetra === 'string') {
          this.idObstetraAtual = obstetra;
          this.obterObstetraPorId(obstetra);
          if (this.dataSelecionada) {
            this.atualizarDisponibilidade();
          }
          return;
        }

        this.idObstetraAtual = obstetra?._id || obstetra;
        this.obstetraNome = obstetra?.nome || obstetra?.nomeProfissional || 'Dr(a). não definido';
        if (this.dataSelecionada) {
          this.atualizarDisponibilidade();
        }
      },
      error: (erro: any) => {
        console.error('Erro ao carregar dados da grávida:', erro);
      }
    });
  }

  obterObstetraPorId(id: string) {
    this.obstetraService.obterPorId(id).subscribe({
      next: (res: any) => {
        const obstetra = res.dados || res;
        this.obstetraNome = obstetra?.nome || obstetra?.nomeProfissional || 'Dr(a). não definido';
      },
      error: (erro: any) => {
        console.error('Erro ao carregar dados do obstetra:', erro);
      }
    });
  }

  selecionarHora(hora: string, disponivel: boolean) {
    if (!disponivel) return;
    this.horaSelecionada = hora;
    this.validarPassoAPasso();
  }

  alterouData() {
    this.atualizarDisponibilidade();
    this.validarPassoAPasso();
  }

  isHojeDisponivel(): boolean {
    if (!this.dataSelecionada) {
      return true;
    }

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataHoje = `${ano}-${mes}-${dia}`;

    if (this.dataSelecionada !== dataHoje) {
      return true;
    }

    const agora = new Date();
    const limite = new Date(agora.getTime() + 30 * 60 * 1000);
    const ultimoHorario = this.obterDataHoraSlot('18:00');

    return limite <= ultimoHorario;
  }

  obterDataHoraSlot(hora: string): Date {
    const [ano, mes, dia] = this.dataSelecionada.split('-').map(Number);
    const [horas, minutos] = hora.split(':').map(Number);
    return new Date(ano, mes - 1, dia, horas, minutos, 0, 0);
  }

  bloquearHorariosAnterioresA(limite: Date) {
    const bloquearSeAntes = (slot: any) => {
      const horarioSlot = this.obterDataHoraSlot(slot.hora);
      if (horarioSlot < limite) {
        slot.disponivel = false;
      }
    };

    this.horariosManha.forEach(bloquearSeAntes);
    this.horariosTarde.forEach(bloquearSeAntes);
  }

  resetarHorarios() {
    const marcarDisponivel = (slot: any) => slot.disponivel = true;
    this.horariosManha.forEach(marcarDisponivel);
    this.horariosTarde.forEach(marcarDisponivel);

    if (!this.isHojeDisponivel()) {
      const bloquearTudo = (slot: any) => slot.disponivel = false;
      this.horariosManha.forEach(bloquearTudo);
      this.horariosTarde.forEach(bloquearTudo);
      this.horaSelecionada = null;
    }
  }

  atualizarDisponibilidade() {
    if (!this.idObstetraAtual || !this.dataSelecionada) {
      this.resetarHorarios();
      return;
    }

    this.resetarHorarios();
    const idGravida = localStorage.getItem('idUtilizador');

    const bloquearHorarioNoEcra = (hora: string) => {
      const marcarIndisponivel = (slot: any) => {
        if (slot.hora === hora) slot.disponivel = false;
      };
      this.horariosManha.forEach(marcarIndisponivel);
      this.horariosTarde.forEach(marcarIndisponivel);
    };

    this.consultaService.listarConsultasPorObstetraEDia(this.idObstetraAtual, this.dataSelecionada)
      .subscribe({
        next: (res: any) => {
          const consultasMedico = res.dados || res;
          consultasMedico.forEach((consulta: any) => {
            if (consulta._id && this.consultaId && consulta._id === this.consultaId) return;
            if (consulta.horarioConsulta) bloquearHorarioNoEcra(consulta.horarioConsulta);
          });

          if (idGravida) {
            this.consultaService.listarConsultasPorGravida(idGravida).subscribe({
              next: (resGravida: any) => {
                const consultasGravida = resGravida.dados || resGravida;
                consultasGravida.forEach((consulta: any) => {
                  const dataFormatada = consulta.dataConsulta.split('T')[0];
                  if (dataFormatada === this.dataSelecionada && consulta.horarioConsulta && consulta._id !== this.consultaId) {
                    bloquearHorarioNoEcra(consulta.horarioConsulta);
                  }
                });

                this.examenService.listarExames(idGravida).subscribe({
                  next: (resExame: any) => {
                    const examesGravida = resExame.dados || resExame;
                    examesGravida.forEach((exame: any) => {
                      if (exame.dataExame) {
                        const d = new Date(exame.dataExame);
                        const ano = d.getUTCFullYear();
                        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
                        const dia = String(d.getUTCDate()).padStart(2, '0');
                        const dataExameFormatada = `${ano}-${mes}-${dia}`;

                        if (dataExameFormatada === this.dataSelecionada && exame.horarioExame) {
                          bloquearHorarioNoEcra(exame.horarioExame);
                        }
                      }
                    });

                    this.aplicarBloqueiosDataAtual();
                  },
                  error: (e) => {
                    console.error('Erro ao listar exames:', e);
                    this.aplicarBloqueiosDataAtual();
                  }
                });
              },
              error: (e) => {
                console.error('Erro ao listar consultas da grávida:', e);
                this.aplicarBloqueiosDataAtual();
              }
            });
          } else {
            this.aplicarBloqueiosDataAtual();
          }
        },
        error: (erro: any) => {
          console.error('Erro ao carregar horários ocupados do obstetra:', erro);
        }
      });
  }

  aplicarBloqueiosDataAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataHoje = `${ano}-${mes}-${dia}`;

    if (this.dataSelecionada === dataHoje) {
      const agora = new Date();
      const limite = new Date(agora.getTime() + 30 * 60 * 1000);
      this.bloquearHorariosAnterioresA(limite);
    }

    if (this.horaSelecionada && !this.isHoraDisponivel(this.horaSelecionada)) {
      this.horaSelecionada = null;
    }
  }

  isHoraDisponivel(hora: string): boolean {
    const slot = this.horariosManha.find(s => s.hora === hora) || this.horariosTarde.find(s => s.hora === hora);
    return slot ? slot.disponivel : false;
  }

  validarPassoAPasso() {
    if (this.dataSelecionada && this.horaSelecionada) {
      this.mostrarAvisoErro = false;
      this.erroData = false;
      this.erroHora = false;
      return;
    }

    if (this.mostrarAvisoErro) {
      this.erroData = !this.dataSelecionada;
      this.erroHora = !this.horaSelecionada;
    }
  }

  confirmarAgendamento() {
    this.erroData = !this.dataSelecionada;
    this.erroHora = !this.horaSelecionada;

    if (this.erroData || this.erroHora) {
      this.mostrarAvisoErro = true;
      return;
    }

    if (this.dataSelecionada < this.dataMinimaPermitida) {
      alert('Não é possível marcar uma consulta para uma data que já passou!');
      return;
    }

    if (!this.isHojeDisponivel()) {
      alert('Não é possível marcar uma consulta para hoje. A hora limite para agendamentos é 18:30.');
      return;
    }

    if (this.dataSelecionada) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const dataHoje = `${ano}-${mes}-${dia}`;

      if (this.dataSelecionada === dataHoje && this.horaSelecionada) {
        const limite = new Date(hoje.getTime() + 30 * 60 * 1000);
        const horarioEscolhido = this.obterDataHoraSlot(this.horaSelecionada);

        if (horarioEscolhido < limite) {
          alert('Para agendar hoje, escolha um horário pelo menos 30 minutos no futuro.');
          return;
        }
      }
    }

    const idGravida = localStorage.getItem('idUtilizador');
    if (!idGravida) {
      alert('Não foi possível encontrar o ID da grávida. Faz login novamente.');
      return;
    }

    if (!this.idObstetraAtual) {
      alert('Não foi possível determinar o obstetra atribuído. Verifica os dados da sua conta.');
      return;
    }

    const dadosConsulta = {
      idGravida,
      idObstetra: this.idObstetraAtual,
      dataConsulta: this.dataSelecionada,
      horarioConsulta: this.horaSelecionada,
      descricaoConsulta: this.notas || 'Consulta de rotina'
    };

    if (this.consultaId) {
      this.consultaService.editarConsulta(this.consultaId, dadosConsulta).subscribe({
        next: (res: any) => {
          const consultaAtualizada = res.dados || res;
          this.localConsulta = consultaAtualizada?.local || 'Ala de Obstetrícia — Piso 2';
          this.agendadoComSucesso = true;
        },
        error: (erro: any) => {
          console.error('Erro ao atualizar:', erro);
          alert('Erro ao atualizar consulta: ' + (erro.error?.mensagem || 'Tenta novamente'));
        }
      });
    } else {
      this.consultaService.criarConsulta(dadosConsulta).subscribe({
        next: (res: any) => {
          const consultaCriada = res.dados || res;
          this.consultaId = consultaCriada?._id;
          this.localConsulta = consultaCriada?.local || 'Ala de Obstetrícia — Piso 2';
          this.agendadoComSucesso = true;
        },
        error: (erro: any) => {
          console.error('Erro detalhado:', erro);
          alert('Erro ao salvar: ' + (erro.error?.mensagem || 'Verifica o ligação ao servidor'));
        }
      });
    }
  }

  irParaInicio() {
    this.router.navigate(['/dashboard-gravida']);
  }

  irParaAgenda() {
    this.agendadoComSucesso = false;
    this.router.navigate(['/agenda-gravida']);
  }

  voltarAoFormulario() {
    this.agendadoComSucesso = false;
    if (this.dataSelecionada) {
      this.atualizarDisponibilidade();
    }
  }

  irParaNotificacoes() { this.router.navigate(['/notificacoes']); }
  
  irParaPerfil() {
    this.router.navigate(['/perfil-gravida']);
  }

  irParaTimeline() {
    this.router.navigate(['/timeline-gravida']);
  }
  
  irParaQuestionario() { this.router.navigate(['/questionario-gravida']); }

  logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}