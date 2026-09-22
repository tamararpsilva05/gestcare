import { Component, OnInit } from '@angular/core'; 
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; 
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common'; 



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule], 
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})


export class LoginComponent implements OnInit { 
  tipoEscolhido: string = '';
  email: string = '';
  password: string = '';
  mensagemErro: string = '';

  constructor(
    private authService: Auth, 
    private router: Router, 
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['naoAutorizado']) {
        this.mensagemErro = 'Sessão expirada ou acesso negado. Por favor, faça login.';
      }
    });
  }

  preencherAuto(perfil: string) {
    if (perfil === 'gravida') {
      this.tipoEscolhido = 'gravida';
      this.email = 'ritasantos@gmail.com';
      this.password = 'senhaSegura2026';
    } else if (perfil === 'obstetra') {
      this.tipoEscolhido = 'obstetra';
      this.email = 'rosamaria.obstetra@gmail.com';
      this.password = 'senhaDoMedico2026';
    } else if (perfil === 'admin') {
      this.tipoEscolhido = 'admin';
      this.email = 'admin.gestcare@gmail.com';
      this.password = 'Admin123!';
    }
    this.mensagemErro = '';
  }

  onLogin() {
    if (!this.tipoEscolhido || !this.email || !this.password) {
      this.mensagemErro = 'Por favor, preencha todos os campos.';
      return;
    }

    const credentials = { email: this.email, password: this.password };

    this.authService.login(credentials, this.tipoEscolhido).subscribe({
      next: (res: any) => {
        const payload = res.dados || res;
        localStorage.setItem('token', res.token);
        localStorage.setItem('nomeUtilizador', payload.nome || payload.name || 'Utilizador');
        localStorage.setItem('tipoUtilizador', this.tipoEscolhido);

        localStorage.setItem('idUtilizador', payload.id || payload._id || '');
        localStorage.setItem('mustChangePassword', String(res.mustChangePassword || false));
       
        if (res.estado !== undefined) localStorage.setItem('estado', String(res.estado));

        if (this.tipoEscolhido === 'gravida') {
          this.router.navigate(['/dashboard-gravida'], { replaceUrl: true });
        } else if (this.tipoEscolhido === 'admin') {
          this.router.navigate(['/dashboard-admin'], { replaceUrl: true });
        } else {
          this.router.navigate(['/dashboard-medico'], { replaceUrl: true });
        }
      },
      error: (err) => {
        console.log('Erro completo:', err); 
        this.mensagemErro = err.error.mensagem || 'Erro ao realizar login. Verifique as credenciais.';
      }
    });
  }
}