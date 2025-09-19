const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json'); 

function swaggerDocs(app, port) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

module.exports = swaggerDocs;
