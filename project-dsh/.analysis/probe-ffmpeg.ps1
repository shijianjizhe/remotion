$FFM = "E:\remotion\project3\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
$enc = & $FFM -hide_banner -encoders 2>&1 | Out-String
Write-Output "--- encoders matching"
$enc.Split([char]10) | Where-Object { $_ -match "aac|pcm_s16le|libmp3|h264" } | ForEach-Object { $_.Trim() }
$f = & $FFM -hide_banner -filters 2>&1 | Out-String
Write-Output "--- filter lines count"
($f.Split([char]10)).Count
Write-Output "--- key filters"
$f.Split([char]10) | Where-Object { $_ -match " hstack | overlay | tile | drawtext | scale | pad | select " } | ForEach-Object { $_.Trim() }
Write-Output "--- muxers"
$m = & $FFM -hide_banner -muxers 2>&1 | Out-String
$m.Split([char]10) | Where-Object { $_ -match "mp4|wav|mov" } | ForEach-Object { $_.Trim() }
