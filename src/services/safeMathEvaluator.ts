// Safe Deterministic Math Evaluator
// Evaluates standard arithmetic expressions safely without eval() or new Function()

export function safeEvaluateMath(expression: string): number | null {
  if (!expression || typeof expression !== 'string') return null;

  // 1. Sanitize and tokenize
  let expr = expression
    .replace(/x/gi, '*')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .replace(/\*\*/g, '^');

  // Handle percentages like "15%*850" -> "(15/100)*850"
  expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

  // Validate allowed characters: only numbers, decimal points, parentheses, and operators
  if (!/^[\d+\-*/().^]+$/.test(expr)) {
    return null;
  }

  try {
    let pos = 0;

    function parsePrimary(): number {
      if (pos >= expr.length) throw new Error('Unexpected end of expression');

      if (expr[pos] === '(') {
        pos++; // consume '('
        const val = parseExpression();
        if (expr[pos] === ')') {
          pos++; // consume ')'
        }
        return val;
      }

      if (expr[pos] === '-') {
        pos++;
        return -parsePrimary();
      }

      if (expr[pos] === '+') {
        pos++;
        return parsePrimary();
      }

      const start = pos;
      while (pos < expr.length && ((expr[pos] >= '0' && expr[pos] <= '9') || expr[pos] === '.')) {
        pos++;
      }

      if (start === pos) throw new Error(`Invalid token at ${pos}`);
      return parseFloat(expr.slice(start, pos));
    }

    function parseFactor(): number {
      let val = parsePrimary();
      while (pos < expr.length && expr[pos] === '^') {
        pos++;
        const exponent = parsePrimary();
        val = Math.pow(val, exponent);
      }
      return val;
    }

    function parseTerm(): number {
      let val = parseFactor();
      while (pos < expr.length && (expr[pos] === '*' || expr[pos] === '/')) {
        const op = expr[pos++];
        const right = parseFactor();
        if (op === '*') {
          val = val * right;
        } else {
          if (right === 0) throw new Error('Division by zero');
          val = val / right;
        }
      }
      return val;
    }

    function parseExpression(): number {
      let val = parseTerm();
      while (pos < expr.length && (expr[pos] === '+' || expr[pos] === '-')) {
        const op = expr[pos++];
        const right = parseTerm();
        if (op === '+') {
          val = val + right;
        } else {
          val = val - right;
        }
      }
      return val;
    }

    const result = parseExpression();
    if (pos !== expr.length) return null; // Unparsed trailing tokens
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) return null;

    return Math.round(result * 1e8) / 1e8; // Avoid floating point inaccuracies
  } catch (err) {
    return null;
  }
}
