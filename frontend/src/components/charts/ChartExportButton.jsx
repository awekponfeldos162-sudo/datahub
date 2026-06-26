import { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';

export function useChartExport(filename = 'chart.png') {
  const ref = useRef(null);

  const exportPng = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export PNG échoué', e);
    }
  };

  return { ref, exportPng };
}

export function ExportButton({ onClick, label = 'PNG', className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`btn-secondary py-1 px-2.5 text-xs gap-1 ${className}`}
      title="Exporter en PNG"
    >
      <Download size={11} />
      {label}
    </button>
  );
}
