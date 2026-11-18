
import {
  evaluateMathExpression,
  formatBrazilianNumber,
} from './calculator-parser.ts';

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  rawValue: number;
  timestamp: string;
}

export interface BasicCalculatorState {
  expression: string;
  displayValue: string;
  error: string | null;
  justEvaluated: boolean;
  history: HistoryEntry[];
}

const OPERATORS = new Set(['+', '-', '×', '÷', '*', '/']);
const MAX_HISTORY_ITEMS = 30;

export function createInitialBasicState(): BasicCalculatorState {
  return {
    expression: '',
    displayValue: '0',
    error: null,
    justEvaluated: false,
    history: [],
  };
}

/**
 * Converte a expressão exibida (com vírgulas e símbolos visuais)
 * e calcula utilizando exclusivamente o parser seguro.
 */
export function evaluateBasicExpression(expression: string) {
  return evaluateMathExpression(expression, { angleMode: 'DEG' });
}

/**
 * Converte um número formatado no padrão brasileiro para uma
 * representação numérica que pode ser reutilizada na expressão.
 *
 * Exemplo: 1.234,56 -> 1234,56
 */
function normalizeDisplayNumber(value: string): string {
  return value.replace(/\./g, '').trim();
}

/**
 * Extrai o último operando numérico da expressão atual para manipulação
 * de decimal, inversão de sinal (±) ou porcentagem (%).
 */
function extractTrailingOperand(expr: string): {
  prefix: string;
  operand: string;
} {
  const trimmed = expr.trim();

  if (!trimmed) {
    return { prefix: '', operand: '' };
  }

  // Captura um número no final, inclusive negativo ou entre parênteses.
  const match = trimmed.match(/^(.*?)(\(?-?\d+(?:,\d*)?\)?)$/);

  if (!match) {
    return { prefix: trimmed, operand: '' };
  }

  return {
    prefix: match[1],
    operand: match[2],
  };
}

export function inputDigit(
  state: BasicCalculatorState,
  digit: string
): BasicCalculatorState {
  if (!/^[0-9]$/.test(digit)) {
    return state;
  }

  // Recuperação automática após erro ou novo cálculo após '='.
  if (state.error || state.justEvaluated) {
    return {
      ...state,
      expression: digit,
      displayValue: digit,
      error: null,
      justEvaluated: false,
    };
  }

  const currentExpr = state.expression;
  const { prefix, operand } = extractTrailingOperand(currentExpr);

  // Evita zeros à esquerda redundantes como "00" ou "5 + 00".
  if (operand === '0') {
    const nextExpr = `${prefix}${digit}`;

    return {
      ...state,
      expression: nextExpr,
      displayValue: digit,
      error: null,
    };
  }

  if (operand === '-0') {
    const nextExpr = `${prefix}-${digit}`;

    return {
      ...state,
      expression: nextExpr,
      displayValue: `-${digit}`,
      error: null,
    };
  }

  // Se o último token foi '%' ou ')', insere multiplicação implícita.
  const needsMultiply = /[)%]$/.test(currentExpr.trim());

  const nextExpr = needsMultiply
    ? `${currentExpr.trim()} × ${digit}`
    : `${currentExpr}${digit}`;

  const updated = extractTrailingOperand(nextExpr);

  return {
    ...state,
    expression: nextExpr,
    displayValue: updated.operand || digit,
    error: null,
  };
}

export function inputDecimal(
  state: BasicCalculatorState
): BasicCalculatorState {
  if (state.error || state.justEvaluated) {
    return {
      ...state,
      expression: '0,',
      displayValue: '0,',
      error: null,
      justEvaluated: false,
    };
  }

  const currentExpr = state.expression;
  const { operand } = extractTrailingOperand(currentExpr);

  // Impede múltiplos separadores decimais no mesmo número.
  if (operand.includes(',')) {
    return state;
  }

  if (!operand) {
    const trimmed = currentExpr.trim();
    const needsMultiply = /[)%]$/.test(trimmed);
    const spacer = trimmed && !currentExpr.endsWith(' ') ? ' ' : '';

    const nextExpr = needsMultiply
      ? `${trimmed} × 0,`
      : `${currentExpr}${spacer}0,`;

    return {
      ...state,
      expression: nextExpr,
      displayValue: '0,',
      error: null,
    };
  }

  const nextExpr = `${currentExpr},`;

  return {
    ...state,
    expression: nextExpr,
    displayValue: `${operand},`,
    error: null,
  };
}

export function inputOperator(
  state: BasicCalculatorState,
  rawOperator: string
): BasicCalculatorState {
  const symbolMap: Record<string, string> = {
    '+': '+',
    '-': '-',
    '*': '×',
    '×': '×',
    '/': '÷',
    '÷': '÷',
  };

  const op = symbolMap[rawOperator];

  if (!op) {
    return state;
  }

  // Se estava em estado de erro, ignora operadores exceto '-'.
  if (state.error) {
    if (op === '-') {
      return {
        ...state,
        expression: '-',
        displayValue: '-',
        error: null,
        justEvaluated: false,
      };
    }

    return state;
  }

  // Encadeamento após '=' usando o resultado sem separador de milhar.
  if (state.justEvaluated) {
    const previousResult = normalizeDisplayNumber(state.displayValue);

    return {
      ...state,
      expression: `${previousResult} ${op} `,
      error: null,
      justEvaluated: false,
    };
  }

  const trimmed = state.expression.trim();

  // Permite iniciar expressão com número negativo.
  if (!trimmed) {
    if (op === '-') {
      return {
        ...state,
        expression: '-',
        displayValue: '-',
        error: null,
      };
    }

    return {
      ...state,
      expression: `0 ${op} `,
      error: null,
    };
  }

  if (trimmed === '-') {
    return state;
  }

  // Substitui o operador final caso o usuário troque de operador.
  const lastChar = trimmed.slice(-1);

  if (OPERATORS.has(lastChar)) {
    const withoutLastOp = trimmed.slice(0, -1).trimEnd();

    return {
      ...state,
      expression: `${withoutLastOp} ${op} `,
      error: null,
    };
  }

  return {
    ...state,
    expression: `${trimmed} ${op} `,
    error: null,
  };
}

export function toggleSign(
  state: BasicCalculatorState
): BasicCalculatorState {
  if (state.error) {
    return state;
  }

  if (state.justEvaluated) {
    const normalized = normalizeDisplayNumber(state.displayValue);
    const evalRes = evaluateBasicExpression(normalized);

    if (!evalRes.ok || evalRes.value === 0) {
      return state;
    }

    const inverted = -evalRes.value;
    const formatted = formatBrazilianNumber(inverted);

    return {
      ...state,
      expression: normalizeDisplayNumber(formatted),
      displayValue: formatted,
      justEvaluated: false,
    };
  }

  const trimmed = state.expression.trim();

  if (!trimmed) {
    return {
      ...state,
      expression: '-',
      displayValue: '-',
    };
  }

  if (trimmed === '-') {
    return {
      ...state,
      expression: '',
      displayValue: '0',
    };
  }

  const { prefix, operand } = extractTrailingOperand(trimmed);

  if (!operand) {
    return state;
  }

  let toggledOperand: string;

  if (operand.startsWith('(-') && operand.endsWith(')')) {
    toggledOperand = operand.slice(2, -1);
  } else if (operand.startsWith('-')) {
    toggledOperand = operand.slice(1);
  } else if (prefix.trim().length > 0) {
    toggledOperand = `(-${operand})`;
  } else {
    toggledOperand = `-${operand}`;
  }

  const nextExpr = `${prefix}${toggledOperand}`;

  return {
    ...state,
    expression: nextExpr,
    displayValue: toggledOperand.replace(/[()]/g, ''),
  };
}

export function applyPercentage(
  state: BasicCalculatorState
): BasicCalculatorState {
  if (state.error) {
    return state;
  }

  if (state.justEvaluated) {
    const normalized = normalizeDisplayNumber(state.displayValue);
    const percentageExpression = `${normalized}%`;
    const res = evaluateBasicExpression(percentageExpression);

    if (!res.ok) {
      return {
        ...state,
        displayValue: 'Erro',
        error: res.error,
        justEvaluated: false,
      };
    }

    return {
      ...state,
      expression: percentageExpression,
      displayValue: res.formatted,
      error: null,
      justEvaluated: true,
    };
  }

  const trimmed = state.expression.trim();

  if (!trimmed) {
    return state;
  }

  const { operand } = extractTrailingOperand(trimmed);

  if (!operand) {
    return state;
  }

  const nextExpr = `${trimmed}%`;
  const preview = evaluateBasicExpression(nextExpr);

  if (!preview.ok) {
    return {
      ...state,
      expression: nextExpr,
      displayValue: 'Erro',
      error: preview.error,
      justEvaluated: false,
    };
  }

  return {
    ...state,
    expression: nextExpr,
    displayValue: preview.formatted,
    error: null,
  };
}

export function backspaceBasic(
  state: BasicCalculatorState
): BasicCalculatorState {
  if (state.error) {
    return {
      ...createInitialBasicState(),
      history: state.history,
    };
  }

  if (state.justEvaluated) {
    return {
      ...state,
      justEvaluated: false,
    };
  }

  const current = state.expression;

  if (!current) {
    return {
      ...state,
      displayValue: '0',
    };
  }

  // Remove operador com espaços (" + ") de uma vez.
  const nextExpr = /\s[+\-×÷]\s$/.test(current)
    ? current.slice(0, -3)
    : current.slice(0, -1);

  const trimmed = nextExpr.trim();
  const { operand } = extractTrailingOperand(trimmed);

  return {
    ...state,
    expression: nextExpr,
    displayValue: operand
      ? operand.replace(/[()]/g, '')
      : trimmed || '0',
    error: null,
  };
}

export function clearEntryBasic(
  state: BasicCalculatorState
): BasicCalculatorState {
  if (state.error || state.justEvaluated) {
    return {
      ...state,
      expression: '',
      displayValue: '0',
      error: null,
      justEvaluated: false,
    };
  }

  const { prefix } = extractTrailingOperand(state.expression.trim());

  return {
    ...state,
    expression: prefix,
    displayValue: '0',
    error: null,
  };
}

export function clearAllBasic(
  state: BasicCalculatorState
): BasicCalculatorState {
  return {
    expression: '',
    displayValue: '0',
    error: null,
    justEvaluated: false,
    history: state.history,
  };
}

export function calculateBasic(
  state: BasicCalculatorState
): BasicCalculatorState {
  const expr = state.expression.trim();

  if (!expr) {
    return state;
  }

  const evaluation = evaluateBasicExpression(expr);

  if (!evaluation.ok) {
    return {
      ...state,
      displayValue: 'Erro',
      error: evaluation.error,
      justEvaluated: false,
    };
  }

  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    expression: expr,
    result: evaluation.formatted,
    rawValue: evaluation.value,
    timestamp: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return {
    ...state,
    displayValue: evaluation.formatted,
    error: null,
    justEvaluated: true,
    history: [entry, ...state.history].slice(0, MAX_HISTORY_ITEMS),
  };
}

export function reuseHistoryItem(
  state: BasicCalculatorState,
  item: HistoryEntry
): BasicCalculatorState {
  const cleanNumber = normalizeDisplayNumber(item.result);

  return {
    ...state,
    expression: cleanNumber,
    displayValue: item.result,
    error: null,
    justEvaluated: false,
  };
}

/**
 * Mapeia teclas físicas do teclado para ações da calculadora padrão.
 * Retorna o novo estado ou null se a tecla não for mapeada.
 */
export function handleBasicKeyboardKey(
  state: BasicCalculatorState,
  key: string
): BasicCalculatorState | null {
  if (/^[0-9]$/.test(key)) {
    return inputDigit(state, key);
  }

  if (key === '.' || key === ',') {
    return inputDecimal(state);
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    return inputOperator(state, key);
  }

  if (key === '%') {
    return applyPercentage(state);
  }

  if (key === 'Enter' || key === '=') {
    return calculateBasic(state);
  }

  if (key === 'Backspace') {
    return backspaceBasic(state);
  }

  if (key === 'Escape') {
    return clearAllBasic(state);
  }

  return null;
}
