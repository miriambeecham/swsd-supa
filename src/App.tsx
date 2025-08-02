import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PublicClassesPage from './pages/PublicClassesPage';
import PrivateClassesPage from './pages/PrivateClassesPage';
import CorporatePage from './pages/CorporatePage';
import CboPage from './pages/CboPage';
import TestimonialsPage from './pages/TestimonialsPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import CityWalnutCreekPrepPage from './pages/CityWalnutCreekPrepPage';
import CityWalnutCreekStaticPage from './pages/CityWalnutCreekStaticPage';
import PrivateClassStaticPage from './pages/PrivateClassStaticPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ScrollToTop from './components/ScrollToTop';


function App() {
  return (
    <HelmetProvider>
      <Router>
         <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/public-classes" element={<PublicClassesPage />} />
            <Route path="/private-classes" element={<PrivateClassesPage />} />
            <Route path="/workplace-safety" element={<CorporatePage />} />
            <Route path="/cbo" element={<CboPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/city-walnut-creek-prep" element={<CityWalnutCreekPrepPage />} />
            <Route path="/city-walnut-creek-static" element={<CityWalnutCreekStaticPage />} />
            <Route path="/private-class-static" element={<PrivateClassStaticPage />} />
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;