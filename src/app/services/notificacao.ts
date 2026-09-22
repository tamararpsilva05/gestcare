
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacaoService {
  private apiUrl = 'http://localhost:3000/api/notificacoes';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  criarNotificacao(dados: any): Observable<any> {
    return this.http.post(this.apiUrl, dados, { headers: this.getHeaders() });
  }

  listarPorObstetra(idObstetra: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obstetra/${idObstetra}`, { headers: this.getHeaders() });
  }

  listarPorGravida(idGravida: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/gravida/${idGravida}`, { headers: this.getHeaders() });
  }

  marcarComoLida(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { lida: true }, { headers: this.getHeaders() });
  }
}