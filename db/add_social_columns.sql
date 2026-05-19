-- ─────────────────────────────────────────────────────────────────────────────
-- FootMatch — Ajout colonnes réseaux sociaux dans profiles
-- Exécuter dans Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS tiktok    text;

-- Commentaires explicatifs
COMMENT ON COLUMN profiles.instagram IS 'Pseudo ou URL Instagram du joueur (optionnel)';
COMMENT ON COLUMN profiles.tiktok    IS 'Pseudo ou URL TikTok du joueur (optionnel)';
