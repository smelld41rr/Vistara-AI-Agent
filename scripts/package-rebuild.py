"""Vistara rebuild release: source allowlist, secret heuristics, ZIP checks, provenance and legal validation."""
from pathlib import Path
import hashlib,json,re,zipfile,shutil,subprocess,argparse
parser=argparse.ArgumentParser();parser.add_argument('--upstream-dir',required=True,type=Path,help='Pristine source directory for the pinned upstream commit');args=parser.parse_args()
root=Path.cwd();up=args.upstream_dir.resolve();assert (up/'LICENSE').is_file(), 'Provide the pristine pinned upstream source'
release=root/'release';release.mkdir(exist_ok=True)
# Sources only: keep previous ignored release/work/cache files and Git data outside the new source archive.
top={'src','entrypoints','public','fixtures','docs','.github','scripts'}
files=[]
for p in root.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(root)
 if any(x in {'.git','node_modules','dist','dist-zip','.output','.wxt','work','release','.cache','coverage','.results','__pycache__'} for x in rel.parts):continue
 if p.name in {'AGENTS.md','CLAUDE.md'}:continue
 if p.name.startswith('.env') or p.suffix in {'.log','.pyc','.pem','.key'}:continue
 if len(rel.parts)>1 and rel.parts[0] not in top:continue
 if p.is_symlink():raise RuntimeError('Source symlink refused: '+str(rel))
 files.append((p,rel))
patterns=[r'\bnvapi-[0-9A-Za-z_-]{20,}\b',r'\bAIza[0-9A-Za-z_-]{30,}\b',r'\bgsk_[0-9A-Za-z_-]{28,}\b',r'\bsk-(?:proj-)?[0-9A-Za-z_-]{32,}\b',r'\bgh[pousr]_[0-9A-Za-z]{30,}\b',r'\bgithub_pat_[0-9A-Za-z_]{40,}\b',r'\bAKIA[0-9A-Z]{16}\b',r'(?m)^\s*-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s*$']
findings=[]
def scan(label,text):
 for pat in patterns:
  if re.search(pat,text):findings.append(label);break
for p,rel in files:
 if p.suffix in {'.ts','.tsx','.js','.mjs','.json','.md','.html','.css','.yaml','.yml','.txt'}:scan(str(rel),p.read_text(errors='replace'))
changes=subprocess.check_output(['git','diff','HEAD','--no-ext-diff'],text=True)
scan('pending Git changes',changes)
for sha in subprocess.check_output(['git','rev-list','HEAD'],text=True).split():scan('Git commit '+sha,subprocess.check_output(['git','show','--format=','--no-ext-diff',sha],text=True,errors='replace').replace('\n+','\n'))
assert not findings,findings
# Assert the deterministic browser-control source was retained, except brand comments/notice and whitespace formatting.
engine_differences=[]
for p in (root/'src/browser-control').rglob('*'):
 if p.is_file():
  old=up/p.relative_to(root)
  if old.exists() and p.suffix in {'.ts','.tsx','.js'}:
   current=re.sub(r'^/\* Vistara AI modification[^\n]*\*/\n','',p.read_text()).replace('Vistara AI','Nanobrowser')
   if re.sub(r'\s+','',current)!=re.sub(r'\s+','',old.read_text()):engine_differences.append(str(p.relative_to(root)))
allowed={'src/browser-control/index.ts','src/browser-control/core/controller.ts','src/browser-control/core/tools/text.ts','src/browser-control/probe/source.ts','src/browser-control/protocol/results.ts'}
assert set(engine_differences)<=allowed,engine_differences
assert (root/'LICENSE').read_bytes()==(up/'LICENSE').read_bytes()
manifest=json.loads((root/'dist/manifest.json').read_text())
assert manifest['manifest_version']==3 and manifest['version']=='0.3.3' and 'debugger' in manifest['permissions']
assert manifest['host_permissions']==['<all_urls>']
assert manifest['options_ui']=={'page':'options.html','open_in_tab':True},manifest.get('options_ui')
for locale in ['en','zh_CN','zh_TW']:assert json.loads((root/f'dist/_locales/{locale}/messages.json').read_text())['extName']['message']=='Vistara AI'
for required in ['LICENSE','NOTICE','THIRD_PARTY_NOTICES.md','background.js','sidepanel.html','options.html','welcome.html']:assert (root/'dist'/required).is_file(),required
# No original-product service destinations in production output. Legal GitHub attribution is permitted.
for p in (root/'dist').rglob('*'):
 if p.is_file() and p.suffix in {'.js','.json','.html','.css'}:
  text=p.read_text(errors='replace');scan('dist/'+str(p.relative_to(root/'dist')),text)
  for forbidden in ['https://nanobrowser.ai','nanobrowser_ai','utm_source=nanobrowser','https://docs.google.com/forms/d/e/1FAIpQLSfWb8EUQ3Z0ey7nJ0ekbwuNPtBq_88M_2eZ4IxUQ8JiyyQhXA','imbddededgmcgfhfpcjmijokokekbkal/reviews']:
   assert forbidden not in text,(str(p),forbidden)
assert not findings,findings
chrome=release/'Vistara-AI-Custom-Providers-Chrome.zip';source=release/'Vistara-AI-Custom-Providers-Source.zip'
shutil.copy2(root/'dist-zip/vistara-ai-0.3.3.zip',chrome)
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED) as z:
 for p,rel in sorted(files,key=lambda f:str(f[1])):z.write(p,str(rel))
artifacts=[]
for p in [chrome,source]:
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  names=z.namelist();assert all(not n.startswith('/') and '..' not in Path(n).parts for n in names)
  assert not any('node_modules' in Path(n).parts or Path(n).name.startswith('.env') for n in names)
  if p==chrome:assert 'manifest.json' in names and json.loads(z.read('manifest.json'))['version']=='0.3.3'
  else:
   for folder in ['src/agent/','src/browser-control/','src/extension/','src/llm/','src/side-panel/','src/store/','src/options/','src/ui/','entrypoints/','fixtures/']:assert any(n.startswith(folder) for n in names),folder
   for name in ['LICENSE','NOTICE','pnpm-lock.yaml','docs/TEST_REPORT.md','docs/NATIVE_VERIFICATION.md','docs/CHANGED_FILES.md']:assert name in names,name
  for name in names:
   if Path(name).suffix in {'.ts','.tsx','.js','.json','.md','.html','.css','.mjs'}:scan(p.name+':'+name,z.read(name).decode(errors='replace'))
 assert not findings,findings
 artifacts.append({'file':p.name,'bytes':p.stat().st_size,'entries':len(names),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'integrity':'PASS'})
report={'status':'PASS','artifacts':artifacts,'sourceFiles':len(files),'upstream':'19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458','browserControlEquivalentAfterBrandNotices':not engine_differences,'reviewedBrowserControlChanges':engine_differences,'apacheLicenseUnchanged':True,'originalServiceDestinationsAbsentFromBuild':True,'sourceHistoryAndZipSecretPatternFindings':findings,'nativeChrome':'BLOCKED/UNVERIFIED','liveProviders':'UNVERIFIED','limits':'Static scans are heuristic; no native/live success is inferred from source or unit tests.'}
(release/'CUSTOM-PROVIDERS-VERIFICATION.json').write_text(json.dumps(report,indent=2)+'\n')
(release/'SHA256SUMS-Custom-Providers.txt').write_text('\n'.join(a['sha256']+'  '+a['file'] for a in artifacts)+'\n')
for src in ['CUSTOM_PROVIDERS_REPORT.md','PROVIDER_PRESETS.md','OLLAMA_SETTINGS_REPORT.md','OLLAMA_SETUP.md','ARGUMENT_FIX_REPORT.md','TEST_REPORT.md','NATIVE_VERIFICATION.md','CHANGED_FILES.md','UPSTREAM_PROVENANCE.md']:shutil.copy2(root/'docs'/src,release/src)
print(json.dumps(report,indent=2))
