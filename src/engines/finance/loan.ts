
import { roundToDecimal } from '../common/rounding';

export interface LoanInput {
  principal: number;
  annualInterestRate: number;
  months: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

/**
 * Valida os dados de entrada do empréstimo.
 */
function validateInput(input: LoanInput): void {
  const {
    principal,
    annualInterestRate,
    months,
  } = input;

  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualInterestRate)
  ) {
    throw new Error(
      'O valor do empréstimo e a taxa de juros precisam ser números válidos.'
    );
  }

  if (principal <= 0) {
    throw new RangeError(
      'O valor do empréstimo precisa ser maior que zero.'
    );
  }

  if (annualInterestRate < 0) {
    throw new RangeError(
      'A taxa de juros não pode ser negativa.'
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
 * Calcula um empréstimo pelo Sistema Price.
 *
 * Premissas:
 * - Parcelas mensais constantes.
 * - Juros compostos calculados mensalmente.
 * - Taxa anual nominal dividida por 12.
 * - Primeira parcela após um mês.
 * - Não considera IOF, tarifas, seguros ou outros encargos.
 */
export function calculateLoanPrice(
  input: LoanInput
): LoanResult {
  validateInput(input);

  const {
    principal,
    annualInterestRate,
    months,
  } = input;

  const monthlyRate =
    annualInterestRate / 100 / 12;

  let monthlyPayment: number;

  if (monthlyRate === 0) {
    monthlyPayment = principal / months;
  } else {
    const factor = Math.pow(
      1 + monthlyRate,
      months
    );

    monthlyPayment =
      principal *
      (
        monthlyRate * factor /
        (factor - 1)
      );
  }

  const totalPayment =
    monthlyPayment * months;

  const totalInterest = Math.max(
    0,
    totalPayment - principal
  );

  if (
    ![
      monthlyPayment,
      totalPayment,
      totalInterest,
    ].every(Number.isFinite)
  ) {
    throw new RangeError(
      'Não foi possível calcular o empréstimo com os valores informados.'
    );
  }

  return {
    monthlyPayment: roundToDecimal(
      monthlyPayment
    ),

    totalPayment: roundToDecimal(
      totalPayment
    ),

    totalInterest: roundToDecimal(
      totalInterest
    ),
  };
}
