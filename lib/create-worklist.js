import { pacsApi } from "../api.js"
import { parseOracleRows } from "./rows-to-objects.js"

export async function createWorklist(row, connection)
{
    const exame = parseOracleRows(await connection.execute(`SELECT DS_EXA_RX, CD_MODALIDADE_EXAME FROM EXA_RX WHERE CD_EXA_RX = ${row.CD_EXA_RX}`))[0]
    const pedido = parseOracleRows(await connection.execute(`SELECT CD_ATENDIMENTO, HR_COLETA, DT_COLETA FROM PED_RX WHERE CD_PED_RX = ${row.CD_PED_RX}`))[0]
    const paciente = parseOracleRows(await connection.execute(`SELECT CD_PACIENTE, NM_PACIENTE, TP_SEXO, DT_NASCIMENTO FROM PACIENTE WHERE CD_PACIENTE = (SELECT CD_PACIENTE FROM ATENDIME WHERE CD_ATENDIMENTO = ${pedido.CD_ATENDIMENTO})`))[0]
    const exame_tipo = parseOracleRows(await connection.execute(`SELECT DS_SIGLA_MODALIDADE FROM MODALIDADE_EXAME WHERE CD_MODALIDADE_EXAME = ${exame.CD_MODALIDADE_EXAME}`))[0].DS_SIGLA_MODALIDADE

    const payload = {
        operacao: 'insert',
        exame_codigo: row.CD_EXA_RX,
        exame_descricao: exame.DS_EXA_RX,
        exame_datahora: pedido.DT_COLETA.toLocaleDateString('pt-BR') + ' ' + pedido.HR_COLETA.toLocaleTimeString('pt-BR'),
        atendimento_id: pedido.CD_ATENDIMENTO,
        paciente_id: paciente.CD_PACIENTE,
        paciente_nome: paciente.NM_PACIENTE,
        paciente_sexo: paciente.TP_SEXO,
        paciente_nascimento: paciente.DT_NASCIMENTO.toLocaleString('pt-BR').replace(',', ''),
        prazo_datahora: row.DT_ENTREGA.toLocaleString('pt-BR').replace(',', ''),
        exame_tipo,
        accession_number: row.CD_ITPED_RX,
    }
    
    try {
        const response = await pacsApi.post('/ap-ris-integration/api/worklist', payload)
        console.log(response.data)
    } catch (e) {
        console.error(e.response.status)
        console.error(e.response)
    }
}