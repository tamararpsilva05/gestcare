import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ObstetraService {
  private apiUrl = 'http://localhost:3000/api/obstetras';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  obterPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  atualizarPerfil(id: string, dados: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dados, { headers: this.getHeaders() });
  }
}