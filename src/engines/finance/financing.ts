
import { roundToDecimal } from '../common/rounding';

export interface FinancingInput {
  propertyValue: number;
  downPayment: number;
  annualInterestRate: number;
  months: number;
}

export interface FinancingAmortizationRow {
  month: number;
  installment: number;
  amortization: number;
  interest: number;
  balance: number;
}

export interface FinancingResult {
  financedAmount: number;
  totalPayment: number;
  totalInterest: number;
  schedule: FinancingAmortizationRow[];
}

/**
 * Valida os dados de entrada do financiamento.
 */
function validateInput(input: FinancingInput): void {
  const {
    propertyValue,
    downPayment,
    annualInterestRate,
    months,
  } = input;

  if (
    ![
      propertyValue,
      downPayment,
      annualInterestRate,
    ].every(Number.isFinite)
  ) {
    throw new Error(
      'Todos os valores precisam ser números válidos.'
    );
  }

  if (propertyValue <= 0) {
    throw new RangeError(
      'O valor do imóvel precisa ser maior que zero.'
    );
  }

  if (downPayment < 0) {
    throw new RangeError(
      'A entrada não pode ser negativa.'
    );
  }

  if (downPayment > propertyValue) {
    throw new RangeError(
      'A entrada não pode ser maior que o valor do imóvel.'
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
 * Calcula um financiamento pelo Sistema de Amortização
 * Constante (SAC).
 *
 * Premissas:
 * - Amortização constante ao longo do financiamento.
 * - Juros calculados sobre o saldo devedor no início de cada mês.
 * - Taxa anual nominal dividida por 12.
 * - Não considera seguros, tarifas, TR ou outros indexadores.
 */
export function calculateFinancingSAC(
  input: FinancingInput
): FinancingResult {
  validateInput(input);

  const {
    propertyValue,
    downPayment,
    annualInterestRate,
    months,
  } = input;

  const financedAmount =
    propertyValue - downPayment;

  // Imóvel integralmente pago na entrada.
  if (financedAmount === 0) {
    return {
      financedAmount: 0,
      totalPayment: 0,
      totalInterest: 0,
      schedule: [],
    };
  }

  const monthlyRate =
    annualInterestRate / 100 / 12;

  const constantAmortization =
    financedAmount / months;

  let balance = financedAmount;
  let totalInterest = 0;
  let totalPayment = 0;

  const schedule: FinancingAmortizationRow[] = [];

  for (let month = 1; month <= months; month++) {
    const interest = balance * monthlyRate;

    // Garante que a última amortização quite o saldo.
    const amortization = Math.min(
      constantAmortization,
      balance
    );

    const installment =
      amortization + interest;

    balance = Math.max(
      0,
      balance - amortization
    );

    totalInterest += interest;
    totalPayment += installment;

    schedule.push({
      month,

      installment: roundToDecimal(
        installment
      ),

      amortization: roundToDecimal(
        amortization
      ),

      interest: roundToDecimal(
        interest
      ),

      balance: roundToDecimal(
        balance
      ),
    });
  }

  return {
    financedAmount: roundToDecimal(
      financedAmount
    ),

    totalPayment: roundToDecimal(
      totalPayment
    ),

    totalInterest: roundToDecimal(
      totalInterest
    ),

    schedule,
  };
}
