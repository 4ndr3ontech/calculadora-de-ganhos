
import { roundToDecimal } from '../common/rounding';

// =====================================================
// TIPOS
// =====================================================

export type ResignationType =
  | 'sem-justa-causa'
  | 'com-justa-causa'
  | 'pedido-demissao'
  | 'acordo-mutuo';

export type AvisoType = 'indenizado' | 'trabalhado';

export interface RescisaoInput {
  monthlySalary: number;
  resignationType: ResignationType;
  avisoType: AvisoType;
  startDate: string;
  endDate: string;
  hasVencidaVacation: boolean;
  fgtsBaseForTermination?: number;
  vacationPeriodsDue?: number;
  vacationPeriodsOverdue?: number;
  dependents?: number;
}

export interface RescisaoResult {
  saldoSalario: number;
  avisoPrevio: number;
  avisoDays: number;
  descontoAvisoPrevio: number;
  decimoTerceiroProporcional: number;
  decimoTerceiroIndenizado: number;
  feriasProporcionais: number;
  feriasIndenizadas: number;
  feriasVencidas: number;
  multaFgts: number;
  totalVencimentos: number;
  inssDescontoTotal: number;
  irrfDescontoTotal: number;
  totalLiquido: number;
  daysWorked: number;
  calculationNotes: string[];
}

// =====================================================
// CONSTANTES — TABELAS DE 2026
// =====================================================

const TAX_YEAR = 2026;

const INSS_LIMIT = 8475.55;

const INSS_BRACKETS = [
  { limit: 1621.00, rate: 0.075 },
  { limit: 2902.84, rate: 0.09 },
  { limit: 4354.27, rate: 0.12 },
  { limit: 8475.55, rate: 0.14 },
];

const IRRF_BRACKETS = [
  { limit: 2428.80, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Infinity, rate: 0.275, deduction: 908.73 },
];

const IRRF_SIMPLIFIED_DEDUCTION = 607.20;
const IRRF_DEPENDENT_DEDUCTION = 189.59;

const DAY_IN_MS = 86400000;

// =====================================================
// DATAS
// =====================================================

function parseDate(value: string): Date {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new Error('Informe as datas no formato AAAA-MM-DD.');
  }

  const [year, month, day] = value.split('-').map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Uma das datas informadas não é válida.');
  }

  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function daysBetween(start: Date, end: Date): number {
  return (
    Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS) + 1
  );
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCFullYear(result.getUTCFullYear() + years);

  const lastDay = new Date(
    Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDay));

  return result;
}

function addMonths(date: Date, months: number): Date {
  const originalDay = date.getUTCDate();

  const target = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      1
    )
  );

  const lastDay = new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  target.setUTCDate(Math.min(originalDay, lastDay));

  return target;
}

function completedYears(start: Date, end: Date): number {
  let years = end.getUTCFullYear() - start.getUTCFullYear();

  if (addYears(start, years).getTime() > end.getTime()) {
    years--;
  }

  return Math.max(0, years);
}

/**
 * Conta os meses do ano-calendário com pelo menos 15 dias.
 */
function countCalendarMonths(
  start: Date,
  end: Date
): number {
  if (end.getTime() < start.getTime()) {
    return 0;
  }

  let total = 0;

  const current = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      1
    )
  );

  while (
    current.getUTCFullYear() < end.getUTCFullYear() ||
    (
      current.getUTCFullYear() === end.getUTCFullYear() &&
      current.getUTCMonth() <= end.getUTCMonth()
    )
  ) {
    const monthStart = new Date(current);

    const monthEnd = new Date(
      Date.UTC(
        current.getUTCFullYear(),
        current.getUTCMonth() + 1,
        0
      )
    );

    const effectiveStart =
      start.getTime() > monthStart.getTime()
        ? start
        : monthStart;

    const effectiveEnd =
      end.getTime() < monthEnd.getTime()
        ? end
        : monthEnd;

    if (
      effectiveEnd.getTime() >= effectiveStart.getTime() &&
      daysBetween(effectiveStart, effectiveEnd) >= 15
    ) {
      total++;
    }

    current.setUTCMonth(current.getUTCMonth() + 1);
  }

  return total;
}

/**
 * Conta os avos de férias desde o início do período aquisitivo.
 * Cada período completo conta 1 avo.
 * Fração igual ou superior a 15 dias conta mais 1 avo.
 *
 * Não limita o resultado a 11: a projeção do aviso pode completar
 * um período aquisitivo e ainda gerar avos do período seguinte.
 */
function countVacationMonths(
  start: Date,
  end: Date
): number {
  if (end.getTime() < start.getTime()) {
    return 0;
  }

  let completedMonths = 0;

  while (
    addMonths(start, completedMonths + 1).getTime() <=
    end.getTime()
  ) {
    completedMonths++;
  }

  const currentPeriodStart = addMonths(
    start,
    completedMonths
  );

  const remainingDays = daysBetween(
    currentPeriodStart,
    end
  );

  return completedMonths + (remainingDays >= 15 ? 1 : 0);
}

// =====================================================
// INSS — 2026
// =====================================================

function calculateINSS(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const base = Math.min(value, INSS_LIMIT);

  let previousLimit = 0;
  let total = 0;

  for (const bracket of INSS_BRACKETS) {
    const taxableAmount = Math.max(
      0,
      Math.min(base, bracket.limit) - previousLimit
    );

    total += taxableAmount * bracket.rate;
    previousLimit = bracket.limit;

    if (base <= bracket.limit) {
      break;
    }
  }

  return roundToDecimal(total, 2);
}

// =====================================================
// IRRF — 2026
// =====================================================

function calculateIRRF(
  income: number,
  inss: number,
  dependents: number
): number {
  if (!Number.isFinite(income) || income <= 0) {
    return 0;
  }

  const legalDeductions =
    inss + dependents * IRRF_DEPENDENT_DEDUCTION;

  const deduction = Math.max(
    legalDeductions,
    IRRF_SIMPLIFIED_DEDUCTION
  );

  const taxBase = Math.max(0, income - deduction);

  const bracket = IRRF_BRACKETS.find(
    (item) => taxBase <= item.limit
  );

  if (!bracket) {
    throw new Error('Não foi possível determinar a faixa do IRRF.');
  }

  const baseTax = Math.max(
    0,
    taxBase * bracket.rate - bracket.deduction
  );

  let reduction = 0;

  if (income <= 5000) {
    reduction = 312.89;
  } else if (income <= 7350) {
    reduction = 978.62 - 0.133145 * income;
  }

  return roundToDecimal(
    Math.max(0, baseTax - reduction),
    2
  );
}

// =====================================================
// MOTOR PRINCIPAL
// =====================================================

export function calculateRescisao(
  input: RescisaoInput
): RescisaoResult {
  const {
    monthlySalary,
    resignationType,
    avisoType,
    startDate,
    endDate,
    hasVencidaVacation,
    fgtsBaseForTermination,
    vacationPeriodsDue,
    vacationPeriodsOverdue = 0,
    dependents = 0,
  } = input;

  // ---------------------------------------------------
  // VALIDAÇÕES
  // ---------------------------------------------------

  if (
    !Number.isFinite(monthlySalary) ||
    monthlySalary <= 0
  ) {
    throw new Error('O salário mensal deve ser maior que zero.');
  }

  const validResignationTypes: ResignationType[] = [
    'sem-justa-causa',
    'com-justa-causa',
    'pedido-demissao',
    'acordo-mutuo',
  ];

  if (!validResignationTypes.includes(resignationType)) {
    throw new Error('Tipo de desligamento inválido.');
  }

  if (
    avisoType !== 'indenizado' &&
    avisoType !== 'trabalhado'
  ) {
    throw new Error('Tipo de aviso prévio inválido.');
  }

  if (typeof hasVencidaVacation !== 'boolean') {
    throw new Error(
      'Informe corretamente a situação das férias vencidas.'
    );
  }

  if (
    fgtsBaseForTermination !== undefined &&
    (
      !Number.isFinite(fgtsBaseForTermination) ||
      fgtsBaseForTermination < 0
    )
  ) {
    throw new Error(
      'A base do FGTS deve ser válida e não negativa.'
    );
  }

  if (
    vacationPeriodsDue !== undefined &&
    (
      !Number.isInteger(vacationPeriodsDue) ||
      vacationPeriodsDue < 0
    )
  ) {
    throw new Error(
      'A quantidade de períodos de férias deve ser um inteiro não negativo.'
    );
  }

  if (
    !Number.isInteger(vacationPeriodsOverdue) ||
    vacationPeriodsOverdue < 0
  ) {
    throw new Error(
      'A quantidade de férias em dobro deve ser um inteiro não negativo.'
    );
  }

  if (
    !Number.isInteger(dependents) ||
    dependents < 0
  ) {
    throw new Error(
      'A quantidade de dependentes deve ser um inteiro não negativo.'
    );
  }

  const periodsDue =
    vacationPeriodsDue ??
    (hasVencidaVacation ? 1 : 0);

  if (hasVencidaVacation !== (periodsDue > 0)) {
    throw new Error(
      'A situação das férias vencidas não corresponde à quantidade de períodos informada.'
    );
  }

  if (vacationPeriodsOverdue > periodsDue) {
    throw new Error(
      'A quantidade de férias em dobro não pode superar os períodos adquiridos informados.'
    );
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (start.getTime() > end.getTime()) {
    throw new Error(
      'A data de admissão não pode ser posterior ao desligamento.'
    );
  }

  if (end.getUTCFullYear() !== TAX_YEAR) {
    throw new Error(
      `Este cálculo utiliza as tabelas tributárias de ${TAX_YEAR}. Atualize as tabelas antes de calcular uma rescisão de outro ano.`
    );
  }

  // ---------------------------------------------------
  // TEMPO DE SERVIÇO
  // ---------------------------------------------------

  const daysWorked = daysBetween(start, end);
  const yearsWorked = completedYears(start, end);

  // ---------------------------------------------------
  // SALDO DE SALÁRIO
  // ---------------------------------------------------

  const monthStart = new Date(
    Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      1
    )
  );

  const salaryPeriodStart =
    start.getTime() > monthStart.getTime()
      ? start
      : monthStart;

  const salaryDays = Math.min(
    30,
    daysBetween(salaryPeriodStart, end)
  );

  const saldoSalario = roundToDecimal(
    (monthlySalary / 30) * salaryDays,
    2
  );

  // ---------------------------------------------------
  // AVISO PRÉVIO
  // ---------------------------------------------------

  let avisoDays = 0;

  if (
    resignationType === 'sem-justa-causa' ||
    resignationType === 'acordo-mutuo'
  ) {
    avisoDays = Math.min(90, 30 + yearsWorked * 3);
  } else if (resignationType === 'pedido-demissao') {
    avisoDays = 30;
  }

  let avisoPrevio = 0;
  let descontoAvisoPrevio = 0;

  if (avisoType === 'indenizado') {
    if (resignationType === 'sem-justa-causa') {
      avisoPrevio = roundToDecimal(
        (monthlySalary / 30) * avisoDays,
        2
      );
    } else if (resignationType === 'acordo-mutuo') {
      avisoPrevio = roundToDecimal(
        (monthlySalary / 30) * (avisoDays / 2),
        2
      );
    } else if (resignationType === 'pedido-demissao') {
      // Considera aviso integral não cumprido.
      // O desconto efetivo depende do caso concreto.
      descontoAvisoPrevio = roundToDecimal(
        monthlySalary,
        2
      );
    }
  }

  /*
   * A projeção do aviso é integral na dispensa sem justa causa.
   * No acordo mútuo, considera-se metade do período indenizado.
   *
   * Como a data de projeção precisa ser expressa em dias inteiros,
   * eventual fração de meio dia é arredondada para cima.
   */
  let noticeProjection = 0;

  if (
    avisoType === 'indenizado' &&
    resignationType === 'sem-justa-causa'
  ) {
    noticeProjection = avisoDays;
  } else if (
    avisoType === 'indenizado' &&
    resignationType === 'acordo-mutuo'
  ) {
    noticeProjection = Math.ceil(avisoDays / 2);
  }

  const projectedEnd = addDays(end, noticeProjection);

  // ---------------------------------------------------
  // 13º SALÁRIO
  // ---------------------------------------------------

  const yearStart = new Date(
    Date.UTC(end.getUTCFullYear(), 0, 1)
  );

  const calculationStart =
    start.getTime() > yearStart.getTime()
      ? start
      : yearStart;

  const actual13Months = Math.min(
    12,
    countCalendarMonths(calculationStart, end)
  );

  const projected13Months = countCalendarMonths(
    calculationStart,
    projectedEnd
  );

  const canReceive13th =
    resignationType !== 'com-justa-causa';

  const decimoTerceiroProporcional =
    canReceive13th
      ? roundToDecimal(
          (monthlySalary / 12) * actual13Months,
          2
        )
      : 0;

  const decimoTerceiroIndenizado =
    canReceive13th && noticeProjection > 0
      ? roundToDecimal(
          (monthlySalary / 12) *
            Math.max(0, projected13Months - actual13Months),
          2
        )
      : 0;

  // ---------------------------------------------------
  // FÉRIAS PROPORCIONAIS E PROJEÇÃO
  // ---------------------------------------------------

  const lastAnniversary = addYears(start, yearsWorked);

  /*
   * Na data efetiva do desligamento, a fração proporcional
   * é limitada a 11 avos. Um período completo já é tratado
   * como período aquisitivo concluído.
   */
  const actualVacationMonths = Math.min(
    11,
    countVacationMonths(lastAnniversary, end)
  );

  /*
   * Na projeção, não limitar a 11 avos.
   * O aviso pode completar o período aquisitivo e gerar
   * avos adicionais do período seguinte.
   */
  const projectedVacationMonths = countVacationMonths(
    lastAnniversary,
    projectedEnd
  );

  const canReceiveProportionalVacation =
    resignationType !== 'com-justa-causa';

  const vacationRate = monthlySalary / 12;

  const actualVacationBase =
    canReceiveProportionalVacation
      ? vacationRate * actualVacationMonths
      : 0;

  const projectedVacationBase =
    canReceiveProportionalVacation
      ? vacationRate * projectedVacationMonths
      : 0;

  const feriasProporcionais = roundToDecimal(
    actualVacationBase * (4 / 3),
    2
  );

  const additionalVacationBase = Math.max(
    0,
    projectedVacationBase - actualVacationBase
  );

  const feriasIndenizadas =
    noticeProjection > 0
      ? roundToDecimal(
          additionalVacationBase * (4 / 3),
          2
        )
      : 0;

  // ---------------------------------------------------
  // FÉRIAS ADQUIRIDAS E NÃO GOZADAS
  // ---------------------------------------------------

  const regularVacationPeriods =
    periodsDue - vacationPeriodsOverdue;

  const regularVacationValue =
    regularVacationPeriods *
    monthlySalary *
    (4 / 3);

  const overdueVacationValue =
    vacationPeriodsOverdue *
    monthlySalary *
    (8 / 3);

  const feriasVencidas = roundToDecimal(
    regularVacationValue + overdueVacationValue,
    2
  );

  // ---------------------------------------------------
  // MULTA DO FGTS
  // ---------------------------------------------------

  let multaRate = 0;

  if (resignationType === 'sem-justa-causa') {
    multaRate = 0.40;
  } else if (resignationType === 'acordo-mutuo') {
    multaRate = 0.20;
  }

  const multaFgts =
    multaRate > 0 &&
    fgtsBaseForTermination !== undefined
      ? roundToDecimal(
          fgtsBaseForTermination * multaRate,
          2
        )
      : 0;

  // ---------------------------------------------------
  // INSS
  // ---------------------------------------------------

  /*
   * Saldo salarial e 13º são apurados separadamente.
   * O 13º relativo ao aviso indenizado integra a base
   * previdenciária do décimo terceiro.
   *
   * Aviso indenizado e férias indenizadas não entram
   * nas bases utilizadas nesta estimativa.
   */
  const inssSalario = calculateINSS(saldoSalario);

  const total13th = roundToDecimal(
    decimoTerceiroProporcional +
      decimoTerceiroIndenizado,
    2
  );

  const inssDecimoTerceiro = calculateINSS(total13th);

  const inssDescontoTotal = roundToDecimal(
    inssSalario + inssDecimoTerceiro,
    2
  );

  // ---------------------------------------------------
  // IRRF
  // ---------------------------------------------------

  /*
   * O salário e o 13º são calculados separadamente.
   * O décimo terceiro possui tributação exclusiva na fonte.
   * A redução de IRRF de 2026 também se aplica ao 13º.
   */
  const irrfSalario = calculateIRRF(
    saldoSalario,
    inssSalario,
    dependents
  );

  const irrf13th = calculateIRRF(
    total13th,
    inssDecimoTerceiro,
    dependents
  );

  const irrfDescontoTotal = roundToDecimal(
    irrfSalario + irrf13th,
    2
  );

  // ---------------------------------------------------
  // TOTALIZAÇÃO
  // ---------------------------------------------------

  const totalVencimentos = roundToDecimal(
    saldoSalario +
      avisoPrevio +
      decimoTerceiroProporcional +
      decimoTerceiroIndenizado +
      feriasProporcionais +
      feriasIndenizadas +
      feriasVencidas,
    2
  );

  /*
   * A multa do FGTS é apresentada separadamente.
   * O desconto de aviso prévio é uma dedução distinta
   * dos descontos previdenciários e tributários.
   */
  const totalLiquido = roundToDecimal(
    totalVencimentos -
      inssDescontoTotal -
      irrfDescontoTotal -
      descontoAvisoPrevio,
    2
  );

  // ---------------------------------------------------
  // OBSERVAÇÕES
  // ---------------------------------------------------

  const calculationNotes: string[] = [
    'Estimativa simplificada. Não substitui o cálculo oficial do eSocial nem a conferência do profissional responsável pela rescisão.',
    'As tabelas de INSS e IRRF utilizadas são as de 2026.',
    'O cálculo considera salário mensal fixo. Não inclui médias de horas extras, comissões, adicionais ou outras verbas habituais.',
    'A multa do FGTS é calculada somente quando a base rescisória real é informada.',
    'A multa do FGTS é depositada na conta vinculada e não está incluída no total líquido apresentado.',
    'O cálculo de férias adquiridas depende da quantidade de períodos informada e da identificação dos períodos sujeitos ao pagamento em dobro.',
    'Não são considerados pensão alimentícia, adiantamentos, faltas, outros descontos ou deduções específicas além das informadas.',
  ];

  if (
    multaRate > 0 &&
    fgtsBaseForTermination === undefined
  ) {
    calculationNotes.push(
      'A multa do FGTS não foi calculada porque a base rescisória não foi informada.'
    );
  }

  if (
    hasVencidaVacation &&
    vacationPeriodsDue === undefined
  ) {
    calculationNotes.push(
      'Foi considerado apenas um período de férias adquirido e não gozado. Confirme se existem períodos adicionais.'
    );
  }

  if (vacationPeriodsOverdue > 0) {
    calculationNotes.push(
      'Foi considerado pagamento em dobro para os períodos de férias informados como vencidos além do prazo concessivo.'
    );
  }

  if (resignationType === 'acordo-mutuo') {
    calculationNotes.push(
      'No acordo mútuo, o aviso prévio indenizado foi calculado pela metade, conforme o art. 484-A da CLT. A projeção do período também considera metade do aviso.'
    );
  }

  if (
    resignationType === 'pedido-demissao' &&
    avisoType === 'indenizado'
  ) {
    calculationNotes.push(
      'Foi considerado o desconto de 30 dias de aviso prévio não cumprido. O desconto efetivo depende das condições da rescisão e de eventual norma coletiva aplicável.'
    );
  }

  if (resignationType === 'com-justa-causa') {
    calculationNotes.push(
      'Na justa causa, foram consideradas apenas as verbas compatíveis com essa modalidade: saldo de salário e férias adquiridas não gozadas.'
    );
  }

  if (noticeProjection > 0) {
    calculationNotes.push(
      `A projeção do aviso prévio considerada no cálculo foi de ${noticeProjection} dias.`
    );
  }

  return {
    saldoSalario,
    avisoPrevio,
    avisoDays,
    descontoAvisoPrevio,
    decimoTerceiroProporcional,
    decimoTerceiroIndenizado,
    feriasProporcionais,
    feriasIndenizadas,
    feriasVencidas,
    multaFgts,
    totalVencimentos,
    inssDescontoTotal,
    irrfDescontoTotal,
    totalLiquido,
    daysWorked,
    calculationNotes,
  };
}
