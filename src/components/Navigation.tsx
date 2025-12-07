import { Home, Plus, List, Search, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [hideTop, setHideTop] = useState(false);
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'add-parcel', label: 'Ajouter Parcelle', icon: Plus },
    { id: 'parcels-list', label: 'Liste Parcelles', icon: List },
    { id: 'search', label: 'Rechercher', icon: Search },
    { id: 'request', label: 'Demande Document', icon: FileText },
  ];

  useEffect(() => {
    const onScroll = () => {
      setHideTop(window.scrollY > 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions);
    return () => {
      window.removeEventListener('scroll', onScroll as EventListener);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white text-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center h-16 transition-all duration-500 ease-in-out ${hideTop ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="flex items-center">
            <div className="bg-white px-2 py-1">
              <img
                src="/img/logo.jpg"
                alt="Logo Ministère des Affaires Foncières"
                className="h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </div>
      <div className={`border-t border-emerald-700 bg-emerald-800 text-white fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out ${hideTop ? 'top-0' : 'top-16'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 py-2 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    currentPage === item.id
                      ? 'bg-emerald-700 text-white'
                      : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
