import { EnvConfig } from "@/config/EnvConfig";
import { Dialog } from "siyuan";
import SettingPageSvelte from "@/components/setting/setting-page.svelte"




export function openSettingsDialog() {
    let isMobile = EnvConfig.ins.isMobile;
    // 生成Dialog内容
    const dialogId = "misuzu2027-setting-" + Date.now();
    // 创建dialog
    const settingDialog = new Dialog({
        title: EnvConfig.ins.i18n.PluginSettings,
        content: `
          <div  id="${dialogId}" style="overflow: hidden; position: relative;height: 100%;"></div>
          `,
        width: isMobile ? "92vw" : "1040px",
        height: isMobile ? "50vw" : "80vh",
    });

    new SettingPageSvelte({
        target: settingDialog.element.querySelector(`#${dialogId}`),
    });


}