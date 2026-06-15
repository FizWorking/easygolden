import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`QBO Server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});
