# MXLX Syst. Command Center — Handoff Context

Ce document a été généré pour servir de contexte exhaustif à un autre agent IA (Claude ou autre) qui reprendrait le développement du projet "MXLX Syst. Command Center". Il contient toutes les décisions architecturales, techniques et esthétiques (Sovereign Glass).

---

## 1. STACK TECHNIQUE & DÉPENDANCES

Le projet est un SPA React scaffolding via Vite. Versioning exact au moment du handoff :

**Core :**
- `react`: `^18.3.1`
- `react-dom`: `^18.3.1`
- `vite`: `^5.4.10`

**Styling & UI :**
- `tailwindcss`: `3.4.17` (Attention: ne **pas** upgrader à v4. Le projet utilise le système de variables CSS via PostCSS et l'ancien système de config `tailwind.config.js`).
- `postcss`: `^8.5.6`
- `autoprefixer`: `^10.4.24`
- `lucide-react`: `^0.575.0` (Icônes)
- `clsx`: `^2.1.1` & `tailwind-merge`: `^3.5.0` (Installés mais peu utilisés actuellement, utiles pour les futurs composants UI).

**Data Viz & Animations :**
- `recharts`: `^3.7.0` (Utilisé pour le CognitionLoad AreaChart).
- `gsap`: `^3.14.2` (Installé pour des animations complexes si besoin, bien que l'essentiel soit géré en CSS via Tailwind `@keyframes`).

---

## 2. ARCHITECTURE DES FICHIERS & COMPOSANTS

Le projet suit une structure plate de composants fonctionnels :

```
/src
 ├── App.jsx               # Entrypoint, routeur basique (state), layout global (Sidebar + Topbar + Statusbar + Panel actif)
 ├── index.css             # Base CSS : grid overlay (tactical), noise SVG, scrollbars et custom toolkits (.tactical-panel)
 ├── main.jsx              # DOM Mount
 ├── /components
 │   ├── CommsConsole.jsx  # Interface de chat terminal-style. 2 colonnes (Terminal gauche, Contexte Agent droite).
 │   ├── IntelFeed.jsx     # Fil d'actualité log stream situé dans la sidebar droite (débrayable).
 │   ├── OverviewPanel.jsx # Hub principal. Contient 6 widgets: TaskPipeline, CognitionLoad, ActiveDirectives, AgentTelemetry, ThreatHeatmap, SystemTimeline.
 │   ├── Sidebar.jsx       # Roster des agents (gauche) + Navigation + Endpoint Status.
 │   ├── Statusbar.jsx     # Barre inférieure (Ground Truth) avec les métriques globales temps réel.
 │   └── Topbar.jsx        # Barre supérieure avec Horloge UTC et Santé globale du système.
 └── /hooks
     └── useSimulation.js  # CERVEAU TEMPORAIRE. Gère le state management complet via des hooks (useState/useEffect) et un setInterval générant les fausses données.
```

---

## 3. DESIGN TOKENS (SOVEREIGN GLASS SYSTEM)

Le Design System est strict et militaire ("Sovereign Glass"). Aucune image n'est autorisée en dehors du noise SVG global géré en CSS.

**Couleurs Principales (voir `tailwind.config.js`) :**
- `void`: `#050508` (Fond structurel absolu)
- `obsidian`: `#0D0D14` (Fonds de panels type Sidebar/Topbar)
- `surface`: `#12121C` (Surfaces de cartes / widgets)
- `glass`: `#1A1A2E` (Panneaux élevés)
- `--border`: `rgba(255,255,255,0.06)` (Toutes les bordures)
- `accent`: `#F59E0B` (Amber Threat — injecté en `var(--accent)`)
- `nominal`: `#22C55E` (Phosphor Green — tout état "OK")
- `caution`: `#F59E0B` (Yellow/Amber — tout avertissement)
- `critical`: `#E63B2E` (Signal Red — toute erreur critique)

**Typographies (chargées via Google Fonts dans `index.html`) :**
- `font-sans` ("Inter") : Texte de base (`#6B7280`).
- `font-mono` ("Space Mono", "JetBrains Mono") : Métriques, télémétrie, logs (`#9CA3AF`).
- `font-serif` ("DM Serif Display") : Utilisé en italique blanc. Réservé aux noms de code ou Headers (ex: Noms d'agents).
- `font-heading` ("Space Grotesk") : Labels de l'interface, tracking resserré, uppercase (`#E8E4DD`).

**Effets Globaux (`index.css`) :**
- Bruit (Noise) SVG sur le `<body::before>` (fractalNoise).
- Grille tactique SVG sur le `<body::after>` (40x40px transparent linear-gradient).
- Animations génériques: `animate-data-enter` (slide fade-in), `animate-pulse-slow` (2s), `animate-pulse-fast` (1s), `animate-strobe` (0.4s fond rouge agressif).

---

## 4. DONNÉES FICTIVES & FORMATS (Issue de `useSimulation.js`)

Le `useSimulation.js` expose un objet complexe qui pilote toute l'interface. Format attendu pour le backend futur :

**1. `agents` (Statique) & `agentStatus` (Dynamique)**
```javascript
// Structure
{
  id: 'ALPHA',
  name: 'ALPHA',
  role: 'Chief of Staff',
  state: 'IDLE' | 'ACTIVE' | 'PROCESSING',
  activeTask: null,
  tokens: 1450, // Consommation cumulative estimée
  load: 45 // Pourcentage de charge (0-100)
}
```

**2. `systemMetrics`**
```javascript
{
  activeAgents: 2,
  tasksInFlight: 12,
  queueDepth: 5,
  avgResponse: 124, // En ms
  uptime: 450, // En secondes
  globalHealth: {
    ingestion: 'nominal' | 'caution' | 'critical',
    cognition: 'nominal', // etc
    comms: 'nominal'
  }
}
```

**3. `intelFeed` & `timelineEvents`**
```javascript
{
  id: 42,
  time: 1714567890000, // Date.now() timestamp
  severity: 'nominal' | 'caution' | 'critical',
  message: 'Operation initiated on sector 42',
  source: 'SYSTEM' | 'ALPHA', // Agent Name or SYSTEM,
  label: 'E-4512' // Pour la Timeline spécifiquement
}
```

**4. `tasks` (Pipeline Kanban)**
```javascript
{
  INBOX: [
    {
      id: "TSK-A2B4",
      title: "Analyze data packet 451",
      assignee: "FORGE",
      priority: 'nominal' | 'caution' | 'critical'
    }
  ],
  ASSIGNED: [], IN_PROGRESS: [], REVIEW: [], DONE: []
}
```

**5. `cognitionData` (Recharts)**
```javascript
// Array of 60 points representing rolling window
{ time: 1, cognition: 45.2, comms: 12.5 } // Volumes de chargement
```

**6. `heatmap` (Threat zones)**
```javascript
// Array of 49 elements (7x7 grid)
{
  id: 0,
  intensity: 65, // Valeur colorimétrique (0-100)
  category: 'ORCHESTRATION',
  count: 14
}
```

---

## 5. DÉCISIONS TECHNIQUES MAJEURES

1. **State Management :** Pas de Redux / Zustand pour l'instant. Tout le state est centralisé dans le custom hook `useSimulation.js` qui le passe props par props à `<App />`. Quand la connexion WebSocket sera établie, `useSimulation` sera remplacé par un Data Provider Context.
2. **Recharts :** Utilisé car très performant pour du polling `setInterval` à la seconde sans pénaliser le VDOM.
3. **Animations CSS vs GSAP :** Toutes les micro-interactions, pulses et strobe effects sont codés en pur CSS (utilities Tailwind) pour d'excellentes performances. `data-enter` (les objets qui s'ajoutent aux feeds) est un `@keyframes` standard de 0.2s.
4. **Scrolling :** Layout strict sans scroll de page (`body overflow-hidden`). Les scrolls se font *à l'intérieur* de panels spécifiques (ex: Intel Feed, Comms Console history, Kanban columns) avec des scrollbars discrètes customisées.

---

## 6. BRANCHÉ vs SIMULÉ

**Actuellement TOUT est simulé.**
Le `useSimulation.js` contient un gros `setInterval(..., 1000)` qui génère des nombres aléatoires et mute des états (Markov chain-style) pour donner une impression de "vie" à l'interface (clignotements, messages de terminaux tapés un par un, tâches qui s'ajoutent).

**Rien n'est branché.** L'input Endpoint `localhost:3000` dans la Sidebar est purement cosmétique, tout comme la messagerie (`CommsConsole`) qui fait un `setTimeout` générique de réponse.

---

## 7. POINTS D'EXTENSION / COMMENT BRANCHER "MissionDeck" OU "OpenClaw"

Pour basculer cette UI sur des données réelles, l'agent IA devra remplacer `useSimulation.js` par de vrais hooks, par exemple via `react-query` + WebSocket.

**Architecture de hook ciblée :**
```javascript
// Remplacer `useSimulation()` dans App.jsx par:
const { data: agents } = useAgentStatus(); // Polling /mc/squad API
const { data: tasks } = useTaskQueue();    // Polling /mc/tasks API
const { messages } = useIntelSocket();     // WS branché sur /ws/events
```

Les composants UI attendent **exactement les structures de données définies au point 4**. L'intégration consistera donc principalement à créer des adaptateurs (`mappers`) entre la payload de votre backend et ces structures frontend attendues.

---

## 8. CE QUI RESTE À FAIRE (TODO & FEATURES INCOMPLÈTES)

1. **Routing :** `<App />` switch l'affichage (`activeTab`) entre `"overview"` et `"comms"`. Les vues `"agents"`, `"tasks"`, et `"intel"` pleine page renvoient pour le moment un simple placeholder : `[ MODULE ALLOCATING MEMORY... ]`.
2. **Drag & Drop de Tâches :** L'UI Task Pipeline met cursor "grab" sur les tâches mais n'a pas encore implémenté `react-beautiful-dnd` ou `dnd-kit`. Les tâches ne bougent pas entre les colonnes.
3. **Comms Console - Multi-Agents :** Choisir un agent à droite change bien le contexte d'uplink, mais l'UI de tchat (à gauche) simule brutalement la liste de messages (il n'y a pas d'isolation d'historique de tchat par agent).
4. **Bouton `Export Log` :** Copie bien le presse-papier, mais devrait déclencher une notification visuelle de succès.
5. **Comportement Responsive :** Le dashboard est pensé `Desktop First`. Sur des écrans inférieurs à 1280px, ça risque de "coucher" les grilles ou de forcer un scroll non-désiré. Des breakpoints Tailwind (`lg:`, `md:`) sont présents mais non peaufinés.
