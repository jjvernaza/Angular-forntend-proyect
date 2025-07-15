import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TarifaService } from './tarifa.service';

describe('TarifaService - NetRoots VozIP', () => {
  let service: TarifaService;
  let httpMock: HttpTestingController;

  const mockTarifa = {
    id: 1,
    plan_id: 1,
    valor: 35000,
    descripcion: 'Tarifa mensual Plan Básico Rural'
  };

  const mockTarifas = [
    mockTarifa,
    { id: 2, plan_id: 2, valor: 65000, descripcion: 'Tarifa mensual Plan Premium Rural' },
    { id: 3, plan_id: 3, valor: 150000, descripcion: 'Tarifa mensual Plan Empresarial' },
    { id: 4, plan_id: 1, valor: 30000, descripcion: 'Tarifa promocional estudiantes rurales' }
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

  it('should get all tarifas VozIP', () => {
    service.getAllTarifas().subscribe(tarifas => {
      expect(tarifas.length).toBe(4);
      expect(tarifas[0].valor).toBe(35000);
      expect(tarifas[1].valor).toBe(65000);
      expect(tarifas[3].descripcion).toContain('estudiantes');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/tarifas/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockTarifas);
  });

  it('should get tarifa by ID', () => {
    service.getTarifaById(1).subscribe(tarifa => {
      expect(tarifa).toEqual(mockTarifa);
      expect(tarifa.descripcion).toContain('Básico Rural');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/tarifas/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockTarifa);
  });

  it('should create new tarifa for rural plans', () => {
    const newTarifa = {
      plan_id: 4,
      valor: 45000,
      descripcion: 'Tarifa especial zona rural extrema'
    };

    service.createTarifa(newTarifa).subscribe(response => {
      expect(response.valor).toBe(45000);
      expect(response.descripcion).toContain('rural extrema');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/tarifas/create');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newTarifa);
    req.flush({ ...newTarifa, id: 5 });
  });

  it('should update tarifa VozIP', () => {
    const updatedTarifa = { ...mockTarifa, valor: 40000 };

    service.updateTarifa(1, updatedTarifa).subscribe(response => {
      expect(response.valor).toBe(40000);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/tarifas/update/1');
    expect(req.request.method).toBe('PUT');
    req.flush(updatedTarifa);
  });

  it('should delete tarifa', () => {
    service.deleteTarifa(1).subscribe(response => {
      expect(response.message).toBe('Tarifa eliminada');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/tarifas/delete/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Tarifa eliminada' });
  });

  it('should handle rural pricing scenarios', () => {
    const ruralTarifas = [
      { id: 1, plan_id: 1, valor: 25000, descripcion: 'Tarifa subsidiada zona rural' },
      { id: 2, plan_id: 2, valor: 80000, descripcion: 'Tarifa premium con instalación incluida' }
    ];

    service.getAllTarifas().subscribe(tarifas => {
      expect(tarifas[0].descripcion).toContain('subsidiada');
      expect(tarifas[1].valor).toBe(80000);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/tarifas/all');
    req.flush(ruralTarifas);
  });

  it('should handle error when getting tarifas', () => {
    service.getAllTarifas().subscribe(
      () => fail('Should have failed'),
      (error) => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne('http://localhost:3000/api/tarifas/all');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});