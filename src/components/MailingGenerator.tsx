import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateMailingText, generateImagePrompt, generateMissingVarsPrompt } from '../services/aiService';
import { Modal } from './ui/Modal';
import type { Channel, Tone } from '../types';

const CHANNELS: Channel[] = ['Email', 'Telegram', 'ВКонтакте'];
const TONES: Tone[] = ['Дружелюбный', 'Экспертный', 'Минималистичный'];

export function MailingGenerator() {
  const { contentPlan, setError, setNotification } = useAppStore();
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [details, setDetails] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [tone, setTone] = useState<Tone>('Дружелюбный');
  const [result, setResult] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const [varsModalOpen, setVarsModalOpen] = useState(false);
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  const uniqueTopics = [...new Set(contentPlan.flatMap((item) => item.topics))];

  const toggleChannel = (ch: Channel) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  const handleGenerate = async () => {
    const selectedTopic = topic === 'custom' ? customTopic : topic;
    if (!selectedTopic.trim()) {
      setError('Выберите или введите тему');
      return;
    }
    if (channels.length === 0) {
      setError('Выберите хотя бы один канал');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await generateMailingText(selectedTopic, details, channels, tone);

      if (res.missingVars.length > 0) {
        setMissingVars(res.missingVars);
        setVarsModalOpen(true);
        setLoading(false);
        return;
      }

      setResult(res.text);
      const imgPrompt = await generateImagePrompt(selectedTopic, channels[0]);
      setImagePrompt(imgPrompt);
    } catch {
      setError('Ошибка генерации текста');
    }
    setLoading(false);
  };

  const handleVarsSubmit = async () => {
    setVarsModalOpen(false);
    setLoading(true);
    try {
      const selectedTopic = topic === 'custom' ? customTopic : topic;
      const filledText = `${selectedTopic}\n\n${Object.entries(varValues)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')}\n\n(Текст сгенерирован с учётом введённых данных)`;
      setResult(filledText);
      const imgPrompt = await generateImagePrompt(selectedTopic, channels[0] || 'Email');
      setImagePrompt(imgPrompt);
    } catch {
      setError('Ошибка генерации');
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="w-80 shrink-0 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
          <h2 className="font-semibold text-slate-800">Рассылки</h2>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Тема</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Выберите тему...</option>
              {uniqueTopics.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
              <option value="custom">Своя тема</option>
            </select>
            {topic === 'custom' && (
              <input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-3 py-2 mt-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Введите тему..."
              />
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Уточнение</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Дополнительная информация..."
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">Каналы</label>
            <div className="flex gap-2">
              {CHANNELS.map((ch) => (
                <label
                  key={ch}
                  className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition-colors ${
                    channels.includes(ch)
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes(ch)}
                    onChange={() => toggleChannel(ch)}
                    className="sr-only"
                  />
                  {ch}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Тон</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Генерируем...' : 'Сгенерировать текст'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200">
            <span className="text-sm font-medium text-slate-600">Результат</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {result ? (
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">{result}</pre>
                {imagePrompt && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">Промпт для изображения:</p>
                    <p className="text-sm text-slate-700">{imagePrompt}</p>
                    <div className="mt-2 h-32 bg-slate-200 rounded flex items-center justify-center text-slate-400 text-sm">
                      Превью изображения
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Здесь появится результат генерации
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={varsModalOpen} title="Для качественного текста нужны уточнения" onClose={() => setVarsModalOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">AI определил, что для лучшего результата нужны дополнительные данные:</p>
          {missingVars.map((v) => (
            <div key={v}>
              <label className="block text-sm text-slate-700 mb-1 capitalize">{v}</label>
              <input
                value={varValues[v] || ''}
                onChange={(e) => setVarValues({ ...varValues, [v]: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
          <button
            onClick={handleVarsSubmit}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Сгенерировать с данными
          </button>
        </div>
      </Modal>
    </div>
  );
}
