export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'Finanças' | 'Trabalhista' | 'Matemática' | 'Conversores' | 'Ferramentas' | 'Saúde';
  icon: string;
  featured: boolean;
  keywords: string[];
  route: string;
  status: 'active' | 'planned';
}

export const TOOLS_DATA: Tool[] = [
  // Finanças (Ativas)
  {
    id: 'juros-compostos',
    name: 'Calculadora de Juros Compostos',
    slug: 'juros-compostos',
    description: 'Simule o crescimento do seu patrimônio com aportes mensais e juros compostos.',
    category: 'Finanças',
    icon: 'trending-up',
    featured: true,
    keywords: ['juros compostos', 'investimentos', 'patrimônio', 'aportes', 'rendimento'],
    route: '/financas/juros-compostos/',
    status: 'active'
  },
  {
    id: 'adicional-noturno',
    name: 'Calculadora de Adicional Noturno',
    slug: 'adicional-noturno',
    description: 'Calcule o valor do acréscimo para o trabalho realizado em horário noturno na CLT.',
    category: 'Trabalhista',
    icon: 'moon',
    featured: false,
    keywords: ['adicional noturno', 'clt', 'horas noturnas', 'trabalho', 'salário'],
    route: '/trabalhista/adicional-noturno/',
    status: 'active'
  },
  {
    id: 'seguro-desemprego',
    name: 'Calculadora de Seguro-Desemprego',
    slug: 'seguro-desemprego',
    description: 'Estime o valor e a quantidade de parcelas do seguro-desemprego em caso de demissão.',
    category: 'Trabalhista',
    icon: 'shield',
    featured: true,
    keywords: ['seguro-desemprego', 'demissão', 'parcelas', 'rescisão', 'benefício'],
    route: '/trabalhista/seguro-desemprego/',
    status: 'active'
  },
  {
    id: 'financiamento-imobiliario',
    name: 'Financiamento Imobiliário',
    slug: 'financiamento-imobiliario',
    description: 'Compare sistemas SAC e Price para compra de imóveis e visualize parcelas.',
    category: 'Finanças',
    icon: 'home',
    featured: true,
    keywords: ['financiamento', 'imóvel', 'sac', 'price', 'hipoteca', 'casa'],
    route: '/financas/financiamento-imobiliario/',
    status: 'active'
  },
  {
    id: 'calculadora-emprestimo',
    name: 'Calculadora de Empréstimos',
    slug: 'calculadora-emprestimo',
    description: 'Calcule parcelas, juros totais e o custo efetivo de empréstimos.',
    category: 'Finanças',
    icon: 'dollar-sign',
    featured: false,
    keywords: ['empréstimo', 'parcelas', 'cet', 'juros'],
    route: '/financas/calculadora-emprestimo/',
    status: 'active'
  },
  {
    id: 'simulador-investimentos',
    name: 'Simulador de Investimentos',
    slug: 'simulador-investimentos',
    description: 'Compare cenários de rentabilidade com diferentes prazos e aportes.',
    category: 'Finanças',
    icon: 'bar-chart',
    featured: false,
    keywords: ['investir', 'rentabilidade', 'cenários', 'poupança'],
    route: '/financas/simulador-investimentos/',
    status: 'active'
  },
  {
    id: 'orcamento-50-30-20',
    name: 'Calculadora de Orçamento (Regra 50-30-20)',
    slug: 'orcamento-50-30-20',
    description: 'Organize seu salário líquido entre necessidades, desejos e investimentos de forma equilibrada.',
    category: 'Finanças',
    icon: 'pie-chart',
    featured: true,
    keywords: ['orçamento', '50-30-20', 'finanças pessoais', 'salário', 'organização'],
    route: '/financas/orcamento-50-30-20/',
    status: 'active'
  },
  {
    id: 'quitacao-cartao',
    name: 'Simulador de Quitação de Cartão de Crédito',
    slug: 'quitacao-cartao',
    description: 'Calcule o tempo necessário para quitar o rotativo do cartão pagando um valor fixo mensal.',
    category: 'Finanças',
    icon: 'credit-card',
    featured: false,
    keywords: ['cartão de crédito', 'rotativo', 'dívida', 'quitação', 'juros'],
    route: '/financas/quitacao-cartao/',
    status: 'active'
  },
  {
    id: 'independencia-financeira',
    name: 'Simulador de Independência Financeira (Regra dos 4%)',
    slug: 'independencia-financeira',
    description: 'Calcule quanto patrimônio você precisa acumular para viver de renda passiva.',
    category: 'Finanças',
    icon: 'shield',
    featured: true,
    keywords: ['independência financeira', 'aposentadoria', 'regra dos 4%', 'renda passiva', 'patrimônio'],
    route: '/financas/independencia-financeira/',
    status: 'active'
  },
  {
    id: 'custo-real-carro',
    name: 'Calculadora de Custo Real do Carro (TCO)',
    slug: 'custo-real-carro',
    description: 'Descubra o custo mensal real do seu veículo somando IPVA, seguro, combustível e depreciação.',
    category: 'Finanças',
    icon: 'truck',
    featured: true,
    keywords: ['carro', 'veículo', 'custo', 'ipva', 'gasolina', 'depreciação'],
    route: '/financas/custo-real-carro/',
    status: 'active'
  },
  {
    id: 'ponto-de-equilibrio',
    name: 'Calculadora de Ponto de Equilíbrio (Break-Even)',
    slug: 'ponto-de-equilibrio',
    description: 'Descubra quantas unidades você precisa vender para cobrir todos os seus custos e começar a lucrar.',
    category: 'Finanças',
    icon: 'trending-up',
    featured: false,
    keywords: ['ponto de equilíbrio', 'break-even', 'custo fixo', 'lucro', 'vendas'],
    route: '/financas/ponto-de-equilibrio/',
    status: 'active'
  },
  {
    id: 'comprar-vs-alugar',
    name: 'Calculadora: Comprar vs. Alugar Imóvel',
    slug: 'comprar-vs-alugar',
    description: 'Compare financeiramente o financiamento imobiliário versus alugar e investir a entrada.',
    category: 'Finanças',
    icon: 'home',
    featured: true,
    keywords: ['comprar', 'alugar', 'imóvel', 'financiamento', 'aluguel', 'investimento'],
    route: '/financas/comprar-vs-alugar/',
    status: 'active'
  },
  {
    id: 'quitacao-antecipada',
    name: 'Calculadora de Quitação e Amortização',
    slug: 'quitacao-antecipada',
    description: 'Calcule a economia de juros ao antecipar parcelas ou amortizar seu financiamento.',
    category: 'Finanças',
    icon: 'dollar-sign',
    featured: false,
    keywords: ['amortização', 'quitação', 'antecipar', 'juros', 'fgts'],
    route: '/financas/quitacao-antecipada/',
    status: 'active'
  },

  // Trabalhista (Ativas)
  {
    id: 'salario-liquido',
    name: 'Calculadora de Salário Líquido',
    slug: 'salario-liquido',
    description: 'Calcule seus descontos de INSS, IRRF e o salário final na CLT.',
    category: 'Trabalhista',
    icon: 'briefcase',
    featured: true,
    keywords: ['salário líquido', 'inss', 'irrf', 'clt', 'descontos'],
    route: '/trabalhista/calculadora-salario-liquido/',
    status: 'active'
  },
  {
    id: 'calculadora-ferias',
    name: 'Calculadora de Férias',
    slug: 'calculadora-ferias',
    description: 'Calcule o valor das férias, abono pecuniário e terço constitucional.',
    category: 'Trabalhista',
    icon: 'calendar',
    featured: true,
    keywords: ['férias', 'abono', 'terço constitucional', 'clt'],
    route: '/trabalhista/ferias/',
    status: 'active'
  },
  {
    id: 'calculadora-13',
    name: 'Calculadora de 13º Salário',
    slug: 'calculadora-13',
    description: 'Simule a primeira e segunda parcela do décimo terceiro salário.',
    category: 'Trabalhista',
    icon: 'award',
    featured: false,
    keywords: ['décimo terceiro', '13 salário', 'gratificação natalina'],
    route: '/trabalhista/decimo-terceiro/',
    status: 'active'
  },
  {
    id: 'calculadora-rescisao',
    name: 'Calculadora de Rescisão',
    slug: 'calculadora-rescisao',
    description: 'Estime valores rescisórios em caso de demissão ou pedido de saída.',
    category: 'Trabalhista',
    icon: 'file-text',
    featured: false,
    keywords: ['rescisão', 'demissão', 'fgts', 'multa rescisória'],
    route: '/trabalhista/rescisao/',
    status: 'active'
  },
  {
    id: 'clt-vs-pj',
    name: 'Calculadora CLT vs. PJ',
    slug: 'clt-vs-pj',
    description: 'Compare seu ganho real entre ser contratado CLT ou prestar serviços como PJ.',
    category: 'Trabalhista',
    icon: 'briefcase',
    featured: true,
    keywords: ['clt', 'pj', 'salario', 'impostos', 'nota fiscal', 'comparativo'],
    route: '/trabalhista/clt-vs-pj/',
    status: 'active'
  },
  {
    id: 'horas-extras',
    name: 'Calculadora de Horas Extras CLT',
    slug: 'horas-extras',
    description: 'Calcule o valor exato das suas horas extras com acréscimo de 50% e 100%.',
    category: 'Trabalhista',
    icon: 'clock',
    featured: false,
    keywords: ['horas extras', 'clt', 'adicional noturno', 'trabalho'],
    route: '/trabalhista/horas-extras/',
    status: 'active'
  },

  // Matemática (Ativas)
  {
    id: 'porcentagem',
    name: 'Calculadora de Porcentagem',
    slug: 'porcentagem',
    description: 'Descubra acréscimos, descontos e variações percentuais com facilidade.',
    category: 'Matemática',
    icon: 'percent',
    featured: true,
    keywords: ['porcentagem', 'desconto', 'aumento'],
    route: '/matematica/porcentagem/',
    status: 'active'
  },
  {
    id: 'regra-de-tres',
    name: 'Regra de Três Simples',
    slug: 'regra-de-tres',
    description: 'Resolva proporções diretas rapidamente passo a passo.',
    category: 'Matemática',
    icon: 'git-commit',
    featured: true,
    keywords: ['regra de três', 'proporção'],
    route: '/matematica/regra-de-tres/',
    status: 'active'
  },
  {
    id: 'media-aritmetica',
    name: 'Média Aritmética',
    slug: 'media-aritmetica',
    description: 'Calcule a média simples de um conjunto de valores.',
    category: 'Matemática',
    icon: 'hash',
    featured: false,
    keywords: ['média', 'aritmética'],
    route: '/matematica/media-aritmetica/',
    status: 'active'
  },
  {
    id: 'desconto',
    name: 'Calculadora de Desconto',
    slug: 'desconto',
    description: 'Calcule o valor economizado e o preço final após aplicar um desconto.',
    category: 'Matemática',
    icon: 'tag',
    featured: false,
    keywords: ['desconto', 'promoção'],
    route: '/matematica/desconto/',
    status: 'active'
  },
  {
    id: 'mdc-mmc',
    name: 'Calculadora de MDC e MMC',
    slug: 'mdc-mmc',
    description: 'Encontre o Máximo Divisor Comum e o Mínimo Múltiplo Comum entre números instantaneamente.',
    category: 'Matemática',
    icon: 'hash',
    featured: true,
    keywords: ['mdc', 'mmc', 'divisivel', 'multiplo', 'divisor', 'matematica'],
    route: '/matematica/mdc-mmc/',
    status: 'active'
  },
  {
    id: 'progressoes-pa-pg',
    name: 'Calculadora de PA e PG (Progressões)',
    slug: 'progressoes',
    description: 'Calcule o enésimo termo e a soma de Progressões Aritméticas e Geométrica.',
    category: 'Matemática',
    icon: 'activity',
    featured: false,
    keywords: ['pa', 'pg', 'progressao aritmetica', 'progressao geometrica', 'termo', 'soma'],
    route: '/matematica/progressoes/',
    status: 'active'
  },

  // Conversores (Ativos)
  {
    id: 'conversor-temperatura',
    name: 'Conversor de Temperatura',
    slug: 'conversor-temperatura',
    description: 'Converta instantaneamente entre Celsius, Fahrenheit e Kelvin.',
    category: 'Conversores',
    icon: 'thermometer',
    featured: true,
    keywords: ['temperatura', 'celsius', 'fahrenheit', 'kelvin', 'conversor'],
    route: '/conversores/temperatura/',
    status: 'active'
  },
  {
    id: 'dias-uteis',
    name: 'Calculadora de Dias Úteis e Prazos',
    slug: 'dias-uteis',
    description: 'Calcule a quantidade exata de dias úteis, fins de semana e dias corridos entre duas datas.',
    category: 'Conversores',
    icon: 'calendar',
    featured: false,
    keywords: ['dias úteis', 'prazos', 'calendário', 'datas', 'contrato'],
    route: '/conversores/dias-uteis/',
    status: 'active'
  },

  // Saúde (Ativas)
  {
    id: 'biometria',
    name: 'Calculadora de Saúde e Biometria',
    slug: 'biometria',
    description: 'Monitore seu Índice de Massa Corporal (IMC), gasto calórico diário (TDEE) e hidratação.',
    category: 'Saúde',
    icon: 'heart',
    featured: true,
    keywords: ['imc', 'tmb', 'tdee', 'calorias', 'água', 'saúde', 'biometria'],
    route: '/saude/biometria/',
    status: 'active'
  },

  // Ferramentas / Utilitários (Ativos)
  {
    id: 'precificacao-markup',
    name: 'Calculadora de Preço de Venda e Markup',
    slug: 'precificacao-markup',
    description: 'Calcule o preço ideal de venda de produtos considerando custos, impostos e margem de lucro.',
    category: 'Ferramentas',
    icon: 'tag',
    featured: true,
    keywords: ['precificação', 'markup', 'margem de lucro', 'preço de venda', 'custo'],
    route: '/ferramentas/precificacao-markup/',
    status: 'active'
  },
  {
    id: 'gerador-senhas',
    name: 'Gerador de Senhas Seguras',
    slug: 'gerador-senhas',
    description: 'Crie senhas fortes e seguras localmente no navegador com total privacidade.',
    category: 'Ferramentas',
    icon: 'shield',
    featured: true,
    keywords: ['gerador de senhas', 'senha forte', 'segurança', 'privacidade'],
    route: '/ferramentas/gerador-senhas/',
    status: 'active'
  },
  {
    id: 'valor-hora-trabalho',
    name: 'Calculadora de Hora de Trabalho (Freelancer)',
    slug: 'valor-hora-trabalho',
    description: 'Descubra quanto cobrar por hora ou projeto com base em suas despesas e meta.',
    category: 'Ferramentas',
    icon: 'clock',
    featured: true,
    keywords: ['freelancer', 'hora de trabalho', 'quanto cobrar', 'preço projeto'],
    route: '/ferramentas/valor-hora-trabalho/',
    status: 'active'
  },
  {
    id: 'contador-texto',
    name: 'Contador de Palavras e Caracteres',
    slug: 'contador-texto',
    description: 'Conte palavras, caracteres, parágrafos e tempo estimado de leitura em tempo real.',
    category: 'Ferramentas',
    icon: 'file-text',
    featured: false,
    keywords: ['contador', 'palavras', 'caracteres', 'texto', 'leitura'],
    route: '/ferramentas/contador-texto/',
    status: 'active'
  }
];

export function getToolsByCategory(category: string): Tool[] {
  return TOOLS_DATA.filter(t => t.category === category && t.status === 'active');
}

export function getFeaturedTools(): Tool[] {
  return TOOLS_DATA.filter(t => t.featured && t.status === 'active');
}