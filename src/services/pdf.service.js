const PDFDocument = require('pdfkit');
const { logger } = require('../config/logger');

function formatCurrency(amount) {
  const absAmount = Math.abs(amount);
  return `Rs.${absAmount.toFixed(4)}`; // Use "Rs." instead of ₹ symbol
}

function formatDate(date) {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';

    const pad = (num) => String(num).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    logger.error('Error formatting date:', { date, error });
    return 'N/A';
  }
}

async function generateTransactionPDF(transactions, walletId) {
  logger.info('Generating PDF with transactions:', {
    transactionDates: transactions.map((t) => ({ date: t.date, formatted: formatDate(t.date) })),
  });
  const doc = new PDFDocument({
    margin: 50,
    font: 'Helvetica', // Use Helvetica which has better Unicode support
  });

  try {
    doc.fontSize(24).text('Transaction Statement', { align: 'center' }).moveDown(2);

    doc
      .fontSize(12)
      .text(`Wallet ID: ${walletId}`)
      .moveDown(0.5)
      .text(`Date: ${formatDate(new Date())}`)
      .moveDown(2);

    const startX = 50;
    const pageWidth = doc.page.width - 100;
    const columns = {
      date: { width: pageWidth * 0.25, align: 'left' },
      type: { width: pageWidth * 0.15, align: 'center' },
      description: { width: pageWidth * 0.25, align: 'left' },
      amount: { width: pageWidth * 0.175, align: 'right' },
      balance: { width: pageWidth * 0.175, align: 'right' },
    };

    const headerHeight = 25;
    doc.fontSize(10).rect(startX, doc.y, pageWidth, headerHeight).fill('#e6e6e6');

    const headerY = doc.y - headerHeight;
    let currentX = startX;

    doc.fillColor('black');
    Object.entries(columns).forEach(([key, col]) => {
      const text = key.charAt(0).toUpperCase() + key.slice(1);
      doc.text(text, currentX + 5, headerY + 7, {
        width: col.width - 10,
        align: col.align,
      });
      currentX += col.width;
    });

    doc.moveDown();

    let rowY = doc.y;
    const rowHeight = 22;

    transactions.forEach((transaction, index) => {
      if (index % 2 === 0) {
        doc.rect(startX, rowY, pageWidth, rowHeight).fill('#f7f7f7');
      }

      currentX = startX;
      doc.fillColor('black').fontSize(9);

      doc.text(formatDate(transaction.date), currentX + 5, rowY + 6, {
        width: columns.date.width - 10,
        align: columns.date.align,
      });
      currentX += columns.date.width;

      doc.text(transaction.type, currentX + 5, rowY + 6, {
        width: columns.type.width - 10,
        align: columns.type.align,
      });
      currentX += columns.type.width;

      doc.text(transaction.description, currentX + 5, rowY + 6, {
        width: columns.description.width - 10,
        align: columns.description.align,
      });
      currentX += columns.description.width;

      const amountText =
        transaction.type === 'CREDIT'
          ? `+ ${formatCurrency(Math.abs(transaction.amount))}`
          : `- ${formatCurrency(Math.abs(transaction.amount))}`;
      doc
        .fillColor(transaction.type === 'CREDIT' ? 'green' : 'red')
        .text(amountText, currentX + 5, rowY + 6, {
          width: columns.amount.width - 10,
          align: columns.amount.align,
        });
      currentX += columns.amount.width;

      doc.fillColor('black').text(formatCurrency(transaction.balance), currentX + 5, rowY + 6, {
        width: columns.balance.width - 10,
        align: columns.balance.align,
      });

      rowY += rowHeight;

      if (rowY > doc.page.height - 50) {
        doc.addPage();
        rowY = 50;
      }
    });

    doc.moveDown(2).fontSize(12).text('End of Statement', { align: 'center' });

    return doc;
  } catch (error) {
    logger.error('Error generating PDF:', error);
    throw error;
  }
}

module.exports = {
  generateTransactionPDF,
};
