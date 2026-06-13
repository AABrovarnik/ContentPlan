import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generatePodcastScript } from '../services/aiService';
import { copyToClipboard } from '../utils/copyToClipboard';
import type { PodcastStyle, PodcastFormat, VoiceGender, VoiceTimbre, VoiceQuality, Emotion, Speed } from '../types';

const STYLES: PodcastStyle[] = ['Разговорный', 'Доверительный', 'Мотивирующий', 'Обучающий', 'Сторителлинг'];
const FORMATS: PodcastFormat[] = ['Монолог', 'Экспертный разбор'];
const DURATIONS = ['1 мин', '3 мин', '5 мин', '8 мин'];
const GENDERS: VoiceGender[] = ['Мужской', 'Женский'];
const TIMBRES: VoiceTimbre[] = ['Низкий', 'Средний', 'Высокий'];
const QUALITIES: VoiceQuality[] = ['Стандартное', 'Высокое', 'Премиум'];
const EMOTIONS: Emotion[] = ['Нейтральная', 'Дружелюбная', 'Энергичная', 'Спокойная'];
const SPEEDS: Speed[] = ['0.8x', '1.0x', '1.2x'];

export function PodcastGenerator() {
  const { contentPlan, setError, setNotification, settings } = useAppStore();
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [details, setDetails] = useState('');
  const [duration, setDuration] = useState('3 мин');
  const [style, setStyle] = useState<PodcastStyle>('Разговорный');
  const [format, setFormat] = useState<PodcastFormat>('Монолог');

  const [script, setScript] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedScript, setEditedScript] = useState('');

  const [gender, setGender] = useState<VoiceGender>('Мужской');
  const [timbre, setTimbre] = useState<VoiceTimbre>('Средний');
  const [speed, setSpeed] = useState<Speed>('1.0x');
  const [quality, setQuality] = useState<VoiceQuality>('Стандартное');
  const [emotion, setEmotion] = useState<Emotion>('Нейтральная');

  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const uniqueTopics = [...new Set(contentPlan.flatMap((item) => item.topics))];

  const handleGenerateScript = async () => {
    const selectedTopic = topic === 'custom' ? customTopic : topic;
    if (!selectedTopic.trim()) {
      setError('Выберите или введите тему');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await generatePodcastScript(selectedTopic, details, duration, style, format, {
        aiProvider: settings.aiProvider,
        geminiApiKey: settings.geminiApiKey,
      });
      setScript(result);
      setEditedScript(result);
      setAudioReady(false);
    } catch {
      setError('Ошибка генерации сценария');
    }
    setLoading(false);
  };

  const handleSaveEdit = () => {
    setScript(editedScript);
    setEditing(false);
    setNotification('Сценарий сохранён');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleGenerateAudio = async () => {
    setAudioLoading(true);
    await new Promise((r) => setTimeout(r, 2500));
    setAudioReady(true);
    setAudioLoading(false);
    setNotification('Аудио готово!');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(script);
    if (ok) {
      setNotification('Скопировано!');
      setTimeout(() => setNotification(null), 2000);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="w-80 shrink-0 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
          <h2 className="font-semibold text-slate-800">Подкасты</h2>

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
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">Длительность</label>
            <div className="grid grid-cols-4 gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                    duration === d
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Стиль</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as PodcastStyle)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Формат</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as PodcastFormat)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateScript}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Генерируем...' : 'Сгенерировать сценарий'}
          </button>
        </div>

        {script && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Настройки голоса</h3>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Пол</label>
              <div className="flex gap-1">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                      gender === g ? 'bg-green-100 border-green-400 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Тембр</label>
              <div className="flex gap-1">
                {TIMBRES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimbre(t)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                      timbre === t ? 'bg-green-100 border-green-400 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Скорость</label>
              <div className="flex gap-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                      speed === s ? 'bg-green-100 border-green-400 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Качество</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as VoiceQuality)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {QUALITIES.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Эмоция</label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value as Emotion)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {EMOTIONS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateAudio}
              disabled={audioLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {audioLoading ? 'Создаём аудио...' : 'Озвучить подкаст'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Результат</span>
            {script && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                  Копировать
                </button>
                {!editing && (
                  <button onClick={() => { setEditing(true); setEditedScript(script); }} className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                    Редактировать
                  </button>
                )}
                {editing && (
                  <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded-md transition-colors">
                    Сохранить
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {script ? (
              editing ? (
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  className="w-full h-full min-h-[400px] text-sm text-slate-800 font-sans leading-relaxed resize-none focus:outline-none"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">{script}</pre>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Здесь появится сценарий подкаста
              </div>
            )}
          </div>
          {audioReady && (
            <div className="px-4 py-3 border-t border-slate-200">
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">▶</div>
                <div className="flex-1">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-green-500 rounded-full" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">0:00 / {duration}</p>
                </div>
                <button className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                  Скачать MP3
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
