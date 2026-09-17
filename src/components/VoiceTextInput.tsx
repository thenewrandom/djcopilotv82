import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface VoiceTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}

export const VoiceTextInput: React.FC<VoiceTextInputProps> = ({ value, onValueChange, className = '', label, ...props }) => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseValueRef = useRef(value);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => recognitionRef.current?.abort?.(), []);

  const toggleMic = async () => {
    setError('');
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice-to-text is not supported by this browser. Try Chrome or Edge.');
      return;
    }

    try {
      setBusy(true);
      // Explicitly request permission on mic click so the browser permission prompt appears here.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';
      baseValueRef.current = value.trim();
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
        const next = [baseValueRef.current, transcript.trim()].filter(Boolean).join(' ');
        onValueChange(next);
      };
      recognition.onerror = (event: any) => {
        setListening(false);
        setBusy(false);
        setError(event?.error === 'not-allowed' ? 'Microphone permission was denied.' : `Voice input error: ${event?.error || 'unknown error'}`);
      };
      recognition.onend = () => { setListening(false); setBusy(false); };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setBusy(false);
    } catch (err) {
      setBusy(false);
      setError(err instanceof DOMException && err.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'Could not access the microphone.');
    }
  };

  return (
    <div className="relative">
      <input {...props} aria-label={label || props.placeholder} value={value} onChange={e => onValueChange(e.target.value)} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={toggleMic}
        title={listening ? 'Stop voice-to-text' : 'Voice-to-text'}
        aria-label={listening ? 'Stop voice-to-text' : 'Start voice-to-text'}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${listening ? 'bg-red-500/20 text-red-300 border border-red-400/40 animate-pulse' : 'bg-slate-800/80 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 border border-slate-700'} disabled:opacity-50`}
        disabled={busy}
      >
        {busy ? <Loader className="w-4 h-4 animate-spin" /> : listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
      {error && <div className="absolute left-0 top-full z-20 mt-1 text-[10px] text-red-300 bg-slate-950 border border-red-500/30 rounded-lg px-2 py-1 shadow-xl">{error}</div>}
    </div>
  );
};
