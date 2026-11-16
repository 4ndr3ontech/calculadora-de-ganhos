import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateMathExpression,
  formatBrazilianNumber,
  computeFactorial,
} from '../../../src/engines/math/calculator-parser.ts';

describe('Motor Matemático Seguro (calculator-parser)', () => {
  it('deve respeitar precedência matemática padrão e parênteses', () => {
    const r1 = evaluateMathExpression('2 + 3 * 4');
    assert.equal(r1.ok, true);
    if (r1.ok) assert.equal(r1.value, 14);

    const r2 = evaluateMathExpression('(2 + 3) * 4');
    assert.equal(r2.ok, true);
    if (r2.ok) assert.equal(r2.value, 20);
  });

  it('deve respeitar associatividade à direita na potenciação e precedência unária', () => {
    const r1 = evaluateMathExpression('2 ^ 3 ^ 2');
    assert.equal(r1.ok, true);
    if (r1.ok) assert.equal(r1.value, 512);

    const r2 = evaluateMathExpression('-2 ^ 2');
    assert.equal(r2.ok, true);
    if (r2.ok) assert.equal(r2.value, -4);

    const r3 = evaluateMathExpression('(-2) ^ 2');
    assert.equal(r3.ok, true);
    if (r3.ok) assert.equal(r3.value, 4);
  });

  it('deve suportar símbolos visuais (×, ÷) e vírgula decimal brasileira', () => {
    const r1 = evaluateMathExpression('10 × 2,5 ÷ 5');
    assert.equal(r1.ok, true);
    if (r1.ok) assert.equal(r1.value, 5);

    const r2 = evaluateMathExpression('25%');
    assert.equal(r2.ok, true);
    if (r2.ok) assert.equal(r2.value, 0.25);
  });

  it('deve formatar números no padrão brasileiro', () => {
    assert.equal(formatBrazilianNumber(1234567.89), '1.234.567,89');
    assert.equal(formatBrazilianNumber(0.25), '0,25');
  });

  it('deve tratar erros matemáticos e de sintaxe com segurança', () => {
    assert.equal(evaluateMathExpression('').ok, false);
    assert.equal(evaluateMathExpression('10 / 0').ok, false);
    assert.equal(evaluateMathExpression('(2 + 3').ok, false);
    assert.equal(evaluateMathExpression('2 + 3)').ok, false);
    assert.equal(evaluateMathExpression('2 + * 3').ok, false);
    assert.equal(evaluateMathExpression('alert(1)').ok, false);
    assert.equal(evaluateMathExpression('process.exit()').ok, false);
    assert.throws(() => computeFactorial(-1));
    assert.throws(() => computeFactorial(3.5));
    assert.throws(() => computeFactorial(171));
  });
});
