import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  private baseUrl = 'http://localhost:3000/api/bitacora';
  
  constructor(private http: HttpClient) {}
  
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  
  private handleError(error: any): Observable<never> {
    console.error('❌ Error en BitacoraService:', error);
    return throwError(() => ({
      status: error.status,
      message: error.error?.message || 'Error desconocido en el servidor',
      error
    }));
  }
  
  /**
   * Obtener todos los registros de bitácora con filtros
   */
  getAllBitacora(filters?: {
    usuario_id?: number,
    modulo?: string,
    accion?: string,
    fecha_inicio?: string,
    fecha_fin?: string,
    busqueda?: string,
    limit?: number,
    offset?: number
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.usuario_id) params = params.set('usuario_id', filters.usuario_id.toString());
      if (filters.modulo) params = params.set('modulo', filters.modulo);
      if (filters.accion) params = params.set('accion', filters.accion);
      if (filters.fecha_inicio) params = params.set('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params = params.set('fecha_fin', filters.fecha_fin);
      if (filters.busqueda) params = params.set('busqueda', filters.busqueda);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.offset) params = params.set('offset', filters.offset.toString());
    }
    
    return this.http.get(`${this.baseUrl}/all`, { 
      headers: this.getAuthHeaders(),
      params 
    }).pipe(catchError(this.handleError));
  }
  
  /**
   * Obtener bitácora de un usuario específico
   */
  getBitacoraByUsuario(usuarioId: number, limit: number = 50, offset: number = 0): Observable<any> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    
    return this.http.get(`${this.baseUrl}/usuario/${usuarioId}`, { 
      headers: this.getAuthHeaders(),
      params 
    }).pipe(catchError(this.handleError));
  }
  
  /**
   * Obtener estadísticas de la bitácora
   */
  getEstadisticas(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    
    return this.http.get(`${this.baseUrl}/estadisticas`, { 
      headers: this.getAuthHeaders(),
      params 
    }).pipe(catchError(this.handleError));
  }
  
  /**
   * Exportar bitácora a Excel
   */
  exportarBitacora(filters?: {
    usuario_id?: number,
    modulo?: string,
    accion?: string,
    fecha_inicio?: string,
    fecha_fin?: string
  }): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.usuario_id) params = params.set('usuario_id', filters.usuario_id.toString());
      if (filters.modulo) params = params.set('modulo', filters.modulo);
      if (filters.accion) params = params.set('accion', filters.accion);
      if (filters.fecha_inicio) params = params.set('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params = params.set('fecha_fin', filters.fecha_fin);
    }
    
    return this.http.get(`${this.baseUrl}/exportar`, {
      headers: this.getAuthHeaders(),
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }
  
  /**
   * Obtener módulos disponibles
   */
  getModulos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/modulos`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }
  
  /**
   * Obtener acciones disponibles
   */
  getAcciones(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/acciones`, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError));
  }
  
  /**
   * Limpiar registros antiguos
   */
  limpiarRegistrosAntiguos(dias: number = 90): Observable<any> {
    const params = new HttpParams().set('dias', dias.toString());
    
    return this.http.delete(`${this.baseUrl}/limpiar`, { 
      headers: this.getAuthHeaders(),
      params 
    }).pipe(catchError(this.handleError));
  }
}