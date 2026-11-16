/**
 * Motor de análise sintática e avaliação matemática segura (Pratt Parser).
 * Não utiliza eval(), new Function() ou execução dinâmica de código.
 */

export type AngleMode = 'DEG' | 'RAD';

export interface ParserOptions {
  angleMode?: AngleMode;
  maxExpressionLength?: number;
  maxTokens?: number;
  maxParenthesesDepth?: number;
  maxOperations?: number;
}

export interface EvaluationResult {
  ok: true;
  value: number;
  formatted: string;
}

export interface EvaluationError {
  ok: false;
  error: string;
}

export type EvaluationResponse = EvaluationResult | EvaluationError;

type TokenType =
  | 'NUMBER'
  | 'OPERATOR'
  | 'FUNCTION'
  | 'CONSTANT'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

const DEFAULT_LIMITS = {
  maxExpressionLength: 300,
  maxTokens: 150,
  maxParenthesesDepth: 20,
  maxOperations: 80,
};

const ALLOWED_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'log',
  'ln',
  'sqrt',
  'cbrt',
  'abs',
]);

const ALLOWED_CONSTANTS = new Set(['pi', 'π', 'e']);

const MAX_FACTORIAL_INPUT = 170;
const EPSILON = 1e-12;

/**
 * Formata um número no padrão brasileiro (vírgula decimal e ponto de milhar),
 * eliminando ruídos residuais de ponto flutuante próximos de zero.
 */
export function formatBrazilianNumber(value: number, maxDecimals: number = 10): string {
  if (!Number.isFinite(value)) {
    return 'Erro';
  }

  const normalized = Math.abs(value) < EPSILON ? 0 : value;

  // Para números extremamente grandes ou muito pequenos, usa notação científica legível
  if (normalized !== 0 && (Math.abs(normalized) >= 1e15 || Math.abs(normalized) < 1e-9)) {
    return normalized.toExponential(6).replace('.', ',');
  }

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: maxDecimals,
    useGrouping: true,
  }).format(normalized);
}

/**
 * Converte expressões com formatação brasileira (vírgula decimal)
 * e símbolos visuais (×, ÷, −, √, ³√) para representação normalizada.
 */
export function normalizeExpressionInput(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/³√\s*\(/g, 'cbrt(')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/√(\d+(?:[.,]\d+)?)/g, 'sqrt($1)')
    .replace(/(\d),(\d)/g, '$1.$2')
    .trim();
}

/**
 * Calcula fatorial exato de inteiros não negativos até 170.
 */
export function computeFactorial(n: number): number {
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    throw new Error('Fatorial inválido: valor não numérico.');
  }
  if (!Number.isInteger(n)) {
    throw new Error('O fatorial é definido apenas para números inteiros.');
  }
  if (n < 0) {
    throw new Error('Não existe fatorial de número negativo.');
  }
  if (n > MAX_FACTORIAL_INPUT) {
    throw new Error(`Limite excedido: o fatorial máximo suportado é ${MAX_FACTORIAL_INPUT}!.`);
  }

  let acc = 1;
  for (let i = 2; i <= n; i++) {
    acc *= i;
  }
  if (!Number.isFinite(acc)) {
    throw new Error('Resultado do fatorial excede o limite numérico.');
  }
  return acc;
}

/**
 * Etapa 1: Tokenização segura da expressão matemática.
 */
function tokenize(expression: string, limits: typeof DEFAULT_LIMITS): Token[] {
  if (expression.length > limits.maxExpressionLength) {
    throw new Error(`A expressão excede o limite de ${limits.maxExpressionLength} caracteres.`);
  }

  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const ch = expression[i];

    // Ignora espaços
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Números (inclui notação científica como 1e-5 ou 2.5E+3)
    if (/[0-9.]/.test(ch)) {
      const start = i;
      let hasDot = false;

      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        if (expression[i] === '.') {
          if (hasDot) {
            throw new Error(`Número inválido com múltiplos separadores decimais na posição ${i + 1}.`);
          }
          hasDot = true;
        }
        i++;
      }

      const numPart = expression.slice(start, i);
      if (numPart === '.') {
        throw new Error(`Separador decimal isolado na posição ${start + 1}.`);
      }

      // Notação científica opcional (ex: 1.5e10 ou 3e-4)
      if (i < expression.length && (expression[i] === 'e' || expression[i] === 'E')) {
        const nextChar = expression[i + 1];
        const afterNext = expression[i + 2];
        const isSciExponent =
          (nextChar !== undefined && /[0-9]/.test(nextChar)) ||
          ((nextChar === '+' || nextChar === '-') && afterNext !== undefined && /[0-9]/.test(afterNext));

        if (isSciExponent) {
          i++; // consome 'e' ou 'E'
          if (expression[i] === '+' || expression[i] === '-') {
            i++;
          }
          while (i < expression.length && /[0-9]/.test(expression[i])) {
            i++;
          }
        }
      }

      const fullNumber = expression.slice(start, i);
      const parsed = Number(fullNumber);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Número inválido ou fora de limite: "${fullNumber}".`);
      }

      tokens.push({ type: 'NUMBER', value: fullNumber, position: start });
      continue;
    }

    // Parênteses
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position: i });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position: i });
      i++;
      continue;
    }

    // Operadores binários/unários/pós-fixos
    if ('+-*/^%!'.includes(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch, position: i });
      i++;
      continue;
    }

    // Constante π
    if (ch === 'π') {
      tokens.push({ type: 'CONSTANT', value: 'π', position: i });
      i++;
      continue;
    }

    // Identificadores (funções ou constantes textuais como pi, e)
    if (/[a-zA-Z]/.test(ch)) {
      const start = i;
      while (i < expression.length && /[a-zA-Z]/.test(expression[i])) {
        i++;
      }
      const ident = expression.slice(start, i).toLowerCase();

      if (ALLOWED_FUNCTIONS.has(ident)) {
        tokens.push({ type: 'FUNCTION', value: ident, position: start });
      } else if (ALLOWED_CONSTANTS.has(ident)) {
        tokens.push({ type: 'CONSTANT', value: ident, position: start });
      } else {
        throw new Error(`Identificador ou função desconhecida: "${expression.slice(start, i)}".`);
      }
      continue;
    }

    throw new Error(`Caractere não permitido na expressão: "${ch}".`);
  }

  if (tokens.length > limits.maxTokens) {
    throw new Error(`A expressão excede o limite de ${limits.maxTokens} elementos.`);
  }

  // Insere multiplicação implícita segura (ex: 2π, 2(3+4), (2+3)(4+5), 2sin(30))
  const expandedTokens = insertImplicitMultiplication(tokens);

  expandedTokens.push({ type: 'EOF', value: '', position: expression.length });
  return expandedTokens;
}

/**
 * Insere multiplicação implícita entre tokens adjacentes compatíveis.
 */
function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const result: Token[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    result.push(current);

    const next = tokens[i + 1];
    if (!next) continue;

    const currentEndsValue =
      current.type === 'NUMBER' ||
      current.type === 'CONSTANT' ||
      current.type === 'RPAREN' ||
      (current.type === 'OPERATOR' && (current.value === '!' || current.value === '%'));

    const nextStartsValue =
      next.type === 'NUMBER' ||
      next.type === 'CONSTANT' ||
      next.type === 'FUNCTION' ||
      next.type === 'LPAREN';

    if (currentEndsValue && nextStartsValue) {
      result.push({ type: 'OPERATOR', value: '*', position: next.position });
    }
  }

  return result;
}

/**
 * Etapa 2, 3 e 4: Pratt Parser com validação de domínio e avaliação controlada.
 */
class MathParser {
  private tokens: Token[];
  private pos = 0;
  private depth = 0;
  private operationCount = 0;
  private angleMode: AngleMode;
  private limits: typeof DEFAULT_LIMITS;

  constructor(tokens: Token[], angleMode: AngleMode, limits: typeof DEFAULT_LIMITS) {
    this.tokens = tokens;
    this.angleMode = angleMode;
    this.limits = limits;
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: 'EOF', value: '', position: 0 };
  }

  private consume(): Token {
    const token = this.peek();
    if (token.type !== 'EOF') {
      this.pos++;
    }
    return token;
  }

  private recordOperation(): void {
    this.operationCount++;
    if (this.operationCount > this.limits.maxOperations) {
      throw new Error(`Limite de ${this.limits.maxOperations} operações por expressão excedido.`);
    }
  }

  private ensureFinite(value: number, contextError?: string): number {
    if (Number.isNaN(value)) {
      throw new Error(contextError || 'Operação matemática indefinida (NaN).');
    }
    if (!Number.isFinite(value)) {
      throw new Error(contextError || 'O resultado ultrapassou o limite numérico suportado.');
    }
    return Math.abs(value) < EPSILON ? 0 : value;
  }

  public parse(): number {
    if (this.peek().type === 'EOF') {
      throw new Error('Digite uma expressão matemática para calcular.');
    }

    const result = this.parseExpression(0);

    if (this.peek().type !== 'EOF') {
      const unexpected = this.peek();
      if (unexpected.type === 'RPAREN') {
        throw new Error('Parêntese de fechamento ")" sem abertura correspondente.');
      }
      throw new Error(`Elemento inesperado "${unexpected.value}" na expressão.`);
    }

    return this.ensureFinite(result);
  }

  private parseExpression(minPrecedence: number): number {
    let left = this.parsePrefix();

    while (true) {
      const token = this.peek();

      // Operadores pós-fixos: ! (fatorial) e % (percentual)
      if (token.type === 'OPERATOR' && (token.value === '!' || token.value === '%')) {
        const postfixPrec = 50;
        if (postfixPrec < minPrecedence) break;

        this.consume();
        this.recordOperation();

        if (token.value === '!') {
          left = this.ensureFinite(computeFactorial(left));
        } else {
          left = this.ensureFinite(left / 100);
        }
        continue;
      }

      // Operadores binários
      if (token.type === 'OPERATOR' && '+-*/^'.includes(token.value)) {
        const { leftBp, rightBp } = this.getInfixBindingPower(token.value);
        if (leftBp < minPrecedence) break;

        this.consume();
        this.recordOperation();
        const right = this.parseExpression(rightBp);
        left = this.applyBinaryOperator(token.value, left, right);
        continue;
      }

      break;
    }

    return left;
  }

  private parsePrefix(): number {
    const token = this.peek();

    // Número literal
    if (token.type === 'NUMBER') {
      this.consume();
      return Number(token.value);
    }

    // Constante matemática (π ou e)
    if (token.type === 'CONSTANT') {
      this.consume();
      return token.value === 'e' ? Math.E : Math.PI;
    }

    // Operadores unários (+x ou -x)
    // Precedência 35 fica abaixo de '^' (40), garantindo que -2^2 = -(2^2) = -4
    if (token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
      this.consume();
      this.recordOperation();
      const operand = this.parseExpression(35);
      return token.value === '-' ? this.ensureFinite(-operand) : operand;
    }

    // Agrupamento com parênteses
    if (token.type === 'LPAREN') {
      this.consume();
      this.depth++;
      if (this.depth > this.limits.maxParenthesesDepth) {
        throw new Error(`Profundidade máxima de ${this.limits.maxParenthesesDepth} parênteses excedida.`);
      }

      if (this.peek().type === 'RPAREN') {
        throw new Error('Parênteses vazios "()" não são permitidos.');
      }

      const inner = this.parseExpression(0);

      if (this.peek().type !== 'RPAREN') {
        throw new Error('Parêntese "(" não foi fechado.');
      }
      this.consume();
      this.depth--;
      return inner;
    }

    // Funções científicas (sin, cos, tan, asin, acos, atan, log, ln, sqrt, cbrt, abs)
    if (token.type === 'FUNCTION') {
      const fnName = this.consume().value;
      if (this.peek().type !== 'LPAREN') {
        throw new Error(`A função "${fnName}" exige parênteses, ex: ${fnName}(x).`);
      }

      this.consume(); // consome '('
      this.depth++;
      if (this.depth > this.limits.maxParenthesesDepth) {
        throw new Error(`Profundidade máxima de ${this.limits.maxParenthesesDepth} parênteses excedida.`);
      }

      if (this.peek().type === 'RPAREN') {
        throw new Error(`Informe um argumento dentro de ${fnName}().`);
      }

      const arg = this.parseExpression(0);

      if (this.peek().type !== 'RPAREN') {
        throw new Error(`Parêntese da função "${fnName}" não foi fechado.`);
      }
      this.consume(); // consome ')'
      this.depth--;

      this.recordOperation();
      return this.applyFunction(fnName, arg);
    }

    if (token.type === 'EOF') {
      throw new Error('Expressão incompleta: falta um número ou operando no final.');
    }

    throw new Error(`Sintaxe inválida próxima a "${token.value}".`);
  }

  private getInfixBindingPower(op: string): { leftBp: number; rightBp: number } {
    switch (op) {
      case '+':
      case '-':
        return { leftBp: 10, rightBp: 11 };
      case '*':
      case '/':
        return { leftBp: 20, rightBp: 21 };
      case '^':
        // Associativo à direita: 2^3^2 = 2^(3^2) = 512
        return { leftBp: 40, rightBp: 40 };
      default:
        throw new Error(`Operador inválido: "${op}".`);
    }
  }

  private applyBinaryOperator(op: string, left: number, right: number): number {
    switch (op) {
      case '+':
        return this.ensureFinite(left + right);
      case '-':
        return this.ensureFinite(left - right);
      case '*':
        return this.ensureFinite(left * right);
      case '/':
        if (right === 0) {
          throw new Error('Não é possível dividir por zero.');
        }
        return this.ensureFinite(left / right);
      case '^': {
        if (left === 0 && right < 0) {
          throw new Error('Zero elevado a expoente negativo resulta em divisão por zero.');
        }
        if (left < 0 && !Number.isInteger(right)) {
          throw new Error('Potência de base negativa com expoente fracionário não é real.');
        }
        const pow = Math.pow(left, right);
        return this.ensureFinite(pow, 'A potência gerou um resultado fora do domínio real.');
      }
      default:
        throw new Error(`Operador não suportado: "${op}".`);
    }
  }

  private toRadians(value: number): number {
    return this.angleMode === 'DEG' ? (value * Math.PI) / 180 : value;
  }

  private fromRadians(radians: number): number {
    return this.angleMode === 'DEG' ? (radians * 180) / Math.PI : radians;
  }

  private applyFunction(fn: string, arg: number): number {
    switch (fn) {
      case 'sin': {
        const rad = this.toRadians(arg);
        return this.ensureFinite(Math.sin(rad));
      }
      case 'cos': {
        const rad = this.toRadians(arg);
        return this.ensureFinite(Math.cos(rad));
      }
      case 'tan': {
        // Verifica assíntotas (90°, 270° em DEG ou π/2 + kπ em RAD)
        if (this.angleMode === 'DEG') {
          const mod = Math.abs(((arg % 180) + 180) % 180);
          if (Math.abs(mod - 90) < 1e-9) {
            throw new Error(`Tangente indefinida para ${arg}° (assíntota vertical).`);
          }
        } else {
          const k = (arg - Math.PI / 2) / Math.PI;
          if (Math.abs(k - Math.round(k)) < 1e-9) {
            throw new Error('Tangente indefinida para múltiplos ímpares de π/2 rad.');
          }
        }
        const rad = this.toRadians(arg);
        return this.ensureFinite(Math.tan(rad), 'Tangente indefinida neste ponto.');
      }
      case 'asin': {
        if (arg < -1 || arg > 1) {
          throw new Error('Arco seno (asin) aceita apenas valores entre -1 e 1.');
        }
        return this.ensureFinite(this.fromRadians(Math.asin(arg)));
      }
      case 'acos': {
        if (arg < -1 || arg > 1) {
          throw new Error('Arco cosseno (acos) aceita apenas valores entre -1 e 1.');
        }
        return this.ensureFinite(this.fromRadians(Math.acos(arg)));
      }
      case 'atan': {
        return this.ensureFinite(this.fromRadians(Math.atan(arg)));
      }
      case 'log': {
        if (arg <= 0) {
          throw new Error('O logaritmo decimal (log) é definido apenas para números maiores que zero.');
        }
        return this.ensureFinite(Math.log10(arg));
      }
      case 'ln': {
        if (arg <= 0) {
          throw new Error('O logaritmo natural (ln) é definido apenas para números maiores que zero.');
        }
        return this.ensureFinite(Math.log(arg));
      }
      case 'sqrt': {
        if (arg < 0) {
          throw new Error('Não existe raiz quadrada real de número negativo.');
        }
        return this.ensureFinite(Math.sqrt(arg));
      }
      case 'cbrt': {
        return this.ensureFinite(Math.cbrt(arg));
      }
      case 'abs': {
        return this.ensureFinite(Math.abs(arg));
      }
      default:
        throw new Error(`Função não suportada: "${fn}".`);
    }
  }
}

/**
 * Avalia uma expressão matemática de forma segura e retorna resultado numérico e formatado.
 */
export function evaluateMathExpression(
  rawExpression: string,
  options: ParserOptions = {}
): EvaluationResponse {
  try {
    if (typeof rawExpression !== 'string') {
      return { ok: false, error: 'A expressão deve ser um texto válido.' };
    }

    const normalized = normalizeExpressionInput(rawExpression);
    if (!normalized) {
      return { ok: false, error: 'Digite uma expressão matemática para calcular.' };
    }

    const limits = {
      maxExpressionLength: options.maxExpressionLength ?? DEFAULT_LIMITS.maxExpressionLength,
      maxTokens: options.maxTokens ?? DEFAULT_LIMITS.maxTokens,
      maxParenthesesDepth: options.maxParenthesesDepth ?? DEFAULT_LIMITS.maxParenthesesDepth,
      maxOperations: options.maxOperations ?? DEFAULT_LIMITS.maxOperations,
    };

    const angleMode: AngleMode = options.angleMode ?? 'DEG';
    const tokens = tokenize(normalized, limits);
    const parser = new MathParser(tokens, angleMode, limits);
    const value = parser.parse();

    return {
      ok: true,
      value,
      formatted: formatBrazilianNumber(value),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Não foi possível calcular a expressão informada.';
    return {
      ok: false,
      error: message,
    };
  }
}