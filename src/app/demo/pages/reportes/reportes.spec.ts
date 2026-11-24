import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Reporte, ReporteCatalogo } from 'src/app/models/reporte';
import { rangoAtajo } from 'src/app/shared/utils/fecha.util';
import { environment } from 'src/environments/environment';
import { ReportesComponent } from './reportes.component';
import { ValorReportePipe } from './valor-reporte.pipe';

describe('Reportes', () => {
  const api = `${environment.apiUrlAuth}/reporte`;
  const fechas = [{ clave: 'desde', obligatorio: true }, { clave: 'hasta', obligatorio: true }];
  const ingresos: ReporteCatalogo = { codigo: 'ingresos-periodo', titulo: 'Ingresos', grupo: 'Financieros', filtros: [...fechas, { clave: 'agrupacion', obligatorio: false, opciones: ['DIA', 'MES', 'ANIO'] }] };
  const kardex: ReporteCatalogo = { codigo: 'kardex', titulo: 'Kardex', grupo: 'Inventario', filtros: [...fechas, { clave: 'medicamentoId', obligatorio: true }] };
  const vencer: ReporteCatalogo = {
    codigo: 'proximos-vencer', titulo: 'Próximos', grupo: 'Inventario',
    filtros: [{ clave: 'desde', obligatorio: false }, { clave: 'hasta', obligatorio: false }, { clave: 'dias', obligatorio: false }]
  };
  const respuesta: Reporte = {
    codigo: 'ingresos-periodo', titulo: 'Ingresos', generadoEn: '2026-11-24T10:00:00', generadoPor: 'admin', filtros: {},
    columnas: [{ clave: 'periodo', titulo: 'Período', tipo: 'texto' }, { clave: 'total', titulo: 'Total', tipo: 'moneda' }],
    filas: [{ periodo: 'Z', total: 1500 }, { periodo: 'A', total: null }], totales: { total: 1500 }
  };
  let http: HttpTestingController;

  function abrir() {
    const fixture = TestBed.createComponent(ReportesComponent);
    http.expectOne(`${api}/catalogo`).flush([ingresos, kardex, vencer]);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  it('formatea según el tipo', () => {
    const pipe = new ValorReportePipe();
    expect(pipe.transform('2026-11-05', 'fecha')).toBe('05/11/2026');
    expect(pipe.transform('2026-11-05T08:30:00', 'fechaHora')).toBe('05/11/2026 08:30');
    expect(pipe.transform(1234.5, 'numero')).toBe('1.234,5');
    expect(pipe.transform(12.5, 'porcentaje')).toBe('12,5 %');
    expect(pipe.transform(1500, 'moneda')).toContain('1.500');
    expect(pipe.transform(null, 'moneda')).toBe('');
    expect(pipe.transform(0, 'numero')).toBe('0');
  });

  it('agrupa el catálogo', () => {
    expect(abrir().componentInstance.grupos.map(({ nombre, reportes }) => [nombre, reportes.length])).toEqual([['Financieros', 1], ['Inventario', 2]]);
  });

  it('consulta con los filtros, respeta el orden, muestra totales y habilita la exportación', () => {
    const fixture = abrir();
    const c = fixture.componentInstance;
    c.elegir(ingresos);
    fixture.detectChanges();
    const excel = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('app-boton-descarga button')).at(-1)!;
    expect(excel().disabled).toBeTrue();
    c.consultar();
    const { desde, hasta } = rangoAtajo('mes');
    http.expectOne(`${api}/ingresos-periodo?desde=${desde}&hasta=${hasta}&agrupacion=MES`).flush(respuesta);
    fixture.detectChanges();
    expect(Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')).map((fila) => fila.textContent?.trim().charAt(0))).toEqual(['Z', 'A']);
    expect(fixture.nativeElement.querySelector('tfoot').textContent).toContain('1.500');
    expect(excel().disabled).toBeFalse();
    excel().click();
    http.expectOne(`${api}/ingresos-periodo/exportar?desde=${desde}&hasta=${hasta}&agrupacion=MES&formato=xlsx`);
    c.cambiarFechas({ desde, hasta: desde });
    fixture.detectChanges();
    expect(c.reporte).toBeNull();
  });

  it('exige los filtros obligatorios y valida los días', () => {
    const c = abrir().componentInstance;
    c.elegir(kardex);
    http.expectOne(`${environment.apiUrlAuth}/inventario/productos`).flush([{ id: 7, codigo: 'AMX', nombre: 'Amoxicilina' }]);
    c.consultar();
    expect(c.errorReporte).toContain('Revisa');
    c.valores['medicamentoId'] = '7';
    c.cambiarFechas(null);
    c.consultar();
    expect(c.errorReporte).toContain('Revisa');
    c.elegir(vencer);
    c.valores['dias'] = '0';
    c.consultar();
    http.expectNone((r) => r.url === `${api}/proximos-vencer`);
    c.valores['dias'] = '30';
    c.consultar();
    http.expectOne(`${api}/proximos-vencer?dias=30`);
  });

  it('muestra el error del backend', () => {
    const c = abrir().componentInstance;
    c.elegir(ingresos);
    c.consultar();
    http.expectOne((r) => r.url === `${api}/ingresos-periodo`).flush({ message: 'El filtro desde es obligatorio.' }, { status: 400, statusText: 'x' });
    expect(c.errorReporte).toContain('obligatorio');
  });
});
