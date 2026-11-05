import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cartRequest,sameReview,type CartSnapshot} from '../shared/merchant-cart.js';
import {cartCapability} from '../shared/merchants.js';
const item={id:'bottle',name:'Trail bottle',quantity:1};
const cart:CartSnapshot={store:'store-b',revision:1,items:[item],total:{amount:1200,currency:'USD',provenance:'client-local'}};
test('removal binds revision, identity, quantity, total and unique selection',()=>{
 const review={cart,item};assert.equal(sameReview(cart,review),true);
 for(const changed of [{...cart,revision:2},{...cart,items:[{...item,name:'Other'}]},{...cart,items:[{...item,quantity:2}]},{...cart,items:[item,item]},{...cart,total:{...cart.total,amount:0}}])assert.equal(sameReview(changed,review),false);
 assert.equal(sameReview(cart,{cart,item:{...item,id:'other'}}),false);
});
test('protocol excludes payment, generic paths, credentials and unsupported origins',()=>{
 for(const value of [{kind:'pay'},{kind:'read',cookies:true},{kind:'remove',path:'/api/pay'}])assert.equal(cartRequest.safeParse(value).success,false);
 assert.equal(cartCapability(new URL('https://unknown.test/demo'),'http://localhost:4319').kind,'navigation-only');
 assert.equal(cartCapability(new URL('http://localhost:4319/payment'),'http://localhost:4319').kind,'navigation-only');
});
