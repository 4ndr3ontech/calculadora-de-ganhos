import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://calculadoradeganhos.com.br',
  output: 'static',
  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
