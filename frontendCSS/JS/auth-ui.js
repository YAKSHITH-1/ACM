/**
 * auth-ui.js
 * Handles the Typewriter effect, dynamic images, and password visibility
 * for the Auth UI split-panel layout.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Password Visibility Toggle
  const toggleBtns = document.querySelectorAll(".auth-toggle-password");
  
  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      
      if (!input) return;

      const iconEye = btn.querySelector(".icon-eye");
      const iconEyeOff = btn.querySelector(".icon-eye-off");

      if (input.type === "password") {
        input.type = "text";
        iconEye.style.display = "none";
        iconEyeOff.style.display = "block";
        btn.setAttribute("aria-label", "Hide password");
      } else {
        input.type = "password";
        iconEye.style.display = "block";
        iconEyeOff.style.display = "none";
        btn.setAttribute("aria-label", "Show password");
      }
    });
  });

  // 2. Dynamic Content & Typewriter Configuration
  const path = window.location.pathname;
  const isForgot = path.includes("forgot-password.html");
  const isVerify = path.includes("verify.html");
  const isSignUp = path.includes("register.html");
  
  // Set images based on page
  const bgElement = document.querySelector(".auth-panel-left-bg");
  if (bgElement) {
    let bgUrl = "https://i.ibb.co/XrkdGrrv/original-ccdd6d6195fff2386a31b684b7abdd2e-removebg-preview.png"; // default sign in
    if (isSignUp || isVerify) {
      bgUrl = "https://i.ibb.co/HTZ6DPsS/original-33b8479c324a5448d6145b3cad7c51e7-removebg-preview.png"; // sign up & verification
    }

    bgElement.style.backgroundImage = `url('${bgUrl}')`;
    
    // Maintain consistent styles for the transparent illustrations
    bgElement.style.backgroundSize = "contain";
    bgElement.style.backgroundRepeat = "no-repeat";
    bgElement.style.backgroundPosition = "center";
    bgElement.style.opacity = "1";
  }

  // Typewriter Engine
  const typewriterElement = document.getElementById("typewriter-text");
  if (typewriterElement) {
    let textToType = "Welcome Back! The journey continues.";
    if (isForgot) {
      textToType = "Lost your key? Let's get you back inside.";
    } else if (isVerify) {
      textToType = "One last step. Verify your chapter access.";
    } else if (isSignUp) {
      textToType = "Create an account. A new chapter awaits.";
    }
      
    const speed = 60; // ms per char
    let i = 0;
    
    // Clear initial content
    typewriterElement.innerHTML = `<span class="typewriter-content"></span><span class="typewriter-cursor">|</span>`;
    const contentSpan = typewriterElement.querySelector(".typewriter-content");
    
    // Start typing after short delay
    setTimeout(() => {
      function typeWriter() {
        if (i < textToType.length) {
          contentSpan.textContent += textToType.charAt(i);
          i++;
          setTimeout(typeWriter, speed);
        }
      }
      typeWriter();
    }, 500);
  }
});
