// src/app/services/api.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService - NetRoots VozIP', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  // Mock data específico para VozIP Company
  const mockCliente = {
    ID: 1,
    NombreCliente: 'Juan Pérez',
    ApellidoCliente: 'García',
    Telefono: '3001234567',
    Cedula: '12345678',
    Ubicacion: 'Km 30 Dagua Valle',
    sector_id: 1,
    estado: 'activo'
  };

  const mockTipoServicio = {
    id: 1,
    nombre: 'Internet Fibra Óptica',
    descripcion: 'Servicio de internet de alta velocidad',
    precio: 50000
  };

  const mockPago = {
    ID: 1,
    ClienteID: 1,
    Monto: 50000,
    FechaPago: '2024-01-15',
    Mes: 'Enero',
    Ano: 2024,
    Metodo_de_PagoID: 1
  };

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

  // ===== PRUEBAS DE CLIENTES =====

  describe('Clientes Operations', () => {
    it('should get all clientes from VozIP', () => {
      const mockClientes = [mockCliente, { ...mockCliente, ID: 2, NombreCliente: 'María' }];

      service.getClientes().subscribe(clientes => {
        expect(clientes).toEqual(mockClientes);
        expect(clientes.length).toBe(2);
        expect(clientes[0].NombreCliente).toBe('Juan Pérez');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/clientes/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockClientes);
    });

    it('should add new cliente to VozIP database', () => {
      const newCliente = {
        NombreCliente: 'Carlos Ruiz',
        ApellidoCliente: 'Moreno',
        Telefono: '3159876543',
        Cedula: '87654321',
        Ubicacion: 'Km 25 Dagua Valle'
      };

      service.addCliente(newCliente).subscribe(response => {
        expect(response.NombreCliente).toBe('Carlos Ruiz');
        expect(response.ID).toBeTruthy();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/clientes/create');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCliente);
      req.flush({ ...newCliente, ID: 3 });
    });

    it('should update cliente by ID', () => {
      const updatedCliente = { ...mockCliente, Telefono: '3007654321' };

      service.updateCliente(1, updatedCliente).subscribe(response => {
        expect(response.Telefono).toBe('3007654321');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/clientes/update/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedCliente);
      req.flush(updatedCliente);
    });

    it('should delete cliente by ID', () => {
      service.deleteCliente(1).subscribe(response => {
        expect(response.message).toBe('Cliente eliminado exitosamente');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/clientes/delete/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Cliente eliminado exitosamente' });
    });

    it('should get morosos from VozIP', () => {
      const mockMorosos = [
        { ...mockCliente, mesesAdeudados: 3, deudaTotal: 150000 },
        { ...mockCliente, ID: 2, NombreCliente: 'Ana López', mesesAdeudados: 2, deudaTotal: 100000 }
      ];

      service.getMorosos().subscribe(morosos => {
        expect(morosos.length).toBe(2);
        expect(morosos[0].mesesAdeudados).toBe(3);
        expect(morosos[0].deudaTotal).toBe(150000);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/clientes/morosos');
      expect(req.request.method).toBe('GET');
      req.flush(mockMorosos);
    });

    it('should get morosos by months', () => {
      const meses = 2;
      const mockMorososPorMeses = [mockCliente];

      service.getMorososPorMeses(meses).subscribe(morosos => {
        expect(morosos).toEqual(mockMorososPorMeses);
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/clientes/morosos?meses=${meses}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMorososPorMeses);
    });
  });

  // ===== PRUEBAS DE TIPOS DE SERVICIO =====

  describe('Tipos de Servicio Operations', () => {
    it('should get all tipos de servicio', () => {
      const mockTipos = [
        mockTipoServicio,
        { id: 2, nombre: 'Internet WLAN', descripcion: 'Internet inalámbrico', precio: 35000 }
      ];

      service.getTiposServicio().subscribe(tipos => {
        expect(tipos.length).toBe(2);
        expect(tipos[0].nombre).toBe('Internet Fibra Óptica');
        expect(tipos[1].precio).toBe(35000);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/servicios/tipos');
      expect(req.request.method).toBe('GET');
      req.flush(mockTipos);
    });

    it('should create new tipo de servicio', () => {
      const newTipo = {
        nombre: 'Internet Satelital',
        descripcion: 'Internet vía satélite para zonas rurales',
        precio: 75000
      };

      service.createTipoServicio(newTipo).subscribe(response => {
        expect(response.nombre).toBe('Internet Satelital');
        expect(response.precio).toBe(75000);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/servicios/create');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTipo);
      req.flush({ ...newTipo, id: 3 });
    });

    it('should update tipo de servicio', () => {
      const updatedTipo = { ...mockTipoServicio, precio: 55000 };

      service.updateTipoServicio(1, updatedTipo).subscribe(response => {
        expect(response.precio).toBe(55000);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/servicios/update/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updatedTipo);
    });

    it('should delete tipo de servicio', () => {
      service.deleteTipoServicio(1).subscribe(response => {
        expect(response.message).toBe('Servicio eliminado');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/servicios/delete/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Servicio eliminado' });
    });
  });

  // ===== PRUEBAS DE ESTADOS =====

  describe('Estados Operations', () => {
    it('should get all estados', () => {
      const mockEstados = [
        { id: 1, estado: 'Activo' },
        { id: 2, estado: 'Inactivo' },
        { id: 3, estado: 'Suspendido' }
      ];

      service.getEstados().subscribe(estados => {
        expect(estados.length).toBe(3);
        expect(estados[0].estado).toBe('Activo');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/estados/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockEstados);
    });

    it('should create new estado', () => {
      const newEstado = { estado: 'En Proceso' };

      service.createEstado(newEstado).subscribe(response => {
        expect(response.estado).toBe('En Proceso');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/estados/create');
      expect(req.request.method).toBe('POST');
      req.flush({ ...newEstado, id: 4 });
    });
  });

  // ===== PRUEBAS DE PLANES =====

  describe('Planes Operations', () => {
    it('should get all planes MB', () => {
      const mockPlanes = [
        { id: 1, nombre: 'Plan Básico', velocidad: '10 Mbps', precio: 35000 },
        { id: 2, nombre: 'Plan Premium', velocidad: '50 Mbps', precio: 65000 }
      ];

      service.getPlanes().subscribe(planes => {
        expect(planes.length).toBe(2);
        expect(planes[0].nombre).toBe('Plan Básico');
        expect(planes[1].precio).toBe(65000);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/planes/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockPlanes);
    });
  });

  // ===== PRUEBAS DE SECTORES =====

  describe('Sectores Operations', () => {
    it('should get all sectores rurales Dagua', () => {
      const mockSectores = [
        { id: 1, nombre: 'Km 30', descripcion: 'Sector rural Km 30 Dagua' },
        { id: 2, nombre: 'Km 25', descripcion: 'Sector rural Km 25 Dagua' },
        { id: 3, nombre: 'El Carmen', descripcion: 'Vereda El Carmen' }
      ];

      service.getSectores().subscribe(sectores => {
        expect(sectores.length).toBe(3);
        expect(sectores[0].nombre).toBe('Km 30');
        expect(sectores[2].descripcion).toContain('Carmen');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sectores/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockSectores);
    });
  });

  // ===== PRUEBAS DE TARIFAS =====

  describe('Tarifas Operations', () => {
    it('should get all tarifas', () => {
      const mockTarifas = [
        { id: 1, plan_id: 1, valor: 35000, descripcion: 'Tarifa básica' },
        { id: 2, plan_id: 2, valor: 65000, descripcion: 'Tarifa premium' }
      ];

      service.getTarifas().subscribe(tarifas => {
        expect(tarifas.length).toBe(2);
        expect(tarifas[0].valor).toBe(35000);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tarifas/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockTarifas);
    });

    it('should get tarifa by cliente ID', () => {
      const mockTarifa = { id: 1, cliente_id: 1, valor: 50000, plan: 'Básico' };

      service.getTarifaByClienteId(1).subscribe(tarifa => {
        expect(tarifa.cliente_id).toBe(1);
        expect(tarifa.valor).toBe(50000);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tarifas/cliente/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockTarifa);
    });
  });

  // ===== PRUEBAS DE PAGOS =====

  describe('Pagos Operations', () => {
    it('should get pagos de cliente specific', () => {
      const clienteID = 1;
      const mockPagos = [mockPago, { ...mockPago, ID: 2, Mes: 'Febrero' }];

      service.getPagosCliente(clienteID).subscribe(pagos => {
        expect(pagos.length).toBe(2);
        expect(pagos[0].ClienteID).toBe(1);
        expect(pagos[1].Mes).toBe('Febrero');
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/pagos/cliente/${clienteID}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPagos);
    });

    it('should get pagos de cliente by year', () => {
      const clienteID = 1;
      const ano = 2024;

      service.getPagosCliente(clienteID, ano).subscribe(pagos => {
        expect(pagos).toBeTruthy();
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/pagos/cliente/${clienteID}?ano=${ano}`);
      expect(req.request.method).toBe('GET');
      req.flush([mockPago]);
    });

    it('should add new pago VozIP', () => {
      const newPago = {
        ClienteID: 1,
        Monto: 50000,
        FechaPago: '2024-02-15',
        Mes: 'Febrero',
        Ano: 2024,
        Metodo_de_PagoID: 1
      };

      service.addPago(newPago).subscribe(response => {
        expect(response.Monto).toBe(50000);
        expect(response.Mes).toBe('Febrero');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/pagos/add');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newPago);
      req.flush({ ...newPago, ID: 2 });
    });

    it('should get metodos de pago', () => {
      const mockMetodos = [
        { id: 1, metodo: 'Efectivo' },
        { id: 2, metodo: 'Transferencia' },
        { id: 3, metodo: 'Nequi' }
      ];

      service.getMetodosPago().subscribe(metodos => {
        expect(metodos.length).toBe(3);
        expect(metodos[0].metodo).toBe('Efectivo');
        expect(metodos[2].metodo).toBe('Nequi');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/metodos-pago/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockMetodos);
    });
  });

  // ===== PRUEBAS DE DASHBOARD Y ESTADÍSTICAS =====

  describe('Dashboard and Statistics', () => {
    it('should get dashboard stats for VozIP', () => {
      const mockStats = {
        totalClientes: 150,
        clientesActivos: 140,
        clientesMorosos: 10,
        ingresosMes: 2500000,
        serviciosActivos: 3
      };

      service.getDashboardStats().subscribe(stats => {
        expect(stats.totalClientes).toBe(150);
        expect(stats.ingresosMes).toBe(2500000);
        expect(stats.clientesMorosos).toBe(10);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/servicios/dashboard');
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });

    it('should get monthly income for specific year', () => {
      const year = 2024;
      const mockIncomes = [
        { mes: 1, ingresos: 500000, nombre_mes: 'Enero' },
        { mes: 2, ingresos: 550000, nombre_mes: 'Febrero' },
        { mes: 3, ingresos: 600000, nombre_mes: 'Marzo' }
      ];

      service.getMonthlyIncome(year).subscribe(incomes => {
        expect(incomes.length).toBe(3);
        expect(incomes[0].ingresos).toBe(500000);
        expect(incomes[2].nombre_mes).toBe('Marzo');
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/pagos/ingresos-mensuales?anio=${year}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockIncomes);
    });
  });

  // ===== PRUEBAS DE MANEJO DE ERRORES =====

  describe('Error Handling', () => {
    it('should handle HTTP error when getting clientes', () => {
      service.getClientes().subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/clientes/all');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error', () => {
      service.addCliente(mockCliente).subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/clientes/create');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});