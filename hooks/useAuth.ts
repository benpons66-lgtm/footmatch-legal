import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { AppUser } from '../types';

const SUPPORT_EMAIL = 'support@footmatch.fr';

interface AuthForm {
  email: string;
  password: string;
  pseudo: string;
  city: string;
  postalCode: string;
  consentGiven: boolean;
}

interface UseAuthReturn {
  // Formulaire
  form: AuthForm;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setPseudo: (v: string) => void;
  setCity: (v: string) => void;
  setPostalCode: (v: string) => void;
  setConsentGiven: (v: boolean) => void;
  // Actions
  loading: boolean;
  handleLogin: () => Promise<void>;
  handleRegister: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleDeleteAccount: () => void;
}

export function useAuth(
  onLoginSuccess: () => void,
  onRegisterSuccess: () => void,
  onLogoutSuccess: () => void,
  ensureCleanContent: (text: string, ctx?: string) => boolean,
): UseAuthReturn {
  const { setCurrentUser } = useStore();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  const form: AuthForm = { email, password, pseudo, city, postalCode, consentGiven };

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(): Promise<void> {
    if (!email || !password) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Erreur', 'Adresse email invalide');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const user: AppUser = {
        id: data.user.id,
        email: data.user.email ?? email,
        pseudo: profile?.pseudo ?? email.split('@')[0],
        level: profile?.level ?? 'D4',
        matchesPlayed: 0,
        matchesCreated: 0,
        reputation_score: profile?.reputation_score ?? 0,
        reputation_rank: profile?.reputation_rank ?? 'D4',
        city: profile?.city,
        postal_code: profile?.postal_code,
        avatar_id: profile?.avatar_id,
        avatar_photo_url: profile?.avatar_photo_url,
        skill: profile?.skill,
      };
      setCurrentUser(user);
      onLoginSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      Alert.alert('Erreur de connexion', message);
    } finally {
      setLoading(false);
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function handleRegister(): Promise<void> {
    if (!email || !password || !pseudo || !city || !postalCode) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Erreur', 'Adresse email invalide');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/^\d{5}$/.test(postalCode.trim())) {
      Alert.alert('Erreur', 'Le code postal doit contenir 5 chiffres');
      return;
    }
    if (!consentGiven) {
      Alert.alert('Erreur', 'Tu dois accepter les CGU et la politique de confidentialité pour créer un compte.');
      return;
    }
    if (!ensureCleanContent(pseudo, 'ce pseudo')) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            pseudo,
            city: city.trim(),
            postal_code: postalCode.trim(),
          },
        },
      });
      if (error) throw error;
      Alert.alert('Compte créé !', 'Tu peux maintenant te connecter.');
      setCity('');
      setPostalCode('');
      onRegisterSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      Alert.alert('Erreur inscription', message);
    } finally {
      setLoading(false);
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function handleLogout(): Promise<void> {
    await supabase.auth.signOut();
    setCurrentUser(null);
    onLogoutSuccess();
  }

  // ── Delete Account (store-ready — via Edge Function) ──────────────────────
  function handleDeleteAccount(): void {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Ton compte et toutes tes données seront définitivement supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) {
                // Fallback : enregistre la demande de suppression
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from('account_deletion_requests').upsert(
                    {
                      user_id: user.id,
                      email: user.email,
                      reason: 'In-app deletion fallback request',
                    },
                    { onConflict: 'user_id' },
                  );
                }
                throw new Error(
                  `La suppression serveur n'est pas encore déployée. Ta demande a été enregistrée. Contacte aussi ${SUPPORT_EMAIL}.`,
                );
              }
              await supabase.auth.signOut();
              setCurrentUser(null);
              onLogoutSuccess();
              Alert.alert('Compte supprimé', 'Ton compte FootMatch a bien été supprimé.');
            } catch (e: unknown) {
              const message = e instanceof Error ? e.message : 'Erreur inconnue';
              Alert.alert('Erreur', message);
            }
          },
        },
      ],
    );
  }

  return {
    form,
    setEmail,
    setPassword,
    setPseudo,
    setCity,
    setPostalCode,
    setConsentGiven,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    handleDeleteAccount,
  };
}
