import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GravidaService } from '../../../services/gravida';

@Component({
    selector: 'app-utentes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './utentes.html',
    styleUrls: ['./utentes.css']
})
export class Utentes implements OnInit {

    utentes: any[] = [];
    medicoId: string = '';
    carregando: boolean = true;
    erro: string = '';
    mensagemSucesso: string = '';
    senhaGeradaGravida: string = '';
    erroRegisto: string = '';
    termoPesquisa: string = '';
    hoje: string = new Date().toISOString().split('T')[0];
    importandoXML: boolean = false;
    mensagemXML: string = '';
    erroXML: string = '';

    novaUtente = {
        nome: '',
        email: '',
        idade: null as number | null,
        semanasGestacao: null as number | null,
        grupoSanguineo: '',
        dataInicioGravidez: ''
    };

    constructor(
        private gravidaService: GravidaService,
        private router: Router
    ) { }

    ngOnInit() {
        this.medicoId = localStorage.getItem('idUtilizador') || '';
        this.carregarUtentes();
    }

    
    calcularSemanas() {
        if (!this.novaUtente.dataInicioGravidez) return;

        const inicio = new Date(this.novaUtente.dataInicioGravidez);
        const hoje = new Date();

        
        if (inicio > hoje) {
            this.erroRegisto = 'A data de início da gravidez não pode ser no futuro.';
            this.novaUtente.semanasGestacao = null;
            return;
        }

        const diffMs = hoje.getTime() - inicio.getTime();
        const semanas = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

        
        if (semanas > 42) {
            this.erroRegisto = 'A data de início indica mais de 42 semanas de gestação. Verifique a data.';
            this.novaUtente.semanasGestacao = null;
            return;
        }

        this.erroRegisto = '';
        this.novaUtente.semanasGestacao = semanas;
    }

    validarIdade(): boolean {
        const idade = this.novaUtente.idade;
        if (!idade) return false;
        if (idade < 16) {
            this.erroRegisto = 'A idade mínima para registo é 16 anos.';
            return false;
        }
        if (idade > 55) {
            this.erroRegisto = 'A idade máxima para registo é 55 anos.';
            return false;
        }
        return true;
    }

    registarNovaUtente() {
        this.erroRegisto = '';
        this.mensagemSucesso = '';

       
        if (!this.novaUtente.nome || !this.novaUtente.email) {
            this.erroRegisto = 'Por favor, preencha pelo menos o Nome e o Email.';
            return;
        }

        if (!this.validarIdade()) return;

        if (!this.novaUtente.dataInicioGravidez) {
            this.erroRegisto = 'Por favor, insira a data de início da gravidez.';
            return;
        }

        if (!this.novaUtente.semanasGestacao) {
            this.erroRegisto = 'Verifique a data de início da gravidez.';
            return;
        }

        const dadosParaEnviar = {
            ...this.novaUtente,
            idObstetra: this.medicoId
        };

        this.carregando = true;

        this.gravidaService.criarGravida(dadosParaEnviar).subscribe({
            next: (res: any) => {
                this.senhaGeradaGravida = res.senhaTemporaria || '';
                this.mensagemSucesso = this.senhaGeradaGravida ? `Utente registada com sucesso! Password temporária: ${this.senhaGeradaGravida}` : 'Utente registada com sucesso!';
                this.novaUtente = {
                    nome: '',
                    email: '',
                    idade: null,
                    semanasGestacao: null,
                    grupoSanguineo: '',
                    dataInicioGravidez: ''
                };
                this.carregarUtentes();
            },
            error: (err) => {
                this.erroRegisto = err.error?.mensagem || 'Erro ao guardar a utente. Tenta novamente.';
                this.carregando = false;
            }
        });
    }

    carregarUtentes() {
        this.carregando = true;
        this.gravidaService.listarPorObstetra(this.medicoId).subscribe({
            next: (dados) => {
                this.utentes = dados;
                this.carregando = false;
            },
            error: () => {
                this.erro = 'Erro ao carregar utentes.';
                this.carregando = false;
            }
        });
    }

    get utentesFiltradas() {
        return this.utentes.filter(u =>
            u.nome.toLowerCase().includes(this.termoPesquisa.toLowerCase())
        );
    }

    exportarXML() {
        const url = `http://localhost:3000/api/gravidas/export-xml/${this.medicoId}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = 'gravidas.xml';
        link.click();
    }

    importarXML(event: any) {
        const ficheiro = event.target.files[0];
        if (!ficheiro) return;

        this.mensagemXML = '';
        this.erroXML = '';
        this.importandoXML = true;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const xmlContent = e.target.result;

            fetch('http://localhost:3000/api/gravidas/import-xml', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ xmlContent, idObstetra: this.medicoId })
            })
                .then(r => r.json())
                .then(res => {
                    if (res.erros) {
                        this.erroXML = 'XML inválido: ' + res.erros.join(' | ');
                    } else {
                        this.mensagemXML = res.mensagem;
                        this.carregarUtentes();
                    }
                    this.importandoXML = false;
                })
                .catch(() => {
                    this.erroXML = 'Erro ao importar o ficheiro.';
                    this.importandoXML = false;
                });
        };
        reader.readAsText(ficheiro);
    }

    verDetalhes(id: string) { this.router.navigate(['/medico/utentes', id]); }
    irParaPerfil() { this.router.navigate(['/medico/perfil']); }
    irParaMarcarConsulta() { this.router.navigate(['/medico/marcar-consulta']); }
    irParaAgenda() { this.router.navigate(['/medico/agenda']); }
    irParaMarcarExame() { this.router.navigate(['/medico/marcar-exames']); }
    irParaAnalise(): void {
        this.router.navigate(['/medico/analise']);
    }
    voltar() { this.router.navigate(['/dashboard-medico']); }
    logout() {
    localStorage.clear();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}