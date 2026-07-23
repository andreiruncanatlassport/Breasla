-- FIX CRITIC DE SECURITATE: coloana profiles.rol ('user' | 'moderator' |
-- 'admin') NU avea nicio protectie la nivel de coloana — doar RLS la nivel
-- de RAND ("profil propriu editabil": id = auth.uid()). Politica de rand nu
-- restrictioneaza CE coloane pot fi schimbate, deci orice user autentificat
-- putea, printr-un update trimis direct (ocolind interfata aplicatiei),
-- sa-si seteze singur rol = 'admin' si sa capete acces complet la panoul de
-- administrare. Acelasi tipar de protectie exista deja pentru
-- email_verificat (migrarea 0010) si stare_verificare (migrarea 0034) — de
-- data asta il aplicam si pe rol.

create function public.protect_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin_or_mod() or auth.role() = 'service_role') then
    new.rol := old.rol;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_rol
  before update on public.profiles
  for each row execute procedure public.protect_rol();
