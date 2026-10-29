import {writeFileSync} from 'node:fs';
import {expenses,SALARY,after,screenshots} from '../src/data.ts';
import {cues,narration,audioEvents,FPS} from '../src/cues.ts';
writeFileSync('public/audio/cues.json',JSON.stringify({expenses,SALARY,after,screenshots,cues,narration,audioEvents,FPS},null,2));
