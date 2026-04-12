-- ============================================================
-- FootMatch — SETUP COMPLET (dans cet ordre)
-- Colle chaque bloc séparément dans Supabase SQL Editor
-- ============================================================

-- ════════════════════════════════════════════════
-- BLOC 1 : Colonne skill + recalcul niveaux
-- ════════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_skill ON profiles(skill);

UPDATE profiles SET level =
  CASE
    WHEN reputation_score >= 300 THEN 'Pro'
    WHEN reputation_score >= 200 THEN 'Confirmé'
    WHEN reputation_score >= 80  THEN 'Intermédiaire'
    ELSE 'Débutant'
  END;

UPDATE profiles
SET skill = (ARRAY['vitesse','dribbles','physique','2pieds','technique','tete','gardien','vision'])[1 + floor(random() * 8)::int]
WHERE skill IS NULL;

-- ════════════════════════════════════════════════
-- BLOC 2 : Community Chat
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS community_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_created ON community_messages(created_at DESC);
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "community_read"   ON community_messages;
DROP POLICY IF EXISTS "community_insert" ON community_messages;
CREATE POLICY "community_read"   ON community_messages FOR SELECT USING (true);
CREATE POLICY "community_insert" ON community_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════
-- BLOC 3 : Seed messages communauté (optionnel)
-- Pour que le chat ne soit pas vide au lancement
-- ════════════════════════════════════════════════
DO $$
DECLARE
  msgs TEXT[] := ARRAY[
    'Qui serait chaud pour un five mardi vers 20h sur Paris ?',
    'Il nous manque un gardien pour demain soir a Lyon, niveau tranquille.',
    'Quelqu''un a deja joue au terrain de Gerland ?',
    'Premier match trouve sur l''app ce soir, merci pour l''orga.',
    'Je suis plutot D4-D3, vous conseillez quels matchs pour commencer ?',
    'On cherche 2 joueurs pour completer notre equipe de championnat.',
    'City samedi matin a Marseille si certains veulent se joindre.',
    'Nouveau ici, je peux rejoindre un match meme si je connais personne ?',
    'Le five de jeudi a Lille etait vraiment propre, bonne ambiance.',
    'Il reste 3 places pour vendredi 19h a Bordeaux.',
    'Si quelqu''un joue regulierement a Toulouse je suis preneur d''un groupe.',
    'Des matchs ouverts dimanche matin sur Nantes ?',
    'Je prefere les matchs ou ca joue propre, sans prise de tete.',
    'On monte une equipe soft pour la semaine prochaine, il manque encore un defenseur.'
  ];
  uids UUID[];
  msg TEXT;
  uid UUID;
  i INTEGER;
BEGIN
  SELECT ARRAY(SELECT id FROM profiles ORDER BY random() LIMIT 14) INTO uids;
  FOR i IN 1..array_length(msgs, 1) LOOP
    uid := uids[i];
    msg := msgs[i];
    IF uid IS NOT NULL THEN
      INSERT INTO community_messages (user_id, content, created_at)
      VALUES (uid, msg, NOW() - (floor(random() * 72) || ' hours')::interval)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ════════════════════════════════════════════════
SELECT 'Profiles'            AS table_name, COUNT(*) AS total FROM profiles
UNION ALL
SELECT 'Community messages',                COUNT(*) FROM community_messages
UNION ALL
SELECT 'Skills renseignés',                 COUNT(*) FROM profiles WHERE skill IS NOT NULL
UNION ALL
SELECT 'Niveaux recalculés',               COUNT(*) FROM profiles WHERE level IN ('Débutant','Intermédiaire','Confirmé','Pro');
