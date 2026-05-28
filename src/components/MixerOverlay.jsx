import { useState } from "react";
import Knob from "./Knob.jsx";
import { Y, T } from "../constants.js";

const FADER_H = 200;
const STRIP_W = 160;

function FaderStrip({ pad, idx, ch, pan, playing, onUpdCh, onUpdPan }) {
  const col     = pad.role?.color || Y.textDim;
  const isEmpty = !pad.role;

  return (
    <div style={{ width:`${STRIP_W}px`,minWidth:`${STRIP_W}px`,flexShrink:0,scrollSnapAlign:"start",background:isEmpty?Y.body:Y.bodyLight,borderRight:`1px solid ${Y.border}`,overflowY:"auto",overflowX:"hidden",scrollbarWidth:"none" }}>
      <div style={{ minHeight:"820px",display:"flex",flexDirection:"column" }}>

        {/* Label tape */}
        <div style={{ background:isEmpty?"#b0aca4":Y.labelTape,borderBottom:`3px solid ${isEmpty?"#777":col}`,padding:"8px 10px 7px",flexShrink:0,position:"sticky",top:0,zIndex:10 }}>
          <div style={{ fontSize:"7px",color:"#888",fontFamily:"monospace",marginBottom:"1px" }}>CH {String(idx+1).padStart(2,"0")}</div>
          <div style={{ fontSize:"11px",fontWeight:"900",letterSpacing:"0.5px",textTransform:"uppercase",color:isEmpty?"#888":Y.labelText,fontFamily:"'Helvetica Neue',sans-serif",lineHeight:1.1 }}>
            {isEmpty ? "EMPTY" : pad.role.label}
          </div>
          {!isEmpty && <div style={{ marginTop:"5px",height:"3px",background:`linear-gradient(90deg,${col},transparent)`,borderRadius:"2px" }} />}
        </div>

        {/* Gain */}
        <Section label="GAIN" bg={Y.rail}>
          <Knob value={0.7} min={0} max={1} size={46} color={isEmpty?"#555":col} onChange={()=>{}} />
          <Dim>+10dB</Dim>
        </Section>

        {/* EQ */}
        <div style={{ background:Y.railLight,borderBottom:`1px solid ${Y.sectionLine}`,padding:"12px 10px",flexShrink:0 }}>
          <SLabel>EQ</SLabel>
          {[
            { l:"HI",     c:"#8ab4cc", v:ch.hi,  k:"hi",  dB:true  },
            { l:"HI-MID", c:"#aaccaa", v:0.5,    k:null,  dB:false },
            { l:"LO-MID", c:"#ccaa88", v:ch.mid, k:"mid", dB:true  },
            { l:"LOW",    c:"#cc9999", v:ch.lo,  k:"lo",  dB:true  },
          ].map((eq, i) => (
            <div key={i} style={{ marginBottom: i < 3 ? "14px" : 0 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"5px" }}>
                <span style={{ fontSize:"7px",color:eq.c,letterSpacing:"1px",fontFamily:"monospace" }}>{eq.l}</span>
                {eq.dB && <span style={{ fontSize:"7px",color:Y.textDim,fontFamily:"monospace" }}>{eq.v >= 0 ? "+" : ""}{Math.round(eq.v * 14)}dB</span>}
              </div>
              <div style={{ display:"flex",justifyContent:"center" }}>
                <Knob value={eq.v} min={eq.dB?-1:0} max={1} centerZero={eq.dB} size={50} color={isEmpty?"#555":eq.c}
                  onChange={eq.k ? v => onUpdCh(eq.k, v) : () => {}} />
              </div>
            </div>
          ))}
        </div>

        {/* Aux */}
        <Section label="AUX" bg={Y.rail}>
          <Knob value={0.35} min={0} max={1} size={42} color={isEmpty?"#555":"#cc88cc"} onChange={()=>{}} />
        </Section>

        {/* Pan */}
        <Section label="PAN" bg={Y.railLight}>
          <div style={{ display:"flex",justifyContent:"space-between",width:"100%",marginBottom:"5px" }}>
            <Dim>L</Dim>
            <Dim>{pan < 0.45 ? `L${Math.round((0.5-pan)*200)}` : pan > 0.55 ? `R${Math.round((pan-0.5)*200)}` : "CTR"}</Dim>
            <Dim>R</Dim>
          </div>
          <Knob value={pan} min={0} max={1} centerZero size={50} color={isEmpty?"#555":"#d4a017"} onChange={onUpdPan} />
        </Section>

        {/* Mute / Solo */}
        <div style={{ background:Y.rail,borderBottom:`1px solid ${Y.sectionLine}`,padding:"10px",display:"flex",gap:"6px",flexShrink:0 }}>
          <button disabled={isEmpty} onClick={() => onUpdCh("muted", !ch.muted)} style={{ flex:1,padding:"10px 4px",borderRadius:"4px",background:ch.muted?Y.muteRed:"#252729",border:`1px solid ${ch.muted?"#991111":"#3a3c3e"}`,color:ch.muted?"#fff":"#666",fontSize:"9px",letterSpacing:"1px",fontFamily:"monospace",cursor:isEmpty?"default":"pointer",boxShadow:ch.muted?"inset 0 2px 4px rgba(0,0,0,0.4)":"0 2px 0 #111",transform:ch.muted?"translateY(1px)":"none",transition:"all 0.08s" }}>MUTE</button>
          <button disabled={isEmpty} style={{ flex:1,padding:"10px 4px",borderRadius:"4px",background:"#252729",border:"1px solid #3a3c3e",color:"#666",fontSize:"9px",letterSpacing:"1px",fontFamily:"monospace",cursor:isEmpty?"default":"pointer",boxShadow:"0 2px 0 #111" }}>SOLO</button>
        </div>

        {/* Fader + VU */}
        <div style={{ background:Y.body,padding:"16px 10px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:"10px",flex:1 }}>
          <SLabel>LEVEL</SLabel>
          <div style={{ display:"flex",gap:"14px",alignItems:"flex-start",height:`${FADER_H+24}px` }}>

            {/* VU */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"3px" }}>
              <Dim>VU</Dim>
              <div style={{ width:"14px",height:`${FADER_H}px`,background:Y.faderTrack,border:"1px solid #333",borderRadius:"2px",overflow:"hidden",display:"flex",flexDirection:"column-reverse",gap:"1px",padding:"2px" }}>
                {Array.from({length:20}).map((_, i) => {
                  const lit = !isEmpty && !ch.muted && playing && (i/20) < ch.vol;
                  return <div key={i} style={{ flex:1,borderRadius:"1px",background:lit?(i>=17?Y.vuRed:i>=13?Y.vuYellow:Y.vuGreen):Y.vuOff,transition:"background 0.08s" }} />;
                })}
              </div>
            </div>

            {/* Fader */}
            <div style={{ position:"relative",width:"36px",height:`${FADER_H}px` }}>
              <div style={{ position:"absolute",left:"50%",transform:"translateX(-50%)",top:"10px",width:"5px",height:`${FADER_H-20}px`,background:Y.faderTrack,border:"1px solid #333",borderRadius:"3px" }} />
              {[{v:1,l:"+10"},{v:0.83,l:"+5"},{v:0.67,l:"0"},{v:0.5,l:"-5"},{v:0.33,l:"-10"},{v:0,l:"∞"}].map(({v,l},i)=>(
                <div key={i} style={{ position:"absolute",top:`${10+(1-v)*(FADER_H-20)}px`,left:"22px",display:"flex",alignItems:"center",gap:"2px" }}>
                  <div style={{ width:"5px",height:"1px",background:Y.tickMark }} />
                  <span style={{ fontSize:"6px",color:Y.textDim,fontFamily:"monospace" }}>{l}</span>
                </div>
              ))}
              <div
                style={{ position:"absolute",top:`${10+(1-ch.vol)*(FADER_H-20)-14}px`,left:"0",width:"36px",height:"28px",background:"linear-gradient(180deg,#d8d4cc,#c0bcb4 40%,#a8a49c)",borderRadius:"4px",border:`1px solid ${isEmpty?"#555":"#999"}`,cursor:isEmpty?"default":"ns-resize",boxShadow:"0 3px 6px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.25)",zIndex:2,touchAction:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px" }}
                onPointerDown={isEmpty ? undefined : e => {
                  e.preventDefault();
                  const sy = e.clientY, sv = ch.vol, travel = FADER_H - 20;
                  const move = ev => onUpdCh("vol", Math.min(1, Math.max(0, sv - (ev.clientY - sy) / travel)));
                  const up   = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", up);
                }}
              >
                {[0,1,2,3,4].map(i => <div key={i} style={{ width:"22px",height:"1px",background:"rgba(0,0,0,0.18)",borderRadius:"1px" }} />)}
                <div style={{ position:"absolute",top:"50%",left:"4px",right:"4px",height:"2px",background:isEmpty?"#666":col,borderRadius:"1px",opacity:0.8,marginTop:"-1px" }} />
              </div>
            </div>
          </div>

          <div style={{ background:Y.faderTrack,border:"1px solid #333",borderRadius:"3px",padding:"3px 10px",fontSize:"10px",color:ch.muted?"#555":Y.vuGreen,fontFamily:"monospace",letterSpacing:"1px" }}>
            {ch.muted || ch.vol === 0 ? "—∞ dB" : ch.vol >= 0.67 ? `+${Math.round((ch.vol-0.67)*30)}dB` : `${Math.round((ch.vol-0.67)*30)}dB`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MixerOverlay({ pads, channels, panVals, playing, onUpdCh, onUpdPan, onClose }) {
  const [scrollPos, setScrollPos] = useState(0);
  const onScroll = e => { const el = e.target, max = el.scrollWidth - el.clientWidth; setScrollPos(max > 0 ? el.scrollLeft / max : 0); };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:"480px",height:"88vh",background:Y.body,borderRadius:"16px 16px 0 0",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 -12px 60px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ background:Y.rail,borderBottom:`2px solid ${Y.sectionLine}`,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            <div style={{ width:"36px",height:"3px",borderRadius:"2px",background:"#444" }} />
            <div>
              <div style={{ fontSize:"7px",color:"#444",letterSpacing:"3px",fontFamily:"monospace" }}>YAMAHA STYLE</div>
              <div style={{ fontSize:"10px",color:Y.text,letterSpacing:"3px",fontFamily:"monospace",fontWeight:"bold" }}>MIXER</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:"28px",height:"28px",borderRadius:"50%",background:"#333",border:"1px solid #444",color:"#888",fontSize:"18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>

        {/* Strips */}
        <div onScroll={onScroll} style={{ display:"flex",overflowX:"auto",overflowY:"hidden",flex:1,scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",minHeight:0 }}>
          {pads.map((pad, idx) => (
            <FaderStrip
              key={pad.id} pad={pad} idx={idx}
              ch={channels[pad.id]} pan={panVals[pad.id]} playing={playing}
              onUpdCh={(k, v) => onUpdCh(pad.id, k, v)}
              onUpdPan={v => onUpdPan(pad.id, v)}
            />
          ))}
        </div>

        {/* Dots */}
        <div style={{ background:Y.rail,borderTop:`1px solid ${Y.sectionLine}`,padding:"8px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
          <span style={{ fontSize:"7px",color:"#444",fontFamily:"monospace",letterSpacing:"2px" }}>← SWIPE FOR ALL 16 CHANNELS →</span>
          <div style={{ display:"flex",gap:"4px" }}>
            {Array.from({length:8}).map((_, i) => (
              <div key={i} style={{ width:i===Math.round(scrollPos*7)?"16px":"5px",height:"5px",borderRadius:"3px",background:i===Math.round(scrollPos*7)?"#4a9fd4":"#333",transition:"all 0.2s" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, bg, children }) {
  return (
    <div style={{ background:bg,borderBottom:`1px solid ${Y.sectionLine}`,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",flexShrink:0 }}>
      <SLabel>{label}</SLabel>
      {children}
    </div>
  );
}
function SLabel({ children }) { return <div style={{ fontSize:"7px",color:Y.textDim,letterSpacing:"3px",fontFamily:"monospace",alignSelf:"flex-start" }}>{children}</div>; }
function Dim({ children })   { return <span style={{ fontSize:"7px",color:Y.textDim,fontFamily:"monospace" }}>{children}</span>; }
