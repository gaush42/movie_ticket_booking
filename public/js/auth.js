const loginTab = document.getElementById('login-tab')
const registerTab = document.getElementById('register-tab')
const loginForm = document.getElementById('login-form')
const registerForm = document.getElementById('register-form')

loginTab.onclick = () => {
  loginTab.classList.add('active')
  registerTab.classList.remove('active')
  loginForm.style.display = 'block'
  registerForm.style.display = 'none'
}

registerTab.onclick = () => {
  registerTab.classList.add('active')
  loginTab.classList.remove('active')
  loginForm.style.display = 'none'
  registerForm.style.display = 'block'
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = document.getElementById('login-email').value
  const password = document.getElementById('login-password').value

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const data = await res.json()
  if (res.ok) {
    localStorage.setItem('token', data.token)
    alert('Login successful!')
    window.location.href = '/'
  } else {
    alert(data.message || 'Login failed')
  }
})

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const fullname = document.getElementById('register-name').value
  const email = document.getElementById('register-email').value
  const password = document.getElementById('register-password').value

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullname, email, password })
  })

  const data = await res.json()
  if (res.ok) {
    alert('Registered! Now login.')
    loginTab.click()
  } else {
    alert(data.message || 'Registration failed')
  }
})
