param([string]$BrowserExecutable='')
$ErrorActionPreference='Stop'
node --experimental-strip-types scripts/export-cues.ts
if($LASTEXITCODE -ne 0){throw 'Cue export failed'}
npm test
if($LASTEXITCODE -ne 0){throw 'Amount test failed'}
$renderArgs=@('remotion','render','src/index.tsx','Salary8000FlatVector','out/salary-8000/render-intermediate.mp4','--concurrency=4')
if($BrowserExecutable){$renderArgs+="--browser-executable=$BrowserExecutable"}
& npx @renderArgs
if($LASTEXITCODE -ne 0){throw 'Render failed'}
& ./node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe -v error -y -i out/salary-8000/render-intermediate.mp4 -c:v copy -af atrim=duration=26 -c:a aac -b:a 192k -t 26 -movflags +faststart out/salary-8000/salary-8000-final.mp4
if($LASTEXITCODE -ne 0){throw 'Mux failed'}
