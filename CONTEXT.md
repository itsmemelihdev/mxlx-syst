# OpenClaw Mission Control - Context & Handoff
**Date/Heure :** 2026-02-22T23:33:53+01:00

Ce document sert de référence exhaustive pour la suite du développement du front-end "Mission Control" (Sovereign Glass UI) connecté au Gateway OpenClaw.

## 1. STACK TECHNIQUE (Versions exactes)
- **Framework React :** React `^18.3.1`, React DOM `^18.3.1`
- **Build Tool :** Vite `^5.4.10`
- **Styling :** TailwindCSS `^3.4.17`
- **Icons :** lucide-react `^0.575.0`
- **Drag & Drop :** @dnd-kit/core `^6.3.1`, @dnd-kit/sortable `^10.0.0`, @dnd-kit/utilities `^3.2.2`
- **Data Viz (Charts) :** recharts `^3.7.0`
- **Animations (CSS uniquement dans UI) :** gsap `^3.14.2` (installé mais peu utilisé au profit de keyframes purs), Tailwind Utilities persos.
- **Classes Merging :** clsx `^2.1.1`, tailwind-merge `^3.5.0`
- **WebSockets :** `ws ^8.19.0` (côté backend BFF)
- **Auth/Crypto :** Modules Node (crypto, fs, path) - UUID `^13.0.0`

## 2. ARCHITECTURE DES FICHIERS
- `src/App.jsx` : Point d'entrée principal. Gère le layout Grid, le chargement, et orchestre le state global (WebSocket connection, agents, tasks).
- `src/components/`
  - `GlobePanel.jsx` : Affiche le globe terrestre wireframe 3D interactif (via canvas/effets).
  - `TasksPanel.jsx` : Gère l'affichage en mode Kanban des tâches (Utilise dnd-kit pour le drag & drop). A des états d'attente (zero-state).
  - `AgentsPanel.jsx` : Affiche la liste des agents connectés (Atlas, Herald, etc.) avec leur état. Zero-state avec radar.
  - `CommsConsole.jsx` : Terminal de logs/stream. Reçoit le stream des agents (stdout) via de vrais WebSockets depuis le BFF.
  - `OverviewPanel.jsx` : Tableau de bord stratégique comprenant 6 sous-widgets (Pipeline, Cognition Load, Active Directives, Agent Telemetry, Threat Heatmap, System Timeline) avec des zero-states très poussés (CSS purs : hacker console, radar, load).
  - `OpenClawIntegration.jsx` : Interface pour lancer des terminaux spécifiques aux agents.
- `src/index.css` : Contient **toutes** les animations métier (Design Tokens, `@layer utilities`, `animate-radar-ping`, `animate-decrypt-scan`, etc.).
- `bff-openclaw.js` : Backend-For-Frontend (BFF) local. Essentiel. C'est un serveur Node.js/Express intermédiaire qui proxy les WebSockets du React App vers le vrai serveur OpenClaw distant (Railway). Gère la crypto Ed25519 persistante pour l'authentification.

## 3. DESIGN TOKENS (CSS / Tailwind)
L'esthétique stricte est **"Sovereign Glass" / Military Tactical UI**.
- **Couleurs principales (`tailwind.config.js` / `index.css`)**
  - `--accent` : `#F59E0B` (Amber/Gold) - Utilisé pour l'accentuation, les textes d'alerte ou le terminal.
  - `bg-background` : `#0A0A0A` (Gris très foncé/Noir)
  - `bg-surface` : `#111111` avec bordures `border-white/5`
  - `text-nominal` : `#10B981` (Vert émeraude - OK)
  - `text-caution` : `#F59E0B` (Amber - Warning / Idle)
  - `text-critical` : `#E63B2E` (Rouge sang - Error)
  - `bg-glass` : Faux effet verre avec `backdrop-blur-md` et `bg-black/40`
- **Typographie**
  - `font-mono` : Space Mono (Logs, Data, Chiffres)
  - `font-sans` : Inter (Texte courant)
  - `font-heading` : Orbitron (Titres majeurs, Headers tactiques)
- **Effets Globaux**
  - Bruit de fond (TV snow) en `body::before` via SVG turbulence (`opacity: 0.04`).
  - Grille de fond en `body::after` (lignes 1px rgba).
  - Curseur : `cursor-crosshair` forcé sur tous les éléments interactifs.

## 4. DONNÉES FICTIVES (Mock Data temporaire)
Certains widgets d'Overview utilisent des *données fictives injectées dans App.jsx* quand le WebSocket est connecté, pour remplir l'UI.
- **Cognition Load (OverviewPanel) :** Tableau d'objets `[ { time: '00:00', cognition: 45, comms: 20 }, ... ]`.
- **System Timeline (OverviewPanel) :** Tableau d'objets events `[ { time: '14:23:01', type: 'NET', message: 'Uplink established' }, ... ]`.
- **Threat Heatmap (OverviewPanel) :** Tableau d'objets. `[ { sector: 'Alpha', threat: 85, status: 'ELEVATED' }, ... ]`.

## 4.1 DONNÉES RÉELLES (Vraies trames WebSocket depuis BFF)
Lorsque connecté, les événements WebSocket `message` (JSON) reçus ont ce format exact de traitement dans `App.jsx` :
- **AGENTS (`type: 'AGENT_LIST'`) :** Met à jour la liste des agents
  ```json
  {
    "type": "AGENT_LIST",
    "agents": [
      {
         "id": "agent-123",
         "name": "ATLAS",
         "state": "IDLE | ACTIVE | PROCESSING",
         "metrics": { "tokens_processed": 14500, "cpu_load": 42.5 }
      }
    ]
  }
  ```
  *(Note: Dans la V1 réelle d'OpenClaw, la doc API stipule un format agent peut-être légèrement différent, le mapping se fait dans App.jsx !)*

- **TASKS (`type: 'TASK_LIST'`) :** Formatted pour Dnd-Kit.
  Format OpenClaw local mappé vers React :
  ```json
  { "INBOX": [ { "id": "TASK-1", "title": "Analyze log", "assignee": "ATLAS", "priority": "nominal" } ], "IN_PROGRESS": [], ... }
  ```
- **STREAMS (`type: 'STREAM_CHUNK'`) :** Logs texte fluviaux affichés dans CommsConsole.
  ```json
  { "type": "STREAM_CHUNK", "agentId": "ATLAS", "chunk": "Scanning network...\n" }
  ```

## 5. DÉCISIONS TECHNIQUES
- **Backend-For-Frontend (BFF)** : On a choisi d'ajouter `bff-openclaw.js` au lieu de connecter le client React directement au Railway. Pourquoi ? Parce que le protocole OpenClaw exige une identité de device (Clé Ed25519 locale + signature) pour la connexion WebSocket et l'authentification (`VITE_OPENCLAW_GATEWAY_TOKEN`). Garder la clé privée générée côté serveur Node local (`bff-keypair.json`) est plus sûr et évite d'exposer la logique de crypto lourde côté navigateur.
- **Zero-State Animations Complexes** : Plutôt que de mettre des Spinners classiques, tous les composants affichent des animations militaires complexes ("Decrypt Scanner", "Sonar", "Memory Blocks") purement en CSS natif Tailwind `@keyframes` (`index.css`) pour une perf GPU optimisée (0 lag React).
- **State Management** : Vanilla React (`useState`, `useEffect` dans `App.jsx`) poussé via props aux enfants. Pas de Redux pour l'instant pour rester léger.

## 6. CE QUI EST BRANCHÉ (Réel) vs SIMULÉ
- **BRANCHÉ (Réel) :**
  - La connexion WebSocket `ws://localhost:4000` vers le BFF, qui ping en `wss://mxlihiaopenclaw1846.up.railway.app`
  - La liste des Agents (`agents` state dans `App.jsx` est mappé depuis WebSocket).
  - La Comms Console : Mappe de vrais messages (via `emitText` au BFF, qui ping le Gateway distant, et lit la réponse).
- **SIMULÉ (Math.random / Mockups statiques) :**
  - L'animation de boot `CliBootSequence` dans Overview (pur effet visuel setInterval).
  - Les charts de "Cognition Load" et "Threat Heatmap" utilisent de la data hardcodée si elle existe, sinon zero-state effect.

## 7. POINTS D'EXTENSION / OPENCLAW
- **Ajout de commandes Agent** : Les inputs dans `CommsConsole.jsx` ou `OpenClawIntegration` font un simple `.send(JSON.stringify({ type: "INVOKE_AGENT", ... }))`. Il faut enrichir ces payload selon la doc de l'Agent OpenClaw distant.
- **Ajout de nouveaux types UI** : Si l'API Gateway renvoie `type: 'NEW_METRIC'`, il faut ajouter un listener dans le `useEffect` central de `App.jsx` et le dispatcher dans un state.

## 8. CE QUI RESTE À FAIRE (TODO & Backlog)
1. **Création côté Serveur (Railway)** : Il y a actuellement `0` agents enregistrés sur le serveur Gateway Railway. Il faut que l'administrateur OpenClaw configure manuellement un Agent au Gateway pour que la liste des Agents dans l'UI passe de vide (Zero-State) à peuplée.
2. **Task Drag & Drop API Sync** : Dans `TasksPanel.jsx`, on peut drag&drop les tâches entre colonnes (React UI update), mais **l'événement de drop n'envoie pas de mise à jour au WebSocket** ! Il faut cabler le `handleDragEnd` pour envoyer `{ type: 'UPDATE_TASK_STATUS', taskId, newStatus }` au backend.
3. **Persistance des Logs** : Les streams dans CommsConsole disparaissent au refresh de la page.
4. **Error Handling Robuste** : Gérer les deconnexions intempestives du BFF et afficher un gros overlay rouge "CONNECTION LOST" plutôt qu'un zero-state normal.
