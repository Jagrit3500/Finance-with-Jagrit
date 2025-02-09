let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let chart = null;
let monthlyIncome = parseFloat(localStorage.getItem('monthlyIncome')) || 0;

// Add a mapping for category icons
const categoryIcons = {
    'Food': '🍽️',
    'Transport': '🚗',
    'Entertainment': '🎮',
    'Shopping': '🛍️',
    'Bills': '📃',
    'Other': '📌'
};

// Initialize the application
function init() {
    updateUI();
    createChart();
    updateIncomeDisplay();
}

// Add new expense
document.getElementById('expense-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const expense = {
        id: Date.now(),
        name: document.getElementById('expense-name').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value,
        date: new Date().toLocaleDateString()
    };

    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    this.reset();
    updateUI();
});

// Update UI elements
function updateUI() {
    updateExpensesList();
    updateTotalAmount();
    updateChart();
    updateSummaryStats();
}

// Update the displayAmount function to format amounts in INR
function formatToINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Update expenses list
function updateExpensesList() {
    const expensesTable = document.getElementById('expenses-table');
    expensesTable.innerHTML = '';

    expenses.slice().reverse().forEach(expense => {
        const expenseElement = document.createElement('div');
        expenseElement.className = 'expense-item';
        expenseElement.innerHTML = `
            <div>${expense.name}</div>
            <div>${formatToINR(expense.amount)}</div>
            <div>${categoryIcons[expense.category]} ${expense.category}</div>
            <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        expensesTable.appendChild(expenseElement);
    });
}

// Delete expense
function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateUI();
}

// Update total amount
function updateTotalAmount() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('total-amount').textContent = formatToINR(total);
}

// Create chart
function createChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#fff'
                    }
                }
            }
        }
    });
}

// Update chart
function updateChart() {
    const categoryTotals = {};
    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    if (chart) {
        chart.data.labels = Object.keys(categoryTotals).map(category => 
            `${categoryIcons[category]} ${category}`
        );
        chart.data.datasets[0].data = Object.values(categoryTotals);
        chart.update();
    }
}

// Calculate and update summary statistics
function updateSummaryStats() {
    // Get current month's expenses
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
    });
    
    // Calculate monthly total
    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('month-total').textContent = formatToINR(monthlyTotal);
    
    // Find highest single expense
    if (expenses.length > 0) {
        const highestExpense = expenses.reduce((max, expense) => 
            expense.amount > max.amount ? expense : max
        );
        document.getElementById('highest-expense').textContent = formatToINR(highestExpense.amount);
        document.getElementById('highest-category').textContent = highestExpense.category;
    }
    
    // Calculate top spending category
    const categoryTotals = {};
    const totalSpent = expenses.reduce((sum, expense) => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        return sum + expense.amount;
    }, 0);
    
    if (totalSpent > 0) {
        const topCategory = Object.entries(categoryTotals)
            .reduce((max, [category, amount]) => 
                amount > (categoryTotals[max] || 0) ? category : max
            );
        
        const percentage = ((categoryTotals[topCategory] / totalSpent) * 100).toFixed(1);
        document.getElementById('top-category').textContent = `${categoryIcons[topCategory]} ${topCategory}`;
        document.getElementById('category-percentage').textContent = `${percentage}% of total`;
    }
    
    // Generate spending insights
    generateInsights(monthlyTotal, categoryTotals, totalSpent);
}

// Generate spending insights
function generateInsights(monthlyTotal, categoryTotals, totalSpent) {
    const insights = [];
    
    // Income-based insights
    if (monthlyIncome > 0) {
        const remainingAmount = monthlyIncome - monthlyTotal;
        const savingsRate = ((monthlyIncome - monthlyTotal) / monthlyIncome * 100).toFixed(1);
        
        document.getElementById('remaining-amount').textContent = formatToINR(remainingAmount);
        document.getElementById('savings-rate').textContent = `${savingsRate}%`;
        
        if (monthlyTotal > monthlyIncome) {
            insights.push(`⚠️ Warning: You're spending more than your income this month!`);
        } else if (savingsRate > 20) {
            insights.push(`🎯 Great job! You're saving ${savingsRate}% of your income.`);
        }
        
        // Spending ratio
        const spendingRatio = ((monthlyTotal / monthlyIncome) * 100).toFixed(1);
        insights.push(`💰 You've spent ${spendingRatio}% of your monthly income.`);
    }
    
    // Monthly spending trend
    const previousMonthTotal = calculatePreviousMonthTotal();
    if (previousMonthTotal > 0) {
        const trend = ((monthlyTotal - previousMonthTotal) / previousMonthTotal * 100).toFixed(1);
        if (trend > 0) {
            insights.push(`📈 Your spending this month is up ${trend}% compared to last month.`);
        } else if (trend < 0) {
            insights.push(`📉 Your spending this month is down ${Math.abs(trend)}% compared to last month.`);
        }
    }
    
    // Category-based insights
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a);
    
    if (sortedCategories.length > 1) {
        const [topCategory, topAmount] = sortedCategories[0];
        insights.push(`💡 Your highest spending category is ${categoryIcons[topCategory]} ${topCategory} at ${formatToINR(topAmount)}.`);
    }
    
    // Spending frequency
    if (expenses.length > 0) {
        const daysWithExpenses = new Set(expenses.map(e => e.date)).size;
        const averagePerDay = totalSpent / daysWithExpenses;
        insights.push(`📊 On average, you spend ${formatToINR(averagePerDay)} per day of spending.`);
    }
    
    // Budget warning (using income-based budget)
    if (monthlyIncome > 0) {
        const recommendedBudget = monthlyIncome * 0.8; // 80% of income
        if (monthlyTotal > recommendedBudget) {
            const warningElement = document.getElementById('budget-warning');
            warningElement.innerHTML = `⚠️ You've exceeded the recommended spending limit of ${formatToINR(recommendedBudget)} (80% of income)!`;
            warningElement.classList.add('show');
        } else {
            document.getElementById('budget-warning').classList.remove('show');
        }
    }
    
    // Display insights
    document.getElementById('spending-trends').innerHTML = insights
        .map(insight => `<p>${insight}</p>`)
        .join('');
}

// Calculate previous month's total
function calculatePreviousMonthTotal() {
    const currentDate = new Date();
    const previousMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
    const year = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    return expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === previousMonth && 
                   expenseDate.getFullYear() === year;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
}

// Initialize the app
init();

// Update the convert button event listener
document.getElementById('convert-currency').addEventListener('click', function() {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    // Store the amount in localStorage to access it in the currency converter
    localStorage.setItem('amountToConvert', totalAmount);
    // Fix the path to point to the Currency Converter
    window.location.href = '../../Landing/Currency_Converter/CurrencyConverter_Index.html?from=INR';
});

// Add this after other event listeners
document.getElementById('save-income').addEventListener('click', function() {
    const incomeInput = document.getElementById('monthly-income');
    const income = parseFloat(incomeInput.value);
    
    if (income && income > 0) {
        monthlyIncome = income;
        localStorage.setItem('monthlyIncome', income);
        updateIncomeDisplay();
        updateUI();
        incomeInput.value = '';
    }
});

// Add this function
function updateIncomeDisplay() {
    document.getElementById('income-amount').textContent = formatToINR(monthlyIncome);
}

// Reset functionality
function resetAllData() {
    // Clear all data from localStorage
    localStorage.removeItem('expenses');
    localStorage.removeItem('monthlyIncome');
    
    // Reset variables
    expenses = [];
    monthlyIncome = 0;
    
    // Reset UI
    updateUI();
    updateIncomeDisplay();
    
    // Reset form fields
    document.getElementById('monthly-income').value = '';
    document.getElementById('expense-form').reset();
    
    // Show success message
    showResetSuccessMessage();
}

function showResetSuccessMessage() {
    const warningElement = document.getElementById('budget-warning');
    warningElement.innerHTML = `✅ All data has been successfully reset!`;
    warningElement.style.background = 'rgba(0, 255, 136, 0.1)';
    warningElement.style.borderLeft = '4px solid #00ff88';
    warningElement.classList.add('show');
    
    // Hide the success message after 3 seconds
    setTimeout(() => {
        warningElement.classList.remove('show');
        // Reset the warning styles
        warningElement.style.background = 'rgba(255, 87, 87, 0.1)';
        warningElement.style.borderLeft = '4px solid #ff5757';
    }, 3000);
}

// Modal handling
const modal = document.getElementById('reset-modal');
const resetBtn = document.getElementById('reset-button');
const confirmResetBtn = document.getElementById('confirm-reset');
const cancelResetBtn = document.getElementById('cancel-reset');

resetBtn.addEventListener('click', () => {
    modal.classList.add('show');
});

confirmResetBtn.addEventListener('click', () => {
    resetAllData();
    modal.classList.remove('show');
});

cancelResetBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        modal.classList.remove('show');
    }
}); 