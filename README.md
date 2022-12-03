# svg动作

## 介绍
提供SVG拖动，缩放，旋转等功能
请使用国内[gitee库](https://gitee.com/mcck-tools/svg-action)

[codepen.io预览](https://codepen.io/mcck-the-vuer/pen/ZEJobXM)

![输入图片说明](https://images.gitee.com/uploads/images/2021/1009/181719_989873c1_730618.png "屏幕截图.png")

## 测试
```
yarn install
yarn run dev
```

## 安装教程
1.  yarn add svg-action

## 使用说明
```
var sa = new SvgAction(document.getElementById('svg'), {
  range: {
    min: 0.001, max: 100
  }
});
```

## 操作方法
### 鼠标操作
* 按下鼠标移动 拖拽图形
* 按下Ctrl 移动鼠标 旋转图形
* 按下Shift 移动鼠标 翻转图形
* 滚动滚轮 缩放
* 按下Ctrl 滚动滚轮 上下平移
* 按下Shift 滚动滚轮 左右平移


### 键盘操作
| 按键  | 默认 | Ctrl | Shift |
|-----|----|----|----|
| W/↑ | 向下移动 | 放大图形 | 垂直翻转 |
| S/↓ | 向下移动 | 缩小图形 | 垂直翻转 |
| A/← | 向左移动 | 向左旋转 | 水平翻转 |
| D/→ | 向右移动 | 向右旋转 | 水平翻转 |

### 构造参数
```
SvgAction(SVGDom, [options])
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
```
### 方法
#### zoom 缩放
缩放图形

zoom(delta, position);
* delta 
  * {String} in: 放大，out：缩小，center 居中
  * {Number} 缩放倍数
* position 缩放时的偏移坐标

* return {Number} 缩放倍数

#### zoomIn
放大图形

zoomIn(i);
* i 放大倍数

#### zoomOut
缩小图形

zoomIn(i);
* i 缩小倍数

#### reset
使用图形居中在视图窗口中, 方法等效与 zoom('center');


#### move
move(delta);
* delta {Object} 
```
delta: {
  x: x轴移动的像素，与dx任选一个，有限dx
  y: y轴移动的像素，与dy任选一个，有限dy
  dx: x轴移动的像素，与x任选一个，有限dx
  dy: y轴移动的像素，与y任选一个，有限dy
}
```
* return {Object} 移动的距离

#### up
向上移动10像素

up(i);
* i {Number} 移动的距离，默认10像素
* return {Object} 移动的距离

#### down
向下移动10像素

down(i);
* i {Number} 移动的距离，默认10像素
* return {Object} 移动的距离

#### left
向左移动10像素

left(i);
* i {Number} 移动的距离，默认10像素
* return {Object} 移动的距离

#### right
向右移动10像素

right(i);
* i {Number} 移动的距离，默认10像素
* return {Object} 移动的距离

#### rotate
旋转图形

rotate(angle);
* angle {Number} 旋转的角度，默认90度

#### flipX
X轴翻转

#### flipY
Y轴翻转

#### toImage
图形转为图片地址

* return {Promise} 异步，参数为url

#### save
保存图片到本地