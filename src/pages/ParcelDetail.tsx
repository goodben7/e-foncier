import { useEffect, useState, useCallback } from 'react';
import * as api from '../lib/api';
import type { Parcel, ParcelUpdate, Document } from '../types/database';
import { MapPin, Maximize2, FileText, X, ChevronLeft, ChevronRight, Save, Edit, Info, AlertCircle, Clock, MessageSquare, Tag, Pencil, Trash2, ChevronDown, CheckCircle, Lock, AlertTriangle, Home, Building2, Leaf, Layers, Paperclip, Download } from 'lucide-react';

interface Props {
  onNavigate: (page: string) => void;
}

export default function ParcelDetail({ onNavigate }: Props) {
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [historyFilterText, setHistoryFilterText] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [secondaryTab, setSecondaryTab] = useState<'history' | 'notes' | 'documents'>('notes');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [landUseOpen, setLandUseOpen] = useState(false);

  const steps = [
    'Informations générales',
    'Localisation',
    'Titre et acquisition',
    'Propriétaire',
    'Levés cadastraux',
    'Servitudes et charges',
  ];

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ref = sessionStorage.getItem('parcelDetailRef') || '';
      if (!ref) throw new Error('Référence manquante');
      const p = await api.getParcelByReference(ref);
      if (!p) throw new Error('Parcelle introuvable');
      setParcel(p);
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
      const hid = api.getParcelHistory(p.id).then(setHistory).catch(() => setHistory([]));
      const nid = api.getParcelNotes(p.id).then(setNotes).catch(() => setNotes([]));
      const did = api.getParcelDocuments(p.id).then(setDocuments).catch(() => setDocuments([]));
      await Promise.allSettled([hid, nid, did]);
      setStep(0);
      setError(null);
    } catch (e) {
      const err = e as { message?: string };
      const msg: string = typeof err?.message === 'string' ? err.message : 'Erreur lors du chargement';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (!parcel) return false;
    const keys = Object.keys(form);
    for (const k of keys) {
      const fv = (form as Record<string, unknown>)[k];
      const sv = (parcel as Record<string, unknown>)[k];
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
    if (!parcel) return;
    setError(null);
    if (!validateRequired()) return;
    setSaving(true);
    try {
      const updated = await api.updateParcel(parcel.id, form);
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      const keys = Object.keys(form);
      for (const k of keys) {
        const fv = (form as Record<string, unknown>)[k];
        const sv = (parcel as Record<string, unknown>)[k];
        if (fv !== sv) changes[k] = { from: sv, to: fv };
      }
      if (Object.keys(changes).length > 0) {
        try { await api.addParcelHistory(parcel.id, changes, 'Agent'); } catch { void 0 }
      }
      setParcel(updated);
    } catch (e) {
      const msg = typeof (e as { message?: string })?.message === 'string' ? (e as { message?: string }).message : 'Erreur lors de la mise à jour';
      setError(msg ?? null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Chargement de la parcelle...</div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-red-600">{error || 'Parcelle introuvable'}</div>
          <div className="mt-4">
            <button onClick={() => onNavigate('parcels-list')} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Retour à la liste</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Edit size={20} className="text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-900">Parcelle {parcel.reference}</h2>
        </div>
        <button onClick={() => { if (!hasChanges() || window.confirm('Êtes-vous sûr de vouloir quitter ?')) onNavigate('parcels-list'); }} className="p-2 rounded hover:bg-gray-100" aria-label="Retour">
          <X size={20} className="text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <Tag size={16} className="text-emerald-700" />
              <span className="text-sm text-gray-800">{parcel.reference}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <FileText size={16} className="text-gray-600" />
              <span className="text-sm text-gray-800">{form.parcel_number || parcel.parcel_number}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <Maximize2 size={16} className="text-gray-600" />
              <span className="text-sm text-gray-800">{(form.area ?? parcel.area)?.toLocaleString()} m²</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(form.status || parcel.status)}`}>
              <AlertCircle size={16} />
              <span className="text-sm">{form.status || parcel.status}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <MapPin size={16} className="text-gray-600" />
              <span className="text-sm text-gray-800" title="Destination d’utilisation de la parcelle">{form.land_use || parcel.land_use}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
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
          <div className="w-full h-2 bg-gray-100 rounded-full mt-3">
            <div className="h-2 bg-emerald-600 rounded-full" style={{ width: `${Math.round(((step + 1) / steps.length) * 100)}%` }} />
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">Détails supplémentaires</summary>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="text-xs text-gray-600">Adresse complète
                <div className="mt-1 text-sm text-gray-800">{`${parcel.avenue}, ${parcel.quartier_or_cheflieu}, ${parcel.commune_or_sector}`}</div>
              </div>
              <div className="text-xs text-gray-600">Localisation
                <div className="mt-1 text-sm text-gray-800 flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> {parcel.province} — {parcel.territory_or_city}</div>
              </div>
              <div className="text-xs text-gray-600">Date de création
                <div className="mt-1 text-sm text-gray-800">{new Date(parcel.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </details>
          </div>

          <div className="px-6 py-4">
          {(() => {
            const lat = (form.gps_lat ?? parcel.gps_lat) as number | undefined
            const lon = (form.gps_long ?? parcel.gps_long) as number | undefined
            const valid = typeof lat === 'number' && Number.isFinite(lat) && typeof lon === 'number' && Number.isFinite(lon)
            if (!valid) return null
            const delta = 0.01
            const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
            const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`
            const fullUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
            return (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-gray-500" /><span className="text-sm font-medium text-gray-700">Mini-carte</span></div>
                <div className="h-52 border rounded-lg overflow-hidden">
                  <iframe title="Carte de la parcelle" src={embedUrl} className="w-full h-full" />
                </div>
                <a href={fullUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-emerald-700 underline">Ouvrir dans OpenStreetMap</a>
              </div>
            )
          })()}

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
              <div className="relative">
                <span className="text-xs text-gray-600">Statut</span>
                <button type="button" onClick={() => setStatusOpen(s => !s)} aria-haspopup="listbox" aria-expanded={statusOpen} className="w-full h-10 px-3 border rounded-lg flex items-center justify-between">
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border ${getStatusColor(form.status || parcel.status)}`}>
                    {(() => {
                      const v = form.status || parcel.status
                      if (v === 'Libre') return <CheckCircle size={14} />
                      if (v === 'En litige') return <AlertTriangle size={14} />
                      if (v === 'Hypothéqué') return <Lock size={14} />
                      return <AlertCircle size={14} />
                    })()}
                    <span className="text-xs">{form.status || parcel.status}</span>
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                {statusOpen && (
                  <div role="listbox" className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                    {['Libre','En litige','Hypothéqué'].map(v => (
                      <div key={v} role="option" aria-selected={(form.status || parcel.status) === v} onClick={() => { setField('status', v); setStatusOpen(false); }} className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                        {v === 'Libre' && <CheckCircle size={14} className="text-emerald-600" />}
                        {v === 'En litige' && <AlertTriangle size={14} className="text-orange-600" />}
                        {v === 'Hypothéqué' && <Lock size={14} className="text-red-600" />}
                        <span className="text-sm">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-600 flex items-center gap-1">Affectation <span title="Destination de la parcelle"><Info size={14} className="text-gray-400" /></span></span>
                <div className="relative">
                  <button type="button" onClick={() => setLandUseOpen(s => !s)} aria-haspopup="listbox" aria-expanded={landUseOpen} className="w-full h-10 px-3 border rounded-lg flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      {(() => {
                        const v = form.land_use || parcel.land_use
                        if (v === 'Résidentiel') return <Home size={14} className="text-gray-600" />
                        if (v === 'Commercial') return <Building2 size={14} className="text-gray-600" />
                        if (v === 'Agricole') return <Leaf size={14} className="text-gray-600" />
                        return <Layers size={14} className="text-gray-600" />
                      })()}
                      <span className="text-sm">{form.land_use || parcel.land_use}</span>
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>
                  {landUseOpen && (
                    <div role="listbox" className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                      {[
                        { v: 'Résidentiel', I: <Home size={14} className="text-gray-600" /> },
                        { v: 'Commercial', I: <Building2 size={14} className="text-gray-600" /> },
                        { v: 'Agricole', I: <Leaf size={14} className="text-gray-600" /> },
                        { v: 'Mixte', I: <Layers size={14} className="text-gray-600" /> },
                      ].map(({ v, I }) => (
                        <div key={v} role="option" aria-selected={(form.land_use || parcel.land_use) === v} onClick={() => { setField('land_use', v); setLandUseOpen(false); }} className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                          {I}
                          <span className="text-sm">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
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
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="certificate_number" className="text-xs text-gray-600">Titre foncier</label>
                <input id="certificate_number" value={form.certificate_number || ''} onChange={e => setField('certificate_number', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
              </div>
              <div>
                <label htmlFor="issuing_authority" className="text-xs text-gray-600">Autorité émettrice</label>
                <input id="issuing_authority" value={form.issuing_authority || ''} onChange={e => setField('issuing_authority', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
              </div>
              <div>
                <label htmlFor="acquisition_type" className="text-xs text-gray-600">Type d’acquisition</label>
                <input id="acquisition_type" value={form.acquisition_type || ''} onChange={e => setField('acquisition_type', e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
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

          

          {reportOpen && (
            <div className="mt-4 border rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Signaler un problème</div>
              <textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="Décrivez le problème rencontré" className="w-full h-24 px-3 py-2 border rounded-lg" />
              <div className="mt-2 flex gap-2">
                <button onClick={async () => { if (!parcel || !reportText.trim()) return; const added = await api.addParcelNote(parcel.id, `Signalement: ${reportText.trim()}`, 'Citoyen'); setNotes(prev => [added, ...prev]); setReportText(''); setReportOpen(false); }} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Envoyer</button>
                <button onClick={() => setReportOpen(false)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Annuler</button>
              </div>
            </div>
          )}
          {error && <div className="mt-4 text-sm text-red-600" aria-live="polite">{error}</div>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (!hasChanges() || window.confirm('Êtes-vous sûr de vouloir annuler ?')) onNavigate('parcels-list'); }} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Annuler</button>
            <button onClick={() => setReportOpen(true)} className="text-emerald-700 underline">Signaler un problème</button>
          </div>
          <button onClick={save} disabled={saving} className={`px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 shadow-sm ${saving ? 'opacity-70 cursor-not-allowed' : ''}`} aria-label="Enregistrer les modifications">
            <Save size={16} /> Enregistrer
          </button>
          </div>
        </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-2">
            <button onClick={() => setSecondaryTab('history')} className={`px-3 py-2 rounded-lg text-sm font-medium border ${secondaryTab === 'history' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-700'}`}>
              <Clock size={14} className="inline-block mr-1" /> Historique
            </button>
            <button onClick={() => setSecondaryTab('notes')} className={`px-3 py-2 rounded-lg text-sm font-medium border ${secondaryTab === 'notes' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-700'}`}>
              <MessageSquare size={14} className="inline-block mr-1" /> Notes
            </button>
            <button onClick={() => setSecondaryTab('documents')} className={`px-3 py-2 rounded-lg text-sm font-medium border ${secondaryTab === 'documents' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-700'}`}>
              <Paperclip size={14} className="inline-block mr-1" /> Documents
            </button>
          </div>
          </div>
          <div className="px-6 py-4">
            {secondaryTab === 'history' ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <input type="date" value={historyDateFrom} onChange={e => setHistoryDateFrom(e.target.value)} className="h-9 px-3 border rounded-lg text-xs" aria-label="Filtrer depuis la date" />
                  <input type="date" value={historyDateTo} onChange={e => setHistoryDateTo(e.target.value)} className="h-9 px-3 border rounded-lg text-xs" aria-label="Filtrer jusqu’à la date" />
                  <input type="text" value={historyFilterText} onChange={e => setHistoryFilterText(e.target.value)} placeholder="Filtrer par champ" className="flex-1 h-9 px-3 border rounded-lg text-xs" />
                </div>
                <div className="space-y-2 max-h-56 overflow-auto">
                  {history.length === 0 ? (
                    <div className="text-xs text-gray-500">Aucun historique</div>
                  ) : (
                    history.filter(h => {
                      const d = new Date(h.changed_at)
                      const okFrom = historyDateFrom ? d >= new Date(historyDateFrom) : true
                      const okTo = historyDateTo ? d <= new Date(historyDateTo) : true
                      let matchText = true
                      if (historyFilterText.trim()) {
                        try {
                          const obj = JSON.parse(h.changes || '{}') as Record<string, { from: unknown; to: unknown }>
                          matchText = Object.keys(obj).some(k => k.toLowerCase().includes(historyFilterText.trim().toLowerCase()))
                        } catch { matchText = false }
                      }
                      return okFrom && okTo && matchText
                    }).map(h => {
                      let items: string[] = [];
                      try {
                        const obj = JSON.parse(h.changes || '{}') as Record<string, { from: unknown; to: unknown }>;
                        items = Object.keys(obj).slice(0, 4).map(k => `${k}`);
                      } catch { items = []; }
                      return (
                        <div key={h.id} className="text-xs text-gray-700">
                          <span className="font-medium">{h.user}</span> — {new Date(h.changed_at).toLocaleString('fr-FR')}
                          {items.length > 0 && <div className="text-gray-600">Champs modifiés: {items.join(', ')}</div>}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : secondaryTab === 'notes' ? (
              <>
                <div className="space-y-2 max-h-56 overflow-auto mb-2">
                  {notes.length === 0 ? (
                    <div className="text-xs text-gray-500">Aucune note</div>
                  ) : (
                    notes.map(n => (
                      <div key={n.id} className="text-xs text-gray-700">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-medium">{n.author}</span>: {editingNoteId === n.id ? (
                              <textarea value={editingNoteText} onChange={e => setEditingNoteText(e.target.value)} className="mt-1 w-full px-2 py-1 border rounded" />
                            ) : (
                              n.note
                            )}
                            <div className="text-gray-500">{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingNoteId === n.id ? (
                              <>
                                <button onClick={async () => { if (!parcel) return; if (!editingNoteText.trim()) return; const updated = await api.updateParcelNote(parcel.id, n.id, editingNoteText.trim()); setNotes(prev => prev.map(x => x.id === n.id ? updated : x)); setEditingNoteId(null); setEditingNoteText(''); }} className="p-1 rounded border hover:bg-gray-50" aria-label="Enregistrer la note"><Save size={14} /></button>
                                <button onClick={() => { setEditingNoteId(null); setEditingNoteText(''); }} className="p-1 rounded border hover:bg-gray-50" aria-label="Annuler la modification"><X size={14} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingNoteId(n.id); setEditingNoteText(n.note); }} className="p-1 rounded border hover:bg-gray-50" aria-label="Modifier"><Pencil size={14} /></button>
                                <button onClick={async () => { if (!parcel) return; if (!window.confirm('Supprimer cette note ?')) return; await api.deleteParcelNote(parcel.id, n.id); setNotes(prev => prev.filter(x => x.id !== n.id)); }} className="p-1 rounded border hover:bg-gray-50" aria-label="Supprimer"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Ajouter une note" className="flex-1 h-10 px-3 border rounded-lg" />
                  <button onClick={async () => { if (!parcel || !noteText.trim()) return; const added = await api.addParcelNote(parcel.id, noteText.trim(), 'Agent'); setNotes(prev => [added, ...prev]); setNoteText(''); }} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Ajouter</button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2 max-h-56 overflow-auto">
                  {documents.length === 0 ? (
                    <div className="text-xs text-gray-500">Aucun document</div>
                  ) : (
                    documents.map(d => (
                      <div key={d.id} className="text-xs text-gray-700 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Paperclip size={14} className="text-gray-500" />
                          <span className="font-medium">{d.type}</span>
                          <span className="text-gray-500">{new Date(d.created_at).toLocaleString('fr-FR')}</span>
                        </div>
                        <a href={`/${d.file_path}`} target="_blank" rel="noreferrer" className="px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1"><Download size={12} /> Télécharger</a>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
