export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      parcels: {
        Row: {
          id: string
          reference: string
          parcel_number: string
          province: string
          territory_or_city: string
          commune_or_sector: string
          quartier_or_cheflieu: string
          avenue: string
          gps_lat: number
          gps_long: number
          area: number
          location: string | null
          status: string
          land_use: string
          certificate_number: string
          issuing_authority: string
          acquisition_type: string
          acquisition_act_ref: string
          title_date: string
          owner_name: string
          owner_id_number: string
          company_name: string | null
          rccm: string | null
          nif: string | null
          surveying_pv_ref: string
          surveyor_name: string
          surveyor_license: string
          cadastral_plan_ref: string
          servitudes: string | null
          charges: string | null
          litigation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference: string
          parcel_number: string
          province: string
          territory_or_city: string
          commune_or_sector: string
          quartier_or_cheflieu: string
          avenue: string
          gps_lat: number
          gps_long: number
          area: number
          location?: string | null
          status?: string
          land_use: string
          certificate_number: string
          issuing_authority: string
          acquisition_type: string
          acquisition_act_ref: string
          title_date: string
          owner_name: string
          owner_id_number: string
          company_name?: string | null
          rccm?: string | null
          nif?: string | null
          surveying_pv_ref?: string
          surveyor_name?: string
          surveyor_license?: string
          cadastral_plan_ref: string
          servitudes?: string | null
          charges?: string | null
          litigation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference?: string
          parcel_number?: string
          province?: string
          territory_or_city?: string
          commune_or_sector?: string
          quartier_or_cheflieu?: string
          avenue?: string
          gps_lat?: number
          gps_long?: number
          area?: number
          location?: string | null
          status?: string
          land_use?: string
          certificate_number?: string
          issuing_authority?: string
          acquisition_type?: string
          acquisition_act_ref?: string
          title_date?: string
          owner_name?: string
          owner_id_number?: string
          company_name?: string | null
          rccm?: string | null
          nif?: string | null
          surveying_pv_ref?: string
          surveyor_name?: string
          surveyor_license?: string
          cadastral_plan_ref?: string
          servitudes?: string | null
          charges?: string | null
          litigation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          parcel_id: string | null
          type: string
          mime: string
          file_path: string
          created_at: string
        }
        Insert: {
          id?: string
          parcel_id?: string | null
          type: string
          mime: string
          file_path: string
          created_at?: string
        }
        Update: {
          id?: string
          parcel_id?: string | null
          type?: string
          mime?: string
          file_path?: string
          created_at?: string
        }
      }
      disputes: {
        Row: {
          id: string
          parcel_id: string | null
          description: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parcel_id?: string | null
          description: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parcel_id?: string | null
          description?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          citizen_name: string
          parcel_reference: string
          document_type: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          citizen_name: string
          parcel_reference: string
          document_type: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          citizen_name?: string
          parcel_reference?: string
          document_type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Parcel = Database['public']['Tables']['parcels']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Dispute = Database['public']['Tables']['disputes']['Row']
export type Request = Database['public']['Tables']['requests']['Row']

export type ParcelInsert = Database['public']['Tables']['parcels']['Insert']
export type ParcelUpdate = Database['public']['Tables']['parcels']['Update']
export type RequestInsert = Database['public']['Tables']['requests']['Insert']
