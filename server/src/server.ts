import 'dotenv/config';
import { app } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.listen(PORT, () => {
  const mode = isProduction ? 'production' : 'development';
  console.log(`Netweave server running (${mode}) on http://localhost:${PORT}`);
  if (isProduction) {
    console.log('Serving client static assets from configured CLIENT_DIST_PATH');
  }
});
