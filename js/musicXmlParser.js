import {
    createMusicXmlSourceDescriptor,
    MUSICXML_SOURCE_TYPE,
    SUPPORTED_MUSICXML_ROOTS
} from './musicXmlAdapterContract.js';
import { createDiagnostic, hasFatalDiagnostics } from './patternValidator.js';

const DEFAULT_SOURCE_ID = 'musicxml-import';
const XML_DECLARATION_PATTERN = /^<\?xml[\s\S]*?\?>\s*/i;
const SELF_CLOSING_PATTERN = /\/\s*>$/;
const TAG_PATTERN = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<\/?[^>]+>/gi;
const SUPPORTED_MEASURE_CHILDREN = new Set(['attributes', 'print', 'note', 'backup', 'forward', 'barline', 'direction']);

function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeSourceOptions(options = {}) {
    const sourceId = normalizeText(options.sourceId, normalizeText(options.id, DEFAULT_SOURCE_ID));
    return {
        sourceId,
        filename: normalizeText(options.filename, ''),
        sourceType: MUSICXML_SOURCE_TYPE
    };
}

function diagnostic(context, input) {
    return createDiagnostic({
        sourceId: context.sourceId,
        sourceType: MUSICXML_SOURCE_TYPE,
        ...input
    });
}

function parseAttributes(source) {
    const attributes = {};
    const attributePattern = /([A-Za-z_][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let match;
    while ((match = attributePattern.exec(source)) !== null) {
        attributes[match[1]] = match[3] ?? match[4] ?? '';
    }
    return attributes;
}

function getTagName(tag) {
    return tag
        .replace(/^<\//, '')
        .replace(/^</, '')
        .replace(/\/?\s*>$/, '')
        .trim()
        .split(/\s+/)[0];
}

function parseXmlData(text) {
    if (typeof text !== 'string' || text.trim() === '') {
        return {
            ok: false,
            message: 'MusicXML text is empty.'
        };
    }

    const source = text.replace(XML_DECLARATION_PATTERN, '');
    const stack = [];
    const roots = [];
    let cursor = 0;
    let match;

    while ((match = TAG_PATTERN.exec(source)) !== null) {
        const token = match[0];
        const textBetween = source.slice(cursor, match.index);
        if (textBetween.trim() && stack.length > 0) {
            const current = stack[stack.length - 1];
            current.text += decodeXmlText(textBetween.trim());
        } else if (textBetween.trim()) {
            return {
                ok: false,
                message: 'MusicXML contains text outside the root element.'
            };
        }
        cursor = TAG_PATTERN.lastIndex;

        if (token.startsWith('<!--') || token.startsWith('<?') || token.startsWith('<!DOCTYPE')) {
            continue;
        }

        if (token.startsWith('<![CDATA[')) {
            if (stack.length === 0) {
                return {
                    ok: false,
                    message: 'MusicXML contains CDATA outside the root element.'
                };
            }
            stack[stack.length - 1].text += token.slice(9, -3);
            continue;
        }

        if (token.startsWith('</')) {
            const closingName = getTagName(token);
            const current = stack.pop();
            if (!current || current.name !== closingName) {
                return {
                    ok: false,
                    message: `MusicXML closing tag "${closingName}" does not match the open element.`
                };
            }
            continue;
        }

        const name = getTagName(token);
        if (!name) {
            return {
                ok: false,
                message: 'MusicXML contains an invalid element.'
            };
        }

        const element = {
            name,
            attributes: parseAttributes(token),
            children: [],
            text: ''
        };

        if (stack.length > 0) {
            stack[stack.length - 1].children.push(element);
        } else {
            roots.push(element);
        }

        if (!SELF_CLOSING_PATTERN.test(token)) {
            stack.push(element);
        }
    }

    const trailingText = source.slice(cursor).trim();
    if (trailingText) {
        return {
            ok: false,
            message: 'MusicXML contains text after the root element.'
        };
    }

    if (stack.length > 0) {
        return {
            ok: false,
            message: `MusicXML element "${stack[stack.length - 1].name}" is not closed.`
        };
    }

    if (roots.length !== 1) {
        return {
            ok: false,
            message: 'MusicXML must contain exactly one root element.'
        };
    }

    return {
        ok: true,
        document: {
            rootName: roots[0].name,
            root: roots[0]
        }
    };
}

function decodeXmlText(value) {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, '\'')
        .replace(/&amp;/g, '&');
}

function normalizeBrowserDocument(document) {
    const root = document?.documentElement;
    if (!root) return null;
    if (root.localName === 'parsererror' || root.getElementsByTagName?.('parsererror')?.length > 0) {
        return null;
    }
    return {
        rootName: root.localName || root.nodeName,
        root: normalizeDomElement(root)
    };
}

function normalizeDomElement(element) {
    return {
        name: element.localName || element.nodeName,
        attributes: Array.from(element.attributes || []).reduce((attributes, attribute) => {
            attributes[attribute.name] = attribute.value;
            return attributes;
        }, {}),
        children: Array.from(element.children || []).map(normalizeDomElement),
        text: Array.from(element.childNodes || [])
            .filter(node => node.nodeType === 3 || node.nodeType === 4)
            .map(node => node.nodeValue.trim())
            .filter(Boolean)
            .join(' ')
    };
}

function parseWithAvailableParser(text, options = {}) {
    if (options.parser && typeof options.parser.parseFromString === 'function') {
        const parsed = options.parser.parseFromString(text, 'application/xml');
        const normalized = normalizeBrowserDocument(parsed);
        return normalized
            ? { ok: true, document: normalized }
            : { ok: false, message: 'MusicXML could not be parsed as XML.' };
    }

    if (typeof DOMParser !== 'undefined') {
        const parsed = new DOMParser().parseFromString(text, 'application/xml');
        const normalized = normalizeBrowserDocument(parsed);
        return normalized
            ? { ok: true, document: normalized }
            : { ok: false, message: 'MusicXML could not be parsed as XML.' };
    }

    return parseXmlData(text);
}

function childrenByName(element, name) {
    return (element?.children || []).filter(child => child.name === name);
}

function firstChild(element, name) {
    return childrenByName(element, name)[0] || null;
}

function childText(element, path) {
    const parts = path.split('.');
    let current = element;
    for (const part of parts) {
        current = firstChild(current, part);
        if (!current) return '';
    }
    return normalizeText(current.text, '');
}

function readTitle(root, filename, sourceId) {
    return childText(root, 'work.work-title')
        || childText(root, 'movement-title')
        || filename
        || sourceId;
}

function readComposer(root) {
    const creators = childrenByName(firstChild(root, 'identification'), 'creator');
    const composer = creators.find(creator => creator.attributes.type === 'composer') || creators[0];
    return normalizeText(composer?.text, '');
}

function validateSupportedStructure(document, context) {
    const diagnostics = [];
    const root = document.root;

    if (!SUPPORTED_MUSICXML_ROOTS.includes(document.rootName)) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_ROOT_UNSUPPORTED',
            path: document.rootName || '',
            message: 'Only score-partwise MusicXML files are supported in strict import.'
        }));
        return diagnostics;
    }

    const partList = firstChild(root, 'part-list');
    if (!partList) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_PART_LIST_MISSING',
            path: 'score-partwise.part-list',
            message: 'MusicXML score-partwise files must include a part-list.'
        }));
        return diagnostics;
    }

    const parts = childrenByName(root, 'part');
    if (parts.length === 0) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_PART_MISSING',
            path: 'score-partwise.part',
            message: 'MusicXML score-partwise files must include one playable part.'
        }));
        return diagnostics;
    }

    if (parts.length > 1) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_PART_UNSUPPORTED',
            path: 'score-partwise.part',
            message: 'Strict import currently supports one piano part; multi-part files are rejected.'
        }));
        return diagnostics;
    }

    const measures = childrenByName(parts[0], 'measure');
    if (measures.length === 0) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_MEASURE_MISSING',
            path: 'score-partwise.part[0].measure',
            message: 'The supported MusicXML part must contain at least one measure.'
        }));
        return diagnostics;
    }

    const hasAttributes = measures.some(measure => firstChild(measure, 'attributes'));
    const hasDivisions = measures.some(measure => childText(measure, 'attributes.divisions'));
    const hasTime = measures.some(measure => childText(measure, 'attributes.time.beats') && childText(measure, 'attributes.time.beat-type'));
    if (!hasAttributes || !hasDivisions || !hasTime) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_ATTRIBUTES_MISSING',
            path: 'score-partwise.part[0].measure.attributes',
            message: 'Strict import requires divisions and time signature attributes for supported playback mapping.'
        }));
    }

    measures.forEach((measure, index) => {
        const playableChildren = measure.children.filter(child => ['note', 'backup', 'forward'].includes(child.name));
        if (playableChildren.length === 0) {
            diagnostics.push(diagnostic(context, {
                severity: 'error',
                code: 'MUSICXML_MEASURE_EMPTY',
                path: `score-partwise.part[0].measure[${index}]`,
                message: 'Strict import requires measures to contain note, backup, or forward data.'
            }));
        }

        measure.children.forEach((child, childIndex) => {
            if (SUPPORTED_MEASURE_CHILDREN.has(child.name)) return;
            diagnostics.push(diagnostic(context, {
                severity: 'error',
                code: 'MUSICXML_ELEMENT_UNSUPPORTED',
                path: `score-partwise.part[0].measure[${index}].${child.name}[${childIndex}]`,
                message: `Unsupported MusicXML element "${child.name}" cannot be imported in strict mode.`
            }));
        });
    });

    return diagnostics;
}

export function validateMusicXmlDocument(document, options = {}) {
    const context = normalizeSourceOptions(options);
    if (!document || !document.rootName || !document.root) {
        return [diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_PARSE_FAILED',
            path: '',
            message: 'MusicXML could not be parsed as XML.'
        })];
    }

    return validateSupportedStructure(document, context);
}

export function parseMusicXmlText(text, options = {}) {
    const context = normalizeSourceOptions(options);
    const parsed = parseWithAvailableParser(text, options);

    if (!parsed.ok) {
        const diagnostics = [diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_PARSE_FAILED',
            path: '',
            message: parsed.message || 'MusicXML could not be parsed as XML.'
        })];
        return {
            ok: false,
            document: null,
            descriptor: createMusicXmlSourceDescriptor({
                sourceId: context.sourceId,
                filename: context.filename,
                diagnostics
            }),
            diagnostics
        };
    }

    const diagnostics = validateMusicXmlDocument(parsed.document, context);
    const descriptor = createMusicXmlSourceDescriptor({
        sourceId: context.sourceId,
        filename: context.filename,
        root: parsed.document.rootName,
        title: parsed.document.rootName === 'score-partwise'
            ? readTitle(parsed.document.root, context.filename, context.sourceId)
            : context.filename || context.sourceId,
        composer: parsed.document.rootName === 'score-partwise' ? readComposer(parsed.document.root) : '',
        metadata: {
            partCount: childrenByName(parsed.document.root, 'part').length
        },
        diagnostics
    });

    return {
        ok: !hasFatalDiagnostics(diagnostics),
        document: parsed.document,
        descriptor,
        diagnostics
    };
}
