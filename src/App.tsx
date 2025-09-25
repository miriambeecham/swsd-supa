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
import ClassPrepList from './pages/ClassPrepList';
import BookingPage from './pages/BookingPage';
import StripeSuccessPage from './pages/StripeSuccessPage';
import StripeError from './pages/StripeErrorPage';
import MotherDaughterBookingPage from './pages/MotherDaughterBookingPage';
import AdultBookingPage from './pages/AdultBookingPage';


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
            <Route path="/class-prep-list" element={<ClassPrepList />} />
            <Route path="/book-class/:classId" element={<BookingPage />} />
       
            <Route path="/book-adult-class" element={AdultBookingPage} />
            <Route path="/book-mother-daughter-class/:id" element={<MotherDaughterBookingPage />} />
            <Route path="/book-adult-class/:id" element={<AdultBookingPage />} />
          

           // {/* Class Preparation Pages */}
            <Route path="/public-cwc-prep" element={<CityWalnutCreekStaticPage />} />
            <Route path="/private-class-prep" element={<PrivateClassStaticPage />} />
            <Route path="/public-class-desired-effect" element={<PrivateClassDesiredEffectStaticPage />} />
            <Route path="/private-class-wsec-prep" element={<PrivateClassWSECStaticPage />} />
            <Route path="/public-class-mdyoga-prep" element={<PublicClassMountDiabloYogaStaticPage />} />
            <Route path="/stripe-success" element={<StripeSuccessPage />} />
            <Route path="/stripe-error" element={<StripeError />} />
            
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
