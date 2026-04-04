import { createClient, Entry, Asset } from 'contentful';
import { Document } from '@contentful/rich-text-types';

// Contentful entry field types
export interface BlogPostFields {
  title: string;
  slug: string;
  excerpt: string;
  body: Document;
  coverImage?: Asset;
  author: string;
  publishDate: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export type BlogPostEntry = Entry<BlogPostFields>;

const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

export async function getBlogPosts(): Promise<BlogPostEntry[]> {
  const response = await client.getEntries<BlogPostFields>({
    content_type: 'blogPost',
    order: ['-fields.publishDate'],
    select: [
      'fields.title',
      'fields.slug',
      'fields.excerpt',
      'fields.coverImage',
      'fields.author',
      'fields.publishDate',
      'fields.tags',
    ],
  });

  return response.items;
}

export async function getBlogPost(slug: string): Promise<BlogPostEntry | null> {
  const response = await client.getEntries<BlogPostFields>({
    content_type: 'blogPost',
    'fields.slug': slug,
    limit: 1,
  });

  return response.items[0] || null;
}
