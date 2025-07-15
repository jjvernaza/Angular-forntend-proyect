import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SectorService } from './sector.service';

describe('SectorService - NetRoots VozIP', () => {
  let service: SectorService;
  let httpMock: HttpTestingController;

  const mockSector = {
    id: 1,
    nombre: 'Km 30',
    descripcion: 'Sector rural Kilómetro 30, Dagua Valle del Cauca'
  };

  const mockSectores = [
    mockSector,
    { id: 2, nombre: 'El Carmen', descripcion: 'Vereda El Carmen, zona montañosa' },
    { id: 3, nombre: 'La Esperanza', descripcion: 'Vereda La Esperanza, vía Buenaventura' },
    { id: 4, nombre: 'Km 25', descripcion: 'Sector Kilómetro 25, entrada a Dagua' }
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

  it('should get all sectores rurales Dagua', () => {
    service.getAllSectores().subscribe(sectores => {
      expect(sectores.length).toBe(4);
      expect(sectores[0].nombre).toBe('Km 30');
      expect(sectores[1].descripcion).toContain('Carmen');
      expect(sectores[2].descripcion).toContain('Buenaventura');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/sectores/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockSectores);
  });

  it('should get sector by ID', () => {
    service.getSectorById(1).subscribe(sector => {
      expect(sector).toEqual(mockSector);
      expect(sector.descripcion).toContain('Dagua Valle del Cauca');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/sectores/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockSector);
  });

  it('should create new sector rural', () => {
    const newSector = {
      nombre: 'La Cascada',
      descripcion: 'Nueva vereda La Cascada, zona de difícil acceso'
    };

    service.createSector(newSector).subscribe(response => {
      expect(response.nombre).toBe('La Cascada');
      expect(response.descripcion).toContain('difícil acceso');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/sectores/create');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newSector);
    req.flush({ ...newSector, id: 5 });
  });

  it('should update sector information', () => {
    const updatedSector = { 
      ...mockSector, 
      descripcion: 'Sector rural Kilómetro 30, Dagua Valle - Actualizado con nuevas referencias' 
    };

    service.updateSector(1, updatedSector).subscribe(response => {
      expect(response.descripcion).toContain('Actualizado');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/sectores/update/1');
    expect(req.request.method).toBe('PUT');
    req.flush(updatedSector);
  });

  it('should delete sector', () => {
    service.deleteSector(1).subscribe(response => {
      expect(response.message).toBe('Sector eliminado');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/sectores/delete/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Sector eliminado' });
  });

  it('should handle rural-specific sectors', () => {
    const ruralSectors = [
      { id: 1, nombre: 'Zona Alta', descripcion: 'Sector montañoso con señal limitada' },
      { id: 2, nombre: 'Río Dagua', descripcion: 'Sector ribereño con acceso por canoa' }
    ];

    service.getAllSectores().subscribe(sectores => {
      expect(sectores[0].descripcion).toContain('montañoso');
      expect(sectores[1].descripcion).toContain('canoa');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/sectores/all');
    req.flush(ruralSectors);
  });
});