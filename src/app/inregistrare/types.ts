import type { CaenVersion } from "@/types/database";

export interface WizardCategoriePick {
  category_id: string;
  is_primary: boolean;
}

export interface WizardNevoieOferta {
  category_id: string | null;
  nota: string;
}

export interface WizardFormState {
  // date ANAF ---------------------------------------------------------
  cui: number | null;
  denumire: string;
  nr_reg_com: string;
  adresa_sediu: string;
  stare_inregistrare: string;
  data_inregistrare: string;
  cod_caen_principal: string;
  den_caen_principal: string;
  tva_activ: boolean | null;
  radiata: boolean;
  anaf_raspuns_brut: unknown;
  judet_nume_anaf: string;

  // geografie -----------------------------------------------------------
  judet_cod: string;
  localitate: string;
  cod_postal: string;
  lat: number | null;
  lng: number | null;
  raza_deservire_km: number | null;
  zona_deservita: string;
  judete_suplimentare: string[];

  // contact & profil ------------------------------------------------------
  telefon_firma: string;
  email_firma: string;
  website: string;
  descriere: string;
  numar_angajati: number | null;
  dimensiune_echipa: "1" | "2-9" | "10-49" | "50-249" | "250+" | "";

  // financiar -------------------------------------------------------------
  cifra_afaceri_an: number | null;
  cifra_afaceri_valoare: number | null;
  cifra_afaceri_sursa: "anaf_auto" | "manual" | "indisponibila";
  profit_net: number | null;

  // categorii + nevoi/oferte -----------------------------------------------
  categorii: WizardCategoriePick[];
  domenii_altele: string;
  // ce cauta firma (simetric cu ce ofera, pentru matching) -----------------
  categorii_cautate: string[];
  domenii_cautate_altele: string;
  nevoi: WizardNevoieOferta[];
  oferte: WizardNevoieOferta[];
  cum_poate_ajuta_grupul: string;
}

export const initialWizardState: WizardFormState = {
  cui: null,
  denumire: "",
  nr_reg_com: "",
  adresa_sediu: "",
  stare_inregistrare: "",
  data_inregistrare: "",
  cod_caen_principal: "",
  den_caen_principal: "",
  tva_activ: null,
  radiata: false,
  anaf_raspuns_brut: null,
  judet_nume_anaf: "",

  judet_cod: "",
  localitate: "",
  cod_postal: "",
  lat: null,
  lng: null,
  raza_deservire_km: null,
  zona_deservita: "",
  judete_suplimentare: [],

  telefon_firma: "",
  email_firma: "",
  website: "",
  descriere: "",
  numar_angajati: null,
  dimensiune_echipa: "",

  cifra_afaceri_an: null,
  cifra_afaceri_valoare: null,
  cifra_afaceri_sursa: "indisponibila",
  profit_net: null,

  categorii: [],
  domenii_altele: "",
  categorii_cautate: [],
  domenii_cautate_altele: "",
  nevoi: [],
  oferte: [],
  cum_poate_ajuta_grupul: "",
};

export interface CategoryNode {
  id: string;
  slug: string;
  name_ro: string;
  name_en: string;
  parent_id: string | null;
  children: CategoryNode[];
}

export type { CaenVersion };
