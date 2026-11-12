const addressList = document.getElementById("address-list");
const addressEmpty = document.getElementById("address-empty");
const addressMessage = document.getElementById("address-message");
const addressForm = document.getElementById("address-form");
const addressFormTitle = document.getElementById("address-form-title");
const addressSubmit = addressForm.querySelector("button[type='submit']");
const addressCancel = document.getElementById("address-cancel");
const defaultCheckbox = document.getElementById("is-default");

let addresses = [];
let editingId = null;

function showAddressMessage(text, type) {
  addressMessage.textContent = text;
  addressMessage.className = `alert alert-${type}`;
}

async function sendAddressRequest(url, method, body) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    throw new Error("Could not reach the server. Please try again.");
  }

  if (response.status === 401) {
    window.location.href = "login.html";
    return null;
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data.addresses;
}

async function runAddressAction(action, successText) {
  try {
    const result = await action();
    if (!result) return false;
    addresses = result;
    renderAddresses();
    if (successText) showAddressMessage(successText, "success");
    return true;
  } catch (error) {
    showAddressMessage(error.message, "danger");
    return false;
  }
}

function createActionButton(label, style, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `btn btn-sm ${style}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderAddresses() {
  addressList.replaceChildren();
  addressEmpty.classList.toggle("d-none", addresses.length > 0);

  for (const address of addresses) {
    const column = document.createElement("div");
    column.className = "col-md-6";

    const card = document.createElement("div");
    card.className = "border p-3 h-100";

    if (address.isDefault) {
      const badge = document.createElement("span");
      badge.className = "badge bg-success mb-2";
      badge.textContent = "Default";
      card.append(badge);
    }

    const text = document.createElement("p");
    text.className = "mb-2";
    text.textContent = `${address.postalCode} ${address.city}, ${address.streetAddress}`;
    card.append(text);

    const actions = document.createElement("div");
    actions.className = "d-flex flex-wrap gap-2";
    if (!address.isDefault) {
      actions.append(createActionButton("Set as default", "btn-outline-success", () => setDefaultAddress(address)));
    }
    actions.append(createActionButton("Edit", "btn-outline-secondary", () => startEditing(address)));
    actions.append(createActionButton("Delete", "btn-outline-danger", () => deleteAddress(address)));
    card.append(actions);

    column.append(card);
    addressList.append(column);
  }
}

function resetAddressForm() {
  editingId = null;
  addressForm.reset();
  defaultCheckbox.disabled = false;
  addressFormTitle.textContent = "Add a new address";
  addressCancel.classList.add("d-none");
}

function startEditing(address) {
  editingId = address.id;
  document.getElementById("street").value = address.streetAddress;
  document.getElementById("city").value = address.city;
  document.getElementById("postal").value = address.postalCode;
  defaultCheckbox.checked = address.isDefault;
  defaultCheckbox.disabled = address.isDefault;
  addressFormTitle.textContent = "Edit address";
  addressCancel.classList.remove("d-none");
  addressForm.scrollIntoView({ behavior: "smooth" });
}

function setDefaultAddress(address) {
  runAddressAction(
    () => sendAddressRequest(`/api/addresses/${address.id}`, "PUT", { ...address, isDefault: true }),
    "Default address updated."
  );
}

async function deleteAddress(address) {
  if (!confirm("Delete this address?")) return;
  const deleted = await runAddressAction(
    () => sendAddressRequest(`/api/addresses/${address.id}`, "DELETE"),
    "Address deleted."
  );
  if (deleted && editingId === address.id) resetAddressForm();
}

addressCancel.addEventListener("click", resetAddressForm);

addressForm.addEventListener("submit", async event => {
  event.preventDefault();
  addressMessage.classList.add("d-none");

  const payload = {
    streetAddress: document.getElementById("street").value,
    city: document.getElementById("city").value,
    postalCode: document.getElementById("postal").value,
    isDefault: defaultCheckbox.checked
  };
  const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
  const method = editingId ? "PUT" : "POST";
  const successText = editingId ? "Address updated." : "Address saved.";

  addressSubmit.disabled = true;
  const saved = await runAddressAction(() => sendAddressRequest(url, method, payload), successText);
  addressSubmit.disabled = false;
  if (saved) resetAddressForm();
});

currentUserPromise.then(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  runAddressAction(() => sendAddressRequest("/api/addresses", "GET"));
});