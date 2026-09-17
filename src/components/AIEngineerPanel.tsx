import { useState, useRef, useEffect } from 'react';
import { Mic, Send, MessageSquare, Bot, Loader2, X } from 'lucide-react';

interface ToolCall {
  name: string;
  args: any;
  id?: string;
}

interface AIEngineerPanelProps {
  onToolCall: (call: ToolCall) => any;
}

export default function AIEngineerPanel({ onToolCall }: AIEngineerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'prompt' | 'live' | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Helper to convert float32 to base64 pcm 16
  const pcmToBase64 = (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper to play base64 audio
  const nextStartTimeRef = useRef(0);
  const playAudioChunk = async (ctx: AudioContext, base64Audio: string) => {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const float32Array = new Float32Array(bytes.length / 2);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < float32Array.length; i++) {
      float32Array[i] = view.getInt16(i * 2, true) / 0x8000;
    }
    
    const buffer = ctx.createBuffer(1, float32Array.length, 24000);
    buffer.getChannelData(0).set(float32Array);
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      
      if (data.functionCalls) {
        for (const call of data.functionCalls) {
          onToolCall(call);
        }
      }
      setPrompt("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const startLiveMode = async () => {
    try {
      setIsProcessing(true);
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${host}/live`);
      wsRef.current = ws;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onopen = () => {
        setLiveConnected(true);
        setIsProcessing(false);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playAudioChunk(outputCtx, msg.audio);
        }
        if (msg.toolCalls) {
          const responses = msg.toolCalls.map((call: any) => {
            const result = onToolCall(call);
            return {
              id: call.id,
              name: call.name,
              response: result || { success: true }
            };
          });
          if (ws.readyState === WebSocket.OPEN) {
             ws.send(JSON.stringify({ toolResponses: responses }));
          }
        }
      };

      ws.onclose = () => stopLiveMode();
    } catch (e) {
      console.error(e);
      stopLiveMode();
      setIsProcessing(false);
    }
  };

  const stopLiveMode = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputCtxRef.current) inputCtxRef.current.close();
    if (outputCtxRef.current) outputCtxRef.current.close();
    setLiveConnected(false);
    setMode(null);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#FF4D00] text-black px-4 py-3 rounded-full font-black uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(255,77,0,0.4)] hover:scale-105 transition-transform"
      >
        <Bot size={16} />
        AI Engineer
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-[#111111] border border-[#222222] rounded-xl shadow-2xl overflow-hidden text-[#E0E0E0] font-sans">
      <div className="flex items-center justify-between p-3 bg-[#0D0D0D] border-b border-[#222222]">
        <div className="flex items-center gap-2 text-[#FF4D00]">
          <Bot size={16} />
          <span className="font-black uppercase tracking-widest text-[10px]">AI Engineer</span>
        </div>
        <button onClick={() => { setIsOpen(false); stopLiveMode(); }} className="text-[#666] hover:text-[#E0E0E0]">
          <X size={14} />
        </button>
      </div>

      <div className="p-4">
        {!mode ? (
          <div className="flex gap-2">
            <button 
              onClick={() => setMode('prompt')}
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333] p-4 rounded uppercase text-[10px] font-bold tracking-widest transition-colors"
            >
              <MessageSquare size={20} />
              Text Prompt
            </button>
            <button 
              onClick={() => { setMode('live'); startLiveMode(); }}
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333] p-4 rounded uppercase text-[10px] font-bold tracking-widest transition-colors"
            >
              <Mic size={20} />
              Live Chat
            </button>
          </div>
        ) : mode === 'prompt' ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. Add a channel, mute channel 1..."
              className="w-full bg-[#1A1A1A] border border-[#333] p-2 text-xs rounded text-white resize-none outline-none focus:border-[#FF4D00] transition-colors h-24"
            />
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setMode(null)}
                className="text-[10px] uppercase font-bold text-[#666] hover:text-white"
              >
                Back
              </button>
              <button 
                onClick={handlePromptSubmit}
                disabled={isProcessing || !prompt.trim()}
                className="flex items-center gap-1 bg-[#FF4D00] text-black px-3 py-1.5 rounded text-[10px] uppercase font-black tracking-widest disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${liveConnected ? 'border-[#FF4D00] bg-[#FF4D00]/10' : 'border-[#333] bg-[#1A1A1A]'}`}>
                {isProcessing && !liveConnected ? (
                  <Loader2 size={24} className="text-[#FF4D00] animate-spin" />
                ) : (
                  <Mic size={24} className={liveConnected ? 'text-[#FF4D00] animate-pulse' : 'text-[#666]'} />
                )}
              </div>
              {liveConnected && (
                <div className="absolute -inset-2 border-2 border-[#FF4D00]/30 rounded-full animate-ping"></div>
              )}
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#E0E0E0]">
                {liveConnected ? 'Listening & Speaking...' : 'Connecting...'}
              </div>
              <div className="text-[9px] font-bold text-[#666] uppercase mt-1">
                Say "Add a channel" or "Mute all"
              </div>
            </div>
            <button 
              onClick={stopLiveMode}
              className="mt-2 text-[10px] uppercase font-bold text-[#666] hover:text-white border border-[#333] px-3 py-1 rounded"
            >
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
