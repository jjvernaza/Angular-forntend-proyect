import { Injectable } from '@angular/core';

// Declaración global de pdfMake
declare const pdfMake: any;

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  
  constructor() {
    // Cargar pdfMake si no está disponible
    if (typeof pdfMake === 'undefined') {
      this.cargarScriptsPdfMake();
    }
  }

  // Método para cargar scripts de pdfMake si no están disponibles
  private cargarScriptsPdfMake() {
    // Cargar pdfmake.min.js
    const scriptPdfMake = document.createElement('script');
    scriptPdfMake.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.5/pdfmake.min.js';
    scriptPdfMake.async = true;
    document.body.appendChild(scriptPdfMake);

    // Cargar vfs_fonts.js
    const scriptFonts = document.createElement('script');
    scriptFonts.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.5/vfs_fonts.js';
    scriptFonts.async = true;
    document.body.appendChild(scriptFonts);
  }

  // Generar factura por pagar
  generarFacturaPorPagar(cliente: any, mesesDebidos: number, tarifa: any): void {
    // Verificar que pdfMake está disponible
    if (typeof pdfMake === 'undefined') {
      console.error('pdfMake no está cargado. Intentando cargar scripts...');
      this.cargarScriptsPdfMake();
      setTimeout(() => this.generarFacturaPorPagar(cliente, mesesDebidos, tarifa), 1000);
      return;
    }

    try {
      const montoTotal = tarifa.valor * mesesDebidos;
      const docDefinition = this.crearDefinicionFacturaPorPagar(cliente, tarifa, mesesDebidos, montoTotal);
      this.generarYDescargarPDF(docDefinition, `Factura_${cliente.ID}_por_pagar.pdf`);
    } catch (error) {
      console.error('Error al generar factura por pagar:', error);
      alert('Hubo un problema al generar la factura. Por favor, inténtelo de nuevo.');
    }
  }

  // Generar factura pagada
  generarFacturaPagada(cliente: any, pago: any, tarifa: any): void {
    // Verificar que pdfMake está disponible
    if (typeof pdfMake === 'undefined') {
      console.error('pdfMake no está cargado. Intentando cargar scripts...');
      this.cargarScriptsPdfMake();
      setTimeout(() => this.generarFacturaPagada(cliente, pago, tarifa), 1000);
      return;
    }

    try {
      const docDefinition = this.crearDefinicionFacturaPagada(cliente, pago, tarifa);
      this.generarYDescargarPDF(docDefinition, `Factura_${cliente.ID}_pagada_${pago.ID}.pdf`);
    } catch (error) {
      console.error('Error al generar factura pagada:', error);
      alert('Hubo un problema al generar la factura. Por favor, inténtelo de nuevo.');
    }
  }

  private crearDefinicionFacturaPorPagar(
    cliente: any, 
    tarifa: any, 
    mesesDebidos: number,
    montoTotal: number
  ): any {
    const fecha = new Date();
    const numeroFactura = `INV-${Math.floor(Math.random() * 10000)}`;
    
    // Simplificamos la definición del documento para evitar problemas
    return {
      content: [
        // Encabezado simplificado
        {
          columns: [
            {
              width: 60,
              text: 'LOGO', // Texto en lugar de imagen
              alignment: 'center',
              margin: [0, 10, 0, 0]
            },
            {
              stack: [
                { text: 'Voz IP Company', style: 'headerTitle' },
                { text: 'NIT: 900505805-5', style: 'headerInfo' },
                { text: 'Email: proyectos@voipbx.co', style: 'headerInfo' },
                { text: 'Celular: 3180638757', style: 'headerInfo' },
                { text: 'Conéctate a la máxima velocidad', style: 'slogan' }
              ],
              alignment: 'right'
            }
          ]
        },
        
        // Línea separadora
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
        
        // Información de la factura
        {
          columns: [
            {
              stack: [
                { text: 'Factura a:', style: 'subheader' },
                { text: `${cliente.NombreCliente} ${cliente.ApellidoCliente || ''}`, style: 'clientName' },
                { text: `Cédula/NIT: ${cliente.Cedula || 'N/A'}`, style: 'clientInfo' },
                { text: `Teléfono: ${cliente.Telefono || 'N/A'}`, style: 'clientInfo' },
                { text: `Dirección: ${cliente.Ubicacion || 'N/A'}`, style: 'clientInfo' }
              ]
            },
            {
              stack: [
                { text: 'FACTURA POR PAGAR', style: 'unpaidStatus' },
                { text: `Factura #: ${numeroFactura}`, style: 'invoiceInfo' },
                { text: `Fecha de emisión: ${this.formatearFecha(fecha)}`, style: 'invoiceInfo' },
                { text: `Vencimiento: ${this.formatearFecha(this.obtenerFechaVencimiento(fecha, 15))}`, style: 'invoiceInfo' }
              ],
              alignment: 'right'
            }
          ],
          margin: [0, 20, 0, 20]
        },
        
        // Detalles del servicio
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Meses Adeudados', style: 'tableHeader' },
                { text: 'Tarifa Mensual', style: 'tableHeader' },
                { text: 'Total', style: 'tableHeader' }
              ],
              [
                `Servicio Internet ${tarifa.nombre || ''}`,
                mesesDebidos.toString(),
                `$${this.formatearNumero(tarifa.valor)}`,
                `$${this.formatearNumero(montoTotal)}`
              ]
            ]
          }
        },
        
        // Detalle de meses adeudados
        {
          text: `Meses adeudados: ${this.generarDetalleMesesAdeudados(mesesDebidos)}`,
          style: 'debtInfo',
          margin: [0, 10, 0, 10]
        },
        
        // Espacio en blanco
        { text: '', margin: [0, 10, 0, 10] },
        
        // Resumen de factura
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
                { text: `$${this.formatearNumero(montoTotal)}`, alignment: 'right' }
              ],
              [
                { text: 'IVA (19%)', style: 'tableHeader', alignment: 'right' },
                { text: 'Incluido', alignment: 'right' }
              ],
              [
                { text: 'Total a Pagar', style: 'totalHeader', alignment: 'right' },
                { text: `$${this.formatearNumero(montoTotal)}`, style: 'totalValue', alignment: 'right' }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 10, 0, 10]
        },
        
        // Marca de agua (como texto normal en lugar de absoluto)
        {
          text: 'POR PAGAR',
          style: 'unpaidWatermarkSimple',
          alignment: 'center',
          margin: [0, 20, 0, 20]
        },
        
        // Información de pago
        {
          stack: [
            { text: 'Información de Pago', style: 'subheader' },
            { text: 'Banco: Bancolombia', style: 'paymentInfo' },
            { text: 'Cuenta: 123-456789-10', style: 'paymentInfo' },
            { text: 'Titular: Voz IP Company SAS', style: 'paymentInfo' },
            { text: 'Referencia: Incluir número de factura', style: 'paymentInfo' }
          ],
          margin: [0, 20, 0, 20]
        },
        
        // Nota al pie
        {
          text: 'Gracias por confiar en nosotros. Conéctate a la máxima velocidad con Voz IP Company.',
          style: 'footer'
        }
      ],
      styles: {
        headerTitle: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        headerInfo: {
          fontSize: 10,
          color: 'gray',
          margin: [0, 0, 0, 2]
        },
        slogan: {
          fontSize: 10,
          italics: true,
          color: '#4299e1',
          margin: [0, 5, 0, 0]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        clientName: {
          fontSize: 12,
          bold: true,
          margin: [0, 3, 0, 1]
        },
        clientInfo: {
          fontSize: 10,
          margin: [0, 0, 0, 1]
        },
        invoiceInfo: {
          fontSize: 10,
          margin: [0, 0, 0, 2]
        },
        debtInfo: {
          fontSize: 11,
          color: 'red',
          bold: true
        },
        paidStatus: {
          fontSize: 14,
          bold: true,
          color: 'green',
          margin: [0, 0, 0, 5]
        },
        unpaidStatus: {
          fontSize: 14,
          bold: true,
          color: 'red',
          margin: [0, 0, 0, 5]
        },
        // Watermark simplificado (no posición absoluta)
        unpaidWatermarkSimple: {
          fontSize: 40,
          bold: true,
          color: 'rgba(255, 0, 0, 0.2)'
        },
        tableHeader: {
          fontSize: 11,
          bold: true,
          color: 'black',
          fillColor: '#f0f0f0',
          alignment: 'center'
        },
        totalHeader: {
          fontSize: 12,
          bold: true
        },
        totalValue: {
          fontSize: 12,
          bold: true
        },
        paymentInfo: {
          fontSize: 10,
          margin: [0, 2, 0, 0]
        },
        footer: {
          fontSize: 10,
          italics: true,
          alignment: 'center',
          margin: [0, 20, 0, 0]
        }
      }
    };
  }

  private crearDefinicionFacturaPagada(
    cliente: any, 
    pago: any,
    tarifa: any
  ): any {
    const fecha = new Date();
    const fechaPago = new Date(pago.FechaPago);
    const numeroFactura = `PAID-${pago.ID || Math.floor(Math.random() * 10000)}`;
    
    // Simplificamos la definición del documento para evitar problemas
    return {
      content: [
        // Encabezado simplificado
        {
          columns: [
            {
              width: 60,
              text: 'LOGO', // Texto en lugar de imagen
              alignment: 'center',
              margin: [0, 10, 0, 0]
            },
            {
              stack: [
                { text: 'Voz IP Company', style: 'headerTitle' },
                { text: 'NIT: 900505805-5', style: 'headerInfo' },
                { text: 'Email: proyectos@voipbx.co', style: 'headerInfo' },
                { text: 'Celular: 3180638757', style: 'headerInfo' },
                { text: 'Conéctate a la máxima velocidad', style: 'slogan' }
              ],
              alignment: 'right'
            }
          ]
        },
        
        // Línea separadora
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
        
        // Información de la factura
        {
          columns: [
            {
              stack: [
                { text: 'Factura a:', style: 'subheader' },
                { text: `${cliente.NombreCliente} ${cliente.ApellidoCliente || ''}`, style: 'clientName' },
                { text: `Cédula/NIT: ${cliente.Cedula || 'N/A'}`, style: 'clientInfo' },
                { text: `Teléfono: ${cliente.Telefono || 'N/A'}`, style: 'clientInfo' },
                { text: `Dirección: ${cliente.Ubicacion || 'N/A'}`, style: 'clientInfo' }
              ]
            },
            {
              stack: [
                { text: 'FACTURA PAGADA', style: 'paidStatus' },
                { text: `Factura #: ${numeroFactura}`, style: 'invoiceInfo' },
                { text: `Fecha de emisión: ${this.formatearFecha(fecha)}`, style: 'invoiceInfo' },
                { text: `Fecha de pago: ${this.formatearFecha(fechaPago)}`, style: 'invoiceInfo' },
              ],
              alignment: 'right'
            }
          ],
          margin: [0, 20, 0, 20]
        },
        
        // Detalles del servicio
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Período', style: 'tableHeader' },
                { text: 'Método de Pago', style: 'tableHeader' },
                { text: 'Monto', style: 'tableHeader' }
              ],
              [
                `Servicio Internet ${tarifa.nombre || ''}`,
                `${pago.Mes || 'N/A'} ${pago.Ano || fechaPago.getFullYear()}`,
                `${this.obtenerMetodoPago(pago.Metodo_de_PagoID)}`,
                `$${this.formatearNumero(pago.Monto)}`
              ]
            ]
          }
        },
        
        // Espacio en blanco
        { text: '', margin: [0, 10, 0, 10] },
        
        // Resumen de factura
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
                { text: `$${this.formatearNumero(pago.Monto)}`, alignment: 'right' }
              ],
              [
                { text: 'IVA (19%)', style: 'tableHeader', alignment: 'right' },
                { text: 'Incluido', alignment: 'right' }
              ],
              [
                { text: 'Total Pagado', style: 'totalHeader', alignment: 'right' },
                { text: `$${this.formatearNumero(pago.Monto)}`, style: 'totalValue', alignment: 'right' }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 10, 0, 10]
        },
        
        // Marca de agua (como texto normal)
        {
          text: 'PAGADO',
          style: 'paidWatermarkSimple',
          alignment: 'center',
          margin: [0, 20, 0, 20]
        },
        
        // Información adicional
        {
          stack: [
            { text: 'Información Adicional', style: 'subheader' },
            { text: `Número de confirmación: ${pago.ID}`, style: 'paymentInfo' },
            { text: `Fecha de procesamiento: ${this.formatearFecha(fechaPago)}`, style: 'paymentInfo' }
          ],
          margin: [0, 20, 0, 20]
        },
        
        // Nota al pie
        {
          text: 'Gracias por su pago. Conéctate a la máxima velocidad con Voz IP Company.',
          style: 'footer'
        }
      ],
      styles: {
        headerTitle: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        headerInfo: {
          fontSize: 10,
          color: 'gray',
          margin: [0, 0, 0, 2]
        },
        slogan: {
          fontSize: 10,
          italics: true,
          color: '#4299e1',
          margin: [0, 5, 0, 0]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        clientName: {
          fontSize: 12,
          bold: true,
          margin: [0, 3, 0, 1]
        },
        clientInfo: {
          fontSize: 10,
          margin: [0, 0, 0, 1]
        },
        invoiceInfo: {
          fontSize: 10,
          margin: [0, 0, 0, 2]
        },
        paidStatus: {
          fontSize: 14,
          bold: true,
          color: 'green',
          margin: [0, 0, 0, 5]
        },
        unpaidStatus: {
          fontSize: 14,
          bold: true,
          color: 'red',
          margin: [0, 0, 0, 5]
        },
        // Watermark simplificado (no posición absoluta)
        paidWatermarkSimple: {
          fontSize: 40,
          bold: true,
          color: 'rgba(0, 128, 0, 0.2)'
        },
        tableHeader: {
          fontSize: 11,
          bold: true,
          color: 'black',
          fillColor: '#f0f0f0',
          alignment: 'center'
        },
        totalHeader: {
          fontSize: 12,
          bold: true
        },
        totalValue: {
          fontSize: 12,
          bold: true
        },
        paymentInfo: {
          fontSize: 10,
          margin: [0, 2, 0, 0]
        },
        footer: {
          fontSize: 10,
          italics: true,
          alignment: 'center',
          margin: [0, 20, 0, 0]
        }
      }
    };
  }

  private generarYDescargarPDF(docDefinition: any, nombreArchivo: string): void {
    try {
      // Verificar que pdfMake esté disponible
      if (typeof pdfMake === 'undefined') {
        console.error('pdfMake no está disponible.');
        return;
      }
      
      // Intentar crear y descargar el PDF con manejo de errores
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.download(nombreArchivo);
    } catch (error) {
      console.error('Error al generar y descargar el PDF:', error);
      alert('Hubo un problema al generar la factura. Por favor, inténtelo de nuevo.');
    }
  }

  // Función para formatear fecha
  private formatearFecha(fecha: Date): string {
    return `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
  }

  // Función para obtener fecha de vencimiento
  private obtenerFechaVencimiento(fecha: Date, diasPlazo: number): Date {
    const fechaVencimiento = new Date(fecha);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasPlazo);
    return fechaVencimiento;
  }

  // Función para formatear números
  private formatearNumero(numero: number): string {
    return new Intl.NumberFormat('es-CO').format(numero);
  }

  // Función para obtener el nombre del mes
  private obtenerNombreMes(numeroMes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[numeroMes];
  }

  // Generar detalle de meses adeudados
  private generarDetalleMesesAdeudados(mesesDebidos: number): string {
    if (mesesDebidos <= 0) return 'Ninguno';
    
    const fecha = new Date();
    const mesActual = fecha.getMonth();
    const anoActual = fecha.getFullYear();
    
    let mesesTexto = [];
    let mes = mesActual;
    let ano = anoActual;
    
    // Limitar a 6 meses para evitar problemas con listas demasiado largas
    const mesesAMostrar = Math.min(mesesDebidos, 6);
    
    // Retroceder mesesDebidos meses desde el mes actual
    for (let i = 0; i < mesesAMostrar; i++) {
      mes--;
      if (mes < 0) {
        mes = 11; // diciembre
        ano--;
      }
      mesesTexto.push(`${this.obtenerNombreMes(mes)} ${ano}`);
    }
    
    // Si hay más meses de los que mostramos, indicarlo
    if (mesesDebidos > mesesAMostrar) {
      mesesTexto.push(`y ${mesesDebidos - mesesAMostrar} más`);
    }
    
    // Invertir para mostrar el orden cronológico (más antiguos primero)
    return mesesTexto.reverse().join(', ');
  }

  // Obtener el método de pago basado en el ID
  private obtenerMetodoPago(metodoId: number): string {
    const metodos: { [key: number]: string } = {
      1: 'Efectivo',
      2: 'Transferencia Bancaria',
      3: 'Tarjeta de Crédito',
      4: 'Nequi',
      5: 'Daviplata',
      6: 'Otro'
    };
    
    return metodos[metodoId] || 'Desconocido';
  }
}