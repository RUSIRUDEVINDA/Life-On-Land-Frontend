import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDateTime = (value) => {
    try {
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    } catch {
        return String(value ?? '');
    }
};

const truncate = (value, max) => {
    const str = String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim();
    if (str.length <= max) return str;
    return `${str.slice(0, Math.max(0, max - 1))}…`;
};

const formatCoords = (move) => {
    const lat = Number(move?.lat);
    const lng = Number(move?.lng);
    const latLabel = Number.isFinite(lat) ? lat.toFixed(4) : '—';
    const lngLabel = Number.isFinite(lng) ? lng.toFixed(4) : '—';
    return `${latLabel}, ${lngLabel}`;
};

/**
 * Builds a PDF of movement telemetry rows (enriched with area/zone names).
 * @param {Array<object>} movements
 * @param {{ searchTerm?: string }} filterSummary
 * @returns {{ ok: true } | { ok: false; message: string }}
 */
export const exportMovementsQueueToPdf = (movements, filterSummary = {}) => {
    if (!Array.isArray(movements) || movements.length === 0) {
        return {
            ok: false,
            message: 'No movement records to export. Adjust filters or load data, then try again.',
        };
    }

    let doc;
    try {
        doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 12;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(23, 54, 43);
        doc.text('EcoTrack — Movements queue report', margin, 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(70, 70, 70);
        const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
        doc.text(`Generated (UTC): ${stamp}`, margin, 20);
        doc.text(`Records: ${movements.length}`, margin, 25);

        let y = 30;
        if (filterSummary.searchTerm?.trim()) {
            doc.text(`Tag ID filter: "${filterSummary.searchTerm.trim()}"`, margin, y);
            y += 6;
        }

        const head = [['Record ID', 'Entity ID', 'Coordinates', 'Protected area', 'Zone', 'Timestamp']];

        const body = movements.map((move, idx) => {
            const recordId = truncate(
                String(move?.id || move?._id || `${move?.tagId || 'row'}-${move?.timestamp || idx}`),
                20
            );
            const tagLabel = String(move?.tagId ?? '—');
            const area = move?.protectedAreaName || move?.protectedArea?.name || '—';
            const zone = move?.zoneName || move?.zone?.name || '—';
            return [
                recordId,
                truncate(tagLabel, 18),
                formatCoords(move),
                truncate(area, 26),
                truncate(zone, 22),
                formatDateTime(move?.timestamp || move?.createdAt || move?.updatedAt),
            ];
        });

        autoTable(doc, {
            startY: y,
            head,
            body,
            styles: {
                fontSize: 7,
                cellPadding: 1.2,
                overflow: 'linebreak',
                valign: 'top',
                textColor: [30, 30, 30],
            },
            headStyles: {
                fillColor: [42, 90, 69],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 7.5,
            },
            alternateRowStyles: { fillColor: [248, 250, 249] },
            margin: { left: margin, right: margin, bottom: 12 },
            tableLineColor: [220, 228, 224],
            tableLineWidth: 0.1,
            didDrawPage: (data) => {
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${data.pageNumber}`, margin, pageHeight - 5);
                doc.text('EcoTrack Wildlife Operations', pageWidth - margin - 42, pageHeight - 5);
            },
        });

        const day = new Date().toISOString().slice(0, 10);
        doc.save(`EcoTrack-movements-queue-${day}.pdf`);

        return { ok: true };
    } catch (e) {
        console.error('exportMovementsQueueToPdf', e);
        return {
            ok: false,
            message: 'Could not build the PDF document. Check the browser console for details.',
        };
    }
};
