export interface GameState {
  story_text: string;
  visual_description: string;
  location: string;
  stats: {
    health: number;
    stamina: number;
    level: number;
    xp: number;
    status_effects: string[];
  };
  inventory: string[];
  suggested_actions: string[];
  is_game_over: boolean;
}

export type Theme = 'Cyberpunk' | 'High Fantasy' | 'Space Horror';

export interface HistoryEntry {
  id: string;
  action: string;
  location: string;
  text: string;
}

export interface AppSaveData {
  theme: Theme;
  gameState: GameState;
  history: HistoryEntry[];
  sceneImage: string | null;
}
