function reportTotals({totals}) {
  totals.sort((a, b) => (b.values[0] - a.values[0]));
  let text = "What you've spent so far this month:\n";
  text += totals.filter(item => (
    item.values[0] > 0
  )).map(item => {
    return `${item.category}: $${item.values[0]}`;
  }).join("\n");
  return text;
}

function confirmExpense({totals, expense}) {
  const { amount, category } = expense;
  const totalForCategory = totals.find(item => item.category === category);
  const previousTotal = totalForCategory && Number(totalForCategory.values[0]) || 0;
  const total = previousTotal + Number(amount);
  const text = `You've spent $${total} so far this month on ${category}`;
  return text;
}

module.exports = {
  confirmExpense,
  reportTotals,
};
