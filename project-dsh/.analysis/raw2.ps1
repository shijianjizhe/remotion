$FFM = "E:\remotion\project3\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
$m = & $FFM -hide_banner -muxers 2>&1 | Out-String
Write-Output "--- all muxers"
$m.Split([char]10) | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
