export type StoryCharId = 'god' | 'player' | 'brigitta' | 'nike' | 'nike_mother' | 'garon' | 'baramu';
export type CharPosition = 'left' | 'center' | 'right';

export type StoryEvent =
  | { type: 'bg'; id: string }
  | { type: 'enter'; char: StoryCharId; pos: CharPosition; expr?: string }
  | { type: 'exit'; char: StoryCharId }
  | { type: 'expr'; char: StoryCharId; expr: string }
  | { type: 'say'; speaker: string; text: string }
  | { type: 'think'; text: string }
  | { type: 'narrate'; text: string }
  | { type: 'system'; text: string }
  | { type: 'transition'; effect: 'whiteout' | 'blackout' }
  | { type: 'battle'; questId: string }
  | { type: 'card_create' }
  | { type: 'end'; chapterNum: number; nextChapter?: number };

export interface StoryChapter {
  chapterNum: number;
  title: string;
  events: StoryEvent[];
}

export interface StoryContext {
  firstCardName: string;
  playerName: string;
}
