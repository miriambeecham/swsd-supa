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
import CityWalnutCreekStaticPage from './pages/CityWalnutCreekStaticPage';
import PrivateClassStaticPage from './pages/PrivateClassStaticPage';
import PrivateClassDesiredEffectStaticPage from './pages/PrivateClassDesiredEffectStaticPage';
import PublicClassMountDiabloYogaStaticPage from './pages/PublicClassMountDiabloYogaStaticPage';
import PrivateClassWSECStaticPage from './pages/PrivateClassWSECStaticPage';
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
             <Route path="/public-cwc-prep" element={<CityWalnutCreekStaticPage />} />
            <Route path="/private-class-prep" element={<PrivateClassStaticPage />} />
            <Route path="/public-class-desired-effect" element={<PrivateClassDesiredEffectStaticPage />} />
            <Route path="/private-class-wsec-prep" element={<PrivateClassWSECStaticPage />} />
            <Route path="/public-class-mdyoga-prep" element={<PublicClassMountDiabloYogaStaticPage />} />
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;