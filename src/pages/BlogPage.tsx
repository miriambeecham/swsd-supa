import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { getBlogPosts, BlogPostEntry } from '../lib/contentful';

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getBlogPosts();
        setPosts(data);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      <Helmet>
        <title>Blog | Streetwise Self Defense</title>
        <meta
          name="description"
          content="Self-defense tips, safety news, and updates from Streetwise Self Defense. Learn practical strategies to stay safe and build confidence."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-navy py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Blog</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Self-defense tips, safety strategies, and news from Streetwise Self Defense
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Unable to load blog posts. Please try again later.</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const fields = post.fields;
                const coverUrl = fields.coverImage
                  ? `https:${(fields.coverImage as any).fields?.file?.url}`
                  : null;
                const coverAlt = fields.coverImage
                  ? (fields.coverImage as any).fields?.description || (fields.coverImage as any).fields?.title || fields.title
                  : fields.title;

                return (
                  <Link
                    key={post.sys.id}
                    to={`/blog/${fields.slug}`}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                  >
                    {coverUrl && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={coverUrl}
                          alt={coverAlt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      {fields.tags && fields.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
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
                      <h2 className="text-xl font-bold text-navy mb-2 group-hover:text-accent-primary transition-colors">
                        {fields.title}
                      </h2>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{fields.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {fields.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(fields.publishDate)}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-accent-primary font-medium group-hover:gap-2 transition-all">
                          Read <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
