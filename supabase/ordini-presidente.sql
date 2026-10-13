-- Anche il presidente ordina per altri e vede gli ordini che ha inserito
drop policy if exists "Approvati creano ordini" on public.ordini;
create policy "Approvati creano ordini" on public.ordini for insert
  with check (
    public.mio_ruolo() is not null
    and (giocatore_id = auth.uid() or public.mio_ruolo() in ('admin', 'cassiere', 'presidente'))
  );
drop policy if exists "Ordini visibili" on public.ordini;
create policy "Ordini visibili" on public.ordini for select
  using (giocatore_id = auth.uid() or creato_da = auth.uid() or public.mio_ruolo() in ('admin', 'dirigente', 'cassiere'));
