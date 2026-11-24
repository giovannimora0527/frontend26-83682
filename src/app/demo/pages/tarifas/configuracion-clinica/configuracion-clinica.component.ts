import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { ConfiguracionClinica } from 'src/app/models/tarifa';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { TarifaService } from '../service/tarifa.service';

const PREFIJO = [Validators.required, Validators.pattern(/^[A-Za-z0-9]{1,10}$/)];
const OBLIGATORIO = [Validators.required, Validators.pattern(/\S/)];

@Component({
  selector: 'app-configuracion-clinica',
  imports: [ReactiveFormsModule],
  templateUrl: './configuracion-clinica.component.html'
})
export class ConfiguracionClinicaComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly tarifaService = inject(TarifaService);
  readonly esInvalido = esInvalido;

  readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', [...OBLIGATORIO, Validators.maxLength(150)]],
    nit: ['', [...OBLIGATORIO, Validators.maxLength(30)]],
    direccion: ['', Validators.maxLength(200)],
    telefono: ['', Validators.maxLength(30)],
    correo: ['', [Validators.email, Validators.maxLength(255)]],
    prefijoFactura: ['', PREFIJO],
    prefijoFormula: ['', PREFIJO],
    prefijoDespacho: ['', PREFIJO],
    topeDescuentoSecretaria: this.formBuilder.control<number | null>(null, [
      Validators.required, Validators.pattern(/^\d{1,3}(\.\d{1,2})?$/), Validators.min(0), Validators.max(100)
    ])
  });

  cargando = false;
  errorCarga = '';
  enviando = false;
  respuestaError = '';

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.tarifaService.obtenerConfiguracion().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (datos) => this.mostrar(datos),
      error: (error) => this.errorCarga = mensajeError(error, 'No fue posible cargar los datos de la clínica.')
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
    const v = this.form.getRawValue();
    this.enviando = true;
    this.respuestaError = '';
    this.tarifaService.guardarConfiguracion({
      nombre: v.nombre.trim(), nit: v.nit.trim(), direccion: v.direccion.trim() || null, telefono: v.telefono.trim() || null,
      correo: v.correo.trim() || null, prefijoFactura: v.prefijoFactura, prefijoFormula: v.prefijoFormula, prefijoDespacho: v.prefijoDespacho,
      topeDescuentoSecretaria: Number(v.topeDescuentoSecretaria)
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: ({ message, data }) => {
        if (data) {
          this.mostrar(data);
        }
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => this.respuestaError = marcarErroresServidor(this.form, error)
        ? '' : mensajeError(error, 'No fue posible guardar los datos de la clínica.')
    });
  }

  private mostrar(datos: ConfiguracionClinica): void {
    this.form.reset({ ...datos, direccion: datos.direccion ?? '', telefono: datos.telefono ?? '', correo: datos.correo ?? '' });
  }
}
