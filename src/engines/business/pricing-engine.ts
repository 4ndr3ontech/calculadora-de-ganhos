
import { roundToDecimal } from '../common/rounding';

// =====================================================
// MOTOR 1 — FORMAÇÃO DE PREÇO COM MARKUP
// =====================================================

export interface PricingInput {
  unitCost: number;
  operatingExpensesPercentage: number;
  desiredProfitPercentage: number;
}

export interface PricingResult {
  markupMultiplier: number;
  suggestedSalePrice: number;
  grossProfitValue: number;
  netProfitValue: number;
  actualProfitMargin: number;
}

export function calculateMarkupPricing(
  input: PricingInput
): PricingResult {
  const {
    unitCost,
    operatingExpensesPercentage,
    desiredProfitPercentage,
  } = input;

  // Validação do custo unitário.
  if (!Number.isFinite(unitCost) || unitCost < 0) {
    throw new Error('O custo unitário deve ser válido e não negativo.');
  }

  // Validação das despesas operacionais.
  if (
    !Number.isFinite(operatingExpensesPercentage) ||
    operatingExpensesPercentage < 0
  ) {
    throw new Error(
      'O percentual de despesas operacionais deve ser válido e não negativo.'
    );
  }

  // Validação da margem de lucro desejada.
  if (
    !Number.isFinite(desiredProfitPercentage) ||
    desiredProfitPercentage < 0
  ) {
    throw new Error(
      'A margem de lucro desejada deve ser válida e não negativa.'
    );
  }

  // Soma das despesas e do lucro desejado sobre a venda.
  const totalDeductions =
    operatingExpensesPercentage + desiredProfitPercentage;

  if (!Number.isFinite(totalDeductions) || totalDeductions >= 100) {
    throw new Error(
      'A soma das despesas e do lucro não pode atingir ou superar 100%.'
    );
  }

  // Divisor do markup.
  const divisor = 1 - totalDeductions / 100;

  // Preço de venda necessário para cobrir custos,
  // despesas operacionais e lucro desejado.
  const suggestedSalePrice = unitCost / divisor;

  // Multiplicador aplicado sobre o custo.
  const markupMultiplier =
    unitCost > 0 ? suggestedSalePrice / unitCost : 0;

  // Lucro bruto antes das despesas operacionais.
  const grossProfitValue = suggestedSalePrice - unitCost;

  // Lucro líquido estimado após as despesas operacionais.
  const netProfitValue =
    suggestedSalePrice * (desiredProfitPercentage / 100);

  // Margem efetiva de lucro sobre o preço de venda.
  const actualProfitMargin =
    suggestedSalePrice > 0
      ? (netProfitValue / suggestedSalePrice) * 100
      : 0;

  return {
    markupMultiplier: roundToDecimal(markupMultiplier, 2),
    suggestedSalePrice: roundToDecimal(suggestedSalePrice, 2),
    grossProfitValue: roundToDecimal(grossProfitValue, 2),
    netProfitValue: roundToDecimal(netProfitValue, 2),
    actualProfitMargin: roundToDecimal(actualProfitMargin, 1),
  };
}

// =====================================================
// MOTOR 2 — PONTO DE EQUILÍBRIO
// =====================================================

export interface BreakEvenInput {
  fixedCosts: number;
  unitSalePrice: number;
  unitVariableCost: number;
}

export interface BreakEvenResult {
  contributionMargin: number;
  contributionMarginRatio: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
}

export function calculateBreakEven(
  input: BreakEvenInput
): BreakEvenResult {
  const {
    fixedCosts,
    unitSalePrice,
    unitVariableCost,
  } = input;

  // Validação dos custos fixos.
  if (!Number.isFinite(fixedCosts) || fixedCosts < 0) {
    throw new Error(
      'Os custos fixos devem ser válidos e não negativos.'
    );
  }

  // Validação do preço de venda.
  if (!Number.isFinite(unitSalePrice) || unitSalePrice <= 0) {
    throw new Error(
      'O preço de venda unitário deve ser maior que zero.'
    );
  }

  // Validação do custo variável.
  if (!Number.isFinite(unitVariableCost) || unitVariableCost < 0) {
    throw new Error(
      'O custo variável unitário deve ser válido e não negativo.'
    );
  }

  // Margem de contribuição por unidade.
  const contributionMargin =
    unitSalePrice - unitVariableCost;

  // Não existe ponto de equilíbrio quando a margem
  // de contribuição é zero ou negativa.
  if (contributionMargin <= 0) {
    throw new Error(
      'Não existe ponto de equilíbrio: o preço de venda deve ser maior que o custo variável unitário.'
    );
  }

  // Índice da margem de contribuição.
  const contributionMarginRatio =
    contributionMargin / unitSalePrice;

  // Quantidade de unidades necessárias para cobrir
  // os custos fixos, arredondada para cima.
  const breakEvenUnits =
    Math.ceil(fixedCosts / contributionMargin);

  // Faturamento necessário para atingir o equilíbrio.
  const breakEvenRevenue =
    fixedCosts / contributionMarginRatio;

  return {
    contributionMargin: roundToDecimal(contributionMargin, 2),
    contributionMarginRatio: roundToDecimal(
      contributionMarginRatio * 100,
      1
    ),
    breakEvenUnits,
    breakEvenRevenue: roundToDecimal(breakEvenRevenue, 2),
  };
}
