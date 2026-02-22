# ⚡ MXLX SYST. COMMAND CENTER

**Opération :** AI Command Center Operations - MXLX Syst.
**Status :** `SECURE SECRECY` | `OP INTERNAL`
**Framework :** React 18 + Vite + TailwindCSS 3.4
**Design System :** Sovereign Glass

---

## 🎯 Vue d'ensemble (L'Interface)

Il ne s'agit pas d'un dashboard SaaS générique. C'est l'interface centrale d'une firme opérant une escouade d'agents IA autonomes, rendue dans l'esthétique "Sovereign Glass" (Dark mode absolu, terminaux, widgets monospaces, et feed d'alertes temps réel).

Actuellement, ce repository contient le **socle visuel complet** et ses micro-interactions. Le cerveau de la simulation se trouve dans `src/hooks/useSimulation.js` et génère un flux continu de données temps réel pour donner vie à l'interface en attendant la connexion à votre backend/OpenClaw.

---

## 🚀 Lancement Rapide

Ce projet nécessite Node.js (v18+ recommandé).

```bash
# 1. Cloner le repo
git clone https://github.com/itsmemelihdev/mxlx-syst.git
cd mxlx-syst

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement local
npm run dev
```

L'interface sera disponible en live sur `http://localhost:5173`. 
*(Note: l'ergonomie est pensée Desktop-First).*

---

## 🧩 Architecture des Widgets (Le Tableau de Bord)

L'UI principale (`OverviewPanel`) est divisée en 6 modules tactiques majeurs :

1. **Task Pipeline** : Flux Kanban (Inbox > Assigned > In Progress > Review > Done) listant en temps réel les sub-tasks assignées aux agents.
2. **Cognition Load** : Graphe temps réel injectant l'usage CPU/Cognition simulé et la charge des canaux de communication (`comms`).
3. **Active Directives** : Hub de terminaux affichant les pensées et requêtes des agents (effet "typewriter" asynchrone).
4. **Telemetry Matrix** : Matrice surveillant les 6 agents (tokens ingérés, load actuel, statut d'activité clignotant).
5. **Threat Heatmap** : Carte colorimétrique (7x7) des zones d'opérations et de leur intensité. Vert/Gris = OK. Amber = Caution. Rouge = Critical.
6. **Operational Timeline** : Ligne temporelle déroulante archivant toutes les requêtes clés des sous-systèmes.

En complément :
- **Comms Console** (`/src/components/CommsConsole.jsx`) : Console "Uplink" permettant d'isoler un agent, d'obtenir son contexte temps réel et d'interagir avec lui via un prompt en ligne de commande.
- **Intel Feed** (`/src/components/IntelFeed.jsx`) : Sidemenu droit déroulant l'historique de tous les flux d'informations du système (filtrable par Criticité ou Source).

---

## 🤖 L'Escouade (Agent Roster)

Le système est actuellement hardcodé (dans `useSimulation.js`) avec 6 agents clés :

1. **ALPHA** — _Chief of Staff_
2. **ATLAS** — _Intelligence Analyst_ (Veille & Recherche)
3. **HERALD** — _Communications Officer_ (Emails & Contenu)
4. **LEDGER** — _Finance Controller_ (Finance & Comptabilité)
5. **FORGE** — _Execution Agent_ (Projets & Tâches)
6. **ORACLE** — _Personal OS_ (Vie perso : Agenda, Santé, Objectifs)

---

## 🧠 Handoff & Développeurs (Poursuivre le projet)

Si vous êtes une IA (Claude, GPT, etc.) chargée de poursuivre le développement ou de connecter cette UI à un vrai backend d'orchestration (ex: OpenClaw) :

👉 **Veuillez lire le fichier [`CONTEXT.md`](./CONTEXT.md) à la racine du projet.**

Il contient le document de passation technique exhaustif concernant :
- Les typographies et le Design System CSS.
- Les dépendances exactes.
- Le format des payloads JSON structurés attendus par les composants.
- Les points de raccordement pour désactiver le `useSimulation.js` et plugger vos Data Providers (ex: Websockets, React Query, Supabase).

---

## 🛠️ Stack Technique

- **Build / Tooling :** Vite (React Fast Refresh)
- **UI Framework :** React 18
- **Styling :** Tailwind CSS `v3.4.17` + PostCSS. _(Ne pas upgrader en v4)._
- **Icônes :** Lucide React
- **Data-Viz :** Recharts (AreaChart pour la cognitométrie)
- **Police :** Google Fonts (`Space Grotesk`, `JetBrains Mono`, `DM Serif Display`, `Inter`).

---

*« Do not build a dashboard. Build the nerve center of a private intelligence operation. »*
