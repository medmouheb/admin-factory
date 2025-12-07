// NEW TICKET PDF GENERATION FUNCTION
// Replace the existing generateTicketPDF function in coming-soon.tsx with this code

const generateTicketPDF = (ticketCode: string) => {
  const doc = new jsPDF({ unit: 'cm', format: [5, 5] });

  // Add rounded border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.03);
  doc.roundedRect(0.15, 0.15, 4.7, 4.7, 0.15, 0.15);

  let y = 0.45;

  // Header: tesca and SK
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('tesca', 0.35, y);
  
  const hu = paginatedTickets[0]?.hu || 'SK';
  const skWidth = doc.getTextWidth(hu);
  doc.text(hu, 4.65 - skWidth, y);
  y += 0.5;

  // Part Number (learPN)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const learPN = paginatedTickets[0]?.learPN || "";
  doc.text(learPN, 0.35, y);
  y += 0.3;

  // Horizontal line after part number
  doc.setLineWidth(0.01);
  doc.line(0.35, y, 4.65, y);
  y += 0.5;

  // Barcode
  const canvas1 = document.createElement('canvas');
  if (ticketCode) {
    JsBarcode(canvas1, ticketCode, {
      format: 'CODE128',
      width: 1,
      height: 30,
      displayValue: false,
      margin: 0,
    });
    doc.addImage(canvas1.toDataURL('image/png'), 'PNG', 0.35, y, 4.3, 1.2);
  }
  y += 1.3;

  // Barcode text (centered)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const barcodeText = ticketCode || '';
  const barcodeTextWidth = doc.getTextWidth(barcodeText);
  doc.text(barcodeText, (5 - barcodeTextWidth) / 2, y);
  y += 0.6;

  // Operator (centered)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const operText = `Oper: ${auth.user?.matricule || ''}`;
  const operWidth = doc.getTextWidth(operText);
  doc.text(operText, (5 - operWidth) / 2, y);
  y += 0.4;

  // Quantity (centered)
  const quantity = paginatedTickets[0]?.quantity || 1;
  const qtyText = `Qty: ${quantity}`;
  const qtyWidth = doc.getTextWidth(qtyText);
  doc.text(qtyText, (5 - qtyWidth) / 2, y);
  y += 0.4;

  // Horizontal line before date/time
  doc.setLineWidth(0.01);
  doc.line(0.35, y, 4.65, y);
  y += 0.3;

  // Date & Time (centered)
  const now = new Date();
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const dateTimeText = `Date: ${now.toLocaleDateString()} Time: ${now.toLocaleTimeString()}`;
  const dateTimeWidth = doc.getTextWidth(dateTimeText);
  doc.text(dateTimeText, (5 - dateTimeWidth) / 2, y);

  // Print
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 10000);
    }, 100);
  };
};
