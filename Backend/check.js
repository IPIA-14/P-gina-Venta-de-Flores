const { getDb } = require('c:/Users/juan.ipia/Desktop/PaginaWeb/Backend/db/database.js');
async function run() {
  const db = await getDb();
  const users = await db.all('SELECT * FROM users');
  console.log(users);
}
run();
