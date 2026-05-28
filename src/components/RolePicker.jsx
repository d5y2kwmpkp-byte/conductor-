import { ROLES, T } from "../constants.js";

export default function RolePicker({ pad, onAssign, onClose }) {
  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width:"100%",maxWidth:"480px",background:T.surface,borderRadius:"16px 16px 0 0",border:`1.5px solid ${T.border}`,borderBottom:"none",padding:"16px 14px 32px",maxHeight:"72vh",overflowY:"auto",boxShadow:"0 -4px 24px rgba(0,0,0,0.18)" }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:"14px" }}>
          <div style={{ width:"36px",height:"4px",borderRadius:"2px",background:T.border }} />
        </div>
        <div style={{ fontSize:"9px",letterSpacing:"4px",color:T.textMid,marginBottom:"14px",fontFamily:"monospace" }}>
          ASSIGN ROLE — PAD {pad ? parseInt(pad.id) + 1 : ""}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px" }}>
          {ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => onAssign(role)}
              style={{ padding:"11px 10px",background:T.white,border:`1.5px solid ${T.border}`,borderRadius:"5px",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",boxShadow:`0 2px 0 rgba(0,0,0,0.12)`,textAlign:"left" }}
            >
              <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:role.color,flexShrink:0 }} />
              <span style={{ fontSize:"10px",color:role.color,fontWeight:"700",fontFamily:"'Helvetica Neue',sans-serif",letterSpacing:"0.5px",textTransform:"uppercase" }}>
                {role.label}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ width:"100%",marginTop:"12px",padding:"12px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:"5px",color:T.textLight,fontSize:"9px",letterSpacing:"2px",cursor:"pointer",fontFamily:"monospace" }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
