import {NextResponse} from "next/server";
import {admin,userFrom} from "@/lib/admin";
const fail=(error,status)=>NextResponse.json({error},{status});
export async function POST(req){
  const u=await userFrom(req);if(!u)return fail("No autorizado",401);
  const {code,suspect,weapon,room:rm}=await req.json();
  const {data:room}=await admin.from("rooms").select("status").eq("code",code).maybeSingle();
  if(!room||room.status!=="playing")return fail("La partida no está en curso",400);
  const {data:me}=await admin.from("players").select("*").eq("room_code",code).eq("id",u.id).maybeSingle();
  if(!me||me.eliminated)return fail("No puedes acusar",403);
  const {data:s}=await admin.from("secrets").select("*").eq("room_code",code).single();
  const sol={suspect:s.suspect,weapon:s.weapon,room:s.room};
  const id=Date.now();
  if(s.suspect===suspect&&s.weapon===weapon&&s.room===rm){
    await admin.from("rooms").update({status:"finished",winner_name:me.name,solution:sol,last_event:{id,type:"win",name:me.name}}).eq("code",code);
    return NextResponse.json({correct:true});
  }
  await admin.from("players").update({eliminated:true}).eq("room_code",code).eq("id",u.id);
  const {count}=await admin.from("players").select("id",{count:"exact",head:true}).eq("room_code",code).eq("eliminated",false);
  if(!count)await admin.from("rooms").update({status:"finished",winner_name:null,solution:sol,last_event:{id,type:"lose"}}).eq("code",code);
  else await admin.from("rooms").update({last_event:{id,type:"wrong",name:me.name}}).eq("code",code);
  return NextResponse.json({correct:false});
}
