import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import type { Venue, VenueProposal, PhotoAsset, VenueForm, Coordinates } from '../types';
import type { MatchType } from '../constants/theme';

interface UseVenuesReturn {
  venues: Venue[];
  proposals: VenueProposal[];
  myVotes: Record<string, boolean>;
  venuePhoto: PhotoAsset | null;
  setVenuePhoto: (photo: PhotoAsset | null) => void;
  uploadingPhoto: boolean;
  venueForm: VenueForm;
  setVenueForm: React.Dispatch<React.SetStateAction<VenueForm>>;
  loadVenues: (userLocation?: Coordinates | null) => Promise<void>;
  loadProposals: (userId?: string | null) => Promise<void>;
  handleVote: (proposalId: string, vote: boolean, userId: string) => Promise<void>;
  handleProposeVenue: (userId: string, onSuccess: () => void) => Promise<void>;
  pickPhoto: () => Promise<void>;
  takePhoto: () => Promise<void>;
  loading: boolean;
}

export function useVenues(
  ensureCleanContent: (text: string, ctx?: string) => boolean,
): UseVenuesReturn {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [proposals, setProposals] = useState<VenueProposal[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({});
  const [venuePhoto, setVenuePhoto] = useState<PhotoAsset | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [venueForm, setVenueForm] = useState<VenueForm>({
    name: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    types: [],
    description: '',
  });

  // ── Load venues from DB + OSM ──────────────────────────────────────────────
  async function loadVenues(userLocation?: Coordinates | null): Promise<void> {
    const { data } = await supabase.from('venues').select('*').order('name');
    if (data) {
      setVenues(data as Venue[]);
      if (userLocation) {
        enrichVenuesFromOSM(userLocation.latitude, userLocation.longitude, data as Venue[]);
      }
    }
  }

  async function enrichVenuesFromOSM(lat: number, lon: number, existing: Venue[]): Promise<void> {
    try {
      const R = 0.15;
      const bbox = `${lat - R},${lon - R},${lat + R},${lon + R}`;
      const q = `[out:json][timeout:20];(node["name"~"[Ff]ive|[Ff]oot.?5|[Uu]rban.?[Ss]occer|[Cc]ité.?[Ff]oot"](${bbox});way["name"~"[Ff]ive|[Ff]oot.?5|[Uu]rban.?[Ss]occer"](${bbox}););out center;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(q)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!res.ok) return;
      const json = await res.json() as { elements: { id: number; tags?: { name?: string; 'addr:street'?: string; 'addr:housenumber'?: string; 'addr:city'?: string; 'addr:town'?: string }; lat?: number; lon?: number; center?: { lat: number; lon: number } }[] };
      const existingNames = new Set(existing.map((v) => v.name.toLowerCase()));
      const newVenues: Venue[] = json.elements
        .filter((el) => el.tags?.name && !existingNames.has(el.tags.name.toLowerCase()))
        .map((el) => ({
          id: `osm_${el.id}`,
          name: el.tags!.name!,
          address: el.tags!['addr:street']
            ? `${el.tags!['addr:housenumber'] ?? ''} ${el.tags!['addr:street']}`.trim()
            : 'Voir sur la carte',
          city: el.tags!['addr:city'] ?? el.tags!['addr:town'] ?? '',
          latitude: el.lat ?? el.center?.lat,
          longitude: el.lon ?? el.center?.lon,
          types: ['five', 'city'] as MatchType[],
          source: 'osm' as const,
        }))
        .filter((v) => Boolean(v.latitude && v.longitude)) as Venue[];

      if (newVenues.length > 0) {
        setVenues((prev) => [...prev, ...newVenues]);
      }
    } catch {
      // ignore — OSM non critique
    }
  }

  // ── Load proposals + votes ─────────────────────────────────────────────────
  async function loadProposals(userId?: string | null): Promise<void> {
    const { data } = await supabase
      .from('venue_proposals')
      .select('*, proposer:profiles(pseudo)')
      .order('created_at', { ascending: false });
    if (data) setProposals(data as VenueProposal[]);

    if (userId) {
      const { data: votes } = await supabase
        .from('venue_votes')
        .select('proposal_id, vote')
        .eq('user_id', userId);
      if (votes) {
        const v: Record<string, boolean> = {};
        (votes as { proposal_id: string; vote: boolean }[]).forEach((x) => {
          v[x.proposal_id] = x.vote;
        });
        setMyVotes(v);
      }
    }
  }

  // ── Vote ───────────────────────────────────────────────────────────────────
  async function handleVote(proposalId: string, vote: boolean, userId: string): Promise<void> {
    const alreadyVoted = myVotes[proposalId];
    try {
      if (alreadyVoted !== undefined) {
        await supabase
          .from('venue_votes')
          .delete()
          .eq('proposal_id', proposalId)
          .eq('user_id', userId);
        if (alreadyVoted === vote) {
          setMyVotes((prev) => {
            const n = { ...prev };
            delete n[proposalId];
            return n;
          });
          loadProposals(userId);
          return;
        }
      }
      await supabase
        .from('venue_votes')
        .insert({ proposal_id: proposalId, user_id: userId, vote });
      setMyVotes((prev) => ({ ...prev, [proposalId]: vote }));
      loadProposals(userId);
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    }
  }

  // ── Propose venue ──────────────────────────────────────────────────────────
  async function handleProposeVenue(userId: string, onSuccess: () => void): Promise<void> {
    if (!venueForm.name.trim() || !venueForm.address.trim() || !venueForm.city.trim()) {
      Alert.alert('Erreur', "Remplis le nom, l'adresse et la ville");
      return;
    }
    if (venueForm.types.length === 0) {
      Alert.alert('Erreur', 'Choisis au moins un type de terrain');
      return;
    }
    if (!ensureCleanContent(venueForm.name, 'ce nom de terrain')) return;
    if (venueForm.description.trim() && !ensureCleanContent(venueForm.description, 'cette description')) return;

    setLoading(true);
    try {
      let photoUrl: string | null = null;
      if (venuePhoto) photoUrl = await uploadPhoto();

      const { error } = await supabase.from('venue_proposals').insert({
        name: venueForm.name.trim(),
        address: venueForm.address.trim(),
        city: venueForm.city.trim(),
        latitude: venueForm.latitude ? parseFloat(venueForm.latitude) : null,
        longitude: venueForm.longitude ? parseFloat(venueForm.longitude) : null,
        types: venueForm.types,
        description: venueForm.description,
        photo_url: photoUrl,
        proposed_by: userId,
      });
      if (error) throw error;
      Alert.alert('Terrain proposé !', 'La communauté va voter !');
      setVenueForm({ name: '', address: '', city: '', latitude: '', longitude: '', types: [], description: '' });
      setVenuePhoto(null);
      onSuccess();
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  // ── Pick photo from gallery ────────────────────────────────────────────────
  async function pickPhoto(): Promise<void> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setVenuePhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 ?? null });
      }
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    }
  }

  // ── Take photo with camera ─────────────────────────────────────────────────
  async function takePhoto(): Promise<void> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setVenuePhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 ?? null });
      }
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    }
  }

  // ── Upload photo ───────────────────────────────────────────────────────────
  async function uploadPhoto(): Promise<string | null> {
    if (!venuePhoto?.base64) return null;
    setUploadingPhoto(true);
    try {
      const fileName = `venue-${Date.now()}.jpg`;
      const bytes = base64ToUint8Array(venuePhoto.base64);
      const { error } = await supabase.storage
        .from('venue-photos')
        .upload(fileName, bytes, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('venue-photos').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e: unknown) {
      Alert.alert('Erreur upload', e instanceof Error ? e.message : 'Erreur inconnue');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  }

  return {
    venues,
    proposals,
    myVotes,
    venuePhoto,
    setVenuePhoto,
    uploadingPhoto,
    venueForm,
    setVenueForm,
    loadVenues,
    loadProposals,
    handleVote,
    handleProposeVenue,
    pickPhoto,
    takePhoto,
    loading,
  };
}

// ─── Utilitaire base64 → Uint8Array ──────────────────────────────────────────
function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const len = base64.length;
  let bufferLength = Math.ceil((len * 3) / 4);
  if (base64[len - 1] === '=') bufferLength--;
  if (base64[len - 2] === '=') bufferLength--;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[base64.charCodeAt(i)];
    const b = lookup[base64.charCodeAt(i + 1)];
    const c = lookup[base64.charCodeAt(i + 2)];
    const d = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (a << 2) | (b >> 4);
    if (p < bufferLength) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < bufferLength) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes;
}