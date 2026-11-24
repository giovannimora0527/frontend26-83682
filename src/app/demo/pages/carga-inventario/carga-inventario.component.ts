import { Component, DestroyRef, inject, TemplateRef, viewChild, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbModal, NgbModalRef, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CargaInventario } from 'src/app/models/carga-inventario';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { FilasCargaComponent } from './filas-carga/filas-carga.component';
import { CargaInventarioService } from './service/carga-inventario.service';

const TAMANO_MAXIMO = 5 * 1024 * 1024;

@Component({
  selector: 'app-carga-inventario',
  imports: [
    RouterLink, NgbNavModule, BadgeEstadoComponent, BotonDescargaComponent, FiltroFechasComponent, PaginacionComponent, FechaHoraPipe,
    FilasCargaComponent
  ],
  templateUrl: './carga-inventario.component.html'
})
export class CargaInventarioComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly cargaService = inject(CargaInventarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly plantillaDetalle = viewChild.required<TemplateRef<unknown>>('detalleCarga');
  private modal?: NgbModalRef;
  private consultaHistorial?: Subscription;
  private rango: RangoFechas = { desde: '', hasta: '' };

  readonly pasos = ['Archivo', 'Vista previa', 'Confirmar', 'Resultado'];
  readonly columnasArchivo = [
    ['codigo', '8 letras o números. Identifica el producto'],
    ['nombre', 'Obligatorio, hasta 100 caracteres'],
    ['tipo_producto', 'MEDICAMENTO o INSUMO'],
    ['descripcion', 'Opcional'],
    ['presentacion', 'Opcional, por ejemplo Caja x 10 tabletas'],
    ['unidad_medida', 'Por ejemplo tableta'],
    ['requiere_invima', 'SI o NO'],
    ['registro_invima', 'Obligatorio para medicamentos'],
    ['precio_compra', 'Número con máximo 2 decimales'],
    ['precio_venta', 'Número mayor que 0'],
    ['porcentaje_iva', 'De 0 a 100, un impuesto existente'],
    ['stock_minimo', 'Entero de 0 en adelante'],
    ['numero_lote', 'Obligatorio, único por producto'],
    ['cantidad', 'Entero mayor que 0'],
    ['fecha_compra', 'AAAA-MM-DD, no futura'],
    ['fecha_vencimiento', 'AAAA-MM-DD, obligatoria para medicamentos'],
    ['fecha_proximo_pedido', 'AAAA-MM-DD, opcional']
  ];
  readonly historial = new Tabla<CargaInventario>({ id: (carga) => -carga.cargaId }, 'id');

  pestana = 'asistente';
  paso = 0;
  archivo: File | null = null;
  arrastrando = false;
  errorArchivo = '';
  procesando = false;
  error = '';
  carga: CargaInventario | null = null;

  cargandoHistorial = false;
  errorHistorial = '';
  cargaDetalle: CargaInventario | null = null;
  cargandoDetalle = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
  }

  ngAfterViewInit(): void {
    // Enlace desde el kardex: ?carga=<id>.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const cargaId = Number(params.get('carga'));
      if (Number.isInteger(cargaId) && cargaId > 0) {
        setTimeout(() => this.verDetalle(cargaId));
      }
    });
  }

  seleccionar(event: Event): void {
    const entrada = event.target as HTMLInputElement;
    this.validarArchivo(entrada.files?.item(0) ?? null);
    // Permite volver a elegir el mismo archivo después de corregirlo.
    entrada.value = '';
  }

  soltar(event: DragEvent): void {
    event.preventDefault();
    this.arrastrando = false;
    if (!this.procesando) {
      this.validarArchivo(event.dataTransfer?.files.item(0) ?? null);
    }
  }

  arrastrar(event: DragEvent, dentro: boolean): void {
    event.preventDefault();
    this.arrastrando = dentro;
  }

  validarArchivo(archivo: File | null): void {
    this.archivo = null;
    this.error = '';
    if (!archivo) {
      this.errorArchivo = 'Selecciona un archivo.';
    } else if (!/\.(xlsx|csv)$/i.test(archivo.name)) {
      this.errorArchivo = 'Solo se admiten archivos .xlsx o .csv.';
    } else if (archivo.size === 0) {
      this.errorArchivo = 'El archivo está vacío.';
    } else if (archivo.size > TAMANO_MAXIMO) {
      this.errorArchivo = 'El archivo supera el máximo de 5 MB.';
    } else {
      this.errorArchivo = '';
      this.archivo = archivo;
    }
  }

  previsualizar(): void {
    if (!this.archivo || this.procesando) {
      return;
    }
    this.procesando = true;
    this.error = '';
    this.cargaService.previsualizar(this.archivo).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: (carga) => {
        this.carga = carga;
        this.paso = 1;
      },
      error: (error) => this.error = mensajeError(error, 'No fue posible leer el archivo.')
    });
  }

  async confirmar(): Promise<void> {
    if (!this.carga || this.procesando) {
      return;
    }
    const { cargaId, filasValidas, filasConError } = this.carga;
    this.procesando = true;
    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar la carga?',
      text: `Se importarán ${filasValidas} registros válidos; los ${filasConError} con error se omitirán. No se puede deshacer.`,
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Importar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      this.procesando = false;
      return;
    }
    this.error = '';
    this.cargaService.confirmar(cargaId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: ({ data }) => {
        this.carga = data ?? this.carga;
        this.paso = 3;
      },
      error: (error) => this.error = mensajeError(error, 'No fue posible confirmar la carga. Consulta su estado en el historial antes de reintentar.')
    });
  }

  async descartar(): Promise<void> {
    if (!this.carga || this.procesando) {
      return;
    }
    this.procesando = true;
    const { isConfirmed } = await Swal.fire({
      title: '¿Descartar la carga?', text: 'No se importará ninguna fila de este archivo.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Descartar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) {
      this.procesando = false;
      return;
    }
    this.error = '';
    this.cargaService.descartar(this.carga.cargaId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: () => this.reiniciar(),
      error: (error) => this.error = mensajeError(error, 'No fue posible descartar la carga.')
    });
  }

  reiniciar(): void {
    this.paso = 0;
    this.archivo = null;
    this.carga = null;
    this.error = '';
    this.errorArchivo = '';
  }

  get filasNoImportadas(): number {
    return this.carga ? this.carga.filasValidas - this.carga.filasImportadas : 0;
  }

  cambiarPestana(pestana: string): void {
    if (pestana === 'historial') {
      this.listarHistorial();
    }
  }

  filtrarHistorial(rango: RangoFechas | null): void {
    if (rango) {
      this.rango = rango;
      this.listarHistorial();
    }
  }

  listarHistorial(): void {
    this.consultaHistorial?.unsubscribe();
    this.cargandoHistorial = true;
    this.errorHistorial = '';
    this.consultaHistorial = this.cargaService.historial(this.rango).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cargas) => {
        this.historial.items = cargas;
        this.cargandoHistorial = false;
      },
      error: (error) => {
        this.errorHistorial = mensajeError(error, 'No fue posible cargar el historial.');
        this.cargandoHistorial = false;
      }
    });
  }

  verDetalle(cargaId: number): void {
    if (this.cargandoDetalle) {
      return;
    }
    this.cargandoDetalle = true;
    this.cargaService.obtener(cargaId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoDetalle = false)
    ).subscribe({
      next: (carga) => {
        this.cargaDetalle = carga;
        this.modal = this.modalService.open(this.plantillaDetalle(), { size: 'xl', scrollable: true, ariaLabelledBy: 'cargaTitulo' });
      },
      error: (error) => void Swal.fire('No se pudo abrir la carga', mensajeError(error, 'Intenta nuevamente.'), 'error')
    });
  }

  /** Retoma en el asistente una carga que quedó sin confirmar. */
  retomar(carga: CargaInventario): void {
    this.modal?.close();
    this.carga = carga;
    this.archivo = null;
    this.error = '';
    this.paso = 1;
    this.pestana = 'asistente';
  }
}
