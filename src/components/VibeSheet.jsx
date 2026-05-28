import { useState } from "react";
import { T, QUICK_VIBES } from "../constants.js";

export default function VibeSheet({ onSubmit, onClose }) {
  const [input, setInput] = useState("");

  const submit = () => {
    if (!input.trim()) return;
    onSubmit(input.trim());
    onClose();
  };

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width:"100%",maxWidth:"480px",background:T.surface,borderRadius:"16px 16px 0 0",border:`1.5px solid ${T.border}`,borderBottom:"none",padding:"16px 14px 32px",boxShadow:"0 -4px 24px rgba(0,0,0,0.18)" }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:"14px" }}>
          <div style={{ width:"36px",height:"4px",borderRadius:"2px",background:T.border }} />
        </div>
        <div style={{ fontSize:"9px",letterSpacing:"4px",color:T.textMid,marginBottom:"4px",fontFamily:"monospace" }}>SET THE VIBE</div>
        <div style={{ fontSize:"11px",color:T.textLight,marginBottom:"16px",fontFamily:"monospace" }}>tell the band what to play</div>

        <div style={{ display:"flex",gap:"8px",marginBottom:"14px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
            placeholder='"take me to the beach" · "late night jazz"'
            autoFocus
            style={{ flex:1,background:T.white,border:`1.5px solid ${T.border}`,borderRadius:"5px",padding:"12px",color:T.text,fontSize:"12px",fontFamily:"monospace",outline:"none" }}
          />
          <button
            onClick={submit}
            style={{ padding:"12px 18px",background:T.accent,border:`2px solid ${T.accentDark}`,borderRadius:"5px",color:"#fff",fontSize:"14px",cursor:"pointer",fontFamily:"monospace",boxShadow:`0 3px 0 ${T.accentDark}` }}
          >GO</button>
        </div>

        <div style={{ display:"flex",flexWrap:"wrap",gap:"6px" }}>
          {QUICK_VIBES.map(v => (
            <button
              key={v}
              onClick={() => setInput(v)}
              style={{ padding:"5px 12px",background:T.panel,border:`1px solid ${T.border}`,borderRadius:"20px",color:T.textMid,fontSize:"9px",cursor:"pointer",fontFamily:"monospace",letterSpacing:"1px" }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
