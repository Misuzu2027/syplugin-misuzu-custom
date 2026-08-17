<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { EnvConfig } from "@/config/EnvConfig";

    export let tabs: { key: string; label: string; icon?: string }[] = [];
    export let activeTab: string;
    export let sidebarWidth = 200;
    export let minSidebarWidth = 150;
    export let maxSidebarWidth = 420;
    export let storageKey = "misuzu2027-setting-sidebar-width";

    const isMobile = EnvConfig.ins.isMobile;
    const resizerTitle =
        (EnvConfig.ins.i18n as Record<string, string>)?.settingLayoutResizerTitle ??
        "拖动调整宽度";

    let layoutRef: HTMLElement | null = null;
    let widthPx = sidebarWidth;
    let dragging = false;
    let activePointerId: number | null = null;

    function clamp(w: number): number {
        return Math.min(maxSidebarWidth, Math.max(minSidebarWidth, w));
    }

    function onResizeStart(e: PointerEvent) {
        if (isMobile) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        dragging = true;
        activePointerId = e.pointerId;
        try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }

    function onResizeMove(e: PointerEvent) {
        if (isMobile || !dragging || !layoutRef) return;
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        const rect = layoutRef.getBoundingClientRect();
        widthPx = clamp(e.clientX - rect.left);
    }

    function onResizeEnd(e: PointerEvent) {
        if (isMobile || !dragging) return;
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        dragging = false;
        activePointerId = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        try {
            localStorage.setItem(storageKey, String(widthPx));
        } catch {
            /* ignore */
        }
    }

    function selectTab(key: string) {
        activeTab = key;
    }

    function onTabKeydown(e: KeyboardEvent, key: string) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectTab(key);
        }
    }

    onMount(() => {
        try {
            const saved = Number(localStorage.getItem(storageKey));
            if (!Number.isNaN(saved) && saved > 0) widthPx = clamp(saved);
        } catch {
            /* ignore */
        }
    });

    onDestroy(() => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    });
</script>

<div
    class="mz-setting-layout"
    class:mz-setting-layout--mobile={isMobile}
    bind:this={layoutRef}
>
    <ul
        class="mz-setting-layout__sidebar b3-list b3-list--background"
        style={isMobile ? undefined : `width:${widthPx}px;`}
        role="tablist"
    >
        {#each tabs as tab (tab.key)}
            <li
                class="b3-list-item"
                class:b3-list-item--focus={activeTab === tab.key}
                on:click={() => selectTab(tab.key)}
                on:keydown={(e) => onTabKeydown(e, tab.key)}
                role="tab"
                tabindex="0"
                aria-selected={activeTab === tab.key}
            >
                {#if tab.icon}
                    <svg class="b3-list-item__graphic">
                        <use xlink:href={`#${tab.icon}`}></use>
                    </svg>
                {/if}
                <span class="b3-list-item__text">{tab.label}</span>
            </li>
        {/each}
    </ul>

    {#if !isMobile}
        <div
            class="mz-setting-layout__resizer"
            class:mz-setting-layout__resizer--active={dragging}
            title={resizerTitle}
            on:pointerdown={onResizeStart}
            on:pointermove={onResizeMove}
            on:pointerup={onResizeEnd}
            on:pointercancel={onResizeEnd}
            role="slider"
            aria-orientation="vertical"
            aria-label={resizerTitle}
            aria-valuenow={widthPx}
            tabindex="-1"
        ></div>
    {/if}

    <div class="mz-setting-layout__content">
        <slot />
    </div>
</div>

<style lang="scss">
    .mz-setting-layout {
        display: flex;
        height: 100%;
        min-width: 0;
    }

    .mz-setting-layout__sidebar {
        flex: 0 0 auto;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .mz-setting-layout__sidebar :global(.b3-list-item) {
        padding-left: 1rem;
        padding-right: 0.75rem;
        white-space: nowrap;
        cursor: pointer;
    }

    .mz-setting-layout__sidebar :global(.b3-list-item__text) {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .mz-setting-layout__resizer {
        flex: 0 0 6px;
        margin: 0 -2px;
        cursor: col-resize;
        touch-action: none;
        position: relative;
        z-index: 1;
    }

    .mz-setting-layout__resizer::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 2px;
        width: 2px;
        background-color: transparent;
        transition: background-color 0.15s ease;
    }

    .mz-setting-layout__resizer:hover::after,
    .mz-setting-layout__resizer--active::after {
        background-color: var(--b3-theme-primary);
    }

    .mz-setting-layout__content {
        flex: 1 1 auto;
        min-width: 0;
        overflow: auto;
        padding: 16px 20px;
    }

    .mz-setting-layout--mobile {
        flex-direction: column;
    }

    .mz-setting-layout--mobile .mz-setting-layout__sidebar {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        border-bottom: 1px solid var(--b3-border-color);
    }

    .mz-setting-layout--mobile .mz-setting-layout__sidebar :global(.b3-list-item) {
        flex: 0 0 auto;
        padding: 8px 12px;
    }

    .mz-setting-layout--mobile .mz-setting-layout__content {
        padding: 12px 14px;
    }
</style>
