import { Home, Plus, List, Search, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as api from '../lib/api';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [hideTop, setHideTop] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<number | null>(null);
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

  useEffect(() => {
    api.getStats().then((s) => {
      setPendingRequests(s.pendingRequests ?? null);
    }).catch(() => {});
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white text-gray-900 shadow-sm" aria-label="Navigation principale">
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
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-emerald-800 to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-emerald-800 to-transparent"></div>
            <div className="flex gap-2 py-2 overflow-x-auto snap-x snap-mandatory">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={currentPage === item.id ? 'page' : undefined}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                      currentPage === item.id
                        ? 'bg-emerald-700 text-white ring-1 ring-white/30'
                        : 'text-emerald-100 hover:bg-emerald-700/50'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                    {item.id === 'request' && pendingRequests && pendingRequests > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center px-2 rounded-full bg-white/20 text-white text-xs">{pendingRequests}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
