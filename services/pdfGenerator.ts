import type { jsPDF, TextOptionsLight } from 'jspdf';
import type { AssessmentResult, RecommendedStructure, Feasibility } from '../types';
import { PDF_LOGO_B64 } from '../assets/logo';

// --- STYLING CONSTANTS ---
const MARGIN = 15;
const FONT_SIZES = {
    TITLE: 22,
    H1: 16,
    H2: 12,
    BODY: 10,
    SMALL: 8,
};
const COLORS = {
    PRIMARY: '#2563EB', // blue-600
    TEXT_DARK: '#1F2937', // gray-800
    TEXT_LIGHT: '#4B5563', // gray-600
    BORDER: '#E5E7EB', // gray-200
    FEASIBILITY: {
        Green: { BG: '#D1FAE5', TEXT: '#065F46' },
        Yellow: { BG: '#FEF3C7', TEXT: '#92400E' },
        Red: { BG: '#FEE2E2', TEXT: '#991B1B' },
    }
};

type PdfContext = {
    doc: jsPDF;
    pageWidth: number;
    pageHeight: number;
    currentPage: number;
    y: number;
};

// --- PDF DRAWING HELPERS ---

const addPageHeader = (ctx: PdfContext) => {
    ctx.doc.addImage(PDF_LOGO_B64, 'SVG', MARGIN, MARGIN - 5, 10, 10);
    ctx.doc.setFontSize(FONT_SIZES.H2);
    ctx.doc.setTextColor(COLORS.PRIMARY);
    ctx.doc.text('Sawan RTRWH Planner', MARGIN + 12, MARGIN + 2);
};

const addPageFooter = (ctx: PdfContext) => {
    const today = new Date().toLocaleDateString('en-GB');
    const footerText = `Report generated on ${today}`;
    const pageText = `Page ${ctx.currentPage}`;

    ctx.doc.setFontSize(FONT_SIZES.SMALL);
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    ctx.doc.text(footerText, MARGIN, ctx.pageHeight - 10);
    ctx.doc.text(pageText, ctx.pageWidth - MARGIN, ctx.pageHeight - 10, { align: 'right' });
};

const addNewPage = (ctx: PdfContext) => {
    addPageFooter(ctx);
    ctx.doc.addPage();
    ctx.currentPage++;
    addPageHeader(ctx);
    ctx.y = MARGIN + 15;
};

const checkPageBreak = (ctx: PdfContext, spaceNeeded: number) => {
    if (ctx.y + spaceNeeded > ctx.pageHeight - (MARGIN + 10)) {
        addNewPage(ctx);
    }
};

const drawSectionHeader = (ctx: PdfContext, title: string) => {
    checkPageBreak(ctx, 20);
    ctx.y += 10;
    ctx.doc.setFontSize(FONT_SIZES.H1);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.TEXT_DARK);
    ctx.doc.text(title, MARGIN, ctx.y);
    ctx.y += 5;
    ctx.doc.setDrawColor(COLORS.BORDER);
    ctx.doc.line(MARGIN, ctx.y, ctx.pageWidth - MARGIN, ctx.y);
    ctx.y += 8;
};

const drawFeasibilityBanner = (ctx: PdfContext, feasibility: Feasibility) => {
    const style = COLORS.FEASIBILITY[feasibility];
    ctx.doc.setFillColor(style.BG);
    ctx.doc.rect(MARGIN, ctx.y, ctx.pageWidth - MARGIN * 2, 15, 'F');
    
    ctx.doc.setFontSize(FONT_SIZES.H2);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(style.TEXT);
    const text = `FEASIBILITY SCORE: ${feasibility.toUpperCase()}`;
    ctx.doc.text(text, ctx.pageWidth / 2, ctx.y + 9, { align: 'center' });
    ctx.y += 25;
};

const drawKeyMetrics = (ctx: PdfContext, results: AssessmentResult) => {
    const col1X = MARGIN;
    const col2X = ctx.pageWidth / 2 + 5;
    const colWidth = ctx.pageWidth / 2 - MARGIN - 5;
    const startY = ctx.y;

    // --- Column 1: Net RWH Potential ---
    ctx.doc.setFontSize(FONT_SIZES.H2);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.PRIMARY);
    ctx.doc.text('Net RWH Potential', col1X, ctx.y);
    ctx.y += 8;

    ctx.doc.setFontSize(26);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.TEXT_DARK);
    ctx.doc.text(`${results.annualHarvestM3} m³/year`, col1X, ctx.y);
    ctx.y += 8;

    ctx.doc.setFontSize(FONT_SIZES.BODY);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    ctx.doc.text(`Equal to ${(results.annualHarvestM3 * 1000).toLocaleString()} liters annually`, col1X, ctx.y);
    ctx.y += 8;

    ctx.doc.setDrawColor(COLORS.BORDER);
    ctx.doc.line(col1X, ctx.y, col1X + colWidth, ctx.y);
    ctx.y += 6;
    
    ctx.doc.text(`Monsoon Harvest: ${results.monsoonHarvestM3} m³`, col1X, ctx.y);
    ctx.y += 5;
    ctx.doc.text(`Annual Rainfall: ${results.annualRainMm} mm in ${results.locationName}`, col1X, ctx.y);
    ctx.y += 8;
    
    const efficiencyText = `Note: This is a net estimate including a ${((1 - results.systemEfficiency) * 100).toFixed(0)}% system loss factor.`;
    const splitText = ctx.doc.splitTextToSize(efficiencyText, colWidth);
    ctx.doc.setFontSize(FONT_SIZES.SMALL);
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    ctx.doc.text(splitText, col1X, ctx.y);

    const col1EndY = ctx.y + (splitText.length * (FONT_SIZES.SMALL / 2.5));
    
    // --- Column 2: Financial Snapshot ---
    ctx.y = startY; // Reset Y for the second column
    ctx.doc.setFontSize(FONT_SIZES.H2);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.PRIMARY);
    ctx.doc.text('Financial Snapshot', col2X, ctx.y);
    ctx.y += 8;

    ctx.doc.setFontSize(FONT_SIZES.BODY);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    ctx.doc.text('Estimated Annual Savings', col2X, ctx.y);
    ctx.y += 8;
    ctx.doc.setFontSize(20);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.TEXT_DARK);
    ctx.doc.text(`~₹${results.costBenefit.annualSavingsInr.toLocaleString('en-IN')}`, col2X, ctx.y);
    ctx.y += 12;

    ctx.doc.setFontSize(FONT_SIZES.BODY);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    ctx.doc.text('Payback Period', col2X, ctx.y);
    ctx.y += 8;
    ctx.doc.setFontSize(20);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.TEXT_DARK);
    ctx.doc.text(results.costBenefit.paybackPeriodYears !== null ? `${results.costBenefit.paybackPeriodYears} years` : 'N/A', col2X, ctx.y);
    ctx.y += 12;
    
    ctx.doc.setFontSize(FONT_SIZES.BODY);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    ctx.doc.text('Total Estimated Cost', col2X, ctx.y);
    ctx.y += 8;
    ctx.doc.setFontSize(20);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.TEXT_DARK);
    ctx.doc.text(`₹${results.costEstimateInr.toLocaleString('en-IN')}`, col2X, ctx.y);

    const col2EndY = ctx.y + 8;

    ctx.y = Math.max(col1EndY, col2EndY);
};

const drawStructures = (ctx: PdfContext, structures: RecommendedStructure[]) => {
    if (structures.length === 0) {
        ctx.doc.setFont('helvetica', 'normal');
        ctx.doc.setFontSize(FONT_SIZES.BODY);
        ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
        ctx.doc.text('No recharge structure is needed or feasible based on the calculated runoff volume and available space.', MARGIN, ctx.y);
        ctx.y += 10;
        return;
    }

    structures.forEach(s => {
        checkPageBreak(ctx, 40);
        ctx.doc.setFillColor( '#F9FAFB' ); // gray-50
        ctx.doc.setDrawColor(COLORS.BORDER);
        ctx.doc.roundedRect(MARGIN, ctx.y, ctx.pageWidth - MARGIN * 2, 35, 3, 3, 'FD');

        const contentX = MARGIN + 5;
        let contentY = ctx.y + 10;

        ctx.doc.setFontSize(FONT_SIZES.H2);
        ctx.doc.setFont('helvetica', 'bold');
        ctx.doc.setTextColor(COLORS.TEXT_DARK);
        const title = `${s.count && s.count > 1 ? `${s.count} x ` : ''}${s.type.charAt(0).toUpperCase() + s.type.slice(1)}`;
        ctx.doc.text(title, contentX, contentY);

        ctx.doc.setFontSize(FONT_SIZES.BODY);
        ctx.doc.setFont('helvetica', 'normal');
        ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
        ctx.doc.text(`Total Recharge Capacity:`, contentX, contentY + 8);
        ctx.doc.setFont('helvetica', 'bold');
        ctx.doc.setTextColor(COLORS.TEXT_DARK);
        ctx.doc.text(`${s.volumeM3} m³`, contentX + 45, contentY + 8);
        
        const dimX = ctx.pageWidth / 2;
        ctx.doc.setFont('helvetica', 'bold');
        ctx.doc.setTextColor(COLORS.TEXT_DARK);
        ctx.doc.text('Recommended Dimensions:', dimX, contentY);

        let dims: string[] = [];
        if (s.type === 'pit') dims = [`Area: ${s.dimensions.areaM2} m²`, `Depth: ${s.dimensions.depthM} m`];
        if (s.type === 'trench') dims = [`Length: ${s.dimensions.lengthM} m`, `Width: ${s.dimensions.widthM} m`, `Depth: ${s.dimensions.depthM} m`];
        if (s.type === 'shaft') dims = [`Top Area: ${s.dimensions.areaM2} m²`, `Shaft Depth: ${s.dimensions.depthM} m`];
        
        ctx.doc.setFont('helvetica', 'normal');
        ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
        dims.forEach((dim, i) => {
            if (dim.includes('undefined')) return;
            ctx.doc.text(`• ${dim}`, dimX, contentY + 8 + (i * 6));
        });

        ctx.y += 45; // Height of card + margin
    });
};

const drawAquiferInfo = (ctx: PdfContext, results: AssessmentResult) => {
    checkPageBreak(ctx, 40);
    const textOptions: TextOptionsLight = {
        maxWidth: ctx.pageWidth - MARGIN * 2,
        align: 'justify'
    };
    
    ctx.doc.setFontSize(FONT_SIZES.BODY);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    ctx.doc.text('Avg. Depth to Water:', MARGIN, ctx.y);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.TEXT_DARK);
    ctx.doc.text(`${results.depthToGroundwaterM?.toFixed(1) ?? 'N/A'} m`, MARGIN + 42, ctx.y);
    ctx.y += 8;

    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    const splitNote = ctx.doc.splitTextToSize(results.aquiferNote, textOptions.maxWidth || 0);
    ctx.doc.text(splitNote, MARGIN, ctx.y, textOptions);
    ctx.y += (splitNote.length * 4) + 5;
};


// --- MAIN EXPORTED FUNCTION ---

export const generateReportPdf = async (results: AssessmentResult) => {
    const { jsPDF: JSPDF } = window.jspdf;

    const ctx: PdfContext = {
        doc: new JSPDF({ unit: 'mm', format: 'a4' }),
        pageWidth: 0,
        pageHeight: 0,
        currentPage: 1,
        y: 0,
    };
    ctx.pageWidth = ctx.doc.internal.pageSize.getWidth();
    ctx.pageHeight = ctx.doc.internal.pageSize.getHeight();

    // --- PAGE 1 ---
    addPageHeader(ctx);
    ctx.y = MARGIN + 15;

    // Report Title
    ctx.doc.setFontSize(FONT_SIZES.TITLE);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(COLORS.TEXT_DARK);
    ctx.doc.text('Rooftop Rainwater Harvesting Potential Report', ctx.pageWidth / 2, ctx.y, { align: 'center' });
    ctx.y += 8;
    ctx.doc.setFontSize(FONT_SIZES.BODY);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(COLORS.TEXT_LIGHT);
    ctx.doc.text(`For your selected area: ${results.locationName}`, ctx.pageWidth / 2, ctx.y, { align: 'center' });
    ctx.y += 15;
    
    // Feasibility
    drawFeasibilityBanner(ctx, results.feasibility);
    
    // Key Metrics
    drawKeyMetrics(ctx, results);
    
    // Recommended Structures
    drawSectionHeader(ctx, 'Recommended Recharge Unit(s)');
    drawStructures(ctx, results.recommendedStructures);

    // Aquifer Info
    drawSectionHeader(ctx, 'Local Aquifer & Groundwater Data');
    drawAquiferInfo(ctx, results);

    // Finalize
    addPageFooter(ctx);
    ctx.doc.save('Sawan-RTRWH-Planner-Report.pdf');
};
