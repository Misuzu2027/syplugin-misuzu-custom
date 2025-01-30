<script lang="ts">
  // import { EnvConfig } from "@/config/EnvConfig";
  import { setBlockAttrs } from "@/utils/api";
  import { onMount } from "svelte";

  export let codeBlockId;
  export let codeBlockName;

  let inputElement: HTMLInputElement;

  // let rootElement: HTMLElement;

  onMount(async () => {
    inputElement.value = codeBlockName;
  });

  function handleNameInputChange(event) {
    // console.log("handleNameInputChange");
    event.stopPropagation();
    event.preventDefault();
    let inputValue = event.target.value;

    inputElement.blur();
    inputElement.focus();

    let attrs = {};
    attrs["name"] = inputValue;
    setBlockAttrs(codeBlockId, attrs);
  }

  function handleCompositionEnd(event) {
    // console.log("handleCompositionEnd");
    handleNameInputChange(event);
  }
</script>

<input
  contenteditable="false"
  placeholder="代码块名称"
  bind:this={inputElement}
  class="b3-text-field fn__block misuzu2027__copy misuzu2027__protyle-custom"
  on:change|stopPropagation={handleNameInputChange}
  on:keydown|stopPropagation
  on:keypress|stopPropagation
  on:keyup|stopPropagation
  on:input|stopPropagation
  on:compositionend|stopPropagation={handleCompositionEnd}
/>

<style>
  input {
    margin-top: -1px;
    margin-left: 30px;
    width: 110px;
    height: 25px;
    font-size: 85%;
    font-weight: bold;
    background-color: rgba(128, 128, 128, 0);
  }
  input:focus {
    background-color: var(--b3-theme-background);
  }
</style>
