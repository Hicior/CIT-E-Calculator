(function() {
    /* ==================================================
       DOM Element References
    ================================================== */
    const DOM = {
        resultsSection: document.getElementById("eCIT-resultsSection"),
        calculateButton: document.getElementById("calculateButton"),
        taxRate9Input: document.getElementById("taxRate9"),
        taxRate19Input: document.getElementById("taxRate19"),
        incomeInput: document.getElementById("income"),
        profitToDistributeInput: document.getElementById("profitToDistribute"),
        estonianCITOutput: document.getElementById("estonianCIT"),
        linearTaxOutput: document.getElementById("linearTax"),
        llcTaxOutput: document.getElementById("llcTax")
    };

    /* ==================================================
       Constants
    ================================================== */
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

    function getSelectedTaxRate() {
        return DOM.taxRate9Input.checked ? 9 : 19;
    }

    // Function to preserve cursor position when reformatting input
    function setInputValuePreservingCursor(input, newValue) {
        // Store current cursor position
        const currentPosition = input.selectionStart;
        
        // Get the current value without formatting
        const currentValueRaw = parsePLN(input.value).toString();
        
        // Get the new value without formatting
        const newValueRaw = parsePLN(newValue).toString();
        
        // Set the new value
        input.value = newValue;
        
        // If we're editing (not just setting a value), try to preserve cursor position
        if (document.activeElement === input && currentPosition !== null) {
            // Calculate new cursor position based on length difference
            const lengthDiff = newValue.length - input.value.length;
            const newPosition = Math.max(0, Math.min(currentPosition + lengthDiff, newValue.length));
            
            // Set cursor position
            input.setSelectionRange(currentPosition, currentPosition);
        }
    }

    /* ==================================================
       Validation Functions
    ================================================== */
    function validateInput(value, fieldName) {
        // Skip validation for tax rate radio buttons
        if (fieldName === "taxRate") {
            return true;
        }

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

    function validateValues(income, profitToDistribute) {
        let isValid = true;

        // Check if profit to distribute is less than or equal to income
        if (profitToDistribute > income) {
            const errorElement = document.getElementById("profitToDistribute-error");
            DOM.profitToDistributeInput.classList.add("error");
            errorElement.textContent = "Zysk do wypłacenia nie może być większy niż dochód";
            errorElement.classList.add("visible");
            isValid = false;
        } else {
            // Clear error if values are now valid
            const errorElement = document.getElementById("profitToDistribute-error");
            if (errorElement) {
                errorElement.textContent = "";
                errorElement.classList.remove("visible");
                DOM.profitToDistributeInput.classList.remove("error");
            }
        }

        return isValid;
    }

    /* ==================================================
       Tax Calculation Functions
    ================================================== */
    function calculateEstonianCIT(taxRate, profitToDistribute) {
        return taxRate === 9 
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

    function calculateLLCTax(taxRate, income, profitToDistribute) {
        if (taxRate === 9) {
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
        DOM.incomeInput.value = formatPLN(parsePLN(DOM.incomeInput.value));
        DOM.profitToDistributeInput.value = formatPLN(parsePLN(DOM.profitToDistributeInput.value));
        
        const taxRate = getSelectedTaxRate();
        const income = parsePLN(DOM.incomeInput.value);
        const profitToDistribute = parsePLN(DOM.profitToDistributeInput.value);

        // Validate all inputs
        const isIncomeValid = validateInput(DOM.incomeInput.value, "income");
        const isProfitValid = validateInput(DOM.profitToDistributeInput.value, "profitToDistribute");

        if (!isIncomeValid || !isProfitValid) {
            return;
        }

        // Validate relationships between values
        if (!validateValues(income, profitToDistribute)) {
            return;
        }

        // Calculate taxes
        const estonianCIT = calculateEstonianCIT(taxRate, profitToDistribute);
        const linearTax = calculateLinearTax(income);
        const llcTax = calculateLLCTax(taxRate, income, profitToDistribute);

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
        
        // Hide the calculate button after clicking
        DOM.calculateButton.style.display = "none";
    }

    /* ==================================================
       Event Listeners
    ================================================== */
    DOM.calculateButton.addEventListener("click", calculate);

    // Format inputs on blur
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

    // Auto-update calculations when inputs change
    DOM.taxRate9Input.addEventListener("change", function() {
        if (DOM.resultsSection.classList.contains("visible")) {
            calculate();
        }
    });

    DOM.taxRate19Input.addEventListener("change", function() {
        if (DOM.resultsSection.classList.contains("visible")) {
            calculate();
        }
    });

    // Modified input handlers to prevent cursor jumping
    let isCalculating = false;

    DOM.incomeInput.addEventListener("input", function() {
        validateInput(this.value, "income");
        
        if (DOM.resultsSection.classList.contains("visible") && !isCalculating) {
            // Set flag to prevent recursive calls
            isCalculating = true;
            
            // Store current cursor position
            const cursorPos = this.selectionStart;
            
            // Calculate without reformatting this input
            const income = parsePLN(this.value);
            const profitToDistribute = parsePLN(DOM.profitToDistributeInput.value);
            const taxRate = getSelectedTaxRate();
            
            // Clear any previous profit distribution error when income increases
            const profitErrorElement = document.getElementById("profitToDistribute-error");
            if (profitErrorElement && profitToDistribute <= income) {
                profitErrorElement.textContent = "";
                profitErrorElement.classList.remove("visible");
                DOM.profitToDistributeInput.classList.remove("error");
            }
            
            // Only update results if valid
            if (validateInput(this.value, "income") && validateValues(income, profitToDistribute)) {
                const estonianCIT = calculateEstonianCIT(taxRate, profitToDistribute);
                const linearTax = calculateLinearTax(income);
                const llcTax = calculateLLCTax(taxRate, income, profitToDistribute);
                
                DOM.estonianCITOutput.value = formatPLN(estonianCIT);
                DOM.linearTaxOutput.value = formatPLN(linearTax);
                DOM.llcTaxOutput.value = formatPLN(llcTax);
            }
            
            // Restore cursor position
            this.setSelectionRange(cursorPos, cursorPos);
            
            // Reset flag
            isCalculating = false;
        }
    });

    DOM.profitToDistributeInput.addEventListener("input", function() {
        validateInput(this.value, "profitToDistribute");
        
        if (DOM.resultsSection.classList.contains("visible") && !isCalculating) {
            // Set flag to prevent recursive calls
            isCalculating = true;
            
            // Store current cursor position
            const cursorPos = this.selectionStart;
            
            // Calculate without reformatting this input
            const income = parsePLN(DOM.incomeInput.value);
            const profitToDistribute = parsePLN(this.value);
            const taxRate = getSelectedTaxRate();
            
            // Only update results if valid
            if (validateInput(this.value, "profitToDistribute") && validateValues(income, profitToDistribute)) {
                const estonianCIT = calculateEstonianCIT(taxRate, profitToDistribute);
                const linearTax = calculateLinearTax(income);
                const llcTax = calculateLLCTax(taxRate, income, profitToDistribute);
                
                DOM.estonianCITOutput.value = formatPLN(estonianCIT);
                DOM.linearTaxOutput.value = formatPLN(linearTax);
                DOM.llcTaxOutput.value = formatPLN(llcTax);
            }
            
            // Restore cursor position
            this.setSelectionRange(cursorPos, cursorPos);
            
            // Reset flag
            isCalculating = false;
        }
    });
})();
