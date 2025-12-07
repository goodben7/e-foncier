import { useEffect, useState, useCallback } from 'react';
import * as api from '../lib/api';
import type { Parcel } from '../types/database';
import { MapPin, Maximize2, User, FileText, Hash } from 'lucide-react';

export default function ParcelsList({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(() => sessionStorage.getItem('parcelFilter') || 'all');

  const loadParcels = useCallback(async () => {
    try {
      const data = await api.getParcels(filter);
      setParcels(data || []);
    } catch (error) {
      console.error('Error loading parcels:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    sessionStorage.removeItem('parcelFilter');
    loadParcels();
  }, [loadParcels]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Libre':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'En litige':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Hypothéqué':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  

  
  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Chargement des parcelles...</div>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Liste des Parcelles</h2>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Toutes ({parcels.length})
          </button>
          <button
            onClick={() => setFilter('Libre')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'Libre'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Libres
          </button>
          <button
            onClick={() => setFilter('En litige')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'En litige'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            En litige
          </button>
          <button
            onClick={() => setFilter('Hypothéqué')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'Hypothéqué'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Hypothéquées
          </button>
        </div>
      </div>

      {parcels.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Aucune parcelle enregistrée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parcels.map((parcel) => (
            <div
              key={parcel.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200 cursor-pointer"
              onClick={() => { sessionStorage.setItem('parcelDetailRef', parcel.reference); onNavigate('parcel-detail'); }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{parcel.reference}</h3>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                      parcel.status
                    )}`}
                  >
                    {parcel.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Propriétaire</p>
                    <p className="text-sm font-medium text-gray-900">{parcel.owner_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Maximize2 size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Superficie</p>
                    <p className="text-sm font-medium text-gray-900">{parcel.area.toLocaleString()} m²</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Hash size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Affectation</p>
                    <p className="text-sm font-medium text-gray-900">{parcel.land_use}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Adresse</p>
                    <p className="text-sm font-medium text-gray-900">{`${parcel.avenue}, ${parcel.quartier_or_cheflieu}, ${parcel.commune_or_sector}`}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Créé le {new Date(parcel.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      
    </>
  );
}
