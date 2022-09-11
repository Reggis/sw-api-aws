import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb"; 
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import {handler} from "../lib/get-collection";
import 'aws-sdk-client-mock-jest';

describe('Testing entry get', () =>{
    const OLD_ENV = process.env;
    const ddbMock = mockClient(DynamoDBDocumentClient);
    const name = "Obi Wan Kenobi";
    const episodes = ["NEWHOPE"];
    const tableName = 'Characters';
    const id = 'test-id';

    const collection = [
        [
            {
                "id": "1",
                "name": "Luke Skywalker",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            },
            {
                "id": "2",
                "name": "Darth Vader",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            },
            {
                "id": "3",
                "name": "Han Solo",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            },
            {
                "id": "4",
                "name": "Leia Organa",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"],
                "planet": "Alderaan"
            }
        ], 
        [
            {
                "id": "5",
                "name": "Wilhuff Tarkin",
                "episodes": ["NEWHOPE"]
            },
            {
                "id": "6",
                "name": "C-3PO",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            },
            {
                "id": "7",
                "name": "R2-D2",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            }
        ]
    ]

    jest.mock('@aws-sdk/lib-dynamodb', () => {
        return {
            DynamoDBDocumentClient: ddbMock
        }
    });

    beforeEach(() => {
        ddbMock.reset();
        jest.resetModules() 
        process.env = { ...OLD_ENV };
        process.env['CHARACTERS_TABLE_NAME'] = tableName
    });
    afterAll(() => {
        process.env = OLD_ENV;
      });

    test('should response with collection ', async () =>{
        ddbMock.on(QueryCommand).resolves({
            Items: collection[0],
            LastEvaluatedKey: {id: collection[0][3].id}
        });
        const result = await handler({} as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: tableName,
            Limit: 4});
        expect(JSON.parse(result.body)).toStrictEqual({"characters":collection[0], "lastEvaluatedKey": {id: collection[0][3].id}})
    });

    test('should response with next records if lastEvaluatedKey passed', async () =>{
        ddbMock.on(QueryCommand).resolves({
            Items: collection[1],
            LastEvaluatedKey: {id: collection[1][2].id}
        });
        const result = await handler({queryStringParameters: {'lastEvaluatedKey': collection[0][3].id}} as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: tableName,
            ExclusiveStartKey: {id: collection[0][3].id},
            Limit: 4});
        expect(JSON.parse(result.body)).toStrictEqual({"characters":collection[1], "lastEvaluatedKey": {id: collection[1][2].id}})
    });
})

