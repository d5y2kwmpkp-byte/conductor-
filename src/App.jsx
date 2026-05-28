import { useState, useEffect, useRef } from "react";
import { T, STYLES, initPads, initChannels, initPan } from "./constants.js";
import { engine } from "./engine/AudioEngine.js";
import RolePicker    from "./components/RolePicker.jsx";
import VibeSheet     from "./components/VibeSheet.jsx";
import MixerOverlay  from "./components/MixerOverlay.jsx";
import LearnView     from "./components/LearnView.jsx";

const hwBtn = {
  width:"28px", height:"28px", borderRadius:"3px",
  background:T.panel, border:`1.5px solid ${T.borderDark}`,
  color:T.text, cursor:"pointer", fontSize:"16px",
  display:"flex", alignItems:"center", justifyContent:"center",
  fontFamily:"monospace", boxShadow:`0 2px 0 ${T.borderDark}`,
};

// ── API CALL ──
async function callCook(pad, style, bpm, vibe = null) {
  const res = await fetch("/api/cook", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ pad: { role: pad.role?.id, tags: pad.tags, direction: pad.direction, steps: pad.steps }, style, bpm, vibe }),
  });
  if (!res.ok) throw new Error("Cook failed");
  return res.json();
}

export default function App() {
  const [pads,          setPads]         = useState(initPads);
  const [channels,      setChannels]     = useState(initChannels);
  const [panVals,       setPanVals]      = useState(initPan);
  const [playing,       setPlaying]      = useState(false);
  const [bpm,           setBpm]          = useState(90);
  const [style,         setStyle]        = useState("SWING");
  const [currentStep,   setCurrentStep]  = useState(-1);
  const [view,          setView]         = useState("pads");

  // Sheets
  const [roleSheet,     setRoleSheet]    = useState(null);
  const [mixerOpen,     setMixerOpen]    = useState(false);
  const [showVibe,      setShowVibe]     = useState(false);

  // Recording
  const [bandListening, setBandListening] = useState(false);
  const [bandCooking,   setBandCooking]   = useState(false);
  const [padListening,  setPadListening]  = useState(null);
  const [padCooking,    setPadCooking]    = useState(null);
  const [activePads,    setActivePads]    = useState({});
  const [aiReplies,     setAiReplies]     = useState({});
  const [lcdMsg,        setLcdMsg]        = useState("");

  const tapBuf   = useRef([]);
  const recStart = useRef(null);
  const micSess  = useRef(null);
  const padsRef  = useRef(pads);

  useEffect(() => { padsRef.current = pads; }, [pads]);
  useEffect(() => { engine.bpm   = bpm; },   [bpm]);

  // Wire engine step callback
  useEffect(() => {
    engine.onStep = step => setCurrentStep(step);
    return () => engine.stop();
  }, []);

  // Sync patterns → engine
  useEffect(() => {
    const merged = {};
    pads.forEach(pad => {
      if (!pad.role) return;
      const ch = channels[pad.id];
      merged[pad.id] = { roleId: pad.role.id, steps: pad.steps, muted: ch?.muted };
    });
    engine.patterns = merged;
  }, [pads, channels]);

  // Sync EQ/vol → engine
  useEffect(() => {
    Object.entries(channels).forEach(([padId, ch]) => {
      engine.setVol(padId, ch.muted ? 0 : ch.vol);
      engine.setEQ(padId, "hi",  ch.hi);
      engine.setEQ(padId, "mid", ch.mid);
      engine.setEQ(padId, "lo",  ch.lo);
    });
  }, [channels]);

  const showMsg = (msg, ms = 2500) => {
    setLcdMsg(msg);
    setTimeout(() => setLcdMsg(""), ms);
  };

  const flash = id => {
    setActivePads(p => ({ ...p, [id]: true }));
    setTimeout(() => setActivePads(p => ({ ...p, [id]: false })), 90);
  };

  const updCh = (padId, key, val) =>
    setChannels(p => ({ ...p, [padId]: { ...p[padId], [key]: val } }));

  const updPad = updated =>
    setPads(p => p.map(p2 => p2.id === updated.id ? updated : p2));

  const assignedPads = pads.filter(p => p.role);

  // ── EVERYBODY IN ──
  const onBandDown = () => {
    if (bandCooking || padListening) return;
    engine.boot(); engine.wake();
    tapBuf.current  = [];
    recStart.current = Date.now();
    setBandListening(true);
    // Start mic
    engine.startMicRecording().then(sess => { micSess.current = sess; });
  };

  const onBandUp = async () => {
    if (!bandListening) return;
    setBandListening(false);
    engine.stopMicRecording(micSess.current);
    micSess.current = null;

    const taps = tapBuf.current;
    recStart.current = null;

    if (assignedPads.length === 0) { showMsg("ASSIGN MUSICIANS FIRST"); return; }

    // Convert taps to steps if any taps recorded
    const detectedSteps = taps.length > 0 ? engine.tapsToSteps(taps, bpm) : null;

    setBandCooking(true);
    showMsg(`COOKING ${assignedPads.length} MUSICIANS...`, 4000);

    // Fire all in parallel
    const results = await Promise.allSettled(
      assignedPads.map(pad => {
        const padWithSteps = detectedSteps ? { ...pad, steps: detectedSteps } : pad;
        return callCook(padWithSteps, style, bpm, null);
      })
    );

    const newReplies = {};
    setPads(prev => {
      const next = [...prev];
      results.forEach((res, i) => {
        const pad = assignedPads[i];
        const idx = next.findIndex(p => p.id === pad.id);
        if (res.status === "fulfilled" && res.value?.steps?.length === 16) {
          next[idx] = { ...next[idx], steps: res.value.steps };
          newReplies[pad.id] = res.value.reply || "in the pocket.";
        }
      });
      return next;
    });

    setAiReplies(prev => ({ ...prev, ...newReplies }));
    setBandCooking(false);

    if (!playing) {
      engine.start();
      setPlaying(true);
    }
    showMsg("THE BAND IS IN");
  };

  // ── VIBE ──
  const onVibeSubmit = async vibe => {
    if (assignedPads.length === 0) { showMsg("ASSIGN MUSICIANS FIRST"); return; }
    setBandCooking(true);
    showMsg("SETTING THE VIBE...", 4000);

    const results = await Promise.allSettled(
      assignedPads.map(pad => callCook(pad, style, bpm, vibe))
    );

    const newReplies = {};
    setPads(prev => {
      const next = [...prev];
      results.forEach((res, i) => {
        const pad = assignedPads[i];
        const idx = next.findIndex(p => p.id === pad.id);
        if (res.status === "fulfilled" && res.value?.steps?.length === 16) {
          next[idx] = { ...next[idx], steps: res.value.steps };
          newReplies[pad.id] = res.value.reply || "feeling it.";
        }
      });
      return next;
    });

    setAiReplies(prev => ({ ...prev, ...newReplies }));
    setBandCooking(false);

    if (!playing) { engine.start(); setPlaying(true); }
    showMsg(`VIBE SET · ${vibe}`);
  };

  // ── SINGLE PAD REDIRECT ──
  const onPadDown = pad => {
    if (!pad.role) { setRoleSheet(pad); return; }
    if (bandListening || bandCooking) return;
    engine.boot(); engine.wake();
    engine.tone(pad.role.id, pad.id, null);
    flash(pad.id);
    tapBuf.current   = [];
    recStart.current = Date.now();
    setPadListening(pad.id);
  };

  const onPadUp = async pad => {
    if (padListening !== pad.id) return;
    setPadListening(null);
    if (!pad.role) return;

    const taps    = tapBuf.current;
    const elapsed = Date.now() - (recStart.current || Date.now());
    recStart.current = null;

    // Only cook if held for >300ms (intentional)
    if (elapsed < 300) { flash(pad.id); return; }

    const steps        = taps.length > 0 ? engine.tapsToSteps(taps, bpm) : pad.steps;
    const padWithSteps = { ...pad, steps };

    setPadCooking(pad.id);
    try {
      const result = await callCook(padWithSteps, style, bpm, null);
      if (result?.steps?.length === 16) {
        updPad({ ...pad, steps: result.steps });
        setAiReplies(prev => ({ ...prev, [pad.id]: result.reply || "adjusted." }));
      }
    } catch (e) {
      console.warn("Pad cook failed:", e);
    } finally {
      setPadCooking(null);
      flash(pad.id);
    }
  };

  const tapOnPad = (pad, time) => {
    if (padListening === pad.id || bandListening) {
      tapBuf.current.push({ time: Date.now() - (recStart.current || Date.now()) });
    }
  };

  // ── TRANSPORT ──
  const togglePlay = () => {
    if (playing) { engine.stop(); setPlaying(false); setCurrentStep(-1); }
    else         { engine.start(); setPlaying(true); }
  };

  const assignRole = role => {
    setPads(p => p.map(p2 => p2.id === roleSheet.id ? { ...p2, role } : p2));
    setRoleSheet(null);
  };

  // ── STATUS ──
  const lcdStatus = bandCooking ? "◎ COOKING"
    : bandListening ? "◉ LISTENING"
    : playing       ? "▶ PLAYING"
    : "■ STOPPED";

  return (
    <div style={{ minHeight:"100vh",background:`linear-gradient(180deg,${T.surface},${T.body})`,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 12px 90px" }}>

      {/* Header */}
      <div style={{ width:"100%",maxWidth:"480px",marginBottom:"14px",display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:"7px",letterSpacing:"6px",color:T.textLight,fontFamily:"monospace",marginBottom:"2px" }}>AI BAND</div>
          <h1 style={{ margin:0,fontSize:"28px",fontWeight:"900",color:T.text,letterSpacing:"-0.5px",lineHeight:1,textTransform:"uppercase",fontFamily:"'Helvetica Neue',sans-serif" }}>
            CONDUCTOR<span style={{ color:T.accent }}>.</span>
          </h1>
        </div>
        <div style={{ background:T.lcd,border:`1px solid ${T.lcdDark}`,padding:"3px 8px",borderRadius:"3px",fontSize:"8px",color:T.lcdText,fontFamily:"monospace",letterSpacing:"2px",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.12)" }}>v3.0</div>
      </div>

      {/* LCD */}
      <div style={{ width:"100%",maxWidth:"480px",background:T.lcd,border:`1.5px solid ${T.lcdDark}`,borderRadius:"5px",padding:"8px 14px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"inset 0 2px 5px rgba(0,0,0,0.18),0 1px 0 rgba(255,255,255,0.6)" }}>
        <div>
          <div style={{ fontSize:"20px",fontWeight:"bold",color:T.lcdText,fontFamily:"monospace",letterSpacing:"2px",lineHeight:1.1 }}>{String(bpm).padStart(3,"0")} BPM</div>
          <div style={{ fontSize:"9px",color:T.lcdText,letterSpacing:"2px",fontFamily:"monospace",opacity:0.7 }}>
            {lcdMsg || `${style} · ${assignedPads.length} MUSICIANS`}
          </div>
        </div>
        <div style={{ fontSize:"10px",color:bandCooking?"#886600":bandListening?T.accent:playing?T.green:T.lcdText,fontFamily:"monospace",letterSpacing:"1px",animation:bandListening||bandCooking?"blink 0.6s infinite":"" }}>
          {lcdStatus}
        </div>
      </div>

      {/* Transport */}
      <div style={{ width:"100%",maxWidth:"480px",display:"flex",gap:"8px",marginBottom:"12px",padding:"10px 12px",background:T.panel,border:`1.5px solid ${T.border}`,borderRadius:"6px",alignItems:"center",boxShadow:`0 2px 4px ${T.shadow},inset 0 1px 0 rgba(255,255,255,0.7)` }}>

        {/* Play/Pause */}
        <button onClick={togglePlay} style={{ width:"42px",height:"42px",borderRadius:"5px",background:playing?T.accent:T.green,border:`2px solid ${playing?T.accentDark:T.greenDark}`,color:"#fff",fontSize:"16px",cursor:"pointer",boxShadow:`0 3px 0 ${playing?T.accentDark:T.greenDark}`,display:"flex",alignItems:"center",justifyContent:"center",transform:playing?"translateY(1px)":"none",transition:"all 0.07s",flexShrink:0 }}>
          {playing ? "■" : "▶"}
        </button>

        {/* BPM */}
        <div style={{ display:"flex",alignItems:"center",gap:"4px",flexShrink:0 }}>
          <button onClick={() => setBpm(b => Math.max(60, b-5))} style={hwBtn}>−</button>
          <div style={{ background:T.lcd,border:`1.5px solid ${T.lcdDark}`,padding:"4px 8px",borderRadius:"3px",fontSize:"16px",fontWeight:"bold",color:T.lcdText,fontFamily:"monospace",minWidth:"46px",textAlign:"center",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.15)" }}>{bpm}</div>
          <button onClick={() => setBpm(b => Math.min(220, b+5))} style={hwBtn}>+</button>
        </div>

        {/* Style */}
        <select value={style} onChange={e => setStyle(e.target.value)} style={{ background:T.panel,border:`1px solid ${T.borderDark}`,borderRadius:"3px",padding:"5px 6px",fontSize:"9px",color:T.text,fontFamily:"monospace",letterSpacing:"1px",cursor:"pointer",flexShrink:0 }}>
          {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{ flex:1 }} />

        {/* EVERYBODY IN */}
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",flexShrink:0 }}>
          <button
            onPointerDown={e => { e.preventDefault(); onBandDown(); }}
            onPointerUp={onBandUp}
            onPointerLeave={() => { if (bandListening) onBandUp(); }}
            style={{ width:"52px",height:"42px",borderRadius:"5px",cursor:"pointer",touchAction:"none",WebkitTapHighlightColor:"transparent",outline:"none",background:bandListening?"linear-gradient(135deg,#cc0000,#880000)":bandCooking?"#332200":T.panelDeep,border:`2px solid ${bandListening?T.accent:bandCooking?"#885500":T.borderDark}`,boxShadow:bandListening?`0 0 20px rgba(204,0,0,0.5),inset 0 2px 3px rgba(0,0,0,0.3)`:bandCooking?"none":`0 3px 0 ${T.borderDark},inset 0 1px 0 rgba(255,255,255,0.5)`,transform:bandListening?"translateY(1px)":"none",transition:"all 0.08s",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"2px" }}>
            <div style={{ fontSize:bandListening?"16px":"12px",color:bandListening?"#fff":bandCooking?"#885500":T.textMid,animation:bandListening?"breathe 0.5s infinite":bandCooking?"spin 1.5s linear infinite":"",transition:"font-size 0.1s" }}>
              {bandListening ? "◉" : bandCooking ? "◎" : "●"}
            </div>
          </button>
          <div style={{ fontSize:"6px",color:bandListening?T.accent:bandCooking?"#885500":T.textLight,letterSpacing:"1px",fontFamily:"monospace",textAlign:"center" }}>
            {bandListening ? "LISTEN" : bandCooking ? "COOK" : "ALL IN"}
          </div>
        </div>

        {/* Vibe */}
        <button onClick={() => setShowVibe(true)} title="Set a vibe" style={{ width:"42px",height:"42px",borderRadius:"5px",flexShrink:0,background:T.panelDeep,border:`1.5px solid ${T.borderDark}`,color:T.textMid,fontSize:"14px",cursor:"pointer",boxShadow:`0 3px 0 ${T.borderDark},inset 0 1px 0 rgba(255,255,255,0.5)` }}>✦</button>
      </div>

      {/* Step strip */}
      {playing && (
        <div style={{ width:"100%",maxWidth:"480px",display:"flex",gap:"2px",marginBottom:"8px",height:"4px" }}>
          {Array.from({length:16}).map((_, i) => (
            <div key={i} style={{ flex:1,borderRadius:"2px",background:currentStep===i?T.accent:i%4===0?"#aaa":"#ccc",boxShadow:currentStep===i?`0 0 4px ${T.accent}`:""}} />
          ))}
        </div>
      )}

      {/* 4×4 PAD GRID */}
      {view === "pads" && (
        <>
          <div style={{ width:"100%",maxWidth:"480px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px",padding:"13px",background:"#c0bbb2",borderRadius:"10px",border:`2px solid ${T.borderDark}`,boxShadow:`inset 0 3px 10px rgba(0,0,0,0.22),0 2px 6px ${T.shadow}`,marginBottom:"12px" }}>
            {pads.map(pad => {
              const isRedir  = padListening === pad.id;
              const isCook   = padCooking   === pad.id;
              const isActive = activePads[pad.id];
              const isPlay   = playing && pad.role && !channels[pad.id]?.muted;
              const col      = pad.role?.color || "#888";

              return (
                <button
                  key={pad.id}
                  onPointerDown={e => { e.preventDefault(); onPadDown(pad); }}
                  onPointerUp={() => onPadUp(pad)}
                  onPointerLeave={() => { if (padListening === pad.id) onPadUp(pad); }}
                  style={{ width:"100%",aspectRatio:"1",border:`2px solid ${isRedir||isActive?col:T.padBorder}`,borderRadius:"5px",cursor:"pointer",touchAction:"none",WebkitTapHighlightColor:"transparent",outline:"none",position:"relative",overflow:"hidden",background:pad.role?(isActive?col:isRedir?`repeating-linear-gradient(45deg,${T.padFace},${T.padFace} 4px,${col}33 4px,${col}33 8px)`:T.padFace):"#ccc9c0",boxShadow:isActive?`inset 0 3px 5px rgba(0,0,0,0.35),0 0 0 2px ${col}`:isPlay?`0 4px 0 ${T.padSide},0 0 0 1px ${col}55`:`0 4px 0 ${T.padSide},inset 0 1px 0 rgba(255,255,255,0.55)`,transform:isActive?"translateY(3px)":"translateY(0)",transition:"all 0.06s ease",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",minHeight:"66px" }}
                >
                  <div style={{ position:"absolute",top:"4px",left:"5px",fontSize:"7px",color:isActive?"rgba(255,255,255,0.5)":T.textLight,fontFamily:"monospace" }}>{parseInt(pad.id)+1}</div>

                  {isPlay && !isActive && (
                    <div style={{ position:"absolute",top:"5px",right:"5px",width:"5px",height:"5px",borderRadius:"50%",background:col,animation:"livePulse 1.2s infinite",boxShadow:`0 0 4px ${col}` }} />
                  )}
                  {isCook && (
                    <div style={{ position:"absolute",inset:0,background:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",animation:"spin 1s linear infinite",color:T.textMid }}>◎</div>
                  )}
                  {isRedir && (
                    <div style={{ position:"absolute",top:"5px",right:"5px",width:"6px",height:"6px",borderRadius:"50%",background:T.accent,animation:"recPulse 0.4s infinite" }} />
                  )}

                  <div style={{ fontSize:pad.role?"9px":"8px",fontWeight:"700",color:isActive?"#fff":pad.role?col:T.textLight,letterSpacing:"0.5px",textTransform:"uppercase",fontFamily:"'Helvetica Neue',sans-serif",textAlign:"center",padding:"0 4px",transition:"color 0.06s",lineHeight:1.2 }}>
                    {pad.role ? pad.role.label : "+ ASSIGN"}
                  </div>

                  {pad.role && (
                    <div style={{ display:"flex",gap:"1px" }}>
                      {(pad.steps || []).map((s, i) => (
                        <div key={i} style={{ width:"2.5px",height:"2.5px",borderRadius:"50%",background:s?(isActive?"rgba(255,255,255,0.9)":col):"rgba(0,0,0,0.1)" }} />
                      ))}
                    </div>
                  )}

                  {aiReplies[pad.id] && !isActive && (
                    <div style={{ position:"absolute",bottom:"3px",left:0,right:0,fontSize:"6px",color:col,textAlign:"center",fontStyle:"italic",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 4px",opacity:0.75 }}>
                      "{aiReplies[pad.id]}"
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mixer button */}
          <button onClick={() => setMixerOpen(true)} style={{ padding:"8px 28px",background:T.panel,border:`1.5px solid ${T.borderDark}`,borderRadius:"20px",color:T.textMid,fontSize:"9px",letterSpacing:"3px",cursor:"pointer",fontFamily:"monospace",textTransform:"uppercase",boxShadow:`0 3px 0 ${T.borderDark},inset 0 1px 0 rgba(255,255,255,0.6)`,display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px" }}>
            <span style={{ fontSize:"11px",opacity:0.5 }}>⊙ ⊙ ⊙</span> MIXER
          </button>

          <div style={{ textAlign:"center",fontSize:"8px",color:T.textLight,letterSpacing:"2px",fontFamily:"monospace" }}>
            HOLD A PAD TO REDIRECT · HOLD ALL IN TO SET THE BAND
          </div>
        </>
      )}

      {view === "learn" && (
        <LearnView pads={pads} onUpdatePad={updPad} />
      )}

      {/* Overlays */}
      {roleSheet && <RolePicker pad={roleSheet} onAssign={assignRole} onClose={() => setRoleSheet(null)} />}
      {mixerOpen && (
        <MixerOverlay
          pads={pads} channels={channels} panVals={panVals} playing={playing}
          onUpdCh={updCh} onUpdPan={(id, v) => setPanVals(p => ({...p,[id]:v}))}
          onClose={() => setMixerOpen(false)}
        />
      )}
      {showVibe && <VibeSheet onSubmit={onVibeSubmit} onClose={() => setShowVibe(false)} />}

      {/* Bottom nav */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:T.body,borderTop:`2px solid ${T.borderDark}`,display:"flex",justifyContent:"center",boxShadow:"0 -2px 10px rgba(0,0,0,0.12)",zIndex:40 }}>
        <div style={{ width:"100%",maxWidth:"480px",display:"flex" }}>
          {[{id:"pads",label:"PADS"},{id:"learn",label:"LEARN"}].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{ flex:1,padding:"14px 8px",background:"transparent",border:"none",borderTop:`3px solid ${view===tab.id?T.accent:"transparent"}`,color:view===tab.id?T.accent:T.textLight,fontSize:"9px",letterSpacing:"3px",cursor:"pointer",fontFamily:"monospace",textTransform:"uppercase",transition:"all 0.1s" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes recPulse   { 0%,100%{opacity:1} 50%{opacity:0.1} }
        @keyframes livePulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes breathe    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        * { -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        select { -webkit-appearance:none; }
      `}</style>
    </div>
  );
}
