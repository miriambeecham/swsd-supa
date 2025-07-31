import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

      if (!baseId || !apiKey) {
        throw new Error('Missing Airtable configuration');
      }

      // Fetch Categories
      const categoriesResponse = await fetch(
        `https://api.airtable.com/v0/${baseId}/Categories?filterByFormula={Is Active}=1&sort[0][field]=Display Order`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!categoriesResponse.ok) {
        throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
      }

      const categoriesData = await categoriesResponse.json();

      // Transform categories data
      const categories: Map<string, Category> = new Map();
      categoriesData.records.forEach((record: any) => {
        const category: Category = {
          id: record.id,
          name: record.fields['Category Name'] || '',
          displayOrder: record.fields['Display Order'] || 999,
          isActive: record.fields['Is Active'] || false,
          description: record.fields.Description || undefined,
        };
        categories.set(record.id, category);
      });

      // Add "Other" category for uncategorized FAQs
      const otherCategory: Category = {
        id: 'other',
        name: 'Other',
        displayOrder: 999,
        isActive: true,
        description: 'General questions'
      };
      categories.set('other', otherCategory);

      // Fetch FAQs
      const faqsResponse = await fetch(
        `https://api.airtable.com/v0/${baseId}/FAQ?filterByFormula={Is Published}=1&sort[0][field]=Question Order`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!faqsResponse.ok) {
        throw new Error(`Failed to fetch FAQs: ${faqsResponse.status}`);
      }

      const faqsData = await faqsResponse.json();

      // Transform FAQs data and link to categories
      const faqs: FAQ[] = faqsData.records.map((record: any) => {
        // Handle linked category field - Airtable returns array of record IDs
        let categoryId = 'other'; // Default to "Other"
        if (record.fields.Category && Array.isArray(record.fields.Category) && record.fields.Category.length > 0) {
          categoryId = record.fields.Category[0]; // Take first linked category
        }

        return {
          id: record.id,
          question: record.fields.Question || '',
          answer: record.fields.Answer || '',
          categoryId: categoryId,
          questionOrder: record.fields['Question Order'] || 999,
          isPublished: record.fields['Is Published'] || false,
        };
      });

      // Group FAQs by category
      const categoryGroups: CategoryGroup[] = [];

      // Create groups for each category that has FAQs
      const usedCategories = new Set<string>();

      faqs.forEach(faq => {
        if (!usedCategories.has(faq.categoryId)) {
          const category = categories.get(faq.categoryId);
          if (category) {
            categoryGroups.push({
              category,
              faqs: faqs
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

  useEffect(() => {
    document.title = 'Frequently Asked Questions - Streetwise Self Defense';
    fetchFAQs();

    // Expand all categories by default
    // This will be updated after data loads
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
      {/* Header */}
      <section className="relative h-80 lg:h-96 flex items-center">
        <div 
          className="absolute inset-8 lg:inset-12 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/swsd-logo-bug.png)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/95"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600 mb-8">
              Quick answers to common questions about our programs.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqData.map((categoryGroup) => {
            const isCategoryExpanded = expandedCategories.has(categoryGroup.category.id);

            return (
              <div key={categoryGroup.category.id} className="mb-8">
                {/* Category Header - Clickable if multiple categories */}
                {faqData.length > 1 ? (
                  <button
                    onClick={() => toggleCategory(categoryGroup.category.id)}
                    className="w-full text-left mb-6 group"
                  >
                    <div className="flex items-center justify-between bg-navy text-white px-6 py-4 rounded-lg hover:bg-navy/90 transition-colors">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {categoryGroup.category.name}
                        </h2>
                        {categoryGroup.category.description && (
                          <p className="text-blue-100 text-sm mt-1">
                            {categoryGroup.category.description}
                          </p>
                        )}
                      </div>
                      {isCategoryExpanded ? (
                        <ChevronUp className="w-6 h-6 text-blue-200 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-blue-200 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-navy mb-2 pb-2 border-b border-gray-200">
                      {categoryGroup.category.name}
                    </h2>
                    {categoryGroup.category.description && (
                      <p className="text-gray-600 text-sm">
                        {categoryGroup.category.description}
                      </p>
                    )}
                  </div>
                )}

                {/* FAQ Items - Show when category is expanded or when there's only one category */}
                {(isCategoryExpanded || faqData.length === 1) && (
                  <div className="space-y-4">
                    {categoryGroup.faqs.map((faq) => (
                      <div key={faq.id} className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold text-navy mb-3">
                          {faq.question}
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                          <ReactMarkdown>{faq.answer}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Contact CTA */}
          <div className="mt-16 text-center bg-accent-light rounded-lg p-8">
            <h3 className="text-2xl font-bold text-navy mb-4">Still have questions?</h3>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? We're here to help!
            </p>
            <a
              href="/contact#contact-cards"
              className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;