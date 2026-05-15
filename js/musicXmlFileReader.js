const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZIP_METHOD_STORE = 0;
const ZIP_METHOD_DEFLATE = 8;

function isMxlFile(file) {
    return /\.mxl$/i.test(file?.name || '')
        || file?.type === 'application/vnd.recordare.musicxml';
}

function diagnostic(filename, input) {
    return {
        sourceId: filename || 'musicxml-import',
        sourceType: 'musicxml',
        severity: 'error',
        ...input
    };
}

function findEndOfCentralDirectory(view) {
    const minOffset = Math.max(0, view.byteLength - 65557);
    for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
        if (view.getUint32(offset, true) === ZIP_END_OF_CENTRAL_DIRECTORY) return offset;
    }
    return -1;
}

function decodeZipName(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
}

function readZipEntries(buffer) {
    const view = new DataView(buffer);
    const eocdOffset = findEndOfCentralDirectory(view);
    if (eocdOffset < 0) {
        throw new Error('Compressed MusicXML archive is missing its ZIP directory.');
    }

    const entryCount = view.getUint16(eocdOffset + 10, true);
    let offset = view.getUint32(eocdOffset + 16, true);
    const entries = [];

    for (let index = 0; index < entryCount; index += 1) {
        if (view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_HEADER) {
            throw new Error('Compressed MusicXML archive has an invalid ZIP directory.');
        }

        const method = view.getUint16(offset + 10, true);
        const compressedSize = view.getUint32(offset + 20, true);
        const uncompressedSize = view.getUint32(offset + 24, true);
        const nameLength = view.getUint16(offset + 28, true);
        const extraLength = view.getUint16(offset + 30, true);
        const commentLength = view.getUint16(offset + 32, true);
        const localHeaderOffset = view.getUint32(offset + 42, true);
        const nameStart = offset + 46;
        const name = decodeZipName(new Uint8Array(buffer, nameStart, nameLength));

        entries.push({
            name,
            method,
            compressedSize,
            uncompressedSize,
            localHeaderOffset
        });

        offset = nameStart + nameLength + extraLength + commentLength;
    }

    return entries;
}

async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') {
        throw new Error('This browser cannot decompress .mxl files.');
    }

    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractZipEntry(buffer, entry) {
    const view = new DataView(buffer);
    const offset = entry.localHeaderOffset;
    if (view.getUint32(offset, true) !== ZIP_LOCAL_FILE_HEADER) {
        throw new Error(`Compressed MusicXML entry "${entry.name}" has an invalid local header.`);
    }

    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const dataOffset = offset + 30 + nameLength + extraLength;
    const compressedBytes = new Uint8Array(buffer, dataOffset, entry.compressedSize);

    if (entry.method === ZIP_METHOD_STORE) {
        return compressedBytes;
    }
    if (entry.method === ZIP_METHOD_DEFLATE) {
        return inflateRaw(compressedBytes);
    }

    throw new Error(`Compressed MusicXML entry "${entry.name}" uses an unsupported ZIP compression method.`);
}

function rootfilePathFromContainer(containerXml) {
    if (typeof DOMParser !== 'undefined') {
        const documentXml = new DOMParser().parseFromString(containerXml, 'application/xml');
        const rootfile = documentXml.querySelector('rootfile[full-path]');
        if (rootfile) return rootfile.getAttribute('full-path');
    }

    return containerXml.match(/<rootfile\b[^>]*\bfull-path=["']([^"']+)["']/i)?.[1] || null;
}

async function readCompressedMusicXml(file) {
    const buffer = await file.arrayBuffer();
    const entries = readZipEntries(buffer);
    const entryByName = new Map(entries.map(entry => [entry.name, entry]));
    const containerEntry = entryByName.get('META-INF/container.xml');

    let scorePath = null;
    if (containerEntry) {
        const containerBytes = await extractZipEntry(buffer, containerEntry);
        scorePath = rootfilePathFromContainer(new TextDecoder('utf-8').decode(containerBytes));
    }

    const scoreEntry = (scorePath && entryByName.get(scorePath))
        || entries.find(entry => /\.(musicxml|xml)$/i.test(entry.name) && entry.name !== 'META-INF/container.xml');

    if (!scoreEntry) {
        throw new Error('Compressed MusicXML archive does not contain a score XML file.');
    }

    const scoreBytes = await extractZipEntry(buffer, scoreEntry);
    return {
        xmlText: new TextDecoder('utf-8').decode(scoreBytes),
        filename: file.name || scoreEntry.name,
        extractedPath: scoreEntry.name,
        compressed: true
    };
}

export async function readMusicXmlFile(file) {
    try {
        if (!isMxlFile(file)) {
            return {
                ok: true,
                xmlText: await file.text(),
                filename: file.name || 'import.musicxml',
                compressed: false
            };
        }

        return {
            ok: true,
            ...(await readCompressedMusicXml(file))
        };
    } catch (error) {
        return {
            ok: false,
            diagnostics: [diagnostic(file?.name, {
                code: 'MXL_READ_FAILED',
                path: file?.name || '',
                message: error?.message || 'Compressed MusicXML could not be read.'
            })]
        };
    }
}
