import { getDockByType } from "@/libs/siyuan/layout/tabUtil";
import { Dialog, getFrontend } from "siyuan";

export function getActiveTab(): HTMLDivElement {
    let tab = document.querySelector("div.layout__wnd--active ul.layout-tab-bar>li.item--focus");
    let dataId: string = tab?.getAttribute("data-id");
    if (!dataId) {
        return null;
    }
    const activeTab: HTMLDivElement = document.querySelector(
        `.layout-tab-container.fn__flex-1>div.protyle[data-id="${dataId}"]`
    ) as HTMLDivElement;
    return activeTab;
}

const frontEnd = getFrontend();
export const isMobile = () => (frontEnd === "mobile" || frontEnd === "browser-mobile");

export const confirmDialog = (title: string,
    content: string | HTMLElement,
    confirm?: (ele?: HTMLElement) => boolean,
    cancel?: (ele?: HTMLElement) => void,
    width?: string,
    height?: string) => {

    const dialog = new Dialog({
        title,
        content: `
<div class="b3-dialog__content">
    <div class="ft__breakword"></div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button>
    <div class="fn__space"></div>
    <button class="b3-button b3-button--text" >${window.siyuan.languages.confirm}</button>
</div>`,
        width: width || (isMobile() ? "92vw" : "520px"),
        height: height
    });
    // confirmDialogConfirmBtn
    const target: HTMLElement = dialog.element.querySelector(".b3-dialog__content>div.ft__breakword");
    if (typeof content === "string") {
        target.innerHTML = content;
    } else {
        target.appendChild(content);
    }



    const btnsElement = dialog.element.querySelectorAll(".b3-button");

    target.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.ctrlKey) {
            let confirmBtn = btnsElement[1] as HTMLElement;
            confirmBtn.click();
            e.stopPropagation();
        }
    });
    let firstInput = dialog.element.querySelector("input") || dialog.element.querySelector("textarea");
    if (firstInput) {
        // firstInput.select();
        firstInput.focus();
    }

    btnsElement[0].addEventListener("click", () => {
        if (cancel) {
            cancel(target);
        }
        dialog.destroy();
    });
    btnsElement[1].addEventListener("click", () => {
        if (confirm) {
            let flag = confirm(target);
            if (flag) {
                dialog.destroy();
            }
        } else {
            dialog.destroy();
        }
    });
};



/**
 * 
 * @param notebookId 
 * @param path ：protyle.path；“/20250510102251-6k93743.sy”
 */
export const fileTreeSelectDoc = (notebookId: string, path: string) => {

    const dockFile = getDockByType("file");
    if (!dockFile) {
        return;
    }
    const files = dockFile.data.file;
    if (!files) {
        return;
    }
    files.selectItem(notebookId, path);
    dockFile.toggleModel("file", true);
}
