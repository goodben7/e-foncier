import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import { FileText, MapPin, AlertTriangle, Clock, TrendingUp, CalendarDays, CheckCircle } from 'lucide-react';

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
  const [distMode, setDistMode] = useState<'province' | 'city'>('province');

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

  const formatMonth = (ym: string) => {
    const parts = ym.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString('fr-FR', { month: 'short' });
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

  const MetricTile = ({
    title,
    value,
    icon: Icon,
    tone,
    footnote,
    onClick,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    tone: 'blue' | 'orange' | 'emerald' | 'red';
    footnote?: string;
    onClick?: () => void;
  }) => (
    <div
      className={`bg-white rounded-lg border p-4 shadow-sm transition-transform hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          tone === 'blue' ? 'bg-blue-50' : tone === 'orange' ? 'bg-orange-50' : tone === 'emerald' ? 'bg-emerald-50' : 'bg-red-50'
        }`}>
          <Icon size={18} className={
            tone === 'blue' ? 'text-blue-600' : tone === 'orange' ? 'text-orange-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-red-600'
          } />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {footnote && <p className="text-xs text-gray-500 mt-1">{footnote}</p>}
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
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={18} className="text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Indicateurs Additionnels</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const arr = extended.monthlyEvolution;
                const last = arr[arr.length - 1]?.count || 0;
                const prev = arr[arr.length - 2]?.count || 0;
                const diff = last - prev;
                const pct = prev > 0 ? Math.round((diff / prev) * 100) : (last > 0 ? 100 : 0);
                const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
                return (
                  <MetricTile
                    title="Parcelles ce mois"
                    value={extended.parcelsThisMonth}
                    icon={CalendarDays}
                    tone="blue"
                    footnote={`${sign}${Math.abs(pct)}% vs mois préc.`}
                    onClick={() => { sessionStorage.setItem('parcelFilter', 'all'); onNavigate?.('parcels-list'); }}
                  />
                );
              })()}
              <MetricTile
                title="Docs manquants"
                value={extended.parcelsMissingDocs}
                icon={FileText}
                tone="orange"
              />
              <MetricTile
                title="En validation"
                value={extended.parcelsInValidation}
                icon={CheckCircle}
                tone="emerald"
              />
              <MetricTile
                title="Conflits de limites"
                value={extended.parcelsBoundaryConflicts}
                icon={AlertTriangle}
                tone="red"
                onClick={() => { sessionStorage.setItem('parcelFilter', 'En litige'); onNavigate?.('parcels-list'); }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Répartition</h3>
              <div className="bg-gray-100 rounded-md p-1 flex">
                <button
                  onClick={() => setDistMode('province')}
                  className={`px-3 py-1 rounded-md text-sm ${distMode === 'province' ? 'bg-white shadow' : 'text-gray-600'}`}
                >Province</button>
                <button
                  onClick={() => setDistMode('city')}
                  className={`px-3 py-1 rounded-md text-sm ${distMode === 'city' ? 'bg-white shadow' : 'text-gray-600'}`}
                >Ville</button>
              </div>
            </div>
            {(() => {
              const data = distMode === 'province'
                ? extended.parcelsByProvince.map(({ province, c }) => ({ name: province || 'Non spécifiée', c }))
                : extended.parcelsByCity.map(({ city, c }) => ({ name: city || 'Non spécifiée', c }));
              const top = data.slice(0, 8);
              const max = Math.max(...top.map(x => x.c)) || 1;
              const total = top.reduce((a, b) => a + b.c, 0) || 1;
              return (
                <div className="space-y-3">
                  {top.map((p) => (
                    <div key={`${distMode}-${p.name}`} className="flex items-center gap-3">
                      <div className="w-36 text-sm text-gray-700 truncate">{p.name}</div>
                      <div className="flex-1 h-3 bg-gray-100 rounded">
                        <div className="h-3 bg-emerald-600 rounded" style={{ width: `${Math.round((p.c / max) * 100)}%` }}></div>
                      </div>
                      <div className="w-20 text-right text-sm text-gray-700">{p.c} ({Math.round((p.c / total) * 100)}%)</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution sur 12 mois</h3>
            {(() => {
              const max = Math.max(...extended.monthlyEvolution.map(x => x.count)) || 1;
              const avg = Math.round(extended.monthlyEvolution.reduce((a, b) => a + b.count, 0) / extended.monthlyEvolution.length) || 0;
              const hpx = 160;
              const avgPx = Math.max(8, Math.round((avg / max) * (hpx - 20)));
              return (
                <div className="relative">
                  <div className="absolute left-0 right-0 border-t border-dashed border-gray-300" style={{ bottom: `${avgPx}px` }}></div>
                  <div className="flex items-end gap-2 h-40">
                    {extended.monthlyEvolution.map((m) => {
                      const h = Math.max(8, Math.round((m.count / max) * (hpx - 20)));
                      return (
                        <div key={m.month} className="flex flex-col items-center">
                          <div className="w-5 bg-emerald-600 rounded" style={{ height: `${h}px` }} title={`${m.count} parcelles`}></div>
                          <div className="text-[10px] text-gray-500 mt-1">{formatMonth(m.month)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Moyenne: {avg} parcelles/mois</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
