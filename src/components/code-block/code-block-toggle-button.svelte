<script lang="ts">
    import { SettingService } from "@/service/SettingService";
    import { setBlockAttrs } from "@/utils/api";

    // import { EnvConfig } from "@/config/EnvConfig";
    import { onMount } from "svelte";

    export let codeBlockElement: HTMLElement | Element;

    // let rootElement: HTMLElement;
    let blockExpand: boolean;
    const ATTR_KEY = "custom-misuzu2027-code-block-height";

    onMount(async () => {
        addCodeBlockObeserver();
    });

    function addCodeBlockObeserver() {
        // 选择要观察的元素
        let hljsElement = codeBlockElement.querySelector(
            "div.hljs",
        ) as HTMLElement;
        blockExpand = hljsElement.clientHeight >= hljsElement.scrollHeight;
        // 创建 MutationObserver 实例
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!hljsElement) {
                    return;
                }
                if (
                    mutation.type !== "attributes" ||
                    mutation.attributeName !== "style"
                ) {
                    return;
                }
                blockExpand =
                    hljsElement.clientHeight >= hljsElement.scrollHeight;
                let lastHeight = codeBlockElement.getAttribute(ATTR_KEY);
                let styleHeightVal = hljsElement.style.height;
                if (lastHeight != styleHeightVal) {
                    let codeBlockId =
                        codeBlockElement.getAttribute("data-node-id");
                    let attrs = {};
                    attrs[ATTR_KEY] = styleHeightVal;
                    setBlockAttrs(codeBlockId, attrs);
                }
            });
        });

        // 配置 MutationObserver，监听属性变化
        observer.observe(hljsElement, {
            attributes: true, // 监听属性变化
            attributeFilter: ["style"], // 仅监听 style 属性
        });
    }

    function handleCodeBlockToggle(event) {
        if (!codeBlockElement) {
            return;
        }
        event.stopPropagation();
        let hljsElement = codeBlockElement.querySelector(
            "div.hljs",
        ) as HTMLElement;

        let config = SettingService.ins.SettingConfig;
        let foldHeight = config.codeBlockFoldHeight;
        if (isNaN(foldHeight) || foldHeight <= 150) {
            foldHeight = 150;
        }
        // blockExpand = hljsElement.clientHeight >= hljsElement.scrollHeight;
        if (blockExpand) {
            hljsElement.style.height = foldHeight + "px";
        } else {
            hljsElement.style.removeProperty("height");
        }
        blockExpand = !blockExpand;
    }
    // function handleKeyEventDefault(event) {
    //     console.log(event.key);
    // }
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
