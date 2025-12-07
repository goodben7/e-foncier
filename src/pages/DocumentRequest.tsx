import { useState, useEffect } from 'react';
import * as api from '../lib/api';
import type { RequestInsert, Request } from '../types/database';
import { Send, AlertCircle, CheckCircle, Clock, CheckCheck, XCircle, ChevronDown } from 'lucide-react';

export default function DocumentRequest() {
  const [formData, setFormData] = useState<RequestInsert>({
    citizen_name: '',
    parcel_reference: '',
    document_type: '',
    status: 'En attente',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    if (showRequests) {
      loadRequests();
    }
  }, [showRequests]);

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.createRequest(formData);

      setMessage({ type: 'success', text: 'Demande soumise avec succès! Vous serez contacté prochainement.' });
      setFormData({
        citizen_name: '',
        parcel_reference: '',
        document_type: '',
        status: 'En attente',
      });

      if (showRequests) {
        loadRequests();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En attente':
        return <Clock size={18} className="text-orange-600" />;
      case 'Approuvé':
        return <CheckCheck size={18} className="text-green-600" />;
      case 'Rejeté':
        return <XCircle size={18} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Approuvé':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejeté':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Demande de Document en Ligne</h2>
        <p className="text-gray-600">Remplissez le formulaire pour faire une demande de document foncier</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Nouveau Demande</h3>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="citizen_name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nom Complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="citizen_name"
                name="citizen_name"
                value={formData.citizen_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ex: Marie Kouadio"
              />
            </div>

            <div>
              <label htmlFor="parcel_reference" className="block text-sm font-semibold text-gray-700 mb-2">
                Référence de la Parcelle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="parcel_reference"
                name="parcel_reference"
                value={formData.parcel_reference}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ex: PAR-2024-001"
              />
            </div>

            <div>
              <label htmlFor="document_type" className="block text-sm font-semibold text-gray-700 mb-2">
                Type de Document <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="document_type"
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleChange}
                  required
                  className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-400 transition-colors appearance-none"
                >
                  <option value="">Sélectionnez le type</option>
                  <option value="Copie du titre foncier">Copie du titre foncier</option>
                  <option value="Certificat d’enregistrement">Certificat d’enregistrement</option>
                  <option value="Attestation de propriété">Attestation de propriété</option>
                  <option value="Extrait du registre foncier">Extrait du registre foncier</option>
                  <option value="Copie du plan cadastral">Copie du plan cadastral</option>
                  <option value="Certificat de situation juridique">Certificat de situation juridique</option>
                  <option value="Attestation de non-litige">Attestation de non-litige</option>
                  <option value="Historique des litiges sur une parcelle">Historique des litiges sur une parcelle</option>
                  <option value="Copie de décision administrative foncière">Copie de décision administrative foncière</option>
                  <option value="Certificat de mutation">Certificat de mutation</option>
                  <option value="Attestation de bornage">Attestation de bornage</option>
                  <option value="PV de bornage">PV de bornage</option>
                  <option value="Autre">Autre</option>
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              {loading ? 'Envoi en cours...' : 'Soumettre la Demande'}
            </button>
          </form>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mes Demandes</h3>
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors"
            >
              {showRequests ? 'Masquer' : 'Afficher'} mes demandes
            </button>
          </div>

          {showRequests && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">Aucune demande enregistrée</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{request.citizen_name}</h4>
                        <p className="text-sm text-gray-600">{request.parcel_reference}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{request.document_type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
