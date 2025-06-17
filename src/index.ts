import {
    Plugin,
} from "siyuan";
import "@/index.scss";


import { EnvConfig } from "./config/EnvConfig";
import { CUSTOM_ICON_MAP } from "./models/icon-constant";
import { SettingService } from "./service/SettingService";
import { openSettingsDialog } from "./components/setting/setting-util";
import { CssService } from "./service/CssService";
import { CodeBlockService } from "./components/code-block/CodeBlockService";
import { FileTreeService } from "./components/filetree/FileTreeService";
import { ImageScalingService } from "./components/img/ImageScalingService";
import { ProtyleWysiwygService } from "./components/protyle-wysiwyg/ProtyleWysiwyg";


export default class Misuzu2027Plugin extends Plugin {



    async onload() {
        EnvConfig.ins.init(this);
        await SettingService.ins.init()
        CssService.ins.init();
        CodeBlockService.ins.init();
        FileTreeService.ins.init();
        ImageScalingService.ins.init();
        ProtyleWysiwygService.ins.init();


        // 图标的制作参见帮助文档
        for (const key in CUSTOM_ICON_MAP) {
            if (Object.prototype.hasOwnProperty.call(CUSTOM_ICON_MAP, key)) {
                const item = CUSTOM_ICON_MAP[key];
                this.addIcons(item.source);
            }
        }

    }

    onLayoutReady() {

    }

    async onunload() {
        CodeBlockService.ins.destroy();
        FileTreeService.ins.destroy();
    }

    uninstall() {
        CodeBlockService.ins.destroy();
        FileTreeService.ins.destroy();
    }


    openSetting(): void {
        openSettingsDialog();
    }


}
