// HeyGen API v2
// Документация: https://docs.heygen.com/reference
// ВАЖНО: CORS может блокировать прямые запросы из браузера.
// Если запросы не проходят — потребуется backend-прокси.

export interface HeygenAvatar {
  avatar_id: string;
  name: string;
  preview_url?: string;
}

export interface HeygenVoice {
  voice_id: string;
  name: string;
}

export interface HeygenVideoResponse {
  video_id: string;
  status: string;
  video_url?: string;
}

const MOCK_AVATARS: HeygenAvatar[] = [
  { avatar_id: 'business_01', name: 'Business Avatar' },
  { avatar_id: 'friendly_01', name: 'Friendly Expert' },
  { avatar_id: 'teacher_01', name: 'Teacher Avatar' },
];

const MOCK_VOICES: HeygenVoice[] = [
  { voice_id: 'ru_male_01', name: 'Русский мужской' },
  { voice_id: 'ru_female_01', name: 'Русский женский' },
  { voice_id: 'ru_friendly_01', name: 'Русский дружелюбный' },
];

const HEYGEN_BASE = 'https://api.heygen.com';

function headers(apiKey: string) {
  return {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json',
  };
}

// ─── Проверка подключения ────────────────────────────────────────────────────

export async function checkHeygenConnection(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch(`${HEYGEN_BASE}/v1/workspace`, {
      method: 'GET',
      headers: headers(apiKey),
    });
    return res.ok;
  } catch {
    // CORS или сеть — возвращаем false
    return false;
  }
}

// ─── Получение аватаров ──────────────────────────────────────────────────────

export async function getAvatars(apiKey: string): Promise<HeygenAvatar[]> {
  if (!apiKey) return MOCK_AVATARS;

  try {
    const res = await fetch(`${HEYGEN_BASE}/v2/avatars`, {
      method: 'GET',
      headers: headers(apiKey),
    });

    if (!res.ok) {
      console.warn('HeyGen avatars API error, using mock');
      return MOCK_AVATARS;
    }

    const data = await res.json();
    const avatars = data.data?.avatars || data.avatars || [];

    if (avatars.length === 0) return MOCK_AVATARS;

    return avatars.map((a: Record<string, string>) => ({
      avatar_id: a.avatar_id,
      name: a.avatar_name || a.avatar_id,
      preview_url: a.preview_image_url,
    }));
  } catch (err) {
    console.warn('HeyGen avatars fetch failed, using mock:', err);
    return MOCK_AVATARS;
  }
}

// ─── Получение голосов ───────────────────────────────────────────────────────

export async function getVoices(apiKey: string): Promise<HeygenVoice[]> {
  if (!apiKey) return MOCK_VOICES;

  try {
    const res = await fetch(`${HEYGEN_BASE}/v2/voices`, {
      method: 'GET',
      headers: headers(apiKey),
    });

    if (!res.ok) {
      console.warn('HeyGen voices API error, using mock');
      return MOCK_VOICES;
    }

    const data = await res.json();
    const voices = data.data?.voices || data.voices || [];

    if (voices.length === 0) return MOCK_VOICES;

    // Фильтруем русские голоса, если есть
    const ruVoices = voices.filter((v: Record<string, string>) =>
      (v.language || '').toLowerCase().includes('ru')
    );

    const result = ruVoices.length > 0 ? ruVoices : voices;

    return result.map((v: Record<string, string>) => ({
      voice_id: v.voice_id,
      name: v.name || v.voice_id,
    }));
  } catch (err) {
    console.warn('HeyGen voices fetch failed, using mock:', err);
    return MOCK_VOICES;
  }
}

// ─── Создание видео ──────────────────────────────────────────────────────────

export async function createVideo(
  apiKey: string,
  avatarId: string,
  voiceId: string,
  script: string
): Promise<HeygenVideoResponse> {
  if (!apiKey) {
    return { video_id: `mock_video_${Date.now()}`, status: 'processing' };
  }

  const body = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: avatarId,
          avatar_style: 'normal',
        },
        voice: {
          type: 'text',
          voice_id: voiceId,
          input_text: script,
        },
        background: {
          type: 'color',
          value: '#FFFFFF',
        },
      },
    ],
    test: false,
    aspect_ratio: '16:9',
  };

  try {
    const res = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `HeyGen API error: ${res.status}`);
    }

    const data = await res.json();
    return {
      video_id: data.data?.video_id || data.video_id,
      status: 'processing',
    };
  } catch (err) {
    console.error('HeyGen createVideo failed:', err);
    throw err;
  }
}

// ─── Проверка статуса видео ──────────────────────────────────────────────────

export async function getVideoStatus(
  apiKey: string,
  videoId: string
): Promise<HeygenVideoResponse> {
  if (!apiKey) {
    return { video_id: videoId, status: 'completed', video_url: '' };
  }

  try {
    const res = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, {
      method: 'GET',
      headers: headers(apiKey),
    });

    if (!res.ok) {
      throw new Error(`HeyGen status error: ${res.status}`);
    }

    const data = await res.json();
    const video = data.data || data;

    return {
      video_id: videoId,
      status: video.status || 'unknown',
      video_url: video.video_url,
    };
  } catch (err) {
    console.error('HeyGen getVideoStatus failed:', err);
    throw err;
  }
}
