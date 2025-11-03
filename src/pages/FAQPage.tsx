import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, Users, Shield, Clock, MapPin, Phone, DollarSign, Calendar, Settings } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';

interface Category {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  description?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  categoryId: string;
  questionOrder: number;
  isPublished: boolean;
}

interface CategoryGroup {
  category: Category;
  faqs: FAQ[];
}

const FAQPage = () => {
  const [faqData, setFaqData] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<CategoryGroup[]>([]);

  // Icon mapping for categories - handles dynamic categories gracefully
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();

    // Common category mappings
    if (name.includes('general') || name.includes('basic') || name.includes('getting started')) {
      return Users;
    }
    if (name.includes('safety') || name.includes('security') || name.includes('protection')) {
      return Shield;
    }
    if (name.includes('schedule') || name.includes('time') || name.includes('booking')) {
      return Calendar;
    }
    if (name.includes('location') || name.includes('where') || name.includes('venue')) {
      return MapPin;
    }
    if (name.includes('cost') || name.includes('price') || name.includes('payment') || name.includes('fee')) {
      return DollarSign;
    }
    if (name.includes('contact') || name.includes('phone') || name.includes('reach')) {
      return Phone;
    }
    if (name.includes('training') || name.includes('method') || name.includes('technique')) {
      return Settings;
    }
    if (name.includes('logistics') || name.includes('preparation') || name.includes('what to')) {
      return Clock;
    }

    // Default fallback icon
    return HelpCircle;
  };

  // Color scheme for categories - cycles through your brand colors
  const getCategoryColors = (index: number) => {
    const colorSchemes = [
      {
        bg: 'bg-accent-primary/10',
        border: 'border-accent-primary/20',
        header: 'bg-accent-primary',
        text: 'text-accent-primary',
        icon: 'text-accent-primary'
      },
      {
        bg: 'bg-navy/10',
        border: 'border-navy/20',
        header: 'bg-navy',
        text: 'text-navy',
        icon: 'text-navy'
      },
      {
        bg: 'bg-yellow/10',
        border: 'border-yellow/20',
        header: 'bg-yellow',
        text: 'text-yellow-700',
        icon: 'text-yellow-700'
      },
      {
        bg: 'bg-accent-primary/5',
        border: 'border-accent-primary/10',
        header: 'bg-accent-primary/80',
        text: 'text-accent-primary',
        icon: 'text-accent-primary'
      }
    ];

    return colorSchemes[index % colorSchemes.length];
  };

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      // Fetch from backend API
      const response = await fetch('/api/faqs');
      if (!response.ok) {
        throw new Error(`Failed to fetch FAQs: ${response.status}`);
      }

      const { categories, faqs } = await response.json();

      // Transform categories data
      const categoryMap: Map<string, Category> = new Map();
      categories.forEach((category: any) => {
        const cat: Category = {
          id: category.id,
          name: category.name || '',
          displayOrder: category.displayOrder || 999,
          isActive: category.isActive || false,
          description: category.description || undefined,
        };
        categoryMap.set(category.id, cat);
      });

      // Add "Other" category for uncategorized FAQs
      const otherCategory: Category = {
        id: 'other',
        name: 'Other',
        displayOrder: 999,
        isActive: true,
        description: 'General questions'
      };
      categoryMap.set('other', otherCategory);

      // Transform FAQs data
      const transformedFaqs: FAQ[] = faqs.map((faq: any) => ({
        id: faq.id,
        question: faq.question || '',
        answer: faq.answer || '',
        categoryId: faq.categoryId || 'other',
        questionOrder: faq.questionOrder || 999,
        isPublished: faq.isPublished || false,
      }));

      // Group FAQs by category
      const categoryGroups: CategoryGroup[] = [];
      const usedCategories = new Set<string>();

      transformedFaqs.forEach(faq => {
        if (!usedCategories.has(faq.categoryId)) {
          const category = categoryMap.get(faq.categoryId);
          if (category) {
            categoryGroups.push({
              category,
              faqs: transformedFaqs
                .filter(f => f.categoryId === faq.categoryId)
                .sort((a, b) => a.questionOrder - b.questionOrder)
            });
            usedCategories.add(faq.categoryId);
          }
        }
      });

      // Sort category groups by display order
      categoryGroups.sort((a, b) => a.category.displayOrder - b.category.displayOrder);

      setFaqData(categoryGroups);

    } catch (err) {
      console.error('Error fetching FAQs:', err);
      // Fallback to hardcoded FAQs if API fails
      const fallbackCategory: Category = {
        id: 'fallback',
        name: 'General Questions',
        displayOrder: 1,
        isActive: true
      };

      setFaqData([
        {
          category: fallbackCategory,
          faqs: [
            {
              id: 'fallback-1',
              question: 'Do I need any prior experience?',
              answer: 'No prior experience is necessary! Our programs are designed for complete beginners. We start with the basics and build skills progressively.',
              categoryId: 'fallback',
              questionOrder: 1,
              isPublished: true
            },
            {
              id: 'fallback-2',
              question: 'What should I wear to class?',
              answer: 'Comfortable, loose-fitting clothes that allow for movement (like workout clothes). Sneakers or other closed-toe shoes are required. No jewelry or accessories.',
              categoryId: 'fallback',
              questionOrder: 2,
              isPublished: true
            },
            {
              id: 'fallback-3',
              question: 'Are your instructors certified?',
              answer: 'Yes! All our instructors are professionally certified with extensive real-world experience. We\'re also fully insured for all programs and venues.',
              categoryId: 'fallback',
              questionOrder: 3,
              isPublished: true
            },
            {
              id: 'fallback-4',
              question: 'Can you come to our location?',
              answer: 'Absolutely! We offer mobile training and can come to your workplace, community center, or other suitable venue. Contact us to discuss location requirements.',
              categoryId: 'fallback',
              questionOrder: 4,
              isPublished: true
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter FAQs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(faqData);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = faqData.map(group => ({
      ...group,
      faqs: group.faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower)
      )
    })).filter(group => group.faqs.length > 0);

    setFilteredData(filtered);
  }, [searchTerm, faqData]);

  useEffect(() => {
    document.title = 'Frequently Asked Questions - Streetwise Self Defense';
    fetchFAQs();
  }, []);

  useEffect(() => {
    // Auto-expand all categories when data loads
    if (faqData.length > 0) {
      const allCategoryIds = new Set(faqData.map(group => group.category.id));
      setExpandedCategories(allCategoryIds);
    }
  }, [faqData]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>Frequently Asked Questions - Streetwise Self Defense</title>
        <meta name="description" content="Find answers to common questions about our self-defense training programs, scheduling, pricing, and more." />
      </Helmet>

      {/* Header */}
      <section className="relative h-80 lg:h-96 flex items-center">
        <div 
          className="absolute inset-8 lg:inset-12 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/swsd-logo-bug.png)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/70"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">Frequently Asked Questions</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 lg:mb-8">
              Quick answers to common questions about our programs, scheduling, and training approach.
            </p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors text-lg"
            />
          </div>
          {searchTerm && (
            <p className="mt-3 text-sm text-gray-600">
              {filteredData.reduce((total, group) => total + group.faqs.length, 0)} result(s) found for "{searchTerm}"
            </p>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search terms or browse all categories below.</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-accent-primary hover:text-accent-dark font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredData.map((categoryGroup, index) => {
              const isCategoryExpanded = expandedCategories.has(categoryGroup.category.id);
              const colors = getCategoryColors(index);
              const IconComponent = getCategoryIcon(categoryGroup.category.name);

              return (
                <div key={categoryGroup.category.id} className={`mb-8 rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                  {/* Category Header - Clickable if multiple categories */}
                  {filteredData.length > 1 ? (
                    <button
                      onClick={() => toggleCategory(categoryGroup.category.id)}
                      className="w-full text-left group"
                    >
                      <div className={`flex items-center justify-between ${colors.header} text-white px-8 py-6 hover:opacity-90 transition-opacity`}>
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 p-3 rounded-lg">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">
                              {categoryGroup.category.name}
                            </h2>
                            {categoryGroup.category.description && (
                              <p className="text-white/80 text-sm mt-1">
                                {categoryGroup.category.description}
                              </p>
                            )}
                            <p className="text-white/70 text-xs mt-1">
                              {categoryGroup.faqs.length} question{categoryGroup.faqs.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {isCategoryExpanded ? (
                          <ChevronUp className="w-6 h-6 text-white/80 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-white/80 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className={`${colors.header} text-white px-8 py-6`}>
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-lg">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">
                            {categoryGroup.category.name}
                          </h2>
                          {categoryGroup.category.description && (
                            <p className="text-white/80 text-sm mt-1">
                              {categoryGroup.category.description}
                            </p>
                          )}
                          <p className="text-white/70 text-xs mt-1">
                            {categoryGroup.faqs.length} question{categoryGroup.faqs.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FAQ Items - Show when category is expanded or when there's only one category */}
                  {(isCategoryExpanded || filteredData.length === 1) && (
                    <div className="p-6 space-y-6">
                      {categoryGroup.faqs.map((faq, faqIndex) => (
                        <div key={faq.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className={`${colors.text} bg-current/10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                              <span className="text-sm font-bold text-current">
                                {faqIndex + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-navy mb-4 leading-tight">
                                {faq.question}
                              </h3>
                              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                                <ReactMarkdown>{faq.answer}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Contact CTA */}
          <div className="mt-16 text-center bg-gradient-to-r from-accent-primary/10 to-navy/10 rounded-2xl p-8 border-2 border-accent-primary/20">
            <div className="max-w-2xl mx-auto">
              <div className="bg-accent-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">Still have questions?</h3>
              <p className="text-gray-600 mb-6 text-lg">
                Can't find the answer you're looking for? We're here to help with personalized answers about our programs.
              </p>
              <a
                href="/contact#contact-cards"
                className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg"
              >
                Contact Us Today
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
