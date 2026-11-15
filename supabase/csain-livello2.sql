-- LIVELLO 2 (riconoscimento personale) per il sito CSAIN Padel Club Cup.
-- Da eseguire una sola volta nello stesso servizio di accesso già usato da sportandservicespadel.it.
-- Usa la tabella "profili" già esistente (nome, cognome, data_nascita) creata alla registrazione.

create table if not exists csain_personale (
  id uuid primary key default gen_random_uuid(),
  sezione text not null,                 -- nome della sezione personale (es. 'club')
  nome text not null,                    -- "Nome Cognome" come scritto dall'organizzazione
  data_nascita date not null,
  email text not null,                   -- mail a cui arriva il codice
  dati jsonb not null default '{}'::jsonb,
  aggiornata timestamptz not null default now()
);
create table if not exists csain_accessi (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid not null references csain_personale(id) on delete cascade,
  creato timestamptz not null default now(),
  primary key (user_id, record_id)
);
create table if not exists csain_codici (
  user_id uuid not null,
  sezione text not null,
  hash text not null,
  record_ids uuid[] not null,
  scade timestamptz not null,
  tentativi int not null default 0,
  creato timestamptz not null default now(),
  primary key (user_id, sezione)
);

alter table csain_personale enable row level security;
alter table csain_accessi  enable row level security;
alter table csain_codici   enable row level security;

-- ognuno vede solo le righe che ha sbloccato con il codice; l'amministratore le vede tutte
create policy csain_personale_lettura on csain_personale for select to authenticated
  using (id in (select record_id from csain_accessi where user_id = auth.uid())
         or (auth.jwt() ->> 'email') = 'gianluca.micarelli@gmail.com');
create policy csain_personale_admin on csain_personale for all to authenticated
  using ((auth.jwt() ->> 'email') = 'gianluca.micarelli@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'gianluca.micarelli@gmail.com');
create policy csain_accessi_lettura on csain_accessi for select to authenticated using (user_id = auth.uid());
-- csain_codici: nessuna policy = solo la funzione "csain-codice" (chiave di servizio) la usa
