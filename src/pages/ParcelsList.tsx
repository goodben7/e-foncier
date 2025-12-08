import { useEffect, useState, useCallback, useMemo } from 'react';
import * as api from '../lib/api';
import type { Parcel, Document } from '../types/database';
import { MapPin, Maximize2, User, FileText, Hash, Filter, Search as SearchIcon, Calendar, Layers, SortAsc, SortDesc, Download, Map, List as ListIcon } from 'lucide-react';

export default function ParcelsList({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(() => sessionStorage.getItem('parcelFilter') || 'all');
  const [searchText, setSearchText] = useState('');
  const [advOpen, setAdvOpen] = useState(false);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [areaMin, setAreaMin] = useState<string>('');
  const [areaMax, setAreaMax] = useState<string>('');
  const [landUse, setLandUse] = useState('');
  const [owner, setOwner] = useState('');
  const [validation, setValidation] = useState<'any' | 'validated' | 'pending'>('any');
  const [docsMissingOnly, setDocsMissingOnly] = useState(false);
  const [surveyor, setSurveyor] = useState('');
  const [litigationText, setLitigationText] = useState('');
  const [sortBy, setSortBy] = useState<'reference' | 'area' | 'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [docsCount, setDocsCount] = useState<Record<string, number>>({});

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

  useEffect(() => {
    let canceled = false;
    const fetchDocsCounts = async () => {
      if (!docsMissingOnly) return;
      const entries: [string, number][] = [];
      for (const p of parcels) {
        try {
          const docs: Document[] = await api.getParcelDocuments(p.id);
          entries.push([p.id, Array.isArray(docs) ? docs.length : 0]);
        } catch {
          entries.push([p.id, 0]);
        }
      }
      if (!canceled) {
        const obj: Record<string, number> = {};
        for (const [id, c] of entries) obj[id] = c;
        setDocsCount(obj);
      }
    };
    fetchDocsCounts();
    return () => { canceled = true; };
  }, [parcels, docsMissingOnly]);

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

  const provinces = useMemo(() => Array.from(new Set(parcels.map(p => p.province).filter(Boolean))), [parcels]);
  const cities = useMemo(() => Array.from(new Set(parcels.map(p => p.territory_or_city).filter(Boolean))), [parcels]);
  const landUses = useMemo(() => Array.from(new Set(parcels.map(p => p.land_use).filter(Boolean))), [parcels]);

  const filtered = useMemo(() => {
    const s = searchText.trim().toLowerCase();
    const minA = areaMin.trim() ? Number(areaMin) : undefined;
    const maxA = areaMax.trim() ? Number(areaMax) : undefined;
    const df = dateFrom.trim() ? new Date(dateFrom) : undefined;
    const dt = dateTo.trim() ? new Date(dateTo) : undefined;
    return parcels.filter(p => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (s) {
        const addr = `${p.avenue} ${p.quartier_or_cheflieu} ${p.commune_or_sector} ${p.territory_or_city} ${p.province}`.toLowerCase();
        const any = [p.reference, p.parcel_number, p.owner_name, addr].some(x => String(x || '').toLowerCase().includes(s));
        if (!any) return false;
      }
      if (province && p.province !== province) return false;
      if (city && p.territory_or_city !== city) return false;
      if (landUse && p.land_use !== landUse) return false;
      if (owner && !p.owner_name.toLowerCase().includes(owner.trim().toLowerCase())) return false;
      if (surveyor && !p.surveyor_name.toLowerCase().includes(surveyor.trim().toLowerCase())) return false;
      if (litigationText && !(p.litigation || '').toLowerCase().includes(litigationText.trim().toLowerCase())) return false;
      if (typeof minA === 'number' && p.area < minA) return false;
      if (typeof maxA === 'number' && p.area > maxA) return false;
      if (df && new Date(p.created_at) < df) return false;
      if (dt && new Date(p.created_at) > dt) return false;
      if (validation === 'validated') {
        const ok = p.certificate_number && p.issuing_authority && p.cadastral_plan_ref;
        if (!ok) return false;
      } else if (validation === 'pending') {
        const miss = !p.certificate_number || !p.issuing_authority || !p.cadastral_plan_ref;
        if (!miss) return false;
      }
      if (docsMissingOnly) {
        const c = docsCount[p.id];
        if (typeof c === 'number') {
          if (c > 0) return false;
        }
      }
      return true;
    });
  }, [parcels, filter, searchText, province, city, landUse, owner, surveyor, litigationText, areaMin, areaMax, dateFrom, dateTo, validation, docsMissingOnly, docsCount]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'reference') cmp = a.reference.localeCompare(b.reference);
      else if (sortBy === 'area') cmp = a.area - b.area;
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filter, searchText, province, city, dateFrom, dateTo, areaMin, areaMax, landUse, owner, validation, docsMissingOnly, surveyor, litigationText, sortBy, sortDir, pageSize]);

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-3xl font-bold text-gray-900">Liste des Parcelles</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-md border flex items-center gap-1 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`} title="Vue Liste"><ListIcon size={16} /> Liste</button>
            <button onClick={() => setViewMode('map')} className={`px-3 py-2 rounded-md border flex items-center gap-1 ${viewMode === 'map' ? 'bg-gray-100' : 'hover:bg-gray-50'}`} title="Vue Carte"><Map size={16} /> Carte</button>
          </div>
        </div>

        <div className="mb-2 flex gap-3 flex-wrap items-center">
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
          <div className="relative flex-1 min-w-[240px]">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Rechercher (référence, numéro, propriétaire, adresse)" className="w-full h-10 pl-9 pr-3 border rounded-lg text-sm" />
          </div>
        </div>

        <div className="mb-4">
          <button onClick={() => setAdvOpen(v => !v)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-gray-50"><Filter size={14} /> Filtres avancés</button>
        </div>
        {advOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 bg-white border rounded-lg p-4">
            <div>
              <label className="text-xs text-gray-600">Province</label>
              <select value={province} onChange={e => setProvince(e.target.value)} className="w-full h-10 px-3 border rounded-lg">
                <option value="">Toutes</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Ville / Territoire</label>
              <select value={city} onChange={e => setCity(e.target.value)} className="w-full h-10 px-3 border rounded-lg">
                <option value="">Tous</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Affectation</label>
              <select value={landUse} onChange={e => setLandUse(e.target.value)} className="w-full h-10 px-3 border rounded-lg">
                <option value="">Toutes</option>
                {landUses.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Propriétaire</label>
              <input value={owner} onChange={e => setOwner(e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Géomètre</label>
              <input value={surveyor} onChange={e => setSurveyor(e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Litiges (texte)</label>
              <input value={litigationText} onChange={e => setLitigationText(e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Créée depuis</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full h-10 pl-9 pr-3 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Créée jusqu’à</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full h-10 pl-9 pr-3 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Superficie min (m²)</label>
              <input type="number" min={0} value={areaMin} onChange={e => setAreaMin(e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
              <div className="mt-1 flex gap-2">
                {[0,500,1000,2000].map(n => <button key={n} onClick={() => setAreaMin(String(n))} className="px-2 py-1 rounded border text-xs hover:bg-gray-50">{n}</button>)}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Superficie max (m²)</label>
              <input type="number" min={0} value={areaMax} onChange={e => setAreaMax(e.target.value)} className="w-full h-10 px-3 border rounded-lg" />
              <div className="mt-1 flex gap-2">
                {[500,1000,2000,5000].map(n => <button key={n} onClick={() => setAreaMax(String(n))} className="px-2 py-1 rounded border text-xs hover:bg-gray-50">{n}</button>)}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Statut de validation</label>
              <div className="flex items-center gap-2">
                <label className="text-xs"><input type="radio" checked={validation==='any'} onChange={() => setValidation('any')} /> <span className="ml-1">Tous</span></label>
                <label className="text-xs"><input type="radio" checked={validation==='validated'} onChange={() => setValidation('validated')} /> <span className="ml-1">Validées</span></label>
                <label className="text-xs"><input type="radio" checked={validation==='pending'} onChange={() => setValidation('pending')} /> <span className="ml-1">En attente</span></label>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Documents manquants</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={docsMissingOnly} onChange={e => setDocsMissingOnly(e.target.checked)} />
                <span className="text-xs">Afficher uniquement les parcelles sans document</span>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">Résultats: {total}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Tri</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as 'reference' | 'area' | 'created_at')} className="h-9 px-2 border rounded">
                  <option value="created_at">Date de création</option>
                  <option value="reference">Référence</option>
                  <option value="area">Superficie</option>
                </select>
                <button onClick={() => setSortDir(d => d==='asc' ? 'desc' : 'asc')} className="h-9 w-9 rounded border flex items-center justify-center hover:bg-gray-50" title="Inverser l’ordre">
                  {sortDir === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                </button>
                <label className="text-xs text-gray-600">Page</label>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="h-9 px-2 border rounded">
                  {[6,12,24,36].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
                <button onClick={() => {
                  const rows = sorted.map(p => ({
                    reference: p.reference,
                    statut: p.status,
                    proprietaire: p.owner_name,
                    superficie_m2: p.area,
                    affectation: p.land_use,
                    adresse: `${p.avenue}, ${p.quartier_or_cheflieu}, ${p.commune_or_sector}, ${p.territory_or_city}, ${p.province}`,
                    date_creation: new Date(p.created_at).toLocaleDateString('fr-FR'),
                  }));
                  const headers = Object.keys(rows[0] || {});
                  const lines = rows.map(r => headers.map(h => `"${String((r as Record<string, unknown>)[h] ?? '').replace(/"/g,'""')}"`).join(','));
                  const csv = [headers.join(','), ...lines].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `parcelles_export_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
                }} className="h-9 px-3 rounded border flex items-center gap-1 hover:bg-gray-50" title="Exporter CSV"><Download size={14} /> Exporter</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {parcels.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Aucune parcelle enregistrée</p>
        </div>
      ) : (
        viewMode === 'list' ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map((parcel) => (
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
                <p className="text-xs text-gray-500" title="Date de création">
                  Créé le {new Date(parcel.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1 rounded border ${page===1?'opacity-50 cursor-not-allowed':'hover:bg-gray-50'}`}>Préc.</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`px-3 py-1 rounded border ${page===totalPages?'opacity-50 cursor-not-allowed':'hover:bg-gray-50'}`}>Suiv.</button>
          </div>
        </div>
        </>
        ) : (
          (() => {
            const pts = filtered.filter(p => Number.isFinite(p.gps_lat) && Number.isFinite(p.gps_long));
            if (pts.length === 0) return <div className="bg-white rounded-lg p-6 border">Aucune donnée géographique disponible</div>;
            const minLat = Math.min(...pts.map(p => p.gps_lat));
            const maxLat = Math.max(...pts.map(p => p.gps_lat));
            const minLon = Math.min(...pts.map(p => p.gps_long));
            const maxLon = Math.max(...pts.map(p => p.gps_long));
            const margin = 0.02;
            const bbox = `${(minLon - margin).toFixed(5)},${(minLat - margin).toFixed(5)},${(maxLon + margin).toFixed(5)},${(maxLat + margin).toFixed(5)}`;
            const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
            return (
              <div className="relative h-[480px] border rounded-lg overflow-hidden">
                <iframe title="Carte des parcelles" src={embedUrl} className="w-full h-full" />
                <div className="absolute inset-0">
                  {pts.map((p) => {
                    const xPct = ((p.gps_long - minLon) / (maxLon - minLon)) * 100;
                    const yPct = ((maxLat - p.gps_lat) / (maxLat - minLat)) * 100;
                    return (
                      <button key={p.id} onClick={() => { sessionStorage.setItem('parcelDetailRef', p.reference); onNavigate('parcel-detail'); }} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${xPct}%`, top: `${yPct}%` }} title={`${p.reference} — ${p.status}`}>
                        <span className={`w-3 h-3 rounded-full border-2 block ${p.status === 'Libre' ? 'bg-green-500 border-white' : p.status === 'En litige' ? 'bg-orange-500 border-white' : 'bg-red-500 border-white'}`}></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )
      )}
    </div>

      
    </>
  );
}
