-- Movimenti di cassa: conto bancario o wallet
alter table public.movimenti add column if not exists conto text check (conto in ('conto', 'wallet'));
