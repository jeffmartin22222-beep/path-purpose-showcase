import fs from 'node:fs';
const file='catalog/approved.json';
const data=JSON.parse(fs.readFileSync(file,'utf8'));
if(data.schemaVersion!=='1.0.0'||!Array.isArray(data.lessons)) throw Error('Invalid catalog');
const ids=new Set();
for(const lesson of data.lessons){
 for(const key of ['id','title','grade','subject','course','unit','version','entry']) if(typeof lesson[key]!=='string'||!lesson[key].trim()) throw Error('Missing '+key);
 if(ids.has(lesson.id)) throw Error('Duplicate ID '+lesson.id); ids.add(lesson.id);
 if(!/^lessons\/[a-zA-Z0-9/_-]+\.html$/.test(lesson.entry)||!fs.existsSync(lesson.entry)) throw Error('Missing or unsafe lesson entry '+lesson.entry);
 for(const key of ['content','pedagogy','technical','experience']){
  const pass=lesson.qa?.[key];
  if(pass?.status!=='passed'||!Array.isArray(pass.evidence)||!pass.evidence.length||pass.evidence.some(x=>typeof x!=='string'||!x.trim())) throw Error('Missing QA evidence '+lesson.id+':'+key);
 }
}
console.log('Catalog structure and evidence references validated:',data.lessons.length,'lessons. Evidence authenticity and device tests require separate verification.');
