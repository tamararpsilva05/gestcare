import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const getJwtPayload = (token: string) => {
  try {
    const payloadPart = token.split('.')[1];
    const decoded = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(decoded.split('').map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join('')));
  } catch {
    return null;
  }
};

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const tipoUtilizador = localStorage.getItem('tipoUtilizador');

  if (!token || !tipoUtilizador) {
    localStorage.clear();
    router.navigate(['/'], { queryParams: { naoAutorizado: true } });
    return false;
  }

  const payload = getJwtPayload(token);
  if (!payload || (payload.exp && Date.now() / 1000 >= payload.exp)) {
    localStorage.clear();
    router.navigate(['/'], { queryParams: { naoAutorizado: true } });
    return false;
  }

  const isMedico = tipoUtilizador === 'medico' || tipoUtilizador === 'obstetra';
  const rotasGravida = [
    '/dashboard-gravida', '/perfil-gravida', '/consultas-gravida',
    '/agenda-gravida', '/timeline-gravida', '/questionario-gravida', '/notificacoes'
  ];
  const rotasMedico = ['/dashboard-medico', '/medico'];
  const rotasAdmin = ['/dashboard-admin'];

  const eRotaGravida = rotasGravida.some(r => state.url.startsWith(r));
  const eRotaMedico = rotasMedico.some(r => state.url.startsWith(r));
  const eRotaAdmin = rotasAdmin.some(r => state.url.startsWith(r));

  if (eRotaAdmin && tipoUtilizador !== 'admin') {
    if (tipoUtilizador === 'gravida') return router.createUrlTree(['/dashboard-gravida']);
    return router.createUrlTree(['/dashboard-medico']);
  }

  if (isMedico && (eRotaGravida || eRotaAdmin)) {
    return router.createUrlTree(['/dashboard-medico']);
  }

  if (tipoUtilizador === 'gravida' && (eRotaMedico || eRotaAdmin)) {
    return router.createUrlTree(['/dashboard-gravida']);
  }

  if (tipoUtilizador === 'admin' && (eRotaGravida || eRotaMedico)) {
    return router.createUrlTree(['/dashboard-admin']);
  }

  return true;
};

export const loginGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const tipoUtilizador = localStorage.getItem('tipoUtilizador');

  if (!token) return true; 

  const payload = token ? getJwtPayload(token) : null;
  if (!payload || (payload.exp && Date.now() / 1000 >= payload.exp)) {
    localStorage.clear();
    return true;
  }

  if (!tipoUtilizador) {
    localStorage.clear();
    return true;
  }

  if (tipoUtilizador === 'gravida') return router.createUrlTree(['/dashboard-gravida']);
  if (tipoUtilizador === 'obstetra' || tipoUtilizador === 'medico') return router.createUrlTree(['/dashboard-medico']);
  if (tipoUtilizador === 'admin') return router.createUrlTree(['/dashboard-admin']);

  localStorage.clear();
  return true;
};