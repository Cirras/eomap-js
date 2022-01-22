import {
  css,
  customElement,
  html,
  LitElement,
  query,
  state,
} from "lit-element";

import "@spectrum-web-components/theme/theme-darkest.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "@spectrum-web-components/theme/sp-theme.js";

import "./menubar";
import "./sidebar";
import "./startup";
import "./editor";
import "./infobar";
import "./entity-editor";
import "./new-map";
import "./properties";

import { Palette } from "./palette";

import { GFXLoader } from "../gfx/load/gfx-loader";
import { BundledLoadingStrategy } from "../gfx/load/strategy/bundled-loading-strategy";
import { DownloadLoadingStrategy } from "../gfx/load/strategy/download-loading-strategy";

import { TilePos } from "../tilepos";
import { Eyedrop } from "../tools/eyedrop";
import { LayerVisibilityState } from "../layer-visibility-state";
import { CommandInvoker } from "../command/command";

import { EMF } from "../data/emf";
import { EOReader } from "../data/eo-reader";
import { EntityState } from "../entity-state";
import { MapPropertiesState } from "../map-properties-state";
import { EOBuilder } from "../data/eo-builder";

@customElement("eomap-application")
export class Application extends LitElement {
  static get styles() {
    return css`
      sp-theme {
        --spectrum-divider-size: 1px;
        background-color: var(--spectrum-global-color-gray-200);
        color: var(--spectrum-global-color-gray-800);
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: min-content 1fr;
        grid-template-columns: min-content minmax(0, 1fr) min-content;
        grid-row-gap: var(--spectrum-divider-size);
        grid-column-gap: var(--spectrum-divider-size);
        overflow: hidden;
      }

      eomap-menubar {
        grow-row: 1 / 2;
        grid-column: 1 / 3;
      }

      eomap-sidebar {
        grid-row: 2 / 5;
        grid-column: 1;
      }

      eomap-startup {
        grid-row: 2 / 4;
        grid-column: 2;
      }

      eomap-editor {
        grid-row: 2 / 4;
        grid-column: 2;
      }

      eomap-palette {
        grid-row: 2 / 5;
        grid-column: 3;
      }

      eomap-infobar {
        grid-row: 4 / 5;
        grid-column: 2;
      }
    `;
  }

  @query("sp-theme", true)
  theme;

  @query("eomap-sidebar", true)
  sidebar;

  @query("eomap-entity-editor")
  entityEditor;

  @query("eomap-new-map")
  newMap;

  @query("eomap-properties")
  properties;

  @state({ type: CommandInvoker })
  commandInvoker = new CommandInvoker();

  @state({ type: GFXLoader })
  gfxLoader = null;

  @state({ type: EMF })
  emf = null;

  @state({ type: Number })
  gfxErrors = 0;

  @state({ type: Error })
  emfError = null;

  @state({ type: TilePos })
  currentPos = new TilePos();

  @state({ type: LayerVisibilityState })
  layerVisibility = new LayerVisibilityState();

  @state({ type: String })
  selectedTool = "draw";

  @state({ type: Number })
  selectedLayer = 0;

  @state({ type: Number })
  selectedDrawID = null;

  @state({ type: Eyedrop })
  eyedrop = null;

  @state({ type: EntityState })
  entityState = null;

  @state({ type: MapPropertiesState })
  MapPropertiesState = null;

  @state({ type: Boolean })
  paletteResizing = false;

  @state({ type: Number })
  maxPaletteWidth = Palette.DEFAULT_WIDTH;

  fileHandle = null;

  onWindowKeyDown = (event) => {
    if (this.keyboardEnabled()) {
      this.handleLayerVisibilityShortcuts(event);
      this.handleUndoRedoShortcuts(event);
      this.handleFileShortcuts(event);
    }
  };

  onResize = (_event) => {
    this.calculateMaxPaletteWidth();
  };

  constructor() {
    super();
    this.initializeGFXLoader();
    this.preventSpecialInputsFromBeingSwallowed();
  }

  initializeGFXLoader() {
    // TODO: Electron build, remove hardcoded URL
    let egfStrategy = new DownloadLoadingStrategy(
      "https://game.bones-underground.org/gfx"
    );
    let rawStrategy = new BundledLoadingStrategy(
      require.context("../assets/bundled", true, /\.png$/)
    );
    let gfxLoader = new GFXLoader(egfStrategy, rawStrategy);
    let promises = [3, 4, 5, 6, 7, 22].map((fileID) =>
      gfxLoader.loadEGF(fileID).catch((error) => {
        ++this.gfxErrors;
        console.error("Failed to load EGF %d: %s", fileID, error);
      })
    );
    Promise.allSettled(promises).then(() => {
      this.gfxLoader = gfxLoader;
    });
  }

  preventSpecialInputsFromBeingSwallowed() {
    this.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "ArrowLeft":
        case "ArrowRight":
        case "End":
        case "Home":
        case "PageUp":
        case "PageDown":
          document.activeElement.blur();
          break;
      }
    });
  }

  handleLayerVisibilityShortcuts(event) {
    if (!event.altKey) {
      return;
    }

    if (event.repeat) {
      return;
    }

    let flag = [
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
      "Digit5",
      "Digit6",
      "Digit7",
      "Digit8",
      "Digit9",
      "Digit0",
      "KeyE",
    ].indexOf(event.code);

    if (flag === -1) {
      return;
    }

    if (this.layerVisibility.isFlagOverridden(flag)) {
      return;
    }

    this.layerVisibility = this.layerVisibility.withFlagToggled(flag);
    event.preventDefault();
  }

  handleUndoRedoShortcuts(event) {
    if (!event.ctrlKey) {
      return;
    }

    switch (event.code) {
      case "KeyY":
        this.redo();
        break;
      case "KeyZ":
        if (event.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        break;
    }
  }

  handleFileShortcuts(event) {
    if (!event.ctrlKey) {
      return;
    }

    switch (event.code) {
      case "KeyN":
        if (event.altKey) {
          this.onNew();
          event.preventDefault();
        }
        break;
      case "KeyO":
        this.onOpen();
        event.preventDefault();
        break;
      case "KeyS":
        if (this.emf) {
          if (event.shiftKey) {
            this.onSaveAs();
          } else {
            this.onSave();
          }
        }
        event.preventDefault();
        break;
    }
  }

  undo() {
    this.commandInvoker.undo();
    this.requestUpdate();
  }

  redo() {
    this.commandInvoker.redo();
    this.requestUpdate();
  }

  readMap(buffer) {
    try {
      let reader = new EOReader(buffer);
      this.emf = EMF.read(reader);
    } catch (e) {
      this.emfError = e;
    }
  }

  async firstUpdated(changes) {
    super.firstUpdated(changes);

    const children = this.shadowRoot.querySelectorAll("*");
    await Promise.all(Array.from(children).map((c) => c.updateComplete));

    this.calculateMaxPaletteWidth();
  }

  calculateMaxPaletteWidth() {
    let width = this.theme.clientWidth - this.sidebar.offsetWidth - 2;
    this.maxPaletteWidth = Math.max(Palette.MIN_WIDTH, width);
  }

  renderEditor() {
    if (this.emf) {
      return html`
        <eomap-editor
          .commandInvoker=${this.commandInvoker}
          .gfxLoader=${this.gfxLoader}
          .emf=${this.emf}
          .layerVisibility=${this.layerVisibility}
          .selectedTool=${this.selectedTool}
          .selectedLayer=${this.selectedLayer}
          .selectedDrawID=${this.selectedDrawID}
          .entityState=${this.entityState}
          .mapPropertiesState=${this.mapPropertiesState}
          .pointerEnabled=${this.pointerEnabled()}
          .keyboardEnabled=${this.keyboardEnabled()}
          @changedata-currentPos=${this.onCurrentPosChanged}
          @changedata-eyedrop=${this.onEyedropChanged}
          @request-entity-editor=${this.onEntityEditorRequested}
        ></eomap-editor>
      `;
    }

    return html`
      <eomap-startup
        .loading=${this.isLoading()}
        .loadingLabel=${this.loadingLabel()}
        .loadingError=${this.loadingError()}
      ></eomap-startup>
    `;
  }

  render() {
    return html`
      <sp-theme color="darkest" scale="medium">
        <eomap-menubar
          .layerVisibility=${this.layerVisibility}
          .emf=${this.emf}
          .canUndo=${this.commandInvoker.hasUndoCommands}
          .canRedo=${this.commandInvoker.hasRedoCommands}
          @new=${this.onNew}
          @open=${this.onOpen}
          @save=${this.onSave}
          @save-as=${this.onSaveAs}
          @map-properties=${this.onMapProperties}
          @settings=${this.onSettings}
          @undo=${this.undo}
          @redo=${this.redo}
          @visibility-flag-toggle=${this.onVisibilityFlagToggle}
        ></eomap-menubar>
        <eomap-sidebar
          .selectedTool=${this.selectedTool}
          .canUndo=${this.commandInvoker.hasUndoCommands}
          .canRedo=${this.commandInvoker.hasRedoCommands}
          @tool-selected=${this.onToolSelected}
          @undo=${this.undo}
          @redo=${this.redo}
        ></eomap-sidebar>
        ${this.renderEditor()}
        <eomap-palette
          .gfxLoader=${this.gfxLoader}
          .gfxErrors=${this.gfxErrors}
          .eyedrop=${this.eyedrop}
          .selectedLayer=${this.selectedLayer}
          .pointerEnabled=${this.pointerEnabled()}
          .keyboardEnabled=${this.keyboardEnabled()}
          .maxWidth=${this.maxPaletteWidth}
          @resize-start=${this.onPaletteResizeStart}
          @resize-end=${this.onPaletteResizeEnd}
          @layer-selected=${this.onSelectedLayerChanged}
          @changedata-selectedDrawID=${this.onSelectedDrawIDChanged}
        ></eomap-palette>
        <eomap-infobar .tilePos=${this.currentPos}></eomap-infobar>
        <eomap-entity-editor
          .tilePos=${this.currentPos}
          @close=${this.onModalClose}
          @save=${this.onEntityEditorSave}
        ></eomap-entity-editor>
        <eomap-new-map
          @close=${this.onModalClose}
          @confirm=${this.onNewMapConfirm}
        ></eomap-new-map>
        <eomap-properties
          @close=${this.onModalClose}
          @save=${this.onPropertiesSave}
        ></eomap-properties>
      </sp-theme>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    addEventListener("keydown", this.onWindowKeyDown);
    addEventListener("resize", this.onResize);
  }

  disconnectedCallback() {
    removeEventListener("keydown", this.onWindowKeyDown);
    removeEventListener("resize", this.onResize);
    super.disconnectedCallback();
  }

  emfPickerOptions() {
    return {
      types: [
        {
          description: "Endless Map File",
          accept: {
            "*/*": [".emf"],
          },
        },
      ],
    };
  }

  onNew(_event) {
    this.newMap.open = true;
    this.requestUpdate();
  }

  async onOpen() {
    try {
      [this.fileHandle] = await showOpenFilePicker(this.emfPickerOptions());
    } catch {
      return;
    }

    this.emf = null;
    this.emfError = null;

    try {
      let file = await this.fileHandle.getFile();
      let buffer = await file.arrayBuffer();
      this.readMap(buffer);
      this.commandInvoker = new CommandInvoker();
    } catch (e) {
      console.error("Failed to load EMF", e);
    }
  }

  async onSave() {
    if (this.fileHandle === null) {
      await this.onSaveAs();
    } else {
      let builder = new EOBuilder();
      this.emf.write(builder);
      let data = builder.build();
      try {
        const writable = await this.fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
      } catch (e) {
        console.error("Failed to save EMF", e);
      }
    }
  }

  async onSaveAs() {
    try {
      this.fileHandle = await showSaveFilePicker(this.emfPickerOptions());
    } catch (e) {
      return;
    }
    this.onSave();
  }

  onMapProperties() {
    this.properties.populate(this.emf);
    this.properties.open = true;
    this.requestUpdate();
  }

  onSettings() {
    // TODO
  }

  onVisibilityFlagToggle(event) {
    let flag = event.detail;
    this.layerVisibility = this.layerVisibility.withFlagToggled(flag);
  }

  onToolSelected(event) {
    this.selectedTool = event.detail;
  }

  onCurrentPosChanged(event) {
    this.currentPos = event.detail;
  }

  onEyedropChanged(event) {
    this.eyedrop = event.detail;
  }

  onPaletteResizeStart(_event) {
    this.paletteResizing = true;
  }

  onPaletteResizeEnd(_event) {
    this.paletteResizing = false;
  }

  onSelectedLayerChanged(event) {
    this.selectedLayer = event.detail;
    this.layerVisibility = this.layerVisibility.withSelectedLayer(
      this.selectedLayer
    );
  }

  onSelectedDrawIDChanged(event) {
    this.selectedDrawID = event.detail;
  }

  onEntityEditorRequested(event) {
    this.entityEditor.entityState = event.detail;
    this.entityEditor.open = true;
    this.requestUpdate();
  }

  onModalClose(_event) {
    this.requestUpdate();
  }

  onEntityEditorSave(event) {
    this.entityState = event.detail;
  }

  onNewMapConfirm(event) {
    this.emf = EMF.new(
      event.detail.width,
      event.detail.height,
      event.detail.name
    );
    this.emfError = null;
    this.fileHandle = null;
    this.commandInvoker = new CommandInvoker();
  }

  onPropertiesSave(event) {
    this.mapPropertiesState = event.detail;
  }

  pointerEnabled() {
    return !this.paletteResizing;
  }

  modalNotOpen(modal) {
    return !modal || !modal.open;
  }

  keyboardEnabled() {
    return (
      this.modalNotOpen(this.entityEditor) &&
      this.modalNotOpen(this.newMap) &&
      this.modalNotOpen(this.properties)
    );
  }

  isLoading() {
    return !this.gfxLoader || (this.fileHandle && !this.emf);
  }

  loadingLabel() {
    if (!this.gfxLoader) {
      if (this.gfxErrors > 0) {
        return `Failed to load ${this.gfxErrors} GFX file(s).`;
      }
      return "Loading GFX...";
    }

    if (this.emfError) {
      return this.emfError.message;
    }

    if (this.fileHandle) {
      return `Loading ${this.fileHandle.name}...`;
    }
  }

  loadingError() {
    return this.gfxErrors > 0 || this.emfError;
  }
}
