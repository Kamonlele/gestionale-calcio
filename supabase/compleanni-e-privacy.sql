-- Liste riepilogative: rispettano le regole di accesso di chi le legge, niente accesso anonimo
create or replace view public.compleanni_mese as
  select nome, cognome, data_nascita,
    extract(day from data_nascita) as giorno,
    extract(month from data_nascita) as mese,
    (date_part('year', current_date) - date_part('year', data_nascita)) as prossima_eta,
    id
  from public.profili
  where attivo = true and approvato and extract(month from data_nascita) = extract(month from current_date)
  order by extract(day from data_nascita);
alter view public.compleanni_mese set (security_invoker = true);
alter view public.certificati_in_scadenza set (security_invoker = true);
alter view public.saldo_cassa set (security_invoker = true);
revoke select on public.compleanni_mese, public.certificati_in_scadenza, public.saldo_cassa from anon;

-- Data di nascita salvata alla registrazione
create or replace function public.crea_profilo_nuovo_utente()
returns trigger language plpgsql security definer set search_path = public as $$
declare nascita text := new.raw_user_meta_data->>'data_nascita';
begin
  insert into public.profili (id, nome, cognome, email, telefono, data_nascita, ruolo, approvato)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Nuovo'),
    coalesce(new.raw_user_meta_data->>'cognome', 'Utente'),
    new.email,
    nullif(new.raw_user_meta_data->>'telefono', ''),
    case when nascita ~ '^\d{4}-\d{2}-\d{2}$' then nascita::date end,
    'giocatore',
    false
  );
  return new;
end $$;

-- Registro delle notifiche di compleanno già inviate (una sola al giorno)
create table if not exists public.compleanni_notificati (giorno date primary key, inviato_il timestamptz default now());
alter table public.compleanni_notificati enable row level security;
