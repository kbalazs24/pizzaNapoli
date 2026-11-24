const addressForm = document.getElementById("address-form");
const addressMessage = document.getElementById("address-message");
const addressSubmit = addressForm.querySelector("button[type='submit']");

currentUserPromise.then(async user => {
  if (!user) return window.location.href = "login.html";
  try {
    const response = await fetch("/api/addresses");
    if (!response.ok) throw new Error("Could not load address.");
    const data = await response.json();
    document.getElementById("postal").value = data.address.postalCode || "";
    document.getElementById("city").value = data.address.city || "";
    document.getElementById("street").value = data.address.streetAddress || "";
  } catch (error) {
    addressMessage.textContent = error.message;
    addressMessage.className = "alert alert-danger";
  }
});

addressForm.addEventListener("submit", async event => {
  event.preventDefault();
  addressSubmit.disabled = true;
  try {
    const response = await fetch("/api/addresses", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postalCode: document.getElementById("postal").value,
        city: document.getElementById("city").value,
        streetAddress: document.getElementById("street").value
      })
    });
    if (response.status === 401) return window.location.href = "login.html";
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save address.");
    addressMessage.textContent = "Address saved.";
    addressMessage.className = "alert alert-success";
  } catch (error) {
    addressMessage.textContent = error.message;
    addressMessage.className = "alert alert-danger";
  } finally {
    addressSubmit.disabled = false;
  }
});
