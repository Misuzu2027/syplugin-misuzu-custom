import { EnvConfig } from "@/config/EnvConfig";
import { Dialog } from "siyuan";
import SettingPageSvelte from "@/components/setting/setting-page.svelte";
import {
    SETTING_DIALOG_POSITION_ID,
    disableDialogEdgeResize,
    getSettingDialogSize,
} from "@/components/setting/setting-dialog";

export function openSettingsDialog() {
    const isMobile = EnvConfig.ins.isMobile;
    const { width, height } = getSettingDialogSize();
    const dialogId = "misuzu2027-setting-" + Date.now();
    let settingPage: SettingPageSvelte | null = null;

    const settingDialog = new Dialog({
        title: EnvConfig.ins.i18n.PluginSettings,
        content: `
          <div id="${dialogId}" style="display:flex;flex-direction:column;overflow:hidden;position:relative;height:100%;"></div>
          `,
        width,
        height,
        positionId: SETTING_DIALOG_POSITION_ID,
        destroyCallback: () => {
            settingPage?.$destroy();
            settingPage = null;
        },
    });

    settingDialog.element.setAttribute("data-key", SETTING_DIALOG_POSITION_ID);
    const dialogBody = settingDialog.element.querySelector(".b3-dialog__body") as HTMLElement | null;
    if (dialogBody) {
        dialogBody.style.overflow = "hidden";
        dialogBody.style.minHeight = "0";
    }
    if (isMobile) {
        disableDialogEdgeResize(settingDialog.element);
    }

    settingPage = new SettingPageSvelte({
        target: settingDialog.element.querySelector(`#${dialogId}`),
    });
}
