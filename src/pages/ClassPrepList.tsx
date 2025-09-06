
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, Users, Calendar, MapPin, Building, Home } from 'lucide-react';

const ClassPrepList = () => {
  const prepPages = [
    {
      id: 'city-walnut-creek',
      title: 'Public - City Walnut Creek (Date agnostic)',
      path: '/city-walnut-creek-static',
      icon: Building,
      description: 'Preparation information for City of Walnut Creek public classes',
      type: 'Public Class'
    },
    {
      id: 'mount-diablo-yoga',
      title: 'Public - Mount Diablo Yoga (Date specific)',
      path: '/public-class-mount-diablo-yoga-static',
      icon: Calendar,
      description: 'Preparation information for Mount Diablo Yoga public class',
      type: 'Public Class'
    },
    {
      id: 'desired-effect',
      title: 'Public - Desired Effect (Date specific)',
      path: '/private-class-desired-effect-static',
      icon: Calendar,
      description: 'Preparation information for Desired Effect public class',
      type: 'Public Class'
    },
    {
      id: 'private-general',
      title: 'Private (Group and date agnostic)',
      path: '/private-class-static',
      icon: Users,
      description: 'General preparation information for private classes',
      type: 'Private Class'
    },
    {
      id: 'private-wsec',
      title: 'Private - WSEC (Group and date specific)',
      path: '/private-class-wsec-static',
      icon: Calendar,
      description: 'Preparation information for WSEC private class',
      type: 'Private Class'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Class Preparation List - Streetwise Self Defense</title>
        <meta name="description" content="Links to all class preparation pages for Streetwise Self Defense classes." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <section className="relative py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Class Preparation Pages</h1>
            <p className="text-xl opacity-90">Quick access to all class preparation information</p>
          </div>
        </div>
      </section>

      {/* Class Prep Links */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6">
            {prepPages.map((page) => {
              const IconComponent = page.icon;
              return (
                <Link
                  key={page.id}
                  to={page.path}
                  className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-accent-primary/30"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-accent-primary/10 p-3 rounded-lg flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-accent-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-navy">{page.title}</h3>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                            {page.type}
                          </span>
                        </div>
                        <p className="text-gray-600">{page.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-accent-primary/10 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ClassPrepList;
