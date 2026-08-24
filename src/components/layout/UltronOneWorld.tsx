import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Command, Mic, Search, ShieldCheck, Sparkles, Volume2, X, Zap } from 'lucide-react';
import { aiosRuntime, type AIOSRuntimeState } from '../../aios/runtime';
import { speechService } from '../../services/voice/speechService';
import { Ton618Canvas } from './Ton618Canvas';
import { ModuleConstellation } from './ModuleConstellation';
import { UltronCommandDeck } from './UltronCommandDeck';
import { UltronVisualLayer } from './UltronVisualLayer';
import { AIOSCommandTrace } from './AIOSCommandTrace';
import './UltronOneWorld.css';
import './UltronOneWorld.expansion.css';

const STAR_COUNT = 72;
type Star = { id:string; name:string; type:'city'|'infrastructure'|'signal'|'region'; x:number; y:number; depth:number; size:number; importance:number };
const stars: Star[] = [
  {id:'dubai',name:'Dubai',type:'city',x:63,y:43,depth:.92,size:6,importance:1},{id:'abu-dhabi',name:'Abu Dhabi',type:'city',x:39,y:58,depth:.86,size:5,importance:.95},{id:'sharjah',name:'Sharjah',type:'city',x:69,y:31,depth:.72,size:4,importance:.8},{id:'fujairah',name:'Fujairah',type:'city',x:82,y:51,depth:.65,size:3.5,importance:.65},{id:'al-ain',name:'Al Ain',type:'city',x:58,y:70,depth:.62,size:3.5,importance:.6},{id:'port-jebel-ali',name:'Jebel Ali Port',type:'infrastructure',x:55,y:49,depth:.54,size:3,importance:.55},{id:'metro',name:'Dubai Metro',type:'infrastructure',x:71,y:45,depth:.48,size:2.8,importance:.5},{id:'khalifa-port',name:'Khalifa Port',type:'infrastructure',x:31,y:53,depth:.45,size:2.8,importance:.5},{id:'masdar',name:'Masdar City',type:'signal',x:42,y:51,depth:.4,size:2.5,importance:.42},{id:'uae',name:'United Arab Emirates',type:'region',x:50,y:48,depth:.28,size:2,importance:.35},
];
const generatedStars: Star[] = Array.from({length:STAR_COUNT},(_,i)=>{const a=i*2.399963,r=15+((i*17)%43);return{id:`field-${i}`,name:`World signal ${i+1}`,type:'signal',x:50+Math.cos(a)*r*1.42,y:50+Math.sin(a)*r*.72,depth:.08+((i*13)%90)/100,size:1+((i*7)%3)*.45,importance:.1+((i*11)%80)/100};});
const allStars=[...generatedStars,...stars];

export const UltronOneWorld: React.FC = () => {
  const [runtime,setRuntime]=useState<AIOSRuntimeState>(()=>aiosRuntime.getState());
  const [selected,setSelected]=useState<Star|null>(null); const [query,setQuery]=useState(''); const [listening,setListening]=useState(false); const [speaking,setSpeaking]=useState(false); const [showActions,setShowActions]=useState(false); const [showTimeline,setShowTimeline]=useState(false); const [pulse,setPulse]=useState(0); const [pointer,setPointer]=useState({x:0,y:0}); const inputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>aiosRuntime.subscribe(setRuntime),[]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();inputRef.current?.focus();}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='j'){e.preventDefault();window.dispatchEvent(new CustomEvent('archos:command-deck'));}if(e.key==='Escape'){setSelected(null);setShowActions(false);setShowTimeline(false);inputRef.current?.blur();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
  useEffect(()=>{const id=window.setInterval(()=>setPulse(p=>p+1),5200);return()=>window.clearInterval(id);},[]);
  const visibleStars=useMemo(()=>{const q=query.trim().toLowerCase();return q?allStars.filter(s=>s.name.toLowerCase().includes(q)):allStars;},[query]);
  const focusStar=(star:Star)=>{setSelected(star);aiosRuntime.setContext('world',star.id,'world-model');speechService.speak(`${star.name} selected.`);};
  const submitQuery=()=>{const value=query.trim();if(!value)return;const match=allStars.find(s=>s.name.toLowerCase().includes(value.toLowerCase()));if(match)focusStar(match);else speechService.speak(`Searching the world model for ${value}.`);aiosRuntime.setContext('world',value,'query');setQuery('');};
  const toggleVoice=()=>{const next=!listening;setListening(next);aiosRuntime.setSystemState(next?'LISTENING':'IDLE');if(next)speechService.speak('World interface listening.');};
  const toggleSpeech=()=>{if(speaking){speechService.stopSpeaking();setSpeaking(false);return;}speechService.speak(selected?`${selected.name}. ${selected.type}. Live world model entity.`:'ULTRON world model online. Living intelligence is active.');setSpeaking(true);window.setTimeout(()=>setSpeaking(false),2600);};
  const selectedName=selected?.name??'United Arab Emirates'; const selectedType=selected?.type??'region';

  return <div className={`one-world ${pulse%2?'world-pulse':''}`} onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();setPointer({x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5});}} onPointerLeave={()=>setPointer({x:0,y:0})}>
    <Ton618Canvas />
    <ModuleConstellation />
    <UltronVisualLayer />
    <UltronCommandDeck />
    <AIOSCommandTrace />
    <div className="one-world-field" aria-hidden="true"/><div className="world-ambient-scan" aria-hidden="true"/>
    <div className="one-world-stars" style={{transform:`translate3d(${pointer.x*-10}px,${pointer.y*-7}px,0)`}}>{visibleStars.map(star=><button key={star.id} className={`world-star world-star-${star.type} ${selected?.id===star.id?'is-selected':''}`} style={{left:`${star.x}%`,top:`${star.y}%`,'--star-size':`${star.size}px`,'--star-depth':star.depth} as React.CSSProperties} onClick={()=>focusStar(star)} aria-label={`Select ${star.name}`}><span className="world-star-core"/>{selected?.id===star.id&&<span className="world-star-ring"/>}{star.importance>.75&&<span className="world-star-label">{star.name}</span>}</button>)}</div>
    <svg className="world-connections" aria-hidden="true"><line x1="63%" y1="43%" x2="55%" y2="49%"/><line x1="39%" y1="58%" x2="42%" y2="51%"/><line x1="69%" y1="31%" x2="71%" y2="45%"/></svg>
    <div className="one-world-orbit orbit-one"/><div className="one-world-orbit orbit-two"/><div className="one-world-orbit orbit-three"/>
    <div className="one-world-black-hole" aria-label="ULTRON AIOS intelligence core" style={{transform:`translate(-50%,-50%) rotateX(${pointer.y*-3}deg) rotateY(${pointer.x*3}deg)`}}><div className="black-hole-label"><strong>ULTRON</strong><span>AIOS · WORLD MODEL</span><em><Zap/> {runtime.systemState}</em></div></div>
    <header className="one-world-topbar"><div className="one-world-brand"><span className="brand-dot"/><div><strong>ULTRON</strong><small>ARCHOS INTELLIGENCE OS</small></div></div><div className="one-world-status"><span className={runtime.systemState!=='IDLE'?'status-live':''}/>{runtime.systemState}<i/>{runtime.activeEntityId||'GLOBAL'}</div><button className="world-camera" title="Capture world state" onClick={()=>speechService.speak('World state capture armed.')}><Camera/></button></header>
    <div className="one-world-title"><span>ONE WORLD</span><h1>Living intelligence.</h1><p>The world model reorganizes around your intent.</p></div>
    <div className="world-metrics"><span><b>{allStars.length}</b> SIGNALS</span><i/><span><b>15</b> MODULES</span><i/><span><b>LIVE</b> FABRIC</span></div>
    <div className="world-intelligence-story" aria-live="polite"><div className="story-kicker"><span className="story-live-dot"/> LIVE INTELLIGENCE <i/>{selectedName}</div><div className="story-copy"><strong>{selectedName} is inside the living model.</strong><span>Signals, entities, scenarios and governed agents converge through one interface.</span></div><div className="story-meta"><Sparkles/><span>WORLD MODEL · {selectedType.toUpperCase()} · CONTINUOUS</span></div></div>
    {showActions&&<motion.div className="world-action-menu" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><div className="world-action-menu-head"><span>WORLD ACTIONS</span><button onClick={()=>setShowActions(false)}><X/></button></div><button onClick={()=>speechService.speak('Opening simulation controls.')}>Run simulation <span>→</span></button><button onClick={()=>speechService.speak('Agent fabric ready for orchestration.')}>Open agent fabric <span>→</span></button><button onClick={()=>setShowTimeline(true)}>Inspect timeline <span>→</span></button></motion.div>}
    {showTimeline&&<motion.div className="world-timeline" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}><div className="timeline-head"><span>TEMPORAL INTELLIGENCE</span><button onClick={()=>setShowTimeline(false)}><X/></button></div><div className="timeline-track"><span className="timeline-now"/><i/><i/><i/><i/><i/></div><div className="timeline-labels"><span>PAST</span><strong>NOW · LIVE</strong><span>SCENARIO</span></div><p>The interface is ready to bind historical states, live signals and future simulations to the same World Model.</p></motion.div>}
    {selected&&<motion.aside className="world-inspector" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}><div className="inspector-kicker">WORLD ENTITY</div><div className="inspector-title">{selected.name}</div><div className="inspector-meta"><span>{selected.type.toUpperCase()}</span><span>LIVE MODEL</span></div><div className="inspector-grid"><div><small>STATUS</small><strong>ACTIVE</strong></div><div><small>DEPTH</small><strong>{Math.round(selected.depth*100)}%</strong></div><div><small>IMPORTANCE</small><strong>{Math.round(selected.importance*100)}%</strong></div></div><button className="inspector-close" onClick={()=>setSelected(null)}>Dismiss</button></motion.aside>}
    <div className="one-world-command"><Search/><input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitQuery()} placeholder="Ask ULTRON anything" aria-label="Ask ULTRON anything"/><kbd><Command/>K</kbd></div>
    <div className="one-world-actions"><button className={listening?'is-active':''} onClick={toggleVoice} title="Voice"><Mic/></button><button className={speaking?'is-active':''} onClick={toggleSpeech} title="ULTRON voice"><Volume2/></button><button className="is-active" onClick={()=>speechService.speak('TON 618 visualization is live.')} title="Quasar status"><Zap/></button><span className="action-divider"/><span className="world-integrity"><ShieldCheck/> GOVERNED</span></div>
    <footer className="one-world-footer"><span>WORLD MODEL</span><i/><span>{allStars.length} OBJECTS</span><i/><span>SPATIAL INTELLIGENCE</span><i/><span>TEMPORAL INTELLIGENCE</span></footer><div className="world-progress" aria-hidden="true"><span/></div>
  </div>;
};
