import re
import pathlib
import json

# Read extracted markdown
text = pathlib.Path("PMK_28_Extracted.md").read_text(encoding="utf-8")

# Clean up
lines = text.split("\n")
cleaned_lines = []
for line in lines:
    if "intentionally omitted" in line:
        continue
    # Remove heading markers
    line = re.sub(r'^#+\s+', '', line)
    # Remove leading dash for "Menimbang" / "Mengingat"
    line = re.sub(r'^\-\s+(Menimbang|Mengingat)\s*:', r'\1 :', line)
    # Remove page numbers like "- 2 -"
    if re.match(r'^\-\s+\d+\s+\-$', line.strip()):
        continue
    
    cleaned_lines.append(line)

final_text = "\n".join(cleaned_lines)
final_text = re.sub(r'\n{3,}', '\n\n', final_text).strip()

escaped_text = json.dumps(final_text)

ts_path = pathlib.Path("lib/translations.ts")
ts_content = ts_path.read_text(encoding="utf-8")

new_ts = []
in_pmk28 = False
skip_mode = False
for line in ts_content.split('\n'):
    if 'id: "pmk-28-2026"' in line:
        in_pmk28 = True
        new_ts.append(line)
        continue
        
    if in_pmk28:
        if line.strip().startswith('content:'):
            # inject our new content
            new_ts.append(f'          content: {escaped_text},')
            skip_mode = True
            continue
        if skip_mode:
            if re.match(r'^\s*(referenceUrl|downloadUrl|date|},)', line):
                skip_mode = False
                new_ts.append(line)
                if '},' in line:
                    in_pmk28 = False
            continue
        if '},' in line:
            in_pmk28 = False
            new_ts.append(line)
            continue
            
    new_ts.append(line)

ts_path.write_text("\n".join(new_ts), encoding="utf-8")
print("Updated translations.ts")
