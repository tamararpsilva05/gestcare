import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GravidaService {
  private apiUrl = 'http://localhost:3000/api/gravidas';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  listarPorObstetra(idObstetra: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/obstetra/${idObstetra}`,
      { headers: this.getHeaders() }
    );
  }

  obterPorId(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  listarTodas(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  editarGravida(id: string, dados: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dados, { headers: this.getHeaders() });
  }

  criarGravida(dados: any): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/gravidas', dados);
  }
}