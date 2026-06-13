import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateVideoScript } from '../services/aiService';
import { getAvatars, getVoices, createVideo } from '../services/heygenService';
import { copyToClipboard } from '../utils/copyToClipboard';
import type { HeygenAvatar } from '../services/heygenService';

export function VideoAvatarGenerator() {
  const { contentPlan, settings, setError, setNotification } = useAppStore();
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [details, setDetails] = useState('');

  const [script, setScript] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedScript, setEditedScript] = useState('');

  const [avatars, setAvatars] = useState<HeygenAvatar[]>([]);
  const [voices, setVoices] = useState<{ voice_id: string; name: string }[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');

  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const uniqueTopics = [...new Set(contentPlan.flatMap((item) => item.topics))];

  const loadAvatarsAndVoices = async () => {
    if (avatars.length === 0) {
      const avs = await getAvatars(settings.heygenApiKey);
      setAvatars(avs);
      if (avs.length > 0) setSelectedAvatar(avs[0].avatar_id);
    }
    if (voices.length === 0) {
      const vs = await getVoices(settings.heygenApiKey);
      setVoices(vs);
      if (vs.length > 0) setSelectedVoice(vs[0].voice_id);
    }
  };

  const handleGenerateScript = async () => {
    const selectedTopic = topic === 'custom' ? customTopic : topic;
    if (!selectedTopic.trim()) {
      setError('Выберите или введите тему');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loadAvatarsAndVoices();
      const result = await generateVideoScript(selectedTopic, details);
      setScript(result);
      setEditedScript(result);
      setVideoUrl(null);
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

  const handleCreateVideo = async () => {
    setVideoLoading(true);
    try {
      const res = await createVideo(settings.heygenApiKey, selectedAvatar, selectedVoice, script);
      await new Promise((r) => setTimeout(r, 3000));
      setVideoUrl(`https://mock-videos.example.com/${res.video_id}.mp4`);
      setNotification('Видео готово!');
      setTimeout(() => setNotification(null), 2000);
    } catch {
      setError('Ошибка создания видео');
    }
    setVideoLoading(false);
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
          <h2 className="font-semibold text-slate-800">Видео-аватар</h2>

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
            <label className="block text-sm text-slate-600 mb-1">Аватар</label>
            <select
              value={selectedAvatar}
              onChange={(e) => setSelectedAvatar(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {avatars.map((a) => (
                <option key={a.avatar_id} value={a.avatar_id}>{a.name}</option>
              ))}
              {avatars.length === 0 && <option>Загрузка...</option>}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Голос</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {voices.map((v) => (
                <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
              ))}
              {voices.length === 0 && <option>Загрузка...</option>}
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
                {!editing ? (
                  <button onClick={() => { setEditing(true); setEditedScript(script); }} className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                    Редактировать
                  </button>
                ) : (
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
                  className="w-full h-full min-h-[300px] text-sm text-slate-800 font-sans leading-relaxed resize-none focus:outline-none"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">{script}</pre>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Здесь появится сценарий видео
              </div>
            )}
          </div>
          {script && (
            <div className="px-4 py-3 border-t border-slate-200">
              <button
                onClick={handleCreateVideo}
                disabled={videoLoading || !selectedAvatar || !selectedVoice}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {videoLoading ? 'Видео генерируется...' : 'Создать видео в HeyGen'}
              </button>
            </div>
          )}
          {videoUrl && (
            <div className="px-4 py-3 border-t border-slate-200">
              <div className="bg-slate-100 rounded-lg aspect-video flex items-center justify-center text-slate-500 text-sm">
                Видеоплеер (mock)
              </div>
              <button className="mt-2 w-full px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Скачать .mp4
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
