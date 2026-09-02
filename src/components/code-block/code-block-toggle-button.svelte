<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import {
        getCodeBlockFoldHeight,
        getCodeBlockNaturalHeight,
        getGlobalCodeBlockMaxHeight,
        isCodeBlockFullyExpanded,
        setCodeBlockMaxHeight,
    } from "@/components/code-block/code-block-height";

    export let codeBlockElement: HTMLElement | Element;

    let blockExpand: boolean;
    let styleObserver: MutationObserver | undefined;

    onMount(async () => {
        refreshExpandState();
        addCodeBlockObeserver();
    });

    function getBlockElement(): HTMLElement | null {
        return codeBlockElement instanceof HTMLElement ? codeBlockElement : null;
    }

    function refreshExpandState() {
        const blockElement = getBlockElement();
        if (!blockElement) {
            return;
        }
        blockExpand = isCodeBlockFullyExpanded(blockElement);
    }

    function addCodeBlockObeserver() {
        const blockElement = getBlockElement();
        if (!blockElement) {
            return;
        }
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (
                    mutation.type !== "attributes" ||
                    mutation.attributeName !== "style"
                ) {
                    continue;
                }
                refreshExpandState();
            }
        });

        observer.observe(blockElement, {
            attributes: true,
            attributeFilter: ["style"],
        });
        styleObserver = observer;
    }

    onDestroy(() => {
        styleObserver?.disconnect();
        styleObserver = undefined;
    });

    function handleCodeBlockToggle(event) {
        const blockElement = getBlockElement();
        if (!blockElement) {
            return;
        }
        event.stopPropagation();

        const foldHeight = getCodeBlockFoldHeight();
        const naturalHeight = getCodeBlockNaturalHeight(blockElement);
        if (naturalHeight < foldHeight) {
            return;
        }

        if (blockExpand) {
            setCodeBlockMaxHeight(blockElement, foldHeight, true);
            blockExpand = false;
            return;
        }

        const globalMaxHeight = getGlobalCodeBlockMaxHeight();
        if (globalMaxHeight && naturalHeight > globalMaxHeight) {
            setCodeBlockMaxHeight(blockElement, naturalHeight, true);
        } else {
            setCodeBlockMaxHeight(blockElement, null, true);
        }
        blockExpand = true;
    }
</script>

<button on:click={handleCodeBlockToggle}>
    {#if blockExpand}
        折叠
    {:else}
        展开
    {/if}
</button>

<style>
    button {
        margin: 0px 3px;
        font-size: 85%;
        padding: 0px 4px;
    }
</style>
