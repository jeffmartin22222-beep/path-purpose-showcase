// Pure, version-bound video checkpoint navigation for an UNAPPROVED flagship prototype.
// No media, answer keys, grades, student records, or authentication are stored here.
// A client-side state machine is NOT a secure assessment or mastery authority.
export const DRAFT_SCHEMA_VERSION = 1;
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hashPattern = /^[a-f0-9]{64}$/;
const phases = new Set(['ready','playing','question','feedback','replay','complete']);
const finiteTime = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function validateClipSpec(input) {
  if (!input || typeof input !== 'object') throw new Error('Missing clip specification');
  for (const key of ['lessonId','clipId']) {
    if (typeof input[key] !== 'string' || !idPattern.test(input[key]))
      throw new Error('Invalid '+key);
  }
  if (typeof input.contentVersion !== 'string' || !/^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.-]+)?$/.test(input.contentVersion))
    throw new Error('Invalid content version');
  if (!hashPattern.test(input.contentSha256 || '')) throw new Error('Invalid content hash');
  if (!finiteTime(input.durationSeconds) || input.durationSeconds <= 0)
    throw new Error('Invalid clip duration');
  if (!Array.isArray(input.checkpoints) || !input.checkpoints.length || input.checkpoints.length > 12)
    throw new Error('Invalid checkpoint list');
  const ids = new Set();
  let last = 0;
  const checkpoints = input.checkpoints.map(item => {
    if (!item || typeof item.id !== 'string' || !idPattern.test(item.id) || ids.has(item.id) ||
        !finiteTime(item.atSeconds) || item.atSeconds <= last || item.atSeconds >= input.durationSeconds)
      throw new Error('Invalid checkpoint ordering or identity');
    ids.add(item.id);
    last = item.atSeconds;
    return Object.freeze({id:item.id,atSeconds:item.atSeconds});
  });
  return Object.freeze({lessonId:input.lessonId,clipId:input.clipId,
    contentVersion:input.contentVersion,contentSha256:input.contentSha256,
    durationSeconds:input.durationSeconds,checkpoints:Object.freeze(checkpoints)});
}

export function initialCheckpointState(spec) {
  const s = validateClipSpec(spec);
  return {schemaVersion:DRAFT_SCHEMA_VERSION,lessonId:s.lessonId,clipId:s.clipId,
    contentVersion:s.contentVersion,contentSha256:s.contentSha256,
    phase:'ready',nextCheckpoint:0,seconds:0,feedbackCount:0};
}

function assertState(spec,state) {
  const s = validateClipSpec(spec);
  if (!state || typeof state !== 'object' || state.schemaVersion !== DRAFT_SCHEMA_VERSION ||
      state.lessonId !== s.lessonId || state.clipId !== s.clipId ||
      state.contentVersion !== s.contentVersion || state.contentSha256 !== s.contentSha256 ||
      !phases.has(state.phase) || !Number.isInteger(state.nextCheckpoint) ||
      state.nextCheckpoint < 0 || state.nextCheckpoint > s.checkpoints.length ||
      !Number.isInteger(state.feedbackCount) || state.feedbackCount < 0 ||
      state.feedbackCount > s.checkpoints.length || !finiteTime(state.seconds) ||
      state.seconds > s.durationSeconds) throw new Error('Invalid or stale checkpoint state');
  const n = state.nextCheckpoint, p = state.phase, count = s.checkpoints.length;
  if (p === 'ready' && (n !== 0 || state.seconds !== 0 || state.feedbackCount !== 0))
    throw new Error('Invalid ready state');
  if (p === 'complete' && (n !== count || state.feedbackCount !== count || state.seconds !== s.durationSeconds))
    throw new Error('Invalid complete state');
  if (p === 'playing' && (state.feedbackCount !== n ||
      (n < count && state.seconds > s.checkpoints[n].atSeconds)))
    throw new Error('Unreviewed checkpoint skipped');
  if (['question','feedback','replay'].includes(p)) {
    if (n === count || state.feedbackCount !== n + (p === 'question' ? 0 : 1) ||
        state.seconds > s.checkpoints[n].atSeconds)
      throw new Error('Invalid checkpoint phase');
    if (p !== 'replay' && state.seconds !== s.checkpoints[n].atSeconds)
      throw new Error('Checkpoint is not paused at its boundary');
  }
  return s;
}

// Returns effects for a video adapter to execute. The caller MUST actually pause/seek
// the HTMLMediaElement; these effects do not prove that playback occurred.
export function advanceCheckpoint(spec,state,event) {
  const s = assertState(spec,state);
  if (!event || typeof event.type !== 'string') throw new Error('Invalid checkpoint event');
  const current = s.checkpoints[state.nextCheckpoint];
  const unchanged = () => ({state:{...state},effects:{}});
  switch (event.type) {
    case 'RESET': return {state:initialCheckpointState(s),effects:{pause:true,seekTo:0}};
    case 'PLAY':
      return state.phase === 'ready' ? {state:{...state,phase:'playing'},effects:{play:true}} : unchanged();
    case 'SEEK': {
      if (!finiteTime(event.seconds)) throw new Error('Invalid seek time');
      const limit = current ? current.atSeconds : s.durationSeconds;
      const target = Math.min(event.seconds,limit);
      if (state.phase === 'ready')
        return {state:{...state},effects:{pause:true,seekTo:0}};
      if (['question','feedback'].includes(state.phase))
        return {state:{...state},effects:{pause:true,seekTo:limit}};
      if (state.phase === 'complete') return {state:{...state},effects:{pause:true,seekTo:s.durationSeconds}};
      return {state:{...state,seconds:target},effects:{seekTo:target}};
    }
    case 'TIME':
    case 'ENDED': {
      const time = event.type === 'ENDED' ? s.durationSeconds : event.seconds;
      if (!finiteTime(time)) throw new Error('Invalid media time');
      if (state.phase === 'replay') {
        if (time >= current.atSeconds)
          return {state:{...state,phase:'feedback',seconds:current.atSeconds},
            effects:{pause:true,seekTo:current.atSeconds}};
        return {state:{...state,seconds:Math.min(time,current.atSeconds)},effects:{}};
      }
      if (state.phase !== 'playing') return unchanged();
      if (current && time >= current.atSeconds)
        return {state:{...state,phase:'question',seconds:current.atSeconds},
          effects:{pause:true,seekTo:current.atSeconds,showCheckpoint:current.id}};
      if (!current && time >= s.durationSeconds)
        return {state:{...state,phase:'complete',seconds:s.durationSeconds},effects:{pause:true}};
      return {state:{...state,seconds:Math.min(time,s.durationSeconds)},effects:{}};
    }
    case 'FEEDBACK_PRESENTED':
      // UI-only evidence of a displayed explanation, NOT a grade or verified answer.
      if (state.phase !== 'question') return unchanged();
      return {state:{...state,phase:'feedback',feedbackCount:state.feedbackCount+1},effects:{}};
    case 'REPLAY':
      if (state.phase !== 'feedback') return unchanged();
      return {state:{...state,phase:'replay',seconds:0},effects:{seekTo:0,play:true}};
    case 'RETURN':
      if (state.phase !== 'replay') return unchanged();
      return {state:{...state,phase:'feedback',seconds:current.atSeconds},
        effects:{pause:true,seekTo:current.atSeconds}};
    case 'CONTINUE':
      if (state.phase !== 'feedback') return unchanged();
      return {state:{...state,phase:'playing',nextCheckpoint:state.nextCheckpoint+1},effects:{play:true}};
    default: throw new Error('Unknown checkpoint event');
  }
}

// Tab-scoped, non-authoritative UI draft. Never persist grades, answers or PII here.
export function serializeCheckpointDraft(spec,state) {
  assertState(spec,state);
  return JSON.stringify(state);
}
export function restoreCheckpointDraft(spec,raw) {
  const fallback = initialCheckpointState(spec);
  if (typeof raw !== 'string' || raw.length > 4096) return fallback;
  try {
    const value = JSON.parse(raw);
    assertState(spec,value);
    // Explicit allowlist; never carry arbitrary injected properties into UI state.
    return Object.fromEntries(Object.keys(fallback).map(key=>[key,value[key]]));
  } catch { return fallback; }
}
