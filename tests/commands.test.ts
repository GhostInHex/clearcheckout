import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCommand,reviewRemoval,confirmRemoval,type ControlledCart} from '../shared/commands.js';
test('only navigation has fuzzy matching; payment and destructive phrases never execute',()=>{
 assert.deepEqual(parseCommand('go to delivry'),{kind:'navigate',destination:'delivery'});
 for(const phrase of ['confirm payment','confirm','pay','remove mug','remove cart','pay cart','confirm cart','go to pay','read totl'])assert.equal(parseCommand(phrase).kind,'unknown',phrase);
 assert.deepEqual(parseCommand('read total'),{kind:'read-total'});
 assert.deepEqual(parseCommand('undo local repair'),{kind:'undo-local-repair'});
});
test('removal review binds exact item, name and revision; repeated confirmation refuses',()=>{
 let cart:ControlledCart={revision:1,items:[{id:'tea',name:'Tea'},{id:'mug',name:'Mug'}],total:'$20'};
 let removed=0;
 const merchant={read:()=>cart,remove:(review:{itemId:string;revision:number})=>{
  if(review.revision!==cart.revision)return false;
  removed++;cart={...cart,revision:cart.revision+1,items:cart.items.filter(item=>item.id!==review.itemId)};return true;
 }};
 const review=reviewRemoval(cart,'tea');assert(review);
 assert.equal(confirmRemoval(merchant,{...review,itemId:'missing'}),false);
 assert.equal(confirmRemoval(merchant,{...review,name:'Mug'}),false);
 assert.equal(confirmRemoval(merchant,{...review,revision:0}),false);
 assert.equal(removed,0);
 assert.equal(confirmRemoval(merchant,review),true);
 assert.equal(confirmRemoval(merchant,review),false);
 assert.equal(removed,1);
 assert.deepEqual(cart.items,[{id:'mug',name:'Mug'}]);
 assert.equal(reviewRemoval({...cart,items:[{id:'x',name:'One'},{id:'x',name:'Two'}]},'x'),null);
});
