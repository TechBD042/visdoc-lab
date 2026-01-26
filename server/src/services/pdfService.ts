import fs from 'fs/promises';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument as PDFLibDocument, PDFName, PDFDict, PDFArray, PDFString, PDFNumber, PDFBool } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { TEMP_DIR, getUploadPath } from '../utils/fileUtils.js';
import type { PDFImage, PDFMetadata } from '../../../shared/types/index.js';

// Use legacy build for Node.js - no worker needed
const { getDocument } = pdfjsLib;

// Simple PNG encoder for raw RGBA data
function encodePNG(width: number, height: number, rgbaData: Uint8ClampedArray): Buffer {
  // Create a minimal valid PNG
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);  // bit depth
  ihdrData.writeUInt8(6, 9);  // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdr = createPNGChunk('IHDR', ihdrData);

  // IDAT chunk - raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = rgbaData[srcIdx];     // R
      rawData[dstIdx + 1] = rgbaData[srcIdx + 1]; // G
      rawData[dstIdx + 2] = rgbaData[srcIdx + 2]; // B
      rawData[dstIdx + 3] = rgbaData[srcIdx + 3] ?? 255; // A
    }
  }

  // Use zlib to compress
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);
  const idat = createPNGChunk('IDAT', compressed);

  // IEND chunk
  const iend = createPNGChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createPNGChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 for PNG
function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc32Table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crc32Table[i] = c;
}

class PDFService {
  async getPageCount(filePath: string): Promise<number> {
    const data = new Uint8Array(await fs.readFile(filePath));
    const pdfDoc = await getDocument({ data }).promise;
    const pageCount = pdfDoc.numPages;
    pdfDoc.destroy();
    return pageCount;
  }

  async extractImages(documentId: string): Promise<PDFImage[]> {
    const filePath = getUploadPath(`${documentId}.pdf`);
    const pdfBytes = await fs.readFile(filePath);

    // Use pdf-lib to extract actual image bytes
    const pdfDoc = await PDFLibDocument.load(pdfBytes);
    const context = pdfDoc.context;
    const images: PDFImage[] = [];

    const pages = pdfDoc.getPages();
    for (let pageNum = 0; pageNum < pages.length; pageNum++) {
      const page = pages[pageNum];
      const resources = page.node.Resources();

      if (!resources) continue;

      const xObjectsRef = resources.get(PDFName.of('XObject'));
      if (!xObjectsRef) continue;

      const xObjects = context.lookup(xObjectsRef);
      if (!xObjects || !(xObjects instanceof PDFDict)) continue;

      const entries = xObjects.entries();
      let imageIndex = 0;

      for (const [key, valueRef] of entries) {
        try {
          const xObject = context.lookup(valueRef);
          if (!xObject) continue;

          // Must be a stream (images are streams)
          if (!('dict' in (xObject as any))) continue;

          const stream = xObject as any;
          const dict = stream.dict as PDFDict;

          // Check if it's an image
          const subtype = dict.get(PDFName.of('Subtype'));
          if (!subtype || subtype.toString() !== '/Image') continue;

          const widthObj = dict.get(PDFName.of('Width'));
          const heightObj = dict.get(PDFName.of('Height'));

          const width = widthObj ? parseInt(widthObj.toString()) : 0;
          const height = heightObj ? parseInt(heightObj.toString()) : 0;

          if (width === 0 || height === 0) continue;

          const imageId = uuidv4();
          let dataUrl: string | undefined;

          // Get the raw stream contents
          if (stream.contents && stream.contents.length > 0) {
            const contents = stream.contents;
            // Check filter to determine format
            const filter = dict.get(PDFName.of('Filter'));
            const filterStr = filter?.toString() || '';

            if (filterStr.includes('DCTDecode')) {
              // JPEG image - use directly
              const base64 = Buffer.from(contents).toString('base64');
              dataUrl = `data:image/jpeg;base64,${base64}`;
            } else {
              // For other formats, try as JPEG
              const base64 = Buffer.from(contents).toString('base64');
              dataUrl = `data:image/jpeg;base64,${base64}`;
            }
          }

          const imageInfo: PDFImage = {
            id: imageId,
            pageNumber: pageNum + 1,
            index: imageIndex,
            width,
            height,
            format: 'jpeg',
            dataUrl,
            altText: undefined,
            altTextGenerated: false
          };

          images.push(imageInfo);
          imageIndex++;
          console.log(`Extracted image: ${width}x${height}, dataUrl length: ${dataUrl?.length || 0}`);
        } catch (err) {
          console.warn(`Failed to extract image:`, err);
        }
      }
    }

    return images;
  }

  private async createImageDataUrl(width: number, height: number, data: Uint8ClampedArray): Promise<string> {
    // Convert raw RGBA pixel data to PNG
    try {
      const pngBuffer = encodePNG(width, height, data);
      const base64 = pngBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (err) {
      console.error('Failed to encode PNG:', err);
      // Fallback to raw format
      const base64 = Buffer.from(data).toString('base64');
      return `data:image/raw;width=${width};height=${height};base64,${base64}`;
    }
  }

  async renderPageAsImage(documentId: string, pageNumber: number, scale: number = 2.0): Promise<string> {
    const filePath = getUploadPath(`${documentId}.pdf`);
    const data = new Uint8Array(await fs.readFile(filePath));
    const pdfDoc = await getDocument({ data }).promise;

    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Create a canvas-like structure for rendering
    // On server-side, we use a simple approach
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    // For server-side, return viewport dimensions
    // Actual rendering happens client-side with react-pdf
    pdfDoc.destroy();

    return JSON.stringify({ width, height, pageNumber, scale });
  }

  async addAccessibilityMetadata(
    documentId: string,
    images: { id: string; altText: string }[],
    metadata?: PDFMetadata
  ): Promise<string> {
    const inputPath = getUploadPath(`${documentId}.pdf`);
    const outputFilename = `${documentId}_remediated.pdf`;
    const outputPath = path.join(TEMP_DIR, '..', 'output', outputFilename);

    const pdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFLibDocument.load(pdfBytes);
    const context = pdfDoc.context;

    // Add document-level metadata
    if (metadata?.title) {
      pdfDoc.setTitle(metadata.title);
    }
    if (metadata?.author) {
      pdfDoc.setAuthor(metadata.author);
    }
    if (metadata?.subject) {
      pdfDoc.setSubject(metadata.subject);
    }
    if (metadata?.language) {
      pdfDoc.setLanguage(metadata.language);
    }

    // Set PDF producer and creator
    pdfDoc.setProducer('VisdDoc-Lab Accessibility Remediation Tool');
    pdfDoc.setCreator('VisdDoc-Lab');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Add keywords for accessibility
    pdfDoc.setKeywords(['accessible', 'WCAG', 'remediated', 'alt-text']);

    // Create tagged PDF structure for accessibility
    try {
      // Get the catalog
      const catalog = pdfDoc.catalog;

      // Mark document as tagged
      const markInfoDict = context.obj({
        Marked: PDFBool.True,
        Suspects: PDFBool.False,
      });
      catalog.set(PDFName.of('MarkInfo'), markInfoDict);

      // Create structure element kids array
      const structKids: PDFDict[] = [];

      // Create Figure elements for each image with alt-text
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.altText) {
          // Create a Figure structure element with Alt text
          const figureElem = context.obj({
            Type: PDFName.of('StructElem'),
            S: PDFName.of('Figure'),
            Alt: PDFString.of(img.altText),
            P: context.nextRef(), // Will be set to parent later
          });
          structKids.push(figureElem);
        }
      }

      // Create Document structure element (root of content)
      const docStructRef = context.nextRef();
      const docStructElem = context.obj({
        Type: PDFName.of('StructElem'),
        S: PDFName.of('Document'),
        K: structKids.length > 0 ? context.obj(structKids) : context.obj([]),
      });

      // Create StructTreeRoot
      const structTreeRoot = context.obj({
        Type: PDFName.of('StructTreeRoot'),
        K: docStructRef,
        ParentTree: context.obj({
          Nums: context.obj([]),
        }),
      });

      // Register the document structure element
      context.assign(docStructRef, docStructElem);

      // Add StructTreeRoot to catalog
      catalog.set(PDFName.of('StructTreeRoot'), context.register(structTreeRoot));

      // Add ViewerPreferences for accessibility
      const viewerPrefs = context.obj({
        DisplayDocTitle: PDFBool.True,
      });
      catalog.set(PDFName.of('ViewerPreferences'), viewerPrefs);

      // Set Lang on catalog if provided
      if (metadata?.language) {
        catalog.set(PDFName.of('Lang'), PDFString.of(metadata.language));
      }

      console.log(`Added structure tree with ${structKids.length} figure elements`);
    } catch (err) {
      console.error('Error creating structure tree:', err);
      // Continue anyway - metadata will still be added
    }

    const modifiedPdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, modifiedPdfBytes);

    return outputFilename;
  }

  async getDocumentMetadata(documentId: string): Promise<PDFMetadata> {
    const filePath = getUploadPath(`${documentId}.pdf`);
    const pdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFLibDocument.load(pdfBytes);

    const metadata: PDFMetadata = {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      language: undefined, // pdf-lib doesn't expose language directly
      isTagged: false // Would need deeper inspection
    };

    return metadata;
  }
}

export const pdfService = new PDFService();
