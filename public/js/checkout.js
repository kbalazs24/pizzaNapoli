const checkoutForm = document.getElementById("checkout-form");
const placeOrderButton = document.getElementById("place-order");
const orderSummary = document.getElementById("order-summary");
const orderTotal = document.getElementById("order-total");

const cityField = document.getElementById("customer-city");
const postalCodeField = document.getElementById("customer-zip");
postalCodeField.addEventListener("invalid", () => {
  postalCodeField.setCustomValidity("Please enter a valid 4-digit postal code.");
});
postalCodeField.addEventListener("input", () => {
  postalCodeField.setCustomValidity("");
});
const deliveryMessage = document.getElementById("delivery-message");
let deliveryAreas = [];
let subtotal = 0;
let checkoutReady = false;
let submitting = false;

function updateDelivery() {
  const area = deliveryAreas.find(area => area.city === cityField.value);
  document.getElementById("delivery-fee").textContent = area ? `${area.delivery_fee.toLocaleString("hu-HU")} Ft` : "—";
  orderTotal.textContent = area && checkoutReady ? `${(subtotal + area.delivery_fee).toLocaleString("hu-HU")} Ft` : "—";
  placeOrderButton.disabled = !area || !checkoutReady || submitting;
}

cityField.addEventListener("change", () => {
  deliveryMessage.textContent = "";
  updateDelivery();
});

async function loadDeliveryAreas() {
  const selectedCity = cityField.value;
  const response = await fetch("/api/delivery-areas", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load delivery areas.");
  deliveryAreas = await response.json();
  cityField.options.length = 1;
  for (const area of deliveryAreas) {
    const option = document.createElement("option");
    option.value = area.city;
    option.textContent = area.city;
    cityField.append(option);
  }
  cityField.value = selectedCity;
}

async function loadCheckout() {
  checkoutReady = false;
  updateDelivery();
  const cart = getCart();
  if (cart.length === 0) {
    orderSummary.textContent = "Your cart is empty.";
    return;
  }

  try {
    await loadDeliveryAreas();
    const response = await fetch("/api/pizzas", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pizzas = await response.json();
    let total = 0;
    orderSummary.replaceChildren();

    for (const item of cart) {
      const pizza = pizzas.find(pizza => pizza.id === item.pizzaId);
      if (!pizza) throw new Error("Pizza not found.");
      const amount = pizza.price * item.quantity;
      total += amount;
      const row = document.createElement("p");
      row.textContent = `${pizza.name} × ${item.quantity} – ${amount.toLocaleString("hu-HU")} Ft`;
      orderSummary.append(row);
    }

    subtotal = total;
    document.getElementById("order-subtotal").textContent = `${subtotal.toLocaleString("hu-HU")} Ft`;
    checkoutReady = true;
    updateDelivery();
  } catch (error) {
    console.error(error);
    orderSummary.textContent = "Could not load your order.";
  }
}

checkoutForm.addEventListener("submit", async event => {
  event.preventDefault();
  const items = getCart();
  if (!items.length) {
    alert("Your cart is empty.");
    return;
  }

  if (submitting || !checkoutReady || !deliveryAreas.some(area => area.city === cityField.value)) return;

  const customer = {
    name: document.getElementById("customer-name").value,
    email: document.getElementById("customer-email").value,
    phone: document.getElementById("customer-phone").value,
    postalCode: document.getElementById("customer-zip").value,
    city: document.getElementById("customer-city").value,
    streetAddress: document.getElementById("customer-address").value,
    notes: document.getElementById("customer-notes").value
  };

  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const expectedTotal = subtotal + deliveryAreas.find(area => area.city === customer.city).delivery_fee;
  submitting = true;
  placeOrderButton.disabled = true;
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, items, paymentMethod, expectedTotal })
    });
    const result = await response.json();
    if (response.status === 409) {
      await loadCheckout();
      alert(result.error);
      return;
    }
    if (!response.ok) {
      alert(result.error || "Could not place your order.");
      return;
    }
    if (paymentMethod === "online_card") {
      if (result.onlinePayment !== true) {
        alert("The server is running an outdated payment route. Please restart it.");
        return;
      }
      window.location.href = "payment.html";
    } else {
      saveCart([]);
      alert(`Order placed successfully! Order number: ${result.orderId}. Payment on delivery.`);
      window.location.href = "/";
    }
  } catch (error) {
    console.error(error);
    alert("Could not place your order. Please try again.");
  } finally {
    submitting = false;
    updateDelivery();
  }
});

const checkoutReadyPromise = loadCheckout();
