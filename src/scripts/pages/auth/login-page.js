import { login } from '../../data/api.js';
import { saveAuthToken, saveUserInfo } from '../../utils/auth-utils.js';
import { setLoadingState, showElementError, clearElementError, showSuccessMessage, showErrorMessage } from '../../utils/ui-utils.js';

export default class LoginPage {
  #form = null; #emailInput = null; #passwordInput = null;
  #submitButton = null; #loadingIndicator = null; #errorMessageElement = null;
  #emailErrorElement = null; #passwordErrorElement = null;

  constructor() { this.title = 'Login - Dicoding Story App'; }
  async render() {
    console.log("[Login Page] Rendering...");
    return `
      <section class="container auth-page" aria-labelledby="page-heading">
        <h1 id="page-heading">Login</h1>
        <form id="login-form" novalidate>
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required autocomplete="email" placeholder="Masukkan alamat email" aria-describedby="email-error" aria-required="true">
            <p id="email-error" class="error-message" style="display: none;" role="alert"></p>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Masukkan password" aria-describedby="password-error" aria-required="true">
           <p id="password-error" class="error-message" style="display: none;" role="alert"></p>
          </div>
          <div class="form-group form-actions">
            <button type="submit" class="button button--primary" id="login-button">
              <i class="fas fa-sign-in-alt" aria-hidden="true"></i> Login
            </button>
            <div id="loading-indicator" class="loading-indicator" style="display: none;" aria-label="Loading..." role="status">
                 <div class="spinner spinner--small" aria-hidden="true"></div> Logging in...
            </div>
          </div>
           <p id="form-error-message" class="error-message" style="display: none;" role="alert" tabindex="-1"></p>
           <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
        </form>
      </section>
    `;
  }
  async afterRender() {
    this.#cacheDOMElements();
    if (!this.#form) { console.error("Login form not found after render."); return; }
    this.#form.removeEventListener('submit', this.#handleFormSubmit);
    this.#form.addEventListener('submit', this.#handleFormSubmit);
    console.log("LoginPage afterRender: Form listener attached.");
     if(this.#emailInput) this.#emailInput.focus();
  }
  #cacheDOMElements() {
     this.#form = document.getElementById('login-form'); this.#emailInput = document.getElementById('email');
     this.#passwordInput = document.getElementById('password'); this.#submitButton = document.getElementById('login-button');
     this.#loadingIndicator = document.getElementById('loading-indicator'); this.#errorMessageElement = document.getElementById('form-error-message');
     this.#emailErrorElement = document.getElementById('email-error'); this.#passwordErrorElement = document.getElementById('password-error');
  }
  #validateForm() {
     clearElementError(this.#errorMessageElement); clearElementError(this.#emailErrorElement, this.#emailInput); clearElementError(this.#passwordErrorElement, this.#passwordInput);
     let isValid = true;
     if (!this.#emailInput.value) { showElementError(this.#emailErrorElement, 'Email tidak boleh kosong.', this.#emailInput); isValid = false; }
     else if (!this.#emailInput.checkValidity()) { showElementError(this.#emailErrorElement, 'Format email tidak valid.', this.#emailInput); isValid = false; }
     if (!this.#passwordInput.value) { showElementError(this.#passwordErrorElement, 'Password tidak boleh kosong.', this.#passwordInput); isValid = false; }
     else if (!this.#passwordInput.checkValidity()){ showElementError(this.#passwordErrorElement, this.#passwordInput.validationMessage || 'Password tidak valid.', this.#passwordInput); isValid = false; }
     if (!isValid && !this.#emailErrorElement.textContent && !this.#passwordErrorElement.textContent) {}
     return isValid;
  }
  #handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!this.#validateForm()) {
        const firstError = this.#form.querySelector('.error-message[style*="block"]'); if (firstError) firstError.focus();
        return;
    }
    const controlsToDisable = [this.#emailInput, this.#passwordInput];
    setLoadingState(this.#loadingIndicator, this.#submitButton, true, controlsToDisable);
    const email = this.#emailInput.value; const password = this.#passwordInput.value;
    try {
      console.log(`[Login Page] Attempting login for user: ${email}`);
      const loginResult = await login({ email, password });
      saveAuthToken(loginResult.token); saveUserInfo({ userId: loginResult.userId, name: loginResult.name });
      showSuccessMessage('Login berhasil! Mengarahkan ke Beranda...');
      location.hash = '#/';
    } catch (error) {
      console.error('[Login Page] Login failed:', error);
      showElementError(this.#errorMessageElement, `Login gagal: ${error.message}`);
      if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('user not found')) { showElementError(this.#emailErrorElement, error.message, this.#emailInput); if(this.#emailInput) this.#emailInput.select(); }
      else if (error.message.toLowerCase().includes('password')) { showElementError(this.#passwordErrorElement, error.message, this.#passwordInput); if(this.#passwordInput) this.#passwordInput.select(); }
      else { this.#errorMessageElement.focus(); }
      setLoadingState(this.#loadingIndicator, this.#submitButton, false, controlsToDisable);
    }
  }
}