import { setBlockAttrs } from "@/utils/api";
import { SettingService } from "@/service/SettingService";

export const LEGACY_CODE_BLOCK_HEIGHT_ATTR = "custom-misuzu2027-code-block-height";

export function isPlainCodeBlock(element: Element | null | undefined): element is HTMLElement {
    return !!element
        && element instanceof HTMLElement
        && element.getAttribute("data-type") === "NodeCodeBlock"
        && !element.classList.contains("render-node")
        && !element.getAttribute("data-subtype");
}

export function getHljsElement(codeBlockElement: Element): HTMLElement | null {
    return codeBlockElement.querySelector("div.hljs");
}

export function getGlobalCodeBlockMaxHeight(): number | null {
    const maxHeight = SettingService.ins.SettingConfig?.codeBlockMaxHeight;
    if (!maxHeight || maxHeight <= 50) {
        return null;
    }
    return maxHeight;
}

export function getCodeBlockFoldHeight(): number {
    const foldHeight = SettingService.ins.SettingConfig?.codeBlockFoldHeight;
    if (isNaN(foldHeight) || foldHeight <= 150) {
        return 150;
    }
    return foldHeight;
}

export function getCodeBlockNaturalHeight(codeBlockElement: HTMLElement): number {
    const hljsElement = getHljsElement(codeBlockElement);
    if (!hljsElement) {
        return codeBlockElement.scrollHeight;
    }
    const extra = Math.max(0, codeBlockElement.clientHeight - hljsElement.clientHeight);
    return hljsElement.scrollHeight + extra;
}

export function isCodeBlockFullyExpanded(codeBlockElement: HTMLElement): boolean {
    const hljsElement = getHljsElement(codeBlockElement);
    if (!hljsElement) {
        return true;
    }
    return hljsElement.clientHeight >= hljsElement.scrollHeight - 1;
}

export function persistCodeBlockStyle(codeBlockElement: HTMLElement) {
    const id = codeBlockElement.getAttribute("data-node-id");
    if (!id) {
        return;
    }
    const attrs: { [key: string]: string } = {
        style: codeBlockElement.getAttribute("style") ?? "",
    };
    if (codeBlockElement.hasAttribute(LEGACY_CODE_BLOCK_HEIGHT_ATTR)) {
        attrs[LEGACY_CODE_BLOCK_HEIGHT_ATTR] = "";
        codeBlockElement.removeAttribute(LEGACY_CODE_BLOCK_HEIGHT_ATTR);
    }
    setBlockAttrs(id, attrs);
}

export function setCodeBlockMaxHeight(
    codeBlockElement: HTMLElement,
    maxHeightPx: number | null,
    persist: boolean,
) {
    if (maxHeightPx == null || isNaN(maxHeightPx)) {
        codeBlockElement.style.removeProperty("max-height");
    } else {
        codeBlockElement.style.maxHeight = `${Math.round(maxHeightPx)}px`;
    }
    if (persist) {
        persistCodeBlockStyle(codeBlockElement);
    }
}

export function clearLegacyHljsHeightStyles(codeBlockElement: HTMLElement) {
    const hljsElement = getHljsElement(codeBlockElement);
    if (!hljsElement) {
        return;
    }
    hljsElement.style.removeProperty("height");
    hljsElement.style.removeProperty("max-height");
}

export function migrateLegacyCodeBlockHeight(codeBlockElement: HTMLElement) {
    const legacy = codeBlockElement.getAttribute(LEGACY_CODE_BLOCK_HEIGHT_ATTR);
    if (!legacy) {
        return;
    }
    const px = parseFloat(legacy);
    if (!codeBlockElement.style.maxHeight && !isNaN(px) && px > 0) {
        setCodeBlockMaxHeight(codeBlockElement, px, true);
        return;
    }
    persistCodeBlockStyle(codeBlockElement);
}
