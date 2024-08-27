<script lang="ts">
    // import { EnvConfig } from "@/config/EnvConfig";
    import { setBlockAttrs } from "@/utils/api";
    import { onMount } from "svelte";

    export let codeBlockId;
    export let codeBlockName;

    // let rootElement: HTMLElement;

    onMount(async () => {});

    function handleNameInputChange(event) {
        event.stopPropagation();
        let attrs = {};
        attrs["name"] = codeBlockName;
        setBlockAttrs(codeBlockId, attrs);
    }
    // function handleKeyEventDefault(event) {
    //     console.log(event.key);
    // }
</script>

<input
    contenteditable="false"
    placeholder="代码块名称"
    bind:value={codeBlockName}
    class="b3-text-field fn__block misuzu2027__copy misuzu2027__protyle-custom"
    on:change|stopPropagation={handleNameInputChange}
    on:keydown|stopPropagation
    on:keypress|stopPropagation
    on:keyup|stopPropagation
    on:input|stopPropagation
/>

<style>
    input {
        margin-top: -1px;
        margin-left: 30px;
        width: 100px;
        height: 25px;
        font-size: 85%;
        font-weight: bold;
        background-color: rgba(128, 128, 128, 0);
    }
    input:focus {
        background-color: var(--b3-theme-background);
    }
</style>
