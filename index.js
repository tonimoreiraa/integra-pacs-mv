import 'dotenv/config'
import { initDatabase } from "./database.js";
import { createWorklist } from "./lib/create-worklist.js";
import { watchPedRX } from "./lib/watch-pedrx.js";

async function main()
{
    const database = await initDatabase()
    watchPedRX(database, createWorklist)
}

main()