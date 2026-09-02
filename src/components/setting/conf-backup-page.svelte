<script lang="ts">
    import { onMount } from "svelte";
    import { showMessage } from "siyuan";
    import { EnvConfig } from "@/config/EnvConfig";
    import type { ConfBackupSectionKey, SettingBackupListItem, SettingBackupMeta } from "@/models/conf-backup-model";
    import { ConfBackupService } from "@/service/ConfBackupService";
    import { formatLocalDateTime } from "@/utils/datetime-util";
    import { confirmDialog } from "@/utils/siyuan-util";
    import {
        isDifferentDeviceKind,
        openBackupFormDialog,
        openRestoreDialog,
    } from "./conf-backup-dialog";

    const isMobile = EnvConfig.ins.isMobile;
    const service = ConfBackupService.ins;

    let items: SettingBackupListItem[] = [];
    let loading = true;
    let busy = false;

    function t(key: string, fallback: string): string {
        const value = EnvConfig.ins.i18n?.[key];
        return typeof value === "string" && value ? value : fallback;
    }

    async function refresh() {
        loading = true;
        try {
            items = await service.list();
        } catch (err) {
            showMessage(String(err), 5000, "error");
        } finally {
            loading = false;
        }
    }

    async function onBackup() {
        if (busy) return;
        const form = await openBackupFormDialog({
            title: t("SettingBackupCreateTitle", "备份当前设置"),
            name: service.defaultBackupName(),
            note: "",
            nameLabel: t("SettingBackupName", "名称"),
            noteLabel: t("SettingBackupNote", "备注"),
            emptyNameMsg: t("SettingBackupNameRequired", "请填写备份名称"),
        });
        if (!form) return;

        busy = true;
        try {
            await service.create(form.name, form.note);
            showMessage(t("SettingBackupCreateSuccess", "已备份当前设置"), 3000, "info");
            await refresh();
        } catch (err) {
            showMessage(String(err), 5000, "error");
        } finally {
            busy = false;
        }
    }

    async function onEdit(item: SettingBackupMeta) {
        if (busy) return;
        const form = await openBackupFormDialog({
            title: t("SettingBackupEditTitle", "编辑备份信息"),
            name: item.name,
            note: item.note || "",
            nameLabel: t("SettingBackupName", "名称"),
            noteLabel: t("SettingBackupNote", "备注"),
            emptyNameMsg: t("SettingBackupNameRequired", "请填写备份名称"),
        });
        if (!form) return;

        busy = true;
        try {
            await service.updateMeta(item.id, form.name, form.note);
            showMessage(t("SettingBackupUpdateSuccess", "已更新备份信息"), 3000, "info");
            await refresh();
        } catch (err) {
            showMessage(String(err), 5000, "error");
        } finally {
            busy = false;
        }
    }

    function onDelete(item: SettingBackupMeta) {
        if (busy) return;
        const tip = document.createElement("div");
        tip.textContent = t("SettingBackupDeleteConfirm", "确定删除这份备份？删除后无法恢复。");
        confirmDialog(
            t("SettingBackupDeleteTitle", "删除备份"),
            tip,
            () => {
                void deleteItem(item);
                return true;
            },
        );
    }

    async function deleteItem(item: SettingBackupMeta) {
        busy = true;
        try {
            await service.remove(item.id);
            showMessage(t("SettingBackupDeleteSuccess", "已删除备份"), 3000, "info");
            await refresh();
        } catch (err) {
            showMessage(String(err), 5000, "error");
        } finally {
            busy = false;
        }
    }

    async function onRestore(item: SettingBackupMeta) {
        if (busy) return;
        const warnings = [
            item.compat.level === "compatible" ? "" : service.compatReason(item.compat),
            isDifferentDeviceKind(item)
                ? t(
                      "SettingBackupDeviceMismatch",
                      "这份备份来自不同类型的设备。界面布局通常不能直接互用，建议只还原快捷键等通用设置。",
                  )
                : "",
        ].filter(Boolean);
        const sections = await openRestoreDialog({
            title: t("SettingBackupRestoreTitle", "还原设置"),
            intro: `${t("SettingBackupRestoreIntro", "将使用以下备份覆盖当前设备上对应的本地设置：")}「${item.name}」`,
            warning: warnings.join("\n"),
            sectionsLabel: t("SettingBackupSelectSections", "选择要还原的设置"),
            emptySectionMsg: t("SettingBackupSelectSection", "请至少选择一项要还原的设置"),
            sectionLabel: (key: ConfBackupSectionKey) => service.sectionLabel(key),
        });
        if (!sections) return;

        busy = true;
        try {
            await service.restore(item.id, sections);
            showMessage(t("SettingBackupRestoreSuccess", "设置已还原"), 3000, "info");
            askReload();
        } catch (err) {
            showMessage(String(err), 5000, "error");
            busy = false;
        }
    }

    function askReload() {
        const tip = document.createElement("div");
        tip.textContent = t(
            "SettingBackupReloadConfirm",
            "设置已经写入。重载界面后才会完全生效，是否现在重载？",
        );
        confirmDialog(
            t("SettingBackupReloadTitle", "重载界面"),
            tip,
            () => {
                void service.reloadInterface();
                return true;
            },
            () => {
                busy = false;
            },
        );
    }

    onMount(() => {
        void refresh();
    });
</script>

<div class="mz-conf-backup" class:mz-conf-backup--mobile={isMobile}>
    <div class="mz-conf-backup__toolbar">
        <button
            class="b3-button"
            type="button"
            disabled={busy}
            on:click={onBackup}
        >
            {t("SettingBackupCreate", "备份当前设置")}
        </button>
    </div>
    <div class="mz-conf-backup__desc">
        {t(
            "SettingBackupDesc",
            "快捷键、外观、编辑器等设置保存在工作区 conf 目录，不会随笔记同步。备份会写入插件数据，可随工作区同步到其他设备后再还原。",
        )}
    </div>

    {#if loading}
        <div class="mz-conf-backup__empty">{t("SettingBackupLoading", "正在读取备份…")}</div>
    {:else if items.length === 0}
        <div class="mz-conf-backup__empty">
            {t("SettingBackupEmpty", "还没有备份。点击上方按钮，把当前设备的设置保存下来。")}
        </div>
    {:else}
        <div class="mz-conf-backup__list">
            {#each items as item (item.id)}
                <div
                    class="mz-conf-backup__card"
                    class:mz-conf-backup__card--incompatible={item.compat.level === "incompatible"}
                >
                    <div class="mz-conf-backup__card-main">
                        <div class="mz-conf-backup__name-row">
                            <div class="mz-conf-backup__name">{item.name}</div>
                            {#if item.compat.level !== "compatible"}
                                <span
                                    class="mz-conf-backup__badge"
                                    class:mz-conf-backup__badge--error={item.compat.level === "incompatible"}
                                    class:mz-conf-backup__badge--warn={item.compat.level === "caution" ||
                                        item.compat.level === "unknown"}
                                >
                                    {service.compatLabel(item.compat.level)}
                                </span>
                            {/if}
                        </div>
                        <div class="mz-conf-backup__meta">
                            <div>
                                <span class="mz-conf-backup__label"
                                    >{t("SettingBackupTime", "时间")}</span
                                >
                                {formatLocalDateTime(item.createdAt)}
                            </div>
                            <div>
                                <span class="mz-conf-backup__label"
                                    >{t("SettingBackupDeviceName", "设备名称")}</span
                                >
                                {item.deviceName}
                            </div>
                            <div>
                                <span class="mz-conf-backup__label"
                                    >{t("SettingBackupDeviceModel", "设备型号")}</span
                                >
                                {service.deviceModelText(item)}
                            </div>
                            <div>
                                <span class="mz-conf-backup__label"
                                    >{t("SettingBackupAppVersion", "版本")}</span
                                >
                                {item.appVersion || "-"}
                                {#if service.currentAppVersion() && item.appVersion !== service.currentAppVersion()}
                                    <span class="mz-conf-backup__current-ver">
                                        ({t("SettingBackupCurrentVersion", "当前")} {service.currentAppVersion()})
                                    </span>
                                {/if}
                            </div>
                            {#if item.compat.level !== "compatible"}
                                <div class="mz-conf-backup__compat-reason">
                                    {service.compatReason(item.compat)}
                                </div>
                            {/if}
                            {#if item.note}
                                <div>
                                    <span class="mz-conf-backup__label"
                                        >{t("SettingBackupNote", "备注")}</span
                                    >
                                    {item.note}
                                </div>
                            {/if}
                        </div>
                    </div>
                    <div class="mz-conf-backup__actions">
                        <button
                            class="b3-button"
                            type="button"
                            disabled={busy}
                            on:click={() => onRestore(item)}
                        >
                            {t("SettingBackupRestoreAction", "还原")}
                        </button>
                        <button
                            class="b3-button b3-button--outline"
                            type="button"
                            disabled={busy}
                            on:click={() => onEdit(item)}
                        >
                            {t("SettingBackupEdit", "编辑")}
                        </button>
                        <button
                            class="b3-button b3-button--cancel"
                            type="button"
                            disabled={busy}
                            on:click={() => onDelete(item)}
                        >
                            {t("SettingBackupDelete", "删除")}
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .mz-conf-backup {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 0;
    }

    .mz-conf-backup__toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .mz-conf-backup__desc {
        font-size: 12px;
        line-height: 1.6;
        color: var(--b3-theme-on-surface-light);
    }

    .mz-conf-backup__empty {
        padding: 28px 8px;
        text-align: center;
        color: var(--b3-theme-on-surface-light);
        font-size: 13px;
    }

    .mz-conf-backup__list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .mz-conf-backup__card {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid var(--b3-border-color);
    }

    .mz-conf-backup__card:last-child {
        border-bottom: none;
    }

    .mz-conf-backup__card-main {
        min-width: 0;
        flex: 1 1 auto;
    }

    .mz-conf-backup__name-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 6px;
    }

    .mz-conf-backup__name {
        font-size: 14px;
        font-weight: 600;
        color: var(--b3-theme-primary);
        word-break: break-word;
    }

    .mz-conf-backup__badge {
        flex-shrink: 0;
        font-size: 11px;
        line-height: 1;
        padding: 3px 6px;
        border-radius: 4px;
        border: 1px solid transparent;
    }

    .mz-conf-backup__badge--error {
        color: var(--b3-theme-error);
        border-color: var(--b3-theme-error);
        background-color: var(--b3-theme-error-lighter, transparent);
    }

    .mz-conf-backup__badge--warn {
        color: var(--b3-theme-secondary, var(--b3-theme-on-surface));
        border-color: var(--b3-theme-secondary, var(--b3-border-color));
    }

    .mz-conf-backup__current-ver,
    .mz-conf-backup__compat-reason {
        color: var(--b3-theme-on-surface-light);
    }

    .mz-conf-backup__card--incompatible .mz-conf-backup__compat-reason {
        color: var(--b3-theme-error);
    }

    .mz-conf-backup__meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--b3-theme-on-surface);
    }

    .mz-conf-backup__label {
        color: var(--b3-theme-on-surface-light);
        margin-right: 6px;
    }

    .mz-conf-backup__actions {
        display: flex;
        flex-shrink: 0;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
    }

    .mz-conf-backup--mobile .mz-conf-backup__card {
        flex-direction: column;
        align-items: stretch;
    }

    .mz-conf-backup--mobile .mz-conf-backup__actions {
        justify-content: stretch;
    }

    .mz-conf-backup--mobile .mz-conf-backup__actions :global(.b3-button) {
        flex: 1 1 auto;
    }
</style>
