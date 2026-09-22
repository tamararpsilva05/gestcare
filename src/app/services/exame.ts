import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class ExameService {
   
    private apiUrl = 'http://localhost:3000/api/exames';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

   


    listarExames(gravidaId: string): Observable<any> {
        
        return this.http.get(`${this.apiUrl}/gravida/${gravidaId}`);
    }

   
    editarExame(id: string, dados: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, dados);
    }

    eliminarExame(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    eliminarExameComMotivo(id: string, motivo: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/desmarcar`, { motivo }, { headers: this.getHeaders() });
    }
}
