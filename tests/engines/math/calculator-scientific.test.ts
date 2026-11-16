import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialScientificState,
  evaluateScientificExpression,
  setAngleMode,
  calculateScientific,
  appendScientificToken,
} from '../../../src/engines/math/calculator-scientific.ts';

describe('Calculadora Científica (calculator-scientific)', () => {
  it('deve validar todas as expressões obrigatórias da especificação (DEG e RAD)', () => {
    const cases: Array<[string, 'DEG' | 'RAD', number]> = [
      ['sin(30)', 'DEG', 0.5],
      ['cos(60)', 'DEG', 0.5],
      ['tan(45)', 'DEG', 1],
      ['sin(π/2)', 'RAD', 1],
      ['sqrt(25)', 'DEG', 5],
      ['cbrt(27)', 'DEG', 3],
      ['log(100)', 'DEG', 2],
      ['ln(e)', 'DEG', 1],
      ['2^10', 'DEG', 1024],
      ['5!', 'DEG', 120],
      ['abs(-15)', 'DEG', 15],
    ];

    for (const [expr, mode, expected] of cases) {
      const res = evaluateScientificExpression(expr, mode);
      assert.equal(res.ok, true, `Falha em ${expr} (${mode})`);
      if (res.ok) {
        assert.ok(
          Math.abs(res.value - expected) < 1e-10,
          `Esperado ${expected}, obtido ${res.value} em ${expr}`
        );
      }
    }

    assert.equal(evaluateScientificExpression('1/0', 'DEG').ok, false);
  });

  it('deve validar funções trigonométricas inversas e troca de modo DEG/RAD', () => {
    const asinDeg = evaluateScientificExpression('asin(0,5)', 'DEG');
    assert.equal(asinDeg.ok, true);
    if (asinDeg.ok) assert.ok(Math.abs(asinDeg.value - 30) < 1e-10);

    const acosDeg = evaluateScientificExpression('acos(0,5)', 'DEG');
    assert.equal(acosDeg.ok, true);
    if (acosDeg.ok) assert.ok(Math.abs(acosDeg.value - 60) < 1e-10);

    const atanRad = evaluateScientificExpression('atan(1)', 'RAD');
    assert.equal(atanRad.ok, true);
    if (atanRad.ok) assert.ok(Math.abs(atanRad.value - Math.PI / 4) < 1e-10);
  });

  it('deve rejeitar domínios inválidos com mensagens controladas', () => {
    assert.equal(evaluateScientificExpression('log(0)', 'DEG').ok, false);
    assert.equal(evaluateScientificExpression('log(-10)', 'DEG').ok, false);
    assert.equal(evaluateScientificExpression('ln(-1)', 'DEG').ok, false);
    assert.equal(evaluateScientificExpression('sqrt(-4)', 'DEG').ok, false);
    assert.equal(evaluateScientificExpression('asin(1,5)', 'DEG').ok, false);
    assert.equal(evaluateScientificExpression('acos(-2)', 'DEG').ok, false);
    assert.equal(evaluateScientificExpression('tan(90)', 'DEG').ok, false);
    assert.equal(evaluateScientificExpression('(-3)!', 'DEG').ok, false);
  });

  it('deve gerenciar estado, fechamento automático de parênteses e histórico', () => {
    let s = createInitialScientificState();
    s = setAngleMode(s, 'DEG');
    s = appendScientificToken(s, 'sin(');
    s = appendScientificToken(s, '30');
    s = calculateScientific(s);

    assert.equal(s.error, null);
    assert.equal(s.displayValue, '0,5');
    assert.equal(s.history.length, 1);
  });
});
