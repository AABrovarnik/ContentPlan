import type { Channel, Period, Tone } from '../types';

function mockResponse<T>(data: T, delay = 1500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
}

function randomTime(): string {
  const h = Math.floor(Math.random() * 12) + 8;
  const m = Math.random() > 0.5 ? '00' : '30';
  return `${h}:${m}`;
}

function randomTopics(channel: Channel, niche: string): string[] {
  const topicBank: Record<Channel, string[]> = {
    Email: [
      `${niche}: подробный гайд для начинающих`,
      `Топ-5 ошибок в ${niche.toLowerCase()}`,
      `Экспертное интервью: тренды ${niche.toLowerCase()}`,
      `Кейс: как мы увеличили результат на 40%`,
      `Чек-лист: что нужно знать о ${niche.toLowerCase()}`,
    ],
    Telegram: [
      `Быстрый.tip по ${niche.toLowerCase()}`,
      `Взгляд изнутри: ${niche.toLowerCase()}`,
      `Пост-карусель: 7 фактов о ${niche.toLowerCase()}`,
      `Опрос: что вы думаете о...`,
      `Короткий reels-формат: ${niche.toLowerCase()}`,
    ],
    'ВКонтакте': [
      `Длинный пост: история успеха в ${niche.toLowerCase()}`,
      `Подборка: полезные ресурсы по ${niche.toLowerCase()}`,
      `Видео-обзор: тренды ${niche.toLowerCase()}`,
      `Обсуждение: главные вопросы недели`,
      `Анонс: вебинар по ${niche.toLowerCase()}`,
    ],
  };
  const bank = topicBank[channel];
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function getDatesForPeriod(period: Period): Date[] {
  const today = new Date();
  const dates: Date[] = [today];
  const days = period === 'today' ? 0 : period === '3days' ? 2 : period === '5days' ? 4 : 6;
  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export async function generateContentPlan(
  niche: string,
  _details: string,
  channels: Channel[],
  period: Period
) {
  const dates = getDatesForPeriod(period);
  const items = dates.flatMap((date) =>
    channels.map((channel) => ({
      id: crypto.randomUUID(),
      date: formatDate(date),
      channel,
      time: randomTime(),
      topics: randomTopics(channel, niche),
    }))
  );
  return mockResponse(items);
}

export async function generateMailingText(
  topic: string,
  details: string,
  channels: Channel[],
  tone: Tone
): Promise<{ text: string; missingVars: string[] }> {
  const missingVars: string[] = [];
  if (topic.toLowerCase().includes('курс') || topic.toLowerCase().includes('обучение')) {
    missingVars.push('название продукта', 'цена');
  }
  if (details.includes('компани') || details.includes('бренд')) {
    missingVars.push('название компании');
  }
  if (missingVars.length === 0 && Math.random() > 0.5) {
    missingVars.push('имя эксперта', 'название продукта');
  }

  const toneMap: Record<Tone, string> = {
    'Дружелюбный': 'Привет! ',
    'Экспертный': '',
    'Минималистичный': '',
  };

  const channelHint = channels.length === 1 ? ` для ${channels[0]}` : '';

  const texts: Record<Tone, string> = {
    'Дружелюбный': `${toneMap[tone]}Обсудим тему «${topic}»${channelHint}.

Это важная тема, которая затрагивает многих. Давайте разберёмся вместе.

Подготовили для вас практические рекомендации, которые можно применить прямо сейчас.

${details ? `Учли ваш запрос: ${details}\n\n` : ''}👇 Сохраняйте себе, чтобы не потерять!

#${topic.replace(/\s/g, '')} #полезное`,
    'Экспертный': `Анализ: ${topic}${channelHint}

По данным исследований, данная тема остаётся одной из наиболее востребованных.

Ключевые выводы:
• Практический подход важнее теории
• Регулярность даёт результат
• Экспертная поддержка ускоряет процесс

${details ? `Дополнительно: ${details}\n\n` : ''}Готовы применить? Начните с первого шага сегодня.

#экспертиза #${topic.replace(/\s/g, '')}`,
    'Минималистичный': `${topic}

${details ? `${details}\n\n` : ''}Коротко и по делу.

Начните →`,
  };

  return mockResponse({ text: texts[tone], missingVars }, 2000);
}

export async function generateImagePrompt(text: string, channel: Channel): Promise<string> {
  const sizes: Record<Channel, string> = {
    Email: 'широкое изображение 1200x600',
    Telegram: 'квадратное изображение 600x600',
    'ВКонтакте': 'изображение для поста 1200x630',
  };
  return mockResponse(
    `Современная минималистичная иллюстрация в зелёных тонах. ${sizes[channel]}. Стиль: плоский дизайн с акцентом на тему "${text.slice(0, 50)}". Без текста на изображении.`,
    1000
  );
}

export async function generateMissingVarsPrompt(text: string): Promise<string[]> {
  const vars: string[] = [];
  if (Math.random() > 0.3) vars.push('название компании');
  if (Math.random() > 0.4) vars.push('имя эксперта');
  if (Math.random() > 0.5) vars.push('название продукта');
  if (Math.random() > 0.6) vars.push('цена');
  if (vars.length === 0) vars.push('имя клиента');
  return mockResponse(vars, 800);
}

export async function generatePodcastScript(
  topic: string,
  details: string,
  duration: string,
  style: string,
  format: string
): Promise<string> {
  const durationMin = parseInt(duration);
  const wordCount = durationMin * 130;
  const paragraphs = Math.max(3, Math.floor(wordCount / 100));

  let script = `🎙️ Подкаст: ${topic}\n`;
  script += `Стиль: ${style} | Формат: ${format}\n`;
  script += `Длительность: ~${duration} мин\n\n`;
  script += `---\n\n`;

  const intro = `Привет, дорогие слушатели! Сегодня мы поговорим о теме, которая волнует многих — ${topic}. ${details ? `Особое внимание уделим вопросу: ${details}.` : ''} Приятного прослушивания!`;
  script += `${intro}\n\n`;

  for (let i = 1; i < paragraphs; i++) {
    script += `Раздел ${i}.\n\n`;
    script += `Здесь развивается ключевая мысль раздела ${i}. `;
    script += `Подробно разбираем аспекты темы «${topic}». `;
    script += `Приводим примеры и практические рекомендации.\n\n`;
  }

  script += `---\n\n`;
  script += `Подводим итоги. Сегодня мы подробно разобрали тему «${topic}». `;
  script += `Надеюсь, эта информация будет вам полезна. `;
  script += `Подписывайтесь на подкаст и оставляйте комментарии. До встречи в следующем выпуске!`;

  return mockResponse(script, 2500);
}

export async function generateVideoScript(
  topic: string,
  details: string
): Promise<string> {
  let script = `📹 Сценарий видео: ${topic}\n\n`;
  script += `INTRO (0:00 - 0:15)\n`;
  script += `Привет! Сегодня мы поговорим о ${topic}.\n\n`;
  script += `ОСНОВНАЯ ЧАСТЬ (0:15 - 1:30)\n`;
  script += `${details ? `${details}\n\n` : ''}`;
  script += `Давайте рассмотрим это подробнее.\n`;
  script += `Первый важный момент — это практическое применение.\n`;
  script += `Второй момент — типичные ошибки, которых стоит избегать.\n\n`;
  script += `ЗАКЛЮЧЕНИЕ (1:30 - 1:45)\n`;
  script += `Подводим итоги. Спасибо за просмотр! Ставьте лайк и подписывайтесь.`;

  return mockResponse(script, 2000);
}
