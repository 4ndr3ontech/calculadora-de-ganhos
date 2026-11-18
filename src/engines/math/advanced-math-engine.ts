
import { roundToDecimal } from '../common/rounding';

// =====================================================
// MDC - MÁXIMO DIVISOR COMUM
// =====================================================

/**
 * Calcula o Máximo Divisor Comum utilizando
 * o algoritmo de Euclides.
 *
 * Aceita números inteiros positivos, negativos e zero.
 */
export function calcularMDC(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new RangeError(
      'O MDC aceita somente números inteiros seguros.'
    );
  }

  if (a === 0 && b === 0) {
    throw new RangeError(
      'O MDC de dois números iguais a zero não está definido.'
    );
  }

  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const resto = x % y;
    x = y;
    y = resto;
  }

  return x;
}

// =====================================================
// MMC - MÍNIMO MÚLTIPLO COMUM
// =====================================================

/**
 * Calcula o Mínimo Múltiplo Comum.
 *
 * Se um dos valores for zero, o resultado será zero.
 */
export function calcularMMC(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new RangeError(
      'O MMC aceita somente números inteiros seguros.'
    );
  }

  if (a === 0 || b === 0) {
    return 0;
  }

  const mdc = calcularMDC(a, b);

  // Divide antes de multiplicar para reduzir
  // o risco de estouro numérico.
  const mmc = (Math.abs(a) / mdc) * Math.abs(b);

  if (!Number.isSafeInteger(mmc)) {
    throw new RangeError(
      'O resultado do MMC ultrapassa o limite de precisão numérica.'
    );
  }

  return mmc;
}

// =====================================================
// VALIDAÇÃO COMPARTILHADA DAS PROGRESSÕES
// =====================================================

const MAX_PROGRESSION_TERMS = 10000;

function validateProgressionInput(
  a1: number,
  razao: number,
  n: number
): void {
  if (!Number.isFinite(a1) || !Number.isFinite(razao)) {
    throw new RangeError(
      'O primeiro termo e a razão precisam ser números válidos.'
    );
  }

  if (
    !Number.isSafeInteger(n) ||
    n < 1 ||
    n > MAX_PROGRESSION_TERMS
  ) {
    throw new RangeError(
      `A posição precisa ser um número inteiro entre 1 e ${MAX_PROGRESSION_TERMS}.`
    );
  }
}

// =====================================================
// PA - PROGRESSÃO ARITMÉTICA
// =====================================================

export interface PAInput {
  a1: number;
  razao: number;
  n: number;
}

export interface PAResult {
  termoN: number;
  somaN: number;
}

/**
 * Calcula o termo geral e a soma dos primeiros
 * n termos de uma Progressão Aritmética.
 */
export function calcularPA(input: PAInput): PAResult {
  const { a1, razao, n } = input;

  validateProgressionInput(a1, razao, n);

  const termoN = a1 + (n - 1) * razao;

  // Divide os valores antes da soma para reduzir
  // o risco de estouro intermediário.
  const somaN = n * (a1 / 2 + termoN / 2);

  if (!Number.isFinite(termoN) || !Number.isFinite(somaN)) {
    throw new RangeError(
      'O resultado da PA ultrapassou o limite numérico.'
    );
  }

  return {
    termoN: roundToDecimal(termoN),
    somaN: roundToDecimal(somaN),
  };
}

// =====================================================
// PG - PROGRESSÃO GEOMÉTRICA
// =====================================================

export interface PGInput {
  a1: number;
  razao: number;
  n: number;
}

export interface PGResult {
  termoN: number;
  somaN: number;
}

/**
 * Calcula o termo geral e a soma dos primeiros
 * n termos de uma Progressão Geométrica.
 *
 * O cálculo iterativo evita a perda de precisão
 * da fórmula fechada quando a razão está próxima de 1.
 */
export function calcularPG(input: PGInput): PGResult {
  const { a1, razao, n } = input;

  validateProgressionInput(a1, razao, n);

  let termo = a1;
  let soma = 0;

  for (let i = 0; i < n; i++) {
    soma += termo;

    if (!Number.isFinite(soma)) {
      throw new RangeError(
        'A soma da PG ultrapassou o limite numérico.'
      );
    }

    if (i < n - 1) {
      termo *= razao;

      if (!Number.isFinite(termo)) {
        throw new RangeError(
          'O termo da PG ultrapassou o limite numérico.'
        );
      }
    }
  }

  return {
    termoN: roundToDecimal(termo),
    somaN: roundToDecimal(soma),
  };
}
