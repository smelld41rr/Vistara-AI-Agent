import { readFile,readdir,writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const excluded=new Set(['.git','node_modules','.wxt','.output','release','work']);const files=[];const findings=[];
const patterns=[['Google API literal',/\bAIza[0-9A-Za-z_-]{30,}\b/],['Groq key literal',/\bgsk_[0-9A-Za-z_-]{28,}\b/],['GitHub token literal',/\b(?:gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{40,})\b/],['OpenAI key literal',/\bsk-(?:proj-)?[0-9A-Za-z_-]{32,}\b/],['AWS access identifier',/\bAKIA[0-9A-Z]{16}\b/],['Private key block',/^\s*-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s*$/m]];
function scan(path,text){for(const [name,pattern]of patterns)if(pattern.test(text))findings.push({path,category:name});}
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(excluded.has(entry.name))continue;const path=join(dir,entry.name);if(entry.name.startsWith('.env')||/^(?:credentials|secrets)\.(?:json|ya?ml|txt)$/i.test(entry.name)){findings.push({path,category:'Forbidden credential filename'});continue;}if(entry.isDirectory())await walk(path);else if(/\.(?:[cm]?js|tsx?|json|md|html|css|txt)$/.test(path)){files.push(path);scan(path,await readFile(path,'utf8'));}}}
await walk('.');
const revisions=spawnSync('git',['rev-list','HEAD'],{encoding:'utf8'});if(revisions.status!==0)throw new Error('Git history could not be inspected.');
let historyCommits=0;
for(const revision of revisions.stdout.trim().split('\n').filter(Boolean)){const diff=spawnSync('git',['show','--format=','--no-ext-diff',revision],{encoding:'utf8',maxBuffer:20_000_000});if(diff.status!==0)throw new Error('Could not scan history diff');scan('git:'+revision,diff.stdout.replace(/^\+/gm,''));historyCommits++;}
const pending=spawnSync('git',['diff','HEAD','--no-ext-diff'],{encoding:'utf8',maxBuffer:20_000_000});if(pending.status!==0)throw new Error('Could not scan pending diff');scan('git:pending',pending.stdout.replace(/^\+/gm,''));
const report={status:findings.length?'FAILED':'PASS',sourceAndReportFiles:files.length,historyCommits,pendingDiffScanned:true,findings,limits:'Heuristic credential-pattern/filename scan, not a proof that every possible secret or personal fact is absent. Test-only synthetic credentials are intentional; source excludes actual profiles, credentials, caches and .env.'};
await writeFile('docs/m2-security-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(findings.length)process.exitCode=1;
