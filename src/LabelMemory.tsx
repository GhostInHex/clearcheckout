import {useEffect,useRef} from 'react';
import {mountLabelMemory} from '../shared/label-memory.js';
export default function LabelMemory({announce}:{announce:(message:string)=>void}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(host.current)return mountLabelMemory(host.current,document,announce);},[announce]);
 return <div ref={host} data-clearcheckout-panel/>;
}
