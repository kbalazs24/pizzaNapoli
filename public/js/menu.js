const pizzaPages = {
    "Marinara": "marinara.html",
    "Margherita": "margherita.html",
    "Cosacca": "cosacca.html",
    "Margherita Extra": "margherita-extra.html",
    "Salsiccia e Friarielli": "salsiccia-e-friarielli.html",
    "Provola e Pepe": "provola-e-pepe.html"
};

const pizzaImages = {
    "Marinara": "/images/.marinara.webp",
    "Margherita": "/images/margherita.jpg",
    "Cosacca": "/images/cossaca.webp",
    "Margherita Extra": "/images/margherita-extra.jpg",
    "Salsiccia e Friarielli": "/images/Salsiccia e Friarielli.webp",
    "Provola e Pepe": "/images/Provola e Pepe.avif",
};

async function loadPizzas() {
    const container = document.getElementById("pizza-list");

    try {
        const response = await fetch("/api/pizzas");
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const pizzas = await response.json();
        if (!Array.isArray(pizzas)) {
            throw new Error("Invalid API response");
        }

        container.replaceChildren();
        if (pizzas.length === 0) {
            container.innerHTML = '<div class="col-12"><p>No pizzas available.</p></div>';
            return;
        }

        for (const pizza of pizzas) {
            const page = pizzaPages[pizza.name];
            const column = document.createElement("div");
            column.className = "col-md-6 col-lg-4";

            const article = document.createElement("article");
            article.className = "pizza-card h-100";

            const imageLink = document.createElement("a");
            imageLink.href = page || "menu.html";
            const image = document.createElement("img");
            image.className = "pizza-thumb";
            image.alt = pizza.name + " pizza";
            image.loading = "lazy";
            image.decoding = "async";
            image.src = pizza.image_path || pizzaImages[pizza.name] || "images/margherita.jpg";
            imageLink.append(image);

            const body = document.createElement("div");
            body.className = "pizza-card-body";
            const heading = document.createElement("h2");
            heading.className = "h4 mb-2";
            heading.textContent = pizza.name;
            const price = document.createElement("p");
            price.className = "price mb-3";
            price.textContent = Number(pizza.price).toLocaleString("hu-HU") + " Ft";
            const button = document.createElement("a");
            button.className = "btn btn-brand w-100";
            button.href = page || "menu.html";
            button.textContent = "View Pizza";
            body.append(heading, price, button);
            article.append(imageLink, body);
            column.append(article);
            container.append(column);
        }
    } catch (error) {
        console.error("Could not load pizzas:", error);
        container.innerHTML = '<div class="col-12"><p class="text-danger" role="alert">Could not load the menu. Please try again later.</p></div>';
    }
}

loadPizzas();
