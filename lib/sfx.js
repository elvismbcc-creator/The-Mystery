const KEY="tm_prefs";
let ctx=null,master=null,mgain=null,mtimer=null,drone=[],prefs={sfx:true,music:true};
try{if(typeof localStorage!=="undefined")prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||"{}")};}catch{}
export const getPrefs=()=>prefs;
export function setPref(k,v){prefs={...prefs,[k]:v};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}}
export function initAudio(){
  try{
    if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=.6;master.connect(ctx.destination);}
    if(ctx.state==="suspended")ctx.resume();
  }catch{}
}
function note(f,t,d,type="sine",v=.15){
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.05);
}
const seq=(fs,gap,d,type,v)=>{const t=ctx.currentTime;fs.forEach((f,i)=>note(f,t+i*gap,d,type,v));};
const SFX={
  tap:{vib:8,run:()=>seq([660],0,.06,"sine",.08)},
  mark:{vib:6,run:()=>seq([520],0,.07,"triangle",.1)},
  react:{vib:0,run:()=>seq([880,1175],.07,.12,"sine",.08)},
  ask:{vib:[30],run:()=>seq([440,587],.1,.18,"triangle",.14)},
  send:{vib:[30],run:()=>seq([523,659],.09,.16,"triangle",.14)},
  inbox:{vib:[200,100,200],run:()=>seq([660,880,660],.18,.5,"triangle",.18)},
  start:{vib:[80,40,80],run:()=>seq([262,330,392,523],.12,.4,"triangle",.18)},
  wrong:{vib:[350],run:()=>seq([196,147,110],.18,.45,"sawtooth",.12)},
  lose:{vib:[400],run:()=>seq([220,196,164,110],.28,.6,"sawtooth",.12)},
  win:{vib:[100,50,100,50,300],run:()=>seq([523,659,784,1047,784,1047],.14,.5,"triangle",.2)},
};
export function play(name){
  if(!prefs.sfx)return;const s=SFX[name];if(!s)return;
  try{if(s.vib&&navigator.vibrate)navigator.vibrate(s.vib);}catch{}
  if(!ctx)return;
  try{if(ctx.state==="suspended")ctx.resume();s.run();}catch{}
}
const SCALE=[110,130.81,146.83,164.81,196,220,261.63,329.63];
function pad(f,t,d,dest){
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type="triangle";o.frequency.value=f;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+1.4);g.gain.linearRampToValueAtTime(0,t+d);
  o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+.1);
}
export function startMusic(){
  if(!ctx||mtimer)return;
  mgain=ctx.createGain();mgain.gain.setValueAtTime(0,ctx.currentTime);mgain.gain.linearRampToValueAtTime(.35,ctx.currentTime+3);mgain.connect(master);
  drone=[55,82.41].map(f=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=f;g.gain.value=.07;o.connect(g);g.connect(mgain);o.start();return o;});
  const step=()=>{
    const t=ctx.currentTime;
    pad(SCALE[Math.floor(Math.random()*SCALE.length)],t,4.5,mgain);
    if(Math.random()<.35)pad(SCALE[Math.floor(Math.random()*4)]*2,t+1.2,4,mgain);
  };
  step();mtimer=setInterval(step,2600);
}
export function stopMusic(){
  if(mtimer){clearInterval(mtimer);mtimer=null;}
  try{
    if(mgain){const t=ctx.currentTime;mgain.gain.cancelScheduledValues(t);mgain.gain.setValueAtTime(mgain.gain.value,t);mgain.gain.linearRampToValueAtTime(0,t+.8);}
    const d=drone;drone=[];setTimeout(()=>d.forEach(o=>{try{o.stop();}catch{}}),900);
  }catch{}
}
