
import { roundToDecimal } from '../common/rounding';

/**
 * Calcula o pagamento de horas extras de 50% e 100%.
 *
 * Premissas:
 * - O percentual de 50% representa o adicional mínimo constitucional.
 * - O percentual de 100% é informado previamente pela classificação
 *   da jornada, conforme acordo, convenção ou regra aplicável.
 * - As horas informadas já estão classificadas em cada percentual.
 *
 * Este cálculo não inclui reflexos em DSR, férias, 13º salário,
 * FGTS ou outras verbas trabalhistas.
 */
export function calculateOvertime(
  monthlySalary: number,
  monthlyHours: number,
  overtimeHours50: number,
  overtimeHours100: number
) {
  if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
    throw new Error('O salário mensal deve ser válido e não negativo.');
  }

  if (!Number.isFinite(monthlyHours) || monthlyHours <= 0) {
    throw new Error('A carga horária mensal deve ser maior que zero.');
  }

  if (!Number.isFinite(overtimeHours50) || overtimeHours50 < 0) {
    throw new Error('As horas extras de 50% devem ser válidas e não negativas.');
  }

  if (!Number.isFinite(overtimeHours100) || overtimeHours100 < 0) {
    throw new Error('As horas extras de 100% devem ser válidas e não negativas.');
  }

  // Valor da hora normal.
  const hourlyRate = monthlySalary / monthlyHours;

  // Valor da hora extra com adicional de 50%.
  const rate50 = hourlyRate * 1.5;

  // Valor da hora extra com adicional de 100%.
  const rate100 = hourlyRate * 2;

  // Pagamento total das horas extras.
  const totalOvertimePay =
    overtimeHours50 * rate50 +
    overtimeHours100 * rate100;

  return {
    hourlyRate: roundToDecimal(hourlyRate, 2),
    totalOvertimePay: roundToDecimal(totalOvertimePay, 2),
  };
}
