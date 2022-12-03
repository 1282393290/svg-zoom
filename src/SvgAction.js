let debug = false;

/**
 * 给svg添加放大缩小的功能
 */
SvgAction.defaultOption = {
  threshold: 15, // 鼠标超过多少才移动

  deltaThreshold: 0.1, // 每次放大比例
  range: { min: 0.4, max: 100 }, // 可缩放倍数
  scale: 0.25, // 每次缩放比例
  stepSize: 75, // ctrl | shift + 鼠标滚轮每次移动的像素
  keyStepSize: 10, // 键盘或调用移动方法时默认步长
  mouseScale: true, // 滚轮缩放
  mouseMove: true, // 平移
  mouseDrag: true, // 拖动
  mouseRotate: true, // 旋转
  mouseFlip: true, // 翻转
};

let DEG_ELEMENT;


/**
 * @param {Object} options
options: {
  threshold {Number}: 指定鼠标拖动时起始阈值，默认：15
  deltaThreshold {Number} 最小放大比例，默认：0.1
  range {Object} {
    min: 最小缩放倍数，默认：0.25
    max: 最大缩放倍数，默认：100
  }
  scale {Number}: 每次缩放比例，默认：0.25
  stepSize {Number}:  ctrl | shift + 鼠标滚轮每次移动的像素 默认75
  keyStepSize {Number}: 键盘或调用移动方法时默认步长，默认10
  mouseControl {Element}: 设置鼠标控制节点，默认svg节点父级document
  mouseScale {Boolean} 是否开启鼠标缩放，默认true
  mouseMove {Boolean} 是否开启鼠标移动，按住Shift或Ctrl键 + 滚轮即可平移，默认true
  mouseDrag {Boolean} 是否开启鼠标拖拽，默认true
  mouseRotate {Boolean} 是否开启鼠标旋转，按住ctrl即可旋转，默认true
  mouseFlip {Boolean} 是否开启鼠标翻转，按住Shift即可旋转，默认true

  keyControl {Element} 设置键盘控制的节点，默认svg父级或document
}
 */
function SvgAction(svg, options) {
  let self = this;
  if (!svg) {
    throw new Error('初始化失败，找不到SVG！');
  }
  self._svg = svg;
  self.options = {
    ...SvgAction.defaultOption,
    ...options,
  };

  self.options.mouseControl = self.getControlElement();
  self.options.keyControl = self.getKeyElement();


  self._totalDelta = 0;
  self._previouScale = 1; // 当前缩放大小
  self._deg = 0; // 当前旋转角度

  self._init();
}

SvgAction.prototype._init = function () {
  this._initSvg();
  // 添加css
  generateCss();
  this.buildEvent();
}

SvgAction.prototype.buildEvent = function () {
  if (this.eventState) {
    return;
  }
  this.eventState = true;

  // 绑定鼠标事件
  buildMoveEvent.call(this);
  buildMousewheelEvent.call(this);

  // 绑定键盘事件
  // buildKeyEvent.call(this);
}

function stopBubble(event) {
  let e = event || window.event;
  if (e.preventDefault) {
    e.preventDefault();
  }
  // 一般用在鼠标或键盘事件上
  if (e.stopPropagation) {
    // W3C取消冒泡事件
    e.stopPropagation();
  } else {
    // IE取消冒泡事件
    window.event.cancelBubble = true;
  }
};


function touchDebug(self, fast, last, cente) {
  if (!debug) {
    return;
  }
  let ns = 'http://www.w3.org/2000/svg'

  let group = self._viewport.querySelector("#touchDebug"),
    fastText, lastText, centeText;
  if (group) {
    fastText = group.querySelector('#fastText');
    lastText = group.querySelector('#lastText');
    centeText = group.querySelector('#centeText');
  } else {
    group = document.createElementNS(ns, 'g');
    fastText = document.createElementNS(ns, 'text');
    lastText = document.createElementNS(ns, 'text');
    centeText = document.createElementNS(ns, 'text');
    group.id = 'touchDebug';
    fastText.id = 'fastText';
    lastText.id = 'lastText';
    centeText.id = 'centeText';
    fastText.innerHTML = '点1';
    lastText.innerHTML = '点2';
    centeText.innerHTML = '中';

    group.appendChild(fastText);
    group.appendChild(lastText);
    group.appendChild(centeText);

    self._viewport.appendChild(group);
  }
  // if (!cente){
  //   cente = getPointCentre(fast.x, fast.y, last.x, last.y);
  // }
  let f = transformPoint(self._svg, fast.x, fast.y);
  let l = transformPoint(self._svg, last.x, last.y);
  // let c = transformPoint(self._svg, cente.x, cente.y);


  fastText.setAttribute('transform', `translate(${f.x}, ${f.y})`)
  lastText.setAttribute('transform', `translate(${l.x}, ${l.y})`)
  centeText.setAttribute('transform', `translate(${cente.x}, ${cente.y})`)
}

function transformPoint(svg, screenX, screenY) {
  var p = svg.createSVGPoint()
  p.x = screenX
  p.y = screenY
  return p.matrixTransform(svg.getScreenCTM().inverse())
}

/**
 * 添加图形移动事件
 */
function buildMoveEvent() {
  let self = this;
  let ops = self.options;
  let context = {};
  // 添加事件
  // 鼠标按下
  let el = ops.mouseControl;

  el.addEventListener('mousedown', handleMousedown, false);
  el.addEventListener('touchstart', handleTouchstart, { passive: false });

  function handleMousedown(event) { // 开启拖拽
    // stopBubble(event);
    context.start = toPoint(event); // 起始坐标

    self._svg.className.baseVal = 'move-cursor-grabbing';
    document.addEventListener('mousemove', handleMouseMove, false);
    document.addEventListener('mouseup', handleEnd, false);
  }


  function handleTouchstart(event) {
    stopBubble(event);
    context.start = toPoint(event); // 起始坐标
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleEnd, { passive: false });
    if (event.touches.length >= 2) {
      let fast = toPoint(event.touches[0]);
      let last = toPoint(event.touches[1]);
      let cente = getPointCentre(fast.x, fast.y, last.x, last.y);
      cente = transformPoint(self._svg, cente.x, cente.y),
        context.doubleStart = {
          fast,
          last,
          cente,
          length: getDistance(fast.x, fast.y, last.x, last.y),
        };
      touchDebug(self, fast, last, cente);
    }
  }


  function handleMouseMove(event) {
    stopBubble(event);

    if (event.type == 'touchmove' && event.touches.length >= 2) {
      // 缩放
      let fast = toPoint(event.touches[0]);
      let last = toPoint(event.touches[1]);
      let doubleStart = context.doubleStart;
      touchDebug(self, fast, last, doubleStart.cente);

      // 计算距离
      let length = getDistance(fast.x, fast.y, last.x, last.y)
      if (length > doubleStart.length) { // 放大
        self._zoom(1, doubleStart.cente, 0.025);
      } else { // 缩小
        self._zoom(-1, doubleStart.cente, 0.025);
      }
      doubleStart.length = length;
      return;
    }

    context.position = toPoint(event); // 当前鼠标坐标
    context.delta = deltaPos(context.position, context.start); // 当前坐标到起始坐标的偏移


    // 鼠标移动超过15px才移动图形，防止晃动
    let fast = false;
    if (!context.dragging && _length(context.delta) > ops.threshold) {
      context.dragging = true;
      fast = true;
    }
    if (!context.dragging) {
      return;
    }

    if (ops.mouseRotate && event.ctrlKey) {
      handleRotate(event, fast);
    } else if (ops.mouseFlip && event.shiftKey) {
      handleFlip(event, fast);
    } else if (ops.mouseDrag) {
      handleMove(event, fast);
    }

    context.last = context.position; // 记录下最后一次移动的位置
  }

  // 处理拖拽
  function handleMove(event) {
    let lastPosition = context.last || context.start;
    let delta = deltaPos(context.position, lastPosition);
    self.move({
      dx: delta.x,
      dy: delta.y
    });
  }

  /**
   * 处理旋转
   * 按住Ctrl 加鼠标
   */
  function handleRotate(event, fast) {
    let degEl = degElement();

    // 鼠标移动超过15px才移动图形，防止晃动
    if (fast) {
      document.body.appendChild(degEl);
      degEl.show = true;
    }

    let lastPosition = context.last || context.start;
    let delta = deltaPos(context.position, lastPosition);
    let step = delta.x || delta.y;
    let deg = step < 0 ? -1 : 1;
    self.rotate(deg); // 没出触发旋转1度


    degEl.style.top = event.clientY + 'px';
    degEl.style.left = event.clientX + 20 + 'px';
    degEl.innerText = self._deg + '°';

  }
  /**
   * 处理翻转
   * 按住Shift 加鼠标
   */
  function handleFlip(event, fast) {
    if (!fast) {
      return;
    }
    if (context.delta.x >= ops.threshold) { // X 轴
      self.flipX();
    } else if (context.delta.x < ops.threshold) { //Y轴
      self.flipY();
    }
  }

  function handleEnd(event) {
    self._svg.className.baseVal = 'move-cursor-grab';
    context = {}; // 每一次移动结束，都清除上一次的结果
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleEnd);

    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleEnd);

    degElement().remove();
  }

  self._eventFn = {
    handleMousedown,
    handleTouchstart,
    handleMouseMove,
    handleEnd
  }
}
//计算两点间距离
function getDistance(startX, startY, endX, endY) {
  return Math.hypot(endX - startX, endY - startY);
};

function getPointCentre(startX, startY, endX, endY) {
  let x = (startX - endX) / 2
  let y = (startY - endY) / 2
  return {
    x: startX + (0 - x),
    y: startY + (0 - y)
  };
};

function degElement() {
  if (DEG_ELEMENT) {
    return DEG_ELEMENT;
  }

  DEG_ELEMENT = document.createElement('span');
  DEG_ELEMENT.style.position = 'fixed';
  DEG_ELEMENT.style.userSelect = 'none';
  return DEG_ELEMENT;
}

/**
 * 图形缩放事件
 * 滚轮事件
 */
function buildMousewheelEvent() {
  let self = this;
  let el = self.options.mouseControl;
  el.addEventListener('mousewheel', handleMousewheel, false);
  function handleMousewheel(event) {
    stopBubble(event);

    if (self.options.mouseMove && (event.ctrlKey || event.shiftKey)) {
      handleWheelMove(event);
    } else if (self.options.mouseScale) {
      handleMouseScale(event);
    }
  }
  self._eventFn.handleMousewheel = handleMousewheel;

  // 平移
  function handleWheelMove(event) {
    let factor = self.options.stepSize / 100;
    let delta;
    if (event.shiftKey) {
      delta = { // 水平
        dx: factor * event.deltaY,
        dy: 0
      };
    } else { // 垂直
      delta = {
        dx: factor * event.deltaX,
        dy: factor * event.deltaY
      };
    }

    self.move(delta);
  }
  /**
   * 缩放
   */
  function handleMouseScale(event) {
    var elementRect = el.getBoundingClientRect();
    var offset = {
      x: event.clientX - elementRect.left,
      y: event.clientY - elementRect.top
    };

    self.zoom(event.wheelDelta < 0 ? 'out' : 'in', offset);
  }
}

/**
 * 处理键盘事件
 */
function buildKeyEvent() {
  let self = this;
  // self.options.keyControl.addEventListener('keydown', handleKeydown);
  // function handleKeydown(event) {
  //   let key = getKey(event);
  //   if (!key) {
  //     return;
  //   }
  //   if (event.ctrlKey) {
  //     handleRotateAndZoom(key);
  //   } else if (event.shiftKey) {
  //     handleFlip(key);
  //   } else if (key == 'center') {
  //     self.reset();
  //   } else {
  //     handleMove(key);
  //   }
  // }
  // self._eventFn.handleKeydown = handleKeydown;

  function handleMove(key) {
    self[key]();
    // switch(key){
    //   case 'up':
    //   self.up();
    //   break;
    //   case 'down':
    //   self.down();
    //   break;
    //   case 'left':
    //   self.left();
    //   break;
    //   case 'right':
    //   self.right();
    //   break;
    // }
  }

  function handleRotateAndZoom(key) {
    switch (key) {
      case 'up':
        self.zoomIn();
        break;
      case 'left':
        self.rotate();
        break;
      case 'down':
        self.zoomOut();
        break;
      case 'right':
        self.rotate(-45);
        break;
    }
  }

  function handleFlip(key) {
    switch (key) {
      case 'up':
      case 'down':
        self.flipY();
        break;
      case 'left':
      case 'right':
        self.flipX();
        break;
    }
  }

}
function getKey(event) {
  switch (event.key) {
    case 'w':
    case 'ArrowUp':
      return 'up';

    case 's':
    case 'ArrowDown':
      return 'down';

    case 'a':
    case 'ArrowLeft':
      return 'left';

    case 'd':
    case 'ArrowRight':
      return 'right';

    case '0':
    case '`':
      return 'center';

    default: return null;
  }
}


/**
 * 初始化svg，第一个节点必须是g
 * 如果不是就添加
 */
SvgAction.prototype._initSvg = function () {
  let svg = this._svg;
  svg.className.baseVal = 'move-cursor-grab';
  // 第一个子节点必须是g
  if (svg.tagName === 'g') {
    this._viewport = svg;
    this._svg = findSvg(this._viewport) || this._viewport;
    function findSvg(node) {
      if (node.parentElement.tagName == 'svg') {
        return node.parentElement;
      }
      return findSvg(node.parentElement);
    }
  } if (svg.childNodes.length === 1 && svg.firstElementChild.tagName === 'g') { // 判断第一个节点是否是g
    this._viewport = svg.firstElementChild;
  } else {
    let g = document.createElementNS(svg.namespaceURI, 'g');
    let childNodes = svg.childNodes;
    for (; childNodes.length !== 0;) {
      g.appendChild(childNodes[0]);
    }
    svg.appendChild(g);
    this._viewport = g;
  }
}



/**
 * 放大
 * @param {Number} i 
 */
SvgAction.prototype.zoomIn = function (i) {
  i = i || this.options.scale;
  this._zoom(1, getCentre.call(this), i);
}
/**
 * 缩小
 * @param {Number} i 
 */
SvgAction.prototype.zoomOut = function (i) {
  i = i || this.options.scale;
  this._zoom(-1, getCentre.call(this), i);
}

SvgAction.prototype.reset = function reset() {
  // this.zoom('fit-viewport');
  this.zoom('center');
};

/**
 * 缩放
 * @param {Number | String} delta in: 放大，out：缩小，center 居中，如果为数字，表示缩放倍数
 * @param {Object} position {x,y}以哪个位置为中心, 默认中心
 */
SvgAction.prototype.zoom = function (delta, position) {
  let self = this;
  if (!delta) {
    return round(self._viewport.getCTM().a, 1000);
  }

  var scale = self.options.scale;
  if (delta === 'center') {
    return self._fitViewport(delta);
  } else if (delta === 'in') {
    delta = 1;
  } else if (delta === 'out') {
    delta = -1;
  } else if (typeof (delta) == 'number') {
    scale = Math.abs(delta);
  } else {
    return round(self._viewport.getCTM().a, 1000);
  }
  self._totalDelta += delta;

  if (Math.abs(self._totalDelta) > self.options.deltaThreshold) {
    let i = self._zoom(delta, position, scale);

    // reset
    self._totalDelta = 0;
    return i;
  }
};


/**
 * 缩放
 * @param {Number} delta 正数或负数，正数表示放大，负数缩小
 * @param {Object} position 偏移
 * @param {Number} stepSize 缩放比例
 * @returns 
 */
SvgAction.prototype._zoom = function (delta, position, stepSize) {
  let self = this;
  var direction = delta > 0 ? 1 : -1;

  var currentLinearZoomLevel = log10(self._previouScale);

  var newLinearZoomLevel = Math.round(currentLinearZoomLevel / stepSize) * stepSize;

  newLinearZoomLevel += stepSize * direction;

  var newLogZoomLevel = Math.pow(10, newLinearZoomLevel);

  setZoom.call(self, cap(self.options.range, newLogZoomLevel), position);

  this._previouScale = round(self._viewport.getCTM().a, 1000);
  return this._previouScale;
};


function setZoom(scale, center) {
  var svg = this._svg,
    viewport = this._viewport;

  var matrix = svg.createSVGMatrix();
  var point = svg.createSVGPoint();

  var centerPoint,
    originalPoint,
    currentMatrix,
    scaleMatrix,
    newMatrix;

  currentMatrix = viewport.getCTM();

  var currentScale = currentMatrix.a;

  if (center) {
    point.x = center.x;
    point.y = center.y;
    centerPoint = point;

    // revert applied viewport transformations
    originalPoint = centerPoint.matrixTransform(currentMatrix.inverse());

    // create scale matrix
    scaleMatrix = matrix
      .translate(originalPoint.x, originalPoint.y)
      .scale(1 / currentScale * scale)
      .translate(-originalPoint.x, -originalPoint.y);

    newMatrix = currentMatrix.multiply(scaleMatrix);
  } else {
    newMatrix = matrix.scale(scale);
  }
  setCTM(this._viewport, { matrix: newMatrix });

  return newMatrix;
};

SvgAction.prototype._fitViewport = function (center) {
  let self = this;
  let outer = {
    height: self._svg.clientHeight,
    width: self._svg.clientWidth
  };
  // let inner = {
  //   height: self._viewport.clientHeight,
  //   width: self._viewport.clientWidth,
  //     x: 0,
  //     y: 0
  //   };
  let inner = self._viewport.getBBox();
  let newScale, newViewbox;

  // display the complete diagram without zooming in.
  // instead of relying on internal zoom, we perform a
  // hard reset on the canvas viewbox to realize this
  //
  // if diagram does not need to be zoomed in, we focus it around
  // the diagram origin instead

  if (inner.x >= 0 &&
    inner.y >= 0 &&
    inner.x + inner.width <= outer.width &&
    inner.y + inner.height <= outer.height &&
    !center) {
    newViewbox = {
      x: 0,
      y: 0,
      width: Math.max(inner.width + inner.x, outer.width),
      height: Math.max(inner.height + inner.y, outer.height)
    };
  } else {
    newScale = Math.min(1, outer.width / inner.width, outer.height / inner.height);
    let offsetX = - inner.x * newScale;
    let offsetY = - inner.y * newScale;
    let x = outer.width / 2 - inner.width * newScale / 2;
    let y = outer.height / 2 - inner.height * newScale / 2;
    newViewbox = {
      x: x >= 0 ? x + offsetX : offsetX,
      y: y >= 0 ? y + offsetY : offsetY
    };
  }
  let newMatrix = self._svg.createSVGMatrix()
    .translate(newViewbox.x, newViewbox.y)
    .scale(newScale);
  setCTM(self._viewport, { matrix: newMatrix });

  // 设置角度还原
  self._deg = 0;

  return self._previouScale = round(self._viewport.getCTM().a, 1000);
};


/**
 * 平移
 * @param {Object} delta {dx: 0, dy: 0}
 */
SvgAction.prototype.move = function (delta) {
  let viewport = this._viewport;
  var matrix = viewport.getCTM();
  if (delta) {
    delta.dx = delta.dx || delta.x || 0;
    delta.dy = delta.dy || delta.y || 0;
    delta = Object.assign({ dx: 0, dy: 0 }, delta);
    // 使用浏览器的api计算偏移距离
    matrix = this._svg.createSVGMatrix().translate(delta.dx, delta.dy).multiply(matrix);
    setCTM(viewport, { matrix });
  }
  return { x: matrix.e, y: matrix.f };
}

/**
 * 上移
 * @param {Number} i 移动的像素点
 */
SvgAction.prototype.up = function (i) {
  i = i || this.options.keyStepSize;
  return this.move({ dy: -i });
}
/**
 * 下移
 * @param {Number} i 移动的像素点
 */
SvgAction.prototype.down = function (i) {
  i = i || this.options.keyStepSize;
  return this.move({ dy: i });
}
/**
 * 左移
 * @param {Number} i 移动的像素点
 */
SvgAction.prototype.left = function (i) {
  i = i || this.options.keyStepSize;
  return this.move({ dx: -i });
}
/**
 * 右移
 * @param {Number} i 移动的像素点
 */
SvgAction.prototype.right = function (i) {
  i = i || this.options.keyStepSize;
  return this.move({ dx: i });
}

/**
 * 旋转
 */
SvgAction.prototype.rotate = function (angle = 45) {
  let bbox = this._viewport.getBBox();
  setCTM(this._viewport, {
    rotate: {
      angle: angle,
      x: bbox.width / 2 + bbox.x,
      y: bbox.height / 2 + bbox.y
    }
  });

  this._deg += angle;
}


/**
 * 翻转
 */
SvgAction.prototype.flipX = function () {
  let ctm = this._viewport.getCTM();
  setCTM(this._viewport, { matrix: ctm.flipX() });
}
SvgAction.prototype.flipY = function () {
  let ctm = this._viewport.getCTM();
  setCTM(this._viewport, { matrix: ctm.flipY() });
}



SvgAction.prototype.getControlElement = function () {
  return this.options.mouseControl || this._svg.parentElement || document;
}
SvgAction.prototype.getKeyElement = function () {
  return this.options.keyControl || document;
}

SvgAction.prototype.toImage = function () {
  let self = this;
  let image = new Image();
  let rect = self._svg.getBoundingClientRect();
  image.width = rect.width;
  image.height = rect.height;
  image.src = 'data:image/svg+xml;utf8,' + unescape(self._svg.outerHTML);

  return new Promise((resolve) => {
    image.onload = function () {

      let canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;

      let context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, rect.width, rect.height);

      resolve(canvas.toDataURL('image/png'));
    }
  });





}

SvgAction.prototype.save = function () {
  this.toImage().then(url => {
    var a = document.createElement('a');
    a.href = url;
    a.download = "svg.png";  //设定下载名称
    a.click(); //点击触发下载
  })
}

/**
 * 关闭事件
 */
SvgAction.prototype.disableEvent = function () {
  // 清空事件
  let self = this;
  let ops = self.options;
  let eventFn = self._eventFn;
  let el = ops.mouseControl;
  self.eventState = false;

  el.removeEventListener('mousedown', eventFn.handleMousedown);
  el.removeEventListener('touchstart', eventFn.handleTouchstart);

  document.removeEventListener('mousemove', eventFn.handleMouseMove);
  document.removeEventListener('mouseup', eventFn.handleEnd);

  document.removeEventListener('touchmove', eventFn.handleMouseMove);
  document.removeEventListener('touchend', eventFn.handleEnd);

  el.removeEventListener('mousewheel', eventFn.handleMousewheel);
  // ops.keyControl.removeEventListener('keydown', eventFn.handleKeydown);
}


/**
 * 获取图形原中心坐标
 * @param {Element} node 
 */
function getCentre() {
  let rect = this._viewport.getBoundingClientRect();
  let ctm = this._viewport.getCTM();
  return {
    x: ctm.f + rect.width / 2,
    y: ctm.e + rect.height / 2,
  }
}


/**
 * 设置matrix
 * @param {Object} node 节点
 * @param {Object} m 平移或放大
 */
function setCTM(node, { matrix, rotate }) {
  matrix = matrix || node.getCTM();
  // var mstr = 'matrix(' + m.a + ',' + m.b + ',' + m.c + ',' + m.d + ',' + m.e + ',' + m.f + ')';
  var mstr = `matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.e}, ${matrix.f})`;
  if (rotate) {
    mstr += `, rotate(${rotate.angle}, ${rotate.x}, ${rotate.y})`;
  }
  node.setAttribute('transform', mstr);
}

function cap(range, scale) {
  return Math.max(range.min, Math.min(range.max, scale));
}
function round(number, resolution) {
  return Math.round(number * resolution) / resolution;
}
function log10(x) {
  return Math.log(x) / Math.log(10);
}
var sign = Math.sign || function (n) {
  return n >= 0 ? 1 : -1;
};
/**
 * 计算移动的长度
 * @param {Object} point
 */
function length(point) {
  return Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
}
/**
 * 计算移动了多少
 * @param {Object} a
 * @param {Object} b
 */
function deltaPos(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}
/**
 * 转换为坐标
 * @param {Object} event
 */
function toPoint(event) {
  if (event.pointers && event.pointers.length) {
    event = event.pointers[0];
  }

  if (event.touches && event.touches.length) {
    event = event.touches[0];
  }

  return event ? {
    x: event.clientX,
    y: event.clientY
  } : null;
}
function _length(point) {
  return Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
}

function generateCss() {
  let SvgAction = document.getElementById('SvgAction');
  if (SvgAction) {
    return;
  }

  // let css = `
  //   .move-cursor-grab{
  //     cursor: grab;
  //     cursor: -webkit-grab;
  //   }
  //   .move-cursor-grabbing{
  //     cursor: grabbing;
  //     cursor: -webkit-grabbing;
  //   }
  // `;
  let style = document.createElement('style');
  style.id = 'SvgAction';
  // style.innerText = css;
  document.head.appendChild(style);
}

window.SvgAction = SvgAction;

export default SvgAction;
