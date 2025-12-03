export interface Character {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  assignedNumber?: number; // The digit assigned during the game phase
}

export enum AppState {
  MAIN_MENU = 'MAIN_MENU',
  CREATOR = 'CREATOR',
  GAME = 'GAME',
  REWARD_CREATOR = 'REWARD_CREATOR',
  PAINTER = 'PAINTER',
  STORY_MODE = 'STORY_MODE'
}