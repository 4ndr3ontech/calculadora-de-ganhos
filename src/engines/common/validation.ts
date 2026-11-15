
/**
 * Verifica se o valor é um número finito e não negativo.
 *
 * Aceita zero e números positivos.
 */
export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Verifica se o valor é um número finito.
 *
 * Aceita números positivos, negativos e zero.
 */
export function isValidNumber(value: number): boolean {
  return Number.isFinite(value);
}
