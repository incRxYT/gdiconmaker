function loadImg(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load: ' + src));
        img.src = src;
    });
}

function canvasToBlob(canvas, type = 'image/png') {
    return new Promise(resolve => canvas.toBlob(resolve, type));
}

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

function resizeToSquare(imgOrCanvas, w, h) {
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgOrCanvas, 0, 0, w, h);
    return c;
}

function maskCircle(src, w, h) {
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(src, 0, 0, w, h);
    return c;
}

function composite(base, overlay, ox, oy) {
    const ctx = base.getContext('2d');
    ctx.drawImage(overlay, ox, oy);
    return base;
}

async function canvasToPngBytes(canvas) {
    const blob = await canvasToBlob(canvas, 'image/png');
    return new Uint8Array(await blob.arrayBuffer());
}

async function loadTemplateCanvas(src) {
    const img = await loadImg(src);
    const c = makeCanvas(img.naturalWidth, img.naturalHeight);
    c.getContext('2d').drawImage(img, 0, 0);
    return c;
}

async function procCube(usrCanvas, idxStr, zip) {
    const hdBase = await loadTemplateCanvas('player_01-hd.png');

    const reszHd = resizeToSquare(usrCanvas, 55, 56);
    const rotCanv = makeCanvas(56, 55);
    const rotCtx = rotCanv.getContext('2d');
    rotCtx.translate(56 / 2, 55 / 2);
    rotCtx.rotate(Math.PI / 2);
    rotCtx.drawImage(reszHd, -55 / 2, -56 / 2);
    composite(hdBase, rotCanv, 71, 5);
    zip.file(`icons/player_${idxStr}-hd.png`, await canvasToPngBytes(hdBase));

    const uhdBase = await loadTemplateCanvas('player_01-uhd.png');
    const reszUhd = resizeToSquare(usrCanvas, 108, 108);
    composite(uhdBase, reszUhd, 37, 8);
    zip.file(`icons/player_${idxStr}-uhd.png`, await canvasToPngBytes(uhdBase));

    await addPlist('player_01-hd.plist', `icons/player_${idxStr}-hd.plist`, 'player_01', `player_${idxStr}`, zip);
    await addPlist('player_01-uhd.plist', `icons/player_${idxStr}-uhd.plist`, 'player_01', `player_${idxStr}`, zip);
}

async function procWave(usrCanvas, idxStr, zip) {
    const hdBase = await loadTemplateCanvas('dart_01-hd.png');
    const wHd = 24, hHd = 25;
    const waveHd = resizeToSquare(usrCanvas, wHd, hHd);
    const circHd = maskCircle(waveHd, wHd, hHd);
    composite(hdBase, circHd, 3, 102);
    zip.file(`icons/dart_${idxStr}-hd.png`, await canvasToPngBytes(hdBase));

    const uhdBase = await loadTemplateCanvas('dart_01-uhd.png');
    const wUhd = 48, hUhd = 53;
    const waveUhd = resizeToSquare(usrCanvas, wUhd, hUhd);
    const circUhd = maskCircle(waveUhd, wUhd, hUhd);
    composite(uhdBase, circUhd, 4, 197);
    zip.file(`icons/dart_${idxStr}-uhd.png`, await canvasToPngBytes(uhdBase));

    await addPlist('dart_01-hd.plist', `icons/dart_${idxStr}-hd.plist`, 'dart_01', `dart_${idxStr}`, zip);
    await addPlist('dart_01-uhd.plist', `icons/dart_${idxStr}-uhd.plist`, 'dart_01', `dart_${idxStr}`, zip);
}

async function procBall(usrCanvas, idxStr, zip) {
    const hdBase = await loadTemplateCanvas('player_ball_01-hd.png');
    const wHd = 65, hHd = 66;
    const ballHd = resizeToSquare(usrCanvas, wHd, hHd);
    const circHd = maskCircle(ballHd, wHd, hHd);
    composite(hdBase, circHd, 83, 4);
    zip.file(`icons/player_ball_${idxStr}-hd.png`, await canvasToPngBytes(hdBase));

    const uhdBase = await loadTemplateCanvas('player_ball_01-uhd.png');
    const wUhd = 130, hUhd = 130;
    const ballUhd = resizeToSquare(usrCanvas, wUhd, hUhd);
    const circUhd = maskCircle(ballUhd, wUhd, hUhd);
    composite(uhdBase, circUhd, 162, 8);
    zip.file(`icons/player_ball_${idxStr}-uhd.png`, await canvasToPngBytes(uhdBase));

    await addPlist('player_ball_01-hd.plist', `icons/player_ball_${idxStr}-hd.plist`, 'player_ball_01', `player_ball_${idxStr}`, zip);
    await addPlist('player_ball_01-uhd.plist', `icons/player_ball_${idxStr}-uhd.plist`, 'player_ball_01', `player_ball_${idxStr}`, zip);
}

const plistCache = {};

async function addPlist(srcPath, zipPath, fromId, toId, zip) {
    try {
        if (!plistCache[srcPath]) {
            const resp = await fetch(srcPath);
            if (!resp.ok) return;
            plistCache[srcPath] = await resp.text();
        }
        const content = plistCache[srcPath].replaceAll(fromId, toId);
        zip.file(zipPath, content);
    } catch (e) {}
}

async function buildPackIcon(customFile) {
    if (customFile) {
        return new Promise((resolve) => {
            const rdr = new FileReader();
            rdr.onload = async (e) => {
                try {
                    const img = await loadImg(e.target.result);
                    const c = makeCanvas(336, 336);
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0, 336, 336);
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(0, 300, 336, 36);
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.font = '14px sans-serif';
                    ctx.fillText('GDIconMaker — github pages', 60, 318);
                    resolve(c);
                } catch {
                    resolve(null);
                }
            };
            rdr.readAsDataURL(customFile);
        });
    }
    return null;
}

async function fetchPackJson(packName, packAuthor) {
    try {
        const resp = await fetch('pack.json');
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        const pckId = 'gdiconmaker.' + packName.replace(/[^a-zA-Z0-9]/g, '');
        data.id = pckId;
        data.author = packAuthor + ' (from gdiconmaker.rf.gd)';
        data.name = packName;
        return JSON.stringify(data, null, 2);
    } catch {
        const pckId = 'gdiconmaker.' + packName.replace(/[^a-zA-Z0-9]/g, '');
        return JSON.stringify({
            id: pckId,
            name: packName,
            author: packAuthor + ' (from gdiconmaker.rf.gd)',
            description: 'Custom GD icon pack',
            version: '1.0.0'
        }, null, 2);
    }
}

async function generateIconPack({ processedImgs, packName, packAuthor, doCube, doWave, doBall, customPackIconFile }) {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip not loaded — check your internet connection');
    }

    const zip = new JSZip();

    const packJsonStr = await fetchPackJson(packName, packAuthor);
    zip.file('pack.json', packJsonStr);

    const customIconCanvas = await buildPackIcon(customPackIconFile);
    if (customIconCanvas) {
        zip.file('pack.png', await canvasToPngBytes(customIconCanvas));
    } else {
        try {
            const resp = await fetch('pack.png');
            if (resp.ok) zip.file('pack.png', await resp.arrayBuffer());
        } catch {}
    }

    for (let i = 0; i < processedImgs.length; i++) {
        const imgEntry = processedImgs[i];
        const iconIdx = imgEntry.customNum || (i + 1);
        const idxStr = String(iconIdx).padStart(2, '0');

        const img = await loadImg(imgEntry.data);
        const usrCanvas = makeCanvas(img.naturalWidth, img.naturalHeight);
        usrCanvas.getContext('2d').drawImage(img, 0, 0);

        if (doCube) await procCube(usrCanvas, idxStr, zip);
        if (doWave) await procWave(usrCanvas, idxStr, zip);
        if (doBall) await procBall(usrCanvas, idxStr, zip);
    }

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    return blob;
}

window.generateIconPack = generateIconPack;
