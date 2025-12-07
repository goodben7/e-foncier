import { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import AddParcel from './pages/AddParcel';
import ParcelsList from './pages/ParcelsList';
import SearchParcel from './pages/SearchParcel';
import DocumentRequest from './pages/DocumentRequest';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'add-parcel':
        return <AddParcel />;
      case 'parcels-list':
        return <ParcelsList />;
      case 'search':
        return <SearchParcel />;
      case 'request':
        return <DocumentRequest />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="pt-28">{renderPage()}</main>
    </div>
  );
}

export default App;
