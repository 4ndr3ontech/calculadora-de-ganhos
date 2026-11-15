
import { roundToDecimal } from '../common/rounding';

export interface EarlyPayoffInput {
  currentBalance: number;
  remainingMonths: number;
  annualInterestRate: number;
  amortizationAmount: number;
  amortizationType: 'prazo' | 'prestacao';
}

export interface EarlyPayoffResult {
  currentTotalInterest: number;
  newTotalInterest: number;
  interestSaved: number;
  monthsReduced: number;
  newMonthlyPaymentEstimate: number;
}

/**
 * Valida os dados de entrada.
 */
function validateInput(input: EarlyPayoffInput): void {
  const {
    currentBalance,
    remainingMonths,
    annualInterestRate,
    amortizationAmount,
    amortizationType,
  } = input;

  const values = [
    currentBalance,
    annualInterestRate,
    amortizationAmount,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error(
      'Os valores informados precisam ser números válidos.'
    );
  }

  if (currentBalance < 0) {
    throw new RangeError(
      'O saldo devedor não pode ser negativo.'
    );
  }

  if (amortizationAmount < 0) {
    throw new RangeError(
      'O valor da amortização não pode ser negativo.'
    );
  }

  if (annualInterestRate <= -100) {
    throw new RangeError(
      'A taxa anual precisa ser maior que -100%.'
    );
  }

  if (
    !Number.isInteger(remainingMonths) ||
    remainingMonths < 1 ||
    remainingMonths > 1200
  ) {
    throw new RangeError(
      'O prazo restante precisa ser um número inteiro entre 1 e 1200 meses.'
    );
  }

  if (
    amortizationType !== 'prazo' &&
    amortizationType !== 'prestacao'
  ) {
    throw new Error(
      'Tipo de amortização inválido.'
    );
  }
}

/**
 * Calcula a prestação pelo sistema Price.
 */
function calculatePricePayment(
  balance: number,
  monthlyRate: number,
  months: number
): number {
  if (balance <= 0) return 0;

  if (monthlyRate === 0) {
    return balance / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);

  return balance * (
    monthlyRate * factor / (factor - 1)
  );
}

/**
 * Simula a evolução de um financiamento Price.
 *
 * Os juros são calculados sobre o saldo devedor no início
 * de cada mês. A prestação é limitada ao valor necessário
 * para quitar o saldo restante.
 */
function simulateFinancing(
  initialBalance: number,
  monthlyRate: number,
  monthlyPayment: number,
  maxMonths: number
): {
  totalInterest: number;
  months: number;
} {
  let balance = initialBalance;
  let totalInterest = 0;
  let months = 0;

  while (balance > 0.005 && months < maxMonths) {
    const interest = balance * monthlyRate;

    const amountDue = balance + interest;

    const payment = Math.min(
      monthlyPayment,
      amountDue
    );

    // Evita parcelas que não cobrem sequer os juros.
    if (payment <= interest && balance > 0) {
      throw new RangeError(
        'A prestação não é suficiente para amortizar a dívida.'
      );
    }

    totalInterest += interest;

    balance = Math.max(
      0,
      amountDue - payment
    );

    months++;
  }

  return {
    totalInterest,
    months,
  };
}

/**
 * Simula amortização antecipada de financiamento
 * utilizando o sistema Price.
 *
 * Premissas:
 * - A taxa anual informada é efetiva.
 * - A taxa anual é convertida para taxa mensal equivalente.
 * - A amortização é realizada imediatamente, antes da
 *   próxima prestação.
 * - Na modalidade "prazo", a prestação original é mantida.
 * - Na modalidade "prestacao", o prazo original é mantido.
 * - Não considera seguros, tarifas, TR, correção monetária
 *   ou regras específicas do contrato.
 */
export function calculateEarlyPayoff(
  input: EarlyPayoffInput
): EarlyPayoffResult {
  validateInput(input);

  const {
    currentBalance,
    remainingMonths,
    annualInterestRate,
    amortizationAmount,
    amortizationType,
  } = input;

  const monthlyRate =
    Math.pow(
      1 + annualInterestRate / 100,
      1 / 12
    ) - 1;

  const safeAmortization = Math.min(
    currentBalance,
    amortizationAmount
  );

  const newBalance =
    currentBalance - safeAmortization;

  // Financiamento sem saldo devedor.
  if (currentBalance === 0) {
    return {
      currentTotalInterest: 0,
      newTotalInterest: 0,
      interestSaved: 0,
      monthsReduced: 0,
      newMonthlyPaymentEstimate: 0,
    };
  }

  // Prestação original.
  const originalPayment = calculatePricePayment(
    currentBalance,
    monthlyRate,
    remainingMonths
  );

  // Juros totais sem amortização.
  const originalSimulation = simulateFinancing(
    currentBalance,
    monthlyRate,
    originalPayment,
    remainingMonths
  );

  let newTotalInterest = 0;
  let monthsReduced = 0;
  let newMonthlyPaymentEstimate = originalPayment;

  if (newBalance === 0) {
    // A amortização quita integralmente o financiamento.
    newTotalInterest = 0;
    monthsReduced = remainingMonths;
    newMonthlyPaymentEstimate = 0;
  } else if (amortizationType === 'prazo') {
    // Mantém a prestação e reduz o prazo.
    const newSimulation = simulateFinancing(
      newBalance,
      monthlyRate,
      originalPayment,
      remainingMonths
    );

    newTotalInterest = newSimulation.totalInterest;

    monthsReduced = Math.max(
      0,
      remainingMonths - newSimulation.months
    );
  } else {
    // Mantém o prazo e reduz a prestação.
    newMonthlyPaymentEstimate = calculatePricePayment(
      newBalance,
      monthlyRate,
      remainingMonths
    );

    const newSimulation = simulateFinancing(
      newBalance,
      monthlyRate,
      newMonthlyPaymentEstimate,
      remainingMonths
    );

    newTotalInterest = newSimulation.totalInterest;
  }

  const currentTotalInterest =
    originalSimulation.totalInterest;

  const interestSaved = Math.max(
    0,
    currentTotalInterest - newTotalInterest
  );

  return {
    currentTotalInterest: roundToDecimal(
      currentTotalInterest
    ),

    newTotalInterest: roundToDecimal(
      newTotalInterest
    ),

    interestSaved: roundToDecimal(
      interestSaved
    ),

    monthsReduced,

    newMonthlyPaymentEstimate: roundToDecimal(
      newMonthlyPaymentEstimate
    ),
  };
}
