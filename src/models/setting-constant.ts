import { EnvConfig } from "@/config/EnvConfig";
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
    defaultConfig.fileTreeKeywordFilterWithMatchedSubDocs = false;
    defaultConfig.fileTreeMiddleClickToggle = false;

    defaultConfig.imageMiddleClickResizeWidth = null;
    defaultConfig.topBarShowImageZoomBtn = false;

    defaultConfig.protyleWysiwygMiddleClickToggle = false;

    return defaultConfig;
}


export function getSettingTabArray(): TabProperty[] {

    let tabProperties: TabProperty[] = [

    ];

    let i18n = EnvConfig.ins.i18n;
    tabProperties.push(
        new TabProperty({
            key: "style-setting", name: i18n.Style, iconKey: "iconFilter", props: [
                new ItemProperty({ key: "useRefTextStyle", type: "switch", name: i18n.ModifyReferencedTextStyle, description: "", tips: "" }),
            ]

        }),
        new TabProperty({
            key: "code-block-setting", name: i18n.CodeBlock, iconKey: "iconLink", props: [

                new ItemProperty({ key: "codeBlockNaming", type: "switch", name: i18n.CodeBlockNaming, description: "", tips: "" }),
                new ItemProperty({ key: "codeBlockTopLanguages", type: "text", name: i18n.CommonCodeBlockLanguages, description: i18n.CommonCodeBlockLanguagesTips, tips: "" }),
                new ItemProperty({ key: "codeBlockMaxHeight", type: "number", name: i18n.MaximumCodeBlockHeight, description: "", tips: "", min: 150 }),
                new ItemProperty({ key: "codeBlockAdjustHeight", type: "switch", name: i18n.AdjustCodeBlockHeight, description: i18n.AdjustCodeBlockHeightTips, tips: "" }),
                new ItemProperty({ key: "codeBlockToggle", type: "switch", name: i18n.DisplayCollapseExpandCodeBlockButton, description: "", tips: "" }),
                new ItemProperty({ key: "codeBlockFoldHeight", type: "number", name: i18n.CollapsedCodeBlockHeight, description: "", tips: "", min: 150 }),

                // new ItemProperty({ key: "queryAllContentUnderHeadline", type: "switch", name: "反链区域关键字查询标题下的所有内容", description: "必须开启 查询标题下关联定义块 才可生效。", tips: "" }),

            ]

        }),
        new TabProperty({
            key: "file-tree-setting", name: i18n.FileTree, iconKey: "iconPlugin", props: [
                new ItemProperty({ key: "fileTreeKeywordFilter", type: "switch", name: i18n.KeywordFilterNotebooks, description: "", tips: "" }),
                new ItemProperty({ key: "fileTreeKeywordFilterWithMatchedSubDocs", type: "switch", name: i18n.KeywordFilterNotebooksMatchSubdocuments, description: "", tips: "" }),
                new ItemProperty({ key: "fileTreeMiddleClickToggle", type: "switch", name: i18n.MiddleClickToggleDocTree, description: "", tips: "" }),

                // new ItemProperty({ key: "documentBottomDisplay", type: "switch", name: "文档底部显示反链面板", description: "", tips: "" }),
                // new ItemProperty({ key: "topBarDisplay", type: "switch", name: "桌面端顶栏创建反链页签 Icon", description: "", tips: "" }),
                // new ItemProperty({ key: "cacheAfterResponseMs", type: "number", name: "启用缓存门槛（毫秒）", description: "当接口响应时间超过这个数，就会把这次查询结果存入缓存，-1 不开启缓存", tips: "", min: -1 }),
                // new ItemProperty({ key: "cacheExpirationTime", type: "number", name: "缓存过期时间（秒）", description: "", tips: "缓存数据失效时间", min: -1, }),
                // new ConfigProperty({ key: "usePraentIdIdx", type: "switch", name: "使用索引", description: "", tips: "" }),

            ]
        }),
        new TabProperty({
            key: "image-setting", name: i18n.Image, iconKey: "iconPlugin", props: [
                new ItemProperty({ key: "imageMiddleClickResizeWidth", type: "text", name: i18n.MiddleClickResizeImageWidth, description: i18n.MiddleClickResizeImageWidthDesc, tips: "" }),
                new ItemProperty({ key: "topBarShowImageZoomBtn", type: "switch", name: i18n.ShowTopBatchZoomBtn, description: "", tips: "" }),

                // new ItemProperty({ key: "documentBottomDisplay", type: "switch", name: "文档底部显示反链面板", description: "", tips: "" }),
                // new ItemProperty({ key: "topBarDisplay", type: "switch", name: "桌面端顶栏创建反链页签 Icon", description: "", tips: "" }),
                // new ItemProperty({ key: "cacheAfterResponseMs", type: "number", name: "启用缓存门槛（毫秒）", description: "当接口响应时间超过这个数，就会把这次查询结果存入缓存，-1 不开启缓存", tips: "", min: -1 }),
                // new ItemProperty({ key: "cacheExpirationTime", type: "number", name: "缓存过期时间（秒）", description: "", tips: "缓存数据失效时间", min: -1, }),
                // new ConfigProperty({ key: "usePraentIdIdx", type: "switch", name: "使用索引", description: "", tips: "" }),

            ]
        }),
        new TabProperty({
            key: "protyle-setting", name: i18n.Image, iconKey: "iconPlugin", props: [
                new ItemProperty({ key: "protyleWysiwygMiddleClickToggle", type: "switch", name: i18n.MiddleClickToggleProtyleTitleOrList, description: "", tips: "" }),

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
