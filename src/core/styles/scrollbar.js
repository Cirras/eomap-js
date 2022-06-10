import { css } from "lit";

export default css`
  ::-webkit-scrollbar {
    background-color: var(--spectrum-global-color-gray-200);
    border: var(--spectrum-global-dimension-size-25)
      var(--spectrum-global-color-gray-75) solid;
    border-radius: var(--spectrum-global-dimension-size-185);
    width: var(--spectrum-global-dimension-size-185);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--spectrum-global-color-gray-400);
    background-clip: content-box;
    border: var(--spectrum-global-dimension-size-25) transparent solid;
    border-radius: var(--spectrum-global-dimension-size-185);
    min-height: var(--spectrum-global-dimension-size-250);
    width: var(--spectrum-global-dimension-size-185);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--spectrum-global-color-gray-500);
    background-clip: content-box;
  }
  ::-webkit-scrollbar-resizer {
    display: none;
    width: 0px;
    background-color: transparent;
  }
  ::-webkit-scrollbar-button {
    height: 0px;
  }
  ::-webkit-scrollbar-corner {
    display: none;
  }
`;
