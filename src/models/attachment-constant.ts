/**
 * 附件胶囊样式相关常量与工具函数。
 * 只处理普通资源链接：<span data-type="a" data-href="assets/xxx.pdf">xxx.pdf</span>
 */

/** 附件链接选择器：排除数据库单元格等特殊场景 */
export const ATTACHMENT_LINK_SELECTOR =
    'span[data-type~="a"]:not(.av__celltext)[data-href^="assets/"],' +
    ' span[data-type~="a"]:not(.av__celltext)[data-href^="/assets/"]';

export const ATTACHMENT_ATTR = "data-misuzu-attach";
export const ATTACHMENT_TAG_ATTR = "data-misuzu-attach-tag";
export const ATTACHMENT_TYPE_ATTR = "data-misuzu-attach-type";
export const ATTACHMENT_FILL_ATTR = "data-misuzu-attach-fill";
export const ATTACHMENT_SIZE_ATTR = "data-misuzu-attach-size";
export const ATTACHMENT_DATE_ATTR = "data-misuzu-attach-date";
export const ATTACHMENT_META_ATTR = "data-misuzu-attach-meta";
export const ATTACHMENT_MISSING_ATTR = "data-misuzu-attach-missing";

/** 缓存只保存在内存中，默认 10 分钟；0 表示不缓存 */
export const ATTACHMENT_DEFAULT_CACHE_MINUTES = 10;
export const ATTACHMENT_REQUEST_TIMEOUT_MS = 8000;
export const ATTACHMENT_MAX_CONCURRENT = 3;
/** 提前多少像素开始加载，避免滚动时才出现大小 */
export const ATTACHMENT_LAZY_ROOT_MARGIN = "240px 0px";

const TYPE_MAP: { [ext: string]: string } = {
    // 文档
    pdf: "pdf",
    doc: "word", docx: "word", rtf: "word", odt: "word",
    xls: "excel", xlsx: "excel", csv: "excel", ods: "excel",
    ppt: "ppt", pptx: "ppt", odp: "ppt",
    epub: "text", mobi: "text", azw3: "text",
    // 压缩包
    zip: "archive", "7z": "archive", rar: "archive", tar: "archive", gz: "archive",
    tgz: "archive", bz2: "archive", xz: "archive",
    // 可执行
    exe: "executable", msi: "executable", apk: "executable", dmg: "executable",
    deb: "executable", rpm: "executable", pkg: "executable",
    // 音频
    mp3: "audio", wav: "audio", ogg: "audio", m4a: "audio", aac: "audio",
    flac: "audio", wma: "audio", opus: "audio",
    // 视频
    mp4: "video", mkv: "video", mov: "video", webm: "video", avi: "video",
    flv: "video", wmv: "video",
    // 图片
    png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
    svg: "image", bmp: "image", ico: "image", heic: "image", tif: "image", tiff: "image",
    // 设计稿
    psd: "design", ai: "design", sketch: "design", fig: "design", xd: "design",
    // 代码 / 数据
    json: "code", yaml: "code", yml: "code", xml: "code", py: "code", js: "code",
    ts: "code", sql: "code", sh: "code", go: "code", rs: "code", java: "code",
    c: "code", cpp: "code", h: "code", css: "code", html: "code", vue: "code",
    // 文本
    md: "text", markdown: "text", txt: "text", log: "text",
    // 字体
    ttf: "font", otf: "font", woff: "font", woff2: "font",
    // 其他
    iso: "archive", bin: "unknown", dat: "unknown",
};

const TAG_MAP: { [ext: string]: string } = {
    // 文档
    pdf: "PDF",
    doc: "DOC", docx: "DOC", rtf: "DOC", odt: "DOC",
    xls: "XLS", xlsx: "XLS", csv: "XLS", ods: "XLS",
    ppt: "PPT", pptx: "PPT", odp: "PPT",
    epub: "EPUB", mobi: "MOBI", azw3: "AZW3",
    // 压缩包
    zip: "ZIP", "7z": "7Z", rar: "RAR", tar: "TAR", gz: "GZ", tgz: "TGZ", bz2: "BZ2", xz: "XZ",
    // 可执行
    exe: "EXE", msi: "MSI", apk: "APK", dmg: "DMG", deb: "DEB", rpm: "RPM", pkg: "PKG",
    // 音频
    mp3: "MP3", wav: "WAV", ogg: "OGG", m4a: "M4A", aac: "AAC", flac: "FLAC", wma: "WMA", opus: "OPUS",
    // 视频
    mp4: "MP4", mkv: "MKV", mov: "MOV", webm: "WEBM", avi: "AVI", flv: "FLV", wmv: "WMV",
    // 图片
    png: "PNG", jpg: "JPG", jpeg: "JPG", gif: "GIF", webp: "WEBP", svg: "SVG", bmp: "BMP",
    ico: "ICO", heic: "HEIC", tif: "TIF", tiff: "TIFF",
    // 设计稿
    psd: "PSD", ai: "AI", sketch: "SKETCH", fig: "FIG", xd: "XD",
    // 代码 / 数据
    json: "JSON", yaml: "YAML", yml: "YML", xml: "XML", py: "PY", js: "JS", ts: "TS",
    sql: "SQL", sh: "SH", go: "GO", rs: "RS", java: "JAVA", c: "C", cpp: "CPP", h: "H",
    css: "CSS", html: "HTML", vue: "VUE",
    // 文本
    md: "MD", markdown: "MD", txt: "TXT", log: "LOG",
    // 字体
    ttf: "TTF", otf: "OTF", woff: "WOFF", woff2: "WOFF2",
    // 其他
    iso: "ISO", bin: "BIN", dat: "DAT",
};

/**
 * 从 data-href 中取扩展名。
 * href 可能带 ?box=... 或 #...，也可能包含百分号编码的中文文件名。
 */
export function getAttachmentExtension(href: string): string {
    let path = href || "";
    const hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
        path = path.substring(0, hashIndex);
    }
    const queryIndex = path.indexOf("?");
    if (queryIndex >= 0) {
        path = path.substring(0, queryIndex);
    }
    try {
        path = decodeURIComponent(path);
    } catch (e) {
        // 保留原字符串
    }
    const slashIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    const fileName = slashIndex >= 0 ? path.substring(slashIndex + 1) : path;
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
        return "";
    }
    return fileName.substring(dotIndex + 1).toLowerCase();
}

/** 生成大分类，用于选择胶囊配色；未识别时返回 unknown */
export function getAttachmentType(href: string): string {
    const ext = getAttachmentExtension(href);
    return TYPE_MAP[ext] || "unknown";
}

/** 生成胶囊左侧的短标签，最长 4 个字符 */
export function getAttachmentTag(href: string): string {
    const ext = getAttachmentExtension(href);
    if (!ext) {
        return "?";
    }
    const tag = TAG_MAP[ext] || ext.toUpperCase();
    return tag.length > 4 ? tag.substring(0, 4) : tag;
}

/**
 * 规范化资源路径，供 /api/asset/statAsset 使用。
 * 去掉开头的 /，保留 ?box= 之类的查询参数，去掉 # 片段。
 */
export function normalizeAttachmentPath(href: string): string {
    let path = (href || "").trim();
    const hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
        path = path.substring(0, hashIndex);
    }
    if (path.startsWith("/assets/")) {
        path = path.substring(1);
    }
    return path;
}

/** 缓存键：同一资源的不同引用（含查询参数）视为同一个附件 */
export function getAttachmentCacheKey(href: string): string {
    return normalizeAttachmentPath(href);
}
