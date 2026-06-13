import type { Channel, Period, Tone, AIProvider } from '../types';

// ─── Gemini API ───────────────────────────────────────────────────────────────

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Промпты ─────────────────────────────────────────────────────────────────

function buildContentPlanPrompt(
  niche: string,
  details: string,
  channels: Channel[],
  period: Period,
  dates: string[]
): string {
  return `Ты — маркетолог-контентмейкер. Составь контент-план для ниши: "${niche}".
${details ? `Дополнительный контекст: ${details}` : ''}

Каналы: ${channels.join(', ')}
Период: ${dates.join(', ')}

Для каждого дня и каждого канала предложи ровно 3 темы для публикации.
Верни ТОЛЬКО JSON-массив объектов без markdown и комментариев:
[
  {
    "date": "дата",
    "channel": "канал",
    "time": "рекомендуемое время (ЧЧ:ММ)",
    "topics": ["тема1", "тема2", "тема3"]
  }
]

Формат даты: 13 июня, пн
Время: от 8:00 до 20:00, разумное для канала
Темы должны быть конкретными, цепляющими, с учётом специфики канала.`;
}

function buildMailingPrompt(
  topic: string,
  details: string,
  channels: Channel[],
  tone: Tone
): string {
  return `Ты — экспертный копирайтер. Напиши готовый текст рассылки/поста.

Тема: "${topic}"
Канал(ы): ${channels.join(', ')}
Тон: ${tone}
${details ? `Дополнительно: ${details}` : ''}

Правила:
- Текст должен быть ПОЛНОСТЬЮ ГОТОВЫМ к публикации
- Без советов по оформлению, пояснений от AI, инструкций
- Без плейсхолдеров вида [Имя], [сумма]
- Структура: заголовок, основной текст, CTA
- Эмодзи умеренно, по теме
- Длина: 200-500 слов

Сначала определи, какие переменные нужны для текста (название компании, имя эксперта, продукт, цена и т.д.).
Верни JSON:
{
  "missingVars": ["переменная1", "переменная2"] или [] если переменные не нужны,
  "text": "готовый текст рассылки"
}`;
}

function buildMissingVarsPrompt(vars: string[]): string {
  return `Для текста рассылки нужны следующие данные: ${vars.join(', ')}.
Верни JSON-массив строк с вопросами пользователю для каждой переменной.
Например: ["Как называется ваша компания?", "Как зовут эксперта?"]`;
}

function buildImagePrompt(text: string, channel: Channel): string {
  const sizes: Record<Channel, string> = {
    Email: 'широкое изображение 1200x600',
    Telegram: 'квадратное изображение 600x600',
    'ВКонтакте': 'изображение для поста 1200x630',
  };
  return `Составь промпт для генерации изображения.
Размер: ${sizes[channel]}
Стиль: современная минималистичная иллюстрация, зелёные тона, плоский дизайн.
Тема: "${text.slice(0, 100)}"
Без текста на изображении.
Верни ТОЛЬКО текст промпта на английском языке, без кавычек и комментариев.`;
}

function buildPodcastScriptPrompt(
  topic: string,
  details: string,
  duration: string,
  style: string,
  format: string
): string {
  const durationMin = parseInt(duration);
  const wordCount = durationMin * 130;
  return `Ты — сценарист подкастов. Напиши сценарий подкаста.

Тема: "${topic}"
${details ? `Дополнительно: ${details}` : ''}

Параметры:
- Длительность: ~${duration} мин (~${wordCount} слов)
- Стиль: ${style}
- Формат: ${format}

Структура сценария:
- Вступление (приветствие, анонс темы)
- Основная часть (3-5 разделов с ключевыми мыслями)
- Заключение (итоги, CTA)

Стиль текста: разговорный, как будто ведущий говорит со слушателями.
Делай паузы, ставь ремарки [пауза], [интонация вверх] и т.д.
Верни ТОЛЬКО текст сценария без markdown-обёрток.`;
}

function buildVideoScriptPrompt(topic: string, details: string): string {
  return `Ты — сценарист видео для YouTube/соцсетей. Напиши короткий сценарий.

Тема: "${topic}"
${details ? `Дополнительно: ${details}` : ''}

Формат: видео с AI-аватаром (говорящая голова)
Длительность: 60-90 секунд

Структура:
- INTRO (0:00 - 0:15): приветствие, HOOK темы
- ОСНОВНАЯ ЧАСТЬ (0:15 - 1:15): ключевые мысли
- ЗАКЛЮЧЕНИЕ (1:15 - 1:30): итог, CTA

Верни ТОЛЬКО текст сценария (реплики аватара).`;
}

// ─── Вспомогательные функции ─────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
}

function randomTime(): string {
  const h = Math.floor(Math.random() * 12) + 8;
  const m = Math.random() > 0.5 ? '00' : '30';
  return `${h}:${m}`;
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

function extractJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Не удалось распарсить ответ AI');
  }
}

// ─── Mock-функции (fallback) ─────────────────────────────────────────────────

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
      `Быстрый tip по ${niche.toLowerCase()}`,
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

// ─── Проверка подключения ────────────────────────────────────────────────────

export async function checkGeminiConnection(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Привет' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Тип контекста для генерации ─────────────────────────────────────────────

interface AIGenerationContext {
  aiProvider: AIProvider;
  geminiApiKey: string;
}

// ─── Основные функции генерации ──────────────────────────────────────────────

export async function generateContentPlan(
  niche: string,
  details: string,
  channels: Channel[],
  period: Period,
  ctx: AIGenerationContext
) {
  const dates = getDatesForPeriod(period);
  const dateStrings = dates.map(formatDate);

  if (ctx.aiProvider !== 'gemini' || !ctx.geminiApiKey) {
    return dates.flatMap((date) =>
      channels.map((channel) => ({
        id: crypto.randomUUID(),
        date: formatDate(date),
        channel,
        time: randomTime(),
        topics: randomTopics(channel, niche),
      }))
    );
  }

  const prompt = buildContentPlanPrompt(niche, details, channels, period, dateStrings);
  const response = await callGemini(ctx.geminiApiKey, prompt);
  const items = extractJSON<{ date: string; channel: Channel; time: string; topics: string[] }[]>(response);

  return items.map((item) => ({
    id: crypto.randomUUID(),
    date: item.date,
    channel: item.channel,
    time: item.time,
    topics: item.topics,
  }));
}

export async function generateMailingText(
  topic: string,
  details: string,
  channels: Channel[],
  tone: Tone,
  ctx: AIGenerationContext
): Promise<{ text: string; missingVars: string[] }> {
  if (ctx.aiProvider !== 'gemini' || !ctx.geminiApiKey) {
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

    const texts: Record<Tone, string> = {
      'Дружелюбный': `Привет! Обсудим тему «${topic}».\n\nЭто важная тема, которая затрагивает многих. Давайте разберёмся вместе.\n\n${details ? `Учли ваш запрос: ${details}\n\n` : ''}👇 Сохраняйте себе, чтобы не потерять!`,
      'Экспертный': `Анализ: ${topic}\n\nПо данным исследований, данная тема остаётся одной из наиболее востребованных.\n\n${details ? `Дополнительно: ${details}\n\n` : ''}Готовы применить? Начните с первого шага сегодня.`,
      'Минималистичный': `${topic}\n\n${details ? `${details}\n\n` : ''}Коротко и по делу.\n\nНачните →`,
    };

    return { text: texts[tone], missingVars };
  }

  const prompt = buildMailingPrompt(topic, details, channels, tone);
  const response = await callGemini(ctx.geminiApiKey, prompt);
  const result = extractJSON<{ missingVars: string[]; text: string }>(response);
  return { text: result.text, missingVars: result.missingVars || [] };
}

export async function generateImagePrompt(
  text: string,
  channel: Channel,
  ctx: AIGenerationContext
): Promise<string> {
  if (ctx.aiProvider !== 'gemini' || !ctx.geminiApiKey) {
    const sizes: Record<Channel, string> = {
      Email: 'широкое изображение 1200x600',
      Telegram: 'квадратное изображение 600x600',
      'ВКонтакте': 'изображение для поста 1200x630',
    };
    return `Современная минималистичная иллюстрация в зелёных тонах. ${sizes[channel]}. Стиль: плоский дизайн с акцентом на тему "${text.slice(0, 50)}". Без текста на изображении.`;
  }

  const prompt = buildImagePrompt(text, channel);
  return callGemini(ctx.geminiApiKey, prompt);
}

export async function generateMissingVarsPrompt(
  vars: string[],
  ctx: AIGenerationContext
): Promise<string[]> {
  if (ctx.aiProvider !== 'gemini' || !ctx.geminiApiKey) {
    return vars.map((v) => `Введите: ${v}`);
  }

  const prompt = buildMissingVarsPrompt(vars);
  const response = await callGemini(ctx.geminiApiKey, prompt);
  return extractJSON<string[]>(response);
}

export async function generatePodcastScript(
  topic: string,
  details: string,
  duration: string,
  style: string,
  format: string,
  ctx: AIGenerationContext
): Promise<string> {
  if (ctx.aiProvider !== 'gemini' || !ctx.geminiApiKey) {
    const durationMin = parseInt(duration);
    const wordCount = durationMin * 130;
    const paragraphs = Math.max(3, Math.floor(wordCount / 100));

    let script = `🎙️ Подкаст: ${topic}\n`;
    script += `Стиль: ${style} | Формат: ${format}\n`;
    script += `Длительность: ~${duration} мин\n\n---\n\n`;
    script += `Привет, дорогие слушатели! Сегодня мы поговорим о теме, которая волнует многих — ${topic}. ${details ? `Особое внимание уделим вопросу: ${details}.` : ''} Приятного прослушивания!\n\n`;

    for (let i = 1; i < paragraphs; i++) {
      script += `Раздел ${i}.\n\nЗдесь развивается ключевая мысль раздела ${i}. Подробно разбираем аспекты темы «${topic}». Приводим примеры и практические рекомендации.\n\n`;
    }

    script += `---\n\nПодводим итоги. Сегодня мы подробно разобрали тему «${topic}». Надеюсь, эта информация будет вам полезна. Подписывайтесь на подкаст и оставляйте комментарии. До встречи в следующем выпуске!`;
    return script;
  }

  const prompt = buildPodcastScriptPrompt(topic, details, duration, style, format);
  return callGemini(ctx.geminiApiKey, prompt);
}

export async function generateVideoScript(
  topic: string,
  details: string,
  ctx: AIGenerationContext
): Promise<string> {
  if (ctx.aiProvider !== 'gemini' || !ctx.geminiApiKey) {
    let script = `📹 Сценарий видео: ${topic}\n\n`;
    script += `INTRO (0:00 - 0:15)\nПривет! Сегодня мы поговорим о ${topic}.\n\n`;
    script += `ОСНОВНАЯ ЧАСТЬ (0:15 - 1:30)\n${details ? `${details}\n\n` : ''}Давайте рассмотрим это подробнее.\n\n`;
    script += `ЗАКЛЮЧЕНИЕ (1:30 - 1:45)\nПодводим итоги. Спасибо за просмотр! Ставьте лайк и подписывайтесь.`;
    return script;
  }

  const prompt = buildVideoScriptPrompt(topic, details);
  return callGemini(ctx.geminiApiKey, prompt);
}
