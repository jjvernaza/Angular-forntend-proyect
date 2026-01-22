// src/app/services/bitacora.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BitacoraService } from './bitacora.service';

describe('BitacoraService', () => {
  let service: BitacoraService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:3000/api/bitacora';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BitacoraService]
    });
    service = TestBed.inject(BitacoraService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('authToken', 'test-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== GET ALL BITACORA =====

  it('getAllBitacora → debería obtener todos los registros sin filtros', () => {
    const mockData = [{ id: 1, modulo: 'usuarios', accion: 'login' }];

    service.getAllBitacora().subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${baseUrl}/all`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(mockData);
  });

  it('getAllBitacora → debería obtener registros con filtros', () => {
    const filters = {
      usuario_id: 1,
      modulo: 'clientes',
      accion: 'crear',
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31',
      busqueda: 'test',
      limit: 10,
      offset: 0
    };

    service.getAllBitacora(filters).subscribe();

    const req = httpMock.expectOne(req => 
      req.url === `${baseUrl}/all` && 
      req.params.has('usuario_id') &&
      req.params.get('modulo') === 'clientes'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('usuario_id')).toBe('1');
    expect(req.request.params.get('accion')).toBe('crear');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush([]);
  });

  // ===== GET BITACORA BY USUARIO =====

  it('getBitacoraByUsuario → debería obtener bitácora de usuario', () => {
    const mockData = [{ id: 1, usuario_id: 1, accion: 'login' }];

    service.getBitacoraByUsuario(1, 50, 0).subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne(req => 
      req.url === `${baseUrl}/usuario/1` &&
      req.params.get('limit') === '50' &&
      req.params.get('offset') === '0'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('getBitacoraByUsuario → debería usar valores por defecto', () => {
    service.getBitacoraByUsuario(1).subscribe();

    const req = httpMock.expectOne(req => 
      req.url === `${baseUrl}/usuario/1` &&
      req.params.get('limit') === '50' &&
      req.params.get('offset') === '0'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // ===== GET ESTADÍSTICAS =====

  it('getEstadisticas → debería obtener estadísticas sin fechas', () => {
    const mockStats = { total: 100, por_modulo: {} };

    service.getEstadisticas().subscribe(data => {
      expect(data).toEqual(mockStats);
    });

    const req = httpMock.expectOne(`${baseUrl}/estadisticas`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('getEstadisticas → debería obtener estadísticas con fechas', () => {
    service.getEstadisticas('2024-01-01', '2024-12-31').subscribe();

    const req = httpMock.expectOne(req => 
      req.url === `${baseUrl}/estadisticas` &&
      req.params.get('fecha_inicio') === '2024-01-01' &&
      req.params.get('fecha_fin') === '2024-12-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  // ===== EXPORTAR BITACORA =====

  it('exportarBitacora → debería exportar sin filtros', () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.ms-excel' });

    service.exportarBitacora().subscribe(data => {
      expect(data).toBeTruthy();
      expect(data.type).toBe('application/vnd.ms-excel');
    });

    const req = httpMock.expectOne(`${baseUrl}/exportar`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(mockBlob);
  });

  it('exportarBitacora → debería exportar con filtros', () => {
    const filters = {
      usuario_id: 1,
      modulo: 'clientes',
      accion: 'crear',
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31'
    };

    service.exportarBitacora(filters).subscribe();

    const req = httpMock.expectOne(req => 
      req.url === `${baseUrl}/exportar` &&
      req.params.get('usuario_id') === '1' &&
      req.params.get('modulo') === 'clientes'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  // ===== GET MÓDULOS Y ACCIONES =====

  it('getModulos → debería obtener lista de módulos', () => {
    const mockModulos = ['usuarios', 'clientes', 'pagos'];

    service.getModulos().subscribe(data => {
      expect(data).toEqual(mockModulos);
    });

    const req = httpMock.expectOne(`${baseUrl}/modulos`);
    expect(req.request.method).toBe('GET');
    req.flush(mockModulos);
  });

  it('getAcciones → debería obtener lista de acciones', () => {
    const mockAcciones = ['crear', 'actualizar', 'eliminar'];

    service.getAcciones().subscribe(data => {
      expect(data).toEqual(mockAcciones);
    });

    const req = httpMock.expectOne(`${baseUrl}/acciones`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAcciones);
  });

  // ===== LIMPIAR REGISTROS =====

  it('limpiarRegistrosAntiguos → debería limpiar con días por defecto', () => {
    service.limpiarRegistrosAntiguos().subscribe();

    const req = httpMock.expectOne(req => 
      req.url === `${baseUrl}/limpiar` &&
      req.params.get('dias') === '90'
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: 100 });
  });

  it('limpiarRegistrosAntiguos → debería limpiar con días especificados', () => {
    service.limpiarRegistrosAntiguos(30).subscribe();

    const req = httpMock.expectOne(req => 
      req.url === `${baseUrl}/limpiar` &&
      req.params.get('dias') === '30'
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: 50 });
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores HTTP', () => {
    service.getAllBitacora().subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${baseUrl}/all`);
    req.flush({ message: 'Error del servidor' }, { status: 500, statusText: 'Server Error' });
  });

  it('debería incluir token de autenticación en headers', () => {
    service.getAllBitacora().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/all`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush([]);
  });
});