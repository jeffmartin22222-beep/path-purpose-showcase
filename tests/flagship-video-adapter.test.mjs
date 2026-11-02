import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attachCheckpointVideo} from '../scripts/flagship-video-adapter.mjs';
const spec={lessonId:'inside-the-cell',clipId:'clip-01',contentVersion:'1.0.0',
  contentSha256:'c'.repeat(64),durationSeconds:50,
  checkpoints:[{id:'check-01',atSeconds:20}]};
class FakeVideo extends EventTarget {
  currentTime=0; pauses=0; plays=0;
  pause(){this.pauses++}
  play(){this.plays++;return Promise.resolve()}
  tick(t){this.currentTime=t;this.dispatchEvent(new Event('timeupdate'))}
  seek(t){this.currentTime=t;this.dispatchEvent(new Event('seeking'))}
  end(){this.dispatchEvent(new Event('ended'))}
}
const memory=()=>{
  const map=new Map();return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
};
test('adapter pauses real video control at checkpoint and replays before resuming',()=>{
  const video=new FakeVideo(), seen=[], storage=memory();
  const player=attachCheckpointVideo({video,spec,storage,storageKey:'pp-draft-cell',onCheckpoint:id=>seen.push(id)});
  assert.equal(video.plays,0,'restore must not autoplay');
  const before=video.pauses;video.dispatchEvent(new Event('play'));
  assert.equal(video.pauses,before+1,'native controls cannot start before explicit play');
  player.play();assert.equal(video.plays,1);
  video.tick(25);
  assert.equal(video.currentTime,20);
  assert.equal(player.getState().phase,'question');
  assert.deepEqual(seen,['check-01']);
  video.seek(49);assert.equal(video.currentTime,20);
  const paused=video.pauses;video.dispatchEvent(new Event('play'));
  assert.equal(video.pauses,paused+1,'native controls cannot bypass checkpoint');
  player.presentFeedback();assert.equal(player.getState().phase,'feedback');
  player.replay();assert.equal(video.currentTime,0);
  video.tick(22);assert.equal(player.getState().phase,'feedback');
  player.continueVideo();assert.equal(player.getState().phase,'playing');
  video.end();assert.equal(player.getState().phase,'complete');
  player.destroy();
  assert.throws(()=>player.reset(),/destroyed/);
});
test('adapter restores a version-bound checkpoint without autoplay or leaking answers',()=>{
  const storage=memory(),video=new FakeVideo();
  let player=attachCheckpointVideo({video,spec,storage,storageKey:'pp-draft-cell'});
  player.play();video.tick(21);player.presentFeedback();player.destroy();
  const video2=new FakeVideo();
  player=attachCheckpointVideo({video:video2,spec,storage,storageKey:'pp-draft-cell'});
  assert.equal(player.getState().phase,'feedback');
  assert.equal(video2.currentTime,20);
  assert.equal(video2.plays,0);
  assert.ok(!JSON.stringify(player.getState()).includes('answer'));
  player.destroy();
  const versionChanged={...spec,contentSha256:'d'.repeat(64)};
  const newPlayer=attachCheckpointVideo({video:new FakeVideo(),spec:versionChanged,storage,storageKey:'pp-draft-cell'});
  assert.equal(newPlayer.getState().phase,'ready');
  newPlayer.destroy();
});
test('adapter requires valid video and key and survives disabled storage',()=>{
  assert.throws(()=>attachCheckpointVideo({video:{},spec}),/HTMLMediaElement/);
  assert.throws(()=>attachCheckpointVideo({video:new FakeVideo(),spec,storageKey:'bad'}),/storage key/);
  const storage={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};
  const video=new FakeVideo();
  const player=attachCheckpointVideo({video,spec,storage,storageKey:'pp-draft-cell'});
  player.play();video.tick(20);assert.equal(player.getState().phase,'question');
  player.destroy();
});
