
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObstetraService } from '../../../services/obstetra';

@Component({
    selector: 'app-perfil-medico',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './perfil-medico.html',
    styleUrls: ['./perfil-medico.css']
})
export class PerfilMedico implements OnInit {

    medicoId: string = '';
    carregando: boolean = true;
    guardando: boolean = false;
    erro: string = '';
    sucesso: string = '';
    modoEdicao: boolean = false;

    perfil: any = {
        nome: '',
        email: '',
        numeroOrdem: '',
        idadeObstetra: null,
        genero: ''
    };

    passwordAtual: string = '';
    novaPassword: string = '';
    confirmarPassword: string = '';
    erroPassword: string = '';
    sucessoPassword: string = '';

    constructor(
        private obstetraService: ObstetraService,
        private router: Router
    ) { }

    ngOnInit() {
        this.medicoId = localStorage.getItem('idUtilizador') || '';
        console.log('ID do médico:', this.medicoId);
        this.carregarPerfil();
    }

    carregarPerfil() {
        this.carregando = true;
        this.obstetraService.obterPorId(this.medicoId).subscribe({
            next: (dados) => {
                console.log('Dados recebidos:', dados);
                this.perfil = dados.dados;
                this.carregando = false;
            },
            error: () => {
                this.erro = 'Erro ao carregar perfil.';
                this.carregando = false;
            }
        });
    }

    guardarPerfil() {
        this.guardando = true;
        this.sucesso = '';
        this.erro = '';

        const dadosAtualizar = {
            nome: this.perfil.nome,
            email: this.perfil.email,
            numeroOrdem: this.perfil.numeroOrdem,
            idadeObstetra: this.perfil.idadeObstetra,
            genero: this.perfil.genero
        };

        this.obstetraService.atualizarPerfil(this.medicoId, dadosAtualizar).subscribe({
            next: () => {
                this.sucesso = 'Perfil atualizado com sucesso!';
                this.guardando = false;
                this.modoEdicao = false;
                localStorage.setItem('nomeUtilizador', this.perfil.nome);
            },
            error: () => {
                this.erro = 'Erro ao atualizar perfil.';
                this.guardando = false;
            }
        });
    }

    alterarPassword() {
        this.erroPassword = '';
        this.sucessoPassword = '';

        if (!this.novaPassword || !this.confirmarPassword) {
            this.erroPassword = 'Preenche todos os campos de password.';
            return;
        }

        if (this.novaPassword !== this.confirmarPassword) {
            this.erroPassword = 'As passwords não coincidem.';
            return;
        }

        if (this.novaPassword.length < 6) {
            this.erroPassword = 'A password deve ter pelo menos 6 caracteres.';
            return;
        }

        this.obstetraService.atualizarPerfil(this.medicoId, { password: this.novaPassword }).subscribe({
            next: () => {
                this.sucessoPassword = 'Password alterada com sucesso!';
                this.novaPassword = '';
                this.confirmarPassword = '';
            },
            error: () => {
                this.erroPassword = 'Erro ao alterar password.';
            }
        });
    }

    irParaUtentes() {
        this.router.navigate(['/medico/utentes']);
    }

    irParaMarcarConsulta() { this.router.navigate(['/medico/marcar-consulta']); }
    irParaAnalise(): void {
        this.router.navigate(['/medico/analise']);
    }

    irParaAgenda() { this.router.navigate(['/medico/agenda']); }
    voltar() {
        this.router.navigate(['/dashboard-medico']);
    }
    irParaMarcarExame() { this.router.navigate(['/medico/marcar-exames']); }

    logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}