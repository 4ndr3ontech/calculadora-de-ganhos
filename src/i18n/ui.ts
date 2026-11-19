export type Locale = 'pt-BR' | 'en';

export const defaultLang: Locale = 'pt-BR';

export function getLangFromUrl(url: URL): Locale {
  const [, firstSegment] = url.pathname.split('/');
  if (firstSegment === 'en') return 'en';
  return 'pt-BR';
}

export function getSwitchPaths(pathname: string): { pt: string; en: string } {
  const cleanPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const validEnHubs = new Set(['/financas/', '/matematica/', '/trabalhista/', '/conversores/', '/saude/', '/ferramentas/', '/guias/']);

  if (cleanPath === '/' || cleanPath === '/en/') {
    return { pt: '/', en: '/en/' };
  }

  if (cleanPath.startsWith('/en/')) {
    const ptEquivalent = cleanPath.replace(/^\/en/, '') || '/';
    return { pt: ptEquivalent, en: cleanPath };
  }

  if (validEnHubs.has(cleanPath)) {
    return { pt: cleanPath, en: `/en${cleanPath}` };
  }

  // Se estiver dentro de uma ferramenta específica, leva para o hub da categoria em inglês
  const firstCat = `/${cleanPath.split('/')[1]}/`;
  if (validEnHubs.has(firstCat)) {
    return { pt: cleanPath, en: `/en${firstCat}` };
  }

  return { pt: cleanPath, en: '/en/' };
}

export const ui = {
  'pt-BR': {
    'top.contact': 'Contato',
    'top.privacy': 'Privacidade',
    'nav.aria': 'Navegação Principal',
    'nav.mobileTitle': 'Categorias e Calculadoras',
    'nav.home': 'Início',
    'nav.finance': 'Finanças',
    'nav.math': 'Matemática',
    'nav.labor': 'Trabalhista',
    'nav.converters': 'Conversores',
    'nav.health': 'Saúde',
    'nav.tools': 'Ferramentas',
    'nav.guides': 'Guias',
  },
  'en': {
    'top.contact': 'Contact',
    'top.privacy': 'Privacy',
    'nav.aria': 'Main Navigation',
    'nav.mobileTitle': 'Categories & Calculators',
    'nav.home': 'Home',
    'nav.finance': 'Finance',
    'nav.math': 'Math',
    'nav.labor': 'Labor (BR)',
    'nav.converters': 'Converters',
    'nav.health': 'Health',
    'nav.tools': 'Tools',
    'nav.guides': 'Guides',
  },
} as const;

export function useTranslations(lang: Locale) {
  return function t(key: keyof typeof ui['pt-BR']) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}
