import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultaService } from '../../services/consulta';
import { GravidaService } from '../../services/gravida';
import { NotificacaoService } from '../../services/notificacao';
import { ObstetraService } from '../../services/obstetra';

@Component({
  selector: 'app-dashboard-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-medico.html',
  styleUrls: ['./dashboard-medico.css'],
})
export class DashboardMedico implements OnInit {

  nomeExibido: string = '';
  medicoId: string = '';
  paginaAtiva: string = 'inicio';
  obrigarTrocarSenha: boolean = false;
  novaSenhaObrigatoria: string = '';
  confirmarSenhaObrigatoria: string = '';
  erroSenhaObrigatoria: string = '';
  sucessoSenhaObrigatoria: string = '';

  totalPacientes: number = 0;
  consultasHoje: number = 0;
  proximasConsultas: any[] = [];
  consultasNovas: any[] = [];
  carregando: boolean = true;
  notificacoesMedico: any[] = [];

  constructor(
    private router: Router,
    private consultaService: ConsultaService,
    private gravidaService: GravidaService,
    private notificacaoService: NotificacaoService,
    private obstetraService: ObstetraService
  ) { }

  ngOnInit() {
    this.nomeExibido = localStorage.getItem('nomeUtilizador') || 'Médico';
    this.medicoId = localStorage.getItem('idUtilizador') || '';
    this.obrigarTrocarSenha = localStorage.getItem('mustChangePassword') === 'true';
    this.carregarDados();
  }

  alterarPasswordObrigatoria() {
    this.erroSenhaObrigatoria = '';
    this.sucessoSenhaObrigatoria = '';

    if (!this.novaSenhaObrigatoria || !this.confirmarSenhaObrigatoria) {
      this.erroSenhaObrigatoria = 'Preenche todos os campos de password.';
      return;
    }

    if (this.novaSenhaObrigatoria !== this.confirmarSenhaObrigatoria) {
      this.erroSenhaObrigatoria = 'As passwords não coincidem.';
      return;
    }

    if (this.novaSenhaObrigatoria.length < 6) {
      this.erroSenhaObrigatoria = 'A password deve ter pelo menos 6 caracteres.';
      return;
    }

    this.obstetraService.atualizarPerfil(this.medicoId, { password: this.novaSenhaObrigatoria }).subscribe({
      next: () => {
        this.sucessoSenhaObrigatoria = 'Password alterada com sucesso!';
        this.obrigarTrocarSenha = false;
        localStorage.setItem('mustChangePassword', 'false');
        this.novaSenhaObrigatoria = '';
        this.confirmarSenhaObrigatoria = '';
        setTimeout(() => { this.sucessoSenhaObrigatoria = ''; }, 4000);
      },
      error: () => {
        this.erroSenhaObrigatoria = 'Erro ao alterar password.';
      }
    });
  }

  carregarDados() {
    
    this.gravidaService.listarPorObstetra(this.medicoId).subscribe({
      next: (dados) => { this.totalPacientes = dados.length; }
    });

    
    this.notificacaoService.listarPorObstetra(this.medicoId).subscribe({
      next: (dados) => {
        const jaVistasRaw = localStorage.getItem('notificacoesMedicoVistas');
        const jaVistas: string[] = jaVistasRaw ? JSON.parse(jaVistasRaw) : [];

        const novas = dados.filter((n: any) => !n.lida && !jaVistas.includes(n._id));

        if (novas.length > 0) {
          this.notificacoesMedico = novas;

         
          const novosIds = novas.map((n: any) => n._id);
          localStorage.setItem('notificacoesMedicoVistas', JSON.stringify([...jaVistas, ...novosIds]));

          
          novas.forEach((n: any) => {
            this.notificacaoService.marcarComoLida(n._id).subscribe();
          });

          setTimeout(() => { this.notificacoesMedico = []; }, 7000);
        } else {
          this.notificacoesMedico = [];
        }
      }
    });

   
    this.consultaService.listarPorObstetra(this.medicoId).subscribe({
      next: (todasConsultas) => {
        const consultas = todasConsultas.filter((c: any) => c.estado !== 2 && c.estado !== '2');

        const hoje = new Date();
        const inicioHoje = new Date(hoje); inicioHoje.setHours(0, 0, 0, 0);
        const fimHoje = new Date(hoje); fimHoje.setHours(23, 59, 59, 999);

        this.consultasHoje = consultas.filter(c => {
          const data = new Date(c.dataConsulta);
          return data >= inicioHoje && data <= fimHoje && !this.consultaJaOcorreu(c);
        }).length;

        const consultasVistas = JSON.parse(sessionStorage.getItem('consultasMarcadasVistas') || '[]');

        this.consultasNovas = consultas.filter(c => {
          const criada = new Date(c.createdAt);
          return criada >= inicioHoje && criada <= fimHoje
            && c.criadaPor !== 'medico'
            && !this.consultaJaOcorreu(c)
            && !consultasVistas.includes(c._id);
        });

        if (this.consultasNovas.length > 0) {
          this.consultasNovas.forEach(c => {
            if (c._id) consultasVistas.push(c._id);
          });
          sessionStorage.setItem('consultasMarcadasVistas', JSON.stringify(consultasVistas));
          setTimeout(() => { this.consultasNovas = []; }, 7000);
        }

        this.proximasConsultas = consultas
          .filter(c => {
            const dataHora = this.obterDataHoraConsulta(c);
            return dataHora ? dataHora.getTime() >= Date.now() : new Date(c.dataConsulta) >= inicioHoje;
          })
          .sort((a, b) => {
            const tA = this.obterDataHoraConsulta(a)?.getTime() || new Date(a.dataConsulta).getTime();
            const tB = this.obterDataHoraConsulta(b)?.getTime() || new Date(b.dataConsulta).getTime();
            return tA - tB;
          })
          .slice(0, 5);

        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
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

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-PT', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
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

  irParaUtentes() { this.router.navigate(['/medico/utentes']); }
  irParaPerfil() { this.router.navigate(['/medico/perfil']); }

  irParaAgenda(data?: string) {
    if (data) {
      const d = new Date(data);
      this.router.navigate(['/medico/agenda'], {
        queryParams: {
          dia: d.getDate(),
          mes: d.getMonth(),
          ano: d.getFullYear()
        }
      });
    } else {
      this.router.navigate(['/medico/agenda']);
    }
  }

  irParaMarcarConsulta() { this.router.navigate(['/medico/marcar-consulta']); }
  irParaMarcarExame() { this.router.navigate(['/medico/marcar-exames']); }
  irParaAnalise(): void {
    this.router.navigate(['/medico/analise']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}