const bodyParser = require('body-parser');
const express = require('express');
const { execute, subscribe } = require('graphql');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');

const { authenticate } = require('./authentication');
const dataLoaders = require('./graphql/dataloaders');
const formatError = require('./formatError');
const mongodb = require('./mongodb');
const schema = require('./graphql/schema');

const start = async () => {
  const mongo = await mongodb();

  const app = express();

  app.get('/', (req, res) => {
    res.json({ message: 'Hello from Express' });
  });

  const options = async (req, res) => {
    const user = await authenticate(req, mongo.Users);
    return {
      context: {
        dataLoaders: dataLoaders(mongo),
        mongo,
        user
      },
      formatError,
      schema
    };
  };

  app.use('/graphql', bodyParser.json(), graphqlExpress(options));

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    passHeader: '"Authorization": "bearer token-ra"',
    subscriptionsEndpoint: `ws://localhost:${process.env.PORT}/subscriptions`
  }));

  // app.listen(process.env.PORT, () => {
  //   console.log(`Environment: ${process.env.NODE_ENV}`);
  //   console.log(`Express: ${process.env.PORT}`);
  // });

  const server = createServer(app);
  server.listen(process.env.PORT, () => {
    SubscriptionServer.create(
      { schema, execute, subscribe },
      { server, path: '/subscriptions' }
    );
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Express: ${process.env.PORT}`);
  });

  return app;
};

start();
