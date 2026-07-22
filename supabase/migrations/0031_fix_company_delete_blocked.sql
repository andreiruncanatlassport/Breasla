-- Repara stergerea firmelor. Cateva coloane care refera companies(id) nu
-- aveau nicio actiune ON DELETE specificata (implicit = NO ACTION), ceea ce
-- bloca stergerea unei firme daca exista fie si UN SINGUR rand vechi ce o
-- referenteaza — cel mai frecvent, admin_audit_log: orice firma aprobata sau
-- editata vreodata din panoul de admin are minim o intrare acolo, deci
-- stergerea ei esua mereu cu "foreign key violation" (23503), desi firma
-- exista si operatorul chiar voia sa o stearga.
--
-- Solutia: ON DELETE SET NULL — pastram jurnalul/istoricul (nu il stergem si
-- nu blocam operatiunea), doar taiem legatura catre firma care nu mai exista.

alter table public.admin_audit_log
  drop constraint if exists admin_audit_log_company_id_fkey,
  add constraint admin_audit_log_company_id_fkey
    foreign key (company_id) references public.companies (id) on delete set null;

alter table public.messages
  alter column sender_company_id drop not null,
  drop constraint if exists messages_sender_company_id_fkey,
  add constraint messages_sender_company_id_fkey
    foreign key (sender_company_id) references public.companies (id) on delete set null;

alter table public.deals
  drop constraint if exists deals_anulat_de_fkey,
  add constraint deals_anulat_de_fkey
    foreign key (anulat_de) references public.companies (id) on delete set null;

alter table public.deal_versions
  alter column propus_de drop not null,
  drop constraint if exists deal_versions_propus_de_fkey,
  add constraint deal_versions_propus_de_fkey
    foreign key (propus_de) references public.companies (id) on delete set null;

alter table public.deal_messages
  alter column sender_company_id drop not null,
  drop constraint if exists deal_messages_sender_company_id_fkey,
  add constraint deal_messages_sender_company_id_fkey
    foreign key (sender_company_id) references public.companies (id) on delete set null;
