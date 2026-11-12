const savedAddressBlock = document.getElementById("saved-address-block");
const savedAddressSelect = document.getElementById("saved-address");
const checkoutLoginHint = document.getElementById("checkout-login-hint");

let savedAddresses = [];

function fillIfEmpty(fieldId, value) {
  const field = document.getElementById(fieldId);
  if (!field.value && value) field.value = value;
}

function fillDeliveryAddress(address) {
  document.getElementById("customer-zip").value = address ? address.postalCode : "";
  document.getElementById("customer-city").value = address ? address.city : "";
  document.getElementById("customer-address").value = address ? address.streetAddress : "";
}

function addAddressOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  savedAddressSelect.append(option);
}

async function loadSavedAddresses() {
  try {
    const response = await fetch("/api/addresses");
    if (!response.ok) return;
    const data = await response.json();
    savedAddresses = data.addresses;
  } catch (error) {
    return;
  }
  if (!savedAddresses.length) return;

  for (const address of savedAddresses) {
    const label = `${address.postalCode} ${address.city}, ${address.streetAddress}`;
    addAddressOption(address.id, address.isDefault ? `${label} (default)` : label);
  }
  addAddressOption("", "Enter a different address");

  savedAddressSelect.value = savedAddresses[0].id;
  fillDeliveryAddress(savedAddresses[0]);
  savedAddressBlock.classList.remove("d-none");
}

savedAddressSelect.addEventListener("change", () => {
  const selected = savedAddresses.find(address => String(address.id) === savedAddressSelect.value);
  fillDeliveryAddress(selected);
});

currentUserPromise.then(user => {
  if (!user) {
    checkoutLoginHint.classList.remove("d-none");
    return;
  }
  fillIfEmpty("customer-name", user.name);
  fillIfEmpty("customer-email", user.email);
  fillIfEmpty("customer-phone", user.phone);
  loadSavedAddresses();
});