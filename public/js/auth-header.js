async function loadCurrentUser() {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
}

async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "index.html";
  }
}

function renderAuthHeader(user) {
  const loginLink = document.querySelector('.site-header a[href="login.html"]');
  const registerLink = document.querySelector('.site-header a[href="register.html"]');
  if (!user || !loginLink || !registerLink) return;

  const accountLink = document.createElement("a");
  accountLink.href = "account.html";
  accountLink.textContent = user.name;

  const logoutLink = document.createElement("a");
  logoutLink.href = "index.html";
  logoutLink.textContent = "Log out";
  logoutLink.dataset.logout = "";

  loginLink.replaceWith(accountLink);
  registerLink.replaceWith(logoutLink);
}

document.addEventListener("click", event => {
  const logoutElement = event.target.closest("[data-logout]");
  if (!logoutElement) return;
  event.preventDefault();
  logout();
});

const currentUserPromise = loadCurrentUser();
currentUserPromise.then(renderAuthHeader);