---
name: user-feedback
description: Gère les retours utilisateurs FootMatch post-launch (bugs remontés, demandes de features, avis stores, support). Utilise ce skill quand Ben parle de feedback, retour utilisateur, avis, review, étoile, note, bug remonté, demande feature, roadmap, support, FAQ, email utilisateur, triage, priorisation, ou quand il dit "un utilisateur m'a dit", "j'ai un retour", "quelqu'un se plaint", "comment je réponds", "FAQ".
---

# User Feedback — FootMatch

## Contexte
Après le launch, Ben va recevoir :
- **Avis stores** (App Store, Google Play)
- **Emails** sur `footmatch.app@proton.me`
- **DMs** TikTok / Instagram (`@FootMatch.app`)
- **Signalements in-app**
- **Bugs remontés**

Ben est solo, le temps est le premier budget. Il faut un système simple pour trier, prioriser, répondre.

## Règles absolues

1. **Ne jamais promettre une date de livraison** sauf si certaine (préférer "on regarde ça")
2. **Toujours remercier pour le feedback** même négatif
3. **Ne jamais entrer dans un débat public** (avis store, commentaire) → répondre brièvement + inviter à contacter par email
4. **Ne pas partager** des données personnelles d'autres utilisateurs
5. **Signalements** : traités en priorité (modération communauté)

## Système de triage

### Catégories
- 🐛 **BUG** → skill `bug-fixer`
- ✨ **FEATURE REQUEST** → ajouter à roadmap (ne pas dev tout de suite)
- 😡 **INSATISFACTION** → répondre empathie + comprendre le besoin réel
- 💚 **POSITIF / MERCI** → remercier, proposer review store si pas fait
- 🚨 **SIGNALEMENT** → vérifier + appliquer modération
- ❓ **QUESTION / AIDE** → FAQ ou réponse directe
- 💼 **OPPORTUNITÉ** (partenariat, mairie, club) → répondre sérieusement

### Priorité
- **P0** (traiter immédiatement) : crash général, bug qui bloque inscription, signalement de harcèlement, problème légal
- **P1** (sous 48h) : bug qui affecte une feature majeure, avis négatif stores
- **P2** (sous 1 semaine) : bug mineur, amélioration UX
- **P3** (à planifier) : feature request, amélioration non bloquante

## Templates de réponse

### Avis store positif
```
Merci pour ton avis ⚽ ! Heureux que FootMatch t'aide à retrouver des matchs.
Si t'as des idées pour la suite, écris-nous : footmatch.app@proton.me
```

### Avis store négatif (bug)
```
Désolé pour la galère ! Peux-tu nous écrire sur footmatch.app@proton.me avec une description ?
On te répond sous 48h et on corrige rapidement. L'équipe FootMatch.
```

### Avis store négatif (manque de joueurs locaux)
```
Merci pour ton retour ! On grossit ville par ville, partage l'app autour de toi pour accélérer.
Plus on est nombreux, plus c'est facile de trouver des matchs ⚽
```

### Email utilisateur — demande de feature
```
Salut [prénom],

Merci pour la suggestion ! On note l'idée de [feature] dans notre roadmap.
Je ne peux pas te donner de date, mais on priorise avec les autres demandes.

Si tu veux voir les prochaines évolutions, suis-nous sur @FootMatch.app (TikTok/Insta).

À bientôt sur les terrains ⚽
Ben
```

### Email utilisateur — bug
```
Salut [prénom],

Merci pour le signalement. Pour qu'on puisse reproduire :
1. Sur quel téléphone ? (iPhone X / Samsung X)
2. Version de l'app ? (visible dans Profil → À propos)
3. À quel moment ça arrive ? Étape par étape si possible
4. Capture d'écran si possible

On revient vers toi dès qu'on a identifié le problème.
Ben — FootMatch
```

### Signalement harcèlement / insulte
```
Merci d'avoir signalé. On prend ce type de comportement très au sérieux.
Le message et l'utilisateur concerné ont été examinés. Tu peux aussi bloquer [User] directement via son profil (3 points → Bloquer).

Si tu veux un suivi, dis-nous.
L'équipe FootMatch
```

## FAQ FootMatch (à maintenir)

### Q : Comment créer un match ?
R : Bouton vert "+" au milieu de l'app → choisir type (Five / City Stade / Foot 11) → heure, lieu, nombre de places → Créer.

### Q : Comment rejoindre un match ?
R : Onglet "Matchs" → carte ou liste → cliquer sur un match → "Rejoindre".

### Q : Pourquoi mon adresse email est demandée ?
R : Pour la connexion et les notifications importantes (rappel de match, nouveau message). On ne l'envoie jamais à d'autres users.

### Q : Comment supprimer mon compte ?
R : Profil → Paramètres → Supprimer mon compte. Tes données sont effacées immédiatement.

### Q : FootMatch est payant ?
R : Non, 100% gratuit pour la V1. Peut-être des features premium plus tard, mais les basiques resteront gratuits.

### Q : Il n'y a personne dans ma ville, je fais quoi ?
R : Invite tes potes ! FootMatch grandit ville par ville avec sa communauté. Plus vous êtes nombreux, plus c'est efficace.

### Q : Ma position est-elle partagée avec les autres ?
R : Non. Les autres voient seulement la zone approximative du match que tu crées, jamais ta position en temps réel.

### Q : Mon compte a été bloqué, pourquoi ?
R : Écris à footmatch.app@proton.me avec ton pseudo, on regarde ensemble.

## Workflow de traitement

### Étape 1 — Lire le feedback en entier
- Identifier catégorie (bug, feature, etc.)
- Identifier priorité (P0-P3)
- Identifier émotion (agressif, neutre, enthousiaste)

### Étape 2 — Proposer 2-3 réponses à Ben
Jamais de réponse unique → donner choix de ton (formel / décontracté / empathique).

### Étape 3 — Si bug → passer à `bug-fixer`
Ne pas essayer de corriger dans ce skill.

### Étape 4 — Si feature → ajouter à roadmap
Créer / mettre à jour un fichier `ROADMAP.md` ou mémoire projet.

## Format de réponse

```
📨 FEEDBACK REÇU
Source : [App Store / Email / DM / In-app]
Catégorie : [BUG / FEATURE / ...]
Priorité : [P0/P1/P2/P3]
Émotion : [positive / neutre / négative / agressive]

💬 RÉPONSES PROPOSÉES

Version formelle :
[texte]

Version décontractée :
[texte]

Version empathique (si user remonté) :
[texte]

🔄 ACTIONS INTERNES
- [Ajouter bug à traiter ? Feature à roadmap ? Rien ?]
- [Quelqu'un à contacter en interne ?]

📊 Score qualité : X/10
```

## Règles de communication
- Toujours en français
- Humain et chaleureux, jamais robotique
- Proposer plusieurs tons
- Si situation sensible (harcèlement, mineur, données perso), alerter Ben de la priorité
- Ne jamais répondre à la place de Ben sans validation
