
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(credentials: any, tipo: string): Observable<any> {
    let url = '';
    if (tipo === 'gravida') {
      url = `${this.apiUrl}/gravidas/login`;
    } else if (tipo === 'admin') {
      url = `${this.apiUrl}/admin/login`;
    } else {
      url = `${this.apiUrl}/obstetras/login`;
    }
    return this.http.post(url, credentials);
  }
}


