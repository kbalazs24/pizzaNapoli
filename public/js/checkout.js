const checkoutForm = document.getElementById("checkout-form");
const placeOrderButton = document.getElementById("place-order");
const orderSummary = document.getElementById("order-summary");
const orderTotal = document.getElementById("order-total");

async function loadCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    orderSummary.textContent = "Your cart is empty.";
    return;
  }

  try {
    const response = await fetch("/api/pizzas");
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

    orderTotal.textContent = `${total.toLocaleString("hu-HU")} Ft`;
    placeOrderButton.disabled = false;
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

  const customer = {
    name: document.getElementById("customer-name").value,
    email: document.getElementById("customer-email").value,
    phone: document.getElementById("customer-phone").value,
    postalCode: document.getElementById("customer-zip").value,
    city: document.getElementById("customer-city").value,
    streetAddress: document.getElementById("customer-address").value,
    notes: document.getElementById("customer-notes").value
  };

  placeOrderButton.disabled = true;
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, items })
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || "Could not place your order.");
      return;
    }
    saveCart([]);
    alert(`Order placed successfully! Order number: ${result.orderId}`);
    window.location.href = "/";
  } catch (error) {
    console.error(error);
    alert("Could not place your order. Please try again.");
  } finally {
    placeOrderButton.disabled = false;
  }
});

loadCheckout();
