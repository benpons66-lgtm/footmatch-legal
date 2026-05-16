---
name: rgpd-compliance
description: Vérifie et applique la conformité RGPD/CNIL pour FootMatch. Utilise ce skill quand Ben parle de RGPD, GDPR, CNIL, données personnelles, consentement, cookies, politique de confidentialité, privacy policy, suppression de compte, droit à l'oubli, portabilité, mineur, tracking, analytics, publicité, App Tracking Transparency, ou quand il dit "est-ce que c'est légal", "conforme", "données utilisateurs", "privacy".
---

# RGPD Compliance — FootMatch

## Contexte
FootMatch traite des données personnelles de joueurs (identité, géoloc, chat, photos). Ben est responsable du traitement. Siège France (Perpignan) → **RGPD + CNIL + loi Informatique et Libertés** s'appliquent.

Documents légaux actuels :
- `legal/PRIVACY_POLICY.md` ✅ publiée (repo GitHub `footmatch-legal`)
- `legal/TERMS_OF_SERVICE.md` ✅ publiée
- `legal/ACCOUNT_DELETION.md` ✅ publiée
- Edge Function `delete-account` ✅ en place
- Email contact DPO : `footmatch.app@proton.me`

## Obligations clés

### Lors de l'inscription / onboarding
1. **Consentement explicite** avant collecte (case à cocher, pas pré-cochée)
2. **Info claire sur** :
   - Qui collecte (Ben / FootMatch)
   - Quoi (email, pseudo, géoloc, photo, chat)
   - Pour quoi (matcher, communauté, réputation)
   - Combien de temps (durée de vie du compte + 30j après suppression)
   - Droits (accès, rectification, suppression, portabilité)
   - Contact DPO : `footmatch.app@proton.me`
3. **Lien vers Privacy Policy** avant validation
4. **Âge minimum** : 13 ans (CNIL recommande 15) → vérification déclarative, consentement parental <15 ans

### Dans l'app en continu
- Bouton "Supprimer mon compte" facilement accessible (Profil → Paramètres)
- Export de mes données (format JSON ou PDF lisible) — droit à la portabilité
- Possibilité de modifier ses données (rectification)
- Consentement géoloc demandé juste avant usage (pas à l'onboarding)
- Consentement notifications push demandé quand pertinent
- Pas de tracking sans consentement ATT (iOS 14.5+)

### Données à traiter comme sensibles
- **Email** : minimal, pas exposé aux autres users
- **Géoloc** : stocker précisément = besoin fort, sinon rayon arrondi
- **Photos** : upload Supabase Storage avec ACL user_id
- **Messages chat** : conservés mais signalés/modérables, purge automatique possible
- **IP + device** : logs 12 mois max (sécurité)

### Données INTERDITES de collecter sans raison légitime forte
- Race, ethnie, religion, orientation sexuelle, opinions politiques
- Santé, handicap
- Numéro de sécurité sociale, carte d'identité (sauf KYC justifié)
- Coordonnées bancaires (passer par Stripe/Apple Pay/Google Pay, jamais stocker)

## Checklist conformité FootMatch

### Code / App
- [ ] Consentement explicite à l'inscription (pas de case pré-cochée)
- [ ] Privacy Policy accessible depuis Profil ET Onboarding
- [ ] Terms of Service accessibles
- [ ] Suppression de compte en 2-3 taps max (sans passer par email)
- [ ] Export des données (user peut télécharger tout ce qu'il a)
- [ ] Permission géoloc demandée just-in-time avec texte clair
- [ ] Permission notifications demandée just-in-time
- [ ] iOS : `NSLocationWhenInUseUsageDescription` dans app.json explicite en français
- [ ] iOS : App Tracking Transparency si tracking tiers activé
- [ ] Android : permissions `ACCESS_FINE_LOCATION` justifiées dans Play Console

### Supabase / Backend
- [ ] Edge Function `delete-account` supprime vraiment (pas de soft delete caché)
- [ ] Cascade ON DELETE sur toutes les tables liées à `auth.users`
- [ ] Storage : suppression des fichiers liés au user
- [ ] Logs nettoyés au bout de 12 mois max
- [ ] Backups : mention dans Privacy Policy de la durée de rétention

### Documents légaux
- [ ] Privacy Policy à jour (nouveau traitement = mise à jour)
- [ ] Terms of Service à jour
- [ ] Liens stables (repo footmatch-legal)
- [ ] Email contact DPO visible partout
- [ ] Mentions légales (si forme juridique = nom, siège, SIREN)

### Stores
- [ ] App Store : "Privacy Labels" remplis (Data Used to Track / Linked / Not Linked)
- [ ] Play Store : "Data Safety" rempli
- [ ] URL Privacy Policy dans les metadata stores

## Patterns de code RGPD

### Consentement à l'inscription
```tsx
const [acceptedTerms, setAcceptedTerms] = useState(false);
const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

// Les deux doivent être TRUE avant validation
<TouchableOpacity onPress={() => setAcceptedTerms(!acceptedTerms)}>
  <Ionicons name={acceptedTerms ? "checkbox" : "square-outline"} />
  <Text>J'accepte les <Text onPress={openTerms}>Conditions</Text></Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}>
  <Ionicons name={acceptedPrivacy ? "checkbox" : "square-outline"} />
  <Text>J'accepte la <Text onPress={openPrivacy}>Politique de confidentialité</Text></Text>
</TouchableOpacity>

<Button disabled={!acceptedTerms || !acceptedPrivacy} onPress={signup} />
```

### Géoloc just-in-time
```tsx
const askLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Localisation requise',
      "Pour te montrer les matchs autour de toi, on a besoin de ta position. Tu peux l'activer dans les réglages du téléphone à tout moment."
    );
    return false;
  }
  return true;
};
```

### Suppression de compte
Le flux doit être :
1. User va dans Profil → Paramètres → "Supprimer mon compte"
2. Confirmation avec texte clair ("Cette action est définitive. Tes matchs, messages, profil seront supprimés.")
3. Re-saisir pseudo ou "SUPPRIMER" pour confirmer
4. Appel Edge Function `delete-account`
5. Déconnexion automatique + retour onboarding

### Export données utilisateur
```tsx
const exportMyData = async () => {
  const { data } = await supabase.rpc('export_user_data', { user_id: userId });
  // Générer JSON + partager via Share API
  await Share.share({
    title: 'Mes données FootMatch',
    message: JSON.stringify(data, null, 2),
  });
};
```

## Workflow d'audit RGPD

### Étape 1 — État des lieux
- Lister TOUTES les données collectées (inscription, usage, analytics)
- Pour chaque donnée : finalité + base légale + durée de conservation

### Étape 2 — Comparer avec Privacy Policy
- Est-ce que tout ce qu'on collecte est listé ?
- Est-ce qu'on collecte des choses non listées ? → à corriger

### Étape 3 — Vérifier les consentements
- Tracer qui a consenti à quoi et quand (table `user_consents` recommandée)

### Étape 4 — Signaler les écarts
Sortir une liste priorisée : bloquant stores / légalement risqué / amélioration.

## Format de réponse

```
🛡️ SCOPE DE L'AUDIT
[Ce que tu as vérifié]

✅ CONFORME
- [liste]

⚠️ À AMÉLIORER
- [liste avec priorité]

🚨 BLOQUANT
- [liste avec impact legal/store]

📝 ACTIONS PROPOSÉES
1. [action concrète]
2. [action concrète]

📊 Score conformité : X/10
```

## Règles de communication
- Toujours en français
- Ne pas donner de conseil juridique définitif ("je ne suis pas avocat, mais...")
- Rappeler que la CNIL fournit des fiches pratiques gratuites
- Proposer des modèles simples plutôt que des jargons légaux
- Si un risque RGPD est sérieux → recommander un audit CNIL ou avocat tech
