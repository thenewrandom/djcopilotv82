import { useState, useRef, useEffect } from 'react';
import Peer from 'peerjs';
import AIEngineerPanel from './AIEngineerPanel';
import {
  Bell,
  Info,
  Settings,
  MoreHorizontal,
  VolumeX,
  Volume2,
  EyeOff,
  Eye,
  MicOff,
  Mic,
  Headphones,
  Plus,
  PanelRight,
  Maximize,
  Minimize2,
  ChevronUp,
  ChevronDown,
  X,
  Video,
  VideoOff,
  Copy,
  Check,
  Link,
  Zap,
  UserPlus,
  MonitorPlay,
  ExternalLink,
  HelpCircle,
  Book,
  Play,
  CheckCircle
} from 'lucide-react';

export default function RemoteRecordInterface({ initialRoomCode = null, isGuest = false }: { initialRoomCode?: string | null, isGuest?: boolean }) {
  const [channels, setChannels] = useState([{ id: 1, name: 'CH1-2', volume: 80, muted: false, talkback: false, auto: false, format: 'Stereo' }]);
  const [inputsExpanded, setInputsExpanded] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoSolo, setIsVideoSolo] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(true);
  const [isControllingScreen, setIsControllingScreen] = useState(false);
  const [remoteArtistName, setRemoteArtistName] = useState(isGuest ? "Host" : "Guest");
  const [isDAWLinked, setIsDAWLinked] = useState(false);
  const [linkedDAWName, setLinkedDAWName] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPlayingTutorial, setIsPlayingTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [selectedInterface, setSelectedInterface] = useState("Universal Audio Apollo Twin");
  const [detectedDevices, setDetectedDevices] = useState<MediaDeviceInfo[]>([]);
  const [copied, setCopied] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  
  const [roomCode, setRoomCode] = useState<string | null>(initialRoomCode);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerInstanceRef = useRef<Peer | null>(null);
  
  // Always get local media
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startLocalMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Could not get local media", err);
      }
    };
    startLocalMedia();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize WebRTC with PeerJS
  useEffect(() => {
    if (!roomCode || !localStream) return;

    const hostId = `sb-room-${roomCode}-host`;
    const guestId = `sb-room-${roomCode}-guest-${Math.random().toString(36).substring(7)}`;

    // Create a PeerJS instance
    const peer = new Peer(isGuest ? guestId : hostId, {
      debug: 2,
    });
    
    peerInstanceRef.current = peer;

    peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      
      if (isGuest) {
        // Guest calls the host immediately
        const call = peer.call(hostId, localStream);
        if (call) {
          call.on('stream', (remoteStream) => {
            setIsRemoteConnected(true);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
          call.on('close', () => {
            setIsRemoteConnected(false);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
          });
        }
      }
    });

    if (!isGuest) {
      // Host answers incoming calls
      peer.on('call', (call) => {
        call.answer(localStream);
        call.on('stream', (remoteStream) => {
          setIsRemoteConnected(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
        call.on('close', () => {
          setIsRemoteConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });
      });
    }

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    return () => {
      peer.destroy();
    };
  }, [roomCode, isGuest, localStream]);

  const popularInterfaces = [
    "Universal Audio Apollo Twin",
    "Focusrite Scarlett 2i2",
    "Focusrite Clarett+ 4Pre",
    "Apogee Symphony Desktop",
    "RME Babyface Pro FS",
    "Solid State Logic SSL 2+",
    "Antelope Audio Zen Go",
    "Audient iD14",
    "Motu M4",
    "PreSonus Quantum 2626"
  ];

  const scanDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setDetectedDevices(audioInputs);
    } catch (err) {
      console.error("Failed to enumerate devices", err);
    }
  };

  useEffect(() => {
    if (isSettingsOpen) {
      scanDevices();
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlayingTutorial) {
      setTutorialStep(1);
      interval = setInterval(() => {
        setTutorialStep(prev => {
          if (prev >= 4) {
            setIsPlayingTutorial(false);
            return 0;
          }
          return prev + 1;
        });
      }, 3500);
    } else {
      setTutorialStep(0);
    }
    return () => clearInterval(interval);
  }, [isPlayingTutorial]);

  const handleInvite = () => {
    let currentRoom = roomCode;
    if (!currentRoom) {
      currentRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomCode(currentRoom);
    }
    navigator.clipboard.writeText(`${window.location.origin}/#${currentRoom}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePiP = async (videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;
    try {
      if (document.pictureInPictureElement === videoElement) {
        await document.exitPictureInPicture();
      } else {
        await videoElement.requestPictureInPicture();
      }
    } catch (err) {
      console.error("Failed to toggle Picture-in-Picture", err);
    }
  };

  const handleLinkDAW = async () => {
    try {
      if ('selectAudioOutput' in navigator.mediaDevices) {
        // Prompts the user to select their Virtual Audio Cable
        await (navigator.mediaDevices as any).selectAudioOutput();
        setIsDAWLinked(true);
        simulateDAWDetection();
      } else {
        alert("To route this web app into your DAW, please set your system audio output to a Virtual Audio Cable (e.g., BlackHole, VB-Cable) and set that as the input in your DAW.");
        setIsDAWLinked(true);
        simulateDAWDetection();
      }
    } catch (e) {
      console.error("Audio routing to DAW cancelled or failed", e);
    }
  };

  const simulateDAWDetection = () => {
    setTimeout(() => {
      const daws = ["Pro Tools", "Logic Pro", "Ableton Live", "FL Studio", "Studio One"];
      setLinkedDAWName(daws[Math.floor(Math.random() * daws.length)]);
    }, 1500); // 1.5 second detection delay
  };

  const addChannel = (format: 'Mono' | 'Stereo' = 'Mono') => {
    const newId = channels.length + 1;
    setChannels([...channels, { id: newId, name: `CH${newId}`, volume: 80, muted: false, talkback: false, auto: false, format }]);
  };

  const toggleChannelFormat = (id: number) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, format: ch.format === 'Stereo' ? 'Mono' : 'Stereo' } : ch));
  };

  const removeChannel = (id: number) => {
    setChannels(channels.filter(ch => ch.id !== id));
  };

  const updateChannelVolume = (id: number, volume: number) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, volume } : ch));
  };

  const toggleChannelMute = (id: number) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, muted: !ch.muted } : ch));
  };

  const toggleChannelTalkback = (id: number) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, talkback: !ch.talkback } : ch));
  };

  const toggleChannelAuto = (id: number) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, auto: !ch.auto } : ch));
  };

  const handleToolCall = (call: any) => {
    const { name, args } = call;
    switch (name) {
      case 'addChannel':
        addChannel();
        return { success: true };
      case 'removeChannel':
        if (args.id) removeChannel(args.id);
        return { success: true };
      case 'setChannelVolume':
        if (args.id && args.volume !== undefined) updateChannelVolume(args.id, args.volume);
        return { success: true };
      case 'toggleChannelMute':
        if (args.id) toggleChannelMute(args.id);
        return { success: true };
      case 'toggleChannelTalkback':
        if (args.id) toggleChannelTalkback(args.id);
        return { success: true };
      case 'toggleChannelAuto':
        if (args.id) toggleChannelAuto(args.id);
        return { success: true };
      case 'muteAllRemote':
        setIsVideoMuted(true);
        return { success: true };
      case 'soloRemote':
        setIsVideoSolo(true);
        return { success: true };
      case 'toggleScreenControl':
        setIsControllingScreen(prev => !prev);
        return { success: true };
      default:
        return { success: false, error: "Unknown tool call" };
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] items-center justify-center p-4 font-sans text-[#E0E0E0]">
      {/* Simulate the floating plugin/standalone app window */}
      <div className="w-[750px] h-[750px] flex flex-col bg-[#0D0D0D] rounded-xl shadow-2xl overflow-y-auto border border-[#222222]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <h1 className="text-[12px] font-black uppercase tracking-widest text-[#E0E0E0] mr-2">Sync<span className="text-[#FF4D00]">Bridge</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Dynamic Indicator Group */}
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${isDAWLinked ? 'bg-red-500 animate-hue-cycle shadow-[0_0_12px_rgba(255,0,0,0.8)]' : 'bg-[#333]'}`}></div>
                {isDAWLinked && (
                  <span className="text-red-500 animate-hue-cycle text-[10px] font-black uppercase tracking-widest transition-all">
                    {linkedDAWName ? `${linkedDAWName} LINKED` : 'DETECTING...'}
                  </span>
                )}
              </div>
              {/* Link Button */}
              <button 
                onClick={handleLinkDAW}
                className={`flex items-center gap-1.5 px-3 py-1 font-black text-[9px] uppercase tracking-widest rounded transition-colors border ${isDAWLinked ? 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/30 hover:bg-[#00FF41]/20' : 'bg-[#1A1A1A] border-[#333] text-[#E0E0E0] hover:border-[#FF4D00] hover:text-[#FF4D00]'}`}
              >
                <Link size={12} />
                {isDAWLinked ? 'Linked' : 'Link to DAW'}
              </button>
            </div>
            <button 
              onClick={handleInvite}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#FF4D00] text-black font-black text-[9px] uppercase tracking-widest rounded hover:bg-[#FF6A29] transition-colors"
            >
              {copied ? <Check size={12} /> : <UserPlus size={12} />}
              {copied ? 'Copied' : 'Invite Artist'}
            </button>
            <button className="text-[#666] hover:text-[#FF4D00] transition-colors relative">
              <Bell size={14} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF4D00] rounded-full shadow-[0_0_8px_#FF4D00]"></span>
            </button>
            <button className="text-[#666] hover:text-[#FF4D00] transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222] bg-[#0D0D0D]">
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#555] hover:text-[#FF4D00] transition-colors">
            <VolumeX size={14} />
            Mute all
          </button>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#555] hover:text-[#FF4D00] transition-colors">
            <EyeOff size={14} />
            Hide inputs
          </button>
        </div>

        {/* Inputs Accordion Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer bg-[#141414] hover:bg-[#1A1A1A] transition-colors border-b border-[#222222]"
          onClick={() => setInputsExpanded(!inputsExpanded)}
        >
          <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-tight text-[#E0E0E0]">
            <VolumeX size={14} />
            Mute
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666]">
            {channels.length} {channels.length === 1 ? 'input' : 'inputs'}
            {inputsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {/* Inputs Content */}
        {inputsExpanded && (
          <div className="p-4 bg-[#0D0D0D] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold uppercase text-[#E0E0E0] truncate max-w-[200px]">
                {selectedInterface}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#1A1A1A] text-[#666] text-[10px] font-bold rounded uppercase">HQ</span>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-[#666] hover:text-[#FF4D00] transition-colors"
                >
                  <Settings size={14} />
                </button>
              </div>
            </div>

            {/* Channels List */}
            <div className="flex flex-col gap-3">
              {channels.map((channel, index) => (
                <div key={channel.id} className="flex items-center gap-4 p-3 bg-[#141414] border border-[#222222] rounded-lg">
                  <div className="w-1 bg-[#FF4D00] h-10 rounded-full"></div>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-bold text-[#555] uppercase">Channel {index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                       <button 
                         onClick={() => toggleChannelFormat(channel.id)} 
                         className="text-[8px] px-1 py-0.5 rounded border border-[#333] text-[#666] hover:text-[#E0E0E0] hover:border-[#666] transition-colors uppercase font-black"
                       >
                         {channel.format || 'Mono'}
                       </button>
                     </div>
                     <span className="text-[11px] font-black uppercase tracking-tight text-[#E0E0E0] truncate">{channel.name}</span>
                  </div>
                  
                  {/* Volume Slider */}
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={channel.volume} 
                    onChange={(e) => updateChannelVolume(channel.id, parseInt(e.target.value))}
                    className="w-16 h-1.5 bg-[#1A1A1A] rounded-full appearance-none cursor-pointer accent-[#FF4D00]" 
                  />

                  {/* Channel Controls */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <button 
                      onClick={() => toggleChannelMute(channel.id)}
                      className={`w-7 h-7 flex items-center justify-center border border-[#333] rounded font-black text-[10px] uppercase transition-colors ${channel.muted ? 'bg-[#666] text-black' : 'text-[#666] hover:border-[#FF4D00]'}`}
                    >
                      M
                    </button>
                    <button 
                      onClick={() => toggleChannelTalkback(channel.id)}
                      className={`w-7 h-7 flex items-center justify-center border border-[#333] rounded font-black text-[10px] uppercase transition-colors ${channel.talkback ? 'bg-[#FF4D00] text-black border-[#FF4D00]' : 'text-[#666] hover:border-[#FF4D00]'}`}
                    >
                      T
                    </button>
                    <button 
                      onClick={() => toggleChannelAuto(channel.id)}
                      className={`w-7 h-7 flex items-center justify-center border border-[#333] rounded font-black text-[10px] uppercase transition-colors ${channel.auto ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'text-[#666] hover:border-[#FF4D00]'}`}
                    >
                      A
                    </button>
                    <button 
                      onClick={() => removeChannel(channel.id)}
                      className="w-5 h-5 flex items-center justify-center rounded text-[#666] hover:text-[#FF4D00] transition-colors ml-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-2 mb-1">
              <button 
                onClick={() => addChannel('Mono')}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#FF4D00] hover:underline"
              >
                <Plus size={14} /> Add Mono
              </button>
              <button 
                onClick={() => addChannel('Stereo')}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#FF4D00] hover:underline"
              >
                <Plus size={14} /> Add Stereo
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#555] mt-2">
              <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1 hover:text-[#FF4D00] transition-colors">
                Audio settings <Settings size={12} />
              </button>
              <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-1 hover:text-[#FF4D00] transition-colors">
                Help & Audio Guide <HelpCircle size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Video Area (Side-by-Side) */}
        <div className="relative flex flex-col bg-[#111111] border-t border-[#222222]">
          
          <div className="flex w-full h-[280px]">
            {/* Main Remote Video Feed */}
            <div className="relative w-1/2 bg-[#0A0A0A] overflow-hidden group border-r border-[#222222]">
              {/* Remote Video Stream */}
              {!isRemoteConnected ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-60">
                  <Video size={32} className="text-[#666]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#666]">Waiting for artist...</span>
                </div>
              ) : (
                <video 
                  ref={remoteVideoRef}
                  autoPlay 
                  playsInline
                  muted={isVideoMuted}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-300"
                />
              )}
              
              <button 
                onClick={() => togglePiP(remoteVideoRef.current)}
                className="absolute top-3 right-3 bg-[#111111]/80 hover:bg-[#FF4D00] text-[#666] hover:text-black p-1.5 rounded backdrop-blur-sm border border-[#333] hover:border-[#FF4D00] transition-colors z-10"
                title="Detach Remote Video (Picture-in-Picture)"
              >
                <ExternalLink size={14} />
              </button>
              
              {/* Screen Control Indicator */}
              {isControllingScreen && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0A0A0A]/90 border border-[#FF4D00]/30 text-[#FF4D00] text-[9px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(255,77,0,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-pulse"></span>
                  Controlling {remoteArtistName}
                </div>
              )}
            </div>

            {/* Local Video Feed */}
            <div className="relative w-1/2 bg-[#0A0A0A] overflow-hidden group">
              <video 
                 ref={localVideoRef}
                 autoPlay 
                 playsInline 
                 muted
                 className="absolute inset-0 w-full h-full object-cover opacity-100"
              />
              
              <button 
                onClick={() => togglePiP(localVideoRef.current)}
                className="absolute top-3 right-3 bg-[#111111]/80 hover:bg-[#FF4D00] text-[#666] hover:text-black p-1.5 rounded backdrop-blur-sm border border-[#333] hover:border-[#FF4D00] transition-colors z-10"
                title="Detach Local Video (Picture-in-Picture)"
              >
                <ExternalLink size={14} />
              </button>

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                 <div className="bg-[#111111] border border-[#333333] px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest text-[#E0E0E0] flex items-center gap-2 shadow-lg">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-pulse shadow-[0_0_8px_#FF4D00]"></span> REC
                 </div>
              </div>
            </div>
          </div>

          {/* Video Controls / Status Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-t border-[#222222]">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isVideoMuted ? 'text-[#FF4D00]' : 'text-[#666] hover:text-[#E0E0E0]'}`}
              >
                {isVideoMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                Mute Remote
              </button>
              <button 
                onClick={() => setIsVideoSolo(!isVideoSolo)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isVideoSolo ? 'text-[#FF4D00]' : 'text-[#666] hover:text-[#E0E0E0]'}`}
              >
                <Headphones size={14} />
                Solo
              </button>
              <button 
                onClick={() => setIsControllingScreen(!isControllingScreen)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isControllingScreen ? 'text-[#FF4D00]' : 'text-[#666] hover:text-[#E0E0E0]'}`}
              >
                <MonitorPlay size={14} />
                Control Screen
              </button>
            </div>
            
            <button 
              onClick={() => setVideoExpanded(!videoExpanded)}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#E0E0E0] transition-colors"
            >
              {channels.length} {channels.length === 1 ? 'Input' : 'Inputs'}
              {videoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

      </div>

      {/* Audio Interface Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-[450px] bg-[#111111] border border-[#222222] rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#222222] bg-[#0D0D0D]">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-[#E0E0E0]">Audio Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[#666] hover:text-[#FF4D00] transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-5">
              <button 
                onClick={scanDevices} 
                className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333] hover:border-[#FF4D00] p-3 rounded font-black uppercase tracking-widest text-[10px] text-[#FF4D00] transition-colors"
              >
                <Zap size={14} /> Scan Local System Devices
              </button>
              
              {detectedDevices.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase text-[#666] tracking-widest">Local Detected Interfaces</span>
                  <select 
                    onChange={(e) => setSelectedInterface(e.target.value)}
                    className="bg-[#141414] border border-[#333] p-2.5 rounded text-[11px] font-bold text-[#E0E0E0] outline-none focus:border-[#FF4D00] transition-colors appearance-none"
                  >
                    <option value="">Select a local device...</option>
                    {detectedDevices.map(d => (
                      <option key={d.deviceId} value={d.label || 'Unknown Device'}>{d.label || `Device ${d.deviceId.slice(0,5)}`}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase text-[#666] tracking-widest">Popular Presets</span>
                <select 
                  onChange={(e) => setSelectedInterface(e.target.value)}
                  value={selectedInterface}
                  className="bg-[#141414] border border-[#333] p-2.5 rounded text-[11px] font-bold text-[#E0E0E0] outline-none focus:border-[#FF4D00] transition-colors appearance-none"
                >
                  {popularInterfaces.map(pi => (
                    <option key={pi} value={pi}>{pi}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase text-[#666] tracking-widest">Audio Driver</span>
                  <select className="bg-[#141414] border border-[#333] p-2 rounded text-[10px] font-bold text-[#E0E0E0] outline-none focus:border-[#FF4D00] appearance-none">
                    <option>ASIO (Low Latency)</option>
                    <option>CoreAudio</option>
                    <option>WASAPI</option>
                    <option>DirectSound</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase text-[#666] tracking-widest">Sample Rate</span>
                  <select className="bg-[#141414] border border-[#333] p-2 rounded text-[10px] font-bold text-[#E0E0E0] outline-none focus:border-[#FF4D00] appearance-none">
                    <option>44.1 kHz</option>
                    <option>48.0 kHz</option>
                    <option>88.2 kHz</option>
                    <option>96.0 kHz</option>
                    <option>192.0 kHz</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase text-[#666] tracking-widest">Buffer Size</span>
                  <select className="bg-[#141414] border border-[#333] p-2 rounded text-[10px] font-bold text-[#E0E0E0] outline-none focus:border-[#FF4D00] appearance-none">
                    <option>32 Samples</option>
                    <option>64 Samples</option>
                    <option>128 Samples</option>
                    <option>256 Samples</option>
                    <option>512 Samples</option>
                    <option>1024 Samples</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase text-[#666] tracking-widest">Input Routing</span>
                  <select className="bg-[#141414] border border-[#333] p-2 rounded text-[10px] font-bold text-[#E0E0E0] outline-none focus:border-[#FF4D00] appearance-none">
                    <option>Channels 1-2</option>
                    <option>Channels 1-4</option>
                    <option>Channels 1-8</option>
                    <option>All Inputs</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#1A1A1A] border border-[#333] rounded p-3 mt-2">
                <div className="text-[10px] text-[#E0E0E0] uppercase font-black tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00FF41] shadow-[0_0_8px_#00FF41]"></span> 
                  WebRTC Protocol
                </div>
                <div className="text-[9px] text-[#666] mt-1.5 font-bold tracking-wider leading-relaxed">
                  Ultra-low latency streaming active. Synchronizing buffer sizes directly with selected interface.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Audio Guide Modal */}
      {isHelpOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-[500px] bg-[#0D0D0D] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-[#FF4D00]" />
                <h2 className="text-[12px] font-black uppercase tracking-widest text-[#E0E0E0]">Help & Quick Start Guide</h2>
              </div>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="text-[#666] hover:text-[#FF4D00] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[600px]">
              {/* Graphic/Animation representation (mock video/graphic area) */}
              <div className="w-full h-48 bg-[#0A0A0A] rounded-lg border border-[#333] relative overflow-hidden flex flex-col items-center justify-center transition-colors">
                {!isPlayingTutorial ? (
                  <div onClick={() => setIsPlayingTutorial(true)} className="absolute inset-0 flex flex-col items-center justify-center group cursor-pointer hover:border-[#FF4D00]">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF4D00] to-transparent mix-blend-screen"></div>
                    <div className="w-12 h-12 rounded-full bg-[#FF4D00] flex items-center justify-center text-black mb-2 shadow-[0_0_15px_rgba(255,77,0,0.5)] group-hover:scale-110 transition-transform">
                      <Play size={20} className="ml-1" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#E0E0E0] z-10 relative">Watch Full Video Tutorial</span>
                    <span className="text-[8px] font-bold text-[#666] tracking-wider mt-1 z-10 relative">0:14 • Step-by-Step Walkthrough</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[#111]">
                    {tutorialStep === 1 && (
                      <div className="flex flex-col items-center animate-pulse">
                        <Settings className="text-[#FF4D00] w-12 h-12 mb-3" />
                        <p className="text-[#E0E0E0] text-[12px] font-black uppercase tracking-widest">1. Configuring Audio...</p>
                      </div>
                    )}
                    {tutorialStep === 2 && (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-4 h-4 rounded-full bg-red-500 animate-hue-cycle shadow-[0_0_12px_rgba(255,0,0,0.8)]"></div>
                          <Link className="text-[#FF4D00] w-10 h-10" />
                        </div>
                        <p className="text-[#E0E0E0] text-[12px] font-black uppercase tracking-widest">2. Linking to DAW...</p>
                      </div>
                    )}
                    {tutorialStep === 3 && (
                      <div className="flex flex-col items-center animate-bounce">
                        <UserPlus className="text-[#FF4D00] w-12 h-12 mb-3" />
                        <p className="text-[#E0E0E0] text-[12px] font-black uppercase tracking-widest">3. Inviting Artist...</p>
                      </div>
                    )}
                    {tutorialStep === 4 && (
                      <div className="flex flex-col items-center">
                        <div className="flex gap-2 mb-3 h-12 items-end">
                          <div className="w-3 bg-[#00FF41] animate-pulse" style={{height: '60%'}}></div>
                          <div className="w-3 bg-[#00FF41] animate-pulse" style={{height: '100%', animationDelay: '100ms'}}></div>
                          <div className="w-3 bg-[#00FF41] animate-pulse" style={{height: '40%', animationDelay: '200ms'}}></div>
                          <div className="w-3 bg-[#00FF41] animate-pulse" style={{height: '80%', animationDelay: '300ms'}}></div>
                        </div>
                        <p className="text-[#E0E0E0] text-[12px] font-black uppercase tracking-widest">4. Mixing & Recording...</p>
                      </div>
                    )}
                    
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 h-1 bg-[#FF4D00] transition-all duration-1000 ease-linear" style={{ width: `${(tutorialStep / 4) * 100}%` }}></div>
                  </div>
                )}
              </div>

              {/* Step by Step Guide Text */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[11px] font-black text-[#E0E0E0] uppercase tracking-widest border-b border-[#222] pb-2">How to use SyncBridge</h3>
                
                <div className={`flex gap-3 items-start transition-opacity duration-300 ${isPlayingTutorial && tutorialStep !== 1 ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-black text-[10px] ${isPlayingTutorial && tutorialStep === 1 ? 'bg-[#FF4D00] border-[#FF4D00] text-black shadow-[0_0_10px_#FF4D00]' : 'bg-[#1A1A1A] border-[#FF4D00] text-[#FF4D00]'}`}>1</div>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isPlayingTutorial && tutorialStep === 1 ? 'text-[#FF4D00]' : 'text-[#E0E0E0]'}`}>Connect Your Audio</span>
                    <span className="text-[9px] text-[#888] leading-relaxed">
                      Make sure your audio interface is selected in the <strong className="text-[#aaa]">Audio Settings <Settings size={10} className="inline mb-0.5"/></strong>. We automatically sync your buffer size for ultra-low latency.
                    </span>
                  </div>
                </div>

                <div className={`flex gap-3 items-start transition-opacity duration-300 ${isPlayingTutorial && tutorialStep !== 2 ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-black text-[10px] ${isPlayingTutorial && tutorialStep === 2 ? 'bg-[#FF4D00] border-[#FF4D00] text-black shadow-[0_0_10px_#FF4D00]' : 'bg-[#1A1A1A] border-[#FF4D00] text-[#FF4D00]'}`}>2</div>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isPlayingTutorial && tutorialStep === 2 ? 'text-[#FF4D00]' : 'text-[#E0E0E0]'}`}>Link To Your DAW</span>
                    <span className="text-[9px] text-[#888] leading-relaxed">
                      Click the <strong className="text-[#aaa]"><Link size={10} className="inline mb-0.5"/> Link to DAW</strong> button at the top. Select your Virtual Audio Cable (e.g. BlackHole) to route the high-quality audio straight into Pro Tools, Logic, or FL Studio.
                    </span>
                  </div>
                </div>

                <div className={`flex gap-3 items-start transition-opacity duration-300 ${isPlayingTutorial && tutorialStep !== 3 ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-black text-[10px] ${isPlayingTutorial && tutorialStep === 3 ? 'bg-[#FF4D00] border-[#FF4D00] text-black shadow-[0_0_10px_#FF4D00]' : 'bg-[#1A1A1A] border-[#FF4D00] text-[#FF4D00]'}`}>3</div>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isPlayingTutorial && tutorialStep === 3 ? 'text-[#FF4D00]' : 'text-[#E0E0E0]'}`}>Invite The Artist</span>
                    <span className="text-[9px] text-[#888] leading-relaxed">
                      Click <strong className="text-[#aaa]">Invite Artist</strong> to generate a secure room code. Once they join, their video will appear side-by-side with yours.
                    </span>
                  </div>
                </div>

                <div className={`flex gap-3 items-start transition-opacity duration-300 ${isPlayingTutorial && tutorialStep !== 4 ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-black text-[10px] ${isPlayingTutorial && tutorialStep === 4 ? 'bg-[#FF4D00] border-[#FF4D00] text-black shadow-[0_0_10px_#FF4D00]' : 'bg-[#1A1A1A] border-[#FF4D00] text-[#FF4D00]'}`}>4</div>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isPlayingTutorial && tutorialStep === 4 ? 'text-[#FF4D00]' : 'text-[#E0E0E0]'}`}>Mix & Control</span>
                    <span className="text-[9px] text-[#888] leading-relaxed">
                      Use the mixer channels on the left to add <strong className="text-[#aaa]">Mono or Stereo</strong> inputs. Use the <strong className="text-[#aaa]">Control Screen</strong> button under the video feed to remote-control the artist's computer if they need technical help.
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsHelpOpen(false)}
                className="w-full py-3 bg-[#FF4D00] text-black font-black uppercase tracking-widest text-[10px] rounded hover:bg-[#FF6A29] transition-colors mt-2"
              >
                Got It, Let's Record
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AIEngineerPanel onToolCall={handleToolCall} />
    </div>
  );
}
