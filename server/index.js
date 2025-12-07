import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'data')
const uploadDir = path.join(dataDir, 'uploads')
fs.mkdirSync(dataDir, { recursive: true })
fs.mkdirSync(uploadDir, { recursive: true })
const dbPath = path.join(dataDir, 'e_foncier.db')
const db = new Database(dbPath)

db.exec(`
CREATE TABLE IF NOT EXISTS parcels (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  parcel_number TEXT NOT NULL,
  province TEXT NOT NULL,
  territory_or_city TEXT NOT NULL,
  commune_or_sector TEXT NOT NULL,
  quartier_or_cheflieu TEXT NOT NULL,
  avenue TEXT NOT NULL,
  gps_lat REAL NOT NULL,
  gps_long REAL NOT NULL,
  area REAL NOT NULL,
  location TEXT,
  status TEXT NOT NULL,
  land_use TEXT NOT NULL,
  certificate_number TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  acquisition_type TEXT NOT NULL,
  acquisition_act_ref TEXT NOT NULL,
  title_date TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_id_number TEXT NOT NULL,
  company_name TEXT,
  rccm TEXT,
  nif TEXT,
  surveying_pv_ref TEXT NOT NULL,
  surveyor_name TEXT NOT NULL,
  surveyor_license TEXT NOT NULL,
  cadastral_plan_ref TEXT NOT NULL,
  servitudes TEXT,
  charges TEXT,
  litigation TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  parcel_id TEXT,
  type TEXT NOT NULL,
  mime TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  parcel_id TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  citizen_name TEXT NOT NULL,
  parcel_reference TEXT NOT NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS parcel_history (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL,
  changes TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  user TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS parcel_notes (
  id TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL,
  note TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parcels_reference ON parcels(reference);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_documents_parcel_id ON documents(parcel_id);
CREATE INDEX IF NOT EXISTS idx_disputes_parcel_id ON disputes(parcel_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_parcel_reference ON requests(parcel_reference);
CREATE INDEX IF NOT EXISTS idx_history_parcel_id ON parcel_history(parcel_id);
CREATE INDEX IF NOT EXISTS idx_notes_parcel_id ON parcel_notes(parcel_id);
`)

const parcelColumns = db.prepare("PRAGMA table_info(parcels)").all().map(r => r.name)
console.log('parcels columns count:', parcelColumns.length, parcelColumns)
function ensureColumn(name, ddl) {
  if (!parcelColumns.includes(name)) {
    db.exec(`ALTER TABLE parcels ADD COLUMN ${ddl}`)
    parcelColumns.push(name)
  }
}
ensureColumn('parcel_number', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('province', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('territory_or_city', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('commune_or_sector', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('quartier_or_cheflieu', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('avenue', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('gps_lat', 'REAL NOT NULL DEFAULT 0')
ensureColumn('gps_long', 'REAL NOT NULL DEFAULT 0')
ensureColumn('land_use', 'TEXT NOT NULL DEFAULT "Résidentiel"')
ensureColumn('certificate_number', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('issuing_authority', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('acquisition_type', 'TEXT NOT NULL DEFAULT "Concession"')
ensureColumn('acquisition_act_ref', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('title_date', 'TEXT NOT NULL DEFAULT "1970-01-01"')
ensureColumn('owner_id_number', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('company_name', 'TEXT')
ensureColumn('rccm', 'TEXT')
ensureColumn('nif', 'TEXT')
ensureColumn('surveying_pv_ref', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('surveyor_name', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('surveyor_license', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('cadastral_plan_ref', 'TEXT NOT NULL DEFAULT ""')
ensureColumn('servitudes', 'TEXT')
ensureColumn('charges', 'TEXT')
ensureColumn('litigation', 'TEXT')

const docColumns = db.prepare("PRAGMA table_info(documents)").all().map(r => r.name)
console.log('documents columns:', docColumns)
function ensureDocColumn(name, ddl) {
  if (!docColumns.includes(name)) {
    db.exec(`ALTER TABLE documents ADD COLUMN ${name} ${ddl}`)
    docColumns.push(name)
  }
}
ensureDocColumn('mime', 'TEXT NOT NULL DEFAULT ""')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadDir))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${randomUUID()}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf'
    cb(null, ok)
  }
})

app.get('/api/parcels', (req, res) => {
  const { status } = req.query
  let rows
  if (status && status !== 'all') {
    rows = db.prepare('SELECT * FROM parcels WHERE status = ? ORDER BY datetime(created_at) DESC').all(status)
  } else {
    rows = db.prepare('SELECT * FROM parcels ORDER BY datetime(created_at) DESC').all()
  }
  res.json(rows)
})

app.get('/api/parcels/:reference', (req, res) => {
  const row = db.prepare('SELECT * FROM parcels WHERE reference = ?').get(req.params.reference)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(row)
})

app.post('/api/parcels', (req, res) => {
  const b = req.body || {}
  const ref = typeof b.reference === 'string' && b.reference.trim() ? b.reference.trim() : `AUTO-${randomUUID().slice(0,8)}`
  const gpsLat = typeof b.gps_lat === 'number' ? b.gps_lat : 0
  const gpsLong = typeof b.gps_long === 'number' ? b.gps_long : 0
  const certNum = typeof b.certificate_number === 'string' ? b.certificate_number : ''
  const issuingAuth = typeof b.issuing_authority === 'string' ? b.issuing_authority : ''
  const cadastralPlanRef = typeof b.cadastral_plan_ref === 'string' ? b.cadastral_plan_ref : ''
  const required = [
    'parcel_number','province','territory_or_city','commune_or_sector','quartier_or_cheflieu','avenue',
    'area','status','land_use','acquisition_type',
    'acquisition_act_ref','title_date','owner_name','owner_id_number'
  ]
  for (const k of required) {
    if (b[k] === undefined || b[k] === null || (typeof b[k] === 'string' && b[k].trim() === '')) {
      return res.status(400).json({ error: `Missing field: ${k}` })
    }
  }
  if (typeof b.area !== 'number') {
    return res.status(400).json({ error: 'Invalid numeric fields' })
  }
  const now = new Date().toISOString()
  const id = randomUUID()
  try {
    const surveyingPvRef = typeof b.surveying_pv_ref === 'string' ? b.surveying_pv_ref : ''
    const surveyorName = typeof b.surveyor_name === 'string' ? b.surveyor_name : ''
    const surveyorLicense = typeof b.surveyor_license === 'string' ? b.surveyor_license : ''
    db.prepare(
      `INSERT INTO parcels (
        id, reference, parcel_number, province, territory_or_city, commune_or_sector, quartier_or_cheflieu, avenue,
        gps_lat, gps_long, area, location, status, land_use, certificate_number, issuing_authority, acquisition_type,
        acquisition_act_ref, title_date, owner_name, owner_id_number, company_name, rccm, nif, surveying_pv_ref,
        surveyor_name, surveyor_license, cadastral_plan_ref, servitudes, charges, litigation, created_at, updated_at
      ) VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )`
    ).run(
      id, ref, b.parcel_number, b.province, b.territory_or_city, b.commune_or_sector, b.quartier_or_cheflieu, b.avenue,
      gpsLat, gpsLong, b.area, b.location || null, b.status, b.land_use, certNum, issuingAuth, b.acquisition_type,
      b.acquisition_act_ref, b.title_date, b.owner_name, b.owner_id_number, b.company_name || null, b.rccm || null, b.nif || null, surveyingPvRef,
      surveyorName, surveyorLicense, cadastralPlanRef, b.servitudes || null, b.charges || null, b.litigation || null, now, now
    )
    const row = db.prepare('SELECT * FROM parcels WHERE id = ?').get(id)
    res.status(201).json(row)
  } catch (e) {
    if (String(e.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'Reference already exists' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

app.put('/api/parcels/:id', (req, res) => {
  const id = req.params.id
  const existing = db.prepare('SELECT * FROM parcels WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const b = req.body || {}
  const now = new Date().toISOString()
  const colValuesMap = { ...existing }
  for (const k of Object.keys(b)) {
    if (parcelColumns.includes(k)) colValuesMap[k] = b[k]
  }
  const required = [
    'parcel_number','province','territory_or_city','commune_or_sector','quartier_or_cheflieu','avenue',
    'area','status','land_use','acquisition_type',
    'acquisition_act_ref','title_date','owner_name','owner_id_number'
  ]
  for (const k of required) {
    const v = colValuesMap[k]
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      return res.status(400).json({ error: `Missing field: ${k}` })
    }
  }
  colValuesMap.updated_at = now
  const updatable = parcelColumns.filter(c => c !== 'id' && c !== 'created_at')
  const sql = `UPDATE parcels SET ${updatable.map(c => `${c} = ?`).join(', ')} WHERE id = ?`
  const vals = updatable.map(c => {
    if (c === 'gps_lat') return typeof colValuesMap[c] === 'number' ? colValuesMap[c] : 0
    if (c === 'gps_long') return typeof colValuesMap[c] === 'number' ? colValuesMap[c] : 0
    return colValuesMap[c] === undefined ? null : colValuesMap[c]
  })
  try {
    db.prepare(sql).run(...vals, id)
    const row = db.prepare('SELECT * FROM parcels WHERE id = ?').get(id)
    res.json(row)
  } catch (e) {
    if (String(e.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'Reference already exists' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/parcels/:id/history', (req, res) => {
  const parcelId = req.params.id
  const parcel = db.prepare('SELECT id FROM parcels WHERE id = ?').get(parcelId)
  if (!parcel) return res.status(404).json({ error: 'Not found' })
  const rows = db.prepare('SELECT * FROM parcel_history WHERE parcel_id = ? ORDER BY datetime(changed_at) DESC').all(parcelId)
  res.json(rows)
})

app.post('/api/parcels/:id/history', (req, res) => {
  const parcelId = req.params.id
  const parcel = db.prepare('SELECT id FROM parcels WHERE id = ?').get(parcelId)
  if (!parcel) return res.status(404).json({ error: 'Not found' })
  const b = req.body || {}
  const now = new Date().toISOString()
  const id = randomUUID()
  const user = typeof b.user === 'string' && b.user.trim() ? b.user.trim() : 'Agent'
  let changesStr
  try {
    if (typeof b.changes === 'string') {
      changesStr = b.changes
    } else {
      changesStr = JSON.stringify(b.changes || {})
    }
  } catch (_e) {
    return res.status(400).json({ error: 'Invalid changes payload' })
  }
  try {
    db.prepare('INSERT INTO parcel_history (id, parcel_id, changes, changed_at, user) VALUES (?, ?, ?, ?, ?)')
      .run(id, parcelId, changesStr, now, user)
    const row = db.prepare('SELECT * FROM parcel_history WHERE id = ?').get(id)
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/parcels/:id/notes', (req, res) => {
  const parcelId = req.params.id
  const parcel = db.prepare('SELECT id FROM parcels WHERE id = ?').get(parcelId)
  if (!parcel) return res.status(404).json({ error: 'Not found' })
  const rows = db.prepare('SELECT * FROM parcel_notes WHERE parcel_id = ? ORDER BY datetime(created_at) DESC').all(parcelId)
  res.json(rows)
})

app.post('/api/parcels/:id/notes', (req, res) => {
  const parcelId = req.params.id
  const parcel = db.prepare('SELECT id FROM parcels WHERE id = ?').get(parcelId)
  if (!parcel) return res.status(404).json({ error: 'Not found' })
  const b = req.body || {}
  const note = typeof b.note === 'string' && b.note.trim() ? b.note.trim() : ''
  const author = typeof b.author === 'string' && b.author.trim() ? b.author.trim() : 'Agent'
  if (!note) return res.status(400).json({ error: 'Note required' })
  const now = new Date().toISOString()
  const id = randomUUID()
  try {
    db.prepare('INSERT INTO parcel_notes (id, parcel_id, note, author, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, parcelId, note, author, now)
    const row = db.prepare('SELECT * FROM parcel_notes WHERE id = ?').get(id)
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/parcels/:id/documents', upload.array('files', 12), (req, res) => {
  const parcelId = req.params.id
  const parcel = db.prepare('SELECT id FROM parcels WHERE id = ?').get(parcelId)
  if (!parcel) return res.status(404).json({ error: 'Not found' })
  const now = new Date().toISOString()
  const files = Array.isArray(req.files) ? req.files : []
  const rawTypes = req.body?.types
  const typesArr = Array.isArray(rawTypes) ? rawTypes : (typeof rawTypes === 'string' ? [rawTypes] : [])
  const inserted = []
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    const id = randomUUID()
    const relPath = path.join('uploads', path.basename(f.path))
    const mime = f.mimetype
    const type = typeof typesArr[i] === 'string' && typesArr[i].trim() ? String(typesArr[i]).trim() : 'Autres'
    db.prepare('INSERT INTO documents (id, parcel_id, type, mime, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, parcelId, type, mime, relPath, now)
    inserted.push({ id, parcel_id: parcelId, type, mime, file_path: relPath, created_at: now })
  }
  res.status(201).json(inserted)
})

app.get('/api/requests', (req, res) => {
  const rows = db.prepare('SELECT * FROM requests ORDER BY datetime(created_at) DESC').all()
  res.json(rows)
})

app.post('/api/requests', (req, res) => {
  const { citizen_name, parcel_reference, document_type, status } = req.body || {}
  if (!citizen_name || !parcel_reference || !document_type) {
    return res.status(400).json({ error: 'Invalid payload' })
  }
  const now = new Date().toISOString()
  const id = randomUUID()
  const statusValue = status || 'En attente'
  try {
    db.prepare(
      'INSERT INTO requests (id, citizen_name, parcel_reference, document_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, citizen_name, parcel_reference, document_type, statusValue, now, now)
    const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id)
    res.status(201).json(row)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e && e.message ? e.message : 'Server error') })
  }
})

app.get('/api/stats', (req, res) => {
  const totalParcels = db.prepare('SELECT COUNT(*) AS c FROM parcels').get().c
  const freeParcels = db.prepare("SELECT COUNT(*) AS c FROM parcels WHERE status = 'Libre'").get().c
  const disputedParcels = db.prepare("SELECT COUNT(*) AS c FROM parcels WHERE status = 'En litige'").get().c
  const mortgagedParcels = db.prepare("SELECT COUNT(*) AS c FROM parcels WHERE status = 'Hypothéqué'").get().c
  const pendingRequests = db.prepare("SELECT COUNT(*) AS c FROM requests WHERE status = 'En attente'").get().c
  res.json({ totalParcels, freeParcels, disputedParcels, mortgagedParcels, pendingRequests })
})

app.get('/api/stats/extended', (req, res) => {
  try {
    const parcelsThisMonth = db.prepare(
      "SELECT COUNT(*) AS c FROM parcels WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
    ).get().c

    const rowsMonthly = db.prepare(
      "SELECT strftime('%Y-%m', created_at) AS ym, COUNT(*) AS c FROM parcels WHERE date(created_at) >= date('now','-11 months') GROUP BY ym ORDER BY ym"
    ).all()

    const now = new Date()
    const monthlyEvolution = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const found = rowsMonthly.find(r => r.ym === ym)
      monthlyEvolution.push({ month: ym, count: found ? found.c : 0 })
    }

    const parcelsMissingDocs = db.prepare(
      'SELECT COUNT(*) AS c FROM parcels p LEFT JOIN documents d ON d.parcel_id = p.id WHERE d.id IS NULL'
    ).get().c

    const parcelsInValidation = db.prepare(
      "SELECT COUNT(*) AS c FROM parcels WHERE certificate_number = '' OR issuing_authority = '' OR cadastral_plan_ref = ''"
    ).get().c

    const parcelsBoundaryConflicts = db.prepare(
      "SELECT COUNT(*) AS c FROM parcels WHERE status = 'En litige' OR (litigation IS NOT NULL AND TRIM(litigation) <> '')"
    ).get().c

    const parcelsByProvince = db.prepare(
      'SELECT province, COUNT(*) AS c FROM parcels GROUP BY province ORDER BY c DESC'
    ).all()

    const parcelsByCity = db.prepare(
      'SELECT territory_or_city AS city, COUNT(*) AS c FROM parcels GROUP BY territory_or_city ORDER BY c DESC'
    ).all()

    const pendingRequestsAvgDaysRow = db.prepare(
      "SELECT AVG(julianday('now') - julianday(created_at)) AS avgDays FROM requests WHERE status = 'En attente'"
    ).get()
    const pendingRequestsAvgDays = Number(pendingRequestsAvgDaysRow?.avgDays || 0)

    res.json({
      parcelsThisMonth,
      parcelsMissingDocs,
      parcelsInValidation,
      parcelsBoundaryConflicts,
      parcelsByProvince,
      parcelsByCity,
      monthlyEvolution,
      pendingRequestsAvgDays,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String((e && e.message) ? e.message : 'Server error') })
  }
})

function randOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pad2(n) {
  return String(n).padStart(2, '0')
}
function dateOnlyISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

app.post('/api/seed', (req, res) => {
  try {
    const provinces = ['Kinshasa','Kongo Central','Kwango','Kwilu','Mai-Ndombe','Kasaï','Kasaï Central','Kasaï Oriental','Lomami','Sankuru','Maniema','Sud-Kivu','Nord-Kivu','Tanganyika','Haut-Lomami','Lualaba','Haut-Katanga','Ituri','Tshopo','Bas-Uele','Haut-Uele','Mongala','Nord-Ubangi','Sud-Ubangi','Équateur','Tshuapa']
    const statuses = ['Libre','En litige','Hypothéqué']
    const landUses = ['Résidentiel','Commercial','Agricole','Mixte']
    const authorities = ['Direction des Titres Immobiliers','Direction du Cadastre Foncier','Direction du Contentieux Foncier et Immobilier']
    const acquisitions = ['Concession','Achat','Donation']
    const docTypesSeed = ['Copie du titre foncier','Certificat d’enregistrement','Attestation de propriété','Extrait du registre foncier','Copie du plan cadastral','Certificat de situation juridique','Attestation de non-litige','Historique des litiges sur une parcelle','Copie de décision administrative foncière','Certificat de mutation','Attestation de bornage','PV de bornage','Autre']

    const reset = Boolean(req.body && req.body.reset)
    const nParcels = Number(req.body && req.body.parcels) || 30
    const nRequests = Number(req.body && req.body.requests) || 20
    const nDocuments = Number(req.body && req.body.documents) || 24

    if (reset) {
      db.exec('DELETE FROM documents; DELETE FROM disputes; DELETE FROM requests; DELETE FROM parcels;')
    }

    const now = new Date().toISOString()
    const parcelIds = []
    const parcelRefs = []

    for (let i = 0; i < nParcels; i++) {
      const id = randomUUID()
      const year = new Date().getFullYear()
      const ref = `SEED-${year}-${randomUUID().slice(0, 6)}`
      const prov = randOf(provinces)
      const city = `Ville ${randInt(1, 20)}`
      const commune = `Commune ${randInt(1, 10)}`
      const quartier = `Quartier ${randInt(1, 30)}`
      const avenue = `Avenue ${randInt(1, 200)}`
      const gpsLat = Math.round((Math.random() * (5 - -13) + -13) * 100000) / 100000
      const gpsLong = Math.round((Math.random() * (31 - 12) + 12) * 100000) / 100000
      const area = randInt(200, 5000)
      const status = randOf(statuses)
      const land = randOf(landUses)
      const certNum = `CERT-${randInt(10000, 99999)}`
      const issuingAuth = randOf(authorities)
      const acquisitionType = randOf(acquisitions)
      const acquisitionActRef = `ACT-${randInt(1000, 9999)}`
      const d = new Date()
      d.setMonth(d.getMonth() - randInt(0, 24))
      const titleDate = dateOnlyISO(d)
      const ownerName = `Propriétaire ${randInt(1, 500)}`
      const ownerIdNumber = `ID-${randInt(100000, 999999)}`
      const pvRef = `PV-${randInt(1000, 9999)}`
      const surveyorName = `Géomètre ${randInt(1, 200)}`
      const surveyorLicense = `AGR-${randInt(10000, 99999)}`
      const planRef = `Feuille ${randInt(1, 50)} / Section ${randInt(1, 20)}`

      try {
        const colValuesMap = {
          id,
          reference: ref,
          parcel_number: `F-${randInt(1, 999)}/SEC-${randInt(1, 99)}/P-${randInt(1, 9999)}`,
          province: prov,
          territory_or_city: city,
          commune_or_sector: commune,
          quartier_or_cheflieu: quartier,
          avenue,
          gps_lat: gpsLat,
          gps_long: gpsLong,
          area,
          location: null,
          status,
          land_use: land,
          certificate_number: certNum,
          issuing_authority: issuingAuth,
          acquisition_type: acquisitionType,
          acquisition_act_ref: acquisitionActRef,
          title_date: titleDate,
          owner_name: ownerName,
          owner_id_number: ownerIdNumber,
          company_name: null,
          rccm: null,
          nif: null,
          surveying_pv_ref: pvRef,
          surveyor_name: surveyorName,
          surveyor_license: surveyorLicense,
          cadastral_plan_ref: planRef,
          servitudes: null,
          charges: null,
          litigation: status === 'En litige' ? 'Litige signalé' : null,
          created_at: now,
          updated_at: now,
        }
        const sql = `INSERT INTO parcels (${parcelColumns.join(',')}) VALUES (${parcelColumns.map(() => '?').join(',')})`
        const parcelInsertVals = parcelColumns.map((c) => colValuesMap[c])
        if (parcelInsertVals.length !== parcelColumns.length) {
          throw new Error(`Parcel values count mismatch: ${parcelInsertVals.length} for ${parcelColumns.length} columns`)
        }
        db.prepare(sql).run(...parcelInsertVals)
      } catch (e) {
        throw new Error('Parcel seed failed: ' + String((e && e.message) ? e.message : e))
      }

      parcelIds.push(id)
      parcelRefs.push(ref)
    }

    for (let i = 0; i < nRequests; i++) {
      const id = randomUUID()
      const citizen = `Citoyen ${randInt(1, 1000)}`
      const pref = randOf(parcelRefs)
      const dtype = randOf(docTypesSeed)
      const status = randOf(['En attente','Approuvé','Rejeté'])
      const d = new Date()
      d.setDate(d.getDate() - randInt(0, 60))
      const created = d.toISOString()
      try {
        db.prepare(
          'INSERT INTO requests (id, citizen_name, parcel_reference, document_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(id, citizen, pref, dtype, status, created, created)
      } catch (e) {
        throw new Error('Request seed failed: ' + String((e && e.message) ? e.message : e))
      }
    }

    for (let i = 0; i < nDocuments; i++) {
      const id = randomUUID()
      const pid = randOf(parcelIds)
      const dtype = randOf(docTypesSeed)
      const isPdf = Math.random() < 0.6
      const mime = isPdf ? 'application/pdf' : 'image/jpeg'
      const fname = isPdf ? `seed-${id.slice(0,8)}.pdf` : `seed-${id.slice(0,8)}.jpg`
      const pathRel = path.join('uploads', fname)
      try {
        db.prepare(
          'INSERT INTO documents (id, parcel_id, type, mime, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, pid, dtype, mime, pathRel, now)
      } catch (e) {
        throw new Error('Document seed failed: ' + String((e && e.message) ? e.message : e))
      }
    }

    res.json({ parcels: nParcels, requests: nRequests, documents: nDocuments })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String((e && e.message) ? e.message : 'Server error') })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
