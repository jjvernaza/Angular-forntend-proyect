import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-morosos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './morosos.component.html',
  styleUrls: ['./morosos.component.css']
})
export class MorososComponent implements OnInit {
  morosos: any[] = [];
  mesesDeudaSeleccionado: number = 3;
  isLoading: boolean = false;
  totalDeuda: number = 0;
  promedioMesesDeuda: number = 0;
  tienePermiso: boolean = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificarPermisos();
    if (this.tienePermiso) {
      this.cargarMorosos();
    }
  }

  private verificarPermisos(): void {
    this.tienePermiso = this.authService.hasPermission('morosos.ver');
  }

  cargarMorosos(): void {
    if (!this.tienePermiso) return;

    this.isLoading = true;
    this.apiService.getMorososPorMeses(this.mesesDeudaSeleccionado).subscribe({
      next: (data) => {
        this.morosos = data;
        this.calcularEstadisticas();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar morosos:', err);
        this.isLoading = false;
        alert('Error al cargar clientes morosos. Por favor, intente nuevamente.');
      }
    });
  }

  calcularEstadisticas(): void {
    this.totalDeuda = this.morosos.reduce((sum, c) => sum + c.MontoDeuda, 0);
    this.promedioMesesDeuda = this.morosos.length > 0
      ? this.morosos.reduce((sum, c) => sum + c.MesesDeuda, 0) / this.morosos.length
      : 0;
  }

  registrarPago(clienteId: number): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para registrar pagos.');
      return;
    }
    // Navega pasando el ID del cliente como queryParam
    this.router.navigate(['/agregar-pago'], {
      queryParams: { clienteId: clienteId }
    });
  }

  downloadMorososExcel(): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para descargar reportes.');
      return;
    }

    this.apiService.exportClientsMorososToExcel(this.mesesDeudaSeleccionado).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fecha = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `morosos_vozipcompany_${this.mesesDeudaSeleccionado}meses_${fecha}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('❌ Error al descargar Excel:', error);
        alert('Error al generar el archivo Excel de morosos.');
      }
    });
  }
}