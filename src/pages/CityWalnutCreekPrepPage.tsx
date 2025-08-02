import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Users, Shield, Clock, MapPin, Phone, DollarSign, Calendar, Settings } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';

interface Category {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  description?: string;
}

interface InstructionItem {
  id: string;
  sectionTitle: string;
  content: string;
  categoryId: string;
  questionOrder: number;
  isPublished: boolean;
}

interface CategoryGroup {
  category: Category;
  instructions: InstructionItem[];
}

const CityWalnutCreekPrepPage = () => {
  const [instructionData, setInstructionData] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Icon mapping for categories
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();

    if (name.includes('before') || name.includes('preparation') || name.includes('getting started')) {
      return Users;
    }
    if (name.includes('bring') || name.includes('what to') || name.includes('items')) {
      return Settings;
    }
    if (name.includes('wear') || name.includes('clothing') || name.includes('attire')) {
      return Shield;
    }
    if (name.includes('location') || name.includes('where') || name.includes('meeting') || name.includes('parking')) {
      return MapPin;
    }
    if (name.includes('waiver') || name.includes('legal') || name.includes('forms')) {
      return DollarSign;
    }
    if (name.includes('contact') || name.includes('phone') || name.includes('reach')) {
      return Phone;
    }
    if (name.includes('camera') || name.includes('filming') || name.includes('video')) {
      return Calendar;
    }
    if (name.includes('note') || name.includes('personal') || name.includes('message')) {
      return Clock;
    }

    return HelpCircle;
  };

  // Color scheme for categories
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

  const fetchInstructions = async () => {
    try {
      setLoading(true);

      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

      if (!baseId || !apiKey) {
        throw new Error('Missing Airtable configuration');
      }

      // Fetch Categories
      const categoriesResponse = await fetch(
        `https://api.airtable.com/v0/${baseId}/WhatToExpect Categories?filterByFormula={Is Active}=1&sort[0][field]=Display Order`,
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

      // Fetch Instructions
      const instructionsResponse = await fetch(
        `https://api.airtable.com/v0/${baseId}/WhatToExpect Content CWC 15Plus?filterByFormula={Is Published}=1&sort[0][field]=Question Order`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!instructionsResponse.ok) {
        throw new Error(`Failed to fetch instructions: ${instructionsResponse.status}`);
      }

      const instructionsData = await instructionsResponse.json();

      // Transform instructions data and link to categories
      const instructions: InstructionItem[] = instructionsData.records.map((record: any) => {
        // Handle linked category field
        let categoryId = 'other';
        if (record.fields.Category && Array.isArray(record.fields.Category) && record.fields.Category.length > 0) {
          categoryId = record.fields.Category[0];
        }

        return {
          id: record.id,
          sectionTitle: record.fields.Question || '',
          content: record.fields.Answer || '',
          categoryId: categoryId,
          questionOrder: record.fields['Question Order'] || 999,
          isPublished: record.fields['Is Published'] || false,
        };
      });

      // Group instructions by category
      const categoryGroups: CategoryGroup[] = [];
      const usedCategories = new Set<string>();

      instructions.forEach(instruction => {
        if (!usedCategories.has(instruction.categoryId)) {
          const category = categories.get(instruction.categoryId);
          if (category) {
            categoryGroups.push({
              category,
              instructions: instructions
                .filter(i => i.categoryId === instruction.categoryId)
                .sort((a, b) => a.questionOrder - b.questionOrder)
            });
            usedCategories.add(instruction.categoryId);
          }
        }
      });

      // Sort category groups by display order
      categoryGroups.sort((a, b) => a.category.displayOrder - b.category.displayOrder);

      setInstructionData(categoryGroups);

    } catch (err) {
      console.error('Error fetching instructions:', err);
      // Fallback content
      const fallbackCategory: Category = {
        id: 'fallback',
        name: 'Class Preparation',
        displayOrder: 1,
        isActive: true
      };

      setInstructionData([
        {
          category: fallbackCategory,
          instructions: [
            {
              id: 'fallback-1',
              sectionTitle: 'Before Your Class',
              content: 'Please complete the electronic waiver and let us know about any injuries or physical restrictions.',
              categoryId: 'fallback',
              questionOrder: 1,
              isPublished: true
            },
            {
              id: 'fallback-2',
              sectionTitle: 'What to Bring',
              content: '• Water bottle\n• Snack (optional)\n• Notepad (optional)\n• Sense of humor (required!)',
              categoryId: 'fallback',
              questionOrder: 2,
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
    fetchInstructions();
  }, []);

  useEffect(() => {
    // Auto-expand all categories when data loads
    if (instructionData.length > 0) {
      const allCategoryIds = new Set(instructionData.map(group => group.category.id));
      setExpandedCategories(allCategoryIds);
    }
  }, [instructionData]);

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
          <p className="text-gray-600">Loading class preparation information...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>Class Preparation - City of Walnut Creek Self Defense</title>
        <meta name="description" content="Everything you need to know to prepare for your self-defense class with the City of Walnut Creek." />
        <meta name="robots" content="noindex" />
      </Helmet>

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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">
              City of Walnut Creek Self Defense Class
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-accent-primary mb-4">
              Class Preparation Information
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-6 lg:mb-8">
              Everything you need to know to prepare for your upcoming self-defense class.
            </p>
          </div>
        </div>
      </section>

      {/* Instructions Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {instructionData.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Information not available</h3>
              <p className="text-gray-500">Please contact us if you need class preparation details.</p>
            </div>
          ) : (
            instructionData.map((categoryGroup, index) => {
              const isCategoryExpanded = expandedCategories.has(categoryGroup.category.id);
              const colors = getCategoryColors(index);
              const IconComponent = getCategoryIcon(categoryGroup.category.name);

              return (
                <div key={categoryGroup.category.id} className={`mb-8 rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                  {/* Category Header - Clickable if multiple categories */}
                  {instructionData.length > 1 ? (
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
                              {categoryGroup.instructions.length} section{categoryGroup.instructions.length !== 1 ? 's' : ''}
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
                            {categoryGroup.instructions.length} section{categoryGroup.instructions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instruction Items */}
                  {(isCategoryExpanded || instructionData.length === 1) && (
                    <div className="p-6 space-y-6">
                      {categoryGroup.instructions.map((instruction, instructionIndex) => (
                        <div key={instruction.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className={`${colors.text} bg-current/10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                              <span className="text-sm font-bold text-current">
                                {instructionIndex + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-navy mb-4 leading-tight">
                                {instruction.sectionTitle}
                              </h3>
                              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                                <ReactMarkdown>{instruction.content}</ReactMarkdown>
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
                <Phone className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">Questions about your class?</h3>
              <p className="text-gray-600 mb-6 text-lg">
                Contact Jay directly for any questions or concerns about your upcoming class.
              </p>
              <a
                href="tel:925-532-9953"
                className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg mr-4"
              >
                Call: (925) 532-9953
              </a>
              <a
                href="sms:925-532-9953"
                className="bg-navy hover:bg-navy/90 text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg"
              >
                Text: (925) 532-9953
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CityWalnutCreekPrepPage;