import { EnvConfig } from "@/config/EnvConfig";
import { SettingService } from "@/service/SettingService";
import Instance from "@/utils/Instance";

const PROTYLE_MOUSEDOWN_FLAG = "misuzu2027-protyle-wysiwyg-mousedown";

export class ProtyleWysiwygService {

    public static get ins(): ProtyleWysiwygService {
        return Instance.get(ProtyleWysiwygService);
    }

    public init() {
        initBusEvent();
    }

    public destroy() {
        EnvConfig.ins.plugin.eventBus.off("loaded-protyle-static", handleLoadedProtyle);
        EnvConfig.ins.plugin.eventBus.off("loaded-protyle-dynamic", handleLoadedProtyle);
        document.querySelectorAll(`[${PROTYLE_MOUSEDOWN_FLAG}="1"]`).forEach((element) => {
            element.removeEventListener("mousedown", handletoggleTitleOrListMousedown);
            element.removeAttribute(PROTYLE_MOUSEDOWN_FLAG);
        });
    }

}

function initBusEvent() {
    const enabled = SettingService.ins.SettingConfig.protyleWysiwygMiddleClickToggle;
    const plugin = EnvConfig.ins.plugin;
    // 先解绑，避免设置反复开关或 init 时重复注册
    plugin.eventBus.off("loaded-protyle-static", handleLoadedProtyle);
    plugin.eventBus.off("loaded-protyle-dynamic", handleLoadedProtyle);

    if (!enabled) {
        return;
    }

    plugin.eventBus.on("loaded-protyle-static", handleLoadedProtyle);
    plugin.eventBus.on("loaded-protyle-dynamic", handleLoadedProtyle);
}


function handleLoadedProtyle(e) {
    let wysiwygElement = e.detail.protyle.wysiwyg.element;
    initProtyleElement(wysiwygElement);
}



function initProtyleElement(protyleContentElement: HTMLElement) {
    if (!protyleContentElement || protyleContentElement.getAttribute(PROTYLE_MOUSEDOWN_FLAG) === "1") {
        return;
    }
    protyleContentElement.setAttribute(PROTYLE_MOUSEDOWN_FLAG, "1");
    protyleContentElement.addEventListener("mousedown", handletoggleTitleOrListMousedown);
}

function handletoggleTitleOrListMousedown(event: MouseEvent) {
    if (event.button != 1) return;
    if (!event.ctrlKey) {
        return;
    }
    if (!SettingService.ins.SettingConfig.protyleWysiwygMiddleClickToggle) {
        return;
    }
    const target = event.target as HTMLElement;
    // const headingEl = target.closest('[data-type="NodeHeading"]');


    // 标题折叠需要调用 transactions 接口
    // if (headingEl) {
    //     let fold = headingEl.getAttribute("fold");
    //     if (fold == "1") {
    //         headingEl.removeAttribute("fold");
    //         event.stopPropagation();
    //         event.preventDefault();
    //     } else {
    //         headingEl.setAttribute("fold", "1");
    //         event.stopPropagation();
    //         event.preventDefault();
    //     }
    // }

    const listEl = target.closest('[data-type="NodeListItem"]');
    if (listEl) {
        let fold = listEl.getAttribute("fold");
        if (fold == "1") {
            listEl.removeAttribute("fold");
            event.stopPropagation();
            event.preventDefault();
        } else {
            listEl.setAttribute("fold", "1");
            event.stopPropagation();
            event.preventDefault();
        }
    }
}
