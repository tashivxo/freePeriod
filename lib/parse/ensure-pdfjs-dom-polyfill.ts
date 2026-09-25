/**
 * pdfjs-dist (via pdf-parse v2) evaluates `new DOMMatrix()` at module load.
 * In a real Node process it polyfills that from `@napi-rs/canvas` via
 * `createRequire(import.meta.url)`. Next.js/Vercel often bundle the pdfjs
 * chunk so that require fails, then the whole `/api/parse-document` module
 * crashes — including DOCX/XLSX — with `ReferenceError: DOMMatrix is not defined`.
 *
 * Installing a JS implementation first makes import-time evaluation safe.
 * Import this module before `pdf-parse` / `pdfjs-dist`.
 */

type MatrixInit = string | ArrayLike<number>;

class NodeDOMMatrix {
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;

  get a() {
    return this.m11;
  }
  set a(value: number) {
    this.m11 = value;
  }
  get b() {
    return this.m12;
  }
  set b(value: number) {
    this.m12 = value;
  }
  get c() {
    return this.m21;
  }
  set c(value: number) {
    this.m21 = value;
  }
  get d() {
    return this.m22;
  }
  set d(value: number) {
    this.m22 = value;
  }
  get e() {
    return this.m41;
  }
  set e(value: number) {
    this.m41 = value;
  }
  get f() {
    return this.m42;
  }
  set f(value: number) {
    this.m42 = value;
  }

  get is2D() {
    return (
      this.m13 === 0 &&
      this.m14 === 0 &&
      this.m23 === 0 &&
      this.m24 === 0 &&
      this.m31 === 0 &&
      this.m32 === 0 &&
      this.m33 === 1 &&
      this.m34 === 0 &&
      this.m43 === 0 &&
      this.m44 === 1
    );
  }

  get isIdentity() {
    return (
      this.m11 === 1 &&
      this.m12 === 0 &&
      this.m13 === 0 &&
      this.m14 === 0 &&
      this.m21 === 0 &&
      this.m22 === 1 &&
      this.m23 === 0 &&
      this.m24 === 0 &&
      this.m31 === 0 &&
      this.m32 === 0 &&
      this.m33 === 1 &&
      this.m34 === 0 &&
      this.m41 === 0 &&
      this.m42 === 0 &&
      this.m43 === 0 &&
      this.m44 === 1
    );
  }

  constructor(init?: MatrixInit) {
    if (!init || typeof init === 'string') return;
    const values = Array.from(init);
    if (values.length === 6) {
      this.m11 = values[0];
      this.m12 = values[1];
      this.m21 = values[2];
      this.m22 = values[3];
      this.m41 = values[4];
      this.m42 = values[5];
      return;
    }
    if (values.length === 16) {
      this.m11 = values[0];
      this.m12 = values[1];
      this.m13 = values[2];
      this.m14 = values[3];
      this.m21 = values[4];
      this.m22 = values[5];
      this.m23 = values[6];
      this.m24 = values[7];
      this.m31 = values[8];
      this.m32 = values[9];
      this.m33 = values[10];
      this.m34 = values[11];
      this.m41 = values[12];
      this.m42 = values[13];
      this.m43 = values[14];
      this.m44 = values[15];
    }
  }

  multiplySelf(other: NodeDOMMatrix | ArrayLike<number>) {
    const right = other instanceof NodeDOMMatrix ? other : new NodeDOMMatrix(other);
    const a = this.m11 * right.m11 + this.m12 * right.m21 + this.m13 * right.m31 + this.m14 * right.m41;
    const b = this.m11 * right.m12 + this.m12 * right.m22 + this.m13 * right.m32 + this.m14 * right.m42;
    const c = this.m11 * right.m13 + this.m12 * right.m23 + this.m13 * right.m33 + this.m14 * right.m43;
    const d = this.m11 * right.m14 + this.m12 * right.m24 + this.m13 * right.m34 + this.m14 * right.m44;
    const e = this.m21 * right.m11 + this.m22 * right.m21 + this.m23 * right.m31 + this.m24 * right.m41;
    const f = this.m21 * right.m12 + this.m22 * right.m22 + this.m23 * right.m32 + this.m24 * right.m42;
    const g = this.m21 * right.m13 + this.m22 * right.m23 + this.m23 * right.m33 + this.m24 * right.m43;
    const h = this.m21 * right.m14 + this.m22 * right.m24 + this.m23 * right.m34 + this.m24 * right.m44;
    const i = this.m31 * right.m11 + this.m32 * right.m21 + this.m33 * right.m31 + this.m34 * right.m41;
    const j = this.m31 * right.m12 + this.m32 * right.m22 + this.m33 * right.m32 + this.m34 * right.m42;
    const k = this.m31 * right.m13 + this.m32 * right.m23 + this.m33 * right.m33 + this.m34 * right.m43;
    const l = this.m31 * right.m14 + this.m32 * right.m24 + this.m33 * right.m34 + this.m34 * right.m44;
    const m = this.m41 * right.m11 + this.m42 * right.m21 + this.m43 * right.m31 + this.m44 * right.m41;
    const n = this.m41 * right.m12 + this.m42 * right.m22 + this.m43 * right.m32 + this.m44 * right.m42;
    const o = this.m41 * right.m13 + this.m42 * right.m23 + this.m43 * right.m33 + this.m44 * right.m43;
    const p = this.m41 * right.m14 + this.m42 * right.m24 + this.m43 * right.m34 + this.m44 * right.m44;
    this.m11 = a;
    this.m12 = b;
    this.m13 = c;
    this.m14 = d;
    this.m21 = e;
    this.m22 = f;
    this.m23 = g;
    this.m24 = h;
    this.m31 = i;
    this.m32 = j;
    this.m33 = k;
    this.m34 = l;
    this.m41 = m;
    this.m42 = n;
    this.m43 = o;
    this.m44 = p;
    return this;
  }

  preMultiplySelf(other: NodeDOMMatrix | ArrayLike<number>) {
    const left = other instanceof NodeDOMMatrix ? other : new NodeDOMMatrix(other);
    const product = new NodeDOMMatrix();
    product.multiplySelf(left);
    product.multiplySelf(this);
    copyMatrix(product, this);
    return this;
  }

  invertSelf() {
    const det =
      this.m11 * (this.m22 * this.m33 - this.m23 * this.m32) -
      this.m12 * (this.m21 * this.m33 - this.m23 * this.m31) +
      this.m13 * (this.m21 * this.m32 - this.m22 * this.m31);
    if (!det) {
      this.m11 = NaN;
      this.m12 = NaN;
      this.m13 = NaN;
      this.m14 = NaN;
      this.m21 = NaN;
      this.m22 = NaN;
      this.m23 = NaN;
      this.m24 = NaN;
      this.m31 = NaN;
      this.m32 = NaN;
      this.m33 = NaN;
      this.m34 = NaN;
      this.m41 = NaN;
      this.m42 = NaN;
      this.m43 = NaN;
      this.m44 = NaN;
      return this;
    }

    const inverse = new NodeDOMMatrix();
    inverse.m11 = (this.m22 * this.m33 - this.m23 * this.m32) / det;
    inverse.m12 = (this.m13 * this.m32 - this.m12 * this.m33) / det;
    inverse.m13 = (this.m12 * this.m23 - this.m13 * this.m22) / det;
    inverse.m21 = (this.m23 * this.m31 - this.m21 * this.m33) / det;
    inverse.m22 = (this.m11 * this.m33 - this.m13 * this.m31) / det;
    inverse.m23 = (this.m13 * this.m21 - this.m11 * this.m23) / det;
    inverse.m31 = (this.m21 * this.m32 - this.m22 * this.m31) / det;
    inverse.m32 = (this.m12 * this.m31 - this.m11 * this.m32) / det;
    inverse.m33 = (this.m11 * this.m22 - this.m12 * this.m21) / det;
    inverse.m41 = -(inverse.m11 * this.m41 + inverse.m21 * this.m42 + inverse.m31 * this.m43);
    inverse.m42 = -(inverse.m12 * this.m41 + inverse.m22 * this.m42 + inverse.m32 * this.m43);
    inverse.m43 = -(inverse.m13 * this.m41 + inverse.m23 * this.m42 + inverse.m33 * this.m43);
    copyMatrix(inverse, this);
    return this;
  }

  translateSelf(tx = 0, ty = 0, tz = 0) {
    return this.multiplySelf(new NodeDOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1]));
  }

  scaleSelf(scaleX = 1, scaleY = scaleX, scaleZ = 1, originX = 0, originY = 0, originZ = 0) {
    this.translateSelf(originX, originY, originZ);
    this.multiplySelf(
      new NodeDOMMatrix([scaleX, 0, 0, 0, 0, scaleY, 0, 0, 0, 0, scaleZ, 0, 0, 0, 0, 1]),
    );
    return this.translateSelf(-originX, -originY, -originZ);
  }

  translate(tx = 0, ty = 0, tz = 0) {
    return cloneMatrix(this).translateSelf(tx, ty, tz);
  }

  scale(scaleX = 1, scaleY = scaleX, scaleZ = 1, originX = 0, originY = 0, originZ = 0) {
    return cloneMatrix(this).scaleSelf(scaleX, scaleY, scaleZ, originX, originY, originZ);
  }

  multiply(other: NodeDOMMatrix | ArrayLike<number>) {
    return cloneMatrix(this).multiplySelf(other);
  }

  inverse() {
    return cloneMatrix(this).invertSelf();
  }
}

function copyMatrix(from: NodeDOMMatrix, to: NodeDOMMatrix) {
  to.m11 = from.m11;
  to.m12 = from.m12;
  to.m13 = from.m13;
  to.m14 = from.m14;
  to.m21 = from.m21;
  to.m22 = from.m22;
  to.m23 = from.m23;
  to.m24 = from.m24;
  to.m31 = from.m31;
  to.m32 = from.m32;
  to.m33 = from.m33;
  to.m34 = from.m34;
  to.m41 = from.m41;
  to.m42 = from.m42;
  to.m43 = from.m43;
  to.m44 = from.m44;
}

function cloneMatrix(matrix: NodeDOMMatrix) {
  const copy = new NodeDOMMatrix();
  copyMatrix(matrix, copy);
  return copy;
}

class NodeImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace = 'srgb';

  constructor(widthOrData: number | Uint8ClampedArray, heightOrWidth: number, maybeHeight?: number) {
    if (typeof widthOrData === 'number') {
      this.width = widthOrData;
      this.height = heightOrWidth;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
      return;
    }
    this.data = widthOrData;
    this.width = heightOrWidth;
    this.height = maybeHeight ?? 0;
  }
}

class NodePath2D {
  addPath() {
    return this;
  }
}

function defineGlobal(name: 'DOMMatrix' | 'ImageData' | 'Path2D', value: unknown) {
  const target = globalThis as Record<string, unknown>;
  if (typeof target[name] === 'undefined') {
    Object.defineProperty(target, name, {
      value,
      configurable: true,
      writable: true,
    });
  }
}

export function ensurePdfJsDomPolyfill() {
  defineGlobal('DOMMatrix', NodeDOMMatrix);
  defineGlobal('ImageData', NodeImageData);
  defineGlobal('Path2D', NodePath2D);
}

ensurePdfJsDomPolyfill();
