
import Instance from "@/utils/Instance";
import { CODE_BLOCK_MAX_HEIGHT_VAR, CUSTOM_CSS_CLASS_MAP } from "@/models/css-constant";
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

        let settingConfig = SettingService.ins.SettingConfig;
        if (settingConfig.useRefTextStyle) {
            bodyElement.classList.add(CUSTOM_CSS_CLASS_MAP.refTextClass.name);
        }
        if (settingConfig.codeBlockMaxHeight && settingConfig.codeBlockMaxHeight > 50) {
            bodyElement.classList.add(CUSTOM_CSS_CLASS_MAP.codeBlockMaxHeightClass.name);
            bodyElement.style.setProperty(CODE_BLOCK_MAX_HEIGHT_VAR, `${settingConfig.codeBlockMaxHeight}px`);
        } else {
            bodyElement.style.removeProperty(CODE_BLOCK_MAX_HEIGHT_VAR);
        }
        if (settingConfig.codeBlockAdjustHeight) {
            bodyElement.classList.add(CUSTOM_CSS_CLASS_MAP.codeBlockDragHeightClass.name);
        }
    }

    public destroy() {
        const bodyElement = getBodyElement();
        if (!bodyElement) {
            return;
        }
        bodyElement.classList.remove("misuzu2027");
        bodyElement.style.removeProperty(CODE_BLOCK_MAX_HEIGHT_VAR);
        for (const key of Object.keys(CUSTOM_CSS_CLASS_MAP)) {
            bodyElement.classList.remove(CUSTOM_CSS_CLASS_MAP[key].name);
        }
    }

}



function getBodyElement() {
    let tagNameArray = document.getElementsByTagName("body");
    if (!tagNameArray || !tagNameArray.item(0)) {
        return;
    }
    return tagNameArray.item(0);
}
