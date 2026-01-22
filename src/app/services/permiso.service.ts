import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermisoService {
  private apiUrl = 'https://api.ictlatam.com/api/permisos';
  private usuarioPermisoUrl = 'https://api.ictlatam.com/api/usuario-permisos';

  constructor(private http: HttpClient) { }

  // ✅ Método helper para obtener headers con token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Permisos CRUD
  getAllPermisos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`, {
      headers: this.getAuthHeaders()
    });
  }

  getPermisoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createPermiso(permiso: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, permiso, {
      headers: this.getAuthHeaders()
    });
  }

  updatePermiso(id: number, permiso: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, permiso, {
      headers: this.getAuthHeaders()
    });
  }

  deletePermiso(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Usuario-Permiso operations
  getPermisosByUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuarioPermisoUrl}/usuario/${usuarioId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getUsuariosByPermiso(permisoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuarioPermisoUrl}/permiso/${permisoId}`, {
      headers: this.getAuthHeaders()
    });
  }

  assignPermiso(usuarioId: number, permisoId: number): Observable<any> {
    return this.http.post<any>(
      `${this.usuarioPermisoUrl}/assign`,
      { usuario_id: usuarioId, permiso_id: permisoId },
      { headers: this.getAuthHeaders() }
    );
  }

  revokePermiso(asignacionId: number): Observable<any> {
    return this.http.delete<any>(`${this.usuarioPermisoUrl}/revoke/${asignacionId}`, {
      headers: this.getAuthHeaders()
    });
  }

  revokePermisoUsuario(usuarioId: number, permisoId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.usuarioPermisoUrl}/revoke/usuario/${usuarioId}/permiso/${permisoId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}