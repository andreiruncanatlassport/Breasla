-- ============================================================================
-- Lipsea o politica de DELETE pe conversation_participants — necesara ca sa
-- poti "sterge" o conversatie din lista ta (iesi din ea; celalalt participant
-- nu e afectat). Ruleaza acest fisier dupa 0023_rfq_deal_archiving.sql.
-- ============================================================================

create policy "imi pot parasi propria conversatie" on public.conversation_participants
  for delete using (profile_id = auth.uid());
