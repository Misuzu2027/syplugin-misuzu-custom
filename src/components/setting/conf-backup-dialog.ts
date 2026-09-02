import { showMessage } from "siyuan";
import {
    CONF_BACKUP_SECTIONS,
    DEFAULT_RESTORE_SECTIONS,
} from "@/models/conf-backup-model";
import type { ConfBackupSectionKey, SettingBackupMeta } from "@/models/conf-backup-model";
import { ConfBackupService } from "@/service/ConfBackupService";
import { confirmDialog } from "@/utils/siyuan-util";

export function openBackupFormDialog(options: {
    title: string;
    name: string;
    note: string;
    nameLabel: string;
    noteLabel: string;
    emptyNameMsg: string;
}): Promise<{ name: string; note: string } | null> {
    return new Promise((resolve) => {
        const wrap = document.createElement("div");
        wrap.className = "mz-conf-backup-form";

        const nameLabel = document.createElement("div");
        nameLabel.className = "fn__flex-column";
        nameLabel.style.gap = "6px";
        const nameTitle = document.createElement("div");
        nameTitle.textContent = options.nameLabel;
        const nameInput = document.createElement("input");
        nameInput.className = "b3-text-field fn__block";
        nameInput.value = options.name;
        nameLabel.appendChild(nameTitle);
        nameLabel.appendChild(nameInput);

        const noteLabel = document.createElement("div");
        noteLabel.className = "fn__flex-column";
        noteLabel.style.gap = "6px";
        noteLabel.style.marginTop = "12px";
        const noteTitle = document.createElement("div");
        noteTitle.textContent = options.noteLabel;
        const noteInput = document.createElement("textarea");
        noteInput.className = "b3-text-field fn__block";
        noteInput.rows = 3;
        noteInput.value = options.note;
        noteLabel.appendChild(noteTitle);
        noteLabel.appendChild(noteInput);

        wrap.appendChild(nameLabel);
        wrap.appendChild(noteLabel);

        confirmDialog(
            options.title,
            wrap,
            () => {
                const name = nameInput.value.trim();
                if (!name) {
                    showMessage(options.emptyNameMsg, 3000, "info");
                    nameInput.focus();
                    return false;
                }
                resolve({ name, note: noteInput.value.trim() });
                return true;
            },
            () => resolve(null),
        );
    });
}

export function openRestoreDialog(options: {
    title: string;
    intro: string;
    warning?: string;
    sectionsLabel: string;
    emptySectionMsg: string;
    sectionLabel: (key: ConfBackupSectionKey) => string;
}): Promise<ConfBackupSectionKey[] | null> {
    return new Promise((resolve) => {
        const wrap = document.createElement("div");
        wrap.className = "mz-conf-backup-restore";

        const intro = document.createElement("div");
        intro.style.marginBottom = "10px";
        intro.textContent = options.intro;
        wrap.appendChild(intro);

        if (options.warning) {
            const warning = document.createElement("div");
            warning.style.marginBottom = "10px";
            warning.style.color = "var(--b3-theme-error)";
            warning.style.whiteSpace = "pre-wrap";
            warning.textContent = options.warning;
            wrap.appendChild(warning);
        }

        const sectionsTitle = document.createElement("div");
        sectionsTitle.style.margin = "8px 0";
        sectionsTitle.textContent = options.sectionsLabel;
        wrap.appendChild(sectionsTitle);

        const box = document.createElement("div");
        box.className = "fn__flex-column";
        box.style.gap = "8px";

        const checks = new Map<ConfBackupSectionKey, HTMLInputElement>();
        for (const key of CONF_BACKUP_SECTIONS) {
            const row = document.createElement("label");
            row.className = "fn__flex";
            row.style.alignItems = "center";
            row.style.gap = "8px";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.className = "b3-switch";
            input.checked = DEFAULT_RESTORE_SECTIONS.includes(key);
            const text = document.createElement("span");
            text.textContent = options.sectionLabel(key);
            row.appendChild(input);
            row.appendChild(text);
            box.appendChild(row);
            checks.set(key, input);
        }
        wrap.appendChild(box);

        confirmDialog(
            options.title,
            wrap,
            () => {
                const selected = CONF_BACKUP_SECTIONS.filter((key) => checks.get(key)?.checked);
                if (selected.length === 0) {
                    showMessage(options.emptySectionMsg, 3000, "info");
                    return false;
                }
                resolve(selected);
                return true;
            },
            () => resolve(null),
        );
    });
}

export function isDifferentDeviceKind(meta: SettingBackupMeta): boolean {
    const current = ConfBackupService.ins.collectDeviceInfo();
    return current.deviceKind !== meta.deviceKind;
}
