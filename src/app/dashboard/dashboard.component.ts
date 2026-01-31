import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, ChartType } from 'chart.js/auto';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

interface MonthlyIncomeItem {
  mes: string;
  anio: number;
  total: number;
}

interface ExpectedIncomeItem {
  mes: string;
  anio: number;
  totalEsperado: number;
  cantidadClientes: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public clientChart: any = null;
  public incomeChart: any = null;
  public serviceChart: any = null;
  public sectorChart: any = null;
  
  public dashboardStats: any = null;
  public monthlyIncomeData: MonthlyIncomeItem[] = [];
  public expectedIncomeData: ExpectedIncomeItem[] = [];
  
  // ✅ CORREGIDO: Generar años dinámicamente desde 2024 hasta año actual + 1
  public availableYears: number[] = [];
  public selectedYear: number = new Date().getFullYear();
  
  private subscriptions: Subscription = new Subscription();

  private monthNamesES: { [key: string]: string } = {
    'ENERO': 'Enero',
    'FEBRERO': 'Febrero',
    'MARZO': 'Marzo',
    'ABRIL': 'Abril',
    'MAYO': 'Mayo',
    'JUNIO': 'Junio',
    'JULIO': 'Julio',
    'AGOSTO': 'Agosto',
    'SEPTIEMBRE': 'Septiembre',
    'OCTUBRE': 'Octubre',
    'NOVIEMBRE': 'Noviembre',
    'DICIEMBRE': 'Diciembre'
  };

  // Orden de meses para ordenamiento correcto
  private monthOrder: { [key: string]: number } = {
    'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
    'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
  };

  // ✅ Variable de permisos
  tienePermiso: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // ✅ Generar años disponibles dinámicamente
    this.generateAvailableYears();
    
    // ✅ Verificar permisos
    this.verificarPermisos();

    if (isPlatformBrowser(this.platformId)) {
      // ✅ Solo cargar si tiene permisos
      if (this.tienePermiso) {
        this.loadDashboardData();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    
    if (this.clientChart) this.clientChart.destroy();
    if (this.incomeChart) this.incomeChart.destroy();
    if (this.serviceChart) this.serviceChart.destroy();
    if (this.sectorChart) this.sectorChart.destroy();
  }

  // ✅ NUEVO: Generar años disponibles dinámicamente
  private generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    
    // Desde 2024 hasta año actual + 1
    for (let year = 2024; year <= currentYear + 1; year++) {
      this.availableYears.push(year);
    }
    
    console.log('📅 Años disponibles:', this.availableYears);
  }

  private verificarPermisos(): void {
    this.tienePermiso = this.authService.hasPermission('dashboard.ver');
    
    console.log('🔐 Permisos en dashboard:');
    console.log('   Ver dashboard:', this.tienePermiso);
  }

  loadDashboardData(): void {
    if (!this.tienePermiso) {
      console.log('❌ Sin permisos para cargar dashboard');
      return;
    }

    console.log(`📊 Cargando datos del dashboard para el año ${this.selectedYear}...`);

    // Cargar estadísticas generales
    const statsSub = this.apiService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.dashboardStats = data;
        console.log('✅ Dashboard stats cargados:', data);
        
        // Cargar ingresos mensuales del año seleccionado
        this.loadMonthlyIncome();
        
        setTimeout(() => {
          this.initializeClientChart();
          this.initializeServiceChart();
          this.initializeSectorChart();
        }, 300);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar estadísticas del dashboard:', error);
      }
    });
    
    this.subscriptions.add(statsSub);
  }

  // ✅ MEJORADO: Cargar ingresos mensuales por año
  loadMonthlyIncome(): void {
    console.log(`📈 Cargando ingresos mensuales para ${this.selectedYear}...`);
    
    const incomeSub = this.apiService.getMonthlyIncome(this.selectedYear).subscribe({
      next: (data: any[]) => {
        console.log('✅ Ingresos mensuales reales recibidos:', data);
        
        // Procesar datos de ingresos reales
        this.monthlyIncomeData = data.map((item: any) => ({
          mes: this.formatMonth(item.Mes || item.mes),
          anio: item.Ano || item.anio || this.selectedYear,
          total: parseFloat(item.total || 0)
        }));

        // ✅ Ordenar por mes
        this.monthlyIncomeData.sort((a, b) => 
          this.monthOrder[a.mes] - this.monthOrder[b.mes]
        );

        console.log('📊 Ingresos reales procesados:', this.monthlyIncomeData);

        // ✅ NUEVO: Cargar ingresos esperados desde el backend
        this.loadExpectedIncome();
      },
      error: (error: any) => {
        console.error('❌ Error al cargar ingresos mensuales:', error);
        this.monthlyIncomeData = [];
        this.expectedIncomeData = [];
      }
    });

    this.subscriptions.add(incomeSub);
  }

  // ✅ NUEVO: Cargar ingresos esperados desde el backend
  loadExpectedIncome(): void {
    console.log(`💰 Cargando ingresos esperados para ${this.selectedYear}...`);
    
    const expectedSub = this.apiService.getIngresosEsperados(this.selectedYear).subscribe({
      next: (data: any[]) => {
        console.log('✅ Ingresos esperados recibidos:', data);
        
        // Procesar datos de ingresos esperados
        this.expectedIncomeData = data.map((item: any) => ({
          mes: this.formatMonth(item.mes),
          anio: item.anio || this.selectedYear,
          totalEsperado: parseFloat(item.totalEsperado || 0),
          cantidadClientes: item.cantidadClientes || 0
        }));

        // ✅ Ordenar por mes
        this.expectedIncomeData.sort((a, b) => 
          this.monthOrder[a.mes] - this.monthOrder[b.mes]
        );

        console.log('📊 Ingresos esperados procesados:', this.expectedIncomeData);
        console.log(`💵 Total anual esperado: ${this.formatCurrency(
          this.expectedIncomeData.reduce((sum, item) => sum + item.totalEsperado, 0)
        )}`);

        // Actualizar gráfico de ingresos
        setTimeout(() => {
          this.initializeIncomeChart();
        }, 100);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar ingresos esperados:', error);
        this.expectedIncomeData = [];
        
        // Actualizar gráfico de todos modos (solo con ingresos reales)
        setTimeout(() => {
          this.initializeIncomeChart();
        }, 100);
      }
    });

    this.subscriptions.add(expectedSub);
  }

  initializeClientChart(): void {
    const clientChartCanvas = document.getElementById('clientChartCanvas') as HTMLCanvasElement;
    if (!clientChartCanvas) return;
    
    if (this.clientChart) {
      this.clientChart.destroy();
    }

    const clientData = this.dashboardStats?.clientes || { total: 0, activos: 0, suspendidos: 0, retirados: 0 };
    
    this.clientChart = new Chart(clientChartCanvas, {
      type: 'pie' as ChartType,
      data: {
        labels: ['Activos', 'Suspendidos', 'Retirados'],
        datasets: [
          {
            label: 'Clientes',
            data: [
              clientData.activos || 0, 
              clientData.suspendidos || 0, 
              clientData.retirados || 0
            ],
            backgroundColor: ['#22c55e', '#f97316', '#ef4444']
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  initializeIncomeChart(): void {
    const incomeChartCanvas = document.getElementById('incomeChartCanvas') as HTMLCanvasElement;
    if (!incomeChartCanvas) return;
    
    if (this.incomeChart) {
      this.incomeChart.destroy();
    }

    const mesesOrden = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // ✅ CORREGIDO: Asegurar que todos los meses estén representados
    const ingresosReales = mesesOrden.map(mes => {
      const dato = this.monthlyIncomeData.find(item => item.mes === mes);
      return dato ? dato.total : 0;
    });

    const ingresosEsperados = mesesOrden.map(mes => {
      const dato = this.expectedIncomeData.find(item => item.mes === mes);
      return dato ? dato.totalEsperado : 0;
    });

    console.log('📊 Datos para gráfico de ingresos:');
    console.log('   Meses:', mesesOrden);
    console.log('   Reales:', ingresosReales);
    console.log('   Esperados:', ingresosEsperados);

    this.incomeChart = new Chart(incomeChartCanvas, {
      type: 'bar' as ChartType,
      data: {
        labels: mesesOrden,
        datasets: [
          {
            label: 'Ingresos Reales',
            data: ingresosReales,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1
          },
          {
            label: 'Ingresos Esperados',
            data: ingresosEsperados,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: false
          },
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return `${label}: ${new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0
                }).format(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                  notation: 'compact'
                }).format(value);
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
  
  initializeServiceChart(): void {
    const serviceChartCanvas = document.getElementById('serviceChartCanvas') as HTMLCanvasElement;
    if (!serviceChartCanvas) return;
    
    if (this.serviceChart) {
      this.serviceChart.destroy();
    }

    let tiposServicio = ['Sin datos'];
    let cantidadPorServicio = [1];
    
    if (this.dashboardStats?.servicios && this.dashboardStats.servicios.length > 0) {
      tiposServicio = this.dashboardStats.servicios.map((s: any) => s.tipo);
      cantidadPorServicio = this.dashboardStats.servicios.map((s: any) => s.cantidad);
    }
    
    this.serviceChart = new Chart(serviceChartCanvas, {
      type: 'doughnut' as ChartType,
      data: {
        labels: tiposServicio,
        datasets: [
          {
            label: 'Clientes por Tipo de Servicio',
            data: cantidadPorServicio,
            backgroundColor: [
              '#ef4444', '#3b82f6', '#f59e0b', '#14b8a6', '#8b5cf6', '#f97316'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  initializeSectorChart(): void {
    const sectorChartCanvas = document.getElementById('sectorChartCanvas') as HTMLCanvasElement;
    if (!sectorChartCanvas) return;
    
    if (this.sectorChart) {
      this.sectorChart.destroy();
    }

    let nombresSectores = ['Sin datos'];
    let cantidadPorSector = [0];
    
    if (this.dashboardStats?.sectores && this.dashboardStats.sectores.length > 0) {
      nombresSectores = this.dashboardStats.sectores.map((s: any) => s.sector || 'Sin nombre');
      cantidadPorSector = this.dashboardStats.sectores.map((s: any) => s.cantidad || 0);
    }
    
    this.sectorChart = new Chart(sectorChartCanvas, {
      type: 'bar' as ChartType,
      data: {
        labels: nombresSectores,
        datasets: [
          {
            label: 'Clientes por Sector',
            data: cantidadPorSector,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const value = context.parsed.y || 0;
                return `Clientes: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function(value: any) {
                return Number.isInteger(value) ? value : '';
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  downloadData(): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para descargar datos.');
      return;
    }

    if (!this.monthlyIncomeData.length) {
      alert('No hay datos disponibles para descargar');
      return;
    }
    
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Mes,Año,Ingresos Reales,Ingresos Esperados,Diferencia,Cumplimiento %\n";
      
      for (let i = 0; i < this.monthlyIncomeData.length; i++) {
        const item = this.monthlyIncomeData[i];
        const esperado = this.getExpectedIncomeForIndex(i);
        const diferencia = item.total - esperado;
        const cumplimiento = esperado > 0 ? ((item.total / esperado) * 100).toFixed(2) : '0';
        
        csvContent += `${item.mes},${item.anio},${item.total},${esperado},${diferencia},${cumplimiento}\n`;
      }
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ingresos_mensuales_${this.selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ CSV descargado');
    } catch (error) {
      console.error('❌ Error al descargar datos:', error);
      alert('Error al generar la descarga');
    }
  }

  downloadClientsExcel(): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para descargar reportes.');
      return;
    }

    console.log('📥 Iniciando descarga de Excel...');
    
    const excelSub = this.apiService.exportClientsToExcel().subscribe({
      next: (blob: Blob) => {
        console.log('✅ Excel recibido, creando descarga...');
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const fechaActual = new Date().toISOString().split('T')[0];
        link.download = `clientes_vozipcompany_${fechaActual}.xlsx`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Descarga completada');
      },
      error: (error: any) => {
        console.error('❌ Error al descargar Excel:', error);
        alert('Error al generar el archivo Excel. Por favor, intenta nuevamente.');
      }
    });
    
    this.subscriptions.add(excelSub);
  }

  downloadReporteClientesPagos(): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para descargar reportes.');
      return;
    }

    console.log(`📥 Descargando reporte de pagos del año ${this.selectedYear}...`);
    
    const reportSub = this.apiService.exportClientesPagosExcel(this.selectedYear).subscribe({
      next: (blob: Blob) => {
        console.log('✅ Excel recibido, creando descarga...');
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_clientes_pagos_${this.selectedYear}.xlsx`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Descarga completada');
      },
      error: (error: any) => {
        console.error('❌ Error al descargar reporte:', error);
        alert('Error al generar el reporte. Por favor, intenta nuevamente.');
      }
    });
    
    this.subscriptions.add(reportSub);
  }
  
  changeYear(year: number): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para cambiar el año.');
      return;
    }

    if (this.selectedYear !== year) {
      console.log(`📅 Cambiando año de ${this.selectedYear} a ${year}`);
      this.selectedYear = year;
      this.loadMonthlyIncome();
    }
  }
  
  formatMonth(mesUpperCase: string): string {
    if (!mesUpperCase) return '';
    const mesUpper = mesUpperCase.toUpperCase().trim();
    return this.monthNamesES[mesUpper] || mesUpperCase.charAt(0) + mesUpperCase.slice(1).toLowerCase();
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  getEstadoCount(estadoNombre: string): number {
    if (!this.dashboardStats?.debug?.estadosEncontrados) {
      return 0;
    }
    
    const estado = this.dashboardStats.debug.estadosEncontrados.find(
      (e: any) => e.nombre?.toLowerCase() === estadoNombre.toLowerCase()
    );
    
    return estado ? estado.cantidad : 0;
  }
  
  getExpectedIncomeForIndex(index: number): number {
    if (this.expectedIncomeData && this.expectedIncomeData[index]) {
      return this.expectedIncomeData[index].totalEsperado || 0;
    }
    return 0;
  }
  
  // ✅ CORREGIDO: Buscar por mes en los datos cargados
  getDiferencia(mes: string): number {
    const real = this.monthlyIncomeData.find((item: MonthlyIncomeItem) => item.mes === mes);
    const esperado = this.expectedIncomeData.find((item: ExpectedIncomeItem) => item.mes === mes);
    
    const realTotal = real ? real.total : 0;
    const esperadoTotal = esperado ? esperado.totalEsperado : 0;
    
    return realTotal - esperadoTotal;
  }
  
  // ✅ CORREGIDO: Calcular porcentaje correctamente
  getPorcentajeCumplimiento(mes: string): number {
    const real = this.monthlyIncomeData.find((item: MonthlyIncomeItem) => item.mes === mes);
    const esperado = this.expectedIncomeData.find((item: ExpectedIncomeItem) => item.mes === mes);
    
    const realTotal = real ? real.total : 0;
    const esperadoTotal = esperado ? esperado.totalEsperado : 0;
    
    if (esperadoTotal === 0) return 0;
    
    return (realTotal / esperadoTotal) * 100;
  }
}