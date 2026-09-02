const jwt = require('jsonwebtoken');

const secret = 'supersecretkey123';
const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, secret, { expiresIn: '1h' });
console.log('Token generado:', token.substring(0, 30) + '...');

// Test: DELETE producto con ID 19 (el de 50+ Rosas)
async function testDelete() {
  const res = await fetch('http://localhost:3000/api/products/19', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', data);
}

testDelete().catch(console.error);
