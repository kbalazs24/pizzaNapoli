currentUserPromise.then(async user => {
  if (!user) {
    document.getElementById("checkout-login-hint").classList.remove("d-none");
    return;
  }
  const fields = { name: "customer-name", email: "customer-email", phone: "customer-phone" };
  for (const key in fields) {
    const field = document.getElementById(fields[key]);
    if (!field.value && user[key]) field.value = user[key];
  }
  try {
    const response = await fetch("/api/addresses");
    if (!response.ok) return;
    const data = await response.json();
    const address = data.address;
    if (address.postalCode && !postalCodeField.value) {
      postalCodeField.value = address.postalCode;
      postalCodeField.setCustomValidity("");
    }
    if (address.city) {
      await checkoutReadyPromise;
      if (!cityField.value) {
        const area = deliveryAreas.find(area => area.city.toLowerCase() === address.city.trim().toLowerCase());
        if (area) {
          cityField.value = area.city;
          updateDelivery();
        } else {
          deliveryMessage.textContent = "Delivery is not available in your saved city. Please select another city.";
        }
      }
    }
    if (address.streetAddress) document.getElementById("customer-address").value = address.streetAddress;
  } catch (error) {
    console.error("Could not load saved address:", error);
  }
});
