
/**
 * Arredonda um número para a quantidade de casas decimais informada.
 *
 * O arredondamento utiliza a representação decimal mais curta
 * que representa o número recebido pelo JavaScript.
 *
 * Critério:
 * - Arredondamento de meio para longe de zero.
 * - Exemplo: 1.005 -> 1.01
 * - Exemplo: -1.005 -> -1.01
 *
 * @param value Número que será arredondado.
 * @param decimals Quantidade de casas decimais (padrão: 2).
 * @returns Número arredondado.
 */
export function roundToDecimal(
  value: number,
  decimals: number = 2
): number {
  if (!Number.isFinite(value)) {
    throw new Error(
      'O valor informado precisa ser um número finito.'
    );
  }

  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 10
  ) {
    throw new Error(
      'A quantidade de casas decimais deve ser um inteiro entre 0 e 10.'
    );
  }

  if (value === 0) {
    return 0;
  }

  const negative = value < 0;
  const absoluteValue = Math.abs(value);

  const [coefficient, exponentText] =
    absoluteValue.toString().toLowerCase().split('e');

  const exponent = exponentText
    ? Number(exponentText)
    : 0;

  const [integerPart, decimalPart = ''] =
    coefficient.split('.');

  const digits = BigInt(
    `${integerPart}${decimalPart}`
  );

  const shift =
    exponent - decimalPart.length + decimals;

  let roundedInteger: bigint;

  if (shift >= 0) {
    roundedInteger =
      digits * (10n ** BigInt(shift));
  } else {
    const divisor = 10n ** BigInt(-shift);

    const quotient = digits / divisor;
    const remainder = digits % divisor;

    roundedInteger =
      remainder * 2n >= divisor
        ? quotient + 1n
        : quotient;
  }

  let resultText = roundedInteger.toString();

  if (decimals > 0) {
    resultText = resultText.padStart(
      decimals + 1,
      '0'
    );

    const splitPosition =
      resultText.length - decimals;

    resultText =
      `${resultText.slice(0, splitPosition)}.` +
      `${resultText.slice(splitPosition)}`;
  }

  const sign = negative ? '-' : '';

  const result = Number(`${sign}${resultText}`);

  if (!Number.isFinite(result)) {
    throw new RangeError(
      'Não foi possível representar o resultado do arredondamento.'
    );
  }

  return Object.is(result, -0) ? 0 : result;
}
