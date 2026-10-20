import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import { UsuarioService } from './service/usuario.service';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // <-- Vital para que funcione el formulario
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit {
  listUsuarios: any[] = [];
  form!: FormGroup;
  usuarioSelected: any = null;
  modoFormulario = 'C';
  titleModal = '';
  titleBoton = '';
  modalInstance: Modal | null = null;
  enviando = false;

  constructor(private usuarioService: UsuarioService, private fb: FormBuilder) {}

  ngOnInit() {
    this.listar();
    this.inicializarFormulario();
  }

  inicializarFormulario() {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: [''], // Solo requerido al crear
      email: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required],
      activo: [true]
    });
  }

  listar() {
    this.usuarioService.listar().subscribe({
      next: (res) => this.listUsuarios = res,
      error: (err) => console.error('Error al listar usuarios:', err)
    });
  }

  nuevoUsuario() {
    this.modoFormulario = 'C';
    this.titleModal = 'Crear Usuario';
    this.titleBoton = 'Guardar';
    this.usuarioSelected = null;
    this.form.reset({ activo: true });
    
    // Hacemos la contraseña obligatoria solo al crear
    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();
    
    this.openModal();
  }

  abrirEdicion(usuario: any) {
    this.modoFormulario = 'E';
    this.titleModal = 'Editar Usuario';
    this.titleBoton = 'Actualizar';
    this.usuarioSelected = usuario;
    
    // Quitamos la validación de contraseña para editar
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();

    this.form.patchValue({
      username: usuario.username,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo
    });
    this.openModal();
  }

  openModal() {
    const modalElement = document.getElementById('modalUsuario');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  closeModal() {
    this.modalInstance?.hide();
  }

  guardarUsuario() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }

    const usuario = {
      id: this.usuarioSelected?.id,
      ...this.form.value
    };

    this.enviando = true;
    const peticion = this.modoFormulario === 'C' 
      ? this.usuarioService.guardar(usuario) 
      : this.usuarioService.actualizar(usuario);

    peticion.subscribe({
      next: (res: any) => {
        this.enviando = false;
        this.closeModal();
        this.listar();
        Swal.fire('Éxito', res.message || 'Operación exitosa', 'success');
      },
      error: (err: any) => {
        this.enviando = false;
        Swal.fire('Error', err.error?.message || 'Error al guardar', 'error');
      }
    });
  }
}