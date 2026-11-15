
export interface BusinessDaysResult {
  totalDays: number;
  businessDays: number;
  weekends: number;
}

/**
 * Converte uma data no formato YYYY-MM-DD
 * em um número inteiro de dias desde a época Unix.
 *
 * O cálculo utiliza UTC para evitar problemas
 * com fuso horário e horário de verão.
 */
function parseDateToDayNumber(dateStr: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(
      'Data inválida. Utilize o formato AAAA-MM-DD.'
    );
  }

  const [year, month, day] = dateStr
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  // Evita aceitar datas inexistentes, como 31/02.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('A data informada não existe.');
  }

  return Math.floor(date.getTime() / 86400000);
}

/**
 * Calcula dias corridos, dias úteis e finais de semana
 * entre duas datas, incluindo a data inicial e final.
 *
 * Não considera feriados nacionais, estaduais ou municipais.
 */
export function calculateBusinessDays(
  startDateStr: string,
  endDateStr: string
): BusinessDaysResult {
  if (
    typeof startDateStr !== 'string' ||
    typeof endDateStr !== 'string'
  ) {
    throw new TypeError(
      'As datas precisam ser informadas como texto.'
    );
  }

  const startDay = parseDateToDayNumber(startDateStr);
  const endDay = parseDateToDayNumber(endDateStr);

  if (startDay > endDay) {
    throw new RangeError(
      'A data inicial não pode ser posterior à data final.'
    );
  }

  const totalDays = endDay - startDay + 1;

  let businessDays = 0;
  let weekends = 0;

  for (
    let currentDay = startDay;
    currentDay <= endDay;
    currentDay++
  ) {
    // 01/01/1970 foi uma quinta-feira (4).
    const dayOfWeek = (currentDay + 4) % 7;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends++;
    } else {
      businessDays++;
    }
  }

  return {
    totalDays,
    businessDays,
    weekends,
  };
}
