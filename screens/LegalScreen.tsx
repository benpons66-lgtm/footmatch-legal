import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';

const PRIVACY_POLICY = `POLITIQUE DE CONFIDENTIALITE
Derniere mise a jour : mars 2026

1. RESPONSABLE DU TRAITEMENT
FootMatch est une application communautaire de mise en relation sportive destinee a l'organisation de matchs de football amateur.
Contact support : support@footmatch.fr

2. DONNEES COLLECTEES
Nous pouvons collecter :
- adresse e-mail et identifiants de compte
- pseudo, photo de profil et preferences
- position geographique si tu l'autorises
- messages, participations, notes et signalements
- donnees techniques necessaires au fonctionnement et a la securite

3. FINALITES
Tes donnees servent a :
- creer et gerer ton compte
- afficher des matchs et terrains pertinents
- permettre la messagerie, la reputation et la moderation
- envoyer des rappels de match si tu acceptes les notifications
- lutter contre la fraude, le spam et les abus

4. BASES LEGALES
- execution du service
- consentement pour la localisation et les notifications
- interet legitime pour la securite, la moderation et l'amelioration du produit

5. CONSERVATION
Les donnees sont conservees pendant la duree d'activite du compte puis supprimees ou anonymisees selon les obligations legales applicables.

6. SOUS-TRAITANTS
Les services techniques utilises peuvent inclure Supabase pour la base de donnees et l'authentification ainsi qu'Expo/EAS pour la distribution et certaines fonctions techniques.

7. TES DROITS
Tu disposes d'un droit d'acces, de rectification, d'effacement, d'opposition, de limitation et de portabilite dans les conditions prevues par la loi.
Pour exercer tes droits : support@footmatch.fr

8. SECURITE
Les acces sont proteges par authentification. Les communications reseau utilisent le chiffrement en transit. Des outils de moderation et de signalement sont mis en place pour proteger la communaute.

9. MINEURS
FootMatch est reserve aux utilisateurs de 13 ans et plus. Si la loi locale l'exige, l'accord d'un representant legal est necessaire.

10. MISE A JOUR
Cette politique peut evoluer. En cas de changement important, l'application ou la fiche store pourra etre mise a jour.`;

const CGU = `CONDITIONS GENERALES D'UTILISATION
Derniere mise a jour : mars 2026

1. OBJET
FootMatch permet aux joueurs amateurs de football de trouver, creer et rejoindre des matchs et des espaces communautaires lies a leur pratique.

2. ACCES
L'application est accessible sur iOS et Android. Certaines fonctions necessitent un compte FootMatch.

3. REGLES DE CONDUITE
Tu t'engages a :
- respecter les autres utilisateurs
- ne pas publier de contenu illegal, haineux, violent, sexuel non sollicite, discriminatoire ou frauduleux
- ne pas harceler, menacer, spammer ou usurper l'identite d'un tiers
- ne pas perturber le service ni contourner les dispositifs de securite

4. TOLERANCE ZERO
FootMatch applique une politique de tolerance zero sur les contenus et comportements abusifs. Un contenu peut etre masque, supprime, signale ou entrainer la suspension du compte.

5. MODERATION
Les utilisateurs peuvent signaler un contenu ou bloquer un utilisateur depuis l'application. Les signalements sont examines dans les meilleurs delais, avec objectif de traitement rapide pour les abus manifestes.

6. SERVICE DE MISE EN RELATION
FootMatch est un service de mise en relation entre joueurs. Les matchs sont organises entre particuliers. Chaque utilisateur reste responsable de son comportement, de sa securite et du respect des regles locales.

7. CONTENU UTILISATEUR
Tu restes responsable du contenu que tu publies. En l'utilisant dans l'application, tu accordes a FootMatch le droit necessaire de l'afficher, de le moderer et de le retirer en cas d'abus.

8. SUPPRESSION DE COMPTE
Tu peux initier la suppression de ton compte depuis l'ecran Profil. Les donnees personnelles associees au compte sont alors traitees conformement a la politique de confidentialite.

9. CONTACT
Support : support@footmatch.fr

10. DROIT APPLICABLE
Les presentes conditions sont regies par le droit francais.`;

export default function LegalScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'privacy' | 'cgu'>('privacy');

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mentions legales</Text>
        <View style={{ minWidth: 70 }} />
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'privacy' && s.tabActive]} onPress={() => setTab('privacy')}>
          <Text style={[s.tabText, tab === 'privacy' && s.tabTextActive]}>Confidentialite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'cgu' && s.tabActive]} onPress={() => setTab('cgu')}>
          <Text style={[s.tabText, tab === 'cgu' && s.tabTextActive]}>CGU</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.legalText}>{tab === 'privacy' ? PRIVACY_POLICY : CGU}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:    { fontSize: 16, fontWeight: '900', color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  backBtn:        { minWidth: 70 },
  backBtnText:    { color: Colors.green, fontSize: 15, fontWeight: '600' },
  tabs:           { flexDirection: 'row', marginHorizontal: Spacing.xl, marginTop: Spacing.lg, gap: 10 },
  tab:            { flex: 1, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.bg2, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:      { backgroundColor: Colors.greenDim, borderColor: Colors.green },
  tabText:        { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  tabTextActive:  { color: Colors.green },
  scroll:         { flex: 1 },
  scrollContent:  { padding: Spacing.xl, paddingTop: Spacing.lg },
  legalText:      { fontSize: 13, color: Colors.textMuted, lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
