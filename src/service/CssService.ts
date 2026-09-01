
import Instance from "@/utils/Instance";
import { CUSTOM_CSS_CLASS_MAP, getHideDockClassName, HIDEABLE_DOCK_TYPES, HideableDockType } from "@/models/css-constant";
import { SettingService } from "./SettingService";

export class CssService {

    public static get ins(): CssService {
        return Instance.get(CssService);
    }

    public init() {
        let bodyElement = getBodyElement();
        if (!bodyElement) {
            return;
        }
        bodyElement.classList.add("misuzu2027");

        this.initClass();
    }


    public initClass() {
        let bodyElement = getBodyElement();
        if (!bodyElement) {
            return;
        }
        for (const key of Object.keys(CUSTOM_CSS_CLASS_MAP)) {
            bodyElement.classList.remove(CUSTOM_CSS_CLASS_MAP[key].name);
        }
        for (const type of HIDEABLE_DOCK_TYPES) {
            bodyElement.classList.remove(getHideDockClassName(type));
        }

        let settingConfig = SettingService.ins.SettingConfig;
        if (settingConfig.useRefTextStyle) {
            bodyElement.classList.add(CUSTOM_CSS_CLASS_MAP.refTextClass.name);
        }
        if (settingConfig.codeBlockMaxHeight) {
            bodyElement.classList.add(CUSTOM_CSS_CLASS_MAP.codeBlockMaxHeightClass.name);
        }
        if (settingConfig.codeBlockAdjustHeight) {
            bodyElement.classList.add(CUSTOM_CSS_CLASS_MAP.codeBlockDragHeightClass.name);
        }

        const hideDockIcons = Array.isArray(settingConfig.hideDockIcons)
            ? settingConfig.hideDockIcons
            : [];
        for (const type of hideDockIcons) {
            if (!HIDEABLE_DOCK_TYPES.includes(type as HideableDockType)) {
                continue;
            }
            bodyElement.classList.add(getHideDockClassName(type));
            closeActiveDockPanel(type as HideableDockType);
        }
    }

    public destroy() {
        const bodyElement = getBodyElement();
        if (!bodyElement) {
            return;
        }
        bodyElement.classList.remove("misuzu2027");
        for (const key of Object.keys(CUSTOM_CSS_CLASS_MAP)) {
            bodyElement.classList.remove(CUSTOM_CSS_CLASS_MAP[key].name);
        }
        for (const type of HIDEABLE_DOCK_TYPES) {
            bodyElement.classList.remove(getHideDockClassName(type));
        }
    }

}

/** 关闭已打开的内置 Dock 面板（仅在图标处于激活态时点击最小化，避免误开） */
function closeActiveDockPanel(type: HideableDockType) {
    const activeIcon = document.querySelector(`.dock span.dock__item--active[data-type="${type}"]`);
    if (!activeIcon) {
        return;
    }
    const min = document.querySelector(`div.file-tree.sy__${type} span[data-type="min"]`) as HTMLElement | null;
    min?.click();
}



function getBodyElement() {
    let tagNameArray = document.getElementsByTagName("body");
    if (!tagNameArray || !tagNameArray.item(0)) {
        return;
    }
    return tagNameArray.item(0);
}
