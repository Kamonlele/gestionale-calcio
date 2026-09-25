-- 1. Il ruolo di un nuovo utente è sempre 'giocatore' (prima veniva preso dai dati inviati dal browser)
create or replace function public.crea_profilo_nuovo_utente()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profili (id, nome, cognome, email, telefono, ruolo, approvato)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Nuovo'),
    coalesce(new.raw_user_meta_data->>'cognome', 'Utente'),
    new.email,
    nullif(new.raw_user_meta_data->>'telefono', ''),
    'giocatore',
    false
  );
  return new;
end $$;

-- 2. Ruolo dell'utente corrente, solo se approvato
create or replace function public.mio_ruolo()
returns text language sql stable security definer set search_path = public as $$
  select ruolo from public.profili where id = auth.uid() and approvato
$$;

-- 3. Solo un admin può cambiare ruolo, approvazione e stato attivo
create or replace function public.proteggi_campi_profilo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.mio_ruolo(), '') <> 'admin' and (
       new.ruolo is distinct from old.ruolo
    or new.approvato is distinct from old.approvato
    or new.attivo is distinct from old.attivo
    or new.id is distinct from old.id) then
    raise exception 'Solo un admin può modificare ruolo, approvazione o stato';
  end if;
  return new;
end $$;

drop trigger if exists proteggi_campi_profilo on public.profili;
create trigger proteggi_campi_profilo before update on public.profili
  for each row execute function public.proteggi_campi_profilo();

-- Il profilo lo crea il trigger: nessun inserimento diretto dal browser
drop policy if exists "Insert profilo" on public.profili;

-- 4. Chi è in attesa di approvazione vede solo il proprio profilo
drop policy if exists "Utenti loggati vedono profili" on public.profili;
create policy "Approvati vedono profili" on public.profili for select
  using (id = auth.uid() or public.mio_ruolo() is not null);

drop policy if exists "Tutti vedono gli eventi" on public.eventi;
create policy "Approvati vedono gli eventi" on public.eventi for select
  using (public.mio_ruolo() is not null);

drop policy if exists "Convocazioni visibili a tutti" on public.convocazioni;
create policy "Approvati vedono convocazioni" on public.convocazioni for select
  using (public.mio_ruolo() is not null);

drop policy if exists "Tutti vedono prodotti" on public.prodotti;
create policy "Approvati vedono prodotti" on public.prodotti for select
  using (public.mio_ruolo() is not null);

drop policy if exists "Tutti vedono le categorie" on public.categorie_finanziarie;
create policy "Approvati vedono le categorie" on public.categorie_finanziarie for select
  using (public.mio_ruolo() is not null);

drop policy if exists "Giocatore crea ordini" on public.ordini;
create policy "Approvati creano ordini" on public.ordini for insert
  with check (public.mio_ruolo() is not null);

-- 5. Permessi allineati all'app (presidente e cassiere modificano calendario e giocatori, presidente vede finanze)
drop policy if exists "Admin e dirigenti gestiscono eventi" on public.eventi;
create policy "Staff gestisce eventi" on public.eventi for all
  using (public.mio_ruolo() in ('admin', 'dirigente', 'presidente', 'cassiere'))
  with check (public.mio_ruolo() in ('admin', 'dirigente', 'presidente', 'cassiere'));

drop policy if exists "Admin aggiorna profili" on public.profili;
create policy "Staff aggiorna profili" on public.profili for update
  using (public.mio_ruolo() in ('admin', 'presidente', 'cassiere'));

drop policy if exists "Cassieri e admin vedono i movimenti" on public.movimenti;
create policy "Staff vede i movimenti" on public.movimenti for select
  using (public.mio_ruolo() in ('admin', 'cassiere', 'dirigente', 'presidente'));
