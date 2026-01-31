import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = 'http://localhost:3000/api/planes';

  constructor(private http: HttpClient) { }

  getAllPlanes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  getPlanById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createPlan(plan: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, plan);
  }

  updatePlan(id: number, plan: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, plan);
  }

  deletePlan(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`);
  }
}