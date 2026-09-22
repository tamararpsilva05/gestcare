
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GravidaService } from '../../../services/gravida';

@Component({
    selector: 'app-utente-detalhes',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './utente-detalhes.html',
    styleUrls: ['./utente-detalhes.css']
})
export class UtenteDetalhes implements OnInit {
    utenteId: string = '';
    utente: any = null;
    carregando: boolean = true;
    erro: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private gravidaService: GravidaService
    ) { }

    ngOnInit() {
        
        this.utenteId = this.route.snapshot.paramMap.get('id') || '';

        if (this.utenteId) {
            this.carregarDetalhes();
        } else {
            this.erro = 'ID de utente inválido.';
            this.carregando = false;
        }
    }

    carregarDetalhes() {
        this.carregando = true;
        this.gravidaService.obterPorId(this.utenteId).subscribe({
            next: (resposta) => {
                console.log('O QUE VEIO DA BASE DE DADOS:', resposta);

                
                this.utente = resposta.dados;

                this.carregando = false;
            },
            error: (err) => {
                this.erro = 'Erro ao carregar os detalhes da utente.';
                this.carregando = false;
                console.error(err);
            }
        });
    }

    irParaPerfil() {
        this.router.navigate(['/medico/perfil']);
    }
    irParaMarcarConsulta() { this.router.navigate(['/medico/marcar-consulta']); }

    irParaAgenda() { this.router.navigate(['/medico/agenda']); }
    irParaAnalise(): void {
        this.router.navigate(['/medico/analise']);
    }
    irParaMarcarExame() { this.router.navigate(['/medico/marcar-exames']); }

    voltar() {
        this.router.navigate(['/medico/utentes']);
    }
    
    calcularPercentual(semanas: number): number {
        if (!semanas) return 0;
        const percentual = (semanas / 40) * 100;
        return percentual > 100 ? 100 : percentual; 
    }

    obterFaseGravidez(semanas: number): string {
        if (!semanas) return '';
        if (semanas >= 37) return 'Termo (Pronto para o Parto) 👶';
        if (semanas >= 28) return '3º Trimestre';
        if (semanas >= 13) return '2º Trimestre';
        return '1º Trimestre';
    }

    logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }

}