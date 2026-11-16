
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
 * O resultado apresenta somente o adicional noturno,
 * sem incluir reflexos em férias, 13º, FGTS ou outras verbas.
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
    throw new RangeError(
      'O salário mensal deve ser válido e não negativo.'
    );
  }

  if (!Number.isFinite(monthlyHours) || monthlyHours <= 0) {
    throw new RangeError(
      'A carga horária mensal deve ser maior que zero.'
    );
  }

  if (!Number.isFinite(nightHoursCount) || nightHoursCount < 0) {
    throw new RangeError(
      'As horas noturnas devem ser válidas e não negativas.'
    );
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

  // Conversão de horas reais para horas noturnas reduzidas.
  // Cada 60 minutos reais equivalem a aproximadamente
  // 1,142857 horas noturnas legais.
  const nightHoursEquivalent =
    nightHoursCount * (60 / 52.5);

  // Valor da hora normal acrescida do adicional.
  const nightHourlyRate =
    hourlyRate * (1 + nightBonusPercentage / 100);

  // Calcula somente o valor adicional, sem a hora normal.
  const nightBonusTotal =
    hourlyRate *
    (nightBonusPercentage / 100) *
    nightHoursEquivalent;

  // Evita retornar resultados inválidos por overflow.
  const calculatedValues = [
    hourlyRate,
    nightHoursEquivalent,
    nightHourlyRate,
    nightBonusTotal,
  ];

  if (!calculatedValues.every(Number.isFinite)) {
    throw new RangeError(
      'Os valores calculados ultrapassaram o limite numérico permitido.'
    );
  }

  return {
    hourlyRate: roundToDecimal(hourlyRate, 2),
    nightHourlyRate: roundToDecimal(nightHourlyRate, 2),
    nightHoursEquivalent: roundToDecimal(
      nightHoursEquivalent,
      2
    ),
    nightBonusTotal: roundToDecimal(nightBonusTotal, 2),
  };
}

// =====================================================
// SEGURO-DESEMPREGO
// =====================================================

export interface UnemploymentInput {
  /**
   * Média salarial utilizada para calcular o valor
   * da parcela do seguro-desemprego.
   */
  averageSalary: number;

  /**
   * Número da solicitação:
   * 1 = primeira solicitação;
   * 2 = segunda solicitação;
   * 3 ou mais = terceira solicitação ou posterior.
   */
  requestCount: number;

  /**
   * Total de meses trabalhados nos últimos 36 meses
   * anteriores à dispensa.
   *
   * Este campo é utilizado para determinar a quantidade
   * de parcelas, e não substitui a verificação da carência.
   */
  workedMonthsLast3Years: number;

  /**
   * Meses com salário na janela legal:
   *
   * 1ª solicitação: últimos 18 meses, mínimo de 12;
   * 2ª solicitação: últimos 12 meses, mínimo de 9;
   * 3ª ou posterior: últimos 6 meses, mínimo de 6.
   *
   * Informação obrigatória para determinar a elegibilidade.
   */
  qualifyingMonthsInReferencePeriod?: number;

  /**
   * Para terceira solicitação ou posterior:
   * confirma trabalho remunerado em cada um dos
   * 6 meses imediatamente anteriores à dispensa.
   *
   * Informação obrigatória a partir da terceira solicitação.
   */
  hasRequiredConsecutiveMonths?: boolean;
}

export interface UnemploymentResult {
  parcels: number;
  averageParcelValue: number;
  eligible: boolean;
  eligibilityDataComplete: boolean;
  eligibilityNote: string;
}

// =====================================================
// TABELA OFICIAL DO SEGURO-DESEMPREGO — 2026
// =====================================================

/**
 * Valores vigentes a partir de 11/01/2026.
 *
 * Fonte: Ministério do Trabalho e Emprego.
 */
const MINIMUM_WAGE_2026 = 1621.00;
const MAXIMUM_INSTALLMENT_2026 = 2518.65;

const FIRST_SALARY_RANGE_LIMIT = 2222.17;
const SECOND_SALARY_RANGE_LIMIT = 3703.99;

const FIRST_RANGE_FIXED_VALUE = 1777.74;

// =====================================================
// CÁLCULO DO VALOR DA PARCELA
// =====================================================

/**
 * Calcula o valor de uma parcela do seguro-desemprego
 * conforme a tabela vigente em 2026.
 *
 * O benefício não pode ser inferior ao salário mínimo
 * nem superior ao teto estabelecido pelo MTE.
 */
function calculateInstallmentValue(
  averageSalary: number
): number {
  let value: number;

  if (averageSalary <= FIRST_SALARY_RANGE_LIMIT) {
    value = averageSalary * 0.8;
  } else if (averageSalary <= SECOND_SALARY_RANGE_LIMIT) {
    value =
      FIRST_RANGE_FIXED_VALUE +
      (averageSalary - FIRST_SALARY_RANGE_LIMIT) * 0.5;
  } else {
    value = MAXIMUM_INSTALLMENT_2026;
  }

  // Aplica os limites mínimo e máximo do benefício.
  value = Math.min(
    MAXIMUM_INSTALLMENT_2026,
    Math.max(value, MINIMUM_WAGE_2026)
  );

  return roundToDecimal(value, 2);
}

// =====================================================
// QUANTIDADE DE PARCELAS
// =====================================================

/**
 * Determina a quantidade de parcelas conforme:
 *
 * - Número da solicitação;
 * - Total de meses trabalhados nos últimos 36 meses.
 *
 * A carência legal é verificada separadamente.
 */
function calculateParcelCount(
  requestCount: number,
  workedMonthsLast3Years: number
): number {
  // Primeira solicitação.
  if (requestCount === 1) {
    if (workedMonthsLast3Years >= 24) {
      return 5;
    }

    if (workedMonthsLast3Years >= 12) {
      return 4;
    }

    return 0;
  }

  // Segunda solicitação.
  if (requestCount === 2) {
    if (workedMonthsLast3Years >= 24) {
      return 5;
    }

    if (workedMonthsLast3Years >= 12) {
      return 4;
    }

    if (workedMonthsLast3Years >= 9) {
      return 3;
    }

    return 0;
  }

  // Terceira solicitação ou posterior.
  if (workedMonthsLast3Years >= 24) {
    return 5;
  }

  if (workedMonthsLast3Years >= 12) {
    return 4;
  }

  if (workedMonthsLast3Years >= 6) {
    return 3;
  }

  return 0;
}

// =====================================================
// REGRAS DE ELEGIBILIDADE
// =====================================================

/**
 * Retorna a janela legal e a quantidade mínima
 * de meses exigida conforme a solicitação.
 */
function getEligibilityRequirements(requestCount: number): {
  referencePeriod: number;
  minimumRequiredMonths: number;
} {
  if (requestCount === 1) {
    return {
      referencePeriod: 18,
      minimumRequiredMonths: 12,
    };
  }

  if (requestCount === 2) {
    return {
      referencePeriod: 12,
      minimumRequiredMonths: 9,
    };
  }

  return {
    referencePeriod: 6,
    minimumRequiredMonths: 6,
  };
}

// =====================================================
// MOTOR PRINCIPAL — SEGURO-DESEMPREGO
// =====================================================

/**
 * Calcula uma estimativa do seguro-desemprego formal.
 *
 * Verificações realizadas:
 *
 * 1. Primeira solicitação:
 *    - Pelo menos 12 meses com salário nos últimos 18 meses.
 *
 * 2. Segunda solicitação:
 *    - Pelo menos 9 meses com salário nos últimos 12 meses.
 *
 * 3. Terceira solicitação ou posterior:
 *    - Pelo menos 6 meses com salário nos últimos 6 meses;
 *    - Confirmação de trabalho remunerado em cada um
 *      dos 6 meses imediatamente anteriores à dispensa.
 *
 * A quantidade de parcelas é calculada separadamente,
 * com base nos meses trabalhados nos últimos 36 meses.
 *
 * A aprovação final depende também dos demais requisitos
 * legais e da análise oficial do benefício.
 */
export function calculateUnemploymentInsurance(
  input: UnemploymentInput
): UnemploymentResult {
  if (!input || typeof input !== 'object') {
    throw new TypeError(
      'Os dados do cálculo são obrigatórios.'
    );
  }

  const {
    averageSalary,
    requestCount,
    workedMonthsLast3Years,
    qualifyingMonthsInReferencePeriod,
    hasRequiredConsecutiveMonths,
  } = input;

  // ---------------------------------------------------
  // VALIDAÇÃO DOS DADOS PRINCIPAIS
  // ---------------------------------------------------

  if (!Number.isFinite(averageSalary) || averageSalary <= 0) {
    throw new RangeError(
      'A média salarial deve ser maior que zero.'
    );
  }

  if (
    !Number.isInteger(requestCount) ||
    requestCount < 1
  ) {
    throw new RangeError(
      'A quantidade de solicitações deve ser um inteiro maior que zero.'
    );
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

  // ---------------------------------------------------
  // REGRAS DA SOLICITAÇÃO
  // ---------------------------------------------------

  const {
    referencePeriod,
    minimumRequiredMonths,
  } = getEligibilityRequirements(requestCount);

  // ---------------------------------------------------
  // VALIDAÇÃO DA JANELA LEGAL
  // ---------------------------------------------------

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

  // Os meses da janela legal fazem parte do total
  // informado para os últimos 36 meses.
  if (
    qualifyingMonthsInReferencePeriod !== undefined &&
    qualifyingMonthsInReferencePeriod > workedMonthsLast3Years
  ) {
    throw new RangeError(
      'Os meses da janela legal não podem superar o total trabalhado nos últimos 36 meses.'
    );
  }

  // ---------------------------------------------------
  // VALIDAÇÃO DOS MESES CONSECUTIVOS
  // ---------------------------------------------------

  if (
    hasRequiredConsecutiveMonths !== undefined &&
    typeof hasRequiredConsecutiveMonths !== 'boolean'
  ) {
    throw new TypeError(
      'A confirmação dos meses consecutivos deve ser verdadeira ou falsa.'
    );
  }

  // ---------------------------------------------------
  // VERIFICAÇÃO DA COMPLETUDE DOS DADOS
  // ---------------------------------------------------

  const eligibilityDataComplete =
    qualifyingMonthsInReferencePeriod !== undefined &&
    (
      requestCount < 3 ||
      hasRequiredConsecutiveMonths !== undefined
    );

  // ---------------------------------------------------
  // VERIFICAÇÃO DA CARÊNCIA
  // ---------------------------------------------------

  const qualifyingMonthsMet =
    qualifyingMonthsInReferencePeriod !== undefined &&
    qualifyingMonthsInReferencePeriod >= minimumRequiredMonths;

  // ---------------------------------------------------
  // VERIFICAÇÃO DOS SEIS MESES CONSECUTIVOS
  // ---------------------------------------------------

  const consecutiveMonthsMet =
    requestCount < 3 ||
    hasRequiredConsecutiveMonths === true;

  // ---------------------------------------------------
  // ELEGIBILIDADE TEMPORAL
  // ---------------------------------------------------

  const temporalRequirementsMet =
    eligibilityDataComplete &&
    qualifyingMonthsMet &&
    consecutiveMonthsMet;

  // ---------------------------------------------------
  // QUANTIDADE DE PARCELAS
  // ---------------------------------------------------

  const parcels = temporalRequirementsMet
    ? calculateParcelCount(
        requestCount,
        workedMonthsLast3Years
      )
    : 0;

  // ---------------------------------------------------
  // VALOR DA PARCELA
  // ---------------------------------------------------

  const averageParcelValue =
    parcels > 0
      ? calculateInstallmentValue(averageSalary)
      : 0;

  // ---------------------------------------------------
  // VALIDAÇÃO FINAL DOS RESULTADOS
  // ---------------------------------------------------

  if (
    !Number.isInteger(parcels) ||
    parcels < 0 ||
    parcels > 5
  ) {
    throw new RangeError(
      'A quantidade calculada de parcelas é inválida.'
    );
  }

  if (
    !Number.isFinite(averageParcelValue) ||
    averageParcelValue < 0
  ) {
    throw new RangeError(
      'O valor calculado da parcela é inválido.'
    );
  }

  // ---------------------------------------------------
  // MENSAGEM DE ELEGIBILIDADE
  // ---------------------------------------------------

  let eligibilityNote: string;

  if (!eligibilityDataComplete) {
    eligibilityNote =
      `Informe os meses trabalhados nos últimos ${referencePeriod} meses`;

    if (requestCount >= 3) {
      eligibilityNote +=
        ' e confirme o trabalho remunerado em cada um dos 6 meses imediatamente anteriores à dispensa.';
    } else {
      eligibilityNote += '.';
    }
  } else if (!qualifyingMonthsMet) {
    eligibilityNote =
      `O tempo informado não alcança os ${minimumRequiredMonths} meses exigidos para esta solicitação.`;
  } else if (!consecutiveMonthsMet) {
    eligibilityNote =
      'Não foi confirmado trabalho remunerado em cada um dos 6 meses imediatamente anteriores à dispensa.';
  } else if (parcels === 0) {
    eligibilityNote =
      'O total de meses trabalhados nos últimos 36 meses não permite determinar parcelas nesta simulação.';
  } else {
    eligibilityNote =
      'Os requisitos temporais foram atendidos. A concessão depende também dos demais requisitos legais e da análise oficial.';
  }

  // ---------------------------------------------------
  // RESULTADO
  // ---------------------------------------------------

  return {
    parcels,
    averageParcelValue,
    eligible: temporalRequirementsMet && parcels > 0,
    eligibilityDataComplete,
    eligibilityNote,
  };
}
