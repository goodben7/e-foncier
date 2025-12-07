import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import { FileText, MapPin, AlertTriangle, Clock } from 'lucide-react';

export default function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [stats, setStats] = useState({
    totalParcels: 0,
    freeParcels: 0,
    disputedParcels: 0,
    mortgagedParcels: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [extended, setExtended] = useState<api.ExtendedStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [s, e] = await Promise.all([api.getStats(), api.getExtendedStats()]);
      setStats(s);
      setExtended(e);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    bgColor,
    iconColor,
    onClick,
    subtitle,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    bgColor: string;
    iconColor: string;
    onClick?: () => void;
    subtitle?: string;
  }) => (
    <div className={`${bgColor} rounded-lg shadow-md p-6 transition-transform hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${iconColor} bg-opacity-20 p-3 rounded-full`}>
          <Icon size={32} className={iconColor.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord</h2>
        <p className="text-gray-600">Vue d'ensemble du portail foncier</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Parcelles"
          value={stats.totalParcels}
          icon={MapPin}
          bgColor="bg-blue-50"
          iconColor="bg-blue-500"
          onClick={() => { sessionStorage.setItem('parcelFilter', 'all'); onNavigate?.('parcels-list'); }}
        />
        <StatCard
          title="Parcelles Libres"
          value={stats.freeParcels}
          icon={FileText}
          bgColor="bg-green-50"
          iconColor="bg-green-500"
          subtitle={`${stats.totalParcels > 0 ? Math.round((stats.freeParcels / stats.totalParcels) * 100) : 0}% du total`}
          onClick={() => { sessionStorage.setItem('parcelFilter', 'Libre'); onNavigate?.('parcels-list'); }}
        />
        <StatCard
          title="En Litige"
          value={stats.disputedParcels}
          icon={AlertTriangle}
          bgColor="bg-orange-50"
          iconColor="bg-orange-500"
          onClick={() => { sessionStorage.setItem('parcelFilter', 'En litige'); onNavigate?.('parcels-list'); }}
        />
        <StatCard
          title="Hypothéquées"
          value={stats.mortgagedParcels}
          icon={AlertTriangle}
          bgColor="bg-red-50"
          iconColor="bg-red-500"
          onClick={() => { sessionStorage.setItem('parcelFilter', 'Hypothéqué'); onNavigate?.('parcels-list'); }}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={24} className="text-emerald-600" />
          <h3 className="text-xl font-bold text-gray-900">Demandes en Attente</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-5xl font-bold text-emerald-600 mb-2">{stats.pendingRequests}</p>
          <p className="text-gray-600">demande(s) à traiter</p>
          {extended && (
            <p className="text-xs text-gray-500">Délai moyen: {extended.pendingRequestsAvgDays.toFixed(1)} jour(s)</p>
          )}
        </div>
      </div>

      {extended && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Indicateurs Additionnels</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Parcelles enregistrées ce mois</span>
                <span className="text-lg font-semibold text-gray-900">{extended.parcelsThisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Docs manquants</span>
                <span className="text-lg font-semibold text-orange-600">{extended.parcelsMissingDocs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">En validation</span>
                <span className="text-lg font-semibold text-blue-600">{extended.parcelsInValidation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conflits de limites</span>
                <span className="text-lg font-semibold text-red-600">{extended.parcelsBoundaryConflicts}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { sessionStorage.setItem('parcelFilter', 'En litige'); onNavigate?.('parcels-list') }}
                  className="px-3 py-2 rounded-md text-sm bg-orange-600 text-white hover:bg-orange-700"
                >Voir litiges</button>
                <button
                  onClick={() => { sessionStorage.setItem('parcelFilter', 'Libre'); onNavigate?.('parcels-list') }}
                  className="px-3 py-2 rounded-md text-sm bg-green-600 text-white hover:bg-green-700"
                >Voir libres</button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition par Province</h3>
            <div className="space-y-3">
              {extended.parcelsByProvince.slice(0,6).map((p) => (
                <div key={p.province}>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>{p.province || 'Non spécifiée'}</span>
                    <span>{p.c}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, (p.c / Math.max(1, extended.parcelsByProvince[0]?.c)) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution sur 12 mois</h3>
            <div className="flex items-end gap-2 h-32">
              {extended.monthlyEvolution.map((m) => {
                const max = Math.max(...extended.monthlyEvolution.map(x => x.count)) || 1
                const h = Math.max(4, Math.round((m.count / max) * 100))
                return (
                  <div key={m.month} className="flex flex-col items-center">
                    <div className="w-4 bg-emerald-600 rounded-t" style={{ height: `${h}%` }}></div>
                    <div className="text-[10px] text-gray-500 mt-1">{m.month.slice(5)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
