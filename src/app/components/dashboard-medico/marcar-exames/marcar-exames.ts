import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GravidaService } from '../../../services/gravida';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-marcar-exame',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marcar-exames.html',
  styleUrls: ['./marcar-exames.css']
})
export class MarcarExame implements OnInit, OnDestroy {

  medicoId: string = '';
  medicoNome: string = '';
  gravidas: any[] = [];
  profissionais: any[] = [];           
  profissionalFiltrado: any = null;    
  carregando: boolean = true;

  
  gravidaSelecionada: string = '';
  dataSelecionada: string = '';
  horaSelecionada: string = '';
  tipoExameSelecionado: string = '';
  dataMinimaPermitida: string = '';

  tiposExame: string[] = [
    'Ecografia', 'Análises ao Sangue', 'Análises à Urina',
    'Cardiotocografia (CTG)', 'Amniocentese', 'Rastreio do 1º Trimestre',
    'Rastreio do 2º Trimestre', 'Teste de Tolerância à Glicose'
  ];

  horariosManha: any[] = [];
  horariosTarde: any[] = [];

  agendadoComSucesso: boolean = false;
  mostrarAvisoErro: boolean = false;
  erroGravida: boolean = false;
  erroData: boolean = false;
  erroHora: boolean = false;
  erroTipo: boolean = false;
  mensagemErro: string = '';

  private popstateListener = () => {
    const token = localStorage.getItem('token');
    const tipo = localStorage.getItem('tipoUtilizador');
    if (token) {
      if (tipo === 'gravida') this.router.navigate(['/dashboard-gravida']);
      else if (tipo === 'medico') this.router.navigate(['/dashboard-medico']);
      else if (tipo === 'admin') this.router.navigate(['/dashboard-admin']);
    }
  };

  private storageListener = (event: StorageEvent) => {
    if (event.key === 'token' && !event.newValue) this.router.navigate(['/']);
  };

  constructor(
    private router: Router,
    private gravidaService: GravidaService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    window.addEventListener('popstate', this.popstateListener);
    window.addEventListener('storage', this.storageListener);
    this.medicoId = localStorage.getItem('idUtilizador') || '';
    this.medicoNome = localStorage.getItem('nomeUtilizador') || 'Médico';
    this.dataMinimaPermitida = new Date().toISOString().split('T')[0];
    this.gerarHorarios();
    this.carregarGravidas();
    this.carregarProfissionais(); 
  }

  ngOnDestroy() {
    window.removeEventListener('popstate', this.popstateListener);
    window.removeEventListener('storage', this.storageListener);
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  carregarGravidas() {
    this.carregando = true;
    this.gravidaService.listarPorObstetra(this.medicoId).subscribe({
      next: (dados) => { this.gravidas = dados; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  
  carregarProfissionais() {
    this.http.get<any[]>('http://localhost:3000/api/profissionais', {
      headers: this.getHeaders()
    }).subscribe({
      next: (dados) => { this.profissionais = dados; },
      error: () => { this.profissionais = []; }
    });
  }

  alterouTipoExame() {
    this.profissionalFiltrado = this.profissionais.find(
      p => p.especialidade === this.tipoExameSelecionado
    ) || null;
  }

  gerarHorarios() {
    const manha = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
    const tarde = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
    this.horariosManha = manha.map(h => ({ hora: h, disponivel: true }));
    this.horariosTarde = tarde.map(h => ({ hora: h, disponivel: true }));
  }

  alterouData() {
    this.horaSelecionada = '';
    this.gerarHorarios();
    if (this.dataSelecionada && this.gravidaSelecionada) this.verificarHorariosOcupados();
  }

  alterouGravida() {
    this.horaSelecionada = '';
    this.gerarHorarios();
    if (this.dataSelecionada && this.gravidaSelecionada) this.verificarHorariosOcupados();
  }

  verificarHorariosOcupados() {
    const todosHorarios = [...this.horariosManha, ...this.horariosTarde];
    todosHorarios.forEach(slot => {
      this.http.get<any>(`http://localhost:3000/api/consultas/verificar-disponibilidade`, {
        headers: this.getHeaders(),
        params: { idGravida: this.gravidaSelecionada, dataConsulta: this.dataSelecionada, horarioConsulta: slot.hora }
      }).subscribe({ next: (res) => { slot.disponivel = res.disponivel; } });
    });
  }

  selecionarHora(hora: string, disponivel: boolean) {
    if (!disponivel) return;
    this.horaSelecionada = hora;
  }

  confirmarAgendamento() {
    this.erroGravida = !this.gravidaSelecionada;
    this.erroData = !this.dataSelecionada;
    this.erroHora = !this.horaSelecionada;
    this.erroTipo = !this.tipoExameSelecionado;

    if (this.erroGravida || this.erroData || this.erroHora || this.erroTipo) {
      this.mostrarAvisoErro = true;
      return;
    }

    this.mostrarAvisoErro = false;

    const dados = {
      idGravida: this.gravidaSelecionada,
      idProfissional: this.profissionalFiltrado?._id || null, 
      tipoExame: this.tipoExameSelecionado,
      dataExame: this.dataSelecionada,
      horarioExame: this.horaSelecionada,
      estado: 0
    };

    this.http.post('http://localhost:3000/api/exames', dados, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => { this.agendadoComSucesso = true; },
      error: (err) => {
        this.mensagemErro = err.error?.mensagem || 'Erro ao marcar exame.';
        this.mostrarAvisoErro = true;
      }
    });
  }

  getNomeGravida(): string {
    const g = this.gravidas.find(g => g._id === this.gravidaSelecionada);
    return g ? g.nome : '';
  }

  voltarAoFormulario() {
    this.agendadoComSucesso = false;
    this.horaSelecionada = '';
    this.dataSelecionada = '';
    this.gravidaSelecionada = '';
    this.tipoExameSelecionado = '';
    this.profissionalFiltrado = null;
    this.gerarHorarios();
  }

  irParaAgenda() { this.router.navigate(['/medico/agenda']); }
  irParaUtentes() { this.router.navigate(['/medico/utentes']); }
  irParaPerfil() { this.router.navigate(['/medico/perfil']); }
  irParaAnalise(): void {
        this.router.navigate(['/medico/analise']);
  }
  irParaMarcarConsulta() { this.router.navigate(['/medico/marcar-consulta']); }
  voltar() { this.router.navigate(['/dashboard-medico']); }

  logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}