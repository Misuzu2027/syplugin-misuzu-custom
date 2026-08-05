import { EnvConfig } from "@/config/EnvConfig";
import { getDefaultSettingConfig } from "@/models/setting-constant";
import { SettingConfig } from "@/models/setting-model";
import Instance from "@/utils/Instance";
import { setReplacer } from "@/utils/json-util";
import { mergeObjects } from "@/utils/object-util";
import { CssService } from "./CssService";
import { CodeBlockService } from "@/components/code-block/CodeBlockService";
import { FileTreeService } from "@/components/filetree/FileTreeService";
import { ImageScalingService } from "@/components/img/ImageScalingService";
import { ProtyleWysiwygService } from "@/components/protyle-wysiwyg/ProtyleWysiwyg";

const SettingFileName = 'misuzu2027-setting.json';

export class SettingService {

    public static get ins(): SettingService {
        return Instance.get(SettingService);
    }

    private _settingConfig: SettingConfig;

    public get SettingConfig() {
        if (this._settingConfig) {
            return this._settingConfig;
        }
        this.init()
        return getDefaultSettingConfig()

    }

    public async init() {
        let persistentConfig = await getPersistentConfig();
        this._settingConfig = mergeObjects(persistentConfig, getDefaultSettingConfig());
        // console.log("init this._settingConfig ", this._settingConfig)
    }

    public async updateSettingCofnigValue(key: string, newValue: any) {
        let oldValue = this._settingConfig[key];
        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
            return;
        }

        this._settingConfig[key] = newValue;
        let paramJson = JSON.stringify(this._settingConfig, setReplacer);
        let plugin = EnvConfig.ins.plugin;
        if (!plugin) {
            return;
        }
        console.log(`Misuzu2027 更新设置配置文件: ${paramJson}`);
        this.initFunction();
        plugin.saveData(SettingFileName, paramJson);
    }

    public async updateSettingCofnig(settingConfigParam: SettingConfig) {
        let plugin = EnvConfig.ins.plugin;
        if (!plugin) {
            return;
        }

        let curSettingConfigJson = "";
        if (this._settingConfig) {
            curSettingConfigJson = JSON.stringify(this._settingConfig, setReplacer);
        }
        let paramJson = JSON.stringify(settingConfigParam, setReplacer);
        if (paramJson == curSettingConfigJson) {
            return;
        }
        console.log(`Misuzu2027 更新设置配置文件: ${paramJson}`);
        this._settingConfig = { ...settingConfigParam };
        this.initFunction();
        plugin.saveData(SettingFileName, paramJson);

    }

    public initFunction() {
        CssService.ins.init();
        CodeBlockService.ins.init();
        FileTreeService.ins.init();
        ImageScalingService.ins.init();
        ProtyleWysiwygService.ins.init();
    }

}



async function getPersistentConfig(): Promise<SettingConfig> {
    let plugin = EnvConfig.ins.plugin;
    let settingConfig = null;
    if (!plugin) {
        return settingConfig;
    }
    let loaded = await plugin.loadData(SettingFileName);
    if (loaded == null || loaded == undefined || loaded == '') {
        console.info(`Misuzu2027 没有配置文件，使用默认配置`)
    } else {
        //如果有配置文件，则使用配置文件
        // console.info(`读入配置文件: ${SettingFileName}`)
        if (typeof loaded === 'string') {
            loaded = JSON.parse(loaded);
        }
        try {
            settingConfig = new SettingConfig();
            for (let key in loaded) {
                setKeyValue(settingConfig, key, loaded[key]);
            }
            migrateHideDockIcons(settingConfig, loaded);
        } catch (error_msg) {
            console.log(`Setting load error: ${error_msg}`);
        }
    }
    return settingConfig;
}

function setKeyValue(settingConfig, key: any, value: any) {
    if (!(key in settingConfig)) {
        // 旧版侧栏隐藏开关迁移到 hideDockIcons，不再视为配置项
        if (key === "hideBookmarkDockIcon" || key === "hideTagDockIcon") {
            return;
        }
        console.error(`"${key}" is not a setting`);
        return;
    }
    settingConfig[key] = value;
}

/** 兼容旧版 hideBookmarkDockIcon / hideTagDockIcon 开关配置 */
function migrateHideDockIcons(settingConfig: SettingConfig, loaded: Record<string, any>) {
    if (!Array.isArray(settingConfig.hideDockIcons)) {
        settingConfig.hideDockIcons = [];
    }
    if (settingConfig.hideDockIcons.length > 0) {
        return;
    }
    const migrated: string[] = [];
    if (loaded.hideBookmarkDockIcon === true) {
        migrated.push("bookmark");
    }
    if (loaded.hideTagDockIcon === true) {
        migrated.push("tag");
    }
    if (migrated.length > 0) {
        settingConfig.hideDockIcons = migrated;
    }
}

