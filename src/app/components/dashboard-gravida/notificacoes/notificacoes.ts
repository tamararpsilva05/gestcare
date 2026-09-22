import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ConsultaService } from '../../../services/consulta';
import { ExameService } from '../../../services/exame';

@Component({
    selector: 'app-notificacoes',
    templateUrl: './notificacoes.html',
    styleUrls: ['./notificacoes.css'],
    imports: [CommonModule, RouterLink]
})
export class Notificacoes implements OnInit {
    nome: string = '';
    gravidaId: string | null = null;
    abaAtiva: string = 'todas';

    notificacoesTotais: any[] = [];
    notificacoesFiltradas: any[] = [];
    loading: boolean = true;
    idAConfirmar: string | null = null;

    totalAmanha: number = 0;
    totalFuturas: number = 0;

    constructor(
        private router: Router,
        private consultaService: ConsultaService,
        private exameService: ExameService
    ) { }

    ngOnInit(): void {
        this.nome = localStorage.getItem('nomeUtilizador') || 'Grávida';
        this.gravidaId = localStorage.getItem('idUtilizador') ||
            localStorage.getItem('gravidaId') ||
            localStorage.getItem('id') ||
            localStorage.getItem('userId');

        this.carregarDadosDaBaseDeDados();
    }

    carregarDadosDaBaseDeDados() {
        if (!this.gravidaId) {
            console.warn("Nenhum ID de grávida encontrado.");
            this.loading = false;
            return;
        }

        this.loading = true;

        forkJoin({
            consultas: this.consultaService.listarConsultas(this.gravidaId),
            exames: this.exameService.listarExames(this.gravidaId)
        }).subscribe({
            next: ({ consultas, exames }) => {
                const notificacoesConsultas = consultas.map((item: any) => this.criarNotificacaoConsulta(item));
                const notificacoesExames = exames.map((item: any) => this.criarNotificacaoExame(item));

                this.notificacoesTotais = [...notificacoesConsultas, ...notificacoesExames];
                this.filtrarNotificacoes();
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Erro ao carregar:', err);
                this.loading = false;
            }
        });
    }

    criarNotificacaoConsulta(item: any) {
        const dataReal: any = item.dataConsulta || item.data || item.dataHora;
        const nomeMedico: string = item.idObstetra?.nome || item.medico || 'Obstetra';
        const hora: string = item.horarioConsulta || item.hora || '';
        const horaFormatada = hora ? ` às ${hora}` : '';

        if (item.idGravida?.nome) { this.nome = item.idGravida.nome; }

        const datas = this.prepararDatasNotificacao(dataReal);
        const estado = this.normalizarEstado(item.estado);

        return {
            id: item._id || item.id,
            origem: 'consulta',
            titulo: `Lembrete: ${item.tipoConsulta || item.tipo || 'Consulta de Obstetrícia'}`,
            data: datas.dataTratada,
            dataVisual: datas.dataExibicao,
            dataFormatada: this.verificarSeEAmanha(dataReal) ? 'Amanhã' : 'Agendado',
            tipo: 'consulta',
            descricao: `Com o(a) Dr(a). ${nomeMedico}${horaFormatada}. Local: ${item.local || 'Ala de Obstetrícia'}.`,
            estado,
            confirmada: estado === 1,
            nova: estado === 0 
        };
    }

    criarNotificacaoExame(item: any) {
        const dataReal: any = item.dataExame || item.data || item.dataHora;
        const nomeProfissional: string = item.idProfissional?.nomeProfissional || item.nomeProfissional || 'Profissional de Saúde';
        const hora: string = item.horarioExame || item.hora || '';
        const horaFormatada = hora ? ` às ${hora}` : '';

        if (item.idGravida?.nome) { this.nome = item.idGravida.nome; }

        const datas = this.prepararDatasNotificacao(dataReal);
        const estado = this.normalizarEstado(item.estado);

        return {
            id: item._id || item.id,
            origem: 'exame',
            titulo: `Lembrete: ${item.tipoExame || item.tipo || 'Exame'}`,
            data: datas.dataTratada,
            dataVisual: datas.dataExibicao,
            dataFormatada: this.verificarSeEAmanha(dataReal) ? 'Amanhã' : 'Agendado',
            tipo: 'exame',
            descricao: `Com ${nomeProfissional}${horaFormatada}.`,
            estado,
            confirmada: estado === 1,
            nova: estado === 0 
        };
    }

    prepararDatasNotificacao(dataReal: any) {
        const dataTratada = this.extrairApenasData(dataReal);
        let dataExibicao = dataTratada;

        if (dataTratada !== 'Sem Data' && dataTratada !== 'Data Inválida') {
            const partes = dataTratada.split('-');
            if (partes.length === 3) { dataExibicao = `${partes[2]}/${partes[1]}/${partes[0]}`; }
        }

        return { dataTratada, dataExibicao };
    }

    confirmarPresenca(notificacao: any) {
        this.idAConfirmar = notificacao.id;

        const pedido = notificacao.origem === 'exame'
            ? this.exameService.editarExame(notificacao.id, { estado: 1 })
            : this.consultaService.editarConsulta(notificacao.id, { estado: 1 });

        pedido.subscribe({
            next: () => {
                this.notificacoesTotais = this.notificacoesTotais.map(n =>
                    n.id === notificacao.id && n.origem === notificacao.origem
                        ? { ...n, estado: 1, confirmada: true, nova: false } 
                        : n
                );

                this.filtrarNotificacoes();
                this.idAConfirmar = null;
            },
            error: (err) => {
                console.error('Erro:', err);
                this.idAConfirmar = null;
            }
        });
    }

    normalizarEstado(estado: any): number {
        if (estado === 1 || estado === '1' || estado === true) return 1;
        if (typeof estado === 'string' && estado.toLowerCase() === 'confirmada') return 1;
        if (estado === 2 || estado === '2') return 2; 
        return 0;
    }

    extrairApenasData(dataInput: any): string {
        if (!dataInput) return 'Sem Data';
        if (dataInput instanceof Date) return this.formatarComponentesData(dataInput);
        const dataStr = String(dataInput).trim();
        if (dataStr.includes('T')) return dataStr.split('T')[0];
        const matchPT = dataStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
        if (matchPT) return `${matchPT[3]}-${matchPT[2].padStart(2, '0')}-${matchPT[1].padStart(2, '0')}`;
        const matchISO = dataStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
        if (matchISO) return `${matchISO[1]}-${matchISO[2].padStart(2, '0')}-${matchISO[3].padStart(2, '0')}`;
        const d = new Date(dataInput);
        if (!isNaN(d.getTime())) return this.formatarComponentesData(d);
        return 'Data Inválida';
    }

    formatarComponentesData(d: Date): string {
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    verificarSeEAmanha(dataInput: any): boolean {
        if (!dataInput) return false;
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        return this.extrairApenasData(dataInput) === this.extrairApenasData(amanha);
    }

    filtrarNotificacoes() {
        const hoje = new Date();
        const dataHojeStr = this.formatarComponentesData(hoje);
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        const dataAmanhaStr = this.formatarComponentesData(amanha);

        const validasEFuturas = this.notificacoesTotais.filter(n =>
            n.data !== 'Data Inválida' && n.data !== 'Sem Data' && n.data >= dataHojeStr
            && n.estado !== 2
        );

        this.totalFuturas = validasEFuturas.filter(n => !n.confirmada).length;
        this.totalAmanha = validasEFuturas.filter(n => n.data === dataAmanhaStr && !n.confirmada).length;

        if (this.abaAtiva === 'amanha') {
            this.notificacoesFiltradas = validasEFuturas.filter(n => n.data === dataAmanhaStr);
        } else {
            this.notificacoesFiltradas = validasEFuturas;
        }
        this.notificacoesFiltradas.sort((a, b) => a.data.localeCompare(b.data));
    }

    mudarAba(aba: string) { this.abaAtiva = aba; this.filtrarNotificacoes(); }
    irParaInicio() { this.router.navigate(['/dashboard-gravida']); }
    irParaConsultas() { this.router.navigate(['/consultas-gravida']); }
    irParaAgenda() { this.router.navigate(['/agenda-gravida']); }
    irParaPerfil() { this.router.navigate(['/perfil-gravida']); }
    irParaTimeline() { this.router.navigate(['/timeline-gravida']); }
    irParaQuestionario() { this.router.navigate(['/questionario-gravida']); }

    logout() {
        localStorage.clear();
        this.router.navigate(['/'], { replaceUrl: true });
    }
}