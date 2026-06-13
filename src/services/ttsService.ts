export interface TTSResult {
  audioUrl: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateSpeech(
  _text: string,
  _options: {
    gender: string;
    timbre: string;
    speed: string;
    quality: string;
    emotion: string;
  }
): Promise<TTSResult> {
  // Mock: создаём простой аудио-тон через AudioContext
  await delay(2000);

  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = _options.gender === 'Мужской' ? 120 : 220;
  oscillator.type = 'sine';
  gainNode.gain.value = 0;

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.01);

  return { audioUrl: '' };
}

export async function checkTTSConnection(_provider: string, _apiKey: string): Promise<boolean> {
  await delay(1500);
  return true;
}
