import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConsultaService } from '../../../services/consulta';
import { ExameService } from '../../../services/exame';
import { NotificacaoService } from '../../../services/notificacao';

@Component({
    selector: 'app-agenda',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './agenda.html',
    styleUrls: ['./agenda.css'],
})
export class Agenda implements OnInit {
    nome: string = '';
    gravidaId: string = '';

    diasSemana: any[] = [];
    mesAnoAtual: string = '';

    diaSelecionado: string = 'todos';

    consultas: any[] = [];
    exames: any[] = [];

    mostrarPassadas: boolean = false;

    mostrarConfirmacaoConsulta: boolean = false;
    mostrarConfirmacaoExame: boolean = false;
    consultaParaDesmarcar: any = null;
    exameParaDesmarcar: any = null;
    motivoDesmarcacaoConsulta: string = '';
    motivoDesmarcacaoExame: string = '';

    motivosPredefinidos = [
        'Urgência Pessoal',
        'Problema de Saúde',
        'Conflito de Horário',
        'Problema de Transportes',
        'Outro motivo'
    ];

    constructor(
        private router: Router,
        private consultaService: ConsultaService,
        private exameService: ExameService,
        private notificacaoService: NotificacaoService
    ) { }

    ngOnInit(): void {
        this.configurarSemanaAtual();
        this.nome = localStorage.getItem('nomeUtilizador') || 'Grávida';

        this.gravidaId = localStorage.getItem('idUtilizador') ||
            localStorage.getItem('gravidaId') ||
            localStorage.getItem('id') ||
            localStorage.getItem('userId') || '';

        this.carregarConsultas();
        this.carregarExames();
    }

    configurarSemanaAtual() {
        const hoje = new Date();
        const diaSemana = hoje.getDay(); 
        
        const distanciaParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
        const segundaFeira = new Date(hoje);
        segundaFeira.setDate(hoje.getDate() + distanciaParaSegunda);

        const nomesDias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
        this.diasSemana = [];

        for (let i = 0; i < 7; i++) {
            const dataDia = new Date(segundaFeira);
            dataDia.setDate(segundaFeira.getDate() + i);

            const numFormatado = String(dataDia.getDate()).padStart(2, '0');
            const eHoje = dataDia.toDateString() === hoje.toDateString();

            this.diasSemana.push({
                nome: nomesDias[i],
                num: numFormatado,
                ativo: eHoje, 
                temConsulta: false,
                dataReal: dataDia
            });
        }

        const opcoes: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
        const textoMesAno = hoje.toLocaleDateString('pt-PT', opcoes);
        this.mesAnoAtual = textoMesAno.charAt(0).toUpperCase() + textoMesAno.slice(1);
    }

    private atualizarBolinhasCalendario() {
        if (!this.diasSemana || this.diasSemana.length === 0) return;

        this.diasSemana.forEach(dia => {
            const temConsulta = this.consultas.some(c => 
                c.fullDate && new Date(c.fullDate).toDateString() === dia.dataReal.toDateString()
            );
            const temExame = this.exames.some(e => 
                e.fullDate && new Date(e.fullDate).toDateString() === dia.dataReal.toDateString()
            );
            dia.temConsulta = temConsulta || temExame;
        });
    }

   selecionarDia(dia: any) {
        this.diasSemana.forEach(d => d.ativo = false);
        dia.ativo = true;
        
        const opcoes: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        this.diaSelecionado = dia.dataReal.toLocaleDateString('pt-PT', opcoes); 
    }

    mostrarTodasAsConsultas() {
        this.diasSemana.forEach(d => d.ativo = false);
        this.diaSelecionado = 'todos';
    }

    togglePast() {
        this.mostrarPassadas = !this.mostrarPassadas;
    }

    

    private carregarConsultas() {
        if (!this.gravidaId) {
            console.warn("Nenhum ID de grávida encontrado.");
            return;
        }

        this.consultaService.listarConsultas(this.gravidaId).subscribe({
            next: (res: any[]) => {
                this.consultas = res
                    .filter(c => c.estado !== 2 && c.estado !== '2') // 🔥 Remove as consultas canceladas
                    .map(c => {
                        const data = c.dataConsulta ? new Date(c.dataConsulta) : null;
                        const dia = data ? String(data.getDate()).padStart(2, '0') : '';
                        const mes = data ? data.toLocaleString('default', { month: 'short' }).toUpperCase() : '';

                        const medico = c.idObstetra?.nome || c.obstetraNome || '—';
                        const iniciais = medico !== '—'
                            ? medico.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()
                            : 'EX';

                        const estado = this.normalizarEstadoConsulta(c.estado);
                        return {
                            id: c._id,
                            idObstetra: c.idObstetra,
                            estado,
                            dia,
                            mes,
                            fullDate: data,
                            medico,
                            especialidade: c.descricaoConsulta || c.especialidade || 'Consulta',
                            sala: c.local || '—',
                            hora: c.horarioConsulta || (data ? data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
                            statusClass: estado === 1 ? 'confirmado' : 'pendente',
                            statusTexto: estado === 1 ? 'Confirmado' : 'Pendente',
                            iniciais,
                            isEcografia: !!c.isEcografia
                        };
                    });
                this.atualizarBolinhasCalendario();
            },
            error: err => console.error('Erro ao carregar consultas', err)
        });
    }

    private carregarExames() {
        if (!this.gravidaId) {
            console.warn("Nenhum ID de grávida encontrado para carregar exames.");
            return;
        }

        this.exameService.listarExames(this.gravidaId).subscribe({
            next: (res: any[]) => {
                this.exames = res
                    .filter(e => e.estado !== 2 && e.estado !== '2') 
                    .map(e => {
                        const dataExame = e.dataExame ? new Date(e.dataExame) : new Date();
                        const dia = String(dataExame.getUTCDate()).padStart(2, '0');
                        const mes = dataExame.toLocaleString('default', { month: 'short' }).toUpperCase().replace('.', '');

                        let medicoNome = '';
                        let tipoProfissional = '';
                        let especialidadeExame = '';

                        const idProfissional = e.idProfissional?._id || e.idProfissional;
                        const idProfStr = idProfissional ? idProfissional.toString() : '';

                        if (idProfStr === '6a1fe3b1764a4f77795b5944') {
                            medicoNome = 'Dr. Ricardo Melo';
                            tipoProfissional = 'Médico';
                            especialidadeExame = 'Obstetrícia';
                        } else {
                            medicoNome = e.idProfissional?.nomeProfissional || e.nomeProfissional || 'Profissional de Saúde';
                            tipoProfissional = e.idProfissional?.tipoProfissional || e.tipoProfissional || 'Especialista';
                            especialidadeExame = e.idProfissional?.especialidade || e.especialidade || 'Geral';
                        }

                        const iniciais = medicoNome
                            ? medicoNome.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()
                            : 'EX';
                        const estado = this.normalizarEstadoConsulta(e.estado);

                        return {
                            id: e._id,
                            estado,
                            tipo: tipoProfissional,
                            especialidade: especialidadeExame,
                            medico: medicoNome,
                            profissional: medicoNome,
                            local: e.local || '',
                            data: dataExame,
                            fullDate: dataExame,
                            dia: dia,
                            mes: mes,
                            hora: e.horarioExame || '09:00',
                            statusClass: estado === 1 ? 'confirmado' : 'pendente',
                            statusTexto: estado === 1 ? 'Confirmado' : 'Pendente',
                            iniciais: iniciais,
                            exameNome: e.tipoExame || 'Exame',
                            isUrgente: false
                        };
                    });
                this.atualizarBolinhasCalendario();
            },
            error: err => console.error('Erro ao carregar exames:', err)
        });
    }

    private normalizarEstadoConsulta(estado: any): number {
        if (estado === 1 || estado === '1' || estado === true) return 1;
        if (typeof estado === 'string' && estado.toLowerCase() === 'confirmada') return 1;
        return 0;
    }

    private obterDataHoraMarcacao(marcacao: any): Date | null {
        if (!marcacao?.fullDate) return null;

        const dataHora = new Date(marcacao.fullDate);
        const hora = String(marcacao.hora || '').trim();
        const matchHora = hora.match(/^(\d{1,2}):(\d{2})/);

        if (matchHora) {
            dataHora.setHours(Number(matchHora[1]), Number(matchHora[2]), 0, 0);
        }
        return dataHora;
    }

    get consultasFiltradas() {
        if (this.diaSelecionado === 'todos') return this.consultas;
        
        const opcoes: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        return this.consultas.filter(c => {
            if (!c.fullDate) return false;
            const dataFormatada = new Date(c.fullDate).toLocaleDateString('pt-PT', opcoes);
            return dataFormatada === this.diaSelecionado;
        });
    }

    get examesFiltrados() {
        if (this.diaSelecionado === 'todos') return this.exames;
        
        const opcoes: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        return this.exames.filter(e => {
            if (!e.fullDate) return false;
            const dataFormatada = new Date(e.fullDate).toLocaleDateString('pt-PT', opcoes);
            return dataFormatada === this.diaSelecionado;
        });
    }

    get examesFuturos() {
        const agora = new Date().getTime();
        return this.exames
            .filter(e => {
                const dataHora = this.obterDataHoraMarcacao(e);
                return dataHora && dataHora.getTime() >= agora;
            })
            .sort((a, b) => this.obterDataHoraMarcacao(a)!.getTime() - this.obterDataHoraMarcacao(b)!.getTime());
    }

    get examesPassados() {
        const agora = new Date().getTime();
        return this.exames
            .filter(e => {
                const dataHora = this.obterDataHoraMarcacao(e);
                return dataHora && dataHora.getTime() < agora;
            })
            .sort((a, b) => this.obterDataHoraMarcacao(b)!.getTime() - this.obterDataHoraMarcacao(a)!.getTime())
            .map(e => ({ ...e, statusTexto: 'Concluído', statusClass: 'concluido' }));
    }

    get consultasFuturas() {
        const agora = new Date().getTime();
        return this.consultas
            .filter(c => {
                const dataHora = this.obterDataHoraMarcacao(c);
                return dataHora && dataHora.getTime() >= agora;
            })
            .sort((a, b) => this.obterDataHoraMarcacao(a)!.getTime() - this.obterDataHoraMarcacao(b)!.getTime());
    }

    get consultasPassadas() {
        const agora = new Date().getTime();
        return this.consultas
            .filter(c => {
                const dataHora = this.obterDataHoraMarcacao(c);
                return dataHora && dataHora.getTime() < agora;
            })
            .sort((a, b) => this.obterDataHoraMarcacao(b)!.getTime() - this.obterDataHoraMarcacao(a)!.getTime())
            .map(c => ({ ...c, statusTexto: 'Concluído', statusClass: 'concluido' }));
    }

    get historicoCompleto() {
        const consultas = this.consultasPassadas.map(c => ({ ...c, origem: 'consulta' }));
        const exames = this.examesPassados.map(e => ({ ...e, origem: 'exame' }));
        const todos = [...consultas, ...exames];

        return todos.sort((a, b) => {
            const tempoA = this.obterDataHoraMarcacao(a)?.getTime() || 0;
            const tempoB = this.obterDataHoraMarcacao(b)?.getTime() || 0;
            return tempoB - tempoA;
        });
    }

    get proximaConsulta() {
        return this.consultasFuturas.length ? this.consultasFuturas[0] : null;
    }

    get proximaConsultaTexto() {
        if (!this.proximaConsulta?.fullDate) return 'Sem consultas próximas';
        const now = new Date();
        const diffMs = this.proximaConsulta.fullDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'Hoje';
        return `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }

    consultaJaOcorreu(consulta: any): boolean {
        const dataHoraConsulta = this.obterDataHoraMarcacao(consulta);
        return !!dataHoraConsulta && dataHoraConsulta.getTime() < Date.now();
    }

    exameJaOcorreu(exame: any): boolean {
        const dataHoraExame = this.obterDataHoraMarcacao(exame);
        return !!dataHoraExame && dataHoraExame.getTime() < Date.now();
    }

    marcacaoDentroDas24Horas(marcacao: any): boolean {
        const dataHoraMarcacao = this.obterDataHoraMarcacao(marcacao);
        if (!dataHoraMarcacao) return false;
        const diferencaMs = dataHoraMarcacao.getTime() - Date.now();
        const vinteQuatroHorasMs = 24 * 60 * 60 * 1000;
        return diferencaMs > 0 && diferencaMs <= vinteQuatroHorasMs;
    }

    consultaPodeSerDesmarcada(consulta: any): boolean {
        return !this.consultaJaOcorreu(consulta) && !this.marcacaoDentroDas24Horas(consulta);
    }

    examePodeSerDesmarcado(exame: any): boolean {
        return !this.exameJaOcorreu(exame) && !this.marcacaoDentroDas24Horas(exame);
    }

    textoBloqueioDesmarcacao(marcacao: any): string {
        if (this.consultaJaOcorreu(marcacao) || this.exameJaOcorreu(marcacao)) return 'Já ocorreu';
        if (this.marcacaoDentroDas24Horas(marcacao)) return ' Indisponível';
        return 'Indisponível';
    }

    mostrarNotificacao(mensagem: string) {
        const toast = document.getElementById('toast-notificacao');
        const texto = document.getElementById('texto-toast');

        if (toast && texto) {
            texto.innerText = mensagem;
            toast.classList.add('mostrar');
            setTimeout(() => toast.classList.remove('mostrar'), 3000);
        }
    }

    desmarcarConsulta(consulta: any) {
        if (!consulta || !consulta.id) return;
        if (this.consultaJaOcorreu(consulta)) {
            this.mostrarNotificacao('Esta consulta já ocorreu e não pode ser desmarcada.');
            return;
        }
        if (this.marcacaoDentroDas24Horas(consulta)) {
            this.mostrarNotificacao('Esta consulta está a menos de 24h e não pode ser desmarcada pelo site.');
            return;
        }
        this.consultaParaDesmarcar = consulta;
        this.mostrarConfirmacaoConsulta = true;
    }

    confirmarDesmarcacaoConsulta() {
        const consulta = this.consultaParaDesmarcar;
        if (!consulta) return;

        if (!this.motivoDesmarcacaoConsulta.trim()) {
            this.mostrarNotificacao('Por favor, selecione ou escreva o motivo para a desmarcação.');
            return;
        }

        this.consultaService.eliminarConsultaComMotivo(consulta.id, this.motivoDesmarcacaoConsulta).subscribe({
            next: () => {
                const idObstetra = consulta.idObstetra?._id || consulta.idObstetra || '';
                const nomeGravida = localStorage.getItem('nomeUtilizador') || 'A grávida';
                const dataFormatada = consulta.fullDate
                    ? new Date(consulta.fullDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
                    : 'data desconhecida';

                if (idObstetra) {
                    this.notificacaoService.criarNotificacao({
                        idObstetra,
                        descricaoNotificacao: `${nomeGravida} cancelou a consulta marcada para ${dataFormatada} às ${consulta.hora}. Motivo: ${this.motivoDesmarcacaoConsulta}`
                    }).subscribe();
                }

                this.consultas = this.consultas.filter(c => c.id !== consulta.id);
                this.atualizarBolinhasCalendario();
                this.mostrarConfirmacaoConsulta = false;
                this.consultaParaDesmarcar = null;
                this.motivoDesmarcacaoConsulta = '';
                this.mostrarNotificacao('Consulta desmarcada com sucesso!');
            },
            error: () => {
                this.mostrarNotificacao('Erro ao desmarcar a consulta.');
                this.mostrarConfirmacaoConsulta = false;
            }
        });
    }

    cancelarDesmarcacaoConsulta() {
        this.mostrarConfirmacaoConsulta = false;
        this.consultaParaDesmarcar = null;
        this.motivoDesmarcacaoConsulta = '';
    }

    desmarcarExame(exame: any) {
        if (this.marcacaoDentroDas24Horas(exame)) {
            this.mostrarNotificacao('Este exame está a menos de 24h e não pode ser desmarcado pelo site.');
            return;
        }
        if (!this.examePodeSerDesmarcado(exame)) {
            this.mostrarNotificacao('Este exame já ocorreu e não pode ser desmarcado.');
            return;
        }
        this.exameParaDesmarcar = exame;
        this.mostrarConfirmacaoExame = true;
    }

    confirmarDesmarcacaoExame() {
        const exame = this.exameParaDesmarcar;
        if (!exame) return;

        if (!this.motivoDesmarcacaoExame.trim()) {
            this.mostrarNotificacao('Por favor, selecione ou escreva o motivo para a desmarcação.');
            return;
        }

        this.exameService.eliminarExameComMotivo(exame.id, this.motivoDesmarcacaoExame).subscribe({
            next: () => {
                this.carregarExames();
                this.mostrarConfirmacaoExame = false;
                this.exameParaDesmarcar = null;
                this.motivoDesmarcacaoExame = '';
                this.mostrarNotificacao('Exame desmarcado com sucesso!');
            },
            error: () => {
                this.mostrarNotificacao('Erro ao desmarcar o exame.');
                this.mostrarConfirmacaoExame = false;
            }
        });
    }

    cancelarDesmarcacaoExame() {
        this.mostrarConfirmacaoExame = false;
        this.exameParaDesmarcar = null;
        this.motivoDesmarcacaoExame = '';
    }

    trackByConsulta(index: number, consulta: any): string {
        return `${consulta.dia}-${consulta.hora}-${consulta.medico || consulta.exameNome}`;
    }


    irParaInicio() { this.router.navigate(['/dashboard-gravida']); }
    irParaPerfil() { this.router.navigate(['/perfil-gravida']); }
    irParaConsultas() { this.router.navigate(['/consultas-gravida']); }
    irParaAgenda() { this.router.navigate(['/agenda-gravida']); }
    irParaQuestionario() { this.router.navigate(['/questionario-gravida']); }
    irParaNotificacoes() { this.router.navigate(['/notificacoes']); }
    irParaTimeline() { this.router.navigate(['/timeline-gravida']); }
    
    logout() {
        localStorage.clear();
        this.router.navigate(['/'], { replaceUrl: true });
    }
}