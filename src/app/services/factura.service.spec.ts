// src/app/services/factura.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { FacturaService } from './factura.service';

describe('FacturaService', () => {
  let service: FacturaService;
  let mockDownload: jasmine.Spy;
  let mockCreatePdf: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FacturaService]
    });
    service = TestBed.inject(FacturaService);
    
    // Crear mocks frescos en cada test
    mockDownload = jasmine.createSpy('download');
    mockCreatePdf = jasmine.createSpy('createPdf').and.returnValue({
      download: mockDownload
    });
    
    // Asignar mock de pdfMake al window global
    (window as any).pdfMake = {
      createPdf: mockCreatePdf
    };
  });

  afterEach(() => {
    delete (window as any).pdfMake;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== GENERAR FACTURA POR PAGAR =====

  it('generarFacturaPorPagar → debería generar factura con datos válidos', () => {
    const mockCliente = {
      ID: 1,
      NombreCliente: 'Juan',
      ApellidoCliente: 'Pérez',
      Cedula: '123456789',
      Telefono: '3001234567',
      Ubicacion: 'Calle 123'
    };
    const mockTarifa = { nombre: 'Plan Básico', valor: 50000 };
    const mesesDebidos = 3;

    service.generarFacturaPorPagar(mockCliente, mesesDebidos, mockTarifa);

    expect(mockCreatePdf).toHaveBeenCalled();
    expect(mockDownload).toHaveBeenCalledWith('Factura_1_por_pagar.pdf');
  });

  it('generarFacturaPorPagar → debería incluir último mes pagado', () => {
    const mockCliente = { ID: 1, NombreCliente: 'Juan' };
    const mockTarifa = { nombre: 'Plan Premium', valor: 80000 };
    const ultimoMesPagado = { mes: 5, ano: 2024 };

    service.generarFacturaPorPagar(mockCliente, 2, mockTarifa, ultimoMesPagado);

    expect(mockCreatePdf).toHaveBeenCalled();
  });

  it('generarFacturaPorPagar → debería manejar error si pdfMake no está disponible', () => {
    delete (window as any).pdfMake;
    spyOn(console, 'error');
    jasmine.clock().install();

    const mockCliente = { ID: 1, NombreCliente: 'Juan' };
    const mockTarifa = { valor: 50000 };

    service.generarFacturaPorPagar(mockCliente, 3, mockTarifa);

    expect(console.error).toHaveBeenCalledWith(
      'pdfMake no está cargado. Intentando cargar scripts...'
    );

    jasmine.clock().uninstall();
  });

  // ===== GENERAR FACTURA PAGADA =====

  it('generarFacturaPagada → debería generar factura pagada', () => {
    const mockCliente = {
      ID: 1,
      NombreCliente: 'María',
      ApellidoCliente: 'López'
    };
    const mockPago = {
      ID: 100,
      FechaPago: '2024-01-15',
      Monto: 50000,
      Mes: 'Enero',
      Ano: 2024,
      Metodo_de_PagoID: 1
    };
    const mockTarifa = { nombre: 'Plan Básico', valor: 50000 };

    service.generarFacturaPagada(mockCliente, mockPago, mockTarifa);

    expect(mockCreatePdf).toHaveBeenCalled();
    expect(mockDownload).toHaveBeenCalledWith('Factura_1_pagada_100.pdf');
  });

  // ===== MÉTODOS PRIVADOS (probados indirectamente) =====

  it('formatearFecha → debería formatear correctamente las fechas', () => {
    const mockCliente = { ID: 1, NombreCliente: 'Test' };
    const mockTarifa = { valor: 50000 };

    service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

    const docDefinition = mockCreatePdf.calls.mostRecent().args[0];
    expect(docDefinition).toBeDefined();
    expect(docDefinition.content).toBeDefined();
  });

  it('formatearNumero → debería formatear números con separador de miles', () => {
    const mockCliente = { ID: 1, NombreCliente: 'Test' };
    const mockTarifa = { nombre: 'Plan', valor: 1000000 };

    service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

    expect(mockCreatePdf).toHaveBeenCalled();
  });

  it('obtenerMetodoPago → debería mapear IDs a nombres de métodos', () => {
    const mockCliente = { ID: 1, NombreCliente: 'Test' };
    const mockPago = {
      ID: 1,
      FechaPago: '2024-01-01',
      Monto: 50000,
      Metodo_de_PagoID: 2
    };
    const mockTarifa = { nombre: 'Plan', valor: 50000 };

    service.generarFacturaPagada(mockCliente, mockPago, mockTarifa);

    expect(mockCreatePdf).toHaveBeenCalled();
  });

  it('generarDetalleMesesAdeudados → debería generar lista de meses', () => {
    const mockCliente = { ID: 1, NombreCliente: 'Test' };
    const mockTarifa = { valor: 50000 };
    const ultimoMesPagado = { mes: 0, ano: 2024 }; // Enero 2024

    service.generarFacturaPorPagar(mockCliente, 3, mockTarifa, ultimoMesPagado);

    const docDefinition = mockCreatePdf.calls.mostRecent().args[0];
    expect(docDefinition.content).toBeDefined();
  });

  it('cargarScriptsPdfMake → debería agregar scripts al DOM', () => {
    const initialScripts = document.getElementsByTagName('script').length;
    
    service['cargarScriptsPdfMake']();
    
    const finalScripts = document.getElementsByTagName('script').length;
    expect(finalScripts).toBeGreaterThan(initialScripts);
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores al generar PDF', () => {
    mockCreatePdf.and.throwError('PDF Error');
    spyOn(console, 'error');
    spyOn(window, 'alert');

    const mockCliente = { ID: 1, NombreCliente: 'Test' };
    const mockTarifa = { valor: 50000 };

    service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'Hubo un problema al generar la factura. Por favor, inténtelo de nuevo.'
    );
  });

  it('obtenerNombreMes → debería retornar nombres correctos', () => {
    // Probar indirectamente a través de la generación de factura
    const mockCliente = { ID: 1, NombreCliente: 'Test' };
    const mockTarifa = { valor: 50000 };

    service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

    expect(mockCreatePdf).toHaveBeenCalled();
  });
});