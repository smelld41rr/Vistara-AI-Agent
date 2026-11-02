import { profileIdentity,type Profile } from './profiles';
export async function profileBinding(profile:Profile,key:string){const bytes=new TextEncoder().encode(profileIdentity(profile)+'\n'+key);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function agentProfileReady(profile:Profile,key:string){return profile.tools&&profile.consent&&profile.diagnostics?.text.status==='pass'&&profile.diagnostics.tools.status==='pass'&&profile.diagnostics.binding===await profileBinding(profile,key);}
