'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DartResult = 'bullseye' | 'inner' | 'outer' | 'miss';

export interface ScoreInfo {
  result:      DartResult;
  xp:          number;
  label:       string;
  sectorValue: number;
  multiplier:  number;
}

export interface DartThrowProps {
  onResult?:       (score: ScoreInfo) => void;
  difficulty?:     1 | 2 | 3 | 4 | 5;
  autoThrow?:      boolean;
  autoThrowDelay?: number;
  loop?:           boolean;
}

// ── Difficulty configs ────────────────────────────────────────────────────────

interface DiffConfig {
  name:         string;
  emoji:        string;
  maxDrag:      number;   // max pull distance px — smaller = more sensitive
  sensitivity:  number;   // aim multiplier — higher = more board coverage per px
  wobbleAmp:    number;   // hand shake amplitude px
  wobbleSpeed:  number;   // hand shake radians/frame
  handSway:     boolean;  // slow lateral drift while holding
  windGusts:    boolean;  // random aim displacement during flight
  minPower:     number;   // min pull for valid throw
}

const DIFF: Record<1|2|3|4|5, DiffConfig> = {
  1: { name:'Rookie',   emoji:'🟢', maxDrag:56, sensitivity:1.0, wobbleAmp:2,  wobbleSpeed:0.06, handSway:false, windGusts:false, minPower:16 },
  2: { name:'Explorer', emoji:'🟡', maxDrag:44, sensitivity:1.4, wobbleAmp:5,  wobbleSpeed:0.10, handSway:false, windGusts:false, minPower:14 },
  3: { name:'Champion', emoji:'🟠', maxDrag:34, sensitivity:1.8, wobbleAmp:8,  wobbleSpeed:0.14, handSway:true,  windGusts:false, minPower:12 },
  4: { name:'Legend',   emoji:'🔴', maxDrag:26, sensitivity:2.3, wobbleAmp:11, wobbleSpeed:0.18, handSway:true,  windGusts:true,  minPower:10 },
  5: { name:'Master',   emoji:'💀', maxDrag:20, sensitivity:2.8, wobbleAmp:15, wobbleSpeed:0.23, handSway:true,  windGusts:true,  minPower:8  },
};

// ── Canvas config ─────────────────────────────────────────────────────────────

const W = 380; const H = 340;
const BOARD_CX = 190; const BOARD_CY = 128; const BOARD_R = 84;
const DART_HOME = { x: 190, y: 292 };
const THROW_FRAMES = 28; const ARC_LIFT = 48;

const R_BS=5, R_BULL=11, R_OB=22, R_TI=32, R_TO=46, R_IS=BOARD_R-14, R_DB=BOARD_R;
const SECTORS=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

const ZONE_COLORS: Record<DartResult,string> = {
  bullseye:'#58cc02', inner:'#1cb0f6', outer:'#cc348d', miss:'#afafaf',
};

// ── Scoring ───────────────────────────────────────────────────────────────────

function polarScore(dx:number, dy:number): ScoreInfo {
  const dist=Math.hypot(dx,dy);
  if (dist<=R_BS)  return {result:'bullseye',xp:50,label:'BULLSEYE!',sectorValue:50,multiplier:1};
  if (dist<=R_BULL) return {result:'bullseye',xp:25,label:'Bull!',sectorValue:25,multiplier:1};
  if (dist>R_DB)   return {result:'miss',xp:0,label:'Miss!',sectorValue:0,multiplier:1};
  const ang=(Math.atan2(dy,dx)+Math.PI/2+Math.PI*2)%(Math.PI*2);
  const sa=(Math.PI*2)/20;
  const si=Math.floor(((ang+sa/2)%(Math.PI*2))/sa)%20;
  const sv=SECTORS[si];
  if (dist<=R_OB) return {result:'inner',xp:sv,label:String(sv),sectorValue:sv,multiplier:1};
  if (dist<=R_TI) return {result:'inner',xp:sv,label:String(sv),sectorValue:sv,multiplier:1};
  if (dist<=R_TO) return {result:'inner',xp:sv*3,label:`T${sv}!`,sectorValue:sv,multiplier:3};
  if (dist<=R_IS) return {result:'outer',xp:sv,label:String(sv),sectorValue:sv,multiplier:1};
  return             {result:'outer',xp:sv*2,label:`D${sv}!`,sectorValue:sv,multiplier:2};
}

// ── Audio ─────────────────────────────────────────────────────────────────────

function playImpact(score:ScoreInfo) {
  try {
    const AC=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
    const ctx=new AC();
    const base=score.result==='bullseye'?200:score.result==='inner'?130:score.result==='outer'?90:60;
    const j=(Math.random()-0.5)*18;
    const osc=ctx.createOscillator(); const g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.setValueAtTime(base+j,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime((base+j)*0.35,ctx.currentTime+0.18);
    g.gain.setValueAtTime(0.28,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.25);
    osc.start(); osc.stop(ctx.currentTime+0.28);
    if (score.result==='bullseye'||score.multiplier>=3) {
      const freqs=score.result==='bullseye'?[520,660,880,1100]:[660,880,1100];
      freqs.forEach((freq,i)=>{
        const t=ctx.currentTime+0.06+i*0.08;
        const o2=ctx.createOscillator(); const g2=ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination); o2.type='sine'; o2.frequency.value=freq;
        g2.gain.setValueAtTime(0.1,t); g2.gain.exponentialRampToValueAtTime(0.001,t+0.3);
        o2.start(t); o2.stop(t+0.35);
      });
    }
  } catch { /* blocked */ }
}

function haptic(score:ScoreInfo) {
  if (!('vibrate' in navigator)) return;
  if (score.result==='bullseye') navigator.vibrate([40,25,60]);
  else if (score.multiplier>=2)  navigator.vibrate([30,15,30]);
  else if (score.result!=='miss') navigator.vibrate(20);
  else                            navigator.vibrate(8);
}

// ── Particles ─────────────────────────────────────────────────────────────────

interface Particle{x:number;y:number;vx:number;vy:number;r:number;life:number;color:string;}

function spawnParticles(cx:number,cy:number,color:string,n=16):Particle[]{
  return Array.from({length:n},()=>{
    const a=Math.random()*Math.PI*2,s=2+Math.random()*4.5;
    return{x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,r:1.5+Math.random()*3,life:1,color};
  });
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

function drawBoard(ctx:CanvasRenderingContext2D,ox=0,oy=0){
  ctx.save(); ctx.translate(BOARD_CX+ox,BOARD_CY+oy);
  
  // 3D Shadow
  ctx.beginPath(); ctx.arc(0, 10, BOARD_R+28, 0, Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fill();
  
  // Rim Base (3D Thickness)
  ctx.beginPath(); ctx.arc(0, 8, BOARD_R+28, 0, Math.PI*2); ctx.fillStyle='#5c3a21'; ctx.fill();
  
  // Rim Top
  ctx.beginPath(); ctx.arc(0, 0, BOARD_R+28, 0, Math.PI*2); ctx.fillStyle='#8c5a35'; ctx.fill();
  
  // Inner Board Base
  ctx.beginPath(); ctx.arc(0, 0, BOARD_R, 0, Math.PI*2); ctx.fillStyle='#2a2a2a'; ctx.fill();
  
  const sa=(Math.PI*2)/20,off=-Math.PI/2-sa/2;
  const colW = '#f0ebe0'; // Cream
  const colB = '#2a2a2a'; // Off Black
  const colG = '#58cc02'; // Duo Green
  const colR = '#d32f2f'; // Vibrant Red
  
  SECTORS.forEach((_,i)=>{
    const a0=off+i*sa,a1=a0+sa,ev=i%2===0;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,BOARD_R,a0,a1); ctx.closePath(); ctx.fillStyle=ev?colB:colW; ctx.fill();
    ctx.beginPath(); ctx.arc(0,0,BOARD_R,a0,a1); ctx.arc(0,0,BOARD_R-14,a1,a0,true); ctx.closePath(); ctx.fillStyle=ev?colR:colG; ctx.fill();
    ctx.beginPath(); ctx.arc(0,0,BOARD_R-14,a0,a1); ctx.arc(0,0,R_TO,a1,a0,true); ctx.closePath(); ctx.fillStyle=ev?colB:colW; ctx.fill();
    ctx.beginPath(); ctx.arc(0,0,R_TO,a0,a1); ctx.arc(0,0,R_TI,a1,a0,true); ctx.closePath(); ctx.fillStyle=ev?colR:colG; ctx.fill();
    ctx.beginPath(); ctx.arc(0,0,R_TI,a0,a1); ctx.arc(0,0,R_OB,a1,a0,true); ctx.closePath(); ctx.fillStyle=ev?colB:colW; ctx.fill();
  });
  
  // Thick Wire Lines
  ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1.5; ctx.lineCap='round';
  SECTORS.forEach((_,i)=>{const a=off+i*sa; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*BOARD_R,Math.sin(a)*BOARD_R); ctx.stroke();});
  [BOARD_R,BOARD_R-14,R_TO,R_TI,R_OB,R_BULL,R_BS].forEach(r=>{ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();});
  
  // Outer Bull
  ctx.beginPath(); ctx.arc(0,0,R_OB,0,Math.PI*2); ctx.fillStyle=colG; ctx.fill();
  // Bullseye
  ctx.beginPath(); ctx.arc(0,0,R_BULL,0,Math.PI*2); ctx.fillStyle=colR; ctx.fill();
  
  // Bullseye center dot
  ctx.beginPath(); ctx.arc(0,0,R_BS,0,Math.PI*2); ctx.fillStyle='#ffc700'; ctx.fill();

  // Text for numbers in the rim
  ctx.fillStyle='#f0ebe0'; ctx.font='bold 14px "din-round", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  SECTORS.forEach((n,i)=>{const a=off+i*sa+sa/2; ctx.fillText(String(n),Math.cos(a)*(BOARD_R+14),Math.sin(a)*(BOARD_R+14));});
  
  ctx.restore();
}

function drawFlights(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number,tiltX=0){
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale); ctx.rotate(tiltX*0.016);
  // Dart body back-end 3D
  ctx.beginPath(); ctx.arc(0,4,8,0,Math.PI*2); ctx.fillStyle='#3f8f01'; ctx.fill();
  ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fillStyle='#58cc02'; ctx.fill();
  
  ([ [-Math.PI/4,24,16],[Math.PI/4,24,16],[-Math.PI*3/4,24,16],[Math.PI*3/4,24,16] ] as [number,number,number][]).forEach(([ang,w,h])=>{
    ctx.save(); ctx.rotate(ang);
    // shadow flight
    ctx.beginPath(); ctx.moveTo(0,4); ctx.bezierCurveTo(w*0.4,-h*0.2+4,w,-h*0.5+4,w,-h*0.6+4); ctx.bezierCurveTo(w,-h*0.3+4,w*0.3,h*0.2+4,0,4);
    ctx.fillStyle='#3f8f01'; ctx.fill();
    // top flight
    ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(w*0.4,-h*0.2,w,-h*0.5,w,-h*0.6); ctx.bezierCurveTo(w,-h*0.3,w*0.3,h*0.2,0,0);
    ctx.fillStyle='#58cc02'; ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawDartSide(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number,angle:number,ox=0,oy=0){
  ctx.save(); ctx.translate(x+ox,y+oy); ctx.scale(scale,scale); ctx.rotate(angle);
  // needle
  ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(26,0); ctx.strokeStyle='#afafaf'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.stroke();
  
  // 3D body
  ctx.beginPath(); ctx.roundRect(-18,0,36,8,4); ctx.fillStyle='#3f8f01'; ctx.fill();
  ctx.beginPath(); ctx.roundRect(-18,-4,36,8,4); ctx.fillStyle='#58cc02'; ctx.fill();
  
  // grips
  for(let i=0;i<5;i++){ctx.fillStyle='#3f8f01'; ctx.fillRect(-14+i*6,-4,3,8);}
  
  // shaft
  ctx.beginPath(); ctx.moveTo(-18,0); ctx.lineTo(-32,0); ctx.strokeStyle='#58cc02'; ctx.lineWidth=4; ctx.stroke();
  
  // flights (feathers)
  ctx.beginPath(); ctx.moveTo(-30,0); ctx.lineTo(-44,-10); ctx.lineTo(-38,0); ctx.lineTo(-44,10); ctx.closePath(); ctx.fillStyle='#3f8f01'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-32,-2); ctx.lineTo(-44,-12); ctx.lineTo(-38,-2); ctx.lineTo(-44,8); ctx.closePath(); ctx.fillStyle='#58cc02'; ctx.fill();
  ctx.restore();
}

function drawSlingshot(ctx:CanvasRenderingContext2D,dartX:number,dartY:number,power:number,maxDrag:number){
  const lx=DART_HOME.x-22,rx=DART_HOME.x+22,ay=DART_HOME.y-10;
  const alpha=Math.min(power/maxDrag,1)*0.6+0.2;
  ctx.save(); ctx.strokeStyle=`rgba(28, 176, 246, ${alpha})`; // Sky Blue
  ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(lx,ay); ctx.lineTo(dartX,dartY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rx,ay); ctx.lineTo(dartX,dartY); ctx.stroke();
  ctx.fillStyle=`rgba(28, 176, 246, ${alpha+0.2})`;
  ctx.beginPath(); ctx.arc(lx,ay,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(rx,ay,5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawArcPreview(ctx:CanvasRenderingContext2D,dartX:number,dartY:number,targetX:number,targetY:number,power:number){
  if (power<6) return;
  const alpha=Math.min(power/50,1)*0.4;
  ctx.save(); ctx.setLineDash([8,8]); ctx.strokeStyle=`rgba(204, 52, 141, ${alpha})`; // Bubblegum Pink
  ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(dartX,dartY);
  ctx.bezierCurveTo(dartX+(targetX-dartX)*0.35,dartY+(targetY-dartY)*0.35-ARC_LIFT*1.2,targetX-(targetX-dartX)*0.15,targetY-ARC_LIFT*0.3,targetX,targetY);
  ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}

function drawPowerRing(ctx:CanvasRenderingContext2D,x:number,y:number,power:number,maxDrag:number){
  if (power<4) return;
  const t=Math.min(power/maxDrag,1);
  const col=t>0.7?'#cc348d':t>0.4?'#ffc700':'#1cb0f6';
  ctx.save();
  ctx.beginPath(); ctx.arc(x,y,28,0,Math.PI*2); ctx.strokeStyle=col+'44'; ctx.lineWidth=4; ctx.stroke();
  ctx.beginPath(); ctx.arc(x,y,28,-Math.PI/2,-Math.PI/2+t*Math.PI*2); ctx.strokeStyle=col; ctx.lineWidth=4; ctx.lineCap='round'; ctx.stroke();
  ctx.restore();
}

function drawScorePopup(ctx:CanvasRenderingContext2D,bx:number,by:number,score:ScoreInfo,progress:number){
  const tx=BOARD_CX+bx, ty=BOARD_CY+by-24-progress*40;
  const alpha=progress<0.5?1:1-(progress-0.5)/0.5;
  const col=ZONE_COLORS[score.result];
  ctx.save(); ctx.globalAlpha=alpha;

  // Score label
  ctx.font='bold 14px "feather", "Fredoka One", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle=col;
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=4; ctx.strokeText(score.label, tx, ty-24);
  ctx.fillText(score.label, tx, ty-24);

  // XP pill 3D
  ctx.font='bold 18px "feather", "Fredoka One", sans-serif';
  const text=`+${score.xp} XP`;
  const tw=ctx.measureText(text).width;
  ctx.fillStyle='#e5e5e5';
  ctx.beginPath(); ctx.roundRect(tx-tw/2-14,ty-12+5,tw+28,30,15); ctx.fill();
  ctx.fillStyle='#ffffff';
  ctx.beginPath(); ctx.roundRect(tx-tw/2-14,ty-12,tw+28,30,15); ctx.fill();
  ctx.strokeStyle=col; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.roundRect(tx-tw/2-14,ty-12,tw+28,30,15); ctx.stroke();
  ctx.fillStyle=col; ctx.fillText(text, tx, ty+3);

  ctx.restore();
}

function drawShadow(ctx:CanvasRenderingContext2D,t:number,ax:number,ay:number,ox=0,oy=0){
  ctx.save(); ctx.globalAlpha=t*0.15;
  const sr=(1-t)*22+4;
  ctx.beginPath(); ctx.ellipse(BOARD_CX+ox+ax*t,BOARD_CY+oy+ay*t,sr,sr*0.5,0,0,Math.PI*2);
  ctx.fillStyle='#000'; ctx.fill(); ctx.restore();
}

// Wind gust indicator
function drawWindGust(ctx:CanvasRenderingContext2D,gustX:number,gustY:number,alpha:number){
  if (alpha<=0) return;
  const cx=BOARD_CX+gustX, cy=BOARD_CY+gustY-60;
  const len=24, headLen=8;
  const angle=Math.atan2(gustY,gustX);
  ctx.save(); ctx.globalAlpha=alpha*0.7;
  ctx.strokeStyle='#1cb0f6'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(cx-Math.cos(angle)*len*0.5, cy-Math.sin(angle)*len*0.5);
  ctx.lineTo(cx+Math.cos(angle)*len*0.5, cy+Math.sin(angle)*len*0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx+Math.cos(angle)*len*0.5, cy+Math.sin(angle)*len*0.5);
  ctx.lineTo(cx+Math.cos(angle+2.5)*headLen, cy+Math.sin(angle+2.5)*headLen);
  ctx.lineTo(cx+Math.cos(angle-2.5)*headLen, cy+Math.sin(angle-2.5)*headLen);
  ctx.closePath(); ctx.fillStyle='#ffffff'; ctx.fill(); ctx.stroke();
  ctx.restore();
}

const easeIn3  = (t:number)=>t*t*t;
const easeOut2 = (t:number)=>1-(1-t)*(1-t);

// ── Component ─────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'dragging' | 'throwing' | 'impact' | 'done';

export default function DartThrow({
  onResult, difficulty=1, autoThrow=false, autoThrowDelay=800, loop=false,
}: DartThrowProps) {
  const cfg = DIFF[difficulty];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wrapScope, animateWrapper] = useAnimate();
  const autoFired = useRef(false);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const gs = useRef({
    phase:      'idle' as Phase,
    frame:      0,
    dragPos:    { x: DART_HOME.x, y: DART_HOME.y },
    dragStartTime: 0,
    wobble:     { x: 0, y: 0 },
    handSway:   0,
    gust:       { x: 0, y: 0, alpha: 0, timer: 0 },
    aimOffset:  { x: 0, y: 0 },
    throwF:     0,
    shake:      { x: 0, y: 0 },
    shakeF:     0,
    stickVibF:  0,
    particles:  [] as Particle[],
    score:      null as ScoreInfo | null,
    popupT:     0,
  });
  const rafRef = useRef(0);

  const [uiPhase,  setUIPhase]  = useState<Phase>('idle');
  const [uiScore,  setUIScore]  = useState<ScoreInfo|null>(null);

  // ── Canvas coordinate helper ───────────────────────────────────────────────

  function canvasXY(e: MouseEvent|Touch) {
    const canvas=canvasRef.current!;
    const rect=canvas.getBoundingClientRect();
    return { x:(e.clientX-rect.left)*(W/rect.width), y:(e.clientY-rect.top)*(H/rect.height) };
  }

  // ── Launch ─────────────────────────────────────────────────────────────────

  const launchDart = useCallback((rx:number, ry:number) => {
    const s=gs.current; const c=cfgRef.current;
    const pullX=DART_HOME.x-rx, pullY=DART_HOME.y-ry;
    const power=Math.hypot(pullX,pullY);
    if (power<c.minPower) { s.phase='idle'; s.dragPos={...DART_HOME}; setUIPhase('idle'); return; }

    const normPower=Math.min(power/c.maxDrag,1);
    // Higher sensitivity = smaller pull maps to same board range
    const aimX=-pullX*(BOARD_R*0.9)/c.maxDrag*c.sensitivity;
    const aimY=(1-normPower)*28;

    // Add wind gust displacement at higher difficulties
    const gustX=c.windGusts&&s.gust.alpha>0.5 ? s.gust.x*0.4 : 0;
    const gustY=c.windGusts&&s.gust.alpha>0.5 ? s.gust.y*0.3 : 0;

    const finalX=aimX+s.wobble.x*0.45+gustX;
    const finalY=aimY+s.wobble.y*0.35+gustY;
    const maxAim=BOARD_R+10;
    const aimDist=Math.hypot(finalX,finalY);
    s.aimOffset={ x:aimDist>maxAim?finalX/aimDist*maxAim:finalX, y:aimDist>maxAim?finalY/aimDist*maxAim:finalY };
    s.throwF=0; s.phase='throwing'; setUIPhase('throwing');
    animateWrapper(wrapScope.current,{scale:1.07},{duration:0.45,ease:[0.4,0,0.2,1]});
  }, [animateWrapper, wrapScope]);

  // ── Pointer events ─────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e:React.PointerEvent<HTMLCanvasElement>)=>{
    const s=gs.current;
    if (s.phase!=='idle') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos=canvasXY(e.nativeEvent as unknown as MouseEvent);
    s.phase='dragging'; s.dragPos={...pos}; s.dragStartTime=performance.now(); setUIPhase('dragging');
  },[]);

  const onPointerMove = useCallback((e:React.PointerEvent<HTMLCanvasElement>)=>{
    const s=gs.current; const c=cfgRef.current;
    if (s.phase!=='dragging') return;
    const pos=canvasXY(e.nativeEvent as unknown as MouseEvent);
    const dx=pos.x-DART_HOME.x,dy=pos.y-DART_HOME.y,dist=Math.hypot(dx,dy);
    s.dragPos=dist>c.maxDrag?{x:DART_HOME.x+dx/dist*c.maxDrag,y:DART_HOME.y+dy/dist*c.maxDrag}:{...pos};
  },[]);

  const onPointerUp = useCallback((e:React.PointerEvent<HTMLCanvasElement>)=>{
    const s=gs.current;
    if (s.phase!=='dragging') return;
    const pos=canvasXY(e.nativeEvent as unknown as MouseEvent);
    void pos; // position at release — use drag pos
    launchDart(s.dragPos.x, s.dragPos.y);
  },[launchDart]);

  // ── Auto throw ─────────────────────────────────────────────────────────────

  const doAutoThrow = useCallback(()=>{
    const s=gs.current; const c=cfgRef.current;
    if (s.phase!=='idle') return;
    s.phase='dragging';
    setUIPhase('dragging');
    
    const scatter=(Math.random()-0.5)*c.maxDrag*0.6;
    const targetX = DART_HOME.x + scatter;
    const targetY = DART_HOME.y + c.maxDrag*0.8;
    
    let frame = 0;
    const maxFrames = 75; // ~1.25 seconds of aiming
    
    const aimLoop = () => {
      frame++;
      const t = frame / maxFrames;
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      
      // Organic wobble while aiming
      const wobbleX = Math.sin(frame * 0.15) * 8 * t;
      const wobbleY = Math.cos(frame * 0.2) * 4 * t;

      s.dragPos.x = DART_HOME.x + (targetX - DART_HOME.x) * eased + wobbleX;
      s.dragPos.y = DART_HOME.y + (targetY - DART_HOME.y) * eased + wobbleY;

      if (frame < maxFrames) {
        requestAnimationFrame(aimLoop);
      } else {
        launchDart(s.dragPos.x, s.dragPos.y);
      }
    };
    requestAnimationFrame(aimLoop);
  },[launchDart]);

  if (autoThrow&&gs.current.phase==='idle'&&!autoFired.current){
    autoFired.current=true; setTimeout(doAutoThrow,autoThrowDelay);
  }

  // ── Game loop ──────────────────────────────────────────────────────────────

  const tick = useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d')!;
    const s=gs.current; const c=cfgRef.current;
    s.frame++;
    ctx.clearRect(0,0,W,H);

    // Shake
    if(s.shakeF>0){s.shakeF--;const i=s.shakeF*0.4;s.shake={x:(Math.random()-0.5)*i,y:(Math.random()-0.5)*i};}
    else s.shake={x:0,y:0};

    const stickOff=s.stickVibF>0?Math.sin(s.stickVibF*1.8)*(s.stickVibF*0.12):0;
    if(s.stickVibF>0)s.stickVibF--;

    // Wind gust (difficulty 4-5)
    if(c.windGusts){
      s.gust.timer--;
      if(s.gust.timer<=0){
        s.gust.timer=80+Math.random()*120;
        s.gust.x=(Math.random()-0.5)*30;
        s.gust.y=(Math.random()-0.5)*20;
        s.gust.alpha=1;
      }
      if(s.gust.alpha>0)s.gust.alpha=Math.max(0,s.gust.alpha-0.012);
    }

    drawBoard(ctx,s.shake.x,s.shake.y);
    if(c.windGusts)drawWindGust(ctx,s.gust.x,s.gust.y,s.gust.alpha);

    // Wobble
    const wt=s.frame*c.wobbleSpeed;
    s.wobble.x=Math.sin(wt*2.1)*c.wobbleAmp;
    s.wobble.y=Math.cos(wt*1.7)*c.wobbleAmp*0.65;
    // Hand sway (slow lateral drift)
    if(c.handSway)s.handSway=Math.sin(s.frame*0.022)*12;

    // ── Idle / Dragging ────────────────────────────────────────────────────

    if(s.phase==='idle'||s.phase==='dragging'){
      const isDragging=s.phase==='dragging';
      const dartX=isDragging?s.dragPos.x+s.wobble.x*0.3:DART_HOME.x+s.wobble.x*0.25+s.handSway;
      const dartY=isDragging?s.dragPos.y+s.wobble.y*0.3:DART_HOME.y+s.wobble.y*0.2;
      const pull=isDragging?Math.hypot(s.dragPos.x-DART_HOME.x,s.dragPos.y-DART_HOME.y):0;

      if(isDragging){
        const pPullX=DART_HOME.x-s.dragPos.x,pPullY=DART_HOME.y-s.dragPos.y;
        const pPow=Math.hypot(pPullX,pPullY);
        const pAimX=-pPullX*(BOARD_R*0.9)/c.maxDrag*c.sensitivity;
        const pAimY=(1-Math.min(pPow/c.maxDrag,1))*28;
        drawArcPreview(ctx,dartX,dartY,BOARD_CX+pAimX,BOARD_CY+pAimY,pull);
        drawSlingshot(ctx,dartX,dartY,pull,c.maxDrag);
        drawPowerRing(ctx,dartX,dartY,pull,c.maxDrag);
      }
      drawFlights(ctx,dartX,dartY,1.0,isDragging?s.dragPos.x-DART_HOME.x:s.handSway);
    }

    // ── Throwing ──────────────────────────────────────────────────────────

    if(s.phase==='throwing'){
      s.throwF++;
      const rawT=Math.min(s.throwF/THROW_FRAMES,1);
      const zT=easeIn3(rawT),arcT=easeOut2(rawT);
      const ax=s.aimOffset.x,ay=s.aimOffset.y;
      const sx=DART_HOME.x+(BOARD_CX+ax-DART_HOME.x)*zT;
      const sy=DART_HOME.y+(BOARD_CY+ay-DART_HOME.y)*zT-ARC_LIFT*Math.sin(arcT*Math.PI);
      drawShadow(ctx,zT,ax,ay,s.shake.x,s.shake.y);
      drawDartSide(ctx,sx,sy,1-zT*0.73,-0.15+rawT*0.15);
      if(rawT>=1){
        const score=polarScore(ax,ay);
        s.score=score; s.phase='impact'; s.shakeF=score.result==='bullseye'?22:score.multiplier>=2?16:score.result==='miss'?4:12;
        s.stickVibF=14; s.popupT=0;
        s.particles=spawnParticles(BOARD_CX+ax+s.shake.x,BOARD_CY+ay+s.shake.y,ZONE_COLORS[score.result],score.multiplier>=3?28:16);
        playImpact(score); haptic(score); setUIScore(score); setUIPhase('impact'); onResult?.(score);
        animateWrapper(wrapScope.current,{scale:1},{duration:0.35,ease:[0.2,0,0.8,1]});
        setTimeout(()=>{ s.phase=loop?'idle':'done'; if(loop){s.score=null;s.particles=[];autoFired.current=false;setUIScore(null);} setUIPhase(loop?'idle':'done'); },2000);
      }
    }

    // ── Impact / Done ──────────────────────────────────────────────────────

    if(s.phase==='impact'||s.phase==='done'){
      const ax=s.aimOffset.x,ay=s.aimOffset.y;
      drawDartSide(ctx,ax+stickOff,ay,0.28,stickOff*0.04,BOARD_CX+s.shake.x,BOARD_CY+s.shake.y);
      if(s.score){s.popupT=Math.min(s.popupT+0.022,1); drawScorePopup(ctx,ax,ay,s.score,s.popupT);}
    }

    // ── Particles ──────────────────────────────────────────────────────────

    s.particles=s.particles.filter(p=>p.life>0.02);
    s.particles.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.11;p.vx*=0.92;p.vy*=0.92;p.life*=0.87;
      ctx.save();ctx.globalAlpha=p.life;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.restore();
    });

    rafRef.current=requestAnimationFrame(tick);
  },[onResult,loop,animateWrapper,wrapScope]);

  useEffect(()=>{
    rafRef.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[tick]);

  const reset=useCallback(()=>{
    const s=gs.current;
    s.phase='idle';s.score=null;s.particles=[];s.throwF=0;s.shakeF=0;s.stickVibF=0;s.popupT=0;
    s.dragPos={...DART_HOME};autoFired.current=false;
    setUIPhase('idle');setUIScore(null);
  },[]);

  const hitColor=uiScore?ZONE_COLORS[uiScore.result]:'#58cc02';

  return (
    <div className="flex flex-col items-center gap-3 w-full select-none">
      <motion.div ref={wrapScope} className="relative w-full max-w-[380px]" style={{scale:1}}>
        <canvas
          ref={canvasRef} width={W} height={H}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          className="w-full rounded-[24px] touch-none"
          style={{
            background:'#ffffff',
            boxShadow: '0 8px 0 #e5e5e5, inset 0 0 0 2px #e5e5e5',
            cursor:uiPhase==='idle'?'grab':uiPhase==='dragging'?'grabbing':'default',
          }}
        />
        <AnimatePresence>
          {uiPhase==='idle'&&!autoThrow&&(
            <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute bottom-4 inset-x-0 text-center text-[10px] font-black uppercase tracking-widest text-[#afafaf] pointer-events-none"
            >Grab &amp; flick toward the board</motion.p>
          )}
          {uiPhase==='dragging'&&(
            <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute bottom-4 inset-x-0 text-center text-[10px] font-black uppercase tracking-widest text-[#afafaf] pointer-events-none"
            >Release to throw</motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Score strip */}
      <div className="h-12 flex items-center justify-center mt-2">
        <AnimatePresence mode="wait">
          {uiScore&&uiPhase!=='idle'?(
            <motion.div key={`${uiScore.label}-${uiScore.xp}`} className="flex items-center gap-3"
              initial={{opacity:0,y:8,scale:0.85}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-5}}
              transition={{type:'spring',stiffness:420,damping:22}}
            >
              <span className="font-fredoka font-black text-3xl tracking-tight" style={{color:hitColor}}>{uiScore.label}</span>
              <motion.div className="px-4 py-1.5 rounded-xl font-fredoka font-black text-lg"
                style={{background:'#ffffff',color:hitColor,boxShadow:`0 4px 0 ${hitColor}44, inset 0 0 0 2px ${hitColor}`}}
                initial={{scale:0.6}} animate={{scale:1}} transition={{type:'spring',stiffness:500,damping:18,delay:0.1}}
              >+{uiScore.xp} XP</motion.div>
            </motion.div>
          ):(
            <motion.p key="idle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="text-base font-bold text-[#afafaf]"
            >{autoThrow?'':uiPhase==='dragging'?'…':'Ready'}</motion.p>
          )}
        </AnimatePresence>
      </div>

      {!autoThrow&&uiPhase==='done'&&(
        <motion.button initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} onClick={reset}
          className="px-8 py-3 bg-[#58cc02] text-white font-fredoka font-black text-[15px] rounded-xl shadow-[0_4px_0_#3f8f01] active:shadow-none active:translate-y-[4px] transition-all"
        >Throw again</motion.button>
      )}
    </div>
  );
}

// Re-export for convenience
export { DIFF };
export type { DiffConfig };
