import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermisoService {
  private apiUrl = 'http://localhost:3000/api/permisos';
  private usuarioPermisoUrl = 'http://localhost:3000/api/usuario-permisos';

  constructor(private http: HttpClient) { }

  // Permisos CRUD
  getAllPermisos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  getPermisoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createPermiso(permiso: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, permiso);
  }

  updatePermiso(id: number, permiso: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, permiso);
  }

  deletePermiso(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`);
  }

  // Usuario-Permiso operations
  getPermisosByUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuarioPermisoUrl}/usuario/${usuarioId}`);
  }

  getUsuariosByPermiso(permisoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuarioPermisoUrl}/permiso/${permisoId}`);
  }

  assignPermiso(usuarioId: number, permisoId: number): Observable<any> {
    return this.http.post<any>(`${this.usuarioPermisoUrl}/assign`, {
      usuario_id: usuarioId,
      permiso_id: permisoId
    });
  }

  revokePermiso(asignacionId: number): Observable<any> {
    return this.http.delete<any>(`${this.usuarioPermisoUrl}/revoke/${asignacionId}`);
  }

  revokePermisoUsuario(usuarioId: number, permisoId: number): Observable<any> {
    return this.http.delete<any>(`${this.usuarioPermisoUrl}/revoke/usuario/${usuarioId}/permiso/${permisoId}`);
  }
}