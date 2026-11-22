import {createClient} from "@supabase/supabase-js";
export const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export async function ensureUser(){
  let {data:{session}}=await sb.auth.getSession();
  if(!session){const {data,error}=await sb.auth.signInAnonymously();if(error)throw error;session=data.session;}
  return session;
}
