import { HttpHeaders, HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { Rol } from '../models/estados';
import { crearTokenPrueba } from '../testing/jwt.testing';
import { BadgeEstadoComponent } from './components/badge-estado/badge-estado.component';
import { BotonDescargaComponent } from './components/boton-descarga/boton-descarga.component';
import { FiltroFechasComponent } from './components/filtro-fechas/filtro-fechas.component';
import { PaginacionComponent } from './components/paginacion/paginacion.component';
import { TieneRolDirective } from './directives/tiene-rol.directive';
import { FechaHoraPipe, MonedaPipe } from './pipes/formato.pipes';
import { rangoAtajo, RangoFechas } from './utils/fecha.util';
import { Tabla } from './utils/tabla.util';

@Component({
  selector: 'app-prueba-rol',
  imports: [TieneRolDirective],
  template: `<button *appTieneRol="roles">Crear</button>`
})
class PruebaRolComponent {
  roles: Rol[] = ['ADMINISTRADOR'];
}

describe('Componentes compartidos', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => sessionStorage.removeItem('token'));

  it('formatea moneda y fecha', () => {
    const limpio = (texto: string) => texto.replace(/\s/g, ' ');
    expect(limpio(new MonedaPipe().transform(1500000))).toBe('$ 1.500.000');
    expect(limpio(new MonedaPipe().transform(1500.5))).toBe('$ 1.500,50');
    expect(new MonedaPipe().transform(null)).toBe('');
    expect(new FechaHoraPipe().transform('2026-11-24T09:05:00')).toBe('24/11/2026 09:05');
  });

  it('calcula los atajos con la semana de lunes a domingo y el cambio de año', () => {
    expect(rangoAtajo('semana', new Date(2026, 10, 29))).toEqual({ desde: '2026-11-23', hasta: '2026-11-29' });
    expect(rangoAtajo('mesAnterior', new Date(2026, 0, 31))).toEqual({ desde: '2025-12-01', hasta: '2025-12-31' });
  });

  it('muestra la etiqueta y el color del estado', () => {
    const fixture = TestBed.createComponent(BadgeEstadoComponent);
    fixture.componentRef.setInput('estado', 'cancelada');
    fixture.detectChanges();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent).toBe('Cancelada');
    expect(badge.style.backgroundColor).toBe('rgb(108, 117, 125)');
  });

  it('emite null cuando el rango es inválido', () => {
    const fixture = TestBed.createComponent(FiltroFechasComponent);
    const emitidos: (RangoFechas | null)[] = [];
    fixture.componentInstance.cambio.subscribe((rango) => emitidos.push(rango));
    fixture.detectChanges();
    fixture.componentInstance.desde = '2026-12-01';
    fixture.componentInstance.hasta = '2026-11-01';
    fixture.componentInstance.emitir();
    fixture.componentInstance.aplicar('hoy');
    expect(emitidos[0]).toBeNull();
    expect(emitidos[1]?.desde).toBe(emitidos[1]?.hasta);
  });

  it('cambia de página desde el paginador', async () => {
    const tabla = new Tabla<number>({ v: (n) => n }, 'v', 5);
    tabla.items = Array.from({ length: 12 }, (_, i) => i);
    const fixture = TestBed.createComponent(PaginacionComponent);
    fixture.componentRef.setInput('tabla', tabla);
    fixture.detectChanges();
    const enlaces: HTMLAnchorElement[] = [...fixture.nativeElement.querySelectorAll('a.page-link')];
    enlaces.find((enlace) => enlace.textContent?.trim().startsWith('3'))?.click();
    await fixture.whenStable();
    expect(tabla.visibles).toEqual([10, 11]);
  });

  for (const [rol, visible] of [['ADMINISTRADOR', true], ['DESPACHO_MEDICO', false]] as const) {
    it(`appTieneRol para ${rol}`, () => {
      sessionStorage.setItem('token', crearTokenPrueba({ rol }));
      const fixture = TestBed.createComponent(PruebaRolComponent);
      fixture.detectChanges();
      expect(!!fixture.nativeElement.querySelector('button')).toBe(visible);
    });
  }

  describe('app-boton-descarga', () => {
    function crear() {
      const fixture = TestBed.createComponent(BotonDescargaComponent);
      fixture.componentRef.setInput('endpoint', 'reporte/x/exportar');
      fixture.componentRef.setInput('params', { desde: '2026-11-01', estado: '' });
      fixture.componentRef.setInput('formatos', ['xlsx']);
      fixture.componentRef.setInput('enviarFormato', true);
      fixture.detectChanges();
      return fixture;
    }

    it('pide el archivo con sus filtros, bloquea el doble clic y lo descarga', () => {
      const clic = spyOn(HTMLAnchorElement.prototype, 'click');
      const { componentInstance } = crear();
      componentInstance.descargar('xlsx');
      componentInstance.descargar('xlsx');
      const solicitud = TestBed.inject(HttpTestingController).expectOne(
        `${environment.apiUrlAuth}/reporte/x/exportar?desde=2026-11-01&formato=xlsx`);
      solicitud.event(new HttpResponse({ body: new Blob(['x']), headers: new HttpHeaders() }));
      expect(clic).toHaveBeenCalledTimes(1);
      expect(componentInstance.bloqueado).toBeTrue();
      solicitud.flush(new Blob(['x']));
    });

    it('muestra el mensaje del backend y se desbloquea', async () => {
      const alerta = spyOn(Swal, 'fire');
      const { componentInstance } = crear();
      componentInstance.descargar('xlsx');
      TestBed.inject(HttpTestingController).expectOne(() => true)
        .flush(new Blob(['{"message":"Sin datos"}']), { status: 409, statusText: 'x' });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(alerta.calls.mostRecent().args[1] as unknown).toBe('Sin datos');
      expect(componentInstance.bloqueado).toBeFalse();
    });
  });
});
