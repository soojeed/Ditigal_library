const container = document.getElementById('authContainer');
const showSignUp = document.getElementById('showSignUp');
const showSignIn = document.getElementById('showSignIn');

showSignUp.addEventListener('click', () => container.classList.add('active'));
showSignIn.addEventListener('click', () => container.classList.remove('active'));

// Toggle password visibility
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  icon.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });
}
togglePassword('password', 'togglePass');
togglePassword('loginPassword', 'toggleLoginPass');

// Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  // const role = document.getElementById('role').value;

  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  document.getElementById('registerMessage').innerText = data.message;
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  document.getElementById('loginMessage').innerText = data.message;

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    if (data.role === 'admin') {
      window.location.href = './admin.html';
    } else {
      window.location.href = './home.html';
    }
  }
});
