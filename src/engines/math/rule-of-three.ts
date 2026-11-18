import { roundToDecimal } from '../common/rounding';

/**
 * Decompõe um número positivo em mantissa e expoente de base 2.
 * A mantissa retornada fica no intervalo [1, 2).
 */
function decomposeBinary(value: number): {
  mantissa: number;
  exponent: number;
} {
  const exponent = Math.floor(Math.log2(value));

  return {
    mantissa: value / Math.pow(2, exponent),
    exponent
  };
}

/**
 * Calcula (numerator1 × numerator2) ÷ denominator
 * reduzindo o risco de overflow intermediário.
 *
 * O cálculo utiliza mantissas e expoentes binários para evitar
 * que a multiplicação dos numeradores ultrapasse o limite
 * numérico antes da divisão.
 */
function calculateProductRatio(
  numerator1: number,
  numerator2: number,
  denominator: number
): number {
  if (![numerator1, numerator2, denominator].every(Number.isFinite)) {
    throw new Error('Todos os termos precisam ser números válidos.');
  }

  if (denominator === 0) {
    throw new RangeError('O divisor não pode ser zero.');
  }

  if (numerator1 === 0 || numerator2 === 0) {
    return 0;
  }

  const negative =
    (numerator1 < 0) !==
    (numerator2 < 0) !==
    (denominator < 0);

  const first = decomposeBinary(Math.abs(numerator1));
  const second = decomposeBinary(Math.abs(numerator2));
  const divisor = decomposeBinary(Math.abs(denominator));

  let mantissa =
    (first.mantissa * second.mantissa) /
    divisor.mantissa;

  let exponent =
    first.exponent +
    second.exponent -
    divisor.exponent;

  while (mantissa >= 2) {
    mantissa /= 2;
    exponent++;
  }

  while (mantissa < 1) {
    mantissa *= 2;
    exponent--;
  }

  let magnitude: number;

  if (exponent > 1023) {
    magnitude = Infinity;
  } else if (exponent < -1075) {
    magnitude = 0;
  } else if (exponent === -1075) {
    magnitude = Number.MIN_VALUE * (mantissa / 2);
  } else {
    magnitude = mantissa * Math.pow(2, exponent);
  }

  const result = negative ? -magnitude : magnitude;

  if (!Number.isFinite(result)) {
    throw new RangeError(
      'Não foi possível representar o resultado com os valores informados.'
    );
  }

  return result;
}

/**
 * Calcula o quarto termo de uma regra de três simples direta.
 *
 * Fórmula:
 * x = (b × c) ÷ a
 *
 * Aceita valores positivos, negativos e zero nos termos b e c,
 * desde que a seja diferente de zero.
 */
export function calculateRuleOfThreeSimple(
  a: number,
  b: number,
  c: number
): number {
  const result = calculateProductRatio(b, c, a);

  return roundToDecimal(result);
}

/**
 * Calcula o quarto termo de uma regra de três simples inversa.
 *
 * Fórmula:
 * x = (a × b) ÷ c
 *
 * Aceita valores positivos, negativos e zero nos termos a e b,
 * desde que c seja diferente de zero.
 */
export function calculateRuleOfThreeInverse(
  a: number,
  b: number,
  c: number
): number {
  const result = calculateProductRatio(a, b, c);

  return roundToDecimal(result);
}