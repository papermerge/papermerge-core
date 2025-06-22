import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;


interface GeneratePreviewArgs {
  file: File;
  width: number;
  pageNumber: number
}

async function generatePreview({ file, width, pageNumber }: GeneratePreviewArgs): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

    // Add timeout with proper typing
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF loading timeout')), 5000); // 5 seconds
    });

    const pdfDocument = await Promise.race([loadingTask.promise, timeoutPromise]);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error('Could not get canvas 2D context');
    }

    const page = await pdfDocument.getPage(pageNumber);

    // Get the original viewport to calculate proper scaling
    const originalViewport = page.getViewport({ scale: 1.0 });

    // Calculate scale to achieve desired width
    const scale = width / originalViewport.width;
    const scaledViewport = page.getViewport({ scale });

    // Set canvas dimensions
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    await page.render(renderContext).promise;

    // Convert canvas to blob and create object URL
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png');
    });

    const objectUrl = URL.createObjectURL(blob);

    // Clean up
    pdfDocument.destroy();

    return objectUrl;
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw error;
  }
}


export { generatePreview };
