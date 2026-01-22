import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TarifaService {
  private apiUrl = 'https://api.ictlatam.com/api/tarifas';

  constructor(private http: HttpClient) { }

  getAllTarifas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  getTarifaById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createTarifa(tarifa: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, tarifa);
  }

  updateTarifa(id: number, tarifa: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, tarifa);
  }

  deleteTarifa(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`);
  }
}