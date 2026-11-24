import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import { errorDeCampo } from './http.util';

/** Indica si un control debe mostrarse con error. */
export function esInvalido(control: AbstractControl | null): boolean {
  return !!control && control.invalid && (control.touched || control.dirty);
}

/**
 * Muestra junto a cada control el error que informó el backend (error "servidor").
 * Devuelve true si al menos un campo quedó marcado. Angular lo borra cuando el usuario edita el campo.
 */
export function marcarErroresServidor(form: FormGroup, error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }
  let marcado = false;
  for (const [campo, control] of Object.entries(form.controls)) {
    const mensaje = errorDeCampo(error, campo);
    if (mensaje) {
      control.setErrors({ servidor: mensaje });
      control.markAsTouched();
      marcado = true;
    }
  }
  return marcado;
}
