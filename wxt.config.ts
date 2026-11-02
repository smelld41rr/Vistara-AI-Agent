import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
 srcDir:'src', modules:['@wxt-dev/module-react'],
 vite:()=>({plugins:[tailwindcss()]}),
 manifest:{name:'Vistara AI',description:'A thoughtful, local-first browser assistant. Your key. Your context. Your control.',minimum_chrome_version:'120',
 permissions:['sidePanel','storage','activeTab','scripting'],
 optional_host_permissions:['https://generativelanguage.googleapis.com/*','https://api.groq.com/*'],
 icons:{16:'/icons/icon16.png',32:'/icons/icon32.png',48:'/icons/icon48.png',128:'/icons/icon128.png'},
 content_security_policy:{extension_pages:"script-src 'self'; object-src 'none'; base-uri 'none'"}}
});
