import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { getBlogPost, BlogPostEntry } from '../lib/contentful';

const richTextOptions: Options = {
  renderNode: {
    [BLOCKS.HEADING_1]: (node, children) => (
      <h1 className="text-3xl font-bold text-navy mt-8 mb-4">{children}</h1>
    ),
    [BLOCKS.HEADING_2]: (node, children) => (
      <h2 className="text-2xl font-bold text-navy mt-8 mb-3">{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (node, children) => (
      <h3 className="text-xl font-bold text-navy mt-6 mb-2">{children}</h3>
    ),
    [BLOCKS.HEADING_4]: (node, children) => (
      <h4 className="text-lg font-semibold text-navy mt-6 mb-2">{children}</h4>
    ),
    [BLOCKS.PARAGRAPH]: (node, children) => (
      <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
    ),
    // Contentful wraps each list item's text in a <p>; the arbitrary variants
    // here flatten that paragraph's block layout so the text sits next to the bullet.
    [BLOCKS.UL_LIST]: (node, children) => (
      <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1 pl-4 [&_p]:inline [&_p]:m-0">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (node, children) => (
      <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1 pl-4 [&_p]:inline [&_p]:m-0">{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (node, children) => <li>{children}</li>,
    [BLOCKS.QUOTE]: (node, children) => (
      <blockquote className="border-l-4 border-accent-primary pl-4 italic text-gray-600 my-6">
        {children}
      </blockquote>
    ),
    [BLOCKS.HR]: () => <hr className="my-8 border-gray-200" />,
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const file = node.data?.target?.fields?.file;
      const description = node.data?.target?.fields?.description;
      const title = node.data?.target?.fields?.title;
      if (!file) return null;
      return (
        <figure className="my-6">
          <img
            src={`https:${file.url}`}
            alt={description || title || 'Blog image'}
            className="w-full rounded-lg shadow-md"
          />
          {description && (
            <figcaption className="text-sm text-gray-500 mt-2 text-center italic">
              {description}
            </figcaption>
          )}
        </figure>
      );
    },
    [INLINES.HYPERLINK]: (node, children) => (
      <a
        href={node.data.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-primary hover:text-accent-dark underline transition-colors"
      >
        {children}
      </a>
    ),
  },
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const data = await getBlogPost(slug);
        if (!data) {
          setNotFound(true);
        } else {
          setPost(data);
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Post Not Found | Streetwise Self Defense</title>
        </Helmet>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-navy mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the blog post you're looking for.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 bg-accent-primary hover:bg-accent-dark text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const fields = post.fields;
  const coverUrl = fields.coverImage
    ? `https:${(fields.coverImage as any).fields?.file?.url}`
    : null;
  const coverAlt = fields.coverImage
    ? (fields.coverImage as any).fields?.description || (fields.coverImage as any).fields?.title || fields.title
    : fields.title;
  const seoTitle = fields.seoTitle || fields.title;
  const seoDescription = fields.seoDescription || fields.excerpt;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{seoTitle} | Streetwise Self Defense</title>
        <meta name="description" content={seoDescription} />
      </Helmet>

      {/* Cover Image Hero */}
      {coverUrl && (
        <div className="w-full h-64 md:h-96 overflow-hidden bg-navy">
          <img
            src={coverUrl}
            alt={coverAlt}
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      )}

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-accent-primary hover:text-accent-dark transition-colors font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <div className="mb-8">
          {fields.tags && fields.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {fields.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium bg-accent-light text-accent-primary px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">{fields.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {fields.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(fields.publishDate)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-10">
          {fields.body && documentToReactComponents(fields.body, richTextOptions)}
        </div>

        {/* Bottom Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-accent-primary hover:text-accent-dark transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </article>
    </div>
  );
};

export default BlogPostPage;
