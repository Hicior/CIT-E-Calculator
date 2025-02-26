(function() {
    /* ==================================================
       DOM Element References
    ================================================== */
    const DOM = {
        resultsSection: document.getElementById("resultsSection"),
        calculateButton: document.getElementById("calculateButton"),
        grossRevenueInput: document.getElementById("grossRevenue"),
        incomeInput: document.getElementById("income"),
        profitToDistributeInput: document.getElementById("profitToDistribute"),
        estonianCITOutput: document.getElementById("estonianCIT"),
        linearTaxOutput: document.getElementById("linearTax"),
        llcTaxOutput: document.getElementById("llcTax"),
        copySidebar: document.querySelector('.copy-sidebar'),
        sidebarToggle: document.querySelector('.copy-sidebar-toggle'),
        copyButton: document.getElementById('copyValues'),
        copySuccess: document.getElementById('copySuccess')
    };

    /* ==================================================
       Constants
    ================================================== */
    const ESTONIAN_CIT_THRESHOLD = 8569000;
    const INCOME_THRESHOLD = 1000000;
    const HEALTH_INSURANCE_THRESHOLD = 77096.4;

    /* ==================================================
       Utility Functions
    ================================================== */
    function formatPLN(value) {
        return new Intl.NumberFormat("pl-PL", {
            style: "currency",
            currency: "PLN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    }

    function parsePLN(value) {
        return parseFloat(value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0;
    }

    /* ==================================================
       Validation Functions
    ================================================== */
    function validateInput(value, fieldName) {
        const input = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        let isValid = true;

        input.classList.remove("error");
        if (errorElement) {
            errorElement.textContent = "";
            errorElement.classList.remove("visible");
        }

        const numericValue = parsePLN(value);

        if (isNaN(numericValue)) {
            if (errorElement) {
                errorElement.textContent = "Proszę wprowadzić prawidłową kwotę";
            }
            isValid = false;
        } else if (numericValue < 0) {
            if (errorElement) {
                errorElement.textContent = "Kwota nie może być ujemna";
            }
            isValid = false;
        } else if (numericValue > 999999999) {
            if (errorElement) {
                errorElement.textContent = "Kwota jest zbyt duża";
            }
            isValid = false;
        }

        if (!isValid) {
            input.classList.add("error");
            if (errorElement) {
                errorElement.classList.add("visible");
            }
        }

        return isValid;
    }

    function validateValues(grossRevenue, income, profitToDistribute) {
        let isValid = true;
        
        // Check if income is less than or equal to gross revenue
        if (income > grossRevenue) {
            const errorElement = document.getElementById("income-error");
            DOM.incomeInput.classList.add("error");
            errorElement.textContent = "Dochód nie może być większy niż przychód brutto";
            errorElement.classList.add("visible");
            isValid = false;
        }

        // Check if profit to distribute is less than or equal to income
        if (profitToDistribute > income) {
            const errorElement = document.getElementById("profitToDistribute-error");
            DOM.profitToDistributeInput.classList.add("error");
            errorElement.textContent = "Zysk do wypłacenia nie może być większy niż dochód";
            errorElement.classList.add("visible");
            isValid = false;
        }

        return isValid;
    }

    /* ==================================================
       Tax Calculation Functions
    ================================================== */
    function calculateEstonianCIT(grossRevenue, profitToDistribute) {
        return grossRevenue <= ESTONIAN_CIT_THRESHOLD 
            ? profitToDistribute * 0.20 
            : profitToDistribute * 0.25;
    }

    function calculateLinearTax(income) {
        const healthContributionFlatTax = income * 0.049;
        const maxHealthInsuranceDeductionFlatTax = 12900;
        const effectiveHealthInsuranceContributionFlatTax = 
            Math.min(healthContributionFlatTax, maxHealthInsuranceDeductionFlatTax);

        const taxableIncome = income - effectiveHealthInsuranceContributionFlatTax;

        if (taxableIncome > INCOME_THRESHOLD) {
            return (taxableIncome - INCOME_THRESHOLD) * 0.279 + (INCOME_THRESHOLD * 0.239);
        } else if (taxableIncome > HEALTH_INSURANCE_THRESHOLD) {
            return taxableIncome * 0.239;
        } else {
            return taxableIncome > 0 ? 3779.52 + (taxableIncome * 0.19) : 3779.52;
        }
    }

    function calculateLLCTax(grossRevenue, income, profitToDistribute) {
        if (grossRevenue <= ESTONIAN_CIT_THRESHOLD) {
            return (profitToDistribute * 0.2629) + ((income - profitToDistribute) * 0.09);
        } else {
            return (profitToDistribute * 0.3439) + ((income - profitToDistribute) * 0.19);
        }
    }

    /* ==================================================
       Main Calculation Function
    ================================================== */
    function calculate() {
        // Format inputs on calculation
        DOM.grossRevenueInput.value = formatPLN(parsePLN(DOM.grossRevenueInput.value));
        DOM.incomeInput.value = formatPLN(parsePLN(DOM.incomeInput.value));
        DOM.profitToDistributeInput.value = formatPLN(parsePLN(DOM.profitToDistributeInput.value));
        
        const grossRevenue = parsePLN(DOM.grossRevenueInput.value);
        const income = parsePLN(DOM.incomeInput.value);
        const profitToDistribute = parsePLN(DOM.profitToDistributeInput.value);

        // Validate all inputs
        const isGrossRevenueValid = validateInput(DOM.grossRevenueInput.value, "grossRevenue");
        const isIncomeValid = validateInput(DOM.incomeInput.value, "income");
        const isProfitValid = validateInput(DOM.profitToDistributeInput.value, "profitToDistribute");

        if (!isGrossRevenueValid || !isIncomeValid || !isProfitValid) {
            return;
        }

        // Validate relationships between values
        if (!validateValues(grossRevenue, income, profitToDistribute)) {
            return;
        }

        // Calculate taxes
        const estonianCIT = calculateEstonianCIT(grossRevenue, profitToDistribute);
        const linearTax = calculateLinearTax(income);
        const llcTax = calculateLLCTax(grossRevenue, income, profitToDistribute);

        // Display results
        DOM.estonianCITOutput.value = formatPLN(estonianCIT);
        DOM.linearTaxOutput.value = formatPLN(linearTax);
        DOM.llcTaxOutput.value = formatPLN(llcTax);

        // Show results section with smoother animation
        DOM.resultsSection.classList.remove("hidden");
        // Wait a tiny bit before adding the visible class for the transition to work properly
        setTimeout(() => {
            DOM.resultsSection.classList.add("visible");
        }, 50);
        
        // Scroll to results with smooth animation
        setTimeout(() => {
            DOM.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }

    /* ==================================================
       Copy Values Function
    ================================================== */
    function getFormattedValues() {
        const grossRevenue = parsePLN(DOM.grossRevenueInput.value);
        const income = parsePLN(DOM.incomeInput.value);
        const profitToDistribute = parsePLN(DOM.profitToDistributeInput.value);
        const estonianCIT = DOM.estonianCITOutput.value;
        const linearTax = DOM.linearTaxOutput.value;
        const llcTax = DOM.llcTaxOutput.value;
        
        // Format date according to custom instructions (DD-MM-YYYY HH:MM)
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;

        return `Kalkulator Porównawczy Podatków (${formattedDate})\n` +
               `---------------------------\n` +
               `Przychód brutto: ${formatPLN(grossRevenue)}\n` +
               `Dochód: ${formatPLN(income)}\n` +
               `Zysk do wypłacenia: ${formatPLN(profitToDistribute)}\n\n` +
               `Wyniki:\n` +
               `---------------------------\n` +
               `CIT Estoński: ${estonianCIT}\n` +
               `JDG - Podatek liniowy: ${linearTax}\n` +
               `Sp. z o.o.: ${llcTax}`;
    }

    /* ==================================================
       Event Listeners
    ================================================== */
    DOM.calculateButton.addEventListener("click", calculate);

    // Format inputs on blur
    DOM.grossRevenueInput.addEventListener("blur", function() {
        if (this.value) {
            this.value = formatPLN(parsePLN(this.value));
        }
    });

    DOM.incomeInput.addEventListener("blur", function() {
        if (this.value) {
            this.value = formatPLN(parsePLN(this.value));
        }
    });

    DOM.profitToDistributeInput.addEventListener("blur", function() {
        if (this.value) {
            this.value = formatPLN(parsePLN(this.value));
        }
    });

    // Copy sidebar functionality
    DOM.sidebarToggle.addEventListener('click', () => {
        // Toggle the open class
        DOM.copySidebar.classList.toggle('open');
        
        // Update the toggle button position and visibility
        if (DOM.copySidebar.classList.contains('open')) {
            // When sidebar is open, ensure toggle button is positioned correctly
            DOM.sidebarToggle.style.right = '-40px';
        } else {
            // When sidebar is closed, reset the toggle button position
            DOM.sidebarToggle.style.right = '0';
        }
    });

    DOM.copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(getFormattedValues());
            DOM.copySuccess.classList.add('show');
            setTimeout(() => {
                DOM.copySuccess.classList.remove('show');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });

    // Input validation on change
    DOM.grossRevenueInput.addEventListener("input", () => {
        validateInput(DOM.grossRevenueInput.value, "grossRevenue");
    });

    DOM.incomeInput.addEventListener("input", () => {
        validateInput(DOM.incomeInput.value, "income");
    });

    DOM.profitToDistributeInput.addEventListener("input", () => {
        validateInput(DOM.profitToDistributeInput.value, "profitToDistribute");
    });
})();
