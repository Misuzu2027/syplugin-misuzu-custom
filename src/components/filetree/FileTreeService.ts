import { SettingService } from "@/service/SettingService";
import Instance from "@/utils/Instance";
import { containsAllKeywords, splitKeywordStringToArray } from "@/utils/string-util";

export class FileTreeService {
    private intervalId;


    public static get ins(): FileTreeService {
        return Instance.get(FileTreeService);
    }

    public init() {

        let fileTreeKeywordFilter = SettingService.ins.SettingConfig.fileTreeKeywordFilter;

        if (fileTreeKeywordFilter) {
            initFileTreeSearchInput();
            this.intervalId = setInterval(initFileTreeSearchInput, 1000)
        } else {
            this.destroy();
        }
    }

    public destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        let inputElement = document.querySelector("div.file-tree.sy__file div.misuzu2027__search-div");
        if (inputElement) {
            inputElement.remove();
        }
    }

}

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
    let searchDivElement = document.createElement("div");
    searchDivElement.style.margin = "1px 8px";
    searchDivElement.classList.add("misuzu2027__search-div", "misuzu2027__copy", "misuzu2027__protyle-custom");
    let searchInputElement = document.createElement("input");
    searchInputElement.classList.add("b3-text-field", "fn__block", "misuzu2027__search-input", "misuzu2027__copy", "misuzu2027__protyle-custom");

    // let searchClearElement = document.createElement("svg");
    // searchClearElement.classList.add("b3-form__icon-clear");
    // searchClearElement.setAttribute("style", `right: 8px; height: 42px;`);
    // searchClearElement.innerHTML = `<use xlink:href="#iconCloseRound"></use>`

    searchDivElement.append(searchInputElement);
    // searchDivElement.append(searchClearElement);

    anchorElement.insertAdjacentElement('afterend', searchDivElement);

    searchInputElement.addEventListener("input", (event: InputEvent) => {
        console.log("searchInputElement input")
        if (event.isComposing) {
            return;
        }
        let searchKeyword = searchInputElement.value;
        let keywordArray = splitKeywordStringToArray(searchKeyword);

        let boxUlElementArray = fileTreeDocElement.querySelectorAll("ul[data-url].b3-list.b3-list--background");
        for (const ulElement of boxUlElementArray) {
            let boxNameElement = ulElement.querySelector("li.b3-list-item > span.b3-list-item__text")
            let boxName = boxNameElement.textContent;
            if (containsAllKeywords(boxName, keywordArray)) {
                ulElement.classList.remove("fn__none");
            } else {
                ulElement.classList.add("fn__none");
            }
        }


    })

}



// let lastNoteBookMap;
// function initFileTreeElement() {
//     let fileTreeElement = document.querySelector("#layouts  div.layout-tab-container div.file-tree.sy__file > div.fn__flex-1");
//     if (!fileTreeElement) {
//         return
//     }
//     let notebookMap = getNotebookMap();
//     if (areMapsEqual(lastNoteBookMap, notebookMap)) {
//         return;
//     }
//     lastNoteBookMap = notebookMap;
//     console.log(`FileTreeService notebookMap `, notebookMap)
//     let boxGroupElement = document.createElement("div");
//     boxGroupElement.classList.add("b3-list", "b3-list--background");
//     boxGroupElement.innerHTML = `
// <div class="b3-list-item b3-list-item--hide-action" style="margin:1px 0px">
//     <span class="b3-list-item__toggle b3-list-item__arrow--open">
//         <svg class="b3-list-item__arrow"><use xlink:href="#iconRight"></use></svg>
//     </span>
//     <span class="b3-list-item__icon b3-tooltips b3-tooltips__e">🗃</span>
//     <span class="b3-list-item__text" style="font-weight: bold;">测试文档分组</span>
// </div>
//     `;


//     let boxUlElement = fileTreeElement.querySelector(`ul[data-url="${notebookMap.keys().next().value}"].b3-list.b3-list--background`);

//     boxUlElement.before(boxGroupElement);
//     boxGroupElement.append(boxUlElement);
//     boxGroupElement.style.margin = "1px 0px"
// }


// function getNotebookMap(): Map<string, string> {
//     let fileTreeElement = document.querySelector("#layouts  div.layout-tab-container div.file-tree.sy__file > div.fn__flex-1");
//     let idNameMap = new Map<string, string>();
//     let boxUlElementArray = fileTreeElement.querySelectorAll("ul[data-url].b3-list.b3-list--background");
//     for (const ulElement of boxUlElementArray) {
//         let boxId = ulElement.getAttribute("data-url");
//         let boxNameElement = ulElement.querySelector("li.b3-list-item > span.b3-list-item__text")
//         let boxName = boxNameElement.textContent;
//         if (isValidStr(boxId) && isValidStr(boxName)) {
//             idNameMap.set(boxId, boxName);
//         }
//     }

//     return idNameMap;
// }
