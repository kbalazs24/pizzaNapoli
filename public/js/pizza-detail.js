async function loadPizza() {
  const name = document.querySelector("main[data-pizza-name]").dataset.pizzaName;
  const button = document.getElementById("add-to-cart");
  try {
    const response = await fetch("/api/pizzas");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pizzas = await response.json();
    const pizza = pizzas.find(item => item.name === name);
    if (!pizza) throw new Error("Pizza not found.");

    document.getElementById("pizza-name").textContent = pizza.name;
    document.getElementById("pizza-price").textContent = `${pizza.price.toLocaleString("hu-HU")} Ft`;
    document.getElementById("pizza-description").textContent = pizza.description;
    const list = document.getElementById("pizza-ingredients");
    list.replaceChildren();
    for (const ingredient of pizza.ingredients.split(",")) {
      const li = document.createElement("li");
      li.textContent = ingredient.trim();
      list.appendChild(li);
    }

    button.disabled = false;
    button.addEventListener("click", () => {
      const quantity = Number(document.getElementById("quantity").value);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        alert("Choose a quantity between 1 and 100.");
        return;
      }
      addToCart(pizza.id, quantity);
      alert("Pizza added to cart!");
    });
  } catch (error) {
    console.error(error);
    document.getElementById("pizza-name").textContent = "Pizza unavailable";
    const message = document.getElementById("pizza-error");
    message.textContent = "Could not load pizza details.";
    message.hidden = false;
  }
}
loadPizza();
