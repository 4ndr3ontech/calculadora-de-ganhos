
import { roundToDecimal } from '../common/rounding';

export interface BuyVsRentInput {
  propertyValue: number;

  // Entrada total utilizada na compra, incluindo FGTS.
  downPayment: number;

  // Recursos próprios disponíveis para investir no cenário de aluguel.
  // Não inclui FGTS. É independente do valor da entrada.
  ownCapitalAvailable: number;

  annualInterestRate: number;
  financingMonths: number;
  monthlyRent: number;
  propertyAppreciationRate: number;
  investmentReturnRate: number;
  simulationYears: number;
}

export interface BuyVsRentResult {
  financedAmount: number;
  totalPropertyFutureValue: number;
  remainingFinancingBalance: number;
  propertyEquity: number;
  totalInvestmentFutureValue: number;
  buyerInvestmentFutureValue: number;
  buyingNetWorth: number;
  rentingNetWorth: number;
  recommendation: string;
}

function calculateMonthlyPayment(
  principal: number,
  monthlyInterestRate: number,
  months: number
): number {
  if (principal <= 0) return 0;

  if (monthlyInterestRate === 0) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyInterestRate, months);

  return principal * (
    (monthlyInterestRate * factor) / (factor - 1)
  );
}

function validateInput(input: BuyVsRentInput): void {
  const {
    propertyValue,
    downPayment,
    ownCapitalAvailable,
    annualInterestRate,
    financingMonths,
    monthlyRent,
    propertyAppreciationRate,
    investmentReturnRate,
    simulationYears,
  } = input;

  const numericValues = [
    propertyValue,
    downPayment,
    ownCapitalAvailable,
    annualInterestRate,
    financingMonths,
    monthlyRent,
    propertyAppreciationRate,
    investmentReturnRate,
    simulationYears,
  ];

  if (!numericValues.every(Number.isFinite)) {
    throw new Error('Todos os campos precisam conter números válidos.');
  }

  if (propertyValue <= 0) {
    throw new Error('O valor do imóvel precisa ser maior que zero.');
  }

  if (downPayment < 0 || downPayment > propertyValue) {
    throw new Error(
      'A entrada não pode ser negativa nem maior que o valor do imóvel.'
    );
  }

  if (ownCapitalAvailable < 0) {
    throw new Error(
      'O capital próprio disponível para investimento não pode ser negativo.'
    );
  }

  if (annualInterestRate < 0) {
    throw new Error('A taxa de juros do financiamento não pode ser negativa.');
  }

  if (
    !Number.isInteger(financingMonths) ||
    financingMonths <= 0
  ) {
    throw new Error(
      'O prazo do financiamento precisa ser um número inteiro de meses maior que zero.'
    );
  }

  if (monthlyRent < 0) {
    throw new Error('O valor do aluguel não pode ser negativo.');
  }

  if (propertyAppreciationRate <= -100) {
    throw new Error(
      'A taxa de valorização do imóvel precisa ser maior que -100% ao ano.'
    );
  }

  if (investmentReturnRate <= -100) {
    throw new Error(
      'A rentabilidade dos investimentos precisa ser maior que -100% ao ano.'
    );
  }

  if (
    !Number.isInteger(simulationYears) ||
    simulationYears <= 0
  ) {
    throw new Error(
      'O período da simulação precisa ser um número inteiro de anos maior que zero.'
    );
  }
}

/**
 * Compara financeiramente as estratégias de comprar ou alugar um imóvel.
 *
 * Premissas:
 * - Financiamento calculado pelo sistema Price.
 * - Taxas anuais efetivas convertidas em taxas mensais equivalentes.
 * - A taxa do financiamento permanece fixa durante a simulação.
 * - Valorização imobiliária estimada conforme a taxa informada.
 * - Aluguel reajustado em 4% ao ano.
 * - Na alternativa de aluguel, somente o capital próprio informado
 *   é investido inicialmente. FGTS não é considerado dinheiro investível.
 * - O capital próprio disponível para investir no aluguel é independente
 *   da entrada total utilizada na compra.
 * - Na alternativa de compra, a diferença positiva entre aluguel
 *   e prestação é investida.
 * - Na alternativa de aluguel, a diferença positiva entre prestação
 *   e aluguel é investida.
 * - Não há novos aportes após a quitação do financiamento,
 *   exceto quando a diferença entre aluguel e prestação for positiva.
 *
 * Não considera:
 * - IPTU, condomínio, manutenção e seguros.
 * - ITBI, escritura, registro e outras despesas de aquisição.
 * - Custos de venda do imóvel.
 * - Alterações nas taxas de juros ou condições do financiamento.
 * - Impostos e taxas sobre os investimentos.
 *
 * Os resultados são estimativas, não garantias de rentabilidade.
 */
export function calculateBuyVsRent(
  input: BuyVsRentInput
): BuyVsRentResult {
  validateInput(input);

  const {
    propertyValue,
    downPayment,
    ownCapitalAvailable,
    annualInterestRate,
    financingMonths,
    monthlyRent,
    propertyAppreciationRate,
    investmentReturnRate,
    simulationYears,
  } = input;

  const financedAmount = propertyValue - downPayment;
  const simulationMonths = simulationYears * 12;

  // Conversão de taxas anuais efetivas para taxas mensais equivalentes.
  const monthlyInterestRate =
    Math.pow(1 + annualInterestRate / 100, 1 / 12) - 1;

  const monthlyPropertyAppreciation =
    Math.pow(1 + propertyAppreciationRate / 100, 1 / 12) - 1;

  const monthlyInvestmentReturn =
    Math.pow(1 + investmentReturnRate / 100, 1 / 12) - 1;

  const scheduledPayment = calculateMonthlyPayment(
    financedAmount,
    monthlyInterestRate,
    financingMonths
  );

  let remainingBalance = financedAmount;
  let propertyFutureValue = propertyValue;

  // Cenário de aluguel: investe somente o capital próprio disponível.
  let renterInvestmentBalance = ownCapitalAvailable;

  // Cenário de compra: começa sem investimentos adicionais.
  let buyerInvestmentBalance = 0;

  let currentRent = monthlyRent;

  const annualRentIncrease = 0.04;

  for (let month = 1; month <= simulationMonths; month++) {
    // Atualiza o valor de mercado do imóvel.
    propertyFutureValue *=
      1 + monthlyPropertyAppreciation;

    // Calcula o pagamento do financiamento.
    let actualPayment = 0;

    if (remainingBalance > 0 && month <= financingMonths) {
      const interestAmount =
        remainingBalance * monthlyInterestRate;

      const outstandingAmount =
        remainingBalance + interestAmount;

      actualPayment = Math.min(
        scheduledPayment,
        outstandingAmount
      );

      const principalAmortization =
        actualPayment - interestAmount;

      remainingBalance = Math.max(
        0,
        remainingBalance - principalAmortization
      );

      if (remainingBalance < 0.01) {
        remainingBalance = 0;
      }
    }

    // Atualiza os investimentos com a rentabilidade mensal.
    renterInvestmentBalance *=
      1 + monthlyInvestmentReturn;

    buyerInvestmentBalance *=
      1 + monthlyInvestmentReturn;

    // Cenário de aluguel:
    // investe a diferença quando a prestação supera o aluguel.
    const renterMonthlyContribution = Math.max(
      0,
      actualPayment - currentRent
    );

    renterInvestmentBalance +=
      renterMonthlyContribution;

    // Cenário de compra:
    // investe a diferença quando o aluguel supera a prestação.
    const buyerMonthlyContribution = Math.max(
      0,
      currentRent - actualPayment
    );

    buyerInvestmentBalance +=
      buyerMonthlyContribution;

    // Reajusta o aluguel a cada 12 meses.
    if (month % 12 === 0) {
      currentRent *= 1 + annualRentIncrease;
    }
  }

  // Patrimônio líquido do imóvel: valor de mercado menos dívida.
  // Pode ser negativo se o saldo devedor superar o valor do imóvel.
  const propertyEquity =
    propertyFutureValue - remainingBalance;

  // Patrimônio do comprador: patrimônio líquido do imóvel
  // somado aos investimentos acumulados.
  const buyingNetWorth =
    propertyEquity + buyerInvestmentBalance;

  // Patrimônio do locatário: investimentos acumulados.
  const rentingNetWorth =
    renterInvestmentBalance;

  const difference = buyingNetWorth - rentingNetWorth;

  let recommendation: string;

  if (Math.abs(difference) < 0.01) {
    recommendation =
      `No horizonte de ${simulationYears} anos, as duas estratégias apresentam resultados financeiros praticamente equivalentes, considerando as premissas da simulação.`;
  } else if (difference > 0) {
    recommendation =
      `No horizonte de ${simulationYears} anos, a estratégia de **Comprar o Imóvel** apresenta patrimônio estimado maior, considerando o valor líquido do imóvel e os investimentos acumulados. A diferença estimada é de R$ ${roundToDecimal(difference).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
  } else {
    recommendation =
      `No horizonte de ${simulationYears} anos, a estratégia de **Alugar e Investir** apresenta patrimônio estimado maior. A diferença estimada é de R$ ${roundToDecimal(Math.abs(difference)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
  }

  return {
    financedAmount: roundToDecimal(financedAmount),

    totalPropertyFutureValue:
      roundToDecimal(propertyFutureValue),

    remainingFinancingBalance:
      roundToDecimal(remainingBalance),

    propertyEquity:
      roundToDecimal(propertyEquity),

    totalInvestmentFutureValue:
      roundToDecimal(renterInvestmentBalance),

    buyerInvestmentFutureValue:
      roundToDecimal(buyerInvestmentBalance),

    buyingNetWorth:
      roundToDecimal(buyingNetWorth),

    rentingNetWorth:
      roundToDecimal(rentingNetWorth),

    recommendation,
  };
}
