// Import necessary modules
const express = require('express'); // for creating an Express server
const cors = require('cors'); // for enabling CORS support
const jsonfile = require('jsonfile'); // for reading/writing JSON files
// Create an Express server
const app = express();
// Parse incoming request bodies as JSON
app.use(express.json()); 
// Define the port number for the server
const port = process.env.PORT || 3000;
// Read the database file and store its contents in a variable
let petsFile;

try {
    petsFile = jsonfile.readFileSync('database.json');
} catch (error) {
    console.error('Error reading database.json:', error);
    petsFile = { pets: [], owners: [] }; // Fallback to empty arrays
}

app.use(cors({credentials: true, origin: 'https://studenter.miun.se'}));

// Start server, binding it to specified port
app.listen(port, function() {
    // Log a message when server is successfully started
    console.log(`Server is running on port ${port}`);
});

/**
 * Define a route for handling HTTP GET requests to root path
 */
app.get('/', function(req, res) {
    res.send('Backend is running');
});

/**
 * Endpoint to get all pets 
*/ 
app.get('/api/v1/pets', function(req, res) {
    if (!petsFile || !petsFile.pets) { // Check if pets data is loaded
        return res.status(500).json({ error: 'Failed to load pets data' });
    }
    // Filter out null values and return only the necessary fields
    let pets = petsFile.pets
        .filter(pet => pet !== null) 
        .map(pet => {
            return {
                petName: pet.petName,
                species: pet.species,
                breed: pet.breed,
                color: pet.color,
                birthdate: pet.birthdate,
                healthStatus: pet.healthStatus,
                ownerSsn: pet.ownerSsn
            };
        });

    res.status(200).json(pets);
});

/**
 * Endpoint to get a pet by name
 */
app.get('/api/v1/pets/:petName', function(req, res) {
    const name = req.params.petName;
    const pet = petsFile.pets.find(pet => pet.petName && pet.petName.toLowerCase() === name.toLowerCase()); // Find the pet by name (case-insensitive)

    if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
    }

    res.status(200).json(pet);
});

/**
 * Endpoint to get all pets of a specific owner
 */
app.get('/api/v1/owners/:ownerSsn', function(req, res) {
    const ssn = req.params.ownerSsn;
    const owner = petsFile.owners.find(owner => owner.ownerSsn && owner.ownerSsn === ssn); // Find the owner by ssn
    
    if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
    }
    
    const pets = petsFile.pets.filter(pet => pet && pet.ownerSsn === ssn); // Find the pets by owner's ssn
    const result = { pets: pets };

    res.status(200).json(result);
});

/**
 * Endpoint to get all owners
 */
app.get('/api/v1/owners', function(req, res) {
    if (!petsFile || !petsFile.owners) { // Check if owners data is loaded
        return res.status(500).json({ error: 'Failed to load owners data' });
    }

    let owners = petsFile.owners.map(owner => {
        return {
            ownerName: owner.ownerName,
            address: owner.address,
            phone: owner.phone,
            email: owner.email,
            ownerSsn: owner.ownerSsn
        };
    });
    res.status(200).json(owners);
});

/**
 * Endpoint to post a new pet
 */
app.post('/api/v1/pets', function(req, res) {
    const newPet = req.body;

    // Check if all required fields are present
    if (!newPet.petName || !newPet.species || !newPet.breed || !newPet.color || !newPet.birthdate || !newPet.healthStatus || !newPet.ownerSsn) {
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

/**
 * Endpoint to post a new owner
 */
app.post('/api/v1/owners', function(req, res) {
    const newOwner = req.body;

    // Check if all required fields are present
    if (!newOwner.ownerName || !newOwner.address || !newOwner.phone || !newOwner.email || !newOwner.ownerSsn) {
        return res.status(400).json({ error: 'Missing required owner information' });
    }

    petsFile.owners.push(newOwner);

    try {
        jsonfile.writeFileSync('database.json', petsFile, { spaces: 2 });
        res.status(201).json(newOwner);
    } catch (error) {
        console.error('Error writing to database.json:', error);
        res.status(500).json({ error: 'Failed to save owner data' });
    }
});

/**
 * Endpoint to update a pets health status
 */
app.put('/api/v1/pets/:name', function(req, res) {
    const name = req.params.name;
    const updatedPetData = req.body;

    // Find the pet by name (case-insensitive)
    const petIndex = petsFile.pets.findIndex(pet => pet && pet.petName && pet.petName.toLowerCase() === name.toLowerCase());

    // Check if the pet was not found
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


/**
 * Endpoint to delete a pet
 */
app.delete('/api/v1/pets/:petName/:ownerSsn', function(req, res) {
    const petName = req.params.petName;
    const ownerSsn = req.params.ownerSsn;

    // Find the pet by name and ownerSsn (case-insensitive)
    const petIndex = petsFile.pets.findIndex(pet => 
        pet && 
        pet.petName && 
        pet.ownerSsn && 
        pet.petName.toLowerCase() === petName.toLowerCase() && 
        pet.ownerSsn === ownerSsn
    );

    // Check if the pet was not found
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


