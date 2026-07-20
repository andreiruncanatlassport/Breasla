-- ============================================================================
-- IMAGINE OPTIONALA LA OPORTUNITATI — un singur URL de imagine, afisata pe
-- card si pe pagina de detaliu. Ruleaza dupa 0024_conversation_leave_policy.sql.
-- ============================================================================

alter table public.opportunities
  add column if not exists imagine_url text;
