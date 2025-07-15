import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlanService } from './plan.service';

describe('PlanService - NetRoots VozIP', () => {
  let service: PlanService;
  let httpMock: HttpTestingController;

  const mockPlan = {
    id: 1,
    nombre: 'Plan Básico Rural',
    descripcion: 'Internet 10 Mbps para zona rural Dagua',
    velocidad: '10 Mbps',
    precio: 35000,
    servicio_id: 1
  };

  const mockPlanes = [
    mockPlan,
    { id: 2, nombre: 'Plan Premium Rural', descripcion: 'Internet 50 Mbps fibra óptica', velocidad: '50 Mbps', precio: 65000, servicio_id: 1 },
    { id: 3, nombre: 'Plan Empresarial', descripcion: 'Internet dedicado para empresas rurales', velocidad: '100 Mbps', precio: 150000, servicio_id: 2 }
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

  it('should get all planes VozIP rurales', () => {
    service.getAllPlanes().subscribe(planes => {
      expect(planes.length).toBe(3);
      expect(planes[0].nombre).toBe('Plan Básico Rural');
      expect(planes[1].velocidad).toBe('50 Mbps');
      expect(planes[2].precio).toBe(150000);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/planes/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlanes);
  });

  it('should get plan by ID', () => {
    service.getPlanById(1).subscribe(plan => {
      expect(plan).toEqual(mockPlan);
      expect(plan.descripcion).toContain('rural');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/planes/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlan);
  });

  it('should create new plan for rural areas', () => {
    const newPlan = {
      nombre: 'Plan Satélite Rural',
      descripcion: 'Internet satelital para zonas remotas del Valle',
      velocidad: '25 Mbps',
      precio: 85000,
      servicio_id: 3
    };

    service.createPlan(newPlan).subscribe(response => {
      expect(response.nombre).toBe('Plan Satélite Rural');
      expect(response.descripcion).toContain('Valle');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/planes/create');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newPlan);
    req.flush({ ...newPlan, id: 4 });
  });

  it('should update plan VozIP', () => {
    const updatedPlan = { ...mockPlan, precio: 40000 };

    service.updatePlan(1, updatedPlan).subscribe(response => {
      expect(response.precio).toBe(40000);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/planes/update/1');
    expect(req.request.method).toBe('PUT');
    req.flush(updatedPlan);
  });

  it('should delete plan', () => {
    service.deletePlan(1).subscribe(response => {
      expect(response.message).toBe('Plan eliminado');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/planes/delete/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Plan eliminado' });
  });
});