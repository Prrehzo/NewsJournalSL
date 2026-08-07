import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import NotificationSetup from './components/NotificationSetup';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Article from './pages/Article';
import Category from './pages/Category';
import Search from './pages/Search';
import About from './pages/About';
import RegisterSchool from './pages/RegisterSchool';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

import SchoolLayout from './components/SchoolLayout';
import SchoolDashboard from './pages/school/Dashboard';
import CreateArticle from './pages/school/CreateArticle';
import ManageArticles from './pages/school/ManageArticles';
import SchoolSettings from './pages/school/SchoolSettings';
import SchoolProfile from './pages/SchoolProfile';
import Schools from './pages/Schools';

import SuperLayout from './components/SuperLayout';
import SuperDashboard from './pages/super/Dashboard';
import ManageSchools from './pages/super/ManageSchools';
import ManageAllArticles from './pages/super/ManageAllArticles';
import ManageReporters from './pages/school/ManageReporters';
import SuperSettings from './pages/super/Settings';
import SuperAdminSetup from './pages/super/Setup';
import ManageAdmins from './pages/super/ManageAdmins';

import ReporterDashboard from './pages/reporter/ReporterDashboard';
import ReporterSettings from './pages/reporter/ReporterSettings';

const DashboardSwitcher = () => {
  const { userRole } = useAuth();
  return userRole === 'reporter' ? <ReporterDashboard /> : <SchoolDashboard />;
};

const SettingsSwitcher = () => {
    const { userRole } = useAuth();
    return userRole === 'reporter' ? <ReporterSettings /> : <SchoolSettings />;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', margin: '20px', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#991b1b' }}>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', color: '#b91c1c' }}>
            {this.state.error && this.state.error.toString()}
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#991b1b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
        <Router>
          <ScrollToTop />
          <NotificationSetup />
          <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="admin-login" element={<Login />} />
              <Route path="school-admin-login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="article/:id" element={<Article />} />
              <Route path="categories" element={<Category />} />
              <Route path="category/:name" element={<Category />} />
              <Route path="school/:id" element={<SchoolProfile />} />
              <Route path="schools" element={<Schools />} />
              <Route path="search" element={<Search />} />
              <Route path="about" element={<About />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="register-school" element={<RegisterSchool />} />
              <Route path="super-admin-setup" element={<SuperAdminSetup />} />
            </Route>

            {/* School Admin Routes */}
            <Route path="/school-admin" element={
              <ProtectedRoute allowedRoles={['school_admin', 'reporter']}>
                <SchoolLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardSwitcher />} />
              <Route path="create" element={<CreateArticle />} />
              <Route path="edit/:id" element={<CreateArticle />} />
              <Route path="articles" element={<ManageArticles />} />
              <Route path="reporters" element={<ProtectedRoute allowedRoles={['school_admin']}><ManageReporters /></ProtectedRoute>} />
              <Route path="settings" element={<SettingsSwitcher />} />
            </Route>

            {/* Super Admin Routes */}
            <Route path="/super-admin" element={
              <ProtectedRoute allowedRoles={['super_admin']} redirectPath="/admin-login">
                <SuperLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SuperDashboard />} />
              <Route path="schools" element={<ManageSchools />} />
              <Route path="articles" element={<ManageAllArticles />} />
              <Route path="admins" element={<ManageAdmins />} />
              <Route path="settings" element={<SuperSettings />} />
            </Route>

          </Routes>
          </ToastProvider>
        </Router>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
