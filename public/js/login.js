const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginButton = loginForm.querySelector("button[type='submit']");

function showLoginError(text) {
  loginMessage.textContent = text;
  loginMessage.classList.remove("d-none");
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginMessage.classList.add("d-none");

  const payload = {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  };

  loginButton.disabled = true;
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      showLoginError(data.error || "Login failed.");
      return;
    }
    window.location.href = "account.html";
  } catch (error) {
    showLoginError("Could not reach the server. Please try again.");
  } finally {
    loginButton.disabled = false;
  }
});