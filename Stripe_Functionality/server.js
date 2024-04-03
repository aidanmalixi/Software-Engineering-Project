const http = require('http');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_API_SECRET);
const domain = "localhost"
// Replace with your actual Stripe publishable key
const YOUR_STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_API_PUBLIC;

// Basic server setup
const server = http.createServer(async (req, res) => {
  if (req.url === '/charge' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {

      try {
        const charge = await stripe.charges.create({
          amount: 1099,
          currency: 'usd',
          source: 'tok_visa',
          receipt_email: 'willyam.15153@gmail.com'
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));

      } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false }));
      }
    });
  } else {
    // Serve the frontend content
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`
      <html>
        <head>
          <title>Takeout App Payment</title>
          <script src="https://js.stripe.com/v3/"></script>
        </head>
        <body>
          <button id="checkout-button">Pay Now</button>
          <script src="checkout.js"></script>
        </body>
      </html>
    `);
    res.end();
  }
  // Handling for /api/orders route from the first server
  if (pathname === '/transactions' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // Convert Buffer to string
    });
    req.on('end', async () => {
      try {
        const { userId } = JSON.parse(body); //logging integration will be done eventually
        const result = await transaction(pool, res, req userId);


        if (result == 'no user') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'User id not found' }));
        }
        else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ orderId: result, message: 'Order created successfully' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create order' }));
      }
    });
  }
});

const port = 4002; // Or any other available port
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


async function transaction(pool, res, req, userid) {
  let db;
  try {
    db = await pool.getConnection(); // Get a connection from the pool
    const [results] = await db.execute(
      'SELECT * FROM Transactions WHERE userid = ?',
      [userid]
    );

    if (results.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "user not found" }));
      return;
    }


    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
  } catch (error) {
    console.error('Error processing request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Internal server error" }));
  } finally {
    db.release(); // Release the connection back to the pool
  }
}

