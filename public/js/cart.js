const cartItems = document.getElementById("cart-items");
const cartSummary = document.getElementById("cart-summary");
const cartTotal = document.getElementById("cart-total");

async function loadCart() {
  try {
    const response = await fetch("/api/pizzas");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pizzas = await response.json();
    renderCart(pizzas);
  } catch (error) {
    console.error(error);
    cartItems.textContent = "Could not load your cart.";
  }
}

function renderCart(pizzas) {
  const cart = getCart();
  cartItems.replaceChildren();
  cartSummary.hidden = true;

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart text-center mx-auto"><h2 class="h4 mb-3">Your cart is empty.</h2><a class="btn btn-brand" href="menu.html">View Menu</a></div>';
    return;
  }

  let total = 0;
  for (const item of cart) {
    const pizza = pizzas.find(pizza => pizza.id === item.pizzaId);
    if (!pizza) {
      cartItems.textContent = "A pizza in your cart is no longer available.";
      return;
    }
    total += pizza.price * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item border bg-white p-3 d-flex flex-wrap align-items-center gap-3";
    const name = document.createElement("strong");
    name.textContent = `${pizza.name} – ${pizza.price.toLocaleString("hu-HU")} Ft`;
    const quantity = document.createElement("input");
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = "100";
    quantity.value = item.quantity;
    quantity.className = "form-control quantity-input";
    quantity.addEventListener("change", () => {
      const value = Number(quantity.value);
      if (!Number.isInteger(value) || value < 1 || value > 100) {
        quantity.value = item.quantity;
        return;
      }
      item.quantity = value;
      saveCart(cart);
      renderCart(pizzas);
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-outline-brand";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      saveCart(cart.filter(other => other.pizzaId !== item.pizzaId));
      renderCart(pizzas);
    });
    row.append(name, quantity, remove);
    cartItems.append(row);
  }
  cartTotal.textContent = `${total.toLocaleString("hu-HU")} Ft`;
  cartSummary.hidden = false;
}
loadCart();
