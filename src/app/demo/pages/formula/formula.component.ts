import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { Cliente } from '../../../models/cliente';
import { FormulaMedica, FormulaRq } from '../../../models/formula-medica';
import { FichaInventario } from '../../../models/inventario';
import { Medico } from '../../../models/medico';
import { AuthService } from '../../../services/auth.service';
import { CitaDetalle, CitaService, MascotaCliente } from '../../../services/cita.service';
import { ClienteService } from '../../../services/cliente.service';
import { ClinicaService, descargarClinica, mensajeClinica } from '../../../services/clinica.service';
import { FormulaMedicaService } from '../../../services/formula-medica.service';
import { InventarioService } from '../../../services/inventario.service';
import { MedicoService } from '../../../services/medico.service';
import { mensajeError, soloFecha, TablaDatos } from '../../../utils/tabla-datos';
import { FormulasClinicasComponent } from './formulas-clinicas.component';

import { PaginadorComponent } from '../../../utils/paginador.component';
/** Valida que el texto contenga una cantidad mayor que cero (dosis y duración válidas). */
const CANTIDAD_POSITIVA = /(^|\D)(0*[1-9]\d*([.,]\d+)?|0*[.,]\d*[1-9]\d*)/;

/**
 * Gestión de fórmulas médicas (segundo parcial, punto 1).
 *
 * - DataTable con información resumida, orden inicial por fecha de creación descendente, filtros, orden por
 *   columnas y paginación.
 * - Formulario reactivo con combos dependientes cliente → mascota → cita; veterinario y medicamento.
 * - Ver (detalle completo), Editar e Inactivar/Activar (no hay eliminación física).
 * El perfil MEDICO ve además sus fórmulas generadas en la atención clínica.
 */
@Component({
  selector: 'app-formula',
  standalone: true,
  imports: [PaginadorComponent, CommonModule, FormsModule, ReactiveFormsModule, FormulasClinicasComponent],
  templateUrl: './formula.component.html',
  styleUrls: ['./formula.component.scss']
})
export class FormulaComponent implements OnInit {
  /** Ruta del recurso en la API del backend. */
  private readonly api = inject(FormulaMedicaService);
  /** Dependencia inyectada (ClinicaService). */
  private readonly clinica = inject(ClinicaService);
  /** Dependencia inyectada (CitaService). */
  private readonly citasApi = inject(CitaService);
  /** Dependencia inyectada (ClienteService). */
  private readonly clientesApi = inject(ClienteService);
  /** Dependencia inyectada (MedicoService). */
  private readonly medicosApi = inject(MedicoService);
  /** Dependencia inyectada (InventarioService). */
  private readonly inventarioApi = inject(InventarioService);
  /** Dependencia inyectada (FormBuilder). */
  private readonly fb = inject(FormBuilder);

  /** Indica si es médico. */
  readonly esMedico = inject(AuthService).tienePermiso('FORMULA_GESTIONAR');
  /** Solo fecha. */
  readonly soloFecha = soloFecha;
  /** Fecha de hoy (AAAA-MM-DD). */
  readonly hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' }).format(new Date());

  /** DataTable de fórmulas: inicialmente por fecha de creación descendente. */
  readonly tabla = new TablaDatos<FormulaMedica>(
    ['id', 'mascota', 'cliente', 'veterinario', 'medicamento', 'dosis', 'estado'], 'fechaCreacionRegistro', 'desc');

  /** Criterio de filtrado: filtro estado. */
  filtroEstado = '';
  /** Criterio de filtrado: filtro veterinario. */
  filtroVeterinario = '';
  /** Emisión desde. */
  emisionDesde = '';
  /** Emisión hasta. */
  emisionHasta = '';

  /** Lista de clientes. */
  clientes: Cliente[] = [];
  /** Lista de médicos. */
  medicos: Medico[] = [];
  /** Lista de medicamentos. */
  medicamentos: FichaInventario[] = [];
  /** Lista de mascotas. */
  mascotas: MascotaCliente[] = [];
  /** Lista de citas. */
  citas: CitaDetalle[] = [];

  /** null: cerrado; 0: nueva; >0: edición. */
  editandoId: number | null = null;
  /** Detalle. */
  detalle: FormulaMedica | null = null;
  /** Por cambiar estado. */
  porCambiarEstado: FormulaMedica | null = null;

  /** Indica si se está cargando. */
  cargando = false;
  /** Indica si se está guardando. */
  guardando = false;
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Mensaje mostrado al usuario (aviso). */
  aviso = '';
  /** Mensaje mostrado al usuario (error formulario). */
  errorFormulario = '';

  /** Formulario reactivo de la fórmula. */
  readonly formulario = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    mascotaId: this.fb.control<number | null>(null, Validators.required),
    citaId: this.fb.control<number | null>(null, Validators.required),
    medicoId: this.fb.control<number | null>(null),
    medicamentoId: this.fb.control<number | null>(null, Validators.required),
    dosis: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255), Validators.pattern(CANTIDAD_POSITIVA)]),
    frecuencia: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    duracionTratamiento: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100),
      Validators.pattern(CANTIDAD_POSITIVA)]),
    indicaciones: this.fb.control<string | null>(null, Validators.maxLength(2000)),
    fechaEmision: this.fb.nonNullable.control('', Validators.required)
  });

  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit(): void {
    this.tabla.filtroExtra = f =>
      (!this.filtroEstado || f.estado === this.filtroEstado)
      && (!this.filtroVeterinario || f.medicoId === Number(this.filtroVeterinario))
      && (!this.emisionDesde || (f.fechaEmision ?? '') >= this.emisionDesde)
      && (!this.emisionHasta || (f.fechaEmision ?? '') <= this.emisionHasta);
    if (this.esMedico) {
      this.formulario.controls.medicoId.disable();
    }
    forkJoin({ clientes: this.clientesApi.listarClientes(), medicos: this.medicosApi.listarMedicos(),
      inventario: this.inventarioApi.listar() }).subscribe({
      next: d => {
        this.clientes = d.clientes.filter(c => c.activo !== false);
        this.medicos = d.medicos;
        this.medicamentos = d.inventario.filter(f => f.producto.tipo === 'MEDICAMENTO' && f.producto.activo);
      },
      error: e => (this.error = mensajeError(e, 'No fue posible cargar clientes, veterinarios y medicamentos.'))
    });
    this.cargar();
  }

  /** Carga los datos de la pantalla desde el backend. */
  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.api.listarFormulasMedicas().pipe(finalize(() => (this.cargando = false))).subscribe({
      next: f => (this.tabla.datos = f),
      error: e => (this.error = mensajeError(e, 'No fue posible cargar las fórmulas médicas.'))
    });
  }

  /** Limpia filtros. */
  limpiarFiltros(): void {
    this.tabla.busqueda = '';
    this.filtroEstado = '';
    this.filtroVeterinario = '';
    this.emisionDesde = '';
    this.emisionHasta = '';
    this.tabla.reiniciar();
  }

  /**
   * Nombre médico.
   *
   * @param m m.
   * @returns texto resultante.
   */
  nombreMedico(m: Medico): string {
    return `${m.nombres ?? ''} ${m.apellidos ?? ''}`.trim();
  }

  // ------------------------------------------------------------------ Crear / editar

  /** Prepara el formulario para un nuevo registro. */
  nueva(): void {
    this.aviso = '';
    this.errorFormulario = '';
    this.editandoId = 0;
    this.mascotas = [];
    this.citas = [];
    this.formulario.reset({ clienteId: null, mascotaId: null, citaId: null, medicoId: null, medicamentoId: null,
      dosis: '', frecuencia: '', duracionTratamiento: '', indicaciones: null, fechaEmision: this.hoy });
    ['clienteId', 'mascotaId', 'citaId'].forEach(c => this.formulario.get(c)?.enable());
  }

  /**
   * Prepara el formulario para editar los datos de la pantalla.
   *
   * @param f f.
   */
  editar(f: FormulaMedica): void {
    this.aviso = '';
    this.errorFormulario = '';
    this.editandoId = f.id;
    this.mascotas = [{ mascotaId: f.mascotaId, nombreMascota: f.mascota, edad: 0, raza: '', especie: '', clienteId: f.clienteId }];
    this.citas = [];
    this.formulario.reset({ clienteId: f.clienteId, mascotaId: f.mascotaId, citaId: f.citaId, medicoId: f.medicoId,
      medicamentoId: f.medicamentoId, dosis: f.dosis, frecuencia: f.frecuencia ?? '',
      duracionTratamiento: f.duracionTratamiento ?? '', indicaciones: f.indicaciones, fechaEmision: f.fechaEmision ?? this.hoy });
    // Regla: una fórmula registrada no cambia de cita ni de mascota.
    ['clienteId', 'mascotaId', 'citaId'].forEach(c => this.formulario.get(c)?.disable());
  }

  /** Combo dependiente cliente → mascotas del cliente. */
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

  /** Combo dependiente mascota → citas (no canceladas) de la mascota. */
  alCambiarMascota(): void {
    const mascota = this.formulario.controls.mascotaId.value;
    this.formulario.patchValue({ citaId: null });
    this.citas = [];
    if (!mascota) return;
    this.citasApi.porMascota(mascota).subscribe({
      next: c => (this.citas = c.filter(x => x.estado !== 'cancelada')),
      error: e => (this.errorFormulario = mensajeError(e, 'No fue posible consultar las citas de la mascota.'))
    });
  }

  /** Al elegir la cita se propone su veterinario y se valida que la emisión no sea anterior a la consulta. */
  alCambiarCita(): void {
    const cita = this.citas.find(c => c.id === this.formulario.controls.citaId.value);
    if (cita) {
      this.formulario.patchValue({ medicoId: cita.medicoId });
      const fechaCita = cita.fechaHora.slice(0, 10);
      if (this.formulario.controls.fechaEmision.value < fechaCita) {
        this.formulario.patchValue({ fechaEmision: fechaCita <= this.hoy ? this.hoy : fechaCita });
      }
    }
  }

  /** Fecha mínima de emisión: la fecha de la consulta seleccionada. */
  get fechaMinimaEmision(): string {
    const cita = this.citas.find(c => c.id === this.formulario.controls.citaId.value);
    return cita ? cita.fechaHora.slice(0, 10) : '';
  }

  /** Guarda los datos de la pantalla validando el formulario y enviándolo al backend. */
  guardar(): void {
    this.errorFormulario = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorFormulario = 'Revisa los campos marcados: todos los obligatorios deben estar diligenciados y la dosis y '
        + 'la duración deben indicar una cantidad mayor que cero.';
      return;
    }
    const v = this.formulario.getRawValue();
    if (this.fechaMinimaEmision && v.fechaEmision < this.fechaMinimaEmision) {
      this.errorFormulario = 'La fecha de emisión no puede ser anterior a la fecha de la consulta.';
      return;
    }
    const datos: FormulaRq = {
      clienteId: v.clienteId, mascotaId: v.mascotaId, citaId: v.citaId, medicoId: this.esMedico ? null : v.medicoId,
      medicamentoId: v.medicamentoId, dosis: v.dosis.trim(), frecuencia: v.frecuencia.trim(),
      duracionTratamiento: v.duracionTratamiento.trim(), indicaciones: v.indicaciones?.trim() || null, fechaEmision: v.fechaEmision
    };
    const id = this.editandoId;
    this.guardando = true;
    (id ? this.api.actualizarFormula(id, datos) : this.api.crearFormula(datos))
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.aviso = id ? 'Fórmula actualizada.' : 'Fórmula registrada.';
          this.editandoId = null;
          this.cargar();
        },
        error: e => (this.errorFormulario = mensajeError(e, 'No fue posible guardar la fórmula.'))
      });
  }

  /**
   * Inválido.
   *
   * @param campo campo a ordenar.
   * @returns true si se cumple la condición.
   */
  invalido(campo: string): boolean {
    const c = this.formulario.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  // ------------------------------------------------------------------ Ver, estado y PDF

  /**
   * Muestra los datos de la pantalla.
   *
   * @param f f.
   */
  ver(f: FormulaMedica): void {
    this.api.consultarFormula(f.id).subscribe({
      next: d => (this.detalle = d),
      error: e => (this.error = mensajeError(e, 'No fue posible consultar la fórmula.'))
    });
  }

  /** Cambia estado. */
  cambiarEstado(): void {
    const f = this.porCambiarEstado;
    if (!f) return;
    this.guardando = true;
    this.api.cambiarEstado(f.id, !f.activo).pipe(finalize(() => (this.guardando = false))).subscribe({
      next: () => {
        this.aviso = f.activo ? 'Fórmula inactivada (se conserva en el historial).' : 'Fórmula activada.';
        this.porCambiarEstado = null;
        this.cargar();
      },
      error: e => {
        this.porCambiarEstado = null;
        this.error = mensajeError(e, 'No fue posible cambiar el estado de la fórmula.');
      }
    });
  }

  /**
   * Descarga PDF como archivo.
   *
   * @param id identificador del registro.
   */
  descargarPdf(id: number): void {
    this.clinica.formulaPdf(id, true).subscribe({
      next: archivo => descargarClinica(archivo, 'formula-' + id + '.pdf'),
      error: async e => (this.error = await mensajeClinica(e))
    });
  }
}
