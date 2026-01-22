import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://api.ictlatam.com/api/users';

  constructor(private http: HttpClient) { }

  // ✅ Método helper para obtener headers con token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`, {
      headers: this.getAuthHeaders()
    });
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, user, {
      headers: this.getAuthHeaders()
    });
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, user, {
      headers: this.getAuthHeaders()
    });
  }

  changePassword(id: number, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/change-password/${id}`,
      {
        currentPassword,
        newPassword
      },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  verifyToken(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify-token`, {
      headers: this.getAuthHeaders()
    });
  }
}