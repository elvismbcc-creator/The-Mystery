"use client";
import {useEffect,useState} from "react";
export function Rain(){
  const [d]=useState(()=>Array.from({length:45},()=>({l:Math.random()*100,t:0.7+Math.random()*0.8,dl:Math.random()*2})));
  return <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">{d.map((x,i)=><span key={i} className="absolute top-0 h-10 w-px" style={{left:x.l+"%",background:"linear-gradient(transparent,rgba(186,214,255,.35))",animation:`rain ${x.t}s linear ${x.dl}s infinite`}}/>)}</div>;
}
function Candle({side}){
  const id="wax"+side,fast=side==="l"?0.7:0.55;
  return(
    <div className={`pointer-events-none fixed bottom-2 z-0 ${side==="l"?"left-1":"right-1"}`} style={{width:60,height:120}}>
      <div className="absolute left-1/2 top-0 h-40 w-40 rounded-full" style={{transform:"translate(-50%,-30%)",background:"radial-gradient(circle,rgba(255,170,60,.32),transparent 65%)",animation:`glowp ${fast+1.6}s ease-in-out infinite alternate`}}/>
      <svg viewBox="0 0 70 140" width="60" height="120" className="relative">
        <defs><linearGradient id={id} x1="0" x2="1"><stop offset="0" stopColor="#d9c9a3"/><stop offset=".6" stopColor="#f3e6c4"/><stop offset="1" stopColor="#b9a67c"/></linearGradient></defs>
        <rect x="24" y="52" width="22" height="64" rx="3" fill={`url(#${id})`}/>
        <path d="M22 116h26l4 10H18z" fill="#b8892e"/><rect x="14" y="126" width="42" height="8" rx="3" fill="#c9a24b"/>
        <path d="M35 52v-6" stroke="#222" strokeWidth="2"/>
        <g style={{transformOrigin:"35px 46px",animation:`flick ${fast}s ease-in-out infinite alternate`}}>
          <path d="M35 14c7 10 9 20 0 32-9-12-7-22 0-32z" fill="#ff9d2e"/><path d="M35 26c4 6 5 12 0 20-5-8-4-14 0-20z" fill="#ffe08a"/>
        </g>
      </svg>
    </div>
  );
}
export const Candles=()=><><Candle side="l"/><Candle side="r"/></>;
export function Curtain({onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3800);return()=>clearTimeout(t);},[]); // eslint-disable-line
  const fold="repeating-linear-gradient(90deg,#4a0f1d 0 14px,#6b1a2c 14px 26px,#3b0b17 26px 40px)";
  return(
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1/2" style={{background:fold,boxShadow:"inset -24px 0 40px rgba(0,0,0,.6)",animation:"curtL 1.8s 1.1s cubic-bezier(.7,0,.3,1) both"}}/>
      <div className="absolute inset-y-0 right-0 w-1/2" style={{background:fold,boxShadow:"inset 24px 0 40px rgba(0,0,0,.6)",animation:"curtR 1.8s 1.1s cubic-bezier(.7,0,.3,1) both"}}/>
      <div className="absolute inset-x-0 top-0 h-6" style={{background:"linear-gradient(#2a0610,#5b1325)"}}/>
      <p className="absolute inset-x-0 top-1/3 text-center font-serif text-3xl tracking-[0.3em] text-gold" style={{animation:"titlefade 2.4s both"}}>EL CASO<br/>COMIENZA</p>
    </div>
  );
}
export function Bolt(){
  return(<>
    <div className="pointer-events-none absolute inset-0 z-[1]" style={{background:"radial-gradient(circle at 70% 20%,rgba(200,220,255,.85),rgba(120,150,255,.2) 50%,transparent 75%)",animation:"bolt 9s linear infinite"}}/>
    <svg className="pointer-events-none absolute right-[18%] top-0 z-[1] h-[40%]" viewBox="0 0 60 120" fill="none" stroke="#e8f0ff" strokeWidth="2.5" style={{animation:"bolt 9s linear infinite",filter:"drop-shadow(0 0 6px #9db8ff)"}}><polyline points="34,0 22,40 36,44 18,86 30,90 14,120"/></svg>
  </>);
}
export function Mansion(){
  const lit=[[58,128],[88,128],[114,128],[56,156],[86,156],[262,128],[290,128],[318,128],[290,156],[318,156],[172,96],[190,96],[208,96],[172,128],[208,128],[24,92],[24,124],[360,92],[360,124]];
  return(
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMax meet" className="h-full w-full" aria-hidden="true">
      <g fill="#07050a">
        <rect x="40" y="110" width="110" height="90"/><rect x="150" y="80" width="100" height="120"/><rect x="250" y="110" width="110" height="90"/>
        <polygon points="140,82 200,28 260,82"/><polygon points="30,112 95,70 160,112"/><polygon points="240,112 305,70 370,112"/>
        <rect x="18" y="62" width="30" height="138"/><polygon points="12,64 33,16 54,64"/><rect x="352" y="62" width="30" height="138"/><polygon points="346,64 367,16 388,64"/>
        <rect x="108" y="46" width="9" height="28"/><rect x="288" y="46" width="9" height="28"/><rect x="0" y="198" width="400" height="22"/>
        <path d="M0 198c20-30 12-50 30-70M392 198c-18-30-10-50-26-72" stroke="#07050a" strokeWidth="4" fill="none"/>
      </g>
      {lit.map(([x,y],i)=><rect key={i} x={x} y={y} width="9" height="15" fill="#f5c75a" style={{animation:`winflick ${2+(i%5)*0.7}s ease-in-out ${(i%4)*0.3}s infinite alternate`}}/>)}
      <path d="M188 200v-26a12 12 0 0 1 24 0v26z" fill="#f5c75a" opacity=".55"/>
    </svg>
  );
}
