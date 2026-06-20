-- =============================================================
-- NPMS Enterprise — Production Schema v2.1
-- Security-hardened: role-based RLS, immutable audit logs,
-- unique constraints, numeric precision, performance indexes
-- =============================================================

create extension if not exists pgcrypto;

-- =============================================================
-- CORE TABLES
-- =============================================================

create table if not exists inventaire (
  id uuid primary key default gen_random_uuid(),
  codeEspace text unique not null,
  typeEspace text,
  zone text,
  loyerMensuel numeric(15,2) default 0 check (loyerMensuel >= 0),
  nomLocataireOfficiel text,
  statut text default 'Vacant',
  created_at timestamptz default now()
);

alter table inventaire add column if not exists surface numeric(10,2) default 0;
alter table inventaire add column if not exists nomOccupantReel text;
alter table inventaire add column if not exists nomCommercial text;
alter table inventaire add column if not exists activite text;
alter table inventaire add column if not exists telephone text;
alter table inventaire add column if not exists etatMaintenance text default 'Good';
alter table inventaire add column if not exists risque text default 'Low';
alter table inventaire add column if not exists photoUrl text;
alter table inventaire add column if not exists documentUrl text;

create table if not exists locataires (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  commerce text,
  telephone text,
  activite text,
  statut text default 'Active',
  risque text default 'Low',
  created_at timestamptz default now()
);

alter table locataires add column if not exists occupantReel text;
alter table locataires add column if not exists documentId text;
alter table locataires add column if not exists communication text;
alter table locataires add column if not exists notes text;

create table if not exists contrats (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  boutiqueCode text not null,
  locataire text not null,
  montantLoyer numeric(15,2) default 0 check (montantLoyer >= 0),
  statut text default 'Active',
  created_at timestamptz default now()
);

alter table contrats add column if not exists dateDebut date;
alter table contrats add column if not exists dateFin date;
alter table contrats add column if not exists caution numeric(15,2) default 0;
alter table contrats add column if not exists renouvellement text default 'Manual';
alter table contrats add column if not exists documentUrl text;

create table if not exists loyers (
  id uuid primary key default gen_random_uuid(),
  boutiqueCode text not null,
  locataire text not null,
  mois text not null,
  montant numeric(15,2) default 0 check (montant >= 0),
  paye numeric(15,2) default 0 check (paye >= 0),
  solde numeric(15,2) default 0,
  statut text default 'Overdue',
  created_at timestamptz default now()
);

-- Prevent duplicate rent rows for the same space/month (CRITICAL: was missing)
alter table loyers add column if not exists dueDate date;
alter table loyers add column if not exists penalite numeric(15,2) default 0;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'loyers_boutiquecode_mois_unique'
  ) then
    alter table loyers add constraint loyers_boutiquecode_mois_unique unique (boutiqueCode, mois);
  end if;
end $$;

create table if not exists paiements (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  reference text unique not null,
  payeur text not null,
  source text,
  montant numeric(15,2) default 0 check (montant > 0),
  mode text,
  statut text default 'Confirmed',
  created_at timestamptz default now()
);

alter table paiements add column if not exists numero_recu text;
alter table paiements add column if not exists espace text;
alter table paiements add column if not exists duplicata text default 'No';

create table if not exists depenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  categorie text,
  description text,
  montant numeric(15,2) default 0 check (montant >= 0),
  modePaiement text,
  created_at timestamptz default now()
);

alter table depenses add column if not exists fournisseur text;
alter table depenses add column if not exists statut text default 'Pending';

create table if not exists caisse (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  caissier text not null,
  soldeOuverture numeric(15,2) default 0,
  entrees numeric(15,2) default 0,
  sorties numeric(15,2) default 0,
  soldeTheorique numeric(15,2) default 0,
  cashReel numeric(15,2) default 0,
  ecart numeric(15,2) default 0,
  statut text default 'Conforme',
  created_at timestamptz default now()
);

create table if not exists mouvements_caisse (
  id uuid primary key default gen_random_uuid(),
  dateHeure timestamptz not null,
  caisseDate date,
  type text,
  libelle text,
  entree numeric(15,2) default 0,
  sortie numeric(15,2) default 0,
  soldeApres numeric(15,2) default 0,
  statut text default 'Trace',
  created_at timestamptz default now()
);

create table if not exists depots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  reference text unique not null,
  banque text,
  montant numeric(15,2) default 0 check (montant > 0),
  deposant text,
  statut text default 'Prepared',
  created_at timestamptz default now()
);

create table if not exists mouvements_banque (
  id uuid primary key default gen_random_uuid(),
  dateHeure timestamptz not null,
  banque text,
  type text,
  reference text,
  entree numeric(15,2) default 0,
  sortie numeric(15,2) default 0,
  soldeApres numeric(15,2) default 0,
  statut text default 'To reconcile',
  created_at timestamptz default now()
);

create table if not exists revenus (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  source text,
  description text,
  montant numeric(15,2) default 0 check (montant >= 0),
  mode text,
  statut text default 'Confirmed',
  created_at timestamptz default now()
);

create table if not exists maintenance (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  espace text,
  demandeur text,
  description text,
  contractor text,
  cost numeric(15,2) default 0,
  statut text default 'Open',
  priority text default 'Medium',
  closeDate date,
  created_at timestamptz default now()
);

create table if not exists communications (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  locataire text,
  canal text,
  sujet text,
  details text,
  utilisateur text,
  created_at timestamptz default now()
);

-- Role constraint enforced at DB level (CRITICAL: prevents invalid roles)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  fullName text,
  role text default 'Viewer' check (role in ('Super Admin','Director','Accountant','Field Agent','Viewer')),
  statut text default 'Active',
  created_at timestamptz default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  action text not null,
  module text,
  utilisateur text,
  details text
);

create table if not exists archives (
  id uuid primary key default gen_random_uuid(),
  titre text,
  type text,
  reference text,
  date date,
  statut text default 'Complete',
  created_at timestamptz default now()
);

-- =============================================================
-- PERFORMANCE INDEXES
-- =============================================================
create index if not exists idx_loyers_boutique  on loyers(boutiqueCode);
create index if not exists idx_loyers_mois      on loyers(mois);
create index if not exists idx_loyers_statut    on loyers(statut);
create index if not exists idx_paiements_date   on paiements(date);
create index if not exists idx_paiements_payeur on paiements(payeur);
create index if not exists idx_paiements_espace on paiements(espace);
create index if not exists idx_inventaire_statut on inventaire(statut);
create index if not exists idx_mouvements_caisse_date on mouvements_caisse(caisseDate);
create index if not exists idx_mouvements_banque_date on mouvements_banque(dateHeure);
create index if not exists idx_activity_logs_date on activity_logs(date);
create index if not exists idx_maintenance_statut on maintenance(statut);
create index if not exists idx_communications_locataire on communications(locataire);

-- =============================================================
-- SECURITY DEFINER FUNCTIONS
-- Run as table owner (postgres), bypassing RLS safely.
-- Used in policy USING/WITH CHECK expressions.
-- =============================================================

create or replace function get_my_role()
returns text language sql security definer stable as $$
  select coalesce(
    (select role from profiles where email = auth.email()),
    'Viewer'
  )
$$;

create or replace function is_super_admin()
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from profiles
    where email = auth.email() and role = 'Super Admin'
  )
$$;

-- =============================================================
-- TRIGGERS: Enforce role integrity at the database level
-- =============================================================

-- Any self-inserted profile is forced to Viewer unless Super Admin is inserting
create or replace function _enforce_viewer_on_self_register()
returns trigger language plpgsql security definer as $$
begin
  if not is_super_admin() then
    new.role := 'Viewer';
  end if;
  return new;
end $$;

drop trigger if exists trg_profile_role_insert on profiles;
create trigger trg_profile_role_insert
  before insert on profiles
  for each row execute function _enforce_viewer_on_self_register();

-- Prevent any non-Super-Admin from escalating roles via UPDATE
create or replace function _enforce_role_immutability()
returns trigger language plpgsql security definer as $$
begin
  if old.role is distinct from new.role and not is_super_admin() then
    raise exception 'Unauthorized: only Super Admin can modify user roles';
  end if;
  return new;
end $$;

drop trigger if exists trg_profile_role_update on profiles;
create trigger trg_profile_role_update
  before update on profiles
  for each row execute function _enforce_role_immutability();

-- =============================================================
-- ENABLE ROW LEVEL SECURITY + DROP OLD BROAD POLICIES
-- =============================================================
do $$ declare t text;
begin
  foreach t in array array[
    'inventaire','locataires','contrats','loyers','paiements','depenses',
    'caisse','mouvements_caisse','depots','mouvements_banque','revenus',
    'maintenance','communications','profiles','activity_logs','archives'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists authenticated_read_%I on %I', t, t);
    execute format('drop policy if exists authenticated_write_%I on %I', t, t);
  end loop;
end $$;

-- =============================================================
-- PROFILES: Strictest table — controls role assignment
-- =============================================================
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated
  using (email = auth.email() or is_super_admin());

-- Self-registration allowed; trigger forces role = 'Viewer'
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert to authenticated
  with check (email = auth.email() or is_super_admin());

-- Only Super Admin can update (trigger also enforces role field)
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- Only Super Admin can deactivate/delete users
drop policy if exists profiles_delete on profiles;
create policy profiles_delete on profiles for delete to authenticated
  using (is_super_admin());

-- =============================================================
-- ACTIVITY LOGS: Append-only audit trail — immutable by design
-- =============================================================
drop policy if exists activity_logs_select on activity_logs;
create policy activity_logs_select on activity_logs for select to authenticated
  using (get_my_role() in ('Super Admin', 'Director'));

drop policy if exists activity_logs_insert on activity_logs;
create policy activity_logs_insert on activity_logs for insert to authenticated
  with check (auth.email() is not null);

-- No UPDATE or DELETE policies — audit logs cannot be modified

-- =============================================================
-- OPERATIONAL TABLES: Read for all authenticated; writes require non-Viewer
-- inventaire, locataires, contrats, loyers, paiements, revenus,
-- maintenance, communications, archives
-- =============================================================
do $$ declare t text;
begin
  foreach t in array array[
    'inventaire','locataires','contrats','loyers','paiements',
    'revenus','maintenance','communications','archives'
  ]
  loop
    execute format('drop policy if exists op_select_%s on %I', t, t);
    execute format('drop policy if exists op_insert_%s on %I', t, t);
    execute format('drop policy if exists op_update_%s on %I', t, t);
    execute format('drop policy if exists op_delete_%s on %I', t, t);
    execute format(
      $q$create policy op_select_%s on %I for select to authenticated using (true)$q$, t, t);
    execute format(
      $q$create policy op_insert_%s on %I for insert to authenticated with check (get_my_role() != 'Viewer')$q$, t, t);
    execute format(
      $q$create policy op_update_%s on %I for update to authenticated using (get_my_role() != 'Viewer') with check (get_my_role() != 'Viewer')$q$, t, t);
    execute format(
      $q$create policy op_delete_%s on %I for delete to authenticated using (get_my_role() in ('Super Admin', 'Director'))$q$, t, t);
  end loop;
end $$;

-- =============================================================
-- FINANCE TABLES: Restricted to Accountant, Director, Super Admin
-- depenses, caisse, mouvements_caisse, depots, mouvements_banque
-- =============================================================
do $$ declare t text;
begin
  foreach t in array array[
    'depenses','caisse','mouvements_caisse','depots','mouvements_banque'
  ]
  loop
    execute format('drop policy if exists fin_select_%s on %I', t, t);
    execute format('drop policy if exists fin_insert_%s on %I', t, t);
    execute format('drop policy if exists fin_update_%s on %I', t, t);
    execute format('drop policy if exists fin_delete_%s on %I', t, t);
    execute format(
      $q$create policy fin_select_%s on %I for select to authenticated using (get_my_role() in ('Super Admin', 'Director', 'Accountant'))$q$, t, t);
    execute format(
      $q$create policy fin_insert_%s on %I for insert to authenticated with check (get_my_role() in ('Super Admin', 'Director', 'Accountant'))$q$, t, t);
    execute format(
      $q$create policy fin_update_%s on %I for update to authenticated using (get_my_role() in ('Super Admin', 'Director', 'Accountant')) with check (get_my_role() in ('Super Admin', 'Director', 'Accountant'))$q$, t, t);
    execute format(
      $q$create policy fin_delete_%s on %I for delete to authenticated using (get_my_role() in ('Super Admin', 'Director'))$q$, t, t);
  end loop;
end $$;

-- =============================================================
-- v4.2 PATCH — New tables, columns, RPC, and role-name fix
-- Safe to re-run (idempotent). Run after the v2.1 block above.
-- =============================================================

-- ── Fix: v2.1 used English role names; v4.2 app uses French ─────────────────
-- Drop the old English-only CHECK constraint on profiles.role and replace it
-- with one that accepts both sets (backwards compatible if any English rows exist).
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in (
    'Super Admin',
    'Directeur',  'Director',
    'Comptable',  'Accountant',
    'Agent terrain', 'Field Agent',
    'Caissier',
    'Viewer'
  ));

-- ── Fix: Update RLS helper functions to match French role names ───────────────
-- get_my_role() is unchanged — it just returns whatever is in profiles.role.
-- The finance and audit policies that hardcoded English names are replaced below.

-- Rebuild activity_logs SELECT policy with French role names
drop policy if exists activity_logs_select on activity_logs;
create policy activity_logs_select on activity_logs for select to authenticated
  using (get_my_role() in ('Super Admin','Directeur','Director'));

-- Rebuild finance-table policies with both French and English role names
-- (run for each affected table so the script is safe to re-run)
do $$ declare t text;
begin
  foreach t in array array[
    'depenses','caisse','mouvements_caisse','depots','mouvements_banque'
  ]
  loop
    execute format('drop policy if exists fin_select_%s on %I', t, t);
    execute format('drop policy if exists fin_insert_%s on %I', t, t);
    execute format('drop policy if exists fin_update_%s on %I', t, t);
    execute format('drop policy if exists fin_delete_%s on %I', t, t);
    execute format(
      $q$create policy fin_select_%s on %I for select to authenticated
         using (get_my_role() in ('Super Admin','Directeur','Director','Comptable','Accountant','Caissier'))$q$, t, t);
    execute format(
      $q$create policy fin_insert_%s on %I for insert to authenticated
         with check (get_my_role() in ('Super Admin','Directeur','Director','Comptable','Accountant','Caissier'))$q$, t, t);
    execute format(
      $q$create policy fin_update_%s on %I for update to authenticated
         using (get_my_role() in ('Super Admin','Directeur','Director','Comptable','Accountant'))
         with check (get_my_role() in ('Super Admin','Directeur','Director','Comptable','Accountant'))$q$, t, t);
    execute format(
      $q$create policy fin_delete_%s on %I for delete to authenticated
         using (get_my_role() in ('Super Admin','Directeur','Director'))$q$, t, t);
  end loop;
end $$;

-- ── v4.2: WC / toilet revenue table ─────────────────────────────────────────
create table if not exists recettes_wc (
  id         uuid primary key default gen_random_uuid(),
  date       date not null default current_date,
  collecteur text not null,
  montant    numeric(15,2) not null check (montant >= 0),
  sessions   integer default 0,
  statut     text default 'Confirmed',
  created_at timestamptz default now()
);
create index if not exists idx_recettes_wc_date on recettes_wc(date);
alter table recettes_wc enable row level security;

-- Caissier and above can record WC revenue; anyone authenticated can read
drop policy if exists wc_select on recettes_wc;
drop policy if exists wc_insert on recettes_wc;
drop policy if exists wc_update on recettes_wc;
drop policy if exists wc_delete on recettes_wc;
create policy wc_select on recettes_wc for select to authenticated using (true);
create policy wc_insert on recettes_wc for insert to authenticated
  with check (get_my_role() != 'Viewer');
create policy wc_update on recettes_wc for update to authenticated
  using (get_my_role() in ('Super Admin','Directeur','Director','Comptable','Accountant'))
  with check (get_my_role() in ('Super Admin','Directeur','Director','Comptable','Accountant'));
create policy wc_delete on recettes_wc for delete to authenticated
  using (get_my_role() in ('Super Admin','Directeur','Director'));

-- ── v4.2: Daily closing additions to caisse ──────────────────────────────────
alter table caisse add column if not exists justification text;
alter table caisse add column if not exists closed_by     text;
alter table caisse add column if not exists closed_at     timestamptz;
alter table caisse add column if not exists caissier      text;   -- add if missing from v2.1
create index if not exists idx_caisse_date on caisse(date);

-- A day cannot be closed with a non-zero variance and no justification.
-- This is the DB-level guarantee behind the "non justifié" UI flag.
alter table caisse drop constraint if exists chk_caisse_justification_required;
alter table caisse add constraint chk_caisse_justification_required
  check (
    ecart = 0
    or statut = 'Open'
    or (justification is not null and length(trim(justification)) > 0)
  );

-- ── v4.2: Atomic rent payment RPC ────────────────────────────────────────────
create or replace function record_rent_payment(
  p_rent_id   uuid,
  p_amount    numeric,
  p_receipt   text,
  p_reference text,
  p_payeur    text,
  p_espace    text,
  p_mode      text
) returns json language plpgsql security definer as $$
declare
  v_rent      loyers%rowtype;
  v_new_paye  numeric;
  v_new_solde numeric;
  v_new_statut text;
begin
  select * into v_rent from loyers where id = p_rent_id for update;
  if not found then
    raise exception 'Rent record % not found', p_rent_id;
  end if;
  if p_amount <= 0 then
    raise exception 'Payment amount must be positive';
  end if;
  v_new_paye   := v_rent.paye + p_amount;
  v_new_solde  := greatest(0, (v_rent.montant + coalesce(v_rent.penalite, 0)) - v_new_paye);
  v_new_statut := case when v_new_solde = 0 then 'Paid' else 'Partial' end;

  insert into paiements (date, reference, numero_recu, payeur, source, espace, montant, mode, statut, duplicata)
  values (current_date, p_reference, p_receipt, p_payeur, 'Rent', p_espace, p_amount, p_mode, 'Confirmed', 'No');

  update loyers set paye = v_new_paye, solde = v_new_solde, statut = v_new_statut where id = p_rent_id;

  return json_build_object('success', true, 'receipt', p_receipt, 'statut', v_new_statut, 'solde', v_new_solde);
end;
$$;
grant execute on function record_rent_payment(uuid,numeric,text,text,text,text,text) to authenticated;

-- ── v4.2: Daily closing summary view ─────────────────────────────────────────
create or replace view daily_closing_summary as
select
  d.date,
  coalesce(rent.total,  0) as rent_collected,
  coalesce(rent.cnt,    0) as rent_payment_count,
  coalesce(wc.total,    0) as toilet_revenue,
  coalesce(wc.cnt,      0) as toilet_entry_count,
  coalesce(other.total, 0) as other_revenue,
  coalesce(other.cnt,   0) as other_revenue_count,
  coalesce(exp.total,   0) as total_expenses,
  coalesce(exp.cnt,     0) as expense_count,
  c.soldeouverture          as opening_cash,
  c.entrees                 as cash_in,
  c.sorties                 as cash_out,
  c.soldetheorique          as expected_cash,
  c.cashreel                as actual_cash,
  c.ecart                   as variance,
  c.justification,
  c.statut                  as closing_status,
  c.closed_by,
  c.closed_at
from (select distinct date from caisse) d
left join caisse c on c.date = d.date
left join (
  select date, sum(montant) as total, count(*) as cnt
  from paiements where source ilike '%loyer%' or source ilike '%rent%'
  group by date
) rent on rent.date = d.date
left join (
  select date, sum(montant) as total, count(*) as cnt
  from recettes_wc group by date
) wc on wc.date = d.date
left join (
  select date, sum(montant) as total, count(*) as cnt
  from revenus group by date
) other on other.date = d.date
left join (
  select date, sum(montant) as total, count(*) as cnt
  from depenses group by date
) exp on exp.date = d.date
order by d.date desc;

grant select on daily_closing_summary to authenticated;
