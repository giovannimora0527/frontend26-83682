import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { MascotaService, MascotaDetalle, MascotaRq } from './service/mascota.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { RazaService, RazaRegistro } from 'src/app/services/raza.service';
import { AuthService } from 'src/app/services/auth.service';
import { Cliente } from 'src/app/models/cliente';
import { TablaDatos, mensajeError } from 'src/app/utils/tabla-datos';
import { HistorialMascotaComponent } from '../cita/historial-mascota.component';

import { PaginadorComponent } from '../../../utils/paginador.component';
/** Solo letras (con tildes), espacios, apóstrofos y guiones. */
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]{0,99}$/;

/** Fila de la tabla con los campos planos para buscar, filtrar y ordenar. */
type FilaMascota = MascotaDetalle & {
  propietario: string; documento: string; nombreRaza: string; especie: string; estadoTexto: string; estaActiva: boolean;
};

/**
 * Pantalla de gestión de mascotas (pacientes).
 *
 * <p>Administración y recepción registran, editan y activan/inactivan; el médico consulta la ficha
 * y el historial de citas. Reglas: propietario activo, raza coherente con la especie elegida,
 * edad entre 0 y 40 años, un propietario no repite el nombre de una mascota activa y no se inactiva
 * una mascota con citas futuras reservadas.</p>
 */
@Component({
  selector: 'app-mascota',
  standalone: true,
  imports: [PaginadorComponent, CommonModule, FormsModule, ReactiveFormsModule, HistorialMascotaComponent],
  templateUrl: './mascota.component.html',
  styleUrl: './mascota.component.scss'
})
export class MascotaComponent implements OnInit {
  /** Servicio de mascotas. */
  private readonly api = inject(MascotaService);
  /** Servicio de clientes (propietarios). */
  private readonly clientesApi = inject(ClienteService);
  /** Servicio de razas. */
  private readonly razasApi = inject(RazaService);
  /** Constructor de formularios reactivos. */
  private readonly fb = inject(FormBuilder);

  /** Permiso MASCOTA_GESTIONAR (administración y secretaria); los demás perfiles solo consultan. */
  readonly puedeModificar = inject(AuthService).tienePermiso('MASCOTA_GESTIONAR');

  /** Tabla con búsqueda, orden y paginación. */
  readonly tabla = new TablaDatos<FilaMascota>(
    ['nombreMascota', 'propietario', 'documento', 'nombreRaza', 'especie', 'mascotaId'], 'nombreMascota', 'asc');
  /** Filtro por especie ('' = todas). */
  filtroEspecie = '';
  /** Filtro por estado ('' = todos). */
  filtroEstado = 'Activa';

  /** Propietarios. */
  clientes: Cliente[] = [];
  /** Razas registradas. */
  razas: RazaRegistro[] = [];
  /** Especie elegida en el formulario (filtra el combo de razas). */
  especieFormulario = '';

  /** Formulario de registro y edición. */
  readonly formulario = this.fb.group({
    nombreMascota: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(SOLO_LETRAS)]],
    edad: [null as number | null, [Validators.required, Validators.min(0), Validators.max(40), Validators.pattern(/^\d+$/)]],
    clienteId: [null as number | null, Validators.required],
    razaId: [null as number | null, Validators.required],
    activo: [true]
  });

  /** Mascota en edición: null = formulario cerrado, 0 = nueva. */
  editandoId: number | null = null;
  /** Mascota que se está editando. */
  editando: FilaMascota | null = null;
  /** Mascota cuya ficha se muestra. */
  detalle: FilaMascota | null = null;
  /** Indica si se están cargando los datos. */
  cargando = false;
  /** Indica si se está guardando. */
  guardando = false;
  /** Mensaje de error general. */
  error = '';
  /** Mensaje de error del formulario. */
  errorFormulario = '';
  /** Mensaje de confirmación. */
  aviso = '';

  /** Configura los filtros y carga los datos. */
  ngOnInit(): void {
    this.tabla.filtroExtra = m =>
      (!this.filtroEspecie || m.especie === this.filtroEspecie) && (!this.filtroEstado || m.estadoTexto === this.filtroEstado);
    this.cargar();
  }

  /** Consulta mascotas, propietarios y razas. */
  cargar(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({ mascotas: this.api.listarDetalle(), clientes: this.clientesApi.listarClientes(), razas: this.razasApi.listarRazas() })
      .subscribe({
        next: ({ mascotas, clientes, razas }) => {
          this.tabla.datos = mascotas.map(m => ({
            ...m,
            estaActiva: !!m.activo,
            estadoTexto: m.activo ? 'Activa' : 'Inactiva',
            propietario: `${m.cliente?.nombres ?? ''} ${m.cliente?.apellidos ?? ''}`.trim(),
            documento: `${m.cliente?.tipoDocumento ?? ''} ${m.cliente?.numeroDocumento ?? ''}`.trim(),
            nombreRaza: m.raza?.nombre ?? '',
            especie: m.raza?.especie ?? ''
          }));
          this.clientes = clientes;
          this.razas = razas;
          this.cargando = false;
        },
        error: e => {
          this.error = mensajeError(e, 'No fue posible consultar las mascotas.');
          this.cargando = false;
        }
      });
  }

  /** Especies registradas en el catálogo de razas. */
  get especies(): string[] {
    return [...new Set(this.razas.map(r => r.especie))].sort((a, b) => a.localeCompare(b, 'es'));
  }

  /** Razas de la especie elegida en el formulario. */
  get razasFormulario(): RazaRegistro[] {
    return this.razas.filter(r => !this.especieFormulario || r.especie === this.especieFormulario);
  }

  /** Propietarios activos (más el actual si se edita una mascota de un propietario archivado). */
  get clientesFormulario(): Cliente[] {
    return this.clientes.filter(c => !!c.activo || c.clienteId === this.editando?.clienteId);
  }

  /** Número de mascotas activas. */
  get activas(): number {
    return this.tabla.datos.filter(m => m.estaActiva).length;
  }

  /** Al cambiar la especie se limpia la raza si ya no corresponde. */
  alCambiarEspecie(): void {
    const raza = this.razas.find(r => r.razaId === this.formulario.controls.razaId.value);
    if (raza && raza.especie !== this.especieFormulario) {
      this.formulario.controls.razaId.setValue(null);
    }
  }

  /** Abre el formulario para registrar una mascota. */
  nueva(): void {
    this.editandoId = 0;
    this.editando = null;
    this.detalle = null;
    this.errorFormulario = '';
    this.especieFormulario = this.filtroEspecie;
    this.formulario.reset({ nombreMascota: '', edad: null, clienteId: null, razaId: null, activo: true });
  }

  /**
   * Abre el formulario con los datos de la mascota.
   *
   * @param m mascota a editar.
   */
  editar(m: FilaMascota): void {
    this.editandoId = m.mascotaId;
    this.editando = m;
    this.detalle = null;
    this.errorFormulario = '';
    this.especieFormulario = m.especie;
    this.formulario.reset({ nombreMascota: m.nombreMascota, edad: m.edad, clienteId: m.clienteId, razaId: m.razaId, activo: m.estaActiva });
  }

  /** Cierra el formulario sin guardar. */
  cancelar(): void {
    this.editandoId = null;
    this.editando = null;
  }

  /**
   * Indica si un campo es inválido y ya fue tocado.
   *
   * @param campo nombre del control.
   * @returns true si debe mostrarse el error.
   */
  invalido(campo: keyof typeof this.formulario.controls): boolean {
    const c = this.formulario.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Valida y guarda la mascota (crea o actualiza). */
  guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      this.errorFormulario = 'Revisa los campos marcados.';
      return;
    }
    const v = this.formulario.getRawValue();
    const nombre = (v.nombreMascota ?? '').trim().replace(/\s+/g, ' ');
    const repetida = this.tabla.datos.some(m => m.mascotaId !== this.editandoId && m.estaActiva &&
      m.clienteId === v.clienteId && m.nombreMascota.toLowerCase() === nombre.toLowerCase());
    if (repetida) {
      this.errorFormulario = `El propietario ya tiene una mascota activa llamada ${nombre}.`;
      return;
    }
    if (this.editando && this.editando.estaActiva && !v.activo && this.editando.citasFuturas > 0) {
      this.errorFormulario = `No se puede inactivar: tiene ${this.editando.citasFuturas} cita(s) futura(s) reservada(s).`;
      return;
    }
    const datos: MascotaRq = {
      nombreMascota: nombre, edad: Number(v.edad), clienteId: Number(v.clienteId), razaId: Number(v.razaId), activo: !!v.activo
    };
    this.guardando = true;
    this.errorFormulario = '';
    const peticion = this.editandoId ? this.api.actualizar(this.editandoId, datos) : this.api.crearMascota(datos);
    peticion.subscribe({
      next: m => {
        this.guardando = false;
        this.aviso = `Mascota ${m.nombreMascota} ${this.editandoId ? 'actualizada' : 'registrada'}.`;
        this.editandoId = null;
        this.editando = null;
        this.cargar();
      },
      error: e => {
        this.guardando = false;
        this.errorFormulario = mensajeError(e, 'No fue posible guardar la mascota.');
      }
    });
  }

  /**
   * Activa o inactiva una mascota, previa confirmación.
   *
   * @param m mascota seleccionada.
   */
  cambiarEstado(m: FilaMascota): void {
    const activar = !m.estaActiva;
    if (!activar && m.citasFuturas > 0) {
      this.error = `No se puede inactivar a ${m.nombreMascota}: tiene ${m.citasFuturas} cita(s) futura(s) reservada(s). ` +
        'Cancélelas primero en Gestión de Citas.';
      return;
    }
    if (activar && m.cliente && !m.cliente.activo) {
      this.error = `No se puede activar a ${m.nombreMascota}: su propietario está archivado.`;
      return;
    }
    Swal.fire({
      title: activar ? '¿Activar mascota?' : '¿Inactivar mascota?',
      text: activar ? `${m.nombreMascota} podrá agendar citas nuevamente.`
        : `${m.nombreMascota} no podrá agendar nuevas citas. Su historia clínica se conserva.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: activar ? 'Activar' : 'Inactivar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.error = '';
      this.api.cambiarEstado(m.mascotaId, activar).subscribe({
        next: () => {
          this.aviso = `${m.nombreMascota} ${activar ? 'activada' : 'inactivada'}.`;
          this.cargar();
        },
        error: e => (this.error = mensajeError(e, 'No fue posible cambiar el estado de la mascota.'))
      });
    });
  }

  /** Limpia la búsqueda y los filtros. */
  limpiarFiltros(): void {
    this.tabla.busqueda = '';
    this.filtroEspecie = '';
    this.filtroEstado = '';
    this.tabla.reiniciar();
  }
}
