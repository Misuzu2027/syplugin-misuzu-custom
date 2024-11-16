import { isValidStr } from "@/utils/string-util";


export class SettingConfig {
    // 引用文本样式
    useRefTextStyle: boolean;

    // 代码块
    codeBlockTopLanguages: string;
    codeBlockNaming: boolean;
    codeBlockToggle: boolean;
    codeBlockFoldHeight: number;
    codeBlockMaxHeight: number;
    codeBlockAdjustHeight: boolean;

    // 文档树
    fileTreeKeywordFilter: boolean;
    fileTreeKeywordFilterWithMatchedSubDocs: boolean;
    fileTreeMiddleClickToggle: boolean;

    // 图片
    imageMiddleClickResizeWidth: string;

}


interface ITabProperty {
    key: string;
    name: string;
    props: Array<ItemProperty>;
    iconKey?: string;
}


export class TabProperty {
    key: string;
    name: string;
    iconKey: string;
    props: ItemProperty[];

    constructor({ key, name, iconKey, props }: ITabProperty) {
        this.key = key;
        this.name = name;
        if (isValidStr(iconKey)) {
            this.iconKey = iconKey;
        } else {
            this.iconKey = "setting";
        }
        this.props = props;

    }

}

export interface IOption {
    name: string;
    desc?: string;
    value: string;
}




export class ItemProperty {
    key: string;
    type: IItemPropertyType;
    name: string;
    description: string;
    tips?: string;

    min?: number;
    max?: number;
    btndo?: () => void;
    options?: IOption[];


    constructor({ key, type, name, description, tips, min, max, btndo, options }: ItemProperty) {
        this.key = key;
        this.type = type;
        this.min = min;
        this.max = max;
        this.btndo = btndo;
        this.options = options ?? [];
        this.name = name;
        this.description = description;
        this.tips = tips;
    }

}
