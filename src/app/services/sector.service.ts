import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SectorService {
  private apiUrl = 'https://api.ictlatam.com/api/sectores';

  constructor(private http: HttpClient) { }

  getAllSectores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  getSectorById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createSector(sector: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, sector);
  }

  updateSector(id: number, sector: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, sector);
  }

  deleteSector(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`);
  }
}