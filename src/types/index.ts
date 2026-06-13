export type Section = 'content-plan' | 'mailing' | 'podcast' | 'video-avatar';

export type Channel = 'Email' | 'Telegram' | 'ВКонтакте';

export type Period = 'today' | '3days' | '5days' | 'week';

export type Tone = 'Дружелюбный' | 'Экспертный' | 'Минималистичный';

export type PodcastStyle = 'Разговорный' | 'Доверительный' | 'Мотивирующий' | 'Обучающий' | 'Сторителлинг';

export type PodcastFormat = 'Монолог' | 'Экспертный разбор';

export type VoiceGender = 'Мужской' | 'Женский';

export type VoiceTimbre = 'Низкий' | 'Средний' | 'Высокий';

export type VoiceQuality = 'Стандартное' | 'Высокое' | 'Премиум';

export type Emotion = 'Нейтральная' | 'Дружелюбная' | 'Энергичная' | 'Спокойная';

export type Speed = '0.8x' | '1.0x' | '1.2x';

export type AIProvider = 'gemini' | 'mock';

export interface ContentPlanItem {
  id: string;
  date: string;
  channel: Channel;
  time: string;
  topics: string[];
}

export interface Settings {
  aiProvider: AIProvider;
  geminiApiKey: string;
  heygenApiKey: string;
  ttsProvider: string;
  ttsApiKey: string;
  imageApiKey: string;
}

export interface MailingResult {
  text: string;
  imagePrompt: string;
  imageUrl: string | null;
}

export interface PodcastResult {
  script: string;
  audioUrl: string | null;
}

export interface VideoResult {
  script: string;
  videoUrl: string | null;
  status: 'idle' | 'generating' | 'ready' | 'error';
}
