# OpenClaw Mission Control - Context & Handoff (V2)
**Date/Heure :** 2026-02-23T00:15:00+01:00

Ce document est la version 2.0 de la référence exhaustive pour la suite du développement du front-end "Mission Control" (Sovereign Glass UI) connecté au Gateway OpenClaw. Il intègre toutes les dernières améliorations de synchronisation temps réel, de persistance réseau, et clarifie la gestion des agents.

---

## 1. STACK TECHNIQUE (Versions exactes)
- **Framework React :** React `^18.3.1`, React DOM `^18.3.1`
- **Build Tool :** Vite `^5.4.10`
- **Styling :** TailwindCSS `^3.4.17`
- **Icons :** lucide-react `^0.575.0`
- **Drag & Drop :** @dnd-kit/core `^6.3.1`, @dnd-kit/sortable `^10.0.0`, @dnd-kit/utilities `^3.2.2`
- **Data Viz (Charts) :** recharts `^3.7.0`
- **Animations (CSS uniquement dans UI) :** Tailwind Utilities persos (`@keyframes` complexes dans `index.css`).
- **WebSockets :** `ws ^8.19.0` (côté backend BFF)
- **Auth/Crypto :** Modules Node (crypto, fs, path) - UUID `^13.0.0`

---

## 2. ARCHITECTURE DES FICHIERS & COMPOSANTS
- `src/App.jsx` : Point d'entrée principal. Gère le layout Grid, le chargement, et orchestre le state global. **Intègre désormais l'overlay global "CONNECTION LOST"**.
- `src/hooks/useOpenClaw.js` : Hook centralisé qui gère l'instance `OpenClawClient`. C'est lui qui maintient la connexion WebSocket WS proxyfiée via le BFF, et écoute les événements `presence.updated` et `chat`.
- `src/lib/openclawWs.js` : Classe `OpenClawClient` gérant la reconnexion automatique (`RECONNECTING`), les requêtes RPC (`requestMethod`), et les namespaces d'événements.

### Composants UI Majeurs (`src/components/`)
- `OverviewPanel.jsx` : Tableau de bord stratégique comprenant 6 sous-widgets avec des **zero-states militaires très poussés** (CSS pur : hacker console, radar, load) qui s'affichent par défaut lorsque la liste des agents OpenClaw est vide.
- `TasksPanel.jsx` : Gère le Kanban. **Plugué en temps réel sur le WebSocket :** Le Drag&Drop déclenche un `ws.send({ type: 'UPDATE_TASK_STATUS' })` vers le Gateway, avec un feedback visuel radar de réussite (flash vert de la colonne).
- `CommsConsole.jsx` : Terminal de logs/stream. Reçoit le stream des agents (stdout) via WS. **Les logs sont persistés localement dans le navigateur** via `localStorage` (limités à 200 par agent) avec bouton de purge.
- `Topbar.jsx` : Entête comportant un indicateur de statut réseau dynamique branché sur les états de reconnexion (`CONNECTED`, `CONNECTING`, `RECONNECTING`).

---

## 3. DESIGN TOKENS (CSS / Tailwind)
L'esthétique stricte est **"Sovereign Glass" / Military Tactical UI**.
- **Couleurs principales (`tailwind.config.js` / `index.css`)**
  - `--accent` : `#F59E0B` (Amber/Gold) - Utilisé pour l'accentuation, les textes d'alerte ou le terminal.
  - `bg-background` : `#0A0A0A` (Gris très foncé/Noir)
  - `bg-surface` : `#111111` avec bordures `border-white/5`
  - `text-nominal` : `#10B981` (Vert émeraude - OK)
  - `text-caution` : `#F59E0B` (Amber - Warning / Idle / Reconnecting)
  - `text-critical` : `#E63B2E` (Rouge sang - Error / Connection Lost)
  - `bg-glass` : Faux effet verre avec `backdrop-blur-md` et `bg-black/40`

- **Animations Clés (`index.css`)**
  - `.animate-radar-ping` / `.animate-radar-spin` : Radars.
  - `.animate-decrypt-scan` : Glitch textuel.
  - `.animate-strobe` : Clignotement d'urgence critique.
  - `@keyframes retryProgress` : Barre de progression 5s pour la reconnexion au BFF.

---

## 4. LA CONNEXION WEBSOCKET & LE "BFF"
**Backend-For-Frontend (BFF)** : On utilise `bff-openclaw.js`.
Pourquoi ? Parce que le protocole OpenClaw exige une identité de device (Clé Ed25519 locale + signature) pour la connexion. Garder la clé privée générée côté serveur Node local (`bff-keypair.json`) est plus sûr. Le client React (`localhost:5173`) se connecte silencieusement au BFF (`localhost:4000`), qui lui-même est connecté au Railway (`wss://mxlihiaopenclaw1846.up.railway.app`).

### Nouveautés Réseau & Fiabilité
1. **Overlay d'urgence (Connection Lost)** : Si la connexion BFF flanche, React capte l'Event et bloque l'interface dans un overlay flouté avec un bouton `[ FORCE RECONNECT ]`, empêchant l'opérateur d'agir dans le vide.
2. **WebSocket Task Sync** : Le Kanban n'utilise plus d'API Rest "mock". Dropper une carte envoie l'événement réseau de mise à jour au backend, tout en conservant une fluidité UI en approche "Optimistic".
3. **Persistance** : Le localStorage sauvegarde l'historique du terminal agent par agent (`mxlx_comms_ALPHA`, etc.) et purge les plus vieux si le navigateur manque d'espace.

---

## 5. REPRÉSENTATION DES AGENTS ET LE "ZERO-STATE"
**Important pour tout système IA / Développeur entrant sur le projet :**

1. **Il n'y a STRICTEMENT AUCUN fichier de configuration des agents (`SOUL.md`, `.mission-control/agents/`) dans ce dépôt.**
Ce dépôt React est uniquement le "Command Center" visuel. Il n'héberge pas la logique cérébrale des agents.

2. **L'Interface est vide (Zero-State), c'est normal.**
Actuellement, lorsque l'interface charge, elle lance la requête RPC `agents.list` au Gateway Railway. Comme *aucun agent (NodeJS ou Python) n'est allumé et connecté du côté de Railway*, le Gateway renvoie une liste vide `[]`.
Au lieu d'afficher une erreur, notre UI déclenche ses animations militaires "Awaiting Uplink / Radar Scanning" (Zero-State).

3. **Comment animer l'UI avec des vrais agents ?**
Il faut lancer un script de worker OpenClaw externe, avec sa propre signature, se connectant au *Gateway Railway*.
Dès sa connexion, le Railway émettra sur le WebSocket l'event `presence.updated`. Notre React (via `App.jsx`) écoute cela, mettra à jour son `agentStatus`, la UI sortira automatiquement de son Zero-State, les radars se couperont, et les métriques de l'agent apparaitront !

---

## 6. CE QUI EST BRANCHÉ (Réel) vs SIMULÉ
- **BRANCHÉ (100% Réel) :**
  - Connexion WebSocket / Reconnexions / Overlay de perte de paquet.
  - Liste des Agents (vide si aucun connecté au hub distant).
  - La Comms Console : logs persistants, émission des commandes via WebSocket (avec lock anti-spam).
  - Tasks Board Drag & Drop : Emet sur le WebSocket `UPDATE_TASK_STATUS`.
- **SIMULÉ (Animations Pures) :**
  - Vue `Active Directives` : Affiche une animation infinie "CliBootSequence" de hacker, purement esthétique.
  - Vues "Cognition Load" et "Threat Heatmap" : Affichent des courbes fixes mathématiques (Mock).

---

## 7. CE QUI RESTE À FAIRE
Le Front-End est tactiquement opérationnel et son socle résilient (caching, fallback réseau). La suite logique ne se situe plus obligatoirement dans React :
1. **Création d'un premier Agent OpenClaw (Worker backend)** : Brancher un vrai bot IA (OpenAI/Anthropic) sur le Gateway Railway pour voir l'interface prendre vie.
2. **Implémentation Backend de la réception des tâches** : Côté Railway, il faut lier l'événement `UPDATE_TASK_STATUS` du Kanban à une base de données de tâches réelle.
