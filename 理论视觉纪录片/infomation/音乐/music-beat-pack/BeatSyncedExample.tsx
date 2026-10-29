import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {atFrame, getCues, getCueImpact, preImpactEnvelope} from './utils/remotion-beat-sync';

// 使用原曲 85–145 秒：先克制、再在 102.567 秒进入第二主段。
// 注册：<Composition id="BeatDemo" component={BeatSyncedExample}
//   width={1920} height={1080} fps={30} durationInFrames={1800} />
const MUSIC_OFFSET_SEC = 85;
const DURATION_SEC = 60;

export const BeatSyncedExample: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cues = getCues(fps, MUSIC_OFFSET_SEC, Math.round(DURATION_SEC * fps));
  const drops = cues.filter((c) => c.type === 'drop');
  const majorCues = cues.filter((c) => ['drop', 'texture', 'phrase'].includes(c.type));
  const fills = cues.filter((c) => c.type === 'fill');
  const impact = getCueImpact(frame, majorCues, {decay: Math.round(fps * .36)});
  const fillImpact = getCueImpact(frame, fills, {decay: Math.max(3, Math.round(fps * .13))});
  const charge = Math.max(0, ...drops.map((cue) => preImpactEnvelope(frame, cue.frame, Math.round(fps * .35))));
  const scale = 1 - charge * .045 + impact * .11 + fillImpact * .014;
  const glow = 12 + impact * 26 + fillImpact * 5;
  const postHit = impact > .08;

  return <AbsoluteFill style={{background: '#09090B', color: '#D4B267', fontFamily: 'serif'}}>
    <Audio src={staticFile('audio/music.m4a')} startFrom={atFrame(MUSIC_OFFSET_SEC, fps)} volume={0.84} />
    {/* 只在真正的 drop 叠加低音，不要在每一拍上叠加音效。 */}
    {drops.map((cue) => <Sequence key={cue.id} from={cue.frame} durationInFrames={Math.round(fps * 1)}>
      <Audio src={staticFile('audio/sfx/impact.wav')} volume={0.22}/>
    </Sequence>)}
    {fills.map((cue) => <Sequence key={cue.id} from={cue.frame} durationInFrames={Math.round(fps * .2)}>
      <Audio src={staticFile('audio/sfx/tick.wav')} volume={0.13}/>
    </Sequence>)}
    <AbsoluteFill style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div style={{textAlign:'center', transform:`scale(${scale})`,
        filter:`drop-shadow(0 0 ${glow}px rgba(212,178,103,${.13 + impact * .24}))`}}>
        <div style={{fontSize:38, letterSpacing:12, opacity:.65}}>如果放映局</div>
        <div style={{fontSize:110, fontWeight:600, marginTop:44}}>看不见的代价</div>
        <div style={{fontSize:30, opacity:.6, marginTop:24}}>有些选择，代价并不发生在当下。</div>
        <div style={{height:2, width:postHit ? 610 : 230, background:'#D4B267', opacity: .4,
          margin:'52px auto 0'}} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
