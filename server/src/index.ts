import express from 'express';
import { AppDataSource } from './data-source.ts';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.ts';
import routes from './routes/index.ts';
import dotenv from 'dotenv';
import 'reflect-metadata';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api', routes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📚 Swagger docs at http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
