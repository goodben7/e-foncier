import { useState } from 'react';
import * as api from '../lib/api';
import type { Parcel } from '../types/database';
import { Search, MapPin, User, Maximize2, AlertCircle, FileText, Hash, ClipboardList } from 'lucide-react';

export default function SearchParcel() {
  const [searchRef, setSearchRef] = useState('');
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;

    setLoading(true);
    setNotFound(false);
    setParcel(null);

    try {
      const data = await api.getParcelByReference(searchRef.trim());
      if (data) {
        setParcel(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error searching parcel:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Libre':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'En litige':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Hypothéqué':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Rechercher une Parcelle</h2>
        <p className="text-gray-600">Entrez une référence cadastrale pour consulter les informations</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="Ex: PAR-2024-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchRef.trim()}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search size={20} />
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
      </div>

      {notFound && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle size={24} className="text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">Parcelle non trouvée</h3>
            <p className="text-orange-800">
              Aucune parcelle avec la référence "{searchRef}" n'a été trouvée dans le système.
            </p>
          </div>
        </div>
      )}

      {parcel && (
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">{parcel.reference}</h3>
                <span
                  className={`inline-block px-4 py-1.5 text-sm font-semibold rounded-full border-2 ${getStatusColor(
                    parcel.status
                  )}`}
                >
                  {parcel.status}
                </span>
              </div>
              <FileText size={48} className="opacity-50" />
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <User size={24} className="text-emerald-600" />
                  <h4 className="font-semibold text-gray-900">Propriétaire</h4>
                </div>
                <p className="text-lg text-gray-900">{parcel.owner_name}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Maximize2 size={24} className="text-emerald-600" />
                  <h4 className="font-semibold text-gray-900">Superficie</h4>
                </div>
                <p className="text-lg text-gray-900">{parcel.area.toLocaleString()} m²</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <MapPin size={24} className="text-emerald-600" />
                <h4 className="font-semibold text-gray-900">Localisation</h4>
              </div>
              <p className="text-lg text-gray-900">{`${parcel.avenue}, ${parcel.quartier_or_cheflieu}, ${parcel.commune_or_sector}, ${parcel.territory_or_city}, ${parcel.province}`}</p>
              <p className="text-sm text-gray-700 mt-2">GPS: {parcel.gps_lat.toFixed(5)}, {parcel.gps_long.toFixed(5)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Hash size={24} className="text-emerald-600" />
                  <h4 className="font-semibold text-gray-900">Titre foncier</h4>
                </div>
                <p className="text-lg text-gray-900">{parcel.certificate_number}</p>
                <p className="text-sm text-gray-700">Autorité: {parcel.issuing_authority}</p>
                <p className="text-sm text-gray-700">Date: {new Date(parcel.title_date).toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <ClipboardList size={24} className="text-emerald-600" />
                  <h4 className="font-semibold text-gray-900">Références</h4>
                </div>
                <p className="text-sm text-gray-700">Numéro parcelle: {parcel.parcel_number}</p>
                <p className="text-sm text-gray-700">Plan cadastral: {parcel.cadastral_plan_ref}</p>
                <p className="text-sm text-gray-700">Usage: {parcel.land_use}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Bornage</h4>
                <p className="text-sm text-gray-700">PV: {parcel.surveying_pv_ref}</p>
                <p className="text-sm text-gray-700">Géomètre: {parcel.surveyor_name}</p>
                <p className="text-sm text-gray-700">Agrément: {parcel.surveyor_license}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Charges et litiges</h4>
                <p className="text-sm text-gray-700">Servitudes: {parcel.servitudes || 'N/A'}</p>
                <p className="text-sm text-gray-700">Hypothèques/Charges: {parcel.charges || 'N/A'}</p>
                <p className="text-sm text-gray-700">Litiges: {parcel.litigation || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex justify-between text-sm text-gray-600">
              <div>
                <span className="font-medium">Créé le:</span>{' '}
                {new Date(parcel.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <div>
                <span className="font-medium">Dernière mise à jour:</span>{' '}
                {new Date(parcel.updated_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
