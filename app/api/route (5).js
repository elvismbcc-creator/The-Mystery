import {admin,ctx,fail,ok} from "@/lib/admin";
import {SUSPECTS,WEAPONS,ROOMS} from "@/lib/data";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,body,room,me}=c;
  if(room.status!=="playing"||!me)return fail("No puedes preguntar ahora",403);
  const {toId,suspect,weapon,room:rm}=body;
  if(toId===u.id)return fail("Elige a otro jugador");
  if(!SUSPECTS.includes(suspect)||!WEAPONS.includes(weapon)||!ROOMS.includes(rm))return fail("Elige las 3 cartas");
  const {data:to}=await admin.from("players").select("id").eq("room_code",room.code).eq("id",toId).maybeSingle();
  if(!to)return fail("Ese jugador no está en la sala");
  const {count}=await admin.from("questions").select("id",{count:"exact",head:true}).eq("room_code",room.code).eq("answered",false);
  if(count)return fail("Hay una pregunta sin responder");
  await admin.from("questions").insert({room_code:room.code,from_id:u.id,to_id:toId,suspect,weapon,room:rm});
  return ok();
}
