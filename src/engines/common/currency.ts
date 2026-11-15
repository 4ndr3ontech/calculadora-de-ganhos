
/**
 * Formata um número como moeda brasileira (R$).
 */
export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError('O valor informado deve ser um número válido.');
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Converte um valor monetário brasileiro para número.
 *
 * Exemplos:
 * "R$ 1.234,56" -> 1234.56
 * "1234,56"     -> 1234.56
 * "1.234"       -> 1234
 * "R$ 50,00"    -> 50
 */
export function parseBRL(valueStr: string): number {
  if (typeof valueStr !== 'string') {
    throw new TypeError('O valor informado deve ser um texto.');
  }

  const clean = valueStr
    .trim()
    .replace(/\s/g, '')
    .replace(/^R\$/i, '');

  if (!clean) {
    throw new RangeError('Informe um valor monetário.');
  }

  // Aceita somente números, separadores brasileiros
  // e sinal negativo opcional.
  if (!/^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$|^-?\d+(,\d{1,2})?$/.test(clean)) {
    throw new RangeError('Formato monetário inválido.');
  }

  const normalized = clean
    .replace(/\./g, '')
    .replace(',', '.');

  const result = Number(normalized);

  if (!Number.isFinite(result)) {
    throw new RangeError('Não foi possível converter o valor informado.');
  }

  return result;
}
