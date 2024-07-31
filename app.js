// Import necessary modules
const express = require('express'); // for creating an Express server
const cors = require('cors'); // for enabling CORS support
const jsonfile = require('jsonfile'); // for reading/writing JSON files

/**
 * The Express server instance.
 */
const app = express();

/**
 * The port on which the Express server will listen for incoming requests.
 * Uses the environment variable PORT, if it exists, or defaults to 3000.
 */
const port = process.env.PORT || 3000;

/**
 * Read JSON and store into a variable
 */
const petsFile = jsonfile.readFileSync('database.json');

// Add CORS middleware to server, allowing it to handle cross-origin requests
app.use(cors());

// Start server, binding it to specified port
app.listen(port, function() {
    // Log a message when server is successfully started
    console.log(`Server is running on port ${port}`);
});

// Define a route for handling HTTP GET requests to root path
app.get('/', function(req, res) {
    res.send('Backend is running');
});


app.get('/api/v1/pets', function(req, res) {
    let pets = petsFile.pets.map(pet => {
        return {
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            birthdate: pet.birthdate,
            healthStatus: pet.healthStatus,
            ownerSsn: pet.ownerSsn
        };
    });
    res.status(200).json(pets);
        
});
        
app.get('/api/v1/pets/:name', function(req, res) {
    const name = req.params.name;
    const pets = petsFile.pets.find(pet => pet.name && pet.name.toLowerCase() === name.toLowerCase());

    res.status(200).json(pets);
});

app.get('/api/v1/owners/:ssn', function(req, res) {
    const ssn = req.params.ssn;
    const owner = petsFile.owners.find(owner => owner.ssn && owner.ssn === ssn);
    
    if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
    }
    
    const pets = petsFile.pets.filter(pet => pet.ownerSsn === ssn);
    const result = { pets: pets };

    res.status(200).json(result);
});