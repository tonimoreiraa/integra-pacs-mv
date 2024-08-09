import oracledb from 'oracledb';

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASS,
  connectString: process.env.ORACLE_CONNECTION_STRING,
};

oracledb.initOracleClient({ libDir: process.env.ORACLE_LIB_DIR })

export async function initDatabase()
{
    const connection = await oracledb.getConnection(dbConfig)
    return connection
}