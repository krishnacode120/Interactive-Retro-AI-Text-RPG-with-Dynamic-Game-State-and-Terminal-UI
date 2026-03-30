# 🕹️ Infinite Retro AI RPG (Local AI Edition)

## 📌 Project Overview

Infinite Retro AI RPG is a **React-based, single-page, procedurally generated text RPG** where a local AI model acts as a Game Master (GM). The AI dynamically generates storylines, updates player state, and suggests actions based on user input.

The application is designed with a **retro CRT terminal interface** and runs entirely using **local AI models**, avoiding all paid APIs.

---

---

## 🚀 Features

### 🎮 Gameplay
- Infinite procedurally generated story
- Command-based player interaction
- AI-generated narrative responses
- Suggested actions for quick decisions
- Continuous gameplay with no fixed ending

---

### 📊 Game System
- Health system (0–100)
- Stamina system (0–100)
- XP and leveling system
- Status effects (buffs/debuffs)
- Inventory management
- Game-over condition when health reaches 0

---

### 💾 Persistence
- Full game state saved in localStorage
- Includes story history, player stats, inventory, and theme
- Resume game functionality

---

## 🧱 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite

### UI & Styling
- Tailwind CSS
- Framer Motion
- Lucide React

### State Management
- React Hooks
- localStorage

---

## 🧩 Game State Model

```ts
type Theme = 'Cyberpunk' | 'High Fantasy' | 'Space Horror';

interface GameStats {
  health: number;
  stamina: number;
  level: number;
  xp: number;
  status_effects: string[];
}

interface GameState {
  story_text: string;
  visual_description: string;
  location: string;
  stats: GameStats;
  inventory: string[];
  suggested_actions: string[];
  is_game_over: boolean;
}
```

---

## 🧠 AI Integration

### Text Generation (Ollama)
Endpoint: http://localhost:11434/api/chat

- Generates story
- Updates game state
- Suggests actions
- Returns strict JSON

---

### Image Generation (Stable Diffusion)
Endpoint: http://127.0.0.1:7860/sdapi/v1/txt2img

- Generates scene visuals
- Returns base64 image

---

## 🎨 UI Design

- Retro CRT terminal theme
- Monospace fonts
- Scanline effects
- Flicker animation
- Typewriter text effect

---

## 🖥️ Layout

### Left Panel
- Game history
- Story output
- Command input
- Suggested actions

### Right Panel
- Scene image
- Player stats
- Status effects
- Inventory

---

## 🔄 Flow

1. User enters command
2. AI generates response
3. State updates
4. UI refreshes
5. Image generated
6. Data saved

---

## ⚠️ Error Handling

- Detect AI failure
- Show error message
- Retry option
- Preserve input

---

## 📦 Deployment

### Recommended
- Vercel (Frontend only)
- Demo mode + Local AI mode

### Alternative
- Render (Full setup)
- Requires AI services on server

---

## 🔧 Installation

```bash
git clone https://github.com/your-username/retro-ai-rpg.git
cd retro-ai-rpg
npm install
npm run dev
```

---

## 👨‍💻 Author

Krishna Moorthy  
AI & Full Stack Developer
