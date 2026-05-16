// ─── FootMatch — Types TypeScript complets ───────────────────────────────────
// Tous les types sont stricts, aucun `any` autorisé dans l'app.

import type { MatchType } from '../constants/theme';

// ─── Utilisateur ──────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  pseudo: string;
  level: string;
  matchesPlayed: number;
  matchesCreated: number;
  reputation_score: number;
  reputation_rank: string;
  city?: string;
  postal_code?: string;
  avatar_id?: string;
  avatar_photo_url?: string | null;
  skill?: string | null;
  goals?: number;
  assists?: number;
}

// ─── Terrain ──────────────────────────────────────────────────────────────────

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  types: MatchType[];
  source?: 'db' | 'osm' | 'community';
  description?: string | null;
  photo_url?: string | null;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export type MatchStatus = 'open' | 'full' | 'cancelled' | 'completed';

export interface Match {
  id: string;
  title: string;
  type: MatchType;
  venue_id: string;
  venue?: Venue;
  organizer_id: string;
  scheduled_at: string;
  max_players: number;
  current_players: number;
  price_per_player: number;
  level: string;
  status: MatchStatus;
  description?: string | null;
  is_private?: boolean;
  avg_rating?: number | null;
  rating_count?: number;
  distanceKm?: number | null;
  venue_name?: string | null;
}

// ─── Joueur dans un match ──────────────────────────────────────────────────────

export interface MatchPlayerUser {
  id: string;
  pseudo: string;
  level: string;
  reputation_score?: number;
  reputation_rank?: string;
  display_score?: number;
  display_level?: string;
  display_matches_played?: number;
}

export interface MatchPlayer {
  id?: string;
  match_id: string;
  user_id: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  user?: MatchPlayerUser;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface MessageAuthor {
  id: string;
  pseudo: string;
}

export interface ChatMessage {
  id: string;
  match_id?: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: MessageAuthor;
}

export interface CommunityMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: MessageAuthor;
}

// ─── Proposition de terrain ───────────────────────────────────────────────────

export type ProposalStatus = 'pending' | 'validated' | 'rejected';

export interface VenueProposal {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  types: MatchType[];
  description?: string | null;
  photo_url?: string | null;
  proposed_by: string;
  status: ProposalStatus;
  votes_yes: number;
  votes_no: number;
  validated_venue_id?: string | null;
  proposer?: MessageAuthor;
}

// ─── Championnat ──────────────────────────────────────────────────────────────

export type ChampionshipStatus = 'registration' | 'active' | 'finished';

export interface Championship {
  id: string;
  name: string;
  organizer_id: string;
  status: ChampionshipStatus;
  max_teams: number;
  join_code?: string;
  description?: string | null;
  created_at: string;
  organizer?: { pseudo: string };
  team_count?: number;
}

// ─── Format de compétition (multi-format) ─────────────────────────────────────
// Format libre — aucune restriction de taille d'équipe à la création
// 5v5, 7v7, 9v9, 11v11 ou mixte

export type CompetitionFormat = 'five' | 'seven' | 'nine' | 'eleven' | 'all';

export const COMPETITION_FORMATS: Record<CompetitionFormat, { label: string; players: number | null; emoji: string }> = {
  five:   { label: '5v5',       players: 5,    emoji: '⚡' },
  seven:  { label: '7v7',       players: 7,    emoji: '🏃' },
  nine:   { label: '9v9',       players: 9,    emoji: '🔵' },
  eleven: { label: '11v11',     players: 11,   emoji: '⚽' },
  all:    { label: 'Tous formats', players: null, emoji: '🌍' },
};

// ─── Équipes persistantes ──────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  captain_id: string;
  description?: string | null;
  invite_code: string;
  badge_emoji: string;
  preferred_format: CompetitionFormat;
  wins: number;
  draws: number;
  losses: number;
  created_at: string;
  captain?: { pseudo: string; avatar_id?: string };
  member_count?: number;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'captain' | 'player';
  joined_at: string;
  user?: { pseudo: string; avatar_id?: string; level?: string };
}

export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'played' | 'cancelled';

export interface TeamChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  proposed_at: string | null;
  message?: string | null;
  status: ChallengeStatus;
  home_score?: number | null;
  away_score?: number | null;
  created_at: string;
  challenger?: Pick<Team, 'id' | 'name' | 'badge_emoji'>;
  challenged?: Pick<Team, 'id' | 'name' | 'badge_emoji'>;
}

// ─── Coupe (knockout) ──────────────────────────────────────────────────────────

export type CupSize = 4 | 8 | 16;
export type CupStatus = 'registration' | 'active' | 'finished';
export type CupMatchStatus = 'pending' | 'scheduled' | 'played' | 'walkover';

export interface Cup {
  id: string;
  name: string;
  organizer_id: string;
  max_teams: CupSize;
  status: CupStatus;
  join_code: string;
  description?: string | null;
  created_at: string;
  organizer?: { pseudo: string };
  team_count?: number;
}

export interface CupTeam {
  id: string;
  cup_id: string;
  name: string;
  seed?: number | null;
  captain_id?: string | null;
  created_at: string;
  captain?: { pseudo: string };
}

export interface CupMatch {
  id: string;
  cup_id: string;
  round: number;        // 1=finale, 2=demi, 3=quart, 4=huitième
  match_number: number; // position dans le round (1-based)
  home_team_id?: string | null;
  away_team_id?: string | null;
  winner_id?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  scheduled_at?: string | null;
  status: CupMatchStatus;
  home_team?: Pick<CupTeam, 'id' | 'name'>;
  away_team?: Pick<CupTeam, 'id' | 'name'>;
  winner?: Pick<CupTeam, 'id' | 'name'>;
}

// ─── Classement hebdomadaire ───────────────────────────────────────────────────

export interface WeeklyRankEntry {
  id: string;
  week_start: string;
  team_id: string;
  rank: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  team?: Pick<Team, 'id' | 'name' | 'badge_emoji' | 'captain_id'> & {
    captain?: { pseudo: string };
  };
}

// ─── Formulaires ──────────────────────────────────────────────────────────────

export interface MatchForm {
  title: string;
  type: MatchType;
  venueId: string;
  date: string;
  time: string;
  maxPlayers: string;
  description: string;
  isPrivate: boolean;
}

export interface VenueForm {
  name: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  types: MatchType[];
  description: string;
}

// ─── Stats joueur ─────────────────────────────────────────────────────────────

export interface PlayerCardStats {
  matchesPlayed: number;
  matchesOrganized: number;
  avgRating: number | null;
  ratingsGiven: number;
  noShows: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type AppScreen =
  | 'login'
  | 'register'
  | 'home'
  | 'create'
  | 'detail'
  | 'profile'
  | 'chat'
  | 'map'
  | 'players'
  | 'venues'
  | 'propose_venue'
  | 'reputation'
  | 'card'
  | 'card_gallery'
  | 'legal'
  | 'championship'
  | 'championship_detail'
  | 'player_profile'
  | 'community_chat'
  | 'competitions'
  | 'team_detail'
  | 'cup_detail';

// ─── Photo ────────────────────────────────────────────────────────────────────

export interface PhotoAsset {
  uri: string;
  base64: string | null;
}

// ─── Géolocalisation ──────────────────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// ─── Stats live ───────────────────────────────────────────────────────────────

export interface LiveStats {
  players: number;
  matchesTonight: number;
}
