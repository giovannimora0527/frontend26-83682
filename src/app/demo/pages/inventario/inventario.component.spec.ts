import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Rol } from 'src/app/models/estados';
import { MovimientoInventario, Producto } from 'src/app/models/producto';
import { crearTokenPrueba } from 'src/app/testing/jwt.testing';
import { InventarioComponent } from './inventario.component';
import { ProductoDetalleComponent } from './producto-detalle/producto-detalle.component';
import { InventarioService } from './service/inventario.service';

const producto: Producto = {
  id: 1, codigo: 'AMX00500', nombre: 'Amoxicilina', tipoProducto: 'MEDICAMENTO', descripcion: null, presentacion: 'Caja', unidadMedida: 'tableta',
  requiereInvima: true, registroInvima: 'INV-1', precioVenta: 1500, impuestoId: 1, porcentajeIva: 0, stockMinimo: 20, fechaProximoPedido: null,
  activo: true, cantidadDisponible: 10, precioCompraUltimo: 900, precioCompraPromedio: 900, proximoVencimiento: '2030-01-01',
  estadosStock: ['BAJO'],
  lotes: [{
    id: 7, numeroLote: 'L1', precioCompra: 900, cantidadInicial: 10, cantidadDisponible: 10, fechaCompra: '2026-01-01',
    fechaIngreso: '2026-01-02', fechaVencimiento: '2030-01-01', vencido: false, diasParaVencer: 900
  }]
};

describe('Inventario', () => {
  const api = `${environment.apiUrlAuth}/inventario`;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => sessionStorage.removeItem('token'));

  function listado(rol: Rol) {
    sessionStorage.setItem('token', crearTokenPrueba({ rol }));
    const fixture = TestBed.createComponent(InventarioComponent);
    http.expectOne(`${api}/productos`).flush([
      producto,
      { ...producto, id: 2, codigo: 'GAS00010', nombre: 'Gasa', tipoProducto: 'INSUMO', estadosStock: ['DISPONIBLE'], registroInvima: null },
      { ...producto, id: 3, codigo: 'VEN00001', nombre: 'Vencido', estadosStock: ['VENCIDO'], proximoVencimiento: null },
      { ...producto, id: 4, codigo: 'INA00001', nombre: 'Inactivo', activo: false }
    ]);
    http.expectOne(`${api}/alertas`).flush({ agotados: 0, bajoStock: 1, proximosVencer: 0, vencidos: 1 });
    fixture.detectChanges();
    return fixture;
  }
  const textoBotones = (raiz: HTMLElement) => Array.from(raiz.querySelectorAll('button')).map((b) => b.textContent?.trim() ?? '');

  it('muestra las alertas y filtra al pulsarlas', () => {
    const fixture = listado('ADMINISTRADOR');
    const tarjetas = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button.card');
    expect(Array.from(tarjetas).map((t) => t.querySelector('strong')?.textContent)).toEqual(['0', '1', '0', '1']);
    tarjetas[3].click();
    expect(fixture.componentInstance.tabla.filtradas.map(({ id }) => id)).toEqual([3]);
    tarjetas[3].click();
    expect(fixture.componentInstance.tabla.filtradas.length).toBe(3);
  });

  it('filtra por tipo, activos, disponibles y texto', () => {
    const c = listado('ADMINISTRADOR').componentInstance;
    const ids = () => { c.aplicarFiltros(); return c.tabla.filtradas.map(({ id }) => id).sort(); };
    expect(ids()).toEqual([1, 2, 3]);
    c.soloActivos = false;
    expect(ids()).toEqual([1, 2, 3, 4]);
    c.soloDisponibles = true;
    expect(ids()).toEqual([1, 2, 4]);
    c.tipo = 'INSUMO';
    expect(ids()).toEqual([2]);
    c.tabla.termino = 'nada';
    expect(ids()).toEqual([]);
  });

  it('ADMINISTRADOR puede crear y editar; DESPACHO_MEDICO solo consulta', () => {
    expect(textoBotones(listado('ADMINISTRADOR').nativeElement)).toEqual(jasmine.arrayContaining(['Nuevo producto', 'Editar', 'Inactivar']));
    const fixture = listado('DESPACHO_MEDICO');
    const botones = textoBotones(fixture.nativeElement).join(' ');
    for (const accion of ['Nuevo producto', 'Editar', 'Inactivar', 'Activar']) {
      expect(botones).not.toContain(accion);
    }
    expect(fixture.nativeElement.querySelector('a[href="/inicio/inventario/1"]')).toBeTruthy();
  });

  function detalle(rol: Rol, menus = '[]') {
    sessionStorage.setItem('token', crearTokenPrueba({ rol, menus }));
    const fixture = TestBed.createComponent(ProductoDetalleComponent);
    http.expectOne(`${api}/productos/1`).flush(producto);
    const base: MovimientoInventario = {
      id: 1, fecha: '2026-11-01T10:00:00', tipo: 'ENTRADA_CARGA_MASIVA', medicamentoId: 1, medicamentoCodigo: 'AMX00500', medicamentoNombre: 'A',
      loteId: 7, numeroLote: 'L1', cantidad: 10, saldoLote: 10, saldo: 10, costoUnitario: 900, usuario: 'admin', formulaId: null, despachoId: null,
      cargaId: 5, movimientoRevertidoId: null, referencia: 'Carga 5', motivo: null
    };
    http.expectOne(`${api}/productos/1/movimientos`).flush([{ ...base, id: 2, tipo: 'AJUSTE_NEGATIVO', cantidad: 3, cargaId: null, referencia: null }, base]);
    fixture.componentInstance.pestana = 'kardex';
    fixture.detectChanges();
    return fixture;
  }

  it('el kardex muestra el signo, conserva el orden y enlaza la carga', () => {
    const raiz: HTMLElement = detalle('ADMINISTRADOR', JSON.stringify([{ code: 'carga-inventario', activo: true }])).nativeElement;
    const celdas = Array.from(raiz.querySelectorAll('td.fw-bold'));
    expect(celdas.map((celda) => celda.textContent?.trim())).toEqual(['−3', '+10']);
    expect(celdas.map((celda) => celda.classList.contains('text-danger'))).toEqual([true, false]);
    expect(raiz.querySelector('a[href="/inicio/carga-inventario?carga=5"]')).toBeTruthy();
  });

  it('el detalle es de solo lectura para DESPACHO_MEDICO', () => {
    const botones = textoBotones(detalle('DESPACHO_MEDICO').nativeElement).join(' ');
    for (const accion of ['Editar', 'Registrar entrada', 'Ajuste']) {
      expect(botones).not.toContain(accion);
    }
  });

  it('filtra el kardex por fechas e ignora rangos inválidos', () => {
    const c = detalle('ADMINISTRADOR').componentInstance;
    c.filtrarMovimientos(null);
    http.expectNone((req) => req.url.endsWith('/movimientos'));
    c.filtrarMovimientos({ desde: '2026-11-01', hasta: '2026-11-30' });
    http.expectOne(`${api}/productos/1/movimientos?desde=2026-11-01&hasta=2026-11-30`);
  });

  it('ofrece solo los impuestos activos', () => {
    let ids: number[] = [];
    TestBed.inject(InventarioService).listarImpuestos().subscribe((impuestos) => ids = impuestos.map(({ id }) => id));
    http.expectOne(`${environment.apiUrlAuth}/impuesto/listar`).flush([
      { id: 1, nombre: 'IVA 0 %', porcentaje: 0, activo: true }, { id: 2, nombre: 'Viejo', porcentaje: 16, activo: false }
    ]);
    expect(ids).toEqual([1]);
  });
});
