export const CATEGORY_EN: Record<string, {
  slug: string;
  ptCategory: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}> = {
  financas: {
    slug: "financas",
    ptCategory: "Finanças",
    title: "Finance & Investing Calculators",
    subtitle: "Simulate compound interest, loans, mortgages, and long-term investment growth.",
    description: "Free online financial calculators for compound interest, loans, mortgages, and investment planning.",
    color: "green",
  },
  matematica: {
    slug: "matematica",
    ptCategory: "Matemática",
    title: "Math & Percentage Calculators",
    subtitle: "Solve percentages, proportions, averages, discounts, and sequences instantly.",
    description: "Free online math calculators for percentages, rule of three, averages, GCD/LCM, and scientific calculations.",
    color: "purple",
  },
  conversores: {
    slug: "conversores",
    ptCategory: "Conversores",
    title: "Online Unit & Date Converters",
    subtitle: "Convert temperatures and calculate business days quickly in your browser.",
    description: "Free online converters for temperature scales (Celsius, Fahrenheit, Kelvin) and business days.",
    color: "cyan",
  },
  saude: {
    slug: "saude",
    ptCategory: "Saúde",
    title: "Health & Biometrics Calculators",
    subtitle: "Check BMI, body metrics, and daily caloric needs with clear references.",
    description: "Free online health and biometrics calculators for BMI, ideal weight, and metabolic rate.",
    color: "pink",
  },
  trabalhista: {
    slug: "trabalhista",
    ptCategory: "Trabalhista",
    title: "Labor & Payroll Calculators",
    subtitle: "Simulate net salary, severance pay, vacation pay, 13th salary, overtime, and night shift rates.",
    description: "Free online labor and payroll calculators for net salary, overtime, vacation, severance, and employment comparisons.",
    color: "blue",
  },
  ferramentas: {
    slug: "ferramentas",
    ptCategory: "Ferramentas",
    title: "Digital & Business Utilities",
    subtitle: "Generate secure passwords, count characters, and calculate product markup.",
    description: "Free online productivity and business tools: password generator, text counter, markup, and hourly rate.",
    color: "orange",
  },
};

export const TOOLS_EN: Record<string, { name: string; description: string; badge: string }> = {
  "calculadora-salario-liquido": {
    name: "Net Salary Calculator",
    description: "Calculate net take-home pay after payroll taxes and mandatory deductions.",
    badge: "Payroll",
  },
  "rescisao": {
    name: "Employment Severance Calculator",
    description: "Estimate severance pay, accrued vacation, notice period, and final settlement.",
    badge: "Severance",
  },
  "ferias": {
    name: "Vacation Pay Calculator",
    description: "Calculate gross and net vacation pay including statutory bonuses.",
    badge: "Vacation",
  },
  "decimo-terceiro": {
    name: "13th Salary (Annual Bonus) Calculator",
    description: "Simulate first and second installments of the annual 13th-month salary bonus.",
    badge: "Bonus",
  },
  "horas-extras": {
    name: "Overtime Pay Calculator",
    description: "Calculate 50% and 100% overtime hourly rates and total monthly earnings.",
    badge: "Overtime",
  },
  "adicional-noturno": {
    name: "Night Shift Differential Calculator",
    description: "Calculate additional night shift pay and reduced nocturnal hour equivalents.",
    badge: "Night Shift",
  },
  "clt-vs-pj": {
    name: "Employee (CLT) vs. Contractor (PJ) Comparison",
    description: "Compare net compensation, benefits, and taxes between full-time employment and contracting.",
    badge: "Comparison",
  },
  "seguro-desemprego": {
    name: "Unemployment Insurance Calculator",
    description: "Check eligibility, installment amounts, and duration of unemployment benefits.",
    badge: "Benefits",
  },
  "juros-compostos": {
    name: "Compound Interest Calculator",
    description: "Simulate wealth growth over time with monthly contributions and compound interest.",
    badge: "Investing",
  },
  "simulador-investimentos": {
    name: "Investment Simulator",
    description: "Compare fixed income, inflation-adjusted returns, and long-term portfolio growth.",
    badge: "Portfolio",
  },
  "independencia-financeira": {
    name: "Financial Independence (FIRE)",
    description: "Calculate how much you need to invest to achieve financial freedom.",
    badge: "FIRE",
  },
  "financiamento-imobiliario": {
    name: "Mortgage Calculator",
    description: "Estimate monthly mortgage payments, total interest, and amortization schedules.",
    badge: "Real Estate",
  },
  "comprar-vs-alugar": {
    name: "Buy vs. Rent Calculator",
    description: "Compare the long-term financial impact of buying a home versus renting and investing.",
    badge: "Decision",
  },
  "orcamento-50-30-20": {
    name: "50/30/20 Budget Planner",
    description: "Organize your net income into needs, wants, and savings goals automatically.",
    badge: "Budget",
  },
  "quitacao-antecipada": {
    name: "Early Loan Payoff Calculator",
    description: "See how much interest and time you save by making extra loan payments.",
    badge: "Debt",
  },
  "ponto-de-equilibrio": {
    name: "Break-Even Point Calculator",
    description: "Find the exact sales volume needed to cover fixed and variable costs.",
    badge: "Business",
  },
  "calculadora-emprestimo": {
    name: "Loan Payment Calculator",
    description: "Calculate monthly installments, effective interest rates, and total loan cost.",
    badge: "Credit",
  },
  "quitacao-cartao": {
    name: "Credit Card Payoff Calculator",
    description: "Plan how long it takes to pay off credit card balances and minimize interest.",
    badge: "Credit",
  },
  "custo-real-carro": {
    name: "True Cost of Car Ownership",
    description: "Estimate depreciation, fuel, insurance, maintenance, and opportunity cost.",
    badge: "Vehicle",
  },
  "porcentagem": {
    name: "Percentage Calculator",
    description: "Calculate percentage increases, discounts, and proportional ratios effortlessly.",
    badge: "Percent",
  },
  "regra-de-tres": {
    name: "Rule of Three Calculator",
    description: "Solve direct and inverse proportions step by step in seconds.",
    badge: "Proportion",
  },
  "mdc-mmc": {
    name: "GCD & LCM Calculator",
    description: "Find the Greatest Common Divisor and Least Common Multiple instantaneously.",
    badge: "Arithmetic",
  },
  "media-aritmetica": {
    name: "Arithmetic Mean Calculator",
    description: "Calculate the average of any set of numbers quickly.",
    badge: "Statistics",
  },
  "progressoes": {
    name: "Arithmetic & Geometric Sequences",
    description: "Find the nth term and sum of arithmetic and geometric progressions.",
    badge: "Sequences",
  },
  "calculadora-cientifica": {
    name: "Scientific Calculator",
    description: "Perform trigonometric, logarithmic, exponential, and algebraic operations.",
    badge: "Scientific",
  },
  "desconto": {
    name: "Discount Calculator",
    description: "Calculate final sale price and total savings after applying a percentage discount.",
    badge: "Discount",
  },
  "calculadora-padrao": {
    name: "Standard Online Calculator",
    description: "Clean, fast everyday calculator with keyboard support.",
    badge: "Basic",
  },
  "dolar-real": {
    name: "USD to BRL Live Currency Converter",
    description: "Convert US Dollars (USD) to Brazilian Reais (BRL) with live commercial exchange rates and fee simulation.",
    badge: "Live FX",
  },
  "temperatura": {
    name: "Temperature Converter",
    description: "Convert Celsius, Fahrenheit, and Kelvin instantaneously.",
    badge: "Units",
  },
  "dias-uteis": {
    name: "Business Days Calculator",
    description: "Count working days between two dates excluding weekends.",
    badge: "Dates",
  },
  "biometria": {
    name: "BMI & Biometrics Calculator",
    description: "Check Body Mass Index, ideal weight range, and daily basal metabolic rate.",
    badge: "Health",
  },
  "precificacao-markup": {
    name: "Markup & Pricing Calculator",
    description: "Determine ideal selling prices, profit margins, and break-even points.",
    badge: "Pricing",
  },
  "valor-hora-trabalho": {
    name: "Hourly Rate Calculator",
    description: "Calculate your true hourly rate based on desired income, expenses, and working hours.",
    badge: "Freelance",
  },
  "gerador-senhas": {
    name: "Secure Password Generator",
    description: "Create strong, cryptographically random passwords right in your browser.",
    badge: "Security",
  },
  "contador-texto": {
    name: "Word & Character Counter",
    description: "Count words, characters, sentences, and estimated reading time in real time.",
    badge: "Text",
  },
};
