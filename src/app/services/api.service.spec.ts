// src/app/services/api.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== CLIENTES =====

  it('getClientes → debería obtener todos los clientes', () => {
    const mockClientes = [{ id: 1, nombre: 'Juan' }];

    service.getClientes().subscribe(data => {
      expect(data).toEqual(mockClientes);
    });

    const req = httpMock.expectOne(`${baseUrl}/clientes/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockClientes);
  });

  it('addCliente → debería crear un cliente', () => {
    const newCliente = { nombre: 'Juan', cedula: '123' };

    service.addCliente(newCliente).subscribe(data => {
      expect(data).toEqual({ id: 1, ...newCliente });
    });

    const req = httpMock.expectOne(`${baseUrl}/clientes/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCliente);
    req.flush({ id: 1, ...newCliente });
  });

  it('updateCliente → debería actualizar un cliente', () => {
    const updatedCliente = { nombre: 'Juan Updated' };

    service.updateCliente(1, updatedCliente).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${baseUrl}/clientes/update/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true });
  });

  it('deleteCliente → debería eliminar un cliente', () => {
    service.deleteCliente(1).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${baseUrl}/clientes/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('getMorososPorMeses → debería obtener morosos por meses', () => {
    const mockMorosos = [{ id: 1, MesesDeuda: 3 }];

    service.getMorososPorMeses(3).subscribe(data => {
      expect(data).toEqual(mockMorosos);
    });

    const req = httpMock.expectOne(`${baseUrl}/clientes/morosos?meses=3`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMorosos);
  });

  // ===== TIPOS DE SERVICIO =====

  it('getTiposServicio → debería obtener tipos de servicio', () => {
    const mockTipos = [{ id: 1, nombre: 'Internet' }];

    service.getTiposServicio().subscribe(data => {
      expect(data).toEqual(mockTipos);
    });

    const req = httpMock.expectOne(`${baseUrl}/servicios/tipos`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTipos);
  });

  it('createTipoServicio → debería crear tipo de servicio', () => {
    const newTipo = { nombre: 'Cable' };

    service.createTipoServicio(newTipo).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${baseUrl}/servicios/create`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, ...newTipo });
  });

  // ===== ESTADOS =====

  it('getEstados → debería obtener estados', () => {
    const mockEstados = [{ id: 1, nombre: 'Activo' }];

    service.getEstados().subscribe(data => {
      expect(data).toEqual(mockEstados);
    });

    const req = httpMock.expectOne(`${baseUrl}/estados/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEstados);
  });

  // ===== PAGOS =====

  it('getPagosCliente → debería obtener pagos de cliente', () => {
    const mockPagos = [{ id: 1, monto: 50000 }];

    service.getPagosCliente(1).subscribe(data => {
      expect(data).toEqual(mockPagos);
    });

    const req = httpMock.expectOne(`${baseUrl}/pagos/cliente/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPagos);
  });

  it('getPagosCliente → debería obtener pagos con año', () => {
    const mockPagos = [{ id: 1, monto: 50000 }];

    service.getPagosCliente(1, 2024).subscribe(data => {
      expect(data).toEqual(mockPagos);
    });

    const req = httpMock.expectOne(`${baseUrl}/pagos/cliente/1?ano=2024`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPagos);
  });

  it('addPago → debería agregar un pago', () => {
    const newPago = { clienteId: 1, monto: 50000 };

    service.addPago(newPago).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${baseUrl}/pagos/add`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, ...newPago });
  });

  // ===== ESTADÍSTICAS =====

  it('getDashboardStats → debería obtener estadísticas del dashboard', () => {
    const mockStats = { total: 100, activos: 80 };

    service.getDashboardStats().subscribe(data => {
      expect(data).toEqual(mockStats);
    });

    const req = httpMock.expectOne(`${baseUrl}/servicios/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('getMonthlyIncome → debería obtener ingresos mensuales', () => {
    const mockIncome = [{ mes: 1, total: 1000000 }];

    service.getMonthlyIncome(2024).subscribe(data => {
      expect(data).toEqual(mockIncome);
    });

    const req = httpMock.expectOne(`${baseUrl}/pagos/ingresos-mensuales?anio=2024`);
    expect(req.request.method).toBe('GET');
    req.flush(mockIncome);
  });

  // ===== EXPORTAR =====

  it('exportClientsToExcel → debería exportar clientes a Excel', () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.ms-excel' });

    service.exportClientsToExcel().subscribe(data => {
      expect(data).toBeTruthy();
      expect(data.type).toBe('application/vnd.ms-excel');
    });

    const req = httpMock.expectOne(`${baseUrl}/clientes/export/excel`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(mockBlob);
  });

  it('exportClientsMorososToExcel → debería exportar morosos a Excel', () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.ms-excel' });

    service.exportClientsMorososToExcel(3).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${baseUrl}/clientes/morosos/excel?meses=3`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores HTTP', () => {
    service.getClientes().subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${baseUrl}/clientes/all`);
    req.flush({ message: 'Error del servidor' }, { status: 500, statusText: 'Server Error' });
  });
});