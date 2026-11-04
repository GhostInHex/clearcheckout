import {randomUUID} from 'node:crypto';
const RESERVATION=50000;
export function createLedger(db,config) {
  db.exec(`CREATE TABLE IF NOT EXISTS ai_calls(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,cache_key TEXT NOT NULL,created INTEGER NOT NULL,reserved INTEGER NOT NULL,status TEXT NOT NULL,text TEXT,input_tokens INTEGER,output_tokens INTEGER);
    CREATE TABLE IF NOT EXISTS ai_safety(id INTEGER PRIMARY KEY CHECK(id=1),blocked INTEGER NOT NULL);
    INSERT OR IGNORE INTO ai_safety VALUES(1,0);`);
  function fail(status,message){throw Object.assign(new Error(message),{status});}
  const reserve=db.transaction((userId,cacheKey)=>{
    const cached=db.prepare("SELECT text FROM ai_calls WHERE user_id=? AND cache_key=? AND status='complete'").get(userId,cacheKey);
    if(cached) return {cached:cached.text};
    if(db.prepare('SELECT blocked FROM ai_safety WHERE id=1').get().blocked) fail(503,'Meta AI is paused because usage could not be verified.');
    const totals=db.prepare('SELECT COUNT(*) AS calls,COALESCE(SUM(reserved),0) AS spent FROM ai_calls').get();
    if(totals.calls>=config.callLimit || totals.spent+RESERVATION>config.budgetMicros) fail(429,'The app’s Meta AI allowance is exhausted. Checkout still works.');
    if(db.prepare('SELECT id FROM ai_calls WHERE user_id=? AND created>?').get(userId,Date.now()-30000)) fail(429,'Please wait 30 seconds before asking Meta AI again.');
    const id=randomUUID();
    db.prepare("INSERT INTO ai_calls(id,user_id,cache_key,created,reserved,status) VALUES(?,?,?,?,?,'reserved')").run(id,userId,cacheKey,Date.now(),RESERVATION);
    return {id};
  });
  return reserve;
}
