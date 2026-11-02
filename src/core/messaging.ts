/** Runtime onMessage is internal-only; authenticate packaged UI URLs as well as extension ID. */
export function isTrustedUI(sender:{id?:string;url?:string},extensionId:string,root:string):boolean{
 if(sender.id!==extensionId||!sender.url)return false;
 try{const actual=new URL(sender.url);const base=new URL(root);return actual.protocol==='chrome-extension:'&&actual.host===base.host&&['/sidepanel.html','/popup.html'].includes(actual.pathname);}catch{return false;}
}
