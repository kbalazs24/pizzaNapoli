// The image stays in each HTML file; all textual pizza data comes from MySQL.
async function loadPizza() {
  const main = document.querySelector("main[data-pizza-name]");
  const name = main.dataset.pizzaName;
  const errorElement = document.getElementById("pizza-error");
  try {
    const response = await fetch("/api/pizzas");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pizzas = await response.json();
    if (!Array.isArray(pizzas)) throw new Error("Invalid API response");
    const pizza = pizzas.find(item => item.name === name);
    if (!pizza) throw new Error("Pizza not found: " + name);
    if (typeof pizza.description !== "string" || !pizza.description.trim()) {
      throw new Error("Missing description in database: " + name);
    }
    if (typeof pizza.ingredients !== "string") {
      throw new Error("Invalid ingredients in database: " + name);
    }
    const ingredients = pizza.ingredients.split(",").map(item => item.trim()).filter(Boolean);
    document.getElementById("pizza-name").textContent = pizza.name;
    document.getElementById("pizza-price").textContent = Number(pizza.price).toLocaleString("hu-HU") + " Ft";
    document.getElementById("pizza-description").textContent = pizza.description;
    const list = document.getElementById("pizza-ingredients");
    list.replaceChildren();
    for (const ingredient of ingredients) {
      const li = document.createElement("li");
      li.textContent = ingredient;
      list.append(li);
    }
    document.title = pizza.name + " | PIZZA NAPOLI";
    // The cart feature is not implemented yet.
  } catch (error) {
    console.error("Could not load pizza details:", error);
    document.getElementById("pizza-name").textContent = "Pizza unavailable";
    errorElement.textContent = "Could not load pizza details. Check the API and database.";
    errorElement.hidden = false;
  }
}
loadPizza();
