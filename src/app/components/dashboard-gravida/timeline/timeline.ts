
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 

interface MarcoLinhaTemporal {
  semana: number;
  fruta: string;
  tamanhoInfo: string;
  exameConsulta: string;
  sintomaTipico: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], 
  templateUrl: './timeline.html',
  styleUrls: ['./timeline.css']
})
export class TimelineComponent implements OnInit {
  nome: string = 'Grávida';
  semanaAtual: number = 20;
  semanaReal: number = 20;
  dadosTimeline: MarcoLinhaTemporal[] = [
    { 
      semana: 8, 
      fruta: 'Uva Pequena', 
      tamanhoInfo: 'O embrião apresenta cerca de 30 mm de comprimento céfalo-caudal. Observa-se o início dos movimentos embrionários e o esboço dos membros inferiores.', 
      exameConsulta: 'Recomenda-se a realização da ecografia transvaginal inicial para identificação clara do contorno embrionário, polo cefálico e visualização do cordão umbilical.', 
      sintomaTipico: 'Fase de transição glandular onde os órgãos assumem progressivamente a forma definitiva e iniciam o seu funcionamento biológico básico.' 
    },
    { 
      semana: 12, 
      fruta: 'Limão', 
      tamanhoInfo: 'O feto mede entre 5 a 6 cm de comprimento crânio-caudal. Conclusão do período embrionário e transição para o período fetal, com formação de órgãos como estômago, rins e bexiga.', 
      exameConsulta: 'Período ideal para a ecografia obstétrica do primeiro trimestre (entre 11 e 13 semanas e 6 dias). Avalia-se a anatomia fetal, ossificação do crânio e marcadores de rastreio bioquímico.', 
      sintomaTipico: 'Estabilização hormonal com atenuação ou desaparecimento de náuseas, enjoos e fadiga extrema. Redução estatística drástica do risco de perda gestacional.' 
    },
    { 
      semana: 16, 
      fruta: 'Pera', 
      tamanhoInfo: 'Comprimento crânio-caudal de aproximadamente 10 cm e peso estimado em 110 gramas. Os sistemas circulatório e urinário encontram-se totalmente funcionais.', 
      exameConsulta: 'Avaliação detalhada da anatomia fetal via ecografia abdominal. Nota-se que o sistema nervoso e as estruturas cerebrais continuam em processo contínuo de maturação.', 
      sintomaTipico: 'Início da perceção dos movimentos fetais pelo organismo materno. Ocorrência de dores abdominais ligeiras decorrentes do estiramento dos ligamentos uterinos e pélvicos.' 
    },
    { 
      semana: 20, 
      fruta: 'Banana', 
      tamanhoInfo: 'O feto atinge cerca de 22 cm de comprimento (metade do tamanho total previsto para o termo) e o peso situa-se ligeiramente acima das 300 gramas. Desenvolvimento do lanugo.', 
      exameConsulta: 'Momento de realização da Ecografia Morfológica do segundo trimestre, considerada uma das avaliações mais críticas para a exclusão e deteção de malformações fetais.', 
      sintomaTipico: 'Os movimentos fetais tornam-se significativamente mais enérgicos, intensos e facilmente percetíveis na parede abdominal.' 
    },
    { 
      semana: 24, 
      fruta: 'Espiga de Milho', 
      tamanhoInfo: 'O peso fetal aproxima-se das 630 gramas. Definição visual de sobrancelhas e pestanas, acompanhada por uma textura de pele ainda marcadamente enrugada.', 
      exameConsulta: 'Fase recomendada (a partir das 25 semanas) para ecografias volumétricas 3D e 4D, permitindo o estudo morfológico aprofundado sob perspetiva tridimensional.', 
      sintomaTipico: 'Aumento da frequência urinária (especialmente no período noturno) e sensação de peso no baixo ventre devido ao crescimento uterino acelerado.' 
    },
    { 
      semana: 28, 
      fruta: 'Repolho Roxo', 
      tamanhoInfo: 'O feto alcança cerca de 25 cm de comprimento e peso estimado em 1,1 kg. Progressão do desenvolvimento do tecido subcutâneo e abertura funcional das pálpebras.', 
      exameConsulta: 'Entrada no terceiro trimestre. O feto atinge o limiar clínico de viabilidade de sobrevivência em caso de parto prematuro espontâneo.', 
      sintomaTipico: 'Compressão dos órgãos gástricos e pulmonares pelas estruturas uterinas, resultando frequentemente em queixas de azia e dispneia (falta de ar) ao esforço.' 
    },
    { 
      semana: 32, 
      fruta: 'Pé de Couve', 
      tamanhoInfo: 'O comprimento fetal aproxima-se dos 28 cm e o peso ronda os 1,8 kg. A derme torna-se mais espessa e surge a cobertura homogénea pelo vernix caseoso protetor.', 
      exameConsulta: 'Indicação para a ecografia do terceiro trimestre (entre as 30 e 32 semanas) com o objetivo de avaliar a taxa de crescimento, índice de líquido amniótico e fluxometria Doppler.', 
      sintomaTipico: 'Falta de ar mesmo em repouso e dificuldades no padrão de sono (insónias). Os movimentos fetais diminuem de frequência devido à restrição de espaço, mas mantêm-se fortes.' 
    },
    { 
      semana: 36, 
      fruta: 'Melão', 
      tamanhoInfo: 'O feto mede cerca de 32 cm de comprimento medular (comprimento total de termo próximo dos 50 cm) e o peso situa-se habitualmente entre os 2,2 kg e os 4,5 kg.', 
      exameConsulta: 'Avaliação final do bem-estar fetal através da monitorização do peso estimado, maturação e posicionamento da placenta, e volume do líquido amniótico.', 
      sintomaTipico: 'Preparação física e psicológica para o parto. O feto adota contornos mais arredondados e o lanugo começa a desaparecer da superfície corporal.' 
    }
  ];

  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    this.nome = localStorage.getItem('nomeUtilizador') || 'Grávida';
    this.carregarDadosGestacionais(); 
  }

  carregarDadosGestacionais(): void {
    const idGravida = localStorage.getItem('idUtenteSelecionada') || localStorage.getItem('idUtilizador');

    console.log('ID detetado para a consulta:', idGravida); 

    if (!idGravida) {
      console.warn('Nenhum ID de utente ou utilizador foi encontrado no localStorage.');
      return;
    }

    this.http.get<{ nome: string, semanasGestacao: number }>(`http://localhost:3000/api/gravida/${idGravida}`)
      .subscribe({
        next: (resposta) => {
          console.log('Resposta da Base de Dados:', resposta);

          if (resposta) {
            this.semanaReal = Number(resposta.semanasGestacao);
            this.semanaAtual = Number(resposta.semanasGestacao);

            if (resposta.nome) this.nome = resposta.nome;

            console.log('Slider atualizado com sucesso para a semana:', this.semanaAtual);
          }
        },
        error: (erro) => {
          console.error('Erro crítico ao ligar ao servidor Node.js:', erro);
        }
      });
  }

  get infoSemanaAtual(): MarcoLinhaTemporal {
    const semanasDisponiveis = this.dadosTimeline.map(d => d.semana);
    
    const semanaAlvo = semanasDisponiveis.reduce((prev, curr) => {
      return (curr <= Number(this.semanaAtual)) ? curr : prev;
    }, semanasDisponiveis[0]);

    return this.dadosTimeline.find(d => d.semana === semanaAlvo) || this.dadosTimeline[0];
  }

  irParaInicio() { this.router.navigate(['/dashboard-gravida']); }
  irParaConsultas() { this.router.navigate(['/consultas-gravida']); }
  irParaAgenda() { this.router.navigate(['/agenda-gravida']); }
  irParaPerfil() { this.router.navigate(['/perfil-gravida']); }
  irParaQuestionario() { this.router.navigate(['/questionario-gravida']); }
  irParaNotificacoes() { this.router.navigate(['/notificacoes']); }
  irParaTimeline() { }

  logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}