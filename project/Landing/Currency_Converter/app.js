// API Key and Base URL
const API_KEY = "4c835ab4180bdcd9db2695b2";
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/`;

// DOM Elements
const fromCurrencySelect = document.getElementById("from");
const toCurrencySelect = document.getElementById("to");
const amountInput = document.getElementById("amount");
const resultContainer = document.createElement("div");
resultContainer.id = "result-container"; // Add ID for styling
const fromFlag = document.getElementById("from-flag");
const toFlag = document.getElementById("to-flag");
const form = document.querySelector("form");

// Create a wrapper div for better organization
const contentWrapper = document.createElement("div");
contentWrapper.className = "content-wrapper";
form.parentNode.insertBefore(contentWrapper, form);
contentWrapper.appendChild(form);
contentWrapper.appendChild(resultContainer);

// Fetch currency list and populate select elements
async function populateCurrencyOptions() {
    try {
        const response = await fetch(`${API_URL}USD`);
        const data = await response.json();

        if (data.result === "success") {
            const currencies = Object.keys(data.conversion_rates);
            currencies.forEach((currency) => {
                const optionFrom = document.createElement("option");
                optionFrom.value = currency;
                optionFrom.textContent = currency;
                fromCurrencySelect.appendChild(optionFrom);

                const optionTo = document.createElement("option");
                optionTo.value = currency;
                optionTo.textContent = currency;
                toCurrencySelect.appendChild(optionTo);
            });

            // Set default selections
            fromCurrencySelect.value = "USD";
            toCurrencySelect.value = "INR";
            updateFlags();
        }
    } catch (error) {
        showErrorMessage("Error loading currency options.");
    }
}

// Update flag images based on selected currencies
function updateFlags() {
    const fromCurrencyCode = fromCurrencySelect.value.slice(0, 2);
    const toCurrencyCode = toCurrencySelect.value.slice(0, 2);

    fromFlag.src = `https://flagsapi.com/${fromCurrencyCode}/flat/64.png`;
    toFlag.src = `https://flagsapi.com/${toCurrencyCode}/flat/64.png`;
}

// Fetch and display the exchange rate
async function getExchangeRate(fromCurrency, toCurrency) {
    try {
        showLoadingState();
        const response = await fetch(`${API_URL}${fromCurrency}`);
        const data = await response.json();

        if (data.result === "success") {
            const exchangeRate = data.conversion_rates[toCurrency];
            const amount = parseFloat(amountInput.value);

            if (isNaN(amount) || amount <= 0) {
                showErrorMessage("Please enter a valid amount.");
                return;
            }

            const convertedAmount = (amount * exchangeRate).toFixed(2);
            displayResult(fromCurrency, toCurrency, exchangeRate, convertedAmount);
        } else {
            showErrorMessage("Unable to fetch exchange rate. Please try again later.");
        }
    } catch (error) {
        showErrorMessage("An error occurred. Please check your internet connection.");
    }
}

// Show loading state
function showLoadingState() {
    resultContainer.innerHTML = `
        <div class="result-box">
            <p>Loading exchange rates...</p>
        </div>
    `;
}

// Display the result in the container
function displayResult(fromCurrency, toCurrency, exchangeRate, convertedAmount) {
    resultContainer.innerHTML = `
        <div class="result-box">
            <h3>Exchange Rate & Conversion Result</h3>
            <p>1 ${fromCurrency} = ${exchangeRate} ${toCurrency}</p>
            <p>Converted Amount: <strong>${convertedAmount} ${toCurrency}</strong></p>
        </div>
    `;
    
    // Scroll result into view smoothly
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show error message
function showErrorMessage(message) {
    resultContainer.innerHTML = `
        <div class="result-box error">
            <p>${message}</p>
        </div>
    `;
}

// Validate input amount
function validateAmount(amount) {
    return !isNaN(amount) && amount > 0;
}

// Form submission event handler
form.addEventListener("submit", (event) => {
    event.preventDefault();
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const amount = parseFloat(amountInput.value);

    if (!validateAmount(amount)) {
        showErrorMessage("Please enter a valid amount.");
        return;
    }

    if (fromCurrency === toCurrency) {
        showErrorMessage("Please select different currencies for conversion.");
        return;
    }

    getExchangeRate(fromCurrency, toCurrency);
});

// Update flags on currency selection change
fromCurrencySelect.addEventListener("change", updateFlags);
toCurrencySelect.addEventListener("change", updateFlags);

// Load currency list on page load
populateCurrencyOptions();

// Add this at the beginning of your initialization code
function initializeCurrencyConverter() {
    // Check if there's an amount to convert from expense tracker
    const amountToConvert = localStorage.getItem('amountToConvert');
    if (amountToConvert) {
        document.getElementById('amount').value = amountToConvert;
        // Clear the stored amount
        localStorage.removeItem('amountToConvert');
    }

    // Check if there's a 'from' currency parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const fromCurrency = urlParams.get('from');
    if (fromCurrency) {
        fromCurrencySelect.value = fromCurrency;
        updateFlags();
    }
}

// Call this function after your existing initialization code
initializeCurrencyConverter();

// Add this function after your existing code
function swapCurrencies() {
    // Store current values
    const fromValue = fromCurrencySelect.value;
    const toValue = toCurrencySelect.value;
    
    // Swap values
    fromCurrencySelect.value = toValue;
    toCurrencySelect.value = fromValue;
    
    // Update flags
    updateFlags();
    
    // If there's an amount entered, automatically convert
    const amount = parseFloat(amountInput.value);
    if (amount > 0) {
        getExchangeRate(toValue, fromValue);
    }
}

// Add event listener to the swap button
document.querySelector('.fa-right-left').parentElement.addEventListener('click', function(e) {
    e.preventDefault();
    // Add animation class
    this.classList.add('rotate-animation');
    
    // Remove animation class after animation completes
    setTimeout(() => {
        this.classList.remove('rotate-animation');
    }, 500);
    
    swapCurrencies();
});