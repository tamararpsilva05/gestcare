import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GravidaService } from '../../../services/gravida';
import { ConsultaService } from '../../../services/consulta';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-marcar-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marcar-consulta.html',
  styleUrls: ['./marcar-consulta.css']
})
export class MarcarConsulta implements OnInit {

  medicoId: string = '';
  medicoNome: string = '';
  gravidas: any[] = [];
  carregando: boolean = true;

  
  gravidaSelecionada: string = '';
  dataSelecionada: string = '';
  horaSelecionada: string = '';
  notas: string = '';
  localConsulta: string = 'Ala de Obstetrícia — Piso 2';

  
  horariosManha: any[] = [];
  horariosTarde: any[] = [];

  
  agendadoComSucesso: boolean = false;
  mostrarAvisoErro: boolean = false;
  erroGravida: boolean = false;
  erroData: boolean = false;
  erroHora: boolean = false;
  mensagemErro: string = '';
  dataMinimaPermitida: string = '';

  constructor(
    private router: Router,
    private gravidaService: GravidaService,
    private consultaService: ConsultaService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.medicoId = localStorage.getItem('idUtilizador') || '';
    this.medicoNome = localStorage.getItem('nomeUtilizador') || 'Médico';
    this.dataMinimaPermitida = new Date().toISOString().split('T')[0];
    this.gerarHorarios();
    this.carregarGravidas();
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  carregarGravidas() {
    this.carregando = true;
    this.gravidaService.listarPorObstetra(this.medicoId).subscribe({
      next: (dados) => {
        this.gravidas = dados;
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  gerarHorarios() {
    const manha = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'];
    const tarde = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
    this.horariosManha = manha.map(h => ({ hora: h, disponivel: true }));
    this.horariosTarde = tarde.map(h => ({ hora: h, disponivel: true }));
  }

  alterouData() {
    this.horaSelecionada = '';
    this.gerarHorarios();

    if (this.dataSelecionada && this.gravidaSelecionada) {
      this.verificarHorariosOcupados();
    }
  }

  alterouGravida() {
    this.horaSelecionada = '';
    this.gerarHorarios();

    if (this.dataSelecionada && this.gravidaSelecionada) {
      this.verificarHorariosOcupados();
    }
  }

  verificarHorariosOcupados() {
    const todosHorarios = [...this.horariosManha, ...this.horariosTarde];

    todosHorarios.forEach(slot => {
      this.http.get<any>(
        `http://localhost:3000/api/consultas/verificar-disponibilidade`,
        {
          headers: this.getHeaders(),
          params: {
            idGravida: this.gravidaSelecionada,
            dataConsulta: this.dataSelecionada,
            horarioConsulta: slot.hora
          }
        }
      ).subscribe({
        next: (res) => {
          slot.disponivel = res.disponivel;
        }
      });
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

    if (this.erroGravida || this.erroData || this.erroHora) {
      this.mostrarAvisoErro = true;
      return;
    }

    this.mostrarAvisoErro = false;

    const dados = {
      idGravida: this.gravidaSelecionada,
      idObstetra: this.medicoId,
      dataConsulta: this.dataSelecionada,
      horarioConsulta: this.horaSelecionada,
      local: this.localConsulta,
      descricaoConsulta: this.notas,
      criadaPor: 'medico',
      estado: 0
    };

    this.consultaService.criarConsulta(dados).subscribe({
      next: () => {
        this.agendadoComSucesso = true;
      },
      error: (err) => {
        this.mensagemErro = err.error?.mensagem || 'Erro ao marcar consulta.';
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
    this.notas = '';
    this.gerarHorarios();
  }

  irParaAgenda() { this.router.navigate(['/medico/agenda']); }
  irParaUtentes() { this.router.navigate(['/medico/utentes']); }
  irParaMarcarExame() { this.router.navigate(['/medico/marcar-exames']); }
  irParaPerfil() { this.router.navigate(['/medico/perfil']); }
  irParaAnalise(): void {
        this.router.navigate(['/medico/analise']);
  }
  voltar() { this.router.navigate(['/dashboard-medico']); }

  logout() {
    localStorage.clear();
    window.history.pushState(null, '', '/');
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
