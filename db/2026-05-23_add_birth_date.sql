BEGIN;

-- Migration : Ajout date de naissance
-- Date : 2026-05-23
-- Champ optionnel côté DB (obligatoire côté app à l'inscription)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMIT;
