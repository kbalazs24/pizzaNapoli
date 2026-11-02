const CART_KEY = "pizza-napoli-cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(pizzaId, quantity) {
  const cart = getCart();
  const item = cart.find(item => item.pizzaId === pizzaId);
  if (item) {
    item.quantity += quantity;
  } else {
    cart.push({ pizzaId, quantity });
  }
  saveCart(cart);
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll(".cart-link").forEach(link => {
    link.textContent = `Cart (${count})`;
  });
}

updateCartCount();
