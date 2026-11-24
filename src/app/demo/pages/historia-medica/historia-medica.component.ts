import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { AnotacionHistoria } from '../../../models/anotacion-historia';
import { Cliente } from '../../../models/cliente';
import { HistoriaDetalle, HistoriaMedica, HistoriaRq } from '../../../models/historia-medica';
import { Medico } from '../../../models/medico';
import { AnotacionHistoriaService } from '../../../services/anotacion-historia.service';
import { AuthService } from '../../../services/auth.service';
import { CitaDetalle, CitaService, MascotaCliente } from '../../../services/cita.service';
import { ClienteService } from '../../../services/cliente.service';
import { HistoriaMedicaService } from '../../../services/historia-medica.service';
import { MedicoService } from '../../../services/medico.service';
import { mensajeError, soloFecha, soloHora, TablaDatos } from '../../../utils/tabla-datos';

/**
 * Gestión de historias clínicas (segundo parcial, punto 3).
 *
 * - DataTable de historias (consultas) ordenado por fecha y hora descendente, con filtros, orden y paginación.
 * - Formulario reactivo con combos dependientes: cliente → mascotas del cliente → citas atendidas de la mascota.
 * - "Ver": modal con el detalle, el histórico de anotaciones (DataTable propio) y el registro de anotaciones.
 */
@Component({
  selector: 'app-historia-medica',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historia-medica.component.html',
  styleUrls: ['./historia-medica.component.scss']
})
export class HistoriaMedicaComponent implements OnInit {
  private readonly historiasApi = inject(HistoriaMedicaService);
  private readonly anotacionesApi = inject(AnotacionHistoriaService);
  private readonly citasApi = inject(CitaService);
  private readonly clientesApi = inject(ClienteService);
  private readonly medicosApi = inject(MedicoService);
  private readonly fb = inject(FormBuilder);

  /** El perfil MEDICO registra información solo a su nombre (el backend también lo valida). */
  readonly esMedico = (inject(AuthService).obtenerPerfil() ?? '').toUpperCase() === 'MEDICO';
  readonly soloFecha = soloFecha;
  readonly soloHora = soloHora;

  /** DataTable principal de historias. */
  readonly tabla = new TablaDatos<HistoriaMedica>(
    ['id', 'mascota', 'cliente', 'veterinario', 'motivo', 'diagnostico', 'estado', 'estadoCita'], 'fecha', 'desc');
  /** DataTable del histórico de anotaciones dentro del modal. */
  readonly tablaAnotaciones = new TablaDatos<AnotacionHistoria>(
    ['descripcion', 'observacion', 'diagnostico', 'veterinario'], 'fecha', 'desc', 5);

  // Filtros de fecha (se aplican en el backend) y de estado (en el cliente).
  fechaInicio = '';
  fechaFin = '';
  filtroEstado = '';

  clientes: Cliente[] = [];
  medicos: Medico[] = [];
  mascotas: MascotaCliente[] = [];
  citas: CitaDetalle[] = [];

  /** null: formulario cerrado; 0: nueva historia; >0: edición. */
  editandoId: number | null = null;
  detalle: HistoriaDetalle | null = null;
  anotacionSeleccionada: AnotacionHistoria | null = null;
  anotacionEditandoId: number | null = null;
  mostrarFormAnotacion = false;

  cargando = false;
  guardando = false;
  error = '';
  aviso = '';
  errorFormulario = '';
  errorAnotacion = '';

  /** Formulario reactivo de historia clínica. */
  readonly formulario = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    mascotaId: this.fb.control<number | null>(null, Validators.required),
    citaId: this.fb.control<number | null>(null, Validators.required),
    medicoId: this.fb.control<number | null>(null),
    fecha: this.fb.control<string>(''),
    motivo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(4000)]),
    diagnostico: this.fb.control<string | null>(null, Validators.maxLength(4000)),
    observaciones: this.fb.control<string | null>(null, Validators.maxLength(4000)),
    activo: this.fb.nonNullable.control(true)
  });

  /** Formulario reactivo de anotación. */
  readonly formAnotacion = this.fb.group({
    medicoId: this.fb.control<number | null>(null),
    descripcion: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(4000)]),
    observacion: this.fb.control<string | null>(null, Validators.maxLength(4000)),
    diagnostico: this.fb.control<string | null>(null, Validators.maxLength(4000))
  });

  ngOnInit(): void {
    this.tabla.filtroExtra = h => !this.filtroEstado || h.estado === this.filtroEstado;
    if (this.esMedico) {
      // El médico registra a su nombre: el backend asigna su veterinario.
      this.formulario.controls.medicoId.disable();
      this.formAnotacion.controls.medicoId.disable();
    }
    forkJoin({ clientes: this.clientesApi.listarClientes(), medicos: this.medicosApi.listarMedicos() }).subscribe({
      next: d => {
        this.clientes = d.clientes.filter(c => c.activo !== false);
        this.medicos = d.medicos;
      },
      error: e => (this.error = mensajeError(e, 'No fue posible cargar clientes y veterinarios.'))
    });
    this.cargar();
  }

  /** Consulta las historias en el rango de fechas seleccionado. */
  cargar(): void {
    if (this.fechaInicio && this.fechaFin && this.fechaFin < this.fechaInicio) {
      this.error = 'La fecha final no puede ser anterior a la fecha inicial.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.historiasApi.listarHistoriasMedicas(this.fechaInicio, this.fechaFin)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: historias => (this.tabla.datos = historias),
        error: e => (this.error = mensajeError(e, 'No fue posible cargar las historias clínicas.'))
      });
  }

  limpiarFiltros(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filtroEstado = '';
    this.tabla.busqueda = '';
    this.tabla.reiniciar();
    this.cargar();
  }

  nombreMedico(m: Medico): string {
    return `${m.nombres ?? ''} ${m.apellidos ?? ''}`.trim();
  }

  // ------------------------------------------------------------------ Crear / editar historia

  nueva(): void {
    this.aviso = '';
    this.errorFormulario = '';
    this.editandoId = 0;
    this.mascotas = [];
    this.citas = [];
    this.formulario.reset({ clienteId: null, mascotaId: null, citaId: null, medicoId: null, fecha: '', motivo: '',
      diagnostico: null, observaciones: null, activo: true });
    this.formulario.controls.clienteId.enable();
    this.formulario.controls.mascotaId.enable();
    this.formulario.controls.citaId.enable();
  }

  editar(h: HistoriaMedica): void {
    this.aviso = '';
    this.errorFormulario = '';
    this.editandoId = h.id;
    this.mascotas = [{ mascotaId: h.mascotaId, nombreMascota: h.mascota, edad: 0, raza: '', especie: '', clienteId: h.clienteId }];
    this.citas = [];
    this.formulario.reset({ clienteId: h.clienteId, mascotaId: h.mascotaId, citaId: h.citaId, medicoId: h.medicoId,
      fecha: (h.fecha ?? '').slice(0, 16), motivo: h.motivo ?? '', diagnostico: h.diagnostico,
      observaciones: h.observaciones, activo: h.activo });
    // La mascota y la cita de una historia registrada no se modifican (integridad del registro clínico).
    this.formulario.controls.clienteId.disable();
    this.formulario.controls.mascotaId.disable();
    this.formulario.controls.citaId.disable();
  }

  /** Combo dependiente: al elegir cliente se consultan solo sus mascotas. */
  alCambiarCliente(): void {
    const cliente = this.formulario.controls.clienteId.value;
    this.formulario.patchValue({ mascotaId: null, citaId: null });
    this.mascotas = [];
    this.citas = [];
    if (!cliente) return;
    this.citasApi.mascotasDeCliente(cliente).subscribe({
      next: m => (this.mascotas = m),
      error: e => (this.errorFormulario = mensajeError(e, 'No fue posible consultar las mascotas del cliente.'))
    });
  }

  /** Combo dependiente: al elegir mascota se consultan sus citas atendidas sin historia. */
  alCambiarMascota(): void {
    const mascota = this.formulario.controls.mascotaId.value;
    this.formulario.patchValue({ citaId: null });
    this.citas = [];
    if (!mascota) return;
    this.citasApi.porMascota(mascota).subscribe({
      next: c => (this.citas = c.filter(x => ['atendida', 'finalizada'].includes(x.estado) && !x.historiaId)),
      error: e => (this.errorFormulario = mensajeError(e, 'No fue posible consultar las citas de la mascota.'))
    });
  }

  /** Al elegir la cita se proponen su veterinario, fecha y motivo. */
  alCambiarCita(): void {
    const cita = this.citas.find(c => c.id === this.formulario.controls.citaId.value);
    if (cita) {
      this.formulario.patchValue({ medicoId: cita.medicoId, fecha: cita.fechaHora.slice(0, 16), motivo: cita.motivo ?? '' });
    }
  }

  guardar(): void {
    this.errorFormulario = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorFormulario = 'Completa los campos obligatorios: cliente, mascota, cita y motivo de consulta.';
      return;
    }
    const v = this.formulario.getRawValue();
    const datos: HistoriaRq = {
      clienteId: v.clienteId, mascotaId: v.mascotaId, citaId: v.citaId, medicoId: this.esMedico ? null : v.medicoId,
      fecha: v.fecha || null, motivo: v.motivo.trim(), diagnostico: v.diagnostico?.trim() || null,
      observaciones: v.observaciones?.trim() || null, activo: v.activo
    };
    const id = this.editandoId;
    this.guardando = true;
    (id ? this.historiasApi.actualizar(id, datos) : this.historiasApi.crear(datos))
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.aviso = id ? 'Historia clínica actualizada.' : 'Historia clínica registrada.';
          this.editandoId = null;
          this.cargar();
        },
        error: e => (this.errorFormulario = mensajeError(e, 'No fue posible guardar la historia clínica.'))
      });
  }

  invalido(campo: string): boolean {
    const c = this.formulario.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  // ------------------------------------------------------------------ Ver detalle y anotaciones

  ver(h: HistoriaMedica): void {
    this.anotacionSeleccionada = null;
    this.mostrarFormAnotacion = false;
    this.errorAnotacion = '';
    this.historiasApi.consultar(h.id).subscribe({
      next: d => {
        this.detalle = d;
        this.tablaAnotaciones.busqueda = '';
        this.tablaAnotaciones.reiniciar();
        this.tablaAnotaciones.datos = d.listaAnotaciones;
      },
      error: e => (this.error = mensajeError(e, 'No fue posible consultar la historia clínica.'))
    });
  }

  cerrarDetalle(): void {
    this.detalle = null;
    this.anotacionSeleccionada = null;
  }

  nuevaAnotacion(): void {
    this.errorAnotacion = '';
    this.anotacionEditandoId = null;
    this.mostrarFormAnotacion = true;
    this.formAnotacion.reset({ medicoId: this.detalle?.medicoId ?? null, descripcion: '', observacion: null, diagnostico: null });
  }

  editarAnotacion(a: AnotacionHistoria): void {
    this.errorAnotacion = '';
    this.anotacionEditandoId = a.id;
    this.mostrarFormAnotacion = true;
    this.formAnotacion.reset({ medicoId: a.medicoId, descripcion: a.descripcion, observacion: a.observacion,
      diagnostico: a.diagnostico });
  }

  guardarAnotacion(): void {
    const historia = this.detalle;
    if (!historia) return;
    if (this.formAnotacion.invalid) {
      this.formAnotacion.markAllAsTouched();
      this.errorAnotacion = 'La descripción es obligatoria.';
      return;
    }
    const v = this.formAnotacion.getRawValue();
    const datos = { historiaId: historia.id, medicoId: this.esMedico ? null : v.medicoId,
      descripcion: v.descripcion.trim(), observacion: v.observacion?.trim() || null, diagnostico: v.diagnostico?.trim() || null };
    const id = this.anotacionEditandoId;
    this.guardando = true;
    (id ? this.anotacionesApi.actualizar(id, datos) : this.anotacionesApi.crear(datos))
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.mostrarFormAnotacion = false;
          this.ver(historia);
          this.cargar();
        },
        error: e => (this.errorAnotacion = mensajeError(e, 'No fue posible guardar la anotación.'))
      });
  }
}
