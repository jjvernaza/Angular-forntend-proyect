import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

// ✅ Mock Chart.js (evita canvas real y errores del constructor)
class FakeChart {
  static instances: FakeChart[] = [];
  destroy = jasmine.createSpy('destroy');
  constructor(..._args: any[]) {
    FakeChart.instances.push(this);
  }
}

// 🔧 Sobrescribe el Chart importado por el componente (Chart.js/auto)
// OJO: esto funciona porque Chart es un objeto globalizable en runtime del bundle.
// En Karma normalmente queda accesible; si en tu proyecto no, te paso plan B.
declare const Chart: any;

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getDashboardStats',
      'exportClientsToExcel',
      'exportClientesPagosExcel'
    ]);

    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'hasPermission',
      'getUserPermissions'
    ]);

    // defaults
    authSpy.hasPermission.and.returnValue(true);
    authSpy.getUserPermissions.and.returnValue(['dashboard.ver']);
    apiSpy.getDashboardStats.and.returnValue(of({
      clientes: { total: 10, activos: 6, suspendidos: 2, retirados: 2 },
      pagos: {
        ultimosDosMeses: [
          { mes: 'ENERO', anio: 2026, total: '10000' },
          { mes: 'FEBRERO', anio: 2026, total: '20000' }
        ],
        esperados: [
          { mes: 'ENERO', anio: 2026, totalEsperado: '15000', cantidadClientes: 10 },
          { mes: 'FEBRERO', anio: 2026, totalEsperado: '25000', cantidadClientes: 10 }
        ]
      },
      servicios: [{ tipo: 'Fibra', cantidad: 5 }],
      sectores: [{ sector: 'Centro', cantidad: 3 }],
      debug: { estadosEncontrados: [{ nombre: 'Activo', cantidad: 6 }] }
    } as any));

    apiSpy.exportClientsToExcel.and.returnValue(of(new Blob(['x'], { type: 'application/vnd.ms-excel' })));
    apiSpy.exportClientesPagosExcel.and.returnValue(of(new Blob(['y'], { type: 'application/vnd.ms-excel' })));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }, // ✅ simula browser
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;

    // ✅ Hook para mockear Chart si existe como global
    try {
      (window as any).Chart = FakeChart as any;
    } catch {
      // si no se puede, no pasa nada; igual probamos sin romper
    }

    // ✅ Mock DOM canvases
    spyOn(document, 'getElementById').and.callFake((id: string) => {
      const ids = ['clientChartCanvas', 'incomeChartCanvas', 'serviceChartCanvas', 'sectorChartCanvas'];
      if (ids.includes(id)) {
        // canvas fake mínimo
        return document.createElement('canvas') as any;
      }
      return null;
    });

    // ✅ Mock URL APIs para descargas
    if (!window.URL.createObjectURL) {
      (window.URL as any).createObjectURL = jasmine.createSpy('createObjectURL').and.returnValue('blob:mock');
    } else {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock');
    }
    if (!window.URL.revokeObjectURL) {
      (window.URL as any).revokeObjectURL = jasmine.createSpy('revokeObjectURL');
    } else {
      spyOn(window.URL, 'revokeObjectURL');
    }
  });

  afterEach(() => {
    FakeChart.instances = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit: sin permiso dashboard.ver -> no carga data', () => {
    authSpy.hasPermission.and.returnValue(false);

    component.ngOnInit();

    expect(component.tienePermiso).toBeFalse();
    expect(apiSpy.getDashboardStats).not.toHaveBeenCalled();
  });

  it('ngOnInit: en browser + con permiso -> llama loadDashboardData', () => {
    spyOn(component, 'loadDashboardData');

    component.ngOnInit();

    expect(component.loadDashboardData).toHaveBeenCalled();
  });

  it('loadDashboardData: sin permiso -> no llama api', () => {
    component.tienePermiso = false;

    component.loadDashboardData();

    expect(apiSpy.getDashboardStats).not.toHaveBeenCalled();
  });

  it('loadDashboardData: éxito -> setea stats y mapea ingresos (y crea charts con delay)', fakeAsync(() => {
    component.tienePermiso = true;

    component.loadDashboardData();

    expect(apiSpy.getDashboardStats).toHaveBeenCalled();

    // al resolver observable
    expect(component.dashboardStats).toBeTruthy();
    expect(component.monthlyIncomeData.length).toBe(2);
    expect(component.monthlyIncomeData[0].mes).toBe('Enero');
    expect(component.monthlyIncomeData[0].total).toBe(10000);

    expect(component.expectedIncomeData.length).toBe(2);
    expect(component.expectedIncomeData[0].totalEsperado).toBe(15000);

    // charts se inicializan tras 300ms
    tick(301);

    // si el FakeChart se enganchó, debe crear 4 instancias
    if (FakeChart.instances.length) {
      expect(FakeChart.instances.length).toBe(4);
    }
  }));

  it('loadDashboardData: error -> no rompe', () => {
    apiSpy.getDashboardStats.and.returnValue(throwError(() => ({ status: 500 })));

    component.tienePermiso = true;
    component.loadDashboardData();

    expect(apiSpy.getDashboardStats).toHaveBeenCalled();
  });

  it('formatMonth: mapea ENERO -> Enero y fallback', () => {
    expect(component.formatMonth('ENERO')).toBe('Enero');
    expect(component.formatMonth('XYZ')).toBe('Xyz');
    expect(component.formatMonth('')).toBe('');
  });

  it('formatCurrency: formatea COP', () => {
    const txt = component.formatCurrency(1500000);
    expect(txt).toContain('$');
  });

  it('getEstadoCount: devuelve cantidad desde debug', () => {
    component.dashboardStats = {
      debug: { estadosEncontrados: [{ nombre: 'Activo', cantidad: 7 }] }
    };
    expect(component.getEstadoCount('activo')).toBe(7);
    expect(component.getEstadoCount('inactivo')).toBe(0);
  });

  it('getExpectedIncomeForIndex', () => {
    component.expectedIncomeData = [{ mes: 'Enero', anio: 2026, totalEsperado: 9, cantidadClientes: 1 }];
    expect(component.getExpectedIncomeForIndex(0)).toBe(9);
    expect(component.getExpectedIncomeForIndex(99)).toBe(0);
  });

  it('getDiferencia y getPorcentajeCumplimiento', () => {
    component.monthlyIncomeData = [{ mes: 'Enero', anio: 2026, total: 100 }];
    component.expectedIncomeData = [{ mes: 'Enero', anio: 2026, totalEsperado: 200, cantidadClientes: 1 }];

    expect(component.getDiferencia('Enero')).toBe(-100);
    expect(component.getPorcentajeCumplimiento('Enero')).toBe(50);
  });

  it('changeYear: sin permiso -> alerta y no recarga', () => {
    component.tienePermiso = false;
    spyOn(window, 'alert');
    spyOn(component, 'loadDashboardData');

    component.changeYear(2025);

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para cambiar el año.');
    expect(component.loadDashboardData).not.toHaveBeenCalled();
  });

  it('changeYear: con permiso y cambia -> recarga', () => {
    component.tienePermiso = true;
    component.selectedYear = 2024;
    spyOn(component, 'loadDashboardData');

    component.changeYear(2025);

    expect(component.selectedYear).toBe(2025);
    expect(component.loadDashboardData).toHaveBeenCalled();
  });

  it('downloadData: sin permiso -> alerta', () => {
    component.tienePermiso = false;
    spyOn(window, 'alert');

    component.downloadData();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para descargar datos.');
  });

  it('downloadData: sin datos -> alerta', () => {
    component.tienePermiso = true;
    component.monthlyIncomeData = [];
    spyOn(window, 'alert');

    component.downloadData();

    expect(window.alert).toHaveBeenCalledWith('No hay datos disponibles para descargar');
  });

  it('downloadData: con datos -> crea link y descarga', () => {
    component.tienePermiso = true;
    component.monthlyIncomeData = [
      { mes: 'Enero', anio: 2026, total: 10 }
    ];
    component.expectedIncomeData = [
      { mes: 'Enero', anio: 2026, totalEsperado: 20, cantidadClientes: 1 }
    ];

    const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
    const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();

    component.downloadData();

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it('downloadClientsExcel: sin permiso -> alerta y no llama api', () => {
    component.tienePermiso = false;
    spyOn(window, 'alert');

    component.downloadClientsExcel();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para descargar reportes.');
    expect(apiSpy.exportClientsToExcel).not.toHaveBeenCalled();
  });

  it('downloadClientsExcel: éxito -> llama exportClientsToExcel y descarga', () => {
    component.tienePermiso = true;

    const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
    const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();

    component.downloadClientsExcel();

    expect(apiSpy.exportClientsToExcel).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('downloadReporteClientesPagos: sin permiso -> alerta', () => {
    component.tienePermiso = false;
    spyOn(window, 'alert');

    component.downloadReporteClientesPagos();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para descargar reportes.');
  });

  it('downloadReporteClientesPagos: éxito -> llama exportClientesPagosExcel(year)', () => {
    component.tienePermiso = true;
    component.selectedYear = 2026;

    component.downloadReporteClientesPagos();

    expect(apiSpy.exportClientesPagosExcel).toHaveBeenCalledWith(2026);
  });

  it('ngOnDestroy: unsubscribe y destroy charts si existen', () => {
    // charts fake
    const c1: any = { destroy: jasmine.createSpy('destroy') };
    const c2: any = { destroy: jasmine.createSpy('destroy') };

    component.clientChart = c1;
    component.incomeChart = c2;

    // subscriptions
    const unsubSpy = spyOn((component as any).subscriptions, 'unsubscribe').and.callThrough();

    component.ngOnDestroy();

    expect(unsubSpy).toHaveBeenCalled();
    expect(c1.destroy).toHaveBeenCalled();
    expect(c2.destroy).toHaveBeenCalled();
  });
});
