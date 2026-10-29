import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {MemoryFilm} from './MemoryFilm';
const Root=()=> <Composition id="MemoryLies" component={MemoryFilm} durationInFrames={2471} fps={30} width={1920} height={1080}/>;
registerRoot(Root);

