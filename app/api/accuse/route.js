import {admin,ctx,fail,ok} from "@/lib/admin";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,body,room,me}=c;
  if(room.status!=="playing")return fail("La partida no está en curso");
  if(!me||me.eliminated)return fail("No puedes acusar",403);
  const {data:s}=await admin.from("secrets").select("*").eq("room_code",room.code).maybeSingle();
  if(!s)return fail("No hay sobre");
  const sol={suspect:s.suspect,weapon:s.weapon,room:s.room};
  const id=Date.now();
  if(s.suspect===body.suspect&&s.weapon===body.weapon&&s.room===body.room){
    await admin.from("rooms").update({status:"finished",winner_name:me.name,solution:sol,last_event:{id,type:"win",name:me.name}}).eq("code",room.code);
    return ok({correct:true});
  }
  await admin.from("players").update({eliminated:true}).eq("room_code",room.code).eq("id",u.id);
  const {count}=await admin.from("players").select("id",{count:"exact",head:true}).eq("room_code",room.code).eq("eliminated",false);
  if(!count)await admin.from("rooms").update({status:"finished",winner_name:null,solution:sol,last_event:{id,type:"lose"}}).eq("code",room.code);
  else await admin.from("rooms").update({last_event:{id,type:"wrong",name:me.name}}).eq("code",room.code);
  return ok({correct:false});
}
