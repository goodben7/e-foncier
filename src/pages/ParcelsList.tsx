import { useEffect, useState, useCallback } from 'react';
import * as api from '../lib/api';
import type { Parcel, ParcelUpdate } from '../types/database';
import { MapPin, Maximize2, User, FileText, Hash, X, ChevronLeft, ChevronRight, Save, Edit, Info, AlertCircle, Clock, MessageSquare, Tag } from 'lucide-react';

export default function ParcelsList() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(() => sessionStorage.getItem('parcelFilter') || 'all');
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ParcelUpdate>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<{ id: string; parcel_id: string; changes: string; changed_at: string; user: string }[]>([]);
  const [notes, setNotes] = useState<{ id: string; parcel_id: string; note: string; author: string; created_at: string }[]>([]);
  const [noteText, setNoteText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');

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

  const steps = [
    'Informations générales',
    'Localisation',
    'Titre et acquisition',
    'Propriétaire',
    'Levés cadastraux',
    'Servitudes et charges',
  ];

  const openModal = (p: Parcel) => {
    setSelected(p);
    setForm({
      reference: p.reference,
      parcel_number: p.parcel_number,
      province: p.province,
      territory_or_city: p.territory_or_city,
      commune_or_sector: p.commune_or_sector,
      quartier_or_cheflieu: p.quartier_or_cheflieu,
      avenue: p.avenue,
      gps_lat: p.gps_lat,
      gps_long: p.gps_long,
      area: p.area,
      location: p.location,
      status: p.status,
      land_use: p.land_use,
      certificate_number: p.certificate_number,
      issuing_authority: p.issuing_authority,
      acquisition_type: p.acquisition_type,
      acquisition_act_ref: p.acquisition_act_ref,
      title_date: p.title_date,
      owner_name: p.owner_name,
      owner_id_number: p.owner_id_number,
      company_name: p.company_name,
      rccm: p.rccm,
      nif: p.nif,
      surveying_pv_ref: p.surveying_pv_ref,
      surveyor_name: p.surveyor_name,
      surveyor_license: p.surveyor_license,
      cadastral_plan_ref: p.cadastral_plan_ref,
      servitudes: p.servitudes,
      charges: p.charges,
      litigation: p.litigation,
    });
    setStep(0);
    setError(null);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
    setForm({});
    setStep(0);
    setError(null);
  };

  const setField = (k: keyof ParcelUpdate, v: unknown) => {
    setForm(prev => ({ ...prev, [k]: v }));
    let msg = '';
    if (k === 'area') {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) msg = 'Superficie invalide';
    }
    if (k === 'gps_lat') {
      const n = Number(v);
      if (!Number.isFinite(n) || n < -90 || n > 90) msg = 'Latitude invalide';
    }
    if (k === 'gps_long') {
      const n = Number(v);
      if (!Number.isFinite(n) || n < -180 || n > 180) msg = 'Longitude invalide';
    }
    setErrors(prev => ({ ...prev, [k as string]: msg }));
  };

  const hasChanges = () => {
    if (!selected) return false;
    const keys = Object.keys(form);
    for (const k of keys) {
      const fv = (form as Record<string, unknown>)[k];
      const sv = (selected as Record<string, unknown>)[k];
      if (fv !== sv) return true;
    }
    return false;
  };

  const validateRequired = () => {
    const req = ['parcel_number','province','territory_or_city','commune_or_sector','quartier_or_cheflieu','avenue','area','status','land_use','acquisition_type','acquisition_act_ref','title_date','owner_name','owner_id_number'] as (keyof ParcelUpdate)[];
    for (const k of req) {
      const v = (form as Record<string, unknown>)[k];
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
        setError(`Champ requis manquant: ${k}`);
        return false;
      }
    }
    return true;
  };

  const save = async () => {
    if (!selected) return;
    setError(null);
    if (!validateRequired()) return;
    setSaving(true);
    try {
      const updated = await api.updateParcel(selected.id, form);
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      const keys = Object.keys(form);
      for (const k of keys) {
        const fv = (form as Record<string, unknown>)[k];
        const sv = (selected as Record<string, unknown>)[k];
        if (fv !== sv) changes[k] = { from: sv, to: fv };
      }
      if (Object.keys(changes).length > 0) {
        try { await api.addParcelHistory(selected.id, changes, 'Agent'); } catch { void 0 }
      }
      setParcels(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      closeModal();
    } catch (e) {
      const msg = typeof (e as { message?: string })?.message === 'string' ? (e as { message?: string }).message : 'Erreur lors de la mise à jour';
      setError(msg ?? null);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (open && selected) {
      api.getParcelHistory(selected.id).then(setHistory).catch(() => setHistory([]));
      api.getParcelNotes(selected.id).then(setNotes).catch(() => setNotes([]));
    }
  }, [open, selected]);

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
              onClick={() => openModal(parcel)}
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
                    <p className="text-xs text-gray-500">Titre foncier</p>
                    <p className="text-sm font-medium text-gray-900">{parcel.certificate_number}</p>
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

      {open && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-[95vw] sm:max-w-3xl rounded-xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Edit size={18} className="text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900">Parcelle {selected.reference}</h3>
              </div>
              <button onClick={() => { if (!hasChanges() || window.confirm('Êtes-vous sûr de vouloir annuler ?')) closeModal(); }} className="p-2 rounded hover:bg-gray-100" aria-label="Fermer">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Tag size={16} className="text-emerald-700" />
                  <span className="text-sm text-gray-800">{selected.reference}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <FileText size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-800">{form.parcel_number || selected.parcel_number}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <Maximize2 size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-800">{(form.area ?? selected.area)?.toLocaleString()} m²</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(form.status || selected.status)}`}>
                  <AlertCircle size={16} />
                  <span className="text-sm">{form.status || selected.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Étape {step + 1} / {steps.length} — {steps[step]}</span>
                <div className="flex gap-2">
                  <button disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))} className={`px-3 py-2 rounded-lg border ${step === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} flex items-center gap-1`}>
                    <ChevronLeft size={16} /> Préc.
                  </button>
                  <button disabled={step === steps.length - 1} onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} className={`px-3 py-2 rounded-lg border ${step === steps.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} flex items-center gap-1`}>
                    Suiv. <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
                <div className="h-2 bg-emerald-600 rounded-full" style={{ width: `${Math.round(((step + 1) / steps.length) * 100)}%` }} />
              </div>

              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reference" className="text-xs text-gray-600">Référence</label>
                    <input id="reference" value={form.reference || ''} readOnly className="w-full h-10 px-3 border rounded-lg bg-gray-100 text-gray-600" />
                  </div>
                  <div>
                    <label htmlFor="parcel_number" className="text-xs text-gray-600">Numéro de parcelle</label>
                    <input id="parcel_number" value={form.parcel_number || ''} onChange={e => setField('parcel_number', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="area" className="text-xs text-gray-600">Superficie (m²)</label>
                    <input id="area" type="number" value={form.area ?? ''} onChange={e => setField('area', Number(e.target.value))} aria-invalid={Boolean(errors.area)} className={`w-full h-10 px-3 border rounded-lg ${errors.area ? 'border-red-500' : ''}`} />
                    {errors.area && <div className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.area}</div>}
                  </div>
                  <div>
                    <label htmlFor="status" className="text-xs text-gray-600">Statut</label>
                    <select id="status" value={form.status || ''} onChange={e => setField('status', e.target.value)} className="w-full h-10 px-3 border rounded-lg">
                      <option value="Libre">Libre</option>
                      <option value="En litige">En litige</option>
                      <option value="Hypothéqué">Hypothéqué</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="land_use" className="text-xs text-gray-600 flex items-center gap-1">Affectation <span title="Destination de la parcelle"><Info size={14} className="text-gray-400" /></span></label>
                    <select id="land_use" value={form.land_use || ''} onChange={e => setField('land_use', e.target.value)} className="w-full h-10 px-3 border rounded-lg">
                      <option value="Résidentiel">Résidentiel</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Agricole">Agricole</option>
                      <option value="Mixte">Mixte</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="province" className="text-xs text-gray-600">Province</label>
                    <input id="province" value={form.province || ''} onChange={e => setField('province', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="territory_or_city" className="text-xs text-gray-600">Ville / Territoire</label>
                    <input id="territory_or_city" value={form.territory_or_city || ''} onChange={e => setField('territory_or_city', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="commune_or_sector" className="text-xs text-gray-600">Commune / Secteur</label>
                    <input id="commune_or_sector" value={form.commune_or_sector || ''} onChange={e => setField('commune_or_sector', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="quartier_or_cheflieu" className="text-xs text-gray-600">Quartier / Cheflieu</label>
                    <input id="quartier_or_cheflieu" value={form.quartier_or_cheflieu || ''} onChange={e => setField('quartier_or_cheflieu', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="avenue" className="text-xs text-gray-600">Avenue</label>
                    <input id="avenue" value={form.avenue || ''} onChange={e => setField('avenue', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="location" className="text-xs text-gray-600">Localisation</label>
                    <input id="location" value={form.location || ''} onChange={e => setField('location', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="gps_lat" className="text-xs text-gray-600">GPS Lat</label>
                    <input id="gps_lat" type="number" value={form.gps_lat ?? ''} onChange={e => setField('gps_lat', Number(e.target.value))} aria-invalid={Boolean(errors.gps_lat)} className={`w-full h-10 px-3 border rounded-lg ${errors.gps_lat ? 'border-red-500' : ''}`} />
                    {errors.gps_lat && <div className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.gps_lat}</div>}
                  </div>
                  <div>
                    <label htmlFor="gps_long" className="text-xs text-gray-600">GPS Long</label>
                    <input id="gps_long" type="number" value={form.gps_long ?? ''} onChange={e => setField('gps_long', Number(e.target.value))} aria-invalid={Boolean(errors.gps_long)} className={`w-full h-10 px-3 border rounded-lg ${errors.gps_long ? 'border-red-500' : ''}`} />
                    {errors.gps_long && <div className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.gps_long}</div>}
                  </div>
                </div>
                {typeof form.gps_lat === 'number' && typeof form.gps_long === 'number' ? (
                  <div className="mt-4">
                    <div className="text-xs text-gray-600 mb-2 flex items-center gap-1"><MapPin size={14} /> Mini-carte</div>
                    <div className="w-full rounded-lg overflow-hidden border">
                      <iframe
                        title="Carte de la parcelle"
                        className="w-full h-64"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.gps_long - 0.01},${form.gps_lat - 0.01},${form.gps_long + 0.01},${form.gps_lat + 0.01}&layer=mapnik&marker=${form.gps_lat},${form.gps_long}`}
                      />
                    </div>
                  </div>
                ) : null}
                </>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="certificate_number" className="text-xs text-gray-600">N° Titre foncier</label>
                    <input id="certificate_number" value={form.certificate_number || ''} onChange={e => setField('certificate_number', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="issuing_authority" className="text-xs text-gray-600">Autorité émettrice</label>
                    <input id="issuing_authority" value={form.issuing_authority || ''} onChange={e => setField('issuing_authority', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="acquisition_type" className="text-xs text-gray-600 flex items-center gap-1">Type d’acquisition <span title="Concession, Achat ou Donation"><Info size={14} className="text-gray-400" /></span></label>
                    <select id="acquisition_type" value={form.acquisition_type || ''} onChange={e => setField('acquisition_type', e.target.value)} className="w-full h-10 px-3 border rounded-lg">
                      <option value="Concession">Concession</option>
                      <option value="Achat">Achat</option>
                      <option value="Donation">Donation</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="acquisition_act_ref" className="text-xs text-gray-600">Réf. acte d’acquisition</label>
                    <input id="acquisition_act_ref" value={form.acquisition_act_ref || ''} onChange={e => setField('acquisition_act_ref', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="title_date" className="text-xs text-gray-600">Date du titre</label>
                    <input id="title_date" type="date" value={form.title_date || ''} onChange={e => setField('title_date', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="owner_name" className="text-xs text-gray-600">Propriétaire</label>
                    <input id="owner_name" value={form.owner_name || ''} onChange={e => setField('owner_name', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="owner_id_number" className="text-xs text-gray-600">N° Identité</label>
                    <input id="owner_id_number" value={form.owner_id_number || ''} onChange={e => setField('owner_id_number', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="company_name" className="text-xs text-gray-600">Société</label>
                    <input id="company_name" value={form.company_name || ''} onChange={e => setField('company_name', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="rccm" className="text-xs text-gray-600">RCCM</label>
                    <input id="rccm" value={form.rccm || ''} onChange={e => setField('rccm', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="nif" className="text-xs text-gray-600">NIF</label>
                    <input id="nif" value={form.nif || ''} onChange={e => setField('nif', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="surveying_pv_ref" className="text-xs text-gray-600">Réf. PV de bornage</label>
                    <input id="surveying_pv_ref" value={form.surveying_pv_ref || ''} onChange={e => setField('surveying_pv_ref', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="surveyor_name" className="text-xs text-gray-600">Géomètre</label>
                    <input id="surveyor_name" value={form.surveyor_name || ''} onChange={e => setField('surveyor_name', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="surveyor_license" className="text-xs text-gray-600">Licence</label>
                    <input id="surveyor_license" value={form.surveyor_license || ''} onChange={e => setField('surveyor_license', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="cadastral_plan_ref" className="text-xs text-gray-600">Réf. plan cadastral</label>
                    <input id="cadastral_plan_ref" value={form.cadastral_plan_ref || ''} onChange={e => setField('cadastral_plan_ref', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="servitudes" className="text-xs text-gray-600">Servitudes</label>
                    <input id="servitudes" value={form.servitudes || ''} onChange={e => setField('servitudes', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="charges" className="text-xs text-gray-600">Charges</label>
                    <input id="charges" value={form.charges || ''} onChange={e => setField('charges', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                  <div>
                    <label htmlFor="litigation" className="text-xs text-gray-600">Litiges</label>
                    <input id="litigation" value={form.litigation || ''} onChange={e => setField('litigation', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-gray-500" /><span className="text-sm font-medium text-gray-700">Historique des modifications</span></div>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {history.length === 0 ? (
                      <div className="text-xs text-gray-500">Aucun historique</div>
                    ) : (
                      history.map(h => {
                        let items: string[] = []
                        try {
                          const obj = JSON.parse(h.changes || '{}') as Record<string, { from: unknown; to: unknown }>
                          items = Object.keys(obj).slice(0, 4).map(k => `${k}`)
                        } catch { items = [] }
                        return (
                          <div key={h.id} className="text-xs text-gray-700">
                            <span className="font-medium">{h.user}</span> — {new Date(h.changed_at).toLocaleString('fr-FR')}
                            {items.length > 0 && <div className="text-gray-600">Champs modifiés: {items.join(', ')}</div>}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2"><MessageSquare size={16} className="text-gray-500" /><span className="text-sm font-medium text-gray-700">Notes</span></div>
                  <div className="space-y-2 max-h-48 overflow-auto mb-2">
                    {notes.length === 0 ? (
                      <div className="text-xs text-gray-500">Aucune note</div>
                    ) : (
                      notes.map(n => (
                        <div key={n.id} className="text-xs text-gray-700">
                          <span className="font-medium">{n.author}</span>: {n.note}
                          <span className="text-gray-500"> — {new Date(n.created_at).toLocaleString('fr-FR')}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Ajouter une note" className="flex-1 h-10 px-3 border rounded-lg" />
                    <button onClick={async () => { if (!selected || !noteText.trim()) return; const added = await api.addParcelNote(selected.id, noteText.trim(), 'Agent'); setNotes(prev => [added, ...prev]); setNoteText(''); }} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Ajouter</button>
                  </div>
                </div>
              </div>
              {reportOpen && (
                <div className="mt-4 border rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Signaler un problème</div>
                  <textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="Décrivez le problème rencontré" className="w-full h-24 px-3 py-2 border rounded-lg" />
                  <div className="mt-2 flex gap-2">
                    <button onClick={async () => { if (!selected || !reportText.trim()) return; const added = await api.addParcelNote(selected.id, `Signalement: ${reportText.trim()}`, 'Citoyen'); setNotes(prev => [added, ...prev]); setReportText(''); setReportOpen(false); }} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Envoyer</button>
                    <button onClick={() => setReportOpen(false)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Annuler</button>
                  </div>
                </div>
              )}
              {error && <div className="mt-4 text-sm text-red-600" aria-live="polite">{error}</div>}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <button onClick={() => { if (!hasChanges() || window.confirm('Êtes-vous sûr de vouloir annuler ?')) closeModal(); }} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Annuler</button>
                <button onClick={() => setReportOpen(true)} className="text-emerald-700 underline">Signaler un problème</button>
              </div>
              <button onClick={save} disabled={saving} className={`px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                <Save size={16} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
