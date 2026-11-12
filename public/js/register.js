const registerForm = document.getElementById("register-form");
const registerMessage = document.getElementById("register-message");
const registerButton = registerForm.querySelector("button[type='submit']");

function showRegisterError(text) {
  registerMessage.textContent = text;
  registerMessage.classList.remove("d-none");
}

registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  registerMessage.classList.add("d-none");

  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;
  if (password !== confirm) {
    showRegisterError("The two passwords do not match.");
    return;
  }

  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    password
  };

  registerButton.disabled = true;
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      showRegisterError(data.error || "Registration failed.");
      return;
    }
    window.location.href = "account.html";
  } catch (error) {
    showRegisterError("Could not reach the server. Please try again.");
  } finally {
    registerButton.disabled = false;
  }
});