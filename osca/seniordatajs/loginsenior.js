document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Fixed credentials
    const fixedUser = "MSWDSC";
    const fixedPass = "screcords";

    if (username === fixedUser && password === fixedPass) {
      localStorage.setItem("loggedIn", "true");
      // ✅ Redirect to index.html inside SeniorCitizenData folder
      window.location.href = "SeniorCitizenData/index.html";
    } else {
      alert("Invalid username or password.");
    }
  });
});