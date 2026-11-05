import {z} from 'zod';

export const paymentSnapshotSchema=z.object({orderId:z.string().min(1),revision:z.number().int().positive(),amount:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),currency:z.literal('USD'),merchant:z.string().min(1)}).strict().readonly();
export type PaymentSnapshot=z.infer<typeof paymentSnapshotSchema>;
const pending=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('reviewed')}),
  z.object({kind:z.literal('awaitingGesture')}),
  z.object({kind:z.literal('approving')}),
  z.object({kind:z.literal('capturing'),providerId:z.string().min(1)}),
  z.object({kind:z.literal('unknown'),providerId:z.string().min(1).nullable()}),
  z.object({kind:z.literal('paid'),providerId:z.string().min(1)}),
  z.object({kind:z.literal('failed'),providerId:z.string().min(1)}),
  z.object({kind:z.literal('cancelled')}),
]);
export const paymentAttemptSchema=z.object({id:z.string(),requestKey:z.string().min(1).max(160),snapshot:paymentSnapshotSchema,state:pending});
export type PaymentAttempt=z.infer<typeof paymentAttemptSchema>;
export type PaymentState=PaymentAttempt['state'];
export const paymentCommandSchema=z.discriminatedUnion('type',[z.object({type:z.literal('confirm'),revision:z.number().int().positive(),phrase:z.string().max(80)}).strict(),z.object({type:z.literal('gesture')}).strict(),z.object({type:z.literal('cancel')}).strict()]);
export type PaymentCommand=z.infer<typeof paymentCommandSchema>;
export function paymentPhrase(snapshot:PaymentSnapshot){return `CONFIRM ${new Intl.NumberFormat('en-US',{style:'currency',currency:snapshot.currency}).format(snapshot.amount/100)}`;}
export function paymentTransition(attempt:PaymentAttempt,command:PaymentCommand):PaymentState {
  const state=attempt.state;
  switch(command.type){
    case 'confirm':
      if(command.revision!==attempt.snapshot.revision || command.phrase!==paymentPhrase(attempt.snapshot))throw Error('Review and type the exact confirmation phrase.');
      if(state.kind==='awaitingGesture')return state;
      if(state.kind!=='reviewed')throw Error('This attempt cannot be confirmed.');
      return {kind:'awaitingGesture'};
    case 'gesture':
      if(state.kind!=='awaitingGesture')throw Error('Manual confirmation is required before the provider gesture.');
      return {kind:'approving'};
    case 'cancel':
      if(state.kind==='cancelled')return state;
      if(state.kind!=='reviewed' && state.kind!=='awaitingGesture')throw Error('Reconcile provider work before cancellation.');
      return {kind:'cancelled'};
    default:{const exhaustive:never=command;return exhaustive;}
  }
}
