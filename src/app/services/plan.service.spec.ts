// src/app/services/plan.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlanService } from './plan.service';

describe('PlanService', () => {
  let service: PlanService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/planes';

  const mockPlanes = [
    { id: 1, nombre: 'Plan Básico', velocidad: '10 Mbps' },
    { id: 2, nombre: 'Plan Premium', velocidad: '50 Mbps' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlanService]
    });
    service = TestBed.inject(PlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== GET ALL =====

  it('getAllPlanes → debería obtener todos los planes', () => {
    service.getAllPlanes().subscribe(data => {
      expect(data).toEqual(mockPlanes);
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlanes);
  });

  // ===== GET BY ID =====

  it('getPlanById → debería obtener plan por ID', () => {
    const mockPlan = mockPlanes[0];

    service.getPlanById(1).subscribe(data => {
      expect(data).toEqual(mockPlan);
      expect(data.nombre).toBe('Plan Básico');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlan);
  });

  // ===== CREATE =====

  it('createPlan → debería crear nuevo plan', () => {
    const newPlan = { nombre: 'Plan Ultra', velocidad: '100 Mbps' };

    service.createPlan(newPlan).subscribe(data => {
      expect(data).toEqual({ id: 3, ...newPlan });
    });

    const req = httpMock.expectOne(`${apiUrl}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newPlan);
    req.flush({ id: 3, ...newPlan });
  });

  // ===== UPDATE =====

  it('updatePlan → debería actualizar plan', () => {
    const updatedPlan = { nombre: 'Plan Básico Plus', velocidad: '20 Mbps' };

    service.updatePlan(1, updatedPlan).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/update/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedPlan);
    req.flush({ success: true });
  });

  // ===== DELETE =====

  it('deletePlan → debería eliminar plan', () => {
    service.deletePlan(1).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores HTTP', () => {
    service.getAllPlanes().subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    req.flush('Error del servidor', { status: 500, statusText: 'Server Error' });
  });
});