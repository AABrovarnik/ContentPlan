import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateVideoScript } from '../services/aiService';
import { getAvatars, getVoices, createVideo, getVideoStatus } from '../services/heygenService';
import { copyToClipboard } from '../utils/copyToClipboard';
import { downloadText } from '../utils/download';
import type { HeygenAvatar } from '../services/heygenService';

type VideoStatus = 'idle' | 'generating' | 'processing' | 'ready' | 'error';

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
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState('');

  const uniqueTopics = [...new Set(contentPlan.flatMap((item) => item.topics))];

  const loadAvatarsAndVoices = async () => {
    if (avatars.length === 0) {
      const avs = await getAvatars(settings.heygenApiKey);
      setAvatars(avs);
      if (avs.length > 0 && !selectedAvatar) setSelectedAvatar(avs[0].avatar_id);
    }
    if (voices.length === 0) {
      const vs = await getVoices(settings.heygenApiKey);
      setVoices(vs);
      if (vs.length > 0 && !selectedVoice) setSelectedVoice(vs[0].voice_id);
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
      const result = await generateVideoScript(selectedTopic, details, {
        aiProvider: settings.aiProvider,
        geminiApiKey: settings.geminiApiKey,
      });
      setScript(result);
      setEditedScript(result);
      setVideoUrl(null);
      setVideoStatus('idle');
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
    if (!script.trim()) {
      setError('Сначала сгенерируйте сценарий');
      return;
    }
    setVideoStatus('generating');
    setVideoProgress('Отправляем запрос в HeyGen...');
    setVideoUrl(null);

    try {
      const res = await createVideo(settings.heygenApiKey, selectedAvatar, selectedVoice, script);
      setVideoStatus('processing');
      setVideoProgress('Видео генерируется... Это может занять 1-3 минуты');

      // Polling статуса видео
      const videoId = res.video_id;
      let attempts = 0;
      const maxAttempts = 60; // 3 минуты с интервалом 3 сек

      const poll = async () => {
        attempts++;
        try {
          const status = await getVideoStatus(settings.heygenApiKey, videoId);

          if (status.status === 'completed' && status.video_url) {
            setVideoUrl(status.video_url);
            setVideoStatus('ready');
            setVideoProgress('');
            setNotification('Видео готово!');
            setTimeout(() => setNotification(null), 2000);
            return;
          }

          if (status.status === 'failed') {
            setVideoStatus('error');
            setVideoProgress('Ошибка генерации видео');
            setError('HeyGen: ошибка генерации видео');
            return;
          }

          if (attempts >= maxAttempts) {
            setVideoStatus('error');
            setVideoProgress('Превышено время ожидания');
            setError('HeyGen: видео не было сгенерировано за отведённое время');
            return;
          }

          setVideoProgress(`Видео генерируется... (${attempts * 3} сек)`);
          setTimeout(poll, 3000);
        } catch {
          setVideoStatus('error');
          setVideoProgress('Ошибка проверки статуса');
        }
      };

      setTimeout(poll, 3000);
    } catch (err) {
      setVideoStatus('error');
      const msg = err instanceof Error ? err.message : 'Ошибка создания видео';
      setVideoProgress(msg);
      setError(msg);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(script);
    if (ok) {
      setNotification('Скопировано!');
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleDownloadScript = () => {
    downloadText(script, `video-script-${topic || 'custom'}.txt`);
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
                <button onClick={handleDownloadScript} className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                  Скачать
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

          {/* Статус видео */}
          {videoStatus !== 'idle' && (
            <div className="px-4 py-3 border-t border-slate-200">
              {videoStatus === 'generating' && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-600">{videoProgress}</span>
                </div>
              )}
              {videoStatus === 'processing' && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-600">{videoProgress}</span>
                </div>
              )}
              {videoStatus === 'error' && (
                <div className="text-sm text-red-600">{videoProgress}</div>
              )}
            </div>
          )}

          {/* Видеоплеер */}
          {videoUrl && videoStatus === 'ready' && (
            <div className="px-4 py-3 border-t border-slate-200">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '400px' }}
              >
                Ваш браузер не поддерживает видео.
              </video>
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-center px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Скачать .mp4
              </a>
            </div>
          )}

          {/* Кнопка создания видео */}
          {script && videoStatus !== 'processing' && videoStatus !== 'generating' && (
            <div className="px-4 py-3 border-t border-slate-200">
              <button
                onClick={handleCreateVideo}
                disabled={!selectedAvatar || !selectedVoice}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {videoStatus === 'ready' ? 'Пересоздать видео' : 'Создать видео в HeyGen'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
