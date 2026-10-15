import {
  adjustDimsForRotation,
  componentsToColor,
  cmyk,
  drawTextField,
  grayscale,
  layoutCombedText,
  reduceRotation,
  rgb,
  rotateInPlace,
  setFillingColor,
  setFontAndSize,
  type AppearanceProviderFor,
  type PDFFont,
  type PDFTextField,
} from 'pdf-lib';
import { fitPdfFieldFontSize, layoutPdfFieldText } from '@/lib/export/pdf-layout';
import { shapePdfText } from '@/lib/export/pdf-text';

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
 * Field appearances draw shaped Arabic after wrapping in logical order and
 * bidi-reordering each visual line. Font size is fixed per field type and
 * shrinks only when the text would overflow the widget.
 */
export function unicodeTextFieldAppearanceProvider(): AppearanceProviderFor<PDFTextField> {
  return (textField, widget, font: PDFFont) => {
    const widgetDa = widget.getDefaultAppearance();
    const fieldDa = textField.acroField.getDefaultAppearance();
    const widgetColor = defaultColor(widgetDa);
    const fieldColor = defaultColor(fieldDa);
    const widgetFontSize = defaultFontSize(widgetDa);
    const rectangle = widget.getRectangle();
    const ap = widget.getAppearanceCharacteristics();
    const bs = widget.getBorderStyle();
    const logical = textField.getText() ?? '';
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

    let textLines;
    let fontSize: number;
    if (textField.isCombed()) {
      const layout = layoutCombedText(shapePdfText(logical), {
        fontSize: widgetFontSize,
        font,
        bounds,
        cellCount: textField.getMaxLength() ?? 0,
      });
      textLines = layout.cells;
      fontSize = layout.fontSize;
    } else {
      const fieldType = textField.isMultiline() ? 'multiline' : 'single';
      fontSize = fitPdfFieldFontSize(logical, font, bounds, fieldType);
      textLines = layoutPdfFieldText(logical, font, fontSize, bounds).map((run) => ({
        text: run.text,
        encoded: font.encodeText(run.text),
        x: run.x,
        y: run.y,
        width: run.width,
        height: fontSize,
      }));
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
