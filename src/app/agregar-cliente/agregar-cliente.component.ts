import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { PlanService } from '../services/plan.service';
import { SectorService } from '../services/sector.service';
import { TarifaService } from '../services/tarifa.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-agregar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agregar-cliente.component.html',
  styleUrls: ['./agregar-cliente.component.css']
})
export class AgregarClienteComponent implements OnInit {
  clienteForm!: FormGroup;
  estados: any[] = [];
  tiposServicio: any[] = [];
  planes: any[] = [];
  sectores: any[] = [];
  tarifas: any[] = [];
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  mostrarModal: boolean = false;
  isSubmitting: boolean = false;
  
  // ✅ Variable para verificar permisos
  tienePermiso: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService,
    private planService: PlanService,
    private sectorService: SectorService,
    private tarifaService: TarifaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ✅ Verificar permisos al cargar el componente
    this.tienePermiso = this.authService.hasPermission('clientes.crear');
    
    console.log('🔐 Verificando permisos en agregar-cliente...');
    console.log('   Tiene permiso clientes.crear:', this.tienePermiso);
    console.log('   Permisos del usuario:', this.authService.getUserPermissions());
    
    // ✅ Si no tiene permisos, mostrar mensaje y no cargar datos
    if (!this.tienePermiso) {
      console.log('❌ Usuario sin permisos para agregar clientes');
      this.mensaje = 'No tienes permisos para agregar clientes.';
      this.tipoMensaje = 'error';
      return;
    }
    
    // Inicializar formulario
    this.clienteForm = this.fb.group({
      NombreCliente: ['', Validators.required],
      ApellidoCliente: ['', Validators.required],
      plan_mb_id: [null, Validators.required],
      FechaInstalacion: ['', Validators.required],
      EstadoID: [null, Validators.required],
      tarifa_id: [null, Validators.required],
      sector_id: [null, Validators.required],
      IPAddress: ['', [Validators.required, Validators.pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)]],
      Telefono: ['', Validators.required],
      Ubicacion: ['', Validators.required],
      Cedula: ['', Validators.required],
      TipoServicioID: [null, Validators.required]
    });

    // Cargar datos desde la BD
    this.cargarDatos();
  }
  
  private cargarDatos(): void {
    this.apiService.getEstados().subscribe(
      data => {
        this.estados = data;
        console.log('✅ Estados cargados:', this.estados.length);
      },
      error => console.error('❌ Error al cargar estados:', error)
    );
    
    this.apiService.getTiposServicio().subscribe(
      data => {
        this.tiposServicio = data;
        console.log('✅ Tipos de servicio cargados:', this.tiposServicio.length);
      },
      error => console.error('❌ Error al cargar tipos de servicio:', error)
    );
    
    this.planService.getAllPlanes().subscribe(
      data => {
        this.planes = data;
        console.log('✅ Planes cargados:', this.planes.length);
      },
      error => console.error('❌ Error al cargar planes:', error)
    );
    
    this.sectorService.getAllSectores().subscribe(
      data => {
        this.sectores = data;
        console.log('✅ Sectores cargados:', this.sectores.length);
      },
      error => console.error('❌ Error al cargar sectores:', error)
    );
    
    this.tarifaService.getAllTarifas().subscribe(
      data => {
        this.tarifas = data;
        console.log('✅ Tarifas cargadas:', this.tarifas.length);
      },
      error => console.error('❌ Error al cargar tarifas:', error)
    );
  }

  agregarCliente(): void {
    // ✅ Verificar permisos antes de enviar
    if (!this.tienePermiso) {
      this.mensaje = 'No tienes permisos para agregar clientes.';
      this.tipoMensaje = 'error';
      this.mostrarModal = true;
      return;
    }
    
    if (this.clienteForm.valid) {
      this.isSubmitting = true;
      
      // Convertir IDs a enteros antes de enviar
      const clienteData = {
        ...this.clienteForm.value,
        EstadoID: parseInt(this.clienteForm.value.EstadoID, 10),
        TipoServicioID: parseInt(this.clienteForm.value.TipoServicioID, 10),
        plan_mb_id: parseInt(this.clienteForm.value.plan_mb_id, 10),
        sector_id: parseInt(this.clienteForm.value.sector_id, 10),
        tarifa_id: parseInt(this.clienteForm.value.tarifa_id, 10)
      };

      console.log('📝 Enviando cliente:', clienteData);

      this.apiService.addCliente(clienteData).subscribe(
        (response) => {
          console.log('✅ Cliente agregado exitosamente:', response);
          this.mensaje = 'Cliente agregado correctamente';
          this.tipoMensaje = 'success';
          this.mostrarModal = true;
          this.clienteForm.reset(); 
          this.isSubmitting = false;
        },
        error => {
          console.error('❌ Error al agregar cliente:', error);
          this.mensaje = error?.error?.message || 'No se pudo agregar el cliente, intenta de nuevo';
          this.tipoMensaje = 'error';
          this.mostrarModal = true;
          this.isSubmitting = false;
        }
      );
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.clienteForm.controls).forEach(key => {
        this.clienteForm.get(key)?.markAsTouched();
      });
      
      this.mensaje = 'Por favor, complete todos los campos correctamente.';
      this.tipoMensaje = 'error';
      this.mostrarModal = true;
    }
  }
  
  cerrarModal(): void {
    this.mostrarModal = false;
  }
}
