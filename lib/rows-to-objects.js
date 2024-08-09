export function parseOracleRows(data)
{
    const head = data.metaData.map(d => d.name)
    return data.rows.map(row => Object.fromEntries(row.map((v, i) => [head[i], v])))
}