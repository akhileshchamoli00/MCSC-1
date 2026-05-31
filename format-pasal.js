const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'translations.ts');
let text = fs.readFileSync(filePath, 'utf8');

// The Chinese content string starts with "PERATURAN PEMERINTAH REPUBLIK INDONESIA\\nNOMOR 20 TAHUN 2026"
let parts = text.split('content: "PERATURAN PEMERINTAH REPUBLIK INDONESIA\\nNOMOR 20 TAHUN 2026\\n\\nTENTANG\\n\\nPERUBAHAN ATAS PERATURAN PEMERINTAH NOMOR 55 TAHUN 2022');

console.log("Found " + (parts.length - 1) + " occurrences of the Chinese content string.");

for (let p = 1; p < parts.length; p++) {
    // Find where this string literal ends (next unescaped quote)
    let endQuoteIndex = parts[p].indexOf('",\n');
    if (endQuoteIndex === -1) endQuoteIndex = parts[p].indexOf('",\r\n');
    if (endQuoteIndex === -1) endQuoteIndex = parts[p].indexOf('"\n');
    if (endQuoteIndex === -1) endQuoteIndex = parts[p].indexOf('"\r\n');
    
    let contentStr = parts[p].substring(0, endQuoteIndex);
    
    // Now we split the string by literal \n
    let lines = contentStr.split('\\n');
    let formattedLines = [];
    let currentLevel = 0; // 0 = root, 1 = a.,b., 2 = 1.,2.

    let inPasal56to59 = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line.includes('Pasal 56')) inPasal56to59 = true;
        if (line.includes('Pasal II')) inPasal56to59 = false;

        if (!inPasal56to59) {
            formattedLines.push(line);
            continue;
        }

        let trimmed = line.trim();
        // Check for literal tabs or spaces
        let isAlpha = /^[a-z]\.\s/.test(trimmed) || /^[a-z]\.\t/.test(trimmed);
        let isNumSub = /^[0-9]+\.\s/.test(trimmed) || /^[0-9]+\.\t/.test(trimmed);
        let isNumMain = /^\([0-9]+\)\s/.test(trimmed) || /^\([0-9]+\)\t/.test(trimmed);
        let isRoot = isNumMain || trimmed.startsWith('Pasal') || /^[0-9]+\.\s*Ketentuan/.test(trimmed) || /^[0-9]+\.\tKetentuan/.test(trimmed) || /^[0-9]+\.\s*Pasal/.test(trimmed) || /^[0-9]+\.\tPasal/.test(trimmed);

        if (isAlpha) trimmed = trimmed.replace(/^([a-z]\.)[\s\t]+/, '$1 ');
        if (isNumSub) trimmed = trimmed.replace(/^([0-9]+\.)[\s\t]+/, '$1 ');
        if (isNumMain) trimmed = trimmed.replace(/^(\([0-9]+\))[\s\t]+/, '$1 ');

        if (isRoot) {
            currentLevel = 0;
        }

        if (isAlpha) {
            if (currentLevel === 0) {
                formattedLines.push('');
                currentLevel = 1;
            }
            line = '  ' + trimmed;
        } else if (isNumSub && currentLevel >= 1) {
            if (currentLevel === 1) {
                formattedLines.push('');
                currentLevel = 2;
            }
            line = '    ' + trimmed;
        } else if (isRoot) {
            line = trimmed;
        } else if (trimmed !== '') {
            if (currentLevel === 1) {
                if (trimmed.startsWith('yang menerima') || trimmed.startsWith('sebagaimana dimaksud')) {
                     currentLevel = 0;
                     line = trimmed;
                } else {
                     line = '  ' + trimmed;
                }
            } else if (currentLevel === 2) {
                line = '    ' + trimmed;
            } else {
                line = trimmed;
            }
        } else {
            line = '';
        }

        formattedLines.push(line);
    }

    let formattedContent = formattedLines.join('\\n');
    parts[p] = formattedContent + parts[p].substring(endQuoteIndex);
}

if (parts.length > 1) {
    let newText = parts.join('content: "PERATURAN PEMERINTAH REPUBLIK INDONESIA\\nNOMOR 20 TAHUN 2026\\n\\nTENTANG\\n\\nPERUBAHAN ATAS PERATURAN PEMERINTAH NOMOR 55 TAHUN 2022');
    fs.writeFileSync(filePath, newText, 'utf8');
    console.log("Successfully formatted and updated translations.ts for Chinese");
}
