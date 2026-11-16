import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialBasicState,
  evaluateBasicExpression,
  inputDigit,
  inputDecimal,
  inputOperator,
  toggleSign,
  applyPercentage,
  backspaceBasic,
  clearAllBasic,
  calculateBasic,
  handleBasicKeyboardKey,
} from '../../../src/engines/math/calculator-basic.ts';

describe('Calculadora Padrão (calculator-basic)', () => {
  it('deve validar todas as operações obrigatórias da especificação', () => {
    const cases: Array<[string, number]> = [
      ['2 + 2', 4],
      ['10 - 5', 5],
      ['8 * 7', 56],
      ['100 / 4', 25],
      ['25%', 0.25],
      ['-5 + 10', 5],
      ['2 + 3 * 4', 14],
      ['(2 + 3) * 4', 20],
      ['0,5 + 0,5', 1],
    ];

    for (const [expr, expected] of cases) {
      const res = evaluateBasicExpression(expr);
      assert.equal(res.ok, true, `Falha em ${expr}`);
      if (res.ok) {
        assert.equal(res.value, expected);
      }
    }

    const divZero = evaluateBasicExpression('10 / 0');
    assert.equal(divZero.ok, false);
  });

  it('deve executar operações encadeadas e atualizar histórico', () => {
    let s = createInitialBasicState();
    s = inputDigit(s, '1');
    s = inputDigit(s, '0');
    s = inputOperator(s, '+');
    s = inputDigit(s, '5');
    s = calculateBasic(s);
    assert.equal(s.displayValue, '15');
    assert.equal(s.history.length, 1);

    // Encadeia novo operador sobre o resultado anterior
    s = inputOperator(s, '*');
    s = inputDigit(s, '2');
    s = calculateBasic(s);
    assert.equal(s.displayValue, '30');
    assert.equal(s.history.length, 2);
  });

  it('deve impedir múltiplos separadores decimais e suportar inversão de sinal', () => {
    let s = createInitialBasicState();
    s = inputDigit(s, '1');
    s = inputDecimal(s);
    s = inputDecimal(s);
    s = inputDigit(s, '5');
    assert.equal(s.displayValue, '1,5');

    s = toggleSign(s);
    assert.equal(s.displayValue, '-1,5');
  });

  it('deve suportar porcentagem, apagar dígito, AC e recuperação de erro', () => {
    let s = createInitialBasicState();
    s = inputDigit(s, '2');
    s = inputDigit(s, '5');
    s = applyPercentage(s);
    assert.equal(s.displayValue, '0,25');

    s = backspaceBasic(s);
    assert.equal(s.expression, '25');

    // Divisão por zero e recuperação
    s = clearAllBasic(s);
    s = inputDigit(s, '9');
    s = inputOperator(s, '/');
    s = inputDigit(s, '0');
    s = calculateBasic(s);
    assert.ok(s.error !== null);

    // Digitar um novo número recupera do estado de erro
    s = inputDigit(s, '4');
    assert.equal(s.error, null);
    assert.equal(s.displayValue, '4');
  });

  it('deve responder corretamente ao teclado físico', () => {
    let s = createInitialBasicState();
    for (const key of ['1', '2', '+', '8', 'Enter']) {
      const next = handleBasicKeyboardKey(s, key);
      if (next) s = next;
    }
    assert.equal(s.displayValue, '20');

    const cleared = handleBasicKeyboardKey(s, 'Escape');
    assert.ok(cleared !== null);
    if (cleared) assert.equal(cleared.displayValue, '0');
  });
});
