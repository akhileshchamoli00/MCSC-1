const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'translations.ts');
let text = fs.readFileSync(filePath, 'utf8');

// Function to format the block after "Pasal II"
function formatPasalII(contentStr) {
    let lines = contentStr.split('\\n');
    let formattedLines = [];
    let currentLevel = 0; // 0 = root, 1 = a.,b., 2 = 1),2) or 1.,2.

    let inPasalII = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line.includes('Pasal II')) inPasalII = true;

        if (!inPasalII) {
            formattedLines.push(line);
            continue;
        }

        let trimmed = line.trim();
        // Check for literal tabs or spaces
        let isAlpha = /^[a-z]\.\s/.test(trimmed) || /^[a-z]\.\t/.test(trimmed);
        let isNumSub = /^[0-9]+\)\s/.test(trimmed) || /^[0-9]+\)\t/.test(trimmed) || /^[0-9]+\.\s/.test(trimmed) || /^[0-9]+\.\t/.test(trimmed);
        let isNumMain = /^[0-9]+\.\s/.test(trimmed) || /^[0-9]+\.\t/.test(trimmed);
        
        // Distinguish main vs sub for "1." etc based on context, but here root items are "1. Pada saat..." and "2. Peraturan..."
        let isRoot = line.startsWith('Pasal') || line.startsWith('Agar setiap orang') || line.startsWith('Ditetapkan di') || line.startsWith('pada tanggal') || line.startsWith('PRESIDEN') || line.startsWith('ttd.') || line.startsWith('PRABOWO') || line.startsWith('Diundangkan') || line.startsWith('MENTERI') || line.startsWith('REPUBLIK') || line.startsWith('PRASETYO');
        
        // For numbered, let's look at the actual text to be safe
        if (trimmed.startsWith('1. Pada saat') || /^[12]\.\tPada saat/.test(trimmed) || /^[12]\.\tPeraturan Pemerintah/.test(trimmed) || /^[12]\.\sPada saat/.test(trimmed) || /^[12]\.\sPeraturan Pemerintah/.test(trimmed)) {
            isRoot = true;
        }

        if (isAlpha) trimmed = trimmed.replace(/^([a-z]\.)[\s\t]+/, '$1 ');
        if (/^[0-9]+\)\s/.test(trimmed) || /^[0-9]+\)\t/.test(trimmed)) {
            trimmed = trimmed.replace(/^([0-9]+\))[\s\t]+/, '$1 ');
            isNumSub = true;
        } else if (/^[0-9]+\.\s/.test(trimmed) || /^[0-9]+\.\t/.test(trimmed)) {
            // Only sub if not root
            if (!isRoot) {
                trimmed = trimmed.replace(/^([0-9]+\.)[\s\t]+/, '$1 ');
                isNumSub = true;
            }
        }

        if (isRoot) {
            currentLevel = 0;
        }

        if (isAlpha) {
            if (currentLevel === 0) {
                formattedLines.push('');
                currentLevel = 1;
            }
            line = '  ' + trimmed;
        } else if (isNumSub && currentLevel >= 1 && !isRoot) {
            if (currentLevel === 1) {
                formattedLines.push('');
                currentLevel = 2;
            }
            line = '    ' + trimmed;
        } else if (isRoot) {
            line = trimmed;
        } else if (trimmed !== '') {
            if (currentLevel === 1) {
                if (trimmed.startsWith('sepanjang Wajib Pajak') || trimmed.startsWith('sampai dengan Wajib Pajak') || trimmed.startsWith('yang berdasarkan ketentuan')) {
                     // these lines are continuations of 'a.' or 'c.', they should be aligned with alpha
                     line = '  ' + trimmed;
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

    return formattedLines.join('\\n');
}

// Do EN and ID
let parts = text.split('content: "TENTANG\\n\\nPERUBAHAN ATAS PERATURAN PEMERINTAH NOMOR 55 TAHUN 2022');
for (let p = 1; p < parts.length; p++) {
    let endQuoteIndex = parts[p].indexOf('",\n');
    if (endQuoteIndex === -1) endQuoteIndex = parts[p].indexOf('",\r\n');
    
    let contentStr = parts[p].substring(0, endQuoteIndex);
    let formattedContent = formatPasalII(contentStr);
    parts[p] = formattedContent + parts[p].substring(endQuoteIndex);
}
if (parts.length > 1) {
    text = parts.join('content: "TENTANG\\n\\nPERUBAHAN ATAS PERATURAN PEMERINTAH NOMOR 55 TAHUN 2022');
}

// Do CN
let partsCN = text.split('content: "PERATURAN PEMERINTAH REPUBLIK INDONESIA\\nNOMOR 20 TAHUN 2026\\n\\nTENTANG\\n\\nPERUBAHAN ATAS PERATURAN PEMERINTAH NOMOR 55 TAHUN 2022');
for (let p = 1; p < partsCN.length; p++) {
    let endQuoteIndex = partsCN[p].indexOf('",\n');
    if (endQuoteIndex === -1) endQuoteIndex = partsCN[p].indexOf('",\r\n');
    if (endQuoteIndex === -1) endQuoteIndex = partsCN[p].indexOf('"\n');
    if (endQuoteIndex === -1) endQuoteIndex = partsCN[p].indexOf('"\r\n');
    
    let contentStr = partsCN[p].substring(0, endQuoteIndex);
    let formattedContent = formatPasalII(contentStr);
    partsCN[p] = formattedContent + partsCN[p].substring(endQuoteIndex);
}
if (partsCN.length > 1) {
    text = partsCN.join('content: "PERATURAN PEMERINTAH REPUBLIK INDONESIA\\nNOMOR 20 TAHUN 2026\\n\\nTENTANG\\n\\nPERUBAHAN ATAS PERATURAN PEMERINTAH NOMOR 55 TAHUN 2022');
}

fs.writeFileSync(filePath, text, 'utf8');
console.log("Successfully formatted Pasal II and updated translations.ts");
