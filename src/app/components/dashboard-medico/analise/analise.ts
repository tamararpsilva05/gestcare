import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analise',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './analise.html',
  styleUrls: ['./analise.css']
})
export class Analise implements OnInit {

  modoEscolhido: string = '';

  utenteSelecionada: any = null;
  metricaSelecionada: string | null = null;
  graficoInstancia: any;
  listaUtentes: any[] = [];
  questionariosReais: any[] = [];

  diaSelecionado: string = '';
  diasDisponiveis: string[] = [];
  questionarioVisualizando: any = null;
  opcoesRelatorio = [
    { id: 'dadosPessoais', nome: 'Dados da Utente', selecionado: true },
    { id: 'avaliacaoFisica', nome: 'Avaliação Física', selecionado: true },
    { id: 'avaliacaoEmocional', nome: 'Avaliação Emocional', selecionado: true },
    { id: 'notas', nome: 'Notas e Observações', selecionado: true },
  ];

  listaMetricas = [
    { id: 'qualidadeSono', nome: 'Qualidade do Sono' },
    { id: 'nivelFadiga', nome: 'Nível de Fadiga' },
    { id: 'doresFisicas', nome: 'Dores Físicas' },
    { id: 'nauseasEnjoos', nome: 'Náuseas e Enjoos' },
    { id: 'nivelAnsiedade', nome: 'Nível de Ansiedade' },
    { id: 'estabilidadeHumor', nome: 'Estabilidade de Humor' },
    { id: 'energiaMotivacao', nome: 'Energia e Motivação' },
    { id: 'percecaoApoio', nome: 'Perceção de Apoio' }
  ];

  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    this.carregarUtentes();
  }

  escolherModo(modo: string) {
    this.modoEscolhido = modo;
    this.utenteSelecionada = null;
    this.metricaSelecionada = null;
    this.questionariosReais = [];
    this.diaSelecionado = '';
    this.diasDisponiveis = [];
    this.questionarioVisualizando = null;
    if (this.graficoInstancia) { this.graficoInstancia.destroy(); }
  }

  carregarUtentes() {
    const idObstetra = localStorage.getItem('idUtilizador');
    if (idObstetra) {
      this.http.get(`http://localhost:3000/api/gravidas/obstetra/${idObstetra}`).subscribe({
        next: (dados: any) => { this.listaUtentes = dados; },
        error: (erro) => console.error('Erro ao carregar utentes:', erro)
      });
    }
  }

  verificarSelecao() {
    this.metricaSelecionada = null;
    this.questionariosReais = [];
    this.diaSelecionado = '';
    this.diasDisponiveis = [];
    this.questionarioVisualizando = null;
    if (this.graficoInstancia) { this.graficoInstancia.destroy(); }

    if (this.utenteSelecionada) {
      this.http.get(`http://localhost:3000/api/questionarios/historico/${this.utenteSelecionada._id}`).subscribe({
        next: (dadosBackend: any) => {
          const diasJaVistos = new Set();
          const filtradosPorDia: any[] = [];
          for (const q of dadosBackend) {
            const dataSimples = new Date(q.dataQuestionario).toLocaleDateString('pt-PT');
            if (!diasJaVistos.has(dataSimples)) {
              diasJaVistos.add(dataSimples);
              filtradosPorDia.push(q);
            }
          }
          this.questionariosReais = filtradosPorDia.sort((a, b) =>
            new Date(a.dataQuestionario).getTime() - new Date(b.dataQuestionario).getTime()
          );
          this.diasDisponiveis = this.questionariosReais.map(q =>
            new Date(q.dataQuestionario).toLocaleDateString('pt-PT')
          );
        },
        error: (erro) => console.error('Erro ao carregar histórico:', erro)
      });
    }
  }

  carregarQuestionarioDoDia() {
    this.questionarioVisualizando = this.questionariosReais.find(q =>
      new Date(q.dataQuestionario).toLocaleDateString('pt-PT') === this.diaSelecionado
    ) || null;
  }

  obterNomeMetrica(): string {
    const metrica = this.listaMetricas.find(m => m.id === this.metricaSelecionada);
    return metrica ? metrica.nome : '';
  }

  gerarGrafico() {
    if (!this.utenteSelecionada || !this.metricaSelecionada || this.questionariosReais.length === 0) return;
    const labels = this.questionariosReais.map(q =>
      new Date(q.dataQuestionario).toLocaleDateString('pt-PT')
    );
    const valores = this.questionariosReais.map(q => q[this.metricaSelecionada!]);
    this.desenharChart(labels, valores);
  }

  desenharChart(labels: string[], data: number[]) {
    if (this.graficoInstancia) { this.graficoInstancia.destroy(); }
    const ctx = document.getElementById('meuGrafico') as HTMLCanvasElement;
    if (!ctx) return;
    this.graficoInstancia = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: this.obterNomeMetrica(),
          data,
          borderColor: '#4a7566',
          backgroundColor: 'rgba(74, 117, 102, 0.1)',
          pointBackgroundColor: '#fff',
          pointBorderColor: '#4a7566',
          pointBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', align: 'end' } },
        scales: { y: { beginAtZero: false, min: 1, max: 5, ticks: { stepSize: 1 } } }
      }
    });
  }

  gerarPDF() {
    window.print();
  }
  get mediaMetrica(): { [key: string]: string } {
    if (!this.questionariosReais.length) return {};
    const metricas = ['qualidadeSono', 'nivelFadiga', 'doresFisicas', 'nauseasEnjoos',
      'nivelAnsiedade', 'estabilidadeHumor', 'energiaMotivacao', 'percecaoApoio'];
    const resultado: { [key: string]: string } = {};
    metricas.forEach(m => {
      const soma = this.questionariosReais.reduce((acc, q) => acc + (q[m] || 0), 0);
      resultado[m] = (soma / this.questionariosReais.length).toFixed(1);
    });
    return resultado;
  }
  temOpcao(id: string): boolean {
    return this.opcoesRelatorio.find(o => o.id === id)?.selecionado ?? false;
  }

  voltar(): void { this.router.navigate(['/dashboard-medico']); }
  irParaUtentes(): void { this.router.navigate(['/medico/utentes']); }
  irParaMarcarConsulta() { this.router.navigate(['/medico/marcar-consulta']); }
  irParaMarcarExame() { this.router.navigate(['/medico/marcar-exame']); }
  irParaAgenda(): void { this.router.navigate(['/medico/agenda']); }
  irParaPerfil(): void { this.router.navigate(['/medico/perfil']); }
  irParaAnalise(): void { this.router.navigate(['/medico/analise']); }
}