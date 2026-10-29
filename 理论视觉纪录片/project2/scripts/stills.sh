#!/bin/sh
# 用法：sh scripts/stills.sh 帧号... → out/qa/s<帧号>.jpg，并拼成 out/qa/sheet*.jpg
mkdir -p out/qa
for fr in "$@"; do npx remotion still TimeIsNotUniform out/qa/s$fr.jpg --frame=$fr --image-format=jpeg --log=error; done
