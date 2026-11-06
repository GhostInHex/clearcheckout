import {useEffect,useState} from 'react';
export function useGuidedAnnouncements(){
 const [notice,setNotice]=useState('');
 const [speech,setSpeech]=useState(false);
 useEffect(()=>{
  if(!speech||!notice||!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(notice));
  return ()=>window.speechSynthesis.cancel();
 },[notice,speech]);
 return {notice,setNotice,speech,setSpeech};
}
export function GuidedAnnouncements({notice,speech,setSpeech}:Pick<ReturnType<typeof useGuidedAnnouncements>,'notice'|'speech'|'setSpeech'>){
 return <><div data-guided-announcement role="status" aria-live="polite" aria-atomic="true">{notice}</div><label><input type="checkbox" checked={speech} onChange={event=>setSpeech(event.target.checked)}/>Speak guided announcements</label><p>Speech is off each time this store opens. Leave it off when using a screen reader.</p></>;
}
