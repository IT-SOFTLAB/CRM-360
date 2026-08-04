const axios = require('axios');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = 'mysecretkey'; // from .env

async function test() {
  try {
    // Find a user to generate JWT token
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found in DB");
      return;
    }
    console.log("Found user:", user.email);

    // Sign JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Create a mock opportunity to delete
    console.log("Creating mock opportunity...");
    const opp = await prisma.opportunity.create({
      data: {
        customerName: "API Delete Test",
        dealValue: 50,
        stage: "New",
      }
    });
    console.log("Created opp id:", opp.id);

    // Make DELETE request using axios to localhost:5000
    console.log("Sending delete request to http://localhost:5000/api/opportunities/bulk-delete...");
    const res = await axios.delete('http://localhost:5000/api/opportunities/bulk-delete', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        ids: [opp.id]
      }
    });

    console.log("Response status:", res.status);
    console.log("Response data:", res.data);

  } catch (err) {
    if (err.response) {
      console.error("API error response:", err.response.status, err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
