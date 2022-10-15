// import { Server } from 'socket.io'
import express from 'express'
import http from 'node:http'
import { Server } from 'socket.io'
import {GraphQLServer, JsonLogger} from '@dreamit/graphql-server'
import { 
    userSchema, 
    userSchemaResolvers 
} from './ExampleSchemas'

const app = express()
const server = http.createServer(app)

const graphqlServer = new GraphQLServer(
    {
        schema: userSchema,
        rootValue: userSchemaResolvers,
        logger: new JsonLogger('fastifyServer', 'user-service')
    }
)

const io = new Server(server)
io.on('connection', (socket) => {
    console.log('a user connected')
    socket.on('chat message', async (message) => {
        console.log('message: ' + message)
        // Execute GraphQL request from message

        const result = await graphqlServer.executeRequest({
            query: message
        })

        io.emit('chat message', JSON.stringify(result.executionResult))
    })
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.get('/', (_request, response) => {
    // eslint-disable-next-line unicorn/prefer-module
    response.sendFile(__dirname + '/index.html')
})

server.listen(3000, () => {
    console.log('listening on *:3000')
})