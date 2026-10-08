-- Il cassiere (tesoriere) inserisce certificati e vede tutti gli ordini
create or replace function public.puo_gestire_certificati()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profili
    where id = auth.uid() and approvato
      and (ruolo in ('admin', 'cassiere') or (ruolo = 'dirigente' and gestisce_certificati))
  )
$$;

drop policy if exists "Certificati visibili" on public.certificati_medici;
create policy "Certificati visibili" on public.certificati_medici for select
  using (giocatore_id = auth.uid() or public.mio_ruolo() in ('admin', 'dirigente', 'cassiere'));

drop policy if exists "Giocatore vede propri ordini" on public.ordini;
create policy "Ordini visibili" on public.ordini for select
  using (giocatore_id = auth.uid() or public.mio_ruolo() in ('admin', 'dirigente', 'cassiere'));
