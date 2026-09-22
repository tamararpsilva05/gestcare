
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-dashboard-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dashboard-admin.html',
    styleUrls: ['./dashboard-admin.css']
})
export class DashboardAdmin implements OnInit {

    nomeAdmin: string = '';
    medicos: any[] = [];
    carregando: boolean = true;
    mensagemSucesso: string = '';
    mensagemErro: string = '';
    mostrarFormulario: boolean = false
    guardando: boolean = false;
    mostrarModalEliminar: boolean = false;
    medicoParaEliminar: any = null;
    gravidas: any[] = [];
    carregandoGravidas: boolean = true;
    paginaAtiva: string = 'medicos';
    mostrarModalEliminarGravida: boolean = false;
    gravidaParaEliminar: any = null;
    senhaGeradaMedico: string = '';

    novoMedico = {
        nome: '',
        email: '',
        numeroOrdem: '',
        idadeObstetra: null as number | null,
        genero: ''
    };

    erroFormulario: string = '';

    constructor(private router: Router, private http: HttpClient) { }

    ngOnInit() {
        this.nomeAdmin = localStorage.getItem('nomeUtilizador') || 'Administrador';
        this.carregarMedicos();
    }

    private getHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    carregarMedicos() {
        this.carregando = true;
        this.http.get<any[]>('http://localhost:3000/api/admin/medicos', { headers: this.getHeaders() }).subscribe({
            next: (dados) => {
                this.medicos = dados;
                this.carregando = false;
            },
            error: () => {
                this.carregando = false;
            }
        });
    }

    criarMedico() {
        this.mensagemSucesso = '';
        this.mensagemErro = '';
        this.erroFormulario = '';

        // validação do nome
        if (!this.novoMedico.nome) {
            this.erroFormulario = 'O nome é obrigatório.';
            return;
        }

        // validação do email
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.novoMedico.email || !regexEmail.test(this.novoMedico.email)) {
            this.erroFormulario = 'Introduz um email válido.';
            return;
        }

        // validação do número de ordem
        const regexOrdem = /^OM\d{4}$/;
        if (!this.novoMedico.numeroOrdem || !regexOrdem.test(this.novoMedico.numeroOrdem)) {
            this.erroFormulario = 'O número de ordem deve começar por "OM" seguido de exatamente 4 dígitos. Ex: OM1234';
            return;
        }

        // validação da idade
        if (this.novoMedico.idadeObstetra !== null) {
            if (this.novoMedico.idadeObstetra < 25 || this.novoMedico.idadeObstetra > 75) {
                this.erroFormulario = 'A idade deve ser entre 25 e 75 anos.';
                return;
            }
        }

        // validação do género
        if (!this.novoMedico.genero) {
            this.erroFormulario = 'O género é obrigatório.';
            return;
        }

        this.guardando = true;

        const dadosParaEnviar = {
            ...this.novoMedico
        };

        this.http.post<any>('http://localhost:3000/api/admin/medicos', dadosParaEnviar, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                this.senhaGeradaMedico = res.senhaTemporaria || '';
                this.mensagemSucesso = this.senhaGeradaMedico ? `Médico criado com sucesso! Password temporária: ${this.senhaGeradaMedico}` : 'Médico criado com sucesso!';
                this.novoMedico = { nome: '', email: '', numeroOrdem: '', idadeObstetra: null, genero: '' };
                this.mostrarFormulario = false;
                this.guardando = false;
                this.carregarMedicos();
            },
            error: (err) => {
                this.mensagemErro = err.error?.mensagem || 'Erro ao criar médico.';
                this.guardando = false;
            }
        });
    }

    confirmarEliminar(medico: any) {
        this.medicoParaEliminar = medico;
        this.mostrarModalEliminar = true;
    }

    eliminarMedico() {
        if (!this.medicoParaEliminar) return;

        this.http.delete(`http://localhost:3000/api/admin/medicos/${this.medicoParaEliminar._id}`,
            { headers: this.getHeaders() }).subscribe({
                next: () => {
                    this.mensagemSucesso = `Médico ${this.medicoParaEliminar.nome} eliminado com sucesso!`;
                    this.medicos = this.medicos.filter(m => m._id !== this.medicoParaEliminar._id);
                    this.mostrarModalEliminar = false;
                    this.medicoParaEliminar = null;
                },
                error: () => {
                    this.mensagemErro = 'Erro ao eliminar médico.';
                    this.mostrarModalEliminar = false;
                }
            });
    }

    cancelarEliminar() {
        this.mostrarModalEliminar = false;
        this.medicoParaEliminar = null;
    }

    carregarGravidas() {
        this.mensagemSucesso = '';
        this.mensagemErro = '';
        this.carregandoGravidas = true;
        this.http.get<any[]>('http://localhost:3000/api/admin/gravidas', { headers: this.getHeaders() }).subscribe({
            next: (dados) => {
                this.gravidas = dados;
                this.carregandoGravidas = false;
            },
            error: () => {
                this.carregandoGravidas = false;
            }
        });
    }

    confirmarEliminarGravida(gravida: any) {
        this.gravidaParaEliminar = gravida;
        this.mostrarModalEliminarGravida = true;
    }

    eliminarGravida() {
        if (!this.gravidaParaEliminar) return;

        this.http.delete(`http://localhost:3000/api/admin/gravidas/${this.gravidaParaEliminar._id}`,
            { headers: this.getHeaders() }).subscribe({
                next: () => {
                    this.mensagemSucesso = `Grávida ${this.gravidaParaEliminar.nome} eliminada com sucesso!`;
                    this.gravidas = this.gravidas.filter(g => g._id !== this.gravidaParaEliminar._id);
                    this.mostrarModalEliminarGravida = false;
                    this.gravidaParaEliminar = null;
                },
                error: () => {
                    this.mensagemErro = 'Erro ao eliminar grávida.';
                    this.mostrarModalEliminarGravida = false;
                }
            });
    }

    cancelarEliminarGravida() {
        this.mostrarModalEliminarGravida = false;
        this.gravidaParaEliminar = null;
    }

    toggleEstadoGravida(gravida: any) {
        const novoEstado = gravida.estado === 1 ? 0 : 1;
        this.http.put<any>(`http://localhost:3000/api/admin/gravidas/${gravida._id}/estado`, { estado: novoEstado }, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                const atualizada = res.dados;
                this.gravidas = this.gravidas.map(g => g._id === atualizada._id ? atualizada : g);
                this.mensagemSucesso = `Estado de ${atualizada.nome} atualizado com sucesso.`;
            },
            error: (err) => {
                this.mensagemErro = err.error?.mensagem || 'Erro ao alterar estado.';
            }
        });
    }

    mudarPagina(pagina: string) {
        this.mensagemSucesso = '';
        this.mensagemErro = '';
        this.paginaAtiva = pagina;
        if (pagina === 'gravidas') {
            this.carregarGravidas();
        }
    }

    logout() {
        localStorage.clear();
        window.history.pushState(null, '', '/');
        this.router.navigate(['/'], { replaceUrl: true });
    }
}