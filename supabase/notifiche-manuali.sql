-- Notifiche scritte a mano: le inviano admin, tesoriere e i dirigenti abilitati dall'admin
alter table public.profili add column if not exists invia_notifiche boolean not null default false;

create or replace function public.puo_inviare_notifiche()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profili
    where id = auth.uid() and approvato
      and (ruolo in ('admin', 'cassiere') or (ruolo = 'dirigente' and invia_notifiche))
  )
$$;

-- Il nuovo permesso lo cambia solo un admin
create or replace function public.proteggi_campi_profilo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.mio_ruolo(), '') <> 'admin' and (
       new.ruolo is distinct from old.ruolo
    or new.approvato is distinct from old.approvato
    or new.attivo is distinct from old.attivo
    or new.gestisce_certificati is distinct from old.gestisce_certificati
    or new.invia_notifiche is distinct from old.invia_notifiche
    or new.id is distinct from old.id) then
    raise exception 'Solo un admin può modificare ruolo, approvazione, stato o permessi';
  end if;
  return new;
end $$;

-- Storico: lo scrive solo il server (chiave di servizio), lo legge chi può inviare
create table if not exists public.notifiche_inviate (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  messaggio text not null,
  pagina text,
  destinatari text not null,
  inviato_da uuid references public.profili(id) on delete set null,
  ok boolean,
  creato_il timestamptz default now()
);
alter table public.notifiche_inviate enable row level security;
drop policy if exists "Storico notifiche" on public.notifiche_inviate;
create policy "Storico notifiche" on public.notifiche_inviate for select using (public.puo_inviare_notifiche());
