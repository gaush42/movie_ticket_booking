class AuthManager {
  constructor() {
    this.loginTab = document.getElementById('login-tab');
    this.registerTab = document.getElementById('register-tab');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.notification = document.getElementById('notification');
    
    this.init();
  }
  
  init() {
    this.setupTabSwitching();
    this.setupFormSubmissions();
    this.setupInputValidation();
  }
  
  setupTabSwitching() {
    this.loginTab.addEventListener('click', () => {
      this.switchTab('login');
    });
    
    this.registerTab.addEventListener('click', () => {
      this.switchTab('register');
    });
  }
  
  switchTab(tab) {
    if (tab === 'login') {
      this.loginTab.classList.add('active');
      this.registerTab.classList.remove('active');
      this.loginForm.style.display = 'block';
      this.registerForm.style.display = 'none';
    } else {
      this.registerTab.classList.add('active');
      this.loginTab.classList.remove('active');
      this.loginForm.style.display = 'none';
      this.registerForm.style.display = 'block';
    }
  }
  
  setupFormSubmissions() {
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
    
    this.registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });
  }
  
  setupInputValidation() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateInput(input);
      });
      
      input.addEventListener('input', () => {
        this.clearInputError(input);
      });
    });
  }
  
  validateInput(input) {
    const value = input.value.trim();
    let isValid = true;
    
    if (input.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(value);
    } else if (input.type === 'password') {
      isValid = value.length >= 3;
    } else if (input.type === 'text') {
      isValid = value.length >= 2;
    }
    
    if (!isValid) {
      this.showInputError(input);
    } else {
      this.clearInputError(input);
    }
    
    return isValid;
  }
  
  showInputError(input) {
    input.style.borderColor = '#E63946';
    input.style.boxShadow = '0 0 0 3px rgba(230, 57, 70, 0.1)';
  }
  
  clearInputError(input) {
    input.style.borderColor = '#A8DADC';
    input.style.boxShadow = 'none';
  }
  
  showNotification(message, type = 'info') {
    this.notification.textContent = message;
    this.notification.className = `notification ${type}`;
    this.notification.classList.add('show');
    
    setTimeout(() => {
      this.notification.classList.remove('show');
    }, 4000);
  }
  
  showLoading(form) {
    const button = form.querySelector('.submit-btn');
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    button.disabled = true;
    btnText.style.opacity = '0';
    btnLoader.style.display = 'block';
  }
  
  hideLoading(form) {
    const button = form.querySelector('.submit-btn');
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    button.disabled = false;
    btnText.style.opacity = '1';
    btnLoader.style.display = 'none';
  }
  
  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    // Validate inputs
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (!this.validateInput(emailInput) || !this.validateInput(passwordInput)) {
      this.showNotification('Please enter valid credentials', 'error');
      return;
    }
    
    this.showLoading(this.loginForm);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token in localStorage
        //localStorage.setItem('token', data.token);
        //localStorage.setItem('user', JSON.stringify(data.user));
        const token = data.token;
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
        const role = payload.userInfo.roles[0]; // Assuming only one role
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(payload.userInfo));
        
        this.showNotification('Login successful! Redirecting...', 'success');
        
        // Redirect based on user role
        setTimeout(() => {
          this.redirectBasedOnRole(role);
        }, 1000);
        
      } else {
        this.showNotification(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Network error. Please try again.', 'error');
    } finally {
      this.hideLoading(this.loginForm);
    }
  }
  
  async handleRegister() {
    const fullname = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    
    // Validate inputs
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    
    if (!this.validateInput(nameInput) || !this.validateInput(emailInput) || !this.validateInput(passwordInput)) {
      this.showNotification('Please fill all fields correctly', 'error');
      return;
    }
    
    this.showLoading(this.registerForm);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullname, email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.showNotification('Registration successful! Please login.', 'success');
        
        // Clear form and switch to login
        this.registerForm.reset();
        setTimeout(() => {
          this.switchTab('login');
        }, 1000);
        
      } else {
        this.showNotification(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showNotification('Network error. Please try again.', 'error');
    } finally {
      this.hideLoading(this.registerForm);
    }
  }
  
  redirectBasedOnRole(role) {
    const redirectMap = {
      'Administrator': '/dashboard-admin.html',
      'Theater_Manager': '/dashboard-manager.html',
      'User': '/index.html'
    };
    
    const redirectUrl = redirectMap[role] || '/index.html';
    window.location.href = redirectUrl;
  }
  
  // Check if user is already logged in
  /*checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        this.showNotification('You are already logged in. Redirecting...', 'info');
        setTimeout(() => {
          this.redirectBasedOnRole(userData.role);
        }, 1000);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }*/
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const authManager = new AuthManager();
  
  // Check if user is already logged in
  authManager.checkAuthStatus();
  
  // Add some visual enhancements
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.style.transform = 'translateY(-2px)';
    });
    
    input.addEventListener('blur', () => {
      input.parentElement.style.transform = 'translateY(0)';
    });
  });
});