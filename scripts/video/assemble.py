import json
import pathlib
import subprocess
import textwrap

root = pathlib.Path('artifacts/submission')
chapters = json.loads((root / 'chapters.json').read_text())

def run(args):
    subprocess.run(args, check=True)

def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)]))

def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'

captions = []
transcript = []
offset = 0
for i, chapter in enumerate(chapters):
    name = chapter['name']
    text = chapter['narration']
    wav = root / f'{name}.wav'
    txt = root / f'{name}.txt'
    txt.write_text(text)
    run(['espeak-ng', '-v', 'en-us', '-s', '205', '-f', str(txt), '-w', str(wav)])
    length = max(duration(wav) + 0.8, chapter['end'] - chapter['start'])
    pieces = textwrap.wrap(text, 100, break_long_words=False)
    local = []
    for j, piece in enumerate(pieces):
        start = j * (length - 0.5) / len(pieces)
        end = (j + 1) * (length - 0.5) / len(pieces)
        lines = '\n'.join(textwrap.wrap(piece, 62))
        local.append(f'{j+1}\n{stamp(start)} --> {stamp(end)}\n{lines}\n')
        captions.append(f'{len(captions)+1}\n{stamp(offset+start)} --> {stamp(offset+end)}\n{lines}\n')
    srt = root / f'{name}.srt'
    srt.write_text('\n'.join(local))
    target = root / f'{name}.mp4'
    filters = f"trim=duration={max(0.5,chapter['end']-chapter['start']-0.7)},setpts=PTS-STARTPTS,scale=1152:810,pad=1280:900:64:0:color=0x101820,fps=30,tpad=stop_mode=clone:stop=-1,subtitles={srt}:force_style='FontName=DejaVu Sans,FontSize=8,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101820,BorderStyle=3,Outline=1,MarginV=4'"
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(chapter['start']), '-i', str(root/'raw.webm'), '-i', str(wav), '-vf', filters, '-af', 'apad', '-t', str(length), '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-ac', '2', str(target)])
    transcript.append(f'{stamp(offset)} {name}\n{text}\n')
    offset += length
    print(name, length, flush=True)
(root/'captions.srt').write_text('\n'.join(captions))
(root/'transcript.txt').write_text('\n'.join(transcript))
(root/'concat.txt').write_text('\n'.join(f"file '{c['name']}.mp4'" for c in chapters))
run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(root/'concat.txt'), '-c', 'copy', '-movflags', '+faststart', str(root/'clearcheckout-submission.mp4')])
print('Total seconds', offset)
