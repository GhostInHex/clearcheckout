import {isIPv6} from 'node:net';
import {Address6} from 'ip-address';
const compatible=new Address6('::/96');
export function ipKeyGenerator(ip:string){
 if(!isIPv6(ip))return ip;
 const address=new Address6(ip);
 if(address.isMapped4()||(address.is4()&&address.isInSubnet(compatible)))return address.to4().correctForm();
 return new Address6(`${ip}/56`).networkForm();
}
