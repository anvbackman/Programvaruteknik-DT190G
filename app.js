// Import necessary modules
const express = require('express'); // for creating an Express server
const cors = require('cors'); // for enabling CORS support
const jsonfile = require('jsonfile'); // for reading/writing JSON files
const bodyParser = require('body-parser');
/**
 * The Express server instance.
 */
const app = express();
app.use(bodyParser.json());
/**
 * The port on which the Express server will listen for incoming requests.
 * Uses the environment variable PORT, if it exists, or defaults to 3000.
 */
const port = process.env.PORT || 3000;

/**
 * Read JSON and store into a variable
 */
let petsFile;

try {
    petsFile = jsonfile.readFileSync('database.json');
} catch (error) {
    console.error('Error reading database.json:', error);
    petsFile = { pets: [], owners: [] }; // Fallback to empty arrays
}

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
    if (!petsFile || !petsFile.pets) {
        return res.status(500).json({ error: 'Failed to load pets data' });
    }

    let pets = petsFile.pets
        .filter(pet => pet !== null) // Filter out null values
        .map(pet => {
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

    if (!pets) {
        return res.status(404).json({ error: "Pet not found" });
    }

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

app.get('/api/v1/owners', function(req, res) {
    let owners = petsFile.owners.map(owner => {
        return {
            name: owner.name,
            ssn: owner.ssn,
            address: owner.address,
            phone: owner.phone
        };
    });
    res.status(200).json(owners);
});

app.post('/api/v1/pets', function(req, res) {
    const newPet = req.body;

    if (!newPet.name || !newPet.species || !newPet.breed || !newPet.birthdate || !newPet.healthStatus || !newPet.ownerSsn) {
        return res.status(400).json({ error: 'Missing required pet information' });
    }

    petsFile.pets.push(newPet);

    try {
        jsonfile.writeFileSync('database.json', petsFile, { spaces: 2 });
        res.status(201).json(newPet);
    } catch (error) {
        console.error('Error writing to database.json:', error);
        res.status(500).json({ error: 'Failed to save pet data' });
    }
});


