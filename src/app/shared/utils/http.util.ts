import { HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { ErrorApi } from 'src/app/models/respuesta';

export type ValorParametro = string | number | boolean | null | undefined;

/** Arma los parámetros omitiendo los valores nulos, indefinidos o vacíos. */
export function construirParams(objeto: Record<string, ValorParametro>): HttpParams {
  return Object.entries(objeto).reduce((params, [clave, valor]) => {
    const texto = valor === null || valor === undefined ? '' : String(valor).trim();
    return texto ? params.set(clave, texto) : params;
  }, new HttpParams());
}

/** Mensaje del formato de error C1, con sus detalles; nunca muestra el texto técnico de Angular. */
export function mensajeError(error: unknown, predeterminado: string): string {
  const cuerpo = error instanceof HttpErrorResponse ? (error.error as Partial<ErrorApi> | null) : null;
  if (!cuerpo || typeof cuerpo.message !== 'string' || !cuerpo.message) {
    return predeterminado;
  }
  const detalles = (Array.isArray(cuerpo.detalles) ? cuerpo.detalles : []).map(({ campo, mensaje }) => `${campo}: ${mensaje}`);
  return [cuerpo.message, ...detalles].join('\n');
}

/** Mensaje de error de un campo concreto, si el backend lo informó. */
export function errorDeCampo(error: unknown, campo: string): string | null {
  const cuerpo = error instanceof HttpErrorResponse ? (error.error as Partial<ErrorApi> | null) : null;
  return (Array.isArray(cuerpo?.detalles) ? cuerpo.detalles : []).find((detalle) => detalle.campo === campo)?.mensaje ?? null;
}

function nombreArchivo(response: HttpResponse<Blob>, predeterminado: string): string {
  const encabezado = response.headers.get('Content-Disposition') ?? '';
  const codificado = /filename\*=UTF-8''([^;]+)/i.exec(encabezado)?.[1];
  if (codificado) {
    try {
      return decodeURIComponent(codificado.trim());
    } catch {
      // Se intenta con el nombre simple.
    }
  }
  return /filename="?([^";]+)"?/i.exec(encabezado)?.[1].trim() || predeterminado;
}

/** Guarda el archivo de la respuesta con el nombre de Content-Disposition. */
export function descargarArchivo(response: HttpResponse<Blob>, extension = 'bin'): void {
  if (!response.body) {
    return;
  }
  const ahora = new Date();
  const fecha = [ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
  const url = URL.createObjectURL(response.body);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo(response, `archivo-${fecha}.${extension}`);
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url));
}

/** Muestra el archivo en la pestaña ya abierta; la URL se libera después de cargarla. */
export function mostrarArchivo(response: HttpResponse<Blob>, pestana: Window): void {
  if (!response.body) {
    pestana.close();
    return;
  }
  const url = URL.createObjectURL(response.body);
  pestana.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
