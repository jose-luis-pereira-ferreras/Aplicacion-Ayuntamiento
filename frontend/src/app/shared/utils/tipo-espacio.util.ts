/**
 * Icono y color sugeridos por tipo de instalacion. `tipo` es texto libre en la
 * base de datos (conviven 'Pádel' y 'Padel'), asi que se normaliza antes de
 * buscar.
 */
const ICONOS: { clave: string; icono: string }[] = [
  { clave: 'piscina', icono: 'pool' },
  { clave: 'padel', icono: 'sports_tennis' },
  { clave: 'tenis', icono: 'sports_tennis' },
  { clave: 'gimnasio', icono: 'fitness_center' },
  { clave: 'fitness', icono: 'fitness_center' },
  { clave: 'atletismo', icono: 'sports' },
  { clave: 'pista', icono: 'directions_run' },
  { clave: 'campo', icono: 'sports_soccer' },
  { clave: 'futbol', icono: 'sports_soccer' },
  { clave: 'baloncesto', icono: 'sports_basketball' },
  { clave: 'basquet', icono: 'sports_basketball' },
  { clave: 'voley', icono: 'sports_volleyball' },
  { clave: 'tenis mesa', icono: 'sports_table_tennis' },
  { clave: 'ping', icono: 'sports_handball' },
  { clave: 'hockey', icono: 'sports_hockey' },
  { clave: 'ciclismo', icono: 'directions_bike' },
  { clave: 'sala', icono: 'meeting_room' },
  { clave: 'polideportivo', icono: 'sports' },
];

const POR_DEFECTO = { icono: 'sports', color: 'primary' };

function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function iconoDeTipo(tipo: string | null | undefined): string {
  const clave = normalizar(tipo);
  const encontrado = ICONOS.find((item) => clave.includes(item.clave));
  return (encontrado ?? POR_DEFECTO).icono;
}

/** Degradado por tipo, para dar variedad visual al catalogo. */
export function gradienteDeTipo(tipo: string | null | undefined): string {
  const clave = normalizar(tipo);
  if (clave.includes('piscina')) return 'linear-gradient(135deg, #0288d1, #26c6da)';
  if (clave.includes('gimnasio')) return 'linear-gradient(135deg, #5e35b1, #9575cd)';
  if (clave.includes('padel') || clave.includes('tenis')) {
    return 'linear-gradient(135deg, #2e7d32, #66bb6a)';
  }
  if (clave.includes('ciclismo')) return 'linear-gradient(135deg, #ef6c00, #ffa726)';
  if (clave.includes('sala')) return 'linear-gradient(135deg, #00838f, #4dd0e1)';
  return 'linear-gradient(135deg, #1565c0, #42a5f5)';
}
