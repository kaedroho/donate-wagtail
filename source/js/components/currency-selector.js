class CurrencySelect {
  static selector() {
    return "#id_currency-switcher-currency";
  }

  constructor(node) {
    this.selectMenu = node;
    this.formContainer = document.getElementById("js-donate-form");
    // Convert a locale provided by Django in the form en_US to a
    // BCP 47 compliant tag in the form en-US.
    // See https://tools.ietf.org/html/bcp47
    this.locale = this.formContainer
      .getAttribute("data-locale")
      .replace("_", "-");
    this.data = JSON.parse(document.getElementById("currencies").innerHTML);
    this.oneOffContainer = document.getElementById("js-donate-form-single");
    this.monthlyContainer = document.getElementById("js-donate-form-monthly");
    this.defaultCurrency = document.getElementById(
      "id_currency-switcher-currency"
    ).value;

    this.bindEvents();
  }

  // Assign default options
  processSelectDefaultValue() {
    var selectedData = this.data[this.defaultCurrency];
    // Check if payment options are needed
    this.checkDisabled(selectedData);
    // Enable other amount
    this.bindOtherAmountEvents();
  }

  // Get correct currency data from json based on select choice
  getSelectValue() {
    var value = this.selectMenu[this.selectMenu.selectedIndex].value;
    var selectedData = this.data[value];

    this.assignValues(selectedData);
  }

  assignValues(selectedData) {
    // Create arrays for monthly and one off based on data
    var oneOffValues = selectedData.presets.single;
    var monthlyValue = selectedData.presets.monthly;
    var formatter = new Intl.NumberFormat(this.locale, {
      style: "currency",
      currency: selectedData.code.toUpperCase(),
      minimumFractionDigits: 0
    });

    // Create buttons
    this.outputOptions(
      oneOffValues,
      "one-time-amount",
      formatter,
      this.oneOffContainer
    );
    this.outputOptions(
      monthlyValue,
      "monthly-amount",
      formatter,
      this.monthlyContainer
    );

    // Check if payment options are needed
    this.checkDisabled(selectedData);

    this.updateCurrency(selectedData, formatter);
  }

  // Output donation form buttons
  outputOptions(data, type, formatter, container) {
    var container = container;

    container.innerHTML = data
      .map((donationValue, index) => {
        var formattedValue = formatter.format(donationValue);
        return `<div class='donation-amount'>
                    <input type='radio' class='donation-amount__radio' name='amount' value='${donationValue}' id='${type}-${index}' autocomplete='off' ${
          index == 0 ? "checked" : ""
        }>
                    <label for='${type}-${index}' class='donation-amount__label'>
                        ${formattedValue} ${
          type === "monthly-amount" ? window.gettext("per month") : ""
        }
                    </label>
                </div>`;
      })
      .join("");

    var otherAmountString = window.gettext("Other amount");
    container.insertAdjacentHTML(
      "beforeend",
      `<div class='donation-amount donation-amount--two-col donation-amount--other'><input type='radio' class='donation-amount__radio' name='amount' value='other' id='${type}-other' autocomplete='off' data-other-amount-radio><label for='${type}-other' class='donation-amount__label' data-currency>$</label><input type='text' class='donation-amount__input' id='${type}-other-input' placeholder='${otherAmountString}' data-other-amount></div>`
    );
  }

  updateCurrency(selectedData, formatter) {
    var formattedParts = formatter.formatToParts(1);
    // Default symbol
    var symbol = selectedData.symbol;
    // ... which we attempt to replace with a localised one
    formattedParts.forEach(part => {
      if (part["type"] === "currency") {
        symbol = part["value"];
      }
    });

    // Update currency symbol
    document.querySelectorAll("[data-currency]").forEach(currencyitem => {
      currencyitem.innerHTML = symbol;
    });

    // Update hidden currency inputs
    this.formContainer.querySelectorAll(".js-form-currency").forEach(input => {
      input.value = selectedData.code;
    });

    this.bindOtherAmountEvents();
  }

  // Add class to container if payment provider should be disabled
  addClassToContainer(items) {
    items.forEach(item => {
      this.formContainer.classList.add(`${item}-disabled`);
    });
  }

  checkDisabled(selectedData) {
    // Remove existing classes
    Array.from(this.formContainer.classList).forEach(className => {
      if (className.endsWith("-disabled")) {
        this.formContainer.classList.remove(className);
      }
    });

    // Add Classes to hide payment option
    if (selectedData.disabled) {
      this.addClassToContainer(selectedData.disabled);
    }
  }

  // Update Radio to checked
  selectRadio(event) {
    this.otherAmountRadio.forEach(radio => {
      radio.checked = true;
    });
  }

  // Updated radio value based on custom input
  updateValue(event) {
    const value = parseFloat(event.target.value).toFixed(2);
    this.otherAmountRadio.forEach(radiovalue => {
      radiovalue.value = value;
    });
  }

  bindEvents() {
    if (!this.selectMenu) {
      return;
    }

    // On select choice
    this.selectMenu.addEventListener("change", () => {
      this.getSelectValue();
    });

    // Initial defaults
    this.processSelectDefaultValue();
  }

  bindOtherAmountEvents() {
    // Other amount vars
    this.otherAmountInput = document.querySelectorAll("[data-other-amount]");
    this.otherAmountLabel = document.querySelectorAll("[data-currency]");
    this.otherAmountRadio = document.querySelectorAll(
      "[data-other-amount-radio]"
    );
    for (var i = 0; i < this.otherAmountInput.length; i++) {
      this.otherAmountInput[i].addEventListener("click", event =>
        this.selectRadio(event)
      );
      this.otherAmountInput[i].addEventListener("change", event =>
        this.updateValue(event)
      );
    }
  }
}

export default CurrencySelect;
