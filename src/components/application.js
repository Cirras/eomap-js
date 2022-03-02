import { css, html, LitElement } from "lit";

import { customElement, property, query, state } from "lit/decorators.js";

import { get, set } from "idb-keyval";

import "@spectrum-web-components/theme/theme-darkest.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/dropzone/sp-dropzone.js";

import "./menubar";
import "./sidebar";
import "./editor";
import "./infobar";
import "./entity-editor";
import "./new-map";
import "./properties";
import "./settings";

import { Startup } from "./startup";
import { Palette } from "./palette";

import { GFXLoader } from "../gfx/load/gfx-loader";
import { LocalLoadingStrategy } from "../gfx/load/strategy/local-loading-strategy";
import { RemoteLoadingStrategy } from "../gfx/load/strategy/remote-loading-strategy";

import { TilePos } from "../tilepos";
import { Eyedrop } from "../tools/eyedrop";
import { LayerVisibilityState } from "../layer-visibility-state";
import { EntityState } from "../entity-state";
import { MapPropertiesState } from "../map-properties-state";
import { SettingsState } from "../settings-state";
import { MapState } from "../map-state";

import { EMF } from "../data/emf";
import { EOReader } from "../data/eo-reader";
import { EOBuilder } from "../data/eo-builder";

import { asyncFilter, fileSystemAccessSupported } from "../utils";

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

      sp-dropzone {
        --spectrum-dropzone-border-width: 0px;
        --spectrum-dropzone-border-radius: 0px;
        --spectrum-dropzone-padding: 0px;
        grid-row: 2 / 4;
        grid-column: 2;
        z-index: 101;
        pointer-events: none;
      }

      sp-dropzone[dragged] {
        --spectrum-dropzone-border-width: unset;
      }

      :host([dragged]) sp-dropzone {
        pointer-events: all;
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

  @query("sp-dropzone", true)
  dropzone;

  @query("eomap-sidebar", true)
  sidebar;

  @query("eomap-entity-editor")
  entityEditor;

  @query("eomap-new-map")
  newMap;

  @query("eomap-properties")
  properties;

  @query("eomap-settings")
  settings;

  @property({ type: Boolean, reflect: true, attribute: "dragged" })
  isDragged = false;

  @state({ type: Number })
  startupStatus = Startup.Status.LOADING_SETTINGS;

  @state({ type: GFXLoader })
  gfxLoader = null;

  @state({ type: MapState })
  mapState = new MapState();

  @state({ type: Number })
  gfxErrors = 0;

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
  mapPropertiesState = null;

  @state({ type: SettingsState })
  settingsState = null;

  @state({ type: Array })
  recentFiles = [];

  @state({ type: Boolean })
  paletteResizing = false;

  @state({ type: Number })
  maxPaletteWidth = Palette.DEFAULT_WIDTH;

  pendingGFXLoader = null;

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
    this.loadSettings();
    this.loadRecentFiles();
    this.preventSpecialInputsFromBeingSwallowed();
  }

  async loadSettings() {
    try {
      let settings = await get("settings");
      this.settingsState = SettingsState.fromIDB(settings);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }

  async loadRecentFiles() {
    try {
      this.recentFiles = (await get("recentFiles")) || [];
    } catch (e) {
      console.error("Failed to load recent files", e);
    }
  }

  async saveRecentFiles() {
    try {
      await set("recentFiles", this.recentFiles);
    } catch (e) {
      console.error("Failed to save recent files", e);
    }
  }

  async addRecentFile(handle) {
    await this.removeRecentFile(handle);
    this.recentFiles.unshift(handle);
    while (this.recentFiles.length > 10) {
      this.recentFiles.pop();
    }
    this.saveRecentFiles();
  }

  async removeRecentFile(handle) {
    this.recentFiles = await asyncFilter(
      this.recentFiles,
      async (recent) => !(await recent.isSameEntry(handle))
    );
    this.saveRecentFiles();
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
        if (event.shiftKey) {
          this.onSaveAs();
        } else {
          this.onSave();
        }
        event.preventDefault();
        break;
      case "Comma":
        this.onSettings();
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
    let reader = new EOReader(buffer);
    let emf = EMF.read(reader);
    this.mapState = this.mapState.withEMF(emf);
  }

  isConnectedMode() {
    return (
      !!FORCE_CONNECTED_MODE_URL || this.settingsState.connectedModeEnabled
    );
  }

  async canLoadGFX() {
    if (this.isConnectedMode()) {
      return true;
    } else {
      return (
        this.settingsState.gfxDirectory &&
        !(await this.needGFXDirectoryPermission()) &&
        !(await this.needAssetsDirectoryPermission())
      );
    }
  }

  async loadGFX() {
    this.destroyGFXLoader();

    let loadingStrategy;

    if (this.isConnectedMode()) {
      loadingStrategy = new RemoteLoadingStrategy(
        FORCE_CONNECTED_MODE_URL || this.settingsState.connectedModeURL
      );
    } else {
      loadingStrategy = new LocalLoadingStrategy(
        this.settingsState.gfxDirectory,
        this.settingsState.customAssetsDirectory
      );
    }

    this.pendingGFXLoader = new GFXLoader(loadingStrategy);

    await Promise.allSettled(
      [3, 4, 5, 6, 7, 22].map(async (fileID) => {
        try {
          await this.pendingGFXLoader.loadEGF(fileID);
        } catch (e) {
          ++this.gfxErrors;
          console.error("Failed to load EGF %d: %s", fileID, e);
        }
      })
    );

    this.gfxLoader = this.pendingGFXLoader;
    this.pendingGFXLoader = null;
  }

  async firstUpdated(changes) {
    super.firstUpdated(changes);

    const children = this.shadowRoot.querySelectorAll("*");
    await Promise.all(Array.from(children).map((c) => c.updateComplete));

    this.calculateMaxPaletteWidth();
  }

  updated(changes) {
    if (changes.has("settingsState") && this.settingsState) {
      this.manageSettings(changes.get("settingsState"));
    }
    this.updateStartupStatus();
  }

  async manageSettings(previous) {
    if (!fileSystemAccessSupported()) {
      return;
    }

    if (!(await this.settingsChangeRequiresGFXReload(previous))) {
      return;
    }

    this.destroyGFXLoader();

    if (await this.canLoadGFX()) {
      this.loadGFX();
    }
  }

  async settingsChangeRequiresGFXReload(previous) {
    if (!previous) {
      return true;
    }

    if (!!FORCE_CONNECTED_MODE_URL) {
      return false;
    }

    if (
      previous.connectedModeEnabled !== this.settingsState.connectedModeEnabled
    ) {
      return true;
    }

    if (this.isConnectedMode()) {
      return previous.connectedModeURL !== this.settingsState.connectedModeURL;
    }

    switch (this.startupStatus) {
      case Startup.Status.NEED_GFX_DIRECTORY_PERMISSION:
      case Startup.Status.NEED_ASSETS_DIRECTORY_PERMISSION:
        return this.canLoadGFX();
      default:
        return (
          (await this.isDifferentHandle(
            previous.gfxDirectory,
            this.settingsState.gfxDirectory
          )) ||
          this.isDifferentHandle(
            previous.customAssetsDirectory,
            this.settingsState.customAssetsDirectory
          )
        );
    }
  }

  async isDifferentHandle(a, b) {
    if (!a && !b) {
      return false;
    }
    if (!!a !== !!b) {
      return true;
    }
    return !(await a.isSameEntry(b));
  }

  calculateMaxPaletteWidth() {
    let width = this.theme.clientWidth - this.sidebar.offsetWidth - 2;
    this.maxPaletteWidth = Math.max(Palette.MIN_WIDTH, width);
  }

  renderEditor() {
    if (this.validGfx() && this.mapState.loaded()) {
      return html`
        <eomap-editor
          .gfxLoader=${this.gfxLoader}
          .mapState=${this.mapState}
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
        .status=${this.startupStatus}
        .mapState=${this.mapState}
        .gfxErrors=${this.gfxErrors}
        @settings=${this.onSettings}
        @request-gfx-directory-permission=${this
          .onRequestGFXDirectoryPermission}
        @request-assets-directory-permission=${this
          .onRequestAssetsDirectoryPermission}
        @retry-gfx=${this.loadGFX}
      ></eomap-startup>
    `;
  }

  render() {
    return html`
      <sp-theme color="darkest" scale="medium">
        <eomap-menubar
          .layerVisibility=${this.layerVisibility}
          .canOpenMaps=${this.validGfx()}
          .canSaveMaps=${this.mapState.loaded()}
          .canAccessMapProperties=${this.validGfx() && this.mapState.loaded()}
          .canReloadGraphics=${this.canReloadGraphics()}
          .canAccessSettings=${this.settingsState != null}
          .canUndo=${this.canUndo()}
          .canRedo=${this.canRedo()}
          .keyboardEnabled=${this.keyboardEnabled()}
          .recentFiles=${this.recentFiles}
          @new=${this.onNew}
          @open=${this.onOpen}
          @open-recent=${this.onOpenRecent}
          @save=${this.onSave}
          @save-as=${this.onSaveAs}
          @map-properties=${this.onMapProperties}
          @settings=${this.onSettings}
          @reload-gfx=${() => {
            setTimeout(() => this.loadGFX(), 0);
          }}
          @undo=${this.undo}
          @redo=${this.redo}
          @visibility-flag-toggle=${this.onVisibilityFlagToggle}
        ></eomap-menubar>
        <eomap-sidebar
          .selectedTool=${this.selectedTool}
          .canUndo=${this.canUndo()}
          .canRedo=${this.canRedo()}
          @tool-selected=${this.onToolSelected}
          @undo=${this.undo}
          @redo=${this.redo}
        ></eomap-sidebar>
        ${this.renderEditor()}
        <sp-dropzone
          @sp-dropzone-should-accept=${this.onDropzoneShouldAccept}
          @sp-dropzone-drop=${this.onDropzoneDrop}
        ></sp-dropzone>
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
        <eomap-settings
          @close=${this.onModalClose}
          @save=${this.onSettingsSave}
        ></eomap-settings>
      </sp-theme>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.onWindowKeyDown);
    window.addEventListener("resize", this.onResize);
    this.addEventListener("dragover", this.onDragOver);
    this.addEventListener("dragleave", this.onDragLeave);
    this.addEventListener("drop", this.onDrop);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.onWindowKeyDown);
    window.removeEventListener("resize", this.onResize);
    this.removeEventListener("dragover", this.onDragOver);
    this.removeEventListener("dragleave", this.onDragLeave);
    this.removeEventListener("drop", this.onDrop);
    super.disconnectedCallback();
  }

  onDragOver(event) {
    event.preventDefault();
    this.isDragged = true;
  }

  onDragLeave(_event) {
    this.isDragged = false;
  }

  onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
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
    if (!this.validGfx()) {
      return;
    }
    this.newMap.open = true;
    this.requestUpdate();
  }

  async onOpen() {
    if (!this.validGfx()) {
      return;
    }

    let fileHandle;
    try {
      [fileHandle] = await showOpenFilePicker(this.emfPickerOptions());
    } catch {
      return;
    }

    await this.openFile(fileHandle);
  }

  async onOpenRecent(event) {
    let handle = event.detail;
    if ((await handle.queryPermission()) !== "granted") {
      if ((await handle.requestPermission()) !== "granted") {
        return;
      }
    }
    await this.openFile(event.detail);
    if (this.mapState.error) {
      this.removeRecentFile(event.detail);
    }
  }

  async openFile(fileHandle) {
    this.mapState = MapState.fromFileHandle(fileHandle);
    this.startupStatus = Startup.Status.LOADING_EMF;
    try {
      let file = await fileHandle.getFile();
      let buffer = await file.arrayBuffer();
      this.readMap(buffer);
      this.addRecentFile(fileHandle);
    } catch (e) {
      let error = e;
      if (e instanceof DOMException && e.name === "NotFoundError") {
        error = new Error(`"${fileHandle.name}" could not be found.`);
      }
      this.mapState = this.mapState.withError(error);
      console.error("Failed to load EMF", e);
    }
  }

  async onSave() {
    if (!this.mapState.loaded()) {
      return;
    }

    if (this.mapState.fileHandle === null) {
      await this.onSaveAs();
    } else {
      let builder = new EOBuilder();
      this.mapState.emf.write(builder);
      let data = builder.build();
      try {
        const writable = await this.mapState.fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
      } catch (e) {
        console.error("Failed to save EMF", e);
      }
    }
  }

  async onSaveAs() {
    if (!this.mapState.loaded()) {
      return;
    }

    try {
      this.mapState.fileHandle = await showSaveFilePicker(
        this.emfPickerOptions()
      );
    } catch (e) {
      return;
    }
    this.onSave();
  }

  onMapProperties() {
    this.properties.populate(this.mapState.emf);
    this.properties.open = true;
    this.requestUpdate();
  }

  onSettings() {
    if (!this.settingsState) {
      return;
    }
    this.settings.populate(this.settingsState);
    this.settings.open = true;
    this.requestUpdate();
  }

  onVisibilityFlagToggle(event) {
    let flag = event.detail;
    this.layerVisibility = this.layerVisibility.withFlagToggled(flag);
  }

  onToolSelected(event) {
    this.selectedTool = event.detail;
  }

  isValidDataTransfer(dataTransfer) {
    return (
      dataTransfer &&
      dataTransfer.items.length === 1 &&
      dataTransfer.items[0].kind === "file"
    );
  }

  onDropzoneShouldAccept(event) {
    let dataTransfer = event.detail.dataTransfer;
    if (!this.validGfx() || !this.isValidDataTransfer(dataTransfer)) {
      event.preventDefault();
    }
  }

  async onDropzoneDrop(event) {
    this.isDragged = false;
    let dataTransfer = event.detail.dataTransfer;
    if (this.isValidDataTransfer(dataTransfer)) {
      let fileHandle = await dataTransfer.items[0].getAsFileSystemHandle();
      if (fileHandle.kind === "file") {
        await this.openFile(fileHandle);
      }
    }
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
    let emf = EMF.new(
      event.detail.width,
      event.detail.height,
      event.detail.name
    );
    this.mapState = MapState.fromEMF(emf);
  }

  onPropertiesSave(event) {
    this.mapPropertiesState = event.detail;
  }

  async onSettingsSave(event) {
    try {
      await set("settings", event.detail);
      this.settingsState = event.detail;
    } catch (e) {
      console.error("Failed to save settings", e);
    }
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
      this.modalNotOpen(this.properties) &&
      this.modalNotOpen(this.settings)
    );
  }

  canReloadGraphics() {
    switch (this.startupStatus) {
      case Startup.Status.ERROR_GFX:
      case Startup.Status.ERROR_EMF:
      case Startup.Status.LOADING_EMF:
      case Startup.Status.READY:
        return true;
      default:
        return false;
    }
  }

  canUndo() {
    return (
      this.validGfx() &&
      this.commandInvoker &&
      this.commandInvoker.hasUndoCommands
    );
  }

  canRedo() {
    return (
      this.validGfx() &&
      this.commandInvoker &&
      this.commandInvoker.hasRedoCommands
    );
  }

  async updateStartupStatus() {
    this.startupStatus = await this.getStartupStatus();
  }

  async getStartupStatus() {
    if (!fileSystemAccessSupported()) {
      return Startup.Status.UNSUPPORTED;
    }

    if (!this.settingsState) {
      return Startup.Status.LOADING_SETTINGS;
    }

    if (!this.isConnectedMode()) {
      if (!this.settingsState.gfxDirectory) {
        return Startup.Status.NEED_GFX_DIRECTORY;
      }

      if (await this.needGFXDirectoryPermission()) {
        return Startup.Status.NEED_GFX_DIRECTORY_PERMISSION;
      }

      if (
        this.settingsState.customAssetsDirectory &&
        (await this.needAssetsDirectoryPermission())
      ) {
        return Startup.Status.NEED_ASSETS_DIRECTORY_PERMISSION;
      }
    }

    if (this.gfxErrors > 0) {
      return Startup.Status.ERROR_GFX;
    }

    if (!this.gfxLoader) {
      return Startup.Status.LOADING_GFX;
    }

    if (this.mapState.error) {
      return Startup.Status.ERROR_EMF;
    }

    if (this.mapState.loading()) {
      return Startup.Status.LOADING_EMF;
    }

    return Startup.Status.READY;
  }

  async onRequestGFXDirectoryPermission() {
    await this.settingsState.gfxDirectory.requestPermission();
    this.requestUpdate();
    if (await this.canLoadGFX()) {
      this.loadGFX();
    }
  }

  async onRequestAssetsDirectoryPermission() {
    await this.settingsState.customAssetsDirectory.requestPermission();
    this.requestUpdate();
    if (await this.canLoadGFX()) {
      this.loadGFX();
    }
  }

  async needGFXDirectoryPermission() {
    return (
      this.settingsState &&
      this.settingsState.gfxDirectory &&
      (await this.settingsState.gfxDirectory.queryPermission()) !== "granted"
    );
  }

  async needAssetsDirectoryPermission() {
    return (
      this.settingsState &&
      this.settingsState.customAssetsDirectory &&
      (await this.settingsState.customAssetsDirectory.queryPermission()) !==
        "granted"
    );
  }

  validGfx() {
    return this.gfxLoader && this.gfxErrors === 0;
  }

  destroyGFXLoader() {
    if (this.pendingGFXLoader) {
      this.pendingGFXLoader.destroy();
    }
    if (this.gfxLoader) {
      this.gfxLoader.destroy();
    }
    this.pendingGFXLoader = null;
    this.gfxLoader = null;
    this.gfxErrors = 0;
  }

  get commandInvoker() {
    return this.mapState.commandInvoker;
  }
}
