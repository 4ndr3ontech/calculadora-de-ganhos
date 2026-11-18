
import { roundToDecimal } from '../common/rounding';

export type PjTaxRegime =
  | 'simples-AnexoIII'
  | 'simples-AnexoV'
  | 'mei';

export interface CltPjInput {
  cltGrossSalary: number;
  cltHasBenefits: boolean;
  cltMonthlyBenefits: number;

  pjMonthlyBilling: number;
  pjTaxRegime: PjTaxRegime;
  pjMonthlyExpenses: number;

  // Opcionais: melhoram a precisão da estimativa PJ.
  pjRevenueLast12Months?: number;
  pjMonthlyProLabore?: number;
  meiMonthlyDas?: number;
}

export interface CltPjResult {
  cltAnnualNet: number;
  cltEffectiveMonthly: number;
  cltAnnualFgts: number;

  pjMonthlyTax: number;
  pjMonthlyNet: number;
  pjAnnualNet: number;
  pjMonthlyProvision: number;
  pjAdjustedMonthly: number;

  differenceMonthly: number;
  recommendation: string;
}

/**
 * Tabelas de referência utilizadas nesta estimativa.
 *
 * INSS empregado - 2026:
 * - Até R$ 1.621,00: 7,5%
 * - Até R$ 2.902,84: 9%
 * - Até R$ 4.354,27: 12%
 * - Até R$ 8.475,55: 14%
 *
 * IRRF mensal - 2026:
 * - Até R$ 2.428,80: isento
 * - Até R$ 2.826,65: 7,5%
 * - Até R$ 3.751,05: 15%
 * - Até R$ 4.664,68: 22,5%
 * - Acima: 27,5%
 *
 * Não substitui cálculo oficial de folha ou orientação contábil.
 */

const INSS_2026 = [
  { limit: 1621.00, rate: 0.075 },
  { limit: 2902.84, rate: 0.09 },
  { limit: 4354.27, rate: 0.12 },
  { limit: 8475.55, rate: 0.14 },
];

const IRRF_2026 = [
  { limit: 2428.80, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Infinity, rate: 0.275, deduction: 908.73 },
];

const IRRF_SIMPLIFIED_DEDUCTION = 607.20;
const INSS_CEILING_2026 = 8475.55;

/**
 * Calcula o INSS progressivo de empregado em 2026.
 */
function calculateInss2026(base: number): number {
  let contribution = 0;
  let previousLimit = 0;

  const cappedBase = Math.min(
    Math.max(0, base),
    INSS_CEILING_2026
  );

  for (const bracket of INSS_2026) {
    if (cappedBase <= previousLimit) break;

    const taxableInBracket =
      Math.min(cappedBase, bracket.limit) - previousLimit;

    contribution += taxableInBracket * bracket.rate;
    previousLimit = bracket.limit;
  }

  return contribution;
}

/**
 * Calcula o IRRF mensal estimado em 2026.
 *
 * Utiliza a maior dedução entre:
 * - INSS calculado;
 * - Desconto simplificado mensal.
 *
 * Não considera dependentes, pensão alimentícia ou outras deduções.
 */
function calculateIrrf2026(
  grossIncome: number,
  inss: number
): number {
  const deduction = Math.max(
    inss,
    IRRF_SIMPLIFIED_DEDUCTION
  );

  const taxableBase = Math.max(
    0,
    grossIncome - deduction
  );

  const bracket = IRRF_2026.find(
    (item) => taxableBase <= item.limit
  ) ?? IRRF_2026[IRRF_2026.length - 1];

  const taxBeforeReduction = Math.max(
    0,
    taxableBase * bracket.rate - bracket.deduction
  );

  // Redução mensal do IRRF prevista para 2026.
  let taxReduction = 0;

  if (grossIncome <= 5000) {
    taxReduction = 312.89;
  } else if (grossIncome <= 7350) {
    taxReduction = Math.max(
      0,
      978.62 - 0.133145 * grossIncome
    );
  }

  return Math.max(
    0,
    taxBeforeReduction - taxReduction
  );
}

/**
 * Estima o líquido mensal CLT.
 */
function calculateCltMonthlyNet(grossSalary: number): number {
  const inss = calculateInss2026(grossSalary);
  const irrf = calculateIrrf2026(grossSalary, inss);

  return Math.max(
    0,
    grossSalary - inss - irrf
  );
}

/**
 * Calcula a alíquota efetiva do Simples Nacional.
 *
 * Utiliza receita bruta acumulada em 12 meses (RBT12),
 * alíquota nominal e parcela a deduzir.
 */
function calculateSimplesEffectiveRate(
  revenueLast12Months: number,
  regime: 'simples-AnexoIII' | 'simples-AnexoV'
): number {
  const brackets = regime === 'simples-AnexoIII'
    ? [
        { limit: 180000, rate: 0.06, deduction: 0 },
        { limit: 360000, rate: 0.112, deduction: 9360 },
        { limit: 720000, rate: 0.135, deduction: 17640 },
        { limit: 1800000, rate: 0.16, deduction: 35640 },
        { limit: 3600000, rate: 0.21, deduction: 125640 },
        { limit: 4800000, rate: 0.33, deduction: 648000 },
      ]
    : [
        { limit: 180000, rate: 0.045, deduction: 0 },
        { limit: 360000, rate: 0.09, deduction: 8100 },
        { limit: 720000, rate: 0.102, deduction: 12420 },
        { limit: 1800000, rate: 0.14, deduction: 39780 },
        { limit: 3600000, rate: 0.22, deduction: 183780 },
        { limit: 4800000, rate: 0.33, deduction: 828000 },
      ];

  if (revenueLast12Months <= 0) {
    throw new RangeError(
      'A receita acumulada dos últimos 12 meses precisa ser maior que zero quando existe faturamento.'
    );
  }

  const bracket = brackets.find(
    (item) => revenueLast12Months <= item.limit
  );

  if (!bracket) {
    throw new RangeError(
      'A receita acumulada ultrapassa o limite de R$ 4.800.000 do Simples Nacional.'
    );
  }

  return (
    revenueLast12Months * bracket.rate - bracket.deduction
  ) / revenueLast12Months;
}

/**
 * Valida os dados recebidos.
 */
function validateInput(input: CltPjInput): void {
  const {
    cltGrossSalary,
    cltMonthlyBenefits,
    pjMonthlyBilling,
    pjMonthlyExpenses,
    pjRevenueLast12Months,
    pjMonthlyProLabore,
    meiMonthlyDas,
  } = input;

  if (typeof input.cltHasBenefits !== 'boolean') {
    throw new Error(
      'A informação sobre recebimento de benefícios precisa ser válida.'
    );
  }

  const values = [
    cltGrossSalary,
    cltMonthlyBenefits,
    pjMonthlyBilling,
    pjMonthlyExpenses,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error(
      'Todos os valores obrigatórios precisam ser números válidos.'
    );
  }

  const optionalValues = [
    pjRevenueLast12Months,
    pjMonthlyProLabore,
    meiMonthlyDas,
  ];

  if (
    optionalValues.some(
      (value) => value !== undefined && !Number.isFinite(value)
    )
  ) {
    throw new Error(
      'Os campos opcionais precisam conter números válidos.'
    );
  }

  if (
    cltGrossSalary < 0 ||
    cltMonthlyBenefits < 0 ||
    pjMonthlyBilling < 0 ||
    pjMonthlyExpenses < 0 ||
    (pjRevenueLast12Months !== undefined &&
      pjRevenueLast12Months < 0) ||
    (pjMonthlyProLabore !== undefined &&
      pjMonthlyProLabore < 0) ||
    (meiMonthlyDas !== undefined && meiMonthlyDas < 0)
  ) {
    throw new RangeError(
      'Os valores financeiros não podem ser negativos.'
    );
  }

  if (
    pjMonthlyProLabore !== undefined &&
    pjMonthlyProLabore > pjMonthlyBilling
  ) {
    throw new RangeError(
      'O pró-labore não pode ser maior que o faturamento mensal.'
    );
  }

  if (
    !['simples-AnexoIII', 'simples-AnexoV', 'mei'].includes(
      input.pjTaxRegime
    )
  ) {
    throw new Error('Regime tributário PJ inválido.');
  }
}

/**
 * Compara a remuneração CLT com a renda estimada como PJ.
 *
 * Premissas:
 * - Referência tributária: tabelas de 2026.
 * - CLT: 12 salários, 13º e adicional de 1/3 de férias.
 * - FGTS é apresentado separadamente, não como dinheiro líquido.
 * - Simples Nacional: alíquota efetiva estimada pelo RBT12.
 * - MEI: DAS mensal informado ou estimativa padrão de serviço.
 * - PJ: provisão equivalente a dois meses de renda líquida
 *   por ano, como referência para 13º e férias.
 *
 * Limitações:
 * - Não considera dependentes ou deduções pessoais no IRRF.
 * - Não calcula regras específicas de todas as atividades do MEI.
 * - Não considera CPP patronal adicional do Anexo IV.
 * - Não calcula distribuição de lucros ou tributação específica
 *   de outras fontes de renda.
 * - Não inclui benefícios não informados pelo usuário.
 */
export function calculateCltVsPj(
  input: CltPjInput
): CltPjResult {
  validateInput(input);

  const {
    cltGrossSalary,
    cltHasBenefits,
    cltMonthlyBenefits,
    pjMonthlyBilling,
    pjTaxRegime,
    pjMonthlyExpenses,
  } = input;

  // =====================================================
  // 1. CÁLCULO CLT
  // =====================================================

  const monthlyBenefitsTotal = cltHasBenefits
    ? cltMonthlyBenefits
    : 0;

  const monthlyCltNet =
    calculateCltMonthlyNet(cltGrossSalary);

  // 12 salários líquidos.
  const annualRegularNet = monthlyCltNet * 12;

  // 13º calculado separadamente.
  const thirteenthInss =
    calculateInss2026(cltGrossSalary);

  const thirteenthIrrf =
    calculateIrrf2026(cltGrossSalary, thirteenthInss);

  const thirteenthNet = Math.max(
    0,
    cltGrossSalary - thirteenthInss - thirteenthIrrf
  );

  // Estimativa do adicional de 1/3 de férias.
  // A diferença marginal é aproximada pela variação do líquido.
  const vacationGrossExtra = cltGrossSalary / 3;

  const vacationExtraNet = Math.max(
    0,
    calculateCltMonthlyNet(
      cltGrossSalary + vacationGrossExtra
    ) - monthlyCltNet
  );

  const cltAnnualNet =
    annualRegularNet +
    thirteenthNet +
    vacationExtraNet +
    monthlyBenefitsTotal * 12;

  const cltEffectiveMonthly =
    cltAnnualNet / 12;

  // FGTS estimado separadamente.
  // Base aproximada: 12 salários + 13º + adicional de férias.
  const cltAnnualFgts =
    (cltGrossSalary * 12 +
      cltGrossSalary +
      vacationGrossExtra) * 0.08;

  // =====================================================
  // 2. CÁLCULO PJ
  // =====================================================

  let pjMonthlyTax = 0;

  if (pjTaxRegime === 'mei') {
    // DAS padrão estimado para MEI prestador de serviços em 2026:
    // 5% do salário mínimo + R$ 5,00 de ISS.
    // O valor pode ser informado conforme a atividade.
    pjMonthlyTax = input.meiMonthlyDas ?? 86.05;
  } else if (pjMonthlyBilling > 0) {
    const revenueLast12Months =
      input.pjRevenueLast12Months ??
      pjMonthlyBilling * 12;

    const effectiveRate = calculateSimplesEffectiveRate(
      revenueLast12Months,
      pjTaxRegime
    );

    pjMonthlyTax =
      pjMonthlyBilling * effectiveRate;
  }

  // INSS e IRRF estimados sobre o pró-labore informado.
  const monthlyProLabore =
    input.pjMonthlyProLabore ?? 0;

  // No MEI, a contribuição previdenciária já está contemplada
  // no DAS. Não aplicar novamente o desconto de 11% nesta estimativa.
  const pjInss = pjTaxRegime === 'mei'
    ? 0
    : Math.min(
        monthlyProLabore * 0.11,
        INSS_CEILING_2026 * 0.11
      );

  const pjIrrf = calculateIrrf2026(
    monthlyProLabore,
    pjInss
  );

  const pjMonthlyNet = Math.max(
    0,
    pjMonthlyBilling -
      pjMonthlyTax -
      pjMonthlyExpenses -
      pjInss -
      pjIrrf
  );

  const pjAnnualNet = pjMonthlyNet * 12;

  // Reserva de dois meses de renda líquida por ano:
  // referência para 13º e período de férias.
  const pjMonthlyProvision =
    pjMonthlyNet * (2 / 12);

  const pjAdjustedMonthly =
    Math.max(0, pjMonthlyNet - pjMonthlyProvision);

  // =====================================================
  // 3. COMPARAÇÃO
  // =====================================================

  const differenceMonthly =
    pjAdjustedMonthly - cltEffectiveMonthly;

  let recommendation: string;

  if (differenceMonthly > 1000) {
    recommendation =
      'A estimativa indica vantagem financeira mensal para o modelo PJ, mesmo após a provisão para férias e 13º. Considere também estabilidade, benefícios, previdência e riscos de períodos sem faturamento.';
  } else if (differenceMonthly < -500) {
    recommendation =
      'A estimativa indica vantagem financeira para o modelo CLT, considerando 13º, adicional de férias e benefícios informados. O FGTS foi calculado separadamente e não está incluído como dinheiro mensal disponível.';
  } else {
    recommendation =
      'Os resultados estimados são próximos. A decisão deve considerar estabilidade, benefícios, custos operacionais, previdência, férias, períodos sem faturamento e condições contratuais.';
  }

  return {
    cltAnnualNet: roundToDecimal(cltAnnualNet),
    cltEffectiveMonthly: roundToDecimal(cltEffectiveMonthly),
    cltAnnualFgts: roundToDecimal(cltAnnualFgts),

    pjMonthlyTax: roundToDecimal(pjMonthlyTax),
    pjMonthlyNet: roundToDecimal(pjMonthlyNet),
    pjAnnualNet: roundToDecimal(pjAnnualNet),
    pjMonthlyProvision: roundToDecimal(pjMonthlyProvision),
    pjAdjustedMonthly: roundToDecimal(pjAdjustedMonthly),

    differenceMonthly: roundToDecimal(differenceMonthly),
    recommendation,
  };
}
