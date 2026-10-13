-- Admin e tesoriere possono ordinare per altri; ognuno per sé. creato_da = chi ha inserito l'ordine
alter table public.ordini add column if not exists creato_da uuid references public.profili(id) on delete set null default auth.uid();
drop policy if exists "Approvati creano ordini" on public.ordini;
create policy "Approvati creano ordini" on public.ordini for insert
  with check (
    public.mio_ruolo() is not null
    and (giocatore_id = auth.uid() or public.mio_ruolo() in ('admin', 'cassiere'))
  );
