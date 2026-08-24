# CRM Outreach — Guide de déploiement

Ce dossier contient un site web complet et autonome (front-end + petite base de
données partagée) pour ton outil de suivi d'outreach. Une fois déployé, il
aura sa propre adresse (ex: `ton-crm.netlify.app`) que toi et tes VA pouvez
ouvrir directement dans n'importe quel navigateur — plus besoin de passer
par Claude.ai.

Deux étapes : **1)** mettre le code sur GitHub, **2)** connecter GitHub à
Netlify pour qu'il déploie automatiquement. Compte à rebours : environ 10
minutes, aucune ligne de commande à taper.

---

## Étape 1 — Créer un compte GitHub et y mettre le code

1. Va sur [github.com](https://github.com) et crée un compte (gratuit).
2. Une fois connecté, clique sur le **+** en haut à droite → **New repository**.
3. Donne-lui un nom, par exemple `crm-outreach`. Laisse-le en **Public** ou
   **Private** (peu importe). Ne coche aucune case d'initialisation. Clique
   **Create repository**.
4. Sur la page du nouveau repo (vide), clique **uploading an existing file**
   (lien bleu au milieu de la page).
5. Glisse-dépose **tous les fichiers et dossiers de ce projet** dans la zone
   (garde bien la structure : `index.html`, `styles.css`, `app.js`,
   `storage.js`, `package.json`, `netlify.toml`, et le dossier
   `netlify/functions/` avec ses 3 fichiers `.js` dedans).
6. En bas de page, clique **Commit changes**.

Ton code est maintenant sur GitHub.

---

## Étape 2 — Déployer sur Netlify

1. Va sur [netlify.com](https://netlify.com) et crée un compte (gratuit) —
   le plus simple est de cliquer **Sign up with GitHub** pour lier directement
   les deux comptes.
2. Une fois connecté, clique **Add new site** → **Import an existing project**.
3. Choisis **GitHub**, autorise l'accès si demandé, puis sélectionne le repo
   `crm-outreach` que tu viens de créer.
4. Netlify détecte automatiquement `netlify.toml` et propose déjà les bons
   réglages (build command `npm install`, dossier de fonctions
   `netlify/functions`). Ne change rien, clique **Deploy site**.
5. Attends 1 à 2 minutes que le déploiement se termine (statut "Published").
6. Ton site est en ligne à une adresse du type
   `https://un-nom-aleatoire.netlify.app`. Tu peux la personnaliser dans
   **Site settings → Change site name**.

---

## Étape 3 — Premiers pas dans l'outil

1. Ouvre ton adresse `.netlify.app`.
2. Comme c'est la toute première visite, l'outil te propose de **créer le
   compte admin** (email + mot de passe). Il n'y en a qu'un — note bien tes
   identifiants.
3. Une fois connecté, va dans l'onglet **VA** :
   - Colle ton adresse `.netlify.app` dans **URL de l'outil**
   - Ajoute le profil de chaque VA (nom, email, quota…)
   - Clique **"🔑 Générer un code d'invitation"** pour chaque VA, puis
     **"✉ Envoyer l'invitation"** — le code est à usage unique, la VA
     l'utilise pour créer son propre compte (son email + son mot de passe).
4. Ajoute tes techniques et tes comptes comme d'habitude.

Chaque mise à jour de code que tu demanderas ensuite (à moi, dans une
conversation Claude) devra être ré-uploadée sur GitHub (étape 1.5) — Netlify
redéploiera automatiquement en quelques secondes à chaque changement.

---

## Notes techniques

- Les données (comptes, techniques, entrées, VA, formations, commentaires,
  réglages) sont stockées dans **Netlify Blobs**, une base de données
  clé-valeur incluse gratuitement avec ton site Netlify. Tout le monde qui
  ouvre le site voit les mêmes données en temps réel.
- Les comptes (email + mot de passe hashé) et les codes d'invitation sont
  stockés dans un **store Netlify Blobs séparé et non exposé** au front-end
  (`outreach-crm-secrets`) — impossible de les récupérer via l'API de
  données générale. Les mots de passe sont hashés (jamais stockés en clair),
  et la connexion se fait via un jeton signé côté serveur.
- **Limite honnête** : ce n'est pas un système d'authentification de niveau
  entreprise (pas de réinitialisation de mot de passe, pas de 2FA, sessions
  simples). Mais les identifiants et codes d'invitation ne sont jamais
  exposés en clair au navigateur — c'est une vraie amélioration par rapport
  à la version précédente.

