
class Point {
  x: number = 0;
  y: number = 0;

  from_drag_event(event: React.DragEvent) {
    this.x = event.clientX;
    this.y = event.clientY;
  }

  toString() {
    return `Point(x=${this.x}, y=${this.y})`;
  }
}


class Rectangle extends DOMRect {

  from_dom_rect(rect: DOMRect) {
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
  }

  contains(point: Point): boolean {
    let horiz = false, vert = false;

    if (point.x >= this.x && point.x <= (this.x + this.width)) {
      horiz = true;
    }

    if (point.y >= this.y && point.y <= (this.y + this.height)) {
      vert = true;
    }

    return vert && horiz;
  }

  toString() {
    return `
      Rectangle(x=${this.x}, y=${this.y}, width=${this.width}, height=${this.height})
    `;
  }
}


export {Rectangle, Point};
