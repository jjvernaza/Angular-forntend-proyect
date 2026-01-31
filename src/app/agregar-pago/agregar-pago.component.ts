import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
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
  mensajeExito: string = '';
  mensajeError = false;
  mensajeClienteNoEncontrado = false;
  isSubmitting = false;
  errorMessage: string = '';

  // Configuración para facturas
  mostrarSelectorMeses: boolean = false;
  mesesSeleccionados: number = 1;

  // Configuración para edición y eliminación
  modoEdicion: boolean = false;
  pagoEnEdicion: any = null;
  mostrarModalEliminar: boolean = false;
  pagoAEliminar: any = null;

  // Lista de meses en español
  mesesDelAnio: string[] = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  // Generar años dinámicos desde 2024 en adelante
  aniosDesde2024: number[] = [];

  // ✅ Variables de permisos
  tienePermisoLeer: boolean = false;
  tienePermisoCrear: boolean = false;
  tienePermisoActualizar: boolean = false;
  tienePermisoEliminar: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService,
    private authService: AuthService,
    private metodoPagoService: MetodoPagoService,
    private facturaService: FacturaService
  ) {}

  ngOnInit(): void {
    // ✅ Verificar permisos
    this.verificarPermisos();

    // ✅ Solo inicializar si tiene algún permiso
    if (!this.tienePermisoLeer && !this.tienePermisoCrear) {
      console.log('❌ Usuario sin permisos para este módulo');
      return;
    }

    // Inicializar formulario
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

    // Obtener métodos de pago
    this.metodoPagoService.getAllMetodosPago().subscribe(
      (data) => {
        this.metodosPago = data;
        console.log("✅ Métodos de pago obtenidos:", this.metodosPago.length);
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

  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('pagos.leer');
    this.tienePermisoCrear = this.authService.hasPermission('pagos.crear');
    this.tienePermisoActualizar = this.authService.hasPermission('pagos.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('pagos.eliminar');
    
    console.log('🔐 Permisos en agregar-pago:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Crear:', this.tienePermisoCrear);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Eliminar:', this.tienePermisoEliminar);
  }

  // ✅ Buscar Cliente - MEJORADO con búsqueda por nombre, apellido y teléfono
  buscarCliente() {
    if (!this.tienePermisoLeer) {
      alert('No tienes permisos para buscar clientes.');
      return;
    }

    if (!this.terminoBusqueda.trim()) {
      alert('Por favor ingresa un término de búsqueda');
      return;
    }
    
    console.log('🔍 Buscando cliente:', this.terminoBusqueda);

    this.apiService.getClientes().subscribe(
      (clientes) => {
        if (!clientes || clientes.length === 0) {
          this.resetCliente();
          this.mensajeClienteNoEncontrado = true;
          setTimeout(() => (this.mensajeClienteNoEncontrado = false), 3000);
          return;
        }

        const termino = this.terminoBusqueda.trim().toLowerCase();

        // ✅ BÚSQUEDA MEJORADA: nombre, apellido, nombre completo, cédula y teléfono
        const clienteEncontrado = clientes.find((c: any) => {
          const coincideNombre = c.NombreCliente?.toLowerCase().includes(termino);
          const coincideApellido = c.ApellidoCliente?.toLowerCase().includes(termino);
          const nombreCompleto = `${c.NombreCliente || ''} ${c.ApellidoCliente || ''}`.toLowerCase();
          const coincideNombreCompleto = nombreCompleto.includes(termino);
          const coincideCedula = c.Cedula?.includes(termino);
          const coincideTelefono = c.Telefono?.includes(termino);
          
          return coincideNombre || coincideApellido || coincideNombreCompleto || 
                 coincideCedula || coincideTelefono;
        });

        if (clienteEncontrado) {
          console.log('✅ Cliente encontrado:', clienteEncontrado.NombreCliente, clienteEncontrado.ApellidoCliente);
          
          this.clienteSeleccionado = clienteEncontrado;
          this.pagoForm.patchValue({ 
            ClienteID: clienteEncontrado.ID,
            Monto: clienteEncontrado.tarifa?.valor || ''
          });

          // Obtener pagos del cliente
          this.apiService.getPagosCliente(clienteEncontrado.ID).subscribe(
            (pagos) => {
              this.pagosCliente = pagos || [];
              this.pagosFiltrados = [...this.pagosCliente];

              console.log(`📋 Pagos encontrados: ${this.pagosCliente.length}`);

              // Extraer años únicos para el filtro
              if (this.pagosCliente.length > 0) {
                this.aniosDisponibles = [...new Set(this.pagosCliente.map(p => p.Ano))].sort();
              } else {
                this.aniosDisponibles = [];
              }

              // Ordenar pagos por fecha (más recientes primero)
              this.filtrarPagos();
            },
            (error) => {
              console.error('❌ Error al obtener pagos:', error);
              this.resetPagos();
            }
          );

          this.mensajeClienteNoEncontrado = false;
        } else {
          console.log('❌ Cliente no encontrado con el término:', this.terminoBusqueda);
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

  // Filtrar pagos por año
  filtrarPagos() {
    if (this.filtroAnio === 'todos') {
      this.pagosFiltrados = [...this.pagosCliente];
    } else {
      this.pagosFiltrados = this.pagosCliente.filter(p => p.Ano == this.filtroAnio);
    }
    
    // Ordenar por fecha más reciente primero
    this.pagosFiltrados.sort((a, b) => {
      const fechaA = new Date(a.FechaPago);
      const fechaB = new Date(b.FechaPago);
      return fechaB.getTime() - fechaA.getTime();
    });

    console.log(`📊 Pagos filtrados: ${this.pagosFiltrados.length}`);
  }

  // Agregar Pago
  agregarPago(): void {
    // ✅ Verificar permiso antes de agregar
    if (!this.tienePermisoCrear) {
      alert('No tienes permisos para crear pagos.');
      return;
    }

    if (this.pagoForm.valid) {
      this.isSubmitting = true;
      this.mensajeExito = '';
      this.mensajeError = false;

      const pagoData = {
        ...this.pagoForm.value,
        Metodo_de_PagoID: parseInt(this.pagoForm.value.Metodo_de_PagoID, 10)
      };

      console.log('💾 Registrando pago:', pagoData);

      this.apiService.addPago(pagoData).subscribe(
        (response) => {
          console.log('✅ Pago registrado');
          this.mensajeExito = 'Pago registrado correctamente';
          this.mensajeError = false;
          this.isSubmitting = false;

          // Recargar pagos del cliente
          this.recargarPagosCliente();
          
          // Generar automáticamente factura pagada
          if (response && response.payment) {
            this.generarFacturaPagada(this.clienteSeleccionado, response.payment);
          }

          // Resetear formulario
          this.resetFormulario();

          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error => {
          console.error('❌ Error al agregar pago:', error);
          this.mensajeExito = '';
          this.mensajeError = true;
          this.isSubmitting = false;
          this.errorMessage = error?.error?.message || 'Error al agregar pago';
          setTimeout(() => (this.mensajeError = false), 3000);
        }
      );
    } else {
      Object.keys(this.pagoForm.controls).forEach(key => {
        this.pagoForm.get(key)?.markAsTouched();
      });
    }
  }

  // ✅ NUEVA FUNCIÓN: Editar Pago
  editarPago(pago: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar pagos.');
      return;
    }

    console.log('✏️ Editando pago:', pago);

    this.modoEdicion = true;
    this.pagoEnEdicion = pago;

    // Convertir fecha al formato correcto
    const fechaPago = new Date(pago.FechaPago);
    const fechaFormateada = this.formatDate(fechaPago);

    // Cargar datos en el formulario
    this.pagoForm.patchValue({
      ClienteID: pago.ClienteID,
      FechaPago: fechaFormateada,
      Mes: pago.Mes,
      Ano: pago.Ano,
      Monto: pago.Monto,
      Metodo_de_PagoID: pago.Metodo_de_PagoID
    });

    // Scroll al formulario
    setTimeout(() => {
      const formulario = document.querySelector('form');
      if (formulario) {
        formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // ✅ NUEVA FUNCIÓN: Actualizar Pago
  actualizarPago(): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar pagos.');
      return;
    }

    if (this.pagoForm.valid && this.pagoEnEdicion) {
      this.isSubmitting = true;
      this.mensajeExito = '';
      this.mensajeError = false;

      const pagoData = {
        FechaPago: this.pagoForm.value.FechaPago,
        Mes: this.pagoForm.value.Mes,
        Ano: this.pagoForm.value.Ano,
        Monto: this.pagoForm.value.Monto,
        Metodo_de_PagoID: parseInt(this.pagoForm.value.Metodo_de_PagoID, 10)
      };

      console.log('📝 Actualizando pago ID:', this.pagoEnEdicion.ID, pagoData);

      this.apiService.updatePago(this.pagoEnEdicion.ID, pagoData).subscribe(
        (response) => {
          console.log('✅ Pago actualizado');
          this.mensajeExito = 'Pago actualizado correctamente';
          this.mensajeError = false;
          this.isSubmitting = false;

          // Recargar pagos del cliente
          this.recargarPagosCliente();

          // Cancelar modo edición
          this.cancelarEdicion();

          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error => {
          console.error('❌ Error al actualizar pago:', error);
          this.mensajeExito = '';
          this.mensajeError = true;
          this.isSubmitting = false;
          this.errorMessage = error?.error?.message || 'Error al actualizar pago';
          setTimeout(() => (this.mensajeError = false), 3000);
        }
      );
    } else {
      Object.keys(this.pagoForm.controls).forEach(key => {
        this.pagoForm.get(key)?.markAsTouched();
      });
    }
  }

  // ✅ NUEVA FUNCIÓN: Cancelar Edición
  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.pagoEnEdicion = null;
    this.resetFormulario();
  }

  // ✅ NUEVA FUNCIÓN: Confirmar Eliminación
  confirmarEliminarPago(pago: any): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar pagos.');
      return;
    }

    this.pagoAEliminar = pago;
    this.mostrarModalEliminar = true;
  }

  // ✅ NUEVA FUNCIÓN: Eliminar Pago
  eliminarPago(): void {
    if (!this.tienePermisoEliminar || !this.pagoAEliminar) {
      return;
    }

    this.isSubmitting = true;
    console.log('🗑️ Eliminando pago ID:', this.pagoAEliminar.ID);

    this.apiService.deletePago(this.pagoAEliminar.ID).subscribe(
      (response) => {
        console.log('✅ Pago eliminado');
        this.mensajeExito = 'Pago eliminado correctamente';
        this.isSubmitting = false;

        // Recargar pagos del cliente
        this.recargarPagosCliente();

        // Cerrar modal
        this.cerrarModalEliminar();

        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error => {
        console.error('❌ Error al eliminar pago:', error);
        this.mensajeError = true;
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message || 'Error al eliminar pago';
        this.cerrarModalEliminar();
        setTimeout(() => (this.mensajeError = false), 3000);
      }
    );
  }

  // ✅ NUEVA FUNCIÓN: Cerrar Modal de Eliminación
  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.pagoAEliminar = null;
  }

  // ✅ NUEVA FUNCIÓN: Recargar Pagos del Cliente
  private recargarPagosCliente(): void {
    if (this.clienteSeleccionado) {
      this.apiService.getPagosCliente(this.clienteSeleccionado.ID).subscribe(
        (pagos) => {
          this.pagosCliente = pagos || [];
          this.filtrarPagos();

          if (this.pagosCliente.length > 0) {
            this.aniosDisponibles = [...new Set(this.pagosCliente.map(p => p.Ano))].sort();
          } else {
            this.aniosDisponibles = [];
          }
        },
        (error) => console.error('❌ Error al recargar pagos:', error)
      );
    }
  }

  // ✅ NUEVA FUNCIÓN: Resetear Formulario
  private resetFormulario(): void {
    const clienteID = this.pagoForm.value.ClienteID;
    this.pagoForm.reset();
    
    const today = new Date();
    const currentMonth = this.mesesDelAnio[today.getMonth()];
    
    this.pagoForm.patchValue({
      ClienteID: clienteID,
      FechaPago: this.formatDate(today),
      Mes: currentMonth,
      Ano: today.getFullYear(),
      Monto: this.clienteSeleccionado?.tarifa?.valor || ''
    });
  }

  // Formatear fecha
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resetCliente() {
    this.clienteSeleccionado = null;
    this.pagosCliente = [];
    this.pagosFiltrados = [];
    this.aniosDisponibles = [];
    this.pagoForm.patchValue({ ClienteID: '' });
    this.cancelarEdicion();
  }

  private resetPagos() {
    this.pagosCliente = [];
    this.pagosFiltrados = [];
    this.aniosDisponibles = [];
  }

  // Métodos para facturas
  generarFacturaPorPagar(cliente: any, mesesDebidos: number = 1): void {
    if (!this.tienePermisoLeer) {
      alert('No tienes permisos para generar facturas.');
      return;
    }

    if (!cliente?.tarifa) {
      this.apiService.getTarifaByClienteId(cliente.ID).subscribe(
        tarifa => {
          this.facturaService.generarFacturaPorPagar(cliente, mesesDebidos, tarifa);
        },
        error => {
          console.error('Error al obtener tarifa del cliente:', error);
          alert('No se pudo obtener la tarifa del cliente.');
        }
      );
    } else {
      this.facturaService.generarFacturaPorPagar(cliente, mesesDebidos, cliente.tarifa);
    }
  }

  generarFacturaPagada(cliente: any, pago: any): void {
    if (!this.tienePermisoLeer) {
      alert('No tienes permisos para generar facturas.');
      return;
    }

    if (!cliente?.tarifa) {
      this.apiService.getTarifaByClienteId(cliente.ID).subscribe(
        tarifa => {
          this.facturaService.generarFacturaPagada(cliente, pago, tarifa);
        },
        error => {
          console.error('Error al obtener tarifa del cliente:', error);
          alert('No se pudo obtener la tarifa del cliente.');
        }
      );
    } else {
      this.facturaService.generarFacturaPagada(cliente, pago, cliente.tarifa);
    }
  }
  
  abrirSelectorMeses(): void {
    this.mostrarSelectorMeses = true;
  }

  cerrarSelectorMeses(): void {
    this.mostrarSelectorMeses = false;
  }
}