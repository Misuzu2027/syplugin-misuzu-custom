import { EnvConfig } from "@/config/EnvConfig";
import { Dialog } from "siyuan";
import SettingPageSvelte from "@/components/setting/setting-page.svelte";

export function openSettingsDialog() {
    const isMobile = EnvConfig.ins.isMobile;
    const dialogId = "misuzu2027-setting-" + Date.now();
    let settingPage: SettingPageSvelte | null = null;

    const settingDialog = new Dialog({
        title: EnvConfig.ins.i18n.PluginSettings,
        content: `
          <div id="${dialogId}" style="overflow: hidden; position: relative; height: 100%;"></div>
          `,
        width: isMobile ? "92vw" : "800px",
        height: isMobile ? "70vh" : "70vh",
        destroyCallback: () => {
            settingPage?.$destroy();
            settingPage = null;
        },
    });

    settingPage = new SettingPageSvelte({
        target: settingDialog.element.querySelector(`#${dialogId}`),
    });
}
