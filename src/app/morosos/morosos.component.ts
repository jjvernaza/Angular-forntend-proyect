import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-morosos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './morosos.component.html',
  styleUrls: ['./morosos.component.css']
})
export class MorososComponent implements OnInit {
  morosos: any[] = [];
  mesesDeudaSeleccionado: number = 3;
  isLoading: boolean = false;
  totalDeuda: number = 0;
  promedioMesesDeuda: number = 0;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMorosos();
  }

  cargarMorosos(): void {
    this.isLoading = true;
    this.apiService.getMorososPorMeses(this.mesesDeudaSeleccionado).subscribe({
      next: (data) => {
        this.morosos = data;
        this.calcularEstadisticas();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar morosos', err);
        this.isLoading = false;
      }
    });
  }

  calcularEstadisticas(): void {
    this.totalDeuda = this.morosos.reduce((sum, cliente) => sum + cliente.MontoDeuda, 0);
    this.promedioMesesDeuda = this.morosos.length > 0
      ? this.morosos.reduce((sum, cliente) => sum + cliente.MesesDeuda, 0) / this.morosos.length
      : 0;
  }

  registrarPago(clienteId: number): void {
    this.router.navigate(['/agregar-pago'], { queryParams: { clienteId } });
  }

  downloadMorososExcel(): void {
    this.apiService.exportClientsMorososToExcel(this.mesesDeudaSeleccionado).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fecha = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `morosos_vozipcompany_${fecha}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('❌ Error al descargar Excel de morosos:', error);
        alert('Error al generar el archivo Excel de morosos.');
      }
    });
  }
}  