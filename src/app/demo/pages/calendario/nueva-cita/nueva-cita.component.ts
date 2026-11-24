import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { CitaService } from '../../cita/service/cita.service';
import { ClienteService } from '../../cliente/service/cliente.service';
import { AuthService } from '../../login/service/auth.service';
import { ServicioService } from '../../tarifas/service/servicio.service';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Servicio } from 'src/app/models/servicio';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { fechaHoraIso } from 'src/app/shared/utils/fecha.util';
import { esInvalido, marcarErroresServidor } from 'src/app/shared/utils/formulario.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { filtrar } from 'src/app/shared/utils/tabla.util';

/** Nueva cita del médico autenticado en la franja elegida. */
@Component({
  selector: 'app-nueva-cita',
  imports: [FormsModule, ReactiveFormsModule, FechaHoraPipe],
  templateUrl: './nueva-cita.component.html'
})
export class NuevaCitaComponent implements OnInit {
  @Input({ required: true }) inicio!: Date;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly citaService = inject(CitaService);
  private readonly clienteService = inject(ClienteService);
  private readonly servicioService = inject(ServicioService);
  private readonly medicoId = inject(AuthService).obtenerUsuario()?.medicoId ?? null;
  readonly modal = inject(NgbActiveModal);
  readonly esInvalido = esInvalido;

  readonly form = this.formBuilder.nonNullable.group({
    clienteId: this.formBuilder.control<number | null>(null, Validators.required),
    mascotaId: this.formBuilder.control<number | null>(null, Validators.required),
    servicioId: this.formBuilder.control<number | null>(null, Validators.required),
    fechaInicio: ['', [
      Validators.required,
      (control: AbstractControl<string>) => (control.value && new Date(control.value).getTime() <= Date.now() ? { pasada: true } : null)
    ]],
    motivo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255), Validators.pattern(/\S/)]]
  });

  clientes: Cliente[] = [];
  mascotas: Mascota[] = [];
  servicios: Servicio[] = [];
  terminoCliente = '';
  cargandoMascotas = false;
  errorCatalogos = '';
  enviando = false;
  respuestaError = this.medicoId === null ? 'Tu usuario no está vinculado a un médico. Solicítalo en administración.' : '';

  ngOnInit(): void {
    this.form.controls.fechaInicio.setValue(fechaHoraIso(this.inicio).slice(0, 16));
    this.form.controls.clienteId.valueChanges.pipe(
      switchMap((clienteId) => {
        this.form.controls.mascotaId.reset();
        this.mascotas = [];
        if (clienteId === null) {
          return EMPTY;
        }
        this.cargandoMascotas = true;
        return this.clienteService.listarMascotas(clienteId).pipe(
          finalize(() => this.cargandoMascotas = false),
          // Un error no debe romper la suscripción: el usuario puede elegir otro cliente.
          catchError((causa) => {
            this.errorCatalogos = mensajeError(causa, 'No fue posible cargar las mascotas.');
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((mascotas) => this.mascotas = mascotas.filter(({ activo }) => activo !== false));
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.errorCatalogos = '';
    const error = (causa: unknown) => this.errorCatalogos = mensajeError(causa, 'No fue posible cargar los datos del formulario.');
    this.clienteService.listarClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (clientes) => this.clientes = clientes.filter(({ activo }) => activo !== false), error
    });
    this.servicioService.listar(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (servicios) => this.servicios = servicios, error
    });
  }

  /** Clientes que coinciden con la búsqueda; el elegido permanece en la lista. */
  get clientesFiltrados(): Cliente[] {
    const elegido = this.form.controls.clienteId.value;
    const coincidencias = filtrar(this.clientes, this.terminoCliente, (c) => [`${c.nombres} ${c.apellidos}`, c.numeroDocumento, c.telefono]);
    const actual = this.clientes.find(({ id }) => id === elegido);
    return actual && !coincidencias.includes(actual) ? [actual, ...coincidencias] : coincidencias;
  }

  get fin(): Date | null {
    const servicio = this.servicios.find(({ id }) => id === this.form.controls.servicioId.value);
    const inicio = new Date(this.form.controls.fechaInicio.value);
    return servicio && !Number.isNaN(inicio.getTime()) ? new Date(inicio.getTime() + servicio.duracionMinutos * 60_000) : null;
  }

  guardar(): void {
    const { clienteId, mascotaId, servicioId, fechaInicio, motivo } = this.form.getRawValue();
    if (this.enviando || this.medicoId === null) {
      return;
    }
    if (this.form.invalid || clienteId === null || mascotaId === null || servicioId === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.respuestaError = '';
    this.citaService.guardarCita({
      mascotaId, medicoId: this.medicoId, clienteId, servicioId, fechaInicio: `${fechaInicio}:00`, motivo: motivo.trim()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: ({ message }) => {
        this.modal.close(true);
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error: unknown) => this.respuestaError = marcarErroresServidor(this.form, error)
        ? '' : mensajeError(error, 'No fue posible crear la cita.')
    });
  }
}
