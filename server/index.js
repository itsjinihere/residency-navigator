const express = require('express');
const app = express();
const PORT = 3000;

// Health check route
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to Residency Navigator backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
