import { useState, useEffect, useMemo } from 'react';
import * as api from '../lib/api';
import type { RequestInsert, Request } from '../types/database';
import { AlertCircle, CheckCircle, Clock, CheckCheck, XCircle, ChevronDown, Search as SearchIcon, Filter, Calendar, Info, Paperclip, Bell, FileDown, Mail, Phone, X, Trash2 } from 'lucide-react';

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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [proofData, setProofData] = useState<{ citizen_name: string; parcel_reference: string; document_type: string; submitted_at: string } | null>(null);
  const [reqStatusFilter, setReqStatusFilter] = useState<'all' | 'En attente' | 'Approuvé' | 'Rejeté'>('all');
  const [reqSearchText, setReqSearchText] = useState('');
  const [reqDateFrom, setReqDateFrom] = useState('');
  const [reqDateTo, setReqDateTo] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const filtersActive = useMemo(() => (reqStatusFilter !== 'all') || Boolean(reqSearchText.trim()) || Boolean(reqDateFrom) || Boolean(reqDateTo), [reqStatusFilter, reqSearchText, reqDateFrom, reqDateTo]);

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

  const filteredRequests = useMemo(() => {
    const s = reqSearchText.trim().toLowerCase();
    const df = reqDateFrom ? new Date(reqDateFrom) : undefined;
    const dt = reqDateTo ? new Date(reqDateTo) : undefined;
    return requests.filter((r) => {
      if (reqStatusFilter !== 'all' && r.status !== reqStatusFilter) return false;
      if (s) {
        const any = [r.parcel_reference, r.citizen_name].some((x) => String(x || '').toLowerCase().includes(s));
        if (!any) return false;
      }
      const d = new Date(r.created_at);
      if (df && d < df) return false;
      if (dt && d > dt) return false;
      return true;
    });
  }, [requests, reqStatusFilter, reqSearchText, reqDateFrom, reqDateTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.createRequest(formData);
      const submittedAt = new Date().toLocaleString('fr-FR');
      setProofData({ citizen_name: formData.citizen_name, parcel_reference: formData.parcel_reference, document_type: formData.document_type, submitted_at: submittedAt });

      if (attachments.length > 0) {
        try {
          const parcel = await api.getParcelByReference(formData.parcel_reference);
          if (parcel) {
            const types = attachments.map(() => formData.document_type || 'Justificatif');
            await api.uploadParcelDocuments(parcel.id, attachments, types);
          }
        } catch { void 0 }
      }

      setMessage({ type: 'success', text: 'Demande soumise avec succès! Vous serez contacté prochainement.' });
      setFormData({
        citizen_name: '',
        parcel_reference: '',
        document_type: '',
        status: 'En attente',
      });
      setAttachments([]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setAttachments(files);
  };

  const downloadProof = () => {
    const data = proofData;
    const text = `Preuve de soumission\nNom: ${data?.citizen_name || ''}\nRéférence parcelle: ${data?.parcel_reference || ''}\nType de document: ${data?.document_type || ''}\nDate: ${data?.submitted_at || new Date().toLocaleString('fr-FR')}\nStatut initial: En attente\n`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preuve_demande_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setReqStatusFilter('all');
    setReqSearchText('');
    setReqDateFrom('');
    setReqDateTo('');
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Demande de Document en Ligne</h2>
          <p className="text-gray-600">Consultez et suivez vos demandes de documents fonciers</p>
        </div>
        <button onClick={() => setNewOpen(true)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Nouvelle Demande</button>
      </div>

      <div className="grid grid-cols-1 gap-8">
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
              <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs"><Filter size={12} /> Filtres</span>
                <div className="flex items-center gap-1 bg-gray-50 rounded-md p-1">
                  {(['all','En attente','Approuvé','Rejeté'] as const).map((s) => (
                    <button key={s} onClick={() => setReqStatusFilter(s)} className={`px-3 h-8 rounded ${reqStatusFilter===s ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 text-gray-700'} text-xs font-medium`}>{s==='all' ? 'Tous' : s}</button>
                  ))}
                </div>
                <div className="relative">
                  <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={reqSearchText} onChange={(e) => setReqSearchText(e.target.value)} placeholder="Référence ou nom" className="h-9 w-[180px] pl-8 pr-2 border rounded text-sm" aria-label="Rechercher par référence ou nom" />
                </div>
                <div className="relative">
                  <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={reqDateFrom} onChange={(e) => setReqDateFrom(e.target.value)} className="h-9 w-[150px] pl-8 pr-2 border rounded text-sm" aria-label="Depuis la date" />
                </div>
                <div className="relative">
                  <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={reqDateTo} onChange={(e) => setReqDateTo(e.target.value)} className="h-9 w-[150px] pl-8 pr-2 border rounded text-sm" aria-label="Jusqu’à la date" />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-gray-600">Résultats: {filteredRequests.length}</span>
                  <button onClick={clearFilters} disabled={!filtersActive} className={`h-9 px-3 rounded border text-sm flex items-center gap-1 ${filtersActive ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`} title="Effacer les filtres"><Trash2 size={14} /> Effacer</button>
                </div>
              </div>
              {(reqStatusFilter!=='all' || reqSearchText || reqDateFrom || reqDateTo) && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {reqStatusFilter!=='all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">Statut: {reqStatusFilter}<button onClick={() => setReqStatusFilter('all')} className="ml-1 p-0.5 rounded hover:bg-emerald-100" aria-label="Effacer statut"><X size={12} /></button></span>
                  )}
                  {reqSearchText && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border">Recherche: “{reqSearchText}”<button onClick={() => setReqSearchText('')} className="ml-1 p-0.5 rounded hover:bg-gray-100" aria-label="Effacer recherche"><X size={12} /></button></span>
                  )}
                  {reqDateFrom && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border">De: {reqDateFrom}<button onClick={() => setReqDateFrom('')} className="ml-1 p-0.5 rounded hover:bg-gray-100" aria-label="Effacer date depuis"><X size={12} /></button></span>
                  )}
                  {reqDateTo && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border">À: {reqDateTo}<button onClick={() => setReqDateTo('')} className="ml-1 p-0.5 rounded hover:bg-gray-100" aria-label="Effacer date jusqu"><X size={12} /></button></span>
                  )}
                </div>
              )}
              {requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">Aucune demande enregistrée</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{request.citizen_name}</h4>
                          <p className="text-sm text-gray-600">{request.parcel_reference}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{request.document_type}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <div className="mt-2">
                        <div className="w-full h-2 bg-gray-100 rounded">
                          <div className={`${request.status === 'En attente' ? 'bg-orange-500' : request.status === 'Approuvé' ? 'bg-green-600' : 'bg-red-600'} h-2 rounded`} style={{ width: request.status === 'En attente' ? '33%' : '100%' }} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Avancement {request.status === 'En attente' ? '— en cours' : '— terminé'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {newOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setNewOpen(false)}></div>
          <div role="dialog" aria-modal="true" className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h4 className="text-lg font-bold text-gray-900">Nouvelle Demande</h4>
                <button onClick={() => setNewOpen(false)} className="p-2 rounded hover:bg-gray-100" aria-label="Fermer"><X size={18} className="text-gray-600" /></button>
              </div>
              <div className="p-4">
                {message && (
                  <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex items-center gap-3">
                      {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                      <span>{message.text}</span>
                    </div>
                    {message.type === 'success' && (
                      <div className="mt-3">
                        <button onClick={downloadProof} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"><FileDown size={16} /> Télécharger la preuve</button>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <label htmlFor="parcel_reference" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      Référence de la Parcelle <span className="text-red-500">*</span>
                      <span title="La référence de parcelle est un identifiant unique (ex: SEED-2025-73fa7e).">
                        <Info size={16} className="text-gray-400" />
                      </span>
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Paperclip size={16} className="text-gray-500" /> Documents justificatifs (optionnel)</label>
                    <div className="flex items-center gap-2">
                      <input type="file" multiple onChange={handleFileChange} aria-label="Téléverser des documents justificatifs" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white" />
                      {attachments.length > 0 && <span className="text-xs text-gray-600">{attachments.length} fichier(s) sélectionné(s)</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Bell size={16} className="text-gray-500" /> Notifications</label>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700">
                        <input type="checkbox" checked={wantsNotifications} onChange={(e) => setWantsNotifications(e.target.checked)} />
                        <span className="ml-2">Recevoir des notifications de statut</span>
                      </label>
                    </div>
                    {wantsNotifications && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label htmlFor="notify_email" className="block text-xs text-gray-600 mb-1 flex items-center gap-1"><Mail size={14} className="text-gray-400" /> Email</label>
                          <input id="notify_email" type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: citoyen@example.com" />
                        </div>
                        <div>
                          <label htmlFor="notify_phone" className="block text-xs text-gray-600 mb-1 flex items-center gap-1"><Phone size={14} className="text-gray-400" /> Téléphone</label>
                          <input id="notify_phone" type="tel" value={notifyPhone} onChange={(e) => setNotifyPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: +243 900 000 000" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setNewOpen(false)} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Annuler</button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Envoi en cours...' : 'Soumettre la Demande'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
