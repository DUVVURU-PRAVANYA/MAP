import { BusinessInsight, CleanSalesRecord } from '../src/types/analytics.js';

export function generateBusinessInsights(records: CleanSalesRecord[]): BusinessInsight[] {
  if (!records || records.length === 0) {
    return [];
  }

  const insights: BusinessInsight[] = [];
  const totalSales = records.reduce((sum, r) => sum + r.saleValue, 0);

  // 1. Multi-Financial Year YoY Growth Analysis
  const fySalesMap: Record<string, { sales: number; quantity: number; transactions: number }> = {};
  records.forEach(r => {
    const fy = r.financialYear || 'FY Unknown';
    if (!fySalesMap[fy]) {
      fySalesMap[fy] = { sales: 0, quantity: 0, transactions: 0 };
    }
    fySalesMap[fy].sales += r.saleValue;
    fySalesMap[fy].quantity += r.invQty;
    fySalesMap[fy].transactions += 1;
  });

  const sortedFYs = Object.keys(fySalesMap).sort();
  if (sortedFYs.length >= 2) {
    const prevFY = sortedFYs[sortedFYs.length - 2];
    const currFY = sortedFYs[sortedFYs.length - 1];
    const prevSales = fySalesMap[prevFY].sales;
    const currSales = fySalesMap[currFY].sales;

    if (prevSales > 0) {
      const yoyPct = Math.round(((currSales - prevSales) / prevSales) * 100);
      const isGrowth = yoyPct >= 0;

      insights.push({
        id: 'insight-fy-yoy-growth',
        type: isGrowth ? 'growth' : 'decline',
        title: isGrowth ? '📈 Multi-Year Financial Revenue Growth' : '📉 Financial Year Revenue Contraction',
        observation: `Sales ${isGrowth ? 'increased' : 'decreased'} by ${Math.abs(yoyPct)}% in ${currFY} (₹${(currSales / 100000).toFixed(1)} Lakhs) compared with ${prevFY} (₹${(prevSales / 100000).toFixed(1)} Lakhs).`,
        question: `Which specific product segments and customer accounts drove the ${Math.abs(yoyPct)}% performance variance between ${prevFY} and ${currFY}?`,
        severity: isGrowth ? 'success' : 'alert',
        affectedContext: {
          period: currFY,
          salesChangePct: yoyPct,
        },
      });
    }
  }

  // 2. Overall Segment Contribution Analysis
  const segmentSalesMap: Record<string, number> = {};
  records.forEach(r => {
    segmentSalesMap[r.productSegment] = (segmentSalesMap[r.productSegment] || 0) + r.saleValue;
  });

  const sortedSegments = Object.entries(segmentSalesMap).sort((a, b) => b[1] - a[1]);
  if (sortedSegments.length > 0) {
    const [topSegName, topSegSales] = sortedSegments[0];
    const topSegPct = Math.round((topSegSales / totalSales) * 100);

    insights.push({
      id: 'insight-top-segment',
      type: 'top_performer',
      title: '🏆 Leading Product Segment Contribution',
      observation: `The "${topSegName}" segment generates the highest sales value, accounting for ${topSegPct}% (₹${(topSegSales / 100000).toFixed(1)} Lakhs) of total revenue.`,
      question: `How dependent is total business performance on ${topSegName}, and what expansion strategies should be explored across secondary segments?`,
      severity: 'success',
      affectedContext: {
        segment: topSegName,
      },
    });
  }

  // 3. Customer Revenue Concentration Analysis
  const customerSalesMap: Record<string, number> = {};
  records.forEach(r => {
    customerSalesMap[r.customer] = (customerSalesMap[r.customer] || 0) + r.saleValue;
  });

  const sortedCustomers = Object.entries(customerSalesMap).sort((a, b) => b[1] - a[1]);
  if (sortedCustomers.length >= 3) {
    const top5Sales = sortedCustomers.slice(0, 5).reduce((sum, [, val]) => sum + val, 0);
    const top5Pct = Math.round((top5Sales / totalSales) * 100);
    const topCustomer = sortedCustomers[0][0];

    insights.push({
      id: 'insight-customer-concentration',
      type: 'concentration',
      title: '👥 High Customer Revenue Concentration',
      observation: `The top 5 customers account for ${top5Pct}% of total sales value. Key account "${topCustomer}" represents ${Math.round((sortedCustomers[0][1] / totalSales) * 100)}% of overall revenue.`,
      question: `Which customer contracts are due for review, and what trade promotion incentives can minimize customer churn risk in key accounts?`,
      severity: top5Pct > 50 ? 'warning' : 'info',
      affectedContext: {
        customer: topCustomer,
      },
    });
  }

  // 4. Top Material Code Performance
  const productSalesMap: Record<string, { description: string; sales: number; segment: string }> = {};
  records.forEach(r => {
    if (!productSalesMap[r.materialCode]) {
      productSalesMap[r.materialCode] = { description: r.description, sales: 0, segment: r.productSegment };
    }
    productSalesMap[r.materialCode].sales += r.saleValue;
  });

  const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.sales - a.sales);
  if (sortedProducts.length > 0) {
    const topProduct = sortedProducts[0];
    const topProdPct = ((topProduct.sales / totalSales) * 100).toFixed(1);

    insights.push({
      id: 'insight-top-product',
      type: 'top_performer',
      title: '🌟 Top Performing Material Code',
      observation: `"${topProduct.description}" is the highest revenue generating product, bringing in ₹${(topProduct.sales / 100000).toFixed(1)} Lakhs (${topProdPct}% share).`,
      question: `Are inventory stock levels and distribution channels optimized to prevent stockouts for ${topProduct.description}?`,
      severity: 'success',
      affectedContext: {
        product: topProduct.description,
        segment: topProduct.segment,
      },
    });
  }

  // 5. Quarterly Seasonality & Velocity Shifts
  const quarterSalesMap: Record<string, number> = {};
  records.forEach(r => {
    quarterSalesMap[r.quarter] = (quarterSalesMap[r.quarter] || 0) + r.saleValue;
  });

  const quarters = Object.keys(quarterSalesMap).sort();
  if (quarters.length >= 2) {
    const firstQ = quarters[0];
    const lastQ = quarters[quarters.length - 1];
    const firstQVal = quarterSalesMap[firstQ];
    const lastQVal = quarterSalesMap[lastQ];

    if (firstQVal > 0) {
      const pctChange = Math.round(((lastQVal - firstQVal) / firstQVal) * 100);
      const isGrowth = pctChange >= 0;

      insights.push({
        id: 'insight-quarterly-shift',
        type: isGrowth ? 'growth' : 'decline',
        title: isGrowth ? '📈 Quarterly Revenue Acceleration' : '📉 Quarterly Revenue Contraction',
        observation: `Sales ${isGrowth ? 'grew' : 'declined'} by ${Math.abs(pctChange)}% between ${firstQ} (₹${(firstQVal / 100000).toFixed(1)}L) and ${lastQ} (₹${(lastQVal / 100000).toFixed(1)}L).`,
        question: `Which product lines or regional accounts drove the ${Math.abs(pctChange)}% variance in ${lastQ}?`,
        severity: isGrowth ? 'success' : 'alert',
        affectedContext: {
          period: lastQ,
          salesChangePct: pctChange,
        },
      });
    }
  }

  // 6. Lowest Performing Product Segment Alert
  if (sortedSegments.length > 2) {
    const [worstSegName, worstSegSales] = sortedSegments[sortedSegments.length - 1];
    const worstSegPct = ((worstSegSales / totalSales) * 100).toFixed(1);

    insights.push({
      id: 'insight-underperforming-segment',
      type: 'decline',
      title: '⚠ Underperforming Product Segment',
      observation: `The "${worstSegName}" segment generates only ${worstSegPct}% (₹${(worstSegSales / 100000).toFixed(1)} Lakhs) of total sales value.`,
      question: `What targeted pricing, packaging, or promotion support is required to revive sales velocity in ${worstSegName}?`,
      severity: 'warning',
      affectedContext: {
        segment: worstSegName,
      },
    });
  }

  return insights;
}
