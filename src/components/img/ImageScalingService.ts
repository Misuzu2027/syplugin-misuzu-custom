
import { EnvConfig } from "@/config/EnvConfig";
import { SettingService } from "@/service/SettingService";
import { hasClosestByTagName } from "@/utils/html-util";
import Instance from "@/utils/Instance";
import { getActiveTab } from "@/utils/siyuan-util";
import { containsAllKeywords, splitKeywordStringToArray } from "@/utils/string-util";

export class ImageScalingService {


    public static get ins(): ImageScalingService {
        return Instance.get(ImageScalingService);
    }

    public init() {
        this.initEventListener();
        // todo

        // EnvConfig.ins.plugin.addTopBar({
        //     icon: CUSTOM_ICON_MAP.BacklinkPanelFilter.id,
        //     title: "缩放当前文档所有加载图片的宽度",
        //     position: "right",
        //     callback: () => {
        //         let currentDocument: HTMLDivElement = getActiveTab();
        //         if (!currentDocument) {
        //             return;
        //         }

        //         const docTitleElement = currentDocument.querySelector(".protyle-title");
        //         let docTitle = currentDocument.querySelector("div.protyle-title__input").textContent;
        //         let docId = docTitleElement.getAttribute("data-node-id");
        //         TabService.ins.openBacklinkTab(docTitle, docId, null);
        //     }
        // });

    }

    public destroy() {

    }

    public initEventListener() {
        document.body.addEventListener('mousedown', function (event: MouseEvent) {
            if (event.button != 1) return;
            // 图片宽度，目前思源只支持 px,vw。
            let imageWidthValue = SettingService.ins.SettingConfig.imageMiddleClickResizeWidth;;
            if (!imageWidthValue) {
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

            // // 循环查找当前点击的文档元素
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
                console.log("点击自动设置图片宽度失败！当前是只读模式。图片地址：" + clickElement.getAttribute("src"));
                return;
            }
            zoomImageWith(event, imageWidthValue)
        });
    }

}


function zoomImageWith(event: MouseEvent, width: string) {
    let target = event.target as HTMLElement;

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

    let imgElement = hasClosestByTagName(target, "img");
    if (!imgElement) {
        return;
    }
    let dragElement = imgElement.parentElement.querySelector(".protyle-action__drag");
    if (!dragElement) {
        return;
    }
    dragElement.dispatchEvent(mouseDownEvent);
    event.preventDefault();
    imgElement.style.width = width;

    dragElement.dispatchEvent(mouseUpEvent);
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