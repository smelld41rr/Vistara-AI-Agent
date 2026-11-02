import { spawnSync } from 'node:child_process';
const audit=spawnSync(process.execPath,['scripts/audit.mjs'],{stdio:'inherit'});if(audit.status!==0)process.exit(audit.status??1);
const script=String.raw`
from pathlib import Path
import zipfile,hashlib,json,re
root=Path.cwd(); release=root/'release';release.mkdir(exist_ok=True)
built=root/'.output/chrome-mv3'
chrome=release/'Vistara-AI-Chrome.zip';source=release/'Vistara-AI-Source.zip'
def write_zip(target,entries):
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
  for file,name in sorted(entries,key=lambda x:str(x[1])):
   if file.is_symlink():raise RuntimeError('Symlink refused: '+str(file))
   z.write(file,str(name))
write_zip(chrome,[(p,p.relative_to(built)) for p in built.rglob('*') if p.is_file()])
exclude={'.git','node_modules','.output','.wxt','release','work','attachments','__pycache__','.cache'}
entries=[]
for p in root.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(root)
 if any(x in exclude for x in rel.parts) or p.name.startswith('.env') or p.suffix in {'.log','.pyc'}:continue
 entries.append((p,rel))
write_zip(source,entries)
report=[]
for file in [chrome,source]:
 with zipfile.ZipFile(file) as z:
  assert z.testzip() is None
  names=z.namelist()
  assert all(not n.startswith('/') and '..' not in Path(n).parts for n in names)
  assert all(not any(x in exclude for x in Path(n).parts) and not Path(n).name.startswith('.env') for n in names)
  if file==chrome:
   assert 'manifest.json' in names
   m=json.loads(z.read('manifest.json'))
   assert m['manifest_version']==3 and 'host_permissions' not in m
   assert all(v.lstrip('/') in names for v in m['icons'].values())
  else:assert 'src/core/controller.ts' in names and 'package-lock.json' in names and 'docs/TEST_REPORT.md' in names
  hits=[]
  for n in names:
   if Path(n).suffix not in {'.ts','.tsx','.js','.json','.md','.html','.css','.mjs'}:continue
   s=z.read(n).decode('utf-8',errors='replace')
   if re.search(r'\b(?:AIza[\w-]{28,}|gsk_[\w-]{28,}|sk-[\w-]{28,})\b',s):hits.append(n)
  assert not hits, 'Credential-shaped literals: '+str(hits)
 report.append({'file':file.name,'bytes':file.stat().st_size,'entries':len(names),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'archiveIntegrity':'PASS','secretPatternScan':'PASS'})
(release/'SHA256SUMS.txt').write_text('\n'.join(r['sha256']+'  '+r['file'] for r in report)+'\n')
(release/'archive-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
`;
const result=spawnSync('python',['-c',script],{stdio:'inherit'});process.exit(result.status??1);
