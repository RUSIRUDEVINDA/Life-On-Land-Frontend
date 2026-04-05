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

/**
 * Builds a PDF of the alerts queue (typically the filtered list from Alerts Center).
 * @param {Array<object>} alerts
 * @param {{ severity?: string; searchTerm?: string }} filterSummary
 * @returns {{ ok: true } | { ok: false; message: string }}
 */
export const exportAlertsQueueToPdf = (alerts, filterSummary = {}) => {
    if (!Array.isArray(alerts) || alerts.length === 0) {
        return {
            ok: false,
            message: 'No alerts match the current filters. Adjust filters or load data, then try again.',
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
        doc.text('EcoTrack — Alerts queue report', margin, 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(70, 70, 70);
        const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
        doc.text(`Generated (UTC): ${stamp}`, margin, 20);
        doc.text(`Records: ${alerts.length}`, margin, 25);

        const parts = [];
        if (filterSummary.severity && filterSummary.severity !== 'ALL') {
            parts.push(`Severity: ${filterSummary.severity}`);
        }
        if (filterSummary.searchTerm?.trim()) {
            parts.push(`Search: "${filterSummary.searchTerm.trim()}"`);
        }

        let y = 30;
        if (parts.length) {
            doc.text(`Active filters: ${parts.join('  ·  ')}`, margin, y);
            y += 6;
        }

        const head = [['No.', 'Type', 'Severity', 'Status', 'Created', 'Description']];

        const body = alerts.map((a, index) => [
            String(index + 1),
            truncate(String(a.type ?? ''), 22),
            a.severity ?? '',
            truncate(String(a.status ?? 'NEW'), 14),
            formatDateTime(a.createdAt || a.updatedAt),
            truncate(a.description, 140),
        ]);

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
        doc.save(`EcoTrack-alerts-queue-${day}.pdf`);

        return { ok: true };
    } catch (e) {
        console.error('exportAlertsQueueToPdf', e);
        return {
            ok: false,
            message: 'Could not build the PDF document. Check the browser console for details.',
        };
    }
};
