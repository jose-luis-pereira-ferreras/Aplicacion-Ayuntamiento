/**
 * Traduce cualquier fallo de HttpClient a un ErrorApi con un mensaje
 * presentable. El backend responde siempre { "error": "..." } en los casos
 * que gestiona, pero Express devuelve HTML en 404/500 no controlados, asi que
 * tambien hay que cubrir esos casos.
 */
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    readonly estado = 0,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

const MESAJE_SIN_SERVIDOR =
  'No se pudo contactar con el servidor. Comprueba que la API está en marcha.';

export function normalizarError(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) {
    return error;
  }

  const cuerpo = (error as { error?: unknown })?.error;

  // Caso habitual: { "error": "mensaje en español" }
  if (
    cuerpo &&
    typeof cuerpo === 'object' &&
    typeof (cuerpo as { error?: unknown }).error === 'string'
  ) {
    return new ErrorApi(
      (cuerpo as { error: string }).error,
      (error as { status?: number })?.status ?? 0,
    );
  }

  if (error instanceof ProgressEvent || (error as { status?: number })?.status === 0) {
    return new ErrorApi(MESAJE_SIN_SERVIDOR, 0);
  }

  const estado = (error as { status?: number })?.status ?? 0;

  if (estado === 404) {
    return new ErrorApi('El recurso solicitado no existe.', 404);
  }

  if (estado >= 500) {
    return new ErrorApi('El servidor ha fallado al procesar la petición.', estado);
  }

  return new ErrorApi('Se ha producido un error inesperado.', estado);
}

/** Extrae un mensaje legible de cualquier error. */
export function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido.';
}
