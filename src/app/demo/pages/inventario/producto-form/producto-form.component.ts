import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { TipoProducto } from 'src/app/models/estados';
import { Producto, ProductoRq } from 'src/app/models/producto';
import { Impuesto } from 'src/app/models/tarifa';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { CamposLoteComponent } from '../campos-lote/campos-lote.component';
import { crearFormularioLote, datosLote, invimaObligatorio, textoObligatorio, validarEntero, validarPrecio } from '../inventario.util';
import { InventarioService } from '../service/inventario.service';

@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, CamposLoteComponent],
  templateUrl: './producto-form.component.html'
})
export class ProductoFormComponent implements OnInit {
  /** Producto a editar; sin valor, se crea uno nuevo. */
  @Input() producto: Producto | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly inventarioService = inject(InventarioService);
  readonly modal = inject(NgbActiveModal);
  readonly esInvalido = esInvalido;

  readonly form = this.formBuilder.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{8}$/)]],
    nombre: ['', textoObligatorio(100)],
    tipoProducto: this.formBuilder.nonNullable.control<TipoProducto | ''>('', Validators.required),
    descripcion: ['', Validators.maxLength(1000)],
    presentacion: ['', Validators.maxLength(100)],
    unidadMedida: ['', textoObligatorio(30)],
    registroInvima: ['', [invimaObligatorio(() => this.tipo), Validators.maxLength(50)]],
    precioVenta: this.formBuilder.control<number | null>(null, validarPrecio),
    impuestoId: this.formBuilder.control<number | null>(null),
    stockMinimo: this.formBuilder.control<number | null>(null, validarEntero),
    fechaProximoPedido: [''],
    incluirLote: [false],
    loteInicial: crearFormularioLote(this.formBuilder, () => this.esMedicamento)
  });

  impuestos: Impuesto[] = [];
  errorImpuestos = '';
  enviando = false;
  respuestaError = '';

  get tipo(): TipoProducto | '' {
    // El validador de Invima se evalúa por primera vez mientras se construye el formulario.
    return this.form?.controls.tipoProducto.value ?? '';
  }

  get esMedicamento(): boolean {
    return this.tipo === 'MEDICAMENTO';
  }

  ngOnInit(): void {
    const { tipoProducto, registroInvima, incluirLote, loteInicial } = this.form.controls;
    loteInicial.disable();
    tipoProducto.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      registroInvima.updateValueAndValidity();
      loteInicial.updateValueAndValidity();
    });
    incluirLote.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((incluir) =>
      incluir ? loteInicial.enable() : loteInicial.disable());

    if (this.producto) {
      this.form.patchValue({
        ...this.producto,
        descripcion: this.producto.descripcion ?? '',
        presentacion: this.producto.presentacion ?? '',
        registroInvima: this.producto.registroInvima ?? '',
        fechaProximoPedido: this.producto.fechaProximoPedido ?? ''
      });
      this.form.controls.codigo.disable();
    }
    this.inventarioService.listarImpuestos().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (impuestos) => this.impuestos = this.conImpuestoActual(impuestos),
        error: (error) => {
          this.impuestos = this.conImpuestoActual([]);
          this.errorImpuestos = mensajeError(error, 'No fue posible cargar los impuestos.');
        }
      });
  }

  guardar(): void {
    if (this.enviando) {
      return;
    }
    const valores = this.form.getRawValue();
    if (this.form.invalid || valores.tipoProducto === '') {
      this.form.markAllAsTouched();
      return;
    }
    const registroInvima = valores.registroInvima.trim() || null;
    const datos: ProductoRq = {
      codigo: valores.codigo.trim().toUpperCase(),
      nombre: valores.nombre.trim(),
      tipoProducto: valores.tipoProducto,
      descripcion: valores.descripcion.trim() || null,
      presentacion: valores.presentacion.trim() || null,
      unidadMedida: valores.unidadMedida.trim(),
      // Un insumo que ya exigía Invima lo sigue exigiendo mientras conserve su registro.
      requiereInvima: this.esMedicamento || (!!this.producto?.requiereInvima && registroInvima !== null),
      registroInvima,
      precioVenta: Number(valores.precioVenta),
      impuestoId: valores.impuestoId,
      stockMinimo: Number(valores.stockMinimo),
      fechaProximoPedido: valores.fechaProximoPedido || null
    };
    if (!this.producto && valores.incluirLote) {
      datos.loteInicial = datosLote(this.form.controls.loteInicial);
    }
    const solicitud = this.producto
      ? this.inventarioService.actualizarProducto(this.producto.id, datos)
      : this.inventarioService.crearProducto(datos);
    this.enviando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: ({ message, data }) => {
        this.modal.close(data);
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => this.respuestaError = marcarErroresServidor(this.form, error)
        ? '' : mensajeError(error, 'No fue posible guardar el producto.')
    });
  }

  /** El impuesto que ya tiene el producto se conserva aunque no esté en la lista. */
  private conImpuestoActual(impuestos: Impuesto[]): Impuesto[] {
    const { impuestoId = null, porcentajeIva = 0 } = this.producto ?? {};
    return impuestoId === null || impuestos.some(({ id }) => id === impuestoId)
      ? impuestos : [...impuestos, { id: impuestoId, nombre: `IVA ${porcentajeIva} %`, porcentaje: porcentajeIva, activo: false }];
  }
}
