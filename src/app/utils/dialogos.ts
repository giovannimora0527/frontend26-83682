import Swal from 'sweetalert2';

/**
 * Diálogos comunes de la aplicación (SweetAlert2), para que todas las pantallas confirmen y avisen igual.
 * Reemplazan a confirm()/alert() del navegador, que Chrome puede bloquear o que el usuario puede silenciar.
 */

/**
 * Pide confirmación antes de una operación.
 *
 * @param mensaje pregunta que se muestra.
 * @param textoConfirmar texto del botón que confirma.
 * @returns true si el usuario confirma.
 */
export async function confirmar(mensaje: string, textoConfirmar = 'Sí, continuar'): Promise<boolean> {
  const r = await Swal.fire({
    icon: 'question',
    title: 'Confirmar',
    text: mensaje,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true
  });
  return r.isConfirmed;
}

/**
 * Muestra un error de negocio o de conexión en una ventana visible desde cualquier parte de la página.
 *
 * @param mensaje texto del error.
 */
export function avisarError(mensaje: string): void {
  void Swal.fire({ icon: 'error', title: 'No se pudo completar', text: mensaje, confirmButtonText: 'Entendido' });
}

/**
 * Notificación breve de éxito en la esquina.
 *
 * @param mensaje texto del aviso.
 */
export function avisarExito(mensaje: string): void {
  void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: mensaje, showConfirmButton: false, timer: 2500 });
}
