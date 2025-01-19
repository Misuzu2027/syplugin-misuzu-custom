
import { EnvConfig } from "@/config/EnvConfig";
import { SettingService } from "@/service/SettingService";
import { hasClosestByClassName, hasClosestByTagName, isPxOrPercentWidth } from "@/utils/html-util";
import Instance from "@/utils/Instance";
import { confirmDialog, getActiveTab } from "@/utils/siyuan-util";
import { showMessage } from "siyuan";
import { isStrBlank, isStrNotBlank } from "@/utils/string-util";

export class ImageScalingService {


    public static get ins(): ImageScalingService {
        return Instance.get(ImageScalingService);
    }

    private topBarElement: HTMLElement;

    public init() {
        this.initEventListener();

        let showTopBar = SettingService.ins.SettingConfig.topBarShowImageZoomBtn;
        if (showTopBar) {
            this.topBarElement = EnvConfig.ins.plugin.addTopBar({
                icon: "iconContract",
                title: EnvConfig.ins.plugin.i18n.ZoomWidthLoadedImagesCurrentDocument,
                position: "right",
                callback: () => {
                    let currentDocument: HTMLDivElement = getActiveTab();
                    if (!currentDocument) {
                        return;
                    }

                    let divElement = document.createElement("div");
                    const tipSpan = document.createElement("p");
                    tipSpan.textContent = EnvConfig.ins.plugin.i18n.MiddleClickResizeImageWidthDesc;
                    const brElement = document.createElement("br");
                    const widthInput = document.createElement("input");
                    widthInput.className = "b3-text-field fn__block";

                    divElement.append(tipSpan);
                    divElement.append(brElement);
                    divElement.append(widthInput);
                    confirmDialog(
                        EnvConfig.ins.plugin.i18n.ZoomWidthLoadedImagesCurrentDocument
                        , divElement
                        , (): boolean => {
                            return batchUpdateCurDocImageWidth(widthInput.value);
                        });
                }
            });
        } else {
            if (this.topBarElement) {
                let topBarElements = EnvConfig.ins.plugin.topBarIcons;
                for (let i = 0; i < topBarElements.length; i++) {
                    if (topBarElements[i].id === this.topBarElement.id) {
                        this.topBarElement.remove();

                        topBarElements.splice(i, 1); // 删除当前元素
                        i--; // 调整索引以避免跳过下一个元素
                        break;
                    }
                }
            }

        }
    }

    public destroy() {

    }

    public initEventListener() {
        let classFlag = "misuzu2027__image_zoom_mousedown";
        if (document.body.matches(`.${classFlag}`)) {
            return;
        }
        document.body.classList.add("misuzu2027__image_zoom_mousedown")
        document.body.addEventListener('mousedown', handleImageZoomMousedown);
    }

}

function handleImageZoomMousedown(event: MouseEvent) {

    if (event.button != 1) return;
    let imageWidthValue = SettingService.ins.SettingConfig.imageMiddleClickResizeWidth;
    if (isStrBlank(imageWidthValue)) {
        // showImageFaileMessage("宽度为空");
        return;
    }
    let clickElement = event.target as HTMLElement;
    // 检查点击的元素是否是图片
    if (!clickElement.matches('.protyle-wysiwyg div[data-node-id] span.img[data-type="img"] img')) {
        return;
    }
    let imageSpanElement = clickElement.parentElement.parentElement;
    // 如果图片在表格中，也不进行设置
    if (imageSpanElement.parentElement.tagName.toLowerCase() === "td") {
        // return;
    }
    let layoutTabContainerElement = clickElement.parentElement;

    // 图片宽度，目前思源只支持 px,vw。
    if (!isPxOrPercentWidth(imageWidthValue)
        && !imageWidthValue.startsWith("-")
        && !imageWidthValue.startsWith("calc")
    ) {
        showImageFaileMessage("宽度格式不正确");
        event.preventDefault();
        return;
    }

    // // 循环查找当前点击的文档元素
    while (layoutTabContainerElement) {
        if (layoutTabContainerElement.tagName.toLowerCase() === 'div'
            && layoutTabContainerElement.classList.contains('protyle')
            && layoutTabContainerElement.classList.contains('fn__flex-1')) {
            break;
        }
        layoutTabContainerElement = layoutTabContainerElement.parentElement;
    }
    // 默认非只读模式
    let isReadonly = false;
    if (layoutTabContainerElement) {
        let readonlyButton = layoutTabContainerElement.querySelector('[data-type="readonly"]');
        if (readonlyButton) {
            isReadonly = readonlyButton.querySelector("use").getAttribute("xlink:href") !== "#iconUnlock";
        }
    }
    if (isReadonly) {
        console.log("点击自动设置图片宽度失败！当前是只读模式。图片地址：" + clickElement.getAttribute("src"));
        event.preventDefault();
        return;
    }
    let flag = zoomImageWith(clickElement, imageWidthValue);
    if (flag) {
        event.preventDefault();
    }

}




function zoomImageWith(target: HTMLElement, width: string): boolean {
    if (!target) {
        return;
    }
    if (width && width.startsWith("-")) {
        width = null;
    }
    // 创建一个 mousedown 事件
    const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true, // 事件是否冒泡
        cancelable: true, // 事件是否可取消
        view: window // 视图环境
    });
    // 创建一个 mouseup 事件
    const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true, // 事件是否冒泡
        cancelable: true, // 事件是否可取消
        view: window // 视图环境
    });

    let imgParentSpanElement = hasClosestByTagName(target, "span");
    if (!imgParentSpanElement) {
        return;
    }
    let dragElement = imgParentSpanElement.parentElement.querySelector(".protyle-action__drag");
    if (!dragElement) {
        return;
    }
    let imgSpanElement = hasClosestByClassName(imgParentSpanElement, "img", "span");
    if (imgSpanElement && isStrNotBlank(imgSpanElement.style.width)) {
        imgSpanElement.removeAttribute('style')
        // imgSpanElement.style.width = '';
    }

    dragElement.dispatchEvent(mouseDownEvent);
    if (width) {
        imgParentSpanElement.style.width = width;
    } else {
        imgParentSpanElement.style.removeProperty('width');
    }
    dragElement.dispatchEvent(mouseUpEvent);
    return true;
}

function zoomImageWithMiddleClick() {
    document.body.addEventListener('mousedown', function (event: MouseEvent) {
        if (event.button != 1) return;
        // 图片宽度，百分比。
        let targetImageWidthValue = "20%";
        let clickElement = event.target as HTMLElement;
        // 检查点击的元素是否是图片
        if (!clickElement.matches('.protyle-wysiwyg div[data-node-id] span.img[data-type="img"] img')) {
            return;
        }
        let imageSpanElement = clickElement.parentElement.parentElement;
        // 判断是否设置过宽度，设置过就不能覆盖
        if (imageSpanElement.style.width) {
            return;
        }

        // 如果图片在表格中，也不进行设置
        if (imageSpanElement.parentElement.tagName.toLowerCase() === "td") {
            return;
        }

        let layoutTabContainerElement = clickElement.parentElement;

        // 循环查找当前点击的文档元素
        while (layoutTabContainerElement) {
            if (layoutTabContainerElement.tagName.toLowerCase() === 'div'
                && layoutTabContainerElement.classList.contains('protyle')
                && layoutTabContainerElement.classList.contains('fn__flex-1')) {
                break;
            }
            layoutTabContainerElement = layoutTabContainerElement.parentElement;
        }
        // 默认只读模式
        let isReadonly = true;
        if (layoutTabContainerElement) {
            let readonlyButton = layoutTabContainerElement.querySelector('[data-type="readonly"]');
            if (readonlyButton) {
                isReadonly = readonlyButton.querySelector("use").getAttribute("xlink:href") !== "#iconUnlock";
            }
        }
        if (isReadonly) {
            // console.log("点击自动设置图片宽度失败！当前是只读模式。图片地址：" + clickElement.src);
            return;
        }

        // 创建一个鼠标右键点击事件
        let contextMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window
        });

        // 模拟触发右键点击事件
        clickElement.dispatchEvent(contextMenuEvent);
        let menuLabelNodes = document.getElementById("commonMenu").querySelectorAll(".b3-menu__label");
        let widthMenuButtonElement = null;

        for (let i = 0; i < menuLabelNodes.length; i++) {
            let currentNode = menuLabelNodes[i];
            // 检查文本内容是否包含 "宽度"
            if (currentNode.nodeType === 1 && (currentNode.textContent === "宽度" || currentNode.textContent === "Width")) {
                widthMenuButtonElement = currentNode.parentElement;
                break;
            }
        }
        if (!widthMenuButtonElement) {
            return;
        }
        // 选中“宽度”菜单项
        widthMenuButtonElement.classList.add("b3-menu__item--show", "b3-menu__item--current");

        const defaultWidths = ["25%", "33%", "50%", "67%", "75%"];

        if (defaultWidths.includes(targetImageWidthValue)) {
            let subMenuLabelNodes = widthMenuButtonElement.querySelectorAll(".b3-menu__label");
            let subMenuButtonElement = null;
            for (let i = 0; i < subMenuLabelNodes.length; i++) {
                let currentNode = subMenuLabelNodes[i];
                if (currentNode.nodeType === 1 && currentNode.textContent === targetImageWidthValue) {
                    subMenuButtonElement = currentNode.parentElement;
                    break;
                }
            }
            if (!subMenuButtonElement) {
                return;
            }
            subMenuButtonElement.click();
        } else {
            const widthCustomButtonElement = widthMenuButtonElement.querySelector('button .b3-menu__item.b3-menu__item--readonly.b3-menu__item--custom');
            if (!widthCustomButtonElement) {
                return;
            }
            const rangeElement = widthCustomButtonElement.querySelector("input");
            rangeElement.value = targetImageWidthValue.replace("%", "");

            // 触发 input 事件，会修改图片样式
            let inputEvent = new Event('input', { bubbles: true });
            rangeElement.dispatchEvent(inputEvent);

            // 触发 change 事件，会调用接口刷新
            let changeEvent = new Event('change', { bubbles: true });
            rangeElement.dispatchEvent(changeEvent);
        }

        // console.log("点击自动设置图片宽度成功！图片地址：" + clickElement.src);

    });

}


function batchUpdateCurDocImageWidth(width: string): boolean {
    if (isStrBlank(width)) {
        showImageFaileMessage("宽度为空");
        return;
    }
    if (!isPxOrPercentWidth(width)
        && !width.startsWith("-")
        && !width.startsWith("calc")) {
        showImageFaileMessage("宽度格式不正确");
        return;
    }
    let currentDocument: HTMLDivElement = getActiveTab();
    if (!currentDocument) {
        showImageFaileMessage("没找到打开的文档");
        return;
    }
    // 默认只读模式
    let isReadonly = false;
    let readonlyButton = currentDocument.querySelector('[data-type="readonly"]');
    if (readonlyButton) {
        isReadonly = readonlyButton.querySelector("use").getAttribute("xlink:href") !== "#iconUnlock";
    }
    if (isReadonly) {
        showImageFaileMessage("当前文档为只读模式");
        return;
    }

    let imageElementList = currentDocument.querySelectorAll(`.protyle-wysiwyg div[data-node-id] span.img[data-type="img"] img`);
    for (let element of imageElementList) {

        let hasTable = hasClosestByTagName(element as HTMLElement, "TD");
        // 如果图片在表格中，也不进行设置
        if (hasTable) {
            continue;
        }
        zoomImageWith(element as HTMLElement, width);
    }
    return true;
}

function showImageFaileMessage(reason: string) {
    showMessage(
        `批量设置当前文档图片宽度失败 : ${reason}!`,
        4000,
        "info",
    );
}

function showImageSuccessMessage(reason: string) {
    showMessage(
        `批量设置当前文档图片宽度完成！`,
        3000,
        "info",
    );
}