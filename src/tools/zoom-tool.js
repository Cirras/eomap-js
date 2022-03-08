import { Tool } from "./tool";

export class ZoomTool extends Tool {
  static ZOOM_LEVELS = [
    0.25, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 12.0, 16.0,
  ];
  static MIN_ZOOM = ZoomTool.ZOOM_LEVELS.at(0);
  static MAX_ZOOM = ZoomTool.ZOOM_LEVELS.at(-1);

  constructor() {
    super();
    this.downX = 0;
    this.originX = 0;
    this.originY = 0;
    this.originWorldPoint = null;
    this.startScrollX = 0;
    this.startScrollY = 0;
    this.startZoom = 0;
    this.dragging = false;
    this.zoomAnimationFrame = null;
  }

  handleLeftPointerDown(mapEditor, pointer) {
    if (!this.dragging) {
      this.downX = pointer.x;
      this.originX = pointer.x;
      this.originY = pointer.y;

      let camera = mapEditor.map.camera;
      this.originWorldPoint = camera.getWorldPoint(this.originX, this.originY);
      this.startScrollX = camera.scrollX;
      this.startScrollY = camera.scrollY;
      this.startZoom = camera.zoom;
    }
  }

  handlePointerMove(mapEditor) {
    if (!this.originWorldPoint) {
      return;
    }

    if (!this.isLeftPointerDown()) {
      return;
    }

    let distance = this.pointerDownDistance.currentX - this.downX;
    if (Math.abs(distance) > 3) {
      this.dragging = true;
    }

    if (this.dragging) {
      let rawZoom = this.startZoom + distance / 50;
      let zoomLevel = Math.min(
        Math.max(rawZoom, ZoomTool.MIN_ZOOM),
        ZoomTool.MAX_ZOOM
      );

      if (rawZoom !== zoomLevel) {
        this.downX = this.pointerDownDistance.currentX;
        this.startZoom = zoomLevel;
      }

      this.updateZoom(mapEditor, zoomLevel);

      let camera = mapEditor.map.camera;
      camera.scrollX = this.startScrollX;
      camera.scrollY = this.startScrollY;
      camera.preRender();

      let worldPoint = camera.getWorldPoint(this.originX, this.originY);
      camera.scrollX -= worldPoint.x - this.originWorldPoint.x;
      camera.scrollY -= worldPoint.y - this.originWorldPoint.y;
    }
  }

  handleLeftPointerUp(mapEditor, _pointer) {
    if (!this.originWorldPoint) {
      return;
    }

    if (this.dragging) {
      this.dragging = false;
    } else {
      this.zoomIn(mapEditor);
    }

    this.originWorldPoint = null;
  }

  previousZoomLevel(fromZoom) {
    for (let i = ZoomTool.ZOOM_LEVELS.length - 1; i >= 0; --i) {
      let level = ZoomTool.ZOOM_LEVELS[i];
      if (level < fromZoom) {
        return level;
      }
    }
    return ZoomTool.MIN_ZOOM;
  }

  nextZoomLevel(fromZoom) {
    for (let level of ZoomTool.ZOOM_LEVELS) {
      if (level > fromZoom) {
        return level;
      }
    }
    return ZoomTool.MAX_ZOOM;
  }

  zoomIn(mapEditor) {
    let targetZoomLevel = this.nextZoomLevel(mapEditor.map.camera.zoom);
    this.updateZoom(mapEditor, targetZoomLevel, true);
  }

  zoomOut(mapEditor) {
    let targetZoomLevel = this.previousZoomLevel(mapEditor.map.camera.zoom);
    this.updateZoom(mapEditor, targetZoomLevel, true);
  }

  updateZoom(mapEditor, zoomLevel, animate) {
    if (animate === undefined) {
      animate = false;
    }

    if (animate && this.zoomAnimationFrame) {
      return;
    }

    this.cancelZoomAnimation();

    let camera = mapEditor.map.camera;
    let startScrollX = this.startScrollX;
    let startScrollY = this.startScrollY;
    let originX = this.originX;
    let originY = this.originY;
    let originWorldPoint = this.originWorldPoint;

    const updateScroll = () => {
      camera.scrollX = startScrollX;
      camera.scrollY = startScrollY;
      camera.preRender();

      let worldPoint = camera.getWorldPoint(originX, originY);
      camera.scrollX -= worldPoint.x - originWorldPoint.x;
      camera.scrollY -= worldPoint.y - originWorldPoint.y;
    };

    if (animate) {
      let zoomStep = Math.abs(camera.zoom - zoomLevel) / 16;
      const step = () => {
        if (camera.zoom < zoomLevel) {
          camera.zoom = Math.min(camera.zoom + zoomStep, zoomLevel);
        } else {
          camera.zoom = Math.max(camera.zoom - zoomStep, zoomLevel);
        }
        updateScroll();
        if (camera.zoom !== zoomLevel) {
          this.zoomAnimationFrame = requestAnimationFrame(step);
        } else {
          this.zoomAnimationFrame = null;
        }
      };
      this.zoomAnimationFrame = requestAnimationFrame(step);
    } else {
      camera.zoom = zoomLevel;
      updateScroll();
    }
  }

  cancelZoomAnimation() {
    if (this.zoomAnimationFrame !== null) {
      cancelAnimationFrame(this.zoomAnimationFrame);
      this.zoomAnimationFrame = null;
    }
  }

  shouldMoveCursor() {
    return !this.dragging;
  }
}
