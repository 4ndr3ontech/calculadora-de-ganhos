
import { roundToDecimal } from '../common/rounding';

export interface IndependenceInput {
  desiredMonthlyIncome: number;
  safeWithdrawalRate: number;
  currentInvestedCapital: number;
  monthlyContribution: number;
  annualReturnRate: number;
}

export interface IndependenceResult {
  targetPatrimony: number;
  monthsToGoal: number;
  yearsToGoal: number;
  progressPercentage: number;
}

/**
 * Valida os dados da simulação.
 */
function validateInput(input: IndependenceInput): void {
  const {
    desiredMonthlyIncome,
    safeWithdrawalRate,
    currentInvestedCapital,
    monthlyContribution,
    annualReturnRate,
  } = input;

  const values = [
    desiredMonthlyIncome,
    safeWithdrawalRate,
    currentInvestedCapital,
    monthlyContribution,
    annualReturnRate,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error(
      'Todos os valores precisam ser números válidos.'
    );
  }

  if (desiredMonthlyIncome <= 0) {
    throw new RangeError(
      'A renda mensal desejada precisa ser maior que zero.'
    );
  }

  if (
    safeWithdrawalRate <= 0 ||
    safeWithdrawalRate > 100
  ) {
    throw new RangeError(
      'A taxa de retirada precisa ser maior que 0% e menor ou igual a 100%.'
    );
  }

  if (currentInvestedCapital < 0) {
    throw new RangeError(
      'O patrimônio atual não pode ser negativo.'
    );
  }

  if (monthlyContribution < 0) {
    throw new RangeError(
      'O aporte mensal não pode ser negativo.'
    );
  }

  if (annualReturnRate <= -100) {
    throw new RangeError(
      'A rentabilidade anual precisa ser maior que -100%.'
    );
  }
}

/**
 * Calcula o patrimônio necessário para independência financeira
 * e estima o tempo para atingir a meta.
 *
 * Premissas:
 * - Renda desejada e rentabilidade expressas em valores reais,
 *   ou seja, acima da inflação.
 * - Taxa de retirada anual aplicada ao patrimônio acumulado.
 * - Rentabilidade anual efetiva convertida em taxa mensal equivalente.
 * - Aportes realizados no início de cada mês.
 * - Limite de simulação de 1200 meses (100 anos).
 *
 * O resultado é uma estimativa, não uma garantia de aposentadoria.
 */
export function calculateIndependence(
  input: IndependenceInput
): IndependenceResult {
  validateInput(input);

  const {
    desiredMonthlyIncome,
    safeWithdrawalRate,
    currentInvestedCapital,
    monthlyContribution,
    annualReturnRate,
  } = input;

  // Patrimônio necessário para sustentar a renda desejada.
  const annualIncomeNeeded =
    desiredMonthlyIncome * 12;

  const withdrawalRate =
    safeWithdrawalRate / 100;

  const targetPatrimony =
    annualIncomeNeeded / withdrawalRate;

  if (!Number.isFinite(targetPatrimony)) {
    throw new RangeError(
      'Não foi possível calcular o patrimônio necessário.'
    );
  }

  // Progresso atual em relação ao patrimônio desejado.
  const progressPercentage = Math.min(
    100,
    Math.max(
      0,
      (currentInvestedCapital / targetPatrimony) * 100
    )
  );

  // Já alcançou a independência financeira.
  if (currentInvestedCapital >= targetPatrimony) {
    return {
      targetPatrimony: roundToDecimal(targetPatrimony),
      monthsToGoal: 0,
      yearsToGoal: 0,
      progressPercentage: 100,
    };
  }

  const monthlyRate =
    Math.pow(
      1 + annualReturnRate / 100,
      1 / 12
    ) - 1;

  let balance = currentInvestedCapital;
  let months = 0;

  const maxMonths = 1200;

  // Sem rentabilidade positiva ou aporte suficiente,
  // a meta pode ser inalcançável.
  if (
    monthlyRate <= 0 &&
    monthlyContribution <= 0
  ) {
    return {
      targetPatrimony: roundToDecimal(targetPatrimony),
      monthsToGoal: -1,
      yearsToGoal: -1,
      progressPercentage: roundToDecimal(
        progressPercentage,
        1
      ),
    };
  }

  while (
    balance < targetPatrimony &&
    months < maxMonths
  ) {
    // Aporte realizado no início do mês.
    balance += monthlyContribution;

    // Aplicação da rentabilidade mensal.
    balance *= 1 + monthlyRate;

    months++;
  }

  // A meta não foi alcançada dentro do horizonte.
  if (balance < targetPatrimony) {
    return {
      targetPatrimony: roundToDecimal(targetPatrimony),
      monthsToGoal: -1,
      yearsToGoal: -1,
      progressPercentage: roundToDecimal(
        progressPercentage,
        1
      ),
    };
  }

  return {
    targetPatrimony: roundToDecimal(targetPatrimony),

    monthsToGoal: months,

    yearsToGoal: roundToDecimal(
      months / 12,
      1
    ),

    progressPercentage: roundToDecimal(
      progressPercentage,
      1
    ),
  };
}
