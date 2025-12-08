import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ============================================================================
// JADE CHAMBER — Pattern Oracle Holographic Interface
// ============================================================================

type JadeMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

// Speech recognition hook
function useSpeechRecognition(onResult: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    );
  }, []);

  const start = useCallback(() => {
    if (!supported || listening) return;

    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.start();
  }, [supported, listening, onResult]);

  return { supported, listening, start };
}

export default function JadeChamber() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<JadeMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jadeState, setJadeState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  const API_BASE = process.env.NEXT_PUBLIC_OAA_API_URL || 'https://oaa-api-library.onrender.com';

  const handleVoiceResult = useCallback((spoken: string) => {
    sendToJade(spoken);
  }, []);

  const { supported: voiceSupported, listening, start: startListening } = useSpeechRecognition(handleVoiceResult);

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.onstart = () => {
      setIsSpeaking(true);
      setJadeState('speaking');
    };
    utter.onend = () => {
      setIsSpeaking(false);
      setJadeState('idle');
    };
    utter.onerror = () => {
      setIsSpeaking(false);
      setJadeState('idle');
    };
    utter.rate = 0.95;
    utter.pitch = 1.1;
    utter.lang = 'en-US';
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.toLowerCase().includes('samantha') || 
      v.name.toLowerCase().includes('victoria') ||
      v.name.toLowerCase().includes('karen')
    );
    if (preferredVoice) utter.voice = preferredVoice;

    window.speechSynthesis.speak(utter);
  }, []);

  const sendToJade = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: JadeMessage = { role: 'user', content: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setJadeState('thinking');

    try {
      const res = await fetch(`${API_BASE}/api/jade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || 'Failed to reach Jade');

      const jadeMsg: JadeMessage = {
        role: 'assistant',
        content: data.response ?? 'I sense a disturbance...',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, jadeMsg]);
      speakText(jadeMsg.content);

    } catch (e) {
      console.error('Jade error:', e);
      const errorMsg: JadeMessage = {
        role: 'assistant',
        content: 'My patterns are momentarily obscured. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      setJadeState('idle');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, API_BASE, speakText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendToJade(input.trim());
    setInput('');
  };

  const handleMicClick = () => {
    if (voiceSupported && !listening && !isLoading) {
      setJadeState('listening');
      startListening();
    }
  };

  useEffect(() => {
    if (!listening && jadeState === 'listening') setJadeState('idle');
  }, [listening, jadeState]);

  // Three.js holographic avatar
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050a14, 0.04);

    const cam = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    cam.position.set(0, 0.8, 2.8);
    cam.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const handleResize = () => {
      cam.aspect = container.clientWidth / container.clientHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Avatar core
    const coreGeo = new THREE.SphereGeometry(0.35, 64, 64);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00ff99, metalness: 0.3, roughness: 0.4,
      transparent: true, opacity: 0.85, emissive: 0x004422, emissiveIntensity: 0.5,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.8;
    scene.add(core);

    // Inner glow
    const innerGlowGeo = new THREE.SphereGeometry(0.32, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({ color: 0x66ffbb, transparent: true, opacity: 0.3 });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    innerGlow.position.y = 0.8;
    scene.add(innerGlow);

    // Rings
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const radius = 0.6 + i * 0.25;
      const torusGeo = new THREE.TorusGeometry(radius, 0.015, 16, 100);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0x00ffcc, metalness: 0.9, roughness: 0.1,
        transparent: true, opacity: 0.6 - i * 0.15, emissive: 0x004433, emissiveIntensity: 0.3,
      });
      const ring = new THREE.Mesh(torusGeo, torusMat);
      ring.position.y = 0.8;
      ring.rotation.x = Math.PI / 2 + (i * 0.2);
      rings.push(ring);
      scene.add(ring);
    }

    // Glyphs
    const glyphCount = 24;
    const glyphPositions = new Float32Array(glyphCount * 3);
    const glyphGeometry = new THREE.BufferGeometry();
    for (let i = 0; i < glyphCount; i++) {
      const angle = (i / glyphCount) * Math.PI * 2;
      const radius = 1.0 + Math.random() * 0.3;
      glyphPositions[i * 3] = Math.cos(angle) * radius;
      glyphPositions[i * 3 + 1] = 0.5 + Math.random() * 0.6;
      glyphPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    glyphGeometry.setAttribute('position', new THREE.BufferAttribute(glyphPositions, 3));
    const glyphMat = new THREE.PointsMaterial({
      color: 0x66ffcc, size: 0.04, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
    });
    const glyphParticles = new THREE.Points(glyphGeometry, glyphMat);
    scene.add(glyphParticles);

    // Lighting
    const mainLight = new THREE.PointLight(0x00ffaa, 2, 20);
    mainLight.position.set(0, 2, 2);
    scene.add(mainLight);
    const fillLight = new THREE.PointLight(0x4488ff, 1, 15);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);
    scene.add(new THREE.AmbientLight(0x112233, 0.5));

    // Grid
    const gridHelper = new THREE.GridHelper(4, 20, 0x0a2030, 0x061520);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      const t = clock.getElapsedTime();

      const breathe = 1 + Math.sin(t * 1.5) * 0.08;
      core.scale.setScalar(breathe);
      innerGlow.scale.setScalar(breathe * 1.05);

      const speakPulse = isSpeaking ? 0.15 : 0;
      const pulse = 1 + speakPulse * Math.sin(t * 8);
      core.scale.multiplyScalar(pulse);

      rings.forEach((ring, i) => {
        ring.rotation.z = t * (0.3 + i * 0.1);
        ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.1;
      });

      glyphParticles.rotation.y = t * 0.2;

      let hue = 0.45;
      if (listening) hue = 0.55;
      if (isLoading) hue = 0.35;
      if (isSpeaking) hue = 0.48 + Math.sin(t * 3) * 0.05;
      
      coreMat.color.setHSL(hue, 0.8, 0.5);
      coreMat.emissive.setHSL(hue, 0.8, 0.15);

      renderer.render(scene, cam);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [isSpeaking, listening, isLoading]);

  const lastJadeResponse = messages.filter(m => m.role === 'assistant').slice(-1)[0];

  return (
    <div className="jade-chamber">
      <div className="jade-layout">
        <aside className="jade-panel jade-log">
          <h2 className="panel-title">CYCLE LOG</h2>
          <div className="log-content">
            {messages.length === 0 ? (
              <p className="log-empty">Begin a reflection to see your cycle unfold here.</p>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`log-entry ${m.role === 'user' ? 'log-user' : 'log-jade'}`}>
                  <span className="log-role">{m.role === 'user' ? 'YOU' : 'JADE'}</span>
                  <span className="log-text">{m.content}</span>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="jade-center">
          <div className="avatar-container" ref={mountRef} />
          <div className="jade-status">
            <div className={`status-indicator ${jadeState}`} />
            <span className="status-text">JADE • {jadeState.toUpperCase()}</span>
          </div>
          <p className="jade-hint">
            Speak to Jade about patterns you feel repeating, intentions you want to set, or cycles you wish to close.
          </p>
        </main>

        <aside className="jade-panel jade-insight">
          <h2 className="panel-title">CURRENT REFLECTION</h2>
          <div className="insight-content">
            {lastJadeResponse ? (
              <p>{lastJadeResponse.content}</p>
            ) : (
              <p className="insight-empty">Once you speak, Jade will surface the pattern she sees.</p>
            )}
          </div>
        </aside>
      </div>

      <form onSubmit={handleSubmit} className="jade-input-bar">
        <button
          type="button"
          className={`mic-button ${listening ? 'listening' : ''} ${!voiceSupported ? 'disabled' : ''}`}
          onClick={handleMicClick}
          disabled={!voiceSupported || isLoading}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>

        <input
          type="text"
          className="text-input"
          placeholder="Or type a seed thought for Jade to read..."
          value={input}
          onChange={e => setInput(e.target.value.slice(0, 2000))}
          disabled={isLoading}
        />

        <button type="submit" className="submit-button" disabled={!input.trim() || isLoading}>
          {isLoading ? 'Reflecting...' : 'Reflect'}
        </button>
      </form>

      <style jsx>{`
        .jade-chamber {
          min-height: 100vh;
          background: linear-gradient(180deg, #050a14 0%, #0a1020 50%, #050a14 100%);
          color: #cfe0ff;
          display: flex;
          flex-direction: column;
        }
        .jade-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 280px 1fr 280px;
          gap: 24px;
          padding: 24px;
        }
        @media (max-width: 1024px) {
          .jade-layout { grid-template-columns: 1fr; }
          .jade-panel { display: none; }
        }
        .jade-panel {
          background: rgba(10, 20, 40, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 255, 170, 0.15);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        .panel-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #00ffaa;
          margin: 0 0 16px 0;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        .jade-log .log-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .log-empty { color: #4a6080; font-size: 13px; font-style: italic; }
        .log-entry { font-size: 13px; line-height: 1.5; }
        .log-role {
          display: block;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          margin-bottom: 2px;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        .log-user .log-role { color: #6080a0; }
        .log-user .log-text { color: #8090a0; }
        .log-jade .log-role { color: #00ffaa; }
        .log-jade .log-text { color: #b0e0d0; }
        .jade-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .avatar-container {
          width: 100%;
          max-width: 500px;
          aspect-ratio: 1;
          border-radius: 24px;
          overflow: hidden;
          background: radial-gradient(ellipse at center, rgba(0, 50, 40, 0.3) 0%, transparent 70%);
          box-shadow: 0 0 60px rgba(0, 255, 170, 0.15), inset 0 0 40px rgba(0, 255, 170, 0.05);
        }
        .jade-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
        }
        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #00ff99;
          box-shadow: 0 0 10px #00ff99;
          animation: pulse 2s ease-in-out infinite;
        }
        .status-indicator.listening {
          background: #00ccff;
          box-shadow: 0 0 15px #00ccff;
          animation: pulse 0.5s ease-in-out infinite;
        }
        .status-indicator.thinking {
          background: #ffcc00;
          box-shadow: 0 0 15px #ffcc00;
          animation: pulse 0.3s ease-in-out infinite;
        }
        .status-indicator.speaking {
          background: #00ffaa;
          box-shadow: 0 0 20px #00ffaa;
          animation: speak-pulse 0.15s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        @keyframes speak-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        .status-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #00ffaa;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        .jade-hint {
          margin-top: 16px;
          font-size: 13px;
          color: #4a6080;
          text-align: center;
          max-width: 400px;
          line-height: 1.6;
        }
        .jade-insight .insight-content {
          flex: 1;
          font-size: 14px;
          line-height: 1.7;
          color: #c0e0d0;
        }
        .insight-empty { color: #4a6080; font-style: italic; }
        .jade-input-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: rgba(5, 10, 20, 0.9);
          border-top: 1px solid rgba(0, 255, 170, 0.1);
        }
        .mic-button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(0, 255, 170, 0.4);
          background: rgba(0, 40, 30, 0.5);
          color: #00ffaa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .mic-button:hover:not(.disabled) {
          background: rgba(0, 60, 40, 0.6);
          border-color: #00ffaa;
          box-shadow: 0 0 15px rgba(0, 255, 170, 0.3);
        }
        .mic-button.listening {
          background: rgba(255, 50, 50, 0.2);
          border-color: #ff6666;
          color: #ff6666;
          animation: mic-pulse 0.5s ease-in-out infinite;
        }
        .mic-button.disabled { opacity: 0.3; cursor: not-allowed; }
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 100, 100, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(255, 100, 100, 0); }
        }
        .text-input {
          flex: 1;
          background: rgba(10, 20, 40, 0.8);
          border: 1px solid rgba(0, 255, 170, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          color: #cfe0ff;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .text-input:focus {
          border-color: rgba(0, 255, 170, 0.5);
          box-shadow: 0 0 20px rgba(0, 255, 170, 0.1);
        }
        .text-input::placeholder { color: #4a6080; }
        .submit-button {
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #00cc88 0%, #00aa77 100%);
          color: #001a10;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #00ddaa 0%, #00bb88 100%);
          box-shadow: 0 0 20px rgba(0, 255, 170, 0.3);
        }
        .submit-button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
