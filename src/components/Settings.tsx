import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Modal } from './ui/Modal';
import { checkHeygenConnection } from '../services/heygenService';
import { checkTTSConnection } from '../services/ttsService';
import { checkGeminiConnection } from '../services/aiService';
import type { AIProvider } from '../types';

const TTS_PROVIDERS = ['ElevenLabs', 'Google Cloud TTS', 'Yandex SpeechKit', 'Другой'];
const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'mock', label: 'Mock (без API)' },
  { value: 'gemini', label: 'Google Gemini' },
];

export function Settings() {
  const { settings, updateSettings, settingsOpen, setSettingsOpen, setNotification, setError } = useAppStore();
  const [local, setLocal] = useState({ ...settings });
  const [checking, setChecking] = useState<'heygen' | 'tts' | 'gemini' | null>(null);

  const handleSave = () => {
    if (local.aiProvider === 'gemini' && !local.geminiApiKey.trim()) {
      setError('Для Gemini обязателен API ключ');
      return;
    }
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

  const handleCheckGemini = async () => {
    setChecking('gemini');
    try {
      const ok = await checkGeminiConnection(local.geminiApiKey);
      setNotification(ok ? 'Gemini подключён' : 'Ошибка подключения к Gemini');
    } catch {
      setError('Ошибка проверки Gemini');
    }
    setChecking(null);
  };

  return (
    <Modal open={settingsOpen} title="Настройки" onClose={() => setSettingsOpen(false)}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* AI Провайдер */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">AI-генерация</h4>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Провайдер</label>
            <select
              value={local.aiProvider}
              onChange={(e) => setLocal({ ...local, aiProvider: e.target.value as AIProvider })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {local.aiProvider === 'gemini' && (
            <div>
              <label className="block text-sm text-slate-600 mb-1">API ключ Gemini *</label>
              <input
                type="password"
                value={local.geminiApiKey}
                onChange={(e) => setLocal({ ...local, geminiApiKey: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="AIza..."
              />
              <p className="text-xs text-slate-400 mt-1">
                Получите ключ в{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-green-600 underline">
                  Google AI Studio
                </a>
              </p>
            </div>
          )}
          {local.aiProvider === 'gemini' && (
            <button
              onClick={handleCheckGemini}
              disabled={checking !== null || !local.geminiApiKey.trim()}
              className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {checking === 'gemini' ? 'Проверка...' : 'Проверить Gemini'}
            </button>
          )}
        </div>

        {/* HeyGen */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">HeyGen</h4>
          <div>
            <label className="block text-sm text-slate-600 mb-1">API ключ HeyGen *</label>
            <input
              type="password"
              value={local.heygenApiKey}
              onChange={(e) => setLocal({ ...local, heygenApiKey: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Введите API ключ"
            />
            <p className="text-xs text-slate-400 mt-1">
              Получите ключ в{' '}
              <a href="https://app.heygen.com/settings?nav=API" target="_blank" rel="noreferrer" className="text-green-600 underline">
                HeyGen Dashboard
              </a>
            </p>
          </div>
          <button
            onClick={handleCheckHeygen}
            disabled={checking !== null || !local.heygenApiKey.trim()}
            className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {checking === 'heygen' ? 'Проверка...' : 'Проверить HeyGen'}
          </button>
        </div>

        {/* TTS */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">TTS (озвучка)</h4>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Провайдер</label>
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
            <label className="block text-sm text-slate-600 mb-1">API ключ TTS</label>
            <input
              type="password"
              value={local.ttsApiKey}
              onChange={(e) => setLocal({ ...local, ttsApiKey: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Введите API ключ TTS"
            />
          </div>
          <button
            onClick={handleCheckTTS}
            disabled={checking !== null}
            className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {checking === 'tts' ? 'Проверка...' : 'Проверить TTS'}
          </button>
        </div>

        {/* Изображения */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">Генерация изображений</h4>
          <div>
            <label className="block text-sm text-slate-600 mb-1">API ключ (необязательно)</label>
            <input
              type="password"
              value={local.imageApiKey}
              onChange={(e) => setLocal({ ...local, imageApiKey: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Необязательно"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Сохранить настройки
        </button>
      </div>
    </Modal>
  );
}
