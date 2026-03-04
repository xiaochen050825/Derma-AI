import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Activity, TrendingDown, BarChart2, Fingerprint, ShieldCheck, Database, Scan, Focus, AlertTriangle, Cpu, CheckCircle, Zap, Info, PhoneCall, Map, User, ArrowLeft, Droplets, Sun, Flame, Trophy, MessageSquare, Send } from 'lucide-react';
import { useUser, useCamera } from './State';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

// ==========================================
// 1. REGISTRATION SCREEN
// ==========================================
export const RegistrationScreen = ({ onComplete }) => {
    const { login, register } = useUser();
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [name, setName] = useState('');
    const [ic, setIc] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (mode === 'register' && (name.length < 2 || ic.length !== 12)) return;
        if (mode === 'login' && ic.length !== 12) return;

        setStatus('verifying');

        try {
            if (mode === 'register') {
                await register(name, ic);
                setStatus('registration_success');
            } else {
                await login(ic);
                setStatus('success');
            }
        } catch (error) {
            setStatus('idle');
            setErrorMsg(error.message);
        }
    };

    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => { onComplete(); }, 1500);
            return () => clearTimeout(timer);
        } else if (status === 'registration_success') {
            const timer = setTimeout(() => {
                setStatus('idle');
                setMode('login');
                setName('');
                setIc('');
                setSuccessMsg('Profile created successfully. Please login.');
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [status, onComplete]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-cyber-teal)]/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-bio-green)]/5 rounded-full blur-[100px] pointer-events-none"></div>
            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div key="form" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="w-full max-w-sm glass-panel p-8 rounded-2xl relative z-10">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-cyber-teal)] to-blue-600 flex items-center justify-center shadow-[var(--shadow-neon-teal)] mb-4"><Database size={32} className="text-white" /></div>
                            <h2 className="text-2xl font-light tracking-wide text-white">National Health ID</h2>
                            <p className="text-xs text-[var(--color-cyber-teal)] uppercase tracking-widest mt-1">Gateway Authentication</p>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex bg-black/40 p-1 rounded-lg mb-6 border border-white/5">
                            <button type="button" onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }} className={`flex-1 py-2 text-xs font-medium tracking-wide uppercase rounded-md transition-colors ${mode === 'login' ? 'bg-[var(--color-cyber-teal)]/20 text-[var(--color-cyber-teal)]' : 'text-gray-500 hover:text-gray-300'}`}>Login</button>
                            <button type="button" onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }} className={`flex-1 py-2 text-xs font-medium tracking-wide uppercase rounded-md transition-colors ${mode === 'register' ? 'bg-[var(--color-cyber-teal)]/20 text-[var(--color-cyber-teal)]' : 'text-gray-500 hover:text-gray-300'}`}>Register</button>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs text-center">
                                {errorMsg}
                            </div>
                        )}
                        {successMsg && (
                            <div className="mb-4 p-3 rounded-lg bg-[var(--color-bio-green)]/10 border border-[var(--color-bio-green)]/30 text-[var(--color-bio-green)] text-xs text-center">
                                {successMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {mode === 'register' && (
                                <AnimatePresence>
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider text-gray-400">Citizen Full Name</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MORANT" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-cyber-teal)] transition-colors" required={mode === 'register'} />
                                    </motion.div>
                                </AnimatePresence>
                            )}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider text-gray-400">12-Digit IC Number</label>
                                <div className="relative">
                                    <input type="text" value={ic} onChange={(e) => setIc(e.target.value.replace(/[^0-9]/g, ''))} maxLength="12" placeholder="000000000000" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-10 text-white placeholder-gray-600 font-mono tracking-wider focus:outline-none focus:border-[var(--color-cyber-teal)] transition-colors" required />
                                    <Fingerprint size={16} className="absolute left-3 top-3.5 text-gray-500" />
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(0, 210, 255, 0.3)" }} whileTap={{ scale: 0.98 }} type="submit" disabled={ic.length !== 12 || (mode === 'register' && name.length < 2)} className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-cyber-teal)]/80 to-blue-600/80 text-white font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed border border-white/10">
                                {mode === 'login' ? 'Authenticate' : 'Create Identity'}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
                {(status === 'verifying' || status === 'success' || status === 'registration_success') && (
                    <motion.div key="verifying" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center relative z-10">
                        <div className="relative w-48 h-48 border border-white/10 rounded-full flex items-center justify-center overflow-hidden mb-8">
                            {status === 'verifying' && <motion.div initial={{ top: "-10%" }} animate={{ top: "110%" }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute left-0 right-0 h-1 bg-[var(--color-cyber-teal)] shadow-[0_0_15px_#00d2ff] z-20" />}
                            {status === 'verifying' ? <Scan size={64} className="text-[var(--color-cyber-teal)]/50 absolute" /> : <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}><ShieldCheck size={64} className="text-[var(--color-bio-green)]" /></motion.div>}
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute inset-2 border-2 border-dashed border-[var(--color-cyber-teal)]/30 rounded-full" />
                            <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute inset-6 border border-[var(--color-bio-green)]/20 rounded-full" />
                        </div>
                        <h3 className="text-xl font-light tracking-widest text-white mb-2">{status === 'verifying' ? 'Verifying with External Database...' : 'Identity Confirmed'}</h3>
                        <div className="h-6">
                            {status === 'verifying' ? (
                                <div className="flex space-x-1">
                                    <motion.div animate={{ height: [5, 15, 5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 bg-[var(--color-cyber-teal)]"></motion.div>
                                    <motion.div animate={{ height: [10, 20, 10] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 bg-[var(--color-cyber-teal)]"></motion.div>
                                    <motion.div animate={{ height: [5, 15, 5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 bg-[var(--color-cyber-teal)]"></motion.div>
                                </div>
                            ) : (<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[var(--color-bio-green)] font-mono">{status === 'registration_success' ? 'Database Updated' : `Profile Verified: ${ic}`}</motion.span>)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ==========================================
// 2. DASHBOARD SCREEN
// ==========================================
export const DashboardScreen = ({ onScanClick }) => {
    const { user } = useUser();
    if (!user) return null;

    const generatePath = (data) => {
        if (!data || data.length === 0) return '';
        const width = 300, height = 80, padding = 10;
        const points = data.map((val, i) => ({ x: padding + (i * ((width - padding * 2) / (data.length - 1 || 1))), y: height - padding - ((val / 100) * (height - padding * 2)) }));
        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const x_mid = (points[i].x + points[i + 1].x) / 2, y_mid = (points[i].y + points[i + 1].y) / 2;
            path += ` Q ${(x_mid + points[i].x) / 2},${points[i].y} ${x_mid},${y_mid} T ${points[i + 1].x},${points[i + 1].y}`;
        }
        return path;
    };

    const displayData = user.riskHistory.length > 1 ? user.riskHistory : [85, 80, 78, 70, 68, 60, 55, 45, 40, user.currentRiskIndex === 'Pending' ? 38 : user.riskHistory[0] || 38];
    const chartPath = generatePath(displayData);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.6, type: 'spring' }} className="flex flex-col h-full w-full p-6 pt-16 md:pt-6 md:pr-40 text-white relative">
            <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full">
                <div className="pulse-btn-container mt-24 mb-6">
                    <button onClick={onScanClick} className="w-56 h-56 rounded-full bg-[var(--color-background)] border border-[var(--color-cyber-teal)]/30 flex flex-col items-center justify-center space-y-4 cursor-pointer hover:border-[var(--color-bio-green)] hover:shadow-[var(--shadow-neon-green)] transition-all duration-500 relative z-10 group">
                        <div className="absolute inset-0 rounded-full border border-[var(--color-bio-green)] opacity-20 group-hover:scale-110 transition-transform duration-500 ease-out"></div>
                        <div className="absolute inset-0 rounded-full border border-[var(--color-cyber-teal)] opacity-10 group-hover:scale-125 transition-transform duration-700 ease-out"></div>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute inset-2 border border-dashed border-white/10 rounded-full pointer-events-none"></motion.div>
                        <ScanLine size={56} className="text-[var(--color-cyber-teal)] group-hover:text-[var(--color-bio-green)] transition-colors" />
                        <div className="flex flex-col items-center">
                            <span className="font-bold tracking-widest text-xl uppercase text-white group-hover:text-[var(--color-bio-green)] transition-colors">Start AR Scan</span>
                            <span className="text-[10px] text-gray-400 font-mono mt-1">Initialize Vision Engine</span>
                        </div>
                    </button>
                </div>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
                    <motion.div layoutId="card-health-status" whileHover={{ y: -5, boxShadow: "var(--shadow-neon-teal)" }} className="p-5 rounded-2xl glass-panel breathing-neon-border border border-[var(--color-cyber-teal)]/20 flex flex-col relative overflow-hidden h-full">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[var(--color-bio-green)]/10 rounded-full blur-xl"></div>
                        <div className="flex justify-between items-start mb-3"><div className="flex items-center space-x-2"><Trophy size={18} className="text-[var(--color-bio-green)]" /><h3 className="text-sm font-semibold text-gray-200 tracking-wide">Skin Health Score</h3></div></div>
                        <div className="mt-2 flex items-baseline space-x-2">
                            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">{100 - (user.riskHistory[user.riskHistory.length - 1] || 38)}</span>
                            <span className="text-xs text-[var(--color-bio-green)] font-mono">/ 100</span>
                        </div>

                        <div className="mt-6 flex-1 flex flex-col justify-end space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 flex items-center"><Droplets size={12} className="mr-1 text-blue-400" /> Hydration Goal</span>
                                <span className="text-[var(--color-cyber-teal)] font-mono">2 / 3 L</span>
                            </div>
                            <div className="w-full bg-black/50 rounded-full h-1.5"><div className="bg-gradient-to-r from-blue-500 to-[var(--color-cyber-teal)] h-1.5 rounded-full" style={{ width: '66%' }}></div></div>

                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 flex items-center"><Sun size={12} className="mr-1 text-yellow-400" /> SPF Application</span>
                                <span className="text-[var(--color-cyber-teal)] font-mono">Completed</span>
                            </div>
                            <div className="w-full bg-black/50 rounded-full h-1.5"><div className="bg-gradient-to-r from-yellow-500 to-orange-400 h-1.5 rounded-full" style={{ width: '100%' }}></div></div>

                            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-white/10">
                                <span className="text-gray-400 flex items-center"><Flame size={14} className="mr-1 text-orange-500" /> Current Streak</span>
                                <span className="text-orange-400 font-bold tracking-wider">4 Days</span>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div layoutId="card-risk-trend" whileHover={{ y: -5, boxShadow: "var(--shadow-neon-teal)" }} className="p-5 rounded-2xl glass-panel breathing-neon-border border border-[var(--color-cyber-teal)]/20 flex flex-col w-full">
                        <div className="flex justify-between items-start mb-2"><div className="flex items-center space-x-2"><TrendingDown size={18} className="text-[var(--color-cyber-teal)]" /><h3 className="text-sm font-semibold text-gray-200 tracking-wide">Neural Risk Trend</h3></div><BarChart2 size={16} className="text-[var(--color-cyber-teal)]/50" /></div>
                        <div className="mt-4 w-full h-32 relative flex items-end">
                            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-gray-500 font-mono z-10"><span>100</span><span>50</span><span>0</span></div>
                            <div className="ml-6 flex-1 h-full relative border-l border-b border-white/10">
                                <div className="absolute inset-0 flex justify-between opacity-10 pointer-events-none">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-full w-px bg-white"></div>)}</div>
                                <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">{[1, 2].map(i => <div key={i} className="w-full h-px bg-white"></div>)}</div>
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-cyber-teal)" stopOpacity="0.4" /><stop offset="100%" stopColor="var(--color-cyber-teal)" stopOpacity="0.0" /></linearGradient>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                                    </defs>
                                    <motion.path d={`${chartPath} L 290,70 L 10,70 Z`} fill="url(#areaGradient)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} />
                                    <motion.path d={chartPath} fill="none" stroke="var(--color-cyber-teal)" strokeWidth="2" filter="url(#glow)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
                                    <motion.circle cx="290" cy="70" r="3" fill="var(--color-bio-green)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 }} />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-6 mt-2 flex justify-between text-[9px] text-gray-500 font-mono uppercase tracking-wider"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Current</span></div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// 3. AR SCANNER SCREEN
// ==========================================
export const ARScanner = ({ onComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const { stream, error } = useCamera();
    const { user } = useUser();

    // States: initializing -> positioning -> liveness -> analyzing -> locked
    const [phase, setPhase] = useState('initializing');
    const [scanData, setScanData] = useState(null);
    const [warningMessage, setWarningMessage] = useState(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const [livenessPrompt, setLivenessPrompt] = useState('Please position your face in the oval.');
    const [livenessProgress, setLivenessProgress] = useState(0);

    const faceLandmarkerRef = useRef(null);
    const requestRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);

    // Initialize MediaPipe FaceLandmarker
    useEffect(() => {
        let isMounted = true;
        const initMediaPipe = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
                if (isMounted) {
                    faceLandmarkerRef.current = landmarker;
                    setPhase('positioning');
                } else {
                    landmarker.close();
                }
            } catch (err) {
                console.error("Failed to initialize FaceLandmarker:", err);
                if (isMounted) setWarningMessage("Vision Engine initialization failed.");
            }
        };
        initMediaPipe();
        return () => {
            isMounted = false;
            if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Liveness Logic loop (30fps)
    const detectLiveness = async () => {
        if (!videoRef.current || !faceLandmarkerRef.current || phase === 'analyzing' || phase === 'locked') {
            requestRef.current = requestAnimationFrame(detectLiveness);
            return;
        }

        const video = videoRef.current;
        let nowInMs = Date.now();
        if (video.currentTime !== lastVideoTimeRef.current && video.readyState >= 2) {
            lastVideoTimeRef.current = video.currentTime;

            // Check for general brightness before analyzing faces
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                // very basic brightness check (sample every 20px)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                let colorSum = 0;
                for (let i = 0; i < imageData.length; i += 4 * 20) {
                    colorSum += (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
                }
                const brightness = colorSum / (imageData.length / (4 * 20));
                if (brightness < 30) {
                    setWarningMessage("Too dark! Increase lighting.");
                    setTimeout(() => setWarningMessage(null), 1000);
                } else if (brightness > 230) {
                    setWarningMessage("Too bright! Reduce glare.");
                    setTimeout(() => setWarningMessage(null), 1000);
                }
            }

            const results = faceLandmarkerRef.current.detectForVideo(video, nowInMs);

            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                const shapes = results.faceBlendshapes[0].categories;

                setPhase(prev => {
                    if (prev === 'positioning') {
                        setLivenessPrompt("Blink both eyes to verify liveness.");
                        setLivenessProgress(30);
                        return 'liveness';
                    }
                    return prev;
                });

                if (phase === 'liveness') {
                    const eyeBlinkLeft = shapes.find(s => s.categoryName === "eyeBlinkLeft")?.score || 0;
                    const eyeBlinkRight = shapes.find(s => s.categoryName === "eyeBlinkRight")?.score || 0;
                    const mouthSmile = shapes.find(s => s.categoryName === "mouthSmileLeft")?.score || 0;

                    if (livenessPrompt.includes("Blink")) {
                        if (eyeBlinkLeft > 0.4 && eyeBlinkRight > 0.4) {
                            setLivenessProgress(70);
                            setLivenessPrompt("Now smile at the camera.");
                        }
                    } else if (livenessPrompt.includes("smile")) {
                        if (mouthSmile > 0.5) {
                            setLivenessProgress(100);
                            setLivenessPrompt("Liveness verified. Capturing frame...");
                            setPhase('analyzing');
                            captureAndSendToGemini();
                            return; // PREVENT DUPLICATE API CALLS!
                        }
                    }
                }
            } else {
                if (phase === 'positioning' || phase === 'liveness') {
                    setWarningMessage("No face detected. Please reposition.");
                    setTimeout(() => setWarningMessage(null), 1000);
                }
                if (phase === 'liveness') {
                    setPhase('positioning');
                    setLivenessProgress(0);
                    setLivenessPrompt('Please position your face in the oval.');
                }
            }
        }
        requestRef.current = requestAnimationFrame(detectLiveness);
    };

    useEffect(() => {
        if (phase === 'positioning' || phase === 'liveness') {
            requestRef.current = requestAnimationFrame(detectLiveness);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [phase, livenessPrompt]);

    const captureAndSendToGemini = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        const userGender = user?.gender || 'Unknown';
        const userAge = user?.ic ? (2025 - parseInt(user.ic.substring(0, 2)) - 1900) : 30;

        try {
            const res = await fetch(`${API_BASE}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64Image,
                    icData: { gender: userGender, age: userAge }
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.person_detected === false) {
                    setWarningMessage("No person detected by AI. Try again.");
                    setPhase('positioning');
                    setTimeout(() => setWarningMessage(null), 3000);
                } else if (data.good_angle === false) {
                    setWarningMessage("Adjust your camera angle for clearer view.");
                    setPhase('positioning');
                    setTimeout(() => setWarningMessage(null), 3000);
                } else {
                    setPhase('locked');
                    setScanData(data);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                setWarningMessage(errData.error || "Analysis failed. Try again.");
                setPhase('positioning');
                setTimeout(() => setWarningMessage(null), 5000);
            }
        } catch (err) {
            console.error(err);
            setWarningMessage("Network connection failed.");
            setPhase('positioning');
            setTimeout(() => setWarningMessage(null), 3000);
        }
    };

    const baseColors = ['var(--color-cyber-teal)', 'red', 'orange', 'var(--color-bio-green)'];

    const hotspots = [];
    if (scanData?.conditions && scanData.conditions.length > 0) {
        scanData.conditions.forEach((c, i) => {
            let posX = 30 + Math.random() * 40; // Default center-ish
            let posY = 35 + Math.random() * 30;

            const bbox = c.boundingBox || c.bounding_box;
            if (bbox && Array.isArray(bbox) && bbox.length === 4) {
                const [ymin, xmin, ymax, xmax] = bbox;
                // The video is mirrored horizontally (-scale-x-100), so we must invert the X axis
                const centerX = xmin + (xmax - xmin) / 2;
                const centerY = ymin + (ymax - ymin) / 2;

                posX = (1.0 - centerX) * 100;
                posY = centerY * 100;
            }

            posX = Math.max(10, Math.min(90, posX));
            posY = Math.max(10, Math.min(90, posY));

            hotspots.push({
                id: i + 1,
                x: `${posX}%`,
                y: `${posY}%`,
                color: c.confidence > 0.8 ? 'red' : baseColors[i % baseColors.length],
                title: c.category || 'Marker',
                desc: c.description || `Analyzed area. (${Math.round((c.confidence || 0.8) * 100)}% confidence)`
            });
        });
    } else if (scanData) {
        // Fallback: If no conditions detected but scan locked, show a center confirmation dot
        hotspots.push({
            id: 1,
            x: '50%',
            y: '50%',
            color: 'var(--color-bio-green)',
            title: 'Analysis Point',
            desc: scanData.primaryInsight || 'Analyzed area.'
        });
    }

    if (error) {
        return (
            <div className="flex flex-col h-full w-full justify-center items-center p-6 bg-background">
                <AlertTriangle size={48} className="text-danger mb-4" />
                <h2 className="text-xl text-white mb-2">Camera Access Denied</h2>
                <p className="text-sm text-gray-400 text-center">AR Scanner requires device camera permissions.</p>
                <button onClick={onComplete} className="mt-8 px-6 py-2 rounded-full glass-panel border border-[var(--color-cyber-teal)] text-[var(--color-cyber-teal)]">Bypass Scanner (Dev)</button>
            </div>
        );
    }

    return (
        <motion.div layoutId="screen-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full relative bg-black overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-80" />
            <canvas ref={canvasRef} className="hidden" />

            {/* KYC Oval Mask Overlay */}
            {['initializing', 'positioning', 'liveness'].includes(phase) && (
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-black/70" style={{
                        maskImage: 'radial-gradient(ellipse 45% 65% at 50% 50%, transparent 40%, black 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 45% 65% at 50% 50%, transparent 40%, black 100%)'
                    }}></div>

                    {/* Oval outline */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`w-[60%] md:w-[45%] h-[60%] md:h-[70%] border-4 border-dashed rounded-[50%] absolute transition-colors duration-500 ${phase === 'liveness' ? 'border-[var(--color-cyber-teal)]' : 'border-white/30'}`}
                    ></motion.div>
                </div>
            )}

            {phase === 'analyzing' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="absolute inset-0 z-15 pointer-events-none" style={{ background: 'radial-gradient(circle at 65% 50%, red 0%, transparent 20%), radial-gradient(circle at 30% 40%, var(--color-cyber-teal) 0%, transparent 20%)', mixBlendMode: 'screen' }} />
            )}

            <AnimatePresence>
                {phase === 'locked' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 z-[60] pointer-events-none">
                        <div className="w-full h-full relative pointer-events-auto">
                            <div className="absolute inset-0 bg-black/60 pointer-events-none" />

                            {/* Overall Result Banner */}
                            {scanData && (
                                <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-20 left-6 right-6 z-40 bg-black/80 backdrop-blur-md border border-[var(--color-cyber-teal)]/30 rounded-xl p-4 text-center shadow-[0_0_30px_rgba(0,210,255,0.15)]">
                                    <h3 className="text-[var(--color-cyber-teal)] font-bold tracking-widest text-sm uppercase mb-1">Diagnostic Overlay Active</h3>
                                    <p className="text-white text-sm">Detected {scanData.conditions?.length || 0} potential markers.</p>
                                    <p className="text-xs text-gray-400 mt-2">{scanData.primaryInsight}</p>
                                </motion.div>
                            )}

                            {hotspots.map((spot) => (
                                <motion.button
                                    key={spot.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.2 }}
                                    onClick={() => setSelectedZone(spot)}
                                    className="absolute w-8 h-8 rounded-full border-2 bg-black/80 backdrop-blur-md flex items-center justify-center -ml-4 -mt-4 cursor-pointer ripple-effect z-50 pointer-events-auto"
                                    style={{ left: spot.x, top: spot.y, borderColor: spot.color, boxShadow: `0 0 20px ${spot.color}` }}
                                >
                                    <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: spot.color }}></div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {warningMessage && phase !== 'analyzing' && phase !== 'locked' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/80 backdrop-blur-md border border-red-500/50 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center space-x-3 whitespace-nowrap">
                        <AlertTriangle size={18} className="text-red-400" />
                        <span className="text-sm font-medium tracking-wide">{warningMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedZone && phase === 'locked' && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute bottom-24 left-6 right-6 z-40 glass-panel p-4 rounded-2xl border backdrop-blur-xl" style={{ borderColor: selectedZone.color }}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-bold text-lg" style={{ color: selectedZone.color }}>{selectedZone.title}</h4>
                            <button onClick={() => setSelectedZone(null)} className="text-gray-400 hover:text-white pointer-events-auto"><Zap size={16} /></button>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed max-w-[90%]">{selectedZone.desc}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} transition={{ delay: 0.5, type: 'spring' }} className="absolute bottom-0 left-0 w-full p-6 z-30 bg-gradient-to-t from-background to-transparent pointer-events-auto flex flex-col items-center">
                {['initializing', 'positioning', 'liveness', 'analyzing'].includes(phase) && (
                    <div className="w-full max-w-sm mb-4">
                        <div className="bg-black/50 border border-white/20 rounded-xl p-4 flex flex-col items-center backdrop-blur-md">
                            <span className="text-white text-sm font-medium mb-3 tracking-wide">{phase === 'initializing' ? 'Booting Vision Engine...' : phase === 'analyzing' ? 'AI Analyzing Biomarkers...' : livenessPrompt}</span>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div className="h-full bg-[var(--color-cyber-teal)]" animate={{ width: phase === 'analyzing' ? ["0%", "70%", "90%"] : `${livenessProgress}%` }} transition={phase === 'analyzing' ? { duration: 3, ease: "easeOut" } : { duration: 0.3 }} />
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'locked' && (
                    <motion.button onClick={() => { if (scanData) onComplete(scanData.suggestedRiskScore || 20, scanData) }} whileHover={{ scale: 1.02, boxShadow: "0 0 15px var(--color-bio-green)" }} className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-bio-green)]/80 to-emerald-600/80 text-white font-bold tracking-wide border border-white/10 flex items-center justify-center">
                        <ScanLine size={18} className="mr-2 text-white" /> Complete Analysis
                    </motion.button>
                )}
            </motion.div>
        </motion.div>
    );
};

// ==========================================
// 4. COPILOT CHAT SCREEN
// ==========================================
export const CopilotScreen = ({ scanData, onComplete }) => {
    const [messages, setMessages] = useState([{ sender: 'ai', text: "Scan complete. Analyzing data...", isTyping: true }]);
    const [input, setInput] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [finalResult, setFinalResult] = useState(null);

    const fetchChat = async (currentMessages) => {
        try {
            setMessages(prev => { const newMsgs = [...prev]; if (newMsgs.length > 0) newMsgs[newMsgs.length - 1].isTyping = false; return newMsgs; });
            setMessages(prev => [...prev, { sender: 'ai', text: "", isTyping: true }]);

            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: currentMessages, context: scanData })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { sender: 'ai', text: data.reply, isTyping: false };
                    return newMsgs;
                });

                if (data.reply.includes("Analysis Complete:")) {
                    setIsComplete(true);
                    try {
                        const synthRes = await fetch(`${API_BASE}/api/synthesize`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageScore: scanData?.suggestedRiskScore || 20, metadata: {}, chatHistory: currentMessages })
                        });
                        if (synthRes.ok) {
                            const synthData = await synthRes.json();
                            setFinalResult({ score: synthData.finalScore || scanData?.suggestedRiskScore || 20, data: { ...scanData, synthesis: synthData } });
                        } else {
                            setFinalResult({ score: scanData?.suggestedRiskScore || 20, data: scanData });
                        }
                    } catch (e) {
                        setFinalResult({ score: scanData?.suggestedRiskScore || 20, data: scanData });
                    }
                }
            }
        } catch (e) {
            console.error("Chat error:", e);
        }
    };

    useEffect(() => {
        if (scanData && messages.length === 1 && messages[0].sender === 'ai' && messages[0].text === "Scan complete. Analyzing data...") {
            fetchChat([]);
        }
    }, [scanData]);

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isComplete) return;

        const newMessages = [...messages.filter(m => !m.isTyping), { sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        fetchChat(newMessages);
    };

    return (
        <motion.div layoutId="screen-container" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col h-full w-full p-6 md:pt-16 md:pr-40 relative">
            <header className="flex items-center space-x-3 pb-4 border-b border-white/10 shrink-0">
                <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-cyber-teal)]/10 border border-[var(--color-cyber-teal)]/30 flex items-center justify-center relative overflow-hidden">
                        <Cpu size={20} className="text-[var(--color-cyber-teal)] z-10" />
                        <div className="absolute inset-0 bg-[var(--color-cyber-teal)]/20 animate-pulse"></div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--color-bio-green)] rounded-full shadow-[0_0_8px_#39ff14]"></div>
                </div>
                <div>
                    <h2 className="text-sm font-semibold tracking-wide text-white">Holographic Assistant</h2>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">MedGemma v4.2 Online</p>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto py-6 space-y-6 scroll-smooth pr-2">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${msg.sender === 'user' ? 'bg-[var(--color-cyber-teal)]/20 border border-[var(--color-cyber-teal)]/30 text-white rounded-tr-sm' : 'glass-panel text-gray-200 border-l-[3px] border-l-[var(--color-cyber-teal)] rounded-tl-sm relative overflow-hidden'}`}>
                                {msg.sender === 'ai' && <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[var(--color-cyber-teal)]/50 to-transparent"></div>}
                                {msg.isTyping ? <span className="typing-cursor"></span> : msg.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isComplete && !finalResult && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-4">
                        <div className="glass-panel px-4 py-2 border-[var(--color-bio-green)]/30 text-[var(--color-bio-green)] text-xs rounded-full flex items-center shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                            <CheckCircle size={14} className="mr-2 animate-spin" /> Synthesizing Final Report...
                        </div>
                    </motion.div>
                )}
                {finalResult && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-4">
                        <button onClick={() => onComplete(finalResult.score, finalResult.data)} className="px-6 py-3 rounded-full bg-[var(--color-bio-green)] text-white font-bold flex items-center shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:scale-105 transition-transform">
                            Proceed to Diagnostic Results
                        </button>
                    </motion.div>
                )}
            </div>
            <div className="pt-4 border-t border-white/10 shrink-0 min-h-[80px] flex items-center">
                <AnimatePresence mode="popLayout">
                    {!isComplete && (
                        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex w-full items-center space-x-2" onSubmit={handleSend}>
                            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Answer Copilot..." className="flex-1 border border-white/20 bg-black/40 rounded-full py-3 px-4 text-sm text-white focus:outline-none focus:border-[var(--color-cyber-teal)] transition-all" />
                            <button type="submit" disabled={!input} className="w-10 h-10 rounded-full bg-[var(--color-cyber-teal)] flex justify-center items-center text-black font-bold disabled:opacity-50"><Send size={16} /></button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// ==========================================
// 5. RESULTS SCREEN
// ==========================================
export const ResultsScreen = ({ riskValue, scanData, onShowMap, onShowHologram, onShowConsult, onShowCopilot }) => {
    const { addScanResult } = useUser();

    useEffect(() => { addScanResult(riskValue); }, [riskValue, addScanResult]);

    const circleCircumference = 2 * Math.PI * 54;
    const strokeDashoffset = circleCircumference - (riskValue / 100) * circleCircumference;
    const insightText = scanData?.synthesis?.insight || scanData?.explanation || "Awaiting advanced synthesis...";
    const riskLabel = riskValue > 70 ? 'HIGH RISK' : riskValue > 40 ? 'ELEVATED' : 'OPTIMAL';

    return (
        <motion.div layoutId="screen-container" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.6, type: 'spring' }} className="flex flex-col h-full w-full p-8 pt-24 md:pt-16 md:pr-40 items-center relative overflow-hidden">
            <header className="w-full text-center mb-8 relative">
                <h2 className="text-xl font-light tracking-[0.3em] uppercase text-gray-400">Diagnostic Result</h2>
                <div className="absolute bottom--2 left-1/2 transform -translate-x-1/2 w-12 h-[1px] bg-[var(--color-cyber-teal)] shadow-neon-teal"></div>
            </header>
            <div className="relative flex justify-center items-center mb-8">
                <div className="absolute w-40 h-40 bg-[rgba(255,165,0,0.15)] rounded-full blur-[30px]"></div>
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 4" />
                    <circle className="circular-progress" cx="60" cy="60" r="54" fill="none" stroke="url(#gradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient>
                    </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-yellow-400 to-red-500">{riskValue}</span>
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">{riskLabel}</span>
                </div>
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full glass-panel breathing-neon-border p-5 rounded-xl border-l-[4px] border-l-yellow-500 mb-8 relative overflow-hidden group shrink-0">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity"><Info size={16} className="text-yellow-500" /></div>
                <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center"><Zap size={16} className="text-yellow-500 mr-2" /> AI Synthesis Insight</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-light">{insightText}</p>
            </motion.div>
            <div className="w-full flex flex-col space-y-3 mt-auto relative z-10 pb-20">
                <motion.button onClick={onShowCopilot} whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(57, 255, 20, 0.4)" }} whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-bio-green)]/80 to-emerald-600/80 text-white font-bold tracking-wide border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer mb-2">
                    <MessageSquare size={18} className="mr-3 text-white" /> Chat with AI Copilot
                </motion.button>
                <motion.button onClick={onShowConsult} whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0, 210, 255, 0.4)" }} whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-cyber-teal)]/80 to-blue-600/80 text-white font-medium tracking-wide border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <PhoneCall size={18} className="mr-3" /> Consult Specialist Now
                </motion.button>
                <div className="flex space-x-3 w-full">
                    <motion.button onClick={onShowHologram} whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)", borderColor: "var(--color-cyber-teal)", boxShadow: "0 0 15px rgba(0,210,255,0.3)" }} whileTap={{ scale: 0.98 }} className="w-1/2 py-3 rounded-xl glass-panel text-[var(--color-cyber-teal)] text-sm flex items-center justify-center hover:text-white transition-all cursor-pointer border border-white/10 group shadow-[0_0_10px_rgba(0,210,255,0.1)]">
                        <User size={16} className="mr-2 group-hover:text-white transition-colors" /> Hologram
                    </motion.button>
                    <motion.button onClick={onShowMap} whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }} whileTap={{ scale: 0.98 }} className="w-1/2 py-3 rounded-xl glass-panel text-gray-300 text-sm flex items-center justify-center hover:text-white transition-colors cursor-pointer">
                        <Map size={16} className="mr-2 text-[var(--color-bio-green)]" /> 3D Map
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// 5.5 COPILOT CHAT SCREEN
// ==========================================
export const CopilotChatScreen = ({ scanData, chatHistory, setChatHistory, onBack }) => {
    const { user } = useUser();
    const risk = user?.riskHistory?.[user.riskHistory.length - 1] || user?.currentRiskIndex;

    // Fallback if not injected via context
    const [localMessages, setLocalMessages] = useState([]);
    const messages = chatHistory || localMessages;

    const setMessages = (setter) => {
        if (setChatHistory) {
            setChatHistory(prev => {
                const currentPrev = prev || [];
                return typeof setter === 'function' ? setter(currentPrev) : setter;
            });
        } else {
            setLocalMessages(prev => {
                const currentPrev = prev || [];
                return typeof setter === 'function' ? setter(currentPrev) : setter;
            });
        }
    };

    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleLanguageSelect = (lang) => {
        let greeting = `Hello ${user?.name || 'User'}. I am your DermaAI Copilot. Let's discuss your recent scan result. How can I help you?`;
        if (lang === '中文') greeting = `你好 ${user?.name || 'User'}。我是你的 DermaAI 副驾驶。我们来讨论一下你最近的扫描结果。我能怎么帮助你？`;
        if (lang === 'Melayu') greeting = `Hai ${user?.name || 'User'}. Saya Copilot DermaAI anda. Mari bincangkan hasil imbasan terkini anda. Bagaimana saya boleh membantu?`;

        // Also inform the backend implicitly by injecting a system prefix later, or just the chosen language prompt
        setMessages([{ id: 1, sender: 'ai', text: greeting, isTyping: false }]);
    };

    const handleNewConversation = () => {
        setMessages([]);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', text: input, isTyping: false };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        const aiTypingId = Date.now() + 1;
        setMessages(prev => [...prev, { id: aiTypingId, sender: 'ai', text: "", isTyping: true }]);

        try {
            const contextToSend = scanData ? scanData : { risk };
            const currentMessagesContext = messages.filter(m => !m.isTyping).map(m => ({ sender: m.sender, text: m.text }));
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...currentMessagesContext, userMsg], context: contextToSend })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => prev.map(msg => msg.id === aiTypingId ? { ...msg, text: data.reply.replace("Analysis Complete:", ""), isTyping: false } : msg));
            } else {
                setMessages(prev => prev.map(msg => msg.id === aiTypingId ? { ...msg, text: "I'm having trouble connecting to my neural net.", isTyping: false } : msg));
            }
        } catch (err) {
            setMessages(prev => prev.map(msg => msg.id === aiTypingId ? { ...msg, text: "Connection error.", isTyping: false } : msg));
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full p-6 md:pt-16 md:pr-40 relative overflow-hidden bg-background">
            <div className="absolute top-12 left-6 z-30">
                <button onClick={onBack} className="px-4 py-2 rounded-lg glass-panel text-white hover:bg-white/10 transition-colors uppercase text-xs tracking-wider border border-white/20 cursor-pointer flex items-center">
                    <ArrowLeft size={14} className="mr-2" /> Return
                </button>
            </div>
            <header className="flex flex-col items-center justify-center h-24 shrink-0 bg-gradient-to-b from-black/80 to-transparent pt-12 z-20">
                <div className="flex w-full justify-between items-center px-6">
                    <h2 className="text-lg font-light tracking-widest text-white flex items-center"><Cpu size={18} className="text-[var(--color-bio-green)] mr-2" /> DermaAI Copilot</h2>
                    {messages && messages.length > 0 && (
                        <button onClick={handleNewConversation} className="text-xs text-[var(--color-cyber-teal)] bg-white/5 px-3 py-1 rounded hover:bg-white/10 transition border border-[var(--color-cyber-teal)]/30">
                            New Chat
                        </button>
                    )}
                </div>
                <p className="text-[10px] text-[var(--color-bio-green)] font-mono mt-1 w-full text-center">AI Contextual Analysis Active</p>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-20">
                {!messages || messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-bio-green)]/20 flex items-center justify-center border border-[var(--color-bio-green)]/50">
                            <MessageSquare className="text-[var(--color-bio-green)]" size={32} />
                        </div>
                        <h3 className="text-xl text-white font-light tracking-wide">Select Language</h3>
                        <div className="flex space-x-4">
                            {['English', '中文', 'Melayu'].map(lang => (
                                <button key={lang} onClick={() => handleLanguageSelect(lang)} className="px-6 py-3 rounded-xl glass-panel text-white hover:bg-[var(--color-bio-green)]/20 border border-white/10 hover:border-[var(--color-bio-green)] transition-all">
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <AnimatePresence>
                        {messages.map(msg => (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-[var(--color-cyber-teal)]/20 border border-[var(--color-cyber-teal)]/50 text-white rounded-br-sm' : 'glass-panel border border-[var(--color-bio-green)]/30 text-gray-200 rounded-bl-sm relative overflow-hidden'}`}>
                                    {msg.sender === 'ai' && <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[var(--color-bio-green)]/50 to-transparent"></div>}
                                    {msg.isTyping ? <span className="typing-cursor"></span> : msg.text}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={chatEndRef} />
                    </AnimatePresence>
                )}
            </div>

            {messages && messages.length > 0 && (
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
                    <form onSubmit={handleSend} className="flex items-center space-x-2">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Copilot for specific advice..." className="flex-1 bg-black/50 border border-white/20 rounded-full py-3 px-5 text-sm text-white focus:outline-none focus:border-[var(--color-bio-green)] transition-colors" />
                        <button type="submit" disabled={!input.trim()} className="w-12 h-12 rounded-full bg-[var(--color-bio-green)] text-black flex items-center justify-center disabled:opacity-50 transition-opacity">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </motion.div>
    );
};

// ==========================================
// 6. CONSULT SCREEN
// ==========================================
export const ConsultScreen = ({ onBack }) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full p-8 pt-24 md:pt-16 md:pr-40 relative overflow-hidden">
            <div className="absolute top-24 md:top-16 left-6 z-30">
                <button onClick={onBack} className="px-4 py-2 rounded-lg glass-panel text-white hover:bg-white/10 transition-colors uppercase text-xs tracking-wider border border-white/20 cursor-pointer flex items-center">
                    <ArrowLeft size={14} className="mr-2" /> Return
                </button>
            </div>
            <header className="flex flex-col items-center text-center mb-12 relative z-20 shrink-0">
                <h2 className="text-xl font-light tracking-[0.2em] text-white">Specialist Consultation</h2>
                <p className="text-xs text-[var(--color-cyber-teal)] uppercase tracking-widest mt-1">Tele-Dermatology Link</p>
            </header>
            <div className="flex-1 flex flex-col items-center justify-start mt-4 relative z-10">
                <div className="w-32 h-32 rounded-full border-2 border-[var(--color-cyber-teal)]/40 flex items-center justify-center mb-6 relative">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute inset-0 border border-dashed border-[var(--color-cyber-teal)]/30 rounded-full"></motion.div>
                    <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute inset-3 border border-[var(--color-bio-green)]/20 rounded-full"></motion.div>
                    <PhoneCall size={40} className="text-[var(--color-cyber-teal)]" />
                </div>
                <h3 className="text-2xl font-light text-white tracking-wide mb-2">Connecting to Specialist</h3>
                <p className="text-sm text-gray-400 text-center max-w-md mb-8">
                    A board-certified dermatologist will review your scan results and provide a personalized assessment.
                </p>
                <div className="glass-panel p-6 rounded-2xl border border-[var(--color-cyber-teal)]/20 w-full max-w-md space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-cyber-teal)]/20 flex items-center justify-center"><User size={20} className="text-[var(--color-cyber-teal)]" /></div>
                        <div>
                            <p className="text-sm font-semibold text-white">Dr. Aisha Rahman</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Senior Dermatologist Â· HUKM</p>
                        </div>
                        <div className="ml-auto flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-bio-green)] animate-pulse"></div>
                            <span className="text-[10px] text-[var(--color-bio-green)]">Online</span>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                        <p className="text-xs text-gray-400 mb-3">Estimated wait time:</p>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-white font-mono">~5</span>
                            <span className="text-sm text-gray-400">minutes</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// 7. HOLOGRAM SCREEN
// ==========================================
export const HologramScreen = ({ scanData, onBack }) => {
    const [hoveredPart, setHoveredPart] = useState(null);

    // Detailed anatomical SVG body — viewBox 0 0 200 520
    const bodyParts = [
        {
            id: 'head', label: 'Cranium / Scalp', risk: 12,
            path: 'M100 8 C80 8 68 20 66 38 C64 50 66 60 72 68 C74 72 78 78 82 82 L84 86 L116 86 L118 82 C122 78 126 72 128 68 C134 60 136 50 134 38 C132 20 120 8 100 8 Z'
        },
        {
            id: 'neck', label: 'Cervical Region', risk: 8,
            path: 'M88 86 C88 90 86 96 86 100 L86 108 L114 108 L114 100 C114 96 112 90 112 86 Z'
        },
        {
            id: 'shoulderL', label: 'Left Shoulder', risk: 15,
            path: 'M86 108 C78 108 62 112 52 120 C48 124 44 128 42 134 L64 134 L86 120 Z'
        },
        {
            id: 'shoulderR', label: 'Right Shoulder', risk: 14,
            path: 'M114 108 C122 108 138 112 148 120 C152 124 156 128 158 134 L136 134 L114 120 Z'
        },
        {
            id: 'chest', label: 'Thorax / Chest', risk: 65,
            path: 'M64 134 L42 134 C40 148 38 164 38 178 L38 200 L64 200 L100 204 L136 200 L162 200 L162 178 C162 164 160 148 158 134 L136 134 L114 120 L100 116 L86 120 Z'
        },
        {
            id: 'abdomen', label: 'Abdomen / Core', risk: 34,
            path: 'M64 200 L38 200 C38 218 40 236 42 252 L46 268 L60 272 L100 276 L140 272 L154 268 L158 252 C160 236 162 218 162 200 L136 200 L100 204 Z'
        },
        {
            id: 'pelvis', label: 'Pelvic Region', risk: 28,
            path: 'M60 272 L46 268 C44 280 42 290 44 298 L52 310 L68 316 L100 318 L132 316 L148 310 L156 298 C158 290 156 280 154 268 L140 272 L100 276 Z'
        },
        {
            id: 'upperArmL', label: 'Left Upper Arm', risk: 85,
            path: 'M42 134 C38 140 34 150 30 162 C26 176 22 192 20 208 L18 224 L36 228 L40 212 C42 198 44 184 48 170 C50 160 54 148 58 140 L64 134 Z'
        },
        {
            id: 'upperArmR', label: 'Right Upper Arm', risk: 18,
            path: 'M158 134 C162 140 166 150 170 162 C174 176 178 192 180 208 L182 224 L164 228 L160 212 C158 198 156 184 152 170 C150 160 146 148 142 140 L136 134 Z'
        },
        {
            id: 'forearmL', label: 'Left Forearm', risk: 42,
            path: 'M18 224 L14 248 C12 264 10 280 10 296 L12 310 L28 314 L32 298 C34 282 36 264 36 248 L36 228 Z'
        },
        {
            id: 'forearmR', label: 'Right Forearm', risk: 16,
            path: 'M182 224 L186 248 C188 264 190 280 190 296 L188 310 L172 314 L168 298 C166 282 164 264 164 248 L164 228 Z'
        },
        {
            id: 'handL', label: 'Left Hand', risk: 72,
            path: 'M12 310 L8 324 C4 332 2 338 0 346 L2 350 L8 348 L12 338 L14 350 L18 352 L20 340 L22 354 L26 354 L26 342 L28 352 L32 350 L30 336 L28 314 Z'
        },
        {
            id: 'handR', label: 'Right Hand', risk: 10,
            path: 'M188 310 L192 324 C196 332 198 338 200 346 L198 350 L192 348 L188 338 L186 350 L182 352 L180 340 L178 354 L174 354 L174 342 L172 352 L168 350 L170 336 L172 314 Z'
        },
        {
            id: 'thighL', label: 'Left Thigh', risk: 25,
            path: 'M68 316 L52 310 C50 318 48 328 46 340 C44 356 42 374 42 392 L44 410 L62 414 L68 398 C70 382 72 364 72 346 C72 332 70 324 68 316 Z'
        },
        {
            id: 'thighR', label: 'Right Thigh', risk: 10,
            path: 'M132 316 L148 310 C150 318 152 328 154 340 C156 356 158 374 158 392 L156 410 L138 414 L132 398 C130 382 128 364 128 346 C128 332 130 324 132 316 Z'
        },
        {
            id: 'shinL', label: 'Left Shin / Calf', risk: 20,
            path: 'M44 410 L42 430 C40 448 38 466 38 480 L40 496 L56 498 L60 482 C62 466 62 448 62 430 L62 414 Z'
        },
        {
            id: 'shinR', label: 'Right Shin / Calf', risk: 12,
            path: 'M156 410 L158 430 C160 448 162 466 162 480 L160 496 L144 498 L140 482 C138 466 138 448 138 430 L138 414 Z'
        },
        {
            id: 'footL', label: 'Left Foot', risk: 15,
            path: 'M40 496 L36 504 L28 510 L24 514 L28 518 L38 516 L50 514 L58 512 L56 498 Z'
        },
        {
            id: 'footR', label: 'Right Foot', risk: 8,
            path: 'M160 496 L164 504 L172 510 L176 514 L172 518 L162 516 L150 514 L142 512 L144 498 Z'
        },
    ].map(part => {
        if (scanData && scanData.bodyPart === part.id) {
            return { ...part, risk: scanData.synthesis?.finalScore || scanData.suggestedRiskScore || part.risk };
        }
        // Base ambient risk decay based on current scan
        if (scanData) {
            return { ...part, risk: Math.min(part.risk, 15) };
        }
        return part;
    });

    const getRiskColor = (risk) => {
        if (risk > 70) return '#ef4444';
        if (risk > 40) return '#f59e0b';
        if (risk > 20) return '#00d2ff';
        return '#39ff14';
    };

    const getRiskLabel = (risk) => {
        if (risk > 70) return 'HIGH';
        if (risk > 40) return 'MODERATE';
        if (risk > 20) return 'LOW';
        return 'OPTIMAL';
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full p-8 md:pt-16 md:pr-40 relative overflow-hidden">
            {/* Ambient body glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[500px] bg-[#00d2ff]/6 rounded-full blur-[80px] pointer-events-none"></div>

            <header className="flex items-center mb-4 relative z-20 shrink-0 space-x-4">
                <button onClick={onBack} className="px-3 py-2 rounded-lg glass-panel text-white hover:bg-white/10 transition-colors text-xs tracking-wider border border-white/20 cursor-pointer flex items-center shrink-0"><ArrowLeft size={14} className="mr-1" /> Return</button>
                <div>
                    <h2 className="text-xl font-light tracking-[0.2em] text-white">Full-Body Hologram</h2>
                    <p className="text-xs text-[var(--color-cyber-teal)] uppercase tracking-widest mt-1">Diagnostic Overlay · Hover to Inspect</p>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center relative min-h-0">
                {/* SVG Body */}
                <div className="relative h-full max-h-[560px] aspect-[200/520] z-10">
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-[var(--color-cyber-teal)]/15 rounded-[100%] blur-[10px]"></div>

                    <svg viewBox="-5 0 210 525" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 6px rgba(0,210,255,0.15))' }}>
                        <defs>
                            <filter id="holo-glow" x="-40%" y="-40%" width="180%" height="180%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(0,210,255,0)" />
                                <stop offset="50%" stopColor="rgba(0,210,255,0.5)" />
                                <stop offset="100%" stopColor="rgba(0,210,255,0)" />
                            </linearGradient>
                        </defs>

                        {/* Faint wireframe outlines */}
                        {bodyParts.map(p => (
                            <path key={`o-${p.id}`} d={p.path} fill="none" stroke="rgba(0,210,255,0.08)" strokeWidth="0.5" />
                        ))}

                        {/* Interactive parts with float-on-hover */}
                        {bodyParts.map(part => {
                            const isHovered = hoveredPart?.id === part.id;
                            const color = getRiskColor(part.risk);
                            return (
                                <motion.path
                                    key={part.id}
                                    d={part.path}
                                    fill={color}
                                    fillOpacity={isHovered ? 0.5 : 0.08}
                                    stroke={color}
                                    strokeWidth={isHovered ? 1.8 : 0.4}
                                    strokeLinejoin="round"
                                    filter={isHovered ? 'url(#holo-glow)' : undefined}
                                    onMouseEnter={() => setHoveredPart(part)}
                                    onMouseLeave={() => setHoveredPart(null)}
                                    style={{ cursor: 'crosshair', transformOrigin: 'center center' }}
                                    animate={{
                                        y: isHovered ? -8 : 0,
                                        fillOpacity: isHovered ? [0.35, 0.55, 0.35] : 0.08,
                                        scale: isHovered ? 1.04 : 1,
                                    }}
                                    transition={isHovered
                                        ? { fillOpacity: { repeat: Infinity, duration: 1.2 }, y: { type: 'spring', stiffness: 300 }, scale: { type: 'spring', stiffness: 300 } }
                                        : { duration: 0.3 }
                                    }
                                />
                            );
                        })}

                        {/* Scanning line */}
                        <motion.rect x="-5" width="210" height="4" rx="2" fill="url(#scanGrad)" animate={{ y: [0, 520] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }} style={{ opacity: 0.4 }} />
                    </svg>
                </div>

                {/* Info Panel */}
                <AnimatePresence>
                    {hoveredPart && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            className="absolute right-8 top-1/2 -translate-y-1/2 min-w-[220px] glass-panel p-5 border rounded-xl backdrop-blur-md pointer-events-none z-30"
                            style={{ borderColor: getRiskColor(hoveredPart.risk), boxShadow: `0 0 25px ${getRiskColor(hoveredPart.risk)}33` }}
                        >
                            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Region Analysis</div>
                            <div className="text-lg font-bold text-white mb-1">{hoveredPart.label}</div>
                            <div className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: getRiskColor(hoveredPart.risk) }}>{getRiskLabel(hoveredPart.risk)} RISK</div>
                            <div className="border-t border-white/10 pt-3">
                                <div className="flex items-end justify-between">
                                    <span className="text-xs text-gray-500">Anomaly Prob.</span>
                                    <span className="text-3xl font-mono font-bold" style={{ color: getRiskColor(hoveredPart.risk), textShadow: `0 0 12px ${getRiskColor(hoveredPart.risk)}` }}>{hoveredPart.risk}%</span>
                                </div>
                                <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${hoveredPart.risk}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ backgroundColor: getRiskColor(hoveredPart.risk), boxShadow: `0 0 8px ${getRiskColor(hoveredPart.risk)}` }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Legend */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 space-y-3 z-20">
                    {[
                        { color: '#ef4444', label: 'High (>70%)' },
                        { color: '#f59e0b', label: 'Moderate (40-70%)' },
                        { color: '#00d2ff', label: 'Low (20-40%)' },
                        { color: '#39ff14', label: 'Optimal (<20%)' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}66` }}></div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// 8. GUIDE SCREEN
// ==========================================
export const GuideScreen = ({ onNext }) => {
    const steps = [
        { title: "Complete Profile", desc: "Your basic identity has been verified.", icon: <CheckCircle size={24} className="text-[var(--color-bio-green)]" /> },
        { title: "Understand Terms", desc: "Review data privacy and usage disclaimers.", icon: <ShieldCheck size={24} className="text-[var(--color-cyber-teal)]" /> },
        { title: "Prep Environment", desc: "Follow KYC-level instructions for lighting and posture.", icon: <Focus size={24} className="text-[var(--color-cyber-teal)]" /> },
        { title: "AR Body Scan", desc: "Use device camera to run a biometric diagnostic.", icon: <ScanLine size={24} className="text-[var(--color-cyber-teal)]" /> },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col h-full w-full p-8 md:pt-16 md:pr-40 relative overflow-hidden">
            <header className="mb-8">
                <h2 className="text-2xl font-light tracking-wide text-white">Initialization Sequence</h2>
                <p className="text-xs text-[var(--color-cyber-teal)] uppercase tracking-widest mt-1">Setup Protocol Overview</p>
            </header>

            <div className="flex-1 space-y-6 relative z-10 w-full max-w-md mx-auto">
                {steps.map((step, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2 }} className="flex items-start space-x-4">
                        <div className="bg-black/40 p-3 rounded-full border border-[var(--color-cyber-teal)]/30 shrink-0">
                            {step.icon}
                        </div>
                        <div className="pt-1">
                            <h3 className="text-white font-medium text-lg">{step.title}</h3>
                            <p className="text-gray-400 text-sm">{step.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-12 mb-4">
                <motion.button onClick={onNext} whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(0, 210, 255, 0.3)" }} whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-xl bg-[var(--color-cyber-teal)]/20 text-white font-medium tracking-wide border border-[var(--color-cyber-teal)]/50 hover:bg-[var(--color-cyber-teal)]/30 transition-colors">
                    Acknowledge & Proceed
                </motion.button>
            </div>
        </motion.div>
    );
};

// ==========================================
// 9. DISCLAIMER SCREEN
// ==========================================
export const DisclaimerScreen = ({ onNext }) => {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col h-full w-full p-8 md:pt-16 md:pr-40 relative overflow-hidden justify-center items-center">
            <header className="mb-6 flex flex-col items-center text-center mt-12">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                    <AlertTriangle size={36} className="text-red-400" />
                </div>
                <h2 className="text-2xl font-light tracking-wide text-white">Data Privacy Protocol</h2>
            </header>

            <div className="w-full max-w-lg mb-8">
                <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
                    <p className="text-sm text-gray-300 leading-relaxed font-light text-center">
                        By proceeding with the AR Body Scan, you acknowledge and agree to the following terms regarding your biometric data:
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start space-x-3">
                            <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-cyber-teal)]"></div>
                            <span className="text-xs text-gray-400"><strong className="text-white">Ephemeral Processing:</strong> All video streams are processed locally on your device in real-time. No raw video or images are ever uploaded to our servers.</span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-cyber-teal)]"></div>
                            <span className="text-xs text-gray-400"><strong className="text-white">Decentralized Storage:</strong> Only the resulting abstracted "Risk Index" hash is transmitted. This hash is stored using decentralized ledger technology, ensuring cryptographic immutability and complete anonymity.</span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-cyber-teal)]"></div>
                            <span className="text-xs text-gray-400"><strong className="text-white">Auto-Deletion Protocol:</strong> Any temporary cache utilized by the neural engine during the scan will be forcefully purged from device memory immediately upon scan completion.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <motion.button onClick={onNext} whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0, 210, 255, 0.4)" }} whileTap={{ scale: 0.98 }} className="w-full max-w-lg py-4 rounded-xl mt-4 bg-gradient-to-r from-[var(--color-cyber-teal)]/80 to-blue-600/80 text-white font-medium tracking-wide">
                I Understand and Agree
            </motion.button>
        </motion.div>
    );
};

// ==========================================
// 10. SCAN INSTRUCTIONS SCREEN
// ==========================================
export const ScanInstructionsScreen = ({ onNext }) => {
    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col h-full w-full p-8 md:pt-16 md:pr-40 relative overflow-hidden">
            <header className="mb-6 border-b border-white/10 pb-4 shrink-0">
                <h2 className="text-xl font-light tracking-wide text-white flex items-center">
                    <Focus size={24} className="mr-3 text-[var(--color-cyber-teal)]" />
                    Scan Requirements
                </h2>
                <p className="text-xs text-gray-400 mt-1">Please read carefully to ensure AR engine accuracy.</p>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto pr-2 pb-6">
                <div className="bg-[var(--color-cyber-teal)]/5 p-4 rounded-xl border border-[var(--color-cyber-teal)]/20">
                    <h3 className="text-white text-sm font-semibold mb-2 flex items-center">
                        <span className="text-[var(--color-cyber-teal)] mr-2">1.</span> Optimal Lighting
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Ensure you are in a brightly lit environment. Avoid strong backlighting or direct, harsh incandescent bulbs that cause excessive glare or shadows. Natural daylight is highly recommended.
                    </p>
                </div>

                <div className="bg-[var(--color-cyber-teal)]/5 p-4 rounded-xl border border-[var(--color-cyber-teal)]/20">
                    <h3 className="text-white text-sm font-semibold mb-2 flex items-center">
                        <span className="text-[var(--color-cyber-teal)] mr-2">2.</span> Clear Framing
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Do not obscure the camera. During the scan, stand fully within the frame. Ensure the area of concern is clearly visible without being obscured by clothing, hair, or physical objects.
                    </p>
                </div>

                <div className="bg-[var(--color-cyber-teal)]/5 p-4 rounded-xl border border-[var(--color-cyber-teal)]/20">
                    <h3 className="text-white text-sm font-semibold mb-2 flex items-center">
                        <span className="text-[var(--color-cyber-teal)] mr-2">3.</span> Stable Posture
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Hold the device as steady as possible. Follow any on-screen AR guides to orient the camera. Move slowly and deliberately if the system requests a different angle.
                    </p>
                </div>
            </div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-4">
                <motion.button onClick={onNext} whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(57, 255, 20, 0.3)" }} whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-bio-green)]/80 to-[var(--color-cyber-teal)]/80 text-white font-bold tracking-wide flex justify-center items-center">
                    <ScanLine size={20} className="mr-2" /> Initialize Camera
                </motion.button>
            </motion.div>
        </motion.div>
    );
};
