import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Command, Heart, MessageCircle, Mic, MoreHorizontal, Music, Play, Search, Send, Share2, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { aiosRuntime, type AIOSRuntimeState } from '../../aios/runtime';
import { speechService } from '../../services/voice/speechService';
import './UltronOneWorld.css';

const STAR_COUNT = 72;
type Star = { id:string; name:string; type:'city'|'infrastructure'|'signal'|'region'; x:number; y:number; depth:number; size:number; importance:number };
const stars: Star[] = [
  {id:'dubai',name:'Dubai',type:'city',x:63,y:43,depth:.92,size:6,importance:1},{id:'abu-dhabi',name:'Abu Dhabi',type:'city',x:39,y:58,depth:.86,size:5,importance:.95},{id:'sharjah',name:'Sharjah',type:'city',x:69,y:31,depth:.72,size:4,importance:.8},{id:'fujairah',name:'Fujairah',type:'city',x:82,y:51,depth:.65,size:3.5,importance:.65},{id:'al-ain',name:'Al Ain',type:'city',x:58,y:70,depth:.62,size:3.5,importance:.6},{id:'port-jebel-ali',name:'Jebel Ali Port',type:'infrastructure',x:55,y:49,depth:.54,size:3,importance:.55},{id:'metro',name:'Dubai Metro',type:'infrastructure',x:71,y:45,depth:.48,size:2.8,importance:.5},{id:'khalifa-port',name:'Khalifa Port',type:'infrastructure',x:31,y:53,depth:.45,size:2.8,importance:.5},{id:'masdar',name:'Masdar City',type:'signal',x:42,y:51,depth:.4,size:2.5,importance:.42},{id:'uae',name:'United Arab Emirates',type:'region',x:50,y:48,depth:.28,size:2,importance:.35},
];
const generatedStars: Star[] = Array.from({length:STAR_COUNT},(_,i)=>{const a=i*2.399963,r=15+((i*17)%43);return{id:`field-${i}`,name:`World signal ${i+1}`,type:'signal',x:50+Math.cos(a)*r*1.42,y:50+Math.sin(a)*r*.72,depth:.08+((i*13)%90)/100,size:1+((i*7)%3)*.45,importance:.1+((i*11)%80)/100};});
const allStars=[...generatedStars,...stars];

export const UltronOneWorld: React.FC = () => {
  const [runtime,setRuntime]=useState<AIOSRuntimeState>(()=>aiosRuntime.getState());
  const [selected,setSelected]=useState<Star|null>(null); const [query,setQuery]=useState(''); const [listening,setListening]=useState(false); const [speaking,setSpeaking]=useState(false); const [muted,setMuted]=useState(true); const [liked,setLiked]=useState(false); const [signalCount,setSignalCount]=useState(414); const [playing,setPlaying]=useState(true); const [showActions,setShowActions]=useState(false); const [pointer,setPointer]=useState({x:0,y:0}); const inputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>aiosRuntime.subscribe(setRuntime),[]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();inputRef.current?.focus();}if(e.key==='Escape'){setSelected(null);setShowActions(false);inputRef.current?.blur();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
  const visibleStars=useMemo(()=>{const q=query.trim().toLowerCase();return q?allStars.filter(s=>s.name.toLowerCase().includes(q)):allStars;},[query]);
  const focusStar=(star:Star)=>{setSelected(star);aiosRuntime.setContext('world',star.id,'world-model');speechService.speak(`${star.name} selected.`);};
  const submitQuery=()=>{const value=query.trim();if(!value)return;const match=allStars.find(s=>s.name.toLowerCase().includes(value.toLowerCase()));if(match)focusStar(match);else speechService.speak(`Searching the world model for ${value}.`);aiosRuntime.setContext('world',value,'query');setQuery('');};
  const toggleVoice=()=>{const next=!listening;setListening(next);aiosRuntime.setSystemState(next?'LISTENING':'IDLE');if(next)speechService.speak('World interface listening.');};
  const toggleSpeech=()=>{if(speaking){speechService.stopSpeaking();setSpeaking(false);return;}speechService.speak(selected?`${selected.name}. ${selected.type}. Live world model entity.`:'ULTRON world model online. Living intelligence is active.');setSpeaking(true);window.setTimeout(()=>setSpeaking(false),2600);};
  const handleLike=()=>{setLiked(current=>!current);setSignalCount(current=>liked?current-1:current+1);};
  const selectedName=selected?.name??'United Arab Emirates'; const selectedType=selected?.type??'region';

  return <div className="one-world" onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();setPointer({x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5});}} onPointerLeave={()=>setPointer({x:0,y:0})}>
    <div className="one-world-field" aria-hidden="true"/>
    <div className="one-world-stars" style={{transform:`translate3d(${pointer.x*-10}px,${pointer.y*-7}px,0)`}}>{visibleStars.map(star=><button key={star.id} className={`world-star world-star-${star.type} ${selected?.id===star.id?'is-selected':''}`} style={{left:`${star.x}%`,top:`${star.y}%`,'--star-size':`${star.size}px`,'--star-depth':star.depth} as React.CSSProperties} onClick={()=>focusStar(star)} aria-label={`Select ${star.name}`}><span className="world-star-core"/>{selected?.id===star.id&&<span className="world-star-ring"/>}{star.importance>.75&&<span className="world-star-label">{star.name}</span>}</button>)}</div>
    <div className="one-world-orbit orbit-one"/><div className="one-world-orbit orbit-two"/><div className="one-world-orbit orbit-three"/>
    <div className="one-world-black-hole" aria-label="ULTRON AIOS intelligence core" style={{transform:`translate(-50%,-50%) rotateX(${pointer.y*-3}deg) rotateY(${pointer.x*3}deg)`}}><div className="black-hole-glow"/><div className="black-hole-accretion"/><div className="black-hole-event-horizon"/><div className="black-hole-center"/><div className="black-hole-label"><strong>ULTRON</strong><span>AIOS · WORLD MODEL</span></div></div>
    <header className="one-world-topbar"><div className="one-world-brand"><span className="brand-dot"/><div><strong>ULTRON</strong><small>ARCHOS INTELLIGENCE OS</small></div></div><div className="one-world-status"><span className={runtime.systemState!=='IDLE'?'status-live':''}/>{runtime.systemState}<i/>{runtime.activeEntityId||'GLOBAL'}</div><button className="world-camera" title="Capture world state" onClick={()=>speechService.speak('World state capture armed.')}><Camera/></button></header>
    <div className="one-world-title"><span>ONE WORLD</span><h1>Living intelligence.</h1><p>The world model reorganizes around your intent.</p></div>
    <div className="world-intelligence-story" aria-live="polite"><div className="story-kicker"><span className="story-live-dot"/> LIVE INTELLIGENCE <i/>{selectedName}</div><div className="story-copy"><strong>{selectedName} is inside the living model.</strong><span>Signals, entities, scenarios and governed agents converge through one interface.</span></div><div className="story-meta"><Music/><span>WORLD MODEL · {selectedType.toUpperCase()} · CONTINUOUS</span></div></div>
    <div className="world-action-rail" aria-label="World actions">
      <button onClick={handleLike} className={liked?'is-liked':''} title="Acknowledge signal"><Heart className={liked?'fill':''}/><span>{signalCount}</span></button>
      <button onClick={()=>setSelected(selected??stars[0])} title="Inspect entity"><MessageCircle/><span>127</span></button>
      <button onClick={()=>speechService.speak(`Sharing ${selectedName} world context.`)} title="Share context"><Share2/><span>15</span></button>
      <button onClick={()=>aiosRuntime.setContext('world',selected?.id??'global','route')} title="Route context"><Send/><span>144</span></button>
      <button onClick={()=>setShowActions(current=>!current)} title="More actions"><MoreHorizontal/></button>
      <button className="world-media-orb" onClick={()=>setPlaying(current=>!current)} title="Toggle intelligence pulse">{playing?<Play/>:<VolumeX/>}</button>
    </div>
    {showActions&&<motion.div className="world-action-menu" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><div className="world-action-menu-head"><span>WORLD ACTIONS</span><button onClick={()=>setShowActions(false)}>×</button></div><button onClick={()=>speechService.speak('Opening simulation controls.')}>Run simulation <span>→</span></button><button onClick={()=>speechService.speak('Agent fabric ready for orchestration.')}>Open agent fabric <span>→</span></button><button onClick={()=>speechService.speak('World timeline ready.')}>Inspect timeline <span>→</span></button></motion.div>}
    {selected&&<motion.aside className="world-inspector" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}><div className="inspector-kicker">WORLD ENTITY</div><div className="inspector-title">{selected.name}</div><div className="inspector-meta"><span>{selected.type.toUpperCase()}</span><span>LIVE MODEL</span></div><div className="inspector-grid"><div><small>STATUS</small><strong>ACTIVE</strong></div><div><small>CONFIDENCE</small><strong>—</strong></div><div><small>SIGNALS</small><strong>—</strong></div></div><button className="inspector-close" onClick={()=>setSelected(null)}>Dismiss</button></motion.aside>}
    <div className="one-world-command"><Search/><input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitQuery()} placeholder="Ask ULTRON anything" aria-label="Ask ULTRON anything"/><kbd><Command/>K</kbd></div>
    <div className="one-world-actions"><button className={listening?'is-active':''} onClick={toggleVoice} title="Voice"><Mic/></button><button className={speaking?'is-active':''} onClick={toggleSpeech} title="ULTRON voice"><Volume2/></button><button className={muted?'is-active':''} onClick={()=>setMuted(current=>!current)} title="Intelligence audio">{muted?<VolumeX/>:<Volume2/>}</button><span className="action-divider"/><span className="world-integrity"><ShieldCheck/> GOVERNED</span></div>
    <footer className="one-world-footer"><span>WORLD MODEL</span><i/><span>{allStars.length} OBJECTS</span><i/><span>SPATIAL INTELLIGENCE</span></footer>
    <div className="world-progress" aria-hidden="true"><span/></div>
  </div>;
};
