// Browser adapter for the version-bound checkpoint state machine. Development-only.
// Does not ship video, answer keys, grades, or authoritative LMS persistence.
import {advanceCheckpoint,restoreCheckpointDraft,
  serializeCheckpointDraft,validateClipSpec} from './flagship-video-checkpoint.mjs';

export function attachCheckpointVideo({video,spec,storage=null,storageKey=null,
  onState=()=>{},onCheckpoint=()=>{},onPlaybackError=()=>{}}) {
  const clip=validateClipSpec(spec);
  if (!video || typeof video.addEventListener!=='function' ||
      typeof video.removeEventListener!=='function' ||
      typeof video.pause!=='function' || typeof video.play!=='function')
    throw new Error('A real HTMLMediaElement-like video control is required');
  if (storageKey !== null && (typeof storageKey !== 'string' || !storageKey.startsWith('pp-draft-')))
    throw new Error('Invalid draft storage key');
  const read=()=>{try{return storage && storageKey ? storage.getItem(storageKey) : null}catch{return null}};
  let state=restoreCheckpointDraft(clip,read());
  let destroyed=false;
  let applyingSeek=false;
  function persist(){
    try{if(storage && storageKey)storage.setItem(storageKey,serializeCheckpointDraft(clip,state))}
    catch{/* private mode/disabled storage: no progress guarantee */}
  }
  function effect(effects){
    if (effects.pause)video.pause();
    if (effects.seekTo!==undefined) {
      applyingSeek=true;
      try{video.currentTime=effects.seekTo}finally{applyingSeek=false}
    }
    if (effects.showCheckpoint)onCheckpoint(effects.showCheckpoint);
    if (effects.play) {
      try{Promise.resolve(video.play()).catch(onPlaybackError)}catch(error){onPlaybackError(error)}
    }
  }
  function dispatch(type,props={}){
    if(destroyed)throw new Error('Checkpoint adapter destroyed');
    const next=advanceCheckpoint(clip,state,{type,...props});
    state=next.state;
    persist();
    effect(next.effects);
    onState({...state});
    return {...state};
  }
  const time=()=>dispatch('TIME',{seconds:video.currentTime});
  const seek=()=>{
    if(applyingSeek || (['question','feedback'].includes(state.phase) &&
        Math.abs(video.currentTime-state.seconds)<0.001))return;
    dispatch('SEEK',{seconds:video.currentTime});
  };
  const guardPlay=()=>{if(!['playing','replay'].includes(state.phase))video.pause()};
  const end=()=>dispatch('ENDED');
  video.addEventListener('timeupdate',time);
  video.addEventListener('seeking',seek);
  video.addEventListener('play',guardPlay);
  video.addEventListener('ended',end);
  // Restore must never autoplay. In question/feedback, stay paused at checkpoint.
  video.pause();
  if (state.phase==='question'||state.phase==='feedback')video.currentTime=state.seconds;
  else if(state.phase==='replay')video.currentTime=0;
  else video.currentTime=state.seconds;
  onState({...state});
  return Object.freeze({
    getState:()=>({...state}),
    play:()=>{if(state.phase==='ready')return dispatch('PLAY');
      if(state.phase==='playing'){
        try{Promise.resolve(video.play()).catch(onPlaybackError)}catch(error){onPlaybackError(error)}
      }
      return {...state}},
    presentFeedback:()=>dispatch('FEEDBACK_PRESENTED'),
    replay:()=>dispatch('REPLAY'),
    returnToFeedback:()=>dispatch('RETURN'),
    continueVideo:()=>dispatch('CONTINUE'),
    reset:()=>dispatch('RESET'),
    destroy:()=>{if(destroyed)return;destroyed=true;
      video.removeEventListener('timeupdate',time);
      video.removeEventListener('seeking',seek);
      video.removeEventListener('play',guardPlay);
      video.removeEventListener('ended',end)}
  });
}
