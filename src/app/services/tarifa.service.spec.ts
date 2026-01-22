// src/app/services/tarifa.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TarifaService } from './tarifa.service';

describe('TarifaService', () => {
  let service: TarifaService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/tarifas';

  const mockTarifas = [
    { id: 1, nombre: 'Tarifa wlan', valor: 50000 },
    { id: 2, nombre: 'Tarifa Fibra optica', valor: 100000 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TarifaService]
    });
    service = TestBed.inject(TarifaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== GET ALL =====

  it('getAllTarifas → debería obtener todas las tarifas', () => {
    service.getAllTarifas().subscribe(data => {
      expect(data).toEqual(mockTarifas);
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTarifas);
  });

  // ===== GET BY ID =====

  it('getTarifaById → debería obtener tarifa por ID', () => {
    const mockTarifa = mockTarifas[0];

    service.getTarifaById(1).subscribe(data => {
      expect(data).toEqual(mockTarifa);
      expect(data.nombre).toBe('Tarifa Básica');
      expect(data.valor).toBe(50000);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTarifa);
  });

  // ===== CREATE =====

  it('createTarifa → debería crear nueva tarifa', () => {
    const newTarifa = { nombre: 'Tarifa Ultra', valor: 150000 };

    service.createTarifa(newTarifa).subscribe(data => {
      expect(data).toEqual({ id: 3, ...newTarifa });
    });

    const req = httpMock.expectOne(`${apiUrl}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newTarifa);
    req.flush({ id: 3, ...newTarifa });
  });

  // ===== UPDATE =====

  it('updateTarifa → debería actualizar tarifa', () => {
    const updatedTarifa = { nombre: 'Tarifa Básica Plus', valor: 60000 };

    service.updateTarifa(1, updatedTarifa).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/update/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedTarifa);
    req.flush({ success: true });
  });

  // ===== DELETE =====

  it('deleteTarifa → debería eliminar tarifa', () => {
    service.deleteTarifa(1).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores HTTP', () => {
    service.getAllTarifas().subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    req.flush('Error del servidor', { status: 500, statusText: 'Server Error' });
  });
});