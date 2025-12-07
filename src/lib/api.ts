import type { Parcel, ParcelInsert, ParcelUpdate, Request, RequestInsert, Document } from '../types/database'

export type ExtendedStats = {
  parcelsThisMonth: number
  parcelsMissingDocs: number
  parcelsInValidation: number
  parcelsBoundaryConflicts: number
  parcelsByProvince: { province: string; c: number }[]
  parcelsByCity: { city: string; c: number }[]
  monthlyEvolution: { month: string; count: number }[]
  pendingRequestsAvgDays: number
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg = typeof data.error === 'string' ? data.error : 'Erreur serveur'
    throw new Error(msg)
  }
  return res.json()
}

export async function getParcels(status?: string): Promise<Parcel[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  const res = await fetch(`/api/parcels${qs}`)
  return handleResponse(res)
}

export async function createParcel(payload: ParcelInsert): Promise<Parcel> {
  const res = await fetch(`/api/parcels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function getParcelByReference(reference: string): Promise<Parcel | null> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(reference)}`)
  if (res.status === 404) return null
  return handleResponse(res)
}

export async function getRequests(): Promise<Request[]> {
  const res = await fetch(`/api/requests`)
  return handleResponse(res)
}

export async function createRequest(payload: RequestInsert): Promise<Request> {
  const res = await fetch(`/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function getStats(): Promise<{ totalParcels: number; freeParcels: number; disputedParcels: number; mortgagedParcels: number; pendingRequests: number }> {
  const res = await fetch(`/api/stats`)
  return handleResponse(res)
}

export async function getExtendedStats(): Promise<ExtendedStats> {
  const res = await fetch(`/api/stats/extended`)
  return handleResponse(res)
}

export async function uploadParcelDocuments(parcelId: string, files: File[], types: string[]): Promise<Document[]> {
  const fd = new FormData()
  for (const f of files) fd.append('files', f)
  for (const t of types) fd.append('types', t)
  const res = await fetch(`/api/parcels/${encodeURIComponent(parcelId)}/documents`, {
    method: 'POST',
    body: fd,
  })
  return handleResponse(res)
}

export async function getParcelDocuments(parcelId: string): Promise<Document[]> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(parcelId)}/documents`)
  return handleResponse(res)
}

export async function updateParcel(id: string, payload: ParcelUpdate): Promise<Parcel> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function getParcelHistory(parcelId: string): Promise<{ id: string; parcel_id: string; changes: string; changed_at: string; user: string }[]> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(parcelId)}/history`)
  return handleResponse(res)
}

export async function addParcelHistory(parcelId: string, changes: unknown, user: string): Promise<{ id: string; parcel_id: string; changes: string; changed_at: string; user: string }> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(parcelId)}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes, user }),
  })
  return handleResponse(res)
}

export async function getParcelNotes(parcelId: string): Promise<{ id: string; parcel_id: string; note: string; author: string; created_at: string }[]> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(parcelId)}/notes`)
  return handleResponse(res)
}

export async function addParcelNote(parcelId: string, note: string, author: string): Promise<{ id: string; parcel_id: string; note: string; author: string; created_at: string }> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(parcelId)}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, author }),
  })
  return handleResponse(res)
}

export async function updateParcelNote(parcelId: string, noteId: string, note: string): Promise<{ id: string; parcel_id: string; note: string; author: string; created_at: string }> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(parcelId)}/notes/${encodeURIComponent(noteId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  })
  return handleResponse(res)
}

export async function deleteParcelNote(parcelId: string, noteId: string): Promise<void> {
  const res = await fetch(`/api/parcels/${encodeURIComponent(parcelId)}/notes/${encodeURIComponent(noteId)}`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 204) {
    const data: { error?: string } = await res.json().catch(() => ({} as { error?: string }))
    const msg = typeof data.error === 'string' ? data.error : 'Erreur serveur'
    throw new Error(msg)
  }
}
