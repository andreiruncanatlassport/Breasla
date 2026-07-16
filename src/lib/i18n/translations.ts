interface Dictionary {
  nav: {
    catalog: string;
    howItWorks: string;
    login: string;
    register: string;
    dashboard: string;
    admin: string;
    logout: string;
  };
  home: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stampLabel: string;
    howTitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    trustTitle: string;
    trust1: string;
    trust2: string;
    trust3: string;
  };
  company: {
    cui: string;
    denumire: string;
    adresa: string;
    judet: string;
    localitate: string;
    status_pending: string;
    status_approved: string;
    status_rejected: string;
    status_suspended: string;
    tvaActiv: string;
    tvaInactiv: string;
    angajati: string;
    cifraAfaceri: string;
    website: string;
    contact: string;
    descriere: string;
    domenii: string;
    zonaDeservita: string;
    cerereConexiune: string;
    conexiuneTrimisa: string;
    conexiuneAcceptata: string;
  };
  auth: {
    email: string;
    parola: string;
    numeComplet: string;
    telefon: string;
    login: string;
    register: string;
    noAccount: string;
    hasAccount: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    next: string;
    back: string;
    search: string;
    filters: string;
    noResults: string;
    required: string;
    optional: string;
  };
}

export const translations: Record<"ro" | "en", Dictionary> = {
  ro: {
    nav: {
      catalog: "Catalog firme",
      howItWorks: "Cum funcționează",
      login: "Autentificare",
      register: "Înregistrează firma",
      dashboard: "Contul meu",
      admin: "Administrare",
      logout: "Deconectare",
    },
    home: {
      eyebrow: "Registrul antreprenorilor din România",
      title: "Un singur loc unde antreprenorii din România se găsesc unii pe alții.",
      subtitle:
        "Nu încă un grup de Facebook. Un catalog verificat prin ANAF, organizat pe domenii și zone, ca să găsești rapid colaboratorul potrivit — și să fii găsit la rândul tău.",
      ctaPrimary: "Înregistrează-ți firma",
      ctaSecondary: "Explorează catalogul",
      stampLabel: "Verificat prin ANAF",
      howTitle: "Cum funcționează",
      step1Title: "Introduci CUI-ul",
      step1Body:
        "Preluăm automat datele oficiale de la ANAF: denumire, adresă, status TVA, cod CAEN.",
      step2Title: "Completezi profilul",
      step2Body:
        "Domenii de activitate, zonă deservită, dimensiune echipă și ce cauți sau ce poți oferi grupului.",
      step3Title: "Ești găsit de colaboratori",
      step3Body:
        "Apari în catalog după ce firma e validată. Alte firme te pot contacta sau te pot conecta pentru acces la date extinse.",
      trustTitle: "De ce e diferit",
      trust1: "Fiecare firmă e verificată automat cu ANAF, nu doar declarativ.",
      trust2: "Datele personale ale reprezentantului rămân private până se acceptă o conexiune.",
      trust3: "O taxonomie de domenii gândită pentru colaborare reală, nu doar coduri CAEN seci.",
    },
    company: {
      cui: "CUI",
      denumire: "Denumire firmă",
      adresa: "Adresă sediu",
      judet: "Județ",
      localitate: "Localitate",
      status_pending: "În verificare",
      status_approved: "Verificată",
      status_rejected: "Respinsă",
      status_suspended: "Suspendată",
      tvaActiv: "Plătitor de TVA",
      tvaInactiv: "Neplătitor de TVA",
      angajati: "Nr. angajați",
      cifraAfaceri: "Cifră de afaceri",
      website: "Website",
      contact: "Contact",
      descriere: "Descriere",
      domenii: "Domenii de activitate",
      zonaDeservita: "Zonă deservită",
      cerereConexiune: "Trimite cerere de conexiune",
      conexiuneTrimisa: "Cerere trimisă",
      conexiuneAcceptata: "Conectat",
    },
    auth: {
      email: "Email",
      parola: "Parolă",
      numeComplet: "Nume complet",
      telefon: "Telefon",
      login: "Autentificare",
      register: "Creează cont",
      noAccount: "Nu ai cont?",
      hasAccount: "Ai deja cont?",
    },
    common: {
      loading: "Se încarcă...",
      save: "Salvează",
      cancel: "Anulează",
      next: "Continuă",
      back: "Înapoi",
      search: "Caută",
      filters: "Filtre",
      noResults: "Nicio firmă găsită pentru filtrele alese.",
      required: "Câmp obligatoriu",
      optional: "opțional",
    },
  },
  en: {
    nav: {
      catalog: "Company catalog",
      howItWorks: "How it works",
      login: "Log in",
      register: "Register your company",
      dashboard: "My account",
      admin: "Admin",
      logout: "Log out",
    },
    home: {
      eyebrow: "Romania's entrepreneur registry",
      title: "One single place where Romanian entrepreneurs find each other.",
      subtitle:
        "Not another Facebook group. An ANAF-verified catalog, organized by field and region, so you find the right collaborator fast — and get found in return.",
      ctaPrimary: "Register your company",
      ctaSecondary: "Browse the catalog",
      stampLabel: "Verified via ANAF",
      howTitle: "How it works",
      step1Title: "Enter your CUI",
      step1Body:
        "We automatically pull official data from ANAF: name, address, VAT status, CAEN code.",
      step2Title: "Complete your profile",
      step2Body:
        "Fields of activity, service area, team size, and what you're looking for or can offer the group.",
      step3Title: "Get found by collaborators",
      step3Body:
        "You appear in the catalog once your company is verified. Other companies can reach out or connect for extended access.",
      trustTitle: "Why it's different",
      trust1: "Every company is automatically verified against ANAF, not just self-declared.",
      trust2: "The representative's personal data stays private until a connection is accepted.",
      trust3: "A category taxonomy designed for real collaboration, not bare CAEN codes.",
    },
    company: {
      cui: "Tax ID (CUI)",
      denumire: "Company name",
      adresa: "Registered address",
      judet: "County",
      localitate: "City",
      status_pending: "Under review",
      status_approved: "Verified",
      status_rejected: "Rejected",
      status_suspended: "Suspended",
      tvaActiv: "VAT registered",
      tvaInactiv: "Not VAT registered",
      angajati: "Employees",
      cifraAfaceri: "Annual revenue",
      website: "Website",
      contact: "Contact",
      descriere: "Description",
      domenii: "Fields of activity",
      zonaDeservita: "Service area",
      cerereConexiune: "Send connection request",
      conexiuneTrimisa: "Request sent",
      conexiuneAcceptata: "Connected",
    },
    auth: {
      email: "Email",
      parola: "Password",
      numeComplet: "Full name",
      telefon: "Phone",
      login: "Log in",
      register: "Create account",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
    },
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      next: "Continue",
      back: "Back",
      search: "Search",
      filters: "Filters",
      noResults: "No companies match the selected filters.",
      required: "Required field",
      optional: "optional",
    },
  },
};

export type Locale = keyof typeof translations;
export type TranslationShape = Dictionary;
