/** @format */

function showPassword() {
  var password = document.getElementById("pwd");
  if (password.type === "password") {
    password.type = "text";
  } else {
    password.type = "password";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const navbarToggler = document.querySelector(".navbar-toggler");
  const navbarNav = document.querySelector("#navbarNav");

  navbarToggler.addEventListener("click", function () {
    navbarNav.classList.toggle("show");
  });

  const passwordToggle = document.querySelector(".password-toggle");
  const passwordInput = document.querySelector("#pwd");

  passwordToggle.addEventListener("click", function () {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      passwordToggle.innerHTML =
        '<i class="fas fa-eye-slash" style="color: #ffe36d"></i>';
    } else {
      passwordInput.type = "password";
      passwordToggle.innerHTML =
        '<i class="fas fa-eye" style="color: #ffe36d"></i>';
    }
  });
});
