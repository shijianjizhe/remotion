& "E:\remotion\project3\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe" -hide_banner -v error -i "E:\remotion\infomation\参考视频\运气的形状.mp4" -r 1 -vf scale=320:180 -f rawvideo -pix_fmt rgb24 -y E:\remotion\project-dsh\.analysis\ref\seq320x180.raw
Write-Output ("raw bytes: " + (Get-Item E:\remotion\project-dsh\.analysis\ref\seq320x180.raw).Length)
