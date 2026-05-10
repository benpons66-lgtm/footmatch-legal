import { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, RefreshControl, Switch, Share, FlatList, KeyboardAvoidingView, Platform, StatusBar, Image, Dimensions, ActivityIndicator, Modal, Animated } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, MATCH_TYPES } from './constants/theme';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import ReputationBadge from './components/ReputationBadge';
import ReputationScreen from './screens/ReputationScreen';
import CardGalleryScreen from './screens/CardGalleryScreen';
import SplashScreen from './screens/SplashScreen';
import LegalScreen from './screens/LegalScreen';
import RadarView from './components/RadarView';
import LevelUpModal from './components/LevelUpModal';
import ChampionshipScreen from './screens/ChampionshipScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import GuestModal from './components/GuestModal';
import ChampionshipDetailScreen from './screens/ChampionshipDetailScreen';
import CompetitionsScreen from './screens/CompetitionsScreen';
import CommunityScreen from './screens/CommunityScreen';
import TeamDetailScreen from './screens/TeamDetailScreen';
import CupDetailScreen from './screens/CupDetailScreen';
import type { Team, Cup } from './types';
import AvatarPicker, { MANGA_AVATARS } from './components/AvatarPicker';
import PlayerCard from './components/PlayerCard';
import PlayersScreen from './screens/PlayersScreen';
import PlayerProfileScreen from './screens/PlayerProfileScreen';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchComputedStatsForUsers, getDisplayReputationScore, isLaunchCommunityProfile, isSeededProfileId } from './lib/playerStats';
import { getLevelFromScore } from './components/ReputationBadge';

const { width } = Dimensions.get('window');
const BLOCKED_USERS_STORAGE_KEY = 'footmatch-blocked-users';
const SUPPORT_EMAIL = 'support@footmatch.fr';
const MODERATION_HINT = 'FootMatch applique une politique de tolérance zéro contre le harcèlement, la haine, le spam et les contenus sexuels non sollicités.';
const FORBIDDEN_TERMS = [
  /connard|connasse|fdp|encule|pute|salope/i,
  /nazi|sale\s+noir|sale\s+blanc|sale\s+arabe/i,
  /viol|menace|je\s+vais\s+te\s+tuer/i,
];

// ─── Skill system ─────────────────────────────────────────────────────────────
export const SKILLS = [
  { key: 'vitesse',   label: 'Vitesse',   emoji: '⚡' },
  { key: 'dribbles',  label: 'Dribbles',  emoji: '🎯' },
  { key: 'physique',  label: 'Physique',  emoji: '💪' },
  { key: '2pieds',    label: '2 Pieds',   emoji: '🦶' },
  { key: 'technique', label: 'Technique', emoji: '🎨' },
  { key: 'tete',      label: 'Tête',      emoji: '⬆️' },
  { key: 'gardien',   label: 'Gardien',   emoji: '🧤' },
  { key: 'vision',    label: 'Vision',    emoji: '👁️' },
];

// Niveau calculé automatiquement depuis le score de réputation
export { LEVEL_THRESHOLDS, getLevelFromScore, getLevelProgress, getLevelConfig, getLevelColor } from './components/ReputationBadge';
import { getLevelFromScore as _getLevel, getLevelProgress, getLevelConfig, LEVEL_THRESHOLDS } from './components/ReputationBadge';
export function getAutoLevel(score: number): string {
  return _getLevel(score);
}

const DARK_MAP_STYLE = [
  { elementType:'geometry',           stylers:[{color:'#0d1117'}] },
  { elementType:'labels.text.fill',   stylers:[{color:'#6e7681'}] },
  { elementType:'labels.text.stroke', stylers:[{color:'#0d1117'}] },
  { featureType:'road',               elementType:'geometry',       stylers:[{color:'#1c2128'}] },
  { featureType:'road.arterial',      elementType:'geometry',       stylers:[{color:'#21262d'}] },
  { featureType:'road.highway',       elementType:'geometry',       stylers:[{color:'#2d333b'}] },
  { featureType:'road.highway',       elementType:'geometry.stroke',stylers:[{color:'#161b22'}] },
  { featureType:'water',              elementType:'geometry',       stylers:[{color:'#060d14'}] },
  { featureType:'poi.park',           elementType:'geometry',       stylers:[{color:'#0d1f0d'}] },
  { featureType:'poi',                elementType:'labels',         stylers:[{visibility:'off'}] },
  { featureType:'transit',            stylers:[{visibility:'off'}] },
  { featureType:'administrative',     elementType:'geometry.stroke',stylers:[{color:'#30363d'}] },
];

// ─── Barre navigation bas ─────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
function BottomNav({ active, onNavigate, toRateCount, onCreateMatch }: {
  active: string;
  onNavigate: (s: any) => void;
  toRateCount: number;
  onCreateMatch: () => void;
}) {
  const leftTabs: { key: string; icon: IoniconName; iconActive: IoniconName; label: string }[] = [
    { key:'home',    icon:'football-outline', iconActive:'football', label:'Matchs'  },
    { key:'players', icon:'people-outline',   iconActive:'people',   label:'Joueurs' },
  ];
  const rightTabs: { key: string; icon: IoniconName; iconActive: IoniconName; label: string }[] = [
    { key:'community', icon:'chatbubbles-outline', iconActive:'chatbubbles', label:'Communauté' },
    { key:'profile',   icon:'person-outline',      iconActive:'person',      label:'Profil'     },
  ];
  return (
    <View style={nav.bar}>
      {leftTabs.map(t => {
        const isActive = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={nav.tab} onPress={() => onNavigate(t.key)} activeOpacity={0.7}
            accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: isActive }}>
            <View style={[nav.iconWrap, isActive && nav.iconWrapActive]}>
              <Ionicons name={isActive ? t.iconActive : t.icon} size={21} color={isActive ? '#00FF66' : 'rgba(255,255,255,0.3)'} />
            </View>
            <Text style={[nav.label, isActive && nav.labelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}

      {/* ── Centre ⚽ ── */}
      <TouchableOpacity style={nav.centerTab} onPress={onCreateMatch} activeOpacity={0.8}
        accessibilityRole="button" accessibilityLabel="Créer un match">
        <View style={nav.centerBtn}>
          <Text style={nav.centerEmoji}>⚽</Text>
        </View>
        <Text style={nav.centerLabel}>Créer</Text>
      </TouchableOpacity>

      {rightTabs.map(t => {
        const isActive = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={nav.tab} onPress={() => onNavigate(t.key)} activeOpacity={0.7}
            accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: isActive }}>
            <View style={[nav.iconWrap, isActive && nav.iconWrapActive]}>
              <Ionicons name={isActive ? t.iconActive : t.icon} size={21} color={isActive ? '#00FF66' : 'rgba(255,255,255,0.3)'} />
              {t.key === 'profile' && toRateCount > 0 && (
                <View style={nav.badge}><Text style={nav.badgeText}>{toRateCount}</Text></View>
              )}
            </View>
            <Text style={[nav.label, isActive && nav.labelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const nav = StyleSheet.create({
  bar:         { flexDirection:'row', alignItems:'flex-end', backgroundColor:'#060B06', borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.07)', paddingBottom:Platform.OS==='ios'?26:12, paddingTop:8, paddingHorizontal:4 },
  tab:         { flex:1, alignItems:'center', gap:2, paddingBottom:2 },
  iconWrap:    { width:44, height:34, borderRadius:17, alignItems:'center', justifyContent:'center' },
  iconWrapActive: { backgroundColor:'rgba(0,255,102,0.10)' },
  label:       { fontSize:9, fontWeight:'600', color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:0.4 },
  labelActive: { color:'#00FF66' },
  badge:       { position:'absolute', top:-2, right:-2, width:14, height:14, borderRadius:7, backgroundColor:'#00A854', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#060B06' },
  badgeText:   { color:'#fff', fontSize:7, fontWeight:'900' },
  // Center create button
  centerTab:   { flex:1, alignItems:'center', gap:2, marginTop:-18 },
  centerBtn:   { width:56, height:56, borderRadius:28, backgroundColor:'#00E676', alignItems:'center', justifyContent:'center', shadowColor:'#00E676', shadowRadius:12, shadowOpacity:0.55, elevation:10, borderWidth:3, borderColor:'#060B06' },
  centerEmoji: { fontSize:26, lineHeight:30 },
  centerLabel: { fontSize:9, fontWeight:'700', color:'#00FF66', textTransform:'uppercase', letterSpacing:0.4, marginTop:2 },
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { currentUser, setCurrentUser, matches, setMatches } = useStore();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [screen, setScreen] = useState<'login'|'register'|'home'|'create'|'detail'|'profile'|'chat'|'map'|'players'|'venues'|'propose_venue'|'reputation'|'card'|'legal'|'championship'|'championship_detail'|'player_profile'|'community_chat'|'community'|'competitions'|'team_detail'|'cup_detail'>(currentUser ? 'home' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [registerCity, setRegisterCity] = useState('');
  const [registerPostalCode, setRegisterPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchPlayers, setMatchPlayers] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<string[]>([]);
  const [myCreatedMatches, setMyCreatedMatches] = useState<any[]>([]);
  const [myRatings, setMyRatings] = useState<Record<string,number>>({});
  const [ratingLoading, setRatingLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude:number,longitude:number}|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string,boolean>>({});
  const [venuePhoto, setVenuePhoto] = useState<{uri:string,base64:string|null}|null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [venueForm, setVenueForm] = useState({ name:'', address:'', city:'Canet-en-Roussillon', latitude:'', longitude:'', types:[] as string[], description:'' });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('tsubasa');
  const [userPhoto, setUserPhoto] = useState<string|null>(null);
  const [profileStats, setProfileStats] = useState({ matchesPlayed:0, matchesOrganized:0, avgRating:null as number|null, ratingsGiven:0, noShows:0 });
  const [personalStatsDraft, setPersonalStatsDraft] = useState({ goals: '0', assists: '0' });
  const flatListRef = useRef<FlatList>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [radarMode, setRadarMode] = useState(false);
  const [selectedMapMatch, setSelectedMapMatch] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpRank, setLevelUpRank] = useState('');
  const prevRankRef = useRef<string | null>(null);
  const [selectedChampionship, setSelectedChampionship] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedCup, setSelectedCup] = useState<Cup | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [userSkill, setUserSkill] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [liveStats, setLiveStats] = useState({ players: 0, matchesTonight: 0 });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [communityMessages, setCommunityMessages] = useState<any[]>([]);
  const [communityMessage, setCommunityMessage] = useState('');
  const [sendingCommunityMsg, setSendingCommunityMsg] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitedPlayerId, setInvitedPlayerId] = useState<string | null>(null);

  function formatFrenchDate(date: Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  }

  function parseFrenchDateToDate(dateText: string, timeText: string) {
    const dateMatch = dateText.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const timeMatch = timeText.trim().match(/^(\d{2}):(\d{2})$/);
    if (!dateMatch || !timeMatch) return null;
    const [, day, month, year] = dateMatch;
    const [, hour, minute] = timeMatch;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  }

  async function hydrateMatchesWithActualPlayers(rawMatches: any[]) {
    const matchIds = rawMatches.map((match: any) => match.id).filter(Boolean);
    if (matchIds.length === 0) return rawMatches;

    const { data } = await supabase
      .from('match_players')
      .select('match_id')
      .in('match_id', matchIds)
      .eq('status', 'confirmed');

    const counts = new Map<string, number>();
    (data ?? []).forEach((row: any) => {
      const key = String(row.match_id ?? '');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return rawMatches.map((match: any) => ({
      ...match,
      current_players: counts.get(String(match.id)) ?? Math.max(0, Number(match.current_players ?? 0)),
    }));
  }

  function requireAuth(action: () => void) {
    if (guestMode) { setShowGuestModal(true); }
    else { action(); }
  }

  function isLaunchCommunityMatch(match: any) {
    if (!match) return false;
    return (
      String(match.id ?? '').startsWith('fb') ||
      isSeededProfileId(match.organizer_id) ||
      match.organizer_id === currentUser?.id ||
      myMatches.includes(match.id)
    );
  }

  async function enrichMatchPlayers(rawPlayers: any[]) {
    const userIds = rawPlayers.map((player: any) => player.user?.id).filter(Boolean);
    const statsByUser = await fetchComputedStatsForUsers(userIds);
    return rawPlayers
      .map((player: any) => {
        const user = player.user;
        if (!user?.id) return player;
        const stats = statsByUser[user.id];
        const displayScore = getDisplayReputationScore(user.id, user.reputation_score, stats);
        return {
          ...player,
          user: {
            ...user,
            display_score: displayScore,
            display_level: getLevelFromScore(displayScore),
            display_matches_played: stats?.matchesPlayed ?? 0,
          },
        };
      })
      .filter((player: any) => !player.user?.id || isLaunchCommunityProfile(player.user.id, statsByUser[player.user.id]) || player.user.id === currentUser?.id);
  }

  async function sendCommunityMessage() {
    const content = communityMessage.trim();
    if (!content || !currentUser) return;
    if (!ensureCleanContent(content, 'ce message')) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      user: { id: currentUser.id, pseudo: currentUser.pseudo },
    };

    setSendingCommunityMsg(true);
    setCommunityMessage('');
    setCommunityMessages((prev) => [...prev, optimisticMessage]);
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));

    try {
      const { data, error } = await supabase
        .from('community_messages')
        .insert({ user_id: currentUser.id, content })
        .select('*, user:profiles(id,pseudo)')
        .single();
      if (error) throw error;
      setCommunityMessages((prev) => [...prev.filter((item: any) => item.id !== tempId), data]);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    } catch (e: any) {
      setCommunityMessages((prev) => prev.filter((item: any) => item.id !== tempId));
      setCommunityMessage(content);
      Alert.alert('Erreur', e.message);
    } finally {
      setSendingCommunityMsg(false);
    }
  }

  function enterGuestMode() {
    setGuestMode(true);
    setShowOnboarding(false);
    setScreen('home');
  }

  function exitGuestMode() {
    setGuestMode(false);
    setShowGuestModal(false);
    setScreen('register');
  }

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    startPulse();
    loadBlockedUsers();
    // Délai de 2s pour laisser Supabase restaurer la session depuis le storage
    // avant de vérifier — évite un faux logout au démarrage.
    setTimeout(ensureValidSession, 2000);
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  // Détecte un mismatch entre store local (currentUser) et session Supabase :
  // si l'utilisateur a un currentUser persisté mais pas de session auth active,
  // tous les appels RLS échoueront silencieusement → on force le logout propre.
  async function ensureValidSession() {
    if (!currentUser) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      await supabase.auth.signOut().catch(() => {});
      setCurrentUser(null);
      setScreen('login');
      Alert.alert('Session expirée', 'Reconnecte-toi pour continuer.');
    }
  }

  async function loadBlockedUsers() {
    try {
      const raw = await AsyncStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
      if (raw) setBlockedUserIds(JSON.parse(raw));
    } catch {}
  }

  async function persistBlockedUsers(nextBlockedUsers: string[]) {
    setBlockedUserIds(nextBlockedUsers);
    try {
      await AsyncStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(nextBlockedUsers));
    } catch {}
  }

  function moderateText(content: string): boolean {
    const normalized = content.trim();
    if (!normalized) return false;
    return !FORBIDDEN_TERMS.some((rule) => rule.test(normalized));
  }

  function ensureCleanContent(content: string, context = 'ce contenu'): boolean {
    if (moderateText(content)) return true;
    Alert.alert(
      'Contenu refuse',
      `On ne peut pas publier ${context} car il semble contenir des propos interdits. ${MODERATION_HINT}`
    );
    return false;
  }

  async function ensureNotificationPermission(promptIfNeeded = false): Promise<boolean> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted) return true;
      if (!promptIfNeeded) return false;
      const requested = await Notifications.requestPermissionsAsync();
      return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    } catch {
      return false;
    }
  }

  async function ensureLocationPermission(promptIfNeeded = false): Promise<boolean> {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      let status = current.status;
      if (status !== 'granted' && promptIfNeeded) {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted') {
        setLocationDenied(true);
        return false;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLocationDenied(false);
      return true;
    } catch {
      return false;
    }
  }

  async function scheduleMatchReminder(matchTitle: string, matchDate: Date, matchId: string, promptIfNeeded = false) {
    try {
      const canNotify = await ensureNotificationPermission(promptIfNeeded);
      if (!canNotify) return;
      const oneHourBefore = new Date(matchDate.getTime() - 60 * 60 * 1000);
      const oneDayBefore  = new Date(matchDate.getTime() - 24 * 60 * 60 * 1000);
      if (oneHourBefore > new Date()) {
        await Notifications.scheduleNotificationAsync({
          identifier: `match-1h-${matchId}`,
          content: { title: 'Match dans 1 heure', body: `Ton match "${matchTitle}" commence dans 1h. Prepare-toi.`, sound: true },
          trigger: { seconds: Math.floor((oneHourBefore.getTime() - Date.now()) / 1000), type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
      }
      if (oneDayBefore > new Date()) {
        await Notifications.scheduleNotificationAsync({
          identifier: `match-1d-${matchId}`,
          content: { title: 'Match demain', body: `N'oublie pas ton match "${matchTitle}" demain.`, sound: true },
          trigger: { seconds: Math.floor((oneDayBefore.getTime() - Date.now()) / 1000), type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
      }
    } catch {}
  }

  async function cancelMatchReminder(matchId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`match-1h-${matchId}`);
      await Notifications.cancelScheduledNotificationAsync(`match-1d-${matchId}`);
    } catch {}
  }

  async function loadAvatar() {
    if (!currentUser || avatarLoaded) return;
    let { data } = await supabase
      .from('profiles')
      .select('avatar_id, avatar_photo_url, skill, goals, assists')
      .eq('id', currentUser.id)
      .single();
    if (!data) {
      const fallback = await supabase.from('profiles').select('avatar_id, avatar_photo_url, skill').eq('id', currentUser.id).single();
      data = fallback.data as any;
    }
    if (data) {
      if (data.avatar_photo_url) setUserPhoto(data.avatar_photo_url);
      else if (data.avatar_id) setUserAvatar(data.avatar_id);
      if (data.skill) setUserSkill(data.skill);
      setPersonalStatsDraft({
        goals: String(data.goals ?? 0),
        assists: String(data.assists ?? 0),
      });
    }
    setAvatarLoaded(true);
  }

  async function savePersonalStats() {
    if (!currentUser) return;
    try {
      const goals = Math.max(0, parseInt(personalStatsDraft.goals || '0', 10) || 0);
      const assists = Math.max(0, parseInt(personalStatsDraft.assists || '0', 10) || 0);
      const { error } = await supabase.from('profiles').update({ goals, assists }).eq('id', currentUser.id);
      if (error) throw error;
      setPersonalStatsDraft({ goals: String(goals), assists: String(assists) });
      Alert.alert('Stats mises a jour', 'Tes buts et passes decisives ont ete enregistres.');
    } catch (e: any) {
      Alert.alert('Configuration requise', "La base doit d'abord recevoir le script `community_profile_and_venues.sql` pour stocker ces stats.");
    }
  }

  const searchRef = useRef<TextInput>(null);
  const [form, setForm] = useState({ title:'', type:'five' as 'five'|'city'|'eleven', venueId:'', date:'', time:'', maxPlayers:'10', price:'', description:'', isPrivate:false });

  // ── Effects (déclarés AVANT tout early return — règle des hooks React) ──────

  useEffect(() => {
    if (screen === 'home' || screen === 'profile' || screen === 'map') { loadMatches(); loadVenues(); loadLiveStats(); if (!guestMode) { loadMyMatches(); loadAvatar(); } }
    if (screen === 'create') { loadVenues(); loadProposals(); }
    if (screen === 'venues') { loadVenues(); loadProposals(); }
    if (screen === 'create' && form.title === '') setForm(f => ({...f, title: `${MATCH_TYPES[f.type].label} du ${new Date().toLocaleDateString('fr-FR', {weekday:'long'})}`}));
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Détection de level up
  useEffect(() => {
    const rank = currentUser?.reputation_rank;
    if (!rank) { prevRankRef.current = null; return; }
    if (prevRankRef.current !== null && prevRankRef.current !== rank && rank !== 'D4') {
      setLevelUpRank(rank);
      setShowLevelUp(true);
    }
    prevRankRef.current = rank;
  }, [currentUser?.reputation_rank]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (screen !== 'community_chat' || !currentUser) return;
    const loadCommunityMessages = async () => {
      const { data } = await supabase.from('community_messages').select('*, user:profiles(id,pseudo)').order('created_at', { ascending: true }).limit(100);
      if (data) {
        setCommunityMessages(
          data.filter((message: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const authorId = String(message.user_id ?? '');
            return !blockedUserIds.includes(message.user_id) && (isSeededProfileId(authorId) || authorId === currentUser.id);
          })
        );
        setTimeout(()=>flatListRef.current?.scrollToEnd({animated:false}),100);
      }
    };
    loadCommunityMessages();
    const sub = supabase.channel('community-chat')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'community_messages' }, ()=>loadCommunityMessages())
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [blockedUserIds, screen, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (screen !== 'chat' || !selectedMatch) return;
    loadMessages();
    const sub = supabase.channel(`chat-${selectedMatch.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'chat_messages', filter:`match_id=eq.${selectedMatch.id}` }, () => loadMessages())
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [screen, selectedMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Variables dérivées et early return ──────────────────────────────────────

  const NAV_SCREENS = ['home','map','venues','profile'];
  const showNav = NAV_SCREENS.includes(screen);

  if (!isConnected) {
    return (
      <View style={{ flex:1, backgroundColor:'#000', alignItems:'center', justifyContent:'center', gap:16, padding:40 }}>
        <Text style={{ fontSize:52 }}>📡</Text>
        <Text style={{ fontSize:20, fontWeight:'900', color:'#fff', textTransform:'uppercase', textAlign:'center' }}>Pas de connexion</Text>
        <Text style={{ fontSize:14, color:'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:22 }}>Vérifie ta connexion internet et réessaie.</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Réessayer la connexion"
          style={{ backgroundColor:'#00FF66', borderRadius:30, paddingVertical:14, paddingHorizontal:32, marginTop:8 }}
          onPress={() => NetInfo.fetch().then(state => setIsConnected(state.isConnected ?? true))}>
          <Text style={{ color:'#000', fontWeight:'900', fontSize:15, textTransform:'uppercase' }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const toRateCount = matches.filter((m:any) => myMatches.includes(m.id) && new Date(m.scheduled_at) < new Date() && !myRatings[m.id]).length; // eslint-disable-line @typescript-eslint/no-explicit-any

  async function loadMessages() {
    if (!selectedMatch) return;
    const { data } = await supabase.from('chat_messages').select('*, user:profiles(id,pseudo)').eq('match_id', selectedMatch.id).order('created_at', { ascending: true });
    if (data) setMessages(data.filter((message: any) => !blockedUserIds.includes(message.user_id)));
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }

  async function sendMessage() {
    const content = newMessage.trim();
    if (!content || !currentUser || !selectedMatch) return;
    if (!ensureCleanContent(content, 'ce message')) return;
    const tempId = `match-temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      match_id: selectedMatch.id,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      user: { id: currentUser.id, pseudo: currentUser.pseudo },
    };
    setSendingMsg(true);
    setNewMessage('');
    setMessages((prev) => [...prev, optimisticMessage]);
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ match_id: selectedMatch.id, user_id: currentUser.id, content })
        .select('*, user:profiles(id,pseudo)')
        .single();
      if (error) throw error;
      setMessages((prev) => [...prev.filter((item: any) => item.id !== tempId), data]);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    } catch (e:any) {
      setMessages((prev) => prev.filter((item: any) => item.id !== tempId));
      Alert.alert('Erreur', e.message);
      setNewMessage(content);
    }
    finally { setSendingMsg(false); }
  }

  async function loadMyMatches() {
    if (!currentUser) return;
    const { data } = await supabase.from('match_players').select('match_id').eq('user_id', currentUser.id).eq('status','confirmed');
    if (data) setMyMatches(data.map((d:any) => d.match_id));
    // Planifier rappels pour matchs futurs déjà rejoints
    if (data && data.length > 0) {
      const { data: upcomingJoined } = await supabase
        .from('matches')
        .select('id, title, scheduled_at')
        .in('id', data.map((d: any) => d.match_id))
        .gt('scheduled_at', new Date().toISOString());
      if (upcomingJoined) {
        for (const m of upcomingJoined) {
          scheduleMatchReminder(m.title, new Date(m.scheduled_at), m.id, false);
        }
      }
    }
    const { data: created } = await supabase.from('matches').select('*, venue:venues(name)').eq('organizer_id', currentUser.id).order('scheduled_at', { ascending: false });
    if (created) setMyCreatedMatches(created);
    const { data: ratings } = await supabase.from('match_ratings').select('match_id, rating').eq('user_id', currentUser.id);
    if (ratings) {
      const r: Record<string,number> = {};
      ratings.forEach((x:any) => { r[x.match_id] = x.rating; });
      setMyRatings(r);
    }
  }

  async function loadLiveStats() {
    try {
      const now = new Date().toISOString();
      const [profilesRes, matchesRes, matchPlayersRes] = await Promise.all([
        supabase.from('profiles').select('id').limit(2500),
        supabase.from('matches').select('id, organizer_id, status, scheduled_at').eq('status','open').gte('scheduled_at', now).limit(500),
        supabase.from('match_players').select('user_id, status').eq('status', 'confirmed').limit(10000),
      ]);
      const seededPlayers = (profilesRes.data ?? []).filter((profile: any) => isSeededProfileId(profile.id));
      const fallbackPlayerIds = new Set<string>();
      (matchPlayersRes.data ?? []).forEach((row: any) => {
        if (isSeededProfileId(row.user_id)) fallbackPlayerIds.add(String(row.user_id));
      });
      (matchesRes.data ?? []).forEach((match: any) => {
        if (isSeededProfileId(match.organizer_id)) fallbackPlayerIds.add(String(match.organizer_id));
      });
      const launchMatches = (matchesRes.data ?? []).filter((match: any) => isLaunchCommunityMatch(match));
      setLiveStats({
        players: seededPlayers.length > 0 ? seededPlayers.length : fallbackPlayerIds.size,
        matchesTonight: launchMatches.length,
      });
    } catch {}
  }

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }

  async function loadVenues() {
    const { data } = await supabase.from('venues').select('*').order('name');
    if (data) setVenues(data);
    // Enrichir avec OpenStreetMap si localisation disponible
    if (userLocation) enrichVenuesFromOSM(userLocation.latitude, userLocation.longitude, data ?? []);
  }

  async function enrichVenuesFromOSM(lat: number, lon: number, existing: any[]) {
    try {
      const R = 0.15; // ~15km de rayon
      const bbox = `${lat-R},${lon-R},${lat+R},${lon+R}`;
      const q = `[out:json][timeout:20];(node["name"~"[Ff]ive|[Ff]oot.?5|[Uu]rban.?[Ss]occer|[Cc]ité.?[Ff]oot"](${bbox});way["name"~"[Ff]ive|[Ff]oot.?5|[Uu]rban.?[Ss]occer"](${bbox}););out center;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(q)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!res.ok) return;
      const json = await res.json();
      const existingNames = new Set(existing.map((v: any) => v.name.toLowerCase()));
      const newVenues = json.elements
        .filter((el: any) => el.tags?.name && !existingNames.has(el.tags.name.toLowerCase()))
        .map((el: any) => ({
          id: `osm_${el.id}`,
          name: el.tags.name,
          address: el.tags['addr:street'] ? `${el.tags['addr:housenumber']||''} ${el.tags['addr:street']}`.trim() : 'Voir sur la carte',
          city: el.tags['addr:city'] || el.tags['addr:town'] || '',
          latitude: el.lat ?? el.center?.lat,
          longitude: el.lon ?? el.center?.lon,
          types: ['five','city'],
          source: 'osm',
        }))
        .filter((v: any) => v.latitude && v.longitude);
      if (newVenues.length > 0) setVenues(prev => [...prev, ...newVenues]);
    } catch {}
  }

  async function loadMatches(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await supabase.from('matches').select('*, venue:venues(*)').neq('status','cancelled').order('scheduled_at', { ascending: true });
      const hydratedMatches = await hydrateMatchesWithActualPlayers(data ?? []);
      const launchMatches = hydratedMatches.filter((match: any) => isLaunchCommunityMatch(match));
      setMatches(launchMatches);
      setLiveStats((prev) => ({ ...prev, matchesTonight: launchMatches.filter((match: any) => match.status === 'open' && new Date(match.scheduled_at) >= new Date()).length }));
      setMatchesLoaded(true);
    } finally { setRefreshing(false); }
  }

  async function loadMatchDetail(match: any) {
    const [hydratedMatch] = await hydrateMatchesWithActualPlayers([match]);
    setSelectedMatch(hydratedMatch ?? match); setScreen('detail');
    const { data } = await supabase.from('match_players').select('*, user:profiles(id,pseudo,level,reputation_score,reputation_rank)').eq('match_id', match.id).eq('status','confirmed');
    if (data) {
      const enrichedPlayers = await enrichMatchPlayers(data);
      setMatchPlayers(enrichedPlayers);
      setSelectedMatch((prev: any) => prev ? { ...prev, current_players: enrichedPlayers.length } : prev);
    }
  }

  async function loadProposals() {
    const { data } = await supabase.from('venue_proposals').select('*, proposer:profiles(pseudo)').order('created_at', { ascending: false });
    if (data) setProposals(data);
    if (currentUser) {
      const { data: votes } = await supabase.from('venue_votes').select('proposal_id, vote').eq('user_id', currentUser.id);
      if (votes) {
        const v: Record<string,boolean> = {};
        votes.forEach((x:any) => { v[x.proposal_id] = x.vote; });
        setMyVotes(v);
      }
    }
  }

  async function pickPhoto() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect:[16,9], quality:0.7, base64:true });
      if (!result.canceled && result.assets[0]) setVenuePhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 ?? null });
    } catch (e:any) { Alert.alert('Erreur', e.message); }
  }

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect:[16,9], quality:0.7, base64:true });
      if (!result.canceled && result.assets[0]) setVenuePhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 ?? null });
    } catch (e:any) { Alert.alert('Erreur', e.message); }
  }

  async function uploadPhoto(): Promise<string|null> {
    if (!venuePhoto?.base64) return null;
    setUploadingPhoto(true);
    try {
      const fileName = `venue-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('venue-photos').upload(fileName, decode(venuePhoto.base64), { contentType:'image/jpeg', upsert:true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('venue-photos').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e:any) { Alert.alert('Erreur upload', e.message); return null; }
    finally { setUploadingPhoto(false); }
  }

  function decode(base64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
    const len = base64.length;
    let bufferLength = Math.ceil(len * 3 / 4);
    if (base64[len-1]==='=') bufferLength--;
    if (base64[len-2]==='=') bufferLength--;
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < len; i += 4) {
      const a=lookup[base64.charCodeAt(i)], b=lookup[base64.charCodeAt(i+1)];
      const c=lookup[base64.charCodeAt(i+2)], d=lookup[base64.charCodeAt(i+3)];
      bytes[p++]=(a<<2)|(b>>4);
      if (p<bufferLength) bytes[p++]=((b&15)<<4)|(c>>2);
      if (p<bufferLength) bytes[p++]=((c&3)<<6)|d;
    }
    return bytes;
  }

  async function handleVote(proposalId: string, vote: boolean) {
    if (!currentUser) { Alert.alert('Connecte-toi pour voter'); return; }
    const alreadyVoted = myVotes[proposalId];
    try {
      if (alreadyVoted !== undefined) {
        await supabase.from('venue_votes').delete().eq('proposal_id', proposalId).eq('user_id', currentUser.id);
        if (alreadyVoted === vote) { setMyVotes(prev => { const n={...prev}; delete n[proposalId]; return n; }); loadProposals(); return; }
      }
      await supabase.from('venue_votes').insert({ proposal_id: proposalId, user_id: currentUser.id, vote });
      setMyVotes(prev => ({ ...prev, [proposalId]: vote }));
      loadProposals();
    } catch (e:any) { Alert.alert('Erreur', e.message); }
  }

  async function handleProposeVenue() {
    if (!venueForm.name.trim() || !venueForm.address.trim() || !venueForm.city.trim()) { Alert.alert('Erreur','Remplis le nom, l\'adresse et la ville'); return; }
    if (venueForm.types.length === 0) { Alert.alert('Erreur','Choisis au moins un type de terrain'); return; }
    if (!ensureCleanContent(venueForm.name, 'ce nom de terrain')) return;
    if (venueForm.description.trim() && !ensureCleanContent(venueForm.description, 'cette description')) return;
    setLoading(true);
    try {
      let photoUrl: string|null = null;
      if (venuePhoto) photoUrl = await uploadPhoto();
      const { error } = await supabase.from('venue_proposals').insert({
        name:venueForm.name.trim(), address:venueForm.address.trim(), city:venueForm.city.trim(),
        latitude:venueForm.latitude?parseFloat(venueForm.latitude):null,
        longitude:venueForm.longitude?parseFloat(venueForm.longitude):null,
        types:venueForm.types, description:venueForm.description,
        photo_url:photoUrl, proposed_by:currentUser!.id,
      });
      if (error) throw error;
      Alert.alert('🎉 Terrain proposé !','La communauté va voter !');
      setVenueForm({ name:'', address:'', city:'Canet-en-Roussillon', latitude:'', longitude:'', types:[], description:'' });
      setVenuePhoto(null); setScreen('venues');
    } catch (e:any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  function calcDistance(lat1:number, lon1:number, lat2:number, lon2:number): number {
    const R=6371, dLat=((lat2-lat1)*Math.PI)/180, dLon=((lon2-lon1)*Math.PI)/180;
    const a=Math.sin(dLat/2)**2+Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLon/2)**2;
    return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))*10)/10;
  }

  async function handleLogin() {
    if (!email||!password) { Alert.alert('Erreur','Remplis tous les champs'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Alert.alert('Erreur','Adresse email invalide'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: sessionData } = await supabase.auth.getSession();
      if (__DEV__) console.log('[AUTH] session après login:', sessionData?.session?.user?.id ?? 'NULL');
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setCurrentUser({ id:data.user.id, email:data.user.email!, pseudo:p?.pseudo??email.split('@')[0], level:p?.level??'D4', matchesPlayed:0, matchesCreated:0, reputation_score:p?.reputation_score??0, reputation_rank:p?.reputation_rank??'D4' });
      setUserSkill(p?.skill ?? null);
      setScreen('home');
    } catch (e:any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  async function handleRegister() {
    if (!email||!password||!pseudo||!registerCity||!registerPostalCode) { Alert.alert('Erreur','Remplis tous les champs'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Alert.alert('Erreur','Adresse email invalide'); return; }
    if (password.length < 8) { Alert.alert('Erreur','Le mot de passe doit contenir au moins 8 caractères'); return; }
    if (!consentGiven) { Alert.alert('Erreur','Tu dois accepter les CGU et la politique de confidentialité pour créer un compte.'); return; }
    if (!ensureCleanContent(pseudo, 'ce pseudo')) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ pseudo, city: registerCity.trim(), postal_code: registerPostalCode.trim() } } });
      if (error) throw error;
      Alert.alert('Compte créé !','Tu peux maintenant te connecter.');
      setRegisterCity('');
      setRegisterPostalCode('');
      setScreen('login');
    } catch (e:any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  async function handleLogout() {
    await supabase.auth.signOut(); setCurrentUser(null); setScreen('login');
  }

  async function updateSkill(newSkill: string) {
    if (!currentUser) return;
    try {
      await supabase.from('profiles').update({ skill: newSkill }).eq('id', currentUser.id);
      setUserSkill(newSkill);
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données (profil, matchs, messages) seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const id = currentUser!.id;
              await supabase.from('match_players').delete().eq('user_id', id);
              await supabase.from('chat_messages').delete().eq('user_id', id);
              await supabase.from('match_ratings').delete().eq('user_id', id);
              await supabase.from('profiles').delete().eq('id', id);
              await supabase.auth.signOut();
              setCurrentUser(null);
              setScreen('login');
              Alert.alert('Compte supprimé', 'Tes données ont été supprimées. À bientôt !');
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  }

  function handleReportMessage(message: any) {
    if (message.user_id === currentUser?.id) return;
    Alert.alert(
      'Signaler ce message',
      `Signaler le message de ${message.user?.pseudo ?? 'cet utilisateur'} comme inapproprié ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('message_reports').insert({
                message_id: message.id,
                reporter_id: currentUser!.id,
                match_id: selectedMatch?.id,
              });
            } catch {}
            Alert.alert('Signalement envoyé', 'Merci, nous examinerons ce message sous 24h.');
          },
        },
      ]
    );
  }

  async function handleRegisterStoreReady() {
    await handleRegister();
  }

  async function handleDeleteAccountStoreReady() {
    if (!currentUser) return;
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irreversible. Ton compte et tes donnees personnelles vont etre supprimes.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) {
                await supabase.from('account_deletion_requests').upsert({
                  user_id: currentUser.id,
                  email: currentUser.email,
                  reason: 'In-app deletion fallback request',
                }, { onConflict: 'user_id' });
                throw new Error(`La suppression serveur n'est pas encore deployee. La demande a ete enregistree. Contacte aussi ${SUPPORT_EMAIL}.`);
              }
              await supabase.auth.signOut();
              setCurrentUser(null);
              setScreen('login');
              Alert.alert('Compte supprime', 'Ton compte FootMatch a bien ete supprime.');
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  }

  async function blockUserStoreReady(userId: string, pseudo?: string | null) {
    if (!userId || userId === currentUser?.id) return;
    const nextBlockedUsers = Array.from(new Set([...blockedUserIds, userId]));
    await persistBlockedUsers(nextBlockedUsers);
    setMessages((prev) => prev.filter((item: any) => item.user_id !== userId));
    setCommunityMessages((prev) => prev.filter((item: any) => item.user_id !== userId));
    Alert.alert('Utilisateur bloque', `${pseudo ?? 'Cet utilisateur'} ne te sera plus propose dans les discussions de cet appareil.`);
  }

  async function toggleBlockedUserStoreReady(userId: string, pseudo?: string | null) {
    if (!userId || userId === currentUser?.id) return;
    if (blockedUserIds.includes(userId)) {
      const nextBlockedUsers = blockedUserIds.filter((id) => id !== userId);
      await persistBlockedUsers(nextBlockedUsers);
      Alert.alert('Utilisateur debloque', `${pseudo ?? 'Ce joueur'} peut de nouveau apparaitre.`);
      return;
    }
    await blockUserStoreReady(userId, pseudo);
  }

  function handleReportMessageStoreReady(message: any, source: 'match' | 'community' = 'match') {
    if (!currentUser || message.user_id === currentUser.id) return;
    Alert.alert(
      'Signaler ce message',
      `Signaler le message de ${message.user?.pseudo ?? 'cet utilisateur'} comme inapproprie ? ${MODERATION_HINT}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('message_reports').insert({
                message_id: message.id,
                reporter_id: currentUser.id,
                match_id: source === 'match' ? selectedMatch?.id : null,
              });
            } catch {}
            Alert.alert('Signalement envoye', 'Merci, nous examinerons ce message sous 24h.');
          },
        },
      ]
    );
  }

  function handleMessageLongPressStoreReady(message: any, source: 'match' | 'community' = 'match') {
    if (!currentUser || message.user_id === currentUser.id) return;
    const pseudo = message.user?.pseudo ?? 'cet utilisateur';
    Alert.alert(
      'Moderation',
      `Que veux-tu faire avec ${pseudo} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: blockedUserIds.includes(message.user_id) ? 'Debloquer' : 'Bloquer', onPress: () => toggleBlockedUserStoreReady(message.user_id, pseudo) },
        { text: 'Signaler', style: 'destructive', onPress: () => handleReportMessageStoreReady(message, source) },
      ]
    );
  }

  async function handleCreateMatch() {
    if (!form.title.trim()) { Alert.alert('Erreur','Donne un nom au match'); return; }
    if (!form.venueId) { Alert.alert('Erreur','Choisis un terrain'); return; }
    if (!form.date||!form.time) { Alert.alert('Erreur','Choisis une date et heure'); return; }
    if (parseInt(form.maxPlayers) < 2) { Alert.alert('Erreur','Il faut au moins 2 joueurs'); return; }
    if (!ensureCleanContent(form.title, 'ce titre')) return;
    if (form.description.trim() && !ensureCleanContent(form.description, 'cette description')) return;
    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();
    if (isNaN(new Date(scheduledAt).getTime())) { Alert.alert('Erreur','Format de date invalide (JJ/MM/AAAA HH:MM)'); return; }
    if (new Date(scheduledAt) <= new Date()) { Alert.alert('Erreur','La date doit être dans le futur'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('matches').insert({
        title:form.title.trim(), type:form.type, venue_id:form.venueId,
        organizer_id:currentUser!.id, scheduled_at:scheduledAt,
        max_players:parseInt(form.maxPlayers), current_players:1,
        price_per_player:Math.max(0, parseInt(form.price) || 0), level:'Tous niveaux',
        description:form.description, is_private:form.isPrivate, status:'open',
      }).select().single();
      if (error) throw error;
      await supabase.from('match_players').insert({ match_id:data.id, user_id:currentUser!.id, status:'confirmed' });
      scheduleMatchReminder(data.title, new Date(data.scheduled_at), data.id, true);
      setMyMatches(prev => [...prev, data.id]);
      Alert.alert('🎉 Match créé !','Ton match est en ligne !');
      setForm({ title:'', type:'five', venueId:'', date:'', time:'', maxPlayers:'10', price:'', description:'', isPrivate:false });
      setVenueSearch('');
      setScreen('home'); loadMatches();
    } catch (e:any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!currentUser||!selectedMatch) return;
    if (myMatches.includes(selectedMatch.id)) { Alert.alert('Déjà inscrit !'); return; }
    if (selectedMatch.current_players>=selectedMatch.max_players) { Alert.alert('Match complet !'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('match_players').insert({ match_id:selectedMatch.id, user_id:currentUser.id, status:'confirmed' });
      if (error) throw error;
      const newCount = Math.max(matchPlayers.length + 1, selectedMatch.current_players + 1);
      await supabase.from('matches').update({ current_players: newCount }).eq('id', selectedMatch.id);
      setMyMatches(prev => [...prev, selectedMatch.id]);
      setSelectedMatch((prev:any) => ({ ...prev, current_players:newCount }));
      const { data } = await supabase.from('match_players').select('*, user:profiles(id,pseudo,level,reputation_score,reputation_rank)').eq('match_id', selectedMatch.id).eq('status','confirmed');
      if (data) setMatchPlayers(await enrichMatchPlayers(data));
      loadMatches();
      scheduleMatchReminder(selectedMatch.title, new Date(selectedMatch.scheduled_at), selectedMatch.id, true);
      Alert.alert('✅ Inscrit !','Tu es dans le match !');
    } catch (e:any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  }

  async function handleLeave() {
    if (!currentUser||!selectedMatch) return;
    Alert.alert('Quitter le match','Tu veux vraiment quitter ?',[
      { text:'Annuler', style:'cancel' },
      { text:'Quitter', style:'destructive', onPress: async () => {
        try {
          await supabase.from('match_players').delete().eq('match_id', selectedMatch.id).eq('user_id', currentUser.id);
          const newCount = Math.max(0, matchPlayers.length - 1);
          await supabase.from('matches').update({ current_players: newCount }).eq('id', selectedMatch.id);
          cancelMatchReminder(selectedMatch.id);
          setMyMatches(prev => prev.filter(id => id !== selectedMatch.id));
          loadMatches(); setScreen('home');
        } catch (e:any) { Alert.alert('Erreur', e.message); }
      }}
    ]);
  }

  // Lien public pointant vers la page web ou l'app stores. Servira de fallback
  // tant que les universal links ne sont pas configurés.
  const APP_URL = 'https://footmatch.app';
  function shareUrlForMatch(matchId: string)  { return `${APP_URL}/match/${matchId}`; }
  function shareUrlForPlayer(playerId: string){ return `${APP_URL}/joueur/${playerId}`; }

  async function handleShare() {
    if (!selectedMatch) return;
    try {
      const spots = selectedMatch.max_players - selectedMatch.current_players;
      const spotsText = spots === 0 ? '🔴 Complet' : spots === 1 ? '⚡ Dernière place !' : `✅ ${spots} places restantes`;
      const date = new Date(selectedMatch.scheduled_at).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'});
      const link = shareUrlForMatch(selectedMatch.id);
      await Share.share({
        message: `⚽ ${selectedMatch.title}\n📍 ${selectedMatch.venue?.name ?? 'Terrain'}, ${selectedMatch.venue?.city ?? ''}\n📅 ${date}\n👥 ${selectedMatch.current_players}/${selectedMatch.max_players} joueurs · ${spotsText}\n\n👉 ${link}\n🆓 Rejoins-nous gratuitement sur FootMatch !`,
        title: selectedMatch.title,
        url: link,
      });
    } catch {}
  }

  async function handleShareProfile() {
    if (!currentUser) return;
    try {
      const rank = currentUser.reputation_rank ?? 'D4';
      const score = currentUser.reputation_score ?? 0;
      const link = shareUrlForPlayer(currentUser.id);
      await Share.share({
        message: `🏆 ${currentUser.pseudo} sur FootMatch\n⚡ Rang : ${rank} · ${score} pts\n⚽ ${myMatches.length} match${myMatches.length > 1 ? 's' : ''} joué${myMatches.length > 1 ? 's' : ''}\n\n👉 ${link}\n🆓 Rejoins-moi sur FootMatch — trouve un match en 30 secondes !`,
        title: `Profil FootMatch — ${currentUser.pseudo}`,
        url: link,
      });
    } catch {}
  }

  // Invitation d'un joueur à un de TES matchs (organisé ou rejoint), places libres uniquement.
  function openInviteModal(playerId: string) {
    if (!currentUser) return;
    setInvitedPlayerId(playerId);
    setShowInviteModal(true);
  }

  function getInvitableMatches() {
    if (!currentUser) return [] as any[];
    const now = new Date();
    return matches.filter((m: any) => {
      const isMine = m.organizer_id === currentUser.id || myMatches.includes(m.id);
      const hasSpots = (m.current_players ?? 0) < (m.max_players ?? 0);
      const isFuture = new Date(m.scheduled_at) > now;
      const isOpen = m.status !== 'cancelled' && m.status !== 'completed';
      return isMine && hasSpots && isFuture && isOpen;
    });
  }

  async function handleInviteToMatch(match: any) {
    setShowInviteModal(false);
    setInvitedPlayerId(null);
    try {
      const date = new Date(match.scheduled_at).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'});
      const link = shareUrlForMatch(match.id);
      await Share.share({
        message: `⚽ Tu veux jouer avec moi ?\n${match.title}\n📍 ${match.venue?.name ?? 'Terrain'}, ${match.venue?.city ?? ''}\n📅 ${date}\n👥 ${match.current_players}/${match.max_players} joueurs\n\n👉 ${link}\n🆓 Rejoins-nous sur FootMatch !`,
        title: match.title,
        url: link,
      });
    } catch {}
  }

  function renderInviteModal() {
    if (!showInviteModal) return null;
    const invitable = getInvitableMatches();
    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => { setShowInviteModal(false); setInvitedPlayerId(null); }}>
        <View style={s.inviteOverlay}>
          <View style={s.inviteSheet}>
            <View style={s.inviteHeader}>
              <Text style={s.inviteTitle}>Inviter à un match</Text>
              <TouchableOpacity onPress={() => { setShowInviteModal(false); setInvitedPlayerId(null); }} accessibilityLabel="Fermer">
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={s.inviteSub}>Sélectionne un de tes matchs avec des places libres.</Text>
            {invitable.length === 0 ? (
              <View style={s.inviteEmpty}>
                <Ionicons name="football-outline" size={36} color={Colors.textMuted} />
                <Text style={s.inviteEmptyText}>Aucun match dispo. Crée-en un, ou rejoins un match existant pour pouvoir y inviter des joueurs.</Text>
                <TouchableOpacity style={s.inviteCreateBtn} onPress={() => { setShowInviteModal(false); setInvitedPlayerId(null); setScreen('create'); }} accessibilityRole="button">
                  <Text style={s.inviteCreateBtnText}>Créer un match</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 380 }}>
                {invitable.map((m: any) => {
                  const dateStr = new Date(m.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                  const spots = (m.max_players ?? 0) - (m.current_players ?? 0);
                  return (
                    <TouchableOpacity key={m.id} style={s.inviteItem} onPress={() => handleInviteToMatch(m)} accessibilityRole="button" accessibilityLabel={`Inviter à ${m.title}`}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.inviteItemTitle} numberOfLines={1}>{m.title}</Text>
                        <Text style={s.inviteItemMeta}>{dateStr} · {m.venue?.city ?? '—'}</Text>
                      </View>
                      <View style={s.inviteItemSpots}>
                        <Text style={s.inviteItemSpotsText}>{spots} place{spots > 1 ? 's' : ''}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.green} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  async function handleRate(matchId: string, rating: number) {
    if (!currentUser) return;
    setRatingLoading(true);
    try {
      const { error } = await supabase.from('match_ratings').upsert({ match_id:matchId, user_id:currentUser.id, rating }, { onConflict:'match_id,user_id' });
      if (error) throw error;
      setMyRatings(prev => ({ ...prev, [matchId]:rating }));
      Alert.alert('⭐ Merci !','Ta note a été enregistrée !');
    } catch (e:any) { Alert.alert('Erreur', e.message); }
    finally { setRatingLoading(false); }
  }

  const filteredMatches = matches.filter((m:any) => {
    const now = new Date();
    const q = searchQuery.toLowerCase();
    if (q && !m.title?.toLowerCase().includes(q) && !m.venue?.name?.toLowerCase().includes(q) && !m.venue?.city?.toLowerCase().includes(q) && !m.venue?.address?.toLowerCase().includes(q)) return false;
    if (activeFilter==='all') return new Date(m.scheduled_at)>now;
    if (activeFilter==='spots') return m.current_players<m.max_players&&new Date(m.scheduled_at)>now;
    if (activeFilter==='mine') return myMatches.includes(m.id);
    if (activeFilter==='urgent') return m.max_players-m.current_players<=3&&m.max_players-m.current_players>0&&new Date(m.scheduled_at)>now;
    if (activeFilter==='past') return new Date(m.scheduled_at)<now;
    return m.type===activeFilter&&new Date(m.scheduled_at)>now;
  }).sort((a:any, b:any) => {
    // Filtre urgent : trier par places restantes croissantes (les plus urgents d'abord)
    if (activeFilter==='urgent') {
      const spotsA = a.max_players - a.current_players;
      const spotsB = b.max_players - b.current_players;
      return spotsA - spotsB;
    }
    return 0;
  });

  // ── SPLASH SCREEN ─────────────────────────────────────────────────────────────
  if (showSplash) {
    return <SplashScreen onFinish={async () => {
      const seen = await AsyncStorage.getItem('onboarding_seen');
      setShowSplash(false);
      if (!seen && !currentUser) setShowOnboarding(true);
    }} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen
      onStart={() => { setShowOnboarding(false); setScreen('register'); }}
      onLogin={() => { setShowOnboarding(false); setScreen('login'); }}
      onGuest={() => enterGuestMode()}
    />;
  }

  // ── LEVEL UP OVERLAY (global) ────────────────────────────────────────────────
  if (showLevelUp && levelUpRank) {
    return <LevelUpModal rank={levelUpRank} onClose={() => setShowLevelUp(false)} />;
  }

  // ── CARTE JOUEUR ──────────────────────────────────────────────────────────────
  if (screen === 'card') {
    const pastMatches = matches.filter((m:any) => myMatches.includes(m.id) && new Date(m.scheduled_at) < new Date());
    const ratedCount = Object.keys(myRatings).length;
    const avg = ratedCount > 0 ? Object.values(myRatings).reduce((a,b)=>a+b,0)/ratedCount : null;
    const cardStats = {
      matchesPlayed: myMatches.length,
      matchesOrganized: myCreatedMatches.length,
      avgRating: avg,
      ratingsGiven: ratedCount,
      noShows: 0,
    };
    return (
      <View style={s.container}>
        <View style={s.subHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => setScreen('profile')} accessibilityRole="button" accessibilityLabel="Retour"><Ionicons name="chevron-back" size={22} color={Colors.green} /></TouchableOpacity>
          <Text style={s.subHeaderTitle}>MA CARTE</Text>
          <View style={{ width: 70 }} />
        </View>
        <ScrollView contentContainerStyle={{ alignItems:'center', paddingTop:32, paddingBottom:60 }}>
          <Text style={{ fontSize:12, color:Colors.textMuted, textTransform:'uppercase', letterSpacing:2, marginBottom:24 }}>
            TA CARTE FOOTMATCH
          </Text>
          <PlayerCard
            pseudo={currentUser?.pseudo ?? 'Joueur'}
            rank={getAutoLevel(currentUser?.reputation_score ?? 0)}
            score={currentUser?.reputation_score ?? 0}
            stats={cardStats}
            avatarId={userAvatar}
            size="full"
          />
          <Text style={{ fontSize:11, color:Colors.textMuted, marginTop:24, textAlign:'center', lineHeight:18 }}>
            Ta carte évolue automatiquement{'\n'}avec ton niveau de réputation ✨
          </Text>
          {/* BOUTON TEMPORAIRE — retirer après test */}
          <TouchableOpacity
            style={{ marginTop:20, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(255,255,255,0.06)', borderRadius:20, paddingHorizontal:20, paddingVertical:10, borderWidth:1, borderColor:'rgba(255,255,255,0.12)' }}
            onPress={() => setScreen('card_gallery' as any)}
            activeOpacity={0.7}
            accessibilityRole="button" accessibilityLabel="Voir les 20 cartes"
          >
            <Text style={{ fontSize:15 }}>🃏</Text>
            <Text style={{ color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:'600' }}>Voir les 20 cartes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── PROPOSER UN TERRAIN ───────────────────────────────────────────────────────
  if (screen === 'propose_venue') {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.contentPad} keyboardShouldPersistTaps="handled">
        <View style={s.subHeader}>
          <TouchableOpacity style={s.backBtn} onPress={()=>setScreen('venues')} accessibilityRole="button" accessibilityLabel="Retour"><Ionicons name="chevron-back" size={22} color={Colors.green} /></TouchableOpacity>
          <Text style={s.subHeaderTitle}>Proposer un terrain</Text>
        </View>
        <View style={s.infoBox}>
          <Text style={s.infoBoxText}>📋 La communauté votera pour valider ce terrain. À 70% de votes positifs (min. 3 votes), il sera officiellement ajouté !</Text>
        </View>
        <Text style={s.fieldLabel}>Photo du terrain</Text>
        {venuePhoto ? (
          <View style={s.photoPreviewContainer}>
            <Image source={{uri:venuePhoto.uri}} style={s.photoPreview} resizeMode="cover" />
            <TouchableOpacity style={s.photoRemoveBtn} onPress={()=>setVenuePhoto(null)} accessibilityRole="button" accessibilityLabel="Supprimer la photo">
              <Text style={s.photoRemoveBtnText}>✕ Supprimer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.photoPickerRow}>
            <TouchableOpacity style={s.photoPickerBtn} onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Choisir une photo depuis la galerie"><Text style={s.photoPickerEmoji}>🖼️</Text><Text style={s.photoPickerText}>Galerie</Text></TouchableOpacity>
            <TouchableOpacity style={s.photoPickerBtn} onPress={takePhoto} accessibilityRole="button" accessibilityLabel="Prendre une photo avec la caméra"><Text style={s.photoPickerEmoji}>📷</Text><Text style={s.photoPickerText}>Caméra</Text></TouchableOpacity>
          </View>
        )}
        <Text style={s.fieldLabel}>Nom du terrain</Text>
        <TextInput style={s.input} value={venueForm.name} onChangeText={v=>setVenueForm(f=>({...f,name:v}))} placeholder="Ex: Five Olympique Canet" placeholderTextColor={Colors.textMuted} />
        <Text style={s.fieldLabel}>Adresse</Text>
        <TextInput style={s.input} value={venueForm.address} onChangeText={v=>setVenueForm(f=>({...f,address:v}))} placeholder="Ex: 12 rue du Stade" placeholderTextColor={Colors.textMuted} />
        <Text style={s.fieldLabel}>Ville</Text>
        <TextInput style={s.input} value={venueForm.city} onChangeText={v=>setVenueForm(f=>({...f,city:v}))} placeholder="Ex: Canet-en-Roussillon" placeholderTextColor={Colors.textMuted} />
        <View style={s.row}>
          <View style={{flex:1}}><Text style={s.fieldLabel}>Latitude</Text><TextInput style={s.input} value={venueForm.latitude} onChangeText={v=>setVenueForm(f=>({...f,latitude:v}))} placeholder="42.6978" placeholderTextColor={Colors.textMuted} keyboardType="numeric" /></View>
          <View style={{flex:1}}><Text style={s.fieldLabel}>Longitude</Text><TextInput style={s.input} value={venueForm.longitude} onChangeText={v=>setVenueForm(f=>({...f,longitude:v}))} placeholder="3.0220" placeholderTextColor={Colors.textMuted} keyboardType="numeric" /></View>
        </View>
        <Text style={s.fieldLabel}>Type(s) de terrain</Text>
        <View style={s.typeRow}>
          {[{key:'five',label:'Five',emoji:'⚡',color:Colors.green},{key:'city',label:'City',emoji:'🏙️',color:Colors.greenLight},{key:'eleven',label:'Foot 11',emoji:'⚽',color:Colors.white}].map((t) => {
            const selected = venueForm.types.includes(t.key);
            return (
              <TouchableOpacity key={t.key} style={[s.typeBtn,selected&&{borderColor:t.color,backgroundColor:`${t.color}22`}]}
                onPress={()=>setVenueForm(f=>({...f,types:selected?f.types.filter(x=>x!==t.key):[...f.types,t.key]}))}
                accessibilityRole="checkbox" accessibilityLabel={t.label} accessibilityState={{ checked: selected }}>
                <Text style={s.typeBtnEmoji}>{t.emoji}</Text>
                <Text style={[s.typeBtnLabel,selected&&{color:t.color}]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={s.fieldLabel}>Description (optionnelle)</Text>
        <TextInput style={[s.input,{height:80,textAlignVertical:'top'}]} value={venueForm.description} onChangeText={v=>setVenueForm(f=>({...f,description:v}))} placeholder="Vestiaires, parking, éclairage..." placeholderTextColor={Colors.textMuted} multiline />
        <TouchableOpacity style={[s.btn,loading&&s.btnDisabled]} onPress={handleProposeVenue} disabled={loading}
          accessibilityRole="button" accessibilityLabel="Soumettre le terrain à la communauté">
          <Text style={s.btnText}>{loading?(uploadingPhoto?'Upload photo...':'Envoi...'):'🏟️ Soumettre à la communauté'}</Text>
        </TouchableOpacity>
        <View style={{height:60}} />
      </ScrollView>
    );
  }

  // ── TERRAINS ──────────────────────────────────────────────────────────────────
  if (screen === 'venues') {
    const validated=proposals.filter(p=>p.status==='validated');
    const pending=proposals.filter(p=>p.status==='pending');
    const rejected=proposals.filter(p=>p.status==='rejected');
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <View style={s.pageHeader}>
          <Text style={s.pageHeaderTitle}>🏟️ Terrains</Text>
          <TouchableOpacity style={s.proposeBtn} onPress={()=>setScreen('propose_venue')} accessibilityRole="button" accessibilityLabel="Proposer un terrain">
            <Text style={s.proposeBtnText}>+ Proposer</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{loadVenues();loadProposals();}} tintColor={Colors.green} />}>

          {/* ── Complexes officiels ── */}
          {venues.length>0&&<>
            <Text style={s.sectionTitle}>🏟️ Complexes de Five ({venues.length})</Text>
            {venues.map((v:any)=>(
              <View key={v.id} style={[s.venueCard,{borderColor:Colors.greenBorder}]}>
                <View style={s.venueCardHeader}>
                  <Text style={s.venueCardName}>{v.name}</Text>
                  <View style={s.validatedBadge}><Text style={s.validatedBadgeText}>✅ Officiel</Text></View>
                </View>
                <Text style={s.venueCardAddress}>📍 {v.address}, {v.city}</Text>
                {v.types&&<View style={s.venueCardTypes}>{v.types.map((t:string)=>{ const cfg=MATCH_TYPES[t as keyof typeof MATCH_TYPES]; return cfg?<View key={t} style={[s.badge,{backgroundColor:cfg.dimColor,borderColor:cfg.borderColor}]}><Text style={[s.badgeText,{color:cfg.color}]}>{cfg.emoji} {cfg.label}</Text></View>:null; })}</View>}
              </View>
            ))}
          </>}

          {/* ── Propositions communautaires ── */}
          {validated.length>0&&<>{<Text style={s.sectionTitle}>✅ Validés ({validated.length})</Text>}{validated.map((p:any)=>(
            <View key={p.id} style={[s.venueCard,{borderColor:Colors.greenBorder}]}>
              {p.photo_url&&<Image source={{uri:p.photo_url}} style={s.venueCardPhoto} resizeMode="cover" />}
              <View style={s.venueCardHeader}><Text style={s.venueCardName}>{p.name}</Text><View style={s.validatedBadge}><Text style={s.validatedBadgeText}>✅ Validé</Text></View></View>
              <Text style={s.venueCardAddress}>📍 {p.address}, {p.city}</Text>
              <View style={s.venueCardTypes}>{p.types.map((t:string)=>{ const cfg=MATCH_TYPES[t as keyof typeof MATCH_TYPES]; return <View key={t} style={[s.badge,{backgroundColor:cfg?.dimColor,borderColor:cfg?.borderColor}]}><Text style={[s.badgeText,{color:cfg?.color}]}>{cfg?.emoji} {cfg?.label}</Text></View>; })}</View>
            </View>
          ))}</>}
          {pending.length>0&&<>{<Text style={s.sectionTitle}>🗳️ En attente ({pending.length})</Text>}{pending.map((p:any)=>{
            const total=p.votes_yes+p.votes_no, pct=total>0?Math.round((p.votes_yes/total)*100):0;
            const myVote=myVotes[p.id], isOwner=p.proposed_by===currentUser?.id;
            return (
              <View key={p.id} style={s.venueCard}>
                {p.photo_url&&<Image source={{uri:p.photo_url}} style={s.venueCardPhoto} resizeMode="cover" />}
                <View style={s.venueCardHeader}><Text style={s.venueCardName}>{p.name}</Text><View style={s.pendingBadge}><Text style={s.pendingBadgeText}>En attente</Text></View></View>
                <Text style={s.venueCardAddress}>📍 {p.address}, {p.city}</Text>
                {p.description&&<Text style={s.venueCardDesc}>{p.description}</Text>}
                <View style={s.venueCardTypes}>{p.types.map((t:string)=>{ const cfg=MATCH_TYPES[t as keyof typeof MATCH_TYPES]; return <View key={t} style={[s.badge,{backgroundColor:cfg?.dimColor,borderColor:cfg?.borderColor}]}><Text style={[s.badgeText,{color:cfg?.color}]}>{cfg?.emoji} {cfg?.label}</Text></View>; })}</View>
                <View style={s.voteProgressBg}><View style={[s.voteProgressFill,{width:`${pct}%` as any}]} /></View>
                <Text style={s.voteProgressText}>{pct}% pour · {total} vote{total>1?'s':''} · min 3 requis</Text>
                {!isOwner&&<View style={s.voteRow}>
                  <TouchableOpacity style={[s.voteBtn,myVote===true&&s.voteBtnYesActive]} onPress={()=>handleVote(p.id,true)} accessibilityRole="button" accessibilityLabel={`Valider ce terrain${p.votes_yes>0?`, ${p.votes_yes} vote${p.votes_yes>1?'s':''} pour`:''}`}><Text style={[s.voteBtnText,myVote===true&&{color:'#000'}]}>👍 Valider{p.votes_yes>0?` (${p.votes_yes})`:''}</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.voteBtn,myVote===false&&s.voteBtnNoActive]} onPress={()=>handleVote(p.id,false)} accessibilityRole="button" accessibilityLabel={`Rejeter ce terrain${p.votes_no>0?`, ${p.votes_no} vote${p.votes_no>1?'s':''} contre`:''}`}><Text style={[s.voteBtnText,myVote===false&&{color:'#fff'}]}>👎 Rejeter{p.votes_no>0?` (${p.votes_no})`:''}</Text></TouchableOpacity>
                </View>}
                {isOwner&&<Text style={s.ownerNote}>Tu as proposé ce terrain · En attente des votes</Text>}
              </View>
            );
          })}</>}
          {proposals.length===0&&<View style={s.empty}><Text style={s.emptyEmoji}>🏟️</Text><Text style={s.emptyTitle}>Aucun terrain proposé</Text><Text style={s.emptyText}>Sois le premier à en proposer un !</Text></View>}
          <View style={{height:100}} />
        </ScrollView>
        <BottomNav active={screen} onNavigate={setScreen} toRateCount={toRateCount} onCreateMatch={()=>requireAuth(()=>setScreen('create'))} />
      </View>
    );
  }

  // ── CARTE / MATCHS PROCHES ────────────────────────────────────────────────────
  if (screen === 'map') {
    const matchesWithDist=[...matches].filter((m:any)=>m.venue?.latitude&&m.venue?.longitude&&new Date(m.scheduled_at)>new Date()).map((m:any)=>({...m,distanceKm:userLocation?calcDistance(userLocation.latitude,userLocation.longitude,m.venue.latitude,m.venue.longitude):null})).sort((a:any,b:any)=>(a.distanceKm??999)-(b.distanceKm??999));
    const selCfg = selectedMapMatch ? MATCH_TYPES[selectedMapMatch.type as keyof typeof MATCH_TYPES] : null;
    const pctSel = selectedMapMatch ? selectedMapMatch.current_players/selectedMapMatch.max_players : 0;
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        {/* Header flottant */}
        <View style={s.mapHeader}>
          <Text style={s.mapHeaderTitle}>🗺️ Carte</Text>
          <View style={userLocation ? s.gpsChipOn : s.gpsChipOff}>
            <Text style={s.gpsChipText}>{userLocation ? `📍 ${matchesWithDist.length} match${matchesWithDist.length>1?'s':''}` : '📍 GPS désactivé'}</Text>
          </View>
        </View>
        {!userLocation && (
          <View style={s.mapPermissionBanner}>
            <Text style={s.mapPermissionText}>{locationDenied ? 'Active la localisation pour voir les matchs proches.' : 'Active la localisation pour afficher les distances et les matchs proches.'}</Text>
            <TouchableOpacity style={s.mapPermissionBtn} onPress={() => ensureLocationPermission(true)} accessibilityRole="button" accessibilityLabel="Activer la localisation">
              <Text style={s.mapPermissionBtnText}>Activer</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Carte */}
        <MapView
          style={{ flex:1, marginTop: Platform.OS==='ios' ? 100 : 88 }}
          customMapStyle={DARK_MAP_STYLE}
          initialRegion={{ latitude:userLocation?.latitude??48.8566, longitude:userLocation?.longitude??2.3522, latitudeDelta:0.05, longitudeDelta:0.05 }}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={()=>setSelectedMapMatch(null)}
        >
          {matchesWithDist.map((m:any)=>{
            const cfg=MATCH_TYPES[m.type as keyof typeof MATCH_TYPES];
            const isSelected = selectedMapMatch?.id === m.id;
            return (
              <Marker key={m.id} coordinate={{ latitude:m.venue.latitude, longitude:m.venue.longitude }} onPress={()=>setSelectedMapMatch(m)} tracksViewChanges={false}>
                <View style={[s.mapPin, { borderColor: cfg?.color??Colors.green, backgroundColor: isSelected ? cfg?.color+'33' : '#0D1117' }]}>
                  <Text style={s.mapPinEmoji}>{cfg?.emoji??'⚽'}</Text>
                  {isSelected && <View style={[s.mapPinDot,{backgroundColor:cfg?.color??Colors.green}]}/>}
                </View>
              </Marker>
            );
          })}
        </MapView>
        {/* Carte match sélectionné */}
        {selectedMapMatch && selCfg && (
          <View style={s.mapBottomCard}>
            <View style={s.mapCardHeader}>
              <View style={[s.badge,{backgroundColor:selCfg.dimColor,borderColor:selCfg.borderColor}]}>
                <Text style={[s.badgeText,{color:selCfg.color}]}>{selCfg.emoji} {selCfg.label}</Text>
              </View>
              {selectedMapMatch.distanceKm !== null && selectedMapMatch.distanceKm !== undefined && <View style={s.distPill}><Text style={s.distPillText}>{selectedMapMatch.distanceKm.toFixed(1)} km</Text></View>}
              <TouchableOpacity style={s.mapCardCloseBtn} onPress={()=>setSelectedMapMatch(null)} accessibilityRole="button" accessibilityLabel="Fermer">
                <Text style={s.mapCardCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.mapCardTitle} numberOfLines={1}>{selectedMapMatch.title}</Text>
            <Text style={s.mapCardSub}>📍 {selectedMapMatch.venue?.name}</Text>
            <Text style={s.mapCardSub}>📅 {new Date(selectedMapMatch.scheduled_at).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</Text>
            <View style={s.mapCardFooter}>
              <View style={s.mapCardPlayers}>
                <View style={s.barBg}><View style={[s.barFill,{width:`${Math.min(pctSel*100,100)}%` as any,backgroundColor:pctSel>=1?Colors.greenDark:pctSel>=0.8?Colors.greenLight:Colors.green}]}/></View>
                <Text style={s.mapCardPlayersText}>{selectedMapMatch.current_players}/{selectedMapMatch.max_players} joueurs</Text>
              </View>
              <TouchableOpacity style={[s.mapCardBtn,{backgroundColor:selCfg.color}]} onPress={()=>{loadMatchDetail(selectedMapMatch);setSelectedMapMatch(null);}} accessibilityRole="button" accessibilityLabel={`Voir le match ${selectedMapMatch.title}`}>
                <Text style={s.mapCardBtnText}>Voir →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <BottomNav active={screen} onNavigate={setScreen} toRateCount={toRateCount} onCreateMatch={()=>requireAuth(()=>setScreen('create'))} />
      </View>
    );
  }

  // ── CHAT ──────────────────────────────────────────────────────────────────────
  if (screen==='chat'&&selectedMatch) {
  const isJoinedChat = myMatches.includes(selectedMatch.id) || selectedMatch.organizer_id === currentUser?.id;
  const playersCount = selectedMatch.current_players;
  const maxPlayers = selectedMatch.max_players;
  const matchDate = new Date(selectedMatch.scheduled_at);
  const isPast = matchDate < new Date();
  const venue = selectedMatch.venue;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS==='ios'?'padding':'height'}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={s.chatHeader}>
        <TouchableOpacity style={s.backBtn} onPress={()=>setScreen('detail')} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={22} color={Colors.green} />
        </TouchableOpacity>
        <View style={s.chatHeaderCenter}>
          <Text style={s.chatHeaderTitle} numberOfLines={1}>{selectedMatch.title}</Text>
          <Text style={s.chatHeaderSub}>{playersCount}/{maxPlayers} joueurs · {isPast ? 'Terminé' : matchDate.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</Text>
        </View>
        <TouchableOpacity
          style={s.chatShareAddrBtn}
          accessibilityRole="button" accessibilityLabel="Partager l'adresse du terrain"
          onPress={async () => {
            if (venue?.address) {
              const addr = `📍 ${venue.name} — ${venue.address}, ${venue.city}`;
              if (currentUser && selectedMatch) {
                await supabase.from('chat_messages').insert({ match_id: selectedMatch.id, user_id: currentUser.id, content: addr });
              }
            }
          }}
        >
          <Ionicons name="location-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {!isJoinedChat
        ? <View style={s.chatLocked}>
            <Ionicons name="lock-closed" size={48} color={Colors.textMuted} />
            <Text style={s.chatLockedTitle}>Chat réservé aux inscrits</Text>
            <Text style={s.chatLockedText}>Rejoins le match pour accéder au chat !</Text>
          </View>
        : <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item)=>item.id}
              contentContainerStyle={{padding:Spacing.xl,gap:8,flexGrow:1}}
              onContentSizeChange={()=>flatListRef.current?.scrollToEnd({animated:true})}
              ListEmptyComponent={
                <View style={s.chatEmpty}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.textMuted} />
                  <Text style={s.chatEmptyText}>Sois le premier à écrire !</Text>
                </View>
              }
              renderItem={({item})=>{
                const isMe = item.user_id===currentUser?.id;
                const isAddr = item.content?.startsWith('📍');
                return (
                  <View style={[s.msgWrap, isMe&&s.msgWrapMe]}>
                    {!isMe&&<TouchableOpacity onPress={()=>{ if(item.user?.id){ setSelectedPlayer(item.user.id); setScreen('player_profile'); } }} accessibilityRole="button" accessibilityLabel={`Voir le profil de ${item.user?.pseudo??'ce joueur'}`}><Text style={[s.msgSender,{textDecorationLine:'underline'}]}>{item.user?.pseudo??'?'}</Text></TouchableOpacity>}
                    <TouchableOpacity onLongPress={()=>handleMessageLongPressStoreReady(item, 'match')} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Appui long pour signaler ce message" accessibilityHint="Maintenez appuyé pour voir les options">
                      <View style={[s.msgBubble, isMe&&s.msgBubbleMe, isAddr&&s.msgBubbleAddr]}>
                        <Text style={[s.msgText, isMe&&s.msgTextMe, isAddr&&s.msgTextAddr]}>{item.content}</Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={[s.msgTime, isMe&&s.msgTimeMe]}>{new Date(item.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</Text>
                  </View>
                );
              }}
            />
            <View style={s.chatInput}>
              <TextInput
                style={s.chatInputField}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Ton message..."
                placeholderTextColor={Colors.textMuted}
                maxLength={500}
                multiline
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                style={[s.sendBtn,(!newMessage.trim()||sendingMsg)&&s.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!newMessage.trim()||sendingMsg}
                accessibilityRole="button" accessibilityLabel="Envoyer le message"
              >
                <Ionicons name="send" size={18} color={(!newMessage.trim()||sendingMsg) ? Colors.textMuted : '#000'} />
              </TouchableOpacity>
            </View>
          </>
      }
    </KeyboardAvoidingView>
  );
}

  // ── MENTIONS LÉGALES ──────────────────────────────────────────────────────────
  if (screen==='legal') {
    return <LegalScreen onBack={()=>setScreen(currentUser ? 'profile' : 'login')} />;
  }

  // ── JOUEURS ───────────────────────────────────────────────────────────────────
  if (screen==='players') {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <View style={[s.subHeader, {justifyContent:'center', flexDirection:'column', paddingBottom:10}]}>
          <Text style={s.subHeaderTitle}>👥 JOUEURS</Text>
          <Text style={{fontSize:12, color:Colors.textMuted, fontWeight:'600', marginTop:2}}>Joueurs actifs à Perpignan</Text>
        </View>
        <PlayersScreen
          currentUserId={currentUser?.id ?? null}
          blockedUserIds={blockedUserIds}
          guestMode={guestMode}
          onInvite={(playerId) => openInviteModal(playerId)}
          onShowGuestModal={() => setShowGuestModal(true)}
          onViewProfile={(playerId) => { setSelectedPlayer(playerId); setScreen('player_profile'); }}
        />
        <BottomNav active={screen} onNavigate={setScreen} toRateCount={toRateCount} onCreateMatch={()=>requireAuth(()=>setScreen('create'))} />
        {renderInviteModal()}
      </View>
    );
  }

  // ── PROFIL JOUEUR ─────────────────────────────────────────────────────────────
  if (screen === 'player_profile' && selectedPlayer) {
    return (
      <>
        <PlayerProfileScreen
          playerId={selectedPlayer}
          currentUserId={currentUser?.id ?? null}
          isBlocked={blockedUserIds.includes(selectedPlayer)}
          onBack={() => setScreen('players')}
          onInvite={() => { if (selectedPlayer) openInviteModal(selectedPlayer); }}
          onToggleBlock={() => toggleBlockedUserStoreReady(selectedPlayer)}
        />
        {renderInviteModal()}
      </>
    );
  }

  // ── COMPÉTITIONS (onglet unifié) ──────────────────────────────────────────────
  // ── COMMUNAUTÉ ───────────────────────────────────────────────────────────────
  if (screen==='community') {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <View style={[s.subHeader, {justifyContent:'center'}]}>
          <Text style={s.subHeaderTitle}>💬 COMMUNAUTÉ</Text>
        </View>
        <CommunityScreen
          onJoinMatch={(id) => { /* navigate to match detail */ }}
          onNavigate={(scr, filter) => {
            if (filter) setActiveFilter(filter);
            setScreen(scr as any);
          }}
        />
        <BottomNav active={screen} onNavigate={setScreen} toRateCount={toRateCount} onCreateMatch={()=>requireAuth(()=>setScreen('create'))} />
      </View>
    );
  }

  if (screen==='competitions') {
    return (
      <View style={s.container}>
        <CompetitionsScreen
          currentUserId={currentUser!.id}
          onOpenTeam={(t) => { setSelectedTeam(t); setScreen('team_detail'); }}
          onOpenChampionship={(c) => { setSelectedChampionship(c); setScreen('championship_detail'); }}
          onOpenCup={(c) => { setSelectedCup(c); setScreen('cup_detail'); }}
        />
        <BottomNav active={screen} onNavigate={setScreen} toRateCount={toRateCount} onCreateMatch={()=>requireAuth(()=>setScreen('create'))} />
      </View>
    );
  }

  // ── ÉQUIPE (détail) ───────────────────────────────────────────────────────────
  if (screen==='team_detail' && selectedTeam) {
    return <TeamDetailScreen
      team={selectedTeam}
      currentUserId={currentUser!.id}
      onBack={() => setScreen('competitions')}
    />;
  }

  // ── COUPE (détail bracket) ────────────────────────────────────────────────────
  if (screen==='cup_detail' && selectedCup) {
    return <CupDetailScreen
      cup={selectedCup}
      currentUserId={currentUser!.id}
      onBack={() => setScreen('competitions')}
    />;
  }

  // ── CHAMPIONNAT (liste/créer) — conservé pour accès direct ───────────────────
  if (screen==='championship') {
    return (
      <View style={s.container}>
        <ChampionshipScreen
          currentUserId={currentUser!.id}
          onOpen={(c)=>{ setSelectedChampionship(c); setScreen('championship_detail'); }}
        />
        <BottomNav active="competitions" onNavigate={setScreen} toRateCount={toRateCount} onCreateMatch={()=>requireAuth(()=>setScreen('create'))} />
      </View>
    );
  }

  // ── CHAMPIONNAT (détail) ──────────────────────────────────────────────────────
  if (screen==='championship_detail' && selectedChampionship) {
    return <ChampionshipDetailScreen
      championship={selectedChampionship}
      currentUserId={currentUser!.id}
      onBack={()=>setScreen('competitions')}
    />;
  }

  // ── RÉPUTATION ────────────────────────────────────────────────────────────────
  if (screen==='reputation') {
    return <ReputationScreen userId={currentUser!.id} currentUserId={currentUser!.id} onBack={()=>setScreen('profile')} />;
  }

  // ── PROFIL ────────────────────────────────────────────────────────────────────
  if (screen==='profile') {
    const pastMatches=matches.filter((m:any)=>myMatches.includes(m.id)&&new Date(m.scheduled_at)<new Date());
    const upcomingMatches=matches.filter((m:any)=>myMatches.includes(m.id)&&new Date(m.scheduled_at)>new Date());
    const ratedCount=Object.keys(myRatings).length;
    const avgRating=ratedCount>0?(Object.values(myRatings).reduce((a,b)=>a+b,0)/ratedCount).toFixed(1):null;
    const toRate=pastMatches.filter((m:any)=>!myRatings[m.id]);
    // Calcul du streak (semaines consécutives avec au moins 1 match)
    const matchDates = matches
      .filter((m:any) => myMatches.includes(m.id) && new Date(m.scheduled_at) <= new Date())
      .map((m:any) => new Date(m.scheduled_at));
    let streak = 0;
    if (matchDates.length > 0) {
      const getWeek = (d: Date) => {
        const start = new Date(d); start.setHours(0,0,0,0);
        const day = start.getDay() || 7; start.setDate(start.getDate() - day + 1);
        return start.getTime();
      };
      const weeks = new Set(matchDates.map(getWeek));
      const sortedWeeks = Array.from(weeks).sort((a,b)=>b-a);
      const oneWeek = 7*24*60*60*1000;
      const thisWeek = getWeek(new Date());
      if (sortedWeeks[0] === thisWeek || sortedWeeks[0] === thisWeek - oneWeek) {
        streak = 1;
        for (let i = 1; i < sortedWeeks.length; i++) {
          if (sortedWeeks[i-1] - sortedWeeks[i] === oneWeek) streak++;
          else break;
        }
      }
    }
    const cardStats = { matchesPlayed:myMatches.length, matchesOrganized:myCreatedMatches.length, avgRating:avgRating?parseFloat(avgRating):null, ratingsGiven:ratedCount, noShows:0 };
    const profileScore = currentUser?.reputation_score ?? 0;
    const profileRank = getLevelFromScore(profileScore);
    const profileCfg = getLevelConfig(profileRank);
    const profileLvlProgress = getLevelProgress(profileScore);

    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <View style={s.pageHeader}>
          <Text style={s.pageHeaderTitle}>Mon Profil</Text>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Se déconnecter"><Text style={s.logoutBtnText}>Déconnexion</Text></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header profil — Carte FootMatch en mini */}
          <View style={s.profileHeader}>
            <TouchableOpacity onPress={() => setScreen('card' as any)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Voir ma carte joueur">
              <PlayerCard
                pseudo={currentUser?.pseudo ?? 'Joueur'}
                rank={getAutoLevel(currentUser?.reputation_score ?? 0)}
                score={currentUser?.reputation_score ?? 0}
                stats={{ matchesPlayed:myMatches.length, matchesOrganized:myCreatedMatches.length, avgRating:null, ratingsGiven:Object.keys(myRatings).length, noShows:0 }}
                avatarId={userAvatar}
                size="mini"
              />
              <Text style={{ fontSize:10, color:Colors.textMuted, textAlign:'center', marginTop:6 }}>
                Appuie pour voir ta carte →
              </Text>
            </TouchableOpacity>
            <Text style={s.profileName}>{currentUser?.pseudo}</Text>
            <Text style={s.profileEmail}>{currentUser?.email}</Text>
            <TouchableOpacity
              style={{marginTop:8, flexDirection:'row', alignItems:'center', gap:6, backgroundColor:userSkill ? Colors.greenDim : Colors.bg2, borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:7, borderWidth:1, borderColor:userSkill ? Colors.green+'50' : 'rgba(255,255,255,0.10)'}}
              accessibilityRole="button" accessibilityLabel="Choisir mon skill principal"
              onPress={() => {
                Alert.alert(
                  '⚡ Mon skill principal',
                  'Choisis ta caractéristique la plus forte',
                  [
                    ...SKILLS.map(sk => ({ text: `${sk.emoji}  ${sk.label}`, onPress: () => updateSkill(sk.key) })),
                    {text:'Annuler', style:'cancel'},
                  ]
                );
              }}
            >
              <Text style={{fontSize:15}}>{userSkill ? SKILLS.find(sk => sk.key === userSkill)?.emoji ?? '⚡' : '⚡'}</Text>
              <Text style={{fontSize:12, color: userSkill ? Colors.green : Colors.textMuted, fontWeight:'700'}}>
                {userSkill ? SKILLS.find(sk => sk.key === userSkill)?.label ?? 'Skill' : 'Choisir mon skill'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.shareProfileBtn} onPress={handleShareProfile} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Partager mon profil">
            <Ionicons name="share-social-outline" size={18} color={Colors.green} />
            <Text style={s.shareProfileBtnText}>Partager mon profil</Text>
          </TouchableOpacity>

          {/* Streak banner */}
          {streak > 0 && (
            <View style={s.streakBanner}>
              <Text style={s.streakFire}>🔥</Text>
              <View>
                <Text style={s.streakTitle}>{streak} semaine{streak > 1 ? 's' : ''} de suite !</Text>
                <Text style={s.streakSub}>Continue pour monter de division</Text>
              </View>
              <Text style={s.streakCount}>{streak}</Text>
            </View>
          )}
          <View style={s.statsGrid}>
            <View style={s.statCard}><Text style={s.statCardN}>{myMatches.length}</Text><Text style={s.statCardL}>Total matchs</Text></View>
            <View style={s.statCard}><Text style={s.statCardN}>{upcomingMatches.length}</Text><Text style={s.statCardL}>À venir</Text></View>
            <View style={s.statCard}><Text style={s.statCardN}>{pastMatches.length}</Text><Text style={s.statCardL}>Joués</Text></View>
            <View style={s.statCard}><Text style={s.statCardN}>{myCreatedMatches.length}</Text><Text style={s.statCardL}>Créés</Text></View>
          </View>

          {profileLvlProgress.next && (
            <View style={s.advancedStats}>
              <Text style={s.levelProgressTitle}>🏆 Progression</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: profileCfg.color }}>{profileRank}</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted }}>{profileLvlProgress.pointsToNext} pts avant {profileLvlProgress.next}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted }}>{profileLvlProgress.next}</Text>
              </View>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${profileLvlProgress.progress}%` as any }]} />
              </View>
            </View>
          )}

          <View style={s.advancedStats}>
            <Text style={s.advancedStatsTitle}>⚽ Contribution offensive</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 12 }}>
              Mets a jour tes buts et passes decisives apres tes matchs joues.
            </Text>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Buts</Text>
                <TextInput
                  style={s.input}
                  value={personalStatsDraft.goals}
                  onChangeText={(v) => setPersonalStatsDraft((prev) => ({ ...prev, goals: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Passes decisives</Text>
                <TextInput
                  style={s.input}
                  value={personalStatsDraft.assists}
                  onChangeText={(v) => setPersonalStatsDraft((prev) => ({ ...prev, assists: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
            <TouchableOpacity style={[s.btn, { marginTop: 4 }]} onPress={savePersonalStats} accessibilityRole="button" accessibilityLabel="Enregistrer mes statistiques">
              <Text style={s.btnText}>Enregistrer mes stats</Text>
            </TouchableOpacity>
          </View>

          {toRate.length>0&&<View style={{paddingHorizontal:Spacing.xl,marginBottom:Spacing.lg}}>
            <Text style={s.sectionTitle}>⭐ À noter</Text>
            {toRate.map((m:any)=>(
              <TouchableOpacity key={m.id} style={s.rateCard} onPress={()=>loadMatchDetail(m)} accessibilityRole="button" accessibilityLabel={`Voir et noter le match ${m.title}`}>
                <View style={{flex:1}}><Text style={s.rateCardTitle}>{m.title}</Text><Text style={s.rateCardSub}>{new Date(m.scheduled_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</Text></View>
                <Text style={s.rateCardCta}>Noter →</Text>
              </TouchableOpacity>
            ))}
          </View>}

          {upcomingMatches.length>0&&<View style={{paddingHorizontal:Spacing.xl,marginBottom:Spacing.lg}}>
            <Text style={s.sectionTitle}>📅 Prochains matchs</Text>
            {upcomingMatches.slice(0,3).map((m:any)=>{
              const cfg=MATCH_TYPES[m.type as keyof typeof MATCH_TYPES];
              return <TouchableOpacity key={m.id} style={s.miniCard} onPress={()=>loadMatchDetail(m)} accessibilityRole="button" accessibilityLabel={`Voir le match ${m.title}`}><View style={[s.badge,{backgroundColor:cfg?.dimColor,borderColor:cfg?.borderColor}]}><Text style={[s.badgeText,{color:cfg?.color}]}>{cfg?.emoji} {cfg?.label}</Text></View><Text style={s.miniCardTitle}>{m.title}</Text><Text style={s.miniCardSub}>{m.venue?.name} · {new Date(m.scheduled_at).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</Text></TouchableOpacity>;
            })}
          </View>}

          {pastMatches.length > 0 && (
            <View style={{paddingHorizontal:Spacing.xl, marginBottom:Spacing.lg}}>
              <Text style={s.sectionTitle}>🕐 Derniers matchs</Text>
              {pastMatches.slice(0, 5).map((m: any) => {
                const cfg = MATCH_TYPES[m.type as keyof typeof MATCH_TYPES];
                const rated = !!myRatings[m.id];
                return (
                  <TouchableOpacity key={m.id} style={s.miniCard} onPress={() => loadMatchDetail(m)} accessibilityRole="button" accessibilityLabel={`Voir le match ${m.title}`}>
                    <View style={[s.badge, {backgroundColor: cfg?.dimColor, borderColor: cfg?.borderColor}]}>
                      <Text style={[s.badgeText, {color: cfg?.color}]}>{cfg?.emoji} {cfg?.label}</Text>
                    </View>
                    <Text style={s.miniCardTitle}>{m.title}</Text>
                    <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                      <Text style={s.miniCardSub}>{new Date(m.scheduled_at).toLocaleDateString('fr-FR', {day:'numeric', month:'short', year:'numeric'})}</Text>
                      {rated
                        ? <Text style={{fontSize:11, color:Colors.green, fontWeight:'700'}}>✓ Noté {myRatings[m.id]}/5</Text>
                        : <Text style={{fontSize:11, color:Colors.greenLight, fontWeight:'700'}}>⭐ À noter</Text>
                      }
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Légal & Danger Zone */}
          <View style={s.dangerZone}>
            <TouchableOpacity style={s.legalProfileBtn} onPress={()=>setScreen('legal')} accessibilityRole="button" accessibilityLabel="Voir la politique de confidentialité et les CGU">
              <Text style={s.legalProfileBtnText}>📄 Politique de confidentialité & CGU</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteAccountBtn} onPress={handleDeleteAccountStoreReady} accessibilityRole="button" accessibilityLabel="Supprimer mon compte définitivement">
              <Text style={s.deleteAccountBtnText}>🗑️ Supprimer mon compte</Text>
            </TouchableOpacity>
          </View>

          <View style={{height:100}} />
        </ScrollView>
        <BottomNav active={screen} onNavigate={setScreen} toRateCount={toRateCount} onCreateMatch={()=>requireAuth(()=>setScreen('create'))} />

        {/* Avatar Picker supprimé — la carte FootMatch est l'identité du joueur */}
      </View>
    );
  }

  // ── DÉTAIL MATCH ──────────────────────────────────────────────────────────────
  if (screen==='detail'&&selectedMatch) {
    const cfg=MATCH_TYPES[selectedMatch.type as keyof typeof MATCH_TYPES];
    const actualCurrentPlayers = matchPlayers.length > 0 ? matchPlayers.length : selectedMatch.current_players;
    const remainingSpots = Math.max(0, selectedMatch.max_players - actualCurrentPlayers);
    const pct=actualCurrentPlayers/selectedMatch.max_players;
    const barColor=pct>=1?Colors.greenDark:pct>=0.8?Colors.greenLight:Colors.green;
    const isFull=actualCurrentPlayers>=selectedMatch.max_players;
    const isJoined=myMatches.includes(selectedMatch.id);
    const isOrganizer=selectedMatch.organizer_id===currentUser?.id;
    const isPast=new Date(selectedMatch.scheduled_at)<new Date();
    const canRate=isPast&&(isJoined||isOrganizer);
    const myRating=myRatings[selectedMatch.id];
    const dist=userLocation&&selectedMatch.venue?calcDistance(userLocation.latitude,userLocation.longitude,selectedMatch.venue.latitude,selectedMatch.venue.longitude):null;
    return (
      <View style={s.container}>
        <View style={s.subHeader}>
          <TouchableOpacity style={s.backBtn} onPress={()=>setScreen('home')} accessibilityRole="button" accessibilityLabel="Retour"><Ionicons name="chevron-back" size={22} color={Colors.green} /></TouchableOpacity>
          <View style={[s.badge,{backgroundColor:cfg?.dimColor,borderColor:cfg?.borderColor}]}><Text style={[s.badgeText,{color:cfg?.color}]}>{cfg?.emoji} {cfg?.label}</Text></View>
          <TouchableOpacity onPress={handleShare} style={s.shareDetailBtn} accessibilityRole="button" accessibilityLabel="Partager ce match">
            <Ionicons name="share-social-outline" size={16} color='#000' />
            <Text style={s.shareDetailBtnText}>Partager</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding:Spacing.xl}}>
          <Text style={s.detailTitle}>{selectedMatch.title}</Text>
          {selectedMatch.avg_rating&&<View style={s.avgRating}><Text style={s.avgRatingStars}>{'⭐'.repeat(Math.round(selectedMatch.avg_rating))}</Text><Text style={s.avgRatingText}>{selectedMatch.avg_rating.toFixed(1)}/5 · {selectedMatch.rating_count} avis</Text></View>}
          <View style={s.detailStats}>
            <View style={s.detailStat}><Text style={s.detailStatN}>{actualCurrentPlayers}</Text><Text style={s.detailStatL}>/ {selectedMatch.max_players} joueurs</Text></View>
            <View style={s.heroStatDiv} />
            <View style={s.detailStat}><Text style={s.detailStatN}>{isPast?'✅':'🆓'}</Text><Text style={s.detailStatL}>{isPast?'Terminé':'Gratuit'}</Text></View>
            <View style={s.heroStatDiv} />
            <View style={s.detailStat}><Text style={s.detailStatN}>{dist?`${dist}km`:'📍'}</Text><Text style={s.detailStatL}>{dist?'de toi':'Terrain'}</Text></View>
          </View>
          <View style={s.barBgLarge}><View style={[s.barFillLarge,{width:`${Math.min(pct*100,100)}%` as any,backgroundColor:barColor}]} /></View>
          <View style={s.infoCard}>
            <View style={s.infoRow}><Text style={s.infoIcon}>📍</Text><View style={{flex:1}}><Text style={s.infoLabel}>Terrain</Text><Text style={s.infoValue}>{selectedMatch.venue?.name}</Text><Text style={s.infoSub}>{selectedMatch.venue?.address}, {selectedMatch.venue?.city}</Text></View></View>
            <View style={s.infoRow}><Text style={s.infoIcon}>📅</Text><View><Text style={s.infoLabel}>Date & Heure</Text><Text style={s.infoValue}>{new Date(selectedMatch.scheduled_at).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</Text><Text style={s.infoSub}>{new Date(selectedMatch.scheduled_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</Text></View></View>
            {selectedMatch.description?<View style={s.infoRow}><Text style={s.infoIcon}>💬</Text><View><Text style={s.infoLabel}>Description</Text><Text style={s.infoValue}>{selectedMatch.description}</Text></View></View>:null}
          </View>
          {(isJoined||isOrganizer)&&!isPast&&<TouchableOpacity style={s.chatBtn} onPress={()=>setScreen('chat')} accessibilityRole="button" accessibilityLabel="Ouvrir le chat du match"><Text style={s.chatBtnText}>💬 Ouvrir le chat du match</Text></TouchableOpacity>}
          {canRate&&(
  <View style={[s.ratingBox, myRating ? s.ratingBoxDone : null]}>
    {myRating ? (
      <>
        <View style={{flexDirection:'row', alignItems:'center', gap:8, justifyContent:'center'}}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.green} />
          <Text style={s.ratingTitle}>Match noté !</Text>
        </View>
        <View style={s.starsRow}>
          {[1,2,3,4,5].map((star)=>(
            <TouchableOpacity key={star} onPress={()=>handleRate(selectedMatch.id,star)} disabled={ratingLoading} activeOpacity={0.7} style={s.starBtn} accessibilityRole="button" accessibilityLabel={`Donner ${star} étoile${star>1?'s':''}`}>
              <Text style={[s.star, myRating>=star&&s.starActive]}>{myRating>=star?'⭐':'☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{fontSize:12, color:Colors.textMuted, textAlign:'center'}}>Appuie pour changer ta note</Text>
      </>
    ) : (
      <>
        <View style={{flexDirection:'row', alignItems:'center', gap:8, justifyContent:'center'}}>
          <Ionicons name="star" size={20} color={Colors.greenLight} />
          <Text style={s.ratingTitle}>Note ce match</Text>
        </View>
        <Text style={s.ratingSubtitle}>Fair-play, organisation, ambiance</Text>
        <View style={s.starsRow}>
          {[1,2,3,4,5].map((star)=>(
            <TouchableOpacity key={star} onPress={()=>handleRate(selectedMatch.id,star)} disabled={ratingLoading} activeOpacity={0.7} style={s.starBtn} accessibilityRole="button" accessibilityLabel={`Donner ${star} étoile${star>1?'s':''}`}>
              <Text style={[s.star, myRating>=star&&s.starActive]}>{myRating>=star?'⭐':'☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.ratingHint}>Ta note améliore la réputation de l'organisateur ⚡</Text>
      </>
    )}
  </View>
)}
          <Text style={s.sectionTitle}>👥 Joueurs ({matchPlayers.length})</Text>
          {matchPlayers.map((p:any,i:number)=>(
            <TouchableOpacity key={p.user?.id??i} style={s.playerRow} activeOpacity={0.75}
              onPress={() => { if (p.user?.id && p.user.id !== currentUser?.id) { setSelectedPlayer(p.user.id); setScreen('player_profile'); } }}
              accessibilityRole="button" accessibilityLabel={`Voir le profil de ${p.user?.pseudo??'ce joueur'}`}>
              <View style={s.playerAvatar}><Text style={s.playerAvatarText}>{(p.user?.pseudo??'?')[0].toUpperCase()}</Text></View>
              <View style={{flex:1}}>
                <Text style={s.playerName}>{p.user?.pseudo??'Joueur'}</Text>
                <Text style={s.playerLevel}>{p.user?.display_level ?? p.user?.level ?? ''}{p.user?.display_matches_played !== null && p.user?.display_matches_played !== undefined ? ` · ${p.user.display_matches_played} matchs` : ''}</Text>
              </View>
              {p.user?.id===selectedMatch.organizer_id&&<View style={s.orgaBadge}><Text style={s.orgaBadgeText}>Orga</Text></View>}
              {p.user?.id===currentUser?.id&&<View style={s.meBadge}><Text style={s.meBadgeText}>Moi</Text></View>}
              {p.user?.id && p.user.id !== currentUser?.id && <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />}
            </TouchableOpacity>
          ))}
          {!isPast && !isFull && remainingSpots <= 3 && (
            <TouchableOpacity style={s.shareNudge} onPress={handleShare} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Partager le match pour recruter des joueurs">
              <Ionicons name="flash" size={15} color={Colors.green} />
              <Text style={s.shareNudgeText}>
                Il manque {remainingSpots} joueur{remainingSpots > 1 ? 's' : ''} - partage le match !
              </Text>
              <Ionicons name="share-outline" size={15} color={Colors.green} />
            </TouchableOpacity>
          )}
          <View style={{height:140}} />
        </ScrollView>
        {!isPast&&(<View style={s.detailCTA}>
            {guestMode
              ? <TouchableOpacity style={s.joinBtn} onPress={()=>setShowGuestModal(true)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="S'inscrire pour rejoindre ce match">
                  <Text style={s.joinBtnText}>Rejoindre — S'inscrire gratuitement</Text>
                </TouchableOpacity>
              : isOrganizer
              ? <View style={s.orgaCTA}>
                  <Ionicons name="shield-checkmark" size={18} color={Colors.green} />
                  <Text style={s.orgaCTAText}>Tu organises ce match - {actualCurrentPlayers}/{selectedMatch.max_players} joueurs</Text>
                </View>
              : isJoined
              ? <View style={s.ctaRow}>

                  <TouchableOpacity style={[s.leaveBtn,{flex:1}]} onPress={handleLeave} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Quitter ce match">
                    <Text style={s.leaveBtnText}>Quitter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.joinBtn,{flex:2}]} onPress={()=>setScreen('chat')} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Ouvrir le chat du match">
                    <Ionicons name="chatbubble-ellipses" size={18} color="#000" />
                    <Text style={s.joinBtnText}>Chat du match</Text>
                  </TouchableOpacity>
                </View>
              : isFull
              ? <View style={s.fullBtn}><Text style={s.fullBtnText}>🔴 Match complet</Text></View>
              : <TouchableOpacity style={[s.joinBtn, loading&&s.btnDisabled]} onPress={handleJoin} disabled={loading} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Rejoindre ce match">
                  <Text style={s.joinBtnText}>{loading ? 'Inscription en cours...' : '✅ Rejoindre — Gratuit'}</Text>
                </TouchableOpacity>
            }
          </View>
        )}
      </View>
    );
  }

  // ── GALERIE CARTES (temporaire) ───────────────────────────────────────────────
  if (screen === ('card_gallery' as any)) {
    return (
      <CardGalleryScreen
        onBack={() => setScreen('card' as any)}
        currentRank={getAutoLevel(currentUser?.reputation_score ?? 0)}
        pseudo={currentUser?.pseudo ?? 'Joueur'}
        score={currentUser?.reputation_score ?? 0}
        avatarId={userAvatar}
      />
    );
  }

  // ── CRÉER MATCH ───────────────────────────────────────────────────────────────
  if (screen === 'create') {
    const cfg = MATCH_TYPES[form.type];
    const today = new Date();
    const QUICK_DATES = Array.from({length: 6}, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const val = formatFrenchDate(d);
      const label = i === 0 ? "Auj." : i === 1 ? "Demain" : d.toLocaleDateString('fr-FR', {weekday:'short', day:'numeric'});
      return { val, label };
    });
    const QUICK_TIMES = ['17:00','18:00','19:00','20:00','21:00','22:00'];
    const communityValidatedVenues = proposals
      .filter((proposal: any) => proposal.status === 'validated' && proposal.validated_venue_id && Array.isArray(proposal.types) && proposal.types.includes(form.type))
      .map((proposal: any) => ({
        id: proposal.validated_venue_id,
        name: proposal.name,
        city: proposal.city,
        address: proposal.address,
        types: proposal.types,
        source: 'community',
      }));
    const rawVenuePool = form.type === 'five'
      ? venues.filter((v) => Array.isArray(v.types) && v.types.includes('five'))
      : communityValidatedVenues;
    const filteredVenues = rawVenuePool.filter((v: any) => {
      const haystack = [v.name, v.city, v.address].map((value) => String(value ?? '').toLowerCase());
      const q = venueSearch.toLowerCase();
      return !q || haystack.some((value) => value.includes(q));
    });

    return (
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="light-content" />

        {/* ── HEADER ── */}
        <View style={s.createHeader}>
          <TouchableOpacity style={s.createBackBtn} onPress={() => setScreen('home')} accessibilityRole="button" accessibilityLabel="Retour">
            <Ionicons name="chevron-back" size={22} color={Colors.green} />
          </TouchableOpacity>
          <View style={s.createHeaderCenter}>
            <Text style={s.createHeroTitle}>
              Organise ton <Text style={{color: Colors.green}}>match</Text> ⚽
            </Text>
            <Text style={s.createHeroSub}>CONFIGURE · PUBLIE · JOUE</Text>
          </View>
          <View style={{width: 40}} />
        </View>

        <View style={s.createBody}>

          {/* ── ÉTAPE 1 : FORMAT ── */}
          <View style={s.createStepRow}>
            <View style={s.createStepBadge}><Text style={s.createStepBadgeText}>1</Text></View>
            <Text style={s.createStepLabel}>Format du match</Text>
          </View>
          <View style={s.typeRow}>
            {(Object.keys(MATCH_TYPES) as ('five'|'city'|'eleven')[]).map((t) => {
              const c = MATCH_TYPES[t];
              const iconColor = form.type === t ? c.color : Colors.textMuted;
              return (
                <TouchableOpacity
                  key={t}
                  style={[s.typeBtn, form.type === t && {borderColor: c.color, backgroundColor: c.dimColor}]}
                  onPress={() => { setShowVenuePicker(false); setForm(f => ({...f, type: t, venueId:'', maxPlayers: String(c.maxPlayers),
                    title: f.title === '' || Object.values(MATCH_TYPES).some(mt => f.title === `${mt.label} du ${new Date().toLocaleDateString('fr-FR',{weekday:'long'})}`) ? `${c.label} du ${new Date().toLocaleDateString('fr-FR',{weekday:'long'})}` : f.title
                  })); }}
                  accessibilityRole="radio" accessibilityLabel={c.label} accessibilityState={{ selected: form.type === t }}
                >
                  {t === 'five' ? (
                    <View style={{ width: 46, height: 34, borderWidth: 2, borderColor: iconColor, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 22, width: 1.5, backgroundColor: iconColor, opacity: 0.7 }} />
                      <View style={{ position: 'absolute', top: 9, left: 17, width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: iconColor, opacity: 0.6 }} />
                      <View style={{ position: 'absolute', top: 8, bottom: 8, left: 0, width: 7, borderRightWidth: 1.5, borderRightColor: iconColor, opacity: 0.5 }} />
                      <View style={{ position: 'absolute', top: 8, bottom: 8, right: 0, width: 7, borderLeftWidth: 1.5, borderLeftColor: iconColor, opacity: 0.5 }} />
                    </View>
                  ) : t === 'city' ? (
                    <View style={{ width: 42, height: 28, borderWidth: 2, borderColor: iconColor, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 20, width: 1.5, backgroundColor: iconColor, opacity: 0.7 }} />
                      <View style={{ position: 'absolute', top: 7, bottom: 7, left: 0, width: 8, borderRightWidth: 1.5, borderRightColor: iconColor, opacity: 0.5 }} />
                      <View style={{ position: 'absolute', top: 7, bottom: 7, right: 0, width: 8, borderLeftWidth: 1.5, borderLeftColor: iconColor, opacity: 0.5 }} />
                    </View>
                  ) : (
                    <View style={{ width: 46, height: 28, borderWidth: 2, borderColor: iconColor, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 22, width: 1.5, backgroundColor: iconColor, opacity: 0.7 }} />
                      <View style={{ position: 'absolute', top: 9, left: 18, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: iconColor, opacity: 0.6 }} />
                      <View style={{ position: 'absolute', top: 6, bottom: 6, left: 0, width: 10, borderRightWidth: 1.5, borderRightColor: iconColor, opacity: 0.5 }} />
                      <View style={{ position: 'absolute', top: 6, bottom: 6, right: 0, width: 10, borderLeftWidth: 1.5, borderLeftColor: iconColor, opacity: 0.5 }} />
                    </View>
                  )}
                  <Text style={[s.typeBtnLabel, form.type === t && {color: c.color}]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── ÉTAPE 2 : NOM ── */}
          <View style={s.createStepRow}>
            <View style={s.createStepBadge}><Text style={s.createStepBadgeText}>2</Text></View>
            <Text style={s.createStepLabel}>Nom du match</Text>
          </View>
          <View style={s.createInputRow}>
            <Ionicons name="create-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={s.createInput}
              value={form.title}
              onChangeText={v => setForm(f => ({...f, title: v}))}
              placeholder={`Ex: ${cfg.label} du jeudi`}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* ── ÉTAPE 3 : DATE & HEURE ── */}
          <View style={s.createStepRow}>
            <View style={s.createStepBadge}><Text style={s.createStepBadgeText}>3</Text></View>
            <Text style={s.createStepLabel}>Date & Heure</Text>
          </View>

          {/* Dates rapides */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
            <View style={{flexDirection:'row', gap:8, paddingHorizontal:2}}>
              {QUICK_DATES.map(d => (
                <TouchableOpacity
                  key={d.val}
                  style={[s.quickPill, form.date === d.val && s.quickPillActive]}
                  onPress={() => setForm(f => ({...f, date: d.val}))}
                  accessibilityRole="radio" accessibilityLabel={d.label} accessibilityState={{ selected: form.date === d.val }}
                >
                  <Text style={[s.quickPillText, form.date === d.val && s.quickPillTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Heures rapides */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}}>
            <View style={{flexDirection:'row', gap:8, paddingHorizontal:2}}>
              {QUICK_TIMES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.quickPill, form.time === t && s.quickPillActive]}
                  onPress={() => setForm(f => ({...f, time: t}))}
                  accessibilityRole="radio" accessibilityLabel={`Heure ${t}`} accessibilityState={{ selected: form.time === t }}
                >
                  <Text style={[s.quickPillText, form.time === t && s.quickPillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Pickers date / heure — affichage + saisie manuelle dessous */}
          <View style={{flexDirection:'row', gap:10, marginBottom:10}}>
            <View style={s.createPickerBtn}>
              <Text style={s.createPickerIcon}>📅</Text>
              <View style={{flex:1}}>
                <Text style={s.createPickerLabel}>Date</Text>
                <Text style={s.createPickerSub}>{form.date || 'Sélectionner'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
            <View style={s.createPickerBtn}>
              <Text style={s.createPickerIcon}>⏰</Text>
              <View style={{flex:1}}>
                <Text style={s.createPickerLabel}>Heure</Text>
                <Text style={s.createPickerSub}>{form.time || 'Sélectionner'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          </View>
          <View style={{flexDirection:'row', gap:10, marginBottom: Spacing.lg}}>
            <TextInput
              style={[s.input, {flex:1, marginBottom:0}]}
              value={form.date}
              onChangeText={v => setForm(f => ({...f, date: v}))}
              placeholder="JJ/MM/AA"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
            <TextInput
              style={[s.input, {flex:1, marginBottom:0}]}
              value={form.time}
              onChangeText={v => setForm(f => ({...f, time: v}))}
              placeholder="HH:MM"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          {/* ── ÉTAPE 4 : TERRAIN ── */}
          <View style={s.createStepRow}>
            <View style={s.createStepBadge}><Text style={s.createStepBadgeText}>4</Text></View>
            <Text style={s.createStepLabel}>Terrain / Stade</Text>
          </View>
          <Text style={{fontSize:12, color:Colors.textMuted, marginBottom:10}}>
            {form.type === 'five'
              ? 'Base officielle FootMatch : recherche par nom, ville ou adresse.'
              : 'Pour le city et le foot à 11, seuls les terrains proposés puis validés par la communauté apparaissent ici.'}
          </Text>
          <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
            <TouchableOpacity
              style={[s.btn, { flex:1, marginTop:0, paddingVertical:12 }]}
              onPress={() => setShowVenuePicker((prev) => !prev)}
              accessibilityRole="button" accessibilityLabel={showVenuePicker ? 'Fermer la liste des stades' : 'Choisir un stade'}
            >
              <Text style={s.btnText}>{showVenuePicker ? 'Fermer la liste' : 'Choisir un stade'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.venueOption, { flex:1, marginBottom:0, alignItems:'center', justifyContent:'center' }]}
              onPress={() => {
                setVenueForm((prev) => ({ ...prev, types: [form.type], name:'', address:'', city:'' }));
                setScreen('propose_venue');
              }}
              accessibilityRole="button" accessibilityLabel="Proposer un nouveau stade"
            >
              <Text style={[s.venueName, { color: Colors.green }]}>+ Ajouter un stade</Text>
              <Text style={s.venueCity}>Visible avant validation</Text>
            </TouchableOpacity>
          </View>
          {form.venueId ? (
            <View style={[s.venueOption, s.venueOptionActive]}>
              <Text style={[s.venueName, {color: Colors.green}]}>{filteredVenues.find((v: any) => v.id === form.venueId)?.name ?? 'Stade sélectionné'}</Text>
              <Text style={s.venueCity}>{filteredVenues.find((v: any) => v.id === form.venueId)?.city ?? 'Sélection active'}</Text>
            </View>
          ) : null}
          {showVenuePicker && (
            <>
              <View style={{flexDirection:'row', alignItems:'center', backgroundColor:Colors.bg2, borderRadius:Radius.md, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', paddingHorizontal:12, paddingVertical:8, marginBottom:8, gap:8}}>
                <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
                <TextInput
                  style={{flex:1, color:Colors.text, fontSize:14}}
                  value={venueSearch}
                  onChangeText={setVenueSearch}
                  placeholder="Nom, ville ou adresse..."
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              {filteredVenues.slice(0, 8).map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[s.venueOption, form.venueId === v.id && s.venueOptionActive]}
                  onPress={() => { setForm(f => ({...f, venueId: v.id})); setShowVenuePicker(false); }}
                  accessibilityRole="button" accessibilityLabel={`Sélectionner ${v.name}, ${v.city}`}
                >
                  <Text style={[s.venueName, form.venueId === v.id && {color: Colors.green}]}>{v.name}</Text>
                  <Text style={s.venueCity}>{v.city}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          {filteredVenues.length === 0 && (
            <View style={{padding:20, alignItems:'center'}}>
              <Text style={{color:Colors.textMuted, fontSize:13}}>Aucun terrain trouvé — essaie un autre type de match</Text>
            </View>
          )}

          {/* ── ÉTAPE 5 : JOUEURS & PRIX ── */}
          <View style={s.createStepRow}>
            <View style={s.createStepBadge}><Text style={s.createStepBadgeText}>5</Text></View>
            <Text style={s.createStepLabel}>Joueurs & Prix</Text>
          </View>
          <View style={{flexDirection:'row', gap:10, marginBottom: Spacing.sm}}>
            <View style={{flex:1}}>
              <Text style={s.fieldLabel}>Joueurs max</Text>
              <TextInput
                style={s.input}
                value={form.maxPlayers}
                onChangeText={v => setForm(f => ({...f, maxPlayers: v}))}
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={{flex:1}}>
              <Text style={s.fieldLabel}>Prix / joueur (€)</Text>
              <TextInput
                style={s.input}
                value={form.price}
                onChangeText={v => setForm(f => ({...f, price: v.replace(/[^0-9]/g,'') }))}
                keyboardType="numeric"
                placeholder="0 = gratuit"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
          <Text style={[s.switchSub, { marginTop: -6, marginBottom: Spacing.lg }]}>
            {(parseInt(form.price) || 0) === 0 ? '✓ Match gratuit' : `${parseInt(form.price)}€ par joueur`}
          </Text>

          {/* Description */}
          <Text style={s.fieldLabel}>Description (optionnelle)</Text>
          <TextInput
            style={[s.input, {height:70, textAlignVertical:'top'}]}
            value={form.description}
            onChangeText={v => setForm(f => ({...f, description: v}))}
            placeholder="Niveau requis, infos pratiques..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          {/* Match privé */}
          <View style={s.switchRow}>
            <View>
              <Text style={s.switchLabel}>Match privé</Text>
              <Text style={s.switchSub}>Visible uniquement via lien</Text>
            </View>
            <Switch
              value={form.isPrivate}
              onValueChange={v => setForm(f => ({...f, isPrivate: v}))}
              trackColor={{false: Colors.bg3, true: Colors.greenDim}}
              thumbColor={form.isPrivate ? Colors.green : Colors.textMuted}
            />
          </View>

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleCreateMatch} disabled={loading}
            accessibilityRole="button" accessibilityLabel="Publier le match">
            <Text style={s.btnText}>{loading ? 'Publication...' : '🚀 Publier le match'}</Text>
          </TouchableOpacity>
          <View style={{height:60}} />
        </View>
      </ScrollView>
    );
  }

  // ── COMMUNITY CHAT ────────────────────────────────────────────────────────────
  if (screen === 'community_chat') {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS==='ios'?'padding':'height'}>
        <StatusBar barStyle="light-content" />
        <View style={s.subHeader}>
          <TouchableOpacity style={s.backBtn} onPress={()=>setScreen('home')} accessibilityRole="button" accessibilityLabel="Retour"><Ionicons name="chevron-back" size={22} color={Colors.green} /></TouchableOpacity>
          <View style={{alignItems:'center', flex:1}}>
            <Text style={s.subHeaderTitle}>⚽ COMMUNAUTÉ</Text>
            <Text style={{fontSize:11, color:Colors.textMuted, marginTop:2}}>Chat national FootMatch</Text>
          </View>
          <View style={{width:70}} />
        </View>
        {!currentUser ? (
          <View style={{flex:1, alignItems:'center', justifyContent:'center', padding:40, gap:16}}>
            <Text style={{fontSize:48}}>⚽</Text>
            <Text style={{fontSize:20, fontWeight:'900', color:Colors.text, textAlign:'center'}}>Rejoins la communauté</Text>
            <Text style={{fontSize:14, color:Colors.textMuted, textAlign:'center', lineHeight:22}}>Crée un compte gratuit pour accéder au chat communautaire et discuter avec tous les joueurs de France.</Text>
            <TouchableOpacity style={s.btn} onPress={()=>setScreen('register')} accessibilityRole="button" accessibilityLabel="S'inscrire gratuitement">
              <Text style={s.btnText}>S'inscrire gratuitement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={communityMessages}
              keyExtractor={(item)=>item.id}
              contentContainerStyle={{padding:Spacing.xl, gap:8, flexGrow:1}}
              onContentSizeChange={()=>flatListRef.current?.scrollToEnd({animated:true})}
              ListHeaderComponent={
                <View style={{alignItems:'center', marginBottom:16, gap:8}}>
                  <Text style={{fontSize:36}}>⚽</Text>
                  <Text style={{fontSize:16, fontWeight:'900', color:Colors.text}}>Chat FootMatch France</Text>
                  <Text style={{fontSize:11, color:Colors.textMuted, textAlign:'center', lineHeight:17}}>{MODERATION_HINT}</Text>
                  <Text style={{fontSize:12, color:Colors.textMuted, textAlign:'center', lineHeight:18}}>Parle avec des joueurs du monde entier.{'\n'}Respect et fair-play obligatoires 🤝</Text>
                </View>
              }
              ListEmptyComponent={
                <View style={s.chatEmpty}>
                  <Text style={{fontSize:48}}>⚽</Text>
                  <Text style={s.chatEmptyText}>Sois le premier à écrire !</Text>
                </View>
              }
              renderItem={({item})=>{
                const isMe = item.user_id===currentUser?.id;
                return (
                  <View style={[s.msgWrap, isMe&&s.msgWrapMe]}>
                    {!isMe&&<TouchableOpacity onPress={()=>{ setSelectedPlayer(item.user_id); setScreen('player_profile'); }} accessibilityRole="button" accessibilityLabel={`Voir le profil de ${item.user?.pseudo??'ce joueur'}`}><Text style={[s.msgSender,{textDecorationLine:'underline'}]}>{item.user?.pseudo??'?'}</Text></TouchableOpacity>}
                    <TouchableOpacity onLongPress={()=>handleMessageLongPressStoreReady(item, 'community')} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Message" accessibilityHint="Maintenez appuyé pour signaler">
                      <View style={[s.msgBubble, isMe&&s.msgBubbleMe]}>
                        <Text style={[s.msgText, isMe&&s.msgTextMe]}>{item.content}</Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={[s.msgTime, isMe&&s.msgTimeMe]}>{new Date(item.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</Text>
                  </View>
                );
              }}
            />
            <View style={s.chatInput}>
              <TextInput
                style={s.chatInputField}
                value={communityMessage}
                onChangeText={setCommunityMessage}
                placeholder="Ton message à la communauté..."
                placeholderTextColor={Colors.textMuted}
                maxLength={500}
                multiline
                returnKeyType="send"
                onSubmitEditing={sendCommunityMessage}
              />
              <TouchableOpacity
                style={[s.sendBtn,(!communityMessage.trim()||sendingCommunityMsg)&&s.sendBtnDisabled]}
                disabled={!communityMessage.trim()||sendingCommunityMsg}
                onPress={sendCommunityMessage}
                accessibilityRole="button" accessibilityLabel="Envoyer le message à la communauté"
              >
                <Ionicons name="send" size={18} color={(!communityMessage.trim()||sendingCommunityMsg)?Colors.textMuted:'#000'} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────────────────────
  if (screen==='home') {
    const upcoming = matches.filter((m:any)=>new Date(m.scheduled_at)>new Date());
    const urgentMatches = upcoming.filter((m:any)=>m.max_players-m.current_players<=2 && m.max_players-m.current_players>0);
    const heroMatch: any = urgentMatches[0] ?? upcoming.sort((a:any,b:any)=>new Date(a.scheduled_at).getTime()-new Date(b.scheduled_at).getTime())[0];
    const FILTERS = [
      {key:'all',    label:'Tous',       icon:'apps-outline'    as IoniconName },
      {key:'five',   label:'⚡ Five',    icon:'flash-outline'   as IoniconName },
      {key:'city',   label:'🏙️ City',   icon:'grid-outline'    as IoniconName },
      {key:'eleven', label:'⚽ Foot 11', icon:'football-outline'as IoniconName },
      {key:'mine',   label:'📌 Mes matchs',icon:'person-outline'  as IoniconName },
      {key:'urgent', label:'🔥 Urgents', icon:'flash-outline'   as IoniconName },
    ] as {key:string;label:string;icon:IoniconName}[];
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />

        {/* ── HEADER ── */}
        {showSearch?(
          <View style={s.searchHeader}>
            <TextInput ref={searchRef} style={s.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Nom, ville, code postal..." placeholderTextColor={Colors.textMuted} autoFocus returnKeyType="search" />
            <TouchableOpacity onPress={()=>{setShowSearch(false);setSearchQuery('');}} accessibilityRole="button" accessibilityLabel="Annuler la recherche"><Text style={s.searchCancel}>Annuler</Text></TouchableOpacity>
          </View>
        ):(
          <View style={s.homeHeader}>
            <TouchableOpacity onPress={()=>{Alert.alert('💡 Suggestion / Partenariat','Tu as une idée pour améliorer FootMatch ou tu veux devenir partenaire ?\n\nEnvoie-nous un message à : contact@footmatch.app');}} accessibilityRole="button" accessibilityLabel="Faire une suggestion ou devenir partenaire">
              <Text style={{fontSize:11, color:Colors.textMuted, fontWeight:'600'}}>💡 Suggestion</Text>
            </TouchableOpacity>
            <Image source={require('./assets/logo footmatch transparent.png')} style={s.homeLogo} resizeMode="contain" />
            <TouchableOpacity style={s.searchBtn} onPress={()=>{setShowSearch(true);setTimeout(()=>searchRef.current?.focus(),100);}} accessibilityRole="button" accessibilityLabel="Rechercher un match">
              <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── LIVE STATS BAR ── */}
        {!showSearch&&(
          <View style={s.liveBar}>
            <View style={s.liveDotWrap}>
              <Animated.View style={[s.liveDotPulse, {transform:[{scale:pulseAnim}]}]} />
              <View style={s.liveDot} />
            </View>
            <Text style={s.liveBarText}>
              <Text style={s.liveBarCount}>{liveStats.players.toLocaleString('fr-FR')}</Text> joueurs
              {'  ·  '}
              <Text style={s.liveBarCount}>{liveStats.matchesTonight}</Text> match{liveStats.matchesTonight>1?'s':''} ouverts
            </Text>
          </View>
        )}

        {/* ── BANNIÈRE INVITÉ ── */}
        {guestMode&&!showSearch&&(
          <TouchableOpacity style={s.guestBanner} onPress={()=>exitGuestMode()} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Quitter le mode invité et rejoindre la communauté">
            <Ionicons name="eye-outline" size={13} color={Colors.yellow} />
            <Text style={s.guestBannerText}>Mode invité — </Text>
            <Text style={s.guestBannerCta}>Rejoins la communauté →</Text>
          </TouchableOpacity>
        )}

        {/* ── ALERTE NOTATION ── */}
        {!showSearch&&toRateCount>0&&(
          <View style={{alignItems:'center', marginBottom:8}}>
            <TouchableOpacity style={s.rateAlert} onPress={()=>setScreen('profile')} accessibilityRole="button" accessibilityLabel={`${toRateCount} match${toRateCount>1?'s':''} à noter`}>
              <Ionicons name="star" size={13} color={Colors.yellow} />
              <Text style={s.rateAlertText}>{toRateCount} match{toRateCount>1?'s':''} à noter</Text>
              <Ionicons name="chevron-forward" size={13} color={Colors.yellow} />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={s.list} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{loadMatches(true);loadLiveStats();}} tintColor={Colors.green} />}>

          {/* ── HERO CTA ROW ── */}
          {!showSearch&&(
            <View style={s.heroCtas}>
              <TouchableOpacity style={s.heroFind} onPress={()=>setActiveFilter('all')} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Trouver un match près de moi">
                <Ionicons name="search" size={24} color={Colors.green} />
                <Text style={s.heroCtaTitle}>Trouver</Text>
                <Text style={s.heroCtaSub}>un match près de toi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.heroCreate} onPress={()=>requireAuth(()=>setScreen('create'))} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Créer mon propre match">
                <Ionicons name="add-circle" size={24} color={Colors.text} />
                <Text style={s.heroCtaTitle}>Créer</Text>
                <Text style={s.heroCtaSub}>ton propre match</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── HERO MATCH (match à la une) ── */}
          {!showSearch&&heroMatch&&(()=>{
            const hCfg = MATCH_TYPES[heroMatch.type as keyof typeof MATCH_TYPES];
            const hCurrentPlayers = heroMatch.current_players ?? 0;
            const hMaxPlayers = heroMatch.max_players ?? 1;
            const hPct = hCurrentPlayers / hMaxPlayers;
            const hSpotsLeft = Math.max(0, hMaxPlayers - hCurrentPlayers);
            const hIsUrgent = hSpotsLeft > 0 && hSpotsLeft <= 2;
            const hIsJoined = myMatches.includes(heroMatch.id);
            const hDist = userLocation&&heroMatch.venue ? calcDistance(userLocation.latitude,userLocation.longitude,heroMatch.venue.latitude,heroMatch.venue.longitude) : null;
            const hDate = new Date(heroMatch.scheduled_at ?? Date.now());
            const isToday = hDate.toDateString()===new Date().toDateString();
            const timeStr = hDate.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
            return (
              <TouchableOpacity style={s.heroCard} onPress={()=>loadMatchDetail(heroMatch)} activeOpacity={0.88} accessibilityRole="button" accessibilityLabel={`Match à la une : ${heroMatch.title}`}>
                {/* Top row */}
                <View style={s.heroCardTop}>
                  <View style={{flexDirection:'row', gap:6, alignItems:'center'}}>
                    <View style={[s.heroTypeBadge,{backgroundColor:hCfg?.color+'22', borderColor:hCfg?.color+'60'}]}>
                      <Text style={[s.heroTypeBadgeText,{color:hCfg?.color}]}>{hCfg?.emoji} {hCfg?.label}</Text>
                    </View>
                    {hIsUrgent&&(
                      <Animated.View style={[s.urgentFlash, {transform:[{scale:pulseAnim}]}]}>
                        <Text style={s.urgentFlashText}>🔥 URGENT</Text>
                      </Animated.View>
                    )}
                    {isToday&&!hIsUrgent&&(
                      <View style={s.todayBadge}><Text style={s.todayBadgeText}>⚡ CE SOIR</Text></View>
                    )}
                  </View>
                  {hIsJoined&&<View style={s.joinedHeroBadge}><Text style={s.joinedHeroBadgeText}>✓ Inscrit</Text></View>}
                </View>

                {/* Title */}
                <Text style={s.heroCardTitle}>{heroMatch.title}</Text>

                {/* Venue + time */}
                <View style={s.heroCardInfo}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                    <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                    <Text style={s.heroCardInfoText}>{heroMatch.venue?.name??'Terrain'}{hDist?` · ${hDist} km`:''}</Text>
                  </View>
                  <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={s.heroCardInfoText}>{isToday?'Aujourd\'hui':hDate.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'})} à {timeStr}</Text>
                  </View>
                </View>

                {/* Players bar */}
                <View style={s.heroCardPlayers}>
                  <View style={{flex:1}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:5}}>
                      <Text style={s.heroPlayerCount}>{hCurrentPlayers} / {hMaxPlayers} joueurs</Text>
                      {hIsUrgent&&<Text style={{fontSize:12, color:Colors.greenLight, fontWeight:'900'}}>⚡ {hSpotsLeft} place{hSpotsLeft>1?'s':''} restante{hSpotsLeft>1?'s':''} !</Text>}
                    </View>
                    <View style={s.heroBarBg}>
                      <View style={[s.heroBarFill, {width:`${Math.min(hPct*100,100)}%` as any, backgroundColor: hIsUrgent?Colors.greenLight:Colors.green}]} />
                    </View>
                  </View>
                </View>

                {/* CTA */}
                <View style={[s.heroCta, hIsJoined&&{backgroundColor:Colors.greenDim, borderWidth:1, borderColor:Colors.green+'50'}]}>
                  <Text style={[s.heroCtaBtn, hIsJoined&&{color:Colors.green}]}>
                    {hIsJoined?'✓ Inscrit — Voir le match →':'Rejoindre gratuitement →'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })()}

          {/* ── FILTRES ── */}
          {!showSearch&&(
            <View style={s.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                {FILTERS.map((f)=>{
                  const isActive=activeFilter===f.key;
                  return (
                    <TouchableOpacity key={f.key} style={[s.filterChip,isActive&&s.filterChipActive]} onPress={()=>setActiveFilter(f.key)} activeOpacity={0.7} accessibilityRole="tab" accessibilityLabel={f.label} accessibilityState={{ selected: isActive }}>
                      <Text style={[s.filterChipLabel,isActive&&s.filterChipLabelActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── RÉSULTAT RECHERCHE ── */}
          {showSearch&&searchQuery.length>0&&(
            <View style={s.searchResults}>
              <Text style={s.searchResultsText}>{filteredMatches.length} résultat{filteredMatches.length>1?'s':''} pour « {searchQuery} »</Text>
            </View>
          )}

          {/* ── BANNIÈRE FILTRE URGENT (depuis Communauté) ── */}
          {activeFilter==='urgent'&&!showSearch&&(
            <View style={s.urgentBanner}>
              <View style={{flex:1,gap:2}}>
                <Text style={s.urgentBannerTitle}>🔥 Matchs presque complets</Text>
                <Text style={s.urgentBannerSub}>Il manque peu de joueurs — rejoins vite !</Text>
              </View>
              <TouchableOpacity onPress={()=>setActiveFilter('all')} style={s.urgentBannerClose} accessibilityRole="button" accessibilityLabel="Voir tous les matchs">
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── LISTE MATCHS ── */}
          <View style={s.matchListHeader}>
            <Text style={s.matchListTitle}>{showSearch&&searchQuery?'Résultats':activeFilter==='urgent'?'Matchs urgents':activeFilter==='mine'?'Mes matchs':'Matchs disponibles'}</Text>
            <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
              <View style={{width:6,height:6,borderRadius:3,backgroundColor:Colors.green}} />
              <Text style={s.matchListCount}>{filteredMatches.filter((m:any)=>new Date(m.scheduled_at)>new Date()).length}</Text>
            </View>
          </View>

          {!matchesLoaded?(
            <View style={{alignItems:'center', paddingTop:60, gap:12}}>
              <ActivityIndicator color={Colors.green} size="large" />
              <Text style={{color:Colors.textMuted, fontSize:14}}>Chargement des matchs...</Text>
            </View>
          ):filteredMatches.length===0?(
            <View style={s.empty}>
              <Ionicons name={searchQuery?'search-outline':'football-outline'} size={56} color={Colors.textMuted} />
              <Text style={s.emptyTitle}>{searchQuery?'Aucun résultat':'Aucun match'}</Text>
              <Text style={s.emptyText}>{searchQuery?`Aucun match pour "${searchQuery}"`:activeFilter==='mine'?'Tu n\'as rejoint aucun match':'Sois le premier à créer un match !'}</Text>
              {!searchQuery&&<TouchableOpacity style={s.emptyBtn} onPress={()=>requireAuth(()=>setScreen('create'))} accessibilityRole="button" accessibilityLabel="Créer un match"><Text style={s.emptyBtnText}>Créer un match</Text></TouchableOpacity>}
            </View>
          ):filteredMatches.map((m:any)=>{
            const cfg=MATCH_TYPES[m.type as keyof typeof MATCH_TYPES];
            const pct=m.current_players/m.max_players;
            const spotsLeft = Math.max(0, m.max_players - m.current_players);
            const isFull=pct>=1, isJoined=myMatches.includes(m.id);
            const isUrgent=spotsLeft>0&&spotsLeft<=2&&!isFull;
            const isPastMatch=new Date(m.scheduled_at)<new Date();
            const needsRating=isPastMatch&&isJoined&&!myRatings[m.id];
            const dist=userLocation&&m.venue?calcDistance(userLocation.latitude,userLocation.longitude,m.venue.latitude,m.venue.longitude):null;
            const matchDate=new Date(m.scheduled_at);
            const isTodayMatch=matchDate.toDateString()===new Date().toDateString();
            return (
              <TouchableOpacity key={m.id} style={[s.card, isUrgent&&s.cardUrgent, isPastMatch&&s.cardPast]} onPress={()=>loadMatchDetail(m)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${m.title}${isUrgent?' — urgent, il reste peu de places':''}`}>
                {/* Accent bar left */}
                <View style={[s.cardAccent, {backgroundColor: isFull?Colors.bg3:isUrgent?Colors.greenLight:cfg?.color??Colors.green}]} />

                <View style={s.cardContent}>
                  {/* Top row: type badge + status badges */}
                  <View style={s.cardTopRow2}>
                    <View style={[s.cardTypeBadge2, {backgroundColor:cfg?.color+'15', borderColor:cfg?.color+'40'}]}>
                      <Text style={[s.cardTypeBadgeText2, {color:cfg?.color}]}>{cfg?.emoji} {cfg?.label}</Text>
                    </View>
                    <View style={{flexDirection:'row', gap:5, alignItems:'center'}}>
                      {isJoined&&<View style={s.joinedBadge}><Text style={s.joinedBadgeText}>✓</Text></View>}
                      {isUrgent&&(
                        <Animated.View style={[s.urgentBadge2, {transform:[{scale:pulseAnim}], opacity: pulseAnim}]}>
                          <Text style={s.urgentBadge2Text}>URGENT - {spotsLeft} place{spotsLeft>1?'s':''}</Text>
                        </Animated.View>
                      )}
                      {isTodayMatch&&!isPastMatch&&!isUrgent&&<View style={s.tonightBadge}><Text style={s.tonightBadgeText}>CE SOIR</Text></View>}
                      {needsRating&&<View style={s.ratingNeededBadge}><Text style={s.ratingNeededText}>★ Noter</Text></View>}
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={s.cardTitle}>{m.title}</Text>

                  {/* Info row */}
                  <View style={{flexDirection:'row', alignItems:'center', gap:12, marginBottom:10}}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                      <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                      <Text style={s.cardInfoText2}>{m.venue?.name??'Terrain'}{dist?` · ${dist}km`:''}</Text>
                    </View>
                    <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                      <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                      <Text style={s.cardInfoText2}>{isTodayMatch?'Auj.':matchDate.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} {matchDate.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</Text>
                    </View>
                  </View>

                  {/* Players + CTA row */}
                  <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                    <View style={{flex:1}}>
                      <View style={s.cardBarWrap2}>
                        <View style={[s.cardBarFill2, {width:`${Math.min(pct*100,100)}%` as any, backgroundColor:isFull?Colors.bg3:isUrgent?Colors.greenLight:Colors.green}]} />
                      </View>
                      <Text style={s.cardPlayersLabel2}>{m.current_players}/{m.max_players} joueurs</Text>
                    </View>
                    {!isPastMatch&&(
                      <View style={[s.cardCta2, isJoined&&s.cardCta2Joined, isFull&&s.cardCta2Full]}>
                        <Text style={[s.cardCta2Text, isJoined&&{color:Colors.green}, isFull&&{color:Colors.textMuted}]}>
                          {isFull?'Complet':isJoined?'✓ Voir':'Rejoindre →'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{height:130}} />
        </ScrollView>

        <BottomNav active={screen} onNavigate={(s)=>{if(guestMode&&s==='profile'){setShowGuestModal(true);}else{setScreen(s as any);}}} toRateCount={toRateCount} onCreateMatch={()=>requireAuth(()=>setScreen('create'))} />
        <GuestModal visible={showGuestModal} onRegister={()=>exitGuestMode()} onLogin={()=>{setGuestMode(false);setShowGuestModal(false);setScreen('login');}} onClose={()=>setShowGuestModal(false)} />
      </View>
    );
  }

  // ── AUTH ───────────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.container} contentContainerStyle={s.contentPad} keyboardShouldPersistTaps="handled">
      <View style={s.authHero}>
        <Image source={require('./assets/logo footmatch transparent.png')} style={s.authLogo} resizeMode="contain" />
        <Text style={s.authTagline}>La plateforme N°1{'\n'}du football amateur</Text>
        <View style={s.authStatRow}>
          <View style={s.authStat}><Text style={s.authStatN}>+1000</Text><Text style={s.authStatL}>joueurs</Text></View>
          <View style={s.authStatDiv} />
          <View style={s.authStat}><Text style={s.authStatN}>100%</Text><Text style={s.authStatL}>gratuit</Text></View>
          <View style={s.authStatDiv} />
          <View style={s.authStat}><Text style={s.authStatN}>3 formats</Text><Text style={s.authStatL}>de matchs</Text></View>
        </View>
      </View>
      <View style={s.form}>
        <Text style={s.formTitle}>{screen==='login'?'Connexion':'Créer un compte'}</Text>
        {screen==='register'&&<View style={s.field}><Text style={s.fieldLabel}>Pseudo</Text><TextInput style={s.input} value={pseudo} onChangeText={setPseudo} placeholder="TonPseudo" placeholderTextColor={Colors.textMuted} /></View>}
        {screen==='register'&&<View style={s.field}><Text style={s.fieldLabel}>Ville</Text><TextInput style={s.input} value={registerCity} onChangeText={setRegisterCity} placeholder="Paris" placeholderTextColor={Colors.textMuted} /></View>}
        {screen==='register'&&<View style={s.field}><Text style={s.fieldLabel}>Code postal</Text><TextInput style={s.input} value={registerPostalCode} onChangeText={setRegisterPostalCode} placeholder="75011" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" maxLength={5} /></View>}
        <View style={s.field}><Text style={s.fieldLabel}>Email</Text><TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="ton@email.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" /></View>
        <View style={s.field}><Text style={s.fieldLabel}>Mot de passe</Text><TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={Colors.textMuted} secureTextEntry /></View>
        {screen==='register'&&(
          <TouchableOpacity style={s.consentRow} onPress={()=>setConsentGiven(!consentGiven)} activeOpacity={0.7} accessibilityRole="checkbox" accessibilityLabel="Accepter les CGU et la politique de confidentialité" accessibilityState={{ checked: consentGiven }}>
            <View style={[s.checkbox, consentGiven&&s.checkboxChecked]}>
              {consentGiven&&<Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.consentText}>
              {'J\'accepte les '}
              <Text style={s.consentLink} onPress={()=>setScreen('legal')}>CGU</Text>
              {' et la '}
              <Text style={s.consentLink} onPress={()=>setScreen('legal')}>politique de confidentialité</Text>
              {' de FootMatch (13 ans minimum)'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.btn,loading&&s.btnDisabled]} onPress={screen==='login'?handleLogin:handleRegisterStoreReady} disabled={loading}
          accessibilityRole="button" accessibilityLabel={screen==='login'?'Se connecter':"S'inscrire"}>
          <Text style={s.btnText}>{loading?'Chargement...':screen==='login'?'Se connecter':"S'inscrire"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.switchBtn} onPress={()=>setScreen(screen==='login'?'register':'login')} accessibilityRole="button" accessibilityLabel={screen==='login'?"Créer un compte":'Se connecter'}>
          <Text style={s.switchText}>{screen==='login'?"Pas de compte ? S'inscrire":'Déjà un compte ? Se connecter'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.legalFooterBtn} onPress={()=>setScreen('legal')} accessibilityRole="button" accessibilityLabel="Voir la politique de confidentialité et les CGU">
          <Text style={s.legalFooterText}>📄 Politique de confidentialité & CGU</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.guestBtn} onPress={()=>enterGuestMode()} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Continuer en mode invité sans créer de compte">
          <Ionicons name="eye-outline" size={15} color={Colors.textMuted} />
          <Text style={s.guestBtnText}>Continuer en tant qu'invité</Text>
        </TouchableOpacity>
      </View>
      <View style={s.authFeatures}>
        <Text style={s.authFeature}>⚡ Trouve un match en 30 secondes</Text>
        <Text style={s.authFeature}>💬 Chat avec les joueurs</Text>
        <Text style={s.authFeature}>📍 Matchs près de chez toi</Text>
        <Text style={s.authFeature}>⭐ Système de notation fair-play</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:         { flex:1, backgroundColor:Colors.bg },
  contentPad:        { padding:Spacing.xl, paddingTop:60 },
  green:             { color:Colors.green },

  // Invite modal
  inviteOverlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  inviteSheet:       { backgroundColor:Colors.bg2, borderTopLeftRadius:Radius.xl, borderTopRightRadius:Radius.xl, padding:Spacing.xl, paddingBottom:Spacing['2xl']+10, borderTopWidth:1, borderColor:Colors.border },
  inviteHeader:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
  inviteTitle:       { fontSize:18, fontWeight:'800', color:Colors.text },
  inviteSub:         { fontSize:13, color:Colors.textMuted, marginBottom:14 },
  inviteEmpty:       { alignItems:'center', padding:Spacing.xl, gap:10 },
  inviteEmptyText:   { fontSize:13, color:Colors.textMuted, textAlign:'center' },
  inviteCreateBtn:   { marginTop:8, paddingHorizontal:18, paddingVertical:10, borderRadius:Radius.full, backgroundColor:Colors.greenDim, borderWidth:1, borderColor:Colors.greenBorder },
  inviteCreateBtnText:{ fontSize:13, fontWeight:'700', color:Colors.green },
  inviteItem:        { flexDirection:'row', alignItems:'center', gap:10, padding:Spacing.md, backgroundColor:Colors.bg3, borderRadius:Radius.md, marginBottom:8, borderWidth:1, borderColor:Colors.borderSubtle },
  inviteItemTitle:   { fontSize:14, fontWeight:'700', color:Colors.text },
  inviteItemMeta:    { fontSize:11, color:Colors.textMuted, marginTop:2 },
  inviteItemSpots:   { paddingHorizontal:8, paddingVertical:3, borderRadius:Radius.full, backgroundColor:Colors.greenDim, borderWidth:1, borderColor:Colors.greenBorder },
  inviteItemSpotsText:{ fontSize:11, fontWeight:'700', color:Colors.green },

  homeHeader:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.xl, paddingTop:Platform.OS==='ios'?56:40, paddingBottom:12 },
  homeLogo:          { width:220, height:100, position:'absolute', left:0, right:0, alignSelf:'center' },
  homeGreet:         { fontSize:13, color:Colors.textMuted, marginTop:2 },

  // Hero CTAs
  heroCtas:          { flexDirection:'row', gap:10, marginHorizontal:Spacing.xl, marginBottom:16 },
  heroFind:          { flex:1, backgroundColor:Colors.greenDim, borderRadius:Radius.lg, padding:Spacing.md, alignItems:'flex-start', gap:4, borderWidth:1, borderColor:Colors.green+'40', minHeight:100, justifyContent:'center' },
  heroCreate:        { flex:1, backgroundColor:Colors.bg2, borderRadius:Radius.lg, padding:Spacing.md, alignItems:'flex-start', gap:4, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', minHeight:100, justifyContent:'center' },
  heroCtaTitle:      { fontSize:18, fontWeight:'900', color:Colors.text },
  heroCtaSub:        { fontSize:12, color:Colors.textMuted, lineHeight:16 },

  // Urgents section
  urgentPill:        { flexDirection:'row', alignItems:'center', gap:6, marginHorizontal:Spacing.xl, marginBottom:12, backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:8, alignSelf:'flex-start', borderWidth:1, borderColor:Colors.greenBorder },

  // Live stats bar
  liveBar:           { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:Spacing.xl, paddingVertical:8, backgroundColor:'rgba(0,230,118,0.04)', borderBottomWidth:1, borderBottomColor:'rgba(0,230,118,0.08)' },
  liveDotWrap:       { width:14, height:14, alignItems:'center', justifyContent:'center' },
  liveDot:           { width:7, height:7, borderRadius:4, backgroundColor:Colors.green, position:'absolute' },
  liveDotPulse:      { width:14, height:14, borderRadius:7, backgroundColor:'rgba(0,230,118,0.25)', position:'absolute' },
  liveBarText:       { fontSize:12, color:Colors.textMuted, fontWeight:'500' },
  liveBarCount:      { color:Colors.green, fontWeight:'800' },

  // Hero match card
  heroCard:          { marginHorizontal:Spacing.xl, marginBottom:16, marginTop:8, backgroundColor:Colors.bg2, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1.5, borderColor:'rgba(0,230,118,0.20)', overflow:'hidden' },
  heroCardTop:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  heroTypeBadge:     { borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:4, borderWidth:1 },
  heroTypeBadgeText: { fontSize:12, fontWeight:'700' },
  urgentFlash:       { backgroundColor:'rgba(0,230,118,0.15)', borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor:'rgba(0,230,118,0.4)' },
  urgentFlashText:   { fontSize:11, fontWeight:'900', color:Colors.green },
  urgentBanner:      { flexDirection:'row', alignItems:'center', marginHorizontal:Spacing.xl, marginBottom:8, marginTop:4, backgroundColor:'rgba(0,230,118,0.08)', borderRadius:12, borderWidth:1, borderColor:'rgba(0,230,118,0.25)', paddingHorizontal:14, paddingVertical:10 },
  urgentBannerTitle: { fontSize:14, fontWeight:'800', color:Colors.green },
  urgentBannerSub:   { fontSize:12, color:Colors.textMuted },
  urgentBannerClose: { padding:4 },
  todayBadge:        { backgroundColor:'rgba(0,230,118,0.10)', borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor:'rgba(0,230,118,0.25)' },
  todayBadgeText:    { fontSize:11, fontWeight:'800', color:Colors.greenLight },
  joinedHeroBadge:   { backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:3, borderWidth:1, borderColor:Colors.green+'40' },
  joinedHeroBadgeText: { fontSize:11, fontWeight:'700', color:Colors.green },
  heroCardTitle:     { fontSize:20, fontWeight:'900', color:Colors.text, marginBottom:8, lineHeight:26 },
  heroCardInfo:      { gap:5, marginBottom:12 },
  heroCardInfoText:  { fontSize:12, color:Colors.textMuted, fontWeight:'500' },
  heroCardPlayers:   { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  heroPlayerCount:   { fontSize:13, fontWeight:'700', color:Colors.text },
  heroBarBg:         { height:5, backgroundColor:Colors.bg3, borderRadius:3, overflow:'hidden' },
  heroBarFill:       { height:5, borderRadius:3 },
  heroCta:           { backgroundColor:Colors.green, borderRadius:Radius.full, paddingVertical:12, alignItems:'center' },
  heroCtaBtn:        { fontSize:15, fontWeight:'900', color:'#000' },

  // Premium match cards
  cardAccent:        { width:4, borderRadius:4, alignSelf:'stretch', marginRight:12 },
  cardTopRow2:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  cardTypeBadge2:    { borderRadius:Radius.full, paddingHorizontal:9, paddingVertical:3, borderWidth:1 },
  cardTypeBadgeText2:{ fontSize:11, fontWeight:'700' },
  urgentBadge2:      { backgroundColor:'rgba(0,230,118,0.22)', borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:4, borderWidth:1.5, borderColor:'rgba(0,230,118,0.85)', shadowColor:Colors.green, shadowOpacity:0.4, shadowRadius:10, elevation:5 },
  urgentBadge2Text:  { fontSize:11, fontWeight:'900', color:Colors.greenLight, letterSpacing:0.3 },
  tonightBadge:      { backgroundColor:'rgba(0,230,118,0.08)', borderRadius:Radius.full, paddingHorizontal:7, paddingVertical:2 },
  tonightBadgeText:  { fontSize:9, fontWeight:'800', color:Colors.greenLight, letterSpacing:0.5 },
  cardInfoText2:     { fontSize:11, color:Colors.textMuted, fontWeight:'500' },
  cardBarWrap2:      { height:4, backgroundColor:Colors.bg3, borderRadius:2, overflow:'hidden', marginBottom:4 },
  cardBarFill2:      { height:4, borderRadius:2 },
  cardPlayersLabel2: { fontSize:11, color:Colors.textMuted, fontWeight:'600' },
  cardCta2:          { backgroundColor:Colors.green, borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:8 },
  cardCta2Joined:    { backgroundColor:Colors.greenDim, borderWidth:1, borderColor:Colors.green+'40' },
  cardCta2Full:      { backgroundColor:Colors.bg3 },
  cardCta2Text:      { fontSize:12, fontWeight:'800', color:'#000' },
  urgentPillText:    { fontSize:13, fontWeight:'700', color:Colors.green, flex:1 },
  urgentCardTitle:   { fontSize:14, fontWeight:'700', color:Colors.text },
  urgentCardVenue:   { fontSize:12, color:Colors.textMuted },
  urgentCardFooter:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  urgentCardTime:    { fontSize:11, color:Colors.textMuted },
  urgentSpot:        { backgroundColor:Colors.greenDark, borderRadius:8, paddingHorizontal:7, paddingVertical:2 },
  urgentSpotText:    { fontSize:10, fontWeight:'800', color:'#fff' },

  // Match list header
  matchListHeader:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginHorizontal:Spacing.xl, marginBottom:10, marginTop:4 },
  matchListTitle:    { fontSize:16, fontWeight:'800', color:Colors.text },
  matchListCount:    { fontSize:13, fontWeight:'700', color:Colors.green },

  // Nouvelle carte match
  cardTopRow:        { flexDirection:'row', alignItems:'center', gap:6, marginBottom:6 },
  cardTimeLabel:     { fontSize:11, color:Colors.textMuted, fontWeight:'600' },
  cardInfoRow:       { flexDirection:'row', alignItems:'center', gap:4, marginBottom:8 },
  cardInfoText:      { fontSize:12, color:Colors.textMuted },
  cardInfoSep:       { fontSize:12, color:Colors.textMuted, marginHorizontal:2 },
  cardPlayersRow:    { flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 },
  cardBarWrap:       { width:'65%', height:4, backgroundColor:Colors.bg3, borderRadius:2, overflow:'hidden' },
  cardBarFill:       { height:4, borderRadius:2, backgroundColor:Colors.greenDark },
  cardPlayersText:   { fontSize:14, fontWeight:'800', color:Colors.text, minWidth:36, textAlign:'right' },
  cardPlayersMax:    { fontSize:12, fontWeight:'500', color:Colors.textMuted },
  cardCta:           { backgroundColor:Colors.green, borderRadius:Radius.full, paddingVertical:11, paddingHorizontal:28, alignSelf:'center' },
  cardCtaJoined:     { backgroundColor:Colors.greenDim, borderWidth:1, borderColor:Colors.greenBorder },
  cardCtaFull:       { backgroundColor:Colors.bg3 },
  cardCtaText:       { fontSize:14, fontWeight:'800', color:'#000' },
  cardCtaTextJoined: { color:Colors.green },

  // Empty state avec bouton
  emptyBtn:          { backgroundColor:Colors.green, borderRadius:Radius.md, paddingHorizontal:24, paddingVertical:12, marginTop:8 },
  emptyBtnText:      { fontSize:15, fontWeight:'800', color:'#000' },
  searchBtn:         { width:46, height:46, borderRadius:23, backgroundColor:Colors.bg3, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', alignItems:'center', justifyContent:'center' },
  searchBtnText:     { fontSize:20 },

  pageHeader:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.xl, paddingTop:56, paddingBottom:16, borderBottomWidth:1, borderBottomColor:Colors.border },
  pageHeaderTitle:   { fontSize:22, fontWeight:'900', color:Colors.text },
  pageHeaderSub:     { fontSize:13, color:Colors.textMuted, fontWeight:'600' },

  subHeader:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.xl, paddingTop:56, paddingBottom:14, borderBottomWidth:1, borderBottomColor:Colors.border },
  subHeaderTitle:    { fontSize:16, fontWeight:'900', color:Colors.text, textTransform:'uppercase', flex:1, textAlign:'center' },
  backBtn:           { minWidth:70 },
  backBtnText:       { color:Colors.green, fontSize:15, fontWeight:'600' },
  shareBtn:          { color:Colors.green, fontSize:14, fontWeight:'600' },
  shareBtnWrap:      { padding:6 },
  shareDetailBtn:    { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:Colors.green, borderRadius:Radius.full, paddingHorizontal:12, paddingVertical:7 },
  shareDetailBtnText:{ fontSize:12, fontWeight:'800', color:'#000' },
  shareNudge:        { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:10, marginBottom:12, borderWidth:1, borderColor:Colors.greenBorder, justifyContent:'center' },
  shareNudgeText:    { fontSize:13, fontWeight:'700', color:Colors.green, flex:1, textAlign:'center' },
  shareProfileBtn:   { flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:Spacing.xl, marginBottom:Spacing.lg, backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingVertical:12, paddingHorizontal:20, justifyContent:'center', borderWidth:1, borderColor:Colors.greenBorder },
  shareProfileBtnText: { fontSize:14, fontWeight:'700', color:Colors.green },

  searchHeader:      { flexDirection:'row', alignItems:'center', paddingHorizontal:Spacing.xl, paddingTop:56, paddingBottom:14, borderBottomWidth:1, borderBottomColor:Colors.border, gap:12 },
  searchInput:       { flex:1, backgroundColor:Colors.bg3, borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:12, color:Colors.text, fontSize:15, borderWidth:1, borderColor:'rgba(255,255,255,0.12)' },
  searchCancel:      { color:Colors.green, fontSize:15, fontWeight:'600' },
  searchResults:     { paddingHorizontal:Spacing.xl, paddingVertical:8, borderBottomWidth:1, borderBottomColor:Colors.borderSubtle },
  searchResultsText: { fontSize:13, color:Colors.textMuted },

  quickStats:        { flexDirection:'row', alignItems:'center', marginHorizontal:Spacing.xl, marginBottom:10, backgroundColor:Colors.bg3, borderRadius:Radius.lg, padding:16, borderWidth:1, borderColor:'rgba(255,255,255,0.12)' },
  quickStat:         { flex:1, alignItems:'center' },
  quickStatN:        { fontSize:24, fontWeight:'900', color:Colors.green },
  quickStatL:        { fontSize:10, color:Colors.textMuted, textTransform:'uppercase', marginTop:2 },
  quickStatDiv:      { width:1, height:32, backgroundColor:Colors.border },

  rateAlert:         { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(255,213,0,0.12)', borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:7, borderWidth:1, borderColor:'rgba(255,213,0,0.3)', alignSelf:'center' },
  rateAlertText:     { fontSize:12, color:Colors.yellow, fontWeight:'700' },

  // ── FILTRES CORRIGÉS ──
  filterContainer:   { height:44, marginBottom:4 },
  filterRow:         { paddingHorizontal:Spacing.xl, alignItems:'center', gap:6, height:44 },
  filterChip:        { flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:9, paddingVertical:5, borderRadius:20, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:Colors.card, height:30 },
  filterChipActive:  { backgroundColor:Colors.green, borderColor:Colors.green },
  filterChipEmoji:   { fontSize:10, lineHeight:14 },
  filterChipLabel:   { fontSize:10, fontWeight:'700', color:Colors.textMuted, textTransform:'uppercase', letterSpacing:0.3 },
  filterChipLabelActive:{ color:'#000' },

  list:              { flex:1, paddingHorizontal:Spacing.xl },
  card:              { backgroundColor:Colors.card, borderRadius:Radius.lg, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', marginBottom:14, overflow:'hidden', flexDirection:'row', padding:0 },
  cardFull:          { opacity:0.7 },
  cardPast:          { opacity:0.5 },
  cardUrgent:        { borderColor:'rgba(0,230,118,0.65)', shadowColor:Colors.green, shadowOpacity:0.22, shadowRadius:14, elevation:6 },
  cardContent:       { flex:1, padding:Spacing.lg, gap:6 },
  cardTypeBadge:     { backgroundColor:Colors.greenDark+'25', borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:5, borderWidth:1, borderColor:Colors.greenDark+'50' },
  cardTypeBadgeText: { fontSize:12, fontWeight:'800', color:Colors.greenDark, textTransform:'uppercase', letterSpacing:0.5 },
  cardStatusRow:     { flexDirection:'row', gap:6, alignItems:'center' },
  cardInfoCenter:    { fontSize:13, color:Colors.textMuted, textAlign:'center', lineHeight:20 },
  cardPlayerBlock:   { alignItems:'center', gap:6, width:'100%' },
  cardPlayersLabel:  { fontSize:12, fontWeight:'600', color:Colors.textMuted },
  cardTop:           { flexDirection:'row', justifyContent:'space-between', padding:Spacing.lg, backgroundColor:Colors.bg3, gap:12 },
  cardLeft:          { flex:1 },
  cardBadgeRow:      { flexDirection:'row', gap:6, marginBottom:8, flexWrap:'wrap' },
  badge:             { alignSelf:'flex-start', paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.full, borderWidth:1 },
  badgeText:         { fontSize:11, fontWeight:'700', textTransform:'uppercase' },
  joinedBadge:       { paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.full, borderWidth:1, borderColor:Colors.greenBorder, backgroundColor:Colors.greenDim },
  joinedBadgeText:   { fontSize:11, fontWeight:'700', color:Colors.green },
  urgentBadge:       { paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.full, borderWidth:1, borderColor:Colors.greenBorder, backgroundColor:Colors.greenDim },
  urgentBadgeText:   { fontSize:11, fontWeight:'700', color:Colors.greenDark },
  ratingNeededBadge: { paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.full, borderWidth:1, borderColor:'rgba(0,230,118,0.10)', backgroundColor:'rgba(0,230,118,0.10)' },
  ratingNeededText:  { fontSize:11, fontWeight:'700', color:Colors.greenLight },
  distPill:          { paddingHorizontal:9, paddingVertical:3, borderRadius:Radius.full, borderWidth:1, borderColor:'rgba(0,255,102,0.3)', backgroundColor:'rgba(0,255,102,0.08)' },
  distPillText:      { fontSize:11, fontWeight:'700', color:Colors.green },
  cardTitle:         { fontSize:17, fontWeight:'900', color:Colors.text, textTransform:'uppercase', marginBottom:3 },
  cardVenue:         { fontSize:13, color:Colors.textMuted, marginBottom:2 },
  cardDate:          { fontSize:13, color:Colors.textMuted },
  cardRating:        { fontSize:12, color:Colors.greenLight, marginTop:3 },
  cardPlayers:       { alignItems:'flex-end' },
  playersN:          { fontSize:30, fontWeight:'900', lineHeight:32 },
  playersTotal:      { fontSize:12, color:Colors.textMuted },
  barBg:             { width:60, height:5, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden', marginTop:4 },
  barFill:           { height:'100%', borderRadius:3 },
  joinBtn:           { backgroundColor:Colors.green, borderRadius:Radius.full, paddingVertical:18, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, flex:1 },
  joinBtnJoined:     { backgroundColor:Colors.greenDim, borderWidth:1, borderColor:Colors.greenBorder },
  joinBtnFull:       { backgroundColor:'rgba(255,255,255,0.06)' },
  joinBtnPast:       { backgroundColor:'rgba(255,255,255,0.04)' },
  joinBtnText:       { color:'#000', fontWeight:'900', fontSize:17, letterSpacing:0.3 },
  joinBtnTextJoined: { color:Colors.green },
  joinBtnTextFull:   { color:Colors.textMuted },

  empty:             { alignItems:'center', paddingTop:80, gap:12 },
  emptyEmoji:        { fontSize:52 },
  emptyTitle:        { fontSize:20, fontWeight:'900', color:Colors.text, textTransform:'uppercase' },
  emptyText:         { fontSize:14, color:Colors.textMuted, textAlign:'center' },

  fab:               { position:'absolute', bottom:96, right:20, width:60, height:60, borderRadius:30, backgroundColor:Colors.green, alignItems:'center', justifyContent:'center', shadowColor:Colors.green, shadowRadius:16, shadowOpacity:0.5, elevation:10 },
  fabEmoji:          { fontSize:28 },

  // ── Create match form ─────────────────────────────────────────────────────
  createHeader:      { flexDirection:'row', alignItems:'center', paddingHorizontal:Spacing.xl, paddingTop:Platform.OS==='ios'?56:40, paddingBottom:Spacing.lg },
  createBackBtn:     { width:40, height:40, alignItems:'center', justifyContent:'center' },
  createHeaderCenter:{ flex:1, alignItems:'center' },
  createHeroTitle:   { fontSize:24, fontWeight:'900', color:Colors.text, textAlign:'center', letterSpacing:-0.3 },
  createHeroSub:     { fontSize:10, fontWeight:'700', color:Colors.textMuted, letterSpacing:2, marginTop:4, textAlign:'center' },
  createBody:        { paddingHorizontal:Spacing.xl },
  createStepRow:     { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12, marginTop:6 },
  createStepBadge:   { width:28, height:28, borderRadius:14, backgroundColor:Colors.green, alignItems:'center', justifyContent:'center' },
  createStepBadgeText:{ color:'#000', fontWeight:'900', fontSize:14 },
  createStepLabel:   { fontSize:17, fontWeight:'800', color:Colors.text },
  createInputRow:    { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:Colors.bg3, borderRadius:Radius.md, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', paddingHorizontal:Spacing.lg, paddingVertical:13, marginBottom:Spacing.lg },
  createInput:       { flex:1, color:Colors.text, fontSize:15 },
  quickPill:         { paddingHorizontal:14, paddingVertical:9, borderRadius:Radius.full, borderWidth:1.5, backgroundColor:Colors.bg2, borderColor:'rgba(255,255,255,0.10)' },
  quickPillActive:   { backgroundColor:Colors.greenDim, borderColor:Colors.green },
  quickPillText:     { fontSize:13, fontWeight:'700', color:Colors.textMuted },
  quickPillTextActive:{ color:Colors.green },
  createPickerBtn:   { flex:1, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:Colors.bg3, borderRadius:Radius.md, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', padding:Spacing.md },
  createPickerIcon:  { fontSize:18 },
  createPickerLabel: { fontSize:10, color:Colors.textMuted, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 },
  createPickerSub:   { fontSize:14, fontWeight:'700', color:Colors.text },
  // ──────────────────────────────────────────────────────────────────────────
  typeRow:           { flexDirection:'row', gap:10, marginBottom:Spacing.lg },
  typeBtn:           { flex:1, backgroundColor:Colors.card, borderWidth:1, borderColor:Colors.borderSubtle, borderRadius:Radius.md, padding:12, alignItems:'center', gap:4 },
  typeBtnEmoji:      { fontSize:22 },
  typeBtnLabel:      { fontSize:12, fontWeight:'700', color:Colors.textMuted },
  venueOption:       { backgroundColor:Colors.bg3, borderRadius:Radius.md, padding:14, marginBottom:8, borderWidth:1, borderColor:Colors.borderSubtle },
  venueOptionActive: { borderColor:Colors.green, backgroundColor:Colors.greenDim },
  venueName:         { fontSize:14, fontWeight:'700', color:Colors.text, textTransform:'uppercase' },
  venueCity:         { fontSize:12, color:Colors.textMuted, marginTop:2 },
  row:               { flexDirection:'row', gap:12 },
  switchRow:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:Colors.card, borderRadius:Radius.md, padding:Spacing.lg, borderWidth:1, borderColor:Colors.borderSubtle, marginBottom:Spacing.lg },
  switchLabel:       { fontSize:15, fontWeight:'600', color:Colors.text },
  switchSub:         { fontSize:12, color:Colors.textMuted, marginTop:2 },
  form:              { backgroundColor:Colors.card, borderRadius:Radius.xl, padding:Spacing['2xl'], borderWidth:1, borderColor:Colors.borderSubtle },
  formTitle:         { fontSize:24, fontWeight:'900', color:Colors.text, textTransform:'uppercase', marginBottom:Spacing.lg },
  field:             { marginBottom:Spacing.md },
  fieldLabel:        { fontSize:11, color:Colors.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:6, fontWeight:'700' },
  input:             { backgroundColor:Colors.bg3, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', borderRadius:Radius.md, paddingHorizontal:Spacing.lg, paddingVertical:14, color:Colors.text, fontSize:15, marginBottom:8 },
  btn:               { backgroundColor:Colors.green, borderRadius:Radius.full, paddingVertical:16, alignItems:'center', marginTop:Spacing.sm },
  btnDisabled:       { opacity:0.6 },
  btnText:           { color:'#000', fontWeight:'900', fontSize:16, textTransform:'uppercase' },
  switchBtn:         { alignItems:'center', marginTop:Spacing.lg },
  switchText:        { color:Colors.green, fontSize:14 },

  infoBox:           { backgroundColor:'rgba(0,230,118,0.10)', borderRadius:Radius.md, padding:14, borderWidth:1, borderColor:'rgba(0,230,118,0.10)', marginBottom:Spacing.lg },
  infoBoxText:       { color:Colors.white, fontSize:13, lineHeight:20 },
  photoPickerRow:    { flexDirection:'row', gap:12, marginBottom:Spacing.lg },
  photoPickerBtn:    { flex:1, backgroundColor:Colors.bg3, borderWidth:1, borderColor:Colors.borderSubtle, borderRadius:Radius.lg, padding:20, alignItems:'center', gap:6 },
  photoPickerEmoji:  { fontSize:28 },
  photoPickerText:   { fontSize:13, color:Colors.textMuted, fontWeight:'600' },
  photoPreviewContainer:{ marginBottom:Spacing.lg, borderRadius:Radius.lg, overflow:'hidden', position:'relative' },
  photoPreview:      { width:'100%', height:180, borderRadius:Radius.lg },
  photoRemoveBtn:    { position:'absolute', top:8, right:8, backgroundColor:'rgba(0,0,0,0.7)', borderRadius:Radius.full, paddingHorizontal:12, paddingVertical:6 },
  photoRemoveBtnText:{ color:'#fff', fontSize:12, fontWeight:'700' },

  venueCard:         { backgroundColor:Colors.card, borderRadius:Radius.lg, padding:Spacing.lg, borderWidth:1, borderColor:Colors.borderSubtle, marginBottom:12, overflow:'hidden' },
  venueCardPhoto:    { width:'100%', height:140, borderRadius:Radius.md, marginBottom:10 },
  venueCardHeader:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
  venueCardName:     { fontSize:16, fontWeight:'900', color:Colors.text, textTransform:'uppercase', flex:1 },
  venueCardAddress:  { fontSize:12, color:Colors.textMuted, marginBottom:8 },
  venueCardDesc:     { fontSize:13, color:Colors.textMuted, marginBottom:8, fontStyle:'italic' },
  venueCardTypes:    { flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:8 },
  venueCardVotes:    { fontSize:12, color:Colors.textMuted },
  venueCardProposer: { fontSize:11, color:Colors.textMuted, marginTop:6 },
  validatedBadge:    { backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:3, borderWidth:1, borderColor:Colors.greenBorder },
  validatedBadgeText:{ fontSize:11, color:Colors.green, fontWeight:'700' },
  pendingBadge:      { backgroundColor:'rgba(0,230,118,0.10)', borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:3, borderWidth:1, borderColor:Colors.greenBorder },
  pendingBadgeText:  { fontSize:11, color:Colors.greenLight, fontWeight:'700' },
  voteProgressBg:    { height:6, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', marginBottom:4, marginTop:8 },
  voteProgressFill:  { height:'100%', backgroundColor:Colors.green, borderRadius:3 },
  voteProgressText:  { fontSize:11, color:Colors.textMuted, marginBottom:10 },
  voteRow:           { flexDirection:'row', gap:8, marginTop:4 },
  voteBtn:           { flex:1, paddingVertical:11, borderRadius:Radius.full, borderWidth:1, borderColor:Colors.borderSubtle, alignItems:'center', backgroundColor:Colors.bg3 },
  voteBtnYesActive:  { backgroundColor:Colors.green, borderColor:Colors.green },
  voteBtnNoActive:   { backgroundColor:Colors.greenDark, borderColor:Colors.greenDark },
  voteBtnText:       { fontSize:13, fontWeight:'700', color:Colors.textMuted },
  ownerNote:         { fontSize:12, color:Colors.textMuted, textAlign:'center', marginTop:8, fontStyle:'italic' },
  proposeBtn:        { backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:Colors.greenBorder },
  proposeBtnText:    { color:Colors.green, fontWeight:'700', fontSize:13 },

  detailTitle:       { fontSize:26, fontWeight:'900', color:Colors.text, textTransform:'uppercase', marginBottom:8 },
  avgRating:         { flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 },
  avgRatingStars:    { fontSize:16 },
  avgRatingText:     { fontSize:13, color:Colors.textMuted },
  detailStats:       { flexDirection:'row', backgroundColor:Colors.bg3, borderRadius:Radius.lg, padding:Spacing.lg, borderWidth:1, borderColor:Colors.borderSubtle, marginBottom:12 },
  detailStat:        { flex:1, alignItems:'center' },
  detailStatN:       { fontSize:22, fontWeight:'900', color:Colors.green },
  detailStatL:       { fontSize:11, color:Colors.textMuted, textAlign:'center', marginTop:2 },
  heroStatDiv:       { width:1, height:36, backgroundColor:Colors.border },
  barBgLarge:        { height:8, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden', marginBottom:16 },
  barFillLarge:      { height:'100%', borderRadius:4 },
  infoCard:          { backgroundColor:Colors.card, borderRadius:Radius.lg, padding:Spacing.lg, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', marginBottom:16 },
  infoRow:           { flexDirection:'row', gap:12, paddingVertical:12, borderBottomWidth:1, borderBottomColor:Colors.borderSubtle },
  infoIcon:          { fontSize:20, width:28 },
  infoLabel:         { fontSize:11, color:Colors.textMuted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 },
  infoValue:         { fontSize:14, color:Colors.text, fontWeight:'600' },
  infoSub:           { fontSize:12, color:Colors.textMuted, marginTop:1 },
  chatBtn:           { backgroundColor:Colors.green, borderRadius:Radius.full, paddingVertical:14, paddingHorizontal:28, alignItems:'center', alignSelf:'center', marginBottom:16 },
  chatBtnText:       { color:'#000', fontWeight:'900', fontSize:15 },
  ratingBox:         { backgroundColor:Colors.bg2, borderRadius:Radius.lg, padding:Spacing.xl, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', marginBottom:Spacing.lg },
  ratingBoxDone:     { borderColor:Colors.green+'40', backgroundColor:Colors.greenDim },
  ratingTitle:       { fontSize:18, fontWeight:'900', color:Colors.text, marginBottom:4 },
  ratingSubtitle:    { fontSize:13, color:Colors.textMuted, marginBottom:16, lineHeight:18 },
  starsRow:          { flexDirection:'row', gap:8, marginBottom:10 },
  starBtn:           { padding:4 },
  star:              { fontSize:36, color:'rgba(255,255,255,0.2)' },
  starActive:        { color:Colors.greenLight },
  ratingDone:        { fontSize:13, color:Colors.green, fontWeight:'600' },
  ratingHint:        { fontSize:12, color:Colors.textMuted },
  sectionTitle:      { fontSize:15, fontWeight:'700', color:Colors.text, textTransform:'uppercase', marginBottom:12 },
  playerRow:         { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, borderBottomWidth:1, borderBottomColor:Colors.borderSubtle },
  playerAvatar:      { width:44, height:44, borderRadius:22, backgroundColor:Colors.bg3, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', alignItems:'center', justifyContent:'center' },
  playerAvatarText:  { fontSize:18, fontWeight:'900', color:Colors.green },
  playerName:        { fontSize:15, fontWeight:'700', color:Colors.text, textTransform:'uppercase' },
  playerLevel:       { fontSize:12, color:Colors.textMuted },
  orgaBadge:         { backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:Colors.greenBorder },
  orgaBadgeText:     { fontSize:10, color:Colors.green, fontWeight:'700' },
  meBadge:           { backgroundColor:'rgba(0,230,118,0.10)', borderRadius:Radius.full, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:'rgba(0,230,118,0.10)' },
  meBadgeText:       { fontSize:10, color:Colors.white, fontWeight:'700' },
  detailCTA:         { padding:Spacing.xl, paddingBottom: Platform.OS==='ios'?36:Spacing.xl, borderTopWidth:1, borderTopColor:Colors.border, backgroundColor:Colors.bg, flexDirection:'row' },
  ctaRow:            { flexDirection:'row', gap:10, flex:1 },
  joinBtnBig:        { backgroundColor:Colors.green, borderRadius:Radius.full, paddingVertical:16, alignItems:'center' },
  joinBtnBigText:    { color:'#000', fontWeight:'900', fontSize:17, textTransform:'uppercase' },
  joinBtnMed:        { backgroundColor:Colors.green, borderRadius:Radius.full, paddingVertical:13, paddingHorizontal:28, flex:1, alignItems:'center' },
  joinBtnMedText:    { fontSize:15, fontWeight:'900', color:'#000' },
  leaveBtn:          { backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingVertical:18, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(0,230,118,0.12)' },
  leaveBtnText:      { color:Colors.green, fontWeight:'700', fontSize:15 },
  fullBtn:           { backgroundColor:'rgba(255,255,255,0.06)', borderRadius:Radius.full, paddingVertical:18, alignItems:'center', justifyContent:'center', flex:1 },
  fullBtnText:       { color:Colors.textMuted, fontWeight:'700', fontSize:15 },
  orgaCTA:           { backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingVertical:18, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:8, flex:1, borderWidth:1, borderColor:Colors.greenBorder },
  orgaCTAText:       { color:Colors.green, fontWeight:'700', fontSize:15 },

  profileHeader:     { alignItems:'center', padding:Spacing['2xl'], borderBottomWidth:1, borderBottomColor:Colors.border },
  profileAvatarWrap: { width:90, height:90, borderRadius:45, borderWidth:2.5, alignItems:'center', justifyContent:'center', marginBottom:12, backgroundColor:Colors.bg3, position:'relative' },
  profileAvatarPhoto:{ width:85, height:85, borderRadius:43 },
  profileAvatarEmoji:{ fontSize:42 },
  editAvatarBadge:   { position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:13, backgroundColor:Colors.green, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:Colors.bg },
  editAvatarText:    { fontSize:11 },
  profileName:       { fontSize:24, fontWeight:'900', color:Colors.text, textTransform:'uppercase' },
  profileEmail:      { fontSize:13, color:Colors.textMuted, marginTop:4 },
  levelBadge:        { marginTop:8, backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:5, borderWidth:1, borderColor:Colors.greenBorder },
  levelBadgeText:    { fontSize:13, color:Colors.green, fontWeight:'700' },
  logoutBtn:         { backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'rgba(0,230,118,0.12)' },
  logoutBtnText:     { color:Colors.greenDark, fontWeight:'700', fontSize:12 },

  cardFUTBtn:        { marginHorizontal:Spacing.xl, marginBottom:12, backgroundColor:'rgba(251,191,36,0.08)', borderRadius:Radius.lg, padding:16, borderWidth:1, borderColor:'rgba(251,191,36,0.25)', flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  cardFUTBtnLeft:    { flexDirection:'row', alignItems:'center', gap:12 },
  cardFUTBtnEmoji:   { fontSize:28 },
  cardFUTBtnTitle:   { fontSize:13, fontWeight:'900', color:'#FBBF24', letterSpacing:0.5 },
  cardFUTBtnSub:     { fontSize:11, color:Colors.textMuted, marginTop:2 },
  cardFUTBtnArrow:   { fontSize:18, color:'#FBBF24', fontWeight:'700' },

  streakBanner:      { flexDirection:'row', alignItems:'center', gap:12, marginHorizontal:Spacing.xl, marginBottom:Spacing.lg, backgroundColor:'rgba(0,230,118,0.07)', borderRadius:Radius.lg, padding:Spacing.lg, borderWidth:1, borderColor:'rgba(0,230,118,0.20)' },
  streakFire:        { fontSize:32 },
  streakTitle:       { fontSize:15, fontWeight:'900', color:Colors.green },
  streakSub:         { fontSize:11, color:Colors.textMuted, marginTop:2 },
  streakCount:       { marginLeft:'auto', fontSize:36, fontWeight:'900', color:'rgba(0,230,118,0.25)' },
  statsGrid:         { flexDirection:'row', flexWrap:'wrap', padding:Spacing.xl, gap:10 },
  statCard:          { width:'47%', backgroundColor:Colors.bg3, borderRadius:Radius.lg, padding:14, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', alignItems:'center' },
  statCardN:         { fontSize:32, fontWeight:'900', color:Colors.green },
  statCardL:         { fontSize:11, color:Colors.textMuted, textTransform:'uppercase', textAlign:'center', marginTop:3 },
  advancedStats:     { marginHorizontal:Spacing.xl, backgroundColor:Colors.card, borderRadius:Radius.lg, padding:Spacing.xl, borderWidth:1, borderColor:Colors.borderSubtle, marginBottom:Spacing.xl },
  advancedStatsTitle:{ fontSize:16, fontWeight:'900', color:Colors.text, textTransform:'uppercase', marginBottom:16 },
  statRow:           { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor:Colors.borderSubtle },
  statRowLabel:      { fontSize:13, color:Colors.textMuted },
  statRowValue:      { fontSize:14, fontWeight:'700', color:Colors.text },
  levelProgress:     { marginTop:16 },
  levelProgressTitle:{ fontSize:14, fontWeight:'700', color:Colors.text, marginBottom:12 },
  levelSteps:        { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  levelStep:         { alignItems:'center', gap:4, flex:1 },
  levelDot:          { width:12, height:12, borderRadius:6, backgroundColor:Colors.bg3, borderWidth:2, borderColor:Colors.border },
  levelDotActive:    { backgroundColor:Colors.green, borderColor:Colors.green },
  levelStepText:     { fontSize:9, color:Colors.textMuted, textAlign:'center' },
  levelStepTextActive:{ color:Colors.green, fontWeight:'700' },
  progressBar:       { height:6, backgroundColor:Colors.bg3, borderRadius:3, overflow:'hidden', marginBottom:6 },
  progressFill:      { height:'100%', backgroundColor:Colors.green, borderRadius:3 },
  progressText:      { fontSize:11, color:Colors.textMuted, textAlign:'center' },
  miniCard:          { backgroundColor:Colors.card, borderRadius:Radius.lg, padding:Spacing.lg, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', marginBottom:10 },
  miniCardTitle:     { fontSize:16, fontWeight:'900', color:Colors.text, textTransform:'uppercase', marginTop:6, marginBottom:3 },
  miniCardSub:       { fontSize:12, color:Colors.textMuted, marginBottom:3 },
  miniCardStatus:    { fontSize:12, fontWeight:'700' },
  rateCard:          { flexDirection:'row', alignItems:'center', backgroundColor:Colors.card, borderRadius:Radius.md, padding:14, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', marginBottom:8 },
  rateCardTitle:     { fontSize:14, fontWeight:'700', color:Colors.text, textTransform:'uppercase' },
  rateCardSub:       { fontSize:12, color:Colors.textMuted, marginTop:2 },
  rateCardCta:       { color:Colors.greenLight, fontWeight:'700', fontSize:13 },

  chatLocked:        { flex:1, alignItems:'center', justifyContent:'center', gap:12, padding:40 },
  chatLockedEmoji:   { fontSize:52 },
  chatLockedTitle:   { fontSize:20, fontWeight:'900', color:Colors.text, textTransform:'uppercase' },
  chatLockedText:    { fontSize:14, color:Colors.textMuted, textAlign:'center' },
  chatEmpty:         { flex:1, alignItems:'center', justifyContent:'center', paddingTop:80, gap:10 },
  chatEmptyEmoji:    { fontSize:40 },
  chatEmptyText:     { fontSize:14, color:Colors.textMuted },
  chatInput:         { flexDirection:'row', alignItems:'flex-end', gap:10, paddingHorizontal:Spacing.xl, paddingVertical:12, borderTopWidth:1, borderTopColor:Colors.border, backgroundColor:Colors.bg },
  chatInputField:    { flex:1, backgroundColor:Colors.bg3, borderWidth:1, borderColor:Colors.border, borderRadius:20, paddingHorizontal:16, paddingVertical:10, color:Colors.text, fontSize:14, maxHeight:100 },
  sendBtn:           { width:44, height:44, borderRadius:22, backgroundColor:Colors.green, alignItems:'center', justifyContent:'center' },
  sendBtnDisabled:   { opacity:0.4 },
  sendBtnText:       { fontSize:20, color:'#000', fontWeight:'900' },
  msgWrap:           { alignItems:'flex-start', maxWidth:'80%' },
  msgWrapMe:         { alignSelf:'flex-end', alignItems:'flex-end' },
  msgSender:         { fontSize:11, color:Colors.textMuted, fontWeight:'700', textTransform:'uppercase', marginBottom:3 },
  msgBubble:         { backgroundColor:Colors.bg3, borderRadius:12, borderTopLeftRadius:2, paddingHorizontal:13, paddingVertical:9, borderWidth:1, borderColor:Colors.borderSubtle },
  msgBubbleMe:       { backgroundColor:Colors.greenDim, borderColor:Colors.greenBorder, borderTopLeftRadius:12, borderTopRightRadius:2 },
  msgText:           { fontSize:14, color:Colors.text, lineHeight:20 },
  msgTextMe:         { color:Colors.text },
  msgTime:           { fontSize:10, color:Colors.textMuted, marginTop:3 },
  msgTimeMe:         { textAlign:'right' },

  gpsWarning:        { backgroundColor:Colors.greenDim, padding:12, margin:Spacing.xl, borderRadius:Radius.md, borderWidth:1, borderColor:Colors.greenBorder },
  gpsWarningText:    { color:Colors.greenLight, fontSize:13, textAlign:'center', fontWeight:'600' },
  gpsActive:         { backgroundColor:Colors.greenDim, padding:10, marginHorizontal:Spacing.xl, marginTop:8, borderRadius:Radius.md, borderWidth:1, borderColor:Colors.greenBorder },
  gpsActiveText:     { color:Colors.green, fontSize:12, textAlign:'center', fontWeight:'600' },

  authHero:          { alignItems:'center', paddingTop:60, paddingBottom:32 },
  authLogo:          { width:340, height:155, alignSelf:'center' },
  authTagline:       { fontSize:16, color:Colors.text, fontWeight:'700', marginTop:8, textAlign:'center' },
  authSub:           { fontSize:13, color:Colors.textMuted, marginTop:4 },
  authStatRow:       { flexDirection:'row', alignItems:'center', gap:0, backgroundColor:'rgba(0,230,118,0.06)', borderRadius:Radius.lg, borderWidth:1, borderColor:'rgba(0,230,118,0.12)', paddingVertical:14, paddingHorizontal:8, marginTop:16, width:'100%' },
  authStat:          { flex:1, alignItems:'center', gap:3 },
  authStatN:         { fontSize:16, fontWeight:'900', color:Colors.green },
  authStatL:         { fontSize:10, color:Colors.textMuted, textTransform:'uppercase', letterSpacing:0.5 },
  authStatDiv:       { width:1, height:32, backgroundColor:'rgba(255,255,255,0.08)' },
  authFeatures:      { marginTop:Spacing['2xl'], gap:12, paddingBottom:40 },
  authFeature:       { fontSize:15, color:Colors.textMuted, textAlign:'center' },

  // Radar toggle
  radarToggleBtn:    { borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:7, borderWidth:1.5, borderColor:Colors.border, backgroundColor:Colors.bg2 },
  radarToggleBtnActive:{ borderColor:Colors.green, backgroundColor:Colors.greenDim },
  radarToggleText:   { fontSize:12, fontWeight:'700', color:Colors.textMuted },
  radarToggleTextActive:{ color:Colors.green },

  // Terrains home button
  champHomeBtn:      { width:46, height:46, borderRadius:23, backgroundColor:Colors.bg3, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', alignItems:'center', justifyContent:'center' },
  champHomeBtnText:  { fontSize:20 },

  // Map screen
  mapHeader:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.xl, paddingTop:Platform.OS==='ios'?56:40, paddingBottom:14, backgroundColor:'rgba(13,17,23,0.95)', position:'absolute', top:0, left:0, right:0, zIndex:10 },
  mapHeaderTitle:    { fontSize:20, fontWeight:'800', color:Colors.text },
  gpsChipOn:         { backgroundColor:Colors.greenDim, borderRadius:Radius.full, paddingHorizontal:12, paddingVertical:5, borderWidth:1, borderColor:Colors.greenBorder },
  gpsChipOff:        { backgroundColor:'rgba(0,230,118,0.10)', borderRadius:Radius.full, paddingHorizontal:12, paddingVertical:5, borderWidth:1, borderColor:'rgba(0,230,118,0.10)' },
  gpsChipText:       { fontSize:12, fontWeight:'700', color:Colors.green },
  mapPermissionBanner:{ position:'absolute', top:Platform.OS==='ios'?108:94, left:16, right:16, zIndex:9, backgroundColor:'rgba(8,13,8,0.96)', borderRadius:Radius.lg, padding:12, borderWidth:1, borderColor:Colors.greenBorder, flexDirection:'row', alignItems:'center', gap:10 },
  mapPermissionText: { flex:1, color:Colors.textMuted, fontSize:12, lineHeight:18 },
  mapPermissionBtn:  { backgroundColor:Colors.green, borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:8 },
  mapPermissionBtnText:{ color:'#000', fontSize:12, fontWeight:'900', textTransform:'uppercase' },
  mapPin:            { width:44, height:44, borderRadius:22, borderWidth:2, alignItems:'center', justifyContent:'center' },
  mapPinEmoji:       { fontSize:18 },
  mapPinDot:         { width:6, height:6, borderRadius:3, position:'absolute', bottom:4 },
  mapBottomCard:     { position:'absolute', bottom:80, left:16, right:16, backgroundColor:Colors.bg2, borderRadius:Radius.xl, padding:16, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.5, shadowRadius:16 },
  mapCardHeader:     { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  mapCardCloseBtn:   { marginLeft:'auto' as any, width:28, height:28, borderRadius:14, backgroundColor:Colors.bg3, alignItems:'center', justifyContent:'center' },
  mapCardCloseTxt:   { color:Colors.textMuted, fontSize:12, fontWeight:'700' },
  mapCardTitle:      { fontSize:16, fontWeight:'800', color:Colors.text, marginBottom:4 },
  mapCardSub:        { fontSize:12, color:Colors.textMuted, marginBottom:2 },
  mapCardFooter:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:12, gap:12 },
  mapCardPlayers:    { flex:1, gap:5 },
  mapCardPlayersText:{ fontSize:12, color:Colors.textMuted, fontWeight:'600' },
  mapCardBtn:        { paddingHorizontal:18, paddingVertical:10, borderRadius:Radius.lg },
  mapCardBtnText:    { fontSize:13, fontWeight:'800', color:'#fff' },

  // Consentement inscription
  consentRow:        { flexDirection:'row', alignItems:'flex-start', gap:10, marginBottom:Spacing.lg },
  checkbox:          { width:20, height:20, borderWidth:2, borderColor:'rgba(255,255,255,0.25)', borderRadius:4, alignItems:'center', justifyContent:'center', marginTop:2, flexShrink:0 },
  checkboxChecked:   { borderColor:Colors.green, backgroundColor:Colors.greenDim },
  checkmark:         { color:Colors.green, fontSize:12, fontWeight:'900' },
  consentText:       { flex:1, color:Colors.textMuted, fontSize:12, lineHeight:18 },
  consentLink:       { color:Colors.green, fontWeight:'700' },
  legalFooterBtn:    { alignItems:'center', marginTop:Spacing.md },
  legalFooterText:   { fontSize:12, color:Colors.textDim, fontWeight:'600' },
  guestBtn:          { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7, marginTop:14, paddingVertical:10 },
  guestBtnText:      { fontSize:13, color:Colors.textMuted },
  guestBanner:       { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(0,230,118,0.10)', borderWidth:1, borderColor:'rgba(0,230,118,0.10)', borderRadius:10, paddingHorizontal:14, paddingVertical:8, marginHorizontal:Spacing.xl, marginBottom:8 },
  guestBannerText:   { fontSize:12, color:Colors.greenLight, fontWeight:'700' },
  guestBannerSep:    { width:1, height:12, backgroundColor:'rgba(0,230,118,0.10)' },
  guestBannerCta:    { fontSize:12, color:Colors.greenLight, fontWeight:'600', flex:1, textAlign:'right' },

  // Profil – zone légale et suppression
  dangerZone:        { paddingHorizontal:Spacing.xl, marginBottom:Spacing.xl, gap:12 },
  legalProfileBtn:   { backgroundColor:Colors.bg2, borderRadius:Radius.md, padding:14, alignItems:'center', borderWidth:1, borderColor:Colors.borderSubtle },
  legalProfileBtnText:{ color:Colors.textMuted, fontSize:13, fontWeight:'600' },
  deleteAccountBtn:  { backgroundColor:'rgba(0,230,118,0.12)', borderRadius:Radius.md, padding:14, alignItems:'center', borderWidth:1, borderColor:'rgba(0,230,118,0.12)' },
  deleteAccountBtnText:{ color:Colors.greenDark, fontSize:13, fontWeight:'600' },

  chatHeader:        { flexDirection:'row', alignItems:'center', paddingHorizontal:Spacing.lg, paddingTop:Platform.OS==='ios'?56:44, paddingBottom:12, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.06)', gap:10 },
  chatHeaderCenter:  { flex:1 },
  chatHeaderTitle:   { fontSize:15, fontWeight:'800', color:Colors.text },
  chatHeaderSub:     { fontSize:11, color:Colors.textMuted, marginTop:2 },
  chatShareAddrBtn:  { padding:6 },
  msgBubbleAddr:     { backgroundColor:Colors.greenDim, borderWidth:1, borderColor:Colors.greenBorder },
  msgTextAddr:       { color:Colors.green, fontWeight:'600' },
});




