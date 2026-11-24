import { Component, DestroyRef, inject, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { InventarioService } from '../../inventario/service/inventario.service';
import { Impuesto, ImpuestoRq } from 'src/app/models/tarifa';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { TarifaService } from '../service/tarifa.service';

@Component({
  selector: 'app-impuestos',
  imports: [FormsModule, ReactiveFormsModule, BotonOrdenComponent, PaginacionComponent],
  templateUrl: './impuestos.component.html'
})
export class ImpuestosComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly formBuilder = inject(FormBuilder);
  private readonly tarifaService = inject(TarifaService);
  private readonly inventarioService = inject(InventarioService);
  private modal?: NgbModalRef;
  private enUso = new Set<number | null>();

  readonly esInvalido = esInvalido;
  readonly columnas = [
    { clave: 'nombre', titulo: 'Nombre' }, { clave: 'porcentaje', titulo: 'Porcentaje' }, { clave: 'uso', titulo: 'Uso' }, { clave: 'estado', titulo: 'Estado' }
  ];
  readonly tabla = new Tabla<Impuesto>(
    {
      nombre: (i) => i.nombre,
      porcentaje: (i) => i.porcentaje,
      uso: (i) => (this.estaEnUso(i) ? 'En uso' : 'Sin uso'),
      estado: (i) => (i.activo ? 'Activo' : 'Inactivo')
    },
    'porcentaje'
  );
  readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    porcentaje: this.formBuilder.control<number | null>(null, [
      Validators.required, Validators.pattern(/^\d{1,3}(\.\d{1,2})?$/), Validators.min(0), Validators.max(100)
    ]),
    activo: [true]
  });

  cargando = false;
  errorListado = '';
  seleccionado: Impuesto | null = null;
  enviando = false;
  respuestaError = '';

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.listar();
  }

  /** El uso se deduce de las tarifas (también las cerradas) y de los productos; el backend tiene la última palabra. */
  listar(): void {
    this.cargando = true;
    this.errorListado = '';
    forkJoin({
      impuestos: this.tarifaService.listarImpuestos(), tarifas: this.tarifaService.listar(), productos: this.inventarioService.listarProductos()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: ({ impuestos, tarifas, productos }) => {
        this.enUso = new Set([...tarifas, ...productos].map(({ impuestoId }) => impuestoId));
        this.tabla.items = impuestos;
      },
      error: (error) => this.errorListado = mensajeError(error, 'No fue posible cargar los impuestos.')
    });
  }

  estaEnUso(impuesto: Impuesto): boolean {
    return this.enUso.has(impuesto.id);
  }

  get porcentajeBloqueado(): boolean {
    return this.form.controls.porcentaje.disabled;
  }

  abrir(impuesto: Impuesto | null, contenido: TemplateRef<unknown>): void {
    this.seleccionado = impuesto;
    this.form.reset(impuesto ? { nombre: impuesto.nombre, porcentaje: impuesto.porcentaje, activo: impuesto.activo } : {});
    if (impuesto && this.estaEnUso(impuesto)) {
      this.form.controls.porcentaje.disable();
    } else {
      this.form.controls.porcentaje.enable();
    }
    this.respuestaError = '';
    this.modal = this.modalService.open(contenido, {
      size: 'lg', backdrop: 'static', keyboard: false, scrollable: true, ariaLabelledBy: 'impuestoTitulo'
    });
  }

  guardar(): void {
    if (this.enviando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, porcentaje, activo } = this.form.getRawValue();
    const datos: ImpuestoRq = { nombre: nombre.trim(), porcentaje: Number(porcentaje), activo };
    const solicitud = this.seleccionado
      ? this.tarifaService.actualizarImpuesto(this.seleccionado.id, datos) : this.tarifaService.crearImpuesto(datos);
    this.enviando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: ({ message }) => {
        this.modal?.close();
        this.listar();
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => this.respuestaError = marcarErroresServidor(this.form, error)
        ? '' : mensajeError(error, 'No fue posible guardar el impuesto.')
    });
  }
}
