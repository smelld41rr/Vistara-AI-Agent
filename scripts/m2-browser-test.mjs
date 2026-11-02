import { chromium } from 'playwright';
import { build } from 'vite';
import { mkdtemp,rm,writeFile,mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import assert from 'node:assert/strict';
import { startServer } from '../tests/browser/server.mjs';
import { installMockChrome } from '../tests/browser/mock-chrome.mjs';
const report={category:'real DOM fixture browser with mocked Chrome tab/permission transport — NOT native extension',checks:[],errors:[],status:'RUNNING'};
const dist=resolve('.output/chrome-mv3');const temporary=await mkdtemp(join(tmpdir(),'vistara-m2-'));const server=await startServer(dist,resolve('tests/fixtures/site'));
let browser;
try{
 await build({configFile:false,logLevel:'error',build:{lib:{entry:resolve('src/features/automation/browser.ts'),formats:['iife'],name:'M2Browser',fileName:()=> 'engine.js'},outDir:temporary,emptyOutDir:true}});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox']});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:900,height:800}});context.on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));
 const pages=new Map();const initial=await context.newPage();pages.set(1,initial);await initial.goto(server.url+'/fixtures/automation.html');
 let activeId=1;let nextId=1;const grants=new Set([new URL(server.url).origin+'/*']);
 async function install(page){await page.evaluate(()=>{if(!window.__actionListeners){window.__actionListeners=[];window.chrome={runtime:{id:'fixture-ext',getURL:p=>'chrome-extension://fixture-ext/'+p,onMessage:{addListener:fn=>window.__actionListeners.push(fn)}}};}});await page.addScriptTag({path:join(dist,'actions.js')});}
 const panel=await context.newPage();await panel.goto(server.url+'/fixtures/article.html');
 await panel.exposeFunction('chromeTransport',async(method,args)=>{
  if(method==='contains')return args[0].origins.every(x=>grants.has(x));
  if(method==='get'){const page=pages.get(args[0]);if(!page)throw new Error('Unknown fixture tab');return {id:args[0],url:page.url(),status:'complete',active:activeId===args[0]};}
  if(method==='update'){const [id,data]=args;const page=pages.get(id);if(data.url)await page.goto(data.url);if(data.active){activeId=id;await page.bringToFront();}return {id,url:page.url(),status:'complete',active:activeId===id};}
  if(method==='create'){const page=await context.newPage();const id=++nextId;pages.set(id,page);await page.goto(args[0].url);activeId=id;return {id,url:page.url(),status:'complete',active:true};}
  if(method==='goBack'){await pages.get(args[0]).goBack();return;}
  if(method==='executeScript'){await install(pages.get(args[0].target.tabId));return [];}
  if(method==='sendMessage'){return pages.get(args[0]).evaluate(message=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Fixture content reply timed out')),13000);for(const fn of window.__actionListeners??[])fn(message,{id:'fixture-ext',url:'chrome-extension://fixture-ext/background.js'},value=>{clearTimeout(timeout);resolve(value);});}),args[1]);}
  throw new Error('Unknown Chrome fixture bridge');
 });
 await panel.addScriptTag({path:join(temporary,'engine.js')});
 await panel.evaluate(()=>{const call=(name)=>(...args)=>window.chromeTransport(name,args);window.chrome={permissions:{contains:call('contains')},tabs:{get:call('get'),update:call('update'),create:call('create'),goBack:call('goBack'),sendMessage:call('sendMessage')},scripting:{executeScript:call('executeScript')}};window.abort=new window.AbortController();window.engine=new window.M2Browser.BrowserEngine(1,window.abort.signal,'Find search and type test query');});
 const execute=call=>panel.evaluate(async c=>window.engine.execute(c),call);
 const approved=async call=>{const pending=await execute(call);assert.equal(pending.status,'approval_required');return panel.evaluate(async p=>window.engine.execute(p.call,p.fingerprint),{call,fingerprint:pending.approval.fingerprint});};
 const find=async query=>{const r=await execute({name:'find_element',arguments:{query}});assert.equal(r.status,'verified',JSON.stringify(r));return r.elements[0].id;};
 async function check(name,fn){await fn();report.checks.push(name);console.log('PASS [M2 fixture, not native]',name);}
 await check('task-local site enrollment required despite existing browser grant',async()=>{await assert.rejects(execute({name:'find_element',arguments:{query:'Search'}}));await panel.evaluate(origin=>window.engine.allow(origin),server.url);});
 await check('find_element and type_text perform actual field edit, no form submit',async()=>{const elementId=await find('Search query');const call={name:'type_text',arguments:{elementId,text:'test query'}};const pending=await execute(call);assert.equal(pending.status,'approval_required');assert.equal(await initial.locator('#search').inputValue(),'');const result=await panel.evaluate(p=>window.engine.execute(p.call,p.token),{call,token:pending.approval.fingerprint});assert.equal(result.status,'verified');assert.equal(await initial.locator('#search').inputValue(),'test query');assert.equal(await initial.evaluate(()=>window.submits),0);});
 await check('select_option verifies actual native dropdown selection',async()=>{const result=await approved({name:'select_option',arguments:{elementId:await find('Region'),value:'us'}});assert.equal(result.status,'verified');assert.equal(await initial.locator('#region').inputValue(),'us');});
 await check('click_element changes actual DOM and inert clicks stay unverified',async()=>{assert.equal((await approved({name:'click_element',arguments:{elementId:await find('Show details')}})).status,'verified');assert.equal(await initial.locator('#output').innerText(),'Details are now visible.');assert.equal((await approved({name:'click_element',arguments:{elementId:await find('Inert action')}})).status,'unverified');});
 await check('sensitive credentials and submit without approval never execute',async()=>{for(const label of ['Password','OTP','Card number']){const result=await execute({name:'type_text',arguments:{elementId:await find(label),text:'test query'}});assert.equal(result.status,'failed');assert.match(result.error,/credential_refused/);}const pending=await execute({name:'click_element',arguments:{elementId:await find('Send message')}});assert.equal(pending.status,'approval_required');assert.equal(await initial.evaluate(()=>window.submits),0);});
 await check('stale element IDs fail after actual DOM replacement',async()=>{const id=await find('Search query');await initial.locator('#replace').click();const result=await execute({name:'type_text',arguments:{elementId:id,text:'test query'}});assert.equal(result.status,'failed');assert.match(result.error,/stale_element/);});
 await check('wait_for_element and open shadow DOM discovery',async()=>{const result=await execute({name:'wait_for_element',arguments:{query:'Delayed control',timeoutMs:3000}});assert.equal(result.status,'verified');assert.ok(await find('Shadow control'));});
 await check('scroll_page and verify_action use actual positions/evidence',async()=>{const result=await execute({name:'scroll_page',arguments:{x:200,y:700}});assert.equal(result.status,'verified');const p=await initial.evaluate(()=>({x:window.scrollX,y:window.scrollY}));assert.ok(p.y>0);assert.ok(p.x>0);const verify=await execute({name:'verify_action',arguments:{}});assert.ok(verify.evidence);});
 await check('open_url and go_back navigate actual fixture browser history after approval',async()=>{assert.equal((await approved({name:'open_url',arguments:{url:server.url+'/fixtures/article.html'}})).status,'verified');assert.match(initial.url(),/article.html/);assert.equal((await approved({name:'go_back',arguments:{}})).status,'verified');assert.match(initial.url(),/automation.html/);});
 await check('open_tab and switch_tab manipulate actual fixture tabs, reject unrelated tabs',async()=>{assert.equal((await approved({name:'open_tab',arguments:{url:server.url+'/fixtures/table.html'}})).status,'verified');assert.equal(pages.size,2);assert.match(pages.get(2).url(),/table.html/);await execute({name:'switch_tab',arguments:{tabId:1}});assert.equal(activeId,1);await assert.rejects(execute({name:'switch_tab',arguments:{tabId:99}}),/tab_out_of_scope/);});
 await check('new origin and permission revocation stop before dispatch',async()=>{await assert.rejects(execute({name:'open_url',arguments:{url:'https://unauthorized.invalid/'}}),/Site access/);grants.clear();await assert.rejects(execute({name:'scroll_page',arguments:{y:100}}),/Site access/);grants.add(new URL(server.url).origin+'/*');});
 await check('cancellation aborts dynamic wait, no later action dispatch',async()=>{const wait=assert.rejects(execute({name:'wait_for_element',arguments:{query:'Never present',timeoutMs:10000}}),/Stopped/);await new Promise(r=>setTimeout(r,80));await panel.evaluate(()=>{window.abort.abort();return window.engine.stop();});await wait;assert.equal(await initial.evaluate(()=>window.submits),0);});

 await check('actual TaskManager + Gemini REST function calls drive real DOM with fresh approval',async()=>{
  await initial.goto(server.url+'/fixtures/automation.html');activeId=1;
  await build({configFile:false,logLevel:'error',build:{lib:{entry:resolve('tests/browser/agent-entry.ts'),formats:['iife'],name:'M2Tasks',fileName:()=> 'manager.js'},outDir:temporary,emptyOutDir:false}});
  grants.add('https://generativelanguage.googleapis.com/*');let modelCalls=0;const requests=[];
  await panel.route('https://generativelanguage.googleapis.com/**',async route=>{
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'POST, GET, OPTIONS'};
   if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
   const body=route.request().postDataJSON();requests.push(body);
   if(body.tools?.[0]?.functionDeclarations?.[0]?.name==='vistara_compatibility_probe'){
    const last=body.contents.at(-1).parts[0];const nonce=last.functionResponse?JSON.parse(last.functionResponse.response.result).nonce:body.contents[0].parts[0].text.match(/nonce ([\w-]+)/)[1];
    const part=last.functionResponse?{text:'Probe '+nonce}:{functionCall:{id:'probe',name:'vistara_compatibility_probe',args:{nonce,value:'ping'}}};
    await route.fulfill({status:200,headers,body:JSON.stringify({candidates:[{content:{parts:[part]},finishReason:'STOP'}]})});return;
   }
   if(!body.tools){await route.fulfill({status:200,headers,body:JSON.stringify({candidates:[{content:{parts:[{text:'Fixture text diagnostic'}]},finishReason:'STOP'}]})});return;}
   const source=body.contents.at(-1).parts[0].text;
   const json=source.slice(source.indexOf('>\n')+2,source.lastIndexOf('\n</UNTRUSTED_PAGE_DATA>'));
   const observation=JSON.parse(json);let part;
   if(modelCalls===0)part={functionCall:{id:'find-1',name:'find_element',args:{query:'Search query'}}};
   else if(modelCalls===1)part={functionCall:{id:'type-1',name:'type_text',args:{elementId:observation.elements.find(x=>x.label==='Search query').id,text:'test query'}}};
   else part={text:'Fixture model report: requested field edit was observed, no submission.'};modelCalls++;
   await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({candidates:[{content:{parts:[part]},finishReason:'STOP'}]})});
  });
  await panel.evaluate(()=>{
   const local={settings:{provider:'gemini',models:{gemini:'fixture-function-model',groq:''},consent:{gemini:true,groq:false},maxSteps:5}};
   const session={'key:gemini':'fixture-agent-key-not-real'};
   const area=values=>({get:async name=>name===null?{...values}:({[name]:values[name]}),set:async data=>Object.assign(values,data)});
   window.chrome.storage={local:area(local),session:area(session)};window.chrome.permissions.onRemoved={addListener:()=>{}};
   window.chrome.tabs.query=async()=>[await window.chrome.tabs.get(1)];
  });
  await panel.addScriptTag({path:join(temporary,'manager.js')});
  await panel.evaluate(async()=>{const hub=new window.M2Tasks.HubManager();const profile=(await window.M2Tasks.getSettings()).hub.profiles[0];const config={...profile};delete config.diagnostics;for(const stage of ['text','tools']){const result=await hub.diagnose({profile:config,stage});if(result.report[stage].status!=='pass')throw new Error(JSON.stringify(result));}});
  const task=await panel.evaluate(async()=>{window.manager=new window.M2Tasks.TaskManager();return window.manager.start({goal:'Find Search query and type test query without submitting',sharePage:true});});
  assert.equal(task.state,'waiting_for_permission');await panel.evaluate(id=>window.manager.control({id,action:'grant'}),task.id);
  const poll=async states=>{const until=Date.now()+12000;while(Date.now()<until){const task=await panel.evaluate(()=>window.manager.get());if(states.includes(task.state))return task;await new Promise(r=>setTimeout(r,40));}throw new Error('Manager fixture timeout: '+JSON.stringify(await panel.evaluate(()=>window.manager.get())));};
  await poll(['waiting_for_approval','failed']);
  let pending=await panel.evaluate(()=>window.manager.get());assert.equal(pending.state,'waiting_for_approval',JSON.stringify(pending));assert.match(pending.pendingApproval.data,/test query/);
  assert.equal(await initial.locator('#search').inputValue(),'');
  await panel.evaluate(id=>window.manager.control({id,action:'approve'}),task.id);
  await poll(['completed','failed','interrupted']);
  const done=await panel.evaluate(()=>window.manager.get());assert.equal(done.state,'completed',JSON.stringify(done));assert.equal(done.trace.length,2);assert.ok(done.trace.every(x=>x.result.status==='verified'));
  assert.equal(await initial.locator('#search').inputValue(),'test query');assert.equal(await initial.evaluate(()=>window.submits),0);
  assert.equal(modelCalls,3);assert.ok(requests.some(body=>body.contents.some(c=>c.parts.some(p=>p.functionResponse?.name==='type_text'))));
  await panel.unroute('https://generativelanguage.googleapis.com/**');
 });
 // Render real production Task UI with only RPC substituted; explicitly separate from controller/DOM tests.
 const ui=await context.newPage();await ui.addInitScript(installMockChrome,{snapshot:{url:server.url,title:'Fixture',text:'Fixture',headings:[],links:[],forms:[],selectedText:'',truncated:false,warnings:[]}});await ui.goto(server.url+'/sidepanel.html');await ui.getByRole('navigation').getByRole('button',{name:'Tasks',exact:true}).click();
 await check('Task UI defaults sharing OFF and fits 320/400/480px',async()=>{assert.equal(await ui.getByRole('checkbox').isChecked(),false);assert.equal(await ui.getByRole('button',{name:'Start task',exact:true}).isDisabled(),true);for(const width of [320,400,480]){await ui.setViewportSize({width,height:900});assert.equal(await ui.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);}await mkdir('screenshots',{recursive:true});await ui.screenshot({path:'screenshots/m2-task-fixture.png',fullPage:true});});

 await check('compiled Agent UI site grant, approval, pause/resume/stop and execution history controls',async()=>{
  await ui.evaluate(origin=>{
   const original=window.chrome.runtime.sendMessage;let task=null;
   window.chrome.runtime.sendMessage=async request=>{
    const {type,payload}=request;let data;
    if(type==='AGENT_GET')data=task;
    else if(type==='AGENT_START'){task={id:'ui-fixture-task',goal:payload.goal,state:'waiting_for_permission',tabId:1,site:origin,step:0,maxSteps:5,requests:0,activeAction:'Waiting',result:'',pendingOrigin:origin,trace:[],startedAt:Date.now(),updatedAt:Date.now()};data=task;}
    else if(type==='AGENT_CONTROL'){
     if(payload.action==='grant'){task.state='waiting_for_approval';delete task.pendingOrigin;task.pendingApproval={fingerprint:'ui-once',site:origin,target:'Search query',data:'type test query',reason:'Review exact field edit'};}
     if(payload.action==='approve'){delete task.pendingApproval;task.state='running';task.step=1;task.trace=[{step:1,call:{name:'type_text',arguments:{elementId:'fixture',text:'test query'}},result:{status:'verified',summary:'Scripted UI evidence only'},time:Date.now()}];}
     if(payload.action==='pause')task.state='paused';if(payload.action==='resume')task.state='running';if(payload.action==='stop'){task.state='stopped';task.result='Stopped by user';}
     data=task;
    }else return original(request);
    return {id:request.id,ok:true,data:window.structuredClone(data)};
   };
  },new URL(server.url).origin);
  await ui.getByLabel('Your goal',{exact:true}).fill('Find Search query and type test query');await ui.getByRole('checkbox').check();await ui.getByRole('button',{name:'Start task',exact:true}).click();
  await ui.getByRole('heading',{name:'Website permission required'}).waitFor();await ui.getByRole('button',{name:'Grant this site',exact:true}).click();
  await ui.getByRole('heading',{name:'Review this exact action'}).waitFor();await ui.getByRole('button',{name:'Approve once',exact:true}).click();
  await ui.getByText('Scripted UI evidence only',{exact:true}).waitFor();await ui.getByRole('button',{name:'Pause',exact:true}).click();await ui.getByRole('button',{name:'Resume',exact:true}).click();await ui.getByRole('button',{name:'Stop now',exact:true}).click();await ui.getByText('Stopped by user',{exact:true}).waitFor();
  assert.equal(await ui.getByRole('button',{name:'Stop now',exact:true}).isDisabled(),true);
  const grant=await ui.evaluate(()=>window.__vistaraMock.requests.find(x=>x.type==='PERMISSION_REQUEST'));assert.deepEqual(grant.payload.origins,[new URL(server.url).origin+'/*']);
  await ui.screenshot({path:'screenshots/m2-task-fixture.png',fullPage:true});
 });
 assert.deepEqual(report.errors,[]);report.status='PASSED';
}catch(error){report.status='FAILED';report.failure=String(error.stack??error);console.error(report.failure);process.exitCode=1;}
finally{await browser?.close();await server.close();await rm(temporary,{recursive:true,force:true});await writeFile('docs/m2-browser-results.json',JSON.stringify(report,null,2)+'\n');console.log('M2 fixture checks:',report.checks.length,report.status);}
