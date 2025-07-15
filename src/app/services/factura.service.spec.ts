// src/app/services/factura.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { FacturaService } from './factura.service';

// Mock global para pdfMake - CORREGIDO
declare let window: any;
if (typeof window !== 'undefined') {
  window.pdfMake = {
    createPdf: jasmine.createSpy('createPdf').and.returnValue({
      download: jasmine.createSpy('download'),
      open: jasmine.createSpy('open'),
      print: jasmine.createSpy('print')
    })
  };
}

describe('FacturaService - NetRoots VozIP', () => {
  let service: FacturaService;
  let mockPdfMake: any;

  // Mock data específico para VozIP Company
  const mockCliente = {
    ID: 1,
    NombreCliente: 'Juan Carlos',
    ApellidoCliente: 'Pérez García',
    Cedula: '12345678',
    Telefono: '3001234567',
    Ubicacion: 'Km 30, Vereda El Carmen, Dagua Valle del Cauca'
  };

  const mockTarifa = {
    id: 1,
    valor: 50000,
    nombre: 'Plan Básico Rural',
    descripcion: 'Internet 10 Mbps para zona rural'
  };

  const mockPago = {
    ID: 1,
    ClienteID: 1,
    Monto: 50000,
    FechaPago: '2024-01-15T10:30:00.000Z',
    Mes: 'Enero',
    Ano: 2024,
    Metodo_de_PagoID: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FacturaService]
    });
    service = TestBed.inject(FacturaService);

    // Mock pdfMake globalmente
    (window as any).pdfMake = {
      createPdf: jasmine.createSpy('createPdf').and.returnValue({
        download: jasmine.createSpy('download'),
        open: jasmine.createSpy('open')
      })
    };
    mockPdfMake = (window as any).pdfMake;

    // Mock de console para evitar logs en pruebas
    spyOn(console, 'error');
    spyOn(console, 'log');
  });

  afterEach(() => {
    // Limpiar DOM de scripts agregados durante pruebas
    const scripts = document.querySelectorAll('script[src*="pdfmake"]');
    scripts.forEach(script => script.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('PDF Generation Setup', () => {
    it('should load pdfMake scripts when not available', () => {
      // Simular que pdfMake no está disponible
      delete (window as any).pdfMake;
      
      spyOn(document.body, 'appendChild');
      spyOn(service as any, 'cargarScriptsPdfMake');

      // Llamar método que dispara la carga de scripts
      service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);
      
      expect((service as any).cargarScriptsPdfMake).toHaveBeenCalled();
    });

    it('should create script elements for pdfMake libraries', () => {
      const mockScript = {
        src: '',
        async: false,
        remove: jasmine.createSpy('remove'),
        onload: null as any
      };
      
      spyOn(document, 'createElement').and.returnValue(mockScript as any);
      spyOn(document.body, 'appendChild');

      (service as any).cargarScriptsPdfMake();

      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(mockScript.src).toContain('pdfmake');
    });
  });

  describe('Factura Por Pagar Generation', () => {
    it('should generate factura por pagar for VozIP client', () => {
      const mesesDebidos = 3;
      
      service.generarFacturaPorPagar(mockCliente, mesesDebidos, mockTarifa);

      expect(mockPdfMake.createPdf).toHaveBeenCalled();
      
      // Verificar que se llamó con la definición correcta
      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      expect(docDefinition).toBeDefined();
      expect(docDefinition.content).toBeDefined();
      
      // Verificar que contiene información de VozIP
      const contentString = JSON.stringify(docDefinition);
      expect(contentString).toContain('Voz IP Company');
      expect(contentString).toContain('NIT: 900505805-5');
      expect(contentString).toContain('POR PAGAR');
    });

    it('should calculate correct total amount for multiple months', () => {
      const mesesDebidos = 2;
      const expectedTotal = mockTarifa.valor * mesesDebidos; // 50000 * 2 = 100000

      service.generarFacturaPorPagar(mockCliente, mesesDebidos, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      // Buscar diferentes formatos posibles del número
      const hasRawNumber = contentString.includes('100000');
      const hasFormattedNumber = contentString.includes('100.000');
      const hasCurrencyFormat = contentString.includes('$100.000') || contentString.includes('$ 100.000');
      
      expect(hasRawNumber || hasFormattedNumber || hasCurrencyFormat).toBeTruthy();
    });

    it('should include client information in factura por pagar', () => {
      service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      expect(contentString).toContain(mockCliente.NombreCliente);
      expect(contentString).toContain(mockCliente.ApellidoCliente);
      expect(contentString).toContain(mockCliente.Cedula);
      expect(contentString).toContain(mockCliente.Telefono);
      expect(contentString).toContain('Dagua Valle del Cauca');
    });

    it('should download PDF with correct filename', () => {
      const mockDownload = jasmine.createSpy('download');
      mockPdfMake.createPdf.and.returnValue({ download: mockDownload });

      service.generarFacturaPorPagar(mockCliente, 2, mockTarifa);

      expect(mockDownload).toHaveBeenCalledWith(`Factura_${mockCliente.ID}_por_pagar.pdf`);
    });

    it('should handle pdfMake not loaded error', (done) => {
      delete (window as any).pdfMake;
      
      // Mock setTimeout para evitar recursión infinita
      spyOn(window, 'setTimeout').and.callFake(((callback: any, timeout?: any) => {
        // No ejecutar el callback para evitar recursión
        done();
        return 0;
      }) as any);

      service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

      expect(console.error).toHaveBeenCalledWith('pdfMake no está cargado. Intentando cargar scripts...');
    });
  });

  describe('Factura Pagada Generation', () => {
    it('should generate factura pagada for VozIP client', () => {
      service.generarFacturaPagada(mockCliente, mockPago, mockTarifa);

      expect(mockPdfMake.createPdf).toHaveBeenCalled();
      
      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      expect(contentString).toContain('Voz IP Company');
      expect(contentString).toContain('FACTURA PAGADA');
      expect(contentString).toContain('PAGADO');
    });

    it('should include payment information in factura pagada', () => {
      service.generarFacturaPagada(mockCliente, mockPago, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      expect(contentString).toContain(mockPago.Mes);
      expect(contentString).toContain(mockPago.Ano.toString());
      
      // Buscar diferentes formatos posibles del monto
      const hasRawNumber = contentString.includes('50000');
      const hasFormattedNumber = contentString.includes('50.000');
      const hasCurrencyFormat = contentString.includes('$50.000') || contentString.includes('$ 50.000');
      
      expect(hasRawNumber || hasFormattedNumber || hasCurrencyFormat).toBeTruthy();
    });

    it('should show correct payment method', () => {
      service.generarFacturaPagada(mockCliente, mockPago, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      // El método 1 debería ser "Efectivo" según el servicio
      expect(contentString).toContain('Efectivo');
    });

    it('should download PDF with correct filename for paid invoice', () => {
      const mockDownload = jasmine.createSpy('download');
      mockPdfMake.createPdf.and.returnValue({ download: mockDownload });

      service.generarFacturaPagada(mockCliente, mockPago, mockTarifa);

      expect(mockDownload).toHaveBeenCalledWith(`Factura_${mockCliente.ID}_pagada_${mockPago.ID}.pdf`);
    });
  });

  describe('Utility Methods', () => {
    it('should format date correctly for Colombian format', () => {
      // Usar fecha específica en UTC para evitar problemas de zona horaria
      const testDate = new Date('2024-01-15T12:00:00.000Z');
      const formattedDate = (service as any).formatearFecha(testDate);
      
      expect(formattedDate).toBe('15/1/2024');
    });

    it('should format numbers with Colombian locale', () => {
      const number = 1234567;
      const formattedNumber = (service as any).formatearNumero(number);
      
      expect(formattedNumber).toBe('1.234.567');
    });

    it('should calculate due date correctly', () => {
      // Usar fecha específica en UTC
      const startDate = new Date('2024-01-01T12:00:00.000Z');
      const daysToAdd = 15;
      const dueDate = (service as any).obtenerFechaVencimiento(startDate, daysToAdd);
      
      expect(dueDate.getUTCDate()).toBe(16);
      expect(dueDate.getUTCMonth()).toBe(0); // Enero
    });

    it('should get correct month name in Spanish', () => {
      const monthName = (service as any).obtenerNombreMes(0);
      expect(monthName).toBe('Enero');
      
      const decemberName = (service as any).obtenerNombreMes(11);
      expect(decemberName).toBe('Diciembre');
      
      const julyName = (service as any).obtenerNombreMes(6);
      expect(julyName).toBe('Julio');
    });

    it('should generate detailed months owed text', () => {
      const mesesDebidos = 3;
      const detalleMeses = (service as any).generarDetalleMesesAdeudados(mesesDebidos);
      
      expect(detalleMeses).toBeTruthy();
      expect(detalleMeses).toContain(',');
      expect(detalleMeses.split(',').length).toBeGreaterThan(1);
    });

    it('should handle zero months owed', () => {
      const detalleMeses = (service as any).generarDetalleMesesAdeudados(0);
      expect(detalleMeses).toBe('Ninguno');
    });

    it('should limit months display to 6 maximum', () => {
      const mesesDebidos = 10;
      const detalleMeses = (service as any).generarDetalleMesesAdeudados(mesesDebidos);
      
      expect(detalleMeses).toContain('y 4 más');
    });

    it('should get payment method name correctly', () => {
      const efectivo = (service as any).obtenerMetodoPago(1);
      expect(efectivo).toBe('Efectivo');
      
      const transferencia = (service as any).obtenerMetodoPago(2);
      expect(transferencia).toBe('Transferencia Bancaria');
      
      const nequi = (service as any).obtenerMetodoPago(4);
      expect(nequi).toBe('Nequi');
      
      const desconocido = (service as any).obtenerMetodoPago(99);
      expect(desconocido).toBe('Desconocido');
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF generation error gracefully', () => {
      mockPdfMake.createPdf.and.throwError('PDF Error');
      spyOn(window, 'alert');

      service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

      expect(console.error).toHaveBeenCalledWith('Error al generar y descargar el PDF:', jasmine.any(Error));
      expect(window.alert).toHaveBeenCalledWith('Hubo un problema al generar la factura. Por favor, inténtelo de nuevo.');
    });

    it('should handle PDF download error', () => {
      const mockDownload = jasmine.createSpy('download').and.throwError('Download Error');
      mockPdfMake.createPdf.and.returnValue({ download: mockDownload });
      spyOn(window, 'alert');

      service.generarFacturaPagada(mockCliente, mockPago, mockTarifa);

      expect(console.error).toHaveBeenCalledWith('Error al generar y descargar el PDF:', jasmine.any(Error));
      expect(window.alert).toHaveBeenCalledWith('Hubo un problema al generar la factura. Por favor, inténtelo de nuevo.');
    });

    it('should retry generation when pdfMake loads later', (done) => {
      delete (window as any).pdfMake;
      
      spyOn(window, 'setTimeout').and.callFake(((callback: any, delay?: any) => {
        // Simular que pdfMake se carga después del timeout
        (window as any).pdfMake = mockPdfMake;
        if (typeof callback === 'function') {
          callback();
        }
        
        expect(mockPdfMake.createPdf).toHaveBeenCalled();
        done();
        return 0;
      }) as any);

      service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);
    });
  });

  describe('VozIP Specific Content', () => {
    it('should include VozIP company information', () => {
      service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      expect(contentString).toContain('Voz IP Company');
      expect(contentString).toContain('NIT: 900505805-5');
      expect(contentString).toContain('proyectos@voipbx.co');
      expect(contentString).toContain('3180638757');
      expect(contentString).toContain('Conéctate a la máxima velocidad');
    });

    it('should include payment information for rural clients', () => {
      service.generarFacturaPorPagar(mockCliente, 1, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      expect(contentString).toContain('Banco: Bancolombia');
      expect(contentString).toContain('Cuenta: 123-456789-10');
      expect(contentString).toContain('Titular: Voz IP Company SAS');
    });

    it('should show appropriate styling for unpaid invoices', () => {
      service.generarFacturaPorPagar(mockCliente, 2, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      
      expect(docDefinition.styles.unpaidStatus.color).toBe('red');
      expect(docDefinition.styles.unpaidWatermarkSimple.color).toContain('255, 0, 0'); // Red watermark
    });

    it('should show appropriate styling for paid invoices', () => {
      service.generarFacturaPagada(mockCliente, mockPago, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      
      expect(docDefinition.styles.paidStatus.color).toBe('green');
      expect(docDefinition.styles.paidWatermarkSimple.color).toContain('0, 128, 0'); // Green watermark
    });

    it('should format Colombian peso amounts correctly', () => {
      const amount = 125000;
      service.generarFacturaPorPagar(mockCliente, 1, { ...mockTarifa, valor: amount });

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      expect(contentString).toContain('125.000'); // Colombian number format
    });
  });

  describe('Regional Specific Features', () => {
    it('should handle rural Dagua Valle addresses', () => {
      const ruralClient = {
        ...mockCliente,
        Ubicacion: 'Vereda La Esperanza, Km 35 vía Buenaventura, Dagua Valle del Cauca'
      };

      service.generarFacturaPorPagar(ruralClient, 1, mockTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      expect(contentString).toContain('Vereda La Esperanza');
      expect(contentString).toContain('Buenaventura');
      expect(contentString).toContain('Dagua Valle del Cauca');
    });

    it('should include rural internet service descriptions', () => {
      const ruralTarifa = {
        ...mockTarifa,
        nombre: 'Internet Rural Fibra',
        descripcion: 'Servicio especializado para zona rural montañosa'
      };

      service.generarFacturaPorPagar(mockCliente, 1, ruralTarifa);

      const docDefinition = mockPdfMake.createPdf.calls.mostRecent().args[0];
      const contentString = JSON.stringify(docDefinition);
      
      expect(contentString).toContain('Internet Rural Fibra');
      expect(contentString).toContain('Servicio Internet');
    });
  });
});