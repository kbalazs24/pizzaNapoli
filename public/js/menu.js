const pizzaPages = {
  "Marinara": "marinara.html",
  "Margherita": "margherita.html",
  "Cosacca": "cosacca.html",
  "Margherita Extra": "margherita-extra.html",
  "Salsiccia e Friarielli": "salsiccia-e-friarielli.html",
  "Provola e Pepe": "provola-e-pepe.html"
};
const pizzaImages = {
  "Marinara": "/images/marinara.webp",
  "Margherita": "/images/margherita.jpg",
  "Cosacca": "/images/cosacca.webp",
  "Margherita Extra": "/images/margherita-extra.jpg",
  "Salsiccia e Friarielli": "/images/Salsiccia e Friarielli.webp",
  "Provola e Pepe": "/images/Provola e Pepe.avif"
};

async function loadPizzas() {
  const container = document.getElementById("pizza-list");
  try {
    const response = await fetch("/api/pizzas");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pizzas = await response.json();
    container.replaceChildren();
    for (const pizza of pizzas) {
      const column = document.createElement("div");
      column.className = "col-md-6 col-lg-4";
      const article = document.createElement("article");
      article.className = "pizza-card h-100";
      const image = document.createElement("img");
      image.className = "pizza-thumb";
      image.src = pizzaImages[pizza.name] || "/images/margherita.jpg";
      image.alt = pizza.name;
      const body = document.createElement("div");
      body.className = "pizza-card-body";
      const title = document.createElement("h2");
      title.className = "h4 mb-2";
      title.textContent = pizza.name;
      const description = document.createElement("p");
      description.className = "text-muted";
      description.textContent = pizza.description;
      const price = document.createElement("p");
      price.className = "price mb-3";
      price.textContent = `${pizza.price.toLocaleString("hu-HU")} Ft`;
      const link = document.createElement("a");
      link.className = "btn btn-brand w-100";
      link.href = pizzaPages[pizza.name] || "menu.html";
      link.textContent = "View Pizza";
      body.append(title, description, price, link);
      article.append(image, body);
      column.append(article);
      container.append(column);
    }
    if (!pizzas.length) container.textContent = "No pizzas available.";
  } catch (error) {
    console.error(error);
    container.textContent = "Could not load the menu.";
  }
}
loadPizzas();
