/* ==============================================
   Monthly Budget Calculator – script.js
   ============================================== */

// --------- Elements ----------
const incomeEl    = document.getElementById('income');
const addBtn      = document.getElementById('add-expense');
const expensesEl  = document.getElementById('expenses');
const totalEl     = document.getElementById('total');
const balanceEl   = document.getElementById('balance');
const exportCsvBtn= document.getElementById('export-csv');
const exportJsonBtn=document.getElementById('export-json');
const clearBtn    = document.getElementById('clear-data');

// --------- Chart.js Setup ----------
const ctx = document.getElementById('chart').getContext('2d');
let budgetChart = new Chart(ctx, {
  type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  options: { plugins: { legend: { position: 'right' } } },
  
});

// --------- Helpers ----------
const STORAGE_KEY = 'monthlyBudget_v1';

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function randomColor(i) {
  // pastel colors based on index
  return `hsl(${(i * 50) % 360}, 70%, 70%)`;
}

// Create one expense row
function createExpenseRow(category = '', amount = '') {
  const row = document.createElement('div');
  row.className = 'expense-row';

  const catInput = document.createElement('input');
  catInput.type = 'text';
  catInput.placeholder = 'Category';
  catInput.value = category;
  catInput.className = 'category';

  const amtInput = document.createElement('input');
  amtInput.type = 'number';
  amtInput.step = '0.01';
  amtInput.placeholder = 'Amount';
  amtInput.value = amount;
  amtInput.className = 'amount';

  const delBtn = document.createElement('button');
  delBtn.textContent = 'Remove';
  delBtn.className = 'remove-expense';

  // Events
  catInput.addEventListener('input', updateAll);
  amtInput.addEventListener('input', updateAll);
  delBtn.addEventListener('click', () => {
    row.remove();
    updateAll();
  });

  row.append(catInput, amtInput, delBtn);
  expensesEl.appendChild(row);
}

// Gather all expenses from DOM
function getExpenses() {
  return Array.from(expensesEl.querySelectorAll('.expense-row')).map(row => ({
    category: row.querySelector('.category').value.trim() || 'Unnamed',
    amount: parseFloat(row.querySelector('.amount').value) || 0
  }));
}

// Main calculation
function updateAll() {
  const income = parseFloat(incomeEl.value) || 0;
  const expenses = getExpenses();
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = income - total;

  totalEl.textContent = formatMoney(total);
  balanceEl.textContent = formatMoney(balance);

  // Update chart
  budgetChart.data.labels = expenses.map(e => e.category);
  budgetChart.data.datasets[0].data = expenses.map(e => e.amount);
  budgetChart.data.datasets[0].backgroundColor =
    expenses.map((_, i) => randomColor(i));
  budgetChart.update();

  saveData();
}

// Save to localStorage
function saveData() {
  const data = {
    income: parseFloat(incomeEl.value) || 0,
    expenses: getExpenses(),
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Load from localStorage
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    incomeEl.value = data.income || '';
    expensesEl.innerHTML = '';
    (data.expenses || []).forEach(e => createExpenseRow(e.category, e.amount));
    updateAll();
  } catch (err) {
    console.error('Error loading saved data:', err);
  }
}

// Export CSV
function exportCSV() {
  const income = parseFloat(incomeEl.value) || 0;
  const expenses = getExpenses();
  let csv = 'Category,Amount\n';
  expenses.forEach(e => {
    csv += `"${e.category.replace(/"/g, '""')}",${e.amount.toFixed(2)}\n`;
  });
  csv += `Total,${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}\n`;
  csv += `Income,${income.toFixed(2)}\n`;
  downloadFile(csv, `budget-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
}

// Export JSON
function exportJSON() {
  const data = localStorage.getItem(STORAGE_KEY) || '{}';
  downloadFile(data, `budget-${new Date().toISOString().slice(0,10)}.json`, 'application/json');
}

// Helper to trigger file download
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --------- Event Listeners ----------
addBtn.addEventListener('click', () => createExpenseRow());
incomeEl.addEventListener('input', updateAll);
exportCsvBtn.addEventListener('click', exportCSV);
exportJsonBtn.addEventListener('click', exportJSON);
clearBtn.addEventListener('click', () => {
  if (confirm('Clear all data?')) {
    localStorage.removeItem(STORAGE_KEY);
    incomeEl.value = '';
    expensesEl.innerHTML = '';
    updateAll();
  }
});

// --------- Init ----------
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  // Provide a couple of starter rows if empty
  if (!expensesEl.children.length) {
    createExpenseRow('Food', '');
    createExpenseRow('Rent', '');
  }
  updateAll();
});
