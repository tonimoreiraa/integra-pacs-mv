import 'dotenv/config'
import fastify from 'fastify';
import { initDatabase } from './database.js';
import oracledb from 'oracledb'
import fs from 'fs'

const app = fastify({
    logger: true,
});

function formatDateToISO(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    return `${year}-${month}-${day} ${timePart}`;
}

app.post('/mv/import-report', async (req, res) => {
    if (req.headers.authorization !== process.env.API_TOKEN) {
        return res.status(403).send({ error: 'Not authorized.' });
    }

    const body = req.body;
    fs.writeFile('input', JSON.stringify(body))
    const database = initDatabase();
    
    try {
        const result = await database.execute(
            `INSERT INTO DBAMV.GED_DOCUMENTO 
            (DS_DOCUMENTO, CD_DOCUMENTO, DT_CRIACAO, CD_VERSAO_ATUAL, CD_RESPONSAVEL_CRIACAO, CD_TIPO_DOCUMENTO, CD_SISTEMA) 
            VALUES (:dsDocumento, SEQ_GED_DOCUMENTO.NEXTVAL, SYSDATE, :cdVersaoAtual, :cdResponsavelCriacao, :cdTipoDocumento, :cdSistema) 
            RETURNING CD_DOCUMENTO INTO :cdDocumento`,
            {
                dsDocumento: 'Teste',
                cdVersaoAtual: 1,
                cdResponsavelCriacao: 'TREINAMENTOMV',
                cdTipoDocumento: 2,
                cdSistema: 'PSDI',
                cdDocumento: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            }
        );

        const gedDocumento = result.outBinds.cdDocumento[0];

        await database.execute(
            `INSERT INTO GED_CONTEUDO (CD_DOCUMENTO, CD_VERSAO, BLOB_CONTEUDO) 
            VALUES (:cdDocumento, :cdVersao, :blobConteudo)`,
            {
                cdDocumento: gedDocumento,
                cdVersao: 1,
                blobConteudo: body.laudo_conteudo,
            }
        );

        const formato = 'RTF';
        const laudoDataHora = formatDateToISO(body.laudo_datahora);

        // Insert into GED_VERSAO_DOCUMENTO
        await database.execute(
            `INSERT INTO GED_VERSAO_DOCUMENTO 
            (CD_DOCUMENTO, CD_VERSAO, DT_VERSAO, CD_SITUACAO, TP_FORMATO, SN_PUBLICADO) 
            VALUES (:cdDocumento, :cdVersao, SYSDATE, :cdSituacao, :tpFormato, :snPublicado)`,
            {
                cdDocumento: gedDocumento,
                cdVersao: 1,
                cdSituacao: 1,
                tpFormato: formato,
                snPublicado: 'N',
            }
        );

        await database.execute(
            `INSERT INTO LAUDO_RX 
            (CD_PRESTADOR, CD_PED_RX, DT_LAUDO, SN_EMITIDO, NM_USUARIO, HR_LAUDO, CD_MULTI_EMPRESA, CD_GED_DOCUMENTO, TP_LAUDO, CD_USUARIO_ASSINADO, DH_ASSINADO, SN_ENTREGUE, SN_ASSINADO, CD_PRESTADOR_ASSINATURA, LO_ANEXO_LAUDO, TP_RESULTADO, SN_RESULTADO_PANICO) 
            VALUES (:cdPrestador, :cdPedRx, :dtLaudo, :snEmitido, :nmUsuario, :hrLaudo, :cdMultiEmpresa, :cdGedDocumento, :tpLaudo, :cdUsuarioAssinado, SYSDATE, :snEntregue, :snAssinado, :cdPrestadorAssinatura, :loAnexoLaudo, :tpResultado, :snResultadoPanico)`,
            {
                cdPrestador: 22,
                cdPedRx: body.accession_number,
                dtLaudo: laudoDataHora,
                snEmitido: 'N',
                nmUsuario: 'DBAMV',
                hrLaudo: laudoDataHora,
                cdMultiEmpresa: 1,
                cdGedDocumento: gedDocumento,
                tpLaudo: 'W',
                cdUsuarioAssinado: 'DBAMV',
                snEntregue: 'N',
                snAssinado: 'S',
                cdPrestadorAssinatura: 2,
                loAnexoLaudo: 'N',
                tpResultado: 'N',
                snResultadoPanico: 'N',
            }
        );

        res.status(200).send('OK');
    } catch (err) {
        app.log.error(err);
        res.status(500).send({ error: 'Internal Server Error' });
    } finally {
        await database.close();
    }
});

const start = async () => {
    try {
        app.listen({ port: process.env.PORT, host: process.env.HOST });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
