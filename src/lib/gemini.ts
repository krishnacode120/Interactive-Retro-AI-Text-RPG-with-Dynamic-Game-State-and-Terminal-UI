import { GoogleGenAI, Type, Chat } from '@google/genai';
import { GameState, Theme } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getSystemInstruction = (theme: Theme) => `
You are an expert Game Master (GM) for an infinite, procedurally generated Text-RPG. Your goal is to provide an immersive, reactive, and logically consistent storytelling experience.

GAME ENGINE RULES:
1. WORLD BUILDING: The game is set in a ${theme} setting. Start the game by placing the player in a compelling starting location.
2. PLAYER AGENCY: Never control the player's character. Wait for their input.
3. CONSEQUENCES: Actions have risks. If a player tries something dangerous, use a "behind-the-scenes" dice roll to determine success or failure.
4. STATE MANAGEMENT: Track the player's Health (0-100), Stamina (0-100), Level, XP, Status Effects, Inventory, and current Location. Award XP for surviving encounters, discovering secrets, or defeating enemies. Level up the player when XP reaches 100 (reset XP to 0 and increase Level). If Health hits 0, the game is over.
5. VISUAL DESCRIPTIONS: For every turn, provide a vivid "Visual Prompt" that describes the current scene in detail.

TONE AND STYLE:
- Use atmospheric, "literary" prose.
- Be descriptive but concise.
- Maintain a sense of mystery and adventure.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    story_text: { type: Type.STRING, description: "2-3 sentences describing what just happened based on the player's action." },
    visual_description: { type: Type.STRING, description: "A detailed 1-sentence description of the scene for a visual artist." },
    location: { type: Type.STRING, description: "Name of the current area" },
    stats: {
      type: Type.OBJECT,
      properties: {
        health: { type: Type.INTEGER },
        stamina: { type: Type.INTEGER },
        level: { type: Type.INTEGER },
        xp: { type: Type.INTEGER },
        status_effects: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Current status effects like 'Poisoned', 'Bleeding', 'Empowered', etc. Empty array if none."
        }
      },
      required: ["health", "stamina", "level", "xp", "status_effects"]
    },
    inventory: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    suggested_actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    is_game_over: { type: Type.BOOLEAN }
  },
  required: ["story_text", "visual_description", "location", "stats", "inventory", "suggested_actions", "is_game_over"]
};

let chatSession: Chat | null = null;

export const startGame = async (theme: Theme): Promise<GameState> => {
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: getSystemInstruction(theme),
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7,
    }
  });

  const response = await chatSession.sendMessage({ message: "Start the game. Initialize Level to 1, XP to 0, and status_effects to empty." });
  return JSON.parse(response.text) as GameState;
};

export const resumeGame = async (theme: Theme, state: GameState): Promise<void> => {
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: getSystemInstruction(theme),
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.7,
    }
  });
  
  await chatSession.sendMessage({ 
    message: `RESTORE_STATE: The player is returning to the game. Here is the current game state. Acknowledge and continue from here without changing the state, just output the exact same state back so we can resume.\n\n${JSON.stringify(state)}` 
  });
};

export const sendAction = async (action: string): Promise<GameState> => {
  if (!chatSession) throw new Error("Game not started");
  const response = await chatSession.sendMessage({ message: action });
  return JSON.parse(response.text) as GameState;
};

export const generateSceneImage = async (description: string, theme: Theme): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `A ${theme} style scene: ${description}. Retro, pixel art or cinematic style, highly atmospheric, no text.`,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
};
