import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  private apiUrl = 'http://localhost:3000/api/consultas';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  criarConsulta(dados: any): Observable<any> {
    return this.http.post(this.apiUrl, dados);
  }

  editarConsulta(id: string, dados: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dados);
  }

  listarConsultas(gravidaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/gravida/${gravidaId}`);
  }

  listarConsultasPorObstetraEDia(idObstetra: string, dataConsulta: string): Observable<any> {
    const params = new HttpParams()
      .set('idObstetra', idObstetra)
      .set('dataConsulta', dataConsulta);
    return this.http.get(this.apiUrl, { params });
  }

  eliminarConsulta(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  eliminarConsultaComMotivo(id: string, motivo: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/desmarcar`, { motivo }, { headers: this.getHeaders() });
  }

 
  listarConsultasPorGravida(idGravida: string) {
    
    return this.http.get(`${this.apiUrl}/gravida/${idGravida}`);
  }

  listarPorObstetra(idObstetra: string): Observable<any[]> {
    const params = new HttpParams().set('idObstetra', idObstetra);
    return this.http.get<any[]>(this.apiUrl, { params });
  }
}