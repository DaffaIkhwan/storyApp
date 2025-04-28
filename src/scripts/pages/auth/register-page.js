import { register } from '../../data/api.js';
import { setLoadingState, showElementError, clearElementError, showSuccessMessage, showErrorMessage } from '../../utils/ui-utils.js';

export default class RegisterPage {
   #form = null; #nameInput = null; #emailInput = null; #passwordInput = null;
   #submitButton = null; #loadingIndicator = null; #errorMessageElement = null;
   #nameErrorElement = null; #emailErrorElement = null; #passwordErrorElement = null;

   constructor() { this.title = 'Register - Dicoding Story App'; }
  async render() {
    console.log("[Register Page] Rendering...");
    return `
      <section class="container auth-page" aria-labelledby="page-heading">
        <h1 id="page-heading">Register</h1>
        <form id="register-form" novalidate>
          <div class="form-group">
            <label for="name">Nama:</label>
            <input type="text" id="name" name="name" required autocomplete="name" minlength="3" placeholder="Nama lengkap Anda" aria-describedby="name-error" aria-required="true">
            <p id="name-error" class="error-message" style="display: none;" role="alert"></p>
          </div>
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required autocomplete="email" placeholder="Alamat email valid" aria-describedby="email-error" aria-required="true">
            <p id="email-error" class="error-message" style="display: none;" role="alert"></p>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required minlength="8" autocomplete="new-password" placeholder="Minimal 8 karakter" aria-describedby="password-error password-help" aria-required="true">
            <small id="password-help">Minimal 8 karakter.</small>
            <p id="password-error" class="error-message" style="display: none;" role="alert"></p>
          </div>
           <div class="form-group form-actions">
            <button type="submit" class="button button--primary" id="register-button">
              <i class="fas fa-user-plus" aria-hidden="true"></i> Daftar
            </button>
            <div id="loading-indicator" class="loading-indicator" style="display: none;" role="status">
                 <div class="spinner spinner--small" aria-hidden="true"></div> Mendaftar...
            </div>
          </div>
           <p id="form-error-message" class="error-message" style="display: none;" role="alert" tabindex="-1"></p>
          <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
        </form>
      </section>
    `;
  }
  async afterRender() {
    this.#cacheDOMElements();
    if (!this.#form) { console.error("Register form not found."); return; }
    this.#form.removeEventListener('submit', this.#handleFormSubmit);
    this.#form.addEventListener('submit', this.#handleFormSubmit);
    console.log("RegisterPage afterRender: Form listener attached.");
     if(this.#nameInput) this.#nameInput.focus();
  }
   #cacheDOMElements() {
     this.#form = document.getElementById('register-form'); this.#nameInput = document.getElementById('name');
     this.#emailInput = document.getElementById('email'); this.#passwordInput = document.getElementById('password');
     this.#submitButton = document.getElementById('register-button'); this.#loadingIndicator = document.getElementById('loading-indicator');
     this.#errorMessageElement = document.getElementById('form-error-message'); this.#nameErrorElement = document.getElementById('name-error');
     this.#emailErrorElement = document.getElementById('email-error'); this.#passwordErrorElement = document.getElementById('password-error');
   }
   #validateForm() {
     clearElementError(this.#errorMessageElement); clearElementError(this.#nameErrorElement, this.#nameInput);
     clearElementError(this.#emailErrorElement, this.#emailInput); clearElementError(this.#passwordErrorElement, this.#passwordInput);
     let isValid = true;
     if (!this.#nameInput.checkValidity()) { showElementError(this.#nameErrorElement, this.#nameInput.validationMessage || 'Nama tidak valid.', this.#nameInput); isValid = false; }
     if (!this.#emailInput.checkValidity()) { showElementError(this.#emailErrorElement, this.#emailInput.validationMessage || 'Email tidak valid.', this.#emailInput); isValid = false; }
     if (!this.#passwordInput.checkValidity()) {
         let errMsg = this.#passwordInput.validationMessage || 'Password tidak valid.';
         if (this.#passwordInput.validity.tooShort) errMsg = 'Password minimal 8 karakter.';
         else if (this.#passwordInput.validity.valueMissing) errMsg = 'Password tidak boleh kosong.';
         showElementError(this.#passwordErrorElement, errMsg, this.#passwordInput); isValid = false;
     }
     if (!isValid && !this.#nameErrorElement.textContent && !this.#emailErrorElement.textContent && !this.#passwordErrorElement.textContent) { showElementError(this.#errorMessageElement, 'Mohon periksa isian.'); }
     return isValid;
   }
  #handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!this.#validateForm()) {
        const firstError = this.#form.querySelector('.error-message[style*="block"]'); if(firstError) firstError.focus();
        return;
    }
    const controlsToDisable = [this.#nameInput, this.#emailInput, this.#passwordInput];
    setLoadingState(this.#loadingIndicator, this.#submitButton, true, controlsToDisable);
    const name = this.#nameInput.value; const email = this.#emailInput.value; const password = this.#passwordInput.value;
    try {
      console.log(`[Register Page] Attempting registration for: ${name}, ${email}`);
      const result = await register({ name, email, password });
       if (!result.error) { showSuccessMessage('Registrasi berhasil! Silakan login.'); location.hash = '#/login'; }
    } catch (error) {
      console.error('[Register Page] Registration failed:', error);
      showElementError(this.#errorMessageElement, `Registrasi gagal: ${error.message}`);
      if (error.message.toLowerCase().includes('email')) { showElementError(this.#emailErrorElement, error.message, this.#emailInput); if(this.#emailInput) this.#emailInput.select(); }
      else { this.#errorMessageElement.focus(); }
      setLoadingState(this.#loadingIndicator, this.#submitButton, false, controlsToDisable);
    }
  }
}