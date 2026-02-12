import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().default(''),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      // Additional fields for migrated content
      tags: z.array(z.string()).default([]),
      source: z.enum(['hugo', 'blogger', 'new']).optional(),
      originalUrl: z.string().optional(),
    }),
});

const showcase = defineCollection({
  loader: glob({ base: './src/content/showcase', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    published: z.coerce.date(),
    description: z.string(),
    repo: z.string().url(),
    technologies: z.array(z.string()),
    featured: z.boolean().default(false),
    image: z.string().optional(),
  }),
});

export const collections = { blog, showcase };
