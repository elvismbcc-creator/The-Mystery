import {admin,ctx,fail,ok} from "@/lib/admin";
import {SUSPECTS,WEAPONS,ROOMS} from "@/lib/data";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,body,room}=c;
  if(room.host_id!==u.id)return fail("Solo el anfitrión",403);
  if(room.status!=="lobby")return fail("La partida ya comenzó");
  if(body.reset){
    await admin.from("secrets").delete().eq("room_code",room.code);
    await admin.from("rooms").update({has_envelope:false}).eq("code",room.code);
    return ok();
  }
  const {suspect,weapon,room:rm}=body;
  if(!SUSPECTS.includes(suspect)||!WEAPONS.includes(weapon)||!ROOMS.includes(rm))return fail("Elige las 3 cartas");
  await admin.from("secrets").upsert({room_code:room.code,suspect,weapon,room:rm});
  await admin.from("rooms").update({has_envelope:true}).eq("code",room.code);
  return ok();
}
