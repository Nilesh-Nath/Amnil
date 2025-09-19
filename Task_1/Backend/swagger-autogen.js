const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Amnil Task 2.0',
    description: 'API documentation Task 2.0',
  },
  host: 'localhost:5000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
