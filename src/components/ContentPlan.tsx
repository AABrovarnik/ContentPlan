import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateContentPlan } from '../services/aiService';
import { copyToClipboard } from '../utils/copyToClipboard';
import type { Channel, Period, ContentPlanItem } from '../types';

const CHANNELS: Channel[] = ['Email', 'Telegram', 'ВКонтакте'];
const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'На сегодня' },
  { value: '3days', label: 'На 3 дня' },
  { value: '5days', label: 'На 5 дней' },
  { value: 'week', label: 'На неделю' },
];

export function ContentPlan() {
  const { contentPlan, setContentPlan, clearContentPlan, setError, setNotification, settings } = useAppStore();
  const [niche, setNiche] = useState('Онлайн-школа Искусственного интеллекта');
  const [details, setDetails] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [period, setPeriod] = useState<Period>('today');
  const [loading, setLoading] = useState(false);

  const toggleChannel = (ch: Channel) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  const handleGenerate = async () => {
    if (channels.length === 0) {
      setError('Выберите хотя бы один канал');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const items = await generateContentPlan(niche, details, channels, period, {
        aiProvider: settings.aiProvider,
        geminiApiKey: settings.geminiApiKey,
      });
      setContentPlan(items);
    } catch {
      setError('Ошибка генерации контент-плана');
    }
    setLoading(false);
  };

  const handleCopyTopic = async (topic: string) => {
    const ok = await copyToClipboard(topic);
    if (ok) {
      setNotification('Тема скопирована!');
      setTimeout(() => setNotification(null), 2000);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Центральная панель */}
      <div className="w-80 shrink-0 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
          <h2 className="font-semibold text-slate-800">Контент-план</h2>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Ниша бизнеса</label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
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
            <label className="block text-sm text-slate-600 mb-2">Период</label>
            <div className="grid grid-cols-2 gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    period === p.value
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Генерируем...' : 'Сгенерировать план'}
            </button>
            {contentPlan.length > 0 && (
              <button
                onClick={clearContentPlan}
                className="px-3 py-2.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                Очистить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Правая панель */}
      <div className="flex-1 min-w-0">
        <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200">
            <span className="text-sm font-medium text-slate-600">Результат</span>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {contentPlan.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Здесь появится результат генерации
              </div>
            ) : (
              contentPlan.map((item: ContentPlanItem) => (
                <div key={item.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        {item.channel}
                      </span>
                      <span className="text-xs text-slate-500">{item.date}</span>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {item.topics.map((topic, i) => (
                      <div key={i} className="flex items-start gap-2 group">
                        <span className="text-sm text-slate-800 flex-1">{topic}</span>
                        <button
                          onClick={() => handleCopyTopic(topic)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-green-600 transition-all text-sm shrink-0"
                          title="Копировать тему"
                        >
                          📋
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
