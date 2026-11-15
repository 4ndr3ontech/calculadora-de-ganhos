
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

  // Base real para cálculo da multa rescisória do FGTS.
  // Deve ser informada conforme extrato/base rescisória.
  fgtsBaseForTermination?: number;

  // Quantidade de períodos de férias adquiridos e não gozados.
  // Se omitido, hasVencidaVacation considera um período simples.
  vacationPeriodsDue?: number;

  // Quantidade de períodos vencidos além do prazo concessivo.
  vacationPeriodsOverdue?: number;

  // Quantidade de dependentes para estimativa do IRRF.
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
// CONSTANTES TRIBUTÁRIAS — 2026
// =====================================================

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

// =====================================================
// FUNÇÕES AUXILIARES DE DATA
// =====================================================

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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
  return Math.floor(
    (end.getTime() - start.getTime()) / 86400000
  ) + 1;
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

function completedYears(start: Date, end: Date): number {
  let years = end.getUTCFullYear() - start.getUTCFullYear();

  if (addYears(start, years).getTime() > end.getTime()) {
    years--;
  }

  return Math.max(0, years);
}

// Conta os meses com pelo menos 15 dias de vínculo.
function countProportionalMonths(
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

// =====================================================
// CÁLCULO DE INSS — TABELA PROGRESSIVA 2026
// =====================================================

function calculateINSS(value: number): number {
  if (value <= 0) return 0;

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

    if (base <= bracket.limit) break;
  }

  return roundToDecimal(total, 2);
}

// =====================================================
// CÁLCULO DE IRRF — ESTIMATIVA 2026
// =====================================================

function calculateIRRF(
  taxableIncome: number,
  inss: number,
  dependents: number
): number {
  if (taxableIncome <= 0) return 0;

  const legalDeductions =
    inss + dependents * IRRF_DEPENDENT_DEDUCTION;

  const deduction = Math.max(
    legalDeductions,
    IRRF_SIMPLIFIED_DEDUCTION
  );

  const taxBase = Math.max(
    0,
    taxableIncome - deduction
  );

  const bracket = IRRF_BRACKETS.find(
    (item) => taxBase <= item.limit
  )!;

  let tax =
    taxBase * bracket.rate - bracket.deduction;

  // Redução adicional do IRRF vigente em 2026.
  if (taxableIncome <= 5000) {
    tax = Math.max(0, tax - 312.89);
  } else if (taxableIncome <= 7350) {
    const reduction =
      978.62 - 0.133145 * taxableIncome;

    tax = Math.max(0, tax - reduction);
  }

  return roundToDecimal(Math.max(0, tax), 2);
}

// =====================================================
// MOTOR PRINCIPAL — RESCISÃO CLT
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

  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) {
    throw new Error('O salário mensal deve ser maior que zero.');
  }

  if (
    !['sem-justa-causa', 'com-justa-causa', 'pedido-demissao', 'acordo-mutuo']
      .includes(resignationType)
  ) {
    throw new Error('Tipo de desligamento inválido.');
  }

  if (!['indenizado', 'trabalhado'].includes(avisoType)) {
    throw new Error('Tipo de aviso prévio inválido.');
  }

  if (typeof hasVencidaVacation !== 'boolean') {
    throw new Error('Informe corretamente a situação das férias vencidas.');
  }

  if (
    fgtsBaseForTermination !== undefined &&
    (!Number.isFinite(fgtsBaseForTermination) ||
      fgtsBaseForTermination < 0)
  ) {
    throw new Error('A base do FGTS deve ser válida e não negativa.');
  }

  if (
    vacationPeriodsDue !== undefined &&
    (!Number.isInteger(vacationPeriodsDue) ||
      vacationPeriodsDue < 0)
  ) {
    throw new Error('A quantidade de períodos de férias deve ser válida.');
  }

  if (
    !Number.isInteger(vacationPeriodsOverdue) ||
    vacationPeriodsOverdue < 0 ||
    vacationPeriodsOverdue > (vacationPeriodsDue ?? 1)
  ) {
    throw new Error('A quantidade de férias em dobro é inválida.');
  }

  if (!Number.isInteger(dependents) || dependents < 0) {
    throw new Error('A quantidade de dependentes deve ser válida.');
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (start.getTime() > end.getTime()) {
    throw new Error('A data de admissão não pode ser posterior ao desligamento.');
  }

  // As tabelas tributárias deste motor são de 2026.
  if (end.getUTCFullYear() !== 2026) {
    throw new Error(
      'Este cálculo tributário utiliza as tabelas de 2026. Atualize as tabelas antes de calcular uma rescisão de outro ano.'
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

  const salaryDays = Math.min(30, end.getUTCDate());

  const saldoSalario = roundToDecimal(
    (monthlySalary / 30) * salaryDays,
    2
  );

  // ---------------------------------------------------
  // AVISO PRÉVIO
  // ---------------------------------------------------

  let avisoDays = 30;

  if (
    resignationType === 'sem-justa-causa' ||
    resignationType === 'acordo-mutuo'
  ) {
    avisoDays = Math.min(90, 30 + yearsWorked * 3);
  }

  let avisoPrevio = 0;
  let descontoAvisoPrevio = 0;

  if (avisoType === 'indenizado') {
    if (resignationType === 'sem-justa-causa') {
      avisoPrevio = roundToDecimal(
        (monthlySalary / 30) * avisoDays,
        2
      );
    }

    if (resignationType === 'acordo-mutuo') {
      avisoPrevio = roundToDecimal(
        (monthlySalary / 30) * (avisoDays / 2),
        2
      );
    }

    if (resignationType === 'pedido-demissao') {
      descontoAvisoPrevio = roundToDecimal(
        (monthlySalary / 30) * 30,
        2
      );
    }
  }

  // A projeção integral do aviso indenizado é considerada
  // para os avos de 13º e férias.
  const noticeProjection =
    avisoType === 'indenizado' &&
    (
      resignationType === 'sem-justa-causa' ||
      resignationType === 'acordo-mutuo'
    )
      ? avisoDays
      : 0;

  const projectedEnd = addDays(end, noticeProjection);

  // ---------------------------------------------------
  // 13º SALÁRIO
  // ---------------------------------------------------

  const yearStart = new Date(
    Date.UTC(end.getUTCFullYear(), 0, 1)
  );

  const actual13Months = Math.min(
    12,
    countProportionalMonths(
      start.getTime() > yearStart.getTime() ? start : yearStart,
      end
    )
  );

  const projected13Months = Math.min(
    12,
    countProportionalMonths(
      start.getTime() > yearStart.getTime() ? start : yearStart,
      projectedEnd
    )
  );

  const canReceive13th =
    resignationType !== 'com-justa-causa';

  const decimoTerceiroProporcional = canReceive13th
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
  // FÉRIAS PROPORCIONAIS
  // ---------------------------------------------------

  const lastAnniversary = addYears(
    start,
    yearsWorked
  );

  const actualVacationMonths = Math.min(
    11,
    countProportionalMonths(lastAnniversary, end)
  );

  const projectedVacationMonths = Math.min(
    11,
    countProportionalMonths(lastAnniversary, projectedEnd)
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

  const feriasIndenizadas =
    noticeProjection > 0
      ? roundToDecimal(
          Math.max(
            0,
            projectedVacationBase - actualVacationBase
          ) * (4 / 3),
          2
        )
      : 0;

  // ---------------------------------------------------
  // FÉRIAS VENCIDAS
  // ---------------------------------------------------

  const periodsDue =
    vacationPeriodsDue ??
    (hasVencidaVacation ? 1 : 0);

  const regularVacationPeriods =
    periodsDue - vacationPeriodsOverdue;

  const regularVacationValue =
    regularVacationPeriods * monthlySalary * (4 / 3);

  const overdueVacationValue =
    vacationPeriodsOverdue * monthlySalary * (8 / 3);

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
    multaRate > 0 && fgtsBaseForTermination !== undefined
      ? roundToDecimal(
          fgtsBaseForTermination * multaRate,
          2
        )
      : 0;

  // ---------------------------------------------------
  // INSS
  // ---------------------------------------------------

  // O INSS do 13º é calculado separadamente do salário.
  const inssSalario = calculateINSS(saldoSalario);

  const inssDecimoTerceiro = calculateINSS(
    decimoTerceiroProporcional +
      decimoTerceiroIndenizado
  );

  const inssDescontoTotal = roundToDecimal(
    inssSalario + inssDecimoTerceiro,
    2
  );

  // ---------------------------------------------------
  // IRRF
  // ---------------------------------------------------

  const irrfSalario = calculateIRRF(
    saldoSalario,
    inssSalario,
    dependents
  );

  const total13th =
    decimoTerceiroProporcional +
    decimoTerceiroIndenizado;

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

  let totalVencimentos = 0;

  if (resignationType === 'com-justa-causa') {
    totalVencimentos =
      saldoSalario + feriasVencidas;
  } else {
    totalVencimentos =
      saldoSalario +
      avisoPrevio +
      decimoTerceiroProporcional +
      decimoTerceiroIndenizado +
      feriasProporcionais +
      feriasIndenizadas +
      feriasVencidas;
  }

  const totalLiquido = roundToDecimal(
    totalVencimentos -
      inssDescontoTotal -
      irrfDescontoTotal -
      descontoAvisoPrevio,
    2
  );

  // ---------------------------------------------------
  // OBSERVAÇÕES DO CÁLCULO
  // ---------------------------------------------------

  const calculationNotes: string[] = [
    'Estimativa simplificada. Não substitui o cálculo oficial do eSocial ou a conferência do profissional responsável pela rescisão.',
    'As tabelas de INSS e IRRF utilizadas são as de 2026.',
    'O cálculo considera salário mensal fixo e não inclui médias de horas extras, comissões, adicionais ou outras verbas habituais.',
    'A multa do FGTS é calculada somente quando a base rescisória real é informada.',
    'A multa do FGTS é depositada na conta vinculada e não representa, necessariamente, dinheiro pago diretamente na rescisão.',
    'O cálculo de férias vencidas depende da quantidade de períodos informada e da existência de períodos em dobro.',
    'O desconto de aviso prévio no pedido de demissão pressupõe que o empregado não cumpriu os 30 dias e que o empregador efetuará o desconto.',
    'Não são considerados dependentes, pensão alimentícia ou outras deduções específicas além das informadas.',
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
      'Foi considerado apenas um período simples de férias vencidas. Confirme se existem períodos adicionais ou férias em dobro.'
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
    totalVencimentos: roundToDecimal(totalVencimentos, 2),
    inssDescontoTotal,
    irrfDescontoTotal,
    totalLiquido,
    daysWorked,
    calculationNotes,
  };
}
