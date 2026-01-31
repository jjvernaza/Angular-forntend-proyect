import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  private apiUrl = 'http://localhost:3000/api/metodos-pago';

  constructor(private http: HttpClient) { }

  getAllMetodosPago(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  getMetodoPagoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createMetodoPago(metodoPago: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, metodoPago);
  }

  updateMetodoPago(id: number, metodoPago: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, metodoPago);
  }

  deleteMetodoPago(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`);
  }
}
