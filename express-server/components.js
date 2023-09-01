function formatAccountToHTMLComponent(data) {
  let positionsHTML = `<table class="positions-table">
      <thead>
        <tr>
          <th>Instrument</th>
          <th>Size</th>
          <th>Net Side</th>
        </tr>
      </thead>
      <tbody>`;

  data.positions.forEach((position) => {
    const sizeValue =
      Number(position.value.m) / 10 ** Number(position.value.exp);
    const netSide = Number(position.value.m) > 0 ? "LONG" : "SHORT";
    const netSideClass = netSide.toLowerCase();

    if (Math.abs(Number(position.value.m)) > 0) {
      positionsHTML += `
            <tr class="${netSideClass}">
              <td>${position.key}</td>
              <td>${sizeValue}</td>
              <td>${netSide}</td>
            </tr>
          `;
    }
  });

  positionsHTML += `</tbody></table>`;

  const health =
    Number(data.portfolioValue) /
    (Number(data.ordersRisk) + Number(data.positionRisk));

  const healthStatus =
    health > 2
      ? "Very Healthy"
      : health > 1.5
      ? "Healthy"
      : health > 1
      ? "Risk of becoming Un-Healthy"
      : health > 0.5
      ? "Un-healthy, please reduce your risk"
      : "Liquidatable";

  return `
      <div hx-post="http://localhost:3000/account-info" hx-trigger="every 1s" hx-target="#account-info">
      <div class='account-details'>
      <h2>Positions</h2>
      ${positionsHTML}
      </div>
      <div class='account-details'>
        <h2>Account Details</h2>
        <ul>
          <li>Account Value: $${formatToUsd(data.portfolioValue)} USDC</li>
          <li>Open Positions Value: $${formatToUsd(data.positionValue)} USDC</li>
          <li>Net Cash (Excess Margin): $${formatToUsd(
            data.excessMargin
          )} USDC</li>
          <li>All-time PnL: $${formatToUsd(data.pnl)} USDC</li>
          <li>All-time Deposits: $${formatToUsd(data.deposited)} USDC</li>
          <li>Positions Risk: $${formatToUsd(data.positionRisk)} USDC</li>
          <li>Orders Risk: $${formatToUsd(data.ordersRisk)} USDC</li>
          <li>Account Health: ${formatToUsd(health)} (${healthStatus})</li>
          <li>Excess Margin Exclude Orders: ${
            data.excessMarginExcludeOrders
          }</li>
          <li>Last Update: ${new Date(data.lastUpdate).toLocaleString()}</li>
        </ul>
        </div>
      </div>
      `;
}

function formatToUsd(value) {
  const n = Number(value);
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

module.exports = { formatAccountToHTMLComponent };
