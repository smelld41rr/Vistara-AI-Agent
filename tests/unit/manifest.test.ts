import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
describe('production manifest integrity',()=>{
 it('has only initial permissions and no inferred broad website grant',()=>{
 const m=JSON.parse(readFileSync('.output/chrome-mv3/manifest.json','utf8'));
 expect(m.permissions.sort()).toEqual(['activeTab','scripting','sidePanel','storage'].sort());expect(m.host_permissions).toBeUndefined();expect(m.content_scripts).toBeUndefined();
 expect(m.optional_host_permissions.sort()).toEqual(['http://*/*','https://*/*','https://api.groq.com/*','https://generativelanguage.googleapis.com/*']);
 expect(m.content_security_policy.extension_pages).toContain("script-src 'self'");
 });
});
