import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createService,ServiceError} from '../server/service.js';
import {z} from 'zod';

test('framework-independent service preserves sessions, revisions and ownership across reopen',()=>{
  const dir=mkdtempSync(tmpdir()+'/cc-service-');
  const options={dbPath:dir+'/db.sqlite',aiOptions:{config:{key:'',budgetMicros:0,callLimit:0}}};
  let service=createService(options);
  try {
    const account=service.signup({email:'OWNER@example.com',password:'correctpassword'});
    assert.equal(account.email,'owner@example.com');
    const token=service.issueSession(account.id);
    const stored=z.object({token:z.string()}).parse(service.db.prepare('SELECT token FROM sessions').get());
    assert.equal(stored.token,createHash('sha256').update(token).digest('hex'));
    assert.notEqual(stored.token,token);
    const user=service.authenticate(token);
    assert(user);
    const order=service.createOrder(user);
    assert.throws(()=>service.updateOrder(user,order.id,{type:'confirm',phrase:order.phrase,revision:order.revision,outcome:'success'}),error=>error instanceof ServiceError && error.status===409);
    service.updateOrder(user,order.id,{type:'review'});
    const changed=service.updateOrder(user,order.id,{type:'change',cart:{tea:2,mug:1},delivery:'express'});
    assert.equal(changed.reviewedRevision,null);
    assert.throws(()=>service.updateOrder(user,order.id,{type:'confirm',phrase:order.phrase,revision:order.revision,outcome:'success'}),error=>error instanceof ServiceError && error.status===409);
    const reviewed=service.updateOrder(user,order.id,{type:'review'});
    assert.throws(()=>service.updateOrder(user,order.id,{type:'confirm',phrase:reviewed.phrase+' ',revision:reviewed.revision,outcome:'success'}),error=>error instanceof ServiceError && error.status===409);
    service.updateOrder(user,order.id,{type:'confirm',phrase:reviewed.phrase,revision:reviewed.revision,outcome:'success'});
    const other=service.signup({email:'other@example.com',password:'correctpassword'});
    const otherUser=service.authenticate(service.issueSession(other.id));
    assert(otherUser);
    assert.throws(()=>service.order(otherUser,order.id),error=>error instanceof ServiceError && error.status===404);
    service.db.close();
    service=createService(options);
    const restored=service.authenticate(token);
    assert(restored);
    assert.equal(service.order(restored,order.id).state,'completed_demo');
    service.logout(token);
    assert.equal(service.authenticate(token),undefined);
    const expiring=service.issueSession(restored.id);
    service.db.prepare('UPDATE sessions SET expires=0').run();
    assert.equal(service.authenticate(expiring),undefined);
  } finally {service.db.close();rmSync(dir,{recursive:true,force:true});}
});
