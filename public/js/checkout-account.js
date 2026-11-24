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
    if (address.postalCode) document.getElementById("customer-zip").value = address.postalCode;
    if (address.city) document.getElementById("customer-city").value = address.city;
    if (address.streetAddress) document.getElementById("customer-address").value = address.streetAddress;
  } catch (error) {
    console.error("Could not load saved address:", error);
  }
});
