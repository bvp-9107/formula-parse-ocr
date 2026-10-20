import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MathRenderer } from './components/MathRenderer';
import { AuthModal } from './components/AuthModal';
import { PasswordResetPage } from './components/PasswordResetPage';
import { SettingsModal } from './components/SettingsModal';
import { ThemeMode, ViewMode, ParsedBlock } from './types';
import { generateDocx } from './services/docxGenerator';
import { latexToOmml } from './lib/latexToOmml';
import { getRemainingGuestScans, incrementGuestScanCount } from './lib/usageTracker';
import { supabase } from './lib/supabase';
import { Upload, Copy, Download, FileCheck, RefreshCw, Trash2, Plus, Check, FileCode, FileText, Camera, X } from 'lucide-react';

const makeBlocksFromText = (raw: string): ParsedBlock[] => {
  const text = raw.trim();
  if (!text) return [];
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  return lines.map((line, index) => {
    const cleaned = line.replace(/^\$\$(.*?)\$\$$/s, '$1').replace(/^\$(.*?)\$$/s, '$1').trim();
    const looksLikeMath = /[=^_\\]|\\begin\{|\\frac|\\int|\\sum|→|->/.test(cleaned);
    return { id: `${Date.now()}-${index}`, type: looksLikeMath ? 'display_equation' : 'paragraph', content: cleaned };
  });
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('formula_parse_theme') as ThemeMode) || 'system');
  useEffect(() => { localStorage.removeItem('math_scan_custom_key'); }, []);
  const [viewMode, setViewMode] = useState<ViewMode>('web');
const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [userSession, setUserSession] = useState<any>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [blocks, setBlocks] = useState<ParsedBlock[]>([
    {
      id: '1',
      type: 'paragraph',
      content: 'Solving the chemical reaction and integral step-by-step:'
    },
    {
      id: '2',
      type: 'display_equation',
      content: '2H_2 + O_2 \\rightarrow 2H_2O'
    },
    {
      id: '3',
      type: 'display_equation',
      content: '\\int_{0}^{\\pi} \\sin^2(x) \\, dx = \\frac{\\pi}{2}'
    }
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => { if (!userSession && getRemainingGuestScans() <= 0) setScanLimitReached(true); }, [userSession]);

  useEffect(() => {
    if (!cameraOpen) return;
    let active = true;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(stream => { if (!active) { stream.getTracks().forEach(t => t.stop()); return; } streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => setCameraError('Camera access was denied or no camera is available. Check browser permissions or use file upload.'));
    return () => { active = false; streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };
  }, [cameraOpen]);

  // System Default + Dark / Light theme listener
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('formula_parse_theme', theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (theme === 'system') {
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      } else if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
      if (!allowed.includes(selected.type) && !/\.(png|jpe?g|webp|pdf)$/i.test(selected.name)) { showToast('Please choose a PNG, JPG, WEBP, or PDF file.'); e.target.value = ''; return; }
      if (selected.size > 10 * 1024 * 1024) { showToast('File is too large. Maximum size is 10 MB.'); e.target.value = ''; return; }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selected);
      setPreviewUrl(selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf') ? null : URL.createObjectURL(selected));
    }
  };

  const handleRecognize = async () => {
    if (!file) return;

    if (!userSession && getRemainingGuestScans() <= 0) {
      setScanLimitReached(true);
      setIsAuthOpen(true);
      return;
    }

setLoading(true);
    setOcrProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/pix2text', { method: 'POST', body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Recognition failed. Please try again.');
      const parsed = makeBlocksFromText(String(payload.latex ?? payload.text ?? '').trim());
      if (!parsed.length) throw new Error('No text was recognized. Try a clearer image.');
      showToast('Recognition complete. Review the result before export.');
      setBlocks(parsed);
      if (!userSession) {
        const count = incrementGuestScanCount();
        setScanLimitReached(count >= 3);
      }
    } catch (err) {
      console.error('Pix2Text recognition failed:', err);
      showToast(err instanceof Error ? err.message : 'OCR failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('Copied text to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleInsertIntoWord = () => {
    if (typeof Office !== 'undefined' && Office.context && Office.context.mailbox === undefined) {
      Word.run(async (context) => {
        const selection = context.document.getSelection();
        for (const block of blocks) {
          if (block.type === 'paragraph') {
            selection.insertParagraph(block.content, Word.InsertLocation.after);
          } else {
            const omml = latexToOmml(block.content);
            selection.insertOxml(omml, Word.InsertLocation.after);
          }
        }
        await context.sync();
        showToast('Inserted successfully into Word!');
      }).catch(() => {
        const fullText = blocks.map((b) => b.content).join('\n');
        navigator.clipboard.writeText(fullText);
        showToast('Direct Office JS unavailable. Text copied for Word paste!');
      });
    } else {
      const fullText = blocks.map((b) => b.content).join('\n\n');
      navigator.clipboard.writeText(fullText);
      showToast('Copied content! Press Ctrl+V inside Word.');
    }
  };

  const handleDownloadDocx = async () => {
    const blob = await generateDocx(blocks);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FormulaParse_Scanned_Document.docx';
    a.click();
    showToast('Downloaded .docx document!');
  };

  if (isSettingsOpen && userSession) {
    return <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} userSession={userSession} onMessage={showToast} />;
  }

  if (window.location.pathname === '/reset-password') {
    return <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-yt-bg text-gray-900 dark:text-gray-100"><PasswordResetPage /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-yt-bg text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header
        theme={theme}
        setTheme={setTheme}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenSettings={() => { if (userSession) setIsSettingsOpen(true); else setIsAuthOpen(true); }}
        onOpenAuth={() => setIsAuthOpen(true)}
        userSession={userSession}
      />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-lg z-50 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={() => { setIsAuthOpen(false); setScanLimitReached(false); }} scanLimitReached={scanLimitReached} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userSession={userSession}
        onMessage={showToast}
      />
      {cameraOpen && <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"><div className="w-full max-w-2xl bg-white dark:bg-yt-surface rounded-2xl p-5"><div className="flex justify-between items-center mb-3"><h2 className="font-bold">Capture equation</h2><button aria-label="Close camera" onClick={()=>setCameraOpen(false)}><X/></button></div>{cameraError ? <p className="text-sm text-red-500">{cameraError}</p> : <video ref={videoRef} autoPlay playsInline className="w-full max-h-[60vh] bg-black rounded-xl"/>}<div className="flex gap-2 mt-4"><button disabled={!!cameraError} onClick={()=>{const v=videoRef.current;if(!v||!v.videoWidth)return;const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d')?.drawImage(v,0,0);c.toBlob(blob=>{if(!blob)return;const captured=new File([blob],`camera-capture-${Date.now()}.jpg`,{type:'image/jpeg'});if(previewUrl)URL.revokeObjectURL(previewUrl);setFile(captured);setPreviewUrl(URL.createObjectURL(captured));setCameraOpen(false);},'image/jpeg',0.92);}} className="flex-1 rounded-lg bg-blue-600 text-white p-2.5 text-sm disabled:opacity-50">Capture photo</button><button onClick={()=>setCameraOpen(false)} className="rounded-lg border border-gray-300 dark:border-yt-border p-2.5 text-sm">Cancel</button></div></div></div>}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className={`${viewMode === 'word_add_in' ? 'md:col-span-12' : 'md:col-span-5'} flex flex-col gap-4`}>
          <div className="bg-white dark:bg-yt-surface p-5 rounded-xl border border-gray-200 dark:border-yt-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                1. Upload Scan
              </h2>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-yt-border rounded-xl p-6 text-center hover:border-blue-500 transition cursor-pointer relative bg-gray-50/50 dark:bg-yt-bg/50">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf,.png,.jpg,.jpeg,.webp,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Click or Drag Image / PDF here</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP or PDF · Maximum 10 MB</p>
            </div>

            {file && !previewUrl && (
              <div className="mt-4 rounded-lg border border-gray-200 dark:border-yt-border p-4 flex items-center gap-3 bg-gray-50 dark:bg-yt-bg">
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-gray-500">PDF document · {(file.size / (1024 * 1024)).toFixed(2)} MB</p></div>
              </div>
            )}

            {previewUrl && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-yt-border max-h-64 flex justify-center bg-black/5">
                <img src={previewUrl} alt="Handwritten preview" className="object-contain h-full" />
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => { setCameraError(''); setCameraOpen(true); }} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-yt-border text-sm flex items-center justify-center gap-2"><Camera size={16}/> Capture with camera</button>
            </div>

            <button
              onClick={handleRecognize}
              disabled={!file || loading}
              className={`w-full mt-4 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition ${
                !file || loading
                  ? 'bg-gray-200 dark:bg-yt-border text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Recognizing…
                </>
              ) : (
                'Recognize Content'
              )}
            </button>
          </div>
        </div>

        <div className={`${viewMode === 'word_add_in' ? 'md:col-span-12' : 'md:col-span-7'} flex flex-col gap-4`}>
          <div className="bg-white dark:bg-yt-surface p-5 rounded-xl border border-gray-200 dark:border-yt-border shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                2. Reviewed Content
              </h2>
              <button
                onClick={() =>
                  setBlocks([
                    ...blocks,
                    { id: Date.now().toString(), type: 'paragraph', content: 'New text block...' }
                  ])
                }
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Block
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="p-3.5 rounded-lg border border-gray-200 dark:border-yt-border bg-gray-50/50 dark:bg-yt-bg/50 flex flex-col gap-2 relative"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-mono uppercase text-[10px] bg-gray-200 dark:bg-yt-border px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1">
                      {block.type === 'paragraph' ? <FileText className="w-3 h-3 text-blue-400" /> : <FileCode className="w-3 h-3 text-purple-400" />}
                      {block.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCopy(block.content, idx)} className="hover:text-blue-500 transition">
                        {copiedIndex === idx ? <FileCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setBlocks(blocks.filter((b) => b.id !== block.id))} className="hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {block.type === 'paragraph' ? (
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => {
                        const updated = [...blocks];
                        updated[idx].content = e.target.value;
                        setBlocks(updated);
                      }}
                      className="bg-transparent text-sm border-b border-transparent hover:border-gray-300 dark:hover:border-yt-border focus:border-blue-500 focus:outline-none py-1"
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="bg-white dark:bg-yt-surface p-3 rounded border border-gray-200 dark:border-yt-border text-center overflow-x-auto">
                        <MathRenderer latex={block.content} displayMode={block.type === 'display_equation'} />
                      </div>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => {
                          const updated = [...blocks];
                          updated[idx].content = e.target.value;
                          setBlocks(updated);
                        }}
                        className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-transparent border-b border-gray-200 dark:border-yt-border focus:border-blue-500 focus:outline-none py-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-yt-border flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleInsertIntoWord}
                className="flex-1 py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <FileCheck className="w-4 h-4" />
                Insert at Word Cursor
              </button>
              <button
                onClick={handleDownloadDocx}
                className="flex-1 py-2.5 px-4 rounded-lg bg-gray-800 dark:bg-yt-hover hover:bg-gray-900 text-white font-medium text-sm flex items-center justify-center gap-2 border border-gray-700 transition"
              >
                <Download className="w-4 h-4" />
                Download .docx File
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

