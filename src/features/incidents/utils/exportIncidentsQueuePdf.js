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
 * Builds a PDF of the incident queue (typically the filtered list from Incident Center).
 * @param {Array<object>} incidents - Normalized incidents from the app
 * @param {{ type?: string; status?: string; severity?: string; searchTerm?: string }} filterSummary
 * @returns {{ ok: true } | { ok: false; message: string }}
 */
export const exportIncidentsQueueToPdf = (incidents, filterSummary = {}) => {
    if (!Array.isArray(incidents) || incidents.length === 0) {
        return {
            ok: false,
            message: 'No incidents match the current filters. Adjust filters or load data, then try again.',
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
    doc.text('EcoTrack — Incident queue report', margin, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    doc.text(`Generated (UTC): ${stamp}`, margin, 20);
    doc.text(`Records: ${incidents.length}`, margin, 25);

    const parts = [];
    if (filterSummary.type && filterSummary.type !== 'ALL') {
        parts.push(`Type: ${String(filterSummary.type).replaceAll('_', ' ')}`);
    }
    if (filterSummary.status && filterSummary.status !== 'ALL') {
        parts.push(`Status: ${String(filterSummary.status).replaceAll('_', ' ')}`);
    }
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

    const head = [
        [
            'No.',
            'Type',
            'Severity',
            'Status',
            'Protected area',
            'Zone',
            'Incident date',
            'Reporter',
            'Description',
        ],
    ];

    const body = incidents.map((inc, index) => [
        String(index + 1),
        truncate(String(inc.type ?? '').replaceAll('_', ' '), 18),
        inc.severity ?? '',
        truncate(String(inc.status ?? '').replaceAll('_', ' '), 14),
        truncate(inc.protectedArea?.name, 24),
        truncate(inc.zone?.name, 20),
        formatDateTime(inc.incidentDate),
        truncate(inc.reportedBy?.fullName || inc.reportedBy?.username, 22),
        truncate(inc.description, 120),
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
        doc.save(`EcoTrack-incident-queue-${day}.pdf`);

        return { ok: true };
    } catch (e) {
        console.error('exportIncidentsQueueToPdf', e);
        return {
            ok: false,
            message: 'Could not build the PDF document. Check the browser console for details.',
        };
    }
};
