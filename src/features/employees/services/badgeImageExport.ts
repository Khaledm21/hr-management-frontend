import { toPng } from 'html-to-image';

/**
 * Exports an HTML element to high-resolution PNG (300 DPI equivalent) and triggers browser download.
 */
export async function exportBadgeToPng(
  element: HTMLElement,
  fileName: string,
  options?: { pixelRatio?: number; backgroundColor?: string }
): Promise<string> {
  const pixelRatio = options?.pixelRatio ?? 3;
  const backgroundColor = options?.backgroundColor ?? '#ffffff';

  // Temporarily ensure styles are crisp
  const dataUrl = await toPng(element, {
    pixelRatio,
    cacheBust: true,
    backgroundColor,
    filter: (domNode: Node) => {
      // Exclude print-only hints or interactive overlays
      if (domNode instanceof HTMLElement) {
        if (domNode.classList.contains('no-export')) return false;
      }
      return true;
    },
  });

  const cleanName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  const link = document.createElement('a');
  link.download = cleanName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}
