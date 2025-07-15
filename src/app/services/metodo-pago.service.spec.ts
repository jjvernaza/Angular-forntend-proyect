// src/app/services/metodo-pago.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MetodoPagoService } from './metodo-pago.service';

describe('MetodoPagoService - NetRoots VozIP', () => {
  let service: MetodoPagoService;
  let httpMock: HttpTestingController;

  const mockMetodoPago = {
    id: 1,
    metodo: 'Efectivo',
    descripcion: 'Pago en efectivo en punto físico Km 30'
  };

  const mockMetodosPago = [
    mockMetodoPago,
    { id: 2, metodo: 'Transferencia Bancaria', descripcion: 'Bancolombia cuenta VozIP' },
    { id: 3, metodo: 'Nequi', descripcion: 'Pago móvil Nequi' },
    { id: 4, metodo: 'Daviplata', descripcion: 'Pago móvil Daviplata' }
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

  it('should get all metodos de pago VozIP', () => {
    service.getAllMetodosPago().subscribe(metodos => {
      expect(metodos.length).toBe(4);
      expect(metodos[0].metodo).toBe('Efectivo');
      expect(metodos[2].metodo).toBe('Nequi');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/metodos-pago/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockMetodosPago);
  });

  it('should get metodo pago by ID', () => {
    service.getMetodoPagoById(1).subscribe(metodo => {
      expect(metodo).toEqual(mockMetodoPago);
      expect(metodo.metodo).toBe('Efectivo');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/metodos-pago/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockMetodoPago);
  });

  it('should create new metodo pago for rural payments', () => {
    const newMetodo = {
      metodo: 'Pago Móvil Rural',
      descripcion: 'Pago a través de red móvil en zona rural'
    };

    service.createMetodoPago(newMetodo).subscribe(response => {
      expect(response.metodo).toBe('Pago Móvil Rural');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/metodos-pago/create');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newMetodo);
    req.flush({ ...newMetodo, id: 5 });
  });

  it('should update metodo pago', () => {
    const updatedMetodo = { ...mockMetodoPago, descripcion: 'Efectivo en Gane Km 30' };

    service.updateMetodoPago(1, updatedMetodo).subscribe(response => {
      expect(response.descripcion).toBe('Efectivo en Gane Km 30');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/metodos-pago/update/1');
    expect(req.request.method).toBe('PUT');
    req.flush(updatedMetodo);
  });

  it('should delete metodo pago', () => {
    service.deleteMetodoPago(1).subscribe(response => {
      expect(response.message).toBe('Método eliminado');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/metodos-pago/delete/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Método eliminado' });
  });

  it('should handle HTTP errors gracefully', () => {
    service.getAllMetodosPago().subscribe(
      () => fail('Should have failed'),
      (error) => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne('http://localhost:3000/api/metodos-pago/all');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});