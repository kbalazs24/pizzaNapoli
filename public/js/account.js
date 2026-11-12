const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const profileButton = profileForm.querySelector("button[type='submit']");

function showProfileMessage(text, type) {
  profileMessage.textContent = text;
  profileMessage.className = `alert alert-${type}`;
}

function fillProfileForm(user) {
  document.getElementById("full-name").value = user.name;
  document.getElementById("email").value = user.email;
  document.getElementById("phone").value = user.phone || "";
}

currentUserPromise.then(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  fillProfileForm(user);
});

profileForm.addEventListener("submit", async event => {
  event.preventDefault();
  profileMessage.classList.add("d-none");

  const payload = {
    name: document.getElementById("full-name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value
  };

  profileButton.disabled = true;
  try {
    const response = await fetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }
    if (!response.ok) {
      showProfileMessage(data.error || "Could not save changes.", "danger");
      return;
    }

    fillProfileForm(data.user);
    const headerName = document.querySelector('.site-header a[href="account.html"]');
    if (headerName) headerName.textContent = data.user.name;
    showProfileMessage("Your profile has been saved.", "success");
  } catch (error) {
    showProfileMessage("Could not reach the server. Please try again.", "danger");
  } finally {
    profileButton.disabled = false;
  }
});