import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Modal } from './ui/Modal';
import { checkHeygenConnection } from '../services/heygenService';
import { checkTTSConnection } from '../services/ttsService';

const TTS_PROVIDERS = ['ElevenLabs', 'Google Cloud TTS', 'Yandex SpeechKit', 'Другой'];

export function Settings() {
  const { settings, updateSettings, settingsOpen, setSettingsOpen, setNotification, setError } = useAppStore();
  const [local, setLocal] = useState({ ...settings });
  const [checking, setChecking] = useState<'heygen' | 'tts' | null>(null);

  const handleSave = () => {
    if (!local.heygenApiKey.trim()) {
      setError('API ключ HeyGen обязателен');
      return;
    }
    updateSettings(local);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCheckHeygen = async () => {
    setChecking('heygen');
    try {
      const ok = await checkHeygenConnection(local.heygenApiKey);
      setNotification(ok ? 'HeyGen подключён' : 'Ошибка подключения к HeyGen');
    } catch {
      setError('Ошибка проверки HeyGen');
    }
    setChecking(null);
  };

  const handleCheckTTS = async () => {
    setChecking('tts');
    try {
      const ok = await checkTTSConnection(local.ttsProvider, local.ttsApiKey);
      setNotification(ok ? `${local.ttsProvider} подключён` : `Ошибка ${local.ttsProvider}`);
    } catch {
      setError(`Ошибка проверки ${local.ttsProvider}`);
    }
    setChecking(null);
  };

  return (
    <Modal open={settingsOpen} title="Настройки" onClose={() => setSettingsOpen(false)}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">API ключ HeyGen *</label>
          <input
            type="password"
            value={local.heygenApiKey}
            onChange={(e) => setLocal({ ...local, heygenApiKey: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Введите API ключ"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">TTS-провайдер</label>
          <select
            value={local.ttsProvider}
            onChange={(e) => setLocal({ ...local, ttsProvider: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {TTS_PROVIDERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">API ключ TTS</label>
          <input
            type="password"
            value={local.ttsApiKey}
            onChange={(e) => setLocal({ ...local, ttsApiKey: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Введите API ключ TTS"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">API ключ генерации изображений</label>
          <input
            type="password"
            value={local.imageApiKey}
            onChange={(e) => setLocal({ ...local, imageApiKey: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Необязательно"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Сохранить
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCheckHeygen}
            disabled={checking !== null}
            className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {checking === 'heygen' ? 'Проверка...' : 'Проверить HeyGen'}
          </button>
          <button
            onClick={handleCheckTTS}
            disabled={checking !== null}
            className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {checking === 'tts' ? 'Проверка...' : 'Проверить TTS'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
