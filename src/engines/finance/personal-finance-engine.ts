
import { roundToDecimal } from '../common/rounding';

// =====================================================
// ORÇAMENTO 50/30/20
// =====================================================

export interface Budget503020Input {
  netMonthlyIncome: number;
}

export interface Budget503020Result {
  needs: number;
  wants: number;
  savingsOrDebt: number;
}

export function calculateBudget503020(
  input: Budget503020Input
): Budget503020Result {
  const { netMonthlyIncome } = input;

  if (!Number.isFinite(netMonthlyIncome)) {
    throw new Error(
      'A renda mensal precisa ser um número válido.'
    );
  }

  if (netMonthlyIncome < 0) {
    throw new RangeError(
      'A renda mensal não pode ser negativa.'
    );
  }

  return {
    needs: roundToDecimal(
      netMonthlyIncome * 0.50
    ),

    wants: roundToDecimal(
      netMonthlyIncome * 0.30
    ),

    savingsOrDebt: roundToDecimal(
      netMonthlyIncome * 0.20
    ),
  };
}

// =====================================================
// QUITAÇÃO DE CARTÃO DE CRÉDITO
// =====================================================

export interface CreditCardPayoffInput {
  totalDebt: number;
  monthlyInterestRate: number;
  monthlyPayment: number;
}

export interface CreditCardPayoffResult {
  monthsToPayoff: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  isViable: boolean;
}

/**
 * Simula a quitação de uma dívida de cartão de crédito.
 *
 * Premissas:
 * - A taxa mensal permanece constante.
 * - Os juros são incorporados ao saldo mensalmente.
 * - O pagamento ocorre depois da incidência dos juros.
 * - O último pagamento é limitado ao saldo atualizado.
 * - Não considera novas compras, multas ou encargos adicionais.
 * - A simulação tem limite de 1200 meses (100 anos).
 */
export function calculateCreditCardPayoff(
  input: CreditCardPayoffInput
): CreditCardPayoffResult {
  const {
    totalDebt,
    monthlyInterestRate,
    monthlyPayment,
  } = input;

  if (
    ![
      totalDebt,
      monthlyInterestRate,
      monthlyPayment,
    ].every(Number.isFinite)
  ) {
    throw new Error(
      'Todos os valores precisam ser números válidos.'
    );
  }

  if (totalDebt < 0) {
    throw new RangeError(
      'A dívida não pode ser negativa.'
    );
  }

  if (monthlyInterestRate < 0) {
    throw new RangeError(
      'A taxa de juros não pode ser negativa.'
    );
  }

  if (monthlyPayment < 0) {
    throw new RangeError(
      'O pagamento mensal não pode ser negativo.'
    );
  }

  // Dívida já quitada.
  if (totalDebt === 0) {
    return {
      monthsToPayoff: 0,
      totalInterestPaid: 0,
      totalAmountPaid: 0,
      isViable: true,
    };
  }

  // Sem pagamento, a dívida não será quitada.
  if (monthlyPayment === 0) {
    return {
      monthsToPayoff: 0,
      totalInterestPaid: 0,
      totalAmountPaid: 0,
      isViable: false,
    };
  }

  let balance = totalDebt;
  let totalInterest = 0;
  let totalPaid = 0;
  let months = 0;

  const maxMonths = 1200;

  while (balance > 0.005 && months < maxMonths) {
    const interest = balance * (
      monthlyInterestRate / 100
    );

    // O pagamento precisa superar os juros
    // para reduzir o saldo devedor.
    if (monthlyPayment <= interest) {
      return {
        monthsToPayoff: 0,
        totalInterestPaid: roundToDecimal(totalInterest),
        totalAmountPaid: roundToDecimal(totalPaid),
        isViable: false,
      };
    }

    const updatedBalance = balance + interest;

    const actualPayment = Math.min(
      monthlyPayment,
      updatedBalance
    );

    totalInterest += interest;
    totalPaid += actualPayment;

    balance = Math.max(
      0,
      updatedBalance - actualPayment
    );

    months++;
  }

  // Não foi possível quitar dentro do limite.
  if (balance > 0.005) {
    return {
      monthsToPayoff: 0,
      totalInterestPaid: roundToDecimal(totalInterest),
      totalAmountPaid: roundToDecimal(totalPaid),
      isViable: false,
    };
  }

  return {
    monthsToPayoff: months,
    totalInterestPaid: roundToDecimal(totalInterest),
    totalAmountPaid: roundToDecimal(totalPaid),
    isViable: true,
  };
}
