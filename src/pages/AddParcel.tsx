import { useState } from 'react';
import * as api from '../lib/api';
import { Save, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import type { ParcelInsert } from '../types/database';

export default function AddParcel() {
  const [formData, setFormData] = useState<ParcelInsert>({
    reference: '',
    parcel_number: '',
    province: '',
    territory_or_city: '',
    commune_or_sector: '',
    quartier_or_cheflieu: '',
    avenue: '',
    gps_lat: 0,
    gps_long: 0,
    area: 0,
    status: 'Libre',
    land_use: 'Résidentiel',
    certificate_number: '',
    issuing_authority: '',
    acquisition_type: 'Concession',
    acquisition_act_ref: '',
    title_date: '',
    owner_name: '',
    owner_id_number: '',
    surveying_pv_ref: '',
    surveyor_name: '',
    surveyor_license: '',
    cadastral_plan_ref: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.createParcel(formData);

      setMessage({ type: 'success', text: 'Parcelle enregistrée avec succès!' });
      setFormData({
        reference: '',
        parcel_number: '',
        province: '',
        territory_or_city: '',
        commune_or_sector: '',
        quartier_or_cheflieu: '',
        avenue: '',
        gps_lat: 0,
        gps_long: 0,
        area: 0,
        status: 'Libre',
        land_use: 'Résidentiel',
        certificate_number: '',
        issuing_authority: '',
        acquisition_type: 'Concession',
        acquisition_act_ref: '',
        title_date: '',
        owner_name: '',
        owner_id_number: '',
        surveying_pv_ref: '',
        surveyor_name: '',
        surveyor_license: '',
        cadastral_plan_ref: '',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['area','gps_lat','gps_long'].includes(name) ? parseFloat(value) || 0 : value,
    }));
  };

  const totalSteps = 6;
  const validateStep = (s: number) => {
    const requiredByStep: Record<number, string[]> = {
      1: ['parcel_number'],
      2: ['province','territory_or_city','commune_or_sector','quartier_or_cheflieu','avenue'],
      3: ['area','status','land_use'],
      4: ['title_date','acquisition_type','acquisition_act_ref'],
      5: ['owner_name','owner_id_number'],
      6: ['surveying_pv_ref','surveyor_name','surveyor_license'],
    };
    const keys = (requiredByStep[s] || []) as (keyof ParcelInsert)[];
    for (const k of keys) {
      const v = formData[k] as string | number | null | undefined;
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return false;
    }
    if (s === 3) {
      if (typeof formData.area !== 'number') return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      setMessage({ type: 'error', text: 'Veuillez compléter les champs requis de cette étape.' });
      return;
    }
    setMessage(null);
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setMessage(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Enregistrer une Nouvelle Parcelle</h2>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {[1,2,3,4,5,6].map((n) => (
                <div key={n} className={`h-2 w-12 rounded-full ${n <= step ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
              ))}
            </div>
            <div className="text-sm text-gray-600">Étape {step}/{totalSteps}</div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="reference" className="block text-sm font-semibold text-gray-700 mb-2">Référence Cadastrale</label>
                <input type="text" id="reference" name="reference" value={formData.reference} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Ex: KIN-2025-PAR-00456" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parcel_number" className="block text-sm font-semibold text-gray-700 mb-2">Numéro Parcelle <span className="text-red-500">*</span></label>
                  <input type="text" id="parcel_number" name="parcel_number" value={formData.parcel_number} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Ex: F-012/SEC-03/P-0456" />
                </div>
                <div>
                  <label htmlFor="cadastral_plan_ref" className="block text-sm font-semibold text-gray-700 mb-2">Réf. Plan Cadastral</label>
                  <input type="text" id="cadastral_plan_ref" name="cadastral_plan_ref" value={formData.cadastral_plan_ref} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Ex: Feuille 12 / Section 03" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleNext} disabled={!validateStep(step)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="province" className="block text-sm font-semibold text-gray-700 mb-2">Province <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      required
                      className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-400 transition-colors appearance-none"
                    >
                      <option value="">Sélectionnez la province</option>
                      <option value="Kinshasa">Kinshasa</option>
                      <option value="Kongo Central">Kongo Central</option>
                      <option value="Kwango">Kwango</option>
                      <option value="Kwilu">Kwilu</option>
                      <option value="Mai-Ndombe">Mai-Ndombe</option>
                      <option value="Kasaï">Kasaï</option>
                      <option value="Kasaï Central">Kasaï Central</option>
                      <option value="Kasaï Oriental">Kasaï Oriental</option>
                      <option value="Lomami">Lomami</option>
                      <option value="Sankuru">Sankuru</option>
                      <option value="Maniema">Maniema</option>
                      <option value="Sud-Kivu">Sud-Kivu</option>
                      <option value="Nord-Kivu">Nord-Kivu</option>
                      <option value="Tanganyika">Tanganyika</option>
                      <option value="Haut-Lomami">Haut-Lomami</option>
                      <option value="Lualaba">Lualaba</option>
                      <option value="Haut-Katanga">Haut-Katanga</option>
                      <option value="Ituri">Ituri</option>
                      <option value="Tshopo">Tshopo</option>
                      <option value="Bas-Uele">Bas-Uele</option>
                      <option value="Haut-Uele">Haut-Uele</option>
                      <option value="Mongala">Mongala</option>
                      <option value="Nord-Ubangi">Nord-Ubangi</option>
                      <option value="Sud-Ubangi">Sud-Ubangi</option>
                      <option value="Équateur">Équateur</option>
                      <option value="Tshuapa">Tshuapa</option>
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label htmlFor="territory_or_city" className="block text-sm font-semibold text-gray-700 mb-2">Ville/Territoire <span className="text-red-500">*</span></label>
                  <input type="text" id="territory_or_city" name="territory_or_city" value={formData.territory_or_city} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="commune_or_sector" className="block text-sm font-semibold text-gray-700 mb-2">Commune/Secteur <span className="text-red-500">*</span></label>
                  <input type="text" id="commune_or_sector" name="commune_or_sector" value={formData.commune_or_sector} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label htmlFor="quartier_or_cheflieu" className="block text-sm font-semibold text-gray-700 mb-2">Quartier/Chef-lieu <span className="text-red-500">*</span></label>
                  <input type="text" id="quartier_or_cheflieu" name="quartier_or_cheflieu" value={formData.quartier_or_cheflieu} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label htmlFor="avenue" className="block text-sm font-semibold text-gray-700 mb-2">Avenue/Rue <span className="text-red-500">*</span></label>
                <input type="text" id="avenue" name="avenue" value={formData.avenue} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={handlePrev} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50">Retour</button>
                <button type="button" onClick={handleNext} disabled={!validateStep(step)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gps_lat" className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                  <input type="number" id="gps_lat" name="gps_lat" value={formData.gps_lat} onChange={handleChange} step="0.00001" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label htmlFor="gps_long" className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                  <input type="number" id="gps_long" name="gps_long" value={formData.gps_long} onChange={handleChange} step="0.00001" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="area" className="block text-sm font-semibold text-gray-700 mb-2">Superficie (m²) <span className="text-red-500">*</span></label>
                  <input type="number" id="area" name="area" value={formData.area} onChange={handleChange} required min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Ex: 1000" />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">Statut Juridique <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-400 transition-colors appearance-none"
                    >
                      <option value="Libre">Libre</option>
                      <option value="En litige">En litige</option>
                      <option value="Hypothéqué">Hypothéqué</option>
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="land_use" className="block text-sm font-semibold text-gray-700 mb-2">Usage du sol <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    id="land_use"
                    name="land_use"
                    value={formData.land_use}
                    onChange={handleChange}
                    required
                    className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-400 transition-colors appearance-none"
                  >
                    <option value="Résidentiel">Résidentiel</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Agricole">Agricole</option>
                    <option value="Mixte">Mixte</option>
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={handlePrev} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50">Retour</button>
                <button type="button" onClick={handleNext} disabled={!validateStep(step)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="certificate_number" className="block text-sm font-semibold text-gray-700 mb-2">Numéro Certificat d’enregistrement</label>
                  <input type="text" id="certificate_number" name="certificate_number" value={formData.certificate_number} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Ex: CEKSH/2020/123456" />
                </div>
                <div>
                  <label htmlFor="issuing_authority" className="block text-sm font-semibold text-gray-700 mb-2">Autorité Émettrice</label>
                  <div className="relative">
                    <select
                      id="issuing_authority"
                      name="issuing_authority"
                      value={formData.issuing_authority}
                      onChange={handleChange}
                      className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-400 transition-colors appearance-none"
                    >
                      <option value="">Sélectionnez l’autorité émettrice</option>
                      <option value="Direction des Services Généraux et du Personnel">Direction des Services Généraux et du Personnel</option>
                      <option value="Direction des Titres Immobiliers">Direction des Titres Immobiliers</option>
                      <option value="Direction du Cadastre Foncier">Direction du Cadastre Foncier</option>
                      <option value="Direction du Contentieux Foncier et Immobilier">Direction du Contentieux Foncier et Immobilier</option>
                      <option value="Direction de l'École Nationale du Cadastre et des Titres Immobiliers">Direction de l'École Nationale du Cadastre et des Titres Immobiliers</option>
                      <option value="Direction des Études et Planifications">Direction des Études et Planifications</option>
                      <option value="Direction de l'Inspection">Direction de l'Inspection</option>
                      <option value="Direction du Cadastre Fiscal">Direction du Cadastre Fiscal</option>
                      <option value="Direction des Fonds de Promotion">Direction des Fonds de Promotion</option>
                      <option value="Direction des Biens sans Maître">Direction des Biens sans Maître</option>
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="acquisition_type" className="block text-sm font-semibold text-gray-700 mb-2">Type d’acquisition <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      id="acquisition_type"
                      name="acquisition_type"
                      value={formData.acquisition_type}
                      onChange={handleChange}
                      required
                      className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-400 transition-colors appearance-none"
                    >
                      <option value="Concession">Concession</option>
                      <option value="Vente">Vente</option>
                      <option value="Donation">Donation</option>
                      <option value="Succession">Succession</option>
                      <option value="Échange">Échange</option>
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label htmlFor="acquisition_act_ref" className="block text-sm font-semibold text-gray-700 mb-2">Référence Acte <span className="text-red-500">*</span></label>
                  <input type="text" id="acquisition_act_ref" name="acquisition_act_ref" value={formData.acquisition_act_ref} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label htmlFor="title_date" className="block text-sm font-semibold text-gray-700 mb-2">Date du Titre <span className="text-red-500">*</span></label>
                <input type="date" id="title_date" name="title_date" value={formData.title_date} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="servitudes" className="block text-sm font-semibold text-gray-700 mb-2">Servitudes</label>
                <textarea id="servitudes" name="servitudes" value={(formData.servitudes as string) || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="charges" className="block text-sm font-semibold text-gray-700 mb-2">Hypothèques/Charges</label>
                <textarea id="charges" name="charges" value={(formData.charges as string) || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="litigation" className="block text-sm font-semibold text-gray-700 mb-2">Litiges en cours</label>
                <textarea id="litigation" name="litigation" value={(formData.litigation as string) || ''} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={handlePrev} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50">Retour</button>
                <button type="button" onClick={handleNext} disabled={!validateStep(step)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_name" className="block text-sm font-semibold text-gray-700 mb-2">Nom du Propriétaire <span className="text-red-500">*</span></label>
                  <input type="text" id="owner_name" name="owner_name" value={formData.owner_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Ex: Jean Dupont" />
                </div>
                <div>
                  <label htmlFor="owner_id_number" className="block text-sm font-semibold text-gray-700 mb-2">Numéro d’identité <span className="text-red-500">*</span></label>
                  <input type="text" id="owner_id_number" name="owner_id_number" value={formData.owner_id_number} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={handlePrev} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50">Retour</button>
                <button type="button" onClick={handleNext} disabled={!validateStep(step)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="surveying_pv_ref" className="block text-sm font-semibold text-gray-700 mb-2">Réf. PV de Bornage <span className="text-red-500">*</span></label>
                  <input type="text" id="surveying_pv_ref" name="surveying_pv_ref" value={formData.surveying_pv_ref} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label htmlFor="surveyor_name" className="block text-sm font-semibold text-gray-700 mb-2">Géomètre agréé <span className="text-red-500">*</span></label>
                  <input type="text" id="surveyor_name" name="surveyor_name" value={formData.surveyor_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label htmlFor="surveyor_license" className="block text-sm font-semibold text-gray-700 mb-2">N° d’agrément <span className="text-red-500">*</span></label>
                <input type="text" id="surveyor_license" name="surveyor_license" value={formData.surveyor_license} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={handlePrev} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50">Retour</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save size={20} />
                  {loading ? 'Enregistrement...' : 'Enregistrer la Parcelle'}
                </button>
              </div>
            </div>
          )}
        </form>

        
      </div>
    </div>
  );
}
