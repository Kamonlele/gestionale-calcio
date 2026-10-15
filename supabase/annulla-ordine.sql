-- Il giocatore (o chi ha inserito l'ordine) può annullarlo finché è "in attesa"
alter table public.ordini add column if not exists annullato_il timestamptz;

create or replace function public.annulla_ordine(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.ordini
     set stato = 'annullato', annullato_il = now()
   where id = p_id
     and stato = 'in_attesa'
     and (giocatore_id = auth.uid() or creato_da = auth.uid())
     and public.mio_ruolo() is not null;
  return found;
end $$;

revoke execute on function public.annulla_ordine(uuid) from public, anon;
grant execute on function public.annulla_ordine(uuid) to authenticated;
