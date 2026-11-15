
import { roundToDecimal } from '../common/rounding';

export interface VehicleTCOInput {
  vehiclePrice: number;
  monthlyFuelCost: number;
  monthlyInsurance: number;
  annualIpvaRate: number;
  monthlyMaintenance: number;
  annualDepreciationRate: number;
}

export interface VehicleTCOResult {
  annualIpvaValue: number;
  annualDepreciationValue: number;
  totalMonthlyCost: number;
  costPerYear: number;
}

/**
 * Valida os dados da simulação.
 */
function validateInput(input: VehicleTCOInput): void {
  const {
    vehiclePrice,
    monthlyFuelCost,
    monthlyInsurance,
    annualIpvaRate,
    monthlyMaintenance,
    annualDepreciationRate,
  } = input;

  const values = [
    vehiclePrice,
    monthlyFuelCost,
    monthlyInsurance,
    annualIpvaRate,
    monthlyMaintenance,
    annualDepreciationRate,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error(
      'Todos os valores precisam ser números válidos.'
    );
  }

  if (vehiclePrice <= 0) {
    throw new RangeError(
      'O preço do veículo precisa ser maior que zero.'
    );
  }

  if (
    monthlyFuelCost < 0 ||
    monthlyInsurance < 0 ||
    monthlyMaintenance < 0
  ) {
    throw new RangeError(
      'Os custos mensais não podem ser negativos.'
    );
  }

  if (annualIpvaRate < 0 || annualIpvaRate > 100) {
    throw new RangeError(
      'A alíquota do IPVA precisa estar entre 0% e 100%.'
    );
  }

  if (
    annualDepreciationRate < 0 ||
    annualDepreciationRate > 100
  ) {
    throw new RangeError(
      'A taxa de depreciação precisa estar entre 0% e 100%.'
    );
  }
}

/**
 * Calcula uma estimativa simplificada do custo total
 * mensal e anual de propriedade de um veículo.
 *
 * Premissas:
 * - IPVA calculado sobre o preço informado do veículo.
 * - Depreciação anual calculada sobre o preço inicial.
 * - Custos mensais permanecem constantes.
 * - Não considera valorização ou atualização do preço do veículo.
 * - Não considera financiamento, licenciamento, estacionamento,
 *   pedágios, multas ou custos extraordinários.
 */
export function calculateVehicleTCO(
  input: VehicleTCOInput
): VehicleTCOResult {
  validateInput(input);

  const {
    vehiclePrice,
    monthlyFuelCost,
    monthlyInsurance,
    annualIpvaRate,
    monthlyMaintenance,
    annualDepreciationRate,
  } = input;

  const annualIpvaValue =
    vehiclePrice * (annualIpvaRate / 100);

  const annualDepreciationValue =
    vehiclePrice * (annualDepreciationRate / 100);

  const monthlyIpva =
    annualIpvaValue / 12;

  const monthlyDepreciation =
    annualDepreciationValue / 12;

  const totalMonthlyCost =
    monthlyFuelCost +
    monthlyInsurance +
    monthlyMaintenance +
    monthlyIpva +
    monthlyDepreciation;

  const costPerYear =
    totalMonthlyCost * 12;

  const results = [
    annualIpvaValue,
    annualDepreciationValue,
    totalMonthlyCost,
    costPerYear,
  ];

  if (!results.every(Number.isFinite)) {
    throw new RangeError(
      'Não foi possível calcular os custos do veículo com os valores informados.'
    );
  }

  return {
    annualIpvaValue: roundToDecimal(
      annualIpvaValue
    ),

    annualDepreciationValue: roundToDecimal(
      annualDepreciationValue
    ),

    totalMonthlyCost: roundToDecimal(
      totalMonthlyCost
    ),

    costPerYear: roundToDecimal(
      costPerYear
    ),
  };
}
