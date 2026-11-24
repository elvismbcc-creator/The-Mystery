let ctx=null,m=null,mus=null;
function ac(){
  if(typeof window==="undefined")return null;
  if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=new A();}
  if(ctx.state==="suspended")ctx.resume();
  return ctx;
}
export const unlock=()=>{ac();};
function tone(f,t0,d,type="sine",v=0.15){
  const c=ac();if(!c)return;
  const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+t0;
  o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+0.05);
}
// Sonidos de respaldo (por si no carga el archivo)
const synth={
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,i*0.15,0.6,"triangle"));},
  wrong(){tone(220,0,0.4,"sawtooth",0.12);tone(165,0.25,0.7,"sawtooth",0.12);},
  ask(){tone(880,0,0.18);tone(1175,0.18,0.35);}
};
function playFile(n,fb){
  try{const a=new Audio(`/sounds/${n}.wav`);a.volume=0.9;const p=a.play();if(p&&p.catch)p.catch(fb);}catch{fb();}
}
export const sfx={
  win(){playFile("win",synth.win);},
  wrong(){playFile("wrong",synth.wrong);},
  ask(){playFile("ask",synth.ask);},
  thunder(){playFile("thunder",()=>tone(55,0,1.2,"sawtooth",0.15));}
};
function synthMusicOn(){
  const c=ac();if(!c||m)return;
  const g=c.createGain();g.gain.value=0.0001;g.gain.linearRampToValueAtTime(0.05,c.currentTime+3);g.connect(c.destination);
  const oscs=[55,82.4,110.5].map((f,i)=>{const o=c.createOscillator();o.type=i?"sine":"triangle";o.frequency.value=f;o.connect(g);o.start();return o;});
  const iv=setInterval(()=>tone([220,261.6,329.6,246.9,196][Math.floor(Math.random()*5)],0,3.5,"sine",0.025),4500);
  m={g,oscs,iv};
}
function synthMusicOff(){
  if(!m)return;const x=m;m=null;clearInterval(x.iv);
  try{x.g.gain.linearRampToValueAtTime(0.0001,ac().currentTime+0.5);}catch{}
  setTimeout(()=>x.oscs.forEach(o=>{try{o.stop();}catch{}}),700);
}
export function musicOn(){
  try{
    if(!mus){mus=new Audio("/sounds/music.wav");mus.loop=true;mus.volume=0.4;}
    const p=mus.play();if(p&&p.catch)p.catch(()=>{mus=null;synthMusicOn();});
  }catch{synthMusicOn();}
}
export function musicOff(){
  if(mus){mus.pause();mus=null;}
  synthMusicOff();
}
export function speak(text){
  try{
    const sy=window.speechSynthesis;if(!sy)return;sy.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang="es-ES";
    const v=sy.getVoices().find(x=>x.lang&&x.lang.toLowerCase().startsWith("es"));if(v)u.voice=v;
    u.rate=0.9;u.pitch=0.7;sy.speak(u);
  }catch{}
}
