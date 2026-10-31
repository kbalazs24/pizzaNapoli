const pizzaImages = {
    "Marinara": "/images/marinara.webp",
    "Margherita": "/images/margherita.jpg",
    "Cosacca": "/images/cosacca.webp",
    "Margherita Extra": "/images/margherita-extra.jpg",
    "Salsiccia e Friarielli": "/images/Salsiccia e Friarielli.webp",
    "Provola e Pepe": "/images/Provola e Pepe.avif"
};

async function loadPizza() {
    const main = document.querySelector("main[data-pizza-id]");
    const pizzaId = Number(main.dataset.pizzaId);
    const priceElement = document.getElementById("pizza-price");

    try {
        const response = await fetch(`/api/pizzas/${pizzaId}`);
        if (!response.ok) {
            throw new Error(`Could not load pizza (HTTP ${response.status})`);
        }

        const pizza = await response.json();
        if (!pizza || Number(pizza.id) !== pizzaId) {
            throw new Error("Invalid API response");
        }

        document.getElementById("pizza-name").textContent = pizza.name;
        priceElement.textContent = Number(pizza.price).toLocaleString("hu-HU") + " Ft";

        const image = document.getElementById("pizza-image");
        image.src = pizza.image_path || pizzaImages[pizza.name] || "/images/margherita.jpg";
        image.alt = pizza.name + " pizza";
        document.title = pizza.name + " | PIZZA NAPOLI";
    } catch (error) {
        console.error("Error loading pizza:", error);
        priceElement.textContent = "Price unavailable";
    }
}

loadPizza();
