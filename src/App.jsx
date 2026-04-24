import { useState, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import WorkerProfilePage from './pages/WorkerProfilePage';
import BookingPage from './pages/BookingPage';
import BookingsListPage from './pages/BookingsListPage';
import AdminDashboard from './pages/AdminDashboard';
import WorkerSignupPage from './pages/WorkerSignupPage';
import WorkerDashboardPage from './pages/WorkerDashboardPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageData, setPageData] = useState({});

  const handleNavigate = useCallback((page, data = {}) => {
    setCurrentPage(page);
    setPageData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'search':
        return <SearchPage onNavigate={handleNavigate} initialData={pageData} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} initialData={pageData} />;
      case 'worker':
        return <WorkerProfilePage onNavigate={handleNavigate} initialData={pageData} />;
      case 'booking':
        return <BookingPage onNavigate={handleNavigate} initialData={pageData} />;
      case 'bookings':
        return <BookingsListPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'workerSignup':
        return <WorkerSignupPage onNavigate={handleNavigate} />;
      case 'workerDashboard':
        return <WorkerDashboardPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const hideNavPages = ['login', 'workerSignup'];
  const showNavbar = !hideNavPages.includes(currentPage);

  return (
    <div className="app">
      {showNavbar && <Navbar onNavigate={handleNavigate} currentPage={currentPage} />}
      <main>{renderPage()}</main>
      {showNavbar && <BottomNav onNavigate={handleNavigate} currentPage={currentPage} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
