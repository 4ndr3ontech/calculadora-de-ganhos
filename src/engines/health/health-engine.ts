
import { roundToDecimal } from '../common/rounding';

// =====================================================
// IMC - ÍNDICE DE MASSA CORPORAL
// =====================================================

export interface IMCResult {
  imc: number;
  classification: string;
}

/**
 * Calcula o Índice de Massa Corporal.
 *
 * Classificação destinada a adultos.
 * O IMC é um indicador de triagem, não um diagnóstico.
 */
export function calculateIMC(
  weightKg: number,
  heightM: number
): IMCResult {
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(heightM)
  ) {
    throw new Error(
      'Peso e altura precisam ser números válidos.'
    );
  }

  if (weightKg <= 0) {
    throw new RangeError(
      'O peso precisa ser maior que zero.'
    );
  }

  if (heightM <= 0) {
    throw new RangeError(
      'A altura precisa ser maior que zero.'
    );
  }

  const imc = weightKg / (heightM * heightM);

  if (!Number.isFinite(imc)) {
    throw new RangeError(
      'Não foi possível calcular o IMC.'
    );
  }

  let classification: string;

  if (imc < 18.5) {
    classification = 'Abaixo do peso';
  } else if (imc < 25) {
    classification = 'Peso normal';
  } else if (imc < 30) {
    classification = 'Sobrepeso';
  } else {
    classification = 'Obesidade';
  }

  return {
    imc: roundToDecimal(imc, 1),
    classification,
  };
}

// =====================================================
// TMB - TAXA METABÓLICA BASAL
// =====================================================

export interface TMBResult {
  tmb: number;
  tdee: number;
}

/**
 * Calcula a Taxa Metabólica Basal pela fórmula
 * de Mifflin-St Jeor.
 *
 * TMB: estimativa de gasto energético em repouso.
 * TDEE: estimativa de gasto energético diário total,
 * considerando o multiplicador de atividade informado.
 */
export function calculateTMB(
  weight: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female',
  activityMultiplier: number
): TMBResult {
  const values = [
    weight,
    heightCm,
    age,
    activityMultiplier,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error(
      'Todos os valores precisam ser números válidos.'
    );
  }

  if (weight <= 0) {
    throw new RangeError(
      'O peso precisa ser maior que zero.'
    );
  }

  if (heightCm <= 0) {
    throw new RangeError(
      'A altura precisa ser maior que zero.'
    );
  }

  if (!Number.isInteger(age) || age < 18) {
    throw new RangeError(
      'A idade precisa ser um número inteiro de pelo menos 18 anos.'
    );
  }

  if (
    gender !== 'male' &&
    gender !== 'female'
  ) {
    throw new Error(
      'Sexo informado inválido para a fórmula selecionada.'
    );
  }

  if (activityMultiplier <= 0) {
    throw new RangeError(
      'O multiplicador de atividade precisa ser maior que zero.'
    );
  }

  // Fórmula de Mifflin-St Jeor.
  let bmr =
    (10 * weight) +
    (6.25 * heightCm) -
    (5 * age);

  bmr = gender === 'male'
    ? bmr + 5
    : bmr - 161;

  if (!Number.isFinite(bmr) || bmr <= 0) {
    throw new RangeError(
      'Não foi possível calcular uma TMB válida com os dados informados.'
    );
  }

  const tdee = bmr * activityMultiplier;

  if (!Number.isFinite(tdee)) {
    throw new RangeError(
      'Não foi possível calcular o gasto energético diário.'
    );
  }

  return {
    tmb: roundToDecimal(bmr),
    tdee: roundToDecimal(tdee),
  };
}

// =====================================================
// CONSUMO DIÁRIO ESTIMADO DE ÁGUA
// =====================================================

/**
 * Estima uma quantidade diária de água utilizando
 * a referência simplificada de 35 ml por kg.
 *
 * O resultado é apresentado em litros.
 * Não representa uma recomendação clínica individual.
 */
export function calculateWaterIntake(
  weightKg: number
): number {
  if (!Number.isFinite(weightKg)) {
    throw new Error(
      'O peso precisa ser um número válido.'
    );
  }

  if (weightKg <= 0) {
    throw new RangeError(
      'O peso precisa ser maior que zero.'
    );
  }

  const waterLiters = weightKg * 0.035;

  if (!Number.isFinite(waterLiters)) {
    throw new RangeError(
      'Não foi possível calcular a estimativa de água.'
    );
  }

  return roundToDecimal(waterLiters, 2);
}
