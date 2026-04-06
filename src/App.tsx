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
import PrivateClassStaticPage from './pages/PrivateClassStaticPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ScrollToTop from './components/ScrollToTop';
import StripeSuccessPage from './pages/StripeSuccessPage';
import MotherDaughterBookingPage from './pages/MotherDaughterBookingPage';
import AdultBookingPage from './pages/AdultBookingPage';
import AdminClassPrepLinksPage from './pages/AdminClassPrepLinksPage';
import ClassPrepPage from './pages/ClassPrepPage';
import PublicClassPoliciesPage from './pages/PublicClassPoliciesPage';
import PrivateClassPoliciesPage from './pages/PrivateClassPoliciesPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import AdminClassSchedulesPage from './pages/AdminClassSchedulesPage';
import AdminClassScheduleEditPage from './pages/AdminClassScheduleEditPage';
import AdminImportPage from './pages/AdminImportPage';
import CommunityMotherDaughterBookingPage from './pages/CommunityMotherDaughterBookingPage';
import SatisfactionSurveyPage from './pages/SatisfactionSurveyPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';




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
            
       
            <Route path="/book-mother-daughter-class/:id" element={<MotherDaughterBookingPage />} />
            <Route path="/book-adult-class/:id" element={<AdultBookingPage />} />
       
          

 

            <Route path="/private-class-prep" element={<PrivateClassStaticPage />} />
            <Route path="/stripe-success" element={<StripeSuccessPage />} />
            <Route path="/admin/class-prep-links" element={<AdminClassPrepLinksPage />} />
            <Route path="/class-prep/:scheduleId" element={<ClassPrepPage />} />
            <Route path="/public-class-policies" element={<PublicClassPoliciesPage />} />
            <Route path="/private-class-policies" element={<PrivateClassPoliciesPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            <Route path="/admin/schedules" element={<AdminClassSchedulesPage />} />
            <Route path="/admin/schedules/new" element={<AdminClassScheduleEditPage />} />
            <Route path="/admin/schedules/:id/edit" element={<AdminClassScheduleEditPage />} />
            <Route path="/admin/import" element={<AdminImportPage />} />
            <Route path="/book-community-md/:scheduleId" element={<CommunityMotherDaughterBookingPage />} />
            <Route path="/satisfaction-survey" element={<SatisfactionSurveyPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
