
import { roundToDecimal } from '../common/rounding';

// =====================================================
// ADICIONAL NOTURNO
// =====================================================

export interface NightShiftInput {
  monthlySalary: number;
  monthlyHours: number;
  nightHoursCount: number;
  nightBonusPercentage: number;
}

export interface NightShiftResult {
  hourlyRate: number;
  nightHourlyRate: number;
  nightHoursEquivalent: number;
  nightBonusTotal: number;
}

/**
 * Calcula o adicional noturno urbano para trabalhadores CLT.
 *
 * Premissas:
 * - Período noturno urbano: 22h às 5h.
 * - Hora noturna reduzida: 52 minutos e 30 segundos.
 * - Adicional mínimo: 20%.
 * - nightHoursCount representa horas reais de relógio
 *   trabalhadas dentro do período noturno.
 *
 * O resultado apresenta somente o adicional, sem reflexos.
 */
export function calculateNightShift(
  input: NightShiftInput
): NightShiftResult {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Os dados do cálculo são obrigatórios.');
  }

  const {
    monthlySalary,
    monthlyHours,
    nightHoursCount,
    nightBonusPercentage,
  } = input;

  if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
    throw new RangeError('O salário mensal deve ser válido e não negativo.');
  }

  if (!Number.isFinite(monthlyHours) || monthlyHours <= 0) {
    throw new RangeError('A carga horária mensal deve ser maior que zero.');
  }

  if (!Number.isFinite(nightHoursCount) || nightHoursCount < 0) {
    throw new RangeError('As horas noturnas devem ser válidas e não negativas.');
  }

  if (
    !Number.isFinite(nightBonusPercentage) ||
    nightBonusPercentage < 20
  ) {
    throw new RangeError(
      'O adicional noturno urbano deve ser de pelo menos 20%.'
    );
  }

  // Valor da hora normal.
  const hourlyRate = monthlySalary / monthlyHours;

  // Conversão da hora real para hora noturna reduzida.
  // 60 minutos reais correspondem a 52,5 minutos legais.
  const nightHoursEquivalent = nightHoursCount * (60 / 52.5);

  // Valor da hora normal acrescida do adicional.
  const nightHourlyRate =
    hourlyRate * (1 + nightBonusPercentage / 100);

  // Calcula somente o adicional noturno.
  const nightBonusTotal =
    hourlyRate *
    (nightBonusPercentage / 100) *
    nightHoursEquivalent;

  return {
    hourlyRate: roundToDecimal(hourlyRate, 2),
    nightHourlyRate: roundToDecimal(nightHourlyRate, 2),
    nightHoursEquivalent: roundToDecimal(nightHoursEquivalent, 2),
    nightBonusTotal: roundToDecimal(nightBonusTotal, 2),
  };
}

// =====================================================
// SEGURO-DESEMPREGO
// =====================================================

export interface UnemploymentInput {
  averageSalary: number;
  requestCount: number;
  workedMonthsLast3Years: number;

  // Meses com salário na janela legal:
  // 1ª solicitação: últimos 18 meses.
  // 2ª solicitação: últimos 12 meses.
  // 3ª ou posterior: últimos 6 meses.
  qualifyingMonthsInReferencePeriod?: number;

  // Para terceira solicitação ou posterior:
  // confirma trabalho remunerado em cada um dos
  // 6 meses imediatamente anteriores à dispensa.
  hasRequiredConsecutiveMonths?: boolean;
}

export interface UnemploymentResult {
  parcels: number;
  averageParcelValue: number;
  eligible: boolean;
  eligibilityDataComplete: boolean;
  eligibilityNote: string;
}

// Valores oficiais de 2026.
const MINIMUM_WAGE_2026 = 1621.00;
const MAXIMUM_INSTALLMENT_2026 = 2518.65;

/**
 * Calcula o valor de uma parcela do seguro-desemprego.
 *
 * Tabela vigente a partir de 11/01/2026.
 */
function calculateInstallmentValue(
  averageSalary: number
): number {
  let value: number;

  if (averageSalary <= 2222.17) {
    value = averageSalary * 0.8;
  } else if (averageSalary <= 3703.99) {
    value =
      1777.74 +
      (averageSalary - 2222.17) * 0.5;
  } else {
    value = MAXIMUM_INSTALLMENT_2026;
  }

  return Math.min(
    MAXIMUM_INSTALLMENT_2026,
    Math.max(value, MINIMUM_WAGE_2026)
  );
}

/**
 * Determina a quantidade de parcelas conforme
 * a solicitação e o tempo total de trabalho.
 */
function calculateParcelCount(
  requestCount: number,
  workedMonthsLast3Years: number
): number {
  if (requestCount === 1) {
    if (workedMonthsLast3Years >= 24) return 5;
    if (workedMonthsLast3Years >= 12) return 4;

    return 0;
  }

  if (requestCount === 2) {
    if (workedMonthsLast3Years >= 24) return 5;
    if (workedMonthsLast3Years >= 12) return 4;
    if (workedMonthsLast3Years >= 9) return 3;

    return 0;
  }

  // Terceira solicitação ou posterior.
  if (workedMonthsLast3Years >= 24) return 5;
  if (workedMonthsLast3Years >= 12) return 4;
  if (workedMonthsLast3Years >= 6) return 3;

  return 0;
}

/**
 * Calcula uma estimativa do seguro-desemprego.
 *
 * A elegibilidade temporal depende dos meses trabalhados
 * na janela de referência correspondente à solicitação.
 *
 * A aprovação final depende também dos demais requisitos legais.
 */
export function calculateUnemploymentInsurance(
  input: UnemploymentInput
): UnemploymentResult {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Os dados do cálculo são obrigatórios.');
  }

  const {
    averageSalary,
    requestCount,
    workedMonthsLast3Years,
    qualifyingMonthsInReferencePeriod,
    hasRequiredConsecutiveMonths,
  } = input;

  if (!Number.isFinite(averageSalary) || averageSalary <= 0) {
    throw new RangeError('A média salarial deve ser maior que zero.');
  }

  if (!Number.isInteger(requestCount) || requestCount < 1) {
    throw new RangeError('A quantidade de solicitações deve ser um inteiro maior que zero.');
  }

  if (
    !Number.isInteger(workedMonthsLast3Years) ||
    workedMonthsLast3Years < 0 ||
    workedMonthsLast3Years > 36
  ) {
    throw new RangeError(
      'Os meses trabalhados nos últimos 36 meses devem estar entre 0 e 36.'
    );
  }

  const referencePeriod =
    requestCount === 1 ? 18 :
    requestCount === 2 ? 12 : 6;

  const minimumRequiredMonths =
    requestCount === 1 ? 12 :
    requestCount === 2 ? 9 : 6;

  if (
    qualifyingMonthsInReferencePeriod !== undefined &&
    (
      !Number.isInteger(qualifyingMonthsInReferencePeriod) ||
      qualifyingMonthsInReferencePeriod < 0 ||
      qualifyingMonthsInReferencePeriod > referencePeriod
    )
  ) {
    throw new RangeError(
      `Os meses na janela de referência devem estar entre 0 e ${referencePeriod}.`
    );
  }

  if (
    hasRequiredConsecutiveMonths !== undefined &&
    typeof hasRequiredConsecutiveMonths !== 'boolean'
  ) {
    throw new TypeError('A confirmação dos meses consecutivos deve ser verdadeira ou falsa.');
  }

  // Verifica se todos os dados temporais necessários foram informados.
  const eligibilityDataComplete =
    qualifyingMonthsInReferencePeriod !== undefined &&
    (
      requestCount < 3 ||
      hasRequiredConsecutiveMonths !== undefined
    );

  const qualifyingMonthsMet =
    qualifyingMonthsInReferencePeriod !== undefined &&
    qualifyingMonthsInReferencePeriod >= minimumRequiredMonths;

  const consecutiveMonthsMet =
    requestCount < 3 ||
    hasRequiredConsecutiveMonths === true;

  const eligible =
    eligibilityDataComplete &&
    qualifyingMonthsMet &&
    consecutiveMonthsMet;

  // Calcula as parcelas somente quando os requisitos
  // temporais informados foram atendidos.
  const parcels = eligible
    ? calculateParcelCount(requestCount, workedMonthsLast3Years)
    : 0;

  const averageParcelValue =
    parcels > 0
      ? roundToDecimal(
          calculateInstallmentValue(averageSalary),
          2
        )
      : 0;

  let eligibilityNote: string;

  if (!eligibilityDataComplete) {
    eligibilityNote =
      `Informe os meses trabalhados nos últimos ${referencePeriod} meses` +
      (
        requestCount >= 3
          ? ' e confirme o trabalho em cada um dos 6 meses imediatamente anteriores à dispensa.'
          : '.'
      );
  } else if (!qualifyingMonthsMet) {
    eligibilityNote =
      `O tempo informado não alcança os ${minimumRequiredMonths} meses exigidos para esta solicitação.`;
  } else if (!consecutiveMonthsMet) {
    eligibilityNote =
      'Não foi confirmado trabalho remunerado em cada um dos 6 meses imediatamente anteriores à dispensa.';
  } else if (parcels === 0) {
    eligibilityNote =
      'O tempo total informado não permite determinar parcelas nesta simulação.';
  } else {
    eligibilityNote =
      'Os requisitos temporais foram atendidos. A concessão depende também dos demais requisitos legais e da análise oficial.';
  }

  return {
    parcels,
    averageParcelValue,
    eligible: eligible && parcels > 0,
    eligibilityDataComplete,
    eligibilityNote,
  };
}
