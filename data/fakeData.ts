// data/fakeData.ts — FootMatch · Communauté fictive Perpignan 66
// ⚠️  SOURCE UNIQUE — tous les écrans utilisent ces mêmes données.
//     CommunityScreen → messages.playerId  → FakePlayer.pseudo
//     PlayersScreen   → FAKE_PLAYERS (fallback / affichage)
//     MatchesScreen   → FAKE_MATCHES.playerIds → FakePlayer.id

// ─── Types ────────────────────────────────────────────────────────────────────

export type Level     = 'D4' | 'D3' | 'D2';
export type MatchType = 'five' | 'city' | 'eleven';

export interface FakePlayer {
  id:            string;      // 'fp-001' … 'fp-050'
  pseudo:        string;      // pseudo affiché partout (jamais le prénom)
  city:          string;
  postalCode:    string;
  level:         Level;
  reputation:    number;
  matchesPlayed: number;
  goalsScored:   number;
}

export interface FakeMatch {
  id:          string;
  title:       string;
  type:        MatchType;
  venueName:   string;
  city:        string;
  address:     string;
  scheduledAt: string;       // ISO
  organizerId: string;       // ref FakePlayer.id
  playerIds:   string[];     // ref FakePlayer.id[]
  maxPlayers:  number;
}

export interface FakeMessage {
  id:        string;
  playerId:  string;         // ref FakePlayer.id  |  'system'
  content:   string;
  createdAt: string;         // ISO
  isSystem?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPlayerById(id: string): FakePlayer | undefined {
  return FAKE_PLAYERS.find(p => p.id === id);
}

export function getPlayerByPseudo(pseudo: string): FakePlayer | undefined {
  return FAKE_PLAYERS.find(p => p.pseudo.toLowerCase() === pseudo.toLowerCase());
}

export function getMatchPlayers(match: FakeMatch): FakePlayer[] {
  return match.playerIds
    .map(id => getPlayerById(id))
    .filter(Boolean) as FakePlayer[];
}

export function getSpotsLeft(match: FakeMatch): number {
  return Math.max(0, match.maxPlayers - match.playerIds.length);
}

// ─── Joueurs — 50 pseudos foot/street, tous Perpignan 66 ─────────────────────

export const FAKE_PLAYERS: FakePlayer[] = [

  // ── D2 — Les cracks (10) ──────────────────────────────────────────────────
  { id: 'fp-001', pseudo: 'Zizou_66',         city: 'Perpignan',           postalCode: '66000', level: 'D2', reputation: 1380, matchesPlayed: 42, goalsScored: 28 },
  { id: 'fp-002', pseudo: 'ElToro66',         city: 'Perpignan',           postalCode: '66000', level: 'D2', reputation: 1290, matchesPlayed: 38, goalsScored: 19 },
  { id: 'fp-003', pseudo: 'TikiTaka66140',    city: 'Canet-en-Roussillon', postalCode: '66140', level: 'D2', reputation: 1210, matchesPlayed: 35, goalsScored: 12 },
  { id: 'fp-004', pseudo: 'Rabona_66',        city: 'Perpignan',           postalCode: '66000', level: 'D2', reputation: 1180, matchesPlayed: 31, goalsScored: 9  },
  { id: 'fp-005', pseudo: 'GoalMachine66',    city: 'Perpignan',           postalCode: '66000', level: 'D2', reputation: 1150, matchesPlayed: 29, goalsScored: 24 },
  { id: 'fp-006', pseudo: 'LaFleche66',       city: 'Cabestany',           postalCode: '66330', level: 'D2', reputation: 1120, matchesPlayed: 27, goalsScored: 15 },
  { id: 'fp-007', pseudo: 'MaestroPerp',      city: 'Perpignan',           postalCode: '66000', level: 'D2', reputation: 1090, matchesPlayed: 26, goalsScored: 8  },
  { id: 'fp-008', pseudo: 'NightFive66',      city: 'Rivesaltes',          postalCode: '66600', level: 'D2', reputation: 1060, matchesPlayed: 24, goalsScored: 11 },
  { id: 'fp-009', pseudo: 'CatalanKing66',    city: 'Perpignan',           postalCode: '66000', level: 'D2', reputation: 1040, matchesPlayed: 23, goalsScored: 6  },
  { id: 'fp-010', pseudo: 'NetBuster66',      city: 'Perpignan',           postalCode: '66000', level: 'D2', reputation: 1010, matchesPlayed: 22, goalsScored: 18 },

  // ── D3 — Bons joueurs (20) ────────────────────────────────────────────────
  { id: 'fp-011', pseudo: 'StreetFoot66',     city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 860, matchesPlayed: 18, goalsScored: 7  },
  { id: 'fp-012', pseudo: 'BabyMbappe66140',  city: 'Canet-en-Roussillon', postalCode: '66140', level: 'D3', reputation: 840, matchesPlayed: 17, goalsScored: 5  },
  { id: 'fp-013', pseudo: 'TwoFoot66',        city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 820, matchesPlayed: 16, goalsScored: 2  },
  { id: 'fp-014', pseudo: 'NoLook_66',        city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 800, matchesPlayed: 15, goalsScored: 9  },
  { id: 'fp-015', pseudo: 'Sombrero66300',    city: 'Thuir',               postalCode: '66300', level: 'D3', reputation: 780, matchesPlayed: 15, goalsScored: 4  },
  { id: 'fp-016', pseudo: 'ElCrack66',        city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 760, matchesPlayed: 14, goalsScored: 6  },
  { id: 'fp-017', pseudo: 'QuickFeet66',      city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 740, matchesPlayed: 14, goalsScored: 3  },
  { id: 'fp-018', pseudo: 'TurboGoal66330',   city: 'Cabestany',           postalCode: '66330', level: 'D3', reputation: 720, matchesPlayed: 13, goalsScored: 8  },
  { id: 'fp-019', pseudo: 'JogaBonito66',     city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 700, matchesPlayed: 13, goalsScored: 5  },
  { id: 'fp-020', pseudo: 'LaFuria66700',     city: 'Argelès-sur-Mer',     postalCode: '66700', level: 'D3', reputation: 680, matchesPlayed: 12, goalsScored: 4  },
  { id: 'fp-021', pseudo: 'MidfieldBoss66',   city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 660, matchesPlayed: 12, goalsScored: 2  },
  { id: 'fp-022', pseudo: 'FreekickKing66',   city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 640, matchesPlayed: 11, goalsScored: 7  },
  { id: 'fp-023', pseudo: 'SauceFinesse66',   city: 'Canet-en-Roussillon', postalCode: '66140', level: 'D3', reputation: 620, matchesPlayed: 11, goalsScored: 0  },
  { id: 'fp-024', pseudo: 'VilaReal66',       city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 600, matchesPlayed: 10, goalsScored: 3  },
  { id: 'fp-025', pseudo: 'SpeedDemon66',     city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 580, matchesPlayed: 10, goalsScored: 5  },
  { id: 'fp-026', pseudo: 'LeftFootGod66',    city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 560, matchesPlayed: 9,  goalsScored: 4  },
  { id: 'fp-027', pseudo: 'RivasaltesBoy66',  city: 'Rivesaltes',          postalCode: '66600', level: 'D3', reputation: 540, matchesPlayed: 9,  goalsScored: 2  },
  { id: 'fp-028', pseudo: 'PerpiStreet66',    city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 520, matchesPlayed: 8,  goalsScored: 1  },
  { id: 'fp-029', pseudo: 'Regate_66',        city: 'Perpignan',           postalCode: '66000', level: 'D3', reputation: 500, matchesPlayed: 8,  goalsScored: 3  },
  { id: 'fp-030', pseudo: 'CenterBack66330',  city: 'Cabestany',           postalCode: '66330', level: 'D3', reputation: 480, matchesPlayed: 8,  goalsScored: 2  },

  // ── D4 — Débutants / occasionnels (20) ───────────────────────────────────
  { id: 'fp-031', pseudo: 'WeekendFive66',    city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 380, matchesPlayed: 5,  goalsScored: 2  },
  { id: 'fp-032', pseudo: 'SundayLeague66',   city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 360, matchesPlayed: 5,  goalsScored: 1  },
  { id: 'fp-033', pseudo: 'Canet_Style',      city: 'Canet-en-Roussillon', postalCode: '66140', level: 'D4', reputation: 340, matchesPlayed: 4,  goalsScored: 1  },
  { id: 'fp-034', pseudo: 'LearningGame66',   city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 320, matchesPlayed: 4,  goalsScored: 0  },
  { id: 'fp-035', pseudo: 'Thuir_Player',     city: 'Thuir',               postalCode: '66300', level: 'D4', reputation: 300, matchesPlayed: 4,  goalsScored: 2  },
  { id: 'fp-036', pseudo: 'JustForFun66',     city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 280, matchesPlayed: 3,  goalsScored: 0  },
  { id: 'fp-037', pseudo: 'GardenFoot66',     city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 260, matchesPlayed: 3,  goalsScored: 1  },
  { id: 'fp-038', pseudo: 'RivesaltesKid',    city: 'Rivesaltes',          postalCode: '66600', level: 'D4', reputation: 240, matchesPlayed: 3,  goalsScored: 0  },
  { id: 'fp-039', pseudo: 'Motivation66',     city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 220, matchesPlayed: 3,  goalsScored: 1  },
  { id: 'fp-040', pseudo: 'GoodVibes66330',   city: 'Cabestany',           postalCode: '66330', level: 'D4', reputation: 200, matchesPlayed: 2,  goalsScored: 0  },
  { id: 'fp-041', pseudo: 'EasyGoing66',      city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 180, matchesPlayed: 2,  goalsScored: 0  },
  { id: 'fp-042', pseudo: 'Relax66',          city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 160, matchesPlayed: 2,  goalsScored: 1  },
  { id: 'fp-043', pseudo: 'TrainMode66',      city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 140, matchesPlayed: 2,  goalsScored: 0  },
  { id: 'fp-044', pseudo: 'FirstTimer66',     city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 120, matchesPlayed: 1,  goalsScored: 0  },
  { id: 'fp-045', pseudo: 'Argeles66700',     city: 'Argelès-sur-Mer',     postalCode: '66700', level: 'D4', reputation: 100, matchesPlayed: 1,  goalsScored: 0  },
  { id: 'fp-046', pseudo: 'Newbie_66',        city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 80,  matchesPlayed: 1,  goalsScored: 0  },
  { id: 'fp-047', pseudo: 'YoloFoot66',       city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 60,  matchesPlayed: 1,  goalsScored: 1  },
  { id: 'fp-048', pseudo: 'FreshFoot66140',   city: 'Canet-en-Roussillon', postalCode: '66140', level: 'D4', reputation: 40,  matchesPlayed: 1,  goalsScored: 0  },
  { id: 'fp-049', pseudo: 'FutureStar66',     city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 20,  matchesPlayed: 0,  goalsScored: 0  },
  { id: 'fp-050', pseudo: 'JustStarted66',    city: 'Perpignan',           postalCode: '66000', level: 'D4', reputation: 0,   matchesPlayed: 0,  goalsScored: 0  },
];

// ─── Matchs — 10 matchs, terrains réels de Perpignan ─────────────────────────

function h(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export const FAKE_MATCHES: FakeMatch[] = [
  {
    id: 'fm-001', title: 'Five du soir — Moulin à Vent', type: 'five',
    venueName: 'Terrain Moulin à Vent', city: 'Perpignan',
    address: 'Rue du Moulin à Vent, 66000 Perpignan',
    scheduledAt: h(3), organizerId: 'fp-001', maxPlayers: 10,
    // → 2 places restantes  ⚡ urgent
    playerIds: ['fp-001', 'fp-002', 'fp-005', 'fp-011', 'fp-012', 'fp-016', 'fp-017', 'fp-031'],
  },
  {
    id: 'fm-002', title: 'City Game Canet', type: 'city',
    venueName: 'Complexe sportif de Canet', city: 'Canet-en-Roussillon',
    address: '12 Av. de la Méditerranée, 66140 Canet-en-Roussillon',
    scheduledAt: h(5), organizerId: 'fp-003', maxPlayers: 8,
    // → 2 places restantes  ⚡ urgent
    playerIds: ['fp-003', 'fp-012', 'fp-033', 'fp-048', 'fp-022', 'fp-023'],
  },
  {
    id: 'fm-003', title: 'Foot 11 Perpignan Sud', type: 'eleven',
    venueName: 'Stade Municipal de Perpignan', city: 'Perpignan',
    address: 'Allée des Sports, 66000 Perpignan',
    scheduledAt: h(24), organizerId: 'fp-004', maxPlayers: 22,
    playerIds: ['fp-004', 'fp-005', 'fp-006', 'fp-007', 'fp-008', 'fp-009', 'fp-010', 'fp-013', 'fp-014', 'fp-015', 'fp-020', 'fp-025', 'fp-026', 'fp-035'],
  },
  {
    id: 'fm-004', title: 'Five rapide — Cabestany', type: 'five',
    venueName: 'Five Cabestany', city: 'Cabestany',
    address: '3 Rue des Sports, 66330 Cabestany',
    scheduledAt: h(2), organizerId: 'fp-006', maxPlayers: 10,
    playerIds: ['fp-006', 'fp-018', 'fp-030', 'fp-040'],
  },
  {
    id: 'fm-005', title: 'Match détente — Thuir', type: 'five',
    venueName: 'Terrain de Thuir', city: 'Thuir',
    address: 'Chemin du Stade, 66300 Thuir',
    scheduledAt: h(48), organizerId: 'fp-015', maxPlayers: 10,
    playerIds: ['fp-015', 'fp-035', 'fp-042'],
  },
  {
    id: 'fm-006', title: 'City Perpignan Centre', type: 'city',
    venueName: 'Five de la Plaine', city: 'Perpignan',
    address: 'Complexe de la Plaine, 66000 Perpignan',
    scheduledAt: h(6), organizerId: 'fp-002', maxPlayers: 8,
    // → 2 places restantes  ⚡ urgent
    playerIds: ['fp-002', 'fp-019', 'fp-024', 'fp-029', 'fp-039', 'fp-036'],
  },
  {
    id: 'fm-007', title: 'Five Compétitif D2/D3', type: 'five',
    venueName: 'Indoor Five Mas Guérido', city: 'Perpignan',
    address: 'Zone commerciale Mas Guérido, 66100 Perpignan',
    scheduledAt: h(26), organizerId: 'fp-008', maxPlayers: 10,
    // → 1 place restante  🔥 très urgent
    playerIds: ['fp-008', 'fp-001', 'fp-010', 'fp-007', 'fp-016', 'fp-022', 'fp-028', 'fp-025', 'fp-005'],
  },
  {
    id: 'fm-008', title: 'Five Débutants — Tous niveaux', type: 'five',
    venueName: 'Terrain Synthétique Nord', city: 'Perpignan',
    address: 'Bd du Conflent, 66000 Perpignan',
    scheduledAt: h(4), organizerId: 'fp-031', maxPlayers: 10,
    // → 2 places restantes  ⚡ urgent
    playerIds: ['fp-031', 'fp-032', 'fp-044', 'fp-046', 'fp-047', 'fp-050', 'fp-037', 'fp-043'],
  },
  {
    id: 'fm-009', title: 'Foot 11 Rivesaltes', type: 'eleven',
    venueName: 'Stade de Rivesaltes', city: 'Rivesaltes',
    address: 'Rue du Stade, 66600 Rivesaltes',
    scheduledAt: h(72), organizerId: 'fp-027', maxPlayers: 22,
    playerIds: ['fp-027', 'fp-008', 'fp-038', 'fp-016', 'fp-021', 'fp-011', 'fp-034', 'fp-029', 'fp-017'],
  },
  {
    id: 'fm-010', title: 'City Argelès Plage', type: 'city',
    venueName: 'Five Argelès', city: 'Argelès-sur-Mer',
    address: 'Av. du Tech, 66700 Argelès-sur-Mer',
    scheduledAt: h(50), organizerId: 'fp-020', maxPlayers: 8,
    playerIds: ['fp-020', 'fp-045', 'fp-033'],
  },
];

// ─── Messages — 16 messages avec pseudos cohérents ───────────────────────────
// Chaque playerId correspond à un joueur de FAKE_PLAYERS ci-dessus.

const t = (minAgo: number) => new Date(Date.now() - minAgo * 60_000).toISOString();

export const FAKE_MESSAGES: FakeMessage[] = [
  {
    id: 'msg-sys-1', playerId: 'system', isSystem: true,
    content: '⚽ 2 matchs attendent encore des joueurs — places limitées',
    createdAt: t(15),
  },
  {
    id: 'msg-001', playerId: 'fp-001',   // Zizou_66
    content: 'Qui est chaud pour le five de ce soir ? Il reste 2 places 🔥',
    createdAt: t(14),
  },
  {
    id: 'msg-002', playerId: 'fp-002',   // ElToro66
    content: 'Je suis là ! 18h ça me va 👍',
    createdAt: t(13),
  },
  {
    id: 'msg-003', playerId: 'fp-011',   // StreetFoot66
    content: 'Pareil chaud 💪 c\'est quel terrain ?',
    createdAt: t(12),
  },
  {
    id: 'msg-004', playerId: 'fp-001',   // Zizou_66
    content: 'Moulin à Vent, je vous envoie le lien du match',
    createdAt: t(11),
  },
  {
    id: 'msg-005', playerId: 'fp-003',   // TikiTaka66140
    content: 'Le five à Canet samedi c\'est qui qui vient ?',
    createdAt: t(10),
  },
  {
    id: 'msg-006', playerId: 'fp-012',   // BabyMbappe66140
    content: 'Moi j\'arrive avec Canet_Style 👍',
    createdAt: t(9),
  },
  {
    id: 'msg-007', playerId: 'fp-033',   // Canet_Style
    content: 'Oui mais seulement à 19h, ça pose un pb ?',
    createdAt: t(8),
  },
  {
    id: 'msg-008', playerId: 'fp-004',   // Rabona_66
    content: 'Foot 11 dimanche Perpignan Sud, cherche encore 8 joueurs ⚽',
    createdAt: t(7),
  },
  {
    id: 'msg-009', playerId: 'fp-016',   // ElCrack66
    content: 'Je suis dispo dimanche, quel niveau requis ?',
    createdAt: t(6),
  },
  {
    id: 'msg-010', playerId: 'fp-004',   // Rabona_66
    content: 'D3 minimum, terrain synthé en bon état',
    createdAt: t(5),
  },
  {
    id: 'msg-011', playerId: 'fp-006',   // LaFleche66
    content: 'Présent dimanche 🙌 je ramène TurboGoal aussi',
    createdAt: t(4),
  },
  {
    id: 'msg-012', playerId: 'fp-031',   // WeekendFive66
    content: 'Five débutants ce soir à 20h — tous niveaux acceptés 👋',
    createdAt: t(3),
  },
  {
    id: 'msg-013', playerId: 'fp-047',   // YoloFoot66
    content: 'Super initiative WeekendFive, je m\'inscris direct',
    createdAt: t(2),
  },
  {
    id: 'msg-014', playerId: 'fp-002',   // ElToro66
    content: 'GG à tous hier soir, belle intensité 🔥 On remet ça quand ?',
    createdAt: t(1),
  },
  {
    id: 'msg-015', playerId: 'fp-008',   // NightFive66
    content: 'Dispo vendredi ou samedi perso',
    createdAt: t(0),
  },
];
