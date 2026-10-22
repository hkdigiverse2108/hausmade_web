import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Robust extractors for both Online and Offline order schemas
const getCustomerName = (order) => {
  return order.shippingAddress?.fullName || order.customerName || 'N/A';
};

const getCustomerPhone = (order) => {
  return order.shippingAddress?.phone || order.customerPhone || 'N/A';
};

const getCustomerEmail = (order) => {
  return order.shippingAddress?.email || order.customerEmail || 'N/A';
};

const getAddressStr = (order) => {
  const addr = order.shippingAddress || {};
  const street = addr.address || order.address || '';
  const city = addr.city || order.city || '';
  const state = addr.state || order.state || '';
  const pincode = addr.pincode || order.pincode || '';
  return [street, city, state, pincode].filter(Boolean).join(', ') || 'N/A';
};

const getItemsSummaryStr = (order) => {
  if (order.cartItems && order.cartItems.length > 0) {
    return order.cartItems
      .map(item => `${item.title || 'Soap'} (x${item.quantity || 1})`)
      .join(', ');
  }
  if (order.numberOfSoaps) {
    return `Hausmade Kesar Soap (x${order.numberOfSoaps})`;
  }
  return 'Hausmade Kesar Soap';
};

const getTotalQty = (order) => {
  if (order.cartItems && order.cartItems.length > 0) {
    return order.cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }
  return order.numberOfSoaps || 1;
};

const getTotalAmount = (order) => {
  const val = order.grandTotal !== undefined ? order.grandTotal : (order.totalPrice !== undefined ? order.totalPrice : order.total_amount);
  return parseFloat(val) || 0;
};

const formatDateStr = (dateVal) => {
  if (!dateVal) return 'N/A';
  // Backend timestamps are UTC (often without 'Z') — show them in IST
  let parseStr = String(dateVal);
  if (!parseStr.endsWith('Z') && !parseStr.includes('+')) parseStr += 'Z';
  const d = new Date(parseStr);
  if (isNaN(d.getTime())) return String(dateVal);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map(({ type, value }) => [type, value])
  );
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
};

const getShipmentStatusStr = (order) => {
  if (order.status === 'cancelled' || order.fulfillment?.status?.toLowerCase() === 'cancelled') {
    return 'Cancelled';
  }
  const rawStatus = (order.fulfillment?.status || '').toLowerCase();
  if (order.fulfillment?.awb && (rawStatus.includes('rto') || rawStatus.includes('return'))) {
    return (rawStatus.includes('delivered') || rawStatus.includes('returned')) ? 'Returned to Origin' : 'RTO - In transit';
  }
  if (order.status === 'delivered' || rawStatus === 'delivered' || order.status === 'Delivered') {
    return 'Delivered';
  }
  if (!order.fulfillment || !order.fulfillment.awb) {
    return order.isOffline ? (order.status || 'Delivered') : 'Unfulfilled';
  }
  if (rawStatus.includes('delivered')) return 'Delivered';
  if (rawStatus.includes('out for delivery') || rawStatus.includes('transit') || rawStatus.includes('dispatched') || rawStatus.includes('shipped') || rawStatus.includes('in-transit')) return 'In transit';
  if (order.fulfillment.pickup_scheduled || rawStatus.includes('pickup') || rawStatus.includes('scheduled')) return 'Ready for pickup';
  return 'Ready to ship';
};

export const exportOrdersToExcel = (orders, filterSummary = {}) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const excelRows = orders.map((order, index) => {
    return {
      'S.No': index + 1,
      'Order ID': order.orderId || order._id || 'N/A',
      'Order Date': formatDateStr(order.created_at || order.saleDateTime),
      'Source': order.isOffline ? 'Offline' : 'Online',
      'Customer Name': getCustomerName(order),
      'Phone': getCustomerPhone(order),
      'Email': getCustomerEmail(order),
      'Shipping Address': getAddressStr(order),
      'Items': getItemsSummaryStr(order),
      'Total Items Qty': getTotalQty(order),
      'Payment Method': order.paymentMethod || 'N/A',
      'Order Status': order.status || 'Pending',
      'Shipment Status': getShipmentStatusStr(order),
      'AWB / Tracking No': order.fulfillment?.awb || 'N/A',
      'Total Amount (INR)': getTotalAmount(order),
      'Notes': order.notes || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Auto-fit column widths
  const colWidths = Object.keys(excelRows[0]).map(key => {
    let maxLen = key.length;
    excelRows.forEach(row => {
      const val = row[key] ? String(row[key]) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders Report');

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Hausmade_Orders_Export_${todayStr}.xlsx`);
};

const createHausmadeLogoDataUrl = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw 'Hausmade' serif brand text in high resolution
    ctx.font = 'bold 96px "Fraunces", Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#3A2E26';
    ctx.fillText('Hausmade', 10, 135);
    
    const mainWidth = ctx.measureText('Hausmade').width;
    
    // Draw 'TM' superscript in brand accent color
    ctx.font = 'bold 38px Inter, Arial, sans-serif';
    ctx.fillStyle = '#C97C5D';
    ctx.fillText('TM', 10 + mainWidth + 6, 75);
    
    return canvas.toDataURL('image/png');
  } catch (e) {
    return null;
  }
};

const getOrderCategory = (order) => {
  const isOffline = !!order.isOffline;
  const totalQty = getTotalQty(order);
  const itemsStr = getItemsSummaryStr(order).toLowerCase();
  
  // Check if it's a Combo order (Pack of 2/3/5, Combo, multiple items, or numberOfSoaps > 1)
  const isCombo = 
    order.isCombo || 
    totalQty > 1 || 
    (order.numberOfSoaps && order.numberOfSoaps > 1) ||
    itemsStr.includes('combo') || 
    itemsStr.includes('pack of') || 
    itemsStr.includes('pack-') || 
    itemsStr.includes('pack 2') || 
    itemsStr.includes('pack 3') || 
    itemsStr.includes('pack 5') ||
    (order.cartItems && order.cartItems.length > 1);

  if (isCombo) {
    return isOffline ? 'Offline Combo' : 'Combo';
  }
  return isOffline ? 'Offline' : 'Online';
};

export const exportOrdersToPDF = async (orders, filterSummary = {}) => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Render Hausmade™ brand logo (Enlarged size)
  const logoData = createHausmadeLogoDataUrl();
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 14, 5, 65, 16.25);
    } catch (err) {
      // Fallback text if image add fails
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(58, 46, 38);
      doc.text('Hausmade', 14, 17);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(201, 124, 93);
      doc.text('TM', 68, 12);
    }
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(58, 46, 38);
    doc.text('Hausmade', 14, 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(201, 124, 93);
    doc.text('TM', 68, 12);
  }

  // Date Generated & Summary
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${todayStr}`, 280, 11, { align: 'right' });

  const totalRevenue = orders.reduce((sum, o) => sum + getTotalAmount(o), 0);
  doc.text(`Total Orders: ${orders.length}  |  Total Revenue: Rs. ${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 280, 16, { align: 'right' });

  // Prepare table data
  const tableHead = [['#', 'Order ID', 'Date', 'Source', 'Customer', 'Phone', 'Items', 'Payment', 'Shipment', 'Total (INR)']];
  
  const tableData = orders.map((order, idx) => {
    const totalAmt = getTotalAmount(order).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    
    return [
      idx + 1,
      order.orderId || order._id || 'N/A',
      formatDateStr(order.created_at || order.saleDateTime).split(' ')[0],
      getOrderCategory(order),
      getCustomerName(order),
      getCustomerPhone(order),
      getItemsSummaryStr(order),
      order.paymentMethod || 'N/A',
      getShipmentStatusStr(order),
      `Rs. ${totalAmt}`
    ];
  });

  autoTable(doc, {
    startY: 23,
    head: tableHead,
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      valign: 'middle',
      textColor: [58, 46, 38],
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [58, 46, 38], // #3A2E26
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [253, 251, 247] // #FDFBF7
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },  // #
      1: { cellWidth: 25, fontStyle: 'bold' }, // Order ID
      2: { cellWidth: 18 },                   // Date
      3: { cellWidth: 22 },                   // Source (Category)
      4: { cellWidth: 33, fontStyle: 'bold' }, // Customer
      5: { cellWidth: 23 },                   // Phone
      6: { cellWidth: 60 },                   // Items
      7: { cellWidth: 23 },                   // Payment
      8: { cellWidth: 22 },                   // Shipment
      9: { cellWidth: 28, halign: 'right', fontStyle: 'bold' } // Total
    },
    didParseCell: (data) => {
      // Color-code the Source column (Column index 3)
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw || '');
        if (val.includes('Combo')) {
          // Purple badge style for Combo orders
          data.cell.styles.fillColor = [243, 229, 245]; // Soft Purple #F3E5F5
          data.cell.styles.textColor = [106, 27, 154];  // Rich Purple #6A1B9A
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'center';
        } else if (val.includes('Offline')) {
          // Amber/Orange badge style for Offline orders
          data.cell.styles.fillColor = [255, 243, 224]; // Soft Amber #FFF3E0
          data.cell.styles.textColor = [230, 81, 0];    // Deep Orange #E65100
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'center';
        } else {
          // Green badge style for Online orders
          data.cell.styles.fillColor = [232, 245, 233]; // Soft Green #E8F5E9
          data.cell.styles.textColor = [27, 94, 32];    // Deep Green #1B5E20
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'center';
        }
      }
    },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(str, 280, 202, { align: 'right' });
      doc.text('Hausmade Orders Report - Confidential', 14, 202);
    }
  });

  const fileDateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Hausmade_Orders_Export_${fileDateStr}.pdf`);
};

// ---------------- GST Report ----------------

const gstPeriodLabel = (report) => {
  const fmt = (d) => (d ? d.split('-').reverse().join('/') : '');
  if (report.from && report.to) return `${fmt(report.from)} to ${fmt(report.to)}`;
  if (report.from) return `From ${fmt(report.from)}`;
  if (report.to) return `Up to ${fmt(report.to)}`;
  return 'All dates';
};

const gstFileSuffix = (report) => `${report.from || 'start'}_to_${report.to || 'today'}`;

const formatGstDate = (d) => (d ? d.split('-').reverse().join('/') : '');

export const exportGstReportToExcel = (report) => {
  if (!report || !report.rows || report.rows.length === 0) {
    alert('No GST data available to export.');
    return;
  }
  const header = [
    ['Hausmade - GST Sales Report'],
    [`Seller GSTIN: ${report.sellerGstin || 'N/A'}`, `Seller State: ${report.sellerState || ''}`],
    [`Period: ${gstPeriodLabel(report)}`, `GST Rate: ${report.gstRate}% (inclusive)`],
    []
  ];

  const orderRows = report.rows.map(r => ({
    'Order Date': formatGstDate(r.date),
    'Delivered Date': r.deliveredDate ? formatGstDate(r.deliveredDate) : '-',
    'Order ID': r.orderId,
    'AWB': r.awb,
    'Channel': r.channel,
    'Payment': r.payment || '-',
    'State': r.state,
    'Note': r.source === 'missing' ? 'Delhivery data missing' : '',
    'Taxable (₹)': r.taxable,
    'CGST (₹)': r.cgst,
    'SGST (₹)': r.sgst,
    'IGST (₹)': r.igst,
    'Total GST (₹)': r.gst,
    'Total (₹)': r.total
  }));
  orderRows.push({
    'Order Date': 'TOTAL',
    'Delivered Date': '',
    'Order ID': `${report.totals.orders} orders`,
    'AWB': '',
    'Channel': '',
    'Payment': '',
    'State': '',
    'Note': '',
    'Taxable (₹)': report.totals.taxable,
    'CGST (₹)': report.totals.cgst,
    'SGST (₹)': report.totals.sgst,
    'IGST (₹)': report.totals.igst,
    'Total GST (₹)': report.totals.gst,
    'Total (₹)': report.totals.total
  });

  const stateRows = report.stateSummary.map(s => ({
    'State': s.state,
    'Orders': s.orders,
    'Taxable (₹)': s.taxable,
    'CGST (₹)': s.cgst,
    'SGST (₹)': s.sgst,
    'IGST (₹)': s.igst,
    'Total GST (₹)': s.gst,
    'Total (₹)': s.total
  }));
  stateRows.push({
    'State': 'TOTAL',
    'Orders': report.totals.orders,
    'Taxable (₹)': report.totals.taxable,
    'CGST (₹)': report.totals.cgst,
    'SGST (₹)': report.totals.sgst,
    'IGST (₹)': report.totals.igst,
    'Total GST (₹)': report.totals.gst,
    'Total (₹)': report.totals.total
  });

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.aoa_to_sheet(header);
  XLSX.utils.sheet_add_json(ws1, orderRows, { origin: -1 });
  ws1['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 13 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 13 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Order-wise');

  const ws2 = XLSX.utils.aoa_to_sheet(header);
  XLSX.utils.sheet_add_json(ws2, stateRows, { origin: -1 });
  ws2['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 13 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 13 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'State-wise Summary');

  // Show every amount with 2 digits after the decimal point
  [ws1, ws2].forEach(ws => {
    Object.keys(ws).forEach(addr => {
      if (addr[0] === '!') return;
      const cell = ws[addr];
      const isCount = ws === ws2 && addr.startsWith('B');
      if (cell.t === 'n' && !isCount) cell.z = '0.00';
    });
  });

  XLSX.writeFile(wb, `Hausmade_GST_Report_${gstFileSuffix(report)}.xlsx`);
};

export const exportGstReportToPDF = (report) => {
  if (!report || !report.rows || report.rows.length === 0) {
    alert('No GST data available to export.');
    return;
  }
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const money = (v) => (Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const brand = [58, 46, 38];

  // Hausmade logo (same as the orders PDF), with a text fallback
  const logoData = createHausmadeLogoDataUrl();
  let logoDrawn = false;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 14, 5, 65, 16.25);
      logoDrawn = true;
    } catch (err) {
      logoDrawn = false;
    }
  }
  if (!logoDrawn) {
    doc.setFont('times', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...brand);
    doc.text('Hausmade', 14, 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(201, 124, 93);
    doc.text('TM', 68, 12);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...brand);
  doc.text('GST Sales Report', 14, 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Seller GSTIN: ${report.sellerGstin || 'N/A'}    Seller State: ${report.sellerState || ''}`, 14, 35);
  doc.text(`Period: ${gstPeriodLabel(report)}    GST Rate: ${report.gstRate}% (inclusive)    Orders: ${report.totals.orders}`, 14, 40);

  const t = report.totals;
  autoTable(doc, {
    startY: 45,
    head: [['Order Date', 'Delivered Date', 'Order ID', 'AWB', 'Channel', 'Payment', 'State', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total GST', 'Total']],
    body: report.rows.map(r => [formatGstDate(r.date), r.deliveredDate ? formatGstDate(r.deliveredDate) : '-', r.source === 'missing' ? `${r.orderId} *` : r.orderId, r.awb, r.channel, r.payment || '-', r.state, money(r.taxable), money(r.cgst), money(r.sgst), money(r.igst), money(r.gst), money(r.total)]),
    foot: [['TOTAL', '', `${t.orders} orders`, '', '', '', '', money(t.taxable), money(t.cgst), money(t.sgst), money(t.igst), money(t.gst), money(t.total)]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: brand, textColor: 255 },
    footStyles: { fillColor: [230, 213, 195], textColor: brand, fontStyle: 'bold' },
    columnStyles: { 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' }, 10: { halign: 'right' }, 11: { halign: 'right' }, 12: { halign: 'right' } }
  });

  let y = doc.lastAutoTable.finalY + 10;
  if (y > 180) {
    doc.addPage();
    y = 15;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('State-wise Summary', 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [['State', 'Orders', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total GST', 'Total']],
    body: report.stateSummary.map(s => [s.state, s.orders, money(s.taxable), money(s.cgst), money(s.sgst), money(s.igst), money(s.gst), money(s.total)]),
    foot: [['TOTAL', t.orders, money(t.taxable), money(t.cgst), money(t.sgst), money(t.igst), money(t.gst), money(t.total)]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: brand, textColor: 255 },
    footStyles: { fillColor: [230, 213, 195], textColor: brand, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } }
  });

  doc.save(`Hausmade_GST_Report_${gstFileSuffix(report)}.pdf`);
};
