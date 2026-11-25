const form = document.getElementById("payment-form");
const message = document.getElementById("payment-message");
const payButton = document.getElementById("pay-button");

const validationMessages = {
  "card-name": "Please enter the name on the card.",
  "card-number": "Please enter a valid 16-digit card number.",
  "card-expiry": "Please enter the expiry date in MM/YY format.",
  "card-cvc": "Please enter a valid 3-digit CVC."
};

for (const id in validationMessages) {
  const input = document.getElementById(id);
  input.addEventListener("input", () => {
    document.getElementById(`${id}-error`).hidden = true;
  });
}

async function loadPayment() {
  try {
    const response = await fetch("/api/payments/demo");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payment = await response.json();
    document.getElementById("payment-amount").textContent = `${Number(payment.amount).toLocaleString("hu-HU")} Ft`;
    form.hidden = false;
  } catch (error) {
    console.error("Payment loading error:", error);
    message.textContent = "Could not load payment. No active payment may be available in this session.";
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  for (const id in validationMessages) {
    document.getElementById(`${id}-error`).hidden = true;
  }
  for (const id in validationMessages) {
    const input = document.getElementById(id);
    if (!input.validity.valid) {
      const error = document.getElementById(`${id}-error`);
      error.textContent = validationMessages[id];
      error.hidden = false;
      input.focus();
      return;
    }
  }
  payButton.disabled = true;
  message.textContent = "Processing demo payment...";
  try {
    const response = await fetch("/api/payments/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardNumber: document.getElementById("card-number").value,
        expiry: document.getElementById("card-expiry").value,
        cvc: document.getElementById("card-cvc").value
      })
    });
    const result = await response.json();
    if (!response.ok) {
      message.textContent = result.error || `HTTP ${response.status}`;
      return;
    }
    form.hidden = true;
    document.getElementById("payment-details").hidden = true;
    form.reset();
    if (result.success) {
      saveCart([]);
      message.textContent = "Payment successful! Your order has been recorded.";
    } else {
      message.textContent = "Payment declined.";
      document.getElementById("retry-payment").hidden = false;
    }
  } catch (error) {
    console.error("Demo payment error:", error);
    message.textContent = "Could not process demo payment.";
  } finally {
    payButton.disabled = false;
  }
});

loadPayment();
