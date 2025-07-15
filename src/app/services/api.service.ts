import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api/clientes';
  
  constructor(private http: HttpClient) {}
  
  // ===== CLIENTES =====
  
  // ✅ Obtener todos los clientes
  getClientes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/all`);
  }
  
  // ✅ Agregar un nuevo cliente (actualizado con nuevos campos)
  addCliente(cliente: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, cliente);
  }
  
  // ✅ Editar un cliente por ID
  updateCliente(id: number, cliente: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${id}`, cliente);
  }
  
  // ✅ Eliminar un cliente por ID
  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
  
  // ✅ Obtener clientes morosos
  getMorosos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/morosos`);
  }
  
  // Obtener morosos por meses
  getMorososPorMeses(meses: number): Observable<any> {
    return this.http.get(`http://localhost:3000/api/clientes/morosos?meses=${meses}`);
  }
  
  // ===== TIPOS DE SERVICIO =====
  
  // ✅ Obtener los tipos de servicio
  getTiposServicio(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/servicios/tipos');
  }

  // ✅ Crear tipo de servicio
  createTipoServicio(tipoServicio: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/servicios/create', tipoServicio);
  }

  // ✅ Actualizar tipo de servicio
  updateTipoServicio(id: number, tipoServicio: any): Observable<any> {
    return this.http.put(`http://localhost:3000/api/servicios/update/${id}`, tipoServicio);
  }

  // ✅ Eliminar tipo de servicio
  deleteTipoServicio(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/servicios/delete/${id}`);
  }
  
  // ===== ESTADOS =====
  
  // ✅ Obtener estados
  getEstados(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/estados/all');
  }

  // ✅ Crear estado
  createEstado(estado: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/estados/create', estado);
  }

  // ✅ Actualizar estado
  updateEstado(id: number, estado: any): Observable<any> {
    return this.http.put(`http://localhost:3000/api/estados/update/${id}`, estado);
  }

  // ✅ Eliminar estado
  deleteEstado(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/estados/delete/${id}`);
  }

  // ===== PLANES =====

  // ✅ Obtener planes MB
  getPlanes(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/planes/all');
  }

  // ===== SECTORES =====

  // ✅ Obtener sectores
  getSectores(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/sectores/all');
  }

  // ===== TARIFAS =====

  // ✅ Obtener tarifas
  getTarifas(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/tarifas/all');
  }
  
  // ===== PAGOS =====
  
  // ✅ Obtener pagos de un cliente con opción de filtrar por año
  getPagosCliente(clienteID: number, ano?: number): Observable<any> {
    let url = `http://localhost:3000/api/pagos/cliente/${clienteID}`;
    if (ano) {
      url += `?ano=${ano}`;
    }
    return this.http.get(url);
  }
  
  // ✅ Agregar un pago
  addPago(pago: any): Observable<any> {
    return this.http.post(`http://localhost:3000/api/pagos/add`, pago);
  }
  
  // ✅ Obtener métodos de pago
  getMetodosPago(): Observable<any> {
    return this.http.get(`http://localhost:3000/api/metodos-pago/all`);
  }
  
  // ===== ESTADÍSTICAS Y DASHBOARD =====
  
  // Nuevos métodos para estadísticas del dashboard
  getDashboardStats(): Observable<any> {
    return this.http.get(`http://localhost:3000/api/servicios/dashboard`);
  }
  
  // Método para obtener ingresos mensuales
  getMonthlyIncome(year: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/pagos/ingresos-mensuales?anio=${year}`);
  }
  
  // Método para obtener la tarifa por ID de cliente
  getTarifaByClienteId(clienteId: number): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/api/tarifas/cliente/${clienteId}`);
  }

  // Agregar este método en tu ApiService

  exportClientsToExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/excel`, {
      responseType: 'blob'
   });
  }

  exportClientsMorososToExcel(meses: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/morosos/excel?meses=${meses}`, {
      responseType: 'blob'
    });
  }
  
  
}