const de = require('dotenv');
const fs = require('fs');

de.config();

if (process.env.GOOGLE_CONFIG) {
  if (!fs.existsSync(__dirname + '/config/gcp.json')) {
    fs.writeFileSync(__dirname + '/config/gcp.json', process.env.GOOGLE_CONFIG);
  }
}
