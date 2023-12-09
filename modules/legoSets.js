require('dotenv').config();
const Sequelize = require('sequelize');

// set up sequelize to point to our postgres database
let sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
});

  // Define the Theme model
const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING
  }
}, {
  timestamps: false // Disable createdAt and updatedAt fields
});

// Define the Set model
const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING
  },
  year: {
    type: Sequelize.INTEGER
  },
  num_parts: {
    type: Sequelize.INTEGER
  },
  theme_id: {
    type: Sequelize.INTEGER
  },
  img_url: {
    type: Sequelize.STRING
  }
}, {
  timestamps: false // Disable createdAt and updatedAt fields
});

// Create the association between Set and Theme
Set.belongsTo(Theme, { foreignKey: 'theme_id' });



let sets = [];

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
    .then(  () => {
      resolve();
    })
    .catch((err) => {
      reject(err);
    });
  });
}

function getAllSets() {
  return new Promise((resolve, reject) => {
    Set.findAll({ include: [Theme] })
      .then((sets) => {
        resolve(sets);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getSetByNum(setNum) {

  return new Promise((resolve, reject) => {
    Set.findOne({ where: { set_num: setNum }, include: [Theme] })
      .then((set) => {
        if (set) {
          resolve(set);
        } else {
          reject("Unable to find requested set");
        }
      })
      .catch((error) => {
        reject(error);
      });
  });

}

function getSetsByTheme(theme) {

  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [Theme],
      where: {
        '$Theme.name$': {
          [Sequelize.Op.iLike]: `%${theme}%`
        }
      }
    })
      .then((sets) => {
        if (sets.length > 0) {
          resolve(sets);
        } else {
          reject("Unable to find requested sets");
        }
      })
      .catch((error) => {
        reject(error);
      });
  });

}
function addSet(setData) {
  return new Promise((resolve, reject) => {
    Set.create(setData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

function getAllThemes() {
  return new Promise((resolve, reject) => {
    Theme.findAll()
      .then((themes) => {
        resolve(themes);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function editSet(setNum, setData) {
  return new Promise((resolve, reject) => {
    Set.update(setData, { where: { set_num: setNum } })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

function deleteSet(setNum) {
  return new Promise((resolve, reject) => {
    Set.destroy({ where: { set_num: setNum } })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet };