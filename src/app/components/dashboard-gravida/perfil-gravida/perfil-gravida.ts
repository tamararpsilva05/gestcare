import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GravidaService } from '../../../services/gravida';

@Component({
    selector: 'app-perfil-gravida',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './perfil-gravida.html',
    styleUrls: ['./perfil-gravida.css'],
})
export class PerfilGravida implements OnInit {
    nome: string = '';
    email: string = '';
    idade: string = '';
    semanasGestacao: string = '';
    obstetraNome: string = '';
    idUtilizador: string = '';
    editMode: boolean = false;
    grupoSanguineo: string = '';
    alergias: string = '';
    morada: string = '';
    contactoEmergenciaNome: string = '';
    contactoEmergenciaTelemovel: string = '';
    novaPassword: string = '';
    confirmarPassword: string = '';
    erroPassword: string = '';
    sucessoPassword: string = '';

    constructor(private router: Router, private gravidaService: GravidaService) { }

    ngOnInit(): void {
        this.idUtilizador = localStorage.getItem('idUtilizador') || '';

        if (this.idUtilizador) {
            this.gravidaService.obterPorId(this.idUtilizador).subscribe({
                next: (res: any) => {
                    const dados = res.dados || res;
                    this.nome = dados.nome || '';
                    this.email = dados.email || '';
                    this.idade = dados.idade ? String(dados.idade) : '';
                    this.semanasGestacao = dados.semanasGestacao ? String(dados.semanasGestacao) : '';
                    this.obstetraNome = dados.idObstetra?.nome || '';
                    this.grupoSanguineo = dados.grupoSanguineo || '';
                    this.alergias = dados.alergias || '';
                    this.morada = dados.morada || '';
                    this.contactoEmergenciaNome = dados.contactoEmergenciaNome || '';
                    this.contactoEmergenciaTelemovel = dados.contactoEmergenciaTelemovel || '';
                },
                error: (err) => {
                    console.error('Erro ao carregar perfil:', err);
                }
            });
        } else {
            this.nome = localStorage.getItem('nomeUtilizador') || 'Rita Santos';
            this.email = localStorage.getItem('emailUtilizador') || 'rita.santos@example.com';
            this.idade = localStorage.getItem('idadeUtilizador') || '28 anos';
            this.semanasGestacao = localStorage.getItem('semanasGestacao') || '24 semanas';
            this.obstetraNome = localStorage.getItem('nomeObstetra') || 'Dra. Rosa Maria';
        }
    }

    voltarAoDashboard() {
        this.router.navigate(['/dashboard-gravida']);
    }

    editarPerfil() {
        this.editMode = true;
    }

    cancelarEdicao() {
        this.editMode = false;
        // reload to discard edits
        if (this.idUtilizador) {
            this.ngOnInit();
        }
    }

    mensagemSucesso: string = '';
    erroSemanas: string = '';
    erroTelemovel: string = '';

    salvarPerfil() {
        if (!this.idUtilizador) {
            return;
        }

        this.erroSemanas = '';
        this.erroTelemovel = '';
        let temErro = false;
        const semanas = Number(this.semanasGestacao);
        if (this.semanasGestacao === '' || isNaN(semanas) || semanas < 0 || semanas > 42) {
            this.erroSemanas = 'Valor inválido. Introduza um número entre 0 e 42 semanas.';
            temErro = true;
        }

        if (this.contactoEmergenciaTelemovel) {
            const telemovelStr = String(this.contactoEmergenciaTelemovel).trim();
            const apenasNumeros = /^[0-9]+$/;

            if (telemovelStr.length !== 9) {
                this.erroTelemovel = `Formato incorreto. O telemóvel deve ter exatamente 9 dígitos (introduziu ${telemovelStr.length}).`;
                temErro = true;
            } else if (!apenasNumeros.test(telemovelStr)) {
                this.erroTelemovel = 'Formato inválido. O contacto deve conter apenas números.';
                temErro = true;
            } else {
                this.contactoEmergenciaTelemovel = telemovelStr;
            }
        } else {
            
        }

        if (temErro) {
            return;
        }

        const payload: any = {
            nome: this.nome,
            email: this.email,
            idade: Number(this.idade) || 0,
            semanasGestacao: semanas,
            grupoSanguineo: this.grupoSanguineo || '',
            alergias: this.alergias || 'Nenhuma',
            morada: this.morada || '',
            contactoEmergenciaNome: this.contactoEmergenciaNome || '',
            contactoEmergenciaTelemovel: this.contactoEmergenciaTelemovel || ''
        };

        this.gravidaService.editarGravida(this.idUtilizador, payload).subscribe({
            next: (res: any) => {
                const dados = res.dados || res;
                this.nome = dados.nome || this.nome;
                this.email = dados.email || this.email;
                this.grupoSanguineo = dados.grupoSanguineo || this.grupoSanguineo;
                this.alergias = dados.alergias || this.alergias;
                this.morada = dados.morada || this.morada;
                this.contactoEmergenciaNome = dados.contactoEmergenciaNome || this.contactoEmergenciaNome;
                this.contactoEmergenciaTelemovel = dados.contactoEmergenciaTelemovel || this.contactoEmergenciaTelemovel;

                localStorage.setItem('nomeUtilizador', this.nome);
                this.editMode = false;

                this.mensagemSucesso = 'Perfil atualizado com sucesso!';
                setTimeout(() => {
                    this.mensagemSucesso = '';
                }, 4000);
            },
            error: (err: any) => {
                console.error('Erro ao atualizar perfil:', err);
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

        this.gravidaService.editarGravida(this.idUtilizador, { password: this.novaPassword }).subscribe({
            next: () => {
                this.sucessoPassword = 'Password alterada com sucesso!';
                this.novaPassword = '';
                this.confirmarPassword = '';
                setTimeout(() => { this.sucessoPassword = ''; }, 4000);
            },
            error: () => {
                this.erroPassword = 'Erro ao alterar password.';
            }
        });
    }
    irParaConsultas() {
        this.router.navigate(['/consultas-gravida']);
    }

    irParaAgenda() {
        this.router.navigate(['/agenda-gravida']);
    }

    irParaNotificacoes() { this.router.navigate(['/notificacoes']); }

    irParaTimeline() {
        this.router.navigate(['/timeline-gravida']); 
    }

    irParaQuestionario() { this.router.navigate(['/questionario-gravida']); }
    logout() {
        localStorage.clear();
        this.router.navigate(['/'], { replaceUrl: true });
    }
}
