const pizzaImages = {
  "Marinara": "/images/marinara.webp",
  "Margherita": "/images/margherita.jpg",
  "Cosacca": "/images/cosacca.webp",
  "Margherita Extra": "/images/margherita-extra.jpg",
  "Salsiccia e Friarielli": "/images/Salsiccia e Friarielli.webp",
  "Provola e Pepe": "/images/Provola e Pepe.avif"
};

async function loadPizza() {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const button = document.getElementById("add-to-cart");
  try {
    const response = await fetch("/api/pizzas");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pizzas = await response.json();
    const pizza = pizzas.find(item => item.id === id);
    if (!pizza) throw new Error("Pizza not found.");

    document.title = pizza.name + " | PIZZA NAPOLI";
    const image = document.getElementById("pizza-image");
    image.src = pizza.image_path || pizzaImages[pizza.name] || "/images/margherita.jpg";
    image.alt = pizza.name;
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
