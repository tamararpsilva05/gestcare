import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardGravida } from './components/dashboard-gravida/dashboard-gravida';
import { DashboardMedico } from './components/dashboard-medico/dashboard-medico'; 
import { authGuard, loginGuard } from './guards/auth-guard';


import { DashboardAdmin } from './components/dashboard-admin/dashboard-admin';
import { QuestionarioComponent } from './components/dashboard-gravida/questionario/questionario';
import { PerfilMedico } from './components/dashboard-medico/perfil-medico/perfil-medico';
import { AgendaMedico } from './components/dashboard-medico/agenda-medico/agenda-medico';
import { Analise } from './components/dashboard-medico/analise/analise';

import { Utentes } from './components/dashboard-medico/utentes/utentes';
import { UtenteDetalhes } from './components/dashboard-medico/utente-detalhes/utente-detalhes';

import { Consultas } from './components/dashboard-gravida/consultas/consultas';
import { PerfilGravida } from './components/dashboard-gravida/perfil-gravida/perfil-gravida';
import { Agenda } from './components/dashboard-gravida/agenda/agenda';

import { Notificacoes } from './components/dashboard-gravida/notificacoes/notificacoes';

import { TimelineComponent } from './components/dashboard-gravida/timeline/timeline';
import { MarcarConsulta } from './components/dashboard-medico/marcar-consulta/marcar-consulta';
import { MarcarExame } from './components/dashboard-medico/marcar-exames/marcar-exames';


export const routes: Routes = [
  { path: '', component: LoginComponent, canActivate: [loginGuard] },
  
  { path: 'medico/utentes', component: Utentes, canActivate: [authGuard] },
  { path: 'questionario-gravida', component: QuestionarioComponent, canActivate: [authGuard] },

  { path: 'medico/utentes/:id', component: UtenteDetalhes, canActivate: [authGuard] },

  { path: 'dashboard-admin', component: DashboardAdmin, canActivate: [authGuard] },
  { path: 'medico/agenda', component: AgendaMedico, canActivate: [authGuard] },

  { path: 'medico/perfil', component: PerfilMedico, canActivate: [authGuard] },

  
  { path: 'dashboard-gravida', component: DashboardGravida, canActivate: [authGuard] },
  { path: 'perfil-gravida', component: PerfilGravida, canActivate: [authGuard] },

 
  { path: 'timeline-gravida', component: TimelineComponent, canActivate: [authGuard] },
 
  { path: 'consultas-gravida', component: Consultas, canActivate: [authGuard] },
  { path: 'agenda-gravida', component: Agenda, canActivate: [authGuard] },
  { path: 'notificacoes', component: Notificacoes, canActivate: [authGuard] },
  
  { path: 'dashboard-medico', component: DashboardMedico, canActivate: [authGuard] },
  { path: 'medico/analise', component: Analise, canActivate: [authGuard] },
  { path: 'medico/marcar-consulta', component: MarcarConsulta, canActivate: [authGuard] },
  { path: 'medico/marcar-exames', component: MarcarExame, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];