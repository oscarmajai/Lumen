/**
 * Servidor Backend para el Proyecto Lumen
 * Conecta el frontend de React con la API de Dify
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const fastify = Fastify({ logger: true });

// 1. Configuración de CORS para permitir que React se conecte
fastify.register(cors, {
    origin: '*'
});

// 2. Configuración para recibir archivos (límite de 15MB)
fastify.register(multipart, {
    limits: { fileSize: 15 * 1024 * 1024 }
});

// Variables extraídas de tu .env
const DIFY_API_URL = process.env.DIFY_API_URL;
const DIFY_CHAT_API_KEY = process.env.DIFY_CHAT_API_KEY;
const DIFY_DATASET_API_KEY = process.env.DIFY_DATASET_API_KEY;
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;

/**
 * ENDPOINT 1: CHAT
 * Recibe el mensaje de React y lo envía a Dify
 */
fastify.post('/api/chat', async (request, reply) => {
    const { message, user_id = 'lumen-user' } = request.body;

    try {
        const response = await axios.post(`${DIFY_API_URL}/chat-messages`, {
            inputs: {},
            query: message,
            response_mode: "blocking",
            user: user_id
        }, {
            headers: {
                'Authorization': `Bearer ${DIFY_CHAT_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return reply.send({
            answer: response.data.answer,
            conversation_id: response.data.conversation_id
        });
    } catch (error) {
        fastify.log.error('Error en /api/chat:', error.response?.data || error.message);
        return reply.status(500).send({
            error: 'Error comunicándose con el Chat de Dify',
            details: error.response?.data
        });
    }
});

/**
 * ENDPOINT 2: SUBIR DOCUMENTOS
 * Recibe el archivo de React y lo inyecta en el Dataset
 */
fastify.post('/api/upload', async (request, reply) => {
    const data = await request.file();

    if (!data) {
        return reply.status(400).send({ error: 'No se subió ningún archivo' });
    }

    try {
        const formData = new FormData();
        const buffer = await data.toBuffer();
        formData.append('file', buffer, data.filename);

        const dataString = JSON.stringify({
            indexing_technique: "high_quality",
            process_rule: { mode: "automatic" }
        });
        formData.append('data', dataString);

        const response = await axios.post(
            `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_file`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${DIFY_DATASET_API_KEY}`,
                    ...formData.getHeaders()
                }
            }
        );

        return reply.send({
            document_id: response.data.document.id,
            batch: response.data.batch,
            name: data.filename
        });
    } catch (error) {
        fastify.log.error('Error en /api/upload:', error.response?.data || error.message);
        return reply.status(500).send({
            error: 'Error subiendo archivo a la Base de Conocimiento de Dify',
            details: error.response?.data
        });
    }
});

/**
 * ENDPOINT 3: ESTADO DE VECTORIZACIÓN
 * React llama a este endpoint repetidamente para ver si el PDF ya se leyó
 */
fastify.get('/api/status/:documentId', async (request, reply) => {
    const { documentId } = request.params;

    try {
        const response = await axios.get(
            `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents/${documentId}/indexing-status`,
            {
                headers: {
                    'Authorization': `Bearer ${DIFY_DATASET_API_KEY}`
                }
            }
        );

        const item = Array.isArray(response?.data?.data) ? response.data.data[0] : null;
        if (!item) {
            return reply.send({ id: documentId, name: '', technicalStatus: 'queued', percent: 0, errorMsg: '' });
        }

        const indexingStatus = (item.indexing_status || item.status || '').toString().toLowerCase();
        const completed = Number(item.completed_segments || item.completed || 0);
        const total = Number(item.total_segments || item.total || 0);

        let percent = 0;
        if (total > 0) {
            percent = Math.min(100, Math.round((completed / total) * 100));
        } else if (indexingStatus === 'completed') {
            percent = 100;
        } else if (indexingStatus === 'queued') {
            percent = 5; // tiny visual progress for queued
        }

        const payload = {
            id: item.document_id || item.id || documentId,
            name: item.document_name || item.name || '',
            technicalStatus: indexingStatus || 'queued',
            percent,
            errorMsg: item.error || item.error_msg || item.error_message || ''
        };

        return reply.send(payload);
    } catch (error) {
        fastify.log.error('Error en /api/status:', error.response?.data || error.message);
        return reply.status(500).send({ error: 'Error obteniendo estado de vectorización' });
    }
});

/**
 * ENDPOINT 4: LISTAR DOCUMENTOS
 * Devuelve el listado paginado de documentos del dataset
 */
fastify.get('/api/documents', async (request, reply) => {
    try {
        const response = await axios.get(
            `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${DIFY_DATASET_API_KEY}`
                }
            }
        );
        return reply.send(response.data);
    } catch (error) {
        fastify.log.error('Error en /api/documents:', error.response?.data || error.message);
        return reply.status(500).send({ error: 'Error obteniendo lista de documentos' });
    }
});

// Inicialización del servidor
const start = async () => {
    try {
        if (!DIFY_API_URL || !DIFY_DATASET_ID || !DIFY_CHAT_API_KEY || !DIFY_DATASET_API_KEY) {
            console.warn('⚠️ ADVERTENCIA: Faltan variables en el archivo .env. Revisa la configuración.');
        }

        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('🚀 Backend de Lumen escuchando en http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();