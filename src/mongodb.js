const { MongoClient } = require('mongodb');

module.exports = async () => {
  const db = await MongoClient.connect(process.env.DATABASE);
  return {
    Links: db.collection('links'),
    Users: db.collection('users'),
    Votes: db.collection('votes')
  };
};
