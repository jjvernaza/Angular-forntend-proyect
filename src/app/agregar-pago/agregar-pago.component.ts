import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { MetodoPagoService } from '../services/metodo-pago.service';
import { FacturaService } from '../services/factura.service';

@Component({
  selector: 'app-agregar-pago',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './agregar-pago.component.html',
  styleUrls: ['./agregar-pago.component.css']
})
export class AgregarPagoComponent implements OnInit {
  pagoForm!: FormGroup;
  clienteSeleccionado: any = null;
  pagosCliente: any[] = [];
  pagosFiltrados: any[] = [];
  metodosPago: any[] = [];
  terminoBusqueda: string = '';
  filtroAnio: string = 'todos';
  aniosDisponibles: number[] = [];
  mensajeExito = false;
  mensajeError = false;
  mensajeClienteNoEncontrado = false;
  isSubmitting = false;
  errorMessage: string = '';

  // Configuración para facturas
  mostrarSelectorMeses: boolean = false;
  mesesSeleccionados: number = 1;

  // ✅ Lista de meses en español
  mesesDelAnio: string[] = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  // ✅ Generar años dinámicos desde 2024 en adelante
  aniosDesde2024: number[] = [];

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService,
    private metodoPagoService: MetodoPagoService,
    private facturaService: FacturaService
  ) {}

  ngOnInit(): void {
    // ✅ Inicializar formulario
    this.pagoForm = this.fb.group({
      ClienteID: ['', Validators.required],
      FechaPago: ['', Validators.required],
      Mes: ['', Validators.required],
      Ano: ['', [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear() + 1)]],
      Monto: ['', [Validators.required, Validators.min(1)]],
      Metodo_de_PagoID: ['', Validators.required]
    });

    // Generar lista de años desde 2024 hasta 5 años en el futuro
    const currentYear = new Date().getFullYear();
    for (let i = 2024; i <= currentYear + 5; i++) {
      this.aniosDesde2024.push(i);
    }

    // ✅ Obtener métodos de pago usando el nuevo servicio
    this.metodoPagoService.getAllMetodosPago().subscribe(
      (data) => {
        this.metodosPago = data;
        console.log("Métodos de pago obtenidos:", this.metodosPago);
      },
      (error) => console.error('❌ Error al obtener métodos de pago:', error)
    );

    // Establecer la fecha actual en el formulario
    const today = new Date();
    const currentMonth = this.mesesDelAnio[today.getMonth()];
    
    this.pagoForm.patchValue({
      FechaPago: this.formatDate(today),
      Mes: currentMonth,
      Ano: today.getFullYear()
    });
  }

  // 🔍 Buscar Cliente
  buscarCliente() {
    if (!this.terminoBusqueda.trim()) return;
    
    this.apiService.getClientes().subscribe(
      (clientes) => {
        if (!clientes || clientes.length === 0) {
          this.resetCliente();
          this.mensajeClienteNoEncontrado = true;
          setTimeout(() => (this.mensajeClienteNoEncontrado = false), 3000);
          return;
        }

        const termino = this.terminoBusqueda.trim().toLowerCase();

        const clienteEncontrado = clientes.find((c: any) =>
          c.NombreCliente?.toLowerCase().includes(termino) ||
          c.ApellidoCliente?.toLowerCase().includes(termino) ||
          c.Cedula?.includes(termino)
        );

        if (clienteEncontrado) {
          this.clienteSeleccionado = clienteEncontrado;
          this.pagoForm.patchValue({ 
            ClienteID: clienteEncontrado.ID,
            // Si hay tarifa, establecer ese valor como monto por defecto
            Monto: clienteEncontrado.tarifa?.valor || ''
          });

          // ✅ Obtener pagos del cliente
          this.apiService.getPagosCliente(clienteEncontrado.ID).subscribe(
            (pagos) => {
              this.pagosCliente = pagos || [];
              // Ya no es necesario ordenar aquí, el backend ya devuelve los pagos ordenados
              this.pagosFiltrados = [...this.pagosCliente];

              // 🔄 Extraer años únicos para el filtro
              if (this.pagosCliente.length > 0) {
                this.aniosDisponibles = [...new Set(this.pagosCliente.map(p => p.Ano))].sort();
              } else {
                this.aniosDisponibles = [];
              }
            },
            (error) => {
              console.error('❌ Error al obtener pagos:', error);
              this.resetPagos();
            }
          );

          this.mensajeClienteNoEncontrado = false;
        } else {
          this.resetCliente();
          this.mensajeClienteNoEncontrado = true;
          setTimeout(() => (this.mensajeClienteNoEncontrado = false), 3000);
        }
      },
      (error) => {
        console.error('❌ Error al obtener clientes:', error);
        this.mensajeClienteNoEncontrado = true;
        setTimeout(() => (this.mensajeClienteNoEncontrado = false), 3000);
      }
    );
  }

  // 🔄 Filtrar pagos por año
  filtrarPagos() {
    if (this.filtroAnio === 'todos') {
      this.pagosFiltrados = [...this.pagosCliente];
    } else {
      this.pagosFiltrados = this.pagosCliente.filter(p => p.Ano == this.filtroAnio);
    }
    
    // Asegurar que los pagos siempre estén ordenados por fecha más reciente
    // Esto es una garantía adicional, aunque el backend ya debería devolverlos ordenados
    this.pagosFiltrados.sort((a, b) => {
      // Ordenar por fecha de pago en orden descendente (más reciente primero)
      const fechaA = new Date(a.FechaPago);
      const fechaB = new Date(b.FechaPago);
      return fechaB.getTime() - fechaA.getTime();
    });
  }

  // ✅ Agregar Pago y actualizar la tabla de pagos
  agregarPago(): void {
    if (this.pagoForm.valid) {
      this.isSubmitting = true;
      this.mensajeExito = false;
      this.mensajeError = false;

      // Convertir ID de método de pago a número
      const pagoData = {
        ...this.pagoForm.value,
        Metodo_de_PagoID: parseInt(this.pagoForm.value.Metodo_de_PagoID, 10)
      };

      this.apiService.addPago(pagoData).subscribe(
        (response) => {
          this.mensajeExito = true;
          this.mensajeError = false;
          this.isSubmitting = false;

          // ✅ Agregar el pago a la lista de pagos
          if (response && response.payment) {
            const nuevoPago = response.payment;
            
            // Buscar el método de pago para mostrarlo correctamente en la tabla
            const metodoPago = this.metodosPago.find(m => m.ID === nuevoPago.Metodo_de_PagoID);
            if (metodoPago) {
              nuevoPago.metodoPago = metodoPago;
            }
            
            // Agregar el nuevo pago al inicio del array para que aparezca primero
            this.pagosCliente.unshift(nuevoPago);
            
            // Asegurar que todos los pagos estén ordenados correctamente por fecha
            this.pagosCliente.sort((a, b) => {
              const fechaA = new Date(a.FechaPago);
              const fechaB = new Date(b.FechaPago);
              return fechaB.getTime() - fechaA.getTime();
            });
            
            this.filtrarPagos();

            // ✅ Actualizar los años disponibles si es un nuevo año
            if (!this.aniosDisponibles.includes(nuevoPago.Ano)) {
              this.aniosDisponibles.push(nuevoPago.Ano);
              this.aniosDisponibles.sort();
            }
            
            // Generar automáticamente factura pagada
            this.generarFacturaPagada(this.clienteSeleccionado, nuevoPago);
          }

          // ✅ Resetear campos del formulario excepto ClienteID
          const clienteID = this.pagoForm.value.ClienteID;
          this.pagoForm.reset();
          
          // Establecer valores por defecto
          const today = new Date();
          const currentMonth = this.mesesDelAnio[today.getMonth()];
          
          this.pagoForm.patchValue({
            ClienteID: clienteID,
            FechaPago: this.formatDate(today),
            Mes: currentMonth,
            Ano: today.getFullYear(),
            Monto: this.clienteSeleccionado?.tarifa?.valor || ''
          });

          setTimeout(() => (this.mensajeExito = false), 3000);
        },
        error => {
          console.error('❌ Error al agregar pago:', error);
          this.mensajeExito = false;
          this.mensajeError = true;
          this.isSubmitting = false;
          this.errorMessage = error?.error?.message || 'Error al agregar pago';
          setTimeout(() => (this.mensajeError = false), 3000);
        }
      );
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.pagoForm.controls).forEach(key => {
        this.pagoForm.get(key)?.markAsTouched();
      });
    }
  }

  // Formatear fecha para input type="date"
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ❌ Reset cliente y pagos si la búsqueda falla
  private resetCliente() {
    this.clienteSeleccionado = null;
    this.pagosCliente = [];
    this.pagosFiltrados = [];
    this.pagoForm.patchValue({ ClienteID: '' });
  }

  private resetPagos() {
    this.pagosCliente = [];
    this.pagosFiltrados = [];
  }

  // Métodos para facturas
  // Método para generar factura por pagar
  generarFacturaPorPagar(cliente: any, mesesDebidos: number = 1): void {
    if (!cliente?.tarifa) {
      // Obtener la tarifa del cliente
      this.apiService.getTarifaByClienteId(cliente.ID).subscribe(
        tarifa => {
          this.facturaService.generarFacturaPorPagar(cliente, mesesDebidos, tarifa);
        },
        error => {
          console.error('Error al obtener tarifa del cliente:', error);
          alert('No se pudo obtener la tarifa del cliente. Por favor, inténtelo de nuevo.');
        }
      );
    } else {
      // Si ya tenemos la tarifa del cliente en el objeto cliente
      this.facturaService.generarFacturaPorPagar(cliente, mesesDebidos, cliente.tarifa);
    }
  }

  // Método para generar factura pagada
  generarFacturaPagada(cliente: any, pago: any): void {
    if (!cliente?.tarifa) {
      // Obtener la tarifa del cliente
      this.apiService.getTarifaByClienteId(cliente.ID).subscribe(
        tarifa => {
          this.facturaService.generarFacturaPagada(cliente, pago, tarifa);
        },
        error => {
          console.error('Error al obtener tarifa del cliente:', error);
          alert('No se pudo obtener la tarifa del cliente. Por favor, inténtelo de nuevo.');
        }
      );
    } else {
      // Si ya tenemos la tarifa del cliente en el objeto cliente
      this.facturaService.generarFacturaPagada(cliente, pago, cliente.tarifa);
    }
  }
  
  // Métodos para el selector de meses
  abrirSelectorMeses(): void {
    this.mostrarSelectorMeses = true;
  }

  cerrarSelectorMeses(): void {
    this.mostrarSelectorMeses = false;
  }
}