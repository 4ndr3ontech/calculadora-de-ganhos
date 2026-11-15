
import { roundToDecimal } from '../common/rounding';

/**
 * Dados para cálculo de preço de serviços freelance.
 *
 * Valores monetários em reais (R$).
 * estimatedTaxesPercentage representa uma estimativa percentual
 * aplicada sobre o faturamento bruto.
 */
export interface FreelanceRateInput {
  /** Valor líquido mensal que deseja obter, além das despesas informadas (R$). */
  desiredNetIncome: number;

  /** Despesas pessoais mensais que precisam ser cobertas (R$). */
  personalExpenses: number;

  /** Despesas operacionais mensais da atividade (R$). */
  businessExpenses: number;

  /** Percentual estimado de impostos sobre o faturamento (0 a menos de 100). */
  estimatedTaxesPercentage: number;

  /** Horas produtivas trabalhadas por dia. */
  hoursPerDay: number;

  /** Dias trabalhados por semana. */
  daysPerWeek: number;

  /** Semanas de férias ou descanso por ano. */
  vacationWeeksPerYear: number;
}

/**
 * Resultado do cálculo de preço freelance.
 */
export interface FreelanceRateResult {
  /** Faturamento bruto mensal necessário, antes dos impostos (R$). */
  totalMonthlyNeeds: number;

  /** Média de horas faturáveis por mês, considerando férias (h). */
  billableHoursPerMonth: number;

  /** Valor recomendado por hora (R$). */
  hourlyRate: number;

  /** Valor recomendado por dia (R$). */
  dailyRate: number;

  /** Valor recomendado por semana de trabalho (R$). */
  weeklyRate: number;
}

/**
 * Valida um valor numérico finito e não negativo.
 */
function validateNonNegative(
  value: number,
  fieldName: string
): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${fieldName} deve ser um número válido e não negativo.`
    );
  }
}

/**
 * Calcula os valores necessários para a cobrança de serviços freelance.
 *
 * Premissas:
 * - A meta de renda é somada às despesas pessoais e operacionais.
 * - Os impostos são estimados como percentual fixo sobre o faturamento bruto.
 * - O cálculo considera 52 semanas por ano.
 * - As semanas de férias não geram horas faturáveis.
 * - Os resultados representam médias anuais distribuídas em 12 meses.
 *
 * Importante:
 * Este cálculo não substitui uma apuração tributária.
 * A alíquota deve ser informada pelo usuário e pode variar
 * conforme regime tributário, atividade e faturamento.
 */
export function calculateFreelanceRate(
  input: FreelanceRateInput
): FreelanceRateResult {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Os dados para o cálculo são obrigatórios.');
  }

  const {
    desiredNetIncome,
    personalExpenses,
    businessExpenses,
    estimatedTaxesPercentage,
    hoursPerDay,
    daysPerWeek,
    vacationWeeksPerYear,
  } = input;

  // 1. Validar valores monetários.
  validateNonNegative(desiredNetIncome, 'Renda desejada');
  validateNonNegative(personalExpenses, 'Despesas pessoais');
  validateNonNegative(businessExpenses, 'Despesas operacionais');

  // 2. Validar percentual de impostos.
  if (
    !Number.isFinite(estimatedTaxesPercentage) ||
    estimatedTaxesPercentage < 0 ||
    estimatedTaxesPercentage >= 100
  ) {
    throw new RangeError(
      'O percentual de impostos deve ser maior ou igual a 0 e menor que 100.'
    );
  }

  // 3. Validar jornada de trabalho.
  if (
    !Number.isFinite(hoursPerDay) ||
    hoursPerDay <= 0 ||
    hoursPerDay > 24
  ) {
    throw new RangeError(
      'As horas trabalhadas por dia devem ser maiores que 0 e menores ou iguais a 24.'
    );
  }

  if (
    !Number.isFinite(daysPerWeek) ||
    daysPerWeek <= 0 ||
    daysPerWeek > 7
  ) {
    throw new RangeError(
      'Os dias trabalhados por semana devem ser maiores que 0 e menores ou iguais a 7.'
    );
  }

  // 4. Validar semanas de férias.
  if (
    !Number.isFinite(vacationWeeksPerYear) ||
    vacationWeeksPerYear < 0 ||
    vacationWeeksPerYear >= 52
  ) {
    throw new RangeError(
      'As semanas de férias devem ser maiores ou iguais a 0 e menores que 52.'
    );
  }

  // 5. Calcular a necessidade líquida mensal.
  const netIncomeNeeded =
    desiredNetIncome +
    personalExpenses +
    businessExpenses;

  // 6. Calcular o faturamento bruto necessário.
  // Fórmula: bruto = líquido / (1 - alíquota).
  const taxRate = estimatedTaxesPercentage / 100;
  const taxFactor = 1 - taxRate;

  const grossIncomeNeeded = netIncomeNeeded / taxFactor;

  // 7. Calcular a capacidade anual de trabalho.
  const workingWeeksPerYear = 52 - vacationWeeksPerYear;

  const totalDaysPerYear =
    workingWeeksPerYear * daysPerWeek;

  const totalHoursPerYear =
    totalDaysPerYear * hoursPerDay;

  // 8. Distribuir as horas faturáveis ao longo de 12 meses.
  const billableHoursPerMonth =
    totalHoursPerYear / 12;

  if (
    !Number.isFinite(grossIncomeNeeded) ||
    !Number.isFinite(billableHoursPerMonth) ||
    billableHoursPerMonth <= 0
  ) {
    throw new RangeError(
      'Não foi possível calcular os valores com os parâmetros informados.'
    );
  }

  // 9. Calcular os preços de cobrança.
  const hourlyRate =
    grossIncomeNeeded / billableHoursPerMonth;

  const dailyRate =
    hourlyRate * hoursPerDay;

  const weeklyRate =
    dailyRate * daysPerWeek;

  // 10. Verificar possíveis estouros numéricos.
  const calculatedValues = [
    grossIncomeNeeded,
    billableHoursPerMonth,
    hourlyRate,
    dailyRate,
    weeklyRate,
  ];

  if (!calculatedValues.every(Number.isFinite)) {
    throw new RangeError(
      'O resultado ultrapassou os limites numéricos permitidos.'
    );
  }

  // 11. Retornar resultados arredondados.
  return {
    totalMonthlyNeeds: roundToDecimal(grossIncomeNeeded, 2),
    billableHoursPerMonth: roundToDecimal(
      billableHoursPerMonth,
      1
    ),
    hourlyRate: roundToDecimal(hourlyRate, 2),
    dailyRate: roundToDecimal(dailyRate, 2),
    weeklyRate: roundToDecimal(weeklyRate, 2),
  };
}
