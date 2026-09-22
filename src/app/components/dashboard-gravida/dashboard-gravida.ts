import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';

import { ConsultaService } from '../../services/consulta';
import { ExameService } from '../../services/exame';
import { NotificacaoService } from '../../services/notificacao';
import { GravidaService } from '../../services/gravida';

@Component({
  selector: 'app-dashboard-gravida',
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule, FormsModule],
  templateUrl: './dashboard-gravida.html',
  styleUrls: ['./dashboard-gravida.css'],
})
export class DashboardGravida implements OnInit, OnDestroy { 

  nome: string = '';
  gravidaId: string = '';
  temNotificacoesNovas: boolean = false;
  totalFuturas: number = 0;
  notificacoesGravida: any[] = [];
  mostrarAvisoQuestionario: boolean = false;
  obrigarTrocarSenha: boolean = false;
  contaDesativada: boolean = false;
  novaSenhaObrigatoria: string = '';
  confirmarSenhaObrigatoria: string = '';
  erroSenhaObrigatoria: string = '';
  sucessoSenhaObrigatoria: string = '';
  fotoIlustracao: string = 'https://plus.unsplash.com/premium_photo-1664453890782-2807855161fa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJlZ2FuY3l8ZW58MHx8MHx8fDA%3D';
  semanaAtual: number = 0;
  trimestreTexto: string = 'A carregar...';
  semanasEmFalta: number = 0;
  progressoPercentagem: number = 0;
  tamanhoBebeComparacao: string = '...';
  pesoBebe: string = 'A calcular...';
  desenvolvimentosSemana: string[] = [];
  dataConsultaTexto: string = 'A carregar...';
  medicoConsultaTexto: string = '';
  descricaoConsultaTexto: string = '';

  conteudosEducativos: Array<{ categoria: string; titulo: string; descricao: string; url: string; imagemUrl: string }> = [
    { 
      categoria: 'Alimentação', 
      titulo: 'Nutrição Durante a Gravidez', 
      descricao: 'Saiba quais são os alimentos e refeições mais recomendadas durante a gestação.', 
      url: 'https://www.lusiadas.pt/blog/gravidez-maternidade/gravidez/alimentacao-saudavel-gravidez-gravida-deve-comer-por-dois',
      imagemUrl: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZWF0aW5nfGVufDB8fDB8fHww' // Altera para o caminho real da tua imagem ou deixa '' para usar o padrão
    },
    { 
      categoria: 'Exercício', 
      titulo: 'Yoga e Alongamentos', 
      descricao: 'Quer permanecer ativa durante toda a sua gravidez? Saiba desde já as posições e exercícios!', 
      url: 'https://www.chicco.pt/conselhos/gravidez/yoga-na-gravidez.html',
      imagemUrl: 'https://plus.unsplash.com/premium_photo-1664453892232-15d0fc379b22?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cHJlZ25hbnQlMjB5b2dhfGVufDB8fDB8fHww'
    },
    { 
      categoria: 'Saúde', 
      titulo: 'Guia do Sono', 
      descricao: 'Consulte as melhores dicas para conseguir ter uma boa noite de sono.', 
      url: 'https://www.chicco.pt/conselhos/gravidez/dormir-com-barriga-gravida.html',
      imagemUrl: 'https://plus.unsplash.com/premium_photo-1661349605004-57be55f861c7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJlZ25hbnQlMjBzbGVlcGluZ3xlbnwwfHwwfHx8MA%3D%3D'
    },
    { 
      categoria: 'Preparação', 
      titulo: 'A Mala da Maternidade', 
      descricao: 'Prepare-se para o seu parto, pesquisando sobre os objetos que não devem faltar!', 
      url: 'https://www.lusiadas.pt/blog/gravidez-maternidade/parto/mala-maternidade-que-levar',
      imagemUrl: 'https://images.unsplash.com/photo-1631728370215-9440df2e29e3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y2hpbGRiaXJ0aCUyMGJhZ3xlbnwwfHwwfHx8MA%3D%3D'
    }
  ];

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
    if (event.key === 'token' && !event.newValue) {
      this.router.navigate(['/']);
    }
  };

  constructor(
    private router: Router,
    private http: HttpClient,
    private consultaService: ConsultaService,
    private exameService: ExameService,
    private notificacaoService: NotificacaoService,
    private gravidaService: GravidaService,
    private location: Location
  ) { }

  ngOnInit() {
    window.addEventListener('popstate', this.popstateListener);
    window.addEventListener('storage', this.storageListener);

    this.nome = localStorage.getItem('nomeUtilizador') || 'Utilizador';
    this.gravidaId = localStorage.getItem('idUtilizador') ||
      localStorage.getItem('gravidaId') ||
      localStorage.getItem('id') ||
      localStorage.getItem('userId') || '';

    if (this.gravidaId) {
      this.contaDesativada = localStorage.getItem('estado') === '0';
      this.obrigarTrocarSenha = !this.contaDesativada && (localStorage.getItem('mustChangePassword') === 'true');
      this.carregarDadosParaAlerta();
      this.carregarNotificacoes();
      this.carregarDadosGestacao();
      this.verificarNotificacaoDiaria();
      this.carregarProximaConsulta();
    } else {
      console.warn("Nenhum ID de grávida encontrado no localStorage.");
      this.configurarDadosGestacao(24);
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.temNotificacoesNovas = false;
      this.notificacoesGravida = [];
    });
  }

  ngOnDestroy() {
    window.removeEventListener('popstate', this.popstateListener);
    window.removeEventListener('storage', this.storageListener);
  }

  carregarNotificacoes() {
    this.notificacaoService.listarPorGravida(this.gravidaId).subscribe({
      next: (dados) => {
        const jaVistasRaw = sessionStorage.getItem('notificacoesGravidaVistas');
        const jaVistas: string[] = jaVistasRaw ? JSON.parse(jaVistasRaw) : [];
        const novas = dados.filter((n: any) => !n.lida && !jaVistas.includes(n._id));

        if (novas.length > 0) {
          this.notificacoesGravida = novas;
          const novosIds = novas.map((n: any) => n._id);
          sessionStorage.setItem('notificacoesGravidaVistas', JSON.stringify([...jaVistas, ...novosIds]));
          novas.forEach((n: any) => {
            this.notificacaoService.marcarComoLida(n._id).subscribe();
          });
          setTimeout(() => {
            this.notificacoesGravida = [];
          }, 7000);
        } else {
          this.notificacoesGravida = [];
        }
      }
    });
  }

  carregarDadosParaAlerta() {
    forkJoin({
      consultas: this.consultaService.listarConsultas(this.gravidaId),
      exames: this.exameService.listarExames(this.gravidaId)
    }).subscribe({
      next: ({ consultas, exames }) => {
        const todas = [...consultas, ...exames];

        this.totalFuturas = todas.filter(item =>
          (item.estado === 0 || item.estado === 'Pendente')
        ).length;

        const agora = new Date().getTime();

        const itensNovos = todas.filter(item => {
          const dataCriacao = new Date(item.createdAt || item.dataCriacao || '').getTime();
          const eRecente = !isNaN(dataCriacao) && (agora - dataCriacao) < (5 * 60 * 1000);
          const foiCriadaPeloMedico = item.criadaPor === 'medico';
          return eRecente && foiCriadaPeloMedico;
        });

        this.temNotificacoesNovas = itensNovos.length > 0;
        if (this.temNotificacoesNovas) {
          setTimeout(() => {
            this.temNotificacoesNovas = false;
          }, 7000);
        }
      },
      error: (err) => {
        console.error("Erro ao carregar alertas:", err);
        this.temNotificacoesNovas = false;
      }
    });
  }

  carregarDadosGestacao(): void {
    this.http.get<any>(`http://localhost:3000/api/gravidas/${this.gravidaId}`)
      .subscribe({
        next: (resultado) => {
          if (resultado?.dados?.semanasGestacao !== undefined) {
            this.configurarDadosGestacao(resultado.dados.semanasGestacao);
          }
        },
        error: (erro) => console.error('Erro ao carregar gestação:', erro)
      });
  }

  configurarDadosGestacao(semanas: number): void {
    this.semanaAtual = semanas;
    this.semanasEmFalta = 40 - semanas;
    this.progressoPercentagem = Math.round((semanas / 40) * 100);
    if (semanas <= 13) this.trimestreTexto = '1º Trimestre';
    else if (semanas <= 26) this.trimestreTexto = '2º Trimestre';
    else this.trimestreTexto = '3º Trimestre';
    const comparacoes: { [key: number]: string } = { 12: 'um limão', 20: 'uma banana', 24: 'uma beringela', 30: 'uma couve-flor', 36: 'um melão' };
    this.tamanhoBebeComparacao = comparacoes[Object.keys(comparacoes).find(k => semanas <= parseInt(k)) as any] || 'uma melancia';
    this.atualizarInformacaoSemanal(semanas);
  }

  atualizarInformacaoSemanal(semana: number): void {
    const baseDeDadosInterna: { [key: number]: { peso: string, dev: string[] } } = {
      4: { peso: '< 1g', dev: ['Início do desenvolvimento do tubo neural', 'Formação do coração e vasos sanguíneos', 'O embrião aninha-se no útero'] },
      5: { peso: '< 1g', dev: ['O coração começa a bater', 'Início da formação dos rins e fígado', 'Tem o tamanho de uma semente de sésamo'] },
      6: { peso: '< 1g', dev: ['O focinho e queixo começam a formar-se', 'Primeiros batimentos cardíacos visíveis na ecografia', 'Surgem pequenos brotos que serão os braços e pernas'] },
      7: { peso: '1g', dev: ['Formação das retinas', 'O cérebro cresce rapidamente', 'Formação do cordão umbilical'] },
      8: { peso: '1g', dev: ['Início da formação dos ossos', 'Os dedos começam a ganhar forma', 'Iniciam-se movimentos subtis (mas ainda não se sentem)'] },
      9: { peso: '2g', dev: ['Os músculos começam a desenvolver-se', 'Ouvidos começam a formar-se no exterior', 'Transição oficial de embrião para feto'] },
      10: { peso: '4g', dev: ['Os órgãos vitais começam a funcionar', 'O bebé já consegue engolir', 'Começam a aparecer as unhas'] },
      11: { peso: '7g', dev: ['Os folículos pilosos começam a formar-se', 'O bebé estica-se e dá pequenos pontapés', 'O ouvido interno começa a desenvolver-se'] },
      12: { peso: '14g', dev: ['Os reflexos começam a desenvolver-se', 'Dedos das mãos e pés já separados', 'Rins começam a produzir urina'] },
      13: { peso: '23g', dev: ['As cordas vocais começam a desenvolver-se', 'As impressões digitais começam a formar-se', 'Já consegue colocar o polegar na boca'] },
      14: { peso: '43g', dev: ['Os músculos faciais permitem expressões', 'Começa a crescer a lanugem (pelo fino protetor)', 'O baço começa a produzir glóbulos vermelhos'] },
      15: { peso: '70g', dev: ['O bebé consegue captar luz do exterior', 'Início do desenvolvimento do paladar', 'As pernas crescem mais do que os braços'] },
      16: { peso: '100g', dev: ['O coração bombeia cerca de 25 litros de sangue/dia', 'O couro cabeludo começa a desenhar-se', 'Os olhos começam a mover-se suavemente'] },
      17: { peso: '140g', dev: ['A cartilagem começa a transformar-se em osso', 'Formação de tecido adiposo para reter calor', 'Início do desenvolvimento de reflexos de sucção'] },
      18: { peso: '190g', dev: ['Podes começar a sentir os primeiros movimentos', 'Os ouvidos começam a destacar-se na cabeça', 'O system nervoso desenvolve-se rapidamente'] },
      19: { peso: '240g', dev: ['Formação do vérnix (camada protetora da pele)', 'Desenvolvimento das áreas sensoriais no cérebro', 'O bebé já dorme e acorda em ciclos regulares'] },
      20: { peso: '300g', dev: ['O bebé já consegue ouvir a tua voz', 'Começa a engolir líquido amniótico', 'Surgem os primeiros cabelos'] },
      21: { peso: '360g', dev: ['O sistema digestivo amadurece', 'Início da produção de mecónio no intestino', 'Movimentos cada vez mais coordenados e fortes'] },
      22: { peso: '430g', dev: ['Sobrancelhas e pestanas visíveis', 'O pâncreas começa a desenvolver-se', 'O cérebro começa a processar o toque'] },
      23: { peso: '500g', dev: ['Ouve sons do teu corpo (coração, respiração)', 'Preparação dos pulmões para a respiração fora do útero', 'Vasos sanguíneos visíveis sob a pele fina'] },
      24: { peso: '600g', dev: ['Papilas gustativas totalmente desenvolvidas', 'Aproximadamente 30cm de comprimento', 'Desenvolvimento dos pulmões em progresso contínuo'] },
      25: { peso: '660g', dev: ['Começa a ganhar mais gordura corporal', 'A cor do cabelo começa a definir-se', 'As narinas começam a abrir-se'] },
      26: { peso: '760g', dev: ['Os olhos começam a abrir-se', 'Desenvolvimento de padrões de ondas cerebrais', 'Começa a reagir a luzes fortes através da barriga'] },
      27: { peso: '870g', dev: ['Treina a respiração com os pulmões', 'Consegue reconhecer a voz dos pais', 'O cérebro continua a crescer muito depressa'] },
      28: { peso: '1kg', dev: ['As pestanas crescem', 'O sistema nervoso já regula a temperatura corporal', 'O bebé já sonha (atinge a fase REM do sono)'] },
      29: { peso: '1.2kg', dev: ['Os músculos e pulmões fortalecem-se significativamente', 'A pele começa a ficar menos enrugada', 'Começa a armazenar minerais essenciais como cálcio'] },
      30: { peso: '1.3kg', dev: ['O cérebro ganha as suas pregas e sulcos (giros cerebrais)', 'Consegue acompanhar fontes de luz com os olhos', 'A medula óssea produz glóbulos vermelhos'] },
      31: { peso: '1.5kg', dev: ['Os 5 sentidos estão totalmente operacionais', 'Movimentos tornam-se mais vigorosos', 'O cérebro processa informações rapidamente'] },
      32: { peso: '1.7kg', dev: ['Unhas dos pés e mãos estão completamente visíveis', 'O treino de respiração é cada vez mais frequente', 'Ouvido e visão estão muito apurados'] },
      33: { peso: '1.9kg', dev: ['O sistema imunitário desenvolve-se com anticorpos da mãe', 'O nível de líquido amniótico atinge o seu máximo', 'O crânio permanece maleável para facilitar o parto'] },
      34: { peso: '2.1kg', dev: ['As unhas chegam à ponta dos dedos', 'Os pulmões estão quase totalmente maduros', 'As pupilas dilatam e contraem com a luz'] },
      35: { peso: '2.4kg', dev: ['Ganha cerca de 200g a 250g por semana', 'Os rins estão totalmente desenvolvidos', 'O fígado já processa resíduos'] },
      36: { peso: '2.6kg', dev: ['Ganha cerca de 30g por dia', 'Na maioria dos casos, já se posiciona de cabeça para baixo', 'A pele fica mais lisa e rosada'] },
      37: { peso: '2.9kg', dev: ['É considerada uma gravidez de termo precoce', 'O bebé treina a coordenação para agarrar coisas', 'Os pulmões produzem surfactante suficiente'] },
      38: { peso: '3.1kg', dev: ['O cérebro e os pulmões continuam a aperfeiçoar-se', 'A cor dos olhos ao nascer está definida (mas pode mudar depois)', 'O espaço no útero é cada vez menor'] },
      39: { peso: '3.3kg', dev: ['O vérnix e a lanugem desaparecem gradualmente', 'Tem gordura corporal suficiente para manter a temperatura', 'Está pronto para nascer a qualquer momento!'] },
      40: { peso: '3.5kg', dev: ['Chegou às 40 semanas!', 'O crânio ainda não fundiu para facilitar a passagem no parto', 'Aguardando o momento ideal para nascer'] },
      41: { peso: '3.6kg', dev: ['O bebé continua a ganhar algum peso', 'A pele pode estar ligeiramente descamada por estar na água', 'A tua equipa médica acompanhará a situação de perto'] },
      42: { peso: '3.7kg', dev: ['É considerada uma gravidez pós-termo', 'Monitorização médica constante para garantir o bem-estar', 'Últimos preparativos para conheceres o teu bebé!'] }
    };
    const dados = baseDeDadosInterna[semana];
    if (dados) {
      this.pesoBebe = dados.peso;
      this.desenvolvimentosSemana = dados.dev;
    } else {
      this.pesoBebe = 'Em crescimento';
      this.desenvolvimentosSemana = [
        'O bebé continua a crescer de forma saudável',
        'Os órgãos vitais continuam a amadurecer',
        'Novas ligações neurais estão a formar-se todos os dias'
      ];
    }
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

    this.gravidaService.editarGravida(this.gravidaId, { password: this.novaSenhaObrigatoria }).subscribe({
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

  carregarProximaConsulta(): void {
    this.http.get<any>(`http://localhost:3000/api/consultas/proxima/${this.gravidaId}`)
      .subscribe({
        next: (resultado) => {
          if (resultado?.dados) {
            const consulta = resultado.dados;
            const dataObj = new Date(consulta.dataConsulta);
            this.dataConsultaTexto = dataObj.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
            this.medicoConsultaTexto = `${consulta.idObstetra?.nome || 'Médico'}`;
            this.descricaoConsultaTexto = consulta.descricaoConsulta || 'Consulta Geral';
          } else {
            this.dataConsultaTexto = 'Sem consultas';
            this.medicoConsultaTexto = 'Nenhum agendamento';
          }
        }
      });
  }

  verificarNotificacaoDiaria(): void {
    this.http.get<{ jaPreencheu: boolean }>(`http://localhost:3000/api/questionarios/verificar-hoje/${this.gravidaId}`)
      .subscribe({
        next: (res) => this.mostrarAvisoQuestionario = !res.jaPreencheu
      });
  }

  abrirLinkExterno(url: string): void {
    if (url) window.open(url, '_blank');
  }

  irParaConsultas() { this.router.navigate(['/consultas-gravida']); }
  irParaPerfil() { this.router.navigate(['/perfil-gravida']); }
  irParaAgenda() { this.router.navigate(['/agenda-gravida']); }
  irParaTimeline() { this.router.navigate(['/timeline-gravida']); }
  irParaNotificacoes() { this.router.navigate(['/notificacoes']); }
  irParaQuestionario() { this.router.navigate(['/questionario-gravida']); }

  logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}