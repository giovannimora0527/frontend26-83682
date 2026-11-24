import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { MedicoService, MedicoRegistro, MedicoRq } from 'src/app/services/medico.service';
import { EspecializacionService, Especializacion } from 'src/app/services/especializacion.service';
import { UsuarioService, UsuarioSistema } from '../usuario/service/usuario.service';
import { AuthService } from 'src/app/services/auth.service';
import { TablaDatos, mensajeError } from 'src/app/utils/tabla-datos';

/** Solo letras (con tildes), espacios, apóstrofos y guiones; mínimo 2 caracteres. */
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]{1,99}$/;

/** Especialidad con su estado (el backend envía el campo activo). */
type EspecialidadEstado = Especializacion & { activo?: boolean | number };

/** Fila de la tabla: médico con nombre completo para buscar y ordenar. */
type FilaMedico = MedicoRegistro & { nombreCompleto: string; estadoTexto: string };

/**
 * Pantalla de gestión de médicos veterinarios: listado con filtros, registro y edición con validaciones,
 * asociación con un usuario de perfil Médico y activación/inactivación controlada (no se inactiva
 * un médico con citas futuras reservadas).
 */
@Component({
  selector: 'app-medico',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './medico.component.html',
  styleUrl: './medico.component.scss'
})
export class MedicoComponent implements OnInit {
  /** Servicio de médicos. */
  private readonly api = inject(MedicoService);
  /** Servicio de especialidades. */
  private readonly especialidadesApi = inject(EspecializacionService);
  /** Servicio de usuarios (para asociar el usuario de perfil Médico). */
  private readonly usuariosApi = inject(UsuarioService);
  /** Constructor de formularios reactivos. */
  private readonly fb = inject(FormBuilder);

  /** Indica si el usuario es administrador (único que puede crear, editar y cambiar el estado). */
  readonly esAdmin = (inject(AuthService).obtenerPerfil() ?? '').toUpperCase().startsWith('ADMIN');
  /** Tipos de documento permitidos. */
  readonly tipos = [
    { id: 'CC', nombre: 'Cédula de ciudadanía' }, { id: 'CE', nombre: 'Cédula de extranjería' },
    { id: 'PA', nombre: 'Pasaporte' }, { id: 'PPT', nombre: 'Permiso por protección temporal' }
  ];

  /** Tabla con búsqueda, orden y paginación. */
  readonly tabla = new TablaDatos<FilaMedico>(
    ['nombreCompleto', 'numeroDocumento', 'registroProfesional', 'especializacion', 'usuario', 'telefono'], 'nombreCompleto', 'asc');
  /** Filtro por especialidad (null = todas). */
  filtroEspecialidad: number | null = null;
  /** Filtro por estado ('' = todos). */
  filtroEstado = '';

  /** Especialidades disponibles. */
  especialidades: EspecialidadEstado[] = [];
  /** Usuarios con perfil Médico. */
  usuariosMedico: UsuarioSistema[] = [];

  /** Formulario de registro y edición. */
  readonly formulario = this.fb.group({
    tipoDocumento: ['CC', Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,15}$/)]],
    nombres: ['', [Validators.required, Validators.pattern(SOLO_LETRAS)]],
    apellidos: ['', [Validators.required, Validators.pattern(SOLO_LETRAS)]],
    telefono: ['', Validators.pattern(/^\d{7,10}$/)],
    registroProfesional: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9-]{2,49}$/)]],
    especializacionId: [null as number | null, Validators.required],
    usuarioId: [null as number | null],
    activo: [true]
  });

  /** Médico en edición: null = formulario cerrado, 0 = nuevo. */
  editandoId: number | null = null;
  /** Médico que se está editando. */
  editando: MedicoRegistro | null = null;
  /** Médico cuyo detalle se muestra. */
  detalle: FilaMedico | null = null;
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
      (this.filtroEspecialidad === null || m.especializacionId === this.filtroEspecialidad) &&
      (!this.filtroEstado || m.estadoTexto === this.filtroEstado);
    this.cargar();
  }

  /** Consulta médicos, especialidades y (si es administrador) usuarios de perfil Médico. */
  cargar(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({
      medicos: this.api.listarRegistros(),
      especialidades: this.especialidadesApi.listarEspecializaciones()
    }).subscribe({
      next: ({ medicos, especialidades }) => {
        this.tabla.datos = medicos.map(m => ({
          ...m,
          activo: !!m.activo,
          nombreCompleto: `${m.nombres} ${m.apellidos}`,
          estadoTexto: m.activo ? 'Activo' : 'Inactivo'
        }));
        this.especialidades = especialidades as EspecialidadEstado[];
        this.cargando = false;
      },
      error: e => {
        this.error = mensajeError(e, 'No fue posible consultar los médicos.');
        this.cargando = false;
      }
    });
    if (this.esAdmin) {
      this.usuariosApi.listar().subscribe({
        next: u => (this.usuariosMedico = u.filter(x => (x.perfil ?? '').toUpperCase().startsWith('M')
          && (x.perfil ?? '').toUpperCase().includes('DICO'))),
        error: () => (this.usuariosMedico = [])
      });
    }
  }

  /**
   * @param e especialidad.
   * @returns true si la especialidad está activa.
   */
  especialidadActiva(e: EspecialidadEstado): boolean {
    return e.activo === undefined || !!e.activo;
  }

  /** Usuarios de perfil Médico que no están asociados a otro médico. */
  get usuariosLibres(): UsuarioSistema[] {
    const usados = new Set(this.tabla.datos.filter(m => m.id !== this.editandoId && m.usuarioId).map(m => m.usuarioId));
    return this.usuariosMedico.filter(u => !usados.has(u.id));
  }

  /** Número de médicos activos. */
  get activos(): number {
    return this.tabla.datos.filter(m => m.activo).length;
  }

  /** Abre el formulario para registrar un médico. */
  nuevo(): void {
    this.editandoId = 0;
    this.editando = null;
    this.errorFormulario = '';
    this.formulario.reset({ tipoDocumento: 'CC', numeroDocumento: '', nombres: '', apellidos: '', telefono: '',
      registroProfesional: '', especializacionId: null, usuarioId: null, activo: true });
  }

  /**
   * Abre el formulario con los datos del médico.
   *
   * @param m médico a editar.
   */
  editar(m: MedicoRegistro): void {
    this.editandoId = m.id;
    this.editando = m;
    this.detalle = null;
    this.errorFormulario = '';
    this.formulario.reset({
      tipoDocumento: m.tipoDocumento, numeroDocumento: m.numeroDocumento, nombres: m.nombres, apellidos: m.apellidos,
      telefono: m.telefono ?? '', registroProfesional: m.registroProfesional, especializacionId: m.especializacionId,
      usuarioId: m.usuarioId, activo: !!m.activo
    });
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

  /** Mensaje de validación del documento según el tipo. */
  get errorDocumento(): string {
    const tipo = this.formulario.controls.tipoDocumento.value;
    const doc = (this.formulario.controls.numeroDocumento.value ?? '').trim();
    if (!doc) return 'El número de documento es obligatorio.';
    if (tipo === 'CC' && !/^\d{6,10}$/.test(doc)) return 'La cédula debe tener entre 6 y 10 dígitos.';
    if (!/^[A-Za-z0-9]{5,15}$/.test(doc)) return 'Entre 5 y 15 letras o dígitos, sin espacios.';
    return '';
  }

  /** Valida y guarda el médico (crea o actualiza). */
  guardar(): void {
    this.formulario.markAllAsTouched();
    const v = this.formulario.getRawValue();
    if (this.formulario.invalid || this.errorDocumento) {
      this.errorFormulario = this.errorDocumento || 'Revisa los campos marcados.';
      return;
    }
    const doc = (v.numeroDocumento ?? '').trim();
    const registro = (v.registroProfesional ?? '').trim().toUpperCase();
    const otros = this.tabla.datos.filter(m => m.id !== this.editandoId);
    if (otros.some(m => m.numeroDocumento === doc)) {
      this.errorFormulario = `Ya existe un médico con el documento ${doc}.`;
      return;
    }
    if (otros.some(m => m.registroProfesional.toUpperCase() === registro)) {
      this.errorFormulario = `Ya existe un médico con el registro profesional ${registro}.`;
      return;
    }
    if (this.editando && this.editando.activo && !v.activo && this.editando.citasFuturas > 0) {
      this.errorFormulario = `No se puede inactivar: tiene ${this.editando.citasFuturas} cita(s) futura(s) reservada(s).`;
      return;
    }
    const datos: MedicoRq = {
      tipoDocumento: v.tipoDocumento ?? 'CC', numeroDocumento: doc, nombres: (v.nombres ?? '').trim(),
      apellidos: (v.apellidos ?? '').trim(), telefono: (v.telefono ?? '').trim() || null, registroProfesional: registro,
      especializacionId: Number(v.especializacionId), usuarioId: v.usuarioId ?? null, activo: !!v.activo
    };
    this.guardando = true;
    this.errorFormulario = '';
    const peticion = this.editandoId ? this.api.actualizar(this.editandoId, datos) : this.api.crear(datos);
    peticion.subscribe({
      next: m => {
        this.guardando = false;
        this.aviso = `Médico ${m.nombres} ${m.apellidos} ${this.editandoId ? 'actualizado' : 'registrado'}.`;
        this.editandoId = null;
        this.editando = null;
        this.cargar();
      },
      error: e => {
        this.guardando = false;
        this.errorFormulario = mensajeError(e, 'No fue posible guardar el médico.');
      }
    });
  }

  /**
   * Activa o inactiva un médico, previa confirmación.
   *
   * @param m médico seleccionado.
   */
  cambiarEstado(m: FilaMedico): void {
    const activar = !m.activo;
    if (!activar && m.citasFuturas > 0) {
      this.error = `No se puede inactivar a ${m.nombreCompleto}: tiene ${m.citasFuturas} cita(s) futura(s) reservada(s). ` +
        'Reasígnelas o cancélelas en Gestión de Citas.';
      return;
    }
    Swal.fire({
      title: activar ? '¿Activar médico?' : '¿Inactivar médico?',
      text: activar ? `${m.nombreCompleto} podrá recibir citas nuevamente.`
        : `${m.nombreCompleto} no podrá recibir nuevas citas. Su historial se conserva.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: activar ? 'Activar' : 'Inactivar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.error = '';
      this.api.cambiarEstado(m.id, activar).subscribe({
        next: () => {
          this.aviso = `${m.nombreCompleto} ${activar ? 'activado' : 'inactivado'}.`;
          this.cargar();
        },
        error: e => (this.error = mensajeError(e, 'No fue posible cambiar el estado del médico.'))
      });
    });
  }

  /** Limpia la búsqueda y los filtros. */
  limpiarFiltros(): void {
    this.tabla.busqueda = '';
    this.filtroEspecialidad = null;
    this.filtroEstado = '';
    this.tabla.reiniciar();
  }
}
