import {
  TextAlignment,
  adjustDimsForRotation,
  componentsToColor,
  cmyk,
  drawTextField,
  grayscale,
  layoutCombedText,
  layoutMultilineText,
  layoutSinglelineText,
  reduceRotation,
  rgb,
  rotateInPlace,
  setFillingColor,
  setFontAndSize,
  type AppearanceProviderFor,
  type PDFFont,
  type PDFTextField,
} from 'pdf-lib';
import { paragraphBaseIsRtl, shapePdfText } from '@/lib/export/pdf-text';

const TF_REGEX = /\/[^\0\t\n\f\r ]+[\0\t\n\f\r ]+(\d*\.\d+|\d+)[\0\t\n\f\r ]+Tf/g;
const COLOR_REGEX =
  /(\d*\.\d+|\d+)[\0\t\n\f\r ]*(\d*\.\d+|\d+)?[\0\t\n\f\r ]*(\d*\.\d+|\d+)?[\0\t\n\f\r ]*(\d*\.\d+|\d+)?[\0\t\n\f\r ]+(g|rg|k)/;

function lastMatch(source: string, regex: RegExp): RegExpExecArray | null {
  const global = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  let found: RegExpExecArray | null = null;
  let current: RegExpExecArray | null;
  while ((current = global.exec(source))) found = current;
  return found;
}

function defaultFontSize(da: string | undefined): number | undefined {
  if (!da) return undefined;
  const match = lastMatch(da, TF_REGEX);
  const value = Number(match?.[1]);
  return Number.isFinite(value) ? value : undefined;
}

function defaultColor(da: string | undefined) {
  if (!da) return undefined;
  const match = lastMatch(da, COLOR_REGEX);
  if (!match) return undefined;
  const [, c1, c2, c3, c4, colorSpace] = match;
  if (colorSpace === 'g' && c1) return grayscale(Number(c1));
  if (colorSpace === 'rg' && c1 && c2 && c3) return rgb(Number(c1), Number(c2), Number(c3));
  if (colorSpace === 'k' && c1 && c2 && c3 && c4) {
    return cmyk(Number(c1), Number(c2), Number(c3), Number(c4));
  }
  return undefined;
}

/**
 * Same layout as pdf-lib's default text-field appearance, but draws shaped
 * visual Arabic (presentation forms + bidi) while the field value stays
 * logical Unicode.
 */
export function unicodeTextFieldAppearanceProvider(): AppearanceProviderFor<PDFTextField> {
  return (textField, widget, font: PDFFont) => {
    const widgetDa = widget.getDefaultAppearance();
    const fieldDa = textField.acroField.getDefaultAppearance();
    const widgetColor = defaultColor(widgetDa);
    const fieldColor = defaultColor(fieldDa);
    const widgetFontSize = defaultFontSize(widgetDa);
    const fieldFontSize = defaultFontSize(fieldDa);
    const rectangle = widget.getRectangle();
    const ap = widget.getAppearanceCharacteristics();
    const bs = widget.getBorderStyle();
    const logical = textField.getText() ?? '';
    const text = shapePdfText(logical);
    const borderWidth = bs?.getWidth() ?? 0;
    const rotation = reduceRotation(ap?.getRotation());
    const { width, height } = adjustDimsForRotation(rectangle, rotation);
    const rotate = rotateInPlace({ ...rectangle, rotation });
    const black = rgb(0, 0, 0);
    const borderColor = componentsToColor(ap?.getBorderColor());
    const normalBackgroundColor = componentsToColor(ap?.getBackgroundColor());
    const padding = textField.isCombed() ? 0 : 1;
    const bounds = {
      x: borderWidth + padding,
      y: borderWidth + padding,
      width: width - (borderWidth + padding) * 2,
      height: height - (borderWidth + padding) * 2,
    };

    const requestedAlignment = textField.getAlignment();
    const alignment =
      requestedAlignment === TextAlignment.Left && paragraphBaseIsRtl(logical)
        ? TextAlignment.Right
        : requestedAlignment;

    let textLines;
    let fontSize: number;
    if (textField.isMultiline()) {
      const layout = layoutMultilineText(text, {
        alignment,
        fontSize: widgetFontSize ?? fieldFontSize,
        font,
        bounds,
      });
      textLines = layout.lines;
      fontSize = layout.fontSize;
    } else if (textField.isCombed()) {
      const layout = layoutCombedText(text, {
        fontSize: widgetFontSize ?? fieldFontSize,
        font,
        bounds,
        cellCount: textField.getMaxLength() ?? 0,
      });
      textLines = layout.cells;
      fontSize = layout.fontSize;
    } else {
      const layout = layoutSinglelineText(text, {
        alignment,
        fontSize: widgetFontSize ?? fieldFontSize,
        font,
        bounds,
      });
      textLines = [layout.line];
      fontSize = layout.fontSize;
    }

    const textColor = widgetColor ?? fieldColor ?? black;
    const da = [setFillingColor(textColor).toString(), setFontAndSize(font.name, fontSize).toString()].join('\n');
    if (widgetDa || widgetFontSize !== undefined) {
      widget.setDefaultAppearance(da);
    } else {
      textField.acroField.setDefaultAppearance(da);
    }

    return [
      ...rotate,
      ...drawTextField({
        x: 0 + borderWidth / 2,
        y: 0 + borderWidth / 2,
        width: width - borderWidth,
        height: height - borderWidth,
        borderWidth: borderWidth ?? 0,
        borderColor,
        textColor,
        font: font.name,
        fontSize,
        color: normalBackgroundColor,
        textLines,
        padding,
      }),
    ];
  };
}
