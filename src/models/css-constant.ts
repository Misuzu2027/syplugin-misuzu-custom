
export const CUSTOM_CSS_CLASS_MAP: { [key: string]: { name: string, describe: string } } =
{
    refTextClass: {
        name: "ref-text__brackets",
        describe: "引用文本中括号",
    },
    codeBlockMaxHeightClass: {
        name: "code-block__max-height",
        describe: "代码块最大高度",
    },
    codeBlockDragHeightClass: {
        name: "code-block__drag-height",
        describe: "代码块拖拽高度",
    },
}
    ;

/** 可隐藏的内置 Dock 图标（与 SiYuan layout/dock/index.ts TYPES 对齐） */
export const HIDEABLE_DOCK_TYPES = [
    "outline",
    "inbox",
    "bookmark",
    "tag",
    "graph",
    "globalGraph",
    "backlink",
] as const;

export type HideableDockType = (typeof HIDEABLE_DOCK_TYPES)[number];

export function getHideDockClassName(type: string): string {
    return `hide-dock-${type}`;
}

export const refStyle = `

`
