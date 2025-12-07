import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'data')
fs.mkdirSync(dataDir, { recursive: true })
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
CREATE INDEX IF NOT EXISTS idx_parcels_reference ON parcels(reference);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_documents_parcel_id ON documents(parcel_id);
CREATE INDEX IF NOT EXISTS idx_disputes_parcel_id ON disputes(parcel_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_parcel_reference ON requests(parcel_reference);
`)

const parcelColumns = db.prepare("PRAGMA table_info(parcels)").all().map(r => r.name)
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

const app = express()
app.use(cors())
app.use(express.json())

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
    'acquisition_act_ref','title_date','owner_name','owner_id_number','surveying_pv_ref','surveyor_name','surveyor_license'
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
      b.acquisition_act_ref, b.title_date, b.owner_name, b.owner_id_number, b.company_name || null, b.rccm || null, b.nif || null, b.surveying_pv_ref,
      b.surveyor_name, b.surveyor_license, cadastralPlanRef, b.servitudes || null, b.charges || null, b.litigation || null, now, now
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
    res.status(500).json({ error: 'Server error' })
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
    res.status(500).json({ error: 'Server error' })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
