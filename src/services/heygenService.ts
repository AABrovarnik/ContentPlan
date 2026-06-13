export interface HeygenAvatar {
  avatar_id: string;
  name: string;
  preview_url?: string;
}

export interface HeygenVideoResponse {
  video_id: string;
  status: string;
}

const MOCK_AVATARS: HeygenAvatar[] = [
  { avatar_id: 'business_01', name: 'Business Avatar' },
  { avatar_id: 'friendly_01', name: 'Friendly Expert' },
  { avatar_id: 'teacher_01', name: 'Teacher Avatar' },
];

const MOCK_VOICES = [
  { voice_id: 'ru_male_01', name: 'Русский мужской' },
  { voice_id: 'ru_female_01', name: 'Русский женский' },
  { voice_id: 'ru_friendly_01', name: 'Русский дружелюбный' },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAvatars(apiKey: string): Promise<HeygenAvatar[]> {
  if (!apiKey) return MOCK_AVATARS;
  // Реальный запрос:
  // const res = await fetch('https://api.heygen.com/v2/avatars', {
  //   headers: { 'X-Api-Key': apiKey }
  // });
  // return res.json();
  await delay(1000);
  return MOCK_AVATARS;
}

export async function getVoices(apiKey: string) {
  if (!apiKey) return MOCK_VOICES;
  await delay(800);
  return MOCK_VOICES;
}

export async function createVideo(
  _apiKey: string,
  _avatarId: string,
  _voiceId: string,
  _script: string
): Promise<HeygenVideoResponse> {
  // Реальный запрос:
  // const res = await fetch('https://api.heygen.com/v2/video/generate', {
  //   method: 'POST',
  //   headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ video_inputs: [{ ... }] })
  // });
  // return res.json();
  await delay(2000);
  return { video_id: `mock_video_${Date.now()}`, status: 'processing' };
}

export async function getVideoStatus(_apiKey: string, videoId: string): Promise<HeygenVideoResponse> {
  await delay(3000);
  return { video_id: videoId, status: 'completed' };
}

export async function checkHeygenConnection(_apiKey: string): Promise<boolean> {
  await delay(1500);
  return true;
}
