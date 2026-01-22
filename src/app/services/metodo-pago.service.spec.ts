// src/app/services/metodo-pago.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MetodoPagoService } from './metodo-pago.service';

describe('MetodoPagoService', () => {
  let service: MetodoPagoService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/metodos-pago';

  const mockMetodos = [
    { id: 1, nombre: 'Efectivo', descripcion: 'Pago en efectivo' },
    { id: 2, nombre: 'Transferencia', descripcion: 'Transferencia bancaria' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MetodoPagoService]
    });
    service = TestBed.inject(MetodoPagoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== GET ALL =====

  it('getAllMetodosPago → debería obtener todos los métodos de pago', () => {
    service.getAllMetodosPago().subscribe(data => {
      expect(data).toEqual(mockMetodos);
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMetodos);
  });

  // ===== GET BY ID =====

  it('getMetodoPagoById → debería obtener método de pago por ID', () => {
    const mockMetodo = mockMetodos[0];

    service.getMetodoPagoById(1).subscribe(data => {
      expect(data).toEqual(mockMetodo);
      expect(data.nombre).toBe('Efectivo');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMetodo);
  });

  // ===== CREATE =====

  it('createMetodoPago → debería crear nuevo método de pago', () => {
    const newMetodo = { nombre: 'Nequi', descripcion: 'Pago por Nequi' };

    service.createMetodoPago(newMetodo).subscribe(data => {
      expect(data).toEqual({ id: 3, ...newMetodo });
    });

    const req = httpMock.expectOne(`${apiUrl}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newMetodo);
    req.flush({ id: 3, ...newMetodo });
  });

  // ===== UPDATE =====

  it('updateMetodoPago → debería actualizar método de pago', () => {
    const updatedMetodo = { nombre: 'Efectivo Actualizado', descripcion: 'Nuevo' };

    service.updateMetodoPago(1, updatedMetodo).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/update/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedMetodo);
    req.flush({ success: true });
  });

  // ===== DELETE =====

  it('deleteMetodoPago → debería eliminar método de pago', () => {
    service.deleteMetodoPago(1).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores HTTP', () => {
    service.getAllMetodosPago().subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    req.flush('Error del servidor', { status: 500, statusText: 'Server Error' });
  });
});