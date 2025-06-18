import { EnvConfig } from "@/config/EnvConfig";
import { SettingService } from "@/service/SettingService";
import Instance from "@/utils/Instance";

export class ProtyleWysiwygService {

    public static get ins(): ProtyleWysiwygService {
        return Instance.get(ProtyleWysiwygService);
    }

    public init() {



        initBusEvent();

    }

    public destroy() {
        EnvConfig.ins.plugin.eventBus.off("loaded-protyle-static", handleLoadedProtyle);

    }


}

function initBusEvent() {
    console.log("ProtyleWysiwyg handleLoadedProtyle")
    let fileTreeKeywordFilter = SettingService.ins.SettingConfig.protyleWysiwygMiddleClickToggle;


    if (fileTreeKeywordFilter
    ) {

        EnvConfig.ins.plugin.eventBus.off("loaded-protyle-static", handleLoadedProtyle);
        EnvConfig.ins.plugin.eventBus.off("loaded-protyle-dynamic", handleLoadedProtyle);

        EnvConfig.ins.plugin.eventBus.on("loaded-protyle-static", handleLoadedProtyle);
        EnvConfig.ins.plugin.eventBus.on("loaded-protyle-dynamic", handleLoadedProtyle);

    }

}


function handleLoadedProtyle(e) {
    console.log("ProtyleWysiwyg handleLoadedProtyle")
    let protyleElement = e.detail.protyle.element;
    let wysiwygElement = e.detail.protyle.wysiwyg.element;
    initProtyleElement(wysiwygElement);
}



function initProtyleElement(protyleContentElement: HTMLElement) {
    protyleContentElement.addEventListener('mousedown', handletoggleTitleOrListMousedown);

}

function handletoggleTitleOrListMousedown(event: MouseEvent) {
    console.log("ProtyleWysiwyg handletoggleTitleOrListMousedown")
    if (event.button != 1) return;
    if (!event.ctrlKey) {
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

