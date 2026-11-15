import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    category: z.string(),
    author: z.string().default('Equipe Calculadora de Ganhos'),
  }),
});

export const collections = { guides };