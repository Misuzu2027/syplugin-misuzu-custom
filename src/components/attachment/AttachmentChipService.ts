import { EnvConfig } from "@/config/EnvConfig";
import {
    ATTACHMENT_ATTR,
    ATTACHMENT_DEFAULT_CACHE_MINUTES,
    ATTACHMENT_DATE_ATTR,
    ATTACHMENT_FILL_ATTR,
    ATTACHMENT_LAZY_ROOT_MARGIN,
    ATTACHMENT_LINK_SELECTOR,
    ATTACHMENT_MAX_CONCURRENT,
    ATTACHMENT_META_ATTR,
    ATTACHMENT_MISSING_ATTR,
    ATTACHMENT_REQUEST_TIMEOUT_MS,
    ATTACHMENT_SIZE_ATTR,
    ATTACHMENT_TAG_ATTR,
    ATTACHMENT_TYPE_ATTR,
    getAttachmentCacheKey,
    getAttachmentTag,
    getAttachmentType,
    normalizeAttachmentPath,
} from "@/models/attachment-constant";
import { SettingService } from "@/service/SettingService";
import { postApi } from "@/utils/api";
import Instance from "@/utils/Instance";

interface IAttachmentMeta {
    size: number;
    hSize: string;
    updated: number;
    hUpdated: string;
    missing?: boolean;
    /** 写入缓存的时间戳 */
    ts: number;
}

export class AttachmentChipService {

    public static get ins(): AttachmentChipService {
        return Instance.get(AttachmentChipService);
    }

    private enabled = false;
    /** 只存在内存中；关闭功能时清空，重新开启后会重新获取 */
    private cache: Map<string, IAttachmentMeta> = new Map();
    /** 正在请求的附件，避免同一附件并发重复请求 */
    private inflight: Map<string, Promise<IAttachmentMeta | null>> = new Map();
    private queue: string[] = [];
    private queuedKeys: Set<string> = new Set();
    private activeCount = 0;
    /** protyle 内容元素 -> MutationObserver */
    private observers: Map<HTMLElement, MutationObserver> = new Map();
    /** 只加载进入视口附近的附件，避免打开大文档时请求风暴 */
    private intersectionObserver: IntersectionObserver = null;
    private observedLinks: WeakSet<HTMLElement> = new WeakSet();
    /** 表格单元格宽度变化时，重新决定显示日期/大小 */
    private resizeObserver: ResizeObserver = null;
    /** 关闭功能时递增，丢弃旧请求回写缓存 */
    private cacheEpoch = 0;

    public init() {
        const settingConfig = SettingService.ins.SettingConfig;
        if (!settingConfig.attachmentChip) {
            this.destroy();
            return;
        }
        this.enabled = true;
        this.ensureIntersectionObserver();
        this.bindBusEvent();
        this.cleanupDisconnectedObservers();
        // 已经打开过的文档先扫一遍
        document.querySelectorAll<HTMLElement>(".protyle-wysiwyg").forEach((element) => {
            this.attachProtyle(element);
        });
    }

    public destroy() {
        this.enabled = false;
        this.cacheEpoch++;
        const plugin = EnvConfig.ins.plugin;
        if (plugin) {
            plugin.eventBus.off("loaded-protyle-static", handleLoadedProtyle);
            plugin.eventBus.off("loaded-protyle-dynamic", handleLoadedProtyle);
        }
        for (const observer of this.observers.values()) {
            observer.disconnect();
        }
        this.observers.clear();
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.observedLinks = new WeakSet();
        this.queue = [];
        this.queuedKeys.clear();
        this.inflight.clear();
        this.activeCount = 0;
        this.cache.clear();
        this.removeAttributes();
    }

    public attachProtyle(protyleContentElement: HTMLElement) {
        if (!this.enabled || !protyleContentElement) {
            return;
        }
        if (!this.observers.has(protyleContentElement) && protyleContentElement.isConnected) {
            const observer = new MutationObserver((records) => {
                this.handleMutations(records);
            });
            observer.observe(protyleContentElement, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ["data-href"],
            });
            this.observers.set(protyleContentElement, observer);
        }
        this.scan(protyleContentElement);
    }

    private bindBusEvent() {
        const plugin = EnvConfig.ins.plugin;
        if (!plugin) {
            return;
        }
        // 先解绑，避免设置反复开关导致重复注册
        plugin.eventBus.off("loaded-protyle-static", handleLoadedProtyle);
        plugin.eventBus.off("loaded-protyle-dynamic", handleLoadedProtyle);
        plugin.eventBus.on("loaded-protyle-static", handleLoadedProtyle);
        plugin.eventBus.on("loaded-protyle-dynamic", handleLoadedProtyle);
    }

    /** 只处理新增链接和 data-href 变化，避免输入时全量重扫 */
    private handleMutations(records: MutationRecord[]) {
        if (!this.enabled) {
            return;
        }
        const targets: Set<HTMLElement> = new Set();
        const cells: Set<HTMLElement> = new Set();
        for (const record of records) {
            if (record.type === "characterData") {
                const cell = (record.target as CharacterData).parentElement?.closest("td, th");
                if (cell) {
                    cells.add(cell as HTMLElement);
                }
                continue;
            }
            if (record.type === "attributes") {
                const target = record.target as HTMLElement;
                if (target?.matches?.(ATTACHMENT_LINK_SELECTOR)) {
                    targets.add(target);
                }
                continue;
            }
            record.removedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) {
                    return;
                }
                if (node.matches(ATTACHMENT_LINK_SELECTOR)) {
                    this.unobserveChipResize(node);
                }
                node.querySelectorAll<HTMLElement>(ATTACHMENT_LINK_SELECTOR).forEach((element) => {
                    this.unobserveChipResize(element);
                });
            });
            record.addedNodes.forEach((node) => {
                const cell = node instanceof HTMLElement
                    ? node.closest("td, th")
                    : node.parentElement?.closest("td, th");
                if (cell) {
                    cells.add(cell as HTMLElement);
                }
                if (!(node instanceof HTMLElement)) {
                    return;
                }
                if (node.matches(ATTACHMENT_LINK_SELECTOR)) {
                    targets.add(node);
                }
                node.querySelectorAll<HTMLElement>(ATTACHMENT_LINK_SELECTOR).forEach((element) => {
                    targets.add(element);
                });
            });
        }
        cells.forEach((cell) => {
            cell.querySelectorAll<HTMLElement>(ATTACHMENT_LINK_SELECTOR).forEach((element) => {
                markTableCellFill(element);
            });
        });
        targets.forEach((element) => this.prepareLink(element));
    }

    private scan(root: HTMLElement) {
        if (!this.enabled) {
            return;
        }
        if (root.matches(ATTACHMENT_LINK_SELECTOR)) {
            this.prepareLink(root);
        }
        root.querySelectorAll<HTMLElement>(ATTACHMENT_LINK_SELECTOR).forEach((element) => {
            this.prepareLink(element);
        });
    }

    private prepareLink(linkElement: HTMLElement) {
        const href = linkElement.getAttribute("data-href");
        if (!href) {
            return;
        }
        linkElement.setAttribute(ATTACHMENT_ATTR, "1");
        linkElement.setAttribute(ATTACHMENT_TAG_ATTR, getAttachmentTag(href));
        linkElement.setAttribute(ATTACHMENT_TYPE_ATTR, getAttachmentType(href));
        markTableCellFill(linkElement);

        if (!SettingService.ins.SettingConfig.attachmentChipShowSize) {
            linkElement.removeAttribute(ATTACHMENT_SIZE_ATTR);
            linkElement.removeAttribute(ATTACHMENT_DATE_ATTR);
            linkElement.removeAttribute(ATTACHMENT_META_ATTR);
            linkElement.removeAttribute(ATTACHMENT_MISSING_ATTR);
            this.unobserveLink(linkElement);
            this.unobserveChipResize(linkElement);
            return;
        }

        const key = getAttachmentCacheKey(href);
        const cached = this.peekCache(key);
        if (cached) {
            this.applyMeta(linkElement, cached);
            this.unobserveLink(linkElement);
            return;
        }

        // 同一份大小已经由同 href 的其它链接写入，不必重复请求
        if (linkElement.hasAttribute(ATTACHMENT_SIZE_ATTR)) {
            this.unobserveLink(linkElement);
            return;
        }
        linkElement.removeAttribute(ATTACHMENT_SIZE_ATTR);
        linkElement.removeAttribute(ATTACHMENT_DATE_ATTR);
        linkElement.removeAttribute(ATTACHMENT_META_ATTR);
        linkElement.removeAttribute(ATTACHMENT_MISSING_ATTR);
        this.unobserveChipResize(linkElement);
        this.observeLink(linkElement, href);
    }

    private ensureIntersectionObserver() {
        if (this.intersectionObserver || typeof IntersectionObserver === "undefined") {
            return;
        }
        this.intersectionObserver = new IntersectionObserver((entries) => {
            this.handleIntersections(entries);
        }, {
            rootMargin: ATTACHMENT_LAZY_ROOT_MARGIN,
            threshold: 0.01,
        });
    }

    private handleIntersections(entries: IntersectionObserverEntry[]) {
        for (const entry of entries) {
            if (!entry.isIntersecting) {
                continue;
            }
            const linkElement = entry.target as HTMLElement;
            this.observedLinks.delete(linkElement);
            this.intersectionObserver?.unobserve(linkElement);
            if (!this.enabled || linkElement.hasAttribute(ATTACHMENT_SIZE_ATTR)) {
                continue;
            }
            const href = linkElement.getAttribute("data-href");
            if (!href) {
                continue;
            }
            const key = getAttachmentCacheKey(href);
            const cached = this.peekCache(key);
            if (cached) {
                this.applyMeta(linkElement, cached);
                continue;
            }
            this.enqueue(href);
        }
    }

    private observeLink(linkElement: HTMLElement, href: string) {
        this.ensureIntersectionObserver();
        if (!this.intersectionObserver) {
            // 环境不支持 IntersectionObserver 时退回直接请求
            this.enqueue(href);
            return;
        }
        if (this.observedLinks.has(linkElement)) {
            return;
        }
        this.observedLinks.add(linkElement);
        this.intersectionObserver.observe(linkElement);
    }

    private unobserveLink(linkElement: HTMLElement) {
        if (!this.observedLinks.has(linkElement)) {
            return;
        }
        this.observedLinks.delete(linkElement);
        this.intersectionObserver?.unobserve(linkElement);
    }

    private peekCache(key: string): IAttachmentMeta {
        const cacheMinutes = this.getCacheMinutes();
        if (cacheMinutes <= 0) {
            // 0 表示不缓存，清掉已有结果，保证每次打开文档都重新获取
            this.cache.clear();
            return null;
        }
        const meta = this.cache.get(key);
        if (!meta) {
            return null;
        }
        if (Date.now() - meta.ts >= cacheMinutes * 60 * 1000) {
            this.cache.delete(key);
            return null;
        }
        return meta;
    }

    private getCacheMinutes(): number {
        const value = Number(SettingService.ins.SettingConfig.attachmentChipCacheMinutes);
        if (!Number.isFinite(value) || value < 0) {
            return ATTACHMENT_DEFAULT_CACHE_MINUTES;
        }
        return Math.floor(value);
    }

    private enqueue(href: string) {
        const key = getAttachmentCacheKey(href);
        if (this.inflight.has(key) || this.queuedKeys.has(key)) {
            return;
        }
        this.queuedKeys.add(key);
        this.queue.push(href);
        this.pumpQueue();
    }

    private pumpQueue() {
        while (this.activeCount < ATTACHMENT_MAX_CONCURRENT && this.queue.length > 0) {
            const href = this.queue.shift();
            const key = getAttachmentCacheKey(href);
            this.queuedKeys.delete(key);
            this.activeCount++;
            this.fetchMeta(href)
                .catch((error) => {
                    console.warn("Misuzu2027 附件信息处理失败", href, error);
                })
                .finally(() => {
                    this.activeCount = Math.max(0, this.activeCount - 1);
                    this.pumpQueue();
                });
        }
    }

    private async fetchMeta(href: string): Promise<void> {
        const key = getAttachmentCacheKey(href);
        const epoch = this.cacheEpoch;
        let promise = this.inflight.get(key);
        if (!promise) {
            promise = this.requestMeta(href);
            this.inflight.set(key, promise);
        }
        let meta: IAttachmentMeta = null;
        try {
            meta = await promise;
        } catch (error) {
            console.warn("Misuzu2027 读取附件信息失败", href, error);
        } finally {
            this.inflight.delete(key);
        }
        if (meta && this.enabled && epoch === this.cacheEpoch && this.getCacheMinutes() > 0) {
            this.cache.set(key, meta);
        }
        this.applyMetaToDom(href, meta);
    }

    private async requestMeta(href: string): Promise<IAttachmentMeta | null> {
        const path = normalizeAttachmentPath(href);
        if (!path) {
            return null;
        }
        const response = await withTimeout(
            postApi("/api/asset/statAsset", { path }),
            ATTACHMENT_REQUEST_TIMEOUT_MS,
        );
        if (!response) {
            return null;
        }
        if (response.code === 0 && response.data) {
            return {
                size: Number(response.data.size) || 0,
                hSize: String(response.data.hSize || ""),
                updated: Number(response.data.updated) || 0,
                hUpdated: String(response.data.hUpdated || ""),
                ts: Date.now(),
            };
        }
        if (response.code === 1) {
            return {
                size: 0,
                hSize: "",
                updated: 0,
                hUpdated: "",
                missing: true,
                ts: Date.now(),
            };
        }
        return null;
    }

    private applyMetaToDom(href: string, meta: IAttachmentMeta) {
        if (!this.enabled) {
            return;
        }
        const key = getAttachmentCacheKey(href);
        document.querySelectorAll<HTMLElement>(ATTACHMENT_LINK_SELECTOR).forEach((element) => {
            const elementHref = element.getAttribute("data-href");
            if (!elementHref || getAttachmentCacheKey(elementHref) !== key) {
                return;
            }
            this.applyMeta(element, meta);
        });
    }

    private applyMeta(linkElement: HTMLElement, meta: IAttachmentMeta) {
        if (!SettingService.ins.SettingConfig.attachmentChipShowSize) {
            linkElement.removeAttribute(ATTACHMENT_SIZE_ATTR);
            linkElement.removeAttribute(ATTACHMENT_DATE_ATTR);
            linkElement.removeAttribute(ATTACHMENT_META_ATTR);
            linkElement.removeAttribute(ATTACHMENT_MISSING_ATTR);
            this.unobserveChipResize(linkElement);
            return;
        }
        if (!meta) {
            linkElement.removeAttribute(ATTACHMENT_SIZE_ATTR);
            linkElement.removeAttribute(ATTACHMENT_DATE_ATTR);
            linkElement.removeAttribute(ATTACHMENT_META_ATTR);
            linkElement.removeAttribute(ATTACHMENT_MISSING_ATTR);
            this.unobserveChipResize(linkElement);
            return;
        }
        if (meta.missing) {
            linkElement.setAttribute(ATTACHMENT_MISSING_ATTR, "1");
            linkElement.setAttribute(ATTACHMENT_SIZE_ATTR, "缺失");
            linkElement.setAttribute(ATTACHMENT_META_ATTR, "size");
            linkElement.removeAttribute(ATTACHMENT_DATE_ATTR);
            this.unobserveChipResize(linkElement);
            return;
        }
        linkElement.removeAttribute(ATTACHMENT_MISSING_ATTR);
        const sizeText = meta.hSize || formatSize(meta.size);
        if (!sizeText) {
            linkElement.removeAttribute(ATTACHMENT_SIZE_ATTR);
            linkElement.removeAttribute(ATTACHMENT_DATE_ATTR);
            linkElement.removeAttribute(ATTACHMENT_META_ATTR);
            this.unobserveChipResize(linkElement);
            return;
        }
        const dateText = SettingService.ins.SettingConfig.attachmentChipShowTime && meta.hUpdated
            ? meta.hUpdated.substring(0, 10)
            : "";
        linkElement.setAttribute(ATTACHMENT_SIZE_ATTR, sizeText);
        if (dateText) {
            linkElement.setAttribute(ATTACHMENT_DATE_ATTR, dateText);
        } else {
            linkElement.removeAttribute(ATTACHMENT_DATE_ATTR);
        }
        linkElement.setAttribute(ATTACHMENT_META_ATTR, dateText ? "both" : "size");

        if (linkElement.getAttribute(ATTACHMENT_FILL_ATTR) === "1") {
            this.observeChipResize(linkElement);
            this.updateMetaVisibility(linkElement);
        } else {
            this.unobserveChipResize(linkElement);
        }
    }

    private ensureResizeObserver() {
        if (this.resizeObserver || typeof ResizeObserver === "undefined") {
            return;
        }
        this.resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                this.updateMetaVisibility(entry.target as HTMLElement);
            });
        });
    }

    private observeChipResize(linkElement: HTMLElement) {
        this.ensureResizeObserver();
        this.resizeObserver?.observe(linkElement);
    }

    private unobserveChipResize(linkElement: HTMLElement) {
        this.resizeObserver?.unobserve(linkElement);
    }

    /**
     * 窄宽度时逐级降级：完整 -> 隐藏日期 -> 隐藏大小 -> 只保留文件名省略号。
     * 只在“单元格里只有附件”的胶囊上生效，此时宽度由表格列决定，不会来回抖动。
     */
    private updateMetaVisibility(linkElement: HTMLElement) {
        if (!this.enabled || !linkElement.isConnected) {
            return;
        }
        if (linkElement.getAttribute(ATTACHMENT_FILL_ATTR) !== "1") {
            this.unobserveChipResize(linkElement);
            return;
        }
        if (linkElement.getAttribute(ATTACHMENT_MISSING_ATTR) === "1") {
            return;
        }
        if (!linkElement.hasAttribute(ATTACHMENT_SIZE_ATTR)) {
            return;
        }
        const available = linkElement.clientWidth;
        if (available <= 0) {
            return;
        }
        const hasDate = linkElement.hasAttribute(ATTACHMENT_DATE_ATTR);
        if (hasDate && this.measureMetaWidth(linkElement, "both") <= available + 1) {
            linkElement.setAttribute(ATTACHMENT_META_ATTR, "both");
            return;
        }
        if (this.measureMetaWidth(linkElement, "size") <= available + 1) {
            linkElement.setAttribute(ATTACHMENT_META_ATTR, "size");
            return;
        }
        linkElement.setAttribute(ATTACHMENT_META_ATTR, "none");
    }

    /**
     * 在页面外测量胶囊的自然宽度。
     * 不能用 scrollWidth：胶囊有 contain:inline-size，scrollWidth 会被钳到当前宽度。
     */
    private measureMetaWidth(linkElement: HTMLElement, meta: "both" | "size"): number {
        const host = document.createElement("div");
        host.className = "protyle-wysiwyg";
        host.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;white-space:nowrap;";
        const computed = getComputedStyle(linkElement);
        const clone = linkElement.cloneNode(true) as HTMLElement;
        clone.removeAttribute(ATTACHMENT_FILL_ATTR);
        clone.setAttribute(ATTACHMENT_META_ATTR, meta);
        clone.style.fontSize = computed.fontSize;
        clone.style.fontFamily = computed.fontFamily;
        clone.style.letterSpacing = computed.letterSpacing;
        clone.style.margin = "0";
        clone.style.width = "max-content";
        clone.style.maxWidth = "none";
        clone.style.contain = "none";
        host.appendChild(clone);
        document.body.appendChild(host);
        const width = clone.getBoundingClientRect().width;
        host.remove();
        return width;
    }

    private removeAttributes() {
        document.querySelectorAll<HTMLElement>(ATTACHMENT_LINK_SELECTOR).forEach((element) => {
            element.removeAttribute(ATTACHMENT_ATTR);
            element.removeAttribute(ATTACHMENT_TAG_ATTR);
            element.removeAttribute(ATTACHMENT_TYPE_ATTR);
            element.removeAttribute(ATTACHMENT_FILL_ATTR);
            element.removeAttribute(ATTACHMENT_SIZE_ATTR);
            element.removeAttribute(ATTACHMENT_DATE_ATTR);
            element.removeAttribute(ATTACHMENT_META_ATTR);
            element.removeAttribute(ATTACHMENT_MISSING_ATTR);
        });
    }

    private cleanupDisconnectedObservers() {
        for (const [element, observer] of this.observers) {
            if (!element.isConnected) {
                observer.disconnect();
                this.observers.delete(element);
            }
        }
    }

}

function handleLoadedProtyle(event: any) {
    const element = event?.detail?.protyle?.wysiwyg?.element as HTMLElement;
    if (element) {
        AttachmentChipService.ins.attachProtyle(element);
    }
}

/**
 * 表格单元格里只有这个附件时，让胶囊铺满单元格并参与收缩。
 * 这样表格列宽不会被 nowrap 文件名的“最小内容宽度”锁死。
 */
function markTableCellFill(linkElement: HTMLElement) {
    const cell = linkElement.closest("td, th") as HTMLTableCellElement;
    if (!cell) {
        linkElement.removeAttribute(ATTACHMENT_FILL_ATTR);
        return;
    }
    let directChild: HTMLElement = linkElement;
    while (directChild.parentElement && directChild.parentElement !== cell) {
        directChild = directChild.parentElement;
    }
    const cellText = normalizeCellText(cell.textContent);
    const linkText = normalizeCellText(linkElement.textContent);
    const onlyAttachment = cell.children.length === 1 &&
        cell.firstElementChild === directChild &&
        cellText === linkText;
    if (onlyAttachment) {
        linkElement.setAttribute(ATTACHMENT_FILL_ATTR, "1");
        return;
    }
    linkElement.removeAttribute(ATTACHMENT_FILL_ATTR);
    // 单元格里混入了其它内容时，恢复完整元信息，避免保留窄列的 none 状态
    if (linkElement.hasAttribute(ATTACHMENT_SIZE_ATTR)) {
        linkElement.setAttribute(
            ATTACHMENT_META_ATTR,
            linkElement.hasAttribute(ATTACHMENT_DATE_ATTR) ? "both" : "size",
        );
    }
}

function normalizeCellText(text: string): string {
    return (text || "").replace(/\u200b/g, "").trim();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    return new Promise((resolve) => {
        let settled = false;
        const timerId = window.setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(null);
        }, timeoutMs);
        promise
            .then((value) => {
                if (settled) {
                    return;
                }
                settled = true;
                window.clearTimeout(timerId);
                resolve(value);
            })
            .catch(() => {
                if (settled) {
                    return;
                }
                settled = true;
                window.clearTimeout(timerId);
                resolve(null);
            });
    });
}

function formatSize(size: number): string {
    if (!size || size <= 0) {
        return "";
    }
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = size;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value = value / 1024;
        unitIndex++;
    }
    return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}
