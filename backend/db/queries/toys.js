const db = require("../connection");

// Return all toys
const getToys = async (queryParams) => {
  try {
    let query = 'SELECT t.*, i.url FROM toy t JOIN image i on t.id = i.toy_id';
    const params = [];

    // Check if ownerId is provided and add a WHERE clause to the query
    if (queryParams.queryString.ownerId) {
      query += ' WHERE user_id = $1';
      params.push(queryParams.queryString.ownerId);
    }

    const result = await db.query(query, params);
    return result.rows || null;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

const getToysByName = (name) => {
  return db
    .query('SELECT t.*, i.url FROM toy t JOIN image i ON t.id = i.toy_id WHERE title LIKE $1;', [`%${name}%`])
    .then((res) => {
      return res.rows || null;
    })
    .catch((err) => console.error(err.message));
}

const getToysById = (id) => {
  return db
    .query('SELECT * FROM toy WHERE id = $1', [id])
    .then((res) => {
      return res.rows || null;
    })
    .catch((err) => console.error(err.message));
}

const getOthersToys = (subId) => {
  return db
  .query(`SELECT t.*, i.url FROM toy t LEFT JOIN image i ON t.id = i.toy_id JOIN users u ON t.user_id = u.id WHERE u.sub_id != $1`, [subId])
  .then((res) => {
    return res.rows || null;
  })
  .catch((err) => {console.error(err.message)});
}

const getToysBySubId = (subId) => {
  return db
    .query('SELECT t.*, i.url FROM toy t JOIN image i ON t.id = i.toy_id JOIN users u ON t.user_id = u.id WHERE u.sub_id = $1', [subId])
    .then((res) => {
      return res.rows || null;
    })
    .catch((err) => console.error(err.message));
}

const insertNewToy = (data) => {
  const firstQuery = `
    INSERT INTO toy(title, description, age_group, value, address, longitude, latitude, condition, user_id, created_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
    RETURNING id;
  `;

  return db
    .query(firstQuery, [
      data.title,
      data.description,
      data.ageGroup,
      data.value,
      data.address,
      data.longitude,
      data.latitude,
      data.condition,
      data.user_id,
      new Date(),
    ])
    .then((result) => {
      const toyId = result.rows[0].id; // Retrieve the ID from the first query result
      const secondQuery = `
        INSERT INTO IMAGE(toy_id, url, Created_At)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;

      return db.query(secondQuery, [toyId, data.url, new Date()]); // Use toyId in the second query
    })
    .then((result) => {
      // The result.rows[0] will contain the inserted image record.
      return result.rows[0];
    })
    .catch((error) => {
      console.error('Error in insertNewToy:', error);
      throw error;
    });
};


const getToysByAgeGroup = (ageGroup) => {
  return db
    .query('SELECT t.*, i.url FROM toy t JOIN image i ON t.id = i.toy_id WHERE age_group=$1;', [ageGroup])
    .then((res) => {
      return res.rows || null;
    })
    .catch((err) => console.error(err.message));
}

const getToysByCondition = (condition) => {
  return db
    .query('SELECT * FROM toy WHERE condition=$1;', [condition])
    .then((res) => {
      return res.rows || null;
    })
    .catch((err) => console.error(err.message));
}

const updateToy = async (title, description, age_group, value, address, condition, url, id) => {
  // Input validation (you can customize this based on your requirements)
  if (!title || !description || !age_group || !value || !address || !condition || !url || !id) {
    throw new Error('All fields must be provided');
  }

  // First, update the toy with the new data
  const updateToyQuery = `
    UPDATE toy
    SET title = $1, description = $2, age_group = $3, value = $4, address = $5, condition = $6
    WHERE id = $7
    RETURNING *;
  `;

  const toyResult = await db.query(updateToyQuery, [title, description, age_group, value, address, condition, id]);

  // Then, update the image URL
  const updateImageQuery = `
    UPDATE image
    SET url = $1
    WHERE toy_id = $2
    RETURNING *;
  `;

  const imageResult = await db.query(updateImageQuery, [url, id]);

  return {
    toy: toyResult.rows[0] || null,
    image: imageResult.rows[0] || null,
  };
};

// Define the findToyByIdAndRemove function
const findToyByIdAndRemove = async (toyId) => {
  try {
    // Delete the toy by its ID and return the deleted toy
    const query = 'DELETE FROM toy WHERE id = $1 RETURNING *';
    const deletedToy = await db.query(query, [toyId]);

    return deletedToy;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  findToyByIdAndRemove,
  getToys,
  getToysByName,
  getToysByAgeGroup,
  getToysByCondition,
  getToysById,
  getToysBySubId,
  insertNewToy,
  updateToy,
  getOthersToys
};