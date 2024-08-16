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
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));

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
    const pet = petsFile.pets.find(pet => pet.name && pet.name.toLowerCase() === name.toLowerCase());

    if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
    }

    res.status(200).json(pet);
});


// Endpoint to get pets by owner's SSN
app.get('/api/v1/owners/:ssn', function(req, res) {
    const ssn = req.params.ssn;
    const owner = petsFile.owners.find(owner => owner.ssn && owner.ssn === ssn);
    
    if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
    }
    
    const pets = petsFile.pets.filter(pet => pet && pet.ownerSsn === ssn);
    const result = { pets: pets };
    

    res.status(200).json(pets);
});

// Endpoint to get all owners
app.get('/api/v1/owners', function(req, res) {
    let owners = petsFile.owners.map(owner => {
        return {
            name: owner.name,
            address: owner.address,
            phone: owner.phone,
            email: owner.email,
            ssn: owner.ssn
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

app.put('/api/v1/pets/:name', function(req, res) {
    const name = req.params.name;
    const updatedPetData = req.body;

    // Find the pet by name (case-insensitive)
    const petIndex = petsFile.pets.findIndex(pet => pet && pet.name && pet.name.toLowerCase() === name.toLowerCase());

    if (petIndex === -1) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    // Merge the existing pet data with the updated data
    const existingPet = petsFile.pets[petIndex];
    const updatedPet = { ...existingPet, ...updatedPetData };

    // Update the pet information in the array
    petsFile.pets[petIndex] = updatedPet;

    try {
        // Write the updated data back to the JSON file
        jsonfile.writeFileSync('database.json', petsFile, { spaces: 2 });
        res.status(200).json(updatedPet);
    } catch (error) {
        console.error('Error writing to database.json:', error);
        res.status(500).json({ error: 'Failed to save pet data' });
    }
});


app.delete('/api/v1/pets/:name', function(req, res) {
    const name = req.params.name;

    // Find the pet by name (case-insensitive)
    const petIndex = petsFile.pets.findIndex(pet => pet && pet.name && pet.name.toLowerCase() === name.toLowerCase());

    if (petIndex === -1) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    // Remove the pet from the array
    const removedPet = petsFile.pets.splice(petIndex, 1)[0];

    try {
        // Write the updated data back to the JSON file
        jsonfile.writeFileSync('database.json', petsFile, { spaces: 2 });
        res.status(200).json(removedPet);
    } catch (error) {
        console.error('Error writing to database.json:', error);
        res.status(500).json({ error: 'Failed to save pet data' });
    }
});


