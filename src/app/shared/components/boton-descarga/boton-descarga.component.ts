import { Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { FormatoArchivo } from 'src/app/models/estados';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams, descargarArchivo, mensajeError, mostrarArchivo, ValorParametro } from '../../utils/http.util';

/** Botones de descarga. Los PDF también se pueden ver en una pestaña nueva. */
@Component({
  selector: 'app-boton-descarga',
  template: `
    @for (formato of formatos(); track formato) {
      @if (formato === 'pdf') {
        <button type="button" class="btn btn-sm btn-outline-secondary mb-0" [disabled]="bloqueado" (click)="descargar(formato, true)">
          <i class="fa fa-eye" aria-hidden="true"></i>
          Ver {{ etiqueta() || 'PDF' }}
        </button>
      }
      <button type="button" class="btn btn-sm btn-outline-primary mb-0" [disabled]="bloqueado" (click)="descargar(formato)">
        @if (enCurso === formato) {
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        } @else {
          <i class="fa fa-download" aria-hidden="true"></i>
        }
        {{ etiqueta() || nombres[formato] }}
      </button>
    }
  `
})
export class BotonDescargaComponent {
  private readonly backendService = inject(BackendService);
  private readonly destroyRef = inject(DestroyRef);

  readonly endpoint = input.required<string>();
  readonly params = input<Record<string, ValorParametro>>({});
  readonly formatos = input<FormatoArchivo[]>(['pdf']);
  /** Agrega ?formato=... cuando el mismo endpoint entrega varios formatos. */
  readonly enviarFormato = input(false);
  readonly deshabilitado = input(false);
  readonly etiqueta = input('');

  readonly nombres: Record<FormatoArchivo, string> = { pdf: 'PDF', xlsx: 'Excel', csv: 'CSV' };
  enCurso: FormatoArchivo | null = null;

  get bloqueado(): boolean {
    return this.deshabilitado() || this.enCurso !== null;
  }

  descargar(formato: FormatoArchivo, ver = false): void {
    if (this.bloqueado) {
      return;
    }
    // La pestaña se abre en el clic: si se abriera al llegar la respuesta, el navegador la bloquearía.
    const pestana = ver ? window.open('', '_blank') : null;
    if (pestana) {
      pestana.opener = null;
    }
    this.enCurso = formato;
    const params = construirParams({ ...this.params(), ...(this.enviarFormato() ? { formato } : {}) });
    this.backendService
      .getBlob(this.endpoint(), params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.enCurso = null))
      )
      .subscribe({
        next: (response) => (pestana ? mostrarArchivo(response, pestana) : descargarArchivo(response, formato)),
        error: (error) => {
          pestana?.close();
          // 401, 403, 0 y 5xx ya los avisa el interceptor.
          if ([400, 404, 409].includes(error?.status)) {
            void Swal.fire('No se pudo generar el archivo', mensajeError(error, 'Intenta nuevamente.'), 'error');
          }
        }
      });
  }
}
