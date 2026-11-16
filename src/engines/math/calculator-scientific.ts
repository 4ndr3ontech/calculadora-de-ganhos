import {
  evaluateMathExpression,
  type AngleMode,
  type EvaluationResponse,
} from './calculator-parser.ts';
import type { HistoryEntry } from './calculator-basic.ts';

export interface ScientificCalculatorState {
  expression: string;
  displayValue: string;
  angleMode: AngleMode;
  error: string | null;
  justEvaluated: boolean;
  history: HistoryEntry[];
}

const MAX_HISTORY_ITEMS = 30;

export function createInitialScientificState(): ScientificCalculatorState {
  return {
    expression: '',
    displayValue: '0',
    angleMode: 'DEG',
    error: null,
    justEvaluated: false,
    history: [],
  };
}

export function evaluateScientificExpression(
  expression: string,
  angleMode: AngleMode = 'DEG'
): EvaluationResponse {
  return evaluateMathExpression(expression, { angleMode });
}

export function setAngleMode(
  state: ScientificCalculatorState,
  angleMode: AngleMode
): ScientificCalculatorState {
  return {
    ...state,
    angleMode,
  };
}

export function toggleAngleMode(
  state: ScientificCalculatorState
): ScientificCalculatorState {
  return {
    ...state,
    angleMode: state.angleMode === 'DEG' ? 'RAD' : 'DEG',
  };
}

export function appendScientificToken(
  state: ScientificCalculatorState,
  token: string
): ScientificCalculatorState {
  const isOperatorOrPostfix = /^[+\-×÷*/^%!)]$/.test(token.trim());
  const isFunctionCall = /^[a-z]+\($/i.test(token.trim());

  // Se havia erro, limpa ao digitar novo token (exceto fechamento de parêntese)
  if (state.error) {
    if (token === ')') return state;
    return {
      ...state,
      expression: token,
      displayValue: token,
      error: null,
      justEvaluated: false,
    };
  }

  // Após '=', operadores continuam sobre o resultado; novos valores iniciam nova expressão
  if (state.justEvaluated) {
    if (isOperatorOrPostfix) {
      const base = state.displayValue.replace(/\./g, '');
      const nextExpr = `${base}${token}`;
      return {
        ...state,
        expression: nextExpr,
        error: null,
        justEvaluated: false,
      };
    }

    if (isFunctionCall) {
      const base = state.displayValue.replace(/\./g, '');
      const nextExpr = `${token}${base})`;
      return {
        ...state,
        expression: nextExpr,
        error: null,
        justEvaluated: false,
      };
    }

    return {
      ...state,
      expression: token,
      displayValue: token,
      error: null,
      justEvaluated: false,
    };
  }

  // Evita dois separadores decimais consecutivos no mesmo número
  if (token === ',') {
    const trailingNumber = state.expression.match(/(\d+(?:,\d*)?)$/);
    if (trailingNumber && trailingNumber[1].includes(',')) {
      return state;
    }
    if (!trailingNumber) {
      const nextExpr = `${state.expression}0,`;
      return {
        ...state,
        expression: nextExpr,
        displayValue: nextExpr,
        error: null,
      };
    }
  }

  const nextExpr = `${state.expression}${token}`;
  return {
    ...state,
    expression: nextExpr,
    displayValue: nextExpr,
    error: null,
  };
}

/**
 * Aplica transformações rápidas sobre a expressão ou resultado atual
 * (ex: inverso 1/x, quadrado x², cubo x³).
 */
export function applyUnaryWrap(
  state: ScientificCalculatorState,
  mode: 'inv' | 'sq' | 'cube'
): ScientificCalculatorState {
  const target = state.justEvaluated
    ? state.displayValue.replace(/\./g, '')
    : state.expression.trim() || '0';

  const wrapped =
    mode === 'inv'
      ? `1/(${target})`
      : mode === 'sq'
        ? `(${target})^2`
        : `(${target})^3`;

  return {
    ...state,
    expression: wrapped,
    displayValue: wrapped,
    error: null,
    justEvaluated: false,
  };
}

export function backspaceScientific(
  state: ScientificCalculatorState
): ScientificCalculatorState {
  if (state.error) {
    return {
      ...state,
      expression: '',
      displayValue: '0',
      error: null,
      justEvaluated: false,
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

  // Remove nome de função completo com parêntese (ex: "sin(", "cbrt(", "asin(")
  const fnMatch = current.match(/(asin|acos|atan|sin|cos|tan|sqrt|cbrt|log|ln|abs)\($/i);
  const nextExpr = fnMatch
    ? current.slice(0, -fnMatch[0].length)
    : current.slice(0, -1);

  return {
    ...state,
    expression: nextExpr,
    displayValue: nextExpr || '0',
    error: null,
  };
}

export function clearAllScientific(
  state: ScientificCalculatorState
): ScientificCalculatorState {
  return {
    ...state,
    expression: '',
    displayValue: '0',
    error: null,
    justEvaluated: false,
  };
}

export function calculateScientific(
  state: ScientificCalculatorState
): ScientificCalculatorState {
  const expr = state.expression.trim();
  if (!expr) {
    return state;
  }

  // Fecha automaticamente parênteses abertos esquecidos no final da digitação
  const openCount = (expr.match(/\(/g) || []).length;
  const closeCount = (expr.match(/\)/g) || []).length;
  const balancedExpr =
    openCount > closeCount ? `${expr}${')'.repeat(openCount - closeCount)}` : expr;

  const evaluation = evaluateScientificExpression(balancedExpr, state.angleMode);

  if (!evaluation.ok) {
    return {
      ...state,
      expression: balancedExpr,
      error: evaluation.error,
      justEvaluated: false,
    };
  }

  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    expression: `${balancedExpr} [${state.angleMode}]`,
    result: evaluation.formatted,
    rawValue: evaluation.value,
    timestamp: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return {
    ...state,
    expression: balancedExpr,
    displayValue: evaluation.formatted,
    error: null,
    justEvaluated: true,
    history: [entry, ...state.history].slice(0, MAX_HISTORY_ITEMS),
  };
}

export function reuseScientificHistoryItem(
  state: ScientificCalculatorState,
  item: HistoryEntry
): ScientificCalculatorState {
  const cleanNumber = item.result.replace(/\./g, '');
  return {
    ...state,
    expression: cleanNumber,
    displayValue: item.result,
    error: null,
    justEvaluated: false,
  };
}

export function handleScientificKeyboardKey(
  state: ScientificCalculatorState,
  key: string
): ScientificCalculatorState | null {
  if (/^[0-9]$/.test(key)) {
    return appendScientificToken(state, key);
  }
  if (key === '.' || key === ',') {
    return appendScientificToken(state, ',');
  }
  if (key === '+') return appendScientificToken(state, '+');
  if (key === '-') return appendScientificToken(state, '-');
  if (key === '*') return appendScientificToken(state, '×');
  if (key === '/') return appendScientificToken(state, '÷');
  if (key === '^') return appendScientificToken(state, '^');
  if (key === '%') return appendScientificToken(state, '%');
  if (key === '!') return appendScientificToken(state, '!');
  if (key === '(' || key === ')') return appendScientificToken(state, key);
  if (key === 'Enter' || key === '=') return calculateScientific(state);
  if (key === 'Backspace') return backspaceScientific(state);
  if (key === 'Escape') return clearAllScientific(state);
  return null;
}
