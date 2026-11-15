
import { roundToDecimal } from '../common/rounding';

/**
 * Calcula o quarto termo de uma regra de três simples.
 *
 * Fórmula:
 * x = (b * c) / a
 *
 * A função aceita valores positivos, negativos e zero
 * nos termos b e c, desde que a seja diferente de zero.
 */
export function calculateRuleOfThreeSimple(
  a: number,
  b: number,
  c: number
): number {
  if (![a, b, c].every(Number.isFinite)) {
    throw new Error(
      'Todos os termos precisam ser números válidos.'
    );
  }

  if (a === 0) {
    throw new RangeError(
      'O primeiro termo (a) não pode ser zero.'
    );
  }

  const result = (b * c) / a;

  if (!Number.isFinite(result)) {
    throw new RangeError(
      'Não foi possível calcular a regra de três com os valores informados.'
    );
  }

  return roundToDecimal(result);
}
