import { useState } from "react";
import { T } from "../constants.js";

export default function LearnView({ pads, onUpdatePad }) {
  const [learnPad, setLearnPad] = useState(null);
  const [tagInput, setTagInput] = useState("");

  const assignedPads = pads.filter(p => p.role);

  const addTag = tag => {
    if (!tag.trim() || !learnPad) return;
    const updated = { ...learnPad, tags: [...(learnPad.tags || []), tag.trim()] };
    setLearnPad(updated);
    onUpdatePad(updated);
    setTagInput("");
  };

  const removeTag = i => {
    const updated = { ...learnPad, tags: learnPad.tags.filter((_, j) => j !== i) };
    setLearnPad(updated);
    onUpdatePad(updated);
  };

  const updateDirection = dir => {
    const updated = { ...learnPad, direction: dir };
    setLearnPad(updated);
    onUpdatePad(updated);
  };

  return (
    <div style={{ width:"100%",maxWidth:"480px" }}>
      <div style={{ fontSize:"9px",letterSpacing:"4px",color:T.textMid,marginBottom:"14px",fontFamily:"monospace" }}>LEARN MODE</div>

      {/* Musician selector */}
      <div style={{ display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"16px" }}>
        {assignedPads.length === 0
          ? <p style={{ fontSize:"11px",color:T.textLight,fontFamily:"monospace" }}>Go to PADS tab and assign roles first.</p>
          : assignedPads.map(pad => (
            <button key={pad.id} onClick={() => setLearnPad(pad)} style={{ padding:"6px 12px",background:learnPad?.id===pad.id?pad.role.color:T.panel,border:`1.5px solid ${learnPad?.id===pad.id?pad.role.color:T.border}`,borderRadius:"4px",color:learnPad?.id===pad.id?"#fff":T.textMid,fontSize:"9px",letterSpacing:"1px",textTransform:"uppercase",fontFamily:"monospace",cursor:"pointer" }}>
              {pad.role.label}
            </button>
          ))
        }
      </div>

      {learnPad && (
        <>
          {/* Musician card */}
          <div style={{ background:T.white,border:`1.5px solid ${learnPad.role.color}`,borderRadius:"10px",padding:"14px",marginBottom:"12px",boxShadow:"0 2px 6px rgba(0,0,0,0.1)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px" }}>
              <div style={{ width:"10px",height:"10px",borderRadius:"50%",background:learnPad.role.color }} />
              <div style={{ fontSize:"14px",fontWeight:"900",color:learnPad.role.color,letterSpacing:"1px",textTransform:"uppercase",fontFamily:"'Helvetica Neue',sans-serif" }}>
                {learnPad.role.label}
              </div>
              <div style={{ fontSize:"8px",color:T.textLight,fontFamily:"monospace",marginLeft:"auto" }}>PAD {parseInt(learnPad.id)+1}</div>
            </div>

            {/* Style tags */}
            <div style={{ marginBottom:"16px" }}>
              <div style={{ fontSize:"8px",color:T.textMid,letterSpacing:"3px",fontFamily:"monospace",marginBottom:"8px" }}>STYLE TAGS</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"8px",minHeight:"28px" }}>
                {(learnPad.tags || []).length === 0
                  ? <span style={{ fontSize:"9px",color:T.textLight,fontFamily:"monospace" }}>No tags yet</span>
                  : (learnPad.tags || []).map((tag, i) => (
                    <div key={i} style={{ padding:"4px 10px",background:T.surface,border:`1px solid ${learnPad.role.color}`,borderRadius:"20px",fontSize:"9px",color:learnPad.role.color,display:"flex",alignItems:"center",gap:"6px",fontFamily:"monospace" }}>
                      {tag}
                      <span onClick={() => removeTag(i)} style={{ cursor:"pointer",opacity:0.5,fontSize:"11px" }}>×</span>
                    </div>
                  ))
                }
              </div>
              <div style={{ display:"flex",gap:"6px" }}>
                <input
                  value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addTag(tagInput); }}
                  placeholder={`e.g. "Nile Rogers choppy" · "Jaco slap"`}
                  style={{ flex:1,background:T.body,border:`1px solid ${T.border}`,borderRadius:"4px",padding:"8px 10px",color:T.text,fontSize:"10px",fontFamily:"monospace",outline:"none" }}
                />
                <button onClick={() => addTag(tagInput)} style={{ padding:"8px 14px",background:T.panel,border:`1.5px solid ${T.borderDark}`,borderRadius:"4px",color:T.text,fontSize:"9px",cursor:"pointer",fontFamily:"monospace",boxShadow:"0 2px 0 rgba(0,0,0,0.12)" }}>ADD</button>
              </div>
              <div style={{ fontSize:"7px",color:T.textLight,fontFamily:"monospace",marginTop:"5px" }}>
                Tags shape how this musician interprets your input
              </div>
            </div>

            {/* Standing direction */}
            <div>
              <div style={{ fontSize:"8px",color:T.textMid,letterSpacing:"3px",fontFamily:"monospace",marginBottom:"8px" }}>STANDING DIRECTION</div>
              <textarea
                value={learnPad.direction || ""}
                onChange={e => updateDirection(e.target.value)}
                placeholder={`Always play behind the beat · Lead with melody · Keep it sparse`}
                style={{ width:"100%",background:T.body,border:`1px solid ${T.border}`,borderRadius:"4px",padding:"10px",color:T.text,fontSize:"10px",fontFamily:"monospace",outline:"none",resize:"none",minHeight:"70px",lineHeight:1.5,boxSizing:"border-box" }}
              />
              <div style={{ fontSize:"7px",color:T.textLight,fontFamily:"monospace",marginTop:"5px" }}>
                This musician reads this before every performance
              </div>
            </div>
          </div>

          {/* Sample upload */}
          <div style={{ background:T.surface,border:`1.5px dashed ${T.border}`,borderRadius:"10px",padding:"24px",textAlign:"center" }}>
            <div style={{ fontSize:"28px",marginBottom:"8px",opacity:0.25 }}>♪</div>
            <div style={{ fontSize:"9px",color:T.textLight,letterSpacing:"3px",fontFamily:"monospace",marginBottom:"4px" }}>AUDIO SAMPLES</div>
            <div style={{ fontSize:"10px",color:T.textLight,fontFamily:"monospace",marginBottom:"14px" }}>
              Upload clips to teach {learnPad.role.label} your influences
            </div>
            <button style={{ padding:"8px 20px",background:T.panel,border:`1.5px solid ${T.borderDark}`,borderRadius:"5px",color:T.textMid,fontSize:"9px",letterSpacing:"2px",cursor:"pointer",fontFamily:"monospace",boxShadow:"0 2px 0 rgba(0,0,0,0.12)" }}>
              UPLOAD AUDIO · PHASE 3
            </button>
          </div>
        </>
      )}
    </div>
  );
}
