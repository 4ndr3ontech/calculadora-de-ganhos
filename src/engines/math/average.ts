
import { roundToDecimal } from '../common/rounding';

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Valida se o array contém somente posições preenchidas
 * com números finitos.
 */
function validateNumberArray(
  values: number[],
  fieldName: string
): void {
  for (let index = 0; index < values.length; index++) {
    if (!(index in values)) {
      throw new TypeError(
        `A lista de ${fieldName} não pode conter posições vazias.`
      );
    }

    if (!Number.isFinite(values[index])) {
      throw new Error(
        `Todos os elementos de ${fieldName} precisam ser números finitos.`
      );
    }
  }
}

/**
 * Soma valores utilizando compensação numérica
 * para reduzir erros de ponto flutuante.
 *
 * Os valores devem estar previamente normalizados
 * para evitar estouros numéricos.
 */
function compensatedSum(
  values: number[]
): number {
  let sum = 0;
  let compensation = 0;

  for (const value of values) {
    const nextSum = sum + value;

    if (Math.abs(sum) >= Math.abs(value)) {
      compensation +=
        (sum - nextSum) + value;
    } else {
      compensation +=
        (value - nextSum) + sum;
    }

    sum = nextSum;
  }

  const result = sum + compensation;

  if (!Number.isFinite(result)) {
    throw new RangeError(
      'Não foi possível realizar a soma com os valores informados.'
    );
  }

  return result;
}

// =====================================================
// MÉDIA ARITMÉTICA
// =====================================================

/**
 * Calcula a média aritmética de uma lista de números.
 *
 * Utiliza normalização dos valores e soma compensada
 * para reduzir problemas de precisão e overflow.
 *
 * @param numbers Lista de números.
 * @returns Média aritmética arredondada para 2 casas decimais.
 */
export function calculateArithmeticAverage(
  numbers: number[]
): number {
  if (!Array.isArray(numbers)) {
    throw new TypeError(
      'Os valores precisam ser informados em uma lista.'
    );
  }

  if (numbers.length === 0) {
    throw new RangeError(
      'Informe pelo menos um número para calcular a média.'
    );
  }

  validateNumberArray(numbers, 'valores');

  // Identifica a maior magnitude para normalização.
  let maxAbs = 0;

  for (const value of numbers) {
    maxAbs = Math.max(maxAbs, Math.abs(value));
  }

  // A média de uma lista composta somente por zeros é zero.
  if (maxAbs === 0) {
    return 0;
  }

  // Normaliza os valores para evitar overflow na soma.
  const normalizedValues = numbers.map(
    value => value / maxAbs
  );

  const normalizedSum =
    compensatedSum(normalizedValues);

  const average =
    (normalizedSum / numbers.length) * maxAbs;

  if (!Number.isFinite(average)) {
    throw new RangeError(
      'Não foi possível calcular a média com os valores informados.'
    );
  }

  return roundToDecimal(average);
}

// =====================================================
// MÉDIA PONDERADA
// =====================================================

/**
 * Calcula a média ponderada de uma lista de valores
 * utilizando seus respectivos pesos.
 *
 * Os pesos precisam ser não negativos e sua soma
 * deve ser maior que zero.
 *
 * Os valores e pesos são normalizados antes da
 * multiplicação para reduzir riscos de overflow.
 *
 * @param values Lista de valores.
 * @param weights Lista de pesos correspondentes.
 * @returns Média ponderada arredondada para 2 casas decimais.
 */
export function calculateWeightedAverage(
  values: number[],
  weights: number[]
): number {
  if (
    !Array.isArray(values) ||
    !Array.isArray(weights)
  ) {
    throw new TypeError(
      'Valores e pesos precisam ser listas válidas.'
    );
  }

  if (values.length === 0) {
    throw new RangeError(
      'Informe pelo menos um valor para calcular a média ponderada.'
    );
  }

  if (values.length !== weights.length) {
    throw new RangeError(
      'A quantidade de valores precisa ser igual à quantidade de pesos.'
    );
  }

  validateNumberArray(values, 'valores');
  validateNumberArray(weights, 'pesos');

  if (weights.some(weight => weight < 0)) {
    throw new RangeError(
      'Os pesos não podem ser negativos.'
    );
  }

  // Identifica o maior peso.
  let maxWeight = 0;

  for (const weight of weights) {
    maxWeight = Math.max(maxWeight, weight);
  }

  if (maxWeight === 0) {
    throw new RangeError(
      'A soma dos pesos precisa ser maior que zero.'
    );
  }

  // Identifica a maior magnitude dos valores.
  let maxAbsValue = 0;

  for (const value of values) {
    maxAbsValue = Math.max(
      maxAbsValue,
      Math.abs(value)
    );
  }

  // Se todos os valores forem zero, a média também será zero.
  if (maxAbsValue === 0) {
    return 0;
  }

  // Normaliza os pesos para evitar estouro na soma.
  const normalizedWeights = weights.map(
    weight => weight / maxWeight
  );

  const sumWeights =
    compensatedSum(normalizedWeights);

  if (sumWeights <= 0) {
    throw new RangeError(
      'A soma dos pesos precisa ser maior que zero.'
    );
  }

  // Normaliza os valores antes de multiplicar pelos pesos.
  const normalizedValues = values.map(
    value => value / maxAbsValue
  );

  const weightedProducts = normalizedValues.map(
    (value, index) =>
      value * normalizedWeights[index]
  );

  const weightedSum =
    compensatedSum(weightedProducts);

  const average =
    (weightedSum / sumWeights) * maxAbsValue;

  if (!Number.isFinite(average)) {
    throw new RangeError(
      'Não foi possível calcular a média ponderada com os valores informados.'
    );
  }

  return roundToDecimal(average);
}
