import dotenv from 'dotenv';
import logger from 'jet-logger';

import server from './server';
import EnvVars from './common/EnvVars';

// Load environment variables from .env before anything else
dotenv.config();

// **** Run **** //
const port = Number(EnvVars.Port) || 3000;
const SERVER_START_MSG = 'Express server started on port: ' + port.toString();

server.listen(port, () => logger.info(SERVER_START_MSG));
