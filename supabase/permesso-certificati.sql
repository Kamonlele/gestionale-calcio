-- Permesso speciale: l'admin abilita singoli dirigenti a inserire i certificati medici
alter table public.profili add column if not exists gestisce_certificati boolean not null default false;

create or replace function public.puo_gestire_certificati()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profili
    where id = auth.uid() and approvato
      and (ruolo = 'admin' or (ruolo = 'dirigente' and gestisce_certificati))
  )
$$;

-- Il nuovo campo lo può cambiare solo un admin
create or replace function public.proteggi_campi_profilo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.mio_ruolo(), '') <> 'admin' and (
       new.ruolo is distinct from old.ruolo
    or new.approvato is distinct from old.approvato
    or new.attivo is distinct from old.attivo
    or new.gestisce_certificati is distinct from old.gestisce_certificati
    or new.id is distinct from old.id) then
    raise exception 'Solo un admin può modificare ruolo, approvazione, stato o permessi';
  end if;
  return new;
end $$;

drop policy if exists "Admin e dirigenti gestiscono certificati" on public.certificati_medici;
create policy "Gestori certificati" on public.certificati_medici for all
  using (public.puo_gestire_certificati())
  with check (public.puo_gestire_certificati());

drop policy if exists "Certificati visibili a dirigenti e admin" on public.certificati_medici;
create policy "Certificati visibili" on public.certificati_medici for select
  using (giocatore_id = auth.uid() or public.mio_ruolo() in ('admin', 'dirigente'));
