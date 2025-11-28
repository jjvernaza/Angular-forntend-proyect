import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api/clientes';
  
  constructor(private http: HttpClient) {}
  
  // Set headers for JSON content
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }
  
  // Handle errors?
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => ({
      status: error.status,
      message: error.error?.message || 'Error desconocido en el servidor',
      error
    }));
  }
  
  // ===== CLIENTES =====
  
  getClientes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/all`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  addCliente(cliente: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, cliente, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  updateCliente(id: number, cliente: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${id}`, cliente, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  getMorosos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/morosos`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  getMorososPorMeses(meses: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/morosos?meses=${meses}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  // ===== TIPOS DE SERVICIO =====
  
  getTiposServicio(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/servicios/tipos', { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createTipoServicio(tipoServicio: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/servicios/create', tipoServicio, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateTipoServicio(id: number, tipoServicio: any): Observable<any> {
    return this.http.put(`http://localhost:3000/api/servicios/update/${id}`, tipoServicio, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteTipoServicio(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/servicios/delete/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  // ===== ESTADOS =====
  
  getEstados(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/estados/all', { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createEstado(estado: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/estados/create', estado, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateEstado(id: number, estado: any): Observable<any> {
    return this.http.put(`http://localhost:3000/api/estados/update/${id}`, estado, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteEstado(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/estados/delete/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ===== PLANES =====

  getPlanes(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/planes/all', { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ===== SECTORES =====

  getSectores(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/sectores/all', { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ===== TARIFAS =====

  getTarifas(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/tarifas/all', { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  // ===== PAGOS =====
  
  getPagosCliente(clienteID: number, ano?: number): Observable<any> {
    let url = `http://localhost:3000/api/pagos/cliente/${clienteID}`;
    if (ano) {
      url += `?ano=${ano}`;
    }
    return this.http.get(url, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  addPago(pago: any): Observable<any> {
    return this.http.post(`http://localhost:3000/api/pagos/add`, pago, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  getMetodosPago(): Observable<any> {
    return this.http.get(`http://localhost:3000/api/metodos-pago/all`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  // ===== ESTADÍSTICAS Y DASHBOARD =====
  
  getDashboardStats(): Observable<any> {
    return this.http.get(`http://localhost:3000/api/servicios/dashboard`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  getMonthlyIncome(year: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/pagos/ingresos-mensuales?anio=${year}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  getTarifaByClienteId(clienteId: number): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/api/tarifas/cliente/${clienteId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  exportClientsToExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/excel`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  exportClientsMorososToExcel(meses: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/morosos/excel?meses=${meses}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // ===== REPORTES =====

exportClientesPagosExcel(ano: number): Observable<Blob> {
  return this.http.get(`http://localhost:3000/api/pagos/reporte-clientes-pagos?ano=${ano}`, {
    headers: this.getHeaders(),
    responseType: 'blob'
  }).pipe(catchError(this.handleError));
}
}

