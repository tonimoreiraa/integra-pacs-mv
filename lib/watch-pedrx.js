import { parseOracleRows } from "./rows-to-objects.js"

export async function watchPedRX(connection, callback)
{
    let lastId = null
    while (true) {
        const lastRow = await connection.execute('SELECT CD_PED_RX FROM ITPED_RX ORDER BY CD_PED_RX DESC FETCH FIRST 1 ROWS ONLY')
        const currentId = lastRow.rows[0][0]
        if (lastId != currentId) {
            let newRows = await connection.execute(`SELECT * FROM ITPED_RX WHERE CD_PED_RX > ${lastId} AND CD_PED_RX <= ${currentId}`)
            newRows = parseOracleRows(newRows)
            newRows.map(row => callback(row, connection))
            lastId = currentId
        }
        await new Promise(r => setTimeout(r, 500))
    }
}