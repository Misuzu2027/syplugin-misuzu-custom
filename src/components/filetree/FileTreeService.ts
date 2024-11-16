import { SettingService } from "@/service/SettingService";
import { DocumentQueryCriteria, generateDocumentListSql } from "@/service/SqlService";
import { sql } from "@/utils/api";
import { isArrayEmpty, isArrayNotEmpty } from "@/utils/array-util";
import { clearCssHighlights, highlightContent, highlightElementTextByCss, stringToElement } from "@/utils/html-util";
import Instance from "@/utils/Instance";
import { containsAllKeywords, isStrBlank, isValidStr, splitKeywordStringToArray } from "@/utils/string-util";

export class FileTreeService {
    private intervalInitFileTreeSearchInputId;
    private intervalInitFileTreeMiddleClickToggleId;


    public static get ins(): FileTreeService {
        return Instance.get(FileTreeService);
    }

    public init() {

        let fileTreeKeywordFilter = SettingService.ins.SettingConfig.fileTreeKeywordFilter;

        if (fileTreeKeywordFilter) {
            initFileTreeSearchInput();
            this.intervalInitFileTreeSearchInputId = setInterval(initFileTreeSearchInput, 2000)
        } else {
            this.destoryFileTreeKeywordFilter();
        }
        let fileTreeMiddleClickToggle = SettingService.ins.SettingConfig.fileTreeMiddleClickToggle;
        if (fileTreeMiddleClickToggle) {
            addFileTreeMiddleClickToggle();
            this.intervalInitFileTreeMiddleClickToggleId = setInterval(addFileTreeMiddleClickToggle, 2000)
        } else {
            this.destoryFileTreeMiddleClickToggle();
        }



    }

    public destroy() {
        this.destoryFileTreeKeywordFilter();
        this.destoryFileTreeMiddleClickToggle();
    }

    public destoryFileTreeKeywordFilter() {
        if (this.intervalInitFileTreeSearchInputId) {
            clearInterval(this.intervalInitFileTreeSearchInputId);
            this.intervalInitFileTreeSearchInputId = null;
        }

        let inputElement = document.querySelector("div.file-tree.sy__file div.misuzu2027__search-div");
        if (inputElement) {
            inputElement.remove();
        }
        if (fileTreeObserve) {
            fileTreeObserve.disconnect();
        }
        clearCssHighlights();
        removeNotebookOrDocHide();
    }

    public destoryFileTreeMiddleClickToggle() {
        document.querySelector('.sy__file').removeEventListener('mousedown', handleDocToggle);
        if (this.intervalInitFileTreeMiddleClickToggleId) {
            clearInterval(this.intervalInitFileTreeMiddleClickToggleId);
            this.intervalInitFileTreeMiddleClickToggleId = null;
        }
    }


}
let searchKeywordArray: string[] = [];
let hideNotebookIdArray: string[] = [];
let matchDocBlockArray: Block[] = [];

function initFileTreeSearchInput() {
    let fileTreeDocElement = document.querySelector("#layouts  div.layout-tab-container div.file-tree.sy__file");
    if (!fileTreeDocElement) {
        return;
    }
    if (fileTreeDocElement.querySelector("input.misuzu2027__search-input")) {
        return
    }

    let anchorElement = fileTreeDocElement.querySelector("div.block__icons ");
    if (!anchorElement) {
        return;
    }
    let fileTreeUlParentDivElement = fileTreeDocElement.querySelector(":scope > div.fn__flex-1") as HTMLElement;
    let searchDivElement = document.createElement("div");
    searchDivElement.style.margin = "1px 8px";
    searchDivElement.classList.add("misuzu2027__search-div", "misuzu2027__copy", "misuzu2027__protyle-custom");
    let searchInputElement = document.createElement("input");
    searchInputElement.classList.add("b3-text-field", "fn__block", "misuzu2027__search-input", "misuzu2027__copy", "misuzu2027__protyle-custom");

    // let searchClearElement = document.createElement("svg");
    // searchClearElement.classList.add("b3-form__icon-clear");
    // searchClearElement.setAttribute("style", `right: 8px; height: 42px;`);
    // searchClearElement.innerHTML = `<use xlink:href="#iconCloseRound"></use>`

    let clearElement = stringToElement(`
    <svg class="b3-form__icon-clear ariaLabel" aria-label="${window.siyuan.languages.clear}" style="right: 18px;height: 30px;">
<use xlink:href="#iconCloseRound"></use></svg>
`)

    searchDivElement.append(searchInputElement);
    searchDivElement.append(clearElement);
    // searchDivElement.append(searchClearElement);

    anchorElement.insertAdjacentElement('afterend', searchDivElement);

    searchInputElement.addEventListener("input", async (event: InputEvent) => {
        // console.log("searchInputElement input")
        if (event.isComposing) {
            return;
        }
        let searchKeyword = searchInputElement.value;
        searchKeywordArray = splitKeywordStringToArray(searchKeyword.toLowerCase());

        let matchedSubDocs = SettingService.ins.SettingConfig.fileTreeKeywordFilterWithMatchedSubDocs;
        let docFullTextSearch = false;
        let includeConcatFields = ["content", "tag", "name", "alias", "memo"];

        hideNotebookIdArray = [];
        matchDocBlockArray = [];

        if (matchedSubDocs && isArrayNotEmpty(searchKeywordArray)) {
            let queryCriteria: DocumentQueryCriteria = new DocumentQueryCriteria(
                searchKeywordArray, docFullTextSearch, null, null, null, null, includeConcatFields, null, null);

            let queryDocListSql = generateDocumentListSql(queryCriteria)
            matchDocBlockArray = await sql(queryDocListSql);
        }
        clearCssHighlights();

        let boxUlElementArray = fileTreeDocElement.querySelectorAll("ul[data-url].b3-list.b3-list--background");
        for (const ulElement of boxUlElementArray) {
            let boxNameElement = ulElement.querySelector("li.b3-list-item > span.b3-list-item__text")
            let boxName = boxNameElement.textContent.toLowerCase();
            let boxId = ulElement.getAttribute("data-url");
            if (!containsAllKeywords(boxName, searchKeywordArray)) {
                hideNotebookIdArray.push(boxId)
            }
        }
        for (const docBlock of matchDocBlockArray) {
            hideNotebookIdArray = hideNotebookIdArray.filter(value => value !== docBlock.box);
        }

        refreshNotebookOrDoc(fileTreeDocElement as HTMLElement);

    })


    clearElement.addEventListener("click", (event) => {
        searchInputElement.value = '';
        searchInputElement.dispatchEvent(new Event('input'));
        clearCssHighlights();
        removeNotebookOrDocHide();
    })
    observeFileTreeChildChanges(fileTreeUlParentDivElement);
}
let fileTreeObserve: MutationObserver;

function observeFileTreeChildChanges(targetElement: HTMLElement) {
    // 创建一个 MutationObserver 实例
    fileTreeObserve = new MutationObserver((mutationsList, observer) => {
        // 检查是否有子元素发生变化
        mutationsList.forEach(mutation => {
            // if (isArrayEmpty(validDocBlockList)) {
            //     return;
            // }
            // 如果不是子元素发生变化时
            if (mutation.type !== 'childList') {
                return;
            }
            // 获取添加的节点
            const addedNodes = Array.from(mutation.addedNodes);
            for (const addNode of addedNodes) {
                if (!(addNode instanceof HTMLElement)) {
                    continue
                }
                refreshNotebookOrDoc(addNode);
            }

        });
    });

    // 配置 MutationObserver 来监听子元素的变化
    const config = { childList: true, subtree: true }; // subtree: true 用于监听所有后代节点的变化

    // 开始观察
    fileTreeObserve.observe(targetElement, config);

}

function refreshNotebookOrDoc(parentElement: HTMLElement) {

    console.log("hideNotebookIdArray ", hideNotebookIdArray, "matchDocBlockArray ", matchDocBlockArray, " keywords ", searchKeywordArray)
    // 查询笔记本节点，然后隐藏
    let boxUlElementArray = parentElement.querySelectorAll("ul[data-url].b3-list.b3-list--background");
    for (const ulElement of boxUlElementArray) {
        let boxId = ulElement.getAttribute("data-url");
        if (hideNotebookIdArray.includes(boxId)) {
            ulElement.classList.add("fn__none");
        } else {
            ulElement.classList.remove("fn__none");
        }
    }
    // 查询文档节点，然后隐藏
    let liNodeList = parentElement.querySelectorAll(`li[data-type="navigation-file"]`);
    for (const liNode of liNodeList) {
        let rootId = liNode.getAttribute("data-node-id");
        let hide = false;
        for (const docBlock of matchDocBlockArray) {
            if (docBlock.path.includes(rootId)) {
                hide = false;
                break;
            } else {
                hide = true;
            }
        }
        if (hide) {
            liNode.classList.add("fn__none");
        } else {
            liNode.classList.remove("fn__none");
        }
    }

    highlightElementTextByCss(parentElement as HTMLElement, searchKeywordArray)

}

function removeNotebookOrDocHide() {
    let fileTreeDocElement = document.querySelector("#layouts  div.layout-tab-container div.file-tree.sy__file");
    if (!fileTreeDocElement) {
        return;
    }
    let boxUlElementArray = fileTreeDocElement.querySelectorAll("ul[data-url].b3-list.b3-list--background.fn__none");
    for (const ulElement of boxUlElementArray) {
        ulElement.classList.remove("fn__none");
    }
    let liNodeList = fileTreeDocElement.querySelectorAll(`li[data-type="navigation-file"].fn__none`);
    for (const liNode of liNodeList) {
        liNode.classList.remove("fn__none");
    }

}


function addFileTreeMiddleClickToggle() {
    let fileTreeDocElement = document.querySelector("#layouts  div.layout-tab-container div.file-tree.sy__file");
    if (!fileTreeDocElement) {
        return;
    }
    FileTreeService.ins.destoryFileTreeMiddleClickToggle();

    document.querySelector('.sy__file').addEventListener('mousedown', handleDocToggle);
}

function handleDocToggle(event: MouseEvent) {
    if (event.button != 1) return;
    let clickTarget = event.target as HTMLElement;
    let fileTreeMiddleClickToggle = SettingService.ins.SettingConfig.fileTreeMiddleClickToggle;
    if (!fileTreeMiddleClickToggle) {
        return;
    }

    let liElement = clickTarget.parentElement;
    let temp = event.target as HTMLElement;
    for (let i = 0; i < 4 && temp; i++) {
        if (temp?.getAttribute("data-type") == "navigation-file"
            || temp?.getAttribute("data-type") == "navigation-root") {
            liElement = temp;
            break;
        }
        temp = temp?.parentElement;
    }

    if (liElement?.getAttribute("data-type") == "navigation-file"
        || liElement?.getAttribute("data-type") == "navigation-root") {
        const b3ListItemToggleElement = liElement.querySelector('.b3-list-item__toggle') as HTMLElement;
        const titleElement = liElement.querySelector('.b3-list-item__text') as HTMLElement;
        if (b3ListItemToggleElement.classList.contains('fn__hidden')) return;
        event.preventDefault();
        b3ListItemToggleElement.click();
        if (event.ctrlKey) {
            titleElement.click();
        }
    }
}