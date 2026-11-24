import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Horario } from 'src/app/models/horario';
import { Medico } from 'src/app/models/medico';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { MedicoService } from '../service/medico.service';

function horasEnOrden(bloque: AbstractControl): ValidationErrors | null {
  const { horaInicio, horaFin } = bloque.value as Horario;
  return horaInicio && horaFin && horaFin <= horaInicio ? { horasEnOrden: true } : null;
}

/** Los bloques activos de un mismo día no se pueden cruzar; sí pueden ser consecutivos. */
function sinCruces(bloques: AbstractControl): ValidationErrors | null {
  const ordenados = (bloques.value as Horario[])
    .filter(({ activo, horaInicio, horaFin }) => activo && horaInicio && horaFin)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  return ordenados.some((bloque, i) => i > 0 && bloque.horaInicio < ordenados[i - 1].horaFin) ? { cruce: true } : null;
}

@Component({
  selector: 'app-horarios-medico',
  imports: [ReactiveFormsModule],
  templateUrl: './horarios-medico.component.html'
})
export class HorariosMedicoComponent implements OnInit {
  @Input({ required: true }) medico!: Medico;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly medicoService = inject(MedicoService);
  readonly modal = inject(NgbActiveModal);

  readonly dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  readonly form = this.formBuilder.nonNullable.group({
    dias: this.formBuilder.array(this.dias.map(() => this.formBuilder.array<FormGroup>([], sinCruces)))
  });

  cargando = false;
  errorCarga = '';
  enviando = false;
  respuestaError = '';

  ngOnInit(): void {
    this.cargar();
  }

  bloques(dia: number): FormArray<FormGroup> {
    return this.form.controls.dias.at(dia);
  }

  agregar(dia: number, horario?: Horario): void {
    this.bloques(dia).push(this.formBuilder.nonNullable.group(
      {
        // El backend puede enviar la hora con segundos (HH:mm:ss).
        horaInicio: [horario?.horaInicio?.slice(0, 5) ?? '', Validators.required],
        horaFin: [horario?.horaFin?.slice(0, 5) ?? '', Validators.required],
        activo: [horario?.activo ?? true]
      },
      { validators: horasEnOrden }
    ));
  }

  quitar(dia: number, indice: number): void {
    this.bloques(dia).removeAt(indice);
  }

  cargar(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.medicoService.listarHorarios(this.medico.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (horarios) => {
        this.dias.forEach((_, dia) => this.bloques(dia).clear());
        horarios
          .filter(({ diaSemana }) => diaSemana >= 1 && diaSemana <= 7)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
          .forEach((horario) => this.agregar(horario.diaSemana - 1, horario));
      },
      error: (error) => this.errorCarga = mensajeError(error, 'No fue posible cargar los horarios.')
    });
  }

  guardar(): void {
    // Sin la lista actual no se guarda: el PUT reemplaza todos los horarios.
    if (this.enviando || this.cargando || this.errorCarga) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.respuestaError = 'Corrige los horarios marcados.';
      return;
    }
    const horarios: Horario[] = this.form.getRawValue().dias.flatMap((bloques, dia) =>
      (bloques as Omit<Horario, 'diaSemana'>[]).map(({ horaInicio, horaFin, activo }) => ({ diaSemana: dia + 1, horaInicio, horaFin, activo })));
    this.enviando = true;
    this.respuestaError = '';
    this.medicoService.guardarHorarios(this.medico.id, horarios).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: () => {
        this.modal.close();
        void Swal.fire('Operación exitosa', 'Los horarios fueron guardados correctamente.', 'success');
      },
      error: (error) => this.respuestaError = mensajeError(error, 'No fue posible guardar los horarios.')
    });
  }
}
