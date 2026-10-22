// Dummy shim for jsPDF internal optional dependency
const html2canvasShim = async (): Promise<HTMLCanvasElement> => {
  return document.createElement('canvas');
};

export default html2canvasShim;
