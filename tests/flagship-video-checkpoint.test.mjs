import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateClipSpec,initialCheckpointState,advanceCheckpoint,serializeCheckpointDraft,restoreCheckpointDraft} from '../scripts/flagship-video-checkpoint.mjs';
const spec={lessonId:'inside-the-cell',clipId:'cell-video-01',contentVersion:'4.2.0',
  contentSha256:'a'.repeat(64),durationSeconds:60,
  checkpoints:[{id:'oxygen-check',atSeconds:20},{id:'mitochondria-check',atSeconds:45}]};
function step(state,type,props={}){return advanceCheckpoint(spec,state,{type,...props});}
test('spec rejects duplicate, unsorted, missing, out-of-range checkpoints and invalid identity',()=>{
  assert.equal(validateClipSpec(spec).checkpoints.length,2);
  for(const changes of [
    {checkpoints:[{id:'a',atSeconds:40},{id:'b',atSeconds:20}]},
    {checkpoints:[{id:'a',atSeconds:20},{id:'a',atSeconds:40}]},
    {checkpoints:[{id:'a',atSeconds:60}]},
    {checkpoints:[]}, {contentSha256:'not-a-hash'}, {contentVersion:'draft'},
    {lessonId:'../secrets'}, {durationSeconds:0}]) {
    assert.throws(()=>validateClipSpec({...spec,...changes}));
  }
});
test('video crossing a checkpoint pauses exactly at boundary and blocks premature end',()=>{
  let state=initialCheckpointState(spec);
  assert.equal(step(state,'TIME',{seconds:60}).state.phase,'ready');
  assert.deepEqual(step(state,'SEEK',{seconds:59}).effects,{pause:true,seekTo:0});
  state=step(state,'PLAY').state;
  let result=step(state,'TIME',{seconds:31});
  assert.equal(result.state.phase,'question');
  assert.deepEqual(result.effects,{pause:true,seekTo:20,showCheckpoint:'oxygen-check'});
  state=result.state;
  assert.equal(step(state,'ENDED').state.phase,'question');
  assert.equal(step(state,'CONTINUE').state.phase,'question');
  assert.equal(step(state,'SEEK',{seconds:59}).effects.seekTo,20);
  state=step(state,'FEEDBACK_PRESENTED').state;
  assert.equal(state.phase,'feedback');
  assert.equal(step(state,'TIME',{seconds:60}).state.phase,'feedback');
  state=step(state,'CONTINUE').state;
  assert.equal(state.nextCheckpoint,1);
  assert.equal(step(state,'SEEK',{seconds:59}).effects.seekTo,45);
  state=step(state,'TIME',{seconds:60}).state;
  assert.equal(state.phase,'question');
  state=step(state,'FEEDBACK_PRESENTED').state;
  state=step(state,'CONTINUE').state;
  assert.equal(step(state,'ENDED').state.phase,'complete');
});
test('replay is optional, loops to explanation at boundary and does not skip question',()=>{
  let state=step(step(initialCheckpointState(spec),'PLAY').state,'TIME',{seconds:20}).state;
  state=step(state,'FEEDBACK_PRESENTED').state;
  let result=step(state,'REPLAY');
  assert.deepEqual(result.effects,{seekTo:0,play:true});
  state=step(result.state,'TIME',{seconds:10}).state;
  assert.equal(state.phase,'replay');
  state=step(state,'TIME',{seconds:30}).state;
  assert.equal(state.phase,'feedback');
  assert.equal(state.seconds,20);
  assert.equal(step(state,'REPLAY').state.phase,'replay');
  assert.equal(step(step(state,'REPLAY').state,'RETURN').state.phase,'feedback');
});
test('draft round-trip is content-version and hash bound and rejects forged progression',()=>{
  let state=step(initialCheckpointState(spec),'PLAY').state;
  state=step(state,'TIME',{seconds:20}).state;
  state=step(state,'FEEDBACK_PRESENTED').state;
  const draft=serializeCheckpointDraft(spec,state);
  assert.deepEqual(restoreCheckpointDraft(spec,draft),state);
  assert.equal(restoreCheckpointDraft({...spec,contentVersion:'4.2.1'},draft).phase,'ready');
  assert.equal(restoreCheckpointDraft({...spec,contentSha256:'b'.repeat(64)},draft).phase,'ready');
  assert.equal(restoreCheckpointDraft(spec,'{broken').phase,'ready');
  assert.equal(restoreCheckpointDraft(spec,'x'.repeat(5000)).phase,'ready');
  assert.equal(restoreCheckpointDraft(spec,JSON.stringify({...state,phase:'complete'})).phase,'ready');
  assert.equal(restoreCheckpointDraft(spec,JSON.stringify({...state,answers:['secret']})).answers,undefined);
});
test('invalid event values, unsafe state and unknown events fail closed',()=>{
  const state=step(initialCheckpointState(spec),'PLAY').state;
  assert.throws(()=>step(state,'TIME',{seconds:NaN}),/Invalid media time/);
  assert.throws(()=>step(state,'SEEK',{seconds:-1}),/Invalid seek time/);
  assert.throws(()=>step(state,'SOMETHING_ELSE'),/Unknown checkpoint event/);
  assert.throws(()=>step({...state,feedbackCount:2},'TIME',{seconds:10}),/Unreviewed checkpoint skipped/);
  assert.throws(()=>step({...state,seconds:50},'TIME',{seconds:50}),/Unreviewed checkpoint skipped/);
});
