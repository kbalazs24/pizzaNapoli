const ordersList = document.getElementById("orders-list");
const ordersEmpty = document.getElementById("orders-empty");
const ordersMessage = document.getElementById("orders-message");

function formatPrice(amount) {
  return `${amount.toLocaleString("hu-HU")} Ft`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderOrders(orders) {
  ordersList.replaceChildren();
  ordersEmpty.classList.toggle("d-none", orders.length > 0);

  for (const order of orders) {
    const card = createElement("article", "border p-4");

    const header = createElement("div", "d-flex flex-wrap justify-content-between gap-2 mb-2");
    header.append(
      createElement("h2", "h5 mb-0", `Order #${order.id}`),
      createElement("span", "text-muted", new Date(order.createdAt).toLocaleString("hu-HU"))
    );
    card.append(header);
    card.append(createElement("p", "text-muted mb-3", `Delivery: ${order.address}`));

    const itemList = createElement("ul", "list-unstyled mb-3");
    for (const item of order.items) {
      itemList.append(createElement(
        "li",
        "",
        `${item.pizzaName} × ${item.quantity} – ${formatPrice(item.unitPrice * item.quantity)}`
      ));
    }
    card.append(itemList);
    card.append(createElement("p", "fw-bold mb-0", `Total: ${formatPrice(order.totalPrice)}`));

    ordersList.append(card);
  }
}

async function loadOrders() {
  try {
    const response = await fetch("/api/my-orders");
    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    renderOrders(data.orders);
  } catch (error) {
    ordersMessage.textContent = "Could not load your orders. Please try again.";
    ordersMessage.className = "alert alert-danger";
  }
}

currentUserPromise.then(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  loadOrders();
});