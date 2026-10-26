$FFM = "E:\remotion\project3\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
New-Item -ItemType Directory -Force -Path E:\remotion\project-dsh\.analysis\seq | Out-Null
& $FFM -hide_banner -v error -i "E:\remotion\infomation\参考视频\运气的形状.mp4" -r 2 -vf scale=320:180 -y E:\remotion\project-dsh\.analysis\seq\s%03d.png
Write-Output ("frames: " + (Get-ChildItem E:\remotion\project-dsh\.analysis\seq\*.png).Count)
