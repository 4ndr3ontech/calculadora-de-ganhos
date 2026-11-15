
import { roundToDecimal } from '../common/rounding';

// =====================================================
// VALIDAÇÃO
// =====================================================

function validateFiniteValues(
  values: number[],
  description: string
): void {
  if (!values.every(Number.isFinite)) {
    throw new Error(
      `${description} precisam ser números válidos.`
    );
  }
}

// =====================================================
// PORCENTAGEM DE UM VALOR
// =====================================================

/**
 * Calcula quanto representa determinado percentual
 * de um valor.
 */
export function calculatePercentageOfValue(
  value: number,
  percentage: number
): number {
  validateFiniteValues(
    [value, percentage],
    'O valor e o percentual'
  );

  if (value < 0) {
    throw new RangeError(
      'O valor não pode ser negativo.'
    );
  }

  if (percentage < 0) {
    throw new RangeError(
      'O percentual não pode ser negativo.'
    );
  }

  const result = (value * percentage) / 100;

  if (!Number.isFinite(result)) {
    throw new RangeError(
      'Não foi possível calcular a porcentagem.'
    );
  }

  return roundToDecimal(result);
}

// =====================================================
// AUMENTO OU VARIAÇÃO PERCENTUAL
// =====================================================

/**
 * Calcula a variação percentual entre um valor inicial
 * e um valor final.
 *
 * Resultado positivo: aumento.
 * Resultado negativo: redução.
 */
export function calculatePercentageIncrease(
  initial: number,
  final: number
): number {
  validateFiniteValues(
    [initial, final],
    'Os valores inicial e final'
  );

  if (initial <= 0) {
    throw new RangeError(
      'O valor inicial precisa ser maior que zero.'
    );
  }

  if (final < 0) {
    throw new RangeError(
      'O valor final não pode ser negativo.'
    );
  }

  const result =
    ((final - initial) / initial) * 100;

  if (!Number.isFinite(result)) {
    throw new RangeError(
      'Não foi possível calcular a variação percentual.'
    );
  }

  return roundToDecimal(result);
}

// =====================================================
// CÁLCULO DE DESCONTO
// =====================================================

export interface DiscountResult {
  finalValue: number;
  discountAmount: number;
}

/**
 * Calcula o valor do desconto e o preço final.
 *
 * O desconto permitido varia entre 0% e 100%.
 */
export function calculateDiscount(
  value: number,
  discountPercentage: number
): DiscountResult {
  validateFiniteValues(
    [value, discountPercentage],
    'O valor e o percentual de desconto'
  );

  if (value < 0) {
    throw new RangeError(
      'O valor não pode ser negativo.'
    );
  }

  if (
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    throw new RangeError(
      'O desconto precisa estar entre 0% e 100%.'
    );
  }

  const discountAmount =
    (value * discountPercentage) / 100;

  const finalValue =
    value - discountAmount;

  if (
    !Number.isFinite(discountAmount) ||
    !Number.isFinite(finalValue)
  ) {
    throw new RangeError(
      'Não foi possível calcular o desconto.'
    );
  }

  return {
    finalValue: roundToDecimal(finalValue),
    discountAmount: roundToDecimal(discountAmount),
  };
}
