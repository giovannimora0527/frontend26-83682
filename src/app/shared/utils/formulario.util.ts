import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ErrorApi } from 'src/app/models/respuesta';

/** Indica si un control debe mostrarse con error. */
export function esInvalido(control: AbstractControl | null): boolean {
  return !!control && control.invalid && (control.touched || control.dirty);
}

/** Busca el campo por su ruta ("loteInicial.cantidad") o, si no está, dentro de los grupos anidados. */
function buscarControl(form: FormGroup, campo: string): AbstractControl | null {
  return form.get(campo) ?? Object.values(form.controls)
    .filter((control) => control instanceof FormGroup)
    .map((grupo) => grupo.get(campo))
    .find((control) => !!control) ?? null;
}

/**
 * Muestra junto a cada control el error que informó el backend (error "servidor"), que Angular borra
 * cuando el usuario edita el campo. Devuelve true solo si todos los detalles encontraron su control.
 */
export function marcarErroresServidor(form: FormGroup, error: unknown): boolean {
  const cuerpo = error instanceof HttpErrorResponse ? (error.error as Partial<ErrorApi> | null) : null;
  const detalles = Array.isArray(cuerpo?.detalles) ? cuerpo.detalles : [];
  const marcados = detalles.filter(({ campo, mensaje }) => {
    const control = buscarControl(form, campo);
    control?.setErrors({ servidor: mensaje });
    control?.markAsTouched();
    return !!control;
  });
  return detalles.length > 0 && marcados.length === detalles.length;
}
