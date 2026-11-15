
import { roundToDecimal } from '../common/rounding';

export interface CompoundInterestInput {
  initialCapital: number;
  monthlyContribution: number;
  annualInterestRate: number;
  months: number;
}

export interface MonthlyEvolution {
  month: number;
  invested: number;
  interest: number;
  total: number;
}

export interface CompoundInterestResult {
  totalInvested: number;
  totalInterest: number;
  finalAmount: number;
  evolution: MonthlyEvolution[];
}

/**
 * Valida os dados de entrada.
 */
function validateInput(input: CompoundInterestInput): void {
  const {
    initialCapital,
    monthlyContribution,
    annualInterestRate,
    months,
  } = input;

  if (
    !Number.isFinite(initialCapital) ||
    !Number.isFinite(monthlyContribution) ||
    !Number.isFinite(annualInterestRate)
  ) {
    throw new Error(
      'Os valores financeiros precisam ser números válidos.'
    );
  }

  if (initialCapital < 0) {
    throw new RangeError(
      'O capital inicial não pode ser negativo.'
    );
  }

  if (monthlyContribution < 0) {
    throw new RangeError(
      'O aporte mensal não pode ser negativo.'
    );
  }

  if (annualInterestRate <= -100) {
    throw new RangeError(
      'A taxa anual precisa ser maior que -100%.'
    );
  }

  if (
    !Number.isInteger(months) ||
    months < 1 ||
    months > 1200
  ) {
    throw new RangeError(
      'O prazo precisa ser um número inteiro entre 1 e 1200 meses.'
    );
  }
}

/**
 * Calcula a evolução de um investimento com juros compostos.
 *
 * Premissas:
 * - A taxa informada é anual efetiva.
 * - A taxa anual é convertida para taxa mensal equivalente.
 * - O capital inicial rende desde o primeiro mês.
 * - Os juros são calculados antes do aporte mensal.
 * - Os aportes mensais são realizados no final de cada mês.
 * - Não considera impostos, taxas ou inflação.
 */
export function calculateCompoundInterest(
  input: CompoundInterestInput
): CompoundInterestResult {
  validateInput(input);

  const {
    initialCapital,
    monthlyContribution,
    annualInterestRate,
    months,
  } = input;

  const monthlyRate =
    Math.pow(1 + annualInterestRate / 100, 1 / 12) - 1;

  let currentTotal = initialCapital;
  let totalInvested = initialCapital;

  const evolution: MonthlyEvolution[] = [];

  for (let month = 1; month <= months; month++) {
    // Calcula os juros sobre o saldo existente.
    const interestEarned = currentTotal * monthlyRate;

    // Atualiza o saldo com juros e aporte no final do mês.
    currentTotal += interestEarned + monthlyContribution;

    totalInvested += monthlyContribution;

    const totalInterest = currentTotal - totalInvested;

    evolution.push({
      month,
      invested: roundToDecimal(totalInvested),
      interest: roundToDecimal(totalInterest),
      total: roundToDecimal(currentTotal),
    });
  }

  const finalAmount = currentTotal;
  const totalInterest = finalAmount - totalInvested;

  return {
    totalInvested: roundToDecimal(totalInvested),
    totalInterest: roundToDecimal(totalInterest),
    finalAmount: roundToDecimal(finalAmount),
    evolution,
  };
}
