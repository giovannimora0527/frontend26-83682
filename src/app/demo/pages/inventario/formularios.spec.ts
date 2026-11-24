import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { Producto } from 'src/app/models/producto';
import { RespuestaApi } from 'src/app/models/respuesta';
import { fechaIso } from 'src/app/shared/utils/fecha.util';
import { AjusteFormComponent } from './ajuste-form/ajuste-form.component';
import { LoteFormComponent } from './lote-form/lote-form.component';
import { ProductoFormComponent } from './producto-form/producto-form.component';
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

describe('Formularios de inventario', () => {
  let service: jasmine.SpyObj<InventarioService>;
  let modal: jasmine.SpyObj<NgbActiveModal>;
  const respuesta = { status: 200, message: 'ok', data: producto };
  const hoy = fechaIso(new Date());
  const lote = {
    numeroLote: ' L2 ', precioCompra: 900.5, cantidad: 5, fechaCompra: '2026-01-01', fechaIngreso: hoy, fechaVencimiento: '2035-01-01', observacion: ''
  };

  beforeEach(() => {
    service = jasmine.createSpyObj<InventarioService>('InventarioService',
      ['crearProducto', 'actualizarProducto', 'registrarEntrada', 'registrarAjuste', 'listarImpuestos']);
    service.listarImpuestos.and.returnValue(of([{ id: 2, nombre: 'IVA 19 %', porcentaje: 19 }]));
    for (const metodo of ['crearProducto', 'actualizarProducto', 'registrarEntrada', 'registrarAjuste'] as const) {
      service[metodo].and.returnValue(of(respuesta));
    }
    modal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    spyOn(Swal, 'fire');
    TestBed.configureTestingModule({
      providers: [{ provide: InventarioService, useValue: service }, { provide: NgbActiveModal, useValue: modal }]
    });
  });

  describe('producto', () => {
    function crear(editar: Producto | null = null) {
      const fixture = TestBed.createComponent(ProductoFormComponent);
      fixture.componentInstance.producto = editar;
      fixture.detectChanges();
      return fixture;
    }
    const valido = {
      codigo: 'abc12345', nombre: ' Gasa ', tipoProducto: 'INSUMO' as const, unidadMedida: 'unidad', precioVenta: 1000, stockMinimo: 0
    };

    it('exige Invima solo para medicamentos y cambia en vivo con el tipo', () => {
      const { componentInstance: c } = crear();
      c.form.patchValue(valido);
      expect(c.form.controls.registroInvima.valid).toBeTrue();
      c.form.controls.tipoProducto.setValue('MEDICAMENTO');
      expect(c.form.controls.registroInvima.valid).toBeFalse();
      c.form.controls.registroInvima.setValue('INV-9');
      expect(c.form.valid).toBeTrue();
      c.form.patchValue({ registroInvima: '', tipoProducto: 'INSUMO' });
      expect(c.form.valid).toBeTrue();
    });

    for (const codigo of ['', 'ABC1234', 'ABC123456', 'ABC-1234', 'ÁBC12345']) {
      it(`rechaza el código "${codigo}"`, () => {
        const { componentInstance: c } = crear();
        c.form.patchValue({ ...valido, codigo });
        c.guardar();
        expect(service.crearProducto).not.toHaveBeenCalled();
      });
    }

    it('crea en mayúsculas y sin lote si no se pidió', () => {
      const { componentInstance: c } = crear();
      c.form.patchValue(valido);
      c.guardar();
      const datos = service.crearProducto.calls.mostRecent().args[0];
      expect(datos).toEqual(jasmine.objectContaining({ codigo: 'ABC12345', nombre: 'Gasa', requiereInvima: false, registroInvima: null }));
      expect('loteInicial' in datos).toBeFalse();
      expect(modal.close).toHaveBeenCalledOnceWith(producto);
    });

    it('valida e incluye el lote inicial, con vencimiento obligatorio si es medicamento', () => {
      const { componentInstance: c } = crear();
      c.form.patchValue({ ...valido, tipoProducto: 'MEDICAMENTO', registroInvima: 'INV-9', incluirLote: true });
      c.form.controls.loteInicial.patchValue({ ...lote, fechaVencimiento: '' });
      c.guardar();
      expect(service.crearProducto).not.toHaveBeenCalled();
      c.form.controls.loteInicial.patchValue(lote);
      c.guardar();
      expect(service.crearProducto.calls.mostRecent().args[0].loteInicial).toEqual({ ...lote, numeroLote: 'L2', observacion: null });
    });

    it('al editar bloquea el código, conserva el impuesto y explica las cantidades', () => {
      const fixture = crear(producto);
      const c = fixture.componentInstance;
      expect(c.form.controls.codigo.disabled).toBeTrue();
      expect(c.impuestos.map(({ id }) => id)).toEqual([2, 1]);
      expect(fixture.nativeElement.textContent).toContain('Aquí no se cambian las cantidades');
      c.form.controls.nombre.setValue('Nuevo');
      c.guardar();
      expect(service.actualizarProducto).toHaveBeenCalledOnceWith(1, jasmine.objectContaining({ codigo: 'AMX00500', nombre: 'Nuevo', impuestoId: 1 }));
    });

    it('muestra el duplicado junto al campo y evita el doble envío', () => {
      const fixture = crear();
      const c = fixture.componentInstance;
      const pendiente = new Subject<RespuestaApi<Producto>>();
      service.crearProducto.and.returnValue(pendiente);
      c.form.patchValue(valido);
      c.guardar();
      c.guardar();
      expect(service.crearProducto).toHaveBeenCalledTimes(1);
      pendiente.error(new HttpErrorResponse({ status: 409, error: { message: 'x', detalles: [{ campo: 'codigo', mensaje: 'Código repetido' }] } }));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#producto-codigo-error').textContent).toBe('Código repetido');
      expect(c.enviando).toBeFalse();
    });
  });

  describe('entrada', () => {
    function crear(editar = producto) {
      const fixture = TestBed.createComponent(LoteFormComponent);
      fixture.componentInstance.producto = editar;
      fixture.detectChanges();
      return fixture.componentInstance;
    }

    it('propone hoy como fecha de ingreso y registra la entrada', () => {
      const c = crear();
      expect(c.form.controls.fechaIngreso.value).toBe(hoy);
      c.form.patchValue(lote);
      c.guardar();
      expect(service.registrarEntrada).toHaveBeenCalledOnceWith(1, { ...lote, numeroLote: 'L2', observacion: null });
    });

    const manana = fechaIso(new Date(Date.now() + 86_400_000));
    for (const [caso, cambio] of [
      ['compra futura', { fechaCompra: manana }], ['ingreso anterior a la compra', { fechaIngreso: '2025-12-31' }],
      ['ingreso futuro', { fechaIngreso: manana }], ['sin vencimiento', { fechaVencimiento: '' }], ['lote vencido', { fechaVencimiento: '2026-01-05' }],
      ['cantidad 0', { cantidad: 0 }], ['cantidad decimal', { cantidad: 1.5 }], ['precio negativo', { precioCompra: -1 }],
      ['precio con 3 decimales', { precioCompra: 1.005 }], ['sin número', { numeroLote: ' ' }]
    ] as const) {
      it(`rechaza: ${caso}`, () => {
        const c = crear();
        c.form.patchValue({ ...lote, ...cambio });
        c.guardar();
        expect(service.registrarEntrada).not.toHaveBeenCalled();
      });
    }

    it('un insumo puede no tener vencimiento', () => {
      const c = crear({ ...producto, tipoProducto: 'INSUMO' });
      c.form.patchValue({ ...lote, fechaVencimiento: '' });
      c.guardar();
      expect(service.registrarEntrada.calls.mostRecent().args[1].fechaVencimiento).toBeNull();
    });
  });

  describe('ajuste', () => {
    function crear() {
      const fixture = TestBed.createComponent(AjusteFormComponent);
      fixture.componentInstance.producto = producto;
      fixture.detectChanges();
      return fixture.componentInstance;
    }

    it('no permite restar más de lo disponible pero sí sumar', () => {
      const c = crear();
      c.form.setValue({ loteId: 7, tipo: 'AJUSTE_NEGATIVO', cantidad: 11, motivo: 'Conteo' });
      c.guardar();
      expect(service.registrarAjuste).not.toHaveBeenCalled();
      c.form.controls.tipo.setValue('AJUSTE_POSITIVO');
      c.guardar();
      expect(service.registrarAjuste).toHaveBeenCalledOnceWith(1, { loteId: 7, tipo: 'AJUSTE_POSITIVO', cantidad: 11, motivo: 'Conteo' });
    });

    it('exige motivo y muestra el error del backend', () => {
      const c = crear();
      c.form.setValue({ loteId: 7, tipo: 'AJUSTE_NEGATIVO', cantidad: 1, motivo: ' ' });
      c.guardar();
      expect(service.registrarAjuste).not.toHaveBeenCalled();
      service.registrarAjuste.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Sin existencias' } })));
      c.form.controls.motivo.setValue('Rotura');
      c.guardar();
      expect(c.respuestaError).toBe('Sin existencias');
    });
  });
});
