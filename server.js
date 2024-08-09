import fastify from 'fastify'
import { initDatabase } from "./database.js";

const app = fastify({
    logger: true,
})

function formatDateToISO(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    return `${year}-${month}-${day} ${timePart}`;
}

app.post('/mv/import-report', async (req, res) => {
    if (req.headers.authorization != process.env.API_TOKEN) {
        return res.status(403).send('Not authorizated.')
    }

    const body = req.body
    const database = initDatabase()
    const gedDocumento = parseOracleRows(await database.execute(`INSERT INTO DBAMV.GED_DOCUMENTO (DS_DOCUMENTO, CD_DOCUMENTO, DT_CRIACAO, CD_VERSAO_ATUAL, CD_RESPONSAVEL_CRIACAO, CD_TIPO_DOCUMENTO, CD_SISTEMA) VALUES ('Teste', SEQ_GED_DOCUMENTO.NEXTVAL, SYSDATE, 1, 'TREINAMENTOMV', 2, 'PSDI') RETURNING CD_DOCUMENTO INTO :CD_DOCUMENTO`))[0].CD_DOCUMENTO
    await database.execute(`INSERT INTO GED_CONTEUDO (CD_DOCUMENTO, CD_VERSAO, BLOB_CONTEUDO) VALUES (${gedDocumento}, 1, '${body.laudo_conteudo}')`)
    
    const formato = 'RTF'
    const laudoDataHora = formatDateToISO(body.laudo_datahora)

    await database.execute(`INSERT INTO GED_VERSAO_DOCUMENTO (CD_DOCUMENTO, CD_VERSAO, DT_VERSAO, CD_SITUACAO, TP_FORMATO, SN_PUBLICADO) VALUES(${gedDocumento}, 1, SYSDATE, 1, '${formato}', 'N')`)

    await database.execute(`INSERT INTO LAUDO_RX (CD_PRESTADOR, CD_PED_RX, DT_LAUDO, SN_EMITIDO, NM_USUARIO, HR_LAUDO, CD_MULTI_EMPRESA, CD_GED_DOCUMENTO, TP_LAUDO, CD_USUARIO_ASSINADO, DH_ASSINADO, SN_ENTREGUE, SN_ASSINADO, CD_PRESTADOR_ASSINATURA, LO_ANEXO_LAUDO, TP_RESULTADO, SN_RESULTADO_PANICO) VALUES (22, ${body.accession_number}, '${laudoDataHora}', 'N', 'DBAMV', '${laudoDataHora}', 1, ${gedDocumento}, 'W', 'DBAMV', SYSDATE, 'N', 'S', 2, 'N', 'N')`)
    
    res.status(200).send('OK')
})

const start = async () => {
    try {
      await fastify.listen({ port: process.env.PORT });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };
  start();