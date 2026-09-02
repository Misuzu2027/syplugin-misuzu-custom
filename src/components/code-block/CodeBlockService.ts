import { EnvConfig } from "@/config/EnvConfig";
import Instance from "@/utils/Instance";
import CodeBlockNameInputSvelte from "@/components/code-block/code-block-name-input.svelte";
import CodeBlockToggleButtonSvelte from "@/components/code-block/code-block-toggle-button.svelte";
import { findScrollableParent, stringToElement } from "@/utils/html-util";
import { CssService } from "@/service/CssService";
import { SettingService } from "@/service/SettingService";
import { isValidStr } from "@/utils/string-util";
import {
    clearLegacyHljsHeightStyles,
    getCodeBlockNaturalHeight,
    getGlobalCodeBlockMaxHeight,
    getHljsElement,
    isPlainCodeBlock,
    migrateLegacyCodeBlockHeight,
    persistCodeBlockStyle,
    setCodeBlockMaxHeight,
} from "@/components/code-block/code-block-height";

const codeBlockLanguageObservers = new Set<MutationObserver>();
const codeBlockSvelteApps: Array<{ $destroy: () => void }> = [];

export class CodeBlockService {

    public static get ins(): CodeBlockService {
        return Instance.get(CodeBlockService);
    }

    public init() {
        CssService.ins.initClass()
        initBusEvent();

    }

    public destroy() {
        EnvConfig.ins.plugin.eventBus.off("loaded-protyle-static", handleLoadedProtyle);
        EnvConfig.ins.plugin.eventBus.off("loaded-protyle-dynamic", handleLoadedProtyle);

        EnvConfig.ins.plugin.eventBus.off("ws-main", handlewsMain);

        for (const observer of codeBlockLanguageObservers) {
            observer.disconnect();
        }
        codeBlockLanguageObservers.clear();
        document.querySelectorAll("[data-misuzu2027-observed]").forEach((element) => {
            element.removeAttribute("data-misuzu2027-observed");
        });

        for (const app of codeBlockSvelteApps) {
            app.$destroy();
        }
        codeBlockSvelteApps.length = 0;

        let dragBarElementArray = document.querySelectorAll(".drag-bar.misuzu2027__copy");
        if (dragBarElementArray) {
            for (const element of dragBarElementArray) {
                element.remove();
            }
        }
        let nameingElementArray = document.querySelectorAll("span[misuzu2027-code-block-naming].misuzu2027__copy");
        if (nameingElementArray) {
            for (const element of nameingElementArray) {
                element.remove();
            }
        }
        document.querySelectorAll("span[misuzu2027-code-block-toggle-button]").forEach((element) => {
            element.remove();
        });
    }

}



function initBusEvent() {
    let settingConfig = SettingService.ins.SettingConfig;
    const plugin = EnvConfig.ins.plugin;
    // 始终先解绑，关闭相关设置后不会残留监听
    plugin.eventBus.off("loaded-protyle-static", handleLoadedProtyle);
    plugin.eventBus.off("loaded-protyle-dynamic", handleLoadedProtyle);
    plugin.eventBus.off("ws-main", handlewsMain);

    if (settingConfig.codeBlockTopLanguages
        || settingConfig.codeBlockNaming
        || settingConfig.codeBlockMaxHeight
        || settingConfig.codeBlockAdjustHeight
        || settingConfig.codeBlockToggle
    ) {
        plugin.eventBus.on("loaded-protyle-static", handleLoadedProtyle);
        plugin.eventBus.on("loaded-protyle-dynamic", handleLoadedProtyle);
    }

    if (settingConfig.codeBlockNaming
        || settingConfig.codeBlockMaxHeight
        || settingConfig.codeBlockAdjustHeight
        || settingConfig.codeBlockToggle
    ) {
        plugin.eventBus.on("ws-main", handlewsMain);
    }
}



function handleLoadedProtyle(e) {
    let protyleElement = e.detail.protyle.element;
    addObserveCodeBlockLanguageElement(protyleElement);
    let wysiwygElement = e.detail.protyle.wysiwyg.element;
    initProtyleElement(wysiwygElement);

}

function handlewsMain(e) {

    if (e.detail.cmd != "transactions"
        || !e.detail.data
    ) {
        return;
    }
    let existUpdateCodeBlock = false;
    for (const dataObj of e.detail.data) {
        if (!dataObj || !dataObj.doOperations) {
            continue;
        }
        for (const doOperation of dataObj.doOperations) {
            if (doOperation && (doOperation.action == "update" || doOperation.action == "insert")) {
                let operationElement = stringToElement(doOperation.data);
                if (operationElement && operationElement.getAttribute("data-type") == "NodeCodeBlock") {
                    existUpdateCodeBlock = true;
                    break;
                }
            }
        }
    }

    if (!existUpdateCodeBlock) {
        return;
    }

    let codeBlockElementList = document.querySelectorAll(`div[data-node-id][data-type*="NodeCodeBlock"]`);
    initCodeBlockElementList(codeBlockElementList);

    // "savedoc" "transactions"
    // detail.data[0].doOperations.id
}



function initProtyleElement(protyleContentElement: HTMLElement) {
    let codeBlockElementArray = protyleContentElement.querySelectorAll(`div[data-node-id][data-type*="NodeCodeBlock"]`);
    initCodeBlockElementList(codeBlockElementArray);
}

function initCodeBlockElementList(codeBlockElementArray: NodeListOf<Element>) {
    let settingConfig = SettingService.ins.SettingConfig;
    if (!codeBlockElementArray || !settingConfig) {
        return;
    }

    for (const element of codeBlockElementArray) {
        // 添加代码块命名
        if (settingConfig.codeBlockNaming) {
            createCodeBlockNameInputSvelte(element);
        }

        if (!isPlainCodeBlock(element)) {
            continue;
        }

        migrateLegacyCodeBlockHeight(element);
        clearLegacyHljsHeightStyles(element);

        // 创建折叠按钮
        if (settingConfig.codeBlockToggle) {
            createCodeBlockToggleButton(element);
        }

        // 创建拖动条
        if (settingConfig.codeBlockAdjustHeight) {
            addCodeBlockDragBar(element);
        }
    }
}



function createCodeBlockNameInputSvelte(
    codeBlockElement: Element,) {
    if (!codeBlockElement || codeBlockElement.querySelector("span[misuzu2027-code-block-naming]")) {
        return;
    }
    let blockId = codeBlockElement.getAttribute("data-node-id");
    let blockName = codeBlockElement.getAttribute("name");
    let languageSelectElement = codeBlockElement.querySelector(`.protyle-action span.protyle-action__language`);
    if (!languageSelectElement) {
        return;
    }
    let codeBlockNameElement = document.createElement("span");
    codeBlockNameElement.classList.add("misuzu2027__copy", "misuzu2027__protyle-custom");
    codeBlockNameElement.setAttribute("contenteditable", "false");
    codeBlockNameElement.setAttribute("misuzu2027-code-block-naming", "1");

    codeBlockSvelteApps.push(new CodeBlockNameInputSvelte({
        target: codeBlockNameElement,
        props: {
            codeBlockId: blockId,
            codeBlockName: blockName,
        }
    }));
    languageSelectElement.insertAdjacentElement('afterend', codeBlockNameElement);


}


function createCodeBlockToggleButton(codeBlockElement: Element,) {
    let atrName = "misuzu2027-code-block-toggle-button";
    if (!codeBlockElement || codeBlockElement.querySelector(`span[${atrName}]`)) {
        return;
    }
    // b3-tooltips__nw b3-tooltips protyle-icon protyle-icon--first protyle-action__copy
    let iconFirstElement = codeBlockElement.querySelector(".protyle-icon--first");
    if (!iconFirstElement?.parentElement) {
        return;
    }

    let codeBlockNameElement = document.createElement("span");
    codeBlockNameElement.classList.add("misuzu2027__copy", "misuzu2027__protyle-custom");
    codeBlockNameElement.setAttribute("contenteditable", "false");
    codeBlockNameElement.setAttribute(atrName, "1");

    codeBlockSvelteApps.push(new CodeBlockToggleButtonSvelte({
        target: codeBlockNameElement,
        props: {
            codeBlockElement,
        }
    }));
    iconFirstElement.parentElement.insertBefore(codeBlockNameElement, iconFirstElement);


}


function addCodeBlockDragBar(codeBlockElement: HTMLElement) {
    if (codeBlockElement.querySelector("div.drag-bar.misuzu2027__protyle-custom")) {
        return;
    }

    const hljsElement = getHljsElement(codeBlockElement);
    if (!hljsElement) {
        return;
    }

    let dragBarElement = document.createElement("div");
    dragBarElement.classList.add("drag-bar", "misuzu2027__copy", "misuzu2027__protyle-custom");
    dragBarElement.setAttribute("contenteditable", "false")

    hljsElement.insertAdjacentElement('afterend', dragBarElement);

    dragBarElement.addEventListener('click', (e) => {
        e.stopPropagation();
    });


    let isDragging = false;
    let draggingBarElement: HTMLElement;
    let draggingStartY: number;
    let draggingScrollableParentElement: HTMLElement;
    let draggingScrollTop: number;
    let draggingStartHeight: number;

    dragBarElement.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();

        isDragging = true;
        draggingBarElement = dragBarElement;
        draggingStartY = e.clientY;
        draggingScrollableParentElement = findScrollableParent(codeBlockElement);
        draggingScrollTop = draggingScrollableParentElement ? draggingScrollableParentElement.scrollTop : 0;
        draggingStartHeight = codeBlockElement.getBoundingClientRect().height;

        document.addEventListener("mousemove", handleDocumentMousemove);
        document.addEventListener("mouseup", handleDocumentMouseup);
    });

    function handleDocumentMousemove(e) {
        if (!isDragging) return;
        let offsetY = draggingStartY - e.clientY;
        if (offsetY == 0) {
            return;
        }
        e.stopPropagation();
        let newScrollTop = draggingScrollableParentElement
            ? draggingScrollableParentElement.scrollTop - draggingScrollTop
            : 0;
        let newHeight = draggingStartHeight - offsetY + newScrollTop;
        updateDraggingHeight(newHeight);
    };

    function handleDocumentMouseup() {
        if (isDragging) {
            if (draggingBarElement) {
                draggingBarElement.style.removeProperty("background-color");
            }
            isDragging = false;
            persistCodeBlockStyle(codeBlockElement);
        }

        document.removeEventListener("mousemove", handleDocumentMousemove);
        document.removeEventListener("mouseup", handleDocumentMouseup);
    }

    function updateDraggingHeight(newHeight: number) {
        if (isNaN(newHeight) || newHeight < 20) {
            if (isDragging && draggingBarElement) {
                draggingBarElement.style.backgroundColor = "red";
            }
            return;
        }

        const globalMaxHeight = getGlobalCodeBlockMaxHeight();
        if (globalMaxHeight && newHeight > globalMaxHeight + 1) {
            if (isDragging && draggingBarElement) {
                draggingBarElement.style.backgroundColor = "red";
            }
            setCodeBlockMaxHeight(codeBlockElement, globalMaxHeight, false);
            return;
        }

        const naturalHeight = getCodeBlockNaturalHeight(codeBlockElement);
        if (newHeight >= naturalHeight - 1) {
            if (isDragging && draggingBarElement) {
                draggingBarElement.style.backgroundColor = "red";
            }
            setCodeBlockMaxHeight(codeBlockElement, null, false);
            return;
        }

        if (draggingBarElement) {
            draggingBarElement.style.removeProperty("background-color");
        }
        setCodeBlockMaxHeight(codeBlockElement, newHeight, false);
    }
}


function addObserveCodeBlockLanguageElement(protyleElement: HTMLElement) {

    let protyleUtilElement = protyleElement.querySelector("div.protyle-util");
    if (!protyleUtilElement || protyleUtilElement.getAttribute("data-misuzu2027-observed") == "1") {
        return;
    }

    // 创建一个 MutationObserver 实例，并传入回调函数
    const observer = new MutationObserver((mutationsList, observer) => {
        let codeBlockTopLanguages = SettingService.ins.SettingConfig.codeBlockTopLanguages;
        if (!isValidStr(codeBlockTopLanguages)) {
            return;
        }

        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes) {
                for (let childNode of mutation.addedNodes.values()) {
                    const childElement = childNode as HTMLElement;
                    if (Node.ELEMENT_NODE != childNode.nodeType
                        || !childElement.matches("div.fn__flex-column")
                        || childElement.children.length != 2
                        || childElement.children[0].tagName.toLowerCase() !== "input"
                        || !childElement.children[0].matches(".b3-text-field")
                        || !childElement.children[1].matches("div.b3-list.fn__flex-1.b3-list--background")
                    ) {
                        continue;
                    }
                    let languageSelectElement = childElement.lastElementChild;
                    let oldFirstItemElement = languageSelectElement.children[1];
                    let topLanguageArray = codeBlockTopLanguages.replace(/，/g, ',').split(",");
                    for (const language of topLanguageArray) {
                        if (!isValidStr(language)) {
                            continue;
                        }
                        let newItemElement = document.createElement("div");
                        newItemElement.classList.add("b3-list-item");
                        newItemElement.textContent = language;
                        languageSelectElement.insertBefore(newItemElement, oldFirstItemElement);
                    }
                    languageSelectElement.insertBefore(document.createElement("hr"), languageSelectElement.children[1]);
                    languageSelectElement.insertBefore(document.createElement("hr"), oldFirstItemElement);
                }
            }
        }
    });

    // 配置 MutationObserver 监听的类型
    const config = { childList: true, };
    protyleUtilElement.setAttribute("data-misuzu2027-observed", "1")
    // 开始观察目标节点
    observer.observe(protyleUtilElement, config);
    codeBlockLanguageObservers.add(observer);
}