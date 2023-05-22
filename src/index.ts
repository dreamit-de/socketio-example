// import { Server } from 'socket.io'
import express from 'express'
import http from 'node:http'
import { Server } from 'socket.io'
import {
    GraphQLServer,
    JsonLogger
} from '@dreamit/graphql-server'
import {GraphQLExecutionResult} from '@dreamit/graphql-server-base'
import {
    userSchema,
    userSchemaResolvers
} from './ExampleSchemas'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.text({type: '*/*'}))
const server = http.createServer(app)

const graphqlServer = new GraphQLServer(
    {
        schema: userSchema,
        rootValue: userSchemaResolvers,
        logger: new JsonLogger('socketioServer', 'user-service')
    }
)

/** Use case: WebSocket */
const io = new Server(server)
io.on('connection', (socket) => {
    console.log('a user connected')
    socket.on('chat message', async(message) => {
        console.log('message: ' + message)
        // Execute GraphQL request from message
        const result = await graphqlServer.handleRequest({
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

/** Use case: webserver middleware */
app.all('/graphql', async(request, response) => {
    return await graphqlServer.handleRequest(request, response)
})

const resultsMap:Array<GraphQLExecutionResult> = []

/** Use case: webserver middleware with storing results */
app.all('/graphqlsave', async(request, response) => {
    const result = await graphqlServer.handleRequest(request)
    resultsMap.push(result)
    console.log('resultsMap has length' , resultsMap.length)
    return response.status(result.statusCode ?? 200).send(result.executionResult)
})

server.listen(3000, () => {
    console.log('listening on *:3000')
})
