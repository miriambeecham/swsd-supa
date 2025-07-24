import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PublicClassesPage from './pages/PublicClassesPage';
import PrivateClassesPage from './pages/PrivateClassesPage';
import CorporatePage from './pages/CorporatePage';
import CboPage from './pages/CboPage';
import TestimonialsPage from './pages/TestimonialsPage';
import ContactPage from './pages/ContactPage';
import MotherDaughterPage from './pages/MotherDaughterPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/public-classes" element={<PublicClassesPage />} />
          <Route path="/private-classes" element={<PrivateClassesPage />} />
          <Route path="/corporate" element={<CorporatePage />} />
          <Route path="/cbo" element={<CboPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/mother-daughter" element={<MotherDaughterPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;