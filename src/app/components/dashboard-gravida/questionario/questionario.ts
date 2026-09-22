
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-questionario',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './questionario.html',
  styleUrls: ['./questionario.css']
})
export class QuestionarioComponent implements OnInit {
  idGravida: string = '';
  nome: string = 'Grávida'; 
  qualidadeSono: number = 3;
  nivelFadiga: number = 3;
  doresFisicas: number = 3;
  nauseasEnjoos: number = 3;
  detalhesFisicos: string = '';

  nivelAnsiedade: number = 3;
  estabilidadeHumor: number = 3;
  energiaMotivacao: number = 3;
  percecaoApoio: number = 5; 
  detalhesEmocionais: string = '';

  statusMensagem: string = '';
  statusTipo: 'sucesso' | 'erro' | '' = '';

  mostrarCardSucesso: boolean = false;

  jaSubmeteuHoje: boolean = false;

  historicoEvolucao: any[] = [];

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.idGravida = localStorage.getItem('idUtilizador') || '';
    this.nome = localStorage.getItem('nomeUtilizador') || 'Grávida';

    if (!this.idGravida) {
      this.statusMensagem = 'Sessão expirada. Por favor, faça login novamente.';
      this.statusTipo = 'erro';
      return;
    }

    this.verificarSubmissaoDeHoje();
  }

  submeter(): void {
    if (!this.idGravida) {
      this.statusMensagem = 'Erro: Utilizadora não identificada.';
      this.statusTipo = 'erro';
      return;
    }

    const dadosQuestionario = {
      idGravida: this.idGravida,
      qualidadeSono: Number(this.qualidadeSono),
      nivelFadiga: Number(this.nivelFadiga),
      doresFisicas: Number(this.doresFisicas),
      nauseasEnjoos: Number(this.nauseasEnjoos),
      detalhesFisicos: this.detalhesFisicos,
      nivelAnsiedade: Number(this.nivelAnsiedade),
      estabilidadeHumor: Number(this.estabilidadeHumor),
      energiaMotivacao: Number(this.energiaMotivacao),
      percecaoApoio: Number(this.percecaoApoio),
      detalhesEmocionais: this.detalhesEmocionais,
      dataSubmissao: new Date()
    };

    this.http.post('http://localhost:3000/api/questionarios', dadosQuestionario)
      .subscribe({
        next: (resposta: any) => {
          this.mostrarCardSucesso = true;
          this.statusMensagem = '';
          this.statusTipo = '';
          this.jaSubmeteuHoje = true;

          this.carregarHistoricoEvolucao();
        },
        error: (erro) => {
          console.error('Erro ao enviar para a BD:', erro);
          this.statusMensagem = 'Ocorreu um erro ao submeter as respostas. Tente novamente.';
          this.statusTipo = 'erro';
        }
      });
  }

  verificarSubmissaoDeHoje(): void {
    this.http.get<{ jaPreencheu: boolean }>(`http://localhost:3000/api/questionarios/verificar-hoje/${this.idGravida}`)
      .subscribe({
        next: (resultado) => {
          this.jaSubmeteuHoje = resultado.jaPreencheu;
          
          if (this.jaSubmeteuHoje) {
            this.carregarHistoricoEvolucao();
          }
        },
        error: (erro) => {
          console.error('Erro ao verificar submissão diária:', erro);
        }
      });
  }

  carregarHistoricoEvolucao(): void {
    this.http.get<any[]>(`http://localhost:3000/api/questionarios/historico/${this.idGravida}`)
      .subscribe({
        next: (dados) => {
          this.historicoEvolucao = dados;
        },
        error: (erro) => {
          console.error('Erro ao carregar histórico semanal:', erro);
        }
      });
  }

  voltar(): void {
    this.irParaInicio();
  }

  irParaInicio() { this.router.navigate(['/dashboard-gravida']); }
  irParaConsultas() { this.router.navigate(['/consultas-gravida']); }
  irParaPerfil() { this.router.navigate(['/perfil-gravida']); }
  irParaAgenda() { this.router.navigate(['/agenda-gravida']); }
  irParaTimeline() { this.router.navigate(['/timeline-gravida']); }
  irParaQuestionario() { this.router.navigate(['/questionario-gravida']); }
  irParaNotificacoes() { this.router.navigate(['/notificacoes']); }

  logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}