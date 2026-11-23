import {COLORS} from "@/lib/data";
const SKIN="#e8c9a0";
const HAIR={
  "Señorita Escarlata":<path d="M10 22C8 9 14 4 20 4s12 5 10 18l-3 6-3-9H16l-3 9z" fill="#4a0d0d"/>,
  "Coronel Mostaza":null,
  "Señora Blanco":<><circle cx="20" cy="6" r="4" fill="#d6d3d1"/><path d="M12 16c0-7 4-10 8-10s8 3 8 10c-3-3-13-3-16 0z" fill="#d6d3d1"/></>,
  "Señor Verde":null,
  "Señora Celeste":<path d="M11 24c-2-12 3-19 9-19s11 7 9 19l-3-7c-2-3-10-3-12 0z" fill="#0c4a6e"/>,
  "Profesor Moradillo":<path d="M11 15c0-3 2-4 3-4M29 15c0-3-2-4-3-4" stroke="#d6d3d1" strokeWidth="2" fill="none"/>,
};
const TOP={
  "Señorita Escarlata":<path d="M12 14c3-4 13-4 16 0-4-1-12-1-16 0z" fill="#4a0d0d"/>,
  "Coronel Mostaza":<><path d="M11 13c0-6 4-8 9-8s9 2 9 8z" fill="#854d0e"/><rect x="9" y="12" width="22" height="2.5" rx="1" fill="#713f12"/></>,
  "Señor Verde":<><rect x="13" y="2" width="14" height="10" fill="#14532d"/><rect x="9" y="11" width="22" height="3" rx="1" fill="#14532d"/></>,
  "Señora Celeste":<rect x="12" y="12" width="16" height="2" fill="#38bdf8"/>,
};
const FACE={
  "Coronel Mostaza":<path d="M15 21c2-2 3-1 5 0 2-1 3-2 5 0-2 2-3 1-5 0-2 1-3 2-5 0z" fill="#78350f"/>,
  "Señorita Escarlata":<path d="M17 23c1.5 1.5 4.5 1.5 6 0" stroke="#dc2626" strokeWidth="1.6" fill="none"/>,
  "Profesor Moradillo":<><circle cx="16.5" cy="17" r="3" stroke="#a855f7" strokeWidth="1" fill="none"/><circle cx="23.5" cy="17" r="3" stroke="#a855f7" strokeWidth="1" fill="none"/><path d="M13 21c1 6 13 6 14 0-3 2-11 2-14 0z" fill="#581c87"/></>,
};
export default function Portrait({c,size=40}){
  const col=COLORS[c]||"#888";
  return(
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0 rounded-full" style={{background:"#0b0a0c",border:`2px solid ${col}`}} aria-hidden="true">
      <path d="M5 40c0-8 6-12 15-12s15 4 15 12z" fill={col}/>
      {HAIR[c]&&c!=="Profesor Moradillo"&&c!=="Señora Blanco"?HAIR[c]:null}
      <circle cx="20" cy="17" r="8" fill={SKIN}/>
      {c==="Señora Blanco"||c==="Profesor Moradillo"?HAIR[c]:null}
      {TOP[c]}
      {c!=="Profesor Moradillo"&&<><circle cx="16.5" cy="17" r="1.1" fill="#1c1917"/><circle cx="23.5" cy="17" r="1.1" fill="#1c1917"/></>}
      {c==="Profesor Moradillo"&&<><circle cx="16.5" cy="17" r="1" fill="#1c1917"/><circle cx="23.5" cy="17" r="1" fill="#1c1917"/></>}
      {FACE[c]}
    </svg>
  );
}
