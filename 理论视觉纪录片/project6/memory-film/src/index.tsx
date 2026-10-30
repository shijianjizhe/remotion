import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {MemoryFilm} from './MemoryFilm';
import {MemoryFilmV5} from './MemoryFilmV5';
const Root=()=> <><Composition id="MemoryLies" component={MemoryFilm} durationInFrames={2471} fps={30} width={1920} height={1080}/><Composition id="MemoryLiesV5" component={MemoryFilmV5} durationInFrames={4161} fps={30} width={1920} height={1080}/></>;
registerRoot(Root);

