const fs = require('fs')
const config = {
  dns: ['1.1.1.1', '1.0.0.1'],
  noReply: 'no-reply@bluchet.fr',
  exchanges: ['mx1.bluchet.fr'],
  dkim: {
    domainName: 'bluchet.fr',
    keySelector: 'default',
    privateKey: fs.readFileSync('dkim-private.key', 'utf8')
  },
  ssl: {
    secure: false,
    key: fs.readFileSync('mx1.bluchet.fr.key', 'utf8'),
    cert: fs.readFileSync('mx1.bluchet.fr.cert', 'utf8'),
    ca: fs.readFileSync('mx1.bluchet.fr.ca', 'utf8')
  }
}

module.exports = config
