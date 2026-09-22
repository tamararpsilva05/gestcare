
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultaService } from '../../../services/consulta';
import { ActivatedRoute } from '@angular/router';
import { NotificacaoService } from '../../../services/notificacao';


@Component({
    selector: 'app-agenda-medico',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './agenda-medico.html',
    styleUrls: ['./agenda-medico.css']
})
export class AgendaMedico implements OnInit {

    medicoId: string = '';
    todasConsultas: any[] = [];
    consultasDoDia: any[] = [];
    carregando: boolean = true;

    hoje: Date = new Date();
    mesSelecionado: number = new Date().getMonth();
    anoSelecionado: number = new Date().getFullYear();
    diaSelecionado: number = new Date().getDate();

    diasDoMes: (number | null)[] = [];
    nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    mensagemToast: string = '';
    mostrarConfirmacao: boolean = false;
    consultaParaDesmarcar: any = null;

    motivoDesmarcacao: string = '';

    motivosPredefinidos = [
        'Urgência Médica',
        'Problema de Agendamento',
        'Pedido da Grávida',
        'Conflito de horário',
        'Outro motivo'
    ];

    constructor(
        private consultaService: ConsultaService,
        private router: Router,
        private route: ActivatedRoute,
        private notificacaoService: NotificacaoService
    ) { }

    ngOnInit() {
        this.medicoId = localStorage.getItem('idUtilizador') || '';
        this.route.queryParams.subscribe(params => {
            if (params['dia'] && params['mes'] && params['ano']) {
                this.diaSelecionado = +params['dia'];
                this.mesSelecionado = +params['mes'];
                this.anoSelecionado = +params['ano'];
            }
        });
        this.gerarCalendario();
        this.carregarConsultas();
    }

    carregarConsultas() {
      this.carregando = true;
      this.consultaService.listarPorObstetra(this.medicoId).subscribe({
          next: (dados) => {
              this.todasConsultas = dados
                  .filter((c: any) => c.estado !== 2 && c.estado !== '2') 
                  .map((c: any) => ({ ...c, id: c._id }));
                  
              this.atualizarConsultasDoDia();
              this.carregando = false;
          },
          error: () => {
              this.carregando = false;
          }
      });
    }

    gerarCalendario() {
        const primeiroDia = new Date(this.anoSelecionado, this.mesSelecionado, 1).getDay();
        const totalDias = new Date(this.anoSelecionado, this.mesSelecionado + 1, 0).getDate();
        this.diasDoMes = [];

        
        for (let i = 0; i < primeiroDia; i++) {
            this.diasDoMes.push(null);
        }
        for (let i = 1; i <= totalDias; i++) {
            this.diasDoMes.push(i);
        }
    }

    atualizarConsultasDoDia() {
        this.consultasDoDia = this.todasConsultas.filter(c => {
            const data = new Date(c.dataConsulta);
            return data.getDate() === this.diaSelecionado &&
                data.getMonth() === this.mesSelecionado &&
                data.getFullYear() === this.anoSelecionado;
        });
    }

    selecionarDia(dia: number | null) {
        if (!dia) return;
        this.diaSelecionado = dia;
        this.atualizarConsultasDoDia();
    }

    temConsulta(dia: number | null): boolean {
        if (!dia) return false;
        return this.todasConsultas.some(c => {
            const data = new Date(c.dataConsulta);
            return data.getDate() === dia &&
                data.getMonth() === this.mesSelecionado &&
                data.getFullYear() === this.anoSelecionado;
        });
    }

    mesAnterior() {
        if (this.mesSelecionado === 0) {
            this.mesSelecionado = 11;
            this.anoSelecionado--;
        } else {
            this.mesSelecionado--;
        }
        this.gerarCalendario();
        this.atualizarConsultasDoDia();
    }

    proximoMes() {
        if (this.mesSelecionado === 11) {
            this.mesSelecionado = 0;
            this.anoSelecionado++;
        } else {
            this.mesSelecionado++;
        }
        this.gerarCalendario();
        this.atualizarConsultasDoDia();
    }

    eHoje(dia: number | null): boolean {
        if (!dia) return false;
        return dia === this.hoje.getDate() &&
            this.mesSelecionado === this.hoje.getMonth() &&
            this.anoSelecionado === this.hoje.getFullYear();
    }

    getEstado(consulta: any): string {
        const dataConsulta = new Date(consulta.dataConsulta);
        const agora = new Date();
        agora.setHours(0, 0, 0, 0);

        if (dataConsulta < agora) return 'Realizada';

        switch (consulta.estado) {
            case 0: return 'Pendente';
            case 1: return 'Confirmada';
            case 2: return 'Cancelada';
            default: return 'Pendente';
        }
    }

    private obterDataHoraConsulta(consulta: any): Date | null {
        if (!consulta?.dataConsulta) return null;
        const dataHora = new Date(consulta.dataConsulta);
        const hora = String(consulta.horarioConsulta || '').trim();
        const match = hora.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
            dataHora.setHours(Number(match[1]), Number(match[2]), 0, 0);
        }
        return dataHora;
    }

    consultaJaOcorreu(consulta: any): boolean {
        const dataHora = this.obterDataHoraConsulta(consulta);
        return !!dataHora && dataHora.getTime() < Date.now();
    }

    consultaDentroDas24Horas(consulta: any): boolean {
        const dataHora = this.obterDataHoraConsulta(consulta);
        if (!dataHora) return false;
        const diffMs = dataHora.getTime() - Date.now();
        return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
    }

    consultaPodeSerDesmarcada(consulta: any): boolean {
        return !this.consultaJaOcorreu(consulta) && !this.consultaDentroDas24Horas(consulta);
    }

    textoBloqueioDesmarcacao(consulta: any): string {
        if (this.consultaJaOcorreu(consulta)) return 'Já ocorreu';
        if (this.consultaDentroDas24Horas(consulta)) return 'Indisponível';
        return 'Indisponível';
    }

    mostrarToast(mensagem: string) {
        this.mensagemToast = mensagem;
        setTimeout(() => { this.mensagemToast = ''; }, 3000);
    }

    desmarcarConsulta(consulta: any) {
        if (!consulta?.id) return;

        if (this.consultaJaOcorreu(consulta)) {
            this.mostrarToast('Esta consulta já ocorreu e não pode ser desmarcada.');
            return;
        }

        if (this.consultaDentroDas24Horas(consulta)) {
            this.mostrarToast('Esta consulta está a menos de 24h e não pode ser desmarcada.');
            return;
        }

        this.consultaParaDesmarcar = consulta;
        this.mostrarConfirmacao = true;
    }

    confirmarDesmarcacao() {
        const consulta = this.consultaParaDesmarcar;
        if (!consulta) return;

        if (!this.motivoDesmarcacao.trim()) {
            this.mostrarToast('Por favor, seleciona ou escreve um motivo para a desmarcação.');
            return;
        }

        this.consultaService.eliminarConsultaComMotivo(consulta.id, this.motivoDesmarcacao).subscribe({
            next: () => {
                const idGravida = consulta.idGravida?._id || consulta.idGravida || '';
                const nomeMedico = localStorage.getItem('nomeUtilizador') || 'O médico';
                const dataFormatada = consulta.dataConsulta
                    ? new Date(consulta.dataConsulta).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
                    : 'data desconhecida';

                if (idGravida) {
                    this.notificacaoService.criarNotificacao({
                        idGravida,
                        descricaoNotificacao: `${nomeMedico} cancelou a sua consulta marcada para ${dataFormatada} às ${consulta.horarioConsulta}. Motivo: ${this.motivoDesmarcacao}`
                    }).subscribe();
                }

                this.todasConsultas = this.todasConsultas.filter(c => c.id !== consulta.id);
                this.atualizarConsultasDoDia();
                this.mostrarConfirmacao = false;
                this.consultaParaDesmarcar = null;
                this.motivoDesmarcacao = '';
                this.mostrarToast('Consulta desmarcada com sucesso!');
            },
            error: () => {
                this.mostrarToast('Erro ao desmarcar a consulta.');
                this.mostrarConfirmacao = false;
            }
        });
    }

    cancelarDesmarcacao() {
        this.mostrarConfirmacao = false;
        this.consultaParaDesmarcar = null;
        this.motivoDesmarcacao = '';
    }

    voltar() {
        this.router.navigate(['/dashboard-medico']);
    }

    irParaUtentes() {
        this.router.navigate(['/medico/utentes']);
    }

    irParaMarcarConsulta() { this.router.navigate(['/medico/marcar-consulta']); }
    irParaMarcarExame() { this.router.navigate(['/medico/marcar-exames']); }

    irParaPerfil() {
        this.router.navigate(['/medico/perfil']);
    }

    irParaAnalise(): void {
        this.router.navigate(['/medico/analise']);
    }

    logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}