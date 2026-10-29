import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {Film} from './Film';
registerRoot(()=> <Composition id="TimeThief" component={Film} durationInFrames={1740} fps={30} width={1080} height={1920}/>);
