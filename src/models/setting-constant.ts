import { BACKLINK_BLOCK_SORT_METHOD_ELEMENT, CUR_DOC_DEF_BLOCK_SORT_METHOD_ELEMENT, RELATED_DEF_BLOCK_SORT_METHOD_ELEMENT, RELATED_DOCMUMENT_SORT_METHOD_ELEMENT } from "./backlink-constant";
import { ItemProperty, IOption, TabProperty, SettingConfig } from "./setting-model";

export function getDefaultSettingConfig() {
    let defaultConfig = new SettingConfig();
    defaultConfig.useRefTextStyle = false;

    defaultConfig.codeBlockNaming = false;
    defaultConfig.codeBlockMaxHeight = null;
    defaultConfig.codeBlockToggle = false;
    defaultConfig.codeBlockAdjustHeight = false;
    defaultConfig.codeBlockTopLanguages = "";

    defaultConfig.fileTreeKeywordFilter = false;


    return defaultConfig;
}


export function getSettingTabArray(): TabProperty[] {

    let tabProperties: TabProperty[] = [

    ];

    tabProperties.push(
        new TabProperty({
            key: "style-setting", name: "样式", iconKey: "iconFilter", props: [
                new ItemProperty({ key: "useRefTextStyle", type: "switch", name: "修改引用文本样式", description: "", tips: "" }),
            ]

        }),
        new TabProperty({
            key: "code-block-setting", name: "代码块", iconKey: "iconLink", props: [

                new ItemProperty({ key: "codeBlockNaming", type: "switch", name: "代码块命名", description: "", tips: "" }),
                new ItemProperty({ key: "codeBlockMaxHeight", type: "number", name: "代码块最大高度", description: "", tips: "", min: 50 }),
                // new ItemProperty({ key: "codeBlockToggle", type: "switch", name: "代码块显示折叠展开按钮", description: "", tips: "" }),
                new ItemProperty({ key: "codeBlockAdjustHeight", type: "switch", name: "代码块调整高度", description: "如果设置了最大高度，拖拽范围也不会超过最大高度", tips: "" }),
                new ItemProperty({ key: "codeBlockTopLanguages", type: "text", name: "代码块常用语言", description: "选择语言时，会把这些语言置顶显示，英文逗号或中文逗号隔开多个语言", tips: "" }),

                // new ItemProperty({ key: "queryAllContentUnderHeadline", type: "switch", name: "反链区域关键字查询标题下的所有内容", description: "必须开启 查询标题下关联定义块 才可生效。", tips: "" }),

            ]

        }),
        new TabProperty({
            key: "file-tree-setting", name: "文档树", iconKey: "iconPlugin", props: [
                new ItemProperty({ key: "fileTreeKeywordFilter", type: "switch", name: "关键字过滤笔记本", description: "", tips: "" }),
                // new ItemProperty({ key: "documentBottomDisplay", type: "switch", name: "文档底部显示反链面板", description: "", tips: "" }),
                // new ItemProperty({ key: "topBarDisplay", type: "switch", name: "桌面端顶栏创建反链页签 Icon", description: "", tips: "" }),
                // new ItemProperty({ key: "cacheAfterResponseMs", type: "number", name: "启用缓存门槛（毫秒）", description: "当接口响应时间超过这个数，就会把这次查询结果存入缓存，-1 不开启缓存", tips: "", min: -1 }),
                // new ItemProperty({ key: "cacheExpirationTime", type: "number", name: "缓存过期时间（秒）", description: "", tips: "缓存数据失效时间", min: -1, }),
                // new ConfigProperty({ key: "usePraentIdIdx", type: "switch", name: "使用索引", description: "", tips: "" }),

            ]
        }),
    );

    return tabProperties;
}

function getBacklinkBlockSortMethodOptions(): IOption[] {
    let backlinkBlockSortMethodElements = BACKLINK_BLOCK_SORT_METHOD_ELEMENT();
    let options: IOption[] = [];
    for (const element of backlinkBlockSortMethodElements) {
        options.push(element);
    }

    return options;
}


function geturDocDefBlockSortMethodElement(): IOption[] {
    let backlinkBlockSortMethodElements = CUR_DOC_DEF_BLOCK_SORT_METHOD_ELEMENT();
    let options: IOption[] = [];
    for (const element of backlinkBlockSortMethodElements) {
        options.push(element);
    }

    return options;
}

function getRelatedDefBlockSortMethodElement(): IOption[] {
    let backlinkBlockSortMethodElements = RELATED_DEF_BLOCK_SORT_METHOD_ELEMENT();
    let options: IOption[] = [];
    for (const element of backlinkBlockSortMethodElements) {
        options.push(element);
    }

    return options;
}

function getRelatedDocmumentSortMethodElement(): IOption[] {
    let backlinkBlockSortMethodElements = RELATED_DOCMUMENT_SORT_METHOD_ELEMENT();
    let options: IOption[] = [];
    for (const element of backlinkBlockSortMethodElements) {
        options.push(element);
    }

    return options;
}