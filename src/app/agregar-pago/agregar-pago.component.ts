import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  mostrarSelectorMeses: boolean = false;
  mesesSeleccionados: number = 1;
  modoEdicion: boolean = false;
  pagoEnEdicion: any = null;
  mostrarModalEliminar: boolean = false;
  pagoAEliminar: any = null;

  mesesDelAnio: string[] = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  aniosDesde2024: number[] = [];
  tienePermisoLeer: boolean = false;
  tienePermisoCrear: boolean = false;
  tienePermisoActualizar: boolean = false;
  tienePermisoEliminar: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private metodoPagoService: MetodoPagoService,
    private facturaService: FacturaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.verificarPermisos();

    if (!this.tienePermisoLeer && !this.tienePermisoCrear) {
      return;
    }

    this.pagoForm = this.fb.group({
      ClienteID: ['', Validators.required],
      FechaPago: ['', Validators.required],
      Mes: ['', Validators.required],
      Ano: ['', [Validators.required, Validators.min(2000),
                 Validators.max(new Date().getFullYear() + 1)]],
      Monto: ['', [Validators.required, Validators.min(1)]],
      Metodo_de_PagoID: ['', Validators.required]
    });

    const currentYear = new Date().getFullYear();
    for (let i = 2024; i <= currentYear + 5; i++) {
      this.aniosDesde2024.push(i);
    }

    this.metodoPagoService.getAllMetodosPago().subscribe(
      (data) => { this.metodosPago = data; },
      (error) => console.error('❌ Error al obtener métodos de pago:', error)
    );

    const today = new Date();
    this.pagoForm.patchValue({
      FechaPago: this.formatDate(today),
      Mes: this.mesesDelAnio[today.getMonth()],
      Ano: today.getFullYear()
    });

    // ── Leer clienteId desde queryParams (viene de morosos) ──
    this.route.queryParams.subscribe(params => {
      const clienteId = params['clienteId'];
      if (clienteId) {
        // setTimeout para esperar que los métodos de pago carguen
        setTimeout(() => {
          this.cargarClientePorId(Number(clienteId));
        }, 500);
      }
    });
  }

  // ── Carga el cliente directamente por ID sin necesidad de buscar ──
  private cargarClientePorId(id: number): void {
    this.apiService.getClientes().subscribe(
      (clientes) => {
        const cliente = clientes.find(
          (c: any) => c.ID === id || c.ID === String(id)
        );
        if (cliente) {
          this.terminoBusqueda = `${cliente.NombreCliente} ${cliente.ApellidoCliente}`.trim();
          this.clienteSeleccionado = cliente;
          this.pagoForm.patchValue({
            ClienteID: cliente.ID,
            Monto: cliente.tarifa?.valor || ''
          });

          this.apiService.getPagosCliente(cliente.ID).subscribe(
            (pagos) => {
              this.pagosCliente = pagos || [];
              this.pagosFiltrados = [...this.pagosCliente];
              if (this.pagosCliente.length > 0) {
                this.aniosDisponibles = [
                  ...new Set(this.pagosCliente.map((p: any) => p.Ano))
                ].sort() as number[];
              }
              this.filtrarPagos();
              setTimeout(() => {
                document.querySelector('form')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 300);
            },
            (error) => console.error('❌ Error al obtener pagos:', error)
          );
        } else {
          console.warn('⚠️ No se encontró cliente con ID:', id);
        }
      },
      (error) => console.error('❌ Error al cargar clientes:', error)
    );
  }

  private verificarPermisos(): void {
    this.tienePermisoLeer     = this.authService.hasPermission('pagos.leer');
    this.tienePermisoCrear    = this.authService.hasPermission('pagos.crear');
    this.tienePermisoActualizar = this.authService.hasPermission('pagos.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('pagos.eliminar');
  }

  buscarCliente(): void {
    if (!this.tienePermisoLeer) {
      alert('No tienes permisos para buscar clientes.');
      return;
    }
    if (!this.terminoBusqueda.trim()) {
      alert('Por favor ingresa un término de búsqueda');
      return;
    }

    this.apiService.getClientes().subscribe(
      (clientes) => {
        if (!clientes || clientes.length === 0) {
          this.resetCliente();
          this.mostrarNoEncontrado();
          return;
        }

        const termino = this.terminoBusqueda.trim().toLowerCase();
        const clienteEncontrado = clientes.find((c: any) => {
          const nombreCompleto =
            `${c.NombreCliente || ''} ${c.ApellidoCliente || ''}`.toLowerCase();
          return (
            c.NombreCliente?.toLowerCase().includes(termino) ||
            c.ApellidoCliente?.toLowerCase().includes(termino) ||
            nombreCompleto.includes(termino) ||
            c.Cedula?.includes(termino) ||
            c.Telefono?.includes(termino)
          );
        });

        if (clienteEncontrado) {
          this.clienteSeleccionado = clienteEncontrado;
          this.pagoForm.patchValue({
            ClienteID: clienteEncontrado.ID,
            Monto: clienteEncontrado.tarifa?.valor || ''
          });

          this.apiService.getPagosCliente(clienteEncontrado.ID).subscribe(
            (pagos) => {
              this.pagosCliente = pagos || [];
              this.pagosFiltrados = [...this.pagosCliente];
              if (this.pagosCliente.length > 0) {
                this.aniosDisponibles = [
                  ...new Set(this.pagosCliente.map((p: any) => p.Ano))
                ].sort() as number[];
              } else {
                this.aniosDisponibles = [];
              }
              this.filtrarPagos();
            },
            (error) => { console.error(error); this.resetPagos(); }
          );
          this.mensajeClienteNoEncontrado = false;
        } else {
          this.resetCliente();
          this.mostrarNoEncontrado();
        }
      },
      (error) => {
        console.error(error);
        this.mostrarNoEncontrado();
      }
    );
  }

  private mostrarNoEncontrado(): void {
    this.mensajeClienteNoEncontrado = true;
    setTimeout(() => (this.mensajeClienteNoEncontrado = false), 3000);
  }

  filtrarPagos(): void {
    this.pagosFiltrados =
      this.filtroAnio === 'todos'
        ? [...this.pagosCliente]
        : this.pagosCliente.filter((p) => p.Ano == this.filtroAnio);

    this.pagosFiltrados.sort(
      (a, b) =>
        new Date(b.FechaPago).getTime() - new Date(a.FechaPago).getTime()
    );
  }

  agregarPago(): void {
    if (!this.tienePermisoCrear) {
      alert('No tienes permisos para crear pagos.');
      return;
    }
    if (this.pagoForm.valid) {
      this.isSubmitting = true;
      const pagoData = {
        ...this.pagoForm.value,
        Metodo_de_PagoID: parseInt(this.pagoForm.value.Metodo_de_PagoID, 10)
      };
      this.apiService.addPago(pagoData).subscribe(
        (response) => {
          this.mensajeExito = 'Pago registrado correctamente';
          this.mensajeError = false;
          this.isSubmitting = false;
          this.recargarPagosCliente();
          if (response?.payment) {
            this.generarFacturaPagada(this.clienteSeleccionado, response.payment);
          }
          this.resetFormulario();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        (error) => {
          this.mensajeError = true;
          this.isSubmitting = false;
          this.errorMessage = error?.error?.message || 'Error al agregar pago';
          setTimeout(() => (this.mensajeError = false), 3000);
        }
      );
    } else {
      Object.keys(this.pagoForm.controls).forEach((k) =>
        this.pagoForm.get(k)?.markAsTouched()
      );
    }
  }

  editarPago(pago: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar pagos.');
      return;
    }
    this.modoEdicion = true;
    this.pagoEnEdicion = pago;
    this.pagoForm.patchValue({
      ClienteID: pago.ClienteID,
      FechaPago: this.formatDate(new Date(pago.FechaPago)),
      Mes: pago.Mes,
      Ano: pago.Ano,
      Monto: pago.Monto,
      Metodo_de_PagoID: pago.Metodo_de_PagoID
    });
    setTimeout(() => {
      document.querySelector('form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  actualizarPago(): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar pagos.');
      return;
    }
    if (this.pagoForm.valid && this.pagoEnEdicion) {
      this.isSubmitting = true;
      const pagoData = {
        FechaPago: this.pagoForm.value.FechaPago,
        Mes: this.pagoForm.value.Mes,
        Ano: this.pagoForm.value.Ano,
        Monto: this.pagoForm.value.Monto,
        Metodo_de_PagoID: parseInt(this.pagoForm.value.Metodo_de_PagoID, 10)
      };
      this.apiService.updatePago(this.pagoEnEdicion.ID, pagoData).subscribe(
        () => {
          this.mensajeExito = 'Pago actualizado correctamente';
          this.isSubmitting = false;
          this.recargarPagosCliente();
          this.cancelarEdicion();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        (error) => {
          this.mensajeError = true;
          this.isSubmitting = false;
          this.errorMessage = error?.error?.message || 'Error al actualizar pago';
          setTimeout(() => (this.mensajeError = false), 3000);
        }
      );
    } else {
      Object.keys(this.pagoForm.controls).forEach((k) =>
        this.pagoForm.get(k)?.markAsTouched()
      );
    }
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.pagoEnEdicion = null;
    this.resetFormulario();
  }

  confirmarEliminarPago(pago: any): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar pagos.');
      return;
    }
    this.pagoAEliminar = pago;
    this.mostrarModalEliminar = true;
  }

  eliminarPago(): void {
    if (!this.tienePermisoEliminar || !this.pagoAEliminar) return;
    this.isSubmitting = true;
    this.apiService.deletePago(this.pagoAEliminar.ID).subscribe(
      () => {
        this.mensajeExito = 'Pago eliminado correctamente';
        this.isSubmitting = false;
        this.recargarPagosCliente();
        this.cerrarModalEliminar();
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      (error) => {
        this.mensajeError = true;
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message || 'Error al eliminar pago';
        this.cerrarModalEliminar();
        setTimeout(() => (this.mensajeError = false), 3000);
      }
    );
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.pagoAEliminar = null;
  }

  private recargarPagosCliente(): void {
    if (this.clienteSeleccionado) {
      this.apiService.getPagosCliente(this.clienteSeleccionado.ID).subscribe(
        (pagos) => {
          this.pagosCliente = pagos || [];
          this.filtrarPagos();
          if (this.pagosCliente.length > 0) {
            this.aniosDisponibles = [
              ...new Set(this.pagosCliente.map((p: any) => p.Ano))
            ].sort() as number[];
          } else {
            this.aniosDisponibles = [];
          }
        },
        (error) => console.error('❌ Error al recargar pagos:', error)
      );
    }
  }

  private resetFormulario(): void {
    const clienteID = this.pagoForm.value.ClienteID;
    this.pagoForm.reset();
    const today = new Date();
    this.pagoForm.patchValue({
      ClienteID: clienteID,
      FechaPago: this.formatDate(today),
      Mes: this.mesesDelAnio[today.getMonth()],
      Ano: today.getFullYear(),
      Monto: this.clienteSeleccionado?.tarifa?.valor || ''
    });
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private resetCliente(): void {
    this.clienteSeleccionado = null;
    this.pagosCliente = [];
    this.pagosFiltrados = [];
    this.aniosDisponibles = [];
    this.pagoForm.patchValue({ ClienteID: '' });
    this.cancelarEdicion();
  }

  private resetPagos(): void {
    this.pagosCliente = [];
    this.pagosFiltrados = [];
    this.aniosDisponibles = [];
  }

  generarFacturaPorPagar(cliente: any, mesesDebidos: number = 1): void {
    if (!this.tienePermisoLeer) {
      alert('No tienes permisos para generar facturas.');
      return;
    }
    if (!cliente?.tarifa) {
      this.apiService.getTarifaByClienteId(cliente.ID).subscribe(
        (tarifa) => this.facturaService.generarFacturaPorPagar(cliente, mesesDebidos, tarifa),
        (error) => { console.error(error); alert('No se pudo obtener la tarifa.'); }
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
        (tarifa) => this.facturaService.generarFacturaPagada(cliente, pago, tarifa),
        (error) => { console.error(error); alert('No se pudo obtener la tarifa.'); }
      );
    } else {
      this.facturaService.generarFacturaPagada(cliente, pago, cliente.tarifa);
    }
  }

  abrirSelectorMeses(): void { this.mostrarSelectorMeses = true; }
  cerrarSelectorMeses(): void { this.mostrarSelectorMeses = false; }
}