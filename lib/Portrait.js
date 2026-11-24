import {COLORS} from "@/lib/data";
const SK="#e8c9a0";
const hair=(c)=><path d="M13 22 Q13 8 24 8 Q35 8 35 22 Q30 15 24 15 Q18 15 13 22Z" fill={c}/>;
const ACC={
  "Señorita Escarlata":()=><><path d="M10 20 Q24 4 38 20Z" fill="#7f1d1d"/><rect x="8" y="19" width="32" height="3" rx="1.5" fill="#7f1d1d"/><path d="M20 31 Q24 34 28 31" stroke="#b91c1c" strokeWidth="2" fill="none"/></>,
  "Coronel Mostaza":()=><><rect x="13" y="12" width="22" height="7" rx="2" fill="#78350f"/><path d="M17 29 Q24 25 31 29 Q24 33 17 29Z" fill="#78350f"/></>,
  "Señora Blanco":()=><>{hair("#d6d3d1")}<circle cx="24" cy="7" r="4" fill="#d6d3d1"/></>,
  "Señor Verde":()=><><rect x="14" y="8" width="20" height="11" rx="5" fill="#14532d"/><rect x="10" y="18" width="28" height="3" rx="1.5" fill="#14532d"/></>,
  "Señora Celeste":()=><>{hair("#0369a1")}<circle cx="35" cy="14" r="3" fill="#7dd3fc"/></>,
  "Profesor Moradillo":()=><><circle cx="19.5" cy="24" r="4" fill="none" stroke="#3b0764" strokeWidth="1.5"/><circle cx="28.5" cy="24" r="4" fill="none" stroke="#3b0764" strokeWidth="1.5"/><path d="M23.5 24h1" stroke="#3b0764" strokeWidth="1.5"/><path d="M16 31 Q24 43 32 31 Q24 35 16 31Z" fill="#d6d3d1"/></>
};
export function Portrait({c,size=36}){
  return(
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0 rounded-full" style={{background:COLORS[c],boxShadow:`0 0 0 2px ${COLORS[c]}`}}>
      <path d="M6 48 Q8 34 24 34 Q40 34 42 48Z" fill="rgba(0,0,0,.35)"/>
      <rect x="21" y="30" width="6" height="6" fill={SK}/>
      <circle cx="24" cy="24" r="10" fill={SK}/>
      <circle cx="20.5" cy="24" r="1.2" fill="#222"/><circle cx="27.5" cy="24" r="1.2" fill="#222"/>
      {ACC[c]&&ACC[c]()}
    </svg>
  );
}
