import {admin,ctx,fail,ok} from "@/lib/admin";
export async function POST(req){
  const c=await ctx(req);if(c.err)return c.err;const {u,body,room}=c;
  const text=String(body.text||"").trim().slice(0,200);
  if(!text)return fail("Escribe una respuesta");
  const {data:q}=await admin.from("questions").select("*").eq("id",body.questionId).eq("room_code",room.code).maybeSingle();
  if(!q||q.to_id!==u.id||q.answered)return fail("No puedes responder esta pregunta",403);
  await admin.from("answers").insert({question_id:q.id,room_code:room.code,asker_id:q.from_id,text});
  await admin.from("questions").update({answered:true}).eq("id",q.id);
  return ok();
}
