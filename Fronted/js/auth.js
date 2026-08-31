document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Guardar el token y el rol
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.user.role);
          
          // Redirigir según el rol
          if (data.user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'catalogo.html';
          }
        } else {
          errorDiv.textContent = data.error || 'Error al iniciar sesión';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        errorDiv.textContent = 'Error de conexión con el servidor';
        errorDiv.style.display = 'block';
      }
    });
  }
});

// Función de utilidad para obtener el token en otras partes de la app
function getAuthToken() {
  return localStorage.getItem('token');
}

// Función para cerrar sesión
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = 'login.html';
}
