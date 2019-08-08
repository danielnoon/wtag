const fs = require('fs');

if (process.env.GOOGLE_CONFIG) {
  if (!fs.existsSync(__dirname + '/config')) {
    fs.mkdirSync(__dirname + '/config');
  }
  if (!fs.existsSync(__dirname + '/config/gcp.json')) {
    fs.writeFileSync(__dirname + '/config/gcp.json', process.env.GOOGLE_CONFIG);
  }
}
