import { EnvConfig } from "@/config/EnvConfig";

export const SETTING_DIALOG_POSITION_ID = "syplugin-misuzu-custom-setting";

export function getSettingDialogSize() {
    const isMobile = EnvConfig.ins.isMobile;
    return {
        width: isMobile ? "92vw" : "960px",
        height: isMobile ? "75vh" : "80vh",
    };
}

/** 手机端去掉官方弹窗边缘拖拽热区，避免滑动时误改尺寸。 */
export function disableDialogEdgeResize(dialogEl: HTMLElement) {
    dialogEl
        .querySelectorAll(
            ".resize__r, .resize__l, .resize__t, .resize__d, .resize__rd, .resize__ld, .resize__lt, .resize__rt",
        )
        .forEach((el) => el.remove());
}
