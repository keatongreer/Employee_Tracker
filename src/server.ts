import express from 'express';
import { connectToDb } from './connection.js';
import Cli from './cli.js';

await connectToDb();

const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const cli = new Cli();

// start the application
cli.startCli();