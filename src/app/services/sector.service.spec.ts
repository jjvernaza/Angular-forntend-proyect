// src/app/services/sector.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SectorService } from './sector.service';

describe('SectorService', () => {
  let service: SectorService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/sectores';

  const mockSectores = [
    { id: 1, nombre: 'Sector Norte', descripcion: 'Zona norte de la ciudad' },
    { id: 2, nombre: 'Sector Sur', descripcion: 'Zona sur de la ciudad' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SectorService]
    });
    service = TestBed.inject(SectorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== GET ALL =====

  it('getAllSectores → debería obtener todos los sectores', () => {
    service.getAllSectores().subscribe(data => {
      expect(data).toEqual(mockSectores);
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSectores);
  });

  // ===== GET BY ID =====

  it('getSectorById → debería obtener sector por ID', () => {
    const mockSector = mockSectores[0];

    service.getSectorById(1).subscribe(data => {
      expect(data).toEqual(mockSector);
      expect(data.nombre).toBe('Sector Norte');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSector);
  });

  // ===== CREATE =====

  it('createSector → debería crear nuevo sector', () => {
    const newSector = { nombre: 'Sector Este', descripcion: 'Zona este' };

    service.createSector(newSector).subscribe(data => {
      expect(data).toEqual({ id: 3, ...newSector });
    });

    const req = httpMock.expectOne(`${apiUrl}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newSector);
    req.flush({ id: 3, ...newSector });
  });

  // ===== UPDATE =====

  it('updateSector → debería actualizar sector', () => {
    const updatedSector = { nombre: 'Sector Norte Actualizado', descripcion: 'Nueva descripción' };

    service.updateSector(1, updatedSector).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/update/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedSector);
    req.flush({ success: true });
  });

  // ===== DELETE =====

  it('deleteSector → debería eliminar sector', () => {
    service.deleteSector(1).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores HTTP', () => {
    service.getAllSectores().subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    req.flush('Error del servidor', { status: 500, statusText: 'Server Error' });
  });
});