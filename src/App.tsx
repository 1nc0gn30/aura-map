import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import { divIcon, LatLng } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  History, 
  Globe, 
  Sparkles, 
  X, 
  ChevronRight,
  Info,
  Loader2,
  Navigation,
  Lock,
  Mail,
  Zap,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { cn } from './lib/utils';

// Custom Marker Icon using Lucide
const createCustomIcon = (color: string = '#6366f1') => {
  const iconMarkup = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div className="absolute w-10 h-10 bg-indigo-500/20 rounded-full animate-ping" />
      <div className="relative z-10 p-2 bg-indigo-600 rounded-full border-2 border-white shadow-xl">
        <Navigation className="w-4 h-4 text-white fill-white rotate-45" />
      </div>
    </div>
  );
  
  return divIcon({
    html: iconMarkup,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

interface Echo {
  id: string;
  title: string;
  history: string;
  culture: string;
  vibe: string;
  coordinates: { lat: number; lng: number };
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function App() {
  const [selectedPos, setSelectedPos] = useState<LatLng | null>(null);
  const [echo, setEcho] = useState<Echo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('aura_map_custom_key') || '');
  const [keyInput, setKeyInput] = useState('');
  const [savedEchoes, setSavedEchoes] = useState<Echo[]>(() => {
    const saved = localStorage.getItem('aura_map_echoes');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync savedEchoes to localStorage
  useEffect(() => {
    localStorage.setItem('aura_map_echoes', JSON.stringify(savedEchoes));
  }, [savedEchoes]);

  // Rate limiting logic: Check if user has clicked today
  const checkRateLimit = useCallback(() => {
    // If user has their own key, they have unlimited access
    if (customApiKey) return true;

    const lastClick = localStorage.getItem('aura_map_last_click');
    if (!lastClick) return true;

    const lastDate = new Date(parseInt(lastClick));
    const today = new Date();
    
    // Check if it's the same calendar day
    return lastDate.toDateString() !== today.toDateString();
  }, [customApiKey]);

  const updateRateLimit = useCallback(() => {
    // Only update rate limit if using the global key
    if (!customApiKey) {
      localStorage.setItem('aura_map_last_click', Date.now().toString());
    }
  }, [customApiKey]);

  const fetchEcho = useCallback(async (latlng: LatLng) => {
    if (!checkRateLimit()) {
      setShowWaitlist(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSidebarOpen(true);
    
    try {
      const functionResponse = await fetch('/.netlify/functions/gemini-echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: latlng.lat,
          lng: latlng.lng,
          apiKey: customApiKey || undefined,
        }),
      });

      if (!functionResponse.ok) {
        throw new Error(`Function request failed: ${functionResponse.status}`);
      }

      const payload = await functionResponse.json();
      const data = payload?.echo || {};
      const newEcho: Echo = { 
        ...data, 
        id: `${latlng.lat}-${latlng.lng}-${Date.now()}`,
        coordinates: { lat: latlng.lat, lng: latlng.lng } 
      };
      
      setEcho(newEcho);
      setSavedEchoes(prev => [newEcho, ...prev]);
      updateRateLimit();
    } catch (err) {
      console.error("Gemini Error:", err);
      setError("The echoes are silent here. Try another spot.");
    } finally {
      setLoading(false);
    }
  }, [checkRateLimit, updateRateLimit, customApiKey]);

  const handleSaveKey = () => {
    if (keyInput.trim()) {
      localStorage.setItem('aura_map_custom_key', keyInput.trim());
      setCustomApiKey(keyInput.trim());
      setShowWaitlist(false);
      setShowSettings(false);
      if (selectedPos) fetchEcho(selectedPos);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('aura_map_custom_key');
    setCustomApiKey('');
    setKeyInput('');
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000); // Reset after 3s
      return;
    }
    setSavedEchoes([]);
    localStorage.removeItem('aura_map_echoes');
    setEcho(null);
    setSidebarOpen(false);
    setConfirmClear(false);
  };

  const handleMapClick = (latlng: LatLng) => {
    // Only set selectedPos if we're not rate limited
    if (checkRateLimit()) {
      setSelectedPos(latlng);
      fetchEcho(latlng);
    } else {
      setShowWaitlist(true);
    }
  };

  const customIcon = useMemo(() => createCustomIcon(), []);

  return (
    <div className="relative w-full h-full bg-[#0b0e14] font-sans text-white overflow-hidden">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[20, 0]}
          zoom={3}
          minZoom={2}
          maxZoom={18}
          worldCopyJump={false}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            noWrap={true}
          />
          <MapEvents onMapClick={handleMapClick} />
          
          {/* Saved Echo Markers */}
          {savedEchoes.map((saved) => (
            <Marker 
              key={saved.id} 
              position={[saved.coordinates.lat, saved.coordinates.lng]} 
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  setEcho(saved);
                  setSelectedPos(new LatLng(saved.coordinates.lat, saved.coordinates.lng));
                  setSidebarOpen(true);
                }
              }}
            >
              <Popup className="custom-aura-popup">
                <div className="p-2 min-w-[120px] space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Discovered</p>
                  <p className="text-sm font-bold text-white leading-tight">{saved.title}</p>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <MapPin className="w-2.5 h-2.5" />
                    <p className="text-[9px] font-mono">
                      {saved.coordinates.lat.toFixed(2)}, {saved.coordinates.lng.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Current Selection Marker (if not already saved) */}
          {selectedPos && !savedEchoes.some(e => e.coordinates.lat === selectedPos.lat && e.coordinates.lng === selectedPos.lng) && (
            <Marker position={selectedPos} icon={customIcon}>
              <Popup className="custom-aura-popup">
                <div className="p-2 min-w-[120px] space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Target</p>
                  <p className="text-sm font-bold text-white leading-tight">Analyzing...</p>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <MapPin className="w-2.5 h-2.5" />
                    <p className="text-[9px] font-mono">
                      {selectedPos.lat.toFixed(2)}, {selectedPos.lng.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl pointer-events-auto shadow-2xl"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Globe className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Aura Map</h1>
            <p className="text-xs text-white/40 font-medium">Echoes of Existence</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-xl pointer-events-auto"
        >
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Info className="w-3.5 h-3.5" />
            <span>Click anywhere to reveal its hidden story</span>
          </div>
        </motion.div>
      </div>

      {/* Sidebar / Detail Panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full md:w-[400px] z-20 bg-[#0b0e14]/90 backdrop-blur-2xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Location Echo</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-sm text-white/40 animate-pulse">Consulting the archives...</p>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-white/60">{error}</p>
                  <button 
                    onClick={() => selectedPos && fetchEcho(selectedPos)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : echo ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <header className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight leading-tight">{echo.title}</h2>
                    <div className="flex items-center gap-2 text-indigo-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-mono">
                        {echo.coordinates.lat.toFixed(4)}°N, {echo.coordinates.lng.toFixed(4)}°E
                      </span>
                    </div>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Vibe</p>
                      <p className="text-lg font-medium text-indigo-300">{echo.vibe}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Status</p>
                      <p className="text-lg font-medium text-emerald-400">Active</p>
                    </div>
                  </div>

                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-white/40">
                      <History className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Historical Echo</h3>
                    </div>
                    <p className="text-white/80 leading-relaxed text-lg font-light italic">
                      "{echo.history}"
                    </p>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-white/40">
                      <Globe className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Cultural Insight</h3>
                    </div>
                    <p className="text-white/80 leading-relaxed">
                      {echo.culture}
                    </p>
                  </section>

                  <div className="pt-10">
                    <button 
                      onClick={() => setSidebarOpen(false)}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      Continue Exploring
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] bg-[#161b22] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setShowWaitlist(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors z-20 bg-[#161b22]/50 backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Lock className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Daily Echo Limit Reached</h2>
                  <p className="text-white/60 leading-relaxed text-sm md:text-base">
                    The mystical archives are resting. Free users can reveal one echo every 24 hours. 
                    Join the waitlist for **Aura Pro** to unlock unlimited echoes and API access.
                  </p>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Zap className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Early Access Deal</span>
                    </div>
                    <span className="bg-indigo-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Limited Time</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-bold">$9</span>
                    <span className="text-white/40 text-sm">/ month</span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Unlimited AI Echoes",
                      "High-Resolution Map Layers",
                      "API Access (1,000 req/mo)",
                      "Custom Map Styles"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs md:text-sm text-white/70">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6">
                  {/* Netlify Form */}
                  <form 
                    name="waitlist" 
                    method="POST" 
                    action="/thank-you"
                    data-netlify="true"
                    data-netlify-honeypot="bot-field"
                    className="space-y-4"
                  >
                    <input type="hidden" name="form-name" value="waitlist" />
                    <p className="hidden">
                      <label>Don't fill this out if you're human: <input name="bot-field" /></label>
                    </p>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input 
                        type="email" 
                        name="email"
                        required
                        placeholder="Enter your email for early access"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-3.5 bg-white text-black font-bold rounded-2xl hover:bg-indigo-50 transition-all active:scale-[0.98] text-sm"
                    >
                      Join the Waitlist
                    </button>
                  </form>

                  <div className="relative flex items-center gap-4 py-1">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">OR</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  {/* Custom API Key Input */}
                  <div className="space-y-3">
                    <p className="text-[11px] text-white/40 text-center uppercase tracking-wider font-bold">Bypass with your own key</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="password" 
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="Gemini API Key"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                      <button 
                        onClick={handleSaveKey}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                      >
                        Apply Key
                      </button>
                    </div>
                    <p className="text-[10px] text-white/20 text-center italic">
                      Stored locally in your browser.
                    </p>
                  </div>
                </div>

                <p className="text-center text-[10px] text-white/20 uppercase tracking-widest font-bold pb-2">
                  No credit card required • Secure & Private
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#161b22] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>

              <div className="p-8 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                  <p className="text-white/40 text-sm">Configure your Aura Map experience</p>
                </div>

                <div className="space-y-6">
                  {/* Custom API Key Input */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold">Gemini API Key</p>
                      {customApiKey && (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Active</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="password" 
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder={customApiKey ? "••••••••••••••••" : "Paste your Gemini API Key"}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveKey}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all"
                        >
                          {customApiKey ? "Update Key" : "Apply Key"}
                        </button>
                        {customApiKey && (
                          <button 
                            onClick={handleClearKey}
                            className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 transition-all"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-white/20 text-center italic">
                      Stored locally in your browser.
                    </p>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="space-y-3">
                    <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold">Data Management</p>
                    <button 
                      onClick={handleClearHistory}
                      className={cn(
                        "w-full py-3 rounded-xl text-sm font-bold transition-all border",
                        confirmClear 
                          ? "bg-red-500 text-white border-red-500" 
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                      )}
                    >
                      {confirmClear ? "Click again to confirm" : "Clear Discovery History"}
                    </button>
                  </div>
                </div>

                <p className="text-center text-[10px] text-white/20 uppercase tracking-widest font-bold">
                  Aura Map v1.0.0
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">AI Core Online</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Lat: {selectedPos?.lat.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Lng: {selectedPos?.lng.toFixed(2) || '0.00'}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <button 
            onClick={() => setShowSettings(true)}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors group"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
          </button>
          {customApiKey && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400/80">Pro Mode</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
