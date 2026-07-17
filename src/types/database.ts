// Tipuri TypeScript care oglindesc schema din supabase/migrations/*.sql
// Daca modifici schema, actualizeaza si tipurile de aici.

export type Rol = "user" | "moderator" | "admin";
export type CompanyStatus = "pending" | "approved" | "rejected" | "suspended";
export type ConnectionStatus = "pending" | "accepted" | "declined";
export type DimensiuneEchipa = "1" | "2-9" | "10-49" | "50-249" | "250+";
export type CifraAfaceriSursa = "anaf_auto" | "manual" | "indisponibila";
export type CaenVersion = "rev2" | "rev3";

export interface Profile {
  id: string;
  nume_complet: string;
  telefon_personal: string | null;
  email_personal: string | null;
  rol: Rol;
  activ: boolean;
  termeni_acceptati_la: string | null;
  termeni_versiune: string | null;
  email_verificat: boolean;
  email_verificat_la: string | null;
  created_at: string;
  updated_at: string;
}

export interface Judet {
  cod: string;
  nume: string;
}

export interface Category {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  parent_id: string | null;
  ordine: number;
  created_at: string;
}

export interface CategoryCaenCode {
  id: string;
  category_id: string;
  caen_code: string;
  caen_version: CaenVersion;
  descriere: string | null;
}

export interface Company {
  id: string;
  owner_id: string;

  cui: number;
  denumire: string;
  nr_reg_com: string | null;
  adresa_sediu: string | null;
  judet_cod: string | null;
  localitate: string | null;
  cod_postal: string | null;
  stare_inregistrare: string | null;
  data_inregistrare: string | null;
  radiata: boolean;
  cod_caen_principal: string | null;
  den_caen_principal: string | null;
  tva_activ: boolean | null;
  tva_data_actualizare: string | null;
  anaf_ultima_verificare: string | null;
  anaf_raspuns_brut: unknown;

  lat: number | null;
  lng: number | null;
  raza_deservire_km: number | null;

  telefon_firma: string | null;
  email_firma: string | null;
  website: string | null;
  logo_url: string | null;
  descriere: string | null;
  numar_angajati: number | null;
  dimensiune_echipa: DimensiuneEchipa | null;

  cifra_afaceri_an: number | null;
  cifra_afaceri_valoare: number | null;
  cifra_afaceri_sursa: CifraAfaceriSursa | null;

  cum_poate_ajuta_grupul: string | null;

  banner_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  tags: string[] | null;
  vizualizari: number;
  timp_raspuns: "sub_1h" | "sub_24h" | "2_3_zile" | "peste_3_zile" | null;
  rating_mediu: number;
  rating_numar: number;
  slug: string | null;
  discount_procent: number | null;
  discount_descriere: string | null;
  discount_conditii: string | null;
  proiect_marime: "sub_5k" | "5k_25k" | "25k_100k" | "100k_500k" | "peste_500k" | null;

  status: CompanyStatus;
  motiv_respingere: string | null;
  aprobat_de: string | null;
  aprobat_la: string | null;

  created_at: string;
  updated_at: string;
}

export interface CompanyCategory {
  company_id: string;
  category_id: string;
  is_primary: boolean;
}

export interface CompanyJudet {
  company_id: string;
  judet_cod: string;
}

export interface CompanySupportNeed {
  id: string;
  company_id: string;
  category_id: string | null;
  nota: string | null;
  created_at: string;
}

export interface CompanySupportOffer {
  id: string;
  company_id: string;
  category_id: string | null;
  nota: string | null;
  created_at: string;
}

export interface FinancialSnapshot {
  company_id: string;
  an: number;
  cifra_afaceri: number | null;
  profit_net: number | null;
  numar_salariati: number | null;
  sursa: "anaf_auto" | "manual";
  fetched_at: string;
}

export interface Connection {
  id: string;
  requester_company_id: string;
  target_company_id: string;
  status: ConnectionStatus;
  mesaj: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_company_id: string;
  continut: string;
  citit: boolean;
  created_at: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface CompanyContact {
  id: string;
  company_id: string;
  nume: string;
  rol: string | null;
  departament: string | null;
  telefon: string | null;
  email: string | null;
  ordine: number;
  created_at: string;
}

export interface CompanyProject {
  id: string;
  company_id: string;
  titlu: string;
  descriere: string | null;
  locatie: string | null;
  an: number | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  ordine: number;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_company_id: string;
  reviewed_company_id: string;
  rating: number;
  comentariu: string | null;
  dovada_url: string | null;
  status: ReviewStatus;
  motiv_respingere: string | null;
  aprobat_de: string | null;
  aprobat_la: string | null;
  created_at: string;
}

export interface CompanyFavorite {
  profile_id: string;
  company_id: string;
  created_at: string;
}

export type RfqStatus = "deschis" | "inchis" | "anulat";

export interface Rfq {
  id: string;
  requester_company_id: string;
  titlu: string;
  descriere: string;
  category_id: string | null;
  judet_cod: string | null;
  buget_min: number | null;
  buget_max: number | null;
  termen_limita: string | null;
  status: RfqStatus;
  created_at: string;
  updated_at: string;
}

export interface RfqRecipient {
  id: string;
  rfq_id: string;
  company_id: string;
  vazut_la: string | null;
  created_at: string;
}

export interface RfqResponse {
  id: string;
  rfq_id: string;
  company_id: string;
  mesaj: string;
  pret_estimat: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Tip generic "Database" pentru createClient<Database>() din @supabase/ssr.
// Nu e o schema Postgres completa (nu includem Functions/Views), doar tabelele
// principale - suficient pentru autocomplete si verificare de tipuri de baza.
// ---------------------------------------------------------------------------
type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      judete: TableDef<Judet>;
      categories: TableDef<Category>;
      category_caen_codes: TableDef<CategoryCaenCode>;
      companies: TableDef<Company>;
      company_categories: TableDef<CompanyCategory>;
      company_judete: TableDef<CompanyJudet>;
      company_support_needs: TableDef<CompanySupportNeed>;
      company_support_offers: TableDef<CompanySupportOffer>;
      financial_snapshots: TableDef<FinancialSnapshot>;
      connections: TableDef<Connection>;
      messages: TableDef<Message>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
