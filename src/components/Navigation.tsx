import { Home, Plus, List, Search, FileText } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'add-parcel', label: 'Ajouter Parcelle', icon: Plus },
    { id: 'parcels-list', label: 'Liste Parcelles', icon: List },
    { id: 'search', label: 'Rechercher', icon: Search },
    { id: 'request', label: 'Demande Document', icon: FileText },
  ];

  return (
    <nav className="bg-white text-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
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
      <div className="border-t border-emerald-700 bg-emerald-800 text-white">
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
